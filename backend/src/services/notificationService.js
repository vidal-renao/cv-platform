const { Resend } = require('resend');
const db = require('../db');

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── WhatsApp via Twilio (or simulation if credentials missing) ────────────────
const sendWhatsApp = async (phone, name, tracking_number) => {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886

  if (sid && token && from) {
    try {
      const twilio = require('twilio')(sid, token);
      await twilio.messages.create({
        from,
        to: `whatsapp:${phone}`,
        body: `¡Hola ${name}! Tu paquete con tracking ${tracking_number} ya está en nuestra oficina y listo para retirar.`,
      });
      console.log(`[WhatsApp] Sent → ${phone} (pkg: ${tracking_number})`);
    } catch (err) {
      console.error(`[WhatsApp] Twilio error for ${phone}:`, err.message);
    }
  } else {
    console.log(
      `[WhatsApp Simulation] To: ${phone} | ` +
      `¡Hola ${name}! Tu paquete con tracking ${tracking_number} ya está en nuestra oficina.`
    );
  }
};

// ─── Persist notification record — swallows its own errors ────────────────────
const insertNotification = async (user_id, client_id, package_id, type, status) => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, client_id, package_id, type, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [user_id, client_id, package_id, type, status]
    );
  } catch (err) {
    console.error(`[Notifications] DB insert failed (type=${type}):`, err.message);
  }
};

// ─── Main entry point — NEVER throws, NEVER rejects ──────────────────────────
/**
 * Called after a package is created. Fully isolated from the HTTP request cycle.
 * @param {object} packageData  Row returned by INSERT INTO packages RETURNING *
 */
const sendPackageArrival = async (packageData) => {
  try {
    const { id: package_id, user_id, client_id, tracking_number } = packageData;

    if (!package_id || !user_id || !client_id) {
      console.error('[Notifications] Invalid packageData — missing required fields:', packageData);
      return;
    }

    const clientResult = await db.query(
      'SELECT id, name, email, phone FROM clients WHERE id = $1',
      [client_id]
    );
    const client = clientResult.rows[0];

    if (!client) {
      console.error('[Notifications] Client not found for id:', client_id);
      return;
    }

    const { name, email, phone } = client;

    // ── Email via Resend ──────────────────────────────────────────────────────
    let emailStatus = 'failed';
    if (email) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
          to: email,
          subject: `Tu paquete ${tracking_number} ha llegado`,
          html: `
            <p>¡Hola <strong>${name}</strong>!</p>
            <p>Tu paquete con tracking <strong>${tracking_number}</strong> ya está en nuestra oficina y listo para retirar.</p>
            <p>Si tienes alguna pregunta, responde a este correo.</p>
          `,
        });
        emailStatus = 'sent';
        console.log(`[Notifications] Email sent → ${email} (pkg: ${tracking_number})`);
      } catch (err) {
        console.error(`[Notifications] Email failed for ${email}:`, err.message);
      }
    } else {
      console.warn(`[Notifications] No email for client "${name}" — skipping email`);
    }

    await insertNotification(user_id, client_id, package_id, 'email', emailStatus);

    // ── WhatsApp via Twilio ───────────────────────────────────────────────────
    if (phone) {
      await sendWhatsApp(phone, name, tracking_number);
      await insertNotification(user_id, client_id, package_id, 'whatsapp', 'sent');
    }
  } catch (err) {
    console.error('[Notifications] Unexpected error in sendPackageArrival:', err.message);
  }
};

module.exports = { sendPackageArrival };
