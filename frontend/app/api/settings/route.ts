import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { getUser } from '../../../lib/auth';
import { isInternalUser } from '../../../lib/roles';
import { validate, updateSettingsSchema } from '../../../lib/validations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  currency_code: 'USD',
  currency_symbol: '$',
  cost_per_kg: '5.00',
};

export async function GET(request: Request) {
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      'SELECT currency_code, currency_symbol, cost_per_kg FROM app_settings WHERE id = 1'
    );
    return NextResponse.json(result.rows[0] || DEFAULT_SETTINGS);
  } catch (err) {
    console.warn('[SETTINGS] Falling back to defaults:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(request: Request) {
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = validate(updateSettingsSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.errors[0].message, errors: validation.errors }, { status: 422 });
  }

  const { currency_code, currency_symbol, cost_per_kg } = validation.data;
  const currencyCode = currency_code.trim().toUpperCase();
  const currencySymbol = currency_symbol.trim();

  try {
    const db = getDb();
    const result = await db.query(
      `UPDATE app_settings
       SET currency_code = $1, currency_symbol = $2, cost_per_kg = $3
       WHERE id = 1
       RETURNING currency_code, currency_symbol, cost_per_kg`,
      [currencyCode, currencySymbol, cost_per_kg]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Settings row not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('[SETTINGS] POST error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
