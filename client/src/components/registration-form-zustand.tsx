import React, { Suspense, memo, useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useRegistrationStore, type RegistrationFormData } from '@/stores/registration-store';
import { StayData } from './stay-info-form';
import { ComprehensiveOCRResult } from '@/lib/enhanced-ocr';
import { createRegistrationSchema } from '@/lib/validation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/i18n-context';
import { RegistrationStepper } from './registration-stepper';
import MultiDocumentCapture from './multi-document-capture-new';
import { CountryPhoneInput } from './country-phone-input';
import { GooglePlacesAutocomplete } from './google-places-autocomplete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GENDER_OPTIONS, DOCUMENT_TYPES, PAYMENT_TYPES } from '@/lib/constants';

// Import constants for country code lookup
const getCountryCode = (countryName: string): string => {
  const countryMap: Record<string, string> = {
    'Spain': 'ESP',
    'España': 'ESP',
    'France': 'FRA',
    'Francia': 'FRA',
    'Portugal': 'PRT',
    'Italy': 'ITA',
    'Italia': 'ITA',
    'Germany': 'DEU',
    'Alemania': 'DEU'
  };
  return countryMap[countryName] || 'ESP';
};

interface RegistrationFormProps {
  stayData: StayData;
  onBack: () => void;
  onSuccess: () => void;
}

