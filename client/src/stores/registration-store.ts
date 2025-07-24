import { create } from 'zustand';

export interface RegistrationFormData {
  firstName?: string;
  lastName1?: string;
  lastName2?: string;
  documentNumber?: string;
  documentType?: string;
  documentSupport?: string;
  expiryDate?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  addressProvince?: string;
  phone?: string;
  email?: string;
  paymentType?: string;
  notes?: string;
}

interface RegistrationState {
  formData: RegistrationFormData;
  isOcrProcessing: boolean;
  hasDocumentProcessed: boolean;
  selectedDocumentType: string;
  detectedCountryCode: string;
  phoneFormat: string;
  
  // Actions
  updateField: (field: keyof RegistrationFormData, value: string) => void;
  updateFormData: (data: Partial<RegistrationFormData>) => void;
  setOcrProcessing: (processing: boolean) => void;
  setDocumentProcessed: (processed: boolean) => void;
  setSelectedDocumentType: (type: string) => void;
  setDetectedCountryCode: (code: string) => void;
  setPhoneFormat: (format: string) => void;
  resetForm: () => void;
  populateFromOCR: (ocrData: Partial<RegistrationFormData>) => void;
}

const initialState: RegistrationFormData = {
  firstName: '',
  lastName1: '',
  lastName2: '',
  documentNumber: '',
  documentType: 'NIF',
  documentSupport: '',
  expiryDate: '',
  birthDate: '',
  gender: '',
  nationality: '',
  addressStreet: '',
  addressCity: '',
  addressPostalCode: '',
  addressCountry: '',
  addressProvince: '',
  phone: '',
  email: '',
  paymentType: 'efect',
  notes: '',
};

