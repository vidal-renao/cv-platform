import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getUser } from '../../../../../lib/auth';
import { canAccessTenantResource, isInternalUser } from '../../../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const db = getDb();
    const clientResult = await db.query(
      `SELECT c.*,
              COUNT(p.id)::int AS total_packages,
              COALESCE(SUM(p.cost), 0) AS total_spent
       FROM clients c
       LEFT JOIN packages p ON p.client_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    const client = clientResult.rows[0];
    if (!client || !canAccessTenantResource(user, client.user_id)) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const packagesResult = await db.query(
      `SELECT id, tracking_number, status, weight, cost, description, created_at
       FROM packages
       WHERE client_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    return NextResponse.json({
      ...client,
      packages: packagesResult.rows,
    });
  } catch (err) {
    console.error('[CLIENT_PROFILE_GET_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
