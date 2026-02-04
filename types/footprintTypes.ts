
export interface FootprintLevel {
  price: number;
  bid: number; // Aggressive sells (Left side)
  ask: number; // Aggressive buys (Right side)
  volume: number; // Total volume at this level (bid + ask)
  delta: number; // ask - bid
  imbalance: 'bid' | 'ask' | 'none'; // Highlighting imbalances
}

export interface FootprintCandle {
  time: number; // Unix timestamp in seconds (UTCTimestamp)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // Total candle volume
  levels: FootprintLevel[]; // Sorted by price ascending
  delta: number; // Total candle delta
  cumulativeDelta: number; // Session cumulative delta
}

export interface FootprintSettings {
  enabled: boolean;
  mode: 'bid_ask' | 'delta_profile' | 'volume_profile';
  showText: boolean;
  showDeltaSummary: boolean;
  imbalanceRatio: number; // Standard is 3.0 (300%)
  fontSize: number;
  rowHeight: 'auto' | number;
  colorScheme: {
    buy: string;
    sell: string;
    imbalanceBuy: string;
    imbalanceSell: string;
    text: string;
    background: string;
  };
}
