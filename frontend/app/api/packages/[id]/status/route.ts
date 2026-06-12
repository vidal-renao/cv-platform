import { NextResponse } from 'next/server';
import type { QueryResult } from 'pg';
import { getDb } from '../../../../../lib/db';
import { getUser } from '../../../../../lib/auth';
import { isInternalUser } from '../../../../../lib/roles';
import { sendPackageStatusNotification } from '../../../../../lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['ARRIVED', 'READY_FOR_PICKUP', 'PICKED_UP'] as const;
type PackageStatus = typeof VALID_STATUSES[number];

// PATCH /api/packages/[id]/status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = getUser(request);
  if (!isInternalUser(me)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status } = body ?? {};
  if (!status || !VALID_STATUSES.includes(status as PackageStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const db = getDb();

    // Perform the status update
    const result = await db.query(
      `UPDATE packages
       SET status = $1
       WHERE id = $2
       ${me.role === 'SUPERADMIN' ? '' : 'AND user_id = $3'}
       RETURNING id, status, tracking_number, client_id`,
      me.role === 'SUPERADMIN' ? [status, id] : [status, id, me.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const updatedPkg = result.rows[0];

    // Fire status notification asynchronously so we don't block the API response
    // Fetch client details first
    db.query(
      `SELECT name, email, phone FROM clients WHERE id = $1`,
      [updatedPkg.client_id]
    )
      .then((clientRes: QueryResult<{ name: string; email: string | null; phone: string | null }>) => {
        if (clientRes.rows.length > 0) {
          const client = clientRes.rows[0];
          // Trigger email and WhatsApp notifications using parallel execution
          sendPackageStatusNotification({
            toEmail: client.email || undefined,
            toPhone: client.phone || undefined,
            clientName: client.name,
            trackingNumber: updatedPkg.tracking_number,
            status: updatedPkg.status as PackageStatus
          }).catch((err: unknown) => {
            console.error('[STATUS] Notification trigger failed:', err);
          });
        } else {
          console.warn('[STATUS] Notification skipped: Client record not found for client_id:', updatedPkg.client_id);
        }
      })
      .catch((dbErr: unknown) => {
        const message = dbErr instanceof Error ? dbErr.message : String(dbErr);
        console.error('[STATUS] Failed to fetch client details for notification:', message);
      });

    return NextResponse.json({
      id: updatedPkg.id,
      status: updatedPkg.status
    });
  } catch (err: any) {
    console.error('[STATUS] PATCH error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
