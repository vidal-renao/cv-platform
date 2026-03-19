const db = require('../db');

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      SELECT n.*, c.name as client_name, p.tracking_number as package_tracking_id
      FROM notifications n
      JOIN clients c ON n.client_id = c.id
      JOIN packages p ON n.package_id = p.id
      WHERE n.user_id = $1
      ORDER BY n.sent_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = { getNotifications };
