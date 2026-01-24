"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Upload, Check, Copy, ArrowLeft, ShieldCheck, Wallet } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Wallet {
  _id: string;
  currency: string;
  network: string;
  address: string;
  qrCode?: string;
}

interface Plan {
  _id: string;
  title: string;
  price: number;
  features: string[];
  [key: string]: unknown;
}

export default function CheckoutPage() {
  const { plan: planParam, locale } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Wallet, 2: Upload Screenshot, 3: Success
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [planDetails, setPlanDetails] = useState<Plan | null>(null);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const res = await api.plans.getAll();
        if (res.status === 'success' && res.data) {
          const found = res.data.find((p: Plan) => p._id === planParam || p.id === planParam);
          if (found) {
            setPlanDetails(found);
          } else {
             toast.error('Plan not found');
          }
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      }
    };
    if (planParam) {
      fetchPlanDetails();
    }
  }, [planParam]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/checkout/${planParam}`);
    }
  }, [user, authLoading, router, planParam]);


  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const res = await api.wallets.active();
        if (res.status === 'success' && res.data && res.data.wallets) {
          setWallets(res.data.wallets);
          if (res.data.wallets.length > 0) {
            setSelectedWallet(res.data.wallets[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch wallets:', error);
        toast.error('Failed to load payment methods');
      }
    };
    fetchWallets();
  }, []);

  const handleCreatePayment = async () => {
    if (!selectedWallet || !user || !user._id || !planDetails) return;
    
    setLoading(true);
    try {
      const data = {
        planName: planDetails.title,
        planPrice: planDetails.price,
        userId: user._id,
        walletAddress: selectedWallet.address,
        network: selectedWallet.network,
        currency: selectedWallet.currency,
        senderAddress: '',
        selectedPairs: ['ALL']
      };

      const res = await api.payments.create(data);
      if (res.status === 'success') {
        setPaymentId(res.data.payment._id || res.data.paymentId); // Check response structure
        setStep(2); // Go to upload
        toast.success('Order created. Please upload payment proof.');
      } else {
        toast.error(res.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const handleUploadScreenshot = async () => {
    if (!paymentId || !file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', file);
      
      const res = await api.payments.uploadScreenshot(paymentId, formData);
      if (res.status === 'success') {
        setStep(3); // Success
      } else {
        toast.error(res.message || 'Failed to upload screenshot');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload screenshot');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010203]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010203] pb-20 pt-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-[128px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href={`/${locale}/payment`} className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Link>
        </div>

        {!planDetails ? (
           <div className="flex justify-center items-center min-h-[400px]">
             <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
           </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Order Summary */}
          <div className="md:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Plan</span>
                  <span className="text-white font-medium">{planDetails?.title}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Billing Cycle</span>
                  <span className="text-white font-medium">Monthly</span>
                </div>
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-semibold">Total</span>
                    <span className="text-2xl font-bold text-emerald-400">${planDetails?.price}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3">Included Features:</h3>
                <ul className="space-y-2 text-xs text-gray-400">
                  {planDetails?.features?.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-3 w-3 text-emerald-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Steps */}
          <div className="md:col-span-2">
            {step === 1 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                <h1 className="text-2xl font-bold text-white mb-2">Select Payment Method</h1>
                <p className="text-gray-400 mb-8">Choose a crypto wallet to make your payment.</p>

                {wallets.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Loading payment methods...
                  </div>
                ) : (
                  <div className="space-y-4 mb-8">
                    {wallets.map((wallet) => (
                      <div 
                        key={wallet._id}
                        onClick={() => setSelectedWallet(wallet)}
                        className={`cursor-pointer rounded-xl border p-4 flex items-center transition-all ${
                          selectedWallet?._id === wallet._id 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 ${
                          selectedWallet?._id === wallet._id ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'
                        }`}>
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white">{wallet.currency}</h3>
                          <p className="text-xs text-gray-400 uppercase">{wallet.network} Network</p>
                        </div>
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                          selectedWallet?._id === wallet._id ? 'border-emerald-500 bg-emerald-500' : 'border-gray-500'
                        }`}>
                          {selectedWallet?._id === wallet._id && <Check className="h-3 w-3 text-black" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedWallet && (
                  <div className="bg-black/30 rounded-xl p-4 mb-8 border border-white/10">
                    <p className="text-sm text-gray-400 mb-2">Send <span className="text-white font-bold">${planDetails?.price}</span> worth of <span className="text-white font-bold">{selectedWallet.currency}</span> to:</p>
                    <div className="flex items-center gap-2 bg-black/50 rounded-lg p-3 border border-white/5">
                      <code className="flex-1 text-sm text-emerald-400 font-mono break-all">
                        {selectedWallet.address}
                      </code>
                      <button 
                        onClick={() => copyToClipboard(selectedWallet.address)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-amber-400 mt-2 flex items-start">
                      <span className="mr-1">⚠️</span>
                      Make sure to use the {selectedWallet.network} network. Sending via other networks may result in loss of funds.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleCreatePayment}
                  disabled={loading || !selectedWallet}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'I have made the payment'}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                <h1 className="text-2xl font-bold text-white mb-2">Upload Proof</h1>
                <p className="text-gray-400 mb-8">Please upload a screenshot of your transaction.</p>

                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-emerald-500/50 transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {previewUrl ? (
                    <div className="relative h-64 w-full mx-auto">
                      <Image 
                        src={previewUrl} 
                        alt="Preview" 
                        fill 
                        className="object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUploadScreenshot}
                    disabled={loading || !file}
                    className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="h-10 w-10 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">Payment Submitted!</h1>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Your payment proof has been uploaded successfully. Our team will review it and activate your subscription shortly. You will receive an email confirmation.
                </p>
                
                <Link
                  href="/dashboard"
                  className="inline-flex justify-center items-center py-3 px-8 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
