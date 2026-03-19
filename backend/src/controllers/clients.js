const crypto = require('crypto');
const db = require('../db');
const bcrypt = require('bcrypt');
const { Resend } = require('resend');
const twilio = require('twilio');

const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * GET ALL CLIENTS
 */
const getClients = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT c.*,
              CASE WHEN u.id IS NOT NULL THEN true ELSE false END AS has_account
       FROM clients c
       LEFT JOIN users u ON LOWER(u.email) = LOWER(c.email)
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

/**
 * GET CLIENT BY ID
 */
const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * CREATE CLIENT
 */
const createClient = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    let { email } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Auto-generate internal email from phone when no email is provided
    if (!email && phone) {
      const digits = phone.replace(/\D/g, '');
      email = `tel_${digits}@cvplatform.com`;
    }

    const result = await db.query(
      `INSERT INTO clients (name, phone, email, address, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, phone, email, address, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE CLIENT
 */
const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;
    const userId = req.user.id;

    const result = await db.query(
      `UPDATE clients
       SET name = $1, phone = $2, email = $3, address = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, phone, email, address, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE CLIENT
 */
const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET CLIENT PROFILE — stats + package history
 */
const getClientProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const clientResult = await db.query(
      `SELECT c.*,
              COUNT(p.id)                          AS total_packages,
              COALESCE(SUM(p.cost), 0)             AS total_spent
       FROM clients c
       LEFT JOIN packages p ON p.client_id = c.id AND p.user_id = c.user_id
       WHERE c.id = $1 AND c.user_id = $2
       GROUP BY c.id`,
      [id, userId]
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const packagesResult = await db.query(
      `SELECT id, tracking_number, status, weight, cost, description, created_at
       FROM packages
       WHERE client_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [id, userId]
    );

    res.json({
      ...clientResult.rows[0],
      packages: packagesResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GENERATE ACCESS — creates a CLIENT user account and sends welcome notifications
 */
const TEMP_PASSWORD = process.env.DEFAULT_TEMP_PASSWORD || 'Temporal123!';

const generateAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Fetch the client (must belong to this admin)
    const clientResult = await db.query(
      'SELECT id, email, name, phone FROM clients WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = clientResult.rows[0];
    if (!client.email) {
      return res.status(400).json({ error: 'Este cliente no tiene email registrado.' });
    }

    // Check if a user with that email already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [client.email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Este cliente ya tiene una cuenta activa.' });
    }

    const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);
    await db.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'CLIENT')`,
      [client.email, passwordHash]
    );

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    const notifications = { whatsapp: false, email: false };

    // ── WhatsApp via Twilio ──────────────────────────────────────────────
    if (client.phone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      // Normalize phone: strip spaces/dashes, ensure it starts with +
      const rawPhone = client.phone.replace(/[\s\-().]/g, '');
      const toPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
      try {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
          to: `whatsapp:${toPhone}`,
          body:
            `¡Hola ${client.name}! 👋\n\n` +
            `Tu acceso a *CV Platform* ha sido creado.\n\n` +
            `📧 *Usuario:* ${client.email}\n` +
            `🔑 *Contraseña temporal:* ${TEMP_PASSWORD}\n\n` +
            `👉 Ingresa aquí: ${loginUrl}\n\n` +
            `Te recomendamos cambiar tu contraseña después del primer inicio de sesión.`,
        });
        notifications.whatsapp = true;
        console.log(`[Access] WhatsApp sent → ${toPhone}`);
      } catch (err) {
        console.error('[Access] WhatsApp failed:', err.message);
      }
    }

    // ── Welcome email via Resend ─────────────────────────────────────────
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
          to: client.email,
          subject: `¡Bienvenido a CV Platform, ${client.name}!`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
              <div style="background:#1e40af;padding:32px 40px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:24px">CV Platform</h1>
              </div>
              <div style="background:#ffffff;padding:32px 40px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
                <h2 style="margin:0 0 8px">¡Hola, ${client.name}!</h2>
                <p style="color:#475569;margin:0 0 24px">Tu cuenta de cliente ha sido creada. Aquí están tus credenciales de acceso:</p>

                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px">
                  <p style="margin:0 0 8px;font-size:14px;color:#64748b">Usuario (email)</p>
                  <p style="margin:0 0 16px;font-size:18px;font-weight:700">${client.email}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#64748b">Contraseña temporal</p>
                  <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:1px">${TEMP_PASSWORD}</p>
                </div>

                <a href="${loginUrl}"
                   style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px">
                  Iniciar sesión →
                </a>

                <p style="color:#94a3b8;font-size:13px;margin:24px 0 0">
                  Por seguridad, te recomendamos cambiar tu contraseña tras el primer acceso.
                </p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
                <p style="color:#cbd5e1;font-size:12px;margin:0">CV Platform · Este correo fue generado automáticamente.</p>
              </div>
            </div>
          `,
        });
        notifications.email = true;
        console.log(`[Access] Welcome email sent → ${client.email}`);
      } catch (err) {
        console.error('[Access] Email failed:', err.message);
      }
    }

    res.json({
      message: 'Acceso generado correctamente.',
      tempPassword: TEMP_PASSWORD,
      email: client.email,
      phone: client.phone || null,
      notifications,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * RESEND ACCESS — generates a password-reset link and re-sends notifications
 */
const resendAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Fetch the client
    const clientResult = await db.query(
      'SELECT id, email, name, phone FROM clients WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    const client = clientResult.rows[0];

    // Resolve email (could be auto-generated tel_ address)
    const resolvedEmail = client.email ||
      (client.phone ? `tel_${client.phone.replace(/\D/g, '')}@cvplatform.com` : null);

    if (!resolvedEmail) {
      return res.status(400).json({ error: 'Este cliente no tiene email ni teléfono registrado.' });
    }

    // Find the associated user account
    const userResult = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [resolvedEmail]
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Este cliente no tiene una cuenta activa. Usa "Generar Acceso" primero.' });
    }
    const user = userResult.rows[0];

    // Generate a fresh password-reset token (1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);
    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const notifications = { whatsapp: false, email: false };

    // ── WhatsApp via Twilio ──────────────────────────────────────────────
    if (client.phone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const rawPhone = client.phone.replace(/[\s\-().]/g, '');
      const toPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
      try {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
          to: `whatsapp:${toPhone}`,
          body:
            `¡Hola ${client.name}! 👋\n\n` +
            `Te enviamos tu acceso a *CV Platform*.\n\n` +
            `📧 *Usuario:* ${resolvedEmail}\n` +
            `🔗 *Restablecer contraseña:* ${resetUrl}\n\n` +
            `El enlace expira en 1 hora. Úsalo para establecer tu contraseña y entrar.`,
        });
        notifications.whatsapp = true;
        console.log(`[Resend] WhatsApp sent → ${toPhone}`);
      } catch (err) {
        console.error('[Resend] WhatsApp failed:', err.message);
      }
    }

    // ── Email via Resend ─────────────────────────────────────────────────
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
          to: resolvedEmail,
          subject: `Tu acceso a CV Platform, ${client.name}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
              <div style="background:#1e40af;padding:32px 40px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:24px">CV Platform</h1>
              </div>
              <div style="background:#ffffff;padding:32px 40px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
                <h2 style="margin:0 0 8px">¡Hola, ${client.name}!</h2>
                <p style="color:#475569;margin:0 0 24px">Aquí tienes tu enlace para acceder a tu cuenta. Expira en <strong>1 hora</strong>.</p>

                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px">
                  <p style="margin:0 0 8px;font-size:14px;color:#64748b">Usuario (email)</p>
                  <p style="margin:0;font-size:18px;font-weight:700">${resolvedEmail}</p>
                </div>

                <a href="${resetUrl}"
                   style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px">
                  Establecer contraseña →
                </a>

                <p style="color:#94a3b8;font-size:13px;margin:24px 0 0">
                  Si no solicitaste este acceso, ignora este correo.
                </p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
                <p style="color:#cbd5e1;font-size:12px;margin:0">CV Platform · Este correo fue generado automáticamente.</p>
              </div>
            </div>
          `,
        });
        notifications.email = true;
        console.log(`[Resend] Access email sent → ${resolvedEmail}`);
      } catch (err) {
        console.error('[Resend] Email failed:', err.message);
      }
    }

    res.json({
      message: 'Acceso reenviado correctamente.',
      email: resolvedEmail,
      phone: client.phone || null,
      notifications,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getClients,
  getClientById,
  getClientProfile,
  createClient,
  updateClient,
  deleteClient,
  generateAccess,
  resendAccess,
};