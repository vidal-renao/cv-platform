import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getUser } from '../../../../lib/auth';
import { isInternalUser } from '../../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
}

export async function GET(request: Request) {
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const db = getDb();
    const params = user.role === 'SUPERADMIN' ? [] : [user.id];
    const ownerWhere = user.role === 'SUPERADMIN' ? '' : 'WHERE user_id = $1';
    const notificationWhere = user.role === 'SUPERADMIN'
      ? "WHERE LOWER(status) IN ('pending', 'queued')"
      : "WHERE user_id = $1 AND LOWER(status) IN ('pending', 'queued')";
    const [
      clientsResult,
      packagesResult,
      notificationsResult,
      statusResult,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM clients ${ownerWhere}`, params),
      db.query(`SELECT COUNT(*)::int AS count FROM packages ${ownerWhere}`, params),
      db.query(`
        SELECT COUNT(*)::int AS count
        FROM notifications
        ${notificationWhere}
      `, params),
      db.query(`
        SELECT status, COUNT(*)::int AS count
        FROM packages
        ${ownerWhere}
        GROUP BY status
      `, params),
    ]);

    const statusCounts = statusResult.rows.reduce<Record<string, number>>((acc, row) => {
      acc[String(row.status)] = toCount(row.count);
      return acc;
    }, {});

    const arrived = statusCounts.ARRIVED || 0;
    const readyForPickup = statusCounts.READY_FOR_PICKUP || 0;
    const pickedUp = statusCounts.PICKED_UP || 0;

    return NextResponse.json({
      totalClients: toCount(clientsResult.rows[0]?.count),
      totalPackages: toCount(packagesResult.rows[0]?.count),
      pendingNotifications: toCount(notificationsResult.rows[0]?.count),
      packageStatus: {
        arrived,
        ready_for_pickup: readyForPickup,
        picked_up: pickedUp,
        total_active: arrived + readyForPickup,
      },
    });
  } catch (err) {
    console.error('[API_DASHBOARD_STATS_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
