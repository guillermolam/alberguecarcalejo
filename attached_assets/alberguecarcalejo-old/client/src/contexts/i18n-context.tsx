
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { i18n as i18nInstance } from '@/lib/i18n';
import { LANGUAGES } from '@/lib/constants';

interface I18nContextType {
  language: string;
  t: (key: string, variables?: Record<string, string | number>) => string;
  setLanguage: (language: string) => void;
  formatDate: (date: Date | string, style?: 'short' | 'long' | 'medium') => string;
  formatDateTime: (date: Date | string) => string;
  getLocalizedLanguageName: (langCode: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(i18nInstance.getLanguage());

  const setLanguage = (newLanguage: string) => {
    i18nInstance.setLanguage(newLanguage);
    setLanguageState(newLanguage);
  };

  const t = (key: string, variables?: Record<string, string | number>) => {
    return i18nInstance.t(key, variables);
  };

  const formatDate = (date: Date | string, style: 'short' | 'long' | 'medium' = 'medium') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const locale = language === 'es' ? 'es-ES' : 
                   language === 'en' ? 'en-GB' : 
                   language === 'de' ? 'de-DE' :
                   language === 'fr' ? 'fr-FR' :
                   language === 'eu' ? 'eu-ES' :
                   language === 'ja' ? 'ja-JP' :
                   'es-ES';

    const options: Intl.DateTimeFormatOptions = style === 'short' 
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : style === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' };

    return dateObj.toLocaleDateString(locale, options);
  };

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const locale = language === 'es' ? 'es-ES' : 
                   language === 'en' ? 'en-GB' : 
                   language === 'de' ? 'de-DE' :
                   language === 'fr' ? 'fr-FR' :
                   language === 'eu' ? 'eu-ES' :
                   language === 'ja' ? 'ja-JP' :
                   'es-ES';

    return dateObj.toLocaleString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLocalizedLanguageName = (langCode: string) => {
    const lang = LANGUAGES.find(l => l.code === langCode);
    return lang?.name || langCode;
  };

  // Load preferred language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && LANGUAGES.find(l => l.code === savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const value = {
    language,
    t,
    setLanguage,
    formatDate,
    formatDateTime,
    getLocalizedLanguageName
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
