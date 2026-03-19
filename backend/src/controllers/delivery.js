const db = require('../db');

// POST /api/packages/:id/proof  (ADMIN only)
const saveProof = async (req, res, next) => {
  try {
    const { id: packageId } = req.params;
    const { signature_data, photo_data, notes } = req.body;
    const userId = req.user.id;

    if (!signature_data && !photo_data) {
      return res.status(400).json({ error: 'At least a signature or photo is required' });
    }

    // Upsert — one proof per package
    const result = await db.query(
      `INSERT INTO delivery_proofs (package_id, user_id, signature_data, photo_data, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (package_id)
       DO UPDATE SET
         signature_data = EXCLUDED.signature_data,
         photo_data     = EXCLUDED.photo_data,
         notes          = EXCLUDED.notes,
         user_id        = EXCLUDED.user_id,
         created_at     = NOW()
       RETURNING *`,
      [packageId, userId, signature_data || null, photo_data || null, notes || null]
    );

    // Mark package as PICKED_UP automatically when proof is saved
    await db.query(
      `UPDATE packages SET status = 'PICKED_UP'
       WHERE id = $1 AND user_id = $2 AND status != 'PICKED_UP'`,
      [packageId, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/packages/:id/proof  (ADMIN + CLIENT)
const getProof = async (req, res, next) => {
  try {
    const { id: packageId } = req.params;

    const result = await db.query(
      'SELECT id, package_id, notes, created_at, signature_data IS NOT NULL AS has_signature, photo_data IS NOT NULL AS has_photo, signature_data, photo_data FROM delivery_proofs WHERE package_id = $1',
      [packageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No proof of delivery yet' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { saveProof, getProof };
