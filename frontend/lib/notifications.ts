import { Resend } from 'resend';
import twilio from 'twilio';

const PORTAL_URL = process.env.FRONTEND_URL || 'https://cv-platform-theta.vercel.app';

interface AccessEmailParams {
  to: string;
  clientName?: string;
  legacyAccessCode?: string;
}

export async function sendAccessEmail({ to, clientName, legacyAccessCode }: AccessEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  if (!apiKey || !to) return { ok: false, reason: 'missing config' };

  try {
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
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">CODIGO DE ACCESO</p>
            <p style="margin:0;font-weight:700;font-size:20px;color:#2563eb;letter-spacing:2px;">${legacyAccessCode}</p>
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
  } catch (err: any) {
    console.error('[NOTIFICATIONS] Email error:', err.message);
    return { ok: false, reason: err.message };
  }
}

interface AccessWhatsAppParams {
  phone: string;
  clientName?: string;
  email: string;
  legacyAccessCode?: string;
}

export async function sendAccessWhatsApp({ phone, clientName, email, legacyAccessCode }: AccessWhatsAppParams) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!sid || !token || !phone) return { ok: false, reason: 'missing config' };

  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 7) return { ok: false, reason: 'invalid phone' };
  const to = `whatsapp:+${digits}`;

  const body =
    `Hola${clientName ? ` ${clientName}` : ''}! Tu acceso al portal de paquetes ha sido generado.\n\n` +
    `📧 Email: ${email}\n` +
    `Codigo de acceso: *${legacyAccessCode}*\n\n` +
    `Ingresa aquí: ${PORTAL_URL}/login\n\n` +
    `_Te recomendamos cambiar tu contraseña al ingresar._`;

  try {
    const client = twilio(sid, token);
    await client.messages.create({ from, to, body });
    return { ok: true };
  } catch (err: any) {
    console.error('[NOTIFICATIONS] WhatsApp error:', err.message);
    return { ok: false, reason: err.message };
  }
}

interface AccessLinkEmailParams {
  to: string;
  clientName?: string;
  accessUrl: string;
}

