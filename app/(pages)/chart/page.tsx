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
    <div className="flex flex-col h-screen bg-[#0b0e11] overflow-hidden pt-[80px]">
      <Navbar />

      <main className="flex-1 flex w-full overflow-hidden relative">
        {/* Chart Area - Fluid Width */}
        <div className="flex-1 h-full relative z-0 min-w-0">
          <InteractiveChart 
            symbol={selectedSignal ? selectedSignal.symbol : "XAUUSD"} 
            signal={selectedSignal}
          />
        </div>
        
        {/* Signal Feed Sidebar - Fixed Width */}
        <aside className="w-[380px] h-full flex flex-col z-20 shadow-2xl shadow-black/50 border-l border-[#1f2937] bg-[#0b0e11]">
          <SignalList onSelectSignal={setSelectedSignal} />
        </aside>
      </main>
    </div>
  );
}
