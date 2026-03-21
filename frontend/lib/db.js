import { Pool } from 'pg';

let pool;

/**
 * Returns a singleton pg Pool connected to DATABASE_URL.
 * On Vercel (Supabase Postgres) SSL is required; on local it's optional.
 */
export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }

    const isProduction =
      process.env.NODE_ENV === 'production' ||
      connectionString.includes('supabase') ||
      connectionString.includes('pooler');

    pool = new Pool({
      connectionString,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}
