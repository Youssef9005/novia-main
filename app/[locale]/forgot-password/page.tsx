'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const { forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#010203] relative overflow-hidden px-4">
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
              {t('forgot_password')}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Check your email</h3>
              <p className="mt-2 text-sm text-white/60">
                We have sent a password reset link to your email address.
              </p>
              <div className="mt-6">
                <Link href={`/${locale}/login`} className="font-semibold text-sky-400 hover:text-sky-300 transition-colors">
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 px-4 py-3 text-sm font-bold text-[#010203] shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          {!sent && (
            <div className="mt-6 text-center text-sm">
              <Link href={`/${locale}/login`} className="font-semibold text-sky-400 hover:text-sky-300 transition-colors">
                ← Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
