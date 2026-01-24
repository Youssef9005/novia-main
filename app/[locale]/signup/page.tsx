'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SignupPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const { signup } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirm_password = formData.get('confirm_password') as string;
    const phone = formData.get('phone') as string;
    const referral = formData.get('referral') as string;

    if (password !== confirm_password) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    const [firstName, ...lastNameParts] = name.trim().split(' ');
    const lastName = lastNameParts.join(' ');

    const data = {
      firstName,
      lastName: lastName || firstName, // Fallback if single name
      email,
      password,
      passwordConfirm: confirm_password,
      phone,
      referralCode: referral
    };

    try {
      await signup(data);
      toast.success('Account created successfully');
      router.push(`/${locale}/chart`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#010203] relative overflow-hidden px-4 py-12">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-sky-500/10 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-300 to-emerald-400 text-xl font-bold tracking-wider text-[#010203] shadow-[0_0_20px_rgba(56,189,248,0.3)]">
              {t('brand_short')}
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
              {t('signup_title')}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {t('create_account_desc')}
            </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/80">
                {t('full_name')}
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white shadow-sm placeholder:text-white/20 focus:border-cyan-300/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-300/50 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80">
                {t('email')}
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white shadow-sm placeholder:text-white/20 focus:border-cyan-300/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-300/50 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white/80">
                {t('phone_number')}
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white shadow-sm placeholder:text-white/20 focus:border-cyan-300/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-300/50 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80">
                {t('password')}
              </label>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white shadow-sm placeholder:text-white/20 focus:border-cyan-300/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-300/50 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white/80 transition-colors ${locale === 'ar' ? 'left-2' : 'right-2'}`}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-white/80">
                {t('confirm_password')}
              </label>
              <div className="mt-2 relative">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white shadow-sm placeholder:text-white/20 focus:border-cyan-300/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-300/50 sm:text-sm"
                />
                 <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white/80 transition-colors ${locale === 'ar' ? 'left-2' : 'right-2'}`}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              {!showReferralInput ? (
                <button
                  type="button"
                  onClick={() => setShowReferralInput(true)}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('have_referral_code')}
                </button>
              ) : (
                <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                  <label htmlFor="referral" className="block text-sm font-medium text-white/80">
                    {t('referral_code')}
                  </label>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <input
                        id="referral"
                        name="referral"
                        type="text"
                        placeholder={t('referral_code_placeholder')}
                        className="block w-full rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-white shadow-sm placeholder:text-white/20 focus:border-emerald-500/50 focus:bg-emerald-500/10 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 sm:text-sm transition-all"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-emerald-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowReferralInput(false)}
                      className="flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 px-4 py-3 text-sm font-bold text-[#010203] shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : t('signup_button')}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-white/60">{t('already_have_account')}</span>{' '}
            <Link href={`/${locale}/login`} className="font-semibold text-sky-400 hover:text-sky-300 transition-colors">
              {t('login_button')}
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
           <Link href={`/${locale}`} className="text-sm text-white/40 hover:text-white/80 transition-colors">
              ← {t('back_to_home')}
           </Link>
        </div>
      </div>
    </div>
  );
}
