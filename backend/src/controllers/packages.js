const db = require('../db');
const { sendPackageArrival } = require('../services/notificationService');

// ── Cost calculation from pricing_config ─────────────────────────────────────
const calculateCost = async (weight) => {
  if (!weight) return null;
  const result = await db.query(
    `SELECT price FROM pricing_config
     WHERE $1 >= min_weight AND $1 < max_weight
     ORDER BY min_weight ASC LIMIT 1`,
    [weight]
  );
  return result.rows[0]?.price ?? null;
};

const getPackages = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT p.*, c.name AS client_name
       FROM packages p
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getPackagesByClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      `SELECT * FROM packages
       WHERE client_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [clientId, userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const createPackage = async (req, res, next) => {
  try {
    const { tracking_number, client_id, description, weight } = req.body;
    const userId = req.user.id;

    if (!tracking_number || !client_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cost = await calculateCost(weight);

    const result = await db.query(
      `INSERT INTO packages (user_id, client_id, tracking_number, description, status, weight, cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, client_id, tracking_number, description || null, 'ARRIVED', weight || null, cost]
    );

    const pkg = result.rows[0];

    setImmediate(() => sendPackageArrival(pkg));

    res.status(201).json(pkg);
  } catch (err) {
    next(err);
  }
};

const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, client_id, tracking_number, weight } = req.body;
    const userId = req.user.id;

    // Fetch current package to fill in unchanged fields
    const current = await db.query(
      'SELECT * FROM packages WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const pkg = current.rows[0];
    const newWeight = weight !== undefined ? weight : pkg.weight;
    const cost = await calculateCost(newWeight);

    const result = await db.query(
      `UPDATE packages
       SET tracking_number = $1,
           description = $2,
           client_id = $3,
           weight = $4,
           cost = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        tracking_number ?? pkg.tracking_number,
        description !== undefined ? description : pkg.description,
        client_id ?? pkg.client_id,
        newWeight,
        cost,
        id,
        userId,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const VALID_STATUSES = ['ARRIVED', 'READY_FOR_PICKUP', 'PICKED_UP'];

const updatePackageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const result = await db.query(
      `UPDATE packages
       SET status = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const pickupPackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      `UPDATE packages
       SET status = 'PICKED_UP'
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPackages,
  getPackagesByClient,
  createPackage,
  updatePackage,
  updatePackageStatus,
  pickupPackage
};
