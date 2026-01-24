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
  WhitespaceData
} from 'lightweight-charts';
import { FootprintSeries, FootprintData, FootprintLevel, FootprintSeriesOptions } from './plugins/FootprintSeries';
import { Button } from '@/components/ui/button';
import TradingViewWidget from './TradingViewWidget';
import SignalNotifications, { Signal } from './SignalNotifications';
import TradingViewTechnicalAnalysis from './TradingViewTechnicalAnalysis';
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
  Footprints,
  ChevronDown,
  Settings,
  X,
  Clock,
  AlignJustify,
  Check,
  Bell
} from 'lucide-react';
import { api } from '@/lib/api';
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
  type: 'trend' | 'rectangle' | 'fib' | 'long' | 'volprofile' | 'footprint';
  p1: { time: Time; price: number };
  p2: { time: Time; price: number };
  color: string;
  width?: number;
}

const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '3m', value: '3m' },
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

  // Generate Footprint Data (Mock)
  const generateFootprintData = (candle: CandleData): FootprintData => {
      const levels: FootprintLevel[] = [];
      
      // Dynamic tick size based on price magnitude
      let tickSize = 0.5;
      const range = candle.high - candle.low;
      
      if (range < 1) tickSize = 0.01;
      else if (range < 10) tickSize = 0.1;
      else if (range > 1000) tickSize = 5;
      
      // Ensure we don't have too many levels (performance)
      if (range / tickSize > 50) {
          tickSize = range / 20;
      }
      
      // Generate levels from Low to High
      for (let p = candle.low; p <= candle.high; p += tickSize) {
          // Random volumes
          const vol = Math.floor(Math.random() * 500) + 10;
          const buy = Math.floor(vol * Math.random());
          const sell = vol - buy;
          
          // Random imbalance
          let imbalance: 'buy' | 'sell' | 'none' = 'none';
          if (buy > sell * 3 && buy > 100) imbalance = 'buy';
          if (sell > buy * 3 && sell > 100) imbalance = 'sell';

          levels.push({
              price: p,
              buy,
              sell,
              volume: vol,
              imbalance
          });
      }

      return {
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          profile: levels
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
  const footprintSeriesRef = useRef<ISeriesApi<"Custom", Time, FootprintData | WhitespaceData<Time>, FootprintSeriesOptions> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const priceLinesRef = useRef<IPriceLine[]>([]);
  
  const [symbol, setSymbol] = useState(propSymbol);
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType] = useState<'candles' | 'area'>('candles');
  const [showSignalLines, setShowSignalLines] = useState(true);
  const [crosshairMode] = useState<CrosshairMode>(CrosshairMode.Normal);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [showOrderflow, setShowOrderflow] = useState(false);
  const [priceOffset, setPriceOffset] = useState(0);
  const [dataSource, setDataSource] = useState<'binance' | 'twelvedata'>('binance');
  const [twelveDataApiKey, setTwelveDataApiKey] = useState('');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false); // For continuous calibration
  const [candleUpColor] = useState('#089981');
  const [candleDownColor] = useState('#F23645');
  const [showSupportResistance] = useState(false);
  const [showTrendFinder, setShowTrendFinder] = useState(false);

  const [footprintFontScale, setFootprintFontScale] = useState(1.4);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialDrawingState, setInitialDrawingState] = useState<Drawing | null>(null);
  const analysisLinesRef = useRef<IPriceLine[]>([]);
  const [candleCountdown, setCandleCountdown] = useState<string | null>(null);
  const [showAnalysisLines, setShowAnalysisLines] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [allowedPairs, setAllowedPairs] = useState<string[]>(['XAUUSD', 'BTCUSDT', 'ETHUSDT', 'EURUSD', 'GBPUSD', 'US30', 'NAS100']);

  // Fetch User Subscription for Allowed Pairs
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await api.plans.getMySubscription();
        if (res && res.status === 'success' && res.data && Array.isArray(res.data.selectedPairs)) {
          const pairs = res.data.selectedPairs;
          if (pairs.length > 0) {
            setAllowedPairs(pairs);
            setSymbol(prev => pairs.includes(prev) ? prev : pairs[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch subscription pairs:", error);
      }
    };
    fetchSubscription();
  }, []);

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
  const [drawingTool, setDrawingTool] = useState<'cursor' | 'horizontal' | 'trend' | 'rectangle' | 'fib' | 'long' | 'volprofile' | 'footprint'>('cursor');
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
    const anchorMatch = message.match(/(?:Anchor Area|منطقة الارتكاز)\s*:?\s*([\d.]+)/i);
    const anchor = anchorMatch ? parseFloat(anchorMatch[1]) : null;

    // Resistances
    const resistanceMatches = Array.from(message.matchAll(/(?:Resistance|المقاومة).*?:\s*([\d.]+)/gi));
    const resistances = resistanceMatches
      .map(m => parseFloat(m[1]))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b); // Ascending (R1, R2, R3...)

    // Supports
    const supportMatches = Array.from(message.matchAll(/(?:Support|الدعم).*?:\s*([\d.]+)/gi));
    const supports = Array.from(new Set(
      supportMatches
        .map(m => parseFloat(m[1]))
        .filter(n => !isNaN(n))
    )).sort((a, b) => b - a); // Descending (S1, S2, S3...)

    return { type, anchor, resistances: Array.from(new Set(resistances)), supports };
  };

  // Draw Analysis Lines
  useEffect(() => {
    if (!seriesRef.current || !activeSignal?.message || !showAnalysisLines) {
      // Clear lines if no signal or no message
      analysisLinesRef.current.forEach(line => {
        try {
            seriesRef.current?.removePriceLine(line);
        } catch {}
      });
      analysisLinesRef.current = [];
      return;
    }

    const levels = parseAnalysisLevels(activeSignal.message);
    if (!levels) return;

    // Clear existing lines
    analysisLinesRef.current.forEach(line => {
        try {
            seriesRef.current?.removePriceLine(line);
        } catch {}
      });
      analysisLinesRef.current = [];

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

    // Draw Anchor
    if (levels.anchor) {
      const line = seriesRef.current.createPriceLine({
        price: levels.anchor,
        color: openColor,
        lineWidth: 3,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `${levels.type} Entry`,
      });
      analysisLinesRef.current.push(line);
    }

    // Draw Resistances
    levels.resistances.forEach((price, i) => {
      const line = seriesRef.current!.createPriceLine({
        price: price,
        color: mainColor,
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `R${i + 1}`,
      });
      analysisLinesRef.current.push(line);
    });

    // Draw Supports
    levels.supports.forEach((price, i) => {
      const line = seriesRef.current!.createPriceLine({
        price: price,
        color: mainColor,
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `S${i + 1}`,
      });
      analysisLinesRef.current.push(line);
    });

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

      // Add Footprint Series
      const footprintSeries = chart.addCustomSeries(new FootprintSeries(), {
        // Custom series options
      });
      footprintSeriesRef.current = footprintSeries;
       footprintSeries.applyOptions({ visible: showOrderflow });
       
       // Ensure correct initial visibility for candles
      series.applyOptions({ visible: !showOrderflow });

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
                const tdSymbol = symbol === 'XAUUSD' || symbol === 'GOLD' ? 'XAU/USD' : symbol;
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
                
                if (json.code === 401 || json.code === 400) {
                     toast.error(`TwelveData Error: ${json.message}`);
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
                toast.error("Failed to fetch from TwelveData");
            }
        } 
        // --- Binance Source (Default) ---
        else {
            let querySymbol = symbol;
            
            // Map Gold to PAXGUSDT for real market data (Proxy)
            if (symbol === 'XAUUSD' || symbol === 'GOLD') {
                querySymbol = 'PAXGUSDT';
            } else {
                querySymbol = symbol.toUpperCase().replace('/', '');
            }

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
        
        if (data.length > 0 && chartRef.current && series) {
          rawDataRef.current = data;
          
          const adjustedData = data.map(d => ({
            ...d,
            open: d.open + priceOffset,
            high: d.high + priceOffset,
            low: d.low + priceOffset,
            close: d.close + priceOffset,
          }));

          setCandleData(adjustedData);
          if (chartType === 'area') {
             const areaData = adjustedData.map(d => ({ time: d.time, value: d.close }));
             series.setData(areaData);
          } else {
             series.setData(adjustedData);
          }

          // Set Footprint Data
          if (footprintSeriesRef.current) {
              const footprintData = adjustedData.map(d => generateFootprintData(d));
              footprintSeriesRef.current.setData(footprintData);
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
          if (dataSource === 'twelvedata' && twelveDataApiKey) {
               // TwelveData WebSocket
               ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes?apikey=${twelveDataApiKey}`);
               ws.onopen = () => {
                   const tdSymbol = symbol === 'XAUUSD' || symbol === 'GOLD' ? 'XAU/USD' : symbol;
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
                       seriesRef.current.update(updatedCandle);
                   }
               };
          } else {
              let wsSymbol = symbol;
              if (symbol === 'XAUUSD' || symbol === 'GOLD') {
                  wsSymbol = 'PAXGUSDT';
              } else {
                  wsSymbol = symbol.toUpperCase().replace('/', '');
              }
              
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

                      if (seriesRef.current) {
                          seriesRef.current.update(candle);
                          
                          // Update Footprint
                          if (footprintSeriesRef.current) {
                              const footprintCandle = generateFootprintData(candle);
                              footprintSeriesRef.current.update(footprintCandle);
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

  // Toggle Footprint Visibility
  useEffect(() => {
    if (footprintSeriesRef.current) {
        footprintSeriesRef.current.applyOptions({ visible: showOrderflow });
    }
    if (seriesRef.current) {
        seriesRef.current.applyOptions({ visible: !showOrderflow });
    }
  }, [showOrderflow]);

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

    const handleGlobalMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
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

    const handleGlobalMouseUp = () => {
        setIsDragging(false);
        setDragStart(null);
        setInitialDrawingState(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, initialDrawingState, dragStart]);

  // Overlay Drawing Handlers
  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (drawingTool === 'cursor' || drawingTool === 'horizontal' || !chartRef.current || !seriesRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
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

  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (!currentDrawing || !chartRef.current || !seriesRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const time = chartRef.current.timeScale().coordinateToTime(x);
    const price = seriesRef.current.coordinateToPrice(y);
    
    if (time && price) {
        setCurrentDrawing(prev => ({
            ...prev,
            p2: { time: time as Time, price }
        }));
    }
  };

  const handleOverlayMouseUp = () => {
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

        const handleMouseDown = (e: React.MouseEvent) => {
             if (selectedDrawingId !== d.id) return;
             e.stopPropagation();
             e.preventDefault();
             setIsDragging(true);
             setDragStart({ x: e.clientX, y: e.clientY });
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
            const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
            content = (
                <g>
                    {/* Hit Area */}
                    <rect 
                        x={Math.min(cx1, cx2)} y={Math.min(cy1, cy2)} 
                        width={Math.abs(cx2 - cx1)} height={Math.abs(cy2 - cy1)} 
                        fill="transparent" 
                    />
                    {levels.map(l => (
                        <g key={l}>
                            <line 
                                x1={cx1} y1={cy1 + dy * l} 
                                x2={cx2} y2={cy1 + dy * l} 
                                stroke={strokeColor} strokeWidth={d.width ?? 1} strokeDasharray="4 2"
                            />
                            <text 
                                x={cx1} y={cy1 + dy * l - 2} 
                                fill={strokeColor} fontSize="10" fontWeight="bold"
                            >
                                {l}
                            </text>
                        </g>
                    ))}
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
                 const profileWidth = Math.abs(cx2 - cx1);
                 
                 content = (
                     <g opacity="0.9" filter="url(#shadow-3d)">
                         {volumeProfile.map((vol, i) => {
                             const price = minPrice + i * binSize;
                             const y = seriesRef.current?.priceToCoordinate(price);
                             const barWidth = (vol / maxVol) * profileWidth;
                             const h = Math.abs((seriesRef.current?.priceToCoordinate(price + binSize) ?? 0) - (y as number)) - 1;
                             
                             if (y === null || y === undefined) return null;
                             
                             return (
                                 <g key={i}>
                                    <rect 
                                        x={Math.min(cx1, cx2)} y={y as number} 
                                        width={barWidth} height={h}
                                        fill="rgba(41, 98, 255, 0.35)"
                                        rx="4"
                                        stroke="#2962FF"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={Math.min(cx1, cx2) + barWidth + 4}
                                        y={(y as number) + h / 2}
                                        fill="rgba(41, 98, 255, 0.9)"
                                        fontSize="10"
                                        textAnchor="start"
                                    >
                                        {Math.round(vol)}
                                    </text>
                                 </g>
                             );
                         })}
                         <rect x={Math.min(cx1, cx2)} y={Math.min(cy1, cy2)} width={Math.abs(cx2 - cx1)} height={Math.abs(cy2 - cy1)} fill="none" stroke="#787B86" strokeDasharray="4 4" strokeOpacity="0.5" />
                     </g>
                 );
             }
        } 

        return (
            <g key={d.id} onClick={handleClick} onMouseDown={handleMouseDown} style={{ cursor: isSelected ? 'grab' : 'pointer', pointerEvents: 'all' }}>
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

    // Orderflow / Footprint Mode
    let orderflowElements = null;
    let volumeTableElements = null;

    if (showOrderflow && candleData.length > 0) {
        const visibleCandles = candleData.filter(c => {
            const x = chartRef.current?.timeScale().timeToCoordinate(c.time);
            return x !== null && x !== undefined && x >= -50 && x <= (chartContainerRef.current?.clientWidth || 0) + 50;
        });

        const elements: React.ReactNode[] = [];
        const tableElements: React.ReactNode[] = [];
        
        const chartHeight = chartContainerRef.current?.clientHeight || 0;
        const tableHeight = 110;
        const tableY = chartHeight - tableHeight;

        tableElements.push(
            <rect key="table-bg" x="0" y={tableY} width="100%" height={tableHeight} fill="#0b0e11" opacity="0.95" />
        );
        tableElements.push(
            <line key="table-line" x1="0" y1={tableY} x2="100%" y2={tableY} stroke="#374151" strokeWidth="2" />
        );

        visibleCandles.forEach((c) => {
            const x = chartRef.current?.timeScale().timeToCoordinate(c.time);
            const yHigh = seriesRef.current?.priceToCoordinate(c.high);
            const yLow = seriesRef.current?.priceToCoordinate(c.low);
            
            if (x === null || x === undefined || yHigh === null || yHigh === undefined || yLow === null || yLow === undefined) return;

            const height = Math.abs(yLow - yHigh);
            const seed = (c.time as number) + c.open;
            const rand = (n: number) => {
                const sin = Math.sin(seed * n);
                return sin - Math.floor(sin);
            };

            const numRows = Math.max(1, Math.floor(height / 22)); 
            const rowHeight = height / numRows;
            // Increased base font size and max size for better visibility
            const fontSize = Math.max(12, Math.floor(rowHeight * 0.9 * footprintFontScale));
            
            let totalAsk = 0;
            let totalBid = 0;

            for (let r = 0; r < numRows; r++) {
                const rowY = yHigh + r * rowHeight;
                const isGreen = c.close > c.open;
                const bias = isGreen ? 0.6 : 0.4;
                const volBase = Math.floor(rand(r + 1) * 100) + 10;
                
                const ask = Math.floor(volBase * bias * (rand(r + 2) + 0.5));
                const bid = Math.floor(volBase * (1 - bias) * (rand(r + 3) + 0.5));
                
                totalAsk += ask;
                totalBid += bid;

                const isImbalance = ask > bid * 2.5 || bid > ask * 2.5;
            const fillUrl = isImbalance ? (ask > bid ? 'url(#grad-buy-3d)' : 'url(#grad-sell-3d)') : 'rgba(255, 255, 255, 0.02)';
            const strokeColor = isImbalance ? (ask > bid ? '#00E396' : '#FF4560') : 'rgba(255, 255, 255, 0.1)';
            
            // 3D Block Effect
            if (isImbalance) {
                elements.push(
                    <g key={`fp-bg-${c.time}-${r}`} filter="url(#glow-3d)">
                        <rect 
                            x={x - 24} y={rowY + 1} width={48} height={rowHeight - 2} rx="4" 
                            fill={fillUrl} 
                            stroke={strokeColor} 
                            strokeWidth="1.5"
                            strokeOpacity="0.8" 
                        />
                        {/* Inner Glass Highlight */}
                        <path d={`M ${x - 24} ${rowY + 2} Q ${x} ${rowY + rowHeight} ${x + 24} ${rowY + 2} v 2 Q ${x} ${rowY + rowHeight + 4} ${x - 24} ${rowY + 4} Z`} fill="white" fillOpacity="0.15" />
                    </g>
                );
            } else {
                 elements.push(
                    <rect 
                        key={`fp-bg-neutral-${c.time}-${r}`}
                        x={x - 24} y={rowY + 1} width={48} height={rowHeight - 2} rx="2" 
                        fill={fillUrl} 
                        stroke={strokeColor}
                        strokeWidth="0.5" 
                    />
                );
            }

            elements.push(
                <g key={`fp-${c.time}-${r}`}>
                    <text x={x - 3} y={rowY + rowHeight / 1.5 + 1} textAnchor="end" fontSize={fontSize} fill={bid > ask ? "#FF4560" : "#ffffff"} className="font-mono font-bold" style={{textShadow: '0px 0px 2px rgba(0,0,0,0.8)'}}>{bid}</text>
                    <text x={x + 3} y={rowY + rowHeight / 1.5 + 1} textAnchor="start" fontSize={fontSize} fill={ask > bid ? "#00E396" : "#ffffff"} className="font-mono font-bold" style={{textShadow: '0px 0px 2px rgba(0,0,0,0.8)'}}>{ask}</text>
                </g>
            );
            }

            const delta = totalAsk - totalBid;
            const deltaColor = delta > 0 ? '#089981' : '#F23645';
            
            tableElements.push(
                <g key={`tb-${c.time}`}>
                    <text x={x} y={tableY + 25} textAnchor="middle" fontSize="10" fill="#d1d4dc" fontWeight="bold">{totalAsk}</text>
                    <text x={x} y={tableY + 45} textAnchor="middle" fontSize="10" fill="#9ca3af" fontWeight="bold">{totalBid}</text>
                    <rect x={x - 20} y={tableY + 55} width={40} height={18} rx="4" fill={deltaColor} fillOpacity="0.15" stroke={deltaColor} strokeOpacity="0.3" />
                    <text x={x} y={tableY + 67} textAnchor="middle" fontSize="10" fill={deltaColor} fontWeight="bold">{delta > 0 ? '+' : ''}{delta}</text>
                    <line x1={x + 35} y1={tableY} x2={x + 35} y2={tableY + tableHeight} stroke="#1f2937" strokeWidth="0.5" strokeDasharray="2 2" />
                </g>
            );
        });
        
         tableElements.push(
             <g key="table-headers">
                 <rect x="0" y={tableY} width="70" height={tableHeight} fill="#0b0e11" opacity="1" stroke="#2a2e39" />
                 <text x="10" y={tableY + 25} textAnchor="start" fontSize="10" fill="#6b7280" fontWeight="bold">ASK VOL</text>
                 <text x="10" y={tableY + 45} textAnchor="start" fontSize="10" fill="#6b7280" fontWeight="bold">BID VOL</text>
                 <text x="10" y={tableY + 67} textAnchor="start" fontSize="10" fill="#6b7280" fontWeight="bold">DELTA</text>
             </g>
        );

        orderflowElements = elements;
        volumeTableElements = tableElements;
    }

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
            {orderflowElements}
            {volumeTableElements}
        </>
    );
  }, [drawings, currentDrawing, candleData, activeSignal, showSignalLines, showOrderflow, selectedDrawingId, showSupportResistance, footprintFontScale]);

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
  const toggleDrawingTool = (tool: 'cursor' | 'horizontal' | 'trend' | 'rectangle' | 'fib' | 'long' | 'volprofile' | 'footprint') => {
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
      <style>{`
        .tv-lightweight-charts a[href*="tradingview.com"] {
            display: none !important;
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
            <DropdownMenuContent className="min-w-[160px] border border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl p-1 text-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-xl z-50">
                {allowedPairs.map((s) => (
                    <DropdownMenuItem 
                        key={s}
                        onClick={() => setSymbol(s)}
                        className={`cursor-pointer rounded-lg px-3 py-2.5 text-xs hover:bg-white/5 focus:bg-white/5 font-bold transition-colors flex items-center justify-between ${symbol === s ? 'text-[#2962FF] bg-[#2962FF]/10' : 'text-gray-300'}`}
                    >
                        {s}
                        {symbol === s && <Check size={14} />}
                    </DropdownMenuItem>
                ))}
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
                  <DropdownMenuContent className="min-w-[260px] border border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl p-2 text-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-xl z-50">
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
                   <div className="px-2 py-2">
                        <Label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">Footprint Font Scale</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                className="h-2 flex-1 accent-[#2962FF] bg-white/10 rounded-full appearance-none cursor-pointer"
                                value={footprintFontScale}
                                onChange={(e) => setFootprintFontScale(parseFloat(e.target.value))}
                            />
                            <span className="text-[10px] font-mono font-bold w-8 text-right">{footprintFontScale.toFixed(1)}x</span>
                        </div>
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
                       onClick={() => tool.id === 'cursor' ? setDrawingTool('cursor') : tool.id === 'horizontal' ? setDrawingTool('horizontal') : toggleDrawingTool(tool.id as 'trend' | 'rectangle' | 'fib' | 'long' | 'volprofile' | 'footprint')}
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
                       showOrderflow 
                       ? 'text-white bg-linear-to-br from-[#2962FF] to-[#0039CB] shadow-[0_0_15px_#2962FF]' 
                       : 'text-gray-400 hover:text-white hover:bg-white/10'
                   }`}
                   onClick={() => setShowOrderflow(!showOrderflow)}
                   title="Footprint / Orderflow"
                >
                   <Footprints size={18} className={`transition-transform duration-300 ${showOrderflow ? 'scale-110' : 'group-hover/tool:scale-110'}`} />
                   
                   {/* Tooltip */}
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
                onMouseDown={handleOverlayMouseDown}
                onMouseMove={handleOverlayMouseMove}
                onMouseUp={handleOverlayMouseUp}
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
          <div className={`h-full bg-[#050505]/95 backdrop-blur-xl border-l border-white/10 z-50 transition-all duration-300 ease-in-out flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${showNotifications ? 'w-[380px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
               <div className="w-[380px] h-full flex flex-col min-w-[380px]">
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
                    {/* TradingView Widget Section */}
                    <div className="rounded-xl overflow-hidden border border-white/5 bg-black/20 relative">
                        <div className="absolute inset-0 bg-linear-to-b from-[#2962FF]/5 to-transparent pointer-events-none" />
                        <div className="p-3 border-b border-white/5 flex items-center gap-2">
                            <Activity size={14} className="text-[#2962FF]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Market Overview</span>
                        </div>
                        <div className="h-[200px] flex items-center justify-center bg-[#020408]">
                            <TradingViewWidget symbol={symbol} />
                        </div>
                    </div>

                    {/* Live Signals Section */}
                    <div className="h-[450px] relative w-full">
                         <SignalNotifications onSelectSignal={(sig) => setActiveSignal(sig)} />
                    </div>

                    {/* Technical Analysis Section */}
                    <div className="rounded-xl overflow-hidden border border-white/5 bg-black/20 relative">
                        <div className="absolute inset-0 bg-linear-to-b from-[#9C27B0]/5 to-transparent pointer-events-none" />
                        <div className="p-3 border-b border-white/5 flex items-center gap-2">
                            <Activity size={14} className="text-[#9C27B0]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Technical Analysis</span>
                        </div>
                        <div className="h-[300px] bg-[#020408]">
                             <TradingViewTechnicalAnalysis interval={timeframe} />
                        </div>
                    </div>
               </div>
             </div>
          </div>
        </div>
  );
}