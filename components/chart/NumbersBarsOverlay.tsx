import { useEffect, useRef, useState, useCallback } from 'react';
import { IChartApi, ISeriesApi, LogicalRange, MouseEventParams, Logical } from 'lightweight-charts';
import { FootprintCandle } from '@/lib/footprint/aggregator';
import { useChartStore } from '@/store/useChartStore';

interface NumbersBarsOverlayProps {
  chart: IChartApi;
  series: ISeriesApi<"Candlestick">;
  data: FootprintCandle[];
}

export function NumbersBarsOverlay({ chart, series, data }: NumbersBarsOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { footprintSettings } = useChartStore();
  const [visibleRange, setVisibleRange] = useState<LogicalRange | null>(null);
  const [hoveredData, setHoveredData] = useState<{ x: number, y: number, candle: FootprintCandle } | null>(null);

  const formatVol = (vol: number) => {
      if (vol >= 1000000) return (vol / 1000000).toFixed(1) + 'M';
      if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K';
      return vol.toString();
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !footprintSettings.enabled) {
        if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const range = chart.timeScale().getVisibleLogicalRange();
    if (!range) {
        ctx.restore();
        return;
    }

    // Performance Cap
    const count = range.to - range.from;
    if (count > footprintSettings.maxCandlesRendered) {
        // Draw "Zoom in" text
        ctx.fillStyle = footprintSettings.enabled ? '#737373' : 'transparent';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Zoom in to view Numbers', canvas.width / (2 * dpr), canvas.height / (2 * dpr));
        ctx.restore();
        return;
    }

    const start = Math.max(0, Math.floor(range.from));
    const end = Math.min(data.length - 1, Math.ceil(range.to));

    // Font settings
    const fontSize = footprintSettings.fontSize;
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'middle';
    
    for (let i = start; i <= end; i++) {
      const candle = data[i];
      if (!candle) continue;

      const x = chart.timeScale().logicalToCoordinate(i as Logical);
      if (x === null) continue;

      const barWidth = chart.timeScale().options().barSpacing * 0.8; 
      if (barWidth < 20) continue; 

      const maxVol = candle.maxVolLevel ? (candle.levels.find(l => l.price === candle.maxVolLevel)?.total || 0) : 0;
      
      candle.levels.forEach(level => {
        const y = series.priceToCoordinate(level.price);
        if (y === null) return;

        const cellHeight = 14; 
        const halfWidth = barWidth / 2;
        const leftX = x - halfWidth;
        const rightX = x;
        
        // Bid (Left)
        if (level.bidVol > 0) {
            const intensity = maxVol > 0 ? level.bidVol / maxVol : 0;
            ctx.fillStyle = `rgba(255, 82, 82, ${intensity * 0.8})`; 
            ctx.fillRect(leftX, y - cellHeight/2, halfWidth, cellHeight);
        }
        
        // Ask (Right)
        if (level.askVol > 0) {
            const intensity = maxVol > 0 ? level.askVol / maxVol : 0;
            ctx.fillStyle = `rgba(0, 230, 118, ${intensity * 0.8})`; 
            ctx.fillRect(rightX, y - cellHeight/2, halfWidth, cellHeight);
        }
        
        // Draw Text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        if (level.bidVol > 0) ctx.fillText(formatVol(level.bidVol), x - 2, y);
        
        ctx.textAlign = 'left';
        if (level.askVol > 0) ctx.fillText(formatVol(level.askVol), x + 2, y);

        // Imbalance Markers
        if (footprintSettings.showImbalances && level.imbalance) {
             ctx.strokeStyle = '#FFFF00';
             ctx.lineWidth = 1;
             if (level.imbalance === 'bid') {
                 ctx.strokeRect(leftX, y - cellHeight/2, halfWidth, cellHeight);
             } else {
                 ctx.strokeRect(rightX, y - cellHeight/2, halfWidth, cellHeight);
             }
        }
      });

      // Draw Delta/Total Card
      if (footprintSettings.showDeltaTotal) {
          const yBottom = series.priceToCoordinate(candle.low);
          if (yBottom !== null) {
              const cardY = yBottom + 20;
              ctx.fillStyle = 'rgba(30,30,30,0.8)';
              ctx.fillRect(x - 40, cardY, 80, 30);
              
              ctx.fillStyle = '#aaa';
              ctx.font = '10px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(`Δ ${formatVol(candle.delta)}`, x, cardY + 10);
              ctx.fillText(`Σ ${formatVol(candle.totalVolume)}`, x, cardY + 22);
          }
      }
    }

    ctx.restore();
  }, [chart, data, footprintSettings, series]);

  // Sync canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      render();
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [chart, render]);

  // Subscribe to chart updates
  useEffect(() => {
    const onRangeChange = (newRange: LogicalRange | null) => {
      setVisibleRange(newRange);
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange);
    // Don't call setState synchronously in effect
    // setVisibleRange(chart.timeScale().getVisibleLogicalRange());
    
    // Instead, rely on initial render or async update if needed?
    // Or just use a ref to track if we have initialized?
    // Actually, we can just call the handler manually but outside strict effect rules?
    // No, React 18 strict mode double-invokes effects.
    
    // Better: Use a timeout or requestAnimationFrame to defer the initial set?
    setTimeout(() => {
        setVisibleRange(chart.timeScale().getVisibleLogicalRange());
    }, 0);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRangeChange);
    };
  }, [chart]);

  // Render Loop
  useEffect(() => {
    render();
  }, [visibleRange, data, footprintSettings, render]);

  // Mouse Move / Tooltip
  useEffect(() => {
    if (!footprintSettings.enabled) return;

    const handleCrosshairMove = (param: MouseEventParams) => {
        if (!param.point || !param.time) {
            setHoveredData(null);
            return;
        }

        // Try to find candle by time first
        const timeVal = typeof param.time === 'object' && param.time !== null && 'value' in param.time
             ? (param.time as { value: number }).value 
             : param.time as number;
        // param.time for candles is usually Unix timestamp (number) if data was provided as such.
        
        const found = data.find(c => c.time === timeVal);
        
        if (found) {
            const x = chart.timeScale().timeToCoordinate(param.time);
            if (x !== null) {
                setHoveredData({ x, y: param.point.y, candle: found });
            }
        } else {
             setHoveredData(null);
        }
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);
    return () => {
        chart.unsubscribeCrosshairMove(handleCrosshairMove);
    };
  }, [chart, data, footprintSettings.enabled]);

  return (
    <>
      <canvas 
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 5, 
          pointerEvents: 'none' 
        }}
      />
      {hoveredData && footprintSettings.enabled && (
        <div style={{
            position: 'absolute',
            left: hoveredData.x + 20,
            top: hoveredData.y - 20,
            zIndex: 50,
            background: 'rgba(20, 20, 30, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#fff',
            pointerEvents: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            minWidth: '140px'
        }}>
            <div className="font-bold mb-2 pb-2 border-b border-white/10 flex justify-between">
                <span>Stats</span>
                <span className="text-xs text-muted-foreground font-normal">
                    {new Date(hoveredData.candle.time * 1000).toLocaleTimeString()}
                </span>
            </div>
            <div className="grid grid-cols-[1fr,auto] gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground">Delta</span>
                <span className={`font-mono font-medium ${hoveredData.candle.delta > 0 ? 'text-green-400' : hoveredData.candle.delta < 0 ? 'text-red-400' : ''}`}>
                    {hoveredData.candle.delta > 0 ? '+' : ''}{formatVol(hoveredData.candle.delta)}
                </span>
                
                <span className="text-muted-foreground">Total Vol</span>
                <span className="font-mono">{formatVol(hoveredData.candle.totalVolume)}</span>
                
                <span className="text-muted-foreground">Max Level</span>
                <span className="font-mono">
                    {formatVol(hoveredData.candle.maxVolLevel ? (hoveredData.candle.levels.find(l => l.price === hoveredData.candle.maxVolLevel)?.total || 0) : 0)}
                </span>
            </div>
        </div>
      )}
    </>
  );
}