export async function sendAccessLinkEmail({ to, clientName, accessUrl }: AccessLinkEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  if (!apiKey || !to || !accessUrl) return { ok: false, reason: 'missing config' };

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: 'Configura tu acceso a CV Platform',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#1e293b;margin-bottom:8px;">Bienvenido${clientName ? `, ${clientName}` : ''}</h2>
          <p style="color:#475569;">Usa este enlace seguro para configurar tu contrasena del portal. El enlace expira automaticamente.</p>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">CORREO</p>
            <p style="margin:0 0 16px;font-weight:600;color:#1e293b;">${to}</p>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">ENLACE SEGURO</p>
            <p style="margin:0;color:#2563eb;word-break:break-all;">${accessUrl}</p>
          </div>
          <a href="${accessUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Configurar acceso
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
            Si no solicitaste este acceso, ignora este mensaje.
          </p>
        </div>
      `,
    });

    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err: any) {
    console.error('[NOTIFICATIONS] Access link email error:', err.message);
    return { ok: false, reason: err.message };
  }
}

interface AccessLinkWhatsAppParams {
  phone: string;
  clientName?: string;
  email: string;
  accessUrl: string;
}

export async function sendAccessLinkWhatsApp({ phone, clientName, email, accessUrl }: AccessLinkWhatsAppParams) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!sid || !token || !phone || !accessUrl) return { ok: false, reason: 'missing config' };

  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 7) return { ok: false, reason: 'invalid phone' };
  const to = `whatsapp:+${digits}`;

  const body =
    `Hola${clientName ? ` ${clientName}` : ''}! Configura tu acceso al portal de paquetes.\n\n` +
    `Email: ${email}\n` +
    `Enlace seguro: ${accessUrl}\n\n` +
    `_El enlace expira. Si no solicitaste este acceso, ignora este mensaje._`;

  try {
    const client = twilio(sid, token);
    await client.messages.create({ from, to, body });
    return { ok: true };
  } catch (err: any) {
    console.error('[NOTIFICATIONS] Access link WhatsApp error:', err.message);
    return { ok: false, reason: err.message };
  }
}

interface StatusNotificationParams {
  toEmail?: string;
  toPhone?: string;
  clientName: string;
  trackingNumber: string;
  status: 'ARRIVED' | 'READY_FOR_PICKUP' | 'PICKED_UP';
}

/**
 * Sends package status update notifications (email + WhatsApp) asynchronously in parallel.
 * Utilizes Promise.allSettled to ensure failure of one delivery method doesn't block the other.
 */
export async function sendPackageStatusNotification({
  toEmail,
  toPhone,
  clientName,
  trackingNumber,
  status
}: StatusNotificationParams): Promise<void> {
  const emailPromise = async () => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    if (!apiKey || !toEmail || !toEmail.trim()) {
      return; // Skip email if missing config or recipient
    }
    const resend = new Resend(apiKey);

    let subject = '';
    let bodyHtml = '';

    if (status === 'READY_FOR_PICKUP') {
      subject = `Tu paquete ${trackingNumber} está listo para retirar`;
      bodyHtml = `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;color:#1e293b;">
          <h2 style="margin-bottom:8px;">¡Hola, ${clientName}! 👋</h2>
          <p>Tu paquete con número de seguimiento <strong>${trackingNumber}</strong> ya está listo para ser retirado en nuestra oficina.</p>
          <a href="${PORTAL_URL}/track/${trackingNumber}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
            Ver estado del envío →
          </a>
        </div>
      `;
    } else if (status === 'ARRIVED') {
      subject = `Tu paquete ${trackingNumber} ha llegado a la oficina`;
      bodyHtml = `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;color:#1e293b;">
          <h2 style="margin-bottom:8px;">¡Hola, ${clientName}! 👋</h2>
          <p>Hemos registrado la llegada de tu paquete con número de seguimiento <strong>${trackingNumber}</strong>. Te enviaremos otra alerta en cuanto esté clasificado y listo para retiro.</p>
          <a href="${PORTAL_URL}/track/${trackingNumber}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
            Rastrear envío →
          </a>
        </div>
      `;
    } else {
      subject = `Tu paquete ${trackingNumber} ha sido entregado`;
      bodyHtml = `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;color:#1e293b;">
          <h2 style="margin-bottom:8px;">¡Hola, ${clientName}! 👋</h2>
          <p>El paquete con número de seguimiento <strong>${trackingNumber}</strong> ha sido entregado correctamente.</p>
          <p>¡Gracias por elegir nuestros servicios!</p>
        </div>
      `;
    }

    const { error } = await resend.emails.send({
      from,
      to: toEmail,
      subject,
      html: bodyHtml
    });

    if (error) {
      throw new Error(`Resend API Error: ${error.message}`);
    }
  };

  const whatsappPromise = async () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    if (!sid || !token || !toPhone || !toPhone.trim()) {
      return; // Skip WhatsApp if missing config or recipient
    }

    const digits = toPhone.replace(/\D/g, '');
    if (digits.length < 7) {
      throw new Error('Invalid phone number format');
    }
    const to = `whatsapp:+${digits}`;

    let body = '';
    if (status === 'READY_FOR_PICKUP') {
      body = `¡Hola ${clientName}! 👋 Tu paquete con tracking *${trackingNumber}* está listo para ser retirado en nuestra oficina.`;
    } else if (status === 'ARRIVED') {
      body = `¡Hola ${clientName}! 👋 Hemos recibido tu paquete con tracking *${trackingNumber}*. Te avisaremos cuando esté listo.`;
    } else {
      body = `¡Hola ${clientName}! 👋 Tu paquete con tracking *${trackingNumber}* ha sido entregado correctamente. ¡Gracias!`;
    }

    const client = twilio(sid, token);
    await client.messages.create({ from, to, body });
  };

  // Run in parallel asynchronously, catch failures individually without raising exceptions to caller
  const results = await Promise.allSettled([
    emailPromise(),
    whatsappPromise()
  ]);

  results.forEach((res, idx) => {
    if (res.status === 'rejected') {
      console.error(`[NOTIFICATIONS] Status update notification ${idx === 0 ? 'Email' : 'WhatsApp'} failed:`, res.reason);
    } else {
      console.log(`[NOTIFICATIONS] Status update notification ${idx === 0 ? 'Email' : 'WhatsApp'} succeeded`);
    }
  });
}
