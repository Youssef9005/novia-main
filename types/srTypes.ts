
export interface SRSettings {
  enabled: boolean;
  pivotWindow: number; // 3-5
  toleranceType: 'atr' | 'percent';
  toleranceValue: number; // 0.2 for ATR, 0.15 for percent
  maxZones: number;
  minStrength: number; // 0-100
  showLabels: boolean;
  fadeByRecency: boolean;
  mergeZones: boolean;
}

export interface SRZone {
  id: string;
  minPrice: number;
  maxPrice: number;
  type: 'support' | 'resistance';
  strength: number;
  touchCount: number;
  rejectionScore: number;
  volumeScore: number;
  lastTouchTime: number; // timestamp
}

export interface TradeSetup {
  id: string;
  type: 'Range Bounce' | 'Breakout Retest' | 'Trend Pullback';
  confidenceScore: number; // 0-100
  reasons: string[];
  entryZone: { min: number; max: number };
  stopLoss: number;
  targets: number[];
  timestamp: number;
  side: 'long' | 'short';
}
