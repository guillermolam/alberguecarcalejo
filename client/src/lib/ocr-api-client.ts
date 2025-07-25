interface ComprehensiveOCRResult {
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
  confidence: number;
  processingTime: number;
  detectedFields: string[];
  rawText: string;
  isValid: boolean;
  errors: string[];
}

export class OCRAPIClient {
  private baseUrl = '/api';

  async processDocument(
    imageFile: File,
    context?: { documentType?: string; documentSide?: 'front' | 'back' }
  ): Promise<ComprehensiveOCRResult> {
    console.log('Processing document via direct API...');

    try {
      // Convert file to base64
      const base64Data = await this.fileToBase64(imageFile);

      const request = {
        image_data: base64Data,
        document_type_hint: context?.documentType,
        document_side: context?.documentSide,
      };

      console.log('Sending OCR request to API...');

      const response = await fetch(`${this.baseUrl}/ocr/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`OCR request failed: ${response.status}`);
      }

      const result = await response.json();

      console.log('Direct API OCR SUCCESS');
      console.log('Result:', result);

      return this.transformResponse(result);

    } catch (error) {
      console.error('OCR API Client error:', error);
      throw error;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private transformResponse(data: any): ComprehensiveOCRResult {
    return {
      firstName: data.first_name,
      lastName1: data.last_name1,
      lastName2: data.last_name2,
      documentNumber: data.document_number,
      documentType: data.document_type,
      documentSupport: data.document_support,
      birthDate: data.birth_date,
      gender: data.gender,
      nationality: data.nationality,
      addressStreet: data.address_street,
      addressCity: data.address_city,
      addressPostalCode: data.address_postal_code,
      addressCountry: data.address_country,
      confidence: data.confidence || 0,
      processingTime: data.processing_time || 0,
      detectedFields: data.detected_fields || [],
      rawText: data.raw_text || '',
      isValid: data.is_valid || false,
      errors: data.errors || [],
    };
  }
}

export const ocrAPIClient = new OCRAPIClient();