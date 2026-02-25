import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslations from './locales/en/translation.json';
import frTranslations from './locales/fr/translation.json';
import arTranslations from './locales/ar/translation.json';

const resources = {
  en: {
    translation: enTranslations
  },
  fr: {
    translation: frTranslations
  },
  ar: {
    translation: arTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: true, // Set to true for debugging
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const direction = i18n.dir(lng);
  console.log('🔤 Language changed to:', lng, 'Direction:', direction);
  
  // Set dir attribute on html element
  document.documentElement.setAttribute('dir', direction);
  document.documentElement.setAttribute('lang', lng);
  
  // Update localStorage
  localStorage.setItem('language', lng);
  localStorage.setItem('direction', direction);

  // Add/remove RTL class for any additional CSS
  if (direction === 'rtl') {
    document.documentElement.classList.add('rtl');
    document.documentElement.classList.remove('ltr');
  } else {
    document.documentElement.classList.add('ltr');
    document.documentElement.classList.remove('rtl');
  }
});

// Set initial direction
const initializeDirection = () => {
  const savedLang = localStorage.getItem('language');
  const initialLng = savedLang || 'en';
  const initialDir = initialLng === 'ar' ? 'rtl' : 'ltr';
  
  console.log('🚀 Initializing with:', { initialLng, initialDir });
  
  document.documentElement.setAttribute('dir', initialDir);
  document.documentElement.setAttribute('lang', initialLng);
  
  if (initialDir === 'rtl') {
    document.documentElement.classList.add('rtl');
    document.documentElement.classList.remove('ltr');
  } else {
    document.documentElement.classList.add('ltr');
    document.documentElement.classList.remove('rtl');
  }
  
  return initialLng;
};

initializeDirection();

export default i18n;