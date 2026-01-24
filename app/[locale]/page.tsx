"use client";
import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useParams } from "next/navigation";

interface Plan {
  _id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  maxTradingPairs: number;
  assetType: string[];
}

export default function Home() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("charts");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  const params = useParams();
  const locale = params.locale as string;

  const tHero = useTranslations('Hero');
  const tDemo = useTranslations('Demo');
  const tAbout = useTranslations('About');
  const tDashboard = useTranslations('Dashboard');
  const tPricing = useTranslations('Pricing');
  const tContact = useTranslations('Contact');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.plans.getAll();
        if (response.status === 'success' && response.data) {
          setPlans(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const tabs = [
    {
      id: "charts",
      label: tDemo('tab_charts'),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
    {
      id: "signals",
      label: tDemo('tab_signals'),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: "analysis",
      label: tDemo('tab_analysis'),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#010203] text-white">
      <main
        id="home"
        className="relative flex min-h-[calc(100vh-80px)] w-full flex-col items-center justify-center overflow-hidden"
      >
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />

        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-16 px-6 py-20 text-center lg:flex-row-reverse lg:items-center lg:justify-between lg:px-8 lg:text-right">
          <div className="relative max-w-2xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <p className="text-xs font-medium text-white/80">
              {tHero('badge')}
            </p>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            {tHero('title_start')} <br />
            {tHero('title_middle')}{" "}
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              novia ai
            </span>
          </h1>
          
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-white/60 lg:mx-0 lg:text-xl">
            {tHero('description')}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
            <Link href="/login" className="group relative flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-black transition-transform hover:scale-105">
              <span>{tHero('cta_primary')}</span>
              <span className="transition-transform group-hover:-translate-x-1">←</span>
            </Link>
            <button 
              onClick={() => setIsDemoOpen(true)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <span>{tHero('cta_secondary')}</span>
              <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 text-xs font-medium text-white/40 lg:justify-start">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{tHero('trial_badge')}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{tHero('credit_badge')}</span>
            </div>
          </div>
        </div>

        <div className="relative mt-12 w-full max-w-lg lg:mt-0">
          <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-sky-500/20 via-cyan-400/20 to-emerald-500/20 blur-xl" />
          <div className="relative flex flex-col gap-6 rounded-[32px] border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/20 to-cyan-300/20 text-cyan-300">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{tHero('performance_analysis')}</h3>
                  <p className="text-xs text-white/50">{tHero('live_update')}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                {tHero('stat_growth')}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                <div className="text-xs text-white/40">{tHero('active_users')}</div>
                <div className="mt-2 text-2xl font-bold text-white">{tHero('stat_users_value')}</div>
                <div className="mt-1 h-1 w-full rounded-full bg-white/10">
                  <div className="h-full w-[70%] rounded-full bg-sky-400" />
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10">
                <div className="text-xs text-white/40">{tHero('response_rate')}</div>
                <div className="mt-2 text-2xl font-bold text-white">{tHero('stat_response_value')}</div>
                <div className="mt-1 h-1 w-full rounded-full bg-white/10">
                  <div className="h-full w-[90%] rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-black/20 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">{tHero('resource_usage')}</span>
                <span className="text-white">{tHero('stat_resource_value')}</span>
              </div>
              <div className="flex h-32 items-end justify-between gap-2">
                {[40, 70, 45, 90, 65, 85, 50].map((h, i) => (
                  <div 
                    key={i} 
                    className="w-full rounded-t-sm bg-gradient-to-t from-white/5 to-white/20 transition-all hover:to-cyan-400/40"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-[#0a0a0a]/90 p-3 shadow-2xl backdrop-blur-md lg:-left-12">
            <div className="flex items-center gap-3">
              <div className="relative h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </div>
              <span className="text-xs font-medium text-white">{tHero('new_smart_alert')}</span>
            </div>
          </div>
        </div>
        </div>
      </main>

      {/* About Section */}
      <section id="about" className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)]" />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {tAbout('title_prefix')} <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">Novia AI</span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/60">
              {tAbout('description')}
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="group flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition-all duration-300 group-hover:bg-emerald-500/10 group-hover:ring-emerald-500/30 group-hover:scale-110">
                  <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold leading-7 text-white">{tAbout('feature1_title')}</h3>
                <p className="mt-4 flex flex-auto flex-col text-base leading-7 text-white/60">
                  {tAbout('feature1_desc')}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition-all duration-300 group-hover:bg-sky-500/10 group-hover:ring-sky-500/30 group-hover:scale-110">
                  <svg className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold leading-7 text-white">{tAbout('feature2_title')}</h3>
                <p className="mt-4 flex flex-auto flex-col text-base leading-7 text-white/60">
                  {tAbout('feature2_desc')}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition-all duration-300 group-hover:bg-purple-500/10 group-hover:ring-purple-500/30 group-hover:scale-110">
                  <svg className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold leading-7 text-white">{tAbout('feature3_title')}</h3>
                <p className="mt-4 flex flex-auto flex-col text-base leading-7 text-white/60">
                  {tAbout('feature3_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section id="chart" className="relative overflow-hidden py-20 sm:py-32 bg-black/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center">
            
            {/* Content Side */}
            <div className="flex-1 text-center lg:text-right">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {tDashboard('title_prefix')} <br />
                <span className="text-emerald-400">{tDashboard('title_highlight')}</span>
              </h2>
              <p className="mt-6 text-lg leading-8 text-white/60">
                {tDashboard('description')}
              </p>
              
              <ul className="mt-8 space-y-4 text-right">
                <li className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/80">{tDashboard('feature1')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10 text-sky-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/80">{tDashboard('feature2')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/80">{tDashboard('feature3')}</span>
                </li>
              </ul>

              <div className="mt-10 flex items-center justify-center gap-4 lg:justify-start">
                <button 
                  onClick={() => setIsDemoOpen(true)}
                  className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-emerald-400"
                >
                  {tDashboard('cta')}
                </button>
              </div>
            </div>

            {/* Visual Side */}
            <div className="relative flex-1">
              <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-sky-500/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#05070a] shadow-2xl">
                {/* Dashboard Mock Header */}
                <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
                  </div>
                  <div className="text-[10px] text-white/40">{tDashboard('mock_dashboard_title')}</div>
                </div>
                
                {/* Dashboard Mock Content */}
                <div className="p-4">
                  <div className="mb-4 flex gap-4">
                    <div className="flex-1 rounded-lg bg-white/5 p-3">
                      <div className="text-[10px] text-white/40">{tDashboard('mock_portfolio')}</div>
                      <div className="text-lg font-bold text-white">{tDashboard('mock_portfolio_value')}</div>
                      <div className="text-[10px] text-emerald-400">{tDashboard('mock_portfolio_change')}</div>
                    </div>
                    <div className="flex-1 rounded-lg bg-white/5 p-3">
                      <div className="text-[10px] text-white/40">{tDashboard('mock_active_trades')}</div>
                      <div className="text-lg font-bold text-white">{tDashboard('mock_active_trades_value')}</div>
                      <div className="text-[10px] text-sky-400">{tDashboard('mock_profitable_count')} {tDashboard('mock_profitable')}</div>
                    </div>
                  </div>
                  
                  <div className="relative h-48 w-full rounded-lg bg-white/5 p-4">
                     <div className="flex h-full items-end justify-between gap-1">
                        {[...Array(20)].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-full rounded-sm bg-emerald-500/20"
                            style={{ height: `${((i * 13 + 7) % 60) + 20}%` }}
                          />
                        ))}
                     </div>
                     {/* Floating Alert */}
                     <div className="absolute right-4 top-4 rounded-lg border border-white/10 bg-[#0a0a0a]/90 p-2 shadow-lg backdrop-blur">
                        <div className="flex items-center gap-2">
                           <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-medium text-white">{tDashboard('mock_new_signal')}</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {tPricing('title_prefix')} <span className="text-emerald-400">{tPricing('title_highlight')}</span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/60">
              {tPricing('description')}
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {loadingPlans ? (
              // Loading Skeleton
              [1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 animate-pulse">
                  <div className="h-8 w-1/3 bg-white/10 rounded mb-4"></div>
                  <div className="h-12 w-1/2 bg-white/10 rounded mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-white/10 rounded"></div>
                    <div className="h-4 w-full bg-white/10 rounded"></div>
                    <div className="h-4 w-2/3 bg-white/10 rounded"></div>
                  </div>
                </div>
              ))
            ) : plans.length > 0 ? (
              plans.map((plan) => (
                <div 
                  key={plan._id}
                  className={`flex flex-col justify-between rounded-3xl border p-8 ring-1 transition 
                    ${plan.title.toLowerCase().includes('pro') || plan.title.toLowerCase().includes('premium') 
                      ? 'border-emerald-500/30 bg-black/40 ring-emerald-500/50 hover:bg-emerald-500/5 relative' 
                      : 'border-white/10 bg-white/5 ring-white/10 hover:bg-white/10'
                    }`}
                >
                  {(plan.title.toLowerCase().includes('pro') || plan.title.toLowerCase().includes('premium')) && (
                    <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-emerald-500 px-3 py-1 text-center text-xs font-bold text-black">
                      {tPricing('most_popular')}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-bold leading-8 text-white">{plan.title}</h3>
                    <div className="mt-4 flex items-baseline gap-x-2">
                      <span className="text-4xl font-bold tracking-tight text-white">${plan.price}</span>
                      <span className="text-sm font-semibold leading-6 text-white/60">/{plan.duration} days</span>
                    </div>
                    <p className="mt-6 text-base leading-7 text-white/60">{plan.description}</p>
                    <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-white/60">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex gap-x-3">
                          <svg className="h-6 w-5 flex-none text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                      <li className="flex gap-x-3">
                         <svg className="h-6 w-5 flex-none text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          {plan.maxTradingPairs === 0 ? 'Unlimited Pairs' : `${plan.maxTradingPairs} Trading Pairs`}
                      </li>
                      <li className="flex gap-x-3">
                         <svg className="h-6 w-5 flex-none text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                          {plan.assetType.join(', ')}
                      </li>
                    </ul>
                  </div>
                  <Link 
                    href={`/${locale}/checkout/${plan._id}`}
                    className={`mt-8 block rounded-xl px-3 py-2 text-center text-sm font-semibold leading-6 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
                      ${plan.title.toLowerCase().includes('pro') || plan.title.toLowerCase().includes('premium')
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
                        : 'border border-white/20 text-white hover:bg-white/10'
                      }`}
                  >
                    {plan.price === 0 ? tPricing('start_free') : tPricing('subscribe_now')}
                  </Link>
                </div>
              ))
            ) : (
              // Fallback if no plans found (render nothing or a message)
              <div className="col-span-3 text-center text-white/60">
                No plans available at the moment.
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Contact Section */}
      <section id="contact" className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-900/20" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {tContact('title_prefix')} <span className="text-emerald-400">Novia AI</span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/60">
              {tContact('description')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link 
                href="/login"
                className="rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {tContact('open_account')}
              </Link>
              <a href="#" className="text-sm font-semibold leading-6 text-white transition hover:text-emerald-400">
                {tContact('contact_support')} <span aria-hidden="true">←</span>
              </a>
            </div>
          </div>
        </div>
      </section>


      {isDemoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setIsDemoOpen(false)}
          />
          <div className="relative flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#05070a] shadow-[0_0_100px_rgba(16,185,129,0.1)]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-emerald-400 text-black">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{tDemo('title')}</h2>
                  <p className="text-[10px] text-white/50">{tDemo('subtitle')}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDemoOpen(false)}
                className="rounded-full bg-white/5 p-2 text-white/60 transition hover:bg-red-500/20 hover:text-red-400"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
              {/* Sidebar Navigation */}
              <div className="w-full border-b border-white/5 bg-[#0a0a0a] md:w-64 md:border-b-0 md:border-l md:border-white/5">
                <div className="flex gap-2 overflow-x-auto p-4 md:flex-col md:gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex min-w-max items-center gap-3 rounded-xl px-4 py-3 text-xs font-medium transition-all md:w-full ${
                        activeTab === tab.id
                          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="relative flex-1 overflow-y-auto bg-black/40 p-6 md:p-10">
                {activeTab === "charts" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">{tDemo('charts_title')}</h3>
                      <div className="flex gap-2">
                        <span className="rounded bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400">{tDemo('live_data')}</span>
                        <span className="rounded bg-sky-500/10 px-2 py-1 text-[10px] text-sky-400">{tDemo('ai_powered')}</span>
                      </div>
                    </div>
                    <div className="relative h-[400px] w-full rounded-2xl border border-white/10 bg-[#05070a] p-6">
                      {/* Mock Chart UI */}
                      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex gap-4 text-xs font-medium text-white/60">
                          <span className="text-white">{tDemo('pair_btc_usd')}</span>
                          <span>{tDemo('timeframe_1h')}</span>
                          <span>{tDemo('timeframe_4h')}</span>
                          <span>{tDemo('timeframe_1d')}</span>
                          <span className="text-emerald-400">{tDemo('indicators_plus')}</span>
                        </div>
                        <span className="text-lg font-bold text-white">{tDemo('price_current')}</span>
                      </div>
                      <div className="flex h-[300px] items-end justify-between gap-1">
                        {[...Array(30)].map((_, i) => {
                          // Deterministic pseudo-random height based on index
                          const h = ((i * 17 + 23) % 80) + 20;
                          // Deterministic color
                          const isGreen = i % 3 !== 0; 
                          return (
                            <div
                              key={i}
                              className={`w-full rounded-sm ${isGreen ? 'bg-emerald-500/40' : 'bg-red-500/40'}`}
                              style={{ height: `${h}%` }}
                            />
                          );
                        })}
                      </div>
                      {/* AI Overlay */}
                      <div className="absolute top-20 right-10 rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 backdrop-blur-md">
                        <div className="flex items-center gap-2 text-[10px] text-sky-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                          <span>{tDemo('ai_prediction')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "signals" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xl font-bold text-white">{tDemo('signals_title')}</h3>
                    <div className="grid gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:border-white/10 hover:bg-white/10">
                          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-sky-400" />
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white">{tDemo('signal_strong_buy')}</h4>
                                <p className="text-xs text-white/50">{tDemo('detected_by')}</p>
                              </div>
                            </div>
                            <span className="text-xs font-mono text-emerald-400">{tDemo('time_ago_2m')}</span>
                          </div>
                          <div className="mt-4 flex gap-8 border-t border-white/5 pt-4 text-xs">
                            <div>
                              <span className="block text-white/40">{tDemo('entry_price')}</span>
                              <span className="font-mono text-white">{tDemo('price_entry_val')}</span>
                            </div>
                            <div>
                              <span className="block text-white/40">{tDemo('target_1')}</span>
                              <span className="font-mono text-emerald-400">{tDemo('price_target_val')}</span>
                            </div>
                            <div>
                              <span className="block text-white/40">{tDemo('stop_loss')}</span>
                              <span className="font-mono text-red-400">{tDemo('price_stop_val')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "analysis" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xl font-bold text-white">{tDemo('analysis_title')}</h3>
                    <div className="flex gap-4">
                        {/* Placeholder for Analysis content */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
