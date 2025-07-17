// Spanish DNI/NIE validation utilities

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const NIE_REGEX = /^[XYZ]\d{7}[A-Z]$/;
const DNI_REGEX = /^\d{8}[A-Z]$/;
const PASSPORT_REGEX = /^[A-Z0-9]{6,9}$/;

export function validateDNI(dni: string): boolean {
  if (!dni || typeof dni !== 'string') return false;
  
  const cleanDNI = dni.toUpperCase().replace(/[-\s]/g, '');
  
  if (!DNI_REGEX.test(cleanDNI)) return false;
  
  const number = cleanDNI.slice(0, 8);
  const letter = cleanDNI.slice(8);
  const expectedLetter = DNI_LETTERS[parseInt(number) % 23];
  
  return letter === expectedLetter;
}

export function validateNIE(nie: string): boolean {
  if (!nie || typeof nie !== 'string') return false;
  
  const cleanNIE = nie.toUpperCase().replace(/[-\s]/g, '');
  
  if (!NIE_REGEX.test(cleanNIE)) return false;
  
  const firstLetter = cleanNIE[0];
  const number = cleanNIE.slice(1, 8);
  const letter = cleanNIE.slice(8);
  
  // Convert first letter to number (X=0, Y=1, Z=2)
  let prefix = 0;
  if (firstLetter === 'Y') prefix = 1;
  else if (firstLetter === 'Z') prefix = 2;
  
  const fullNumber = prefix + number;
  const expectedLetter = DNI_LETTERS[parseInt(fullNumber) % 23];
  
  return letter === expectedLetter;
}

export function validatePassport(passport: string): boolean {
  if (!passport || typeof passport !== 'string') return false;
  
  const cleanPassport = passport.toUpperCase().replace(/[-\s]/g, '');
  return PASSPORT_REGEX.test(cleanPassport);
}

export function validateDocument(documentType: string, documentNumber: string): boolean {
  if (!documentNumber) return false;
  
  switch (documentType) {
    case 'DNI':
      return validateDNI(documentNumber);
    case 'NIE':
      return validateNIE(documentNumber);
    case 'PASSPORT':
      return validatePassport(documentNumber);
    default:
      return false;
  }
}

export function formatDocument(documentType: string, documentNumber: string): string {
  if (!documentNumber) return '';
  
  const clean = documentNumber.toUpperCase().replace(/[-\s]/g, '');
  
  if (documentType === 'DNI' && DNI_REGEX.test(clean)) {
    return `${clean.slice(0, 8)}-${clean.slice(8)}`;
  }
  
  if (documentType === 'NIE' && NIE_REGEX.test(clean)) {
    return `${clean.slice(0, 1)}-${clean.slice(1, 8)}-${clean.slice(8)}`;
  }
  
  return clean;
}