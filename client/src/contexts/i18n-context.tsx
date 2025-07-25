import React, { createContext, useContext, useState, ReactNode } from 'react';
import i18n from '@/lib/i18n';

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState('es');

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    i18n.setLanguage(lang);
  };

  const t = (key: string) => {
    return i18n.t(key);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
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