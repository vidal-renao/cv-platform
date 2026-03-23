/**
 * Notification helpers — Resend (email) + Twilio (WhatsApp)
 * Used when generating or resending client portal access.
 */

const PORTAL_URL = process.env.FRONTEND_URL || 'https://cv-platform-theta.vercel.app';

// ─── Email via Resend ──────────────────────────────────────────────────────

export async function sendAccessEmail({ to, clientName, tempPassword }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from   = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  if (!apiKey || !to) return { ok: false, reason: 'missing config' };

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from,
      to,
      subject: 'Acceso a tu portal de paquetes',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#1e293b;margin-bottom:8px;">Bienvenido${clientName ? `, ${clientName}` : ''}</h2>
          <p style="color:#475569;">Tu acceso al portal ha sido generado. Usa las siguientes credenciales para iniciar sesión:</p>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">CORREO</p>
            <p style="margin:0 0 16px;font-weight:600;color:#1e293b;">${to}</p>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">CONTRASEÑA TEMPORAL</p>
            <p style="margin:0;font-weight:700;font-size:20px;color:#2563eb;letter-spacing:2px;">${tempPassword}</p>
          </div>
          <a href="${PORTAL_URL}/login" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Acceder al portal →
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
            Te recomendamos cambiar tu contraseña tras iniciar sesión por primera vez.
          </p>
        </div>
      `,
    });

    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err) {
    console.error('[notifications] Email error:', err.message);
    return { ok: false, reason: err.message };
  }
}

// ─── WhatsApp via Twilio ───────────────────────────────────────────────────

export async function sendAccessWhatsApp({ phone, clientName, email, tempPassword }) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!sid || !token || !phone) return { ok: false, reason: 'missing config' };

  // Normalise phone — strip non-digits then prepend whatsapp:+
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 7) return { ok: false, reason: 'invalid phone' };
  const to = `whatsapp:+${digits}`;

  const body =
    `Hola${clientName ? ` ${clientName}` : ''}! Tu acceso al portal de paquetes ha sido generado.\n\n` +
    `📧 Email: ${email}\n` +
    `🔑 Contraseña temporal: *${tempPassword}*\n\n` +
    `Ingresa aquí: ${PORTAL_URL}/login\n\n` +
    `_Te recomendamos cambiar tu contraseña al ingresar._`;

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(sid, token);
    await client.messages.create({ from, to, body });
    return { ok: true };
  } catch (err) {
    console.error('[notifications] WhatsApp error:', err.message);
    return { ok: false, reason: err.message };
  }
}
