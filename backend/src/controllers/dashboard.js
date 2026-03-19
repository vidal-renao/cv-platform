const db = require("../db");

async function getMetrics(req, res, next) {
  try {
    const userId = req.user.id;

    const clientsResult = await db.query(
      "SELECT COUNT(*) FROM clients WHERE user_id = $1",
      [userId]
    );
    const packagesResult = await db.query(
      "SELECT COUNT(*) FROM packages WHERE user_id = $1",
      [userId]
    );
    const notificationsResult = await db.query(
      "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND status = 'pending'",
      [userId]
    );

    res.json({
      totalClients: parseInt(clientsResult.rows[0].count),
      totalPackages: parseInt(packagesResult.rows[0].count),
      pendingNotifications: parseInt(notificationsResult.rows[0].count),
    });

  } catch (error) {
    next(error);
  }
}

const getMonthly = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT
         TO_CHAR(created_at, 'YYYY-MM') AS month,
         COUNT(*)::int                  AS count,
         COALESCE(SUM(cost), 0)         AS revenue
       FROM packages
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY month
       ORDER BY month ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMetrics,
  getMonthly,
};