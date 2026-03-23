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

// GET /api/dashboard/metrics
export async function GET(request) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();

    const [clientsRes, packagesRes, pendingRes] = await Promise.allSettled([
      db.query(`SELECT COUNT(*) AS count FROM clients`),
      db.query(`SELECT COUNT(*) AS count FROM packages`),
      db.query(`SELECT COUNT(*) AS count FROM packages WHERE status IN ('ARRIVED', 'READY_FOR_PICKUP')`),
    ]);

    return Response.json({
      totalClients:          clientsRes.status  === 'fulfilled' ? Number(clientsRes.value.rows[0]?.count  || 0) : 0,
      totalPackages:         packagesRes.status === 'fulfilled' ? Number(packagesRes.value.rows[0]?.count || 0) : 0,
      pendingNotifications:  pendingRes.status  === 'fulfilled' ? Number(pendingRes.value.rows[0]?.count  || 0) : 0,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
