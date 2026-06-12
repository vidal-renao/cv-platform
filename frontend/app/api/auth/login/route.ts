import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '../../../../lib/db';
import { AUTH_COOKIE_NAME, generateToken, type UserPayload } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    let { email, password } = body ?? {};

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    email = String(email).trim();
    password = String(password).trim();

    // Phone number support: no @ -> convert to internal email format
    if (!email.includes('@')) {
      const digits = email.replace(/\D/g, '');
      email = `tel_${digits}@cvplatform.com`;
    }

    const db = getDb();
    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = result.rows[0];
    const storedHash = user.password_hash || user.password || null;

    if (!storedHash) {
      console.error('[LOGIN] No password hash found for user ID:', user.id);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, storedHash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const role = (user.role || 'CLIENT') as UserPayload['role'];
    const token = generateToken({ id: user.id, email: user.email, role });

    // Fire-and-forget: update last_seen + activate client on first login
    try {
      db.query('UPDATE users SET last_seen = NOW() WHERE id::text = $1::text', [user.id]).catch(() => {});
      if (role === 'CLIENT') {
        db.query(
          `UPDATE clients SET status = 'active' WHERE LOWER(email) = LOWER($1) AND status = 'pending'`,
          [user.email]
        ).catch(() => {});
      }
    } catch (dbErr) {
      console.error('[LOGIN] Failed to trigger background login tasks:', dbErr);
    }

    const response = NextResponse.json({
      token,
      user: { id: user.id, email: user.email, role },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;

  } catch (err) {
    console.error('[LOGIN] Unexpected error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
