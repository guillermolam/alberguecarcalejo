import { validateDNI, validateNIE, validatePassport } from '../../client/src/lib/dni-validation';

export interface DocumentValidationResult {
  isValid: boolean;
  documentType: string;
  normalizedNumber?: string;
  errors?: string[];
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
}

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMITS = {
  DOCUMENT_VALIDATION: { maxAttempts: 10, windowMinutes: 5 },
  REGISTRATION: { maxAttempts: 3, windowMinutes: 60 },
  OCR_PROCESSING: { maxAttempts: 5, windowMinutes: 10 }
};

export function checkRateLimit(
  clientId: string, 
  action: keyof typeof RATE_LIMITS
): RateLimitResult {
  const key = `${clientId}:${action}`;
  const now = Date.now();
  const config = RATE_LIMITS[action];
  const windowMs = config.windowMinutes * 60 * 1000;
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    const newRecord = { count: 1, resetTime: now + windowMs };
    rateLimitStore.set(key, newRecord);
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - 1,
      resetTime: newRecord.resetTime
    };
  }
  
  if (record.count >= config.maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: record.resetTime
    };
  }
  
  record.count++;
  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - record.count,
    resetTime: record.resetTime
  };
}

export function validateDocumentNumber(
  documentType: string,
  documentNumber: string,
  clientId: string
): DocumentValidationResult {
  // Check rate limit first
  const rateLimit = checkRateLimit(clientId, 'DOCUMENT_VALIDATION');
  if (!rateLimit.allowed) {
    return {
      isValid: false,
      documentType,
      errors: ['Rate limit exceeded. Please try again later.']
    };
  }

  // Sanitize input
  const sanitizedType = documentType.toUpperCase().trim();
  const sanitizedNumber = documentNumber.toUpperCase().replace(/[-\s]/g, '');
  
  // Input validation
  if (!sanitizedType || !sanitizedNumber) {
    return {
      isValid: false,
      documentType: sanitizedType,
      errors: ['Document type and number are required']
    };
  }

  if (sanitizedNumber.length < 3 || sanitizedNumber.length > 20) {
    return {
      isValid: false,
      documentType: sanitizedType,
      errors: ['Document number must be between 3 and 20 characters']
    };
  }

  let isValid = false;
  const errors: string[] = [];

  try {
    switch (sanitizedType) {
      case 'NIF':
      case 'DNI':
        isValid = validateDNI(sanitizedNumber);
        if (!isValid) {
          errors.push('Invalid DNI/NIF format or check digit');
        }
        break;
        
      case 'NIE':
        isValid = validateNIE(sanitizedNumber);
        if (!isValid) {
          errors.push('Invalid NIE format or check digit');
        }
        break;
        
      case 'PAS':
      case 'PASSPORT':
        isValid = validatePassport(sanitizedNumber);
        if (!isValid) {
          errors.push('Invalid passport format');
        }
        break;
        
      case 'OTRO':
        // Basic validation for other documents
        isValid = /^[A-Z0-9]{3,20}$/.test(sanitizedNumber);
        if (!isValid) {
          errors.push('Document must contain only alphanumeric characters');
        }
        break;
        
      default:
        errors.push('Unsupported document type');
        break;
    }
  } catch (error) {
    console.error('Document validation error:', error);
    errors.push('Validation service temporarily unavailable');
  }

  return {
    isValid,
    documentType: sanitizedType,
    normalizedNumber: isValid ? sanitizedNumber : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 100;
}

export function validatePhoneNumber(phone: string, countryCode: string): boolean {
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  const patterns: Record<string, RegExp> = {
    'ESP': /^(\+34|0034|34)?[6789]\d{8}$/,
    'FRA': /^(\+33|0033|33)?[67]\d{8}$/,
    'DEU': /^(\+49|0049|49)?1[5-7]\d{8,9}$/,
    'ITA': /^(\+39|0039|39)?3\d{8,9}$/,
    'PRT': /^(\+351|00351|351)?9[1236]\d{7}$/,
    'USA': /^(\+1|001|1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/,
    'GBR': /^(\+44|0044|44)?7\d{9}$/,
  };
  
  const pattern = patterns[countryCode] || /^(\+\d{1,4})?[\s\-]?\d{7,15}$/;
  return pattern.test(cleanPhone);
}

export function validateBirthDate(birthDate: string): boolean {
  const date = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    return age >= 1 && age <= 150;
  }
  
  return age >= 1 && age <= 150;
}

// Security headers and input sanitization
export function sanitizeInput(input: string, maxLength: number = 100): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>'"&]/g, '') // Basic XSS prevention
    .replace(/\x00/g, ''); // Remove null bytes
}

export function getClientFingerprint(req: any): string {
  // Create a simple client fingerprint for rate limiting
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'unknown';
  return `${ip}:${userAgent.slice(0, 50)}`;
}