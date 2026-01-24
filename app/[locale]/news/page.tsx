"use client";

import { useTranslations } from 'next-intl';
import TradingViewEconomicCalendar from '@/components/TradingViewEconomicCalendar';

export default function NewsPage() {
  const t = useTranslations('News');

  return (
    <div className="min-h-screen bg-[#010203] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {t('description')}
          </p>
        </div>
        
        <div className="h-[800px] w-full">
            <TradingViewEconomicCalendar />
        </div>
      </div>
    </div>
  );
}
