"use client";

import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Link from "next/link";
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const t = useTranslations('Header');
  const tSwitcher = useTranslations('Switcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const switchLanguage = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    const segments = pathname.split('/');
    // Handle the case where pathname might not start with locale or is root
    // Typically in app/[locale], pathname starts with /en or /ar
    if (segments.length > 1 && (segments[1] === 'en' || segments[1] === 'ar')) {
        segments[1] = newLocale;
    } else {
        // If for some reason the locale isn't the first segment (unlikely in this setup but good for safety)
        // or it's just /
        // We might just want to prepend or replace. 
        // Given the structure app/[locale], it should be fine.
        // If it was just /, it would be redirected by middleware usually.
        // Let's stick to the logic from page.tsx for consistency.
        segments[1] = newLocale; 
    }
    router.push(segments.join('/'));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#010203]/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/${locale}`} className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-300 to-emerald-400 text-[10px] font-semibold tracking-[0.18em] text-[#010203]">
                {t('brand_short')}
                <span className="absolute -inset-px rounded-2xl border border-white/40/20" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[13px] font-semibold tracking-[0.18em] uppercase text-white/90">
                  {t('brand_name')}
                </span>
                <span className="text-[11px] text-white/40">
                  {t('brand_subtitle')}
                </span>
              </div>
            </Link>
          </div>
          <div className="hidden items-center gap-3 text-[11px] text-white/50 sm:flex">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-200">
              {t('status')}
            </span>
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            <span>{t('response_time')}</span>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-white/5" />
            ) : user ? (
              <Link href={`/${locale}/profile`}>
                <Avatar className="h-9 w-9 border border-white/10 transition hover:border-emerald-400/50">
                  <AvatarImage src={(user.photo as string) || (user.image as string)} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-sky-500/20 text-xs font-bold text-emerald-400">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <>
                <Link href={`/${locale}/login`} className="hidden rounded-full border border-white/15 px-4 py-2 text-[11px] font-medium text-white/80 shadow-sm transition hover:border-cyan-300/60 hover:bg-white/5 md:inline-flex">
                  {t('login')}
                </Link>
                <Link href={`/${locale}/signup`} className="rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 px-4 py-2 text-[11px] font-semibold text-[#010203] shadow-[0_0_28px_rgba(56,189,248,0.45)] transition hover:brightness-110">
                  {t('create_space')}
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3 pb-3">
          <div className="hidden items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/60 px-4 py-2.5 shadow-[0_0_50px_rgba(15,23,42,0.6)] backdrop-blur md:flex">
            <nav className="flex items-center gap-3 text-[12px] text-white/65">
              <Link href={`/${locale}#home`} className="rounded-full bg-white/10 px-3 py-1.5 text-white">
                {t('nav.home')}
              </Link>
              <Link href={`/${locale}#about`} className="rounded-full px-3 py-1.5 hover:bg-white/5">
                {t('nav.about')}
              </Link>
              <Link href={`/${locale}/chart`} className="rounded-full px-3 py-1.5 hover:bg-white/5">
                {t('nav.chart')}
              </Link>
              <Link href={`/${locale}#chart`} className="rounded-full px-3 py-1.5 hover:bg-white/5">
                {t('nav.dashboard')}
              </Link>
              <Link href={`/${locale}/payment`} className="rounded-full px-3 py-1.5 hover:bg-white/5">
                {t('nav.pricing')}
              </Link>
              <Link href={`/${locale}/news`} className="rounded-full px-3 py-1.5 hover:bg-white/5">
                {t('nav.news')}
              </Link>
              <Link href={`/${locale}#contact`} className="rounded-full px-3 py-1.5 hover:bg-white/5">
                {t('nav.contact')}
              </Link>
            </nav>
            <div className="flex flex-1 items-center justify-end gap-2 pl-4">
              <button 
                onClick={switchLanguage}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-[#05070a] px-4 py-2 text-[11px] font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px]">
                  {locale === 'ar' ? 'EN' : 'AR'}
                </span>
                <span>{tSwitcher('change_language')}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/70 px-3 py-2 text-[11px] text-white/70 md:hidden">
            <div className="flex-1">
              <div className="mb-1 flex gap-1.5 overflow-x-auto">
                <span className="whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white">
                  {t('nav.home')}
                </span>
                <span className="whitespace-nowrap rounded-full bg-white/5 px-2.5 py-1">
                  {t('nav.about')}
                </span>
                <span className="whitespace-nowrap rounded-full bg-white/5 px-2.5 py-1">
                  {t('nav.dashboard')}
                </span>
                <Link href={`/${locale}/payment`} className="whitespace-nowrap rounded-full bg-white/5 px-2.5 py-1">
                  {t('nav.pricing')}
                </Link>
              </div>
              <button 
                onClick={switchLanguage}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-[#05070a] px-3 py-1.5 text-[10px] font-medium text-white/70 transition hover:bg-white/5"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[8px]">
                  {locale === 'ar' ? 'EN' : 'AR'}
                </span>
                <span>{tSwitcher('change_language')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
