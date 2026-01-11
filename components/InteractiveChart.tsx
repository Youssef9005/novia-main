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
  Time
} from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { 
  Maximize2, 
  Camera, 
  Crosshair,
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
  Palette,
  Eye,
  EyeOff,
  Move
} from 'lucide-react';

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
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Signal {
  entry: string;
  tp1: string;
  tp2?: string;
  tp3?: string;
  tp4?: string;
  stopLoss: string;
  type: string;
  symbol: string;
  createdAt?: string;
}

interface InteractiveChartProps {
  symbol?: string;
  signal?: Signal | null;
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
}

const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
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

export default function InteractiveChart({ symbol = 'XAUUSD', signal }: InteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick" | "Area"> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const priceLinesRef = useRef<any[]>([]);
  
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType] = useState<'candles' | 'area'>('candles');
  const [showSignalLines, setShowSignalLines] = useState(true);
  const [showSignalCard, setShowSignalCard] = useState(true);
  const [crosshairMode, setCrosshairMode] = useState<CrosshairMode>(CrosshairMode.Normal);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [showOrderflow, setShowOrderflow] = useState(false);
  const [priceOffset, setPriceOffset] = useState(0);
  const [dataSource, setDataSource] = useState<'binance' | 'twelvedata'>('binance');
  const [twelveDataApiKey, setTwelveDataApiKey] = useState('');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false); // For continuous calibration
  const [candleUpColor, setCandleUpColor] = useState('#089981');
  const [candleDownColor, setCandleDownColor] = useState('#F23645');
  const [showSupportResistance, setShowSupportResistance] = useState(false);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialDrawingState, setInitialDrawingState] = useState<Drawing | null>(null);
  const srLinesRef = useRef<any[]>([]);

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

  // Set active signal from prop or fetch
  useEffect(() => {
    if (signal) {
      setActiveSignal(signal);
    } else {
      const fetchSignal = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          const res = await fetch('/api/signals', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) return;
          const data = await res.json();
          
          if (data.status === 'success' && data.data?.signals?.length > 0) {
            const latest = data.data.signals.find((s: any) => 
              s.symbol === symbol || s.symbol === symbol.replace('/', '')
            );
            if (latest) setActiveSignal(latest);
          }
        } catch (err) {
          console.error("Error fetching signal:", err);
        }
      };
      
      fetchSignal();
      const interval = setInterval(fetchSignal, 30000); 
      return () => clearInterval(interval);
    }
  }, [symbol, signal]);

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
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        timeScale: {
          borderColor: '#2B2B43',
          timeVisible: true,
          secondsVisible: false,
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
        });
      } else {
        series = chart.addSeries(CandlestickSeries, {
          upColor: candleUpColor,
          downColor: candleDownColor,
          borderVisible: false,
          wickUpColor: candleUpColor,
          wickDownColor: candleDownColor,
        });
      }

      chartRef.current = chart;
      seriesRef.current = series;

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

      // Load Data
      const loadData = async () => {
        let data: CandleData[] = [];
        
        // --- TwelveData Source ---
        if (dataSource === 'twelvedata' && twelveDataApiKey) {
            try {
                const tdSymbol = symbol === 'XAUUSD' || symbol === 'GOLD' ? 'XAU/USD' : symbol;
                // Map timeframe to TwelveData interval
                const intervalMap: Record<string, string> = {
                    '1m': '1min', '5m': '5min', '15m': '15min', '30m': '30min',
                    '1h': '1h', '4h': '4h', '1d': '1day', '1w': '1week'
                };
                const tdInterval = intervalMap[timeframe] || '1min';

                const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${tdSymbol}&interval=${tdInterval}&apikey=${twelveDataApiKey}&outputsize=1000`);
                const json = await res.json();
                
                if (json.code === 401 || json.code === 400) {
                     toast.error(`TwelveData Error: ${json.message}`);
                } else if (json.values && Array.isArray(json.values)) {
                    data = json.values.reverse().map((v: any) => ({
                        time: (new Date(v.datetime).getTime() / 1000) as Time,
                        open: parseFloat(v.open),
                        high: parseFloat(v.high),
                        low: parseFloat(v.low),
                        close: parseFloat(v.close),
                    }));
                }
            } catch(e) {
                console.error("TwelveData fetch error", e);
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
                    data = klines.map((k: any) => ({
                        time: (k[0] / 1000) as Time,
                        open: parseFloat(k[1]),
                        high: parseFloat(k[2]),
                        low: parseFloat(k[3]),
                        close: parseFloat(k[4]),
                    }));
                }
            } catch (e) {
                console.log("Failed to fetch market data", e);
            }
        }
        
        if (data.length > 0 && chartRef.current && series) {
          rawDataRef.current = data;
          
          // Apply Price Offset
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
          // Only fit content on initial load
          if (candleData.length === 0) {
              chart.timeScale().fitContent();
          }
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
      } catch (e) {
          console.error("WebSocket error:", e);
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

      return () => {
        window.removeEventListener('resize', handleResize);
        if (ws) {
            ws.close();
        }
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }
      };
    } catch (e) {
      console.error("Chart init error:", e);
    }
  }, [symbol, timeframe, chartType, crosshairMode, priceOffset, dataSource, twelveDataApiKey, candleUpColor, candleDownColor]); 

  // Handle Indicators
  useEffect(() => {
     if (!chartRef.current || candleData.length === 0) return;
     
     // Clear existing indicators
     indicatorSeriesRef.current.forEach(s => {
         try {
            chartRef.current?.removeSeries(s);
         } catch(e) {}
     });
     indicatorSeriesRef.current.clear();

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
            }

            if (data.length > 0) {
            const lineSeries = chartRef.current?.addSeries(LineSeries, {
                color,
                lineWidth: 2,
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

  }, [activeIndicators, candleData]);

  // Draw Signal Lines (Now handled in renderSVGElements for better control)
  useEffect(() => {
    // Cleanup legacy price lines if any
    priceLinesRef.current.forEach(line => {
      try {
        if (seriesRef.current) seriesRef.current.removePriceLine(line);
      } catch(e) {}
    });
    priceLinesRef.current = [];
  }, [activeSignal, showSignalLines]); 

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
            color: '#2962FF'
        });
    }
  };

  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    // Handle Dragging
    if (isDragging && initialDrawingState && dragStart && chartRef.current && seriesRef.current) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        // Convert initial P1/P2 to coordinates
        const x1_orig = chartRef.current.timeScale().timeToCoordinate(initialDrawingState.p1.time);
        const y1_orig = seriesRef.current.priceToCoordinate(initialDrawingState.p1.price);
        const x2_orig = chartRef.current.timeScale().timeToCoordinate(initialDrawingState.p2.time);
        const y2_orig = seriesRef.current.priceToCoordinate(initialDrawingState.p2.price);

        if (x1_orig !== null && y1_orig !== null && x2_orig !== null && y2_orig !== null) {
            const x1_new = (x1_orig as number) + deltaX;
            const y1_new = (y1_orig as number) + deltaY;
            const x2_new = (x2_orig as number) + deltaX;
            const y2_new = (y2_orig as number) + deltaY;

            const t1_new = chartRef.current.timeScale().coordinateToTime(x1_new);
            const p1_new = seriesRef.current.coordinateToPrice(y1_new);
            const t2_new = chartRef.current.timeScale().coordinateToTime(x2_new);
            const p2_new = seriesRef.current.coordinateToPrice(y2_new);

            if (t1_new && p1_new && t2_new && p2_new) {
                 setDrawings(prev => prev.map(d => d.id === initialDrawingState.id ? {
                     ...d,
                     p1: { time: t1_new as Time, price: p1_new },
                     p2: { time: t2_new as Time, price: p2_new }
                 } : d));
            }
        }
        return; 
    }

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
    if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
        setInitialDrawingState(null);
        return;
    }

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
        const strokeWidth = isSelected ? 3 : (d.type === 'trend' || d.type === 'rectangle' ? 2 : 1);
        
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
                                stroke={strokeColor} strokeWidth="1" strokeDasharray="4 2"
                            />
                            <text 
                                x={cx1} y={cy1 + dy * l - 2} 
                                fill={strokeColor} fontSize="10" fontWeight="bold"
                            >
                                {l}
                            </text>
                        </g>
                    ))}
                    <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke={strokeColor} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
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
                        fill="#F23645" fillOpacity="0.2" stroke="#F23645"
                    />
                    <rect 
                        x={cx1} y={entryY - (slY - entryY) * 1.5} 
                        width={width} height={Math.abs(slY - entryY) * 1.5} 
                        fill="#089981" fillOpacity="0.2" stroke="#089981"
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
                                        fill="url(#grad-neutral-3d)"
                                        rx="4"
                                        stroke="#363a45"
                                        strokeWidth="1"
                                    />
                                    {/* Top Shine for Cylinder Effect */}
                                    <rect 
                                        x={Math.min(cx1, cx2) + 1} y={y as number + 1} 
                                        width={Math.max(0, barWidth - 2)} height={h / 2}
                                        fill="url(#shine-gradient)"
                                        rx="3"
                                    />
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
                            <circle r="10" fill="#1e222d" stroke="#2a2e39" strokeWidth="1" />
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
        const { entry, stopLoss, tp1, tp2, tp3, tp4, type } = activeSignal;
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
            let item = { ...items[i], labelY: items[i].y };
            
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
        const tableHeight = 90;
        const tableY = chartHeight - tableHeight;

        tableElements.push(
            <rect key="table-bg" x="0" y={tableY} width="100%" height={tableHeight} fill="#0b0e11" opacity="0.95" />
        );
        tableElements.push(
            <line key="table-line" x1="0" y1={tableY} x2="100%" y2={tableY} stroke="#2a2e39" strokeWidth="1" />
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

            const numRows = Math.max(1, Math.floor(height / 14)); 
            const rowHeight = height / numRows;
            
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
                    <text x={x - 3} y={rowY + rowHeight / 1.5 + 1} textAnchor="end" fontSize="9" fill={bid > ask ? "#FF4560" : "#787b86"} className="font-mono font-bold" style={{textShadow: '0px 1px 2px black'}}>{bid}</text>
                    <text x={x + 3} y={rowY + rowHeight / 1.5 + 1} textAnchor="start" fontSize="9" fill={ask > bid ? "#00E396" : "#787b86"} className="font-mono font-bold" style={{textShadow: '0px 1px 2px black'}}>{ask}</text>
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
  }, [drawings, currentDrawing, chartUpdateTrigger, candleData, activeSignal, showSignalLines, showOrderflow, selectedDrawingId, showSupportResistance]);

  // Handlers
  const handleScreenshot = () => {
    if (chartContainerRef.current) {
        const canvas = chartContainerRef.current.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${symbol}-chart.png`;
            link.href = url;
            link.click();
        }
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
      setShowSignalCard(false);
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
      } catch (e) {
          console.error(e);
          toast.error("Calibration failed. Try again.");
      } finally {
          setIsCalibrating(false);
      }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0e11] text-[#d1d4dc] overflow-hidden rounded-xl border border-[#1f2937] shadow-2xl font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[#1f2937] bg-[#0b0e11]/95 backdrop-blur-sm z-30 relative">
        <div className="flex items-center space-x-2">
          {/* Symbol Info */}
          <div className="flex items-center space-x-2 group cursor-pointer hover:bg-[#1f2937]/50 p-1.5 rounded-lg transition-colors">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2962FF] to-[#0039CB] flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-900/20">
                {symbol?.substring(0, 1)}
            </div>
            <span className="font-bold text-white tracking-wide text-sm">{symbol}</span>
            <ChevronDown size={12} className="text-gray-500 group-hover:text-white transition-colors" />
          </div>
          
          <div className="h-6 w-px bg-[#1f2937] mx-2" />

          {/* Timeframes */}
          <div className="flex items-center space-x-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-200 ${
                    timeframe === tf.value 
                    ? 'bg-[#2962FF] text-white shadow-md shadow-blue-900/20' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#1f2937]/50'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-[#1f2937] mx-2" />

          {/* Indicators & Signals */}
          <div className="flex items-center space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-1 px-2 py-1.5 hover:bg-[#1f2937] rounded-lg text-gray-400 hover:text-white transition-all duration-200 group">
                     <Activity size={18} className="text-[#2962FF]" />
                     <span className="text-xs font-semibold">Indicators</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1e222d] border-[#2a2e39] text-gray-200 min-w-[240px] p-1 shadow-2xl">
                   <DropdownMenuLabel className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-1.5">Trend Indicators</DropdownMenuLabel>
                   <DropdownMenuCheckboxItem 
                      checked={activeIndicators.includes('SMA 20')}
                      onCheckedChange={() => toggleIndicator('SMA 20')}
                      className="hover:bg-[#2a2e39] focus:bg-[#2a2e39] cursor-pointer rounded px-2 py-2 data-[state=checked]:text-[#2962FF]"
                   >
                      Moving Average (20)
                   </DropdownMenuCheckboxItem>
                   <DropdownMenuCheckboxItem 
                      checked={activeIndicators.includes('EMA 50')}
                      onCheckedChange={() => toggleIndicator('EMA 50')}
                      className="hover:bg-[#2a2e39] focus:bg-[#2a2e39] cursor-pointer rounded px-2 py-2 data-[state=checked]:text-[#2962FF]"
                   >
                      EMA (50)
                   </DropdownMenuCheckboxItem>
                   <DropdownMenuCheckboxItem 
                      checked={activeIndicators.includes('SMA 200')}
                      onCheckedChange={() => toggleIndicator('SMA 200')}
                      className="hover:bg-[#2a2e39] focus:bg-[#2a2e39] cursor-pointer rounded px-2 py-2 data-[state=checked]:text-[#2962FF]"
                   >
                      Moving Average (200)
                   </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button 
                 onClick={() => { setShowSignalLines(!showSignalLines); setShowSignalCard(!showSignalLines); }}
                 className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                     showSignalLines ? 'text-[#089981] bg-[#089981]/10 border border-[#089981]/20' : 'text-gray-400 hover:bg-[#1f2937] hover:text-white'
                 }`}
                 title="Toggle Signals"
              >
                <Layers size={18} />
                <span className="text-xs font-semibold">Signals</span>
              </button>

              <button 
                 onClick={() => setShowSupportResistance(!showSupportResistance)}
                 className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                     showSupportResistance ? 'text-[#FFA726] bg-[#FFA726]/10 border border-[#FFA726]/20' : 'text-gray-400 hover:bg-[#1f2937] hover:text-white'
                 }`}
                 title="Toggle Support & Resistance"
              >
                {showSupportResistance ? <Eye size={18} /> : <EyeOff size={18} />}
                <span className="text-xs font-semibold">S&R</span>
              </button>

              {selectedDrawingId && (
                  <>
                    <button 
                        onClick={() => toast.info("Select a shape and drag it to move")}
                        className="flex items-center space-x-1 px-2 py-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all duration-200 animate-in fade-in zoom-in duration-300"
                        title="Move Selected Drawing"
                    >
                        <Move size={18} />
                        <span className="text-xs font-semibold">Move</span>
                    </button>
                    <button  
                        onClick={handleDeleteSelectedDrawing}
                        className="flex items-center space-x-1 px-2 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all duration-200 animate-in fade-in zoom-in duration-300"
                        title="Delete Selected Drawing"
                    >
                        <Trash2 size={18} />
                        <span className="text-xs font-semibold">Delete</span>
                    </button>
                  </>
              )}



              <button 
                 onClick={handleClearAll}
                 className="flex items-center space-x-1 px-2 py-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-gray-400 transition-all duration-200"
                 title="Clear All Chart Elements"
              >
                <Trash2 size={18} />
                <span className="text-xs font-semibold">Clear</span>
              </button>
          </div>
        </div>

        <div className="flex items-center space-x-1">
           <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors" onClick={toggleFullscreen} title="Fullscreen"><Maximize2 size={18} /></Button>
           <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors" onClick={handleScreenshot} title="Screenshot"><Camera size={18} /></Button>
           <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1f2937] rounded-lg transition-colors" title="Settings">
                <Settings size={18} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-[#1e222d] border-[#2a2e39] text-gray-200">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none text-white">Chart Settings</h4>
                  <p className="text-sm text-gray-500">
                    Adjust chart parameters and calibration.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="offset">Price Offset</Label>
                    <div className="col-span-2 flex gap-2">
                        <Input
                        id="offset"
                        type="number"
                        step="0.01"
                        className="h-8 bg-[#0b0e11] border-[#2a2e39] text-white flex-1"
                        value={priceOffset}
                        onChange={(e) => setPriceOffset(parseFloat(e.target.value) || 0)}
                        />
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 px-2 bg-[#2962FF] hover:bg-[#1e4bd1] text-white text-[10px]"
                            onClick={handleAutoCalibrate}
                            disabled={isCalibrating}
                        >
                            {isCalibrating ? '...' : 'Auto Fix'}
                        </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Use 'Auto Fix' to sync price with global Forex market automatically.
                  </p>
                </div>

                <div className="border-t border-[#2a2e39] pt-4">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label>Candle Colors</Label>
                    <div className="col-span-2 flex gap-4">
                        <div className="flex flex-col items-center gap-1">
                             <div className="relative w-8 h-8 rounded overflow-hidden border border-[#2a2e39]">
                                <input 
                                    type="color" 
                                    value={candleUpColor} 
                                    onChange={(e) => setCandleUpColor(e.target.value)}
                                    className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
                                />
                             </div>
                             <span className="text-[10px] text-gray-400">Up</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                             <div className="relative w-8 h-8 rounded overflow-hidden border border-[#2a2e39]">
                                <input 
                                    type="color" 
                                    value={candleDownColor} 
                                    onChange={(e) => setCandleDownColor(e.target.value)}
                                    className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
                                />
                             </div>
                             <span className="text-[10px] text-gray-400">Down</span>
                        </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-[#2a2e39] pt-4">
                     <h5 className="text-sm font-medium text-white mb-2">Data Source</h5>
                     <div className="grid gap-4">
                         <div className="grid grid-cols-3 items-center gap-4">
                             <Label>Source</Label>
                             <div className="col-span-2">
                                 <Select value={dataSource} onValueChange={(v: any) => setDataSource(v)}>
                                     <SelectTrigger className="h-8 bg-[#0b0e11] border-[#2a2e39] text-gray-200">
                                         <SelectValue placeholder="Select source" />
                                     </SelectTrigger>
                                     <SelectContent className="bg-[#1e222d] border-[#2a2e39] text-gray-200">
                                         <SelectItem value="binance">Binance (Proxy)</SelectItem>
                                         <SelectItem value="twelvedata">TwelveData (Forex)</SelectItem>
                                     </SelectContent>
                                 </Select>
                             </div>
                         </div>

                         {dataSource === 'twelvedata' && (
                             <div className="space-y-2">
                                 <div className="grid grid-cols-3 items-center gap-4">
                                     <Label>API Key</Label>
                                     <Input 
                                        className="col-span-2 h-8 bg-[#0b0e11] border-[#2a2e39] text-white" 
                                        type="password"
                                        placeholder="TwelveData API Key"
                                        value={twelveDataApiKey}
                                        onChange={(e) => setTwelveDataApiKey(e.target.value)}
                                     />
                                 </div>
                                 <p className="text-xs text-blue-400 cursor-pointer hover:underline" onClick={() => window.open('https://twelvedata.com/', '_blank')}>
                                     Get Free API Key from TwelveData
                                 </p>
                             </div>
                         )}
                     </div>
                  </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Floating Toolbar */}
        <div className="absolute left-3 top-4 bottom-4 w-14 flex flex-col items-center py-4 space-y-3 bg-[#1e222d] shadow-2xl border border-[#2a2e39] rounded-xl z-20">
            <div 
               className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${drawingTool === 'cursor' && crosshairMode === CrosshairMode.Normal ? 'bg-[#2962FF] text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-[#2a2e39] hover:text-gray-200'}`}
               onClick={() => { setDrawingTool('cursor'); setCrosshairMode(CrosshairMode.Normal); }}
               title="Cursor"
            >
               <MousePointer2 size={20} />
            </div>

            <div 
               className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${crosshairMode === CrosshairMode.Magnet ? 'bg-[#2962FF] text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-[#2a2e39] hover:text-gray-200'}`}
               onClick={() => setCrosshairMode(prev => prev === CrosshairMode.Normal ? CrosshairMode.Magnet : CrosshairMode.Normal)}
               title="Magnet Mode"
            >
               <Crosshair size={20} />
            </div>
            
            <div className="w-8 h-px bg-[#2a2e39] my-2" />
            
            {[
                { id: 'trend', icon: TrendingUp, label: 'Trend Line' },
                { id: 'horizontal', icon: Minus, label: 'Horizontal Line' },
                { id: 'rectangle', icon: Square, label: 'Rectangle' },
                { id: 'fib', icon: Activity, label: 'Fib Retracement' },
            ].map((tool) => (
                <div 
                   key={tool.id}
                   className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${drawingTool === tool.id ? 'bg-[#2962FF] text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-[#2a2e39] hover:text-gray-200'}`}
                   onClick={() => tool.id === 'horizontal' ? setDrawingTool('horizontal') : toggleDrawingTool(tool.id as any)}
                   title={tool.label}
                >
                   <tool.icon size={20} />
                </div>
            ))}

            <div className="w-8 h-px bg-[#2a2e39] my-2" />

            <div 
               className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${drawingTool === 'long' ? 'bg-[#089981] text-white shadow-lg shadow-green-900/20' : 'text-gray-400 hover:bg-[#2a2e39] hover:text-gray-200'}`}
               onClick={() => toggleDrawingTool('long')}
               title="Long Position"
            >
               <TrendingUp size={20} className="rotate-90" />
            </div>

            <div 
               className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${drawingTool === 'volprofile' ? 'bg-[#2962FF] text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-[#2a2e39] hover:text-gray-200'}`}
               onClick={() => toggleDrawingTool('volprofile')}
               title="Fixed Range Volume Profile"
            >
               <BarChart3 size={20} className="rotate-90" />
            </div>

            <div 
               className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${showOrderflow ? 'bg-[#2962FF] text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:bg-[#2a2e39] hover:text-gray-200'}`}
               onClick={() => setShowOrderflow(!showOrderflow)}
               title="Toggle Orderflow Mode"
            >
               <Footprints size={20} />
            </div>
            
            <div className="flex-1" />

            <div 
               className="p-2.5 hover:bg-[#2a2e39] hover:text-white rounded-lg cursor-pointer text-gray-400 transition-colors" 
               onClick={() => chartRef.current?.timeScale().fitContent()}
               title="Reset View"
            >
               <RefreshCw size={20} />
            </div>

            <div 
               className="p-2.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg cursor-pointer text-gray-400 transition-colors" 
               onClick={handleClearAll}
               title="Clear All Drawings"
            >
               <Trash2 size={20} />
            </div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative bg-[#0b0e11] cursor-crosshair ml-0">
          <div ref={chartContainerRef} className="w-full h-full" />
          
          {/* SVG Overlay for Custom Drawings */}
          <svg 
            className={`absolute inset-0 w-full h-full z-10 ${drawingTool !== 'cursor' && drawingTool !== 'horizontal' ? 'pointer-events-auto' : 'pointer-events-none'}`}
            onMouseDown={handleOverlayMouseDown}
            onMouseMove={handleOverlayMouseMove}
            onMouseUp={handleOverlayMouseUp}
          >
             {renderSVGElements}
          </svg>

          {/* Professional Signal Overlay */}
          {activeSignal && showSignalCard && (
            <div className="absolute top-20 right-4 w-80 bg-[#1e222d]/95 backdrop-blur-md shadow-2xl rounded-xl border border-[#2a2e39] overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500 z-50 group hover:border-[#2962FF]/50 transition-colors">
              <div className={`px-4 py-3 border-b border-[#2a2e39] flex justify-between items-center bg-gradient-to-r ${
                  activeSignal.type === 'Buy' ? 'from-[#089981]/10 to-transparent' : 
                  activeSignal.type === 'Sell' ? 'from-[#F23645]/10 to-transparent' : ''
              }`}>
                <div className="flex items-center space-x-3">
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-lg ${
                        activeSignal.type === 'Buy' ? 'bg-[#089981] shadow-green-900/50' : 'bg-[#F23645] shadow-red-900/50'
                    }`} />
                    <span className={`font-bold text-lg tracking-tight ${
                        activeSignal.type === 'Buy' ? 'text-[#089981]' : 
                        activeSignal.type === 'Sell' ? 'text-[#F23645]' : 'text-white'
                    }`}>
                        {activeSignal.type?.toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-sm font-medium">{activeSignal.symbol}</span>
                </div>
                <div className="flex items-center space-x-2">
                   <div className="text-[10px] text-gray-500 font-mono bg-[#2a2e39] px-2 py-0.5 rounded-full border border-[#2a2e39]">
                       {activeSignal.createdAt ? new Date(activeSignal.createdAt).toLocaleTimeString() : 'LIVE'}
                   </div>
                   <button 
                      onClick={() => setShowSignalCard(false)}
                      className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-[#2a2e39] rounded-full"
                   >
                      <X size={14} />
                   </button>
                </div>
              </div>
              
              <div className="p-5 space-y-5">
                 <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">Entry Price</span>
                        <span className="font-mono text-3xl text-white font-bold tracking-tighter">{activeSignal.entry}</span>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${activeSignal.type === 'Buy' ? 'text-[#089981] bg-[#089981]/10 border-[#089981]/20' : 'text-[#F23645] bg-[#F23645]/10 border-[#F23645]/20'}`}>
                        {activeSignal.type === 'Buy' ? 'LONG POSITION' : 'SHORT POSITION'}
                    </div>
                 </div>
                 
                 <div className="h-px bg-gradient-to-r from-transparent via-[#2a2e39] to-transparent" />

                 <div className="space-y-3">
                    <div className="flex justify-between items-center group/tp">
                        <span className="text-gray-500 text-xs font-medium group-hover/tp:text-[#089981] transition-colors">Take Profit 1</span>
                        <span className="font-mono text-[#089981] font-bold text-sm">{activeSignal.tp1}</span>
                    </div>
                    {activeSignal.tp2 && (
                        <div className="flex justify-between items-center group/tp">
                            <span className="text-gray-500 text-xs font-medium group-hover/tp:text-[#089981] transition-colors">Take Profit 2</span>
                            <span className="font-mono text-[#089981] font-bold text-sm">{activeSignal.tp2}</span>
                        </div>
                    )}
                    {activeSignal.tp3 && (
                        <div className="flex justify-between items-center group/tp">
                            <span className="text-gray-500 text-xs font-medium group-hover/tp:text-[#089981] transition-colors">Take Profit 3</span>
                            <span className="font-mono text-[#089981] font-bold text-sm">{activeSignal.tp3}</span>
                        </div>
                    )}
                 </div>

                 <div className="bg-[#F23645]/5 border border-[#F23645]/10 rounded-lg p-3 flex justify-between items-center group/sl hover:border-[#F23645]/30 transition-colors">
                    <span className="text-[#F23645] text-xs font-bold uppercase flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#F23645]" />
                       Stop Loss
                    </span>
                    <span className="font-mono text-[#F23645] font-bold">{activeSignal.stopLoss}</span>
                 </div>
              </div>
            </div>
          )}
          
          {/* Watermark */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[120px] font-black text-[#1f2937]/30 pointer-events-none select-none z-0 tracking-tighter">
             {symbol}
          </div>
        </div>
      </div>
    </div>
  );
}
