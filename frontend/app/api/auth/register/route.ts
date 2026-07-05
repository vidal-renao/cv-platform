import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '../../../../lib/db';
import { validate, registerSchema } from '../../../../lib/validations';

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

    const validation = validate(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors[0].message, errors: validation.errors }, { status: 400 });
    }

    let { email, password } = validation.data;

    email = email.trim();
    password = password.trim();

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
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    console.error('[Register] Error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
