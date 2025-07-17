// BFF Client Integration for Rust-WASM modules
import { nanoid } from 'nanoid';

// Types for BFF responses
interface BFFResponse {
  success: boolean;
  data?: any;
  error?: string;
  rate_limited: boolean;
  retry_after?: number;
}

interface AdminBFFResponse extends BFFResponse {
  requires_auth: boolean;
}

// Client fingerprint for rate limiting
let clientFingerprint: string | null = null;

function getClientFingerprint(): string {
  if (!clientFingerprint) {
    // Generate a simple client fingerprint
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const userAgent = navigator.userAgent.slice(0, 50);
    const screen = `${window.screen.width}x${window.screen.height}`;
    
    clientFingerprint = btoa(`${timestamp}_${random}_${userAgent}_${screen}`)
      .replace(/[+/=]/g, '')
      .substring(0, 16);
  }
  return clientFingerprint;
}

// Registration BFF integration
export class RegistrationBFF {
  private static wasmModule: any = null;
  
  static async initialize() {
    if (this.wasmModule) return;
    
    try {
      // In a real implementation, this would load the WASM module
      // For now, we'll simulate the BFF behavior
      console.log('Registration BFF: Initializing WASM module');
      this.wasmModule = { initialized: true };
    } catch (error) {
      console.error('Registration BFF: Failed to initialize WASM module', error);
      throw new Error('BFF initialization failed');
    }
  }
  
