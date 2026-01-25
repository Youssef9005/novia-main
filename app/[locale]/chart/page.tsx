"use client";

import TradingChart from '@/components/TradingChart';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Lock, ArrowRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChartPage() {
  const { user, loading } = useAuth();
  const locale = useLocale();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-[#2962FF]/30 border-t-[#2962FF] animate-spin" />
          <p className="text-gray-500 text-sm font-mono animate-pulse">Loading Chart...</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in and has an active subscription
  // Assuming 'user.plan' or checking specific logic. 
  // For now, strict check: User must exist.
  // You can extend this to check: user?.subscriptionStatus === 'active'
  const isSubscribed = user && (user.plan || (user.selectedAssets && user.selectedAssets.length > 0)); 

  if (!user || !isSubscribed) {
    return (
      <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#2962FF]/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#A855F7]/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-lg w-full text-center space-y-8 p-8 rounded-3xl border border-white/5 bg-[#0A0A0A]/50 backdrop-blur-2xl shadow-2xl">
            
            {/* Icon */}
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-[#2962FF]/20 to-[#A855F7]/20 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(41,98,255,0.2)]">
                <Lock className="w-10 h-10 text-white" />
            </div>

            {/* Text */}
            <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-white">
                    {user ? 'Subscription Required' : 'Access Restricted'}
                </h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                    {user 
                        ? 'To access the advanced Trading Chart and AI analysis tools, you need an active subscription.' 
                        : 'Please sign in or create an account to access our professional trading tools and AI analytics.'}
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
                {user ? (
                    <Button asChild className="w-full h-12 bg-[#2962FF] hover:bg-[#2962FF]/90 text-white font-bold rounded-xl text-base shadow-[0_0_20px_rgba(41,98,255,0.4)] transition-all hover:scale-[1.02]">
                        <Link href={`/${locale}/payment`}>
                            View Plans <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </Button>
                ) : (
                    <div className="flex flex-col gap-3">
                        <Button asChild className="w-full h-12 bg-[#2962FF] hover:bg-[#2962FF]/90 text-white font-bold rounded-xl text-base shadow-[0_0_20px_rgba(41,98,255,0.4)] transition-all hover:scale-[1.02]">
                            <Link href={`/${locale}/login`}>
                                Sign In <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full h-12 border-white/10 hover:bg-white/5 text-gray-300 font-bold rounded-xl text-base transition-all">
                            <Link href={`/${locale}/signup`}>
                                Create Account
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-6 text-xs text-gray-500 font-medium uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Activity size={12} className="text-[#2962FF]" /> Real-time Data</span>
                <span className="flex items-center gap-1.5"><Activity size={12} className="text-[#A855F7]" /> AI Analysis</span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-56px)] md:h-[calc(100dvh-124px)] bg-[#000000] bg-[radial-gradient(circle_at_50%_0%,rgba(41,98,255,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.05),transparent_40%)] text-white selection:bg-[#2962FF] selection:text-white overflow-hidden font-sans">
      <div className="mx-auto max-w-[2400px] h-full p-3 flex flex-col gap-3">
        
        {/* Main Chart Area - Floating Island */}
        <div className="w-full flex-1 relative flex rounded-3xl border border-white/5 bg-[#050505]/60 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 hover:border-white/10 group">
            {/* Glossy Reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            
            <TradingChart symbol="BTC/USDT" />
        </div>
      </div>
    </div>
  );
}
