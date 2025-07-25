// Basic i18n implementation
export interface Translations {
  nav: {
    title: string;
    admin: string;
  };
  hero: {
    welcome: string;
    subtitle: string;
    beds_available: string;
    price_per_night: string;
  };
  stay: {
    continue: string;
  };
  notifications: {
    success: string;
  };
  loading: {
    submitting: string;
  };
}

export const translations: Record<string, Translations> = {
  es: {
    nav: {
      title: "Albergue del Carrascalejo",
      admin: "Admin"
    },
    hero: {
      welcome: "Bienvenido al Albergue del Carrascalejo",
      subtitle: "Tu refugio en la Vía de la Plata",
      beds_available: "camas disponibles",
      price_per_night: "por noche"
    },
    stay: {
      continue: "Nueva Reserva"
    },
    notifications: {
      success: "¡Registro completado con éxito!"
    },
    loading: {
      submitting: "Enviando información..."
    }
  },
  en: {
    nav: {
      title: "Albergue del Carrascalejo",
      admin: "Admin"
    },
    hero: {
      welcome: "Welcome to Albergue del Carrascalejo",
      subtitle: "Your refuge on the Vía de la Plata",
      beds_available: "beds available",
      price_per_night: "per night"
    },
    stay: {
      continue: "New Booking"
    },
    notifications: {
      success: "Registration completed successfully!"
    },
    loading: {
      submitting: "Submitting information..."
    }
  }
};

class I18n {
  private currentLanguage = 'es';

  setLanguage(lang: string) {
    this.currentLanguage = lang;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  t(key: string): string {
    const keys = key.split('.');
    let current: any = translations[this.currentLanguage];
    
    for (const k of keys) {
      current = current?.[k];
    }
    
    return current || key;
  }
}

export default new I18n();