const db = require('../db');

/**
 * PUBLIC TRACK — no auth required
 * GET /api/track/:trackingNumber
 */
const trackPackage = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;

    const result = await db.query(
      `SELECT p.tracking_number, p.status, p.description, p.weight,
              p.created_at, p.updated_at
       FROM packages p
       WHERE UPPER(p.tracking_number) = UPPER($1)`,
      [trackingNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paquete no encontrado. Verifica el número de tracking.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { trackPackage };
