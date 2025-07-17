import { createWorker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  extractedData?: {
    documentNumber?: string;
    name?: string;
    surname?: string;
    birthDate?: string;
  };
}

export class OCRService {
  private worker: any = null;

  async initialize(): Promise<void> {
    if (!this.worker) {
      this.worker = await createWorker('spa');
    }
  }

  async processDocument(imageFile: File): Promise<OCRResult> {
    await this.initialize();

    const { data: { text, confidence } } = await this.worker.recognize(imageFile);
    
    const extractedData = this.extractDocumentData(text);
    
    return {
      text,
      confidence,
      extractedData
    };
  }

  private extractDocumentData(text: string): OCRResult['extractedData'] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const result: OCRResult['extractedData'] = {};

    // Spanish DNI/NIE patterns
    const dniPattern = /\b\d{8}[A-Z]\b/;
    const niePattern = /\b[XYZ]\d{7}[A-Z]\b/;
    
    // Date patterns (dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy)
    const datePattern = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}\b/;
    
    for (const line of lines) {
      // Extract document number
      if (dniPattern.test(line)) {
        result.documentNumber = line.match(dniPattern)?.[0];
      } else if (niePattern.test(line)) {
        result.documentNumber = line.match(niePattern)?.[0];
      }
      
      // Extract birth date
      if (datePattern.test(line)) {
        const dateMatch = line.match(datePattern)?.[0];
        if (dateMatch) {
          // Convert to YYYY-MM-DD format
          const parts = dateMatch.split(/[\/\-\.]/);
          if (parts.length === 3) {
            result.birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }
      
      // Extract names (simplified approach)
      if (line.includes('NOMBRE') || line.includes('NAME')) {
        const nameMatch = line.replace(/NOMBRE|NAME/g, '').trim();
        if (nameMatch) {
          result.name = nameMatch.split(' ')[0];
        }
      }
      
      if (line.includes('APELLIDOS') || line.includes('SURNAME')) {
        const surnameMatch = line.replace(/APELLIDOS|SURNAME/g, '').trim();
        if (surnameMatch) {
          result.surname = surnameMatch;
        }
      }
    }

    return result;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const ocrService = new OCRService();
