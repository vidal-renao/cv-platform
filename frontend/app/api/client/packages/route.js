export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../lib/db';

function getUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026');
  } catch { return null; }
}

// GET /api/client/packages
export async function GET(request) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();

    // Find client record by email
    const clientRes = await db.query(
      `SELECT id FROM clients WHERE LOWER(email) = LOWER($1)`,
      [me.email]
    );
    if (clientRes.rows.length === 0) return Response.json([]);

    const clientId = clientRes.rows[0].id;

    const result = await db.query(
      `SELECT id, tracking_number, description, weight, cost, status, created_at
       FROM packages
       WHERE client_id::text = $1::text
       ORDER BY created_at DESC`,
      [String(clientId)]
    );
    return Response.json(result.rows);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
