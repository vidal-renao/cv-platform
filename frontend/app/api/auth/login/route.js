import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../../../../lib/db';

export async function POST(request) {
  try {
    let { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Phone number support: no @ means it's a phone → convert to internal email
    if (!email.includes('@')) {
      const digits = email.replace(/\D/g, '');
      email = `tel_${digits}@cvplatform.com`;
    }

    console.log('[LOGIN] email:', email);

    const db = getDb();
    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    console.log('[LOGIN] user found:', result.rows.length > 0);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];

    // Support both column names for resilience
    const storedHash = user.password_hash || user.password;
    if (!storedHash) {
      console.error('[LOGIN] No password hash found for user:', user.id);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, storedHash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026';
    if (!process.env.JWT_SECRET) {
      console.warn('[LOGIN] JWT_SECRET not set — using fallback. Set it in Vercel env vars!');
    }

    const role = user.role || 'CLIENT';
    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      jwtSecret,
      { expiresIn: '1d' }
    );

    // Fire-and-forget: update last_seen (silently fails if column missing)
    db.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [user.id]).catch(() => {});

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, role },
    });
  } catch (err) {
    console.error('[LOGIN] Error:', err.message, err.stack);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
