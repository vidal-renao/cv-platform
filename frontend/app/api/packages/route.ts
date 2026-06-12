import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getUser } from '../../../lib/auth';
import { isInternalUser } from '../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CreatePackageRequest {
  tracking_number: string;
  client_id: string;
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

// GET /api/packages — Retrieve packages (restricted to internal roles)
export async function GET(request: Request) {
  const me = getUser(request);
  if (!isInternalUser(me)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    const params = me.role === 'SUPERADMIN' ? [] : [me.id];
    const ownerFilter = me.role === 'SUPERADMIN' ? '' : 'WHERE p.user_id = $1';
    const result = await db.query(`
      SELECT p.*, c.name AS client_name
      FROM packages p
      LEFT JOIN clients c ON c.id = p.client_id
      ${ownerFilter}
      ORDER BY p.created_at DESC
    `, params);
    return NextResponse.json(result.rows);
  } catch (err: any) {
    console.error('[PACKAGES] GET error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/packages — Create a new package (restricted to internal roles)
export async function POST(request: Request) {
  const me = getUser(request);
  if (!isInternalUser(me)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: CreatePackageRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tracking_number, client_id, description, weight } = body ?? {};
  if (!tracking_number || !tracking_number.trim()) {
    return NextResponse.json({ error: 'tracking_number is required' }, { status: 400 });
  }
  if (!client_id) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
  }

  const weightNum = weight != null && weight !== '' ? parseFloat(String(weight)) : null;

  try {
    const db = getDb();
    const costPerKg = await getCostPerKg(db);
    const cost = weightNum != null ? parseFloat((weightNum * costPerKg).toFixed(2)) : null;

    // Verify the client exists
    const clientCheck = await db.query(
      me.role === 'SUPERADMIN'
        ? 'SELECT name, user_id FROM clients WHERE id = $1'
        : 'SELECT name, user_id FROM clients WHERE id = $1 AND user_id = $2',
      me.role === 'SUPERADMIN' ? [client_id] : [client_id, me.id]
    );
    if (clientCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    const clientName = clientCheck.rows[0].name;

    const result = await db.query(`
      INSERT INTO packages (user_id, client_id, tracking_number, description, weight, cost, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'ARRIVED')
      RETURNING *
    `, [
      clientCheck.rows[0].user_id,
      client_id,
      tracking_number.trim(),
      description?.trim() || null,
      weightNum,
      cost
    ]);

    return NextResponse.json({ ...result.rows[0], client_name: clientName }, { status: 201 });
  } catch (err: any) {
    if (err.message.includes('unique') || err.message.includes('duplicate')) {
      return NextResponse.json({ error: 'Tracking number already exists' }, { status: 409 });
    }
    console.error('[PACKAGES] POST error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
