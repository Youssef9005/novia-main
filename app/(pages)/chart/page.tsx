"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';
import SignalList from "@/components/SignalList";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const InteractiveChart = dynamic(() => import("@/components/InteractiveChart"), {
  ssr: false,
});

export default function ChartPage() {
  const [selectedSignal, setSelectedSignal] = useState<any>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[800px] lg:h-[calc(100vh-140px)]">
          <div className="lg:col-span-3 h-full border rounded-lg overflow-hidden shadow-sm bg-card">
            <InteractiveChart 
              symbol={selectedSignal ? selectedSignal.symbol : "XAUUSD"} 
              signal={selectedSignal}
            />
          </div>
          <div className="lg:col-span-1 h-full">
            <SignalList onSelectSignal={setSelectedSignal} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
