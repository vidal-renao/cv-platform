const jwt = require('jsonwebtoken');
const db  = require('../db');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id:    decoded.id,
      email: decoded.email,
      role:  decoded.role || 'ADMIN',
    };

    // Fire-and-forget: update last_seen without blocking the request
    db.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [decoded.id]).catch(() => {});

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };
