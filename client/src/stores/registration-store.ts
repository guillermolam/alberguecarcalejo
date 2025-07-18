import { create } from 'zustand';

export interface RegistrationFormData {
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
  phone?: string;
  email?: string;
  paymentType?: string;
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
    if (ocrData.birthDate) {
      updates.birthDate = ocrData.birthDate;
      console.log('Setting birthDate:', updates.birthDate);
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