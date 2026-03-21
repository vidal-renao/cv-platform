export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = getDb();
    const result = await db.query(
      'SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    // Always respond the same way to prevent email enumeration
    const SUCCESS_MSG = 'Si ese email existe, recibirás un enlace de recuperación.';

    if (result.rows.length === 0) {
      return NextResponse.json({ message: SUCCESS_MSG });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);
    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // Send email via Resend if configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
            to: user.email,
            subject: 'Recupera tu contraseña — CV Platform',
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto">
                <h2 style="color:#1e293b">Recuperación de contraseña</h2>
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
                <p>Haz clic en el botón de abajo. El enlace expirará en <strong>1 hora</strong>.</p>
                <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;font-weight:600">
                  Restablecer contraseña
                </a>
                <p style="color:#94a3b8;font-size:13px">Si no solicitaste este cambio, ignora este correo.</p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('[ForgotPassword] Email send failed:', emailErr.message);
      }
    } else {
      // Dev fallback: log the reset URL
      console.log(`[ForgotPassword] Reset URL (no email provider): ${resetUrl}`);
    }

    return NextResponse.json({ message: SUCCESS_MSG });
  } catch (err) {
    console.error('[ForgotPassword] Error:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
