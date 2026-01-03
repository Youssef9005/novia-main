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
  MouseEventParams
} from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { 
  Maximize2, 
  Camera, 
  Crosshair,
  BarChart3,
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Eye,
  EyeOff,
  TrendingUp,
  Activity,
  MousePointer2,
  Minus,
  MoveVertical,
  Square,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface InteractiveChartProps {
  symbol?: string;
  signal?: any;
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
  type: 'trend' | 'rectangle' | 'fib';
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
  
  const [activeSignal, setActiveSignal] = useState<any>(null);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState<'candles' | 'area'>('candles');
  const [showSignalLines, setShowSignalLines] = useState(true);
  const [crosshairMode, setCrosshairMode] = useState<CrosshairMode>(CrosshairMode.Normal);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  
  // Drawing Tools State
  const [drawingTool, setDrawingTool] = useState<'cursor' | 'horizontal' | 'trend' | 'rectangle'>('cursor');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<Drawing> | null>(null);
  const [chartUpdateTrigger, setChartUpdateTrigger] = useState(0);

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
          background: { type: ColorType.Solid, color: '#131722' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: '#1f2937', style: LineStyle.Dotted },
          horzLines: { color: '#1f2937', style: LineStyle.Dotted },
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        crosshair: {
          mode: crosshairMode,
          vertLine: {
              width: 1,
              color: '#758696',
              style: LineStyle.Dashed,
              labelBackgroundColor: '#758696',
          },
          horzLine: {
              width: 1,
              color: '#758696',
              style: LineStyle.Dashed,
              labelBackgroundColor: '#758696',
          },
        },
        rightPriceScale: {
          borderColor: '#2B2B43',
          visible: true,
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
          topColor: 'rgba(41, 98, 255, 0.56)',
          bottomColor: 'rgba(41, 98, 255, 0.04)',
          lineColor: 'rgba(41, 98, 255, 1)',
          lineWidth: 2,
        });
      } else {
        series = chart.addSeries(CandlestickSeries, {
          upColor: '#089981',
          downColor: '#F23645',
          borderVisible: false,
          wickUpColor: '#089981',
          wickDownColor: '#F23645',
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
             const line = seriesRef.current.createPriceLine({
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
        if (symbol === 'XAUUSD' || symbol === 'GOLD') {
           const timeStep = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '15m' ? 900 : timeframe === '1h' ? 3600 : timeframe === '4h' ? 14400 : 86400;
           let time = Math.floor(Date.now() / 1000) - 1000 * timeStep;
           let open = 2030.0;
           for (let i = 0; i < 1000; i++) {
              const close = open + (Math.random() - 0.5) * (timeStep / 60); 
              const high = Math.max(open, close) + Math.random() * (timeStep / 60);
              const low = Math.min(open, close) - Math.random() * (timeStep / 60);
              data.push({
                 time: (time + i * timeStep) as Time,
                 open,
                 high,
                 low,
                 close
              });
              open = close;
           }
        } else {
           try {
               const querySymbol = symbol.toUpperCase().replace('/', ''); 
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
               console.log("Failed to fetch crypto data, using mock");
           }
        }
        
        if (data.length > 0 && chartRef.current && series) {
          setCandleData(data);
          if (chartType === 'area') {
             const areaData = data.map(d => ({ time: d.time, value: d.close }));
             series.setData(areaData);
          } else {
             series.setData(data);
          }
          chart.timeScale().fitContent();
        }
      };

      loadData();

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
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }
      };
    } catch (e) {
      console.error("Chart init error:", e);
    }
  }, [symbol, timeframe, chartType, crosshairMode]); 

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

  // Draw Signal Lines
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    // Clear previous signal lines
    priceLinesRef.current.forEach(line => {
      try {
        seriesRef.current?.removePriceLine(line);
      } catch(e) {}
    });
    priceLinesRef.current = [];

    if (!activeSignal || !showSignalLines) return;
    
    try {
      const { entry, tp1, tp2, tp3, tp4, stopLoss } = activeSignal;

      const createLine = (price: string, color: string, title: string, style: LineStyle = LineStyle.Solid, width: number = 2) => {
          if (!price) return;
          const line = seriesRef.current?.createPriceLine({
              price: parseFloat(price),
              color,
              lineWidth: width as any,
              lineStyle: style,
              axisLabelVisible: true,
              title,
          });
          if (line) priceLinesRef.current.push(line);
      };

      createLine(entry, '#2962FF', 'Entry', LineStyle.Solid, 2);
      createLine(tp1, '#089981', 'TP1', LineStyle.Solid, 2);
      if(tp2) createLine(tp2, '#089981', 'TP2', LineStyle.Solid, 2);
      if(tp3) createLine(tp3, '#089981', 'TP3', LineStyle.Solid, 2);
      if(tp4) createLine(tp4, '#089981', 'TP4', LineStyle.Solid, 2);
      createLine(stopLoss, '#F23645', 'SL', LineStyle.Solid, 2);
    } catch (e) {
      console.error("Error drawing signal lines:", e);
    }

  }, [activeSignal, showSignalLines, chartType]); 

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
    if (currentDrawing && currentDrawing.p1 && currentDrawing.p2) {
        setDrawings(prev => [...prev, { ...currentDrawing, id: Math.random().toString() } as Drawing]);
        setCurrentDrawing(null);
        setDrawingTool('cursor');
        toast.success('Shape drawn');
    }
  };

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

        if (d.type === 'trend') {
            return (
                <line 
                    key={d.id} 
                    x1={cx1} y1={cy1} x2={cx2} y2={cy2} 
                    stroke={d.color} strokeWidth="2" 
                />
            );
        } else if (d.type === 'rectangle') {
            const x = Math.min(cx1, cx2);
            const y = Math.min(cy1, cy2);
            const w = Math.abs(cx2 - cx1);
            const h = Math.abs(cy2 - cy1);
            return (
                <rect 
                    key={d.id} 
                    x={x} y={y} width={w} height={h} 
                    stroke={d.color} strokeWidth="2" fill={`${d.color}20`} 
                />
            );
        }
        return null;
    });

    // Signal Zones (Risk/Reward Visualization)
    let signalZones = null;
    if (activeSignal && showSignalLines) {
        const { entry, stopLoss, tp1, tp2, tp3, tp4, type } = activeSignal;
        
        if (entry && stopLoss && tp1) {
            const yEntry = seriesRef.current.priceToCoordinate(parseFloat(entry));
            const ySL = seriesRef.current.priceToCoordinate(parseFloat(stopLoss));
            
            const tps = [tp1, tp2, tp3, tp4].filter(t => t).map(t => parseFloat(t));
            const targetPrice = type === 'Buy' || type === 'buy' 
                ? Math.max(...tps) 
                : Math.min(...tps);
            
            const yTarget = seriesRef.current.priceToCoordinate(targetPrice);

            if (yEntry !== null && ySL !== null && yTarget !== null) {
                const width = chartContainerRef.current?.clientWidth || 0;
                // We'll draw from left to right (full width) for now to ensure visibility
                // Or start from 70% width to look like a projection? 
                // Let's do full width with low opacity as a "Background Zone"
                
                signalZones = (
                    <>
                        {/* Stop Loss Zone (Red) */}
                        <rect 
                            key="sl-zone"
                            x={0} 
                            y={Math.min(yEntry, ySL)} 
                            width={width} 
                            height={Math.abs(yEntry - ySL)} 
                            fill="#F23645" 
                            fillOpacity="0.12" 
                        />
                        {/* Take Profit Zone (Green) */}
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

    return (
        <>
            {signalZones}
            {drawingElements}
        </>
    );
  }, [drawings, currentDrawing, chartUpdateTrigger, candleData, activeSignal, showSignalLines]);

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

  const handleZoomIn = () => {
    try {
      if (chartRef.current) {
          const timeScale = chartRef.current.timeScale();
          const range = timeScale.getVisibleLogicalRange();
          if (range) {
              const span = range.to - range.from;
              timeScale.setVisibleLogicalRange({
                  from: range.from + span * 0.1,
                  to: range.to - span * 0.1,
              });
          }
      }
    } catch(e) {}
  };

  const handleZoomOut = () => {
    try {
      if (chartRef.current) {
          const timeScale = chartRef.current.timeScale();
          const range = timeScale.getVisibleLogicalRange();
          if (range) {
              const span = range.to - range.from;
              timeScale.setVisibleLogicalRange({
                  from: range.from - span * 0.1,
                  to: range.to + span * 0.1,
              });
          }
      }
    } catch(e) {}
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

  const clearDrawings = () => {
      setDrawings([]);
      toast.info("All drawings cleared");
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#131722] text-[#d1d4dc] overflow-hidden rounded-lg border border-[#2B2B43] shadow-xl">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-2 h-12 border-b border-[#2B2B43] bg-[#131722]">
        <div className="flex items-center space-x-1">
          <div className="flex items-center mr-4 px-2 hover:bg-[#2A2E39] rounded cursor-pointer transition-colors">
            <span className="font-bold text-lg text-white mr-1">{symbol}</span>
            <span className="text-xs text-gray-400 bg-[#2A2E39] px-1 rounded">BINANCE</span>
          </div>
          
          <div className="h-6 w-px bg-[#2B2B43] mx-2" />

          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-2 py-1 text-sm rounded hover:bg-[#2A2E39] transition-colors ${timeframe === tf.value ? 'text-[#2962FF] font-medium' : 'text-[#d1d4dc]'}`}
            >
              {tf.label}
            </button>
          ))}
          
          <div className="h-6 w-px bg-[#2B2B43] mx-2" />

          <button 
             onClick={() => setChartType(prev => prev === 'candles' ? 'area' : 'candles')}
             className={`p-1.5 hover:bg-[#2A2E39] rounded ${chartType === 'area' ? 'text-[#2962FF]' : 'text-[#d1d4dc]'}`}
             title="Toggle Chart Type"
          >
            <BarChart3 size={18} />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-1 px-2 py-1 hover:bg-[#2A2E39] rounded text-[#d1d4dc] ml-1">
                 <Activity size={18} />
                 <span className="text-sm hidden sm:inline">Indicators</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1E222D] border-[#2B2B43] text-[#d1d4dc]">
               <DropdownMenuCheckboxItem 
                  checked={activeIndicators.includes('SMA 20')}
                  onCheckedChange={() => toggleIndicator('SMA 20')}
                  className="hover:bg-[#2A2E39]"
               >
                  Moving Average (20)
               </DropdownMenuCheckboxItem>
               <DropdownMenuCheckboxItem 
                  checked={activeIndicators.includes('EMA 50')}
                  onCheckedChange={() => toggleIndicator('EMA 50')}
                  className="hover:bg-[#2A2E39]"
               >
                  EMA (50)
               </DropdownMenuCheckboxItem>
               <DropdownMenuCheckboxItem 
                  checked={activeIndicators.includes('SMA 200')}
                  onCheckedChange={() => toggleIndicator('SMA 200')}
                  className="hover:bg-[#2A2E39]"
               >
                  Moving Average (200)
               </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button 
             onClick={() => setShowSignalLines(!showSignalLines)}
             className={`flex items-center space-x-1 px-2 py-1 hover:bg-[#2A2E39] rounded ${showSignalLines ? 'text-[#2962FF]' : 'text-[#d1d4dc]'}`}
             title="Toggle Signal Lines"
          >
            <Layers size={18} />
            <span className="text-sm hidden sm:inline">Signals</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
           <Button variant="ghost" size="icon" className="text-[#d1d4dc] hover:bg-[#2A2E39]" onClick={toggleFullscreen} title="Fullscreen"><Maximize2 size={18} /></Button>
           <Button variant="ghost" size="icon" className="text-[#d1d4dc] hover:bg-[#2A2E39]" onClick={handleScreenshot} title="Screenshot"><Camera size={18} /></Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Drawing Toolbar */}
        <div className="w-12 border-r border-[#2B2B43] flex flex-col items-center py-4 space-y-4 bg-[#131722] z-20">
            <div 
               className={`p-2 hover:bg-[#2A2E39] rounded cursor-pointer ${drawingTool === 'cursor' && crosshairMode === CrosshairMode.Normal ? 'bg-[#2A2E39] text-[#2962FF]' : 'text-[#d1d4dc]'}`}
               onClick={() => { setDrawingTool('cursor'); setCrosshairMode(CrosshairMode.Normal); }}
               title="Cursor"
            >
               <MousePointer2 size={20} />
            </div>

            <div 
               className={`p-2 hover:bg-[#2A2E39] rounded cursor-pointer ${crosshairMode === CrosshairMode.Magnet ? 'text-[#2962FF] bg-[#2A2E39]' : 'text-[#d1d4dc]'}`}
               onClick={() => setCrosshairMode(prev => prev === CrosshairMode.Normal ? CrosshairMode.Magnet : CrosshairMode.Normal)}
               title="Magnet Mode"
            >
               <Crosshair size={20} />
            </div>
            
            <div className="w-8 h-px bg-[#2B2B43]" />
            
            <div 
               className={`p-2 hover:bg-[#2A2E39] rounded cursor-pointer ${drawingTool === 'horizontal' ? 'text-[#2962FF] bg-[#2A2E39]' : 'text-[#d1d4dc]'}`}
               onClick={() => { setDrawingTool('horizontal'); toast.info('Click on chart to place line'); }}
               title="Horizontal Line"
            >
               <Minus size={20} />
            </div>

             <div 
               className={`p-2 hover:bg-[#2A2E39] rounded cursor-pointer ${drawingTool === 'trend' ? 'text-[#2962FF] bg-[#2A2E39]' : 'text-[#d1d4dc]'}`}
               onClick={() => { setDrawingTool('trend'); toast.info('Click and drag to draw trend line'); }}
               title="Trend Line"
            >
               <TrendingUp size={20} />
            </div>

            <div 
               className={`p-2 hover:bg-[#2A2E39] rounded cursor-pointer ${drawingTool === 'rectangle' ? 'text-[#2962FF] bg-[#2A2E39]' : 'text-[#d1d4dc]'}`}
               onClick={() => { setDrawingTool('rectangle'); toast.info('Click and drag to draw rectangle'); }}
               title="Rectangle"
            >
               <Square size={20} />
            </div>
            
            <div className="w-8 h-px bg-[#2B2B43]" />

            <div 
               className="p-2 hover:bg-[#2A2E39] rounded cursor-pointer text-[#d1d4dc]" 
               onClick={() => chartRef.current?.timeScale().fitContent()}
               title="Reset Zoom"
            >
               <RefreshCw size={20} />
            </div>

            <div 
               className="p-2 hover:bg-[#2A2E39] rounded cursor-pointer text-[#d1d4dc]"
               onClick={handleZoomIn}
               title="Zoom In"
            >
               <ZoomIn size={20} />
            </div>
            <div 
               className="p-2 hover:bg-[#2A2E39] rounded cursor-pointer text-[#d1d4dc]"
               onClick={handleZoomOut}
               title="Zoom Out"
            >
               <ZoomOut size={20} />
            </div>

            <div className="w-8 h-px bg-[#2B2B43]" />

            <div 
               className="p-2 hover:bg-[#2A2E39] rounded cursor-pointer text-red-500" 
               onClick={clearDrawings}
               title="Clear All Drawings"
            >
               <Trash2 size={20} />
            </div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative bg-[#131722]">
          <div ref={chartContainerRef} className="w-full h-full" />
          
          {/* SVG Overlay for Custom Drawings */}
          <svg 
            className={`absolute inset-0 w-full h-full z-10 ${drawingTool !== 'cursor' && drawingTool !== 'horizontal' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
            onMouseDown={handleOverlayMouseDown}
            onMouseMove={handleOverlayMouseMove}
            onMouseUp={handleOverlayMouseUp}
          >
             {renderSVGElements}
          </svg>

          {/* Professional Signal Overlay */}
          {activeSignal && (
            <div className="absolute top-4 right-16 w-72 bg-[#1E222D]/95 backdrop-blur shadow-2xl rounded-lg border border-[#2B2B43] overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-none">
              <div className={`p-3 border-b border-[#2B2B43] flex justify-between items-center ${
                  activeSignal.type === 'Buy' ? 'bg-[#089981]/10' : 
                  activeSignal.type === 'Sell' ? 'bg-[#F23645]/10' : ''
              }`}>
                <div className="flex items-center space-x-2">
                    <span className={`font-bold ${
                        activeSignal.type === 'Buy' ? 'text-[#089981]' : 
                        activeSignal.type === 'Sell' ? 'text-[#F23645]' : 'text-white'
                    }`}>
                        {activeSignal.type?.toUpperCase()}
                    </span>
                    <span className="text-[#787B86] text-sm">{activeSignal.symbol}</span>
                </div>
                <div className="text-xs text-[#787B86]">
                    {activeSignal.createdAt ? new Date(activeSignal.createdAt).toLocaleTimeString() : ''}
                </div>
              </div>
              
              <div className="p-4 space-y-3 pointer-events-auto">
                 <div className="flex justify-between items-center">
                    <span className="text-[#787B86] text-sm">Entry Price</span>
                    <span className="font-mono text-white font-medium bg-[#2962FF]/20 px-2 py-0.5 rounded text-[#2962FF]">{activeSignal.entry}</span>
                 </div>
                 
                 <div className="h-px bg-[#2B2B43] my-2" />

                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[#787B86] text-xs">Take Profit 1</span>
                        <span className="font-mono text-[#089981]">{activeSignal.tp1}</span>
                    </div>
                    {activeSignal.tp2 && (
                        <div className="flex justify-between items-center">
                            <span className="text-[#787B86] text-xs">Take Profit 2</span>
                            <span className="font-mono text-[#089981]">{activeSignal.tp2}</span>
                        </div>
                    )}
                    {activeSignal.tp3 && (
                        <div className="flex justify-between items-center">
                            <span className="text-[#787B86] text-xs">Take Profit 3</span>
                            <span className="font-mono text-[#089981]">{activeSignal.tp3}</span>
                        </div>
                    )}
                 </div>

                 <div className="h-px bg-[#2B2B43] my-2" />

                 <div className="flex justify-between items-center">
                    <span className="text-[#787B86] text-sm">Stop Loss</span>
                    <span className="font-mono text-[#F23645] font-medium bg-[#F23645]/10 px-2 py-0.5 rounded">{activeSignal.stopLoss}</span>
                 </div>
              </div>
            </div>
          )}
          
          {/* Watermark / Background Text */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[100px] font-bold text-[#2A2E39]/20 pointer-events-none select-none z-0">
             {symbol}
          </div>
        </div>
      </div>
    </div>
  );
}
