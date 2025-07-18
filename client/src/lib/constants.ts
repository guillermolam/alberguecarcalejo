export const LANGUAGES = [
  { code: 'es', name: 'Español', flag: 'https://flagcdn.com/16x12/es.png', flagAlt: 'ES' },
  { code: 'en', name: 'English', flag: 'https://flagcdn.com/16x12/gb.png', flagAlt: 'GB' },
  { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/16x12/fr.png', flagAlt: 'FR' },
  { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/16x12/de.png', flagAlt: 'DE' },
  { code: 'it', name: 'Italiano', flag: 'https://flagcdn.com/16x12/it.png', flagAlt: 'IT' },
  { code: 'pt', name: 'Português', flag: 'https://flagcdn.com/16x12/pt.png', flagAlt: 'PT' },
  { code: 'nl', name: 'Nederlands', flag: 'https://flagcdn.com/16x12/nl.png', flagAlt: 'NL' },
  { code: 'ko', name: '한국어', flag: 'https://flagcdn.com/16x12/kr.png', flagAlt: 'KR' },
  { code: 'ja', name: '日本語', flag: 'https://flagcdn.com/16x12/jp.png', flagAlt: 'JP' },
  { code: 'pl', name: 'Polski', flag: 'https://flagcdn.com/16x12/pl.png', flagAlt: 'PL' },
];

export const COUNTRIES = [
  { code: 'ESP', name: 'España', flag: '🇪🇸' },
  { code: 'FRA', name: 'Francia', flag: '🇫🇷' },
  { code: 'DEU', name: 'Alemania', flag: '🇩🇪' },
  { code: 'ITA', name: 'Italia', flag: '🇮🇹' },
  { code: 'PRT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'KOR', name: 'Corea del Sur', flag: '🇰🇷' },
  { code: 'JPN', name: 'Japón', flag: '🇯🇵' },
  { code: 'GBR', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'NLD', name: 'Países Bajos', flag: '🇳🇱' },
  { code: 'POL', name: 'Polonia', flag: '🇵🇱' },
  { code: 'CAN', name: 'Canadá', flag: '🇨🇦' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { code: 'BRA', name: 'Brasil', flag: '🇧🇷' },
];

export const DOCUMENT_TYPES = [
  { value: 'NIF', label: 'documents.dni' },
  { value: 'NIE', label: 'documents.nie' },
  { value: 'PAS', label: 'documents.passport' },
  { value: 'OTRO', label: 'documents.other' },
];

export const PAYMENT_TYPES = [
  { 
    value: 'efect', 
    label: 'payment.cash',
    icon: 'money-bill'
  },
  { 
    value: 'tarjt', 
    label: 'payment.card',
    icon: 'credit-card'
  },
  { 
    value: 'bizum', 
    label: 'payment.bizum',
    icon: 'mobile'
  },
  { 
    value: 'trans', 
    label: 'payment.transfer',
    icon: 'university'
  },
];

export const GENDER_OPTIONS = [
  { value: 'M', label: 'registration.gender_male' },
  { value: 'F', label: 'registration.gender_female' },
  { value: 'O', label: 'registration.gender_other' },
];

export const PRICE_PER_NIGHT = 15;
export const CURRENCY = 'EUR';
export const MAX_NIGHTS = 30;
export const TOTAL_BEDS = 24;
