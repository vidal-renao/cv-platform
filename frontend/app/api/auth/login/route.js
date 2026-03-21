import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
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

    const db = getDb();
    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      console.error('[Login] JWT_SECRET is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Fire-and-forget: update last_seen
    db.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [user.id]).catch(() => {});

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[Login] Error:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
