import { createWorker } from 'tesseract.js';

export interface ComprehensiveOCRResult {
  // Personal Information
  firstName?: string;
  lastName1?: string;
  lastName2?: string;
  documentNumber?: string;
  documentType?: string;
  documentSupport?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  
  // Address Information (if available on document)
  addressStreet?: string;
  addressCity?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  
  // Processing metadata
  confidence: number;
  processingTime: number;
  detectedFields: string[];
  rawText: string;
  isValid: boolean;
  errors: string[];
}

export class EnhancedOCRService {
  private worker: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      this.worker = await createWorker('spa');
      this.isInitialized = true;
    }
  }

  async processDocument(imageFile: File, context?: { documentType?: string; documentSide?: 'front' | 'back' }): Promise<ComprehensiveOCRResult> {
    const startTime = Date.now();
    
    try {
      await this.initialize();

      // Enhanced OCR processing with better parameters
      const { data: { text, confidence } } = await this.worker.recognize(imageFile, {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,/-',
        tessedit_pageseg_mode: '6', // Uniform block of text
        preserve_interword_spaces: '1'
      });

      const processingTime = Date.now() - startTime;
      const extractedData = this.extractAllDocumentData(text, context);
      
      return {
        ...extractedData,
        confidence: confidence / 100, // Convert to 0-1 scale
        processingTime,
        rawText: text,
        isValid: extractedData.detectedFields.length > 0,
        errors: this.validateExtractedData(extractedData)
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      return {
        confidence: 0,
        processingTime: Date.now() - startTime,
        detectedFields: [],
        rawText: '',
        isValid: false,
        errors: ['OCR processing failed: ' + (error as Error).message]
      };
    }
  }

  private extractAllDocumentData(text: string, context?: { documentType?: string; documentSide?: 'front' | 'back' }): Omit<ComprehensiveOCRResult, 'confidence' | 'processingTime' | 'rawText' | 'isValid' | 'errors'> {
    const lines = text.split('\n').map(line => line.trim().toUpperCase()).filter(line => line.length > 0);
    const result: any = {};
    const detectedFields: string[] = [];

    // Document patterns
    const patterns = {
      // Spanish documents
      dni: /\b\d{8}[A-Z]\b/g,
      nie: /\b[XYZ]\d{7}[A-Z]\b/g,
      passport: /\b[A-Z]{3}\d{6}\b/g,
      
      // Date patterns
      birthDate: /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}\b/g,
      
      // Postal code patterns
      postalCode: /\b\d{5}\b/g,
      
      // Gender indicators
      gender: /\b(MASCULINO|FEMENINO|MALE|FEMALE|M|F|HOMBRE|MUJER)\b/g,
      
      // Nationality patterns
      nationality: /\b(ESP|ESPAÑA|SPAIN|FRA|FRANCE|FRANCIA|DEU|GERMANY|ALEMANIA)\b/g
    };

    // Context-aware processing - prioritize fields based on document side
    const prioritizeFrontFields = !context?.documentSide || context.documentSide === 'front';
    const prioritizeBackFields = context?.documentSide === 'back';

    // Process each line for comprehensive extraction
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1] || '';
      const prevLine = lines[i - 1] || '';

      // Extract document number and type (primarily front side)
      if (patterns.dni.test(line)) {
        const match = line.match(patterns.dni)?.[0];
        if (match) {
          result.documentNumber = match;
          result.documentType = 'NIF';
          detectedFields.push('documentNumber', 'documentType');
        }
      } else if (patterns.nie.test(line)) {
        const match = line.match(patterns.nie)?.[0];
        if (match) {
          result.documentNumber = match;
          result.documentType = 'NIE';
          detectedFields.push('documentNumber', 'documentType');
        }
      } else if (patterns.passport.test(line)) {
        const match = line.match(patterns.passport)?.[0];
        if (match) {
          result.documentNumber = match;
          result.documentType = 'PAS';
          detectedFields.push('documentNumber', 'documentType');
        }
      }

      // Extract birth date
      if (patterns.birthDate.test(line)) {
        const dateMatch = line.match(patterns.birthDate)?.[0];
        if (dateMatch) {
          const formattedDate = this.formatDate(dateMatch);
          if (formattedDate) {
            result.birthDate = formattedDate;
            detectedFields.push('birthDate');
          }
        }
      }

      // Extract gender
      if (patterns.gender.test(line)) {
        const genderMatch = line.match(patterns.gender)?.[0];
        if (genderMatch) {
          if (['MASCULINO', 'MALE', 'HOMBRE', 'M'].includes(genderMatch)) {
            result.gender = 'H'; // Hombre
          } else if (['FEMENINO', 'FEMALE', 'MUJER', 'F'].includes(genderMatch)) {
            result.gender = 'M'; // Mujer
          }
          if (result.gender) detectedFields.push('gender');
        }
      }

      // Extract nationality
      if (patterns.nationality.test(line)) {
        const nationalityMatch = line.match(patterns.nationality)?.[0];
        if (nationalityMatch) {
          const nationalities: Record<string, string> = {
            'ESP': 'ESP', 'ESPAÑA': 'ESP', 'SPAIN': 'ESP',
            'FRA': 'FRA', 'FRANCE': 'FRA', 'FRANCIA': 'FRA',
            'DEU': 'DEU', 'GERMANY': 'DEU', 'ALEMANIA': 'DEU'
          };
          result.nationality = nationalities[nationalityMatch] || nationalityMatch;
          detectedFields.push('nationality');
        }
      }

      // Extract names (primarily front side)
      if (prioritizeFrontFields) {
        this.extractNames(line, nextLine, prevLine, result, detectedFields);
      }
      
      // Extract address information (primarily back side for DNI/NIE)
      if (prioritizeBackFields || !context?.documentSide) {
        this.extractAddress(line, result, detectedFields);
      }
    }

    return { ...result, detectedFields };
  }

  private extractNames(line: string, nextLine: string, prevLine: string, result: any, detectedFields: string[]): void {
    // Common name field indicators
    const nameIndicators = ['NOMBRE', 'NAME', 'APELLIDOS', 'SURNAME', 'GIVEN NAME', 'FAMILY NAME'];
    const isNameLine = nameIndicators.some(indicator => line.includes(indicator));
    
    if (isNameLine) {
      // Remove indicators and extract name
      let cleanLine = line;
      nameIndicators.forEach(indicator => {
        cleanLine = cleanLine.replace(new RegExp(indicator, 'g'), '');
      });
      cleanLine = cleanLine.trim();
      
      if (cleanLine.length > 1) {
        const nameParts = cleanLine.split(/\s+/).filter(part => part.length > 1);
        
        if (nameParts.length >= 1) {
          result.firstName = this.capitalizeWord(nameParts[0]);
          detectedFields.push('firstName');
        }
        if (nameParts.length >= 2) {
          result.lastName1 = this.capitalizeWord(nameParts[1]);
          detectedFields.push('lastName1');
        }
        if (nameParts.length >= 3) {
          result.lastName2 = this.capitalizeWord(nameParts[2]);
          detectedFields.push('lastName2');
        }
      }
    }
    
    // Alternative: Look for patterns in next/previous lines
    if (!result.firstName && nextLine.length > 2 && !nextLine.match(/\d/)) {
      const words = nextLine.split(/\s+/).filter(word => word.length > 1);
      if (words.length >= 1 && words[0].length > 2) {
        result.firstName = this.capitalizeWord(words[0]);
        detectedFields.push('firstName');
      }
    }
  }

  private extractAddress(line: string, result: any, detectedFields: string[]): void {
    // Look for address indicators
    const addressIndicators = ['DIRECCION', 'ADDRESS', 'DOMICILIO', 'CALLE', 'STREET'];
    const isAddressLine = addressIndicators.some(indicator => line.includes(indicator));
    
    if (isAddressLine) {
      let cleanLine = line;
      addressIndicators.forEach(indicator => {
        cleanLine = cleanLine.replace(new RegExp(indicator, 'g'), '');
      });
      cleanLine = cleanLine.trim();
      
      if (cleanLine.length > 5) {
        result.addressStreet = this.capitalizeWords(cleanLine);
        detectedFields.push('addressStreet');
      }
    }

    // Extract postal code
    const postalMatch = line.match(/\b\d{5}\b/);
    if (postalMatch && !result.addressPostalCode) {
      result.addressPostalCode = postalMatch[0];
      detectedFields.push('addressPostalCode');
    }

    // Extract city names (after postal code)
    const cityPattern = /\d{5}\s+([A-Z\s]{3,})/;
    const cityMatch = line.match(cityPattern);
    if (cityMatch && !result.addressCity) {
      result.addressCity = this.capitalizeWords(cityMatch[1].trim());
      detectedFields.push('addressCity');
    }
  }

  private formatDate(dateStr: string): string | null {
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
      // Assume DD/MM/YYYY format for Spanish documents
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      
      // Validate date
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (date.getFullYear() == parseInt(year) && 
          date.getMonth() == parseInt(month) - 1 && 
          date.getDate() == parseInt(day)) {
        return `${year}-${month}-${day}`;
      }
    }
    return null;
  }

  private capitalizeWord(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  private capitalizeWords(text: string): string {
    return text.split(/\s+/).map(word => this.capitalizeWord(word)).join(' ');
  }

  private validateExtractedData(data: any): string[] {
    const errors: string[] = [];
    
    if (data.birthDate) {
      const birthYear = parseInt(data.birthDate.split('-')[0]);
      const currentYear = new Date().getFullYear();
      if (birthYear < 1900 || birthYear > currentYear) {
        errors.push('Invalid birth year detected');
      }
    }
    
    if (data.documentNumber && data.documentType) {
      // Basic format validation
      if (data.documentType === 'NIF' && !/^\d{8}[A-Z]$/.test(data.documentNumber)) {
        errors.push('Invalid DNI/NIF format');
      } else if (data.documentType === 'NIE' && !/^[XYZ]\d{7}[A-Z]$/.test(data.documentNumber)) {
        errors.push('Invalid NIE format');
      }
    }
    
    return errors;
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// Global instance for reuse
export const enhancedOCRService = new EnhancedOCRService();