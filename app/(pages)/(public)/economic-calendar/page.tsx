'use client';

import React, { useEffect, useRef } from 'react';

const EconomicCalendarPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        colorTheme: 'dark',
        isTransparent: false,
        locale: 'en',
        countryFilter: 'ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu',
        importanceFilter: '-1,0,1',
        width: '100%',
        height: '100%'
      });

      // Clear previous content if any (though unlikely on mount)
      containerRef.current.innerHTML = '';
      
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container';
      
      const widget = document.createElement('div');
      widget.className = 'tradingview-widget-container__widget';
      
      const copyright = document.createElement('div');
      copyright.className = 'tradingview-widget-copyright';
      copyright.innerHTML = `
        <a href="https://www.tradingview.com/economic-calendar/" rel="noopener nofollow" target="_blank">
          <span class="blue-text">Economic Calendar</span>
        </a>
        <span class="trademark"> by TradingView</span>
      `;

      widgetContainer.appendChild(widget);
      widgetContainer.appendChild(copyright);
      widgetContainer.appendChild(script);
      
      containerRef.current.appendChild(widgetContainer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 px-4 pb-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-primary-400">Economic Calendar</h1>
        <div className="bg-gray-800 rounded-xl p-4 shadow-2xl border border-gray-700 h-[800px]">
          <div ref={containerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export default EconomicCalendarPage;
