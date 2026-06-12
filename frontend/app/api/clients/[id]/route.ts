import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getUser } from '../../../../lib/auth';
import { canAccessTenantResource, isInternalUser } from '../../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ClientRequest = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
};

function nullableText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

async function findClient(db: ReturnType<typeof getDb>, id: string) {
  const result = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const db = getDb();
    const client = await findClient(db, id);
    if (!client || !canAccessTenantResource(user, client.user_id)) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (err) {
    console.error('[CLIENTS_ID_GET_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  let body: ClientRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = nullableText(body.name);
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 422 });
  }

  try {
    const db = getDb();
    const client = await findClient(db, id);
    if (!client || !canAccessTenantResource(user, client.user_id)) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const result = await db.query(
      `UPDATE clients
       SET name = $1, phone = $2, email = $3, address = $4
       WHERE id = $5
       RETURNING *`,
      [name, nullableText(body.phone), nullableText(body.email), nullableText(body.address), id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('[CLIENTS_ID_PUT_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const db = getDb();
    const client = await findClient(db, id);
    if (!client || !canAccessTenantResource(user, client.user_id)) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await db.query('DELETE FROM clients WHERE id = $1', [id]);
    return NextResponse.json({ message: 'Client deleted' });
  } catch (err) {
    console.error('[CLIENTS_ID_DELETE_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
