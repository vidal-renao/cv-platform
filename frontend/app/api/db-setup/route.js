/**
 * POST /api/db-setup
 *
 * Applies all missing schema migrations safely (idempotent).
 * Call this ONCE after deploying to Vercel to ensure the DB is up to date.
 *
 * Requires header: x-setup-key = same value as SETUP_KEY env var (or JWT_SECRET as fallback).
 * This prevents unauthorized schema changes.
 */
import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

const MIGRATIONS = [
  // 1. Enable pgcrypto for UUID generation
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

  // 2. Users table (canonical)
  `CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  DEFAULT NOW()
  )`,

  // 3. Add missing columns to users
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS role      VARCHAR(50)  DEFAULT 'CLIENT'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS name      VARCHAR(255)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ`,

  // 4. Clients table
  `CREATE TABLE IF NOT EXISTS clients (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    phone      VARCHAR(50),
    email      VARCHAR(255),
    address    TEXT,
    status     VARCHAR(50)  DEFAULT 'active',
    created_at TIMESTAMPTZ  DEFAULT NOW()
  )`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`,
  `CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id)`,

  // 5. Packages table
  `CREATE TABLE IF NOT EXISTS packages (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id       UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    tracking_number VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    status          VARCHAR(50)  DEFAULT 'ARRIVED',
    created_at      TIMESTAMPTZ  DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_packages_user_id   ON packages(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_packages_client_id ON packages(client_id)`,

  // 6. Password resets table
  `CREATE TABLE IF NOT EXISTS password_resets (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT        UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_password_resets_token   ON password_resets(token)`,
  `CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id)`,

  // 7. Chat messages table
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content      TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
    is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_chat_msg_sender    ON chat_messages(sender_id)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_msg_recipient ON chat_messages(recipient_id)`,
];

export async function POST(request) {
  // Simple auth guard
  const setupKey = process.env.SETUP_KEY || process.env.JWT_SECRET;
  const provided = request.headers.get('x-setup-key');
  if (!setupKey || provided !== setupKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const results = [];

  for (const sql of MIGRATIONS) {
    try {
      await db.query(sql);
      const label = sql.trim().slice(0, 80).replace(/\s+/g, ' ');
      results.push({ ok: true, sql: label });
    } catch (err) {
      const label = sql.trim().slice(0, 80).replace(/\s+/g, ' ');
      results.push({ ok: false, sql: label, error: err.message });
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log('[DB-SETUP] Results:', results);

  return NextResponse.json(
    {
      message: failed.length === 0 ? 'All migrations applied successfully' : 'Some migrations failed',
      applied: results.filter((r) => r.ok).length,
      failed: failed.length,
      details: results,
    },
    { status: failed.length === 0 ? 200 : 207 }
  );
}

// GET: health check — verifies DB connection and returns table/column info
export async function GET() {
  try {
    const db = getDb();
    const cols = await db.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'clients', 'packages', 'password_resets', 'chat_messages')
      ORDER BY table_name, ordinal_position
    `);

    const tables = {};
    for (const row of cols.rows) {
      if (!tables[row.table_name]) tables[row.table_name] = [];
      tables[row.table_name].push(`${row.column_name} (${row.data_type})`);
    }

    return NextResponse.json({ connected: true, tables });
  } catch (err) {
    return NextResponse.json({ connected: false, error: err.message }, { status: 500 });
  }
}
