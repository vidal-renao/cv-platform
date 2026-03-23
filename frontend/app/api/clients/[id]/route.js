export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../lib/db';

function getUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026');
  } catch {
    return null;
  }
}

// GET /api/clients/[id]
export async function GET(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      `SELECT c.*,
         EXISTS(SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(c.email) AND u.role = 'CLIENT') AS has_account
       FROM clients c WHERE c.id = $1`,
      [params.id]
    );
    if (result.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/clients/[id]
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

  const { name, phone, email, address } = body ?? {};
  if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });

  try {
    const db = getDb();
    const result = await db.query(
      `UPDATE clients SET name=$1, phone=$2, email=$3, address=$4
       WHERE id=$5 RETURNING *`,
      [name.trim(), phone?.trim() || null, email?.trim().toLowerCase() || null, address?.trim() || null, params.id]
    );
    if (result.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/clients/[id]
export async function DELETE(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    await db.query(`DELETE FROM clients WHERE id=$1`, [params.id]);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