  static async checkAvailability(
    checkInDate: string,
    checkOutDate: string,
    numberOfPersons: number
  ): Promise<any> {
    await this.initialize();
    
    const clientId = getClientFingerprint();
    const requestData = JSON.stringify({
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      number_of_persons: numberOfPersons
    });
    
    // Simulate BFF rate limiting and validation
    const rateLimitResult = this.checkRateLimit(clientId, 'availability');
    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`);
    }
    
    // Validate input
    this.validateAvailabilityInput(checkInDate, checkOutDate, numberOfPersons);
    
    // Make actual API call (BFF would orchestrate this)
    const response = await fetch('/api/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': clientId,
        'X-BFF-Source': 'registration'
      },
      body: JSON.stringify({
        checkInDate,
        checkOutDate,
        numberOfPersons
      })
    });
    
    if (!response.ok) {
      throw new Error(`Availability check failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  static async registerPilgrim(registrationData: any): Promise<any> {
    await this.initialize();
    
    const clientId = getClientFingerprint();
    
    // Simulate BFF rate limiting (stricter for registrations)
    const rateLimitResult = this.checkRateLimit(clientId, 'registration');
    if (!rateLimitResult.allowed) {
      throw new Error(`Registration rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`);
    }
    
    // Comprehensive validation
    this.validateRegistrationData(registrationData);
    
    // Make actual API call
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': clientId,
        'X-BFF-Source': 'registration'
      },
      body: JSON.stringify(registrationData)
    });
    
    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  static validateSpanishDocument(docType: string, docNumber: string): boolean {
    // Simulate WASM validation
    switch (docType) {
      case 'NIF':
        return this.validateDNI(docNumber);
      case 'NIE':
        return this.validateNIE(docNumber);
      case 'PAS':
        return this.validatePassport(docNumber);
      default:
        return docNumber.length >= 3 && docNumber.length <= 20;
    }
  }
  
  private static validateDNI(dni: string): boolean {
    const dniRegex = /^\d{8}[A-Z]$/;
    if (!dniRegex.test(dni)) return false;
    
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(dni.substring(0, 8));
    const expectedLetter = letters[number % 23];
    
    return dni[8] === expectedLetter;
  }
  
  private static validateNIE(nie: string): boolean {
    const nieRegex = /^[XYZ]\d{7}[A-Z]$/;
    if (!nieRegex.test(nie)) return false;
    
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const prefixMap: { [key: string]: number } = { 'X': 0, 'Y': 1, 'Z': 2 };
    
    const prefix = prefixMap[nie[0]];
    const number = parseInt(nie.substring(1, 8));
    const fullNumber = prefix * 10000000 + number;
    const expectedLetter = letters[fullNumber % 23];
    
    return nie[8] === expectedLetter;
  }
  
  private static validatePassport(passport: string): boolean {
    const passportRegex = /^[A-Z0-9]{6,12}$/;
    return passportRegex.test(passport);
  }
  
  private static validateAvailabilityInput(
    checkInDate: string,
    checkOutDate: string,
    numberOfPersons: number
  ): void {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkIn < today) {
      throw new Error('Check-in date cannot be in the past');
    }
    
    if (checkOut <= checkIn) {
      throw new Error('Check-out date must be after check-in date');
    }
    
    const maxStay = 14 * 24 * 60 * 60 * 1000; // 14 days
    if (checkOut.getTime() - checkIn.getTime() > maxStay) {
      throw new Error('Maximum stay is 14 nights');
    }
    
    if (numberOfPersons !== 1) {
      throw new Error('Only individual registrations are allowed');
    }
  }
  
  private static validateRegistrationData(data: any): void {
    // Sanitize and validate input
    const pilgrim = data.pilgrim;
    
    if (!pilgrim.firstName?.trim() || pilgrim.firstName.length > 50) {
      throw new Error('First name is required and must be less than 50 characters');
    }
    
    if (!pilgrim.lastName1?.trim() || pilgrim.lastName1.length > 50) {
      throw new Error('Last name is required and must be less than 50 characters');
    }
    
    if (!this.validateSpanishDocument(pilgrim.documentType, pilgrim.documentNumber)) {
      throw new Error('Invalid document number format');
    }
    
    // Additional validations...
    this.detectSecurityThreats(data);
  }
  
  private static detectSecurityThreats(data: any): void {
    // Check for XSS patterns
    const dataString = JSON.stringify(data).toLowerCase();
    const dangerousPatterns = [
      '<script', 'javascript:', 'onload=', 'onerror=',
      'select ', 'insert ', 'update ', 'delete ',
      '../', 'file://', 'data:'
    ];
    
    for (const pattern of dangerousPatterns) {
      if (dataString.includes(pattern)) {
        throw new Error('Invalid input detected');
      }
    }
  }
  
  private static checkRateLimit(clientId: string, operation: string): { allowed: boolean; retryAfter?: number } {
    // Simulate rate limiting (in real implementation, this would be handled by WASM)
    const key = `rateLimit_${clientId}_${operation}`;
    const now = Date.now();
    const window = operation === 'registration' ? 3600000 : 60000; // 1 hour vs 1 minute
    const limit = operation === 'registration' ? 3 : 10;
    
    const stored = localStorage.getItem(key);
    let count = 0;
    let windowStart = now;
    
    if (stored) {
      const data = JSON.parse(stored);
      if (now - data.windowStart < window) {
        count = data.count;
        windowStart = data.windowStart;
      }
    }
    
    if (count >= limit) {
      const retryAfter = Math.ceil((windowStart + window - now) / 1000);
      return { allowed: false, retryAfter };
    }
    
    localStorage.setItem(key, JSON.stringify({
      count: count + 1,
      windowStart
    }));
    
    return { allowed: true };
  }
}

// Admin BFF integration
export class AdminBFF {
  private static wasmModule: any = null;
  private static sessionToken: string | null = null;
  
  static async initialize() {
    if (this.wasmModule) return;
    
    try {
      console.log('Admin BFF: Initializing WASM module');
      this.wasmModule = { initialized: true };
    } catch (error) {
      console.error('Admin BFF: Failed to initialize WASM module', error);
      throw new Error('Admin BFF initialization failed');
    }
  }
  
