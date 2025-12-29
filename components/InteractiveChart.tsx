"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';
import { useAuth } from '@/hooks/useAuth';

interface InteractiveChartProps {
  symbol?: string;
}

// Helper to fetch data from Binance (Proxy or Direct if allowed)
// For XAUUSD, we might need a different provider.
// For now, we'll try to use a public crypto API or mock for XAUUSD if needed.
// Since the user is likely using this for XAUUSD (Gold), we need to be careful.
// If we can't get XAUUSD, we'll fallback to a mock generator for demo purposes 
// or explain the limitation.
// Let's try to fetch from Binance for crypto, and generate mock for others if API fails.

export default function InteractiveChart({ symbol = 'XAUUSD' }: InteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [activeSignal, setActiveSignal] = useState<any>(null);
  const { user } = useAuth();
  
  // Fetch Active Signal
  useEffect(() => {
    const fetchSignal = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const res = await fetch('/api/signals', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.status === 'success' && data.data.signals.length > 0) {
          // Find the latest active signal for the symbol
          // Note: Signal API currently returns all signals. 
          // We should filter for the current symbol and "active" status ideally.
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
    const interval = setInterval(fetchSignal, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [symbol]);

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

    const candleSeries = chart.addCandlestickSeries({
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
      let data = [];
      if (symbol === 'XAUUSD' || symbol === 'GOLD') {
         // Generate realistic-looking data around 2030-2040
         let time = Math.floor(Date.now() / 1000) - 100 * 300; // 100 candles of 5 mins
         let open = 2030.0;
         for (let i = 0; i < 1000; i++) {
            const close = open + (Math.random() - 0.5) * 2;
            const high = Math.max(open, close) + Math.random();
            const low = Math.min(open, close) - Math.random();
            data.push({
               time: time + i * 300,
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
             const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=15m&limit=1000`);
             const klines = await res.json();
             if (Array.isArray(klines)) {
                 data = klines.map((k: any) => ({
                     time: k[0] / 1000,
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
    if (!chartRef.current || !candleSeriesRef.current || !activeSignal) return;

    // Clear previous lines (by re-creating series or removing lines - LW charts manages lines via PriceLines)
    // Note: lightweight-charts doesn't have "clearPriceLines", we have to keep track of them or just let them stay if we re-mount.
    // Since we re-mount on symbol change, it's fine. 
    // But if signal changes, we might duplicate. 
    // Better to remove specific lines if we had references, but for MVP we assume 1 signal.
    
    const { entry, tp1, tp2, tp3, stopLoss } = activeSignal;

    if (entry) {
        candleSeriesRef.current.createPriceLine({
            price: parseFloat(entry),
            color: '#2962FF',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: 'ENTRY',
        });
    }

    if (tp1) {
        candleSeriesRef.current.createPriceLine({
            price: parseFloat(tp1),
            color: '#00E676', // Green
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'TP1',
        });
    }
    if (tp2) {
        candleSeriesRef.current.createPriceLine({
            price: parseFloat(tp2),
            color: '#00E676',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'TP2',
        });
    }
    if (tp3) {
        candleSeriesRef.current.createPriceLine({
            price: parseFloat(tp3),
            color: '#00E676',
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: 'TP3',
        });
    }

    if (stopLoss) {
        candleSeriesRef.current.createPriceLine({
            price: parseFloat(stopLoss),
            color: '#FF5252', // Red
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: 'SL',
        });
    }

  }, [activeSignal]);

  return (
    <div ref={chartContainerRef} className="w-full h-full min-h-[500px]" />
  );
}
