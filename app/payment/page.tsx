"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, CreditCard, Bitcoin, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"

// Define types for NOWPayments response
interface NOWPaymentInternalData {
  payment_id: string
  payment_status: string
  pay_address: string
  pay_amount: number
  pay_currency: string
  price_amount: number
  price_currency: string
  order_id: string
  order_description: string
  invoice_url?: string
  created_at: string
}

interface PaymentResponseData {
  paymentId: string;
  nowPaymentsData: NOWPaymentInternalData;
  message?: string;
}

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

// Add plan limits interface
interface PlanLimits {
  [key: string]: number;
}

// Update plan limits
const PLAN_LIMITS: PlanLimits = {
  'Basic': 5,
  'Standard': 10,
  'Expert': 0, // 0 means unlimited
  'Professional': 0 // 0 means unlimited
};

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planName = searchParams.get('plan')
  const planPrice = searchParams.get('price')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("nowpayments")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [cryptoCurrencies, setCryptoCurrencies] = useState<string[]>(['BTC', 'ETH'])
  const [selectedCurrency, setSelectedCurrency] = useState('btc')
  const [paymentData, setPaymentData] = useState<PaymentResponseData | null>(null)
  const [paymentError, setPaymentError] = useState('')
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [showProcessingMessage, setShowProcessingMessage] = useState(false);
  const [tradingPairs, setTradingPairs] = useState<GroupedPairs>({ forex: [], indices: [], commodities: [], crypto: [] });
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [loadingPairs, setLoadingPairs] = useState(true);
  const [planFeatures, setPlanFeatures] = useState<{
    maxTradingPairs: number;
    unlimitedTradingPairs: boolean;
    includesTelegramGroup: boolean;
  } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Function to verify authentication
  const verifyAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        return false;
      }

      // Verify token with backend
      const response = await fetch('https://api.novia-ai.com/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.log('Token verification failed:', response.status);
        return false;
      }

      const data = await response.json();
      if (data.status === 'success' && data.data?.user) {
        const user = data.data.user;
        setUserId(user._id || user.id);
        setIsAuthenticated(true);
        console.log('Authentication successful, userId:', user._id || user.id);
        return true;
      }

      console.log('Invalid user data in response');
      return false;
    } catch (error) {
      console.error('Auth verification error:', error);
      return false;
    }
  };

  // Function to fetch trading pairs
  const fetchTradingPairs = async () => {
    try {
      const response = await api.tradingPairs.getAll();
      console.log('Fetched trading pairs successfully:', response.data);
      setTradingPairs(response.data);
    } catch (error) {
      console.error('Error fetching trading pairs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trading pairs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPairs(false);
    }
  };

  // Function to fetch plan features
  const fetchPlanFeatures = async () => {
    try {
      const price = parseFloat(planPrice || '0');
      let maxPairs = 5; // Default for Basic plan
      let isUnlimited = false;
      let includesGroup = false;

      if (price >= 400) { // Expert/Professional plan
        maxPairs = 0; // Unlimited
        isUnlimited = true;
        includesGroup = true;
      } else if (price >= 200) { // Pro plan
        maxPairs = 10;
        isUnlimited = false;
        includesGroup = false;
      } else if (price >= 150) { // Standard plan
        maxPairs = 10;
        isUnlimited = false;
        includesGroup = false;
      }

      setPlanFeatures({
        maxTradingPairs: maxPairs,
        unlimitedTradingPairs: isUnlimited,
        includesTelegramGroup: includesGroup
      });
    } catch (error) {
      console.error('Error setting plan features:', error);
      setPlanFeatures({
        maxTradingPairs: 5,
        unlimitedTradingPairs: false,
        includesTelegramGroup: false
      });
    }
  };

  // Initialize page
  useEffect(() => {
    const initializePage = async () => {
      try {
        setIsCheckingAuth(true);

        // Validate required params
        if (!planName || !planPrice) {
          console.log('Missing planName or planPrice');
          router.push('/#pricing');
          return;
        }

        // Verify authentication
        const isAuthValid = await verifyAuth();
        if (!isAuthValid) {
          console.log('Authentication failed, redirecting to login');
          router.push(`/login?redirect=${encodeURIComponent(`/payment?plan=${planName}&price=${planPrice}`)}`);
          return;
        }

        // Load data
        await Promise.all([
          fetchTradingPairs(),
          fetchPlanFeatures()
        ]);

      } catch (error) {
        console.error('Page initialization error:', error);
        router.push('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    initializePage();
  }, [planName, planPrice, router]);

  // Get plan limit
  const getPlanLimit = () => {
    if (!planFeatures) return 5; // Default fallback
    return planFeatures.unlimitedTradingPairs ? 0 : planFeatures.maxTradingPairs;
  };

  const handlePairSelect = (value: string) => {
    setSelectedPairs(prev => {
      if (prev.includes(value)) {
        return prev.filter(pair => pair !== value);
      }
      const limit = getPlanLimit();
      if (limit > 0 && prev.length >= limit) {
        toast({
          title: 'Selection Limit Reached',
          description: planFeatures?.unlimitedTradingPairs 
            ? 'You can select unlimited trading pairs with your plan.'
            : `You can select a maximum of ${limit} trading pairs with your ${planName || 'Basic'} plan.`,
          variant: 'destructive',
        });
        return prev;
      }
      return [...prev, value];
    });
  };

  // Handle payment
  const handlePayment = async (method: 'nowpayments' | 'stripe' | 'binance') => {
    if (!isAuthenticated || !userId) {
      toast({
        title: 'Error',
        description: 'Please log in again to continue',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    if (!planName || !planPrice) {
      toast({
        title: 'Error',
        description: 'Missing plan information',
        variant: 'destructive',
      });
      router.push('/#pricing');
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
      console.log('Creating payment with data:', {
        planName,
        planPrice: parseFloat(planPrice),
        userId,
        currency: selectedCurrency,
        selectedPairs,
      });

      const response = await api.payments.createPayment({
        planName,
        planPrice: parseFloat(planPrice),
        userId,
        currency: selectedCurrency,
        selectedPairs,
      });

      console.log('Payment response:', response);

      if (response.status === 'success' && method === 'nowpayments') {
        const { pay_address, pay_amount, pay_currency, payment_id } = response.data.nowPaymentsData;
        setPaymentData(response.data);

        toast({
          title: 'Payment Details',
          description: `Please send ${pay_amount} ${pay_currency.toUpperCase()} to ${pay_address}. Payment ID: ${payment_id}`,
          variant: 'default',
        });
      } else if (response.status === 'error') {
        throw new Error(response.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to create payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading states
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2 text-white">Verifying authentication...</p>
      </div>
    );
  }

  if (loadingPairs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2 text-white">Loading trading pairs...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col">
        <p className="text-white">Please log in to continue</p>
        <Button 
          onClick={() => router.push('/login')}
          className="mt-4"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  if (!planName || !planPrice) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col">
        <p className="text-white">Missing plan information</p>
        <Button 
          onClick={() => router.push('/#pricing')}
          className="mt-4"
        >
          Choose a Plan
        </Button>
      </div>
    );
  }

  console.log('Ready to render main payment page with:', {
    tradingPairs,
    selectedPairs,
    planName,
    planPrice,
    isAuthenticated,
    loadingPairs // Should be false here
  });

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Select Trading Pairs</CardTitle>
          <CardDescription>
            {planFeatures?.unlimitedTradingPairs 
              ? 'Select unlimited trading pairs with your plan'
              : `Choose up to ${getPlanLimit()} trading pairs with your ${planName || 'Basic'} plan`}
            {planFeatures?.includesTelegramGroup && (
              <span className="block mt-2 text-green-500">
                ✓ Includes Telegram Group Access
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Trading Pair Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Forex Pairs</h3>
                <Select onValueChange={handlePairSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Forex pairs" />
                  </SelectTrigger>
                  <SelectContent>
                    {tradingPairs.forex && tradingPairs.forex.length > 0 ? (
                      tradingPairs.forex.map((pair) => (
                        <SelectItem 
                          key={pair.symbol} 
                          value={pair.symbol}
                          className={selectedPairs.includes(pair.symbol) ? 'bg-primary/10 text-primary font-medium' : ''}
                        >
                          {pair.symbol}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-forex" disabled>No Forex pairs available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {parseFloat(planPrice || '0') > 100 && (
                <>
                  <div>
                    <h3 className="font-semibold mb-2">Indices</h3>
                    <Select onValueChange={handlePairSelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Indices" />
                      </SelectTrigger>
                      <SelectContent>
                        {tradingPairs.indices && tradingPairs.indices.length > 0 ? (
                          tradingPairs.indices.map((pair) => (
                            <SelectItem 
                              key={pair.symbol} 
                              value={pair.symbol}
                              className={selectedPairs.includes(pair.symbol) ? 'bg-primary/10 text-primary font-medium' : ''}
                            >
                              {pair.symbol}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-indices" disabled>No Indices available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Commodities</h3>
                    <Select onValueChange={handlePairSelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Commodities" />
                      </SelectTrigger>
                      <SelectContent>
                        {tradingPairs.commodities && tradingPairs.commodities.length > 0 ? (
                          tradingPairs.commodities.map((pair) => (
                            <SelectItem 
                              key={pair.symbol} 
                              value={pair.symbol}
                              className={selectedPairs.includes(pair.symbol) ? 'bg-primary/10 text-primary font-medium' : ''}
                            >
                              {pair.symbol}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-commodities" disabled>No Commodities available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Cryptocurrencies</h3>
                    <Select onValueChange={handlePairSelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Cryptocurrencies" />
                      </SelectTrigger>
                      <SelectContent>
                        {tradingPairs.crypto && tradingPairs.crypto.length > 0 ? (
                          tradingPairs.crypto.map((pair) => (
                            <SelectItem 
                              key={pair.symbol} 
                              value={pair.symbol}
                              className={selectedPairs.includes(pair.symbol) ? 'bg-primary/10 text-primary font-medium' : ''}
                            >
                              {pair.symbol}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-crypto" disabled>No Cryptocurrencies available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {selectedPairs.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">
                  Selected Pairs {!planFeatures?.unlimitedTradingPairs && 
                    `(${selectedPairs.length}/${getPlanLimit()})`}:
                </h3>
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

            {/* Payment Method Tabs */}
            <Tabs defaultValue="nowpayments" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="nowpayments">NOWPayments</TabsTrigger>
                <TabsTrigger value="stripe" disabled>Stripe (Coming Soon)</TabsTrigger>
                <TabsTrigger value="binance" disabled>Binance Pay (Coming Soon)</TabsTrigger>
              </TabsList>
              <TabsContent value="nowpayments">
                <Card>
                  <CardHeader>
                    <CardTitle>Pay with NOWPayments</CardTitle>
                    <CardDescription>
                      Pay using cryptocurrency (BTC, ETH)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Display payment details if available */}
                    {paymentData && (
                      <Alert className="mb-4">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Payment Details</AlertTitle>
                        <AlertDescription>
                          <p><strong>Status:</strong> {paymentData.nowPaymentsData.payment_status}</p>
                          <p><strong>Amount to pay:</strong> {paymentData.nowPaymentsData.pay_amount} {paymentData.nowPaymentsData.pay_currency?.toUpperCase()}</p>
                          <p><strong>Wallet Address:</strong> {paymentData.nowPaymentsData.pay_address}</p>
                          {paymentData.nowPaymentsData.invoice_url && (
                            <p>
                              <a href={paymentData.nowPaymentsData.invoice_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                View Invoice on NOWPayments
                              </a>
                            </p>
                          )}
                          <p className="mt-2 text-sm text-gray-400">
                            Please send the exact amount to the address above. Payment will be confirmed automatically.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Currency Selection */}
                    {!paymentData && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Select Payment Currency:</h4>
                        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {cryptoCurrencies.map((currency) => (
                              <SelectItem key={currency} value={currency.toLowerCase()}>{currency}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => handlePayment('nowpayments')}
                      disabled={isLoading || selectedPairs.length === 0 || !!paymentData}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        paymentData ? 'Payment Details Displayed' : 'Pay Now'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="stripe">
                <Card>
                  <CardHeader>
                    <CardTitle>Pay with Stripe</CardTitle>
                    <CardDescription>
                      Coming soon...
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>
              <TabsContent value="binance">
                <Card>
                  <CardHeader>
                    <CardTitle>Pay with Binance Pay</CardTitle>
                    <CardDescription>
                      Coming soon...
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col items-center text-center text-sm text-gray-500">
          <p>
            By subscribing, you agree to our <Link href="/terms" className="text-blue-400 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.
          </p>
          <p className="mt-2">
            You can cancel your subscription at any time from your profile page.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
