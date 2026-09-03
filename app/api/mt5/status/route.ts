import { NextResponse } from 'next/server';
import { getMT5ConnectionStatus } from '../../../../lib/mt5/adapter';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await getMT5ConnectionStatus();
  return NextResponse.json(status, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
