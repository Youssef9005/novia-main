import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';

const resources = {
  en: {
    translation: enMessages,
  },
  ar: {
    translation: arMessages,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
