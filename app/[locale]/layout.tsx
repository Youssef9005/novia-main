import { Cairo } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from 'sonner';
import { AuthProvider } from '../../hooks/useAuth';

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'Metadata'});
 
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!['en', 'ar'].includes(locale)) {
    notFound();
  }
 
  // Providing all messages to the client
  const messages = await getMessages();
 
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body
        className={`${cairo.variable} antialiased bg-[#010203] text-white font-[family-name:var(--font-cairo)]`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Header />
            {children}
            <Footer />
            <Toaster />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}