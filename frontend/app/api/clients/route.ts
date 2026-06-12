import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getUser } from '../../../lib/auth';
import { isInternalUser } from '../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CreateClientRequest = {
  name?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  address?: string;
};

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(request: Request) {
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const db = getDb();
    const params = user.role === 'SUPERADMIN' ? [] : [user.id];
    const ownerFilter = user.role === 'SUPERADMIN' ? '' : 'WHERE c.user_id = $1';
    const result = await db.query(`
      SELECT
        c.id,
        c.user_id,
        c.name,
        c.phone,
        c.email,
        c.address,
        c.status,
        c.created_at,
        EXISTS (
          SELECT 1
          FROM users u
          WHERE LOWER(u.email) = LOWER(c.email)
        ) AS has_account
      FROM clients c
      ${ownerFilter}
      ORDER BY c.created_at DESC
    `, params);

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('[API_CLIENTS_GET_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  let body: CreateClientRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = normalizeText(body.name) || normalizeText(body.full_name);
  const email = normalizeText(body.email);
  const phone = normalizeText(body.phone);
  const address = normalizeText(body.address);

  if (!name) {
    return NextResponse.json({ error: 'Missing required field: name' }, { status: 422 });
  }

  try {
    const db = getDb();
    const result = await db.query(`
      INSERT INTO clients (user_id, name, phone, email, address, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id, name, phone, email, address, status, created_at
    `, [user.id, name, phone, email, address]);

    return NextResponse.json({ ...result.rows[0], has_account: false }, { status: 201 });
  } catch (err) {
    console.error('[API_CLIENTS_POST_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
