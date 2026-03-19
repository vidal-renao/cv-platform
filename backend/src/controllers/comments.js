const db = require('../db');

// GET /api/packages/:id/comments
// ADMIN sees all; CLIENT sees only is_internal=false (via client routes)
const getComments = async (req, res, next) => {
  try {
    const { id: packageId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    // ADMIN: verify package belongs to their account
    // CLIENT: handled separately in client routes
    if (isAdmin) {
      const pkgCheck = await db.query(
        'SELECT id FROM packages WHERE id = $1 AND user_id = $2',
        [packageId, userId]
      );
      if (pkgCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Package not found' });
      }
    }

    const result = await db.query(
      `SELECT pc.*, u.email AS author_email, u.role AS author_role
       FROM package_comments pc
       JOIN users u ON u.id = pc.user_id
       WHERE pc.package_id = $1
         AND ($2 OR pc.is_internal = FALSE)
       ORDER BY pc.created_at ASC`,
      [packageId, isAdmin]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/packages/:id/comments
const addComment = async (req, res, next) => {
  try {
    const { id: packageId } = req.params;
    const { comment, is_internal } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!comment?.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    // CLIENT cannot post internal comments
    const internal = isAdmin ? Boolean(is_internal) : false;

    const result = await db.query(
      `INSERT INTO package_comments (package_id, user_id, comment, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [packageId, userId, comment.trim(), internal]
    );

    const row = result.rows[0];
    res.status(201).json({ ...row, author_email: req.user.email, author_role: req.user.role });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/packages/:id/comments/:commentId  (ADMIN only)
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      'DELETE FROM package_comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [commentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, addComment, deleteComment };
