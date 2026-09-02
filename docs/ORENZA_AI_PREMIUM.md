# ORENZA AI PREMIUM — Trading Assistant

## Purpose

Orenza AI Premium is a market-analysis and trade-direction assistant. It is not a broker and is not an autonomous trading agent.

Market data → analysis → BUY/SELL/WAIT signal → confidence/risk → user review → optional trade ticket → explicit user confirmation → provider execution.

## Non-negotiable controls

- AI cannot silently place, modify, or close a trade.
- A signal is not a guarantee, prediction of profit, or probability of winning.
- The UI must never claim guaranteed profit, 100% win rate, or risk-free trading.
- `WAIT` is a first-class outcome.
- Any future automation must be separately enabled, explicitly opted in, bounded by risk controls, and have a kill switch.
- Sandbox balances, provider balances, and any Orenza-calculated Profit Units remain separate.

## Signal model

A signal contains provider, symbol, direction, internal confidence score, trend, momentum, volatility, risk level, entry zone when available, rationale, alternative scenario, market snapshot, model version, creation time, and expiry.

Confidence bands are internal signal-strength categories:

- 80–100: strong setup detected
- 65–79: possible setup
- 50–64: caution / weak setup
- below 50: WAIT / no clear direction

These bands are not predicted probabilities of profit.

## Market data

Deriv public market data can supply active symbols, contracts, live ticks, and historical ticks without account authentication. Authenticated Deriv connections are used only where account-scoped operations are required. The current implementation should use the normalized market-data layer rather than embedding provider-specific assumptions in the AI UI.

MT5 data enters through the MT5 provider adapter and is normalized into the same market-analysis input contract.

## User decision boundary

The AI may generate a signal and offer `VIEW ANALYSIS`, `OPEN TRADE TICKET`, or `WAIT`. The trade ticket remains a separate user-controlled action. The backend rejects attempts to convert an AI signal directly into autonomous trading.

## Performance tracking

For every signal, Orenza records the user action and, where a corresponding trade exists, the eventual result. This supports total signals, signals taken, wins, losses, win rate, realized P/L, average return, and drawdown reporting without rewriting historical signals.

## Example language

> Possible bullish setup. Momentum is positive, but volatility is increasing. Current direction: BUY with medium confidence. This is probabilistic analysis, not a guaranteed outcome. Consider your risk before placing a trade.

Or:

> Market conditions are unclear. Current direction: WAIT until stronger confirmation appears.
