// Simple i18n implementation
const translations: Record<string, Record<string, string>> = {
  es: {
    'welcome': 'Bienvenido al Albergue del Carrascalejo',
    'registration': 'Registro de Peregrino',
    'admin': 'Administración',
  },
  en: {
    'welcome': 'Welcome to Albergue del Carrascalejo',
    'registration': 'Pilgrim Registration',
    'admin': 'Administration',
  },
  ca: {
    'welcome': 'Benvingut a l\'Albergue del Carrascalejo',
    'registration': 'Registre de Pelegrí',
    'admin': 'Administració',
  },
  gl: {
    'welcome': 'Benvido ao Albergue del Carrascalejo',
    'registration': 'Rexistro de Peregrino',
    'admin': 'Administración',
  }
};

const i18n = {
  t: (key: string, params?: Record<string, any>, lang: string = 'es'): string => {
    const translation = translations[lang]?.[key] || translations['es'][key] || key;
    
    if (params) {
      return Object.keys(params).reduce((str, param) => {
        return str.replace(`{{${param}}}`, params[param]);
      }, translation);
    }
    
    return translation;
  }
};

export default i18n;