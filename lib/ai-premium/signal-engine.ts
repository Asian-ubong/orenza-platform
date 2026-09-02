export type SignalDirection = 'BUY' | 'SELL' | 'WAIT';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MarketSnapshot {
  symbol: string;
  provider: 'DERIV' | 'MT5';
  price: number;
  previousPrice?: number;
  trend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  momentum?: 'STRONG' | 'MODERATE' | 'WEAK' | 'NEUTRAL';
  volatility?: 'LOW' | 'MEDIUM' | 'HIGH';
  support?: number;
  resistance?: number;
}

export interface AiSignal {
  direction: SignalDirection;
  confidence: number;
  risk: RiskLevel;
  rationale: string;
  alternative: string;
}

/**
 * Deterministic safety/normalization boundary for model-generated signals.
 * This module never places, modifies, or closes a trade.
 */
export function normalizeSignal(input: AiSignal): AiSignal {
  const confidence = Math.max(0, Math.min(100, Math.round(input.confidence)));
  const direction: SignalDirection = input.direction;

  // Below 50 is explicitly treated as no clear setup.
  const safeDirection: SignalDirection = confidence < 50 ? 'WAIT' : direction;

  // Confidence is an internal signal-strength score, not a probability of profit.
  return {
    ...input,
    direction: safeDirection,
    confidence,
    rationale: input.rationale.trim(),
    alternative: input.alternative.trim(),
  };
}

export function confidenceBand(confidence: number): 'STRONG_SETUP' | 'POSSIBLE_SETUP' | 'CAUTION' | 'WAIT' {
  if (confidence >= 80) return 'STRONG_SETUP';
  if (confidence >= 65) return 'POSSIBLE_SETUP';
  if (confidence >= 50) return 'CAUTION';
  return 'WAIT';
}

export function assertManualConfirmation(action: 'OPEN_TICKET' | 'TRADE' | 'WAIT' | 'DISMISSED') {
  if (action === 'TRADE') {
    throw new Error('AI_MANUAL_CONFIRMATION_REQUIRED');
  }
}
