"use client";

import React, { useEffect, useRef, memo } from 'react';
import { useLocale, useTranslations } from 'next-intl';

interface Props {
  interval?: string;
}

function TradingViewTechnicalAnalysis({ interval = '1m' }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const t = useTranslations('TradingView');

  // Map interval to TradingView format
  const getTVInterval = (i: string) => {
    if (i === '1d') return '1D';
    if (i === '1w') return '1W';
    if (i === '1M') return '1M';
    return i;
  };

  useEffect(() => {
    if (!container.current) return;
    
    // Clear existing widget to allow re-render on interval change
    container.current.innerHTML = '';
    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container__widget h-full w-full";
    container.current.appendChild(wrapper);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "colorTheme": "dark",
      "displayMode": "single",
      "isTransparent": true,
      "locale": locale,
      "interval": getTVInterval(interval),
      "disableInterval": false,
      "width": "100%",
      "height": "100%",
      "symbol": "BINANCE:BTCUSDT",
      "showIntervalTabs": true
    });
    
    container.current.appendChild(script);
  }, [locale, interval]);

  return (
    <div className="tradingview-widget-container h-full w-full overflow-hidden" ref={container}>
      <div className="tradingview-widget-copyright px-4 py-2 text-xs text-white/40 bg-transparent flex justify-between items-center absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <a href="https://www.tradingview.com/symbols/BTCUSDT/technicals/" rel="noopener nofollow" target="_blank" className="flex items-center gap-2 hover:text-white transition-colors group pointer-events-auto">
          <span className="blue-text font-bold tracking-wide group-hover:text-[#2962FF] transition-colors">{t('technical_analysis', {symbol: 'BTCUSDT'})}</span>
        </a>
        <span className="trademark text-[10px] uppercase tracking-wider font-bold opacity-50">{t('by_tradingview')}</span>
      </div>
    </div>
  );
}

export default memo(TradingViewTechnicalAnalysis);
