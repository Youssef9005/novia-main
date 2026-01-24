'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect, use } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { toast } from 'sonner';

export default function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const locale = useLocale();
  const { verifyEmail } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        await verifyEmail(token);
        setSuccess(true);
        toast.success('Email verified successfully');
      } catch {
        toast.error('Verification failed. Link might be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#010203] relative overflow-hidden px-4">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-sky-500/10 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl text-center">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-8">
               <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-sky-400 mb-4" />
               <h3 className="text-lg font-medium text-white">Verifying your email...</h3>
             </div>
          ) : success ? (
            <div className="py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-6">
                <svg className="h-8 w-8 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Email Verified!</h3>
              <p className="text-white/60 mb-8">
                Your email has been successfully verified. You can now access all features.
              </p>
              <Link
                href={`/${locale}/login`}
                className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 px-4 py-3 text-sm font-bold text-[#010203] shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)]"
              >
                Continue to Login
              </Link>
            </div>
          ) : (
            <div className="py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-6">
                <svg className="h-8 w-8 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Verification Failed</h3>
              <p className="text-white/60 mb-8">
                The verification link is invalid or has expired. Please try requesting a new one.
              </p>
              <Link
                href={`/${locale}/login`}
                className="inline-flex w-full justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
