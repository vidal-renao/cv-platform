import { Pool } from 'pg';

let pool;

/**
 * Returns a singleton pg Pool connected to DATABASE_URL.
 *
 * Serverless-safe settings:
 * - max: 1  → Vercel spins up many short-lived functions; one connection each is safer
 * - connectionTimeoutMillis: 5000 → fail fast instead of hanging (avoids "Failed to fetch")
 * - idleTimeoutMillis: 10000 → release idle connections quickly in serverless
 * - allowExitOnIdle: true → lets the Node.js process exit cleanly between invocations
 *
 * SSL is always required for Supabase / any hosted Postgres.
 * If DATABASE_URL uses a Supabase connection pooler (port 6543) that is preferred
 * for serverless over the direct connection (port 5432).
 */
export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set. Add it to your Vercel environment variables.'
      );
    }

    const needsSsl =
      process.env.NODE_ENV === 'production' ||
      connectionString.includes('supabase') ||
      connectionString.includes('pooler') ||
      connectionString.includes('amazonaws') ||
      connectionString.includes('neon.tech');

    pool = new Pool({
      connectionString,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
      max: 1,                        // 1 connection per serverless invocation
      connectionTimeoutMillis: 5000, // fail fast — avoids silent "Failed to fetch"
      idleTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });

    // Log pool errors so they appear in Vercel function logs
    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message);
    });
  }

  return pool;
}
