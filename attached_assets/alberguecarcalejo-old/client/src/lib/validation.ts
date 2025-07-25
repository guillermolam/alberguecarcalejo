import { z } from 'zod';

// BFF validation API calls
async function validateDocumentAPI(documentType: string, documentNumber: string): Promise<{
  isValid: boolean;
  errorMessage?: string;
  normalizedNumber?: string;
}> {
  try {
    const response = await fetch('/api/bff/registration/validate/document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentType, documentNumber })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { isValid: false, errorMessage: 'Too many validation attempts. Please try again later.' };
      }
      throw new Error('Validation service error');
    }

    const bffResponse = await response.json();
    if (!bffResponse.success) {
      return { isValid: false, errorMessage: bffResponse.error };
    }

    return {
      isValid: bffResponse.data.is_valid,
      normalizedNumber: bffResponse.data.normalized_number,
      errorMessage: bffResponse.data.error_message
    };
  } catch (error) {
    console.error('Document validation error:', error);
    return { isValid: false, errorMessage: 'Validation service temporarily unavailable' };
  }
}

async function validateEmailAPI(email: string): Promise<{
  isValid: boolean;
  normalizedEmail?: string;
}> {
  try {
    const response = await fetch('/api/bff/registration/validate/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) throw new Error('Email validation error');

    const bffResponse = await response.json();
    if (!bffResponse.success) {
      return { isValid: false };
    }

    return {
      isValid: bffResponse.data.is_valid,
      normalizedEmail: bffResponse.data.normalized_email
    };
  } catch (error) {
    console.error('Email validation error:', error);
    return { isValid: false };
  }
}

async function validatePhoneAPI(phone: string, countryCode: string): Promise<{
  isValid: boolean;
  normalizedPhone?: string;
}> {
  try {
    const response = await fetch('/api/bff/registration/validate/phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, countryCode })
    });

    if (!response.ok) throw new Error('Phone validation error');

    const bffResponse = await response.json();
    if (!bffResponse.success) {
      return { isValid: false };
    }

    return {
      isValid: bffResponse.data.is_valid,
      normalizedPhone: bffResponse.data.normalized_phone
    };
  } catch (error) {
    console.error('Phone validation error:', error);
    return { isValid: false };
  }
}

// Enhanced email validation using backend API - MANDATORY FIELD
const emailSchema = z.string()
  .min(1, 'Email is required')
  .max(100, 'Email must be less than 100 characters')
  .email('Please enter a valid email address')
  .refine(async (email) => {
    if (!email) return false;
    const result = await validateEmailAPI(email);
    return result.isValid;
  }, 'Please enter a valid email address');

// Phone validation with country code using backend API
export const createPhoneSchema = (countryCode?: string) => {
  return z.string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters')
    .refine(async (phone) => {
      if (!phone || !countryCode) return true;
      const result = await validatePhoneAPI(phone, countryCode);
      return result.isValid;
    }, `Please enter a valid phone number${countryCode ? ` for ${countryCode}` : ''}`);
};

// Document validation using backend API
export const createDocumentSchema = (documentType: string) => {
  return z.string()
    .min(1, 'Document number is required')
    .max(20, 'Document number must be less than 20 characters')
    .refine(async (docNumber) => {
      if (!docNumber || !documentType) return true;
      const result = await validateDocumentAPI(documentType, docNumber);
      return result.isValid;
    }, `Please enter a valid ${documentType} number`);
};

// Rest of validation schemas remain the same...
export const birthDateSchema = z.string()
  .min(1, 'Birth date is required')
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age >= 1 && age <= 150;
    }

    return age >= 1 && age <= 150;
  }, 'Age must be between 1 and 150 years');

export const nameSchema = z.string()
  .min(1, 'This field is required')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-ZÀ-ÿĀ-žА-я\s\-'\.]+$/, 'Only letters, spaces, hyphens, apostrophes and dots allowed');

