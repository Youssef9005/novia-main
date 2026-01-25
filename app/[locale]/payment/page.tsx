"use client";

import { useTranslations } from 'next-intl';
import { Check, Copy } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Wallet {

  _id: string;
  currency: string;
  network: string;
  address: string;
  qrCode?: string;
}

export default function PaymentPage() {
  const t = useTranslations('Pricing');
  interface Plan {
    _id: string;
    title: string;
    description?: string;
    price: number;
    features: string[];
  }

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activeWallets, setActiveWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const res = await api.wallets.active();
        if (res.status === 'success' && res.data && res.data.wallets) {
          setActiveWallets(res.data.wallets);
        }
      } catch (error) {
        console.error('Failed to fetch active wallets:', error);
      }
    };

    const fetchPlans = async () => {
      try {
        const response = await api.plans.getAll();
        console.log("Plans response payment page:", response);
        if (response.status === 'success') {
          // Handle both array directly or nested in data object
          const plansData = Array.isArray(response.data) 
            ? response.data 
            : (response.data?.plans && Array.isArray(response.data.plans)) 
              ? response.data.plans 
              : [];
          setPlans(plansData);
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchWallets();
    fetchPlans();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };

  // Plans are fetched from backend


  return (
    <div className="min-h-screen bg-[#010203] pb-20 pt-24 relative overflow-hidden">
       {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-[128px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {t('title_prefix')} <span className="text-emerald-400">{t('title_highlight')}</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-400">
            {t('description')}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8 mb-20">
          {plans.map((plan) => (
            <div 
              key={plan._id}
              className={`relative flex flex-col rounded-3xl border p-8 shadow-2xl transition-transform hover:-translate-y-1 ${
                plan.title === 'Pro' || plan.title === 'Advanced' // Simple logic for popular highlight
                  ? 'bg-gradient-to-b from-emerald-900/20 to-black border-emerald-500/30 ring-1 ring-emerald-500/30' 
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              {(plan.title === 'Pro' || plan.title === 'Advanced') && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-1 text-xs font-bold text-black shadow-lg shadow-emerald-500/20">
                  {t('most_popular')}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white">{plan.title}</h3>
                <div className="mt-4 flex items-baseline text-white">
                  <span className="text-4xl font-bold tracking-tight">${plan.price}</span>
                  <span className="ml-1 text-sm font-medium text-gray-400">{t('monthly')}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-400">
                  {plan.description || t('plan_description_default')}
                </p>
              </div>

              <ul role="list" className="mb-8 space-y-3 text-sm leading-6 text-gray-300 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-emerald-400" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={`/checkout/${plan._id}`}
                className={`block w-full rounded-xl px-3 py-3 text-center text-sm font-semibold leading-6 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all ${
                  plan.title === 'Pro' || plan.title === 'Advanced'
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400 focus-visible:outline-emerald-500'
                    : 'bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white'
                }`}
              >
                {t('choose_plan')}
              </Link>
            </div>
          ))}
        </div>

        {/* Active Wallets Section */}
        {activeWallets.length > 0 && (
          <div className="mx-auto max-w-4xl border-t border-white/10 pt-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-4">Accepted Payment Methods</h2>
              <p className="text-gray-400">
                You can also pay directly using the following crypto wallets. 
                Please contact support after transfer.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {activeWallets.map((wallet) => (
                <div key={wallet._id || wallet.address} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                      {wallet.currency ? wallet.currency.substring(0, 1) : '$'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{wallet.currency}</h3>
                      <p className="text-xs text-gray-400 uppercase">{wallet.network} Network</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/50 rounded-lg p-3 flex items-center justify-between gap-2 group">
                    <code className="text-sm text-gray-300 truncate font-mono">
                      {wallet.address}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(wallet.address)}
                      className="p-2 text-gray-500 hover:text-white transition-colors"
                      title="Copy Address"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
