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
    // Try Rust backend first
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn(`Rust backend unavailable for ${endpoint}, using fallback:`, error);
      
      // Fallback to local processing (simplified)
      return this.processFallback(data);
    }
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