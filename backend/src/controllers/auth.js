const crypto = require('crypto');
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// REGISTER
// Auto-assigns CLIENT role if the email/phone matches an existing client record
const register = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    // If a phone number was entered instead of an email, convert to internal email
    if (email && !email.includes('@')) {
      const digits = email.replace(/\D/g, '');
      email = `tel_${digits}@cvplatform.com`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Detect role: CLIENT if matches known client, STAFF for everyone else
    // (SUPERADMIN must be promoted manually via the Users panel)
    let role = 'STAFF';
    const emailCheck = await db.query(
      'SELECT id FROM clients WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      role = 'CLIENT';
    } else {
      // Also check by phone for internal tel_ emails
      const phoneMatch = email.match(/^tel_(\d+)@cvplatform\.com$/);
      if (phoneMatch) {
        const phoneCheck = await db.query(
          `SELECT id FROM clients WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1 LIMIT 1`,
          [phoneMatch[1]]
        );
        if (phoneCheck.rows.length > 0) role = 'CLIENT';
      }
    }

    const result = await db.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [email, hashedPassword, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// LOGIN
const login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    // If input has no @ it's a phone number — resolve to internal email
    if (email && !email.includes('@')) {
      const digits = email.replace(/\D/g, '');
      email = `tel_${digits}@cvplatform.com`;
    }

    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// CHANGE PASSWORD (requires auth token)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// FORGOT PASSWORD — generates a token and sends reset email
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const result = await db.query('SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)', [email]);

    // Always respond the same way to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'Si ese email existe, recibirás un enlace de recuperación.' });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any previous tokens for this user
    await db.query('DELETE FROM password_resets WHERE user_id = $1', [user.id]);

    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    try {
      await resend.emails.send({
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
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
            <p style="color:#cbd5e1;font-size:12px">CV Platform · Este enlace expira en 1 hora y es de un solo uso.</p>
          </div>
        `,
      });
      console.log(`[Auth] Password reset email sent → ${user.email}`);
    } catch (emailErr) {
      console.error('[Auth] Failed to send reset email:', emailErr.message);
    }

    res.json({ message: 'Si ese email existe, recibirás un enlace de recuperación.' });
  } catch (err) {
    next(err);
  }
};

// RESET PASSWORD — validates token and sets new password
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const result = await db.query(
      `SELECT pr.user_id, pr.expires_at, pr.used_at
       FROM password_resets pr
       WHERE pr.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Enlace inválido o expirado.' });
    }

    const reset = result.rows[0];

    if (reset.used_at) {
      return res.status(400).json({ error: 'Este enlace ya fue utilizado.' });
    }

    if (new Date() > new Date(reset.expires_at)) {
      return res.status(400).json({ error: 'El enlace ha expirado. Solicita uno nuevo.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, reset.user_id]);

    // Mark token as used (single-use enforcement)
    await db.query('UPDATE password_resets SET used_at = NOW() WHERE token = $1', [token]);

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, changePassword, forgotPassword, resetPassword };
