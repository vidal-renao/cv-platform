const db = require('../db');

const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.trim().length < 1) {
      return res.json([]);
    }

    const result = await db.query(
      `SELECT
         c.id,
         c.name,
         c.email,
         c.phone,
         COUNT(p.id) FILTER (WHERE p.status != 'PICKED_UP') AS active_packages
       FROM clients c
       LEFT JOIN packages p ON p.client_id = c.id AND p.user_id = c.user_id
       WHERE c.user_id = $1
         AND (
           c.name  ILIKE $2 OR
           c.email ILIKE $2 OR
           c.phone ILIKE $2
         )
       GROUP BY c.id
       ORDER BY c.name ASC
       LIMIT 8`,
      [userId, `%${q.trim()}%`]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { search };
