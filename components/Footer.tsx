"use client";

import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#020305]">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">

        <div className="mt-8 md:order-1 md:mt-0">
          <p className="text-center text-xs leading-5 text-white/40">
            &copy; <span suppressHydrationWarning>{currentYear}</span> {t('brand')}. {t('rights_reserved')}.
          </p>
        </div>
      </div>
    </footer>
  );
}
