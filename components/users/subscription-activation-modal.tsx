import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface TradingPair {
  symbol: string;
  name: string;
  category: string;
}

interface GroupedPairs {
  forex: TradingPair[];
  indices: TradingPair[];
  commodities: TradingPair[];
  crypto: TradingPair[];
}

interface SubscriptionPlan {
  _id: string;
  title: string;
  price: number;
  maxTradingPairs: number;
  unlimitedTradingPairs: boolean;
}

interface SubscriptionActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export function SubscriptionActivationModal({
  isOpen,
  onClose,
  userId,
  onSuccess
}: SubscriptionActivationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tradingPairs, setTradingPairs] = useState<GroupedPairs>({ forex: [], indices: [], commodities: [], crypto: [] });
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loadingPairs, setLoadingPairs] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [pairsResponse, plansResponse] = await Promise.all([
        api.tradingPairs.getAll(),
        api.subscriptions.getAll()
      ]);

      setTradingPairs(pairsResponse.data);
      setSubscriptionPlans(plansResponse.data.plans);
      setLoadingPairs(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePairSelect = (value: string) => {
    setSelectedPairs(prev => {
      if (prev.includes(value)) {
        return prev.filter(pair => pair !== value);
      }
      return [...prev, value];
    });
  };

  const handleActivate = async () => {
    if (!selectedPlan) {
      toast({
        title: 'Error',
        description: 'Please select a subscription plan',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPairs.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one trading pair',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.subscriptions.adminActivate(userId, {
        planId: selectedPlan,
        selectedAssets: selectedPairs
      });

      toast({
        title: 'Success',
        description: 'Subscription activated successfully',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error activating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingPairs) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Loading trading pairs...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Activate Subscription</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Selection */}
          <div>
            <h3 className="font-semibold mb-2">Select Plan</h3>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {subscriptionPlans.map((plan) => (
                  <SelectItem key={plan._id} value={plan._id}>
                    {plan.title} - ${plan.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trading Pair Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Forex Pairs</h3>
              <Select onValueChange={handlePairSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Forex pairs" />
                </SelectTrigger>
                <SelectContent>
                  {tradingPairs.forex.map((pair) => (
                    <SelectItem 
                      key={pair.symbol} 
                      value={pair.symbol}
                      className={selectedPairs.includes(pair.symbol) ? 'bg-primary/10 text-primary font-medium' : ''}
                    >
                      {pair.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Indices</h3>
              <Select onValueChange={handlePairSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Indices" />
                </SelectTrigger>
                <SelectContent>
                  {tradingPairs.indices.map((pair) => (
                    <SelectItem 
                      key={pair.symbol} 
                      value={pair.symbol}
                      className={selectedPairs.includes(pair.symbol) ? 'bg-primary/10 text-primary font-medium' : ''}
                    >
                      {pair.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Commodities</h3>
              <Select onValueChange={handlePairSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Commodities" />
                </SelectTrigger>
                <SelectContent>
                  {tradingPairs.commodities.map((pair) => (
                    <SelectItem 
                      key={pair.symbol} 
                      value={pair.symbol}
                      className={selectedPairs.includes(pair.symbol) ? 'bg-primary/10 text-primary font-medium' : ''}
                    >
                      {pair.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Cryptocurrencies</h3>
              <Select onValueChange={handlePairSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Cryptocurrencies" />
                </SelectTrigger>
                <SelectContent>
                  {tradingPairs.crypto.map((pair) => (
                    <SelectItem 
                      key={pair.symbol} 
                      value={pair.symbol}
                      className={selectedPairs.includes(pair.symbol) ? 'bg-primary/10 text-primary font-medium' : ''}
                    >
                      {pair.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Pairs Display */}
          {selectedPairs.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Selected Pairs:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedPairs.map((pair) => (
                  <div
                    key={pair}
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {pair}
                    <button
                      onClick={() => handlePairSelect(pair)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleActivate}
              disabled={isLoading || !selectedPlan || selectedPairs.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                'Activate Subscription'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 