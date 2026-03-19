const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/contact  — public, no auth
 */
const sendContact = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Nombre, email y mensaje son obligatorios.' });
    }

    // Where to deliver the contact request
    const toEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;
    if (!toEmail) {
      return res.status(500).json({ error: 'Configuración de email no disponible.' });
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to: toEmail,
      reply_to: email,
      subject: `📬 Nuevo contacto desde la web — ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
          <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:white;margin:0;font-size:20px">CV Platform — Formulario de Contacto</h1>
          </div>
          <div style="background:#fff;padding:28px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr>
                <td style="padding:8px 0;color:#64748b;width:100px;vertical-align:top">Nombre</td>
                <td style="padding:8px 0;font-weight:600">${name}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;vertical-align:top">Email</td>
                <td style="padding:8px 0"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;vertical-align:top">Mensaje</td>
                <td style="padding:8px 0;white-space:pre-wrap">${message}</td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
            <p style="color:#94a3b8;font-size:12px;margin:0">
              Responde directamente a este correo para contactar con ${name}.
            </p>
          </div>
        </div>
      `,
    });

    res.json({ message: 'Mensaje enviado correctamente. Te responderemos pronto.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendContact };
