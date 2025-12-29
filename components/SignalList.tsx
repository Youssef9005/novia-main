"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';

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

  if (loading) return <div className="p-4 text-center">Loading signals...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold flex items-center justify-between">
          Latest Signals
          <Badge variant="outline" className="ml-2">{signals.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {signals.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No signals available for your subscription.
              </div>
            ) : (
              signals.map((signal) => (
                <div 
                  key={signal._id} 
                  className="border rounded-lg p-4 bg-card/50 hover:bg-card transition-colors cursor-pointer"
                  onClick={() => onSelectSignal && onSelectSignal(signal)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-lg">{signal.symbol}</div>
                    <Badge variant={signal.type === 'Buy' ? 'default' : signal.type === 'Sell' ? 'destructive' : 'secondary'}>
                      {signal.type}
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    {signal.entry && <div className="flex justify-between"><span>Entry:</span> <span className="font-mono">{signal.entry}</span></div>}
                    {signal.tp1 && <div className="flex justify-between text-green-500"><span>TP1:</span> <span className="font-mono">{signal.tp1}</span></div>}
                    {signal.stopLoss && <div className="flex justify-between text-red-500"><span>SL:</span> <span className="font-mono">{signal.stopLoss}</span></div>}
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(signal.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
