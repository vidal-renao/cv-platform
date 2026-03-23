export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../../lib/db';

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

// GET /api/clients/[id]/profile — client detail with packages
export async function GET(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();

    const clientRes = await db.query(
      `SELECT c.*,
         EXISTS(SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(c.email) AND u.role = 'CLIENT') AS has_account
       FROM clients c WHERE c.id = $1`,
      [params.id]
    );
    if (clientRes.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    const client = clientRes.rows[0];

    // Fetch packages if table exists
    let packages = [];
    try {
      const pkgRes = await db.query(
        `SELECT * FROM packages WHERE client_id = $1 ORDER BY created_at DESC`,
        [params.id]
      );
      packages = pkgRes.rows;
    } catch {
      // packages table may not exist yet
    }

    return Response.json({ ...client, packages });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
