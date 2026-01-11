"use client";

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ChevronRight, 
  Activity, 
  Search,
  Filter,
  Signal as SignalIcon,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface Signal {
  _id: string;
  symbol: string;
  type: string;
  entry: string;
  tp1: string;
  tp2: string;
  tp3: string;
  tp4?: string;
  stopLoss: string;
  price: string;
  message: string;
  status: string;
  createdAt: string;
}

interface SignalListProps {
  onSelectSignal?: (signal: Signal) => void;
}

export default function SignalList({ onSelectSignal }: SignalListProps) {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [lastCleared, setLastCleared] = useState<Date | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('signalsLastCleared');
    if (stored) {
        setLastCleared(new Date(stored));
    }
  }, []);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please login to view signals');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/signals', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch signals');
        
        const data = await res.json();
        if (data.status === 'success') {
          setSignals(data.data.signals);
        } else {
          setError(data.message || 'Error loading signals');
        }
      } catch (err) {
        setError('Failed to load signals');
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  const visibleSignals = signals.filter(s => !lastCleared || new Date(s.createdAt) > lastCleared);

  const filteredSignals = visibleSignals.filter(s => {
      if (filter === 'all') return true;
      return s.type.toLowerCase() === filter;
  });

  const handleClearAll = () => {
      if (visibleSignals.length === 0) return;
      const now = new Date();
      setLastCleared(now);
      localStorage.setItem('signalsLastCleared', now.toISOString());
      toast.success("All signals cleared");
  };

  if (loading) return (
      <div className="h-full flex flex-col items-center justify-center space-y-3 bg-[#0b0e11] border-l border-[#1f2937]">
          <Activity className="w-8 h-8 text-[#2962FF] animate-pulse" />
          <span className="text-gray-500 text-sm font-medium">Syncing market data...</span>
      </div>
  );

  if (error) return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#0b0e11] border-l border-[#1f2937]">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
              <SignalIcon className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-red-400 font-medium mb-1">Connection Error</p>
          <p className="text-gray-600 text-xs">{error}</p>
      </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#0b0e11] border-l border-[#1f2937] w-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1f2937] bg-[#0b0e11]/95 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
                <div className="w-2 h-8 rounded-full bg-[#2962FF]" />
                <div>
                    <h2 className="text-white font-bold text-lg tracking-tight">Signals</h2>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Live Market Feed</p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-[#1f2937] text-gray-300 border-none font-mono">
                  {visibleSignals.length}
                </Badge>
                <button 
                    onClick={handleClearAll}
                    disabled={visibleSignals.length === 0}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Clear All Signals"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>

        {/* Filters */}
        <div className="flex p-1 bg-[#161a25] rounded-lg border border-[#1f2937]">
            {['all', 'buy', 'sell'].map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md capitalize transition-all duration-200 ${
                        filter === f 
                        ? f === 'buy' ? 'bg-[#089981] text-white shadow-lg shadow-green-900/20' 
                        : f === 'sell' ? 'bg-[#F23645] text-white shadow-lg shadow-red-900/20'
                        : 'bg-[#2962FF] text-white shadow-lg shadow-blue-900/20'
                        : 'text-gray-500 hover:text-white hover:bg-[#1f2937]'
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>
      
      {/* Signal List */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="flex flex-col space-y-2 pb-4">
          {filteredSignals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
               <Search className="w-10 h-10 text-gray-600 mb-3" />
               <p className="text-gray-400 font-medium">No signals found</p>
               <p className="text-gray-600 text-xs mt-1">Waiting for new market opportunities</p>
            </div>
          ) : (
            filteredSignals.map((signal) => (
              <div 
                key={signal._id} 
                className="group relative bg-[#161a25] border border-[#1f2937] hover:border-[#2962FF]/50 hover:bg-[#1c212e] rounded-xl p-3 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-blue-900/10 overflow-hidden"
                onClick={() => onSelectSignal && onSelectSignal(signal)}
              >
                {/* Type Accent Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
                   signal.type === 'Buy' || signal.type === 'buy' ? 'bg-[#089981] group-hover:w-1.5' : 
                   signal.type === 'Sell' || signal.type === 'sell' ? 'bg-[#F23645] group-hover:w-1.5' : 'bg-gray-500'
                }`} />

                <div className="flex justify-between items-start pl-3">
                  {/* Symbol & Type */}
                  <div className="flex flex-col space-y-1">
                     <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-100 text-base tracking-tight">{signal.symbol}</span>
                        <Badge 
                            variant="secondary" 
                            className={`text-[10px] px-1.5 h-5 rounded flex items-center gap-1 font-bold ${
                                signal.type === 'Buy' || signal.type === 'buy' 
                                ? 'bg-[#089981]/10 text-[#089981] hover:bg-[#089981]/20' 
                                : 'bg-[#F23645]/10 text-[#F23645] hover:bg-[#F23645]/20'
                            }`}
                        >
                           {signal.type === 'Buy' || signal.type === 'buy' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                           {signal.type.toUpperCase()}
                        </Badge>
                     </div>
                     <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span className="font-mono opacity-70">Entry</span>
                        <span className="font-mono text-white font-medium">{signal.entry}</span>
                     </div>
                  </div>
                  
                  {/* Time & Arrow */}
                  <div className="flex flex-col items-end space-y-2">
                     <div className="text-[10px] text-gray-500 font-mono flex items-center bg-[#0b0e11] px-1.5 py-0.5 rounded border border-[#1f2937]">
                        <Clock size={10} className="mr-1" />
                        {new Date(signal.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </div>
                     <div className={`transform transition-transform duration-300 group-hover:translate-x-1 ${
                         signal.type === 'Buy' || signal.type === 'buy' ? 'text-[#089981]' : 'text-[#F23645]'
                     }`}>
                         <ChevronRight size={16} />
                     </div>
                  </div>
                </div>
                
                {/* TP/SL Mini Info */}
                <div className="mt-3 pt-3 border-t border-[#1f2937] grid grid-cols-2 gap-2 pl-3">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-gray-500 uppercase font-bold">Target 1</span>
                        <span className="text-xs font-mono text-[#089981] font-semibold">{signal.tp1}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-gray-500 uppercase font-bold">Stop Loss</span>
                        <span className="text-xs font-mono text-[#F23645] font-semibold">{signal.stopLoss}</span>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
