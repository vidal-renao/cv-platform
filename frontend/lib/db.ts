import { Pool } from 'pg';

let pool: Pool | null = null;

/**
 * Returns a singleton pg Pool connected to DATABASE_URL.
 * Configured with serverless-safe defaults.
 */
export function getDb(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set. Add it to your Vercel/local environment variables.'
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

    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message);
    });
  }

  return pool;
}
