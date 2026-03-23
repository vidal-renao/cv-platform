export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../../lib/db';

function getUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026');
  } catch { return null; }
}

// GET /api/packages/[id]/proof
export async function GET(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const result = await db.query(
      `SELECT * FROM delivery_proofs WHERE package_id = $1`,
      [params.id]
    );
    if (result.rows.length === 0) return Response.json(null, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/packages/[id]/proof
export async function POST(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { signature_data, photo_data, notes } = body ?? {};

  try {
    const db = getDb();
    const result = await db.query(`
      INSERT INTO delivery_proofs (package_id, signature_data, photo_data, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (package_id) DO UPDATE
        SET signature_data = EXCLUDED.signature_data,
            photo_data     = EXCLUDED.photo_data,
            notes          = EXCLUDED.notes
      RETURNING *
    `, [params.id, signature_data || null, photo_data || null, notes?.trim() || null]);

    // Also mark package as PICKED_UP
    await db.query(
      `UPDATE packages SET status = 'PICKED_UP' WHERE id::text = $1`,
      [params.id]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
