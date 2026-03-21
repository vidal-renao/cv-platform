import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token y nueva contraseña son obligatorios.' },
        { status: 400 }
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = await db.query(
      `SELECT pr.user_id, pr.expires_at, pr.used_at
       FROM password_resets pr
       WHERE pr.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Enlace inválido o expirado.' },
        { status: 400 }
      );
    }

    const reset = result.rows[0];

    if (reset.used_at) {
      return NextResponse.json(
        { error: 'Este enlace ya fue utilizado.' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(reset.expires_at)) {
      return NextResponse.json(
        { error: 'El enlace ha expirado. Solicita uno nuevo.' },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, reset.user_id]);
    await db.query('UPDATE password_resets SET used_at = NOW() WHERE token = $1', [token]);

    return NextResponse.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('[ResetPassword] Error:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
