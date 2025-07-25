// WASM API Client - Replaces server API calls with direct WASM service calls
import { wasmServices } from '../../../frontend/wasm-services';

export class WASMAPIClient {
  // Document validation endpoints
  static async validateDocument(documentNumber: string, documentType: string) {
    try {
      switch (documentType.toUpperCase()) {
        case 'DNI':
          return wasmServices.validateDNI(documentNumber);
        case 'NIE':
          return wasmServices.validateNIE(documentNumber);
        case 'PASSPORT':
          return wasmServices.validatePassport(documentNumber);
        default:
          throw new Error(`Unsupported document type: ${documentType}`);
      }
    } catch (error) {
      console.error(`Document validation failed for ${documentType}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        is_valid: false,
        error_message: `Validation failed: ${errorMessage}`,
        normalized_value: null,
        checksum_valid: false
      };
    }
  }

  // Email validation
  static async validateEmail(email: string) {
    try {
      return wasmServices.validateEmail(email);
    } catch (error) {
      console.error('Email validation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        is_valid: false,
        error_message: `Email validation failed: ${errorMessage}`,
        normalized_value: null
      };
    }
  }

  // Phone validation
  static async validatePhone(phone: string, countryCode: string) {
    try {
      return wasmServices.validatePhone(phone, countryCode);
    } catch (error) {
      console.error('Phone validation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        is_valid: false,
        error_message: `Phone validation failed: ${errorMessage}`,
        normalized_value: null
      };
    }
  }

  // OCR processing endpoints
  static async processOCRDocument(imageData: string, documentType: string) {
    try {
      return await wasmServices.processDocument(imageData, documentType);
    } catch (error) {
      console.error('OCR processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        extractedData: null,
        confidence: 0,
        processingTime: 0,
        detectedFields: [],
        rawText: '',
        isValid: false,
        errors: [`OCR processing failed: ${errorMessage}`]
      };
    }
  }

  // Country information
  static async getCountryInfo(countryName: string) {
    try {
      return await wasmServices.getCountryInfo(countryName);
    } catch (error) {
      console.error('Country info failed:', error);
      return {
        calling_code: '',
        flag_url: '',
        country_code: '',
        country_name: countryName
      };
    }
  }

  // Database operations
  static async createPilgrim(pilgrimData: any) {
    try {
      return await wasmServices.createPilgrim(pilgrimData);
    } catch (error) {
      console.error('Create pilgrim failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Database operation failed: ${errorMessage}`,
        data: null
      };
    }
  }

  static async createBooking(bookingData: any) {
    try {
      return await wasmServices.createBooking(bookingData);
    } catch (error) {
      console.error('Create booking failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Database operation failed: ${errorMessage}`,
        data: null
      };
    }
  }

  static async getBedAvailability(checkIn: string, checkOut: string) {
    try {
      return await wasmServices.getBedAvailability(checkIn, checkOut);
    } catch (error) {
      console.error('Get bed availability failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Database operation failed: ${errorMessage}`,
        data: []
      };
    }
  }

  static async assignBed(bookingId: string, bedId: string) {
    try {
      return await wasmServices.assignBed(bookingId, bedId);
    } catch (error) {
      console.error('Assign bed failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Database operation failed: ${errorMessage}`,
        data: null
      };
    }
  }

  // Authentication
  static async authenticate(username: string, password: string) {
    try {
      return wasmServices.authenticate(username, password);
    } catch (error) {
      console.error('Authentication failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        token: null,
        user_id: null,
        error: `Authentication failed: ${errorMessage}`,
        locked_until: null
      };
    }
  }

  // Rate limiting
  static checkRateLimit(key: string, limit: number, windowMs: number): boolean {
    try {
      return wasmServices.checkRateLimit(key, limit, windowMs);
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }
  }

  static getRateLimitInfo(key: string) {
    try {
      return wasmServices.getRateLimitInfo(key);
    } catch (error) {
      console.error('Get rate limit info failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        allowed: false,
        remaining: 0,
        reset_time: Date.now().toString(),
        error: errorMessage
      };
    }
  }
}

export default WASMAPIClient;