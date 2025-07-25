// Application constants for the Albergue del Carrascalejo

export const MAX_NIGHTS = 7; // Maximum stay length
export const MIN_NIGHTS = 1; // Minimum stay length

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' }
] as const;

export const DOCUMENT_TYPES = [
  { value: 'dni', label: 'DNI (Spanish ID)' },
  { value: 'nie', label: 'NIE (Foreign ID)' },
  { value: 'passport', label: 'Passport' }
] as const;

export const PAYMENT_TYPES = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'cash', label: 'Cash on Arrival' },
  { value: 'transfer', label: 'Bank Transfer' }
] as const;

export const BED_TYPES = [
  { value: 'dorm-a', label: 'Dormitory A (12 beds)', price: 15 },
  { value: 'dorm-b', label: 'Dormitory B (10 beds)', price: 15 },
  { value: 'private', label: 'Private Room', price: 35 }
] as const;

export const LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'eu', name: 'Euskera', flag: '🏁' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' }
] as const;

export const NATIONALITIES = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'British', 'Irish',
  'Dutch', 'Belgian', 'Swiss', 'Austrian', 'Polish', 'Czech', 'Hungarian',
  'American', 'Canadian', 'Australian', 'Japanese', 'Korean', 'Brazilian',
  'Other'
] as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
} as const;

export const BED_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance'
} as const;

// Configuration constants
export const CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  RESERVATION_TIMEOUT_HOURS: 2,
  MAX_GUESTS_PER_BOOKING: 1, // Single-person bookings only
  DORM_A_CAPACITY: 12,
  DORM_B_CAPACITY: 10,
  PRIVATE_ROOMS: 2
} as const;