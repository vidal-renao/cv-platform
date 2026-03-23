export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../../../lib/db';

function getUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026');
  } catch { return null; }
}

// GET /api/client/packages/[id]/proof
export async function GET(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const result = await db.query(
      `SELECT id, signature_data, photo_data, notes, created_at
       FROM delivery_proofs WHERE package_id = $1`,
      [params.id]
    );
    if (result.rows.length === 0) return Response.json(null, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err) {
    if (err.message.includes('does not exist')) return Response.json(null, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
