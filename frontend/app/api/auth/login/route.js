export const runtime = 'nodejs';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../../../../lib/db';

export async function POST(request) {
  console.log('[LOGIN] request received');

  // Step 1: Parse body — isolated catch so malformed JSON never goes unhandled
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    let { email, password } = body ?? {};

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    email = String(email).trim();
    password = String(password);

    // Phone number support: no @ → convert to internal email format
    if (!email.includes('@')) {
      const digits = email.replace(/\D/g, '');
      email = `tel_${digits}@cvplatform.com`;
    }

    console.log('[LOGIN] email:', email);

    // Step 2: DB query
    let result;
    try {
      const db = getDb();
      result = await db.query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
        [email]
      );
    } catch (dbErr) {
      console.error('[LOGIN] DB error:', dbErr.message);
      return Response.json({ error: 'Database error', details: dbErr.message }, { status: 500 });
    }

    console.log('[LOGIN] user found:', result.rows.length > 0);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];

    // Step 3: Verify password — support both column names
    const storedHash = user.password_hash || user.password || null;
    if (!storedHash) {
      console.error('[LOGIN] No password hash for user id:', user.id);
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, storedHash);
    } catch (bcryptErr) {
      console.error('[LOGIN] bcrypt error:', bcryptErr.message);
      return Response.json({ error: 'Authentication error' }, { status: 500 });
    }

    if (!validPassword) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Step 4: Sign JWT
    const jwtSecret = process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026';
    if (!process.env.JWT_SECRET) {
      console.warn('[LOGIN] JWT_SECRET not set — using fallback. Configure it in Vercel env vars.');
    }

    const role = user.role || 'CLIENT';
    let token;
    try {
      token = jwt.sign(
        { id: user.id, email: user.email, role },
        jwtSecret,
        { expiresIn: '1d' }
      );
    } catch (jwtErr) {
      console.error('[LOGIN] JWT sign error:', jwtErr.message);
      return Response.json({ error: 'Token generation failed' }, { status: 500 });
    }

    // Fire-and-forget last_seen update (never blocks response)
    try {
      const db = getDb();
      db.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [user.id]).catch(() => {});
    } catch { /* ignore */ }

    console.log('[LOGIN] success for user id:', user.id);

    return Response.json({
      token,
      user: { id: user.id, email: user.email, role },
    });

  } catch (err) {
    console.error('[LOGIN] Unexpected error:', err.message, err.stack);
    return Response.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
