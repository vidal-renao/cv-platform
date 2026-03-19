/**
 * requireRole(...roles) — middleware factory
 * Usage: router.get('/admin-only', authenticateToken, requireRole('ADMIN'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

module.exports = { requireRole };
