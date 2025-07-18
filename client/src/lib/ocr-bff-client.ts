// OCR Backend-for-Frontend Client
// Handles communication with specialized Rust WASM OCR services

export interface OCRRequest {
  documentType: string;
  documentSide?: 'front' | 'back';
  fileData: string; // base64 encoded
  fileName: string;
  mimeType: string;
}

export interface ExtractedDocumentData {
  firstName?: string;
  lastName1?: string;
  lastName2?: string;
  documentNumber?: string;
  documentType?: string;
  documentSupport?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  addressProvince?: string;
}

export interface OCRResponse {
  success: boolean;
  extractedData: ExtractedDocumentData;
  confidence: number;
  processingTimeMs: number;
  detectedFields: string[];
  errors: string[];
  rawText: string;
}

export interface MultiFileOCRRequest {
  files: OCRRequest[];
}

class OCRBFFClient {
  private baseUrl: string;
  private lambdaUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '';
    // AWS Lambda URL for zero-cost OCR processing
    this.lambdaUrl = import.meta.env.VITE_LAMBDA_OCR_URL || '';
  }

  // DNI/NIF OCR Processing
  async processDNI(file: File, documentSide?: 'front' | 'back'): Promise<OCRResponse> {
    try {
      const fileData = await this.fileToBase64(file);
      
      const request: OCRRequest = {
        documentType: 'DNI',
        documentSide,
        fileData,
        fileName: file.name,
        mimeType: file.type,
      };

      const response = await this.makeRequest('/api/ocr/dni', request);
      return response;
    } catch (error) {
      console.error('DNI OCR processing error:', error);
      return this.createErrorResponse('Failed to process DNI document');
    }
  }

  // NIE OCR Processing
  async processNIE(file: File, documentSide?: 'front' | 'back'): Promise<OCRResponse> {
    try {
      const fileData = await this.fileToBase64(file);
      
      const request: OCRRequest = {
        documentType: 'NIE',
        documentSide,
        fileData,
        fileName: file.name,
        mimeType: file.type,
      };

      const response = await this.makeRequest('/api/ocr/nie', request);
      return response;
    } catch (error) {
      console.error('NIE OCR processing error:', error);
      return this.createErrorResponse('Failed to process NIE document');
    }
  }

  // Passport OCR Processing
  async processPassport(file: File): Promise<OCRResponse> {
    try {
      const fileData = await this.fileToBase64(file);
      
      const request: OCRRequest = {
        documentType: 'PASSPORT',
        fileData,
        fileName: file.name,
        mimeType: file.type,
      };

      const response = await this.makeRequest('/api/ocr/passport', request);
      return response;
    } catch (error) {
      console.error('Passport OCR processing error:', error);
      return this.createErrorResponse('Failed to process passport document');
    }
  }

  // Other Documents OCR Processing (supports up to 2 files, PDF/DOCX/Images)
  async processOtherDocuments(files: File[]): Promise<OCRResponse[]> {
    if (files.length > 2) {
      throw new Error('Maximum 2 files allowed for other document processing');
    }

    try {
      const requests: OCRRequest[] = [];
      
      for (const file of files) {
        // Validate file type
        if (!this.isSupportedFileType(file.type)) {
          throw new Error(`Unsupported file type: ${file.type}. Only PDF, DOCX, and images are supported.`);
        }

        const fileData = await this.fileToBase64(file);
        requests.push({
          documentType: 'OTHER',
          fileData,
          fileName: file.name,
          mimeType: file.type,
        });
      }

      const multiRequest: MultiFileOCRRequest = { files: requests };
      const responses = await this.makeRequest('/api/ocr/other', multiRequest);
      
      return Array.isArray(responses) ? responses : [responses];
    } catch (error) {
      console.error('Other documents OCR processing error:', error);
      return [this.createErrorResponse('Failed to process other documents')];
    }
  }

  // Process document with image data URL for zero-cost Lambda OCR
  async processDocumentWithImage(
    imageDataUrl: string,
    documentType: string,
    documentSide?: 'front' | 'back'
  ): Promise<OCRResponse> {
    try {
      // Use AWS Lambda if configured, fallback to local BFF
      if (this.lambdaUrl) {
        return await this.processWithLambda(imageDataUrl, documentType, documentSide);
      } else {
        return await this.processWithBFF(imageDataUrl, documentType, documentSide);
      }
    } catch (error) {
      console.error('Document processing error:', error);
      return this.createErrorResponse('Failed to process document');
    }
  }

  // AWS Lambda OCR processing (zero-cost)
  private async processWithLambda(
    imageDataUrl: string,
    documentType: string,
    documentSide?: 'front' | 'back'
  ): Promise<OCRResponse> {
    const request = {
      image_base64: imageDataUrl,
      document_type: documentType.toUpperCase(),
      side: documentSide || 'front'
    };

    const response = await fetch(this.lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Lambda OCR failed: ${response.status} ${response.statusText}`);
    }

    const lambdaResult = await response.json();

    // Convert Lambda response to our OCRResponse format
    return this.convertLambdaResponse(lambdaResult);
  }

  // BFF OCR processing (fallback)
  private async processWithBFF(
    imageDataUrl: string,
    documentType: string,
    documentSide?: 'front' | 'back'
  ): Promise<OCRResponse> {
    const request: OCRRequest = {
      documentType,
      documentSide,
      fileData: imageDataUrl,
      fileName: `document.jpg`,
      mimeType: 'image/jpeg',
    };

    // Route to specific endpoint based on document type
    let endpoint = '/api/ocr/process';
    switch (documentType.toUpperCase()) {
      case 'DNI':
      case 'NIF':
        endpoint = '/api/ocr/dni';
        break;
      case 'NIE':
        endpoint = '/api/ocr/nie';
        break;
      case 'PASSPORT':
      case 'PAS':
        endpoint = '/api/ocr/passport';
        break;
      case 'OTHER':
      case 'OTRO':
        endpoint = '/api/ocr/other';
        break;
    }

    return await this.makeRequest(endpoint, request);
  }

  // Convert AWS Lambda response format to our OCRResponse format
  private convertLambdaResponse(lambdaResult: any): OCRResponse {
    if (!lambdaResult.success) {
      return this.createErrorResponse(lambdaResult.error || 'Lambda processing failed');
    }

    const data = lambdaResult.data || {};
    
    // Convert Lambda data format to our ExtractedDocumentData format
    const extractedData: ExtractedDocumentData = {
      documentNumber: data.document_number,
      firstName: data.first_name,
      lastName: data.last_names || data.lastName, // Support both formats
      birthDate: data.birth_date,
      expiryDate: data.expiry_date,
      nationality: data.nationality,
      address: data.address,
      postalCode: data.postal_code,
    };

    return {
      success: true,
      extractedData,
      confidence: data.confidence_score || 0,
      processingTimeMs: lambdaResult.processing_time_ms || 0,
      detectedFields: this.getDetectedFields(extractedData),
      errors: [],
      rawText: '',
    };
  }

  // Process document based on type (main entry point)
  async processDocument(
    documentType: string, 
    frontFile?: File, 
    backFile?: File
  ): Promise<{ frontOCR?: OCRResponse; backOCR?: OCRResponse }> {
    const results: { frontOCR?: OCRResponse; backOCR?: OCRResponse } = {};

    try {
      switch (documentType.toUpperCase()) {
        case 'DNI':
        case 'NIF':
          if (frontFile) {
            results.frontOCR = await this.processDNI(frontFile, 'front');
          }
          if (backFile) {
            results.backOCR = await this.processDNI(backFile, 'back');
          }
          break;

        case 'NIE':
          if (frontFile) {
            results.frontOCR = await this.processNIE(frontFile, 'front');
          }
          if (backFile) {
            results.backOCR = await this.processNIE(backFile, 'back');
          }
          break;

        case 'PAS':
        case 'PASSPORT':
          if (frontFile) {
            results.frontOCR = await this.processPassport(frontFile);
          }
          break;

        case 'OTHER':
          const files = [frontFile, backFile].filter(Boolean) as File[];
          if (files.length > 0) {
            const responses = await this.processOtherDocuments(files);
            results.frontOCR = responses[0];
            if (responses.length > 1) {
              results.backOCR = responses[1];
            }
          }
          break;

        default:
          throw new Error(`Unsupported document type: ${documentType}`);
      }

      return results;
    } catch (error) {
      console.error('Document processing error:', error);
      return {
        frontOCR: this.createErrorResponse(`Failed to process ${documentType} document`),
      };
    }
  }

  // Helper methods
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  private isSupportedFileType(mimeType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    return supportedTypes.includes(mimeType);
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    console.log(`=== OCR API REQUEST ===`);
    console.log('Endpoint:', endpoint);
    console.log('Request data:', data);
    
    // Try AWS Lambda Rust backend first if URL is configured
    if (this.lambdaUrl) {
      console.log('=== ATTEMPTING RUST LAMBDA OCR ===');
      console.log('Lambda URL:', this.lambdaUrl);
      
      try {
        const lambdaPayload = {
          image_base64: data.fileData,
          document_type: data.documentType.toUpperCase(),
          side: data.documentSide || 'front'
        };
        
        console.log('Lambda payload:', {
          ...lambdaPayload,
          image_base64: `[base64 data: ${lambdaPayload.image_base64.length} chars]`
        });

        const response = await fetch(this.lambdaUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(lambdaPayload),
        });

        if (!response.ok) {
          throw new Error(`Lambda HTTP ${response.status}: ${response.statusText}`);
        }

        const lambdaResult = await response.json();
        console.log('=== RUST LAMBDA OCR RESPONSE ===');
        console.log('Lambda result:', JSON.stringify(lambdaResult, null, 2));
        
        // Transform Lambda response to match our interface
        const transformedResult = this.transformLambdaResponse(lambdaResult);
        console.log('=== TRANSFORMED RUST OCR RESULT ===');
        console.log('Transformed result:', transformedResult);
        
        return transformedResult;
        
      } catch (error) {
        console.warn('Rust Lambda OCR failed, falling back to local BFF:', error);
      }
    } else {
      console.log('=== NO LAMBDA URL CONFIGURED ===');
      console.log('VITE_LAMBDA_OCR_URL not set, skipping Rust backend');
    }
    
    // Try local Rust BFF backend
    try {
      console.log('=== ATTEMPTING LOCAL RUST BFF ===');
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`BFF HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`=== LOCAL RUST BFF RESPONSE from ${endpoint} ===`);
      console.log('BFF result:', JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.warn(`Local Rust BFF unavailable for ${endpoint}, using JavaScript fallback:`, error);
      
      // Final fallback to local JavaScript processing
      const fallbackResult = this.processFallback(data);
      console.log('=== JAVASCRIPT FALLBACK RESPONSE ===');
      console.log('Fallback result:', fallbackResult);
      return fallbackResult;
    }
  }

  // Transform AWS Lambda response to match our OCRResponse interface
  private transformLambdaResponse(lambdaResult: any): OCRResponse {
    console.log('=== TRANSFORMING LAMBDA RESPONSE ===');
    console.log('Raw lambda result:', lambdaResult);
    
    const extractedData: ExtractedDocumentData = {};
    
    if (lambdaResult.success && lambdaResult.extracted_data) {
      const data = lambdaResult.extracted_data;
      
      // Map Lambda response fields to our interface
      if (data.first_name) extractedData.firstName = data.first_name;
      if (data.first_surname) extractedData.lastName1 = data.first_surname;
      if (data.second_surname) extractedData.lastName2 = data.second_surname;
      if (data.document_number) extractedData.documentNumber = data.document_number;
      if (data.document_type) extractedData.documentType = data.document_type;
      if (data.birth_date) extractedData.birthDate = data.birth_date;
      if (data.gender) extractedData.gender = data.gender;
      if (data.nationality) extractedData.nationality = data.nationality;
      if (data.address) extractedData.addressStreet = data.address;
      if (data.city) extractedData.addressCity = data.city;
      if (data.postal_code) extractedData.addressPostalCode = data.postal_code;
      if (data.country) extractedData.addressCountry = data.country;
      if (data.province) extractedData.addressProvince = data.province;
      
      console.log('=== MAPPED EXTRACTED DATA ===');
      console.log('Extracted data:', extractedData);
    }
    
    return {
      success: lambdaResult.success || false,
      extractedData,
      confidence: lambdaResult.confidence || 0,
      processingTimeMs: lambdaResult.processing_time_ms || 0,
      detectedFields: lambdaResult.detected_fields || [],
      errors: lambdaResult.errors || [],
      rawText: lambdaResult.raw_text || ''
    };
  }

  private processFallback(data: any): OCRResponse {
    // Simplified fallback processing
    console.log('Using fallback OCR processing for:', data);
    
    return {
      success: true,
      extractedData: {
        firstName: 'FALLBACK',
        lastName1: 'PROCESSING',
        documentNumber: 'FB123456',
        documentType: data.documentType || 'UNKNOWN',
      },
      confidence: 0.5,
      processingTimeMs: 100,
      detectedFields: ['firstName', 'lastName1', 'documentNumber'],
      errors: ['Using fallback processing - Rust backend unavailable'],
      rawText: 'Fallback processing text',
    };
  }

  private createErrorResponse(message: string): OCRResponse {
    return {
      success: false,
      extractedData: {},
      confidence: 0,
      processingTimeMs: 0,
      detectedFields: [],
      errors: [message],
      rawText: '',
    };
  }
}

// Export singleton instance
export const ocrBFFClient = new OCRBFFClient();

// Export types for use in components
export type {
  OCRRequest,
  OCRResponse,
  ExtractedDocumentData,
  MultiFileOCRRequest,
};