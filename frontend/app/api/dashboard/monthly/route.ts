import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getUser } from '../../../../lib/auth';
import { isInternalUser } from '../../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const db = getDb();
    const params: string[] = [];
    const ownerFilter = user.role === 'SUPERADMIN' ? '' : 'WHERE user_id = $1';
    if (user.role !== 'SUPERADMIN') {
      params.push(user.id);
    }

    const result = await db.query(
      `SELECT
         TO_CHAR(created_at, 'YYYY-MM') AS month,
         COUNT(*)::int AS count,
         COALESCE(SUM(cost), 0)::numeric AS revenue
       FROM packages
       ${ownerFilter}
       ${ownerFilter ? 'AND' : 'WHERE'} created_at >= NOW() - INTERVAL '12 months'
       GROUP BY month
       ORDER BY month ASC`,
      params
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('[DASHBOARD_MONTHLY] GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
