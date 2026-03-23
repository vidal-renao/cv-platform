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

// GET /api/dashboard/monthly
export async function GET(request) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    const result = await db.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        COUNT(*)::int                  AS count,
        COALESCE(SUM(cost), 0)         AS revenue
      FROM packages
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `);
    return Response.json(result.rows);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
