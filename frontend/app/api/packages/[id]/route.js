export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../lib/db';

const COST_PER_KG = 5.00;

function getUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026');
  } catch { return null; }
}

// GET /api/packages/[id]
export async function GET(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    const result = await db.query(`
      SELECT p.*, c.name AS client_name
      FROM packages p
      LEFT JOIN clients c ON c.id::text = p.client_id::text
      WHERE p.id::text = $1
    `, [params.id]);
    if (result.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/packages/[id]
export async function PUT(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tracking_number, client_id, description, weight } = body ?? {};
  const weightNum = weight != null && weight !== '' ? parseFloat(weight) : null;
  const cost = weightNum != null ? parseFloat((weightNum * COST_PER_KG).toFixed(2)) : null;

  try {
    const db = getDb();
    const result = await db.query(`
      UPDATE packages
      SET tracking_number = COALESCE($1, tracking_number),
          client_id       = COALESCE($2, client_id),
          description     = $3,
          weight          = $4,
          cost            = $5
      WHERE id::text = $6
      RETURNING *
    `, [
      tracking_number?.trim() || null,
      client_id ? String(client_id) : null,
      description?.trim() || null,
      weightNum,
      cost,
      params.id,
    ]);

    if (result.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });

    const clientRes = await db.query(`SELECT name FROM clients WHERE id::text = $1`, [result.rows[0].client_id]);
    return Response.json({ ...result.rows[0], client_name: clientRes.rows[0]?.name || null });
  } catch (err) {
    if (err.message.includes('unique') || err.message.includes('duplicate')) {
      return Response.json({ error: 'Tracking number already exists' }, { status: 409 });
    }
    return Response.json({ error: err.message }, { status: 500 });
  }
}
