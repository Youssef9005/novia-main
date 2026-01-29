"use client";

import React, { useEffect, useRef, memo } from 'react';

function TradingViewQuote() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(
    () => {
      if (!container.current) return;
      
      // Clear container content to prevent duplicates if re-rendering
      container.current.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
      
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbol": "NASDAQ:AAPL",
        "colorTheme": "dark",
        "isTransparent": true,
        "locale": "en",
        "width": 350
      });
      container.current.appendChild(script);
    },
    []
  );

  return (
    <div className="tradingview-widget-container relative" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      
      {/* Masking overlays to cover internal branding */}
      <div className="absolute bottom-0 left-0 w-[120px] h-[32px] bg-[#050505] z-20 pointer-events-none opacity-100" />
      <div className="absolute bottom-0 right-0 w-[120px] h-[32px] bg-[#050505] z-20 pointer-events-none opacity-100" />
      
      <div className="tradingview-widget-copyright" style={{ display: 'none' }}>
        <a href="https://www.tradingview.com/symbols/NASDAQ-AAPL/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">AAPL stock price</span>
        </a>
        <span className="trademark"> by TradingView</span>
      </div>
      <style jsx global>{`
        .tradingview-widget-copyright {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
          position: absolute !important;
          z-index: -1 !important;
        }
      `}</style>
    </div>
  );
}

export default memo(TradingViewQuote);
