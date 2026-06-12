import { NextResponse } from 'next/server';
import { getUser } from '../../../../lib/auth';
import { resolveClientRecord } from '../_helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = getUser(request);
  if (!user || user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = await resolveClientRecord(user);
    if (!client) {
      return NextResponse.json({ error: 'No client record linked to this account' }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (err) {
    console.error('[CLIENT_ME_GET_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
