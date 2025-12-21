"use client"

import React, { useState, useEffect, Suspense, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, CreditCard, Bitcoin, Info, Loader2, Check, CheckCircle, XCircle, Wallet, Shield, Clock, Star, Zap, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { ImageUpload } from "@/components/ui/image-upload"
import { useTranslation } from "react-i18next"

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
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  isOnSale: boolean;
  saleEndsAt?: string;
  saleDescription?: string;
  isActive: boolean;
  assetCount: number;
  assetType?: string | string[];
  maxTradingPairs?: number;
  unlimitedTradingPairs?: boolean;
  includesTelegramGroup?: boolean;
  duration?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  payment: {
    _id: string;
    orderId: string;
    amount: number;
    currency: string;
    status: string;
    selectedPairs: string[];
    manualPayment: {
      walletAddress: string;
      network: string;
    };
  };
}

function PaymentContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const planName = searchParams.get('plan')
  const planPrice = searchParams.get('price')
  const assetTypeParam = searchParams.get('assetType')
  const assetTypes = assetTypeParam ? assetTypeParam.split(',') : []
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
  const [planImages, setPlanImages] = useState<Array<{
    url: string;
    filename: string;
    originalName: string;
    uploadedAt: string;
  }>>([]);
  


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
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>('');

  // Get available networks and currencies from wallets
  const networks = Array.from(new Set(wallets.map(w => w.network))).sort();
  const currencies = Array.from(new Set(wallets.map(w => w.currency))).sort();
  
  // Filter wallets based on selected network and currency
  const filteredWallets = useMemo(() => {
    if (!wallets.length) return [];
    
    console.log('Filtering wallets with network:', network, 'and currency:', currency);
    
    const filtered = wallets.filter(wallet => {
      const matchesNetwork = !network || wallet.network === network;
      const matchesCurrency = !currency || wallet.currency === currency;
      
      console.log('Checking wallet:', {
        walletNetwork: wallet.network,
        walletCurrency: wallet.currency,
        matchesNetwork,
        matchesCurrency,
        isActive: wallet.isActive
      });
      
      return matchesNetwork && matchesCurrency && wallet.isActive !== false;
    });
    
    console.log('Filtered wallets result:', filtered);
    return filtered;
  }, [wallets, network, currency]);
  
  // Debug logs
  useEffect(() => {
    console.log('=== WALLET DEBUG ===');
    console.log('All wallets:', wallets);
    console.log('Filtered wallets:', filteredWallets);
    console.log('Selected network:', network);
    console.log('Selected currency:', currency);
    console.log('Selected wallet ID:', selectedWalletId);
    console.log('Current wallet address:', currentWalletAddress);
    console.log('===================');
  }, [wallets, filteredWallets, network, currency, selectedWalletId, currentWalletAddress]);
  
  // Get the currently selected wallet
  const currentWallet = selectedWalletId 
    ? wallets.find(w => w._id === selectedWalletId)
    : filteredWallets[0];
  
  // Update current wallet address when selection changes
  useEffect(() => {
    if (currentWallet?.address) {
      setCurrentWalletAddress(currentWallet.address);
    } else {
      setCurrentWalletAddress('');
    }
  }, [currentWallet]);
  
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
  
  // Fetch wallets when component mounts
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setLoadingWallets(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/wallets/active`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched wallets data:', data);
        
        // Extract wallets from the response
        const walletsData = data.data?.wallets || [];
        
        if (walletsData.length > 0) {
          console.log('Setting wallets:', walletsData);
          setWallets(walletsData);
          
          // Auto-select first available wallet if none selected
          const firstWallet = walletsData[0];
          console.log('Setting first wallet as default:', firstWallet);
          
          setNetwork(firstWallet.network);
          setCurrency(firstWallet.currency);
          setCurrentWalletAddress(firstWallet.address);
          setSelectedWalletId(firstWallet._id || '');
        } else {
          throw new Error(data.message || 'Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching wallet addresses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load wallet addresses. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoadingWallets(false);
      }
    };

    fetchWallets();
  }, []);
  
  // Current wallet address for display
  // const walletAddress = currentWallet?.address || customWalletAddress;
  
  // Function to verify authentication
  const verifyAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        return false;
      }

      // Verify token with backend
      const response = await fetch('http://localhost:8080/api/users/me', {
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
      let maxPairs = 5; // Default fallback
      let isUnlimited = false;
      let includesGroup = false;

      // Get plan data from the backend if plan name is available
      if (planName) {
        try {
          const response = await api.subscriptions.getPlans();
          if (response.status === 'success' && response.data?.plans) {
            // Find the plan by name
            const plan = response.data.plans.find((p: any) => p.title === planName);
            
            if (plan) {
              // Use maxTradingPairs if available, otherwise use assetCount
              if (typeof plan.maxTradingPairs === 'number') {
                maxPairs = plan.maxTradingPairs;
              } else if (typeof plan.assetCount === 'number') {
                maxPairs = plan.assetCount;
              }
              
              // Check for unlimited trading pairs
              if (plan.unlimitedTradingPairs) {
                isUnlimited = true;
                maxPairs = 0; // 0 means unlimited
              }
              
              // Check for Telegram group access
              if (plan.includesTelegramGroup) {
                includesGroup = true;
              }
              
              console.log('Plan features loaded:', { maxPairs, isUnlimited, includesGroup });
            } else {
              console.warn('Plan not found:', planName);
            }
          }
        } catch (error) {
          console.error('Error fetching plan details:', error);
          // Fallback to default values if there's an error
        }
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



  // Handle payment creation
  const handleCreatePayment = async () => {
    if (!isAuthenticated || !userId) {
      toast({
        title: 'Error',
        description: 'Please log in to make a payment',
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
        network,
        currency,
        walletAddress: currentWalletAddress,
      });

      // Filter out blob URLs and only send actual uploaded images
      const validPlanImages = planImages.filter(img => !img.url.startsWith('blob:'));
      
      // First, create the payment
      const response = await api.payments.createPayment({
        userId,
        planName,
        planPrice: parseFloat(planPrice),
        selectedPairs,
        network,
        currency,
        walletAddress: currentWalletAddress,
        planImages: validPlanImages, // Only send actual uploaded images
      });

      console.log('Payment response:', response);

      if (response.status === 'success' && response.data) {
        // Get the payment data from the response
        const paymentResponse = response.data.payment || response.data;
        const wallet = selectedWalletId ? wallets.find(w => w._id === selectedWalletId) : null;
        
        // Create the payment data with all required fields
        const paymentData: PaymentData = {
          paymentId: paymentResponse._id,
          orderId: paymentResponse.orderId,
          amount: paymentResponse.amount,
          currency: paymentResponse.currency,
          status: paymentResponse.status || 'pending',
          walletAddress: wallet?.address || currentWalletAddress,
          network: wallet?.network || network,
          message: 'Payment created successfully. Please wait for confirmation.',
          payment: {
            _id: paymentResponse._id,
            orderId: paymentResponse.orderId,
            amount: paymentResponse.amount,
            currency: paymentResponse.currency,
            status: paymentResponse.status || 'pending',
            selectedPairs: selectedPairs, // Add selectedPairs to match PaymentData type
            manualPayment: {
              walletAddress: wallet?.address || 
                            paymentResponse.manualPayment?.walletAddress || 
                            currentWalletAddress,
              network: wallet?.network || 
                      paymentResponse.manualPayment?.network || 
                      network
            }
          }
        };
        

        // Update the state with the final payment data
        setPaymentData(paymentData);
        
        // Show success message
        toast({
          title: paymentData.status === 'waiting_confirmation' ? 'Payment Submitted' : 'Payment Created',
          description: paymentData.message,
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



  // Loading states
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('paymentPage.verifyingAuthentication')}</p>
        </div>
      </div>
    );
  }

  if (loadingPairs) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('paymentPage.loadingTradingPairs')}</p>
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
            <h2 className="text-2xl font-bold text-white mb-4">{t('paymentPage.authenticationRequired')}</h2>
            <p className="text-gray-300 mb-6">{t('paymentPage.pleaseLoginToContinue')}</p>
            <Button 
              onClick={() => router.push('/login')}
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              {t('paymentPage.goToLogin')}
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
            <h2 className="text-2xl font-bold text-white mb-4">{t('paymentPage.planInfoMissing')}</h2>
            <p className="text-gray-300 mb-6">{t('paymentPage.pleaseSelectPlan')}</p>
            <Button 
              onClick={() => router.push('/#pricing')}
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              {t('paymentPage.chooseAPlan')}
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
          <h1 className="text-4xl font-bold text-white mb-2">{t('paymentPage.securePayment')}</h1>
          <p className="text-gray-300 text-lg">{t('paymentPage.completeSubscriptionWithUSDT')}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Payment Card */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  {planName} {t('paymentPage.plan')}
                </CardTitle>
                
                {/* Plan Images Display */}
                {planImages.length > 0 && (
                  <div className="mb-4">
                    <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                      {planImages.slice(0, 5).map((image, index) => (
                        <div key={image.filename} className="relative flex-shrink-0">
                          <img
                            src={image.url}
                            alt={image.originalName}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-white/20"
                          />
                          {index === 4 && planImages.length > 5 && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                +{planImages.length - 5}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <CardDescription className="text-gray-300">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      {planFeatures?.unlimitedTradingPairs ? (
                        <span className="bg-green-500/20 text-green-400 text-sm font-medium px-3 py-1 rounded-full flex items-center">
                          <Check className="h-3 w-3 mr-1" />
                          Unlimited Trading Pairs
                        </span>
                      ) : (
                        <span className="bg-blue-500/20 text-blue-400 text-sm font-medium px-3 py-1 rounded-full">
                          {getPlanLimit()} Trading Pairs Included
                        </span>
                      )}
                    </div>
                    <div>
                      {planFeatures?.unlimitedTradingPairs 
                        ? 'Access to all available trading pairs with your premium plan.'
                        : `You can select up to ${getPlanLimit()} trading pairs with your ${planName} plan.`}
                    </div>
                    {planFeatures?.includesTelegramGroup && (
                      <div className="mt-2">
                        <span className="inline-flex items-center text-green-400 font-semibold bg-green-500/20 px-3 py-1 rounded-full">
                          ✨ Includes Premium Telegram Group Access
                        </span>
                      </div>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Network & Currency Selection */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-4">
                    {loadingWallets ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : wallets.length === 0 ? (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>No wallet addresses available</AlertTitle>
                        <AlertDescription>
                          Please contact support for payment instructions.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="network">Network</Label>
                            <Select 
                              value={network} 
                              onValueChange={setNetwork}
                              disabled={wallets.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select network" />
                              </SelectTrigger>
                              <SelectContent>
                                {networks.map((net) => (
                                  <SelectItem key={net} value={net}>
                                    {net}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select 
                              value={currency} 
                              onValueChange={setCurrency}
                              disabled={wallets.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                              <SelectContent>
                                {currencies.map((curr) => (
                                  <SelectItem key={curr} value={curr}>
                                    {curr}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {filteredWallets.length > 0 ? (
                          <div className="space-y-2">
                            <Label>Select Wallet Address</Label>
                            <div className="space-y-2">
                              {filteredWallets.map((wallet) => (
                                <div
                                  key={wallet._id}
                                  className={`p-4 border rounded-md cursor-pointer hover:bg-accent ${
                                    selectedWalletId === wallet._id ? 'border-primary bg-accent' : ''
                                  }`}
                                  onClick={() => {
                                    setSelectedWalletId(wallet._id);
                                    setCurrentWalletAddress(wallet.address);
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{wallet.currency} ({wallet.network})</p>
                                      <p className="text-sm text-muted-foreground break-all">
                                        {wallet.address}
                                      </p>
                                    </div>
                                    {selectedWalletId === wallet._id && (
                                      <CheckCircle className="h-5 w-5 text-green-500" />
                                    )}
                                  </div>
                                  {wallet.qrCodeImage && (
                                    <div className="mt-2 flex justify-center">
                                      <img 
                                        src={wallet.qrCodeImage} 
                                        alt="QR Code" 
                                        className="h-24 w-24 object-contain"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>No wallets available for selected filters</AlertTitle>
                            <AlertDescription>
                              Please select different network or currency.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
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
                    {/* Show all selected asset types */}
                    {assetTypes.includes('forex') && (
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
                    )}
                    {assetTypes.includes('indices') && (
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
                    )}
                    {assetTypes.includes('commodities') && (
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
                    )}
                    {assetTypes.includes('crypto') && (
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

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-purple-400" />
                    Add Plan Images (Optional)
                  </h3>
                  <ImageUpload
                    images={planImages}
                    onImagesChange={setPlanImages}
                    maxImages={5}
                    className="bg-white/5 p-4 rounded-lg"
                  />
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



                    {/* Payment Status */}
                    {paymentData.status === 'waiting_confirmation' && (
                      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-green-400" />
                          <div>
                            <h3 className="text-lg font-bold text-white">Payment Submitted</h3>
                            <p className="text-gray-300">
                              Your payment is being processed. Please wait for confirmation.
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
                
                {/* Plan Images Summary */}
                {planImages.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Images:</span>
                      <span className="text-white font-semibold">{planImages.length} uploaded</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {planImages.slice(0, 3).map((image) => (
                        <div key={image.filename} className="relative">
                          <img
                            src={image.url}
                            alt={image.originalName}
                            className="w-full h-16 object-cover rounded-md border border-white/20"
                          />
                        </div>
                      ))}
                      {planImages.length > 3 && (
                        <div className="relative">
                          <div className="w-full h-16 bg-gray-700/50 rounded-md border border-white/20 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              +{planImages.length - 3}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
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
                  <p className="text-gray-300 text-sm">Please wait for confirmation</p>
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
