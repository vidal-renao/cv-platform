import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDb } from '../../../../lib/db';
import { generatePublicToken, getSiteUrl, hashPublicToken } from '../../../../lib/tokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const db = getDb();
    const userResult = await db.query('SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    const user = userResult.rows[0];

    if (user) {
      const token = generatePublicToken();
      const tokenHash = hashPublicToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);
      await db.query(
        `INSERT INTO password_resets (user_id, token, expires_at, purpose)
         VALUES ($1, $2, $3, 'password_reset')`,
        [user.id, tokenHash, expiresAt]
      );

      const resetUrl = `${getSiteUrl()}/reset-password?token=${token}`;

      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
          to: user.email,
          subject: 'Restablecer contrasena - CV Platform',
          html: `<p>Usa este enlace para restablecer tu contrasena. Expira en 1 hora.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        });
      } else {
        console.log(`[ForgotPassword] Reset URL (no email provider): ${resetUrl}`);
      }
    }

    return NextResponse.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[FORGOT_PASSWORD_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
