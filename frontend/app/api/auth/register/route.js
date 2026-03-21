export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Phone number support
    if (!email.includes('@')) {
      const digits = email.replace(/\D/g, '');
      email = `tel_${digits}@cvplatform.com`;
    }

    const db = getDb();

    // Auto-assign CLIENT role if email matches a known client
    let role = 'STAFF';
    const emailCheck = await db.query(
      'SELECT id FROM clients WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      role = 'CLIENT';
    } else {
      const phoneMatch = email.match(/^tel_(\d+)@cvplatform\.com$/);
      if (phoneMatch) {
        const phoneCheck = await db.query(
          `SELECT id FROM clients WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1 LIMIT 1`,
          [phoneMatch[1]]
        );
        if (phoneCheck.rows.length > 0) role = 'CLIENT';
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [email, hashedPassword, role]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    console.error('[Register] Error:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
