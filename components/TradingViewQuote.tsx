"use client";

import React, { useEffect, useRef, memo } from 'react';

function TradingViewQuote() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Check if script already exists to prevent duplicates
    if (container.current.querySelector('script')) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbol": "NASDAQ:AAPL",
      "colorTheme": "dark",
      "isTransparent": false,
      "locale": "en",
      "width": 350
    });
    
    container.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      <style jsx global>{`
        .tradingview-widget-copyright {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

export default memo(TradingViewQuote);
