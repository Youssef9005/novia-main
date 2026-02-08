"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { 
  createChart, 
  ColorType, 
  CrosshairMode, 
  IChartApi, 
  ISeriesApi, 
  LineStyle, 
  CandlestickSeries, 
  AreaSeries,
  LineSeries,
  Time,
  IPriceLine,
} from 'lightweight-charts';
import { AnalysisOverlay, AnalysisLevel } from './plugins/AnalysisOverlay';
import { FootprintSeries } from './plugins/FootprintSeries';
import { HTFCandleProfileSeries } from './plugins/HTFCandleProfileSeries';
import { generateFootprintCandle } from '@/lib/footprint/generator';
import { aggregateToHTF } from '@/lib/htf/aggregator';
import { HTFSettings } from '@/types/htfTypes';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import SignalNotifications, { Signal } from './SignalNotifications';
import { 
  Maximize2, 
  Camera, 
  BarChart3,
  Layers,
  RefreshCw,
  TrendingUp,
  Activity,
  MousePointer2,
  Minus,
  Square,
  Trash2,
  ChevronDown,
  Settings,
  X,
  Clock,
  AlignJustify,
  Check,
  Bell,
  Table
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from 'next-intl';
import { useChartStore } from '@/store/useChartStore';

// Helper for Linear Regression Channel (Adaptive Trend Finder)
const calculateLinearRegressionChannel = (data: CandleData[], length: number = 100, deviationMult: number = 2, useLog: boolean = false) => {
  if (!data || data.length < length) return null;

  // Use the last 'length' candles
  const subset = data.slice(-length);
  const n = subset.length;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    let y = subset[i].close;
    if (useLog && y > 0) y = Math.log(y);

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate Standard Deviation
  let sumSqDiff = 0;
  for (let i = 0; i < n; i++) {
    let y = subset[i].close;
    if (useLog && y > 0) y = Math.log(y);

    const yPred = slope * i + intercept;
    sumSqDiff += Math.pow(y - yPred, 2);
  }
  const stdDev = Math.sqrt(sumSqDiff / n);

  // Generate line points
  const basis = [];
  const upper = [];
  const lower = [];

  for (let i = 0; i < n; i++) {
    const item = subset[i];
    const yPred = slope * i + intercept;
    
    let valBasis = yPred;
    let valUpper = yPred + deviationMult * stdDev;
    let valLower = yPred - deviationMult * stdDev;

    if (useLog) {
        valBasis = Math.exp(valBasis);
        valUpper = Math.exp(valUpper);
        valLower = Math.exp(valLower);
    }

    basis.push({ time: item.time, value: valBasis });
    upper.push({ time: item.time, value: valUpper });
    lower.push({ time: item.time, value: valLower });
  }

  return { basis, upper, lower };
};

// Helper for Binance Symbol Mapping
const getBinanceSymbol = (symbol: string): string => {
    if (!symbol) return 'BTCUSDT';
    
    // Gold
    if (symbol === 'XAUUSD' || symbol === 'GOLD') return 'PAXGUSDT';
    
    // USDT itself (Show USDC/USDT pair as proxy for stability check)
    if (symbol === 'USDT') return 'USDCUSDT';
    
    // Forex Pairs -> Map to USDT
    const forexPairs = ['EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY'];
    if (forexPairs.includes(symbol)) {
         return symbol.replace('USD', 'USDT');
    }
    
    // Crypto Pairs -> Map to USDT
    const cryptoPairs = ['BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'SOLUSD', 'DOGEUSD', 'BNBUSD'];
    if (cryptoPairs.includes(symbol)) {
         return symbol.replace('USD', 'USDT');
    }
    
    return symbol.toUpperCase().replace('/', '');
 };
 
 // 100% Reliable Symbol Map for Twelve Data
  // Keys: Display Names (what user sees)
  // Values: API Symbols (what TwelveData needs)
  const SYMBOL_MAP: Record<string, string> = {
      // Metals
      'XAUUSD': 'XAU/USD', // Gold
      'XAGUSD': 'SLV',     // Silver ETF (Reliable Proxy)

      // Crypto
      'BTCUSD': 'BTC/USD', // Bitcoin
      'ETHUSD': 'ETH/USD', // Ethereum
      'SOLUSD': 'SOL/USD',
      'XRPUSD': 'XRP/USD',
      'DOGEUSD': 'DOGE/USD',
      'LTCUSD': 'LTC/USD',
      'BNBUSD': 'BNB/USD',
      'USDT': 'USDT/USD',   // Tether

      // Forex
      'EURUSD': 'EUR/USD', // Euro
      'GBPUSD': 'GBP/USD', // British Pound
      'USDJPY': 'USD/JPY',
      'USDCAD': 'USD/CAD',
      'USDCHF': 'USD/CHF',
      'AUDUSD': 'AUD/USD',
      'NZDUSD': 'NZD/USD',
      'EURGBP': 'EUR/GBP',
      'EURJPY': 'EUR/JPY',
      'GBPJPY': 'GBP/JPY',

      // Indices
      'US30': 'DJI',       // Dow Jones Industrial Average
      'NAS100': 'NDX',     // Nasdaq 100 Index
      'US100': 'NDX',      // Nasdaq 100 Index
      'SPX500': 'SPX',     // S&P 500 Index
      'US500': 'SPX',      // S&P 500 Index
      'UK100': 'FTSE',     // FTSE 100 Index
      'DEU40': 'DAX',      // DAX Index

      // Commodities
      'USOIL': 'WTI'
  };

  const SYMBOL_CATEGORIES: Record<string, string> = {
      'XAUUSD': 'Metals',
      'XAGUSD': 'Metals',

      'BTCUSD': 'Crypto',
      'ETHUSD': 'Crypto',
      'SOLUSD': 'Crypto',
      'XRPUSD': 'Crypto',
      'DOGEUSD': 'Crypto',
      'LTCUSD': 'Crypto',
      'BNBUSD': 'Crypto',
      'USDT': 'Crypto',

      'EURUSD': 'Forex',
      'GBPUSD': 'Forex',
      'USDJPY': 'Forex',
      'USDCAD': 'Forex',
      'USDCHF': 'Forex',
      'AUDUSD': 'Forex',
      'NZDUSD': 'Forex',
      'EURGBP': 'Forex',
      'EURJPY': 'Forex',
      'GBPJPY': 'Forex',

      'US30': 'Indices',
      'NAS100': 'Indices',
      'US100': 'Indices',
      'SPX500': 'Indices',
      'US500': 'Indices',
      'UK100': 'Indices',
      'DEU40': 'Indices',

      'USOIL': 'Commodities'
  };

  // Helper for TwelveData Symbol Mapping
  const getTwelveDataSymbol = (symbol: string): string => {
     // Direct lookup from our verified map
     if (SYMBOL_MAP[symbol]) {
         return SYMBOL_MAP[symbol];
     }
     
     // Fallbacks (should not be reached if allowedPairs is strict)
     if (!symbol) return 'BTC/USD';
     return symbol;
  };



// Helper for Fractals (Support & Resistance)
const calculateFractals = (data: CandleData[]) => {
  const fractals: { time: Time; price: number; type: 'up' | 'down' }[] = [];
  if (data.length < 5) return fractals;

  for (let i = 2; i < data.length - 2; i++) {
    const c = data[i];
    const p1 = data[i - 1];
    const p2 = data[i - 2];
    const n1 = data[i + 1];
    const n2 = data[i + 2];

    // Up Fractal (Resistance)
    if (c.high > p1.high && c.high > p2.high && c.high > n1.high && c.high > n2.high) {
      fractals.push({ time: c.time, price: c.high, type: 'up' });
    }
    // Down Fractal (Support)
    if (c.low < p1.low && c.low < p2.low && c.low < n1.low && c.low < n2.low) {
      fractals.push({ time: c.time, price: c.low, type: 'down' });
    }
  }
  return fractals;
};

interface InteractiveChartProps {
  symbol?: string;
  signal?: Signal | null;
  onTimeframeChange?: (timeframe: string) => void;
}

interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Drawing {
  id: string;
  type: 'trend' | 'rectangle' | 'fib' | 'long' | 'volprofile';
  p1: { time: Time; price: number };
  p2: { time: Time; price: number };
  color: string;
  width?: number;
}

const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: 'D', value: '1d' },
  { label: 'W', value: '1w' },
];

// Helper for SMA
const calculateSMA = (data: CandleData[], period: number) => {
  if (!data || data.length < period) return [];
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue;
    let sum = 0;
    for (let j = 0; j < period; j++) {
       if (data[i - j]) sum += data[i - j].close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
};

// Helper for EMA
const calculateEMA = (data: CandleData[], period: number) => {
  if (!data || data.length === 0) return [];
  const result = [];
  const k = 2 / (period + 1);
  let ema = data[0].close;
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push({ time: data[i].time, value: ema });
      continue;
    }
    ema = data[i].close * k + ema * (1 - k);
    result.push({ time: data[i].time, value: ema });
  }
  return result;
};

const calculateRSI = (data: CandleData[], period: number) => {
  if (!data || data.length <= period) return [];
  const result: { time: Time; value: number }[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < data.length; i++) {
    if (i > period) {
      const change = data[i].close - data[i - 1].close;
      if (change >= 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        const loss = -change;
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
      }
    }

    const rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
    const rsi = avgLoss === 0 && avgGain === 0 ? 50 : 100 - 100 / (1 + rs);
    result.push({ time: data[i].time, value: rsi });
  }

  return result;
};

  // Helper for Session Analysis (TradingView Logic)
  const calculateSessions = (data: CandleData[]) => {
    if (!data || data.length === 0) return null;

    const lastCandle = data[data.length - 1];
    const date = new Date(lastCandle.time as number * 1000);
    const h = date.getUTCHours();
    const m = date.getUTCMinutes();
    
    // Check which session is active or most recent
    // Asian: 00:00 - 08:00
    // EU: 08:00 - 16:30
    // US: 13:30 - 21:00
    
    const findSessionOpen = (targetH: number, targetM: number) => {
      // Look back up to 24 hours
      const limit = Math.max(0, data.length - 1440);
      for (let i = data.length - 1; i >= limit; i--) {
        const d = new Date(data[i].time as number * 1000);
        // Check for exact match or first candle after start time (within 15 mins)
        if (d.getUTCHours() === targetH && d.getUTCMinutes() >= targetM && d.getUTCMinutes() < targetM + 15) {
             return data[i];
        }
      }
      return null;
    };

    let sessionType = '';
    let openCandle = null;

    // Determine current session context
    // If > 13:30, US is dominant
    if (h > 13 || (h === 13 && m >= 30)) {
       sessionType = 'US';
       openCandle = findSessionOpen(13, 30);
       if (!openCandle && h < 21) { // Fallback if data gap
           sessionType = 'European';
           openCandle = findSessionOpen(8, 0);
       }
    } 
    // If > 08:00, EU is dominant
    else if (h >= 8) {
       sessionType = 'European';
       openCandle = findSessionOpen(8, 0);
    }
    // Else Asian
    else {
       sessionType = 'Asian';
       openCandle = findSessionOpen(0, 0);
    }
    
    if (!openCandle) return null;

    const settings = {
      supportPct: [-0.01, -0.02, -0.03, -0.04],
      resistancePct: [0.01, 0.02, 0.03, 0.04]
    };

    return {
      type: sessionType,
      openPrice: openCandle.open,
      supports: settings.supportPct.map(p => openCandle.open * (1 + p)),
      resistances: settings.resistancePct.map(p => openCandle.open * (1 + p))
    };
  };

  // Generate Alert Message (Exact Replica)
  const generateSessionAlert = (session: { type: string; openPrice: number; resistances: number[]; supports: number[] }, symbol: string) => {
    // Match Pine Script's #.#### format (up to 4 decimals, no trailing zeros)
    const fmt = (n: number) => {
        return parseFloat(n.toFixed(4)).toString();
    };
    const ticker = symbol.replace('/', '');
    
    const typeAr = session.type === 'Asian' ? 'الآسيوية' : session.type === 'European' ? 'الأوروبية' : 'الأمريكية';
    
    const message = `إشعار تحليل الجلسة ${typeAr} لهذا اليوم
${session.type} Session Analysis Notice for Today
الزوج: ${ticker}
منطقة الارتكاز: ${fmt(session.openPrice)}
إذا كان السعر يتداول أعلى منطقة الارتكاز يكون الاتجاه إيجابي
المقاومة الأولى: ${fmt(session.resistances[0])}
المقاومة الثانية: ${fmt(session.resistances[1])}
المقاومة الثالثة: ${fmt(session.resistances[2])}
المقاومة الرابعة: ${fmt(session.resistances[3])}
إذا كان السعر يتداول أسفل منطقة الارتكاز يكون الاتجاه سلبي
الدعم الأول: ${fmt(session.supports[0])}
الدعم الثاني: ${fmt(session.supports[1])}
الدعم الثالث: ${fmt(session.supports[2])}
الدعم الرابع: ${fmt(session.supports[3])}
Currency: ${ticker}
Anchor Area: ${fmt(session.openPrice)}
If the price is trading above the anchor area, the trend is positive.
First Resistance: ${fmt(session.resistances[0])}
Second Resistance: ${fmt(session.resistances[1])}
Third Resistance: ${fmt(session.resistances[2])}
Fourth Resistance: ${fmt(session.resistances[3])}
If the price is trading below the anchor area, the trend is negative.
First Support: ${fmt(session.supports[0])}
Second Support: ${fmt(session.supports[1])}
Third Support: ${fmt(session.supports[2])}
Fourth Support: ${fmt(session.supports[3])}`;

    return message;
  };

