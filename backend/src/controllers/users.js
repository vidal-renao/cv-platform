const db     = require('../db');
const bcrypt = require('bcrypt');

// Roles a SUPERADMIN may assign; ADMIN (legacy) may not promote to SUPERADMIN
const ALL_ROLES       = ['SUPERADMIN', 'ADMIN', 'STAFF', 'CLIENT'];
const NON_SUPER_ROLES = ['ADMIN', 'STAFF', 'CLIENT'];

// 5-minute window for "online" status
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isOnline(lastSeen) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
}

// GET /api/users — list all users with online status
const listUsers = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, email, role, created_at, last_seen FROM users ORDER BY created_at DESC`
    );
    const users = result.rows.map(u => ({
      ...u,
      is_online: isOnline(u.last_seen),
    }));
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// POST /api/users — create a new staff/admin/client user (SUPERADMIN or ADMIN)
const createUser = async (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'email, password, and role are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // ADMIN (legacy) cannot create SUPERADMIN
  const allowedRoles = req.user.role === 'SUPERADMIN' ? ALL_ROLES : NON_SUPER_ROLES;
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: `You cannot assign the role: ${role}` });
  }

  try {
    const exists = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [email, hash, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/role — change a user's role
const changeRole = async (req, res, next) => {
  const { id }   = req.params;
  const { role } = req.body;

  const allowedRoles = req.user.role === 'SUPERADMIN' ? ALL_ROLES : NON_SUPER_ROLES;
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${allowedRoles.join(', ')}` });
  }

  if (id === req.user.id) {
    return res.status(400).json({ error: 'You cannot change your own role.' });
  }

  try {
    const result = await db.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role`,
      [role, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, createUser, changeRole };
