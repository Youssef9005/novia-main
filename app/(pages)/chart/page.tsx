"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignalList from "@/components/SignalList";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/useAuth";

const InteractiveChart = dynamic(() => import("@/components/InteractiveChart"), {
  ssr: false,
});

export default function ChartPage() {
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.subscription?.status !== 'active') {
        // Redirect to pricing or a page telling them they need a subscription
        router.push('/pricing'); 
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b0e11] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user || user.subscription?.status !== 'active') {
    return null; // Don't render anything while redirecting
  }

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
