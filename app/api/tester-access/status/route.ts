import { NextResponse } from 'next/server';
import { jsonError } from '../../../../lib/paystack/server';
import { requireTesterAccess } from '../../../../lib/tester-access';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireTesterAccess(request);
    return NextResponse.json({ ok: true, access: 'TESTER' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return jsonError(error, 403);
  }
}