export const RegistrationFormZustand: React.FC<RegistrationFormProps> = memo(({ stayData, onBack, onSuccess }) => {
  const { t } = useI18n();
  const {
    formData,
    isOcrProcessing,
    hasDocumentProcessed,
    selectedDocumentType,
    detectedCountryCode,
    phoneFormat,
    updateField,
    setOcrProcessing,
    setDocumentProcessed,
    setSelectedDocumentType,
    setDetectedCountryCode,
    setPhoneFormat,
    populateFromOCR
  } = useRegistrationStore();

  // State for validation display only (Zustand handles form data)
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Handle document type change
  const handleDocumentTypeChange = (documentType: string) => {
    console.log('Document type changed to:', documentType);
    setSelectedDocumentType(documentType);
    updateField('documentType', documentType);
    
    // Set defaults for Spanish documents
    if (documentType === 'NIF' || documentType === 'NIE') {
      setDetectedCountryCode("ESP");
      setPhoneFormat("+34");
      updateField('addressCountry', 'Spain');
      updateField('nationality', 'ESP');
    }
  };

  // Handle OCR results - NO VALIDATION ON UPLOAD
  const handleDocumentProcessed = (result: any) => {
    console.log('=== ZUSTAND OCR PROCESSING ===');
    console.log('Raw OCR result received:', result);
    setOcrProcessing(true);
    
    // Clear any existing validation when document is processed
    setShowValidation(false);
    setValidationErrors({});
    
    const { frontOCR: front, backOCR: back, documentType } = result;
    console.log('Front OCR data:', front);
    console.log('Back OCR data:', back);

    if (front?.extractedData || back?.extractedData) {
      const data = { ...front?.extractedData, ...back?.extractedData };
      console.log('=== MERGED OCR EXTRACTED DATA ===');
      console.log('Combined OCR data:', JSON.stringify(data, null, 2));

      // Use Zustand's populateFromOCR function
      populateFromOCR(data);

      // Handle country code detection
      if (data.addressCountry) {
        const countryCode = getCountryCode(data.addressCountry);
        setDetectedCountryCode(countryCode);
      }

      // Handle document type update
      if (data.documentType) {
        setSelectedDocumentType(data.documentType);
      }

      setDocumentProcessed(true);
      
      setTimeout(() => {
        console.log('=== OCR PROCESSING COMPLETE ===');
        setOcrProcessing(false);
      }, 500);
    } else {
      console.log('=== NO OCR DATA EXTRACTED ===');
      console.log('Front OCR result:', front);
      console.log('Back OCR result:', back);
      setOcrProcessing(false);
    }
  };

  // Translate validation errors to current language
  const translateValidationError = (field: string, message: string): string => {
    const errorMap: Record<string, string> = {
      'firstName': t('validation.first_name_required'),
      'lastName1': t('validation.last_name_required'),
      'birthDate': t('validation.birth_date_required'),
      'documentNumber': t('validation.document_number_required'),
      'gender': t('validation.gender_required'),
      'nationality': t('validation.nationality_required'),
      'phone': t('validation.phone_required'),
      'addressCountry': t('validation.country_required')
    };
    
    return errorMap[field] || message;
  };

  // Validate form only on submit
  const validateForm = () => {
    try {
      const schema = createRegistrationSchema();
      schema.parse(formData);
      return { success: true, errors: {} };
    } catch (error: any) {
      console.log('Form validation errors:', error);
      const fieldErrors: Record<string, string> = {};
      
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path?.[0];
          if (field) {
            fieldErrors[field] = translateValidationError(field, err.message);
          }
        });
      }
      
      return { success: false, errors: fieldErrors };
    }
  };

  // Submit form - ONLY VALIDATE ON FINAL SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('FINAL FORM SUBMISSION - Completar Registro clicked');
    
    // Only now validate the form
    const validation = validateForm();
    setValidationErrors(validation.errors);
    setShowValidation(true);
    
    if (!validation.success) {
      console.log('Form validation failed on final submit:', validation.errors);
      toast({
        title: t('registration.validation_error'),
        description: t('registration.fix_errors'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = { pilgrim: formData, booking: stayData };
      console.log('Submitting registration:', payload);
      
      const result = await apiRequest('POST', '/api/registration', payload);
      
      toast({
        title: t('notifications.success'),
        description: t('registration.success_description'),
      });
      
      queryClient.invalidateQueries(['api/dashboard']);
      onSuccess();
    } catch (error: any) {
      console.error('Registration submission error:', error);
      toast({
        title: t('notifications.error'),
        description: error.message || t('registration.error_description'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={onBack} className="text-white">
            &larr; {t('registration.back')}
          </Button>
          <h1 className="flex-1 text-center text-2xl font-bold text-white">
            {t('registration.title')}
          </h1>
        </div>

        <RegistrationStepper currentStep={2} />

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Document Capture */}
          <Suspense fallback={<Alert><AlertDescription>{t('loading.processing')}</AlertDescription></Alert>}>
            <MultiDocumentCapture onDocumentProcessed={handleDocumentProcessed} />
          </Suspense>
          
          {hasDocumentProcessed && (
            <Alert className="border-green-500 bg-green-50">
              <AlertDescription className="text-green-700">
                {t('registration.ocr_success')}
              </AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('registration.personal_info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('registration.first_name')} *</label>
                  <Input 
                    value={formData.firstName || ''}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    maxLength={50}
                    className={showValidation && validationErrors.firstName ? 'border-red-500' : ''}
                  />
                  {showValidation && validationErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">{t('registration.last_name_1')} *</label>
                  <Input 
                    value={formData.lastName1 || ''}
                    onChange={(e) => updateField('lastName1', e.target.value)}
                    maxLength={50}
                    className={showValidation && validationErrors.lastName1 ? 'border-red-500' : ''}
                  />
                  {showValidation && validationErrors.lastName1 && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.lastName1}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">{t('registration.last_name_2')}</label>
                  <Input 
                    value={formData.lastName2 || ''}
                    onChange={(e) => updateField('lastName2', e.target.value)}
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('registration.birth_date')} *</label>
                  <Input 
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => updateField('birthDate', e.target.value)}
                    className={showValidation && validationErrors.birthDate ? 'border-red-500' : ''}
                    lang={t('general.locale_code')} // Set language for date picker
                  />
                  {showValidation && validationErrors.birthDate && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.birthDate}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">{t('registration.gender')} *</label>
                  <Select value={formData.gender || ''} onValueChange={(value) => updateField('gender', value)}>
                    <SelectTrigger className={showValidation && validationErrors.gender ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar género" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidation && validationErrors.gender && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.gender}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">{t('registration.nationality')} *</label>
                  <Input 
                    value={formData.nationality || ''}
                    onChange={(e) => updateField('nationality', e.target.value)}
                    maxLength={3}
                    className={showValidation && validationErrors.nationality ? 'border-red-500' : ''}
                  />
                  {showValidation && validationErrors.nationality && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.nationality}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('registration.document_type')} *</label>
                  <Select value={selectedDocumentType} onValueChange={handleDocumentTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(type.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">{t('registration.document_number')} *</label>
                  <Input 
                    value={formData.documentNumber || ''}
                    onChange={(e) => updateField('documentNumber', e.target.value)}
                    maxLength={20}
                    className={showValidation && validationErrors.documentNumber ? 'border-red-500' : ''}
                  />
                  {showValidation && validationErrors.documentNumber && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.documentNumber}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('registration.address_info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('registration.address')} *</label>
                  <GooglePlacesAutocomplete
                    value={formData.addressStreet || ''}
                    onChange={(address) => updateField('addressStreet', address)}
                    onPlaceSelected={(place) => {
                      if (place.formattedAddress) {
                        updateField('addressStreet', place.formattedAddress);
                      }
                      // Extract address components
                      if (place.addressComponents) {
                        place.addressComponents.forEach((component) => {
                          if (component.types.includes('locality')) {
                            updateField('addressCity', component.longName);
                          }
                          if (component.types.includes('postal_code')) {
                            updateField('addressPostalCode', component.longName);
                          }
                          if (component.types.includes('country')) {
                            updateField('addressCountry', component.longName);
                            setDetectedCountryCode(component.shortName || 'ESP');
                          }
                          if (component.types.includes('administrative_area_level_1')) {
                            updateField('addressProvince', component.longName);
                          }
                        });
                      }
                    }}
                    placeholder={t('registration.address')}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">{t('registration.city')} *</label>
                  <Input 
                    value={formData.addressCity || ''}
                    onChange={(e) => updateField('addressCity', e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('registration.postal_code')}</label>
                  <Input 
                    value={formData.addressPostalCode || ''}
                    onChange={(e) => updateField('addressPostalCode', e.target.value)}
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">{t('registration.country')} *</label>
                  <Input 
                    value={formData.addressCountry || ''}
                    onChange={(e) => updateField('addressCountry', e.target.value)}
                    maxLength={100}
                    className={showValidation && validationErrors.addressCountry ? 'border-red-500' : ''}
                  />
                  {showValidation && validationErrors.addressCountry && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.addressCountry}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('registration.contact_info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('registration.phone')} *</label>
                  <Input 
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+34 600 123 456"
                    className={showValidation && validationErrors.phone ? 'border-red-500' : ''}
                  />
                  {showValidation && validationErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">{t('registration.email')}</label>
                  <Input 
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('registration.payment_info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('registration.payment_type')} *</label>
                <Select value={formData.paymentType || 'efect'} onValueChange={(value) => updateField('paymentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {t(type.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-gray-600">
                <p>{t('pricing.total')}: €{(stayData.nights * (stayData.roomType === 'private' ? 35 : 15)).toFixed(2)}</p>
                <p>{t('pricing.payment_due')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Notice */}
          <Alert>
            <AlertDescription>
              {t('registration.compliance_text')}
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              {t('registration.back')}
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('loading.submitting') : t('registration.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});

RegistrationFormZustand.displayName = 'RegistrationFormZustand';
export default RegistrationFormZustand;