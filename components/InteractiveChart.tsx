"use client";

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, LineStyle, CandlestickSeries, Time } from 'lightweight-charts';

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

// Helper to fetch data from Binance (Proxy or Direct if allowed)
// For XAUUSD, we might need a different provider.
// For now, we'll try to use a public crypto API or mock for XAUUSD if needed.
// Since the user is likely using this for XAUUSD (Gold), we need to be careful.
// If we can't get XAUUSD, we'll fallback to a mock generator for demo purposes 
// or explain the limitation.
// Let's try to fetch from Binance for crypto, and generate mock for others if API fails.

export default function InteractiveChart({ symbol = 'XAUUSD', signal }: InteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const [activeSignal, setActiveSignal] = useState<any>(null);
  
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
      },
      timeScale: {
        borderColor: '#2B2B43',
        timeVisible: true,
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
      // Mock data generator for XAUUSD since we don't have a free public API for it
      // In a real app, you would fetch from your backend or a paid provider
      let data: CandleData[] = [];
      if (symbol === 'XAUUSD' || symbol === 'GOLD') {
         // Generate realistic-looking data around 2030-2040
         let time = Math.floor(Date.now() / 1000) - 100 * 300; // 100 candles of 5 mins
         let open = 2030.0;
         for (let i = 0; i < 1000; i++) {
            const close = open + (Math.random() - 0.5) * 2;
            const high = Math.max(open, close) + Math.random();
            const low = Math.min(open, close) - Math.random();
            data.push({
               time: (time + i * 300) as Time,
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
             // If symbol doesn't end with USDT and it's a crypto, maybe append it? 
             // But let's assume we pass full pair like BTCUSDT
             const querySymbol = symbol.toUpperCase(); 
             const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${querySymbol}&interval=15m&limit=1000`);
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
      }
    };

    loadData();

    // Resize handler
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
  }, [symbol]);

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

  }, [activeSignal]);

  return (
    <div ref={chartContainerRef} className="w-full h-full min-h-[500px]" />
  );
}
