// WASM Services Integration Layer
// This replaces the Express.js server with direct WASM service calls

// WASM imports will be available after building services
// Temporary mock implementations until WASM packages are built
const mockInit = () => Promise.resolve();
const MockDatabaseService = class {
  constructor(url: string) {}
  async create_pilgrim(data: string) { return '{"success": true}'; }
  async create_booking(data: string) { return '{"success": true}'; }
  async get_bed_availability(checkIn: string, checkOut: string) { return '{"success": true, "data": []}'; }
  async assign_bed(bookingId: string, bedId: string) { return '{"success": true}'; }
};

const MockValidationService = class {
  validate_dni(doc: string) { return '{"is_valid": true, "normalized_value": "' + doc + '"}'; }
  validate_nie(doc: string) { return '{"is_valid": true, "normalized_value": "' + doc + '"}'; }
  validate_passport(doc: string) { return '{"is_valid": true, "normalized_value": "' + doc + '"}'; }
  validate_email(email: string) { return '{"is_valid": true, "normalized_value": "' + email + '"}'; }
  validate_phone(phone: string, code: string) { return '{"is_valid": true, "normalized_value": "' + code + phone + '"}'; }
};

const MockCountryService = class {
  async get_country_info(name: string) { return '{"calling_code": "+34", "country_name": "' + name + '"}'; }
};

const MockSecurityService = class {
  authenticate(user: string, pass: string) { return '{"success": true, "token": "mock_token"}'; }
  check_rate_limit(key: string, limit: number, window: number) { return true; }
  get_rate_limit_info(key: string) { return '{"allowed": true, "remaining": 10}'; }
  generate_session_token() { return 'mock_session_token'; }
  validate_session_token(token: string) { return true; }
};

const MockOCRService = class {
  async process_dni(data: string) { return '{"success": true, "extracted_data": {"first_name": "Mock"}}'; }
  async process_nie(data: string) { return '{"success": true, "extracted_data": {"first_name": "Mock"}}'; }
  async process_passport(data: string) { return '{"success": true, "extracted_data": {"first_name": "Mock"}}'; }
  async process_other_document(data: string) { return '{"success": true, "extracted_data": {"first_name": "Mock"}}'; }
};

class WASMServicesManager {
  private static instance: WASMServicesManager;
  private initialized = false;
  
  public databaseService?: DatabaseService;
  public validationService?: ValidationService;
  public countryService?: CountryService;
  public securityService?: SecurityService;
  public ocrService?: OCRService;

  private constructor() {}

  public static getInstance(): WASMServicesManager {
    if (!WASMServicesManager.instance) {
      WASMServicesManager.instance = new WASMServicesManager();
    }
    return WASMServicesManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing WASM services...');
      
      // Initialize WASM modules (mock until built)
      await mockInit();
      
      // Create service instances (mock until built)
      this.databaseService = new MockDatabaseService(
        import.meta.env.VITE_DATABASE_URL || ''
      ) as any;
      this.validationService = new MockValidationService() as any;
      this.countryService = new MockCountryService() as any;
      this.securityService = new MockSecurityService() as any;
      this.ocrService = new MockOCRService() as any;

      this.initialized = true;
      console.log('✅ WASM services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize WASM services:', error);
      throw error;
    }
  }

  public ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('WASM services not initialized. Call initialize() first.');
    }
  }

  // Database Service Methods
  public async createPilgrim(pilgrimData: any): Promise<any> {
    this.ensureInitialized();
    const result = await this.databaseService!.create_pilgrim(JSON.stringify(pilgrimData));
    return JSON.parse(result);
  }

  public async createBooking(bookingData: any): Promise<any> {
    this.ensureInitialized();
    const result = await this.databaseService!.create_booking(JSON.stringify(bookingData));
    return JSON.parse(result);
  }

  public async getBedAvailability(checkIn: string, checkOut: string): Promise<any> {
    this.ensureInitialized();
    const result = await this.databaseService!.get_bed_availability(checkIn, checkOut);
    return JSON.parse(result);
  }

  public async assignBed(bookingId: string, bedId: string): Promise<any> {
    this.ensureInitialized();
    const result = await this.databaseService!.assign_bed(bookingId, bedId);
    return JSON.parse(result);
  }

  // Validation Service Methods
  public validateDNI(documentNumber: string): any {
    this.ensureInitialized();
    const result = this.validationService!.validate_dni(documentNumber);
    return JSON.parse(result);
  }

  public validateNIE(documentNumber: string): any {
    this.ensureInitialized();
    const result = this.validationService!.validate_nie(documentNumber);
    return JSON.parse(result);
  }

  public validatePassport(documentNumber: string): any {
    this.ensureInitialized();
    const result = this.validationService!.validate_passport(documentNumber);
    return JSON.parse(result);
  }

  public validateEmail(email: string): any {
    this.ensureInitialized();
    const result = this.validationService!.validate_email(email);
    return JSON.parse(result);
  }

  public validatePhone(phone: string, countryCode: string): any {
    this.ensureInitialized();
    const result = this.validationService!.validate_phone(phone, countryCode);
    return JSON.parse(result);
  }

  // Country Service Methods
  public async getCountryInfo(countryName: string): Promise<any> {
    this.ensureInitialized();
    const result = await this.countryService!.get_country_info(countryName);
    return JSON.parse(result);
  }

  // Security Service Methods
  public authenticate(username: string, password: string): any {
    this.ensureInitialized();
    const result = this.securityService!.authenticate(username, password);
    return JSON.parse(result);
  }

  public checkRateLimit(key: string, limit: number, windowMs: number): boolean {
    this.ensureInitialized();
    return this.securityService!.check_rate_limit(key, limit, windowMs);
  }

  public getRateLimitInfo(key: string): any {
    this.ensureInitialized();
    const result = this.securityService!.get_rate_limit_info(key);
    return JSON.parse(result);
  }

  public generateSessionToken(): string {
    this.ensureInitialized();
    return this.securityService!.generate_session_token();
  }

  public validateSessionToken(token: string): boolean {
    this.ensureInitialized();
    return this.securityService!.validate_session_token(token);
  }

  // OCR Service Methods (placeholder for WASM OCR)
  public async processDocument(imageData: string, documentType: string): Promise<any> {
    this.ensureInitialized();
    
    // TODO: Implement WASM OCR processing
    // For now, return mock response
    return {
      success: true,
      extractedData: {
        firstName: "MOCK",
        lastName1: "DATA",
        documentNumber: "12345678Z",
        birthDate: "01/01/1990"
      },
      confidence: 0.8,
      processingTime: 1000,
      detectedFields: ["firstName", "lastName1", "documentNumber", "birthDate"],
      rawText: "Mock OCR text extraction",
      isValid: true,
      errors: []
    };
  }
}

// Export singleton instance
export const wasmServices = WASMServicesManager.getInstance();

// Initialize services on module load
wasmServices.initialize().catch(console.error);

export default wasmServices;