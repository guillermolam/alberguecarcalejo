import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '@/lib/i18n';

interface I18nContextType {
  t: (key: string, params?: Record<string, any>) => string;
  language: string;
  setLanguage: (lang: string) => void;
  supportedLanguages: string[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('es'); // Default to Spanish
  const supportedLanguages = ['es', 'en', 'ca', 'gl', 'val', 'zh'];

  const t = (key: string, params?: Record<string, any>) => {
    return i18n.t(key, params, language);
  };

  const handleSetLanguage = (lang: string) => {
    if (supportedLanguages.includes(lang)) {
      setLanguage(lang);
      localStorage.setItem('preferred-language', lang);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('preferred-language');
    if (saved && supportedLanguages.includes(saved)) {
      setLanguage(saved);
    }
  }, []);

  return (
    <I18nContext.Provider value={{ t, language, setLanguage: handleSetLanguage, supportedLanguages }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};