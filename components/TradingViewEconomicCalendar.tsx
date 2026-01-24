"use client";

import React, { useEffect, useRef, memo } from 'react';
import { useLocale, useTranslations } from 'next-intl';

function TradingViewEconomicCalendar() {
  const container = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const t = useTranslations('TradingView');

  useEffect(() => {
    if (!container.current) return;

    // Check if script already exists
    if (container.current.querySelector('script')) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "colorTheme": "dark",
      "isTransparent": false,
      "locale": locale,
      "countryFilter": "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
      "importanceFilter": "-1,0,1",
      "width": "100%",
      "height": "100%"
    });
    
    container.current.appendChild(script);
  }, [locale]);

  return (
    <div className="tradingview-widget-container h-[600px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#05070a]" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
      <div className="tradingview-widget-copyright px-4 py-2 text-xs text-white/40">
        <a href="https://www.tradingview.com/economic-calendar/" rel="noopener nofollow" target="_blank" className="hover:text-white transition-colors">
          <span className="blue-text">{t('economic_calendar')}</span>
        </a>
        <span className="trademark">{t('by_tradingview')}</span>
      </div>
    </div>
  );
}

export default memo(TradingViewEconomicCalendar);
