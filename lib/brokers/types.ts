export type BrokerId = 'DERIV' | 'MT5';

export type NormalizedMarket = {
  broker: BrokerId;
  symbol: string;
  displayName: string;
  assetClass?: string;
  bid?: number;
  ask?: number;
  last?: number;
  timestamp: string;
  marketStatus?: 'OPEN' | 'CLOSED' | 'UNKNOWN';
  source: 'LIVE' | 'DEMO' | 'SIMULATED';
};

export type BrokerAccountSnapshot = {
  broker: BrokerId;
  externalAccountId: string;
  currency: string;
  balance?: number;
  equity?: number;
  freeMargin?: number;
  margin?: number;
  profit?: number;
  source: 'LIVE' | 'DEMO';
  asOf: string;
};

export type BrokerPosition = {
  broker: BrokerId;
  externalPositionId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice?: number;
  currentPrice?: number;
  profit?: number;
  openedAt?: string;
};

export interface BrokerMarketAdapter {
  readonly broker: BrokerId;
  getMarkets(): Promise<NormalizedMarket[]>;
  getQuote(symbol: string): Promise<NormalizedMarket>;
}

export interface BrokerAccountAdapter {
  readonly broker: BrokerId;
  getAccountSnapshot(externalAccountId: string): Promise<BrokerAccountSnapshot>;
  getPositions(externalAccountId: string): Promise<BrokerPosition[]>;
}

export interface BrokerTradingAdapter extends BrokerAccountAdapter {
  placeOrder(...args: never[]): Promise<never>;
  closePosition(...args: never[]): Promise<never>;
}
