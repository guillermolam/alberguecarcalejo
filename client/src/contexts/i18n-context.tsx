import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'es' | 'en' | 'fr' | 'de' | 'pt';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Basic translations
const translations: Record<Language, Record<string, string>> = {
  es: {
    'welcome': 'Bienvenido',
    'booking': 'Reserva',
    'admin': 'Administración',
    'name': 'Nombre',
    'email': 'Email',
    'checkin': 'Entrada',
    'checkout': 'Salida',
    'submit': 'Enviar',
    'cancel': 'Cancelar',
    'save': 'Guardar',
    'loading': 'Cargando...',
  },
  en: {
    'welcome': 'Welcome',
    'booking': 'Booking',
    'admin': 'Administration',
    'name': 'Name',
    'email': 'Email',
    'checkin': 'Check-in',
    'checkout': 'Check-out',
    'submit': 'Submit',
    'cancel': 'Cancel',
    'save': 'Save',
    'loading': 'Loading...',
  },
  fr: {
    'welcome': 'Bienvenue',
    'booking': 'Réservation',
    'admin': 'Administration',
    'name': 'Nom',
    'email': 'Email',
    'checkin': 'Arrivée',
    'checkout': 'Départ',
    'submit': 'Soumettre',
    'cancel': 'Annuler',
    'save': 'Sauvegarder',
    'loading': 'Chargement...',
  },
  de: {
    'welcome': 'Willkommen',
    'booking': 'Buchung',
    'admin': 'Verwaltung',
    'name': 'Name',
    'email': 'Email',
    'checkin': 'Check-in',
    'checkout': 'Check-out',
    'submit': 'Senden',
    'cancel': 'Abbrechen',
    'save': 'Speichern',
    'loading': 'Laden...',
  },
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