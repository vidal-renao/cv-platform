import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '../../../../lib/db';
import { getUser } from '../../../../lib/auth';
import { validate, changePasswordSchema } from '../../../../lib/validations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = validate(changePasswordSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.errors[0].message, errors: validation.errors }, { status: 400 });
  }

  const { currentPassword, newPassword } = validation.data;

  try {
    const db = getDb();
    const result = await db.query('SELECT id, password_hash FROM users WHERE id = $1', [user.id]);
    const record = result.rows[0];
    if (!record) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, record.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
    return NextResponse.json({ message: 'Password updated' });
  } catch (err) {
    console.error('[CHANGE_PASSWORD_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
