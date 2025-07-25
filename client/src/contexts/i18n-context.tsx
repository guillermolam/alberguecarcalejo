
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Spain's official languages (sorted A-Z within the official group)
const SPAIN_OFFICIAL_LANGUAGES = ['ca', 'eu', 'gl', 'es', 'val'] as const;

// All supported languages with their native names
export const LANGUAGES = [
  // Spain's official languages first (A-Z sorted)
  { code: 'ca', name: 'Català', nativeName: 'Català' },
  { code: 'eu', name: 'Euskera', nativeName: 'Euskera' },
  { code: 'gl', name: 'Galego', nativeName: 'Galego' },
  { code: 'es', name: 'Español', nativeName: 'Español' },
  { code: 'val', name: 'Valencià', nativeName: 'Valencià' },
  // Other languages (A-Z sorted)
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
] as const;

type Language = typeof LANGUAGES[number]['code'];

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  availableLanguages: typeof LANGUAGES;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Import all translation files
import { translations_es } from './i18n-es';
import { translations_en } from './i18n-en';
import { translations_de } from './i18n-de';
import { translations_eu } from './i18n-eu';
import { translations_fr } from './i18n-fr';
import { translations_ja } from './i18n-ja';
import { translations_ca } from './i18n-ca';
import { translations_gl } from './i18n-gl';
import { translations_val } from './i18n-val';
import { translations_zh } from './i18n-zh';

// Consolidated translations object
const translations: Record<Language, Record<string, string>> = {
  es: translations_es,
  en: translations_en,
  de: translations_de,
  eu: translations_eu,
  fr: translations_fr,
  ja: translations_ja,
  ca: translations_ca,
  gl: translations_gl,
  val: translations_val,
  zh: translations_zh,
  pt: {
    'welcome': 'Bem-vindo',
    'booking': 'Reserva',
    'admin': 'Administração',
    'name': 'Nome',
    'email': 'Email',
    'checkin': 'Check-in',
    'checkout': 'Check-out',
    'submit': 'Enviar',
    'cancel': 'Cancelar',
    'save': 'Salvar',
    'loading': 'Carregando...',
  },
};

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ 
  children, 
  defaultLanguage = 'es' 
}) => {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <I18nContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      availableLanguages: LANGUAGES 
    }}>
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
