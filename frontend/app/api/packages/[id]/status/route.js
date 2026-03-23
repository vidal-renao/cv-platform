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

const VALID = ['ARRIVED', 'READY_FOR_PICKUP', 'PICKED_UP'];

// PATCH /api/packages/[id]/status
export async function PATCH(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status } = body ?? {};
  if (!VALID.includes(status)) {
    return Response.json({ error: `Invalid status. Must be one of: ${VALID.join(', ')}` }, { status: 400 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      `UPDATE packages SET status = $1 WHERE id::text = $2 RETURNING id, status`,
      [status, params.id]
    );
    if (result.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
