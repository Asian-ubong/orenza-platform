import { NextResponse } from 'next/server';
import { getLiveGateStatus } from '../../../../lib/providers/live-gates';
import { getMT5ConnectionStatus } from '../../../../lib/mt5/adapter';

export const dynamic = 'force-dynamic';

export async function GET() {
  const live = getLiveGateStatus();
  const mt5 = await getMT5ConnectionStatus();

  return NextResponse.json({
    providerEnvironment: live.environment,
    liveAuthorization: live.authorized,
    marketDataEnabled: live.marketDataEnabled,
    tradingEnabled: live.tradingEnabled && mt5.tradingEnabled,
    payoutEnabled: live.payoutEnabled,
    mt5,
    deriv: {
      configured: Boolean(process.env.DERIV_CLIENT_ID && process.env.DERIV_REDIRECT_URI),
      authenticatedConnectionRequired: true,
      message: 'Deriv OAuth credentials are server-side; authenticated WebSocket synchronization requires a persistent worker.',
    },
    reason: live.reason,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
