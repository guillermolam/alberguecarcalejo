import React, { createContext, useContext, useState } from 'react';

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations = {
  es: {
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.save': 'Guardar',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    
    // Navigation
    'nav.home': 'Inicio',
    'nav.booking': 'Reservas',
    'nav.admin': 'Administración',
    'nav.info': 'Información',
    
    // Booking form
    'booking.title': 'Reserva tu estancia',
    'booking.personal_info': 'Información personal',
    'booking.contact_info': 'Información de contacto',
    'booking.stay_details': 'Detalles de la estancia',
    'booking.payment': 'Pago',
    
    // Form fields
    'form.first_name': 'Nombre',
    'form.last_name': 'Apellidos',
    'form.email': 'Email',
    'form.phone': 'Teléfono',
    'form.birth_date': 'Fecha de nacimiento',
    'form.nationality': 'Nacionalidad',
    'form.document_type': 'Tipo de documento',
    'form.document_number': 'Número de documento',
    'form.check_in': 'Fecha de entrada',
    'form.check_out': 'Fecha de salida',
    'form.arrival_time': 'Hora de llegada',
    
    // Bed selection
    'beds.select': 'Seleccionar cama',
    'beds.available': 'Disponible',
    'beds.occupied': 'Ocupada',
    'beds.reserved': 'Reservada',
    'beds.maintenance': 'Mantenimiento',
    
    // Document capture
    'documents.front': 'Anverso del documento',
    'documents.back': 'Reverso del documento',
    'documents.upload': 'Subir imagen',
    'documents.drag_drop': 'Arrastra la imagen aquí',
    'documents.processing': 'Procesando...',
    
    // Messages
    'messages.booking_confirmed': 'Reserva confirmada',
    'messages.booking_error': 'Error al procesar la reserva',
    'messages.required_field': 'Este campo es obligatorio',
    'messages.invalid_email': 'Email inválido',
    'messages.invalid_phone': 'Teléfono inválido',
  },
  en: {
    // English translations (fallback)
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'nav.home': 'Home',
    'nav.booking': 'Booking',
    'nav.admin': 'Admin',
    'nav.info': 'Information',
    'booking.title': 'Book your stay',
  }
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<string>('es');

  const t = (key: string, fallback?: string): string => {
    const langTranslations = translations[language as keyof typeof translations] || translations.es;
    return langTranslations[key as keyof typeof langTranslations] || fallback || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      <div data-testid="i18n-provider">
        {children}
      </div>
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