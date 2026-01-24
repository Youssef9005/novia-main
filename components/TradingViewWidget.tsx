import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
}

function TradingViewWidget({ symbol = "NASDAQ:AAPL" }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    // Clear previous content to prevent duplicates
    container.current.innerHTML = '';
    
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    container.current.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Adjust symbol for TradingView format if needed
    // Simple mapping: XAUUSD -> OANDA:XAUUSD or similar if needed.
    // For now, we pass it as is, or try to guess.
    let tvSymbol = symbol;
    if (symbol === 'XAUUSD' || symbol === 'GOLD') tvSymbol = 'OANDA:XAUUSD';
    else if (symbol === 'BTCUSDT') tvSymbol = 'BINANCE:BTCUSDT';
    else if (symbol === 'ETHUSDT') tvSymbol = 'BINANCE:ETHUSDT';
    else if (symbol === 'EURUSD') tvSymbol = 'FX:EURUSD';
    else if (symbol === 'GBPUSD') tvSymbol = 'FX:GBPUSD';
    else if (symbol === 'US30') tvSymbol = 'BLACKBULL:US30'; // Or similar
    else if (symbol === 'NAS100') tvSymbol = 'BLACKBULL:US100';

    script.innerHTML = JSON.stringify({
      "symbol": tvSymbol,
      "width": 350,
      "colorTheme": "dark",
      "isTransparent": false, // User had false
      "locale": "en"
    });
    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ pointerEvents: 'auto' }}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

export default memo(TradingViewWidget);
