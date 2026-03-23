export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../lib/db';

function getUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026');
  } catch { return null; }
}

async function ensureSettings(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id              INT           PRIMARY KEY DEFAULT 1,
      currency_symbol VARCHAR(10)   NOT NULL DEFAULT '$',
      currency_code   VARCHAR(10)   NOT NULL DEFAULT 'USD',
      cost_per_kg     NUMERIC(10,2) NOT NULL DEFAULT 5.00,
      updated_at      TIMESTAMPTZ   DEFAULT NOW()
    )
  `);
  await db.query(`INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
}

// GET /api/settings — public, no auth required
export async function GET() {
  try {
    const db = getDb();
    await ensureSettings(db);
    const result = await db.query(`SELECT currency_symbol, currency_code, cost_per_kg FROM app_settings WHERE id = 1`);
    return Response.json(result.rows[0] ?? { currency_symbol: '$', currency_code: 'USD', cost_per_kg: 5.00 });
  } catch {
    return Response.json({ currency_symbol: '$', currency_code: 'USD', cost_per_kg: 5.00 });
  }
}

// PUT /api/settings — ADMIN / SUPERADMIN only
export async function PUT(request) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { currency_symbol, currency_code, cost_per_kg } = body ?? {};

  try {
    const db = getDb();
    await ensureSettings(db);
    await db.query(`
      UPDATE app_settings
      SET currency_symbol = COALESCE($1, currency_symbol),
          currency_code   = COALESCE($2, currency_code),
          cost_per_kg     = COALESCE($3, cost_per_kg),
          updated_at      = NOW()
      WHERE id = 1
    `, [
      currency_symbol?.trim() || null,
      currency_code?.trim()   || null,
      cost_per_kg != null ? parseFloat(cost_per_kg) : null,
    ]);
    const result = await db.query(`SELECT currency_symbol, currency_code, cost_per_kg FROM app_settings WHERE id = 1`);
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