export const addressSchema = z.string()
  .min(1, 'Address is required')
  .max(100, 'Address must be less than 100 characters')
  .regex(/^[a-zA-Z0-9À-ÿĀ-žА-я\s\-,\.#\/]+$/, 'Invalid address format');

export const citySchema = z.string()
  .min(1, 'City is required')
  .max(50, 'City must be less than 50 characters')
  .regex(/^[a-zA-ZÀ-ÿĀ-žА-я\s\-'\.]+$/, 'Only letters, spaces, hyphens, apostrophes and dots allowed');

export const postalCodeSchema = z.string()
  .min(1, 'Postal code is required')
  .max(10, 'Postal code must be less than 10 characters')
  .regex(/^[a-zA-Z0-9\s\-]+$/, 'Invalid postal code format');

export const getCountryCode = (countryName: string): string => {
  const countryMap: Record<string, string> = {
    'España': 'ESP',
    'Spain': 'ESP',
    'Francia': 'FRA',
    'France': 'FRA',
    'Alemania': 'DEU',
    'Germany': 'DEU',
    'Italia': 'ITA',
    'Italy': 'ITA',
    'Portugal': 'PRT',
    'Estados Unidos': 'USA',
    'United States': 'USA',
    'Reino Unido': 'GBR',
    'United Kingdom': 'GBR'
  };

  return countryMap[countryName] || 'ESP';
}

export const getCountryDialCode = (countryCode: string): string => {
  const dialCodes: Record<string, string> = {
    'ESP': '+34',
    'FRA': '+33',
    'DEU': '+49',
    'ITA': '+39',
    'PRT': '+351',
    'GBR': '+44',
    'USA': '+1',
    'CAN': '+1',
    'BRA': '+55',
    'AUS': '+61',
    'JPN': '+81',
    'KOR': '+82',
    'NLD': '+31',
    'POL': '+48'
  };

  return dialCodes[countryCode] || '+34';
}

export function validatePhoneForCountry(phone: string, countryCode: string): boolean {
  if (!phone) return false;

  // Remove all non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, '');

  switch (countryCode) {
    case 'ESP':
      // Spanish phone: 9 digits starting with 6, 7, 8, or 9
      return /^[6789]\d{8}$/.test(cleanPhone) || /^34[6789]\d{8}$/.test(cleanPhone);

    case 'FRA':
      // French phone: 10 digits starting with 0, or with country code 33
      return /^0[1-9]\d{8}$/.test(cleanPhone) || /^33[1-9]\d{8}$/.test(cleanPhone);

    case 'DEU':
      // German phone: variable length but typically 10-12 digits
      return /^0\d{9,11}$/.test(cleanPhone) || /^49\d{10,12}$/.test(cleanPhone);

    case 'ITA':
      // Italian phone: typically 10 digits
      return /^3\d{9}$/.test(cleanPhone) || /^39\d{9,10}$/.test(cleanPhone);

    case 'PRT':
      // Portuguese phone: 9 digits starting with 9
      return /^9\d{8}$/.test(cleanPhone) || /^351\d{9}$/.test(cleanPhone);

    case 'GBR':
      // UK phone: 10-11 digits
      return /^0\d{9,10}$/.test(cleanPhone) || /^44\d{10,11}$/.test(cleanPhone);

    case 'USA':
      // US phone: 10 digits
      return /^\d{10}$/.test(cleanPhone) || /^1\d{10}$/.test(cleanPhone);

    default:
      // Generic validation: 7-15 digits
      return /^\d{7,15}$/.test(cleanPhone);
  }
};

export const createRegistrationSchema = (documentType?: string, countryCode?: string) => {
  return z.object({
    firstName: nameSchema,
    lastName1: nameSchema,
    lastName2: nameSchema.optional().or(z.literal('')),
    birthDate: birthDateSchema,
    documentType: z.string().min(1, 'Document type is required'),
    documentNumber: documentType ? createDocumentSchema(documentType) : z.string().min(1, 'Document number is required'),
    gender: z.string().min(1, 'Gender is required'),
    nationality: z.string().length(3).optional().or(z.literal('')),
    addressCountry: z.string().min(1, 'Country is required'),
    addressStreet: addressSchema,
    addressStreet2: z.string().max(100, 'Additional address must be less than 100 characters').optional().or(z.literal('')),
    addressCity: citySchema,
    addressPostalCode: postalCodeSchema,
    addressMunicipalityCode: z.string().max(10, 'Municipality code must be less than 10 characters').optional().or(z.literal('')),
    phone: z.string().min(1, 'Phone number is required').refine((phone) => {
      // Local phone validation (without country code)
      return phone.length >= 6 && phone.length <= 12 && /^\d+$/.test(phone);
    }, "Invalid local phone number format"),
    email: emailSchema,
    paymentType: z.string().min(1, 'Payment type is required'),
    language: z.string().default('es'),
    documentSupport: z.string().max(9).optional().or(z.literal(''))
  });
};

export type RegistrationFormData = z.infer<ReturnType<typeof createRegistrationSchema>>;