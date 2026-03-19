const db = require('../db');

const VALID_ROLES = ['ADMIN', 'CLIENT'];

// GET /api/users — list all users (ADMIN only)
const listUsers = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, email, role, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/role — change a user's role (ADMIN only)
const changeRole = async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${VALID_ROLES.join(', ')}` });
  }

  // Prevent admin from demoting themselves
  if (id === req.user.id) {
    return res.status(400).json({ error: 'No puedes cambiar tu propio rol.' });
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

module.exports = { listUsers, changeRole };
