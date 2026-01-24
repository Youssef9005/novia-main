"use client";

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings?: number; // Backend might not send this, defaulting to 0
  conversionRate: number;
}

interface ReferralUser {
  id: string;
  user: string;
  date: string;
  status: string;
  earning: string;
}

interface ReferralItem {
  _id: string;
  referredUser?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  status: string;
  totalEarnings: number;
}

export default function ReferralsPage() {
  const t = useTranslations('Referrals');
  const { user } = useAuth();
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    conversionRate: 0
  });
  const [referrals, setReferrals] = useState<ReferralUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.myReferralCode) {
      // Assuming the app is hosted at window.location.origin
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://novia.ai';
      setReferralLink(`${origin}/register?ref=${user.myReferralCode}`);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, listRes] = await Promise.all([
          api.referrals.getStats(),
          api.referrals.getAll()
        ]);

        if (statsRes.status === 'success' && statsRes.data) {
          setStats({
            totalReferrals: statsRes.data.stats.totalReferrals || 0,
            activeReferrals: statsRes.data.stats.activeReferrals || 0,
            totalEarnings: statsRes.data.stats.totalEarnings || 0,
            pendingEarnings: 0, // Not currently in backend stats
            conversionRate: statsRes.data.stats.conversionRate || 0
          });
        }

        if (listRes.status === 'success' && listRes.data && listRes.data.referrals) {
          const mappedReferrals = listRes.data.referrals.map((ref: ReferralItem) => ({
            id: ref._id,
            user: ref.referredUser ? `${ref.referredUser.firstName} ${ref.referredUser.lastName}` : 'Unknown',
            date: new Date(ref.createdAt).toLocaleDateString(),
            status: ref.status === 'completed' ? 'Active' : 'Pending', // Mapping 'completed' to 'Active'
            earning: `$${ref.totalEarnings || 0}`
          }));
          setReferrals(mappedReferrals);
        }
      } catch (error) {
        console.error('Failed to fetch referral data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010203]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#010203] pb-20">
      
      {/* 1. Cover Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-[#05070a]">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/40 via-black/50 to-emerald-900/40" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-12 mb-12">
           
           {/* Header */}
           <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-4xl font-bold text-white">{t('title')}</h1>
                <p className="mt-2 text-white/60 max-w-2xl">
                  {t('subtitle')}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
                 <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                 <span className="text-sm font-medium text-emerald-400">{t('program_active')}</span>
              </div>
           </div>

           {/* Stats Cards */}
           <div className="grid gap-6 sm:grid-cols-3">
              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 transition hover:border-emerald-500/30">
                 <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y-[-20%] rounded-full bg-white/5 blur-2xl transition group-hover:bg-emerald-500/10"></div>
                 <div className="relative z-10">
                    <div className="text-sm font-medium text-white/60">{t('total_referrals')}</div>
                    <div className="mt-2 text-4xl font-bold text-white">{stats.totalReferrals}</div>
                    <div className="mt-2 flex items-center text-xs text-emerald-400">
                       <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                       </svg>
                       {t('referral_stat_growth')}
                    </div>
                 </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 transition hover:border-emerald-500/30">
                 <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y-[-20%] rounded-full bg-emerald-500/10 blur-2xl transition group-hover:bg-emerald-500/20"></div>
                 <div className="relative z-10">
                    <div className="text-sm font-medium text-white/60">{t('total_earnings')}</div>
                    <div className="mt-2 text-4xl font-bold text-emerald-400">${stats.totalEarnings.toFixed(2)}</div>
                    <div className="mt-2 text-xs text-white/40">{t('available_withdrawal')}</div>
                 </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 transition hover:border-amber-500/30">
                 <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y-[-20%] rounded-full bg-amber-500/5 blur-2xl transition group-hover:bg-amber-500/10"></div>
                 <div className="relative z-10">
                    <div className="text-sm font-medium text-white/60">{t('pending_earnings')}</div>
                    <div className="mt-2 text-4xl font-bold text-amber-400">${(stats.pendingEarnings || 0).toFixed(2)}</div>
                    <div className="mt-2 text-xs text-white/40">{t('processing')}</div>
                 </div>
              </div>
           </div>

           <div className="mt-8 grid gap-8 lg:grid-cols-3">
              
              {/* Left: Link & Info (1 col) */}
              <div className="space-y-6 lg:col-span-1">
                 <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/10 to-black p-6">
                    <h3 className="mb-4 text-lg font-bold text-white">{t('referral_link')}</h3>
                    <div className="space-y-3">
                       <p className="text-sm text-white/60">{t('referral_share_desc')}</p>
                       <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                          <div className="font-mono text-sm text-white/90 break-all">{referralLink}</div>
                       </div>
                       <button 
                         onClick={handleCopy}
                         className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                       >
                         {copied ? (
                           <>
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                             </svg>
                             {t('copy')}
                           </>
                         ) : (
                           <>
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                             </svg>
                             {t('copy')}
                           </>
                         )}
                       </button>
                    </div>
                 </div>
              </div>

              {/* Right: Table (2 cols) */}
              <div className="lg:col-span-2">
                 <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
                    <div className="border-b border-white/5 bg-white/5 px-6 py-4">
                       <h2 className="text-lg font-semibold text-white">{t('users_list')}</h2>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-start text-sm">
                          <thead className="bg-white/5 text-white/60">
                             <tr>
                                <th className="px-6 py-4 font-medium text-start">{t('user')}</th>
                                <th className="px-6 py-4 font-medium text-start">{t('date')}</th>
                                <th className="px-6 py-4 font-medium text-start">{t('status')}</th>
                                <th className="px-6 py-4 font-medium text-start">{t('earning')}</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                             {referrals.map((ref) => (
                                <tr key={ref.id} className="hover:bg-white/5 transition-colors">
                                   <td className="px-6 py-4 font-medium text-white">{ref.user}</td>
                                   <td className="px-6 py-4 text-white/60">{ref.date}</td>
                                   <td className="px-6 py-4">
                                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                         ref.status === 'Active' 
                                            ? 'bg-emerald-500/10 text-emerald-400' 
                                            : 'bg-amber-500/10 text-amber-400'
                                      }`}>
                                         {ref.status === 'Active' ? t('status_active') : t('status_pending')}
                                      </span>
                                   </td>
                                   <td className="px-6 py-4 font-bold text-emerald-400">{ref.earning}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}
