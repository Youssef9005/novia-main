export interface OHLCV {
  time: number; // Unix timestamp in seconds (or ms depending on charting lib, usually seconds for lightweight-charts)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  time: number; // Unix timestamp in ms
  price: number;
  qty: number;
  isBuyerMaker: boolean; // true = Sell (Bid), false = Buy (Ask)
}

export interface GetKlinesParams {
  symbol: string;
  interval: string; // '1m', '1h', etc.
  limit?: number;
  from?: number;
  to?: number;
}

export type UnsubscribeFn = () => void;

export interface MarketDataProvider {
  getKlines(params: GetKlinesParams): Promise<OHLCV[]>;
  subscribe(params: { symbol: string; interval: string }, onUpdate: (candle: OHLCV) => void): UnsubscribeFn;
}