  static async authenticate(username: string, password: string): Promise<string> {
    await this.initialize();
    
    const clientId = getClientFingerprint();
    
    // Check auth rate limiting
    const rateLimitResult = this.checkAuthRateLimit(clientId);
    if (!rateLimitResult.allowed) {
      throw new Error(`Too many authentication attempts. Try again in ${rateLimitResult.retryAfter} seconds.`);
    }
    
    // Validate credentials format
    if (!username.trim() || !password.trim()) {
      throw new Error('Username and password are required');
    }
    
    // For demo purposes, use simple auth
    if (username === 'admin' && password === 'albergue2025!') {
      this.sessionToken = this.generateSessionToken();
      
      // Store session with expiration
      const sessionData = {
        token: this.sessionToken,
        expiresAt: Date.now() + 3600000, // 1 hour
        clientId
      };
      localStorage.setItem('adminSession', JSON.stringify(sessionData));
      
      return this.sessionToken;
    } else {
      throw new Error('Invalid credentials');
    }
  }
  
  static async getDashboardStats(): Promise<any> {
    await this.initialize();
    this.requireAuth();
    
    const clientId = getClientFingerprint();
    const rateLimitResult = this.checkOperationRateLimit(clientId, 'dashboard');
    if (!rateLimitResult.allowed) {
      throw new Error(`Dashboard rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`);
    }
    
    const response = await fetch('/api/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${this.sessionToken}`,
        'X-Client-ID': clientId,
        'X-BFF-Source': 'admin'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get dashboard stats: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  static async getBeds(): Promise<any> {
    await this.initialize();
    this.requireAuth();
    
    const response = await fetch('/api/beds', {
      headers: {
        'Authorization': `Bearer ${this.sessionToken}`,
        'X-BFF-Source': 'admin'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get beds: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  static async updateBedStatus(bedId: number, status: string): Promise<any> {
    await this.initialize();
    this.requireAuth();
    
    const validStatuses = ['available', 'occupied', 'maintenance', 'out_of_order'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid bed status');
    }
    
    const response = await fetch(`/api/beds/${bedId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.sessionToken}`,
        'X-BFF-Source': 'admin'
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update bed status: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  static logout(): void {
    this.sessionToken = null;
    localStorage.removeItem('adminSession');
  }
  
  static isAuthenticated(): boolean {
    if (!this.sessionToken) {
      // Check for stored session
      const stored = localStorage.getItem('adminSession');
      if (stored) {
        const sessionData = JSON.parse(stored);
        if (Date.now() < sessionData.expiresAt) {
          this.sessionToken = sessionData.token;
          return true;
        } else {
          localStorage.removeItem('adminSession');
        }
      }
      return false;
    }
    return true;
  }
  
  private static requireAuth(): void {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }
  }
  
  private static generateSessionToken(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `adm_${timestamp}_${random}`;
  }
  
  private static checkAuthRateLimit(clientId: string): { allowed: boolean; retryAfter?: number } {
    return this.checkRateLimit(clientId, 'auth', 5, 3600000); // 5 attempts per hour
  }
  
  private static checkOperationRateLimit(clientId: string, operation: string): { allowed: boolean; retryAfter?: number } {
    const limits = {
      dashboard: { count: 60, window: 3600000 }, // 60 per hour
      beds: { count: 30, window: 3600000 },      // 30 per hour
      update: { count: 20, window: 3600000 }     // 20 per hour
    };
    
    const limit = limits[operation as keyof typeof limits] || limits.dashboard;
    return this.checkRateLimit(clientId, operation, limit.count, limit.window);
  }
  
  private static checkRateLimit(
    clientId: string, 
    operation: string, 
    limit: number, 
    window: number
  ): { allowed: boolean; retryAfter?: number } {
    const key = `adminRateLimit_${clientId}_${operation}`;
    const now = Date.now();
    
    const stored = localStorage.getItem(key);
    let count = 0;
    let windowStart = now;
    
    if (stored) {
      const data = JSON.parse(stored);
      if (now - data.windowStart < window) {
        count = data.count;
        windowStart = data.windowStart;
      }
    }
    
    if (count >= limit) {
      const retryAfter = Math.ceil((windowStart + window - now) / 1000);
      return { allowed: false, retryAfter };
    }
    
    localStorage.setItem(key, JSON.stringify({
      count: count + 1,
      windowStart
    }));
    
    return { allowed: true };
  }
}