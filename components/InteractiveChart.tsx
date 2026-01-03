"use client";

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, LineStyle, CandlestickSeries, Time } from 'lightweight-charts';
import { Button } from '@/components/ui/button';

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
  { label: '1M', value: '1m', interval: '1m' },
  { label: '5M', value: '5m', interval: '5m' },
  { label: '15M', value: '15m', interval: '15m' },
  { label: '1H', value: '1h', interval: '1h' },
  { label: '4H', value: '4h', interval: '4h' },
  { label: '1D', value: '1d', interval: '1d' },
];

export default function InteractiveChart({ symbol = 'XAUUSD', signal }: InteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const [activeSignal, setActiveSignal] = useState<any>(null);
  const [timeframe, setTimeframe] = useState('1h');
  
  // Set active signal from prop or fetch
  useEffect(() => {
    if (signal) {
      setActiveSignal(signal);
    } else {
      // Existing fetch logic...
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

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1E1E1E' },
        textColor: '#DDD',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 600,
      crosshair: {
        mode: CrosshairMode.Normal,
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

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Load Data
    const loadData = async () => {
      let data: CandleData[] = [];
      if (symbol === 'XAUUSD' || symbol === 'GOLD') {
         // Generate realistic-looking data
         // Adjust time step based on timeframe
         const timeStep = timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '15m' ? 900 : timeframe === '1h' ? 3600 : timeframe === '4h' ? 14400 : 86400;
         let time = Math.floor(Date.now() / 1000) - 1000 * timeStep;
         let open = 2030.0;
         for (let i = 0; i < 1000; i++) {
            const close = open + (Math.random() - 0.5) * (timeStep / 60); // Volatility scales with time
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
         // Try Binance for Crypto
         try {
             const querySymbol = symbol.toUpperCase(); 
             const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${querySymbol}&interval=${timeframe}&limit=1000`);
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
        candleSeries.setData(data);
        
        // Fit Content initially
        chart.timeScale().fitContent();
      }
    };

    loadData();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, timeframe]);

  // Draw Signal Lines
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;

    // Clear previous lines
    priceLinesRef.current.forEach(line => {
      candleSeriesRef.current?.removePriceLine(line);
    });
    priceLinesRef.current = [];

    if (!activeSignal) return;
    
    const { entry, tp1, tp2, tp3, tp4, stopLoss } = activeSignal;

    const createLine = (price: string, color: string, title: string, style: LineStyle = LineStyle.Solid) => {
        if (!price) return;
        const line = candleSeriesRef.current?.createPriceLine({
            price: parseFloat(price),
            color,
            lineWidth: 2,
            lineStyle: style,
            axisLabelVisible: true,
            title,
        });
        if (line) priceLinesRef.current.push(line);
    };

    createLine(entry, '#2962FF', 'ENTRY', LineStyle.Solid);
    createLine(tp1, '#00E676', 'TP1', LineStyle.Dashed);
    createLine(tp2, '#00E676', 'TP2', LineStyle.Dashed);
    createLine(tp3, '#00E676', 'TP3', LineStyle.Dashed);
    createLine(tp4, '#00E676', 'TP4', LineStyle.Dashed);
    createLine(stopLoss, '#FF1744', 'STOP LOSS', LineStyle.Solid);
    
    // Auto-focus logic: Ensure entry and targets are visible
    // We can't directly "set visible price range" easily in LW charts without calculating it manually.
    // However, chart.timeScale().fitContent() fits the TIME.
    // Price scale is usually auto. 
    // If the signal prices are way off the current data, we might need to adjust.
    // But usually, signal corresponds to current price.

  }, [activeSignal]);

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="flex items-center space-x-2 p-2 bg-[#1E1E1E] border-b border-[#2B2B43] z-10">
        <div className="font-bold text-white mr-4">{symbol}</div>
        {TIMEFRAMES.map((tf) => (
          <Button 
            key={tf.value}
            variant={timeframe === tf.value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTimeframe(tf.value)}
            className="h-7 text-xs"
          >
            {tf.label}
          </Button>
        ))}
      </div>
      <div ref={chartContainerRef} className="w-full flex-1 min-h-[500px]" />
      
      {/* Floating Signal Info Overlay (Optional: "In the middle of the screen") */}
      {activeSignal && (
        <div className="absolute top-14 right-4 bg-black/70 p-4 rounded text-xs text-white backdrop-blur-sm border border-white/10 pointer-events-none">
          <div className="font-bold text-sm mb-2">{activeSignal.type} Signal</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
             <div>Entry:</div><div className="font-mono">{activeSignal.entry}</div>
             <div className="text-green-400">TP1:</div><div className="font-mono text-green-400">{activeSignal.tp1}</div>
             {activeSignal.tp2 && <><div className="text-green-400">TP2:</div><div className="font-mono text-green-400">{activeSignal.tp2}</div></>}
             <div className="text-red-400">SL:</div><div className="font-mono text-red-400">{activeSignal.stopLoss}</div>
          </div>
        </div>
      )}
    </div>
  );
}