export const useRegistrationStore = create<RegistrationState>((set, get) => ({
  formData: { ...initialState },
  isOcrProcessing: false,
  hasDocumentProcessed: false,
  selectedDocumentType: 'NIF',
  detectedCountryCode: 'ESP',
  phoneFormat: '+34',

  updateField: (field, value) => {
    console.log(`Zustand: Updating ${field} to:`, value);
    set((state) => ({
      formData: {
        ...state.formData,
        [field]: value
      }
    }));
    console.log(`Zustand: Field ${field} updated. New value:`, get().formData[field]);
  },

  updateFormData: (data) => {
    console.log('Zustand: Batch updating form data:', data);
    set((state) => ({
      formData: {
        ...state.formData,
        ...data
      }
    }));
    console.log('Zustand: New form data after batch update:', get().formData);
  },

  setOcrProcessing: (processing) => {
    console.log('Zustand: Setting OCR processing:', processing);
    set({ isOcrProcessing: processing });
  },

  setDocumentProcessed: (processed) => {
    console.log('Zustand: Setting document processed:', processed);
    set({ hasDocumentProcessed: processed });
  },

  setSelectedDocumentType: (type) => {
    console.log('Zustand: Setting document type:', type);
    set({ selectedDocumentType: type });
  },

  setDetectedCountryCode: (code) => {
    console.log('Zustand: Setting country code:', code);
    set({ detectedCountryCode: code });
  },

  setPhoneFormat: (format) => {
    console.log('Zustand: Setting phone format:', format);
    set({ phoneFormat: format });
  },

  resetForm: () => {
    console.log('Zustand: Resetting form');
    set({
      formData: { ...initialState },
      isOcrProcessing: false,
      hasDocumentProcessed: false,
      selectedDocumentType: 'NIF',
      detectedCountryCode: 'ESP',
      phoneFormat: '+34',
    });
  },

  populateFromOCR: (ocrData) => {
    console.log('=== ZUSTAND OCR POPULATION ===');
    console.log('OCR data to populate:', ocrData);
    
    const updates: Partial<RegistrationFormData> = {};
    
    if (ocrData.firstName) {
      updates.firstName = ocrData.firstName.toUpperCase();
      console.log('Setting firstName:', updates.firstName);
    }
    if (ocrData.lastName1) {
      updates.lastName1 = ocrData.lastName1.toUpperCase();
      console.log('Setting lastName1:', updates.lastName1);
    }
    if (ocrData.lastName2) {
      updates.lastName2 = ocrData.lastName2.toUpperCase();
      console.log('Setting lastName2:', updates.lastName2);
    }
    if (ocrData.documentNumber) {
      updates.documentNumber = ocrData.documentNumber;
      console.log('Setting documentNumber:', updates.documentNumber);
    }
    if (ocrData.documentType) {
      updates.documentType = ocrData.documentType;
      console.log('Setting documentType:', updates.documentType);
    }
    if (ocrData.documentSupport) {
      updates.documentSupport = ocrData.documentSupport;
      console.log('Setting documentSupport:', updates.documentSupport);
    }
    if (ocrData.expiryDate) {
      updates.expiryDate = ocrData.expiryDate;
      console.log('Setting expiryDate:', updates.expiryDate);
    }
    if (ocrData.birthDate) {
      // Handle different birth date formats from OCR
      let formattedDate = '';
      
      // Check if it looks like DD/MM/YYYY or DD/MM/YY
      if (ocrData.birthDate.includes('/')) {
        const dateParts = ocrData.birthDate.split('/');
        if (dateParts.length === 3) {
          let [part1, part2, part3] = dateParts;
          
          // If first part is > 31, it might be YY/MM/DD format
          if (parseInt(part1) > 31) {
            // Assume YY/MM/DD format (like 76/10/19 for October 19, 1976)
            let year = part1;
            let month = part2;
            let day = part3;
            
            // Handle 4-digit years like "1951" which should be truncated to last 2 digits for day
            if (part3.length === 4) {
              day = part3.slice(-2); // Take last 2 digits as day
              console.log('Truncated 4-digit day part from', part3, 'to', day);
            }
            
            // Handle 2-digit years
            if (year.length === 2) {
              const yearNum = parseInt(year);
              if (yearNum <= 50) {
                year = `20${year}`;
              } else {
                year = `19${year}`;
              }
            }
            
            const dayNum = parseInt(day);
            const monthNum = parseInt(month);
            
            console.log('YY/MM/DD parsing result:', { year, month, day, dayNum, monthNum });
            
            if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
              formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              console.log('Formatted YY/MM/DD date:', formattedDate);
            }
          } else {
            // Assume DD/MM/YYYY or DD/MM/YY format
            let day = part1;
            let month = part2;
            let year = part3;
            
            // Handle 2-digit years
            if (year.length === 2) {
              const yearNum = parseInt(year);
              if (yearNum <= 50) {
                year = `20${year}`;
              } else {
                year = `19${year}`;
              }
            }
            
            const dayNum = parseInt(day);
            const monthNum = parseInt(month);
            
            if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
              formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          }
        }
      }
      
      if (formattedDate) {
        updates.birthDate = formattedDate;
        console.log('Converting birth date from', ocrData.birthDate, 'to', formattedDate);
      } else {
        console.log('Unable to parse birth date format:', ocrData.birthDate);
        // Don't set invalid date
      }
    }
    if (ocrData.gender) {
      updates.gender = ocrData.gender;
      console.log('Setting gender:', updates.gender);
    }
    if (ocrData.nationality) {
      updates.nationality = ocrData.nationality;
      console.log('Setting nationality:', updates.nationality);
    }
    if (ocrData.addressStreet) {
      updates.addressStreet = ocrData.addressStreet;
      console.log('Setting addressStreet:', updates.addressStreet);
    }
    if (ocrData.addressCity) {
      updates.addressCity = ocrData.addressCity;
      console.log('Setting addressCity:', updates.addressCity);
    }
    if (ocrData.addressPostalCode) {
      updates.addressPostalCode = ocrData.addressPostalCode;
      console.log('Setting addressPostalCode:', updates.addressPostalCode);
    }
    if (ocrData.addressCountry) {
      updates.addressCountry = ocrData.addressCountry;
      console.log('Setting addressCountry:', updates.addressCountry);
    }

    console.log('All updates to apply:', updates);

    set((state) => ({
      formData: {
        ...state.formData,
        ...updates
      }
    }));

    const finalData = get().formData;
    console.log('=== FINAL ZUSTAND STATE AFTER OCR ===');
    console.log('firstName:', finalData.firstName);
    console.log('lastName1:', finalData.lastName1);
    console.log('lastName2:', finalData.lastName2);
    console.log('documentNumber:', finalData.documentNumber);
    console.log('Complete form data:', finalData);
  }
}));