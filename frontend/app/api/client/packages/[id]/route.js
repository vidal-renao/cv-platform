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

// GET /api/client/packages/[id]
export async function GET(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();

    // Find client record by email
    const clientRes = await db.query(
      `SELECT id FROM clients WHERE LOWER(email) = LOWER($1)`,
      [me.email]
    );
    if (clientRes.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });

    const clientId = clientRes.rows[0].id;

    const result = await db.query(
      `SELECT id, tracking_number, description, weight, cost, status, created_at
       FROM packages
       WHERE id::text = $1::text AND client_id::text = $2::text`,
      [params.id, String(clientId)]
    );
    if (result.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
