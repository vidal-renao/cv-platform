import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getUser } from '../../../../../lib/auth';
import { canAccessTenantResource, isInternalUser } from '../../../../../lib/roles';
import { sendAccessLinkEmail, sendAccessLinkWhatsApp } from '../../../../../lib/notifications';
import { getSiteUrl, hashPublicToken } from '../../../../../lib/tokens';

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

    const resolvedEmail = client.email || (client.phone ? `tel_${String(client.phone).replace(/\D/g, '')}@cvplatform.com` : null);
    if (!resolvedEmail) {
      return NextResponse.json({ error: 'Este cliente no tiene email ni telefono registrado.' }, { status: 400 });
    }

    const userResult = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [resolvedEmail]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Este cliente no tiene una cuenta activa. Usa "Generar Acceso" primero.' }, { status: 400 });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashPublicToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.query('DELETE FROM password_resets WHERE user_id = $1', [userResult.rows[0].id]);
    await db.query(
      `INSERT INTO password_resets (user_id, token, expires_at, purpose, created_by_user_id)
       VALUES ($1, $2, $3, 'client_access_resend', $4)`,
      [userResult.rows[0].id, tokenHash, expiresAt, user.id]
    );
    const accessUrl = `${getSiteUrl()}/reset-password?token=${resetToken}`;

    const [emailResult, whatsappResult] = await Promise.all([
      sendAccessLinkEmail({ to: resolvedEmail, clientName: client.name, accessUrl }),
      client.phone
        ? sendAccessLinkWhatsApp({
            phone: client.phone,
            clientName: client.name,
            email: resolvedEmail,
            accessUrl,
          })
        : Promise.resolve({ ok: false, reason: 'missing phone' }),
    ]);

    return NextResponse.json({
      message: 'Acceso reenviado correctamente.',
      email: resolvedEmail,
      accessUrl,
      phone: client.phone || null,
      notifications: {
        email: Boolean(emailResult.ok),
        whatsapp: Boolean(whatsappResult.ok),
      },
    });
  } catch (err) {
    console.error('[CLIENT_RESEND_ACCESS_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
