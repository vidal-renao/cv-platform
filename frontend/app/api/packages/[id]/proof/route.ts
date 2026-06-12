import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getUser } from '../../../../../lib/auth';
import { isInternalUser } from '../../../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function canAccessPackage(packageId: string, userId: string, role: string) {
  const db = getDb();
  const result = await db.query(
    role === 'SUPERADMIN'
      ? 'SELECT id FROM packages WHERE id = $1'
      : 'SELECT id FROM packages WHERE id = $1 AND user_id = $2',
    role === 'SUPERADMIN' ? [packageId] : [packageId, userId]
  );
  return result.rows.length > 0;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    if (!(await canAccessPackage(id, user.id, user.role))) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }
    const db = getDb();
    const result = await db.query(
      `SELECT id, package_id, notes, created_at,
              signature_data IS NOT NULL AS has_signature,
              photo_data IS NOT NULL AS has_photo,
              signature_data, photo_data
       FROM delivery_proofs
       WHERE package_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No proof of delivery yet' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('[PACKAGE_PROOF_GET_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { signature_data?: string; photo_data?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.signature_data && !body.photo_data) {
    return NextResponse.json({ error: 'At least a signature or photo is required' }, { status: 400 });
  }

  try {
    if (!(await canAccessPackage(id, user.id, user.role))) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }
    const db = getDb();
    const result = await db.query(
      `INSERT INTO delivery_proofs (package_id, user_id, signature_data, photo_data, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (package_id)
       DO UPDATE SET
         signature_data = EXCLUDED.signature_data,
         photo_data = EXCLUDED.photo_data,
         notes = EXCLUDED.notes,
         user_id = EXCLUDED.user_id,
         created_at = NOW()
       RETURNING *`,
      [id, user.id, body.signature_data || null, body.photo_data || null, body.notes || null]
    );

    await db.query(
      `UPDATE packages
       SET status = 'PICKED_UP'
       WHERE id = $1
       ${user.role === 'SUPERADMIN' ? '' : 'AND user_id = $2'}`,
      user.role === 'SUPERADMIN' ? [id] : [id, user.id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('[PACKAGE_PROOF_POST_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
