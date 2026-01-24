'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
      toast.success('Logged in successfully');
      router.push(`/${locale}/chart`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed. Please try again.');
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
              {t('welcome_back')}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {t('create_account_desc')}
            </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
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
              <label htmlFor="password" className="block text-sm font-medium text-white/80">
                {t('password')}
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white shadow-sm placeholder:text-white/20 focus:border-cyan-300/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-300/50 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link href={`/${locale}/forgot-password`} className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                  {t('forgot_password')}
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 px-4 py-3 text-sm font-bold text-[#010203] shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : t('login_button')}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-white/60">{t('no_account')}</span>{' '}
            <Link href={`/${locale}/signup`} className="font-semibold text-sky-400 hover:text-sky-300 transition-colors">
              {t('signup_button')}
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
