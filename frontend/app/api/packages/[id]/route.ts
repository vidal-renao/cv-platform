import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getUser } from '../../../../lib/auth';
import { isInternalUser } from '../../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UpdatePackageRequest {
  tracking_number?: string;
  client_id?: string;
  description?: string;
  weight?: string | number;
}

async function getCostPerKg(db: any): Promise<number> {
  try {
    const r = await db.query(`SELECT cost_per_kg FROM app_settings WHERE id = 1`);
    return parseFloat(r.rows[0]?.cost_per_kg) || 5.00;
  } catch {
    return 5.00;
  }
}

// GET /api/packages/[id] — Get details for a specific package
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = getUser(request);
  if (!isInternalUser(me)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    const queryParams = me.role === 'SUPERADMIN' ? [id] : [id, me.id];
    const result = await db.query(`
      SELECT p.*, c.name AS client_name
      FROM packages p
      LEFT JOIN clients c ON c.id = p.client_id
      WHERE p.id = $1
      ${me.role === 'SUPERADMIN' ? '' : 'AND p.user_id = $2'}
    `, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    console.error('[PACKAGES] GET details error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/packages/[id] — Update package details
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = getUser(request);
  if (!isInternalUser(me)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: UpdatePackageRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tracking_number, client_id, description, weight } = body ?? {};
  const weightNum = weight != null && weight !== '' ? parseFloat(String(weight)) : null;

  try {
    const db = getDb();
    const costPerKg = await getCostPerKg(db);
    const cost = weightNum != null ? parseFloat((weightNum * costPerKg).toFixed(2)) : null;

    // Fetch existing package to check state
    const currentPkgRes = await db.query(
      me.role === 'SUPERADMIN'
        ? 'SELECT client_id, tracking_number, user_id FROM packages WHERE id = $1'
        : 'SELECT client_id, tracking_number, user_id FROM packages WHERE id = $1 AND user_id = $2',
      me.role === 'SUPERADMIN' ? [id] : [id, me.id]
    );
    if (currentPkgRes.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const currentPkg = currentPkgRes.rows[0];

    if (client_id) {
      const clientCheck = await db.query(
        me.role === 'SUPERADMIN'
          ? 'SELECT id FROM clients WHERE id = $1'
          : 'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
        me.role === 'SUPERADMIN' ? [client_id] : [client_id, currentPkg.user_id]
      );
      if (clientCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
    }

    const result = await db.query(`
      UPDATE packages
      SET tracking_number = COALESCE($1, tracking_number),
          client_id       = COALESCE($2, client_id),
          description     = $3,
          weight          = $4,
          cost            = $5
      WHERE id = $6
      ${me.role === 'SUPERADMIN' ? '' : 'AND user_id = $7'}
      RETURNING *
    `, [
      tracking_number?.trim() || null,
      client_id || null,
      description?.trim() || null,
      weightNum,
      cost,
      id,
      ...(me.role === 'SUPERADMIN' ? [] : [me.id]),
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updatedPkg = result.rows[0];
    const clientRes = await db.query(`SELECT name FROM clients WHERE id = $1`, [updatedPkg.client_id]);

    return NextResponse.json({
      ...updatedPkg,
      client_name: clientRes.rows[0]?.name || null
    });
  } catch (err: any) {
    if (err.message.includes('unique') || err.message.includes('duplicate')) {
      return NextResponse.json({ error: 'Tracking number already exists' }, { status: 409 });
    }
    console.error('[PACKAGES] PUT details error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
