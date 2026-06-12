import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '../../../../lib/db';
import { hashPublicToken } from '../../../../lib/tokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: { token?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const token = String(body.token || '').trim();
  const newPassword = String(body.newPassword || '');
  if (!token || !newPassword) {
    return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  try {
    const db = getDb();
    const tokenHash = hashPublicToken(token);
    const resetResult = await db.query(
      `SELECT id, user_id
       FROM password_resets
       WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    const reset = resetResult.rows[0];
    if (!reset) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, reset.user_id]);
    await db.query('UPDATE password_resets SET used_at = NOW() WHERE id = $1', [reset.id]);

    return NextResponse.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('[RESET_PASSWORD_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
