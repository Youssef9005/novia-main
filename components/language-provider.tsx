"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>('en');
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    // Get saved language from localStorage or default to 'en'
    const savedLanguage = (localStorage.getItem('language') as Language) || 'en';
    setLanguageState(savedLanguage);
    i18n.changeLanguage(savedLanguage);
    setIsRTL(savedLanguage === 'ar');
    
    // Set document direction and language
    document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLanguage;
  }, [i18n]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    setIsRTL(lang === 'ar');
    
    // Update document direction and language
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
