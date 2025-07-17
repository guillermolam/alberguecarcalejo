// BFF Client for secure validation (fallback without WASM for now)
let rateLimits: Record<string, { count: number; resetTime: number }> = {};

// Fallback rate limiting without WASM
function checkRateLimit(clientId: string, action: string): boolean {
  const key = `${clientId}:${action}`;
  const now = Date.now();
  
  const limits = {
    'document_validation': { max: 10, windowMs: 5 * 60 * 1000 },
    'registration': { max: 3, windowMs: 60 * 60 * 1000 },
    'ocr': { max: 5, windowMs: 10 * 60 * 1000 }
  };
  
  const limit = limits[action as keyof typeof limits] || { max: 10, windowMs: 5 * 60 * 1000 };
  
  if (!rateLimits[key] || now > rateLimits[key].resetTime) {
    rateLimits[key] = { count: 1, resetTime: now + limit.windowMs };
    return true;
  }
  
  if (rateLimits[key].count >= limit.max) {
    return false;
  }
  
  rateLimits[key].count++;
  return true;
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
    const clientId = getClientFingerprint();
    
    if (!checkRateLimit(clientId, 'document_validation')) {
      return {
        isValid: false,
        errorMessage: 'Rate limit exceeded. Please try again later.',
        rateLimitExceeded: true
      };
    }
    
    // Use backend validation endpoint
    const response = await fetch('/api/validate/document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentType, documentNumber })
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        return { isValid: false, errorMessage: 'Rate limit exceeded', rateLimitExceeded: true };
      }
      throw new Error('Validation service error');
    }
    
    return await response.json();
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
    const clientId = getClientFingerprint();
    return checkRateLimit(clientId, 'ocr');
  } catch (error) {
    console.error('BFF OCR rate limit check error:', error);
    return false;
  }
}