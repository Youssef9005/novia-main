"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';
import SignalList from "@/components/SignalList";
import { Navbar } from "@/components/navbar";

const InteractiveChart = dynamic(() => import("@/components/InteractiveChart"), {
  ssr: false,
});

export default function ChartPage() {
  const [selectedSignal, setSelectedSignal] = useState<any>(null);

  return (
    <div className="flex flex-col h-screen bg-[#131722] overflow-hidden pt-[72px]">
      <Navbar />
      <main className="flex-1 flex w-full overflow-hidden">
        {/* Chart Area - Takes remaining space */}
        <div className="flex-1 h-full relative border-r border-[#2B2B43]">
          <InteractiveChart 
            symbol={selectedSignal ? selectedSignal.symbol : "XAUUSD"} 
            signal={selectedSignal}
          />
        </div>
        
        {/* Signal List / Watchlist Panel - Fixed width */}
        <div className="w-[320px] h-full bg-[#131722] flex flex-col shadow-xl z-20 border-l border-[#2B2B43]">
          <SignalList onSelectSignal={setSelectedSignal} />
        </div>
      </main>
    </div>
  );
}
