"use client";

import { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  CrosshairMode, 
  IChartApi, 
  ISeriesApi, 
  LineStyle, 
  CandlestickSeries, 
  AreaSeries,
  Time 
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
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

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

const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: 'D', value: '1d' },
  { label: 'W', value: '1w' },
];

export default function InteractiveChart({ symbol = 'XAUUSD', signal }: InteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick" | "Area"> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  
  const [activeSignal, setActiveSignal] = useState<any>(null);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState<'candles' | 'area'>('candles');
  const [showSignalLines, setShowSignalLines] = useState(true);
  const [crosshairMode, setCrosshairMode] = useState<CrosshairMode>(CrosshairMode.Normal);

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
          const data = await res.json();
          
          if (data.status === 'success' && data.data.signals.length > 0) {
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

    // Dispose old chart if exists
    if (chartRef.current) {
      chartRef.current.remove();
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
      
      if (data.length > 0) {
        if (chartType === 'area') {
           // Area series needs just time and value (close)
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
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, timeframe, chartType, crosshairMode]);

  // Draw Signal Lines
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    // Clear previous lines
    priceLinesRef.current.forEach(line => {
      seriesRef.current?.removePriceLine(line);
    });
    priceLinesRef.current = [];

    if (!activeSignal || !showSignalLines) return;
    
    const { entry, tp1, tp2, tp3, stopLoss } = activeSignal;

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

    createLine(entry, '#2962FF', 'ENTRY', LineStyle.Solid, 2);
    createLine(tp1, '#089981', 'TP1', LineStyle.Dashed, 1);
    if(tp2) createLine(tp2, '#089981', 'TP2', LineStyle.Dashed, 1);
    if(tp3) createLine(tp3, '#089981', 'TP3', LineStyle.Dashed, 1);
    createLine(stopLoss, '#F23645', 'SL', LineStyle.Solid, 2);

  }, [activeSignal, showSignalLines, chartType]); // Re-run when chartType changes because series is recreated

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
    if (chartRef.current) {
        const timeScale = chartRef.current.timeScale();
        const range = timeScale.getVisibleLogicalRange();
        if (range) {
            const span = range.to - range.from;
            const newSpan = span * 0.8;
            const center = (range.from + range.to) / 2;
            timeScale.setVisibleLogicalRange({
                from: center - newSpan / 2,
                to: center + newSpan / 2,
            });
        }
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
        const timeScale = chartRef.current.timeScale();
        const range = timeScale.getVisibleLogicalRange();
        if (range) {
            const span = range.to - range.from;
            const newSpan = span * 1.25;
            const center = (range.from + range.to) / 2;
            timeScale.setVisibleLogicalRange({
                from: center - newSpan / 2,
                to: center + newSpan / 2,
            });
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
        {/* Left Drawing Toolbar - Functional View Tools */}
        <div className="w-12 border-r border-[#2B2B43] flex flex-col items-center py-4 space-y-4 bg-[#131722] z-20">
            <div 
               className={`p-2 hover:bg-[#2A2E39] rounded cursor-pointer ${crosshairMode === CrosshairMode.Magnet ? 'text-[#2962FF]' : 'text-[#d1d4dc]'}`}
               onClick={() => setCrosshairMode(prev => prev === CrosshairMode.Normal ? CrosshairMode.Magnet : CrosshairMode.Normal)}
               title="Magnet Mode"
            >
               <Crosshair size={20} />
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
               className="p-2 hover:bg-[#2A2E39] rounded cursor-pointer text-[#d1d4dc]"
               onClick={() => setShowSignalLines(!showSignalLines)}
               title={showSignalLines ? "Hide Signal Lines" : "Show Signal Lines"}
            >
               {showSignalLines ? <Eye size={20} /> : <EyeOff size={20} />}
            </div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative bg-[#131722]">
          <div ref={chartContainerRef} className="w-full h-full" />
          
          {/* Professional Signal Overlay */}
          {activeSignal && (
            <div className="absolute top-4 right-16 w-72 bg-[#1E222D]/95 backdrop-blur shadow-2xl rounded-lg border border-[#2B2B43] overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <div className={`p-3 border-b border-[#2B2B43] flex justify-between items-center ${
                  activeSignal.type === 'Buy' ? 'bg-[#089981]/10' : 
                  activeSignal.type === 'Sell' ? 'bg-[#F23645]/10' : ''
              }`}>
                <div className="flex items-center space-x-2">
                    <span className={`font-bold ${
                        activeSignal.type === 'Buy' ? 'text-[#089981]' : 
                        activeSignal.type === 'Sell' ? 'text-[#F23645]' : 'text-white'
                    }`}>
                        {activeSignal.type.toUpperCase()}
                    </span>
                    <span className="text-[#787B86] text-sm">{activeSignal.symbol}</span>
                </div>
                <div className="text-xs text-[#787B86]">
                    {new Date(activeSignal.createdAt).toLocaleTimeString()}
                </div>
              </div>
              
              <div className="p-4 space-y-3">
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
              
              <div className="p-2 bg-[#2A2E39]/50 border-t border-[#2B2B43] text-center">
                <p className="text-[10px] text-[#787B86]">
                   Risk Warning: Trading involves significant risk.
                </p>
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
