"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, TrendingDown, Clock, ChevronRight } from 'lucide-react';

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
    // Poll every 30 seconds
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4 text-center text-[#787B86]">Loading feed...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="h-full flex flex-col bg-[#131722] border-l border-[#2B2B43] w-full">
      <div className="px-4 py-3 border-b border-[#2B2B43] flex items-center justify-between bg-[#131722]">
        <h2 className="text-[#d1d4dc] font-semibold text-sm uppercase tracking-wider">Market Signals</h2>
        <Badge variant="secondary" className="bg-[#2A2E39] text-[#d1d4dc] hover:bg-[#363A45]">
          {signals.length} Active
        </Badge>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {signals.length === 0 ? (
            <div className="text-center text-[#787B86] py-8 text-sm">
              No active signals
            </div>
          ) : (
            signals.map((signal) => (
              <div 
                key={signal._id} 
                className="group border-b border-[#2B2B43] p-3 hover:bg-[#2A2E39] transition-all cursor-pointer relative overflow-hidden"
                onClick={() => onSelectSignal && onSelectSignal(signal)}
              >
                {/* Status Indicator Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                   signal.type === 'Buy' ? 'bg-[#089981]' : 
                   signal.type === 'Sell' ? 'bg-[#F23645]' : 'bg-gray-500'
                }`} />

                <div className="flex justify-between items-start mb-1 pl-2">
                  <div className="flex flex-col">
                     <span className="font-bold text-[#d1d4dc] text-sm flex items-center">
                        {signal.symbol}
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${
                           signal.type === 'Buy' ? 'bg-[#089981]/20 text-[#089981]' : 
                           signal.type === 'Sell' ? 'bg-[#F23645]/20 text-[#F23645]' : 'bg-gray-700 text-gray-300'
                        }`}>
                           {signal.type.toUpperCase()}
                        </span>
                     </span>
                     <span className="text-xs text-[#787B86] mt-0.5 font-mono">
                        EP: {signal.entry}
                     </span>
                  </div>
                  
                  <div className="text-right">
                     <div className={`text-sm font-medium ${
                        signal.type === 'Buy' ? 'text-[#089981]' : 'text-[#F23645]'
                     }`}>
                        {signal.tp1}
                     </div>
                     <div className="text-[10px] text-[#787B86] flex items-center justify-end mt-1">
                        <Clock size={10} className="mr-1" />
                        {new Date(signal.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </div>
                  </div>
                </div>
                
                {/* Hover Reveal Arrow */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="text-[#d1d4dc]" size={16} />
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
