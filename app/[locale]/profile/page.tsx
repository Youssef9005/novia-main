"use client";

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import Link from 'next/link';

interface SubscriptionState {
  status: string;
  plan: string;
  expiryDate: string;
  paymentId: string;
  currencies: string[];
}

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user, updateProfile, changePassword } = useAuth();

  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    wallet: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      if (user.subscription && user.subscription.status === 'active') {
        const sub = user.subscription;
        
        let planName = 'Unknown Plan';
        if (typeof sub.plan === 'string') {
             // Capitalize first letter
             planName = sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1);
        } else if (sub.plan && typeof sub.plan === 'object' && 'title' in sub.plan) {
             // @ts-ignore
             planName = sub.plan.title;
        }

        setSubscription({
          status: sub.status || 'inactive',
          plan: planName,
          expiryDate: sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A',
          // @ts-ignore
          paymentId: sub._id || '',
          currencies: user.selectedAssets || []
        });
      } else {
        setSubscription(null);
      }
      setLoadingSubscription(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const newName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.name || '';
      const newEmail = user.email || '';
      const newPhone = user.phone || '';
      const newWallet = user.wallet || '';

      setFormData(prev => {
        if (
          prev.name === newName &&
          prev.email === newEmail &&
          prev.phone === newPhone &&
          prev.wallet === newWallet
        ) {
          return prev;
        }
        return {
          ...prev,
          name: newName,
          email: newEmail,
          phone: newPhone,
          wallet: newWallet
        };
      });
    }
  }, [user]);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      const dataToUpdate = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        wallet: formData.wallet
      };
      await updateProfile(dataToUpdate);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (!formData.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      toast.success('Password changed successfully');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch {
      toast.error('Failed to change password');
    }
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
        <div className="relative -mt-24 mb-12 flex flex-col items-center sm:items-start sm:flex-row sm:gap-8">
          
          {/* 2. Avatar Section */}
          <div className="relative group">
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-[#010203] bg-[#0a0a0a] shadow-2xl sm:h-40 sm:w-40">
               <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/20 to-sky-500/20 text-4xl font-bold text-white/40">
                  {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                  {user?.lastName ? user.lastName.charAt(0).toUpperCase() : ''}
               </div>
            </div>
            <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 border-[#010203] bg-emerald-500" />
          </div>

          {/* 3. User Info Header */}
          <div className="mt-4 flex-1 text-center sm:mt-24 sm:text-start">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">{formData.name}</h1>
                <p className="text-white/60">{formData.email}</p>
                <div className="mt-2 flex items-center justify-center gap-2 text-sm text-white/40 sm:justify-start">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                    {t('membership_plan_name')}
                  </span>
                  <span>{t('joined')} {t('joined_date_mock')}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-3 sm:mt-0">
                <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  {t('remove_photo')}
                </button>
                <button className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
                  {t('upload_photo')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Main Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* LEFT COLUMN: Settings */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Personal Info Card */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
              <div className="border-b border-white/5 bg-white/5 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">{t('personal_info')}</h2>
              </div>
              <div className="p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white/60">{t('name')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className={`h-5 w-5 text-white/20 ${isRtl ? 'mr-3' : 'ml-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`block w-full rounded-xl border border-white/10 bg-black/40 py-3 text-white placeholder-white/20 focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 sm:text-sm ${isRtl ? 'pr-10' : 'pl-10'}`}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white/60">{t('email')}</label>
                    <div className="relative">
                      <div className={`absolute inset-y-0 flex items-center pointer-events-none ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'}`}>
                         <svg className="h-5 w-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                         </svg>
                      </div>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`block w-full rounded-xl border border-white/10 bg-black/40 py-3 text-white placeholder-white/20 focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 sm:text-sm ${isRtl ? 'pr-10' : 'pl-10'}`}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white/60">{t('phone')}</label>
                    <div className="relative">
                      <div className={`absolute inset-y-0 flex items-center pointer-events-none ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'}`}>
                         <svg className="h-5 w-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                         </svg>
                      </div>
                      <input 
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`block w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white placeholder-white/20 focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 sm:text-sm ${isRtl ? 'pr-10' : 'pl-10'}`}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white/60">{t('wallet_address')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                         <svg className={`h-5 w-5 text-white/20 ${isRtl ? 'mr-3' : 'ml-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                         </svg>
                      </div>
                      <input 
                        type="text" 
                        name="wallet"
                        value={formData.wallet}
                        onChange={handleInputChange}
                        className={`block w-full rounded-xl border border-white/10 bg-black/40 py-3 font-mono text-white placeholder-white/20 focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 sm:text-sm ${isRtl ? 'pr-10' : 'pl-10'}`}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                   <button 
                    onClick={handleSaveProfile}
                    className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
                   >
                     {t('save_changes')}
                   </button>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
              <div className="border-b border-white/5 bg-white/5 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">{t('security')}</h2>
              </div>
              <div className="p-6">
                 <div className="grid gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                       <label className="mb-2 block text-sm font-medium text-white/60">{t('current_password')}</label>
                       <div className="relative">
                          <input 
                            type={showCurrentPassword ? "text" : "password"}
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            className="block w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-white/20 focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className={`absolute top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white/80 transition-colors ${isRtl ? 'left-2' : 'right-2'}`}
                          >
                            {showCurrentPassword ? (
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                          </button>
                       </div>
                    </div>
                    <div>
                       <label className="mb-2 block text-sm font-medium text-white/60">{t('new_password')}</label>
                       <div className="relative">
                          <input 
                            type={showNewPassword ? "text" : "password"}
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            className="block w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-white/20 focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className={`absolute top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white/80 transition-colors ${isRtl ? 'left-2' : 'right-2'}`}
                          >
                            {showNewPassword ? (
                               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                          </button>
                       </div>
                    </div>
                    <div>
                       <label className="mb-2 block text-sm font-medium text-white/60">{t('confirm_new_password')}</label>
                       <input 
                         type="password" 
                         name="confirmPassword"
                         value={formData.confirmPassword}
                         onChange={handleInputChange}
                         className="block w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-white/20 focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 sm:text-sm"
                       />
                    </div>
                 </div>
                 <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleChangePassword}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-2.5 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20"
                    >
                      {t('change_password')}
                    </button>
                 </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Status */}
          <div className="space-y-6">
            
            {/* Subscription Card */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
              <div className="border-b border-white/5 bg-white/5 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">{t('subscription')}</h2>
              </div>
              <div className="p-6">
                {loadingSubscription ? (
                  <div className="text-center text-white/60">Loading subscription...</div>
                ) : subscription ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div>
                        <p className="text-sm font-medium text-emerald-400">{t('current_plan')}</p>
                        <h3 className="text-xl font-bold text-white">{subscription.plan}</h3>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
                        {subscription.status}
                      </span>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-sm text-white/40">{t('expiry_date')}</p>
                        <p className="font-medium text-white">{subscription.expiryDate}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-sm text-white/40">{t('payment_id')}</p>
                        <p className="font-mono font-medium text-white">{subscription.paymentId}</p>
                      </div>
                    </div>

                    {subscription.currencies && subscription.currencies.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm text-white/40">{t('active_currencies')}</p>
                        <div className="flex flex-wrap gap-2">
                          {subscription.currencies.map((currency: string) => (
                            <span key={currency} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white">
                              {currency}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-white/60 mb-4">No active subscription found.</p>
                    <Link href={`/${locale}/payment`} className="inline-block rounded-xl bg-emerald-500 px-6 py-2 text-sm font-bold text-black hover:bg-emerald-400">
                      View Plans
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
