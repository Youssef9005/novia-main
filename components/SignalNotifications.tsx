"use client";

import React, { useEffect, useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { api } from '@/lib/api';

export interface Signal {
  entry: string;
  tp1: string;
  tp2?: string;
  tp3?: string;
  tp4?: string;
  stopLoss: string;
  type: string;
  symbol: string;
  createdAt?: string;
  message?: string;
}

interface SignalNotificationsProps {
  onSelectSignal?: (signal: Signal) => void;
}

interface MappedSignal {
  id: string;
  type: string;
  symbol: string;
  price: number;
  time: number;
  target1: number;
  stop: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any;
}

export default function SignalNotifications({ onSelectSignal }: SignalNotificationsProps) {
  const t = useTranslations('Signals');
  const format = useFormatter();
  const [signals, setSignals] = useState<MappedSignal[]>([]);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await api.signals.getAll();
        if (res.status === 'success' && res.data && res.data.signals) {
          // Map backend signals to component format
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedSignals = res.data.signals.map((s: any) => ({
            id: s._id,
            type: s.type.toLowerCase(),
            symbol: s.symbol,
            price: parseFloat(s.entry || s.price || '0'),
            time: Math.floor((Date.now() - new Date(s.createdAt).getTime()) / 60000), // minutes ago
            target1: parseFloat(s.tp1 || '0'),
            stop: parseFloat(s.stopLoss || '0'),
            // Keep original strings for chart overlay
            raw: s 
          }));
          setSignals(mappedSignals);
        }
      } catch (error) {
        console.error('Failed to fetch signals:', error);
      }
    };

    fetchSignals();
    // Poll every 30 seconds
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSignalClick = (signal: MappedSignal) => {
    if (onSelectSignal) {
      onSelectSignal({
        entry: signal.price.toString(),
        tp1: signal.target1.toString(),
        stopLoss: signal.stop.toString(),
        type: signal.type,
        symbol: signal.symbol.replace('/', ''),
        createdAt: signal.raw.createdAt,
        message: signal.raw.message
      });
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#050505]/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative transition-all duration-500 hover:shadow-[0_0_80px_rgba(41,98,255,0.1)] hover:border-white/10 group/container">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#2962FF]/10 blur-[120px] pointer-events-none transition-all duration-700 group-hover/container:bg-[#2962FF]/20" />
      <div className="absolute bottom-0 right-0 w-1/2 h-32 bg-purple-500/5 blur-[100px] pointer-events-none" />

      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-6 backdrop-blur-2xl relative z-10">
        <div className="flex items-center gap-4">
            <div className="relative">
                <div className="absolute inset-0 bg-[#2962FF] blur-md opacity-50 animate-pulse"></div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#2962FF] to-[#0039CB] text-white shadow-lg shadow-blue-900/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
            </div>
            <div>
                <h3 className="font-black tracking-tight text-xl text-white uppercase leading-none">
                  Live Signals
                </h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Real-time AI Feed</span>
            </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] backdrop-blur-sm">
           <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
           </div>
           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Active</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide relative z-10">
          {signals.length === 0 ? (
             <div className="flex items-center justify-center h-full text-gray-500 text-sm">
               No active signals
             </div>
          ) : (
            signals.map((signal, index) => (
            <div 
              key={signal.id}
              onClick={() => handleSignalClick(signal)}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0A0A0A]/50 p-0 transition-all duration-500 hover:border-white/20 hover:bg-[#0A0A0A] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-1 cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${signal.type === 'buy' ? 'bg-[#00E396] group-hover:w-1.5 group-hover:shadow-[0_0_25px_#00E396]' : 'bg-[#FF0057] group-hover:w-1.5 group-hover:shadow-[0_0_25px_#FF0057]'}`} />
              
              <div className="p-5 pl-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-black text-white shadow-lg ${signal.type === 'buy' ? 'bg-gradient-to-br from-[#00E396] to-[#00B779] shadow-[#00E396]/20' : 'bg-gradient-to-br from-[#FF0057] to-[#C40043] shadow-[#FF0057]/20'}`}>
                            {signal.symbol.substring(0, 1)}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-white tracking-tight text-lg leading-none">{signal.symbol}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${signal.type === 'buy' ? 'text-[#00E396]' : 'text-[#FF0057]'}`}>{signal.type === 'buy' ? 'Long Position' : 'Short Position'}</span>
                        </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md shadow-lg transition-transform group-hover:scale-105 ${
                      signal.type === 'buy' 
                        ? 'bg-[#00E396]/10 text-[#00E396] border-[#00E396]/20 shadow-[#00E396]/10' 
                        : 'bg-[#FF0057]/10 text-[#FF0057] border-[#FF0057]/20 shadow-[#FF0057]/10'
                    }`}>
                      {t(signal.type)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 flex flex-col gap-1 group/item hover:bg-white/[0.05] transition-colors">
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Entry Price</span>
                          <span className="font-mono text-sm font-bold text-white tracking-tight group-hover/item:text-[#2962FF] transition-colors">
                              {format.number(signal.price, {style: 'currency', currency: 'USD'})}
                          </span>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 flex flex-col gap-1 group/item hover:bg-white/[0.05] transition-colors">
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Time Ago</span>
                          <span className="font-mono text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse"></span>
                              {t('time_min', {count: signal.time})}
                          </span>
                      </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                           <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-[#2962FF] group-hover:shadow-[0_0_10px_rgba(41,98,255,0.8)] transition-all duration-300" />
                           AI Confidence: 98%
                       </div>
                       <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 ${signal.type === 'buy' ? 'text-[#00E396]' : 'text-[#FF0057]'}`}>
                           Analyze <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                       </div>
                  </div>
              </div>

              {/* Hover Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${
                  signal.type === 'buy' ? 'from-[#00E396] to-transparent' : 'from-[#FF0057] to-transparent'
              }`} />
            </div>
          )))}
      </div>
    </div>
  );
}
