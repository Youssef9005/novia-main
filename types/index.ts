export type Timeframe = 
  | '1s' | '5s' | '10s' | '15s' | '30s'
  | '1m' | '3m' | '5m' | '15m' | '30m' | '45m'
  | '1h' | '2h' | '3h' | '4h'
  | '1D' | '2D' | '3D' | '1W' | '1M' | '3M' | '6M' | '12M';

export interface SymbolInfo {
  symbol: string;
  name: string;
  baseAsset: string;
  quoteAsset: string;
}

export type IndicatorType = 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB';

export interface Indicator {
  id: string;
  type: IndicatorType;
  period: number;
  color: string;
  pane: 'overlay' | 'separate';
  visible: boolean;
  settings?: Record<string, number | string | boolean>; // For extra params like stdDev, source, fast/slow
  order: number; // Added order
}

export type DrawingType = 'cursor' | 'line' | 'trend' | 'rect' | 'fib' | 'risk';

export interface Point {
  time: number; // Unix timestamp
  price: number;
}

export interface Drawing {
  id: string;
  type: DrawingType;
  points: Point[];
  style: {
    color: string;
    lineWidth: number;
    lineStyle?: number; // 0 solid, 1 dotted, etc
    backgroundColor?: string; // For rects
    transparency?: number;
  };
  locked: boolean;
  visible: boolean;
  // Risk Tool Specifics
  riskSettings?: {
    entryPrice: number;
    stopPrice: number;
    targets: number[];
    accountSize: number;
    riskPercent: number;
    leverage?: number;
  };
}

export interface Alert {
  id: string;
  type: 'price' | 'confluence' | 'liquidity';
  condition: 'gt' | 'lt' | 'touch' | 'enter' | 'exit';
  value?: number; // For price alerts
  message: string;
  active: boolean;
  triggered: boolean;
  createdAt?: number;
}


export interface ChartTemplate {
  id: string;
  name: string;
  indicators: Indicator[];
  drawings: Drawing[];
  timeframe: Timeframe;
  symbol: string;
}

// --- NEW FEATURES TYPES ---

export interface ConfluenceSettings {
  enabled: boolean;
  visibleRangeOnly: boolean;
  sensitivity: number; // 0.5 - 2.0
  zonesCount: number; // 3 - 12
  zoneThickness: number;
  intensityScale: 'auto' | 'manual';
  factors: {
    ema: boolean;
    vwap: boolean;
    atr: boolean;
    pdhl: boolean; // Previous Day High/Low
    pivots: boolean;
  };
}

export interface LiquiditySettings {
  enabled: boolean;
  pivotPeriod: number; // 3-5
  tolerancePercent: number;
  maxZones: number;
  minStrength: number;
  showLabels: boolean;
  fadeOlder: boolean;
}

export interface LiquidityZone {
  id: string;
  priceMin: number;
  priceMax: number;
  strength: number;
  touches: number;
  lastTouched: number; // timestamp
  type: 'supply' | 'demand';
}

export interface SmartAlert {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  type: 'BREAKOUT_VOL' | 'RSI_TREND' | 'CONFLUENCE_ENTRY';
  params: Record<string, number | string | boolean>;
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered: number;
  createdAt: number;
}

// --- PIVOTS & ENTRY LINE ---

export type PivotType = 'Classic' | 'Fibonacci' | 'Camarilla';
export type PivotTimeframe = 'Auto' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface PivotSettings {
  enabled: boolean;
  mode: 'AUTO' | 'MANUAL';
  type: PivotType;
  timeframe: PivotTimeframe;
  showR4: boolean;
  showR3: boolean;
  showR2: boolean;
  showR1: boolean;
  showP: boolean;
  showS1: boolean;
  showS2: boolean;
  showS3: boolean;
  showS4: boolean;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  showLabels: boolean;
  labelPosition: 'left' | 'right';
  resistanceColor: string;
  supportColor: string;
  pivotColor: string;
}

export interface EntryLineSettings {
  enabled: boolean;
  priceSource: 'manual' | 'last_setup';
  manualPrice: number;
  label: string;
  color: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
}
