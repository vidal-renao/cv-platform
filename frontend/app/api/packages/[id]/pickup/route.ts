import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getUser } from '../../../../../lib/auth';
import { isInternalUser } from '../../../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      `UPDATE packages
       SET status = 'PICKED_UP'
       WHERE id = $1
       ${user.role === 'SUPERADMIN' ? '' : 'AND user_id = $2'}
       RETURNING *`,
      user.role === 'SUPERADMIN' ? [id] : [id, user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('[PACKAGE_PICKUP_POST_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
