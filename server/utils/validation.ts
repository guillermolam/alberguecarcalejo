// Email validation utility
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone number validation utility
export function validatePhoneNumber(phone: string, countryCode?: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Basic validation - phone should be between 7-15 digits
  if (cleaned.length < 7 || cleaned.length > 15) {
    return false;
  }
  
  // Country-specific validation
  if (countryCode) {
    switch (countryCode) {
      case 'ES': // Spain
        return cleaned.length === 9 && (cleaned.startsWith('6') || cleaned.startsWith('7') || cleaned.startsWith('9'));
      case 'FR': // France
        return cleaned.length === 10 && cleaned.startsWith('0');
      case 'DE': // Germany
        return cleaned.length >= 10 && cleaned.length <= 12;
      case 'IT': // Italy
        return cleaned.length === 10 && cleaned.startsWith('3');
      case 'PT': // Portugal
        return cleaned.length === 9 && cleaned.startsWith('9');
      default:
        return true; // Generic validation for other countries
    }
  }
  
  return true;
}

// Input sanitization utility
export function sanitizeInput(input: string, maxLength: number): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters
  const sanitized = input
    .replace(/[<>\"'&]/g, '') // Remove HTML/XML characters
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .trim()
    .slice(0, maxLength);
  
  return sanitized;
}

// Document validation utility
export function validateDocumentNumber(documentType: string, documentNumber: string, clientId?: string): { valid: boolean; message: string } {
  const sanitized = sanitizeInput(documentNumber, 20);
  
  switch (documentType.toUpperCase()) {
    case 'DNI':
      return validateSpanishDNI(sanitized);
    case 'NIE':
      return validateSpanishNIE(sanitized);
    case 'PASSPORT':
      return validatePassport(sanitized);
    default:
      return { valid: false, message: 'Invalid document type' };
  }
}

// Spanish DNI validation
function validateSpanishDNI(dni: string): { valid: boolean; message: string } {
  const dniRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
  
  if (!dniRegex.test(dni)) {
    return { valid: false, message: 'DNI format is invalid' };
  }
  
  const numbers = dni.slice(0, 8);
  const letter = dni.slice(8, 9).toUpperCase();
  const validLetters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const expectedLetter = validLetters[parseInt(numbers) % 23];
  
  if (letter !== expectedLetter) {
    return { valid: false, message: 'DNI check digit is invalid' };
  }
  
  return { valid: true, message: 'DNI is valid' };
}

// Spanish NIE validation
function validateSpanishNIE(nie: string): { valid: boolean; message: string } {
  const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
  
  if (!nieRegex.test(nie)) {
    return { valid: false, message: 'NIE format is invalid' };
  }
  
  const firstLetter = nie.charAt(0).toUpperCase();
  let numbers = nie.slice(1, 8);
  
  // Convert first letter to number
  switch (firstLetter) {
    case 'X':
      numbers = '0' + numbers;
      break;
    case 'Y':
      numbers = '1' + numbers;
      break;
    case 'Z':
      numbers = '2' + numbers;
      break;
  }
  
  const letter = nie.slice(8, 9).toUpperCase();
  const validLetters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const expectedLetter = validLetters[parseInt(numbers) % 23];
  
  if (letter !== expectedLetter) {
    return { valid: false, message: 'NIE check digit is invalid' };
  }
  
  return { valid: true, message: 'NIE is valid' };
}

// Passport validation
function validatePassport(passport: string): { valid: boolean; message: string } {
  // Basic passport validation - alphanumeric, 6-9 characters
  const passportRegex = /^[A-Z0-9]{6,9}$/i;
  
  if (!passportRegex.test(passport)) {
    return { valid: false, message: 'Passport format is invalid' };
  }
  
  return { valid: true, message: 'Passport format is valid' };
}