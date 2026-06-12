import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../../../../../lib/db';
import { getUser } from '../../../../../lib/auth';
import { canAccessTenantResource, isInternalUser } from '../../../../../lib/roles';
import { sendAccessLinkEmail, sendAccessLinkWhatsApp } from '../../../../../lib/notifications';
import { generatePublicToken, getSiteUrl, hashPublicToken } from '../../../../../lib/tokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const db = getDb();
    const clientResult = await db.query(
      'SELECT id, user_id, email, name, phone FROM clients WHERE id = $1',
      [id]
    );
    const client = clientResult.rows[0];
    if (!client || !canAccessTenantResource(user, client.user_id)) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    if (!client.email) {
      return NextResponse.json({ error: 'Este cliente no tiene email registrado.' }, { status: 400 });
    }

    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [client.email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Este cliente ya tiene una cuenta activa.' }, { status: 409 });
    }

    const unreachablePassword = crypto.randomBytes(48).toString('base64url');
    const passwordHash = await bcrypt.hash(unreachablePassword, 10);
    const createdUser = await db.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, $2, 'CLIENT', $3)
       RETURNING id`,
      [client.email, passwordHash, client.name]
    );

    const token = generatePublicToken();
    const tokenHash = hashPublicToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.query('DELETE FROM password_resets WHERE user_id = $1', [createdUser.rows[0].id]);
    await db.query(
      `INSERT INTO password_resets (user_id, token, expires_at, purpose, created_by_user_id)
       VALUES ($1, $2, $3, 'client_access', $4)`,
      [createdUser.rows[0].id, tokenHash, expiresAt, user.id]
    );
    const accessUrl = `${getSiteUrl()}/reset-password?token=${token}`;

    const [emailResult, whatsappResult] = await Promise.all([
      sendAccessLinkEmail({ to: client.email, clientName: client.name, accessUrl }),
      client.phone
        ? sendAccessLinkWhatsApp({
            phone: client.phone,
            clientName: client.name,
            email: client.email,
            accessUrl,
          })
        : Promise.resolve({ ok: false, reason: 'missing phone' }),
    ]);

    return NextResponse.json({
      message: 'Acceso generado correctamente.',
      accessUrl,
      email: client.email,
      phone: client.phone || null,
      notifications: {
        email: Boolean(emailResult.ok),
        whatsapp: Boolean(whatsappResult.ok),
      },
    });
  } catch (err) {
    console.error('[CLIENT_GENERATE_ACCESS_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
