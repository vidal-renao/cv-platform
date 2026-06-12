import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    await db.query('SELECT 1');

    return NextResponse.json({
      status: 'ready',
      database: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[READY_CHECK_ERROR]:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      {
        status: 'not_ready',
        database: 'error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