export default function TradingChart({ symbol: propSymbol = 'XAUUSD', signal, onTimeframeChange }: InteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick" | "Area"> | null>(null);
  const analysisOverlayRef = useRef<AnalysisOverlay | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const footprintSeriesRef = useRef<FootprintSeries | null>(null);
  const htfProfileSeriesRef = useRef<HTFCandleProfileSeries | null>(null);
  
  const [symbol, setSymbol] = useState(propSymbol);
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType] = useState<'candles' | 'area'>('candles');
  const [showSignalLines, setShowSignalLines] = useState(true);
  const [crosshairMode] = useState<CrosshairMode>(CrosshairMode.Normal);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [priceOffset, setPriceOffset] = useState(0);
  const [dataSource, setDataSource] = useState<'binance' | 'twelvedata'>('twelvedata');
  const [twelveDataApiKey, setTwelveDataApiKey] = useState('4e7ad076c8744b6a9d268ea547395835');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false); // For continuous calibration
  const [candleUpColor] = useState('#089981');
  const [candleDownColor] = useState('#F23645');
  const [showSupportResistance] = useState(false);
  const [showTrendFinder, setShowTrendFinder] = useState(false);

  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialDrawingState, setInitialDrawingState] = useState<Drawing | null>(null);
  const [candleCountdown, setCandleCountdown] = useState<string | null>(null);
  const [showAnalysisLines, setShowAnalysisLines] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  // Start with empty allowed pairs to strictly follow user subscription
  const [allowedPairs, setAllowedPairs] = useState<string[]>([]);
  const locale = useLocale();
  const { user } = useAuth();
  const { 
    footprintSettings, toggleFootprint, setFootprintSettings,
    htfSettings, toggleHTF, setHTFSettings 
  } = useChartStore();

  // Validate Status from User Context directly
  useEffect(() => {
    if (!user) {
       setAllowedPairs([]);
       return;
    }

    let isActive = false;

    if (user.subscription) {
        const sub = user.subscription;
        const now = new Date();
        const expiry = sub.endDate ? new Date(sub.endDate) : null;
        
        // Check if active and not expired
        if (sub.status === 'active' && (!expiry || now <= expiry)) {
            isActive = true;
        }
    }

    if (isActive && Array.isArray(user.selectedAssets) && user.selectedAssets.length > 0) {
        // Handle "ALL" permission - Expand to all supported assets
        if (user.selectedAssets.includes('ALL') || user.selectedAssets.includes('all')) {
            const allAssets = Object.keys(SYMBOL_MAP);
            setAllowedPairs(allAssets);
            // Default to XAUUSD if current symbol is invalid or "ALL"
            setSymbol(prev => (allAssets.includes(prev) && prev !== 'ALL') ? prev : 'XAUUSD');
        } else {
            // Filter user assets to only allow supported ones
            const supportedAssets = user.selectedAssets.filter((s: string) => SYMBOL_MAP[s]);
            setAllowedPairs(supportedAssets);
            
            // Set default symbol from allowed list
            setSymbol(prev => supportedAssets.includes(prev) ? prev : (supportedAssets[0] || 'XAUUSD'));
        }
    } else {
        // Subscription expired or invalid
        setAllowedPairs([]);
    }
  }, [user]);

  const rawDataRef = useRef<CandleData[]>([]);
  
  // Load Price Offset & Settings from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('chart_price_offset');
    if (saved) setPriceOffset(parseFloat(saved));

    const savedSource = localStorage.getItem('chart_data_source');
    if (savedSource === 'binance' || savedSource === 'twelvedata') setDataSource(savedSource);
    
    const savedKey = localStorage.getItem('twelvedata_api_key');
    if (savedKey) setTwelveDataApiKey(savedKey);

    const savedAutoSync = localStorage.getItem('chart_auto_sync');
    if (savedAutoSync) setIsAutoSyncEnabled(savedAutoSync === 'true');
  }, []);

  // Save Settings
  useEffect(() => {
    localStorage.setItem('chart_price_offset', priceOffset.toString());
  }, [priceOffset]);

  useEffect(() => {
    localStorage.setItem('chart_data_source', dataSource);
  }, [dataSource]);

  useEffect(() => {
    localStorage.setItem('twelvedata_api_key', twelveDataApiKey);
  }, [twelveDataApiKey]);

  useEffect(() => {
    localStorage.setItem('chart_auto_sync', String(isAutoSyncEnabled));
  }, [isAutoSyncEnabled]);
  
  // Drawing Tools State
  const [drawingTool, setDrawingTool] = useState<'cursor' | 'horizontal' | 'trend' | 'rectangle' | 'fib' | 'long' | 'volprofile'>('cursor');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<Drawing> | null>(null);
  const [chartUpdateTrigger, setChartUpdateTrigger] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const selectedDrawing = drawings.find(d => d.id === selectedDrawingId) || null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `chart_drawings_${symbol}_${timeframe}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setDrawings(parsed);
        }
      } catch {}
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `chart_drawings_${symbol}_${timeframe}`;
    localStorage.setItem(key, JSON.stringify(drawings));
  }, [drawings, symbol, timeframe]);

  useEffect(() => {
    if (candleData.length === 0) {
      setCandleCountdown(null);
      return;
    }

    const durations: Record<string, number> = {
      '1m': 60,
      '3m': 180,
      '5m': 300,
      '15m': 900,
      '30m': 1800,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
      '1w': 604800,
    };

    const duration = durations[timeframe] ?? 60;

    const update = () => {
      const last = candleData[candleData.length - 1];
      const start = last.time as number;
      const now = Date.now() / 1000;
      const end = start + duration;
      const remaining = Math.floor(end - now);

      if (!Number.isFinite(remaining) || remaining <= 0) {
        setCandleCountdown('00:00');
        return;
      }

      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      const formatted =
        hours > 0
          ? `${hours.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          : `${minutes.toString().padStart(2, '0')}:${seconds
              .toString()
              .padStart(2, '0')}`;

      setCandleCountdown(formatted);
    };

    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [candleData, timeframe]);

  // Helper to parse analysis levels from message
  const parseAnalysisLevels = (message: string) => {
    if (!message) return null;

    // Detect Session Type
    let type = 'Asian'; // Default
    if (message.includes('European') || message.includes('الأوروبية')) type = 'European';
    else if (message.includes('US') || message.includes('الأمريكية')) type = 'US';

    // Anchor
    const anchorMatch = message.match(/(?:Anchor Area|منطقة الارتكاز|مـنـطـقة الارتـكاز)\s*:?\s*([\d.]+)/i);
    const anchor = anchorMatch ? parseFloat(anchorMatch[1]) : null;

    // Resistances
    const resistanceMatches = Array.from(message.matchAll(/(?:Resistance|المقاومة|المـقاومة).*?:\s*([\d.]+)/gi));
    const resistances = resistanceMatches
      .map(m => parseFloat(m[1]))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b); // Ascending (R1, R2, R3...)

    // Supports
    const supportMatches = Array.from(message.matchAll(/(?:Support|الدعم|الـدعم).*?:\s*([\d.]+)/gi));
    const supports = Array.from(new Set(
      supportMatches
        .map(m => parseFloat(m[1]))
        .filter(n => !isNaN(n))
    )).sort((a, b) => b - a); // Descending (S1, S2, S3...)

    return { type, anchor, resistances: Array.from(new Set(resistances)), supports };
  };

  // Draw Active Signal Lines (Entry, SL, TP)
  useEffect(() => {
    if (!seriesRef.current) return;

    // Clear existing lines
    priceLinesRef.current.forEach(line => {
       seriesRef.current?.removePriceLine(line);
    });
    priceLinesRef.current = [];

    if (!activeSignal || !showSignalLines) return;

    const createLine = (price: number, color: string, title: string, style: LineStyle = LineStyle.Solid) => {
       if (isNaN(price) || price <= 0) return;
       const line = seriesRef.current?.createPriceLine({
          price,
          color,
          lineWidth: 2,
          lineStyle: style,
          axisLabelVisible: true,
          title,
       });
       if (line) priceLinesRef.current.push(line);
    };

    // Determine colors
    const isBuy = activeSignal.type?.toLowerCase().includes('buy');
    const isAnalysis = activeSignal.type?.toLowerCase().includes('analysis');
    
    let entryColor = isBuy ? '#089981' : '#F23645';
    let entryLabel = 'ENTRY';
    let slColor = '#F23645'; // Default SL (Red)
    let slLabel = 'SL';
    let tpColor = '#089981'; // Default TP (Green)
    let tpLabel = 'TP';

    if (isAnalysis) {
        entryColor = '#2962FF'; // Blue for Pivot
        entryLabel = 'PIVOT';
        slColor = '#4CAF50'; // Green for Support (Potential Buy)
        slLabel = 'SUPPORT';
        tpColor = '#F44336'; // Red for Resistance (Potential Sell)
        tpLabel = 'RESISTANCE';
    }

    // Entry / Pivot
    if (activeSignal.entry) {
        createLine(parseFloat(activeSignal.entry), entryColor, entryLabel, LineStyle.Solid);
    } else if (activeSignal.price) {
         createLine(activeSignal.price, entryColor, entryLabel, LineStyle.Solid);
    }

    // Stop Loss / Support
    if (activeSignal.stopLoss) {
        createLine(parseFloat(activeSignal.stopLoss), slColor, slLabel, LineStyle.Dashed);
    } else if (activeSignal.stop) {
        createLine(activeSignal.stop, slColor, slLabel, LineStyle.Dashed);
    }

    // Take Profit 1 / Resistance 1
    if (activeSignal.tp1) {
        createLine(parseFloat(activeSignal.tp1), tpColor, isAnalysis ? 'RES 1' : 'TP1', LineStyle.Dashed);
    } else if (activeSignal.target1) {
        createLine(activeSignal.target1, tpColor, isAnalysis ? 'RES 1' : 'TP1', LineStyle.Dashed);
    }
    
    // Take Profit 2 / Resistance 2
    if (activeSignal.tp2 || activeSignal.raw?.tp2) {
         createLine(parseFloat(activeSignal.tp2 || activeSignal.raw.tp2), tpColor, isAnalysis ? 'RES 2' : 'TP2', LineStyle.Dashed);
    }
    
     // Take Profit 3 / Resistance 3
    if (activeSignal.tp3 || activeSignal.raw?.tp3) {
         createLine(parseFloat(activeSignal.tp3 || activeSignal.raw.tp3), tpColor, isAnalysis ? 'RES 3' : 'TP3', LineStyle.Dashed);
    }

    // Take Profit 4 / Resistance 4
    if (activeSignal.tp4 || activeSignal.raw?.tp4) {
        createLine(parseFloat(activeSignal.tp4 || activeSignal.raw.tp4), tpColor, isAnalysis ? 'RES 4' : 'TP4', LineStyle.Dashed);
    }

  }, [activeSignal, showSignalLines, chartUpdateTrigger]);

  // Draw Analysis Lines
  useEffect(() => {
    if (!seriesRef.current || !activeSignal || !showAnalysisLines) {
      if (analysisOverlayRef.current) {
         analysisOverlayRef.current.updateLevels([]);
      }
      return;
    }

    let levels = null;

    // 1. Try to use structured data from backend (Analysis Signal)
    // activeSignal.raw contains the full backend document.
    // The backend stores extra data in 'raw' field of the document.
    // So we look for activeSignal.raw.raw.resistances
    if (activeSignal.raw && activeSignal.raw.raw && Array.isArray(activeSignal.raw.raw.resistances)) {
        const rawData = activeSignal.raw.raw;
        // Determine session type from message or default
        let type = 'Asian';
        const msg = activeSignal.message || '';
        if (msg.includes('European') || msg.includes('الأوروبية')) type = 'European';
        else if (msg.includes('US') || msg.includes('الأمريكية')) type = 'US';

        levels = {
            type,
            anchor: parseFloat(activeSignal.entry || activeSignal.price || '0'),
            resistances: rawData.resistances || [],
            supports: rawData.supports || []
        };
    } 
    // 2. Fallback: Parse message text (for older signals or if raw data missing)
    else if (activeSignal.message) {
        levels = parseAnalysisLevels(activeSignal.message);
    }

    if (!levels) {
        if (analysisOverlayRef.current) analysisOverlayRef.current.updateLevels([]);
        return;
    }

    // Colors based on Session Type
    // Asian: Purple (#9C27B0)
    // European: Blue (#2962FF)
    // US: Green (#4CAF50)
    let mainColor = '#9C27B0'; // Asian Default
    let openColor = '#FF6D00';
    if (levels.type === 'European') mainColor = '#2962FF';
    if (levels.type === 'US') mainColor = '#4CAF50';
    if (levels.type === 'European') openColor = '#00E5FF';
    if (levels.type === 'US') openColor = '#FFEB3B';

    const overlayLevels: AnalysisLevel[] = [];

    // Anchor
    if (levels.anchor) {
      // Add transparency to openColor for "wide and transparent" look
      const transparentColor = openColor.length === 7 ? openColor + '66' : openColor; // Add 40% alpha if hex
      overlayLevels.push({
          price: levels.anchor,
          color: transparentColor,
          width: 50,
          label: `${levels.type} Entry`,
          textColor: openColor
      });
    }

    // Draw Resistances
    const transparentMainColor = mainColor.length === 7 ? mainColor + '4D' : mainColor; // 30% alpha for R/S

    levels.resistances.forEach((price, i) => {
        overlayLevels.push({
            price: price,
            color: transparentMainColor,
            width: 20,
            label: `R${i + 1}`,
            textColor: mainColor
        });
    });

    // Draw Supports
    levels.supports.forEach((price, i) => {
        overlayLevels.push({
            price: price,
            color: transparentMainColor,
            width: 20,
            label: `S${i + 1}`,
            textColor: mainColor
        });
    });

    if (analysisOverlayRef.current) {
        analysisOverlayRef.current.updateLevels(overlayLevels);
    }

  }, [activeSignal, chartUpdateTrigger, showAnalysisLines]);

  // Draw Adaptive Trend Finder
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    const channelIds = ['ATF_Upper', 'ATF_Basis', 'ATF_Lower'];
    
    if (!showTrendFinder) {
      channelIds.forEach(id => {
        if (indicatorSeriesRef.current.has(id)) {
          const s = indicatorSeriesRef.current.get(id);
          if (s) {
            chartRef.current?.removeSeries(s);
            indicatorSeriesRef.current.delete(id);
          }
        }
      });
      return;
    }

    // Create series if not exist
    if (!indicatorSeriesRef.current.has('ATF_Basis')) {
        const basis = chartRef.current.addSeries(LineSeries, { 
            color: '#FF6D00', 
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            title: 'Basis'
        });
        const upper = chartRef.current.addSeries(LineSeries, { 
            color: '#2962FF', 
            lineWidth: 2, 
            title: 'Upper'
        });
        const lower = chartRef.current.addSeries(LineSeries, { 
            color: '#2962FF', 
            lineWidth: 2, 
            title: 'Lower'
        });
        indicatorSeriesRef.current.set('ATF_Basis', basis);
        indicatorSeriesRef.current.set('ATF_Upper', upper);
        indicatorSeriesRef.current.set('ATF_Lower', lower);
    }

    // Calculate Data
    // Use last 100 candles or adaptive length if implemented
    const data = calculateLinearRegressionChannel(candleData, 100, 2);
    if (data) {
        indicatorSeriesRef.current.get('ATF_Basis')?.setData(data.basis);
        indicatorSeriesRef.current.get('ATF_Upper')?.setData(data.upper);
        indicatorSeriesRef.current.get('ATF_Lower')?.setData(data.lower);
    }

  }, [showTrendFinder, candleData]);

  // Generate Signal from Chart Data (Session Analysis)
  useEffect(() => {
    if (candleData.length > 0 && !signal) {
       // Only generate if no external signal is provided
       const session = calculateSessions(candleData);
       if (session) {
         const alertMsg = generateSessionAlert(session, symbol);
         // Check if we need to update (avoid infinite loop)
         if (!activeSignal || activeSignal.message !== alertMsg) {
             setActiveSignal({
               entry: '',
               stopLoss: '',
               tp1: '',
               type: 'ANALYSIS',
               symbol: symbol,
               message: alertMsg
             });
         }
       }
    }
  }, [candleData, symbol, signal, activeSignal]);



  // Set active signal from prop (chart no longer fetches signals itself)
  useEffect(() => {
    if (signal) {
      setActiveSignal(signal);
    }
  }, [signal]);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (chartContainerRef.current.clientWidth === 0) return;

    // Prevent chart creation if no allowed pairs (subscription expired/invalid)
    if (allowedPairs.length === 0) {
        if (chartRef.current) {
             chartRef.current.remove();
             chartRef.current = null;
             seriesRef.current = null;
        }
        return;
    }

    try {
      // Dispose old chart if exists
      if (chartRef.current) {
        chartRef.current.remove();
        indicatorSeriesRef.current.clear();
      }

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#0b0e11' }, // Darker professional bg
          textColor: '#9ca3af',
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
        },
        grid: {
          vertLines: { color: '#1f2937', style: LineStyle.Solid, visible: false }, // Cleaner look
          horzLines: { color: '#1f2937', style: LineStyle.Solid, visible: true },
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        crosshair: {
          mode: crosshairMode,
          vertLine: {
              width: 1,
              color: '#4b5563',
              style: LineStyle.Dashed,
              labelBackgroundColor: '#4b5563',
          },
          horzLine: {
              width: 1,
              color: '#4b5563',
              style: LineStyle.Dashed,
              labelBackgroundColor: '#4b5563',
          },
        },
        rightPriceScale: {
          borderColor: '#2B2B43',
          visible: true,
          minimumWidth: 65,
          scaleMargins: {
            top: 0.2,
            bottom: 0.2,
          },
        },
        timeScale: {
          borderColor: '#2B2B43',
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 12,
          barSpacing: 12,
          minBarSpacing: 2,
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });

      let series: ISeriesApi<"Candlestick" | "Area">;

      if (chartType === 'area') {
        series = chart.addSeries(AreaSeries, {
          topColor: 'rgba(41, 98, 255, 0.4)',
          bottomColor: 'rgba(41, 98, 255, 0.0)',
          lineColor: '#2962FF',
          lineWidth: 2,
          priceLineWidth: 2,
          priceLineColor: '#FBBF24',
        });
      } else {
        series = chart.addSeries(CandlestickSeries, {
          upColor: candleUpColor,
          downColor: candleDownColor,
          borderVisible: false,
          wickUpColor: candleUpColor,
          wickDownColor: candleDownColor,
          priceLineWidth: 2,
          priceLineColor: '#FBBF24',
        });
      }

      chartRef.current = chart;
      seriesRef.current = series;
      
      // Add Analysis Overlay
      const analysisOverlay = new AnalysisOverlay([]);
      series.attachPrimitive(analysisOverlay);
      analysisOverlayRef.current = analysisOverlay;

      // Add Footprint Series
      const footprintSeries = new FootprintSeries(chart, series, footprintSettings);
      series.attachPrimitive(footprintSeries);
      footprintSeriesRef.current = footprintSeries;

      // Add HTF Candle Profile Series
      const htfProfileSeries = new HTFCandleProfileSeries(chart, series, htfSettings);
      series.attachPrimitive(htfProfileSeries);
      htfProfileSeriesRef.current = htfProfileSeries;
       
       // Ensure correct initial visibility for candles
      series.applyOptions({ visible: true });

      // Subscribe to visible range changes to update drawings
      chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
        setChartUpdateTrigger(prev => prev + 1);
      });

      // Click handler for horizontal line (native support)
      chart.subscribeClick((param) => {
        if (drawingTool === 'horizontal' && param.point && seriesRef.current) {
           const price = seriesRef.current.coordinateToPrice(param.point.y);
           if (price) {
             seriesRef.current.createPriceLine({
               price: price,
               color: '#E0E0E0',
               lineWidth: 2,
               lineStyle: LineStyle.Solid,
               axisLabelVisible: true,
               title: 'H-Line',
             });
             setDrawingTool('cursor');
             toast.success('Horizontal line drawn');
           }
        }
      });

      // Trigger update to redraw analysis lines if needed
      setChartUpdateTrigger(prev => prev + 1);

      // Load Data
      const loadData = async () => {
        let data: CandleData[] = [];
        
        // --- TwelveData Source ---
        if (dataSource === 'twelvedata' && twelveDataApiKey) {
            try {
                const tdSymbol = getTwelveDataSymbol(symbol);
                // Map timeframe to TwelveData interval
                const intervalMap: Record<string, string> = {
                    '1m': '1min',
                    '3m': '3min',
                    '5m': '5min',
                    '15m': '15min',
                    '30m': '30min',
                    '1h': '1h',
                    '4h': '4h',
                    '1d': '1day',
                    '1w': '1week'
                };
                const tdInterval = intervalMap[timeframe] || '1min';

                const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${tdSymbol}&interval=${tdInterval}&apikey=${twelveDataApiKey}&outputsize=1000`);
                const json = await res.json();
                
                if (json.code === 401 || json.code === 400 || json.code === 404) {
                     // Handle Premium Plan Error or Invalid Symbol
                     const msg = json.message || '';
                     if (msg.includes('Grow plan') || msg.includes('Pro plan') || msg.includes('upgrade') || msg.includes('available starting with')) {
                         console.warn(`TwelveData Plan Limit: ${msg}`);
                         toast.error(`Symbol ${symbol} requires a premium plan. Switching to safe symbol.`);
                         setSymbol('BTC/USD'); // Switch to a safe free symbol
                         return;
                     }

                     if (json.code === 404) {
                         console.warn(`TwelveData Symbol Not Found: ${symbol}`);
                         toast.error(`Symbol ${symbol} not found. Switching to safe symbol.`);
                         setSymbol('BTC/USD');
                         return;
                     }

                     console.error(`TwelveData Error: ${msg}`);
                } else if (json.values && Array.isArray(json.values)) {
                    data = json.values.reverse().map((v: { datetime: string; open: string; high: string; low: string; close: string }) => ({
                        time: (new Date(v.datetime).getTime() / 1000) as Time,
                        open: parseFloat(v.open),
                        high: parseFloat(v.high),
                        low: parseFloat(v.low),
                        close: parseFloat(v.close),
                    }));
                }
            } catch {
                console.error("TwelveData fetch error");
            }
        } 
        // --- Binance Source (Default) ---
        else {
            // Special handling for Indices (US30, NAS100, SPX500, UK100, DEU40) and Commodities (XAGUSD) which are not on Binance
            // If the user has a TwelveData key, we try to use it even if source is Binance
            if (['US30', 'NAS100', 'SPX500', 'UK100', 'DEU40', 'XAGUSD'].includes(symbol) && twelveDataApiKey) {
                 try {
                    const tdSymbol = getTwelveDataSymbol(symbol); // Map to ETF proxies if needed
                    // Map timeframe
                    const intervalMap: Record<string, string> = {
                        '1m': '1min', '3m': '3min', '5m': '5min', '15m': '15min',
                        '30m': '30min', '1h': '1h', '4h': '4h', '1d': '1day', '1w': '1week'
                    };
                    const tdInterval = intervalMap[timeframe] || '1min';
                    
                    const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${tdSymbol}&interval=${tdInterval}&apikey=${twelveDataApiKey}&outputsize=1000`);
                    const json = await res.json();
                    
                    if (json.code === 400 || json.code === 401 || json.code === 404) {
                         const msg = json.message || '';
                         if (msg.includes('Grow plan') || msg.includes('Pro plan') || msg.includes('upgrade') || msg.includes('available starting with')) {
                             toast.error(`Index ${symbol} requires a premium plan. Switching to BTC/USD.`);
                             setSymbol('BTC/USD');
                             return;
                         }
                    }

                    if (json.values && Array.isArray(json.values)) {
                        data = json.values.reverse().map((v: { datetime: string; open: string; high: string; low: string; close: string }) => ({
                            time: (new Date(v.datetime).getTime() / 1000) as Time,
                            open: parseFloat(v.open),
                            high: parseFloat(v.high),
                            low: parseFloat(v.low),
                            close: parseFloat(v.close),
                        }));
                    }
                 } catch (e) {
                     console.error("Fallback TwelveData fetch error", e);
                 }
            } else {
                // Use Standard Binance Mapping
                const querySymbol = getBinanceSymbol(symbol);

                try {
                    const binanceInterval = timeframe === '1d' ? '1d' : timeframe;
                    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${querySymbol}&interval=${binanceInterval}&limit=1000`);
                    const klines = await res.json();
                    
                    if (Array.isArray(klines)) {
                        data = klines.map((k: (string | number)[]) => ({
                            time: (Number(k[0]) / 1000) as Time,
                            open: parseFloat(k[1] as string),
                            high: parseFloat(k[2] as string),
                            low: parseFloat(k[3] as string),
                            close: parseFloat(k[4] as string),
                        }));
                    }
                } catch {
                    console.log("Failed to fetch market data");
                }
            }
        }
        
        if (data.length > 0 && chartRef.current && series) {
          rawDataRef.current = data;
          
          const adjustedData = data
            .filter(d => d && d.time && !isNaN(d.open) && !isNaN(d.close) && !isNaN(d.high) && !isNaN(d.low))
            .map(d => ({
            ...d,
            open: d.open + priceOffset,
            high: d.high + priceOffset,
            low: d.low + priceOffset,
            close: d.close + priceOffset,
          }));

          setCandleData(adjustedData);
          
          try {
              if (chartType === 'area') {
                 const areaData = adjustedData.map(d => ({ time: d.time, value: d.close }));
                 series.setData(areaData);
              } else {
                 series.setData(adjustedData);
              }
          } catch (e) {
              console.error("Chart SetData Error:", e);
          }

          // Set Footprint Data
          if (footprintSeriesRef.current) {
              const footprintData = adjustedData.map(d => generateFootprintCandle({
                  ...d,
                  time: d.time as number
              }));
              footprintSeriesRef.current.updateData(footprintData);

              // Set HTF Data if enabled
              if (htfProfileSeriesRef.current && htfSettings.enabled) {
                  // Determine timeframe minutes
                  let tfMinutes = 60; // Default 1h
                  if (timeframe === '1m') tfMinutes = 1;
                  if (timeframe === '5m') tfMinutes = 5;
                  if (timeframe === '15m') tfMinutes = 15;
                  if (timeframe === '1h') tfMinutes = 60;
                  if (timeframe === '4h') tfMinutes = 240;
                  if (timeframe === '1d') tfMinutes = 1440;

                  // Auto HTF Logic: 
                  // If 'Auto', pick higher timeframe based on current
                  let targetMinutes = tfMinutes * 4; 
                  if (htfSettings.timeframe !== 'Auto') {
                      if (htfSettings.timeframe === '1H') targetMinutes = 60;
                      if (htfSettings.timeframe === '4H') targetMinutes = 240;
                      if (htfSettings.timeframe === '1D') targetMinutes = 1440;
                  }

                  // Only aggregate if target > current
                  if (targetMinutes > tfMinutes) {
                      const htfData = aggregateToHTF(footprintData, targetMinutes);
                      htfProfileSeriesRef.current.updateData(htfData);
                  } else {
                       htfProfileSeriesRef.current.updateData([]);
                  }
              }
          }

          if (candleData.length === 0) {
              chart.timeScale().fitContent();
          }
          setChartUpdateTrigger(prev => prev + 1);
        }
      };

      loadData();

      // WebSocket for Real-time Updates
      let ws: WebSocket | null = null;
      try {
          // Use TwelveData WS if source is TwelveData OR if we are using fallback for Indices
          if ((dataSource === 'twelvedata' || (['US30', 'NAS100', 'SPX500', 'US100', 'US500'].includes(symbol))) && twelveDataApiKey) {
               // TwelveData WebSocket
               ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes?apikey=${twelveDataApiKey}`);
               ws.onopen = () => {
                   const tdSymbol = getTwelveDataSymbol(symbol);
                   ws?.send(JSON.stringify({
                       action: "subscribe",
                       params: { symbols: tdSymbol }
                   }));
               };
               ws.onmessage = (event) => {
                   const msg = JSON.parse(event.data);
                   if (msg.event === 'price' && seriesRef.current && rawDataRef.current.length > 0) {
                       const price = parseFloat(msg.price);
                       // Update the last candle
                       const lastCandle = rawDataRef.current[rawDataRef.current.length - 1];
                       const updatedCandle = {
                           ...lastCandle,
                           close: price + priceOffset, 
                           high: Math.max(lastCandle.high, price + priceOffset),
                           low: Math.min(lastCandle.low, price + priceOffset)
                       };
                       if (seriesRef.current) {
                           try {
                               seriesRef.current.update(updatedCandle);
                               if (footprintSeriesRef.current) {
                                   footprintSeriesRef.current.updateLastCandle(generateFootprintCandle({
                                       ...updatedCandle,
                                       time: updatedCandle.time as number
                                   }));
                               }
                           } catch (e) {
                               // Silent update fail
                           }
                       }
                   }
               };
          } else {
              // Binance WebSocket
              const wsSymbol = getBinanceSymbol(symbol);
              
              const wsInterval = timeframe === '1d' ? '1d' : timeframe;
              ws = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol.toLowerCase()}@kline_${wsInterval}`);

              ws.onmessage = (event) => {
                  const message = JSON.parse(event.data);
                  if (message.e === 'kline') {
                      const k = message.k;
                      const rawCandle = {
                          time: (k.t / 1000) as Time,
                          open: parseFloat(k.o),
                          high: parseFloat(k.h),
                          low: parseFloat(k.l),
                          close: parseFloat(k.c),
                      };
                      
                      const candle = {
                          ...rawCandle,
                          open: rawCandle.open + priceOffset,
                          high: rawCandle.high + priceOffset,
                          low: rawCandle.low + priceOffset,
                          close: rawCandle.close + priceOffset,
                      };

                      if (seriesRef.current && candle && !isNaN(candle.close)) {
                          try {
                              seriesRef.current.update(candle);
                              
                              // Update Footprint
                              if (footprintSeriesRef.current) {
                                  const candleWithVol = { 
                                      ...candle, 
                                      time: candle.time as number,
                                      volume: parseFloat(message.k.v) 
                                  };
                                  footprintSeriesRef.current.updateLastCandle(generateFootprintCandle(candleWithVol));
                              }

                              // Update current candle in state for indicators
                              setCandleData(prev => {
                                  const last = prev[prev.length - 1];
                                  if (last && last.time === candle.time) {
                                      return [...prev.slice(0, -1), candle];
                                  } else {
                                      return [...prev, candle];
                                  }
                              });
                          } catch (e) {
                              // Ignore update errors for cleaner console
                          }
                      }
                  }
              };
          }
      } catch {
          console.error("WebSocket error");
      }

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ 
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight
          });
          setChartUpdateTrigger(prev => prev + 1);
        }
      };
      window.addEventListener('resize', handleResize);

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && chartContainerRef.current) {
        resizeObserver = new ResizeObserver(entries => {
          if (!chartRef.current) return;
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            chartRef.current.applyOptions({ width, height });
            setChartUpdateTrigger(prev => prev + 1);
          }
        });
        resizeObserver.observe(chartContainerRef.current);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (ws) {
            ws.close();
        }
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
            seriesRef.current = null;
        }
      };
    } catch (e) {
      console.error("Chart init error:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe, chartType, crosshairMode, priceOffset, dataSource, twelveDataApiKey, candleUpColor, candleDownColor]); 

  // Footprint Settings Update
  useEffect(() => {
    if (footprintSeriesRef.current && seriesRef.current) {
      footprintSeriesRef.current.updateSettings(footprintSettings);
      
      // Adjust main series visibility based on footprint
      if (footprintSettings.enabled) {
         seriesRef.current.applyOptions({
             upColor: 'transparent',
             downColor: 'transparent',
             borderVisible: false,
             wickVisible: true // Keep wicks for context
         });
      } else {
         seriesRef.current.applyOptions({
             upColor: candleUpColor,
             downColor: candleDownColor,
             borderVisible: false,
             wickVisible: true
         });
      }
    }
  }, [footprintSettings, candleUpColor, candleDownColor]);

  // HTF Settings Update
  useEffect(() => {
    if (htfProfileSeriesRef.current) {
      htfProfileSeriesRef.current.updateSettings(htfSettings);
    }
  }, [htfSettings]);

  // HTF Data Refresh
  useEffect(() => {
    if (htfProfileSeriesRef.current && candleData.length > 0) {
        if (htfSettings.enabled) {
            // Re-calculate data
            const footprintData = candleData.map(d => generateFootprintCandle({
                ...d,
                time: d.time as number
            }));

            let tfMinutes = 60; 
            if (timeframe === '1m') tfMinutes = 1;
            if (timeframe === '3m') tfMinutes = 3;
            if (timeframe === '5m') tfMinutes = 5;
            if (timeframe === '15m') tfMinutes = 15;
            if (timeframe === '30m') tfMinutes = 30;
            if (timeframe === '1h') tfMinutes = 60;
            if (timeframe === '4h') tfMinutes = 240;
            if (timeframe === '1d') tfMinutes = 1440;
            if (timeframe === '1w') tfMinutes = 10080;

            let targetMinutes = tfMinutes * 4; 
            if (htfSettings.timeframe !== 'Auto') {
                if (htfSettings.timeframe === '1H') targetMinutes = 60;
                if (htfSettings.timeframe === '4H') targetMinutes = 240;
                if (htfSettings.timeframe === '1D') targetMinutes = 1440;
            }

            if (targetMinutes > tfMinutes) {
                const htfData = aggregateToHTF(footprintData, targetMinutes);
                htfProfileSeriesRef.current.updateData(htfData);
            } else {
                htfProfileSeriesRef.current.updateData([]);
            }
        } else {
            htfProfileSeriesRef.current.updateData([]);
        }
    }
  }, [htfSettings, candleData, timeframe]);

  // Handle Indicators
  useEffect(() => {
     if (!chartRef.current || candleData.length === 0) return;
     
     // Clear existing indicators (excluding Trend Finder)
     const keysToRemove: string[] = [];
     indicatorSeriesRef.current.forEach((_, key) => {
         if (!key.startsWith('ATF_')) {
             keysToRemove.push(key);
         }
     });

     keysToRemove.forEach(key => {
         const s = indicatorSeriesRef.current.get(key);
         if (s) {
             try {
                chartRef.current?.removeSeries(s);
             } catch {}
             indicatorSeriesRef.current.delete(key);
         }
     });

    activeIndicators.forEach(ind => {
        let data: { time: Time; value: number }[] = [];
        let color = '#2962FF';
        
        try {
            if (ind === 'SMA 20') {
            data = calculateSMA(candleData, 20);
            color = '#FFA726';
            } else if (ind === 'EMA 50') {
            data = calculateEMA(candleData, 50);
            color = '#2962FF';
            } else if (ind === 'SMA 200') {
            data = calculateSMA(candleData, 200);
            color = '#F44336';
            } else if (ind === 'RSI 14') {
            data = calculateRSI(candleData, 14);
            color = '#FFEB3B';
            }

            if (data.length > 0) {
            const lineSeries = chartRef.current?.addSeries(LineSeries, {
                color,
                lineWidth: 3,
                title: ind,
            });
            if (lineSeries) {
                lineSeries.setData(data);
                indicatorSeriesRef.current.set(ind, lineSeries);
            }
            }
        } catch (e) {
            console.error("Error adding indicator:", e);
        }
     });

  }, [activeIndicators, candleData, chartUpdateTrigger]);



  // Draw Signal Lines (Now handled in renderSVGElements for better control)
  useEffect(() => {
    // Cleanup legacy price lines if any
    priceLinesRef.current.forEach(line => {
      try {
        if (seriesRef.current) seriesRef.current.removePriceLine(line);
      } catch {}
    });
    priceLinesRef.current = [];
  }, [activeSignal, showSignalLines]); 

  // Global Event Listeners for Dragging
  useEffect(() => {
    if (!isDragging || !initialDrawingState || !dragStart || !chartRef.current || !seriesRef.current) return;

    const getClientCoordinates = (e: MouseEvent | TouchEvent) => {
        if ('touches' in e) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    };

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
        // Prevent default on touch to stop scrolling while dragging
        if ('touches' in e && e.cancelable) {
            e.preventDefault();
        }

        const coords = getClientCoordinates(e);
        const deltaX = coords.x - dragStart.x;
        const deltaY = coords.y - dragStart.y;
        
        // Convert initial P1/P2 to coordinates
        const x1_orig = chartRef.current!.timeScale().timeToCoordinate(initialDrawingState.p1.time);
        const y1_orig = seriesRef.current!.priceToCoordinate(initialDrawingState.p1.price);
        const x2_orig = chartRef.current!.timeScale().timeToCoordinate(initialDrawingState.p2.time);
        const y2_orig = seriesRef.current!.priceToCoordinate(initialDrawingState.p2.price);

        if (x1_orig !== null && y1_orig !== null && x2_orig !== null && y2_orig !== null) {
            const x1_new = (x1_orig as number) + deltaX;
            const y1_new = (y1_orig as number) + deltaY;
            const x2_new = (x2_orig as number) + deltaX;
            const y2_new = (y2_orig as number) + deltaY;

            const t1_new = chartRef.current!.timeScale().coordinateToTime(x1_new);
            const p1_new = seriesRef.current!.coordinateToPrice(y1_new);
            const t2_new = chartRef.current!.timeScale().coordinateToTime(x2_new);
            const p2_new = seriesRef.current!.coordinateToPrice(y2_new);

            if (t1_new && p1_new && t2_new && p2_new) {
                 setDrawings(prev => prev.map(d => d.id === initialDrawingState.id ? {
                     ...d,
                     p1: { time: t1_new as Time, price: p1_new },
                     p2: { time: t2_new as Time, price: p2_new }
                 } : d));
            }
        }
    };

    const handleGlobalUp = () => {
        setIsDragging(false);
        setDragStart(null);
        setInitialDrawingState(null);
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalUp);

    return () => {
        window.removeEventListener('mousemove', handleGlobalMove);
        window.removeEventListener('mouseup', handleGlobalUp);
        window.removeEventListener('touchmove', handleGlobalMove);
        window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isDragging, initialDrawingState, dragStart]);

  // Overlay Drawing Handlers
  const handleOverlayStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (drawingTool === 'cursor' || drawingTool === 'horizontal' || !chartRef.current || !seriesRef.current) return;
    
    // Prevent default to stop scrolling on mobile while drawing
    // We check cancelable to avoid errors with passive listeners if any
    if ('touches' in e && e.cancelable) {
        e.preventDefault();
    }

    const rect = e.currentTarget.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const time = chartRef.current.timeScale().coordinateToTime(x);
    const price = seriesRef.current.coordinateToPrice(y);
    
    if (time && price) {
        setCurrentDrawing({
            type: drawingTool,
            p1: { time: time as Time, price },
            p2: { time: time as Time, price },
            color: '#2962FF',
            width: drawingTool === 'trend' || drawingTool === 'rectangle' ? 2 : 1
        });
    }
  };

  const handleOverlayMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!currentDrawing || !chartRef.current || !seriesRef.current) return;
    
    if ('touches' in e && e.cancelable) {
        e.preventDefault();
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const time = chartRef.current.timeScale().coordinateToTime(x);
    const price = seriesRef.current.coordinateToPrice(y);
    
    if (time && price) {
        setCurrentDrawing(prev => ({
            ...prev,
            p2: { time: time as Time, price }
        }));
    }
  };

  const handleOverlayEnd = () => {
    if (isDragging) return;

    if (currentDrawing && currentDrawing.p1 && currentDrawing.p2) {
        setDrawings(prev => [...prev, { ...currentDrawing, id: Math.random().toString() } as Drawing]);
        setCurrentDrawing(null);
        setDrawingTool('cursor');
        toast.success('Shape drawn');
    }
  };

  // Keyboard Event for Deletion (Delete / Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDrawingId) {
        setDrawings(prev => prev.filter(d => d.id !== selectedDrawingId));
        setSelectedDrawingId(null);
        toast.success("Drawing deleted");
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDrawingId]);

  // Render SVG Drawings & Signal Zones
  const renderSVGElements = useMemo(() => {
    if (!chartRef.current || !seriesRef.current) return null;
    
    const items = [...drawings];
    if (currentDrawing && currentDrawing.p1 && currentDrawing.p2) {
        items.push({ ...currentDrawing, id: 'preview' } as Drawing);
    }

    const drawingElements = items.map(d => {
        const x1 = chartRef.current?.timeScale().timeToCoordinate(d.p1.time);
        const y1 = seriesRef.current?.priceToCoordinate(d.p1.price);
        const x2 = chartRef.current?.timeScale().timeToCoordinate(d.p2.time);
        const y2 = seriesRef.current?.priceToCoordinate(d.p2.price);
        
        if (x1 === undefined || x1 === null || y1 === undefined || y1 === null || x2 === undefined || x2 === null || y2 === undefined || y2 === null) return null;
        
        const cx1 = x1 as number;
        const cy1 = y1 as number;
        const cx2 = x2 as number;
        const cy2 = y2 as number;

        const isSelected = selectedDrawingId === d.id;
        const baseColor = d.color;
        const strokeColor = isSelected ? '#ffffff' : baseColor;
        const baseWidth = d.width ?? (d.type === 'trend' || d.type === 'rectangle' ? 2 : 1);
        const strokeWidth = isSelected ? baseWidth + 1 : baseWidth;
        
        const handleClick = (e: React.MouseEvent) => {
             e.stopPropagation();
             if (d.id !== 'preview') setSelectedDrawingId(d.id === selectedDrawingId ? null : d.id);
        };

        const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
             if (selectedDrawingId !== d.id) return;
             e.stopPropagation();
             if ('touches' in e && e.cancelable) {
                 e.preventDefault();
             }
             setIsDragging(true);
             let clientX, clientY;
             if ('touches' in e) {
                 clientX = e.touches[0].clientX;
                 clientY = e.touches[0].clientY;
             } else {
                 clientX = (e as React.MouseEvent).clientX;
                 clientY = (e as React.MouseEvent).clientY;
             }
             setDragStart({ x: clientX, y: clientY });
             setInitialDrawingState(d);
        };

        let content = null;

        if (d.type === 'trend') {
            content = (
                <g>
                    {/* Hit Area */}
                    <line 
                        x1={cx1} y1={cy1} x2={cx2} y2={cy2} 
                        stroke="transparent" strokeWidth="20" 
                    />
                    <line 
                        x1={cx1} y1={cy1} x2={cx2} y2={cy2} 
                        stroke={strokeColor} strokeWidth={strokeWidth} 
                    />
                </g>
            );
        } else if (d.type === 'rectangle') {
            const x = Math.min(cx1, cx2);
            const y = Math.min(cy1, cy2);
            const w = Math.abs(cx2 - cx1);
            const h = Math.abs(cy2 - cy1);
            content = (
                <rect 
                    x={x} y={y} width={w} height={h} 
                    stroke={strokeColor} strokeWidth={strokeWidth} fill={`${baseColor}20`} 
                />
            );
        } else if (d.type === 'fib') {
            const dy = cy2 - cy1;
            const priceDiff = d.p2.price - d.p1.price;
            const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
            content = (
                <g>
                    {/* Hit Area */}
                    <rect 
                        x={Math.min(cx1, cx2)} y={Math.min(cy1, cy2)} 
                        width={Math.abs(cx2 - cx1)} height={Math.abs(cy2 - cy1)} 
                        fill="transparent" 
                    />
                    {levels.map(l => {
                        const y = cy1 + dy * l;
                        const price = d.p1.price + priceDiff * l;
                        // Format price based on magnitude
                        const formattedPrice = price >= 1000 ? price.toFixed(2) : price.toFixed(4);
                        const text = `${l} (${formattedPrice})`;
                        // Approx width calculation
                        const textWidth = text.length * 6 + 12; 
                        
                        return (
                            <g key={l}>
                                <line 
                                    x1={cx1} y1={y} 
                                    x2={cx2} y2={y} 
                                    stroke={strokeColor} strokeWidth={d.width ?? 1} strokeDasharray="4 2"
                                />
                                {/* Label Badge */}
                                <rect 
                                    x={cx1} y={y - 15} 
                                    width={textWidth} height={14} 
                                    rx="4"
                                    fill={strokeColor} 
                                    fillOpacity="0.85"
                                />
                                <text 
                                    x={cx1 + 6} y={y - 8} 
                                    fill="#FFFFFF" fontSize="10" fontWeight="bold"
                                    dominantBaseline="middle"
                                >
                                    {text}
                                </text>
                            </g>
                        );
                    })}
                    <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke={strokeColor} strokeWidth={d.width ?? 1} strokeDasharray="2 2" opacity="0.5" />
                </g>
            );
        } else if (d.type === 'long') {
             const entryY = cy1;
             const slY = cy2;
             const width = Math.abs(cx2 - cx1) + 50; 
             
             content = (
                 <g>
                    <rect 
                        x={cx1} y={Math.min(entryY, slY)} 
                        width={width} height={Math.abs(entryY - slY)} 
                        fill="#F23645" fillOpacity="0.2" stroke="#F23645" strokeWidth={d.width ?? 1}
                    />
                    <rect 
                        x={cx1} y={entryY - (slY - entryY) * 1.5} 
                        width={width} height={Math.abs(slY - entryY) * 1.5} 
                        fill="#089981" fillOpacity="0.2" stroke="#089981" strokeWidth={d.width ?? 1}
                    />
                    <text x={cx1} y={entryY - 5} fill="#d1d4dc" fontSize="10">Long Position</text>
                 </g>
             );
        } else if (d.type === 'volprofile') {
             const t1 = d.p1.time as number; 
             const t2 = d.p2.time as number;
             const rangeData = candleData.filter(c => (c.time as number) >= Math.min(t1, t2) && (c.time as number) <= Math.max(t1, t2));
             if (rangeData.length > 0) {
                 const minPrice = Math.min(...rangeData.map(c => c.low));
                 const maxPrice = Math.max(...rangeData.map(c => c.high));
                 const bins = 20;
                 const binSize = (maxPrice - minPrice) / bins;
                 const volumeProfile = new Array(bins).fill(0);
                 rangeData.forEach(c => {
                     const binIndex = Math.floor((c.close - minPrice) / binSize);
                     if (binIndex >= 0 && binIndex < bins) volumeProfile[binIndex] += Math.abs(c.close - c.open) * 1000; 
                 });
                 const maxVol = Math.max(...volumeProfile);
                 const pocIndex = volumeProfile.indexOf(maxVol);
                 const profileWidth = Math.abs(cx2 - cx1);
                 
                 const formatVol = (n: number) => {
                     if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
                     if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
                     return Math.round(n).toString();
                 };
                 
                 content = (
                     <g opacity="0.9" filter="url(#shadow-3d)">
                         {volumeProfile.map((vol, i) => {
                             const price = minPrice + i * binSize;
                             const y = seriesRef.current?.priceToCoordinate(price);
                             const barWidth = (vol / maxVol) * profileWidth;
                             const h = Math.abs((seriesRef.current?.priceToCoordinate(price + binSize) ?? 0) - (y as number)) - 1;
                             
                             if (y === null || y === undefined) return null;
                             
                             const isPoc = i === pocIndex;

                             return (
                                 <g key={i}>
                                    <rect 
                                        x={Math.min(cx1, cx2)} y={y as number} 
                                        width={barWidth} height={h}
                                        fill={isPoc ? "rgba(255, 179, 0, 0.5)" : "rgba(41, 98, 255, 0.4)"}
                                        rx="4"
                                        stroke={isPoc ? "#FFB300" : "#2962FF"}
                                        strokeWidth="1"
                                    />
                                    {barWidth > 30 && (
                                        <text
                                            x={Math.min(cx1, cx2) + barWidth - 6}
                                            y={(y as number) + h / 2 + 1}
                                            fill="#FFFFFF"
                                            fontSize="10"
                                            fontWeight="bold"
                                            textAnchor="end"
                                            dominantBaseline="middle"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {formatVol(vol)}
                                        </text>
                                    )}
                                 </g>
                             );
                         })}
                         {/* POC Line */}
                         {pocIndex !== -1 && (() => {
                             const pocPrice = minPrice + pocIndex * binSize + binSize / 2;
                             const pocY = seriesRef.current?.priceToCoordinate(pocPrice);
                             if (pocY !== null) {
                                 return (
                                     <line 
                                        x1={Math.min(cx1, cx2)} 
                                        y1={pocY} 
                                        x2={Math.max(cx1, cx2)} 
                                        y2={pocY} 
                                        stroke="#FFB300" 
                                        strokeWidth="2" 
                                        strokeDasharray="4 4" 
                                     />
                                 );
                             }
                             return null;
                         })()}
                         <rect x={Math.min(cx1, cx2)} y={Math.min(cy1, cy2)} width={Math.abs(cx2 - cx1)} height={Math.abs(cy2 - cy1)} fill="none" stroke="#787B86" strokeDasharray="4 4" strokeOpacity="0.5" />
                     </g>
                 );
             }
        } 

        return (
            <g key={d.id} onClick={handleClick} onMouseDown={handleStart} onTouchStart={handleStart} style={{ cursor: isSelected ? 'grab' : 'pointer', pointerEvents: 'all' }}>
                {content}
                {isSelected && (
                     <g>
                         <circle cx={cx1} cy={cy1} r="5" fill="white" stroke="#2962FF" strokeWidth="2" />
                         <circle cx={cx2} cy={cy2} r="5" fill="white" stroke="#2962FF" strokeWidth="2" />
                         
                         {/* Floating Delete Button (TradingView Style) */}
                         <g 
                            onClick={(e) => {
                                e.stopPropagation();
                                setDrawings(prev => prev.filter(drawing => drawing.id !== d.id));
                                setSelectedDrawingId(null);
                                toast.success("Drawing deleted");
                            }}
                            style={{ cursor: 'pointer' }}
                            transform={`translate(${cx2 + 15}, ${cy2 - 15})`}
                         >
                            <circle r="10" fill="#0A0A0A" stroke="#333333" strokeWidth="1" />
                            <circle r="10" fill="#F23645" fillOpacity="0.2" />
                            <line x1="-3" y1="-3" x2="3" y2="3" stroke="#F23645" strokeWidth="2" />
                            <line x1="3" y1="-3" x2="-3" y2="3" stroke="#F23645" strokeWidth="2" />
                         </g>
                     </g>
                )}
            </g>
        );
    });



    let signalZones = null;
    if (activeSignal && showSignalLines) {
        const { entry, stopLoss, tp1, tp2, tp3, tp4, type } = activeSignal;
        
        if (entry && stopLoss && tp1) {
            const yEntry = seriesRef.current.priceToCoordinate(parseFloat(entry));
            const ySL = seriesRef.current.priceToCoordinate(parseFloat(stopLoss));
            
            const tps = [tp1, tp2, tp3, tp4].filter((t): t is string => !!t).map(t => parseFloat(t));
            const targetPrice = type === 'Buy' || type === 'buy' 
                ? Math.max(...tps) 
                : Math.min(...tps);
            
            const yTarget = seriesRef.current.priceToCoordinate(targetPrice);

            if (yEntry !== null && ySL !== null && yTarget !== null) {
                const width = chartContainerRef.current?.clientWidth || 0;
                
                signalZones = (
                    <>
                        <rect 
                            key="sl-zone"
                            x={0} 
                            y={Math.min(yEntry, ySL)} 
                            width={width} 
                            height={Math.abs(yEntry - ySL)} 
                            fill="#F23645" 
                            fillOpacity="0.12" 
                        />
                        <rect 
                            key="tp-zone"
                            x={0} 
                            y={Math.min(yEntry, yTarget)} 
                            width={width} 
                            height={Math.abs(yEntry - yTarget)} 
                            fill="#089981" 
                            fillOpacity="0.12" 
                        />
                    </>
                );
            }
        }
    }

    // Signal Lines & Labels (Custom SVG to handle overlap - TradingView Style)
    let signalLineElements = null;
    if (activeSignal && showSignalLines && chartContainerRef.current) {
        const { entry, stopLoss, tp1, tp2, tp3, tp4 } = activeSignal;
        const width = chartContainerRef.current.clientWidth;
        
        const levels = [
            { price: parseFloat(entry), label: 'Entry', color: '#2962FF' },
            { price: parseFloat(stopLoss), label: 'SL', color: '#F23645' },
            { price: parseFloat(tp1), label: 'TP1', color: '#089981' },
            tp2 ? { price: parseFloat(tp2), label: 'TP2', color: '#089981' } : null,
            tp3 ? { price: parseFloat(tp3), label: 'TP3', color: '#089981' } : null,
            tp4 ? { price: parseFloat(tp4), label: 'TP4', color: '#089981' } : null,
        ].filter(l => l && !isNaN(l.price)) as { price: number; label: string; color: string }[];

        // Calculate Y positions
        const items = levels.map(l => {
            const y = seriesRef.current?.priceToCoordinate(l.price);
            return { ...l, y };
        }).filter(l => l.y !== null && l.y !== undefined) as { price: number; label: string; color: string; y: number }[];

        // Sort by Y to handle overlap
        items.sort((a, b) => a.y - b.y);

        // Collision Detection for Labels
        const labelHeight = 22;
        const adjustedItems = [];
        
        for (let i = 0; i < items.length; i++) {
            const item = { ...items[i], labelY: items[i].y };
            
            // Check collision with previous
            if (i > 0) {
                const prev = adjustedItems[i - 1];
                if (item.labelY < prev.labelY + labelHeight) {
                    item.labelY = prev.labelY + labelHeight + 1; // Shift down
                }
            }
            adjustedItems.push(item);
        }

        signalLineElements = adjustedItems.map((item, i) => (
            <g key={`sig-${i}`}>
                {/* Line */}
                <line 
                    x1={0} y1={item.y} x2={width - 85} y2={item.y} 
                    stroke={item.color} strokeWidth={1.5} 
                    strokeDasharray={item.label === 'Entry' ? '' : '6 4'}
                    opacity="0.9"
                />
                
                {/* Connecting Line if shifted */}
                {Math.abs(item.y - item.labelY) > 2 && (
                    <path 
                        d={`M ${width - 85} ${item.y} L ${width - 75} ${item.labelY}`}
                        stroke={item.color} strokeWidth={1} fill="none" opacity="0.6"
                    />
                )}

                {/* Label Badge (TradingView Style) */}
                <g transform={`translate(${width - 80}, ${item.labelY - 11})`}>
                    {/* Background */}
                    <path 
                        d="M 2 0 L 78 0 C 79.1 0 80 0.9 80 2 L 80 20 C 80 21.1 79.1 22 78 22 L 2 22 C 0.9 22 0 21.1 0 20 L 0 2 Z" 
                        fill={item.color} 
                        stroke={item.color}
                        strokeWidth="1"
                    />
                    {/* Label Text */}
                    <text 
                        x={5} y={15} 
                        fill="white" fontSize="10" fontWeight="bold"
                    >
                        {item.label}
                    </text>
                    {/* Divider */}
                    <line x1={32} y1={4} x2={32} y2={18} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    {/* Price Text */}
                    <text 
                        x={36} y={15} 
                        fill="white" fontSize="10" fontFamily="monospace"
                    >
                        {item.price.toFixed(2)}
                    </text>
                </g>
            </g>
        ));
    }

    // Support & Resistance (Fractals)
    let fractalElements = null;
    if (showSupportResistance && candleData.length > 0) {
        const fractals = calculateFractals(candleData);
        fractalElements = fractals.map((f, i) => {
             const x = chartRef.current?.timeScale().timeToCoordinate(f.time);
             const y = seriesRef.current?.priceToCoordinate(f.price);
             if (x === null || x === undefined || y === null || y === undefined) return null;
             return (
                 <g key={`fr-${i}`}>
                     {f.type === 'up' ? (
                         <path d={`M ${x-5} ${y-15} L ${x+5} ${y-15} L ${x} ${y-5} Z`} fill="#F23645" />
                     ) : (
                         <path d={`M ${x-5} ${y+15} L ${x+5} ${y+15} L ${x} ${y+5} Z`} fill="#089981" />
                     )}
                 </g>
             );
        });
    }

    // Orderflow / Footprint Mode removed

    return (
        <>
            <defs>
                {/* Professional 3D Neon Gradients for Orderflow */}
                <linearGradient id="grad-buy-3d" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(0, 227, 150, 0.6)" />
                    <stop offset="50%" stopColor="rgba(0, 227, 150, 0.2)" />
                    <stop offset="100%" stopColor="rgba(0, 227, 150, 0.4)" />
                </linearGradient>
                <linearGradient id="grad-sell-3d" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255, 69, 96, 0.6)" />
                    <stop offset="50%" stopColor="rgba(255, 69, 96, 0.2)" />
                    <stop offset="100%" stopColor="rgba(255, 69, 96, 0.4)" />
                </linearGradient>

                {/* Vertical Gradient for Horizontal Cylinder Effect (VolProfile) - TradingView Style */}
                <linearGradient id="grad-neutral-3d" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(93, 96, 107, 0.6)" />
                    <stop offset="30%" stopColor="rgba(42, 46, 57, 0.6)" />
                    <stop offset="100%" stopColor="rgba(19, 23, 34, 0.6)" />
                </linearGradient>

                <linearGradient id="shine-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                    <stop offset="20%" stopColor="rgba(255,255,255,0)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                
                {/* Filters for Glow and Shadow */}
                <filter id="shadow-3d" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                    <feOffset dx="1" dy="1" result="offsetblur" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* New Glow Filter for Neon Effect */}
                <filter id="glow-3d" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                    <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
                    <feComposite in="offsetBlur" in2="SourceAlpha" operator="out" result="outerBlur" />
                    <feMerge>
                        <feMergeNode in="outerBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {signalZones}
            {signalLineElements}
            {fractalElements}
            {drawingElements}
        </>
    );
  }, [drawings, currentDrawing, candleData, activeSignal, showSignalLines, selectedDrawingId, showSupportResistance]);

  // Handlers
  const handleScreenshot = () => {
    if (!chartContainerRef.current) return;
    
    // 1. Get Base Chart Canvas
    const baseCanvas = chartContainerRef.current.querySelector('canvas') as HTMLCanvasElement | null;
    if (!baseCanvas) return;

    // 2. Get SVG Overlay
    // The SVG is a sibling of the chartContainerRef div within the parent wrapper
    const wrapper = chartContainerRef.current.parentElement;
    const svgOverlay = wrapper?.querySelector('svg') as SVGSVGElement | null;

    // 3. Create Export Canvas (High Resolution)
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = baseCanvas.width;
    exportCanvas.height = baseCanvas.height;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // 4. Draw Chart Base
    ctx.drawImage(baseCanvas, 0, 0);

    const downloadFromCanvas = (canvas: HTMLCanvasElement) => {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${symbol}-chart.png`;
      link.href = url;
      link.click();
    };

    // 5. Draw SVG Overlay (if exists)
    if (svgOverlay && wrapper) {
      try {
        // Clone SVG to set explicit dimensions without affecting DOM
        const svgClone = svgOverlay.cloneNode(true) as SVGSVGElement;
        
        // Set explicit width/height to match container's CSS dimensions
        // This ensures the SVG coordinate system (CSS pixels) matches the visual state
        const width = chartContainerRef.current.clientWidth;
        const height = chartContainerRef.current.clientHeight;
        svgClone.setAttribute("width", `${width}`);
        svgClone.setAttribute("height", `${height}`);
        
        // Serialize to string
        const serializer = new XMLSerializer();
        const svgData = serializer.serializeToString(svgClone);
        
        // Create Blob
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
          // Draw SVG scaled to match the HiDPI canvas
          // The SVG (CSS pixels) will be scaled up to fill the Canvas (Physical pixels)
          ctx.drawImage(img, 0, 0, exportCanvas.width, exportCanvas.height);
          URL.revokeObjectURL(url);
          downloadFromCanvas(exportCanvas);
        };
        img.onerror = (e) => {
          console.error("SVG Load Error:", e);
          downloadFromCanvas(exportCanvas); // Fallback
        };
        img.src = url;
      } catch (e) {
        console.error("Screenshot Composition Error:", e);
        downloadFromCanvas(exportCanvas);
      }
    } else {
      downloadFromCanvas(exportCanvas);
    }
  };

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          chartContainerRef.current?.requestFullscreen();
      } else {
          document.exitFullscreen();
      }
  };

  const toggleIndicator = (ind: string) => {
     setActiveIndicators(prev => 
        prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
     );
  };

  // Drawing Tool Helper
  const toggleDrawingTool = (tool: 'cursor' | 'horizontal' | 'trend' | 'rectangle' | 'fib' | 'long' | 'volprofile') => {
      setDrawingTool(tool === drawingTool ? 'cursor' : tool);
      if (tool !== 'cursor') {
          toast.info(`Select two points for ${tool}`);
      }
  };

  const handleClearAll = () => {
      setDrawings([]);
      setActiveIndicators([]);
      setShowSignalLines(false);
      toast.info("Chart cleared completely");
  };



  const handleDeleteSelectedDrawing = () => {
      if (selectedDrawingId) {
          setDrawings(prev => prev.filter(d => d.id !== selectedDrawingId));
          setSelectedDrawingId(null);
          toast.success("Drawing deleted");
      }
  };

  const handleAutoCalibrate = async () => {
      setIsCalibrating(true);
      try {
          // 1. Get Binance Price (PAXGUSDT)
          const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT');
          const binanceData = await binanceRes.json();
          const binancePrice = parseFloat(binanceData.price);

          // 2. Get Real Market Price (XAUUSD) via our Proxy API
          const realRes = await fetch('/api/market-price');
          const realData = await realRes.json();
          
          if (!realData.price || !binancePrice) {
             throw new Error("Failed to fetch prices");
          }

          const realPrice = parseFloat(realData.price);
          
          // 3. Calculate and Set Offset
          const offset = realPrice - binancePrice;
          setPriceOffset(parseFloat(offset.toFixed(2)));
          toast.success(`Calibrated! Offset: ${offset.toFixed(2)}`);
      } catch {
          console.error("Calibration failed");
          toast.error("Calibration failed. Try again.");
      } finally {
          setIsCalibrating(false);
      }
  };

  return (
    <div className="relative flex h-full w-full bg-[#020408] font-sans text-[#d1d4dc] overflow-hidden selection:bg-[#2962FF] selection:text-white group/chart">
      
      {/* Empty State / Expired Subscription Overlay */}
      {allowedPairs.length === 0 && (
          <div className="absolute inset-0 z-100 flex items-center justify-center bg-[#020408] backdrop-blur-md">
              <div className="relative z-10 max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-white/5 bg-[#0A0A0A]/80 shadow-2xl">
                  {/* Icon */}
                  <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                      <Lock className="w-8 h-8 text-red-500" />
                  </div>

                  {/* Text */}
                  <div className="space-y-3" dir="rtl">
                      <h2 className="text-2xl font-black tracking-tight text-white">
                          لا توجد أصول نشطة
                      </h2>
                      <p className="text-gray-400 text-base leading-relaxed">
                          اشتراكك الحالي لا يتضمن أي أزواج تداول، أو أن خطتك قد انتهت.
                      </p>
                  </div>

                  {/* Action */}
                  <Button asChild className="w-full h-11 bg-[#2962FF] hover:bg-[#2962FF]/90 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(41,98,255,0.3)] transition-all hover:scale-[1.02]">
                      <Link href={`/${locale}/payment`}>
                          تحديث خطة الاشتراك
                      </Link>
                  </Button>
              </div>
          </div>
      )}

      <style>{`
        /* Hide TradingView Attribution */
        .tv-lightweight-charts table tr td:last-child span a[href*="tradingview.com"],
        .tv-lightweight-charts a[href*="tradingview.com"],
        a[href*="tradingview.com"] {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
        }
      `}</style>
      
      {/* Top Floating Control Island */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1 rounded-full border border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all hover:bg-[#0A0A0A]/95 hover:scale-[1.02] max-w-[95vw] overflow-x-auto scrollbar-hide">
        
        {/* Symbol Selector */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-4 py-1.5 border-r border-white/5 pr-4 mr-1 hover:bg-white/5 transition-colors rounded-lg group">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-[#2962FF] to-[#0039CB] text-[10px] font-black text-white shadow-[0_0_15px_#2962FF] group-hover:scale-110 transition-transform">
                        {symbol?.substring(0, 1)}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-black tracking-tight text-white leading-none">{symbol}</span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white/70 transition-colors">Crypto</span>
                    </div>
                    <ChevronDown size={14} className="text-gray-500 ml-1 group-hover:text-white transition-colors" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-40 border border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl p-1 text-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-xl z-50 max-h-100 overflow-y-auto">
                {['Metals', 'Crypto', 'Forex', 'Indices'].map(category => {
                    const categorySymbols = allowedPairs.filter(s => SYMBOL_CATEGORIES[s] === category);
                    if (categorySymbols.length === 0) return null;
                    
                    return (
                        <div key={category}>
                             <DropdownMenuLabel className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2 py-1.5 mt-1">{category}</DropdownMenuLabel>
                             {categorySymbols.map(s => (
                                <DropdownMenuItem 
                                    key={s}
                                    onClick={() => setSymbol(s)}
                                    className={`cursor-pointer rounded-lg px-3 py-2 text-xs hover:bg-white/5 focus:bg-white/5 font-bold transition-colors flex items-center justify-between ${symbol === s ? 'text-[#2962FF] bg-[#2962FF]/10' : 'text-gray-300'}`}
                                >
                                    {s}
                                    {symbol === s && <Check size={14} />}
                                </DropdownMenuItem>
                             ))}
                             <div className="h-px bg-white/5 mx-2 my-1" />
                        </div>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>

        {/* Countdown Timer */}
        {candleCountdown && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#2962FF]/10 rounded-full border border-[#2962FF]/20 text-[10px] font-mono font-bold mx-2 shadow-[0_0_10px_rgba(41,98,255,0.2)]">
                <Clock size={12} className="text-[#2962FF] animate-pulse" />
                <span className="text-[#2962FF] tracking-widest">{candleCountdown}</span>
            </div>
        )}

        {/* Timeframes */}
        <div className="flex items-center gap-0.5 bg-[#050505] rounded-full p-1 border border-white/5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => {
                  setTimeframe(tf.value);
                  onTimeframeChange?.(tf.value);
                }}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all duration-300 ${
                    timeframe === tf.value 
                    ? 'text-white bg-[#2962FF] shadow-[0_0_10px_rgba(41,98,255,0.4)]' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {tf.label}
              </button>
            ))}
        </div>

        <div className="w-px h-6 bg-white/10 mx-2" />

        {/* Tools */}
        <div className="flex items-center gap-1 pr-2">
             <button 
                onClick={() => { setShowSignalLines(!showSignalLines); }}
                className={`p-2 rounded-full hover:bg-white/10 transition-all duration-300 ${showSignalLines ? 'text-[#2962FF] bg-[#2962FF]/10' : 'text-gray-400'}`}
                title="Toggle Signals"
            >
                <Layers size={16} />
            </button>
            <button 
                onClick={() => setShowTrendFinder(!showTrendFinder)}
                className={`p-2 rounded-full hover:bg-white/10 transition-all duration-300 ${showTrendFinder ? 'text-[#FF6D00] bg-[#FF6D00]/10 shadow-[0_0_10px_rgba(255,109,0,0.2)]' : 'text-gray-400'}`}
                title="AI Trend Finder"
            >
                <TrendingUp size={16} />
            </button>
            <button 
                onClick={() => setShowAnalysisLines(!showAnalysisLines)}
                className={`p-2 rounded-full hover:bg-white/10 transition-all duration-300 ${showAnalysisLines ? 'text-[#9C27B0] bg-[#9C27B0]/10 shadow-[0_0_10px_rgba(156,39,176,0.2)]' : 'text-gray-400'}`}
                title="Toggle Analysis Levels (R/S)"
            >
                <AlignJustify size={16} />
            </button>

             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                     <Settings size={16} />
                  </button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-65 max-h-[60vh] overflow-y-auto border border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl p-2 text-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-xl z-50 custom-scrollbar">
                   <DropdownMenuLabel className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">Indicators</DropdownMenuLabel>
                   

                   
                   <div className="h-px w-full bg-white/5 my-2" />
                   
                   {['SMA 20', 'EMA 50', 'RSI 14', 'SMA 200'].map(ind => (
                       <DropdownMenuCheckboxItem 
                          key={ind}
                          checked={activeIndicators.includes(ind)}
                          onCheckedChange={() => toggleIndicator(ind)}
                          className="cursor-pointer rounded-lg px-3 py-2.5 text-xs hover:bg-white/5 focus:bg-white/5 data-[state=checked]:text-[#2962FF] data-[state=checked]:bg-[#2962FF]/10 transition-colors font-medium"
                       >
                          {ind}
                       </DropdownMenuCheckboxItem>
                   ))}
                   
                   <div className="h-px w-full bg-white/5 my-2" />
                   <DropdownMenuLabel className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">Footprint</DropdownMenuLabel>
                   <div className="px-2 pb-2 space-y-3">
                       <div className="flex items-center justify-between">
                           <Label className="text-xs text-gray-300 font-medium">Font Size</Label>
                           <Input 
                               type="number" 
                               className="h-7 w-16 bg-[#050505] border-white/10 text-xs text-right"
                               value={footprintSettings.fontSize}
                               onChange={(e) => setFootprintSettings({ fontSize: Number(e.target.value) })}
                           />
                       </div>
                       <div className="flex items-center justify-between">
                           <Label className="text-xs text-gray-300 font-medium">Imbalance Ratio</Label>
                           <Input 
                               type="number" 
                               step="0.1"
                               className="h-7 w-16 bg-[#050505] border-white/10 text-xs text-right"
                               value={footprintSettings.imbalanceRatio}
                               onChange={(e) => setFootprintSettings({ imbalanceRatio: Number(e.target.value) })}
                           />
                       </div>
                       <DropdownMenuCheckboxItem
                            checked={footprintSettings.showDeltaSummary}
                            onCheckedChange={(c) => setFootprintSettings({ showDeltaSummary: !!c })}
                            className="cursor-pointer rounded-lg px-2 py-1.5 text-xs hover:bg-white/5 data-[state=checked]:text-[#2962FF]"
                       >
                            Show Delta Summary
                       </DropdownMenuCheckboxItem>
                   </div>

                   <div className="h-px w-full bg-white/5 my-2" />
                   <DropdownMenuLabel className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">HTF Profile</DropdownMenuLabel>
                   <div className="px-2 pb-2 space-y-3">
                       <DropdownMenuCheckboxItem
                            checked={htfSettings.enabled}
                            onCheckedChange={(c) => setHTFSettings({ enabled: !!c })}
                            className="cursor-pointer rounded-lg px-2 py-1.5 text-xs hover:bg-white/5 data-[state=checked]:text-[#2962FF]"
                       >
                            Enable HTF Profile
                       </DropdownMenuCheckboxItem>
                       
                       {htfSettings.enabled && (
                           <>
                               <div className="flex items-center justify-between">
                                   <Label className="text-xs text-gray-300 font-medium">Timeframe</Label>
                                   <div className="flex gap-1">
                                       {['Auto', '1H', '4H', '1D'].map((tf) => (
                                        <button
                                            key={tf}
                                            onClick={() => setHTFSettings({ timeframe: tf as HTFSettings['timeframe'] })}
                                            className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                                                htfSettings.timeframe === tf 
                                                   ? 'bg-[#2962FF] border-[#2962FF] text-white' 
                                                   : 'bg-transparent border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                                               }`}
                                           >
                                               {tf}
                                           </button>
                                       ))}
                                   </div>
                               </div>

                               <div className="flex items-center justify-between">
                                   <Label className="text-xs text-gray-300 font-medium">Width %</Label>
                                   <Input 
                                       type="number" 
                                       min="10" max="100"
                                       className="h-7 w-16 bg-[#050505] border-white/10 text-xs text-right"
                                       value={htfSettings.widthPercentage}
                                       onChange={(e) => setHTFSettings({ widthPercentage: Number(e.target.value) })}
                                   />
                               </div>

                               <div className="flex flex-col gap-2 pt-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-300 font-medium">Align Right</Label>
                                        <input 
                                            type="checkbox"
                                            checked={htfSettings.align === 'right'}
                                            onChange={(e) => setHTFSettings({ align: e.target.checked ? 'right' : 'left' })}
                                            className="accent-[#2962FF] h-3 w-3 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-300 font-medium">Show Profile</Label>
                                        <input 
                                            type="checkbox"
                                            checked={htfSettings.showProfile}
                                            onChange={(e) => setHTFSettings({ showProfile: e.target.checked })}
                                            className="accent-[#2962FF] h-3 w-3 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-300 font-medium">Show Outline</Label>
                                        <input 
                                            type="checkbox"
                                            checked={htfSettings.showOutline}
                                            onChange={(e) => setHTFSettings({ showOutline: e.target.checked })}
                                            className="accent-[#2962FF] h-3 w-3 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-300 font-medium">Show POC</Label>
                                        <input 
                                            type="checkbox"
                                            checked={htfSettings.showPOC}
                                            onChange={(e) => setHTFSettings({ showPOC: e.target.checked })}
                                            className="accent-[#2962FF] h-3 w-3 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-300 font-medium">Show Value Area</Label>
                                        <input 
                                            type="checkbox"
                                            checked={htfSettings.showValueArea}
                                            onChange={(e) => setHTFSettings({ showValueArea: e.target.checked })}
                                            className="accent-[#2962FF] h-3 w-3 cursor-pointer"
                                        />
                                    </div>
                               </div>
                           </>
                       )}
                   </div>

                   <div className="h-px w-full bg-white/5 my-2" />
                   <div className="px-2 py-2">
                        <Label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">Calibration</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                step="0.01"
                                className="h-9 border-white/10 bg-[#050505] text-xs rounded-lg focus:border-[#2962FF]/50 transition-colors"
                                value={priceOffset}
                                onChange={(e) => setPriceOffset(parseFloat(e.target.value) || 0)}
                            />
                            <Button 
                                size="sm" 
                                className="h-9 bg-[#2962FF] hover:bg-[#2962FF]/80 text-xs rounded-lg font-bold shadow-[0_0_15px_rgba(41,98,255,0.3)]"
                                onClick={handleAutoCalibrate}
                                disabled={isCalibrating}
                            >
                                {isCalibrating ? <RefreshCw className="animate-spin h-3 w-3" /> : 'Auto Sync'}
                            </Button>
                        </div>
                   </div>
                </DropdownMenuContent>
              </DropdownMenu>

           <div className="w-px h-6 bg-white/10 mx-2" />
           
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/10" onClick={toggleFullscreen}><Maximize2 size={16} /></Button>
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/10" onClick={handleScreenshot}><Camera size={16} /></Button>
           <div className="w-px h-6 bg-white/10 mx-2" />
           <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 rounded-full transition-colors ${showNotifications ? 'text-[#2962FF] bg-[#2962FF]/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`} 
                onClick={() => setShowNotifications(!showNotifications)}
            >
                <div className="relative">
                    <Bell size={16} />
                    {activeSignal && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                </div>
            </Button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative flex-1 h-full min-w-0 bg-[#020408] overflow-hidden">
            {/* Left Floating Toolbar */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 rounded-full bg-[#0A0A0A]/80 border border-white/5 p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-md transition-all hover:scale-[1.02]">
                {[
                    { id: 'cursor', icon: MousePointer2, label: 'Cursor' },
                    { id: 'trend', icon: TrendingUp, label: 'Trend Line' },
                    { id: 'horizontal', icon: Minus, label: 'Horz Line' },
                    { id: 'rectangle', icon: Square, label: 'Rectangle' },
                    { id: 'fib', icon: Activity, label: 'Fib Ret' },
                    { id: 'long', icon: TrendingUp, label: 'Long Pos', rotate: true },
                    { id: 'volprofile', icon: BarChart3, label: 'Vol Profile', rotate: true },
                ].map((tool) => (
                    <div 
                       key={tool.id}
                       className={`relative flex items-center justify-center rounded-full h-9 w-9 cursor-pointer transition-all duration-300 group/tool ${
                           drawingTool === tool.id 
                           ? 'text-white bg-linear-to-br from-[#2962FF] to-[#0039CB] shadow-[0_0_15px_#2962FF]' 
                           : 'text-gray-400 hover:text-white hover:bg-white/10'
                       }`}
                       onClick={() => tool.id === 'cursor' ? setDrawingTool('cursor') : tool.id === 'horizontal' ? setDrawingTool('horizontal') : toggleDrawingTool(tool.id as 'trend' | 'rectangle' | 'fib' | 'long' | 'volprofile')}
                       title={tool.label}
                    >
                       <tool.icon size={18} className={`transition-transform duration-300 ${tool.rotate ? 'rotate-90' : ''} ${drawingTool === tool.id ? 'scale-110' : 'group-hover/tool:scale-110'}`} />
                       
                       {/* Tooltip */}
                       <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:left-full md:ml-4 md:bottom-auto md:mb-0 md:translate-x-0 px-2 py-1 rounded bg-black border border-white/10 text-[10px] font-bold text-white opacity-0 group-hover/tool:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                           {tool.label}
                       </div>
                    </div>
                ))}

                {/* Footprint Toggle */}
                <div 
                   className={`relative flex items-center justify-center rounded-full h-9 w-9 cursor-pointer transition-all duration-300 group/tool ${
                       footprintSettings.enabled 
                       ? 'text-white bg-linear-to-br from-[#2962FF] to-[#0039CB] shadow-[0_0_15px_#2962FF]' 
                       : 'text-gray-400 hover:text-white hover:bg-white/10'
                   }`}
                   onClick={toggleFootprint}
                   title="Toggle Footprint"
                >
                   <Table size={18} className={`transition-transform duration-300 ${footprintSettings.enabled ? 'scale-110' : 'group-hover/tool:scale-110'}`} />
                   
                   <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 md:left-full md:ml-4 md:bottom-auto md:mb-0 md:translate-x-0 px-2 py-1 rounded bg-black border border-white/10 text-[10px] font-bold text-white opacity-0 group-hover/tool:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                       Footprint
                   </div>
                </div>

                <div className="md:h-px md:w-full md:my-1 w-px h-6 mx-1 bg-white/10" />
                <div 
                   className="flex items-center justify-center rounded-full h-9 w-9 cursor-pointer text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                   onClick={handleClearAll}
                   title="Clear All"
                >
                   <Trash2 size={18} />
                </div>
            </div>

            {/* Chart Container */}
            <div ref={chartContainerRef} className="h-full w-full cursor-crosshair" />
            
            {/* SVG Overlay */}
            <svg 
                className={`absolute inset-0 z-10 h-full w-full ${drawingTool !== 'cursor' && drawingTool !== 'horizontal' ? 'pointer-events-auto' : 'pointer-events-none'}`}
                onMouseDown={handleOverlayStart}
                onMouseMove={handleOverlayMove}
                onMouseUp={handleOverlayEnd}
                onTouchStart={handleOverlayStart}
                onTouchMove={handleOverlayMove}
                onTouchEnd={handleOverlayEnd}
            >
                {renderSVGElements}
            </svg>


            
             {/* Selected Drawing Edit HUD */}
             {selectedDrawingId && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#0A0A0A]/90 border border-white/10 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4">
                      <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Properties</span>
                      <div className="h-4 w-px bg-white/10" />
                      <input
                            type="color"
                            value={selectedDrawing?.color ?? '#2962FF'}
                            onChange={(e) => setDrawings(prev => prev.map(d => d.id === selectedDrawingId ? { ...d, color: e.target.value } : d))}
                            className="h-6 w-6 cursor-pointer bg-transparent border-none p-0 rounded-full overflow-hidden"
                        />
                        <input
                            type="range"
                            min={1} max={5}
                            value={selectedDrawing?.width ?? 2}
                            onChange={(e) => setDrawings(prev => prev.map(d => d.id === selectedDrawingId ? { ...d, width: parseInt(e.target.value) } : d))}
                            className="w-20 accent-[#2962FF] h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                        />
                        <div className="h-4 w-px bg-white/10" />
                        <button onClick={handleDeleteSelectedDrawing} className="text-gray-400 hover:text-[#F23645] transition-colors p-1 hover:bg-[#F23645]/10 rounded-full">
                            <Trash2 size={16} />
                        </button>
                  </div>
              )}

              {/* Watermark - Modern */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-[0.03] pointer-events-none select-none z-0">
                 <span className="text-[180px] font-black tracking-tighter text-white leading-none">{symbol?.split('/')[0]}</span>
                 <span className="text-[40px] font-bold tracking-[1em] text-white uppercase mt-4">Novia AI</span>
              </div>
        </div>

          {/* Notifications Slide-over Sidebar */}
          <div className={`h-full bg-[#050505]/95 backdrop-blur-xl border-l border-white/10 z-50 transition-all duration-300 ease-in-out flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${showNotifications ? 'w-95 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
               <div className="w-95 h-full flex flex-col min-w-95">
               <div className="flex items-center justify-between p-4 border-b border-white/5">
                   <div className="flex items-center gap-2">
                       <div className="p-2 rounded-lg bg-[#2962FF]/10 text-[#2962FF]">
                           <Bell size={18} />
                       </div>
                       <div>
                           <h3 className="text-sm font-black uppercase tracking-wider text-white">Notifications</h3>
                       </div>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => setShowNotifications(false)} className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/10">
                       <X size={16} />
                   </Button>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* Live Signals Section */}
          <div className="h-full relative w-full">
            <SignalNotifications onSelectSignal={(sig) => setActiveSignal(sig)} />
          </div>
        </div>
             </div>
          </div>
        </div>
  );
}