"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, CreditCard, Bitcoin, Info, Loader2, Upload, CheckCircle, XCircle, Wallet, Shield, Clock, Star, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"

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

interface PaymentData {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  walletAddress: string;
  network: string;
  status: string;
  message: string;
}

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planName = searchParams.get('plan')
  const planPrice = searchParams.get('price')
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [tradingPairs, setTradingPairs] = useState<GroupedPairs>({ forex: [], indices: [], commodities: [], crypto: [] });
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [loadingPairs, setLoadingPairs] = useState(true);
  const [planFeatures, setPlanFeatures] = useState<{
    maxTradingPairs: number;
    unlimitedTradingPairs: boolean;
    includesTelegramGroup: boolean;
  } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Screenshot upload states
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [senderAddress, setSenderAddress] = useState<string>('');

  // Add state for network, currency, wallets, and wallet address
  const [network, setNetwork] = useState<string>('');
  const [currency, setCurrency] = useState<string>('');
  const [wallets, setWallets] = useState<Array<{
    _id: string;
    address: string;
    network: string;
    currency: string;
    isActive: boolean;
    qrCodeImage?: string;
  }>>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [customWalletAddress, setCustomWalletAddress] = useState<string>('');
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>('');

  // Get available networks and currencies from wallets
  const networks = Array.from(new Set(wallets.map(w => w.network))).sort();
  const currencies = Array.from(new Set(wallets.map(w => w.currency))).sort();
  
  // Filter wallets based on selected network and currency
  const filteredWallets = wallets.filter(wallet => 
    wallet.network === network && 
    wallet.currency === currency &&
    wallet.isActive
  );
  
  // Get the currently selected wallet
  const currentWallet = selectedWalletId 
    ? wallets.find(w => w._id === selectedWalletId)
    : filteredWallets[0] || { address: customWalletAddress };
  
  // Update current wallet address when selection changes
  useEffect(() => {
    if (currentWallet?.address) {
      setCurrentWalletAddress(currentWallet.address);
    } else if (customWalletAddress) {
      setCurrentWalletAddress(customWalletAddress);
    } else {
      setCurrentWalletAddress('');
    }
  }, [currentWallet, customWalletAddress]);
  
  // Set default network and currency when wallets are loaded
  useEffect(() => {
    if (wallets.length > 0 && !network && !currency) {
      // Set to first available wallet's network and currency
      const firstWallet = wallets.find(w => w.isActive);
      if (firstWallet) {
        setNetwork(firstWallet.network);
        setCurrency(firstWallet.currency);
      }
    }
  }, [wallets, network, currency]);
  
  // Fetch wallets from API
  const fetchWallets = async () => {
    try {
      setLoadingWallets(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.novia-ai.com'}/api/wallets/active`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setWallets(data.data.wallets || []);
      } else {
        throw new Error(data.message || 'Failed to fetch wallets');
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wallet addresses. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoadingWallets(false);
    }
  };
  
  // Load wallets on component mount
  useEffect(() => {
    fetchWallets();
  }, []);
  
  // Current wallet address for display
  const walletAddress = currentWallet?.address || customWalletAddress;
  
  // Function to verify authentication
  const verifyAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        return false;
      }

      // Verify token with backend
      const response = await fetch('https://www.novia-ai.com/api/users/me', {
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
      if (response.data) {
        setTradingPairs(response.data);
      }
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

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      
      setScreenshotFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle payment creation
  const handleCreatePayment = async () => {
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

    if (!currentWalletAddress) {
      toast({
        title: 'Error',
        description: 'Please select or enter a wallet address',
        variant: 'destructive',
      });
      return;
    }

    if (!network || !currency) {
      toast({
        title: 'Error',
        description: 'Please select both network and currency',
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
        selectedPairs,
        senderAddress,
        network,
        currency,
        walletAddress: currentWalletAddress,
      });

      const response = await api.payments.createPayment({
        planName,
        planPrice: parseFloat(planPrice),
        userId,
        selectedPairs,
        senderAddress,
        network,
        currency,
        walletAddress: currentWalletAddress,
      });

      console.log('Payment response:', response);

      if (response.status === 'success' && response.data) {
        // If we have a selected wallet, ensure it's set for the payment confirmation
        const wallet = selectedWalletId ? wallets.find(w => w._id === selectedWalletId) : null;
        
        setPaymentData({
          ...response.data,
          // Override with the most up-to-date wallet info if available
          ...(wallet ? {
            network: wallet.network,
            currency: wallet.currency,
            walletAddress: wallet.address
          } : {
            network,
            currency,
            walletAddress: currentWalletAddress
          })
        });
        
        toast({
          title: 'Payment Created',
          description: `Please send ${currency} to the provided ${network} address and upload a screenshot for confirmation.`,
          variant: 'default',
        });
      } else {
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

  // Handle screenshot upload
  const handleUploadScreenshot = async () => {
    if (!paymentData || !screenshotFile) {
      toast({
        title: 'Error',
        description: 'Please select a screenshot file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // In a real app, you would upload the file to a cloud service first
      // For now, we'll use the data URL as the screenshot URL
      const response = await api.payments.uploadScreenshot(paymentData.paymentId, {
        screenshotUrl: screenshotUrl,
        transactionHash: transactionHash || undefined,
        senderAddress: senderAddress || undefined,
      });

      if (response.status === 'success') {
        toast({
          title: 'Screenshot Uploaded',
          description: 'Your payment is now waiting for admin confirmation.',
          variant: 'default',
        });
        
        // Update payment data
        setPaymentData(prev => prev ? { ...prev, status: 'waiting_confirmation' } : null);
      } else {
        throw new Error(response.message || 'Failed to upload screenshot');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to upload screenshot. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Loading states
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (loadingPairs) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading trading pairs...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md mx-auto">
            <Shield className="h-16 w-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-gray-300 mb-6">Please log in to continue with your payment</p>
            <Button 
              onClick={() => router.push('/login')}
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!planName || !planPrice) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md mx-auto">
            <Star className="h-16 w-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Plan Information Missing</h2>
            <p className="text-gray-300 mb-6">Please select a plan to continue</p>
            <Button 
              onClick={() => router.push('/#pricing')}
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Choose a Plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Secure Payment</h1>
          <p className="text-gray-300 text-lg">Complete your subscription with USDT</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Payment Card */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  {planName} Plan
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {planFeatures?.unlimitedTradingPairs 
                    ? 'Unlimited trading pairs with your premium plan'
                    : `Choose up to ${getPlanLimit()} trading pairs with your ${planName} plan`}
                  {planFeatures?.includesTelegramGroup && (
                    <span className="block mt-2 text-green-400 font-semibold">
                      ✨ Includes Premium Telegram Group Access
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Network & Currency Selection */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Network and Currency Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white font-medium">Network</Label>
                      <Select 
                        value={network} 
                        onValueChange={(value) => {
                          setNetwork(value);
                          setSelectedWalletId(''); // Reset selected wallet when network changes
                        }}
                        disabled={loadingWallets}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder={
                            loadingWallets ? 'Loading networks...' : 'Select Network'
                          } />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20">
                          {networks.map(network => (
                            <SelectItem key={network} value={network}>
                              {network}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white font-medium">Currency</Label>
                      <Select 
                        value={currency} 
                        onValueChange={(value) => {
                          setCurrency(value);
                          setSelectedWalletId(''); // Reset selected wallet when currency changes
                        }}
                        disabled={loadingWallets}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder={
                            loadingWallets ? 'Loading currencies...' : 'Select Currency'
                          } />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20">
                          {currencies.map(curr => (
                            <SelectItem key={curr} value={curr}>
                              {curr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Wallet Selection */}
                  <div>
                    <Label className="text-white font-medium">Wallet Address</Label>
                    {loadingWallets ? (
                      <div className="h-10 flex items-center justify-center bg-white/5 rounded-md text-sm text-gray-400">
                        Loading wallet addresses...
                      </div>
                    ) : filteredWallets.length > 0 ? (
                      <Select 
                        value={selectedWalletId} 
                        onValueChange={(value) => {
                          setSelectedWalletId(value);
                          setCustomWalletAddress(''); // Clear custom address when selecting a wallet
                        }}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select a wallet address" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20">
                          {filteredWallets.map(wallet => (
                            <SelectItem key={wallet._id} value={wallet._id} className="flex flex-col items-start">
                              <div className="font-mono text-sm">{wallet.address}</div>
                              <div className="text-xs text-gray-400">{wallet.currency} • {wallet.network}</div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-yellow-400 text-sm py-2">
                        No wallet addresses available for the selected currency and network.
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <Label className="text-white font-medium">Or enter custom address</Label>
                      <Input
                        value={customWalletAddress}
                        onChange={e => {
                          setCustomWalletAddress(e.target.value);
                          setSelectedWalletId(''); // Clear selected wallet when entering custom address
                        }}
                        placeholder="Enter custom wallet address"
                        className="bg-white/10 border-white/20 text-white mt-1"
                      />
                    </div>
                    
                    {currentWallet?.qrCodeImage && (
                      <div className="mt-3 flex flex-col items-center">
                        <div className="bg-white p-2 rounded-md">
                          <img 
                            src={currentWallet.qrCodeImage} 
                            alt="Wallet QR Code" 
                            className="w-32 h-32 object-contain"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Scan to send {currentWallet.currency} ({currentWallet.network})</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trading Pair Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    Select Trading Pairs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white font-medium">Forex Pairs</Label>
                      <Select onValueChange={handlePairSelect}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select Forex pairs" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20">
                          {tradingPairs.forex && tradingPairs.forex.length > 0 ? (
                            tradingPairs.forex.map((pair) => (
                              <SelectItem 
                                key={pair.symbol} 
                                value={pair.symbol}
                                className={selectedPairs.includes(pair.symbol) ? 'bg-gray-800/20 text-gray-300' : 'text-white hover:bg-slate-700'}
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
                        <div className="space-y-2">
                          <Label className="text-white font-medium">Indices</Label>
                          <Select onValueChange={handlePairSelect}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select Indices" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/20">
                              {tradingPairs.indices && tradingPairs.indices.length > 0 ? (
                                tradingPairs.indices.map((pair) => (
                                  <SelectItem 
                                    key={pair.symbol} 
                                    value={pair.symbol}
                                    className={selectedPairs.includes(pair.symbol) ? 'bg-gray-800/20 text-gray-300' : 'text-white hover:bg-slate-700'}
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
                        <div className="space-y-2">
                          <Label className="text-white font-medium">Commodities</Label>
                          <Select onValueChange={handlePairSelect}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select Commodities" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/20">
                              {tradingPairs.commodities && tradingPairs.commodities.length > 0 ? (
                                tradingPairs.commodities.map((pair) => (
                                  <SelectItem 
                                    key={pair.symbol} 
                                    value={pair.symbol}
                                    className={selectedPairs.includes(pair.symbol) ? 'bg-gray-800/20 text-gray-300' : 'text-white hover:bg-slate-700'}
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
                        <div className="space-y-2">
                          <Label className="text-white font-medium">Cryptocurrencies</Label>
                          <Select onValueChange={handlePairSelect}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select Cryptocurrencies" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/20">
                              {tradingPairs.crypto && tradingPairs.crypto.length > 0 ? (
                                tradingPairs.crypto.map((pair) => (
                                  <SelectItem 
                                    key={pair.symbol} 
                                    value={pair.symbol}
                                    className={selectedPairs.includes(pair.symbol) ? 'bg-gray-800/20 text-gray-300' : 'text-white hover:bg-slate-700'}
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
                      <Label className="text-white font-medium">
                        Selected Pairs {!planFeatures?.unlimitedTradingPairs && 
                          `(${selectedPairs.length}/${getPlanLimit()})`}:
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedPairs.map((pair) => (
                          <div
                            key={pair}
                            className="bg-gray-800/50 border border-gray-600/30 text-gray-300 px-3 py-1 rounded-full text-sm flex items-center gap-2 backdrop-blur-sm"
                          >
                            {pair}
                            <button
                              onClick={() => handlePairSelect(pair)}
                              className="hover:text-red-400 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Section */}
                {!paymentData ? (
                  <div className="mt-6">
                    <Button
                      onClick={handleCreatePayment}
                      disabled={isLoading || selectedPairs.length === 0}
                      className="w-full bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating Payment...
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-5 w-5" />
                          Create Payment
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Payment Details */}
                    <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        Payment Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-gray-300 text-sm">Amount to Pay</Label>
                          <div className="text-3xl font-bold text-green-400">
                            {paymentData.amount} {paymentData.currency}
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm">Payment Status</Label>
                          <div className="flex items-center gap-2">
                            {paymentData.status === 'pending' && (
                              <div className="text-yellow-400 font-medium flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Pending
                              </div>
                            )}
                            {paymentData.status === 'waiting_confirmation' && (
                              <div className="text-blue-400 font-medium flex items-center gap-1">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Waiting Confirmation
                              </div>
                            )}
                            {paymentData.status === 'completed' && (
                              <div className="text-green-400 font-medium flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Completed
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-gray-300 text-sm">Network</Label>
                            <div className="text-green-400 font-mono">{paymentData.network}</div>
                          </div>
                          <div>
                            <Label className="text-gray-300 text-sm">Currency</Label>
                            <div className="text-green-400 font-mono">{paymentData.currency}</div>
                          </div>
                          <div>
                            <Label className="text-gray-300 text-sm">Wallet Address</Label>
                            <div className="bg-slate-800/50 p-4 rounded-lg font-mono text-sm break-all text-green-400 border border-green-500/30 mt-1">
                              {paymentData.walletAddress}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 border-green-500/30 text-green-400 hover:bg-green-500/20"
                              onClick={() => {
                                navigator.clipboard.writeText(paymentData.walletAddress);
                                toast({
                                  title: 'Address Copied',
                                  description: `${paymentData.currency} address copied to clipboard`,
                                });
                              }}
                            >
                              Copy Address
                            </Button>
                          </div>
                        </div>
                        
                        {/* QR Code Section */}
                        <div className="flex flex-col items-center justify-center">
                          {currentWallet?.qrCodeImage ? (
                            <div className="bg-white p-3 rounded-lg border border-green-500/30">
                              <img 
                                src={currentWallet.qrCodeImage} 
                                alt="Wallet QR Code" 
                                className="w-40 h-40 object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-40 h-40 bg-slate-800/50 rounded-lg border border-green-500/30">
                              <span className="text-gray-400 text-sm text-center">No QR Code Available</span>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            Scan to send {paymentData.currency} ({paymentData.network})
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-yellow-400 text-sm">
                          <Info className="inline h-4 w-4 mr-1" />
                          Please send exactly {paymentData.amount} {paymentData.currency} to the address above.
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Network fees are not included. Ensure you're sending on the {paymentData.network} network.
                        </p>
                      </div>
                    </div>

                    {/* Screenshot Upload */}
                    {paymentData.status === 'pending' && (
                      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <Upload className="h-5 w-5 text-blue-400" />
                          Upload Payment Screenshot
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="senderAddress" className="text-gray-300 text-sm">Sender Address (Optional)</Label>
                            <Input
                              id="senderAddress"
                              type="text"
                              placeholder="Enter your USDT sender address for verification"
                              value={senderAddress}
                              onChange={(e) => setSenderAddress(e.target.value)}
                              className="mt-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              This helps us verify your payment more quickly
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="screenshot" className="text-gray-300 text-sm">Payment Screenshot</Label>
                            <div className="mt-1 relative">
                              <Input
                                id="screenshot"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="bg-white/10 border-white/20 text-white file:bg-gray-800 file:border-0 file:text-white file:rounded-lg file:px-4 file:py-2 file:mr-4 file:hover:bg-gray-700 file:cursor-pointer file:relative file:top-0 file:leading-none file:align-middle file:inline-flex file:items-center file:justify-center file:h-10 file:min-h-0 file:my-0 file:box-border file:appearance-none file:bg-gray-800 file:text-white file:rounded-lg file:px-4 file:py-2 file:mr-4 file:hover:bg-gray-700 file:transition-colors file:duration-200 file:font-medium file:text-sm file:border file:border-gray-600 file:hover:border-gray-500"
                                style={{
                                  '--tw-file-padding-y': '0.5rem',
                                  '--tw-file-padding-x': '1rem',
                                  '--tw-file-line-height': '1.25rem',
                                  '--tw-file-font-size': '0.875rem',
                                  '--tw-file-font-weight': '500',
                                  '--tw-file-border-radius': '0.5rem',
                                  '--tw-file-border-width': '1px',
                                  '--tw-file-border-color': 'rgb(75 85 99)',
                                  '--tw-file-bg-opacity': '1',
                                  '--tw-file-bg': 'rgb(31 41 55)',
                                  '--tw-file-text-opacity': '1',
                                  '--tw-file-text': 'rgb(255 255 255)',
                                  '--tw-file-hover-bg': 'rgb(55 65 81)',
                                  '--tw-file-hover-border-color': 'rgb(107 114 128)',
                                  '--tw-file-transition-property': 'color, background-color, border-color, text-decoration-color, fill, stroke',
                                  '--tw-file-transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
                                  '--tw-file-transition-duration': '150ms'
                                } as React.CSSProperties}
                              />
                              <style jsx>{`
                                input[type="file"]::-webkit-file-upload-button {
                                  background-color: rgb(31 41 55) !important;
                                  color: white !important;
                                  border: 1px solid rgb(75 85 99) !important;
                                  border-radius: 0.5rem !important;
                                  padding: 0.5rem 1rem !important;
                                  margin-right: 1rem !important;
                                  cursor: pointer !important;
                                  font-size: 0.875rem !important;
                                  font-weight: 500 !important;
                                  line-height: 1.25rem !important;
                                  transition: all 150ms !important;
                                  vertical-align: middle !important;
                                  display: inline-flex !important;
                                  align-items: center !important;
                                  justify-content: center !important;
                                  height: 2.5rem !important;
                                  min-height: 0 !important;
                                  margin: 0 !important;
                                  position: relative !important;
                                  top: 0 !important;
                                }
                                input[type="file"]::-webkit-file-upload-button:hover {
                                  background-color: rgb(55 65 81) !important;
                                  border-color: rgb(107 114 128) !important;
                                }
                                input[type="file"]::-moz-file-upload-button {
                                  background-color: rgb(31 41 55) !important;
                                  color: white !important;
                                  border: 1px solid rgb(75 85 99) !important;
                                  border-radius: 0.5rem !important;
                                  padding: 0.5rem 1rem !important;
                                  margin-right: 1rem !important;
                                  cursor: pointer !important;
                                  font-size: 0.875rem !important;
                                  font-weight: 500 !important;
                                  line-height: 1.25rem !important;
                                  transition: all 150ms !important;
                                  vertical-align: middle !important;
                                  display: inline-flex !important;
                                  align-items: center !important;
                                  justify-content: center !important;
                                  height: 2.5rem !important;
                                  min-height: 0 !important;
                                  margin: 0 !important;
                                  position: relative !important;
                                  top: 0 !important;
                                }
                                input[type="file"]::-moz-file-upload-button:hover {
                                  background-color: rgb(55 65 81) !important;
                                  border-color: rgb(107 114 128) !important;
                                }
                              `}</style>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Upload a screenshot of your USDT transfer (max 5MB)
                            </p>
                          </div>

                          {screenshotUrl && (
                            <div>
                              <Label className="text-gray-300 text-sm">Preview</Label>
                              <div className="mt-2">
                                <img
                                  src={screenshotUrl}
                                  alt="Payment screenshot"
                                  className="max-w-full h-auto max-h-64 rounded-lg border border-white/20"
                                />
                              </div>
                            </div>
                          )}

                          <div>
                            <Label htmlFor="transactionHash" className="text-gray-300 text-sm">Transaction Hash (Optional)</Label>
                            <Input
                              id="transactionHash"
                              type="text"
                              placeholder="Enter transaction hash if available"
                              value={transactionHash}
                              onChange={(e) => setTransactionHash(e.target.value)}
                              className="mt-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
                            />
                          </div>

                          <Button
                            onClick={handleUploadScreenshot}
                            disabled={!screenshotFile || isUploading}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Screenshot
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Payment Status */}
                    {paymentData.status === 'waiting_confirmation' && (
                      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-green-400" />
                          <div>
                            <h3 className="text-lg font-bold text-white">Payment Submitted</h3>
                            <p className="text-gray-300">
                              Your payment screenshot has been uploaded and is waiting for admin confirmation. 
                              You will receive an email notification once your payment is confirmed.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan Summary */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  Plan Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Plan:</span>
                  <span className="text-white font-semibold">{planName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Price:</span>
                  <span className="text-green-400 font-bold text-lg">${planPrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Trading Pairs:</span>
                  <span className="text-white font-semibold">
                    {planFeatures?.unlimitedTradingPairs ? 'Unlimited' : getPlanLimit()}
                  </span>
                </div>
                {planFeatures?.includesTelegramGroup && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Telegram Group:</span>
                    <span className="text-green-400 font-semibold">✓ Included</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">End-to-end encrypted payment processing</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">Manual verification for maximum security</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">24/7 admin support and monitoring</p>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Info className="h-5 w-5 text-purple-400" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">Send exactly {paymentData?.amount || planPrice} USDT to the provided address</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">Use TRC20 network only</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">Upload screenshot after sending</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-sm">Confirmation within 24 hours</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">
            By subscribing, you agree to our{' '}
            <Link href="/terms" className="text-gray-400 hover:text-gray-300 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-gray-400 hover:text-gray-300 underline">
              Privacy Policy
            </Link>
          </p>
          <p className="text-gray-400 text-sm mt-2">
            You can cancel your subscription at any time from your profile page.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
