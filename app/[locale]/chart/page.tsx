"use client";

import TradingChart from '@/components/TradingChart';

export default function ChartPage() {
  return (
    <div className="min-h-screen bg-[#000000] bg-[radial-gradient(circle_at_50%_0%,rgba(41,98,255,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.05),transparent_40%)] text-white selection:bg-[#2962FF] selection:text-white overflow-hidden font-sans">
      <div className="mx-auto max-w-[2400px] h-screen p-3 flex flex-col gap-3">
        
        {/* Main Chart Area - Floating Island */}
        <div className="w-full flex-1 relative rounded-3xl border border-white/5 bg-[#050505]/60 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 hover:border-white/10 group">
            {/* Glossy Reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            
            <TradingChart symbol="BTC/USDT" />
        </div>
      </div>
    </div>
  );
}
