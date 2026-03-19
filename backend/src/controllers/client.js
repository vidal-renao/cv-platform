/**
 * Client Portal API
 * All handlers are scoped to the CLIENT role.
 * The client's packages are found by matching users.email → clients.email.
 */
const db = require('../db');

// Resolve the client record for the logged-in CLIENT user
const resolveClientRecord = async (userEmail) => {
  const result = await db.query(
    'SELECT * FROM clients WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [userEmail]
  );
  return result.rows[0] || null;
};

// GET /api/client/me
const getMe = async (req, res, next) => {
  try {
    const client = await resolveClientRecord(req.user.email);
    if (!client) {
      return res.status(404).json({ error: 'No client record linked to this account' });
    }
    res.json(client);
  } catch (err) {
    next(err);
  }
};

// GET /api/client/packages
const getMyPackages = async (req, res, next) => {
  try {
    const client = await resolveClientRecord(req.user.email);
    if (!client) {
      return res.status(404).json({ error: 'No client record linked to this account' });
    }

    const result = await db.query(
      `SELECT p.id, p.tracking_number, p.status, p.weight, p.cost,
              p.description, p.created_at
       FROM packages p
       WHERE p.client_id = $1
       ORDER BY p.created_at DESC`,
      [client.id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/client/packages/:id
const getMyPackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await resolveClientRecord(req.user.email);
    if (!client) return res.status(404).json({ error: 'No client record linked to this account' });

    const result = await db.query(
      `SELECT p.id, p.tracking_number, p.status, p.weight, p.cost,
              p.description, p.created_at
       FROM packages p
       WHERE p.id = $1 AND p.client_id = $2`,
      [id, client.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/client/packages/:id/comments  — public comments only
const getMyPackageComments = async (req, res, next) => {
  try {
    const { id: packageId } = req.params;
    const client = await resolveClientRecord(req.user.email);
    if (!client) return res.status(404).json({ error: 'No client record linked to this account' });

    // Verify ownership
    const pkgCheck = await db.query(
      'SELECT id FROM packages WHERE id = $1 AND client_id = $2',
      [packageId, client.id]
    );
    if (pkgCheck.rows.length === 0) return res.status(404).json({ error: 'Package not found' });

    const result = await db.query(
      `SELECT pc.id, pc.comment, pc.is_internal, pc.created_at,
              u.email AS author_email, u.role AS author_role
       FROM package_comments pc
       JOIN users u ON u.id = pc.user_id
       WHERE pc.package_id = $1 AND pc.is_internal = FALSE
       ORDER BY pc.created_at ASC`,
      [packageId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/client/packages/:id/comments
const addMyComment = async (req, res, next) => {
  try {
    const { id: packageId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

    const client = await resolveClientRecord(req.user.email);
    if (!client) return res.status(404).json({ error: 'No client record linked to this account' });

    const pkgCheck = await db.query(
      'SELECT id FROM packages WHERE id = $1 AND client_id = $2',
      [packageId, client.id]
    );
    if (pkgCheck.rows.length === 0) return res.status(404).json({ error: 'Package not found' });

    const result = await db.query(
      `INSERT INTO package_comments (package_id, user_id, comment, is_internal)
       VALUES ($1, $2, $3, FALSE)
       RETURNING *`,
      [packageId, userId, comment.trim()]
    );

    res.status(201).json({ ...result.rows[0], author_email: req.user.email, author_role: 'CLIENT' });
  } catch (err) {
    next(err);
  }
};

// GET /api/client/packages/:id/proof
const getMyProof = async (req, res, next) => {
  try {
    const { id: packageId } = req.params;
    const client = await resolveClientRecord(req.user.email);
    if (!client) return res.status(404).json({ error: 'No client record linked to this account' });

    const pkgCheck = await db.query(
      'SELECT id FROM packages WHERE id = $1 AND client_id = $2',
      [packageId, client.id]
    );
    if (pkgCheck.rows.length === 0) return res.status(404).json({ error: 'Package not found' });

    const result = await db.query(
      'SELECT * FROM delivery_proofs WHERE package_id = $1',
      [packageId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No proof of delivery yet' });

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, getMyPackages, getMyPackage, getMyPackageComments, addMyComment, getMyProof };
