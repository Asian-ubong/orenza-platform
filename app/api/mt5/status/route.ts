import { NextResponse } from 'next/server';
import { getMT5ConnectionStatus } from '../../../../lib/mt5/adapter';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getMT5ConnectionStatus(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
