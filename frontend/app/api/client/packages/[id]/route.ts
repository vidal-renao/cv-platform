import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getUser } from '../../../../../lib/auth';
import { resolveClientRecord } from '../../_helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!user || user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = await resolveClientRecord(user);
    if (!client) {
      return NextResponse.json({ error: 'No client record linked to this account' }, { status: 404 });
    }

    const db = getDb();
    const result = await db.query(
      `SELECT id, tracking_number, status, weight, cost, description, created_at
       FROM packages
       WHERE id = $1 AND client_id = $2`,
      [id, client.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('[CLIENT_PACKAGE_GET_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
