import { NextResponse } from 'next/server';
import { getMt5DemoAccount, getMt5DemoPositions, verifyMt5DemoBridge } from '@/lib/brokers/mt5-demo-bridge';

export async function GET(request: Request) {
  const accountId = new URL(request.url).searchParams.get('accountId') ?? process.env.MT5_ACCOUNT_ID;
  if (!accountId) return NextResponse.json({ error: 'MT5_ACCOUNT_ID_REQUIRED' }, { status: 400 });
  try {
    const health = await verifyMt5DemoBridge();
    const account = await getMt5DemoAccount(accountId);
    const positions = await getMt5DemoPositions(accountId);
    return NextResponse.json({
      ok: health.ok,
      mode: 'DEMO',
      trading: false,
      health,
      account,
      positions,
    }, { status: health.ok ? 200 : 502 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'MT5_DEMO_VERIFY_FAILED', mode: 'DEMO' }, { status: 502 });
  }
}
