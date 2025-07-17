// BFF Client for secure validation
import init, { ValidationBFF } from './wasm/validation_bff';

let bffInstance: ValidationBFF | null = null;

// Initialize the BFF WASM module
export async function initBFF(): Promise<ValidationBFF> {
  if (!bffInstance) {
    await init();
    bffInstance = new ValidationBFF();
  }
  return bffInstance;
}

// Generate client fingerprint for rate limiting
function getClientFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('BFF fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
}

// Validation functions that use the BFF
export async function validateDocument(
  documentType: string, 
  documentNumber: string
): Promise<{
  isValid: boolean;
  errorMessage?: string;
  normalizedNumber?: string;
  rateLimitExceeded?: boolean;
}> {
  try {
    const bff = await initBFF();
    const clientId = getClientFingerprint();
    const result = bff.validate_document(clientId, documentType, documentNumber);
    
    return {
      isValid: result.is_valid,
      errorMessage: result.error_message || undefined,
      normalizedNumber: result.normalized_number || undefined,
      rateLimitExceeded: result.rate_limit_exceeded
    };
  } catch (error) {
    console.error('BFF validation error:', error);
    return {
      isValid: false,
      errorMessage: 'Validation service temporarily unavailable'
    };
  }
}

export async function validateEmail(email: string): Promise<{
  isValid: boolean;
  errorMessage?: string;
  normalizedEmail?: string;
  rateLimitExceeded?: boolean;
}> {
  try {
    const bff = await initBFF();
    const clientId = getClientFingerprint();
    const result = bff.validate_email(clientId, email);
    
    return {
      isValid: result.is_valid,
      errorMessage: result.error_message || undefined,
      normalizedEmail: result.normalized_number || undefined,
      rateLimitExceeded: result.rate_limit_exceeded
    };
  } catch (error) {
    console.error('BFF email validation error:', error);
    return {
      isValid: false,
      errorMessage: 'Email validation service temporarily unavailable'
    };
  }
}

export async function validatePhone(
  phone: string, 
  countryCode: string
): Promise<{
  isValid: boolean;
  errorMessage?: string;
  normalizedPhone?: string;
  rateLimitExceeded?: boolean;
}> {
  try {
    const bff = await initBFF();
    const clientId = getClientFingerprint();
    const result = bff.validate_phone(clientId, phone, countryCode);
    
    return {
      isValid: result.is_valid,
      errorMessage: result.error_message || undefined,
      normalizedPhone: result.normalized_number || undefined,
      rateLimitExceeded: result.rate_limit_exceeded
    };
  } catch (error) {
    console.error('BFF phone validation error:', error);
    return {
      isValid: false,
      errorMessage: 'Phone validation service temporarily unavailable'
    };
  }
}

export async function checkRegistrationRateLimit(): Promise<boolean> {
  try {
    const bff = await initBFF();
    const clientId = getClientFingerprint();
    return bff.check_registration_rate_limit(clientId);
  } catch (error) {
    console.error('BFF rate limit check error:', error);
    return false;
  }
}

export async function checkOCRRateLimit(): Promise<boolean> {
  try {
    const bff = await initBFF();
    const clientId = getClientFingerprint();
    return bff.check_ocr_rate_limit(clientId);
  } catch (error) {
    console.error('BFF OCR rate limit check error:', error);
    return false;
  }
}