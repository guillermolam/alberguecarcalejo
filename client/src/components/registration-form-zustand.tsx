import React, { Suspense, memo, useState, useEffect } from 'react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Lock, Unlock, CheckCircle, AlertTriangle } from 'lucide-react';
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
  
  // State for collapsible cards and OCR confidence
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [personalInfoCollapsed, setPersonalInfoCollapsed] = useState(false);
  const [addressInfoCollapsed, setAddressInfoCollapsed] = useState(false);
  
  // State for field locks (individual field overrides)
  const [fieldLocks, setFieldLocks] = useState<Record<string, boolean>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Helper functions for field management
  const toggleFieldLock = (fieldName: string) => {
    setFieldLocks(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const isFieldReadOnly = (fieldName: string): boolean => {
    // Field is read-only if OCR confidence is high AND field has value AND not manually unlocked
    const hasValue = Boolean(formData[fieldName as keyof RegistrationFormData]);
    const isUnlocked = fieldLocks[fieldName];
    return hasDocumentProcessed && ocrConfidence >= 0.9 && hasValue && !isUnlocked;
  };

  const isFieldEmpty = (fieldName: string): boolean => {
    return !formData[fieldName as keyof RegistrationFormData];
  };

  const getCardIcon = (confidence: number) => {
    if (confidence >= 0.9) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else {
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const shouldCollapseCard = (confidence: number): boolean => {
    return hasDocumentProcessed && confidence >= 0.9;
  };

  // Component for input fields with lock/unlock functionality
  const LockableInput = ({ 
    fieldName, 
    label, 
    type = "text",
    required = false,
    maxLength,
    className = "",
    children
  }: {
    fieldName: string;
    label: string;
    type?: string;
    required?: boolean;
    maxLength?: number;
    className?: string;
    children?: React.ReactNode;
  }) => {
    const isReadOnly = isFieldReadOnly(fieldName);
    const isEmpty = isFieldEmpty(fieldName);
    const isLocked = fieldLocks[fieldName];
    
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium">
            {label} {required && '*'}
          </label>
          {hasDocumentProcessed && !isEmpty && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleFieldLock(fieldName)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              {isLocked ? (
                <Unlock className="w-3 h-3 text-blue-600" />
              ) : (
                <Lock className="w-3 h-3 text-gray-600" />
              )}
            </Button>
          )}
        </div>
        {children ? (
          children
        ) : (
          <Input
            type={type}
            value={formData[fieldName as keyof RegistrationFormData] || ''}
            onChange={(e) => updateField(fieldName, e.target.value)}
            maxLength={maxLength}
            readOnly={isReadOnly}
            className={`${className} ${isReadOnly ? 'bg-gray-50 text-gray-700' : ''} ${
              showValidation && validationErrors[fieldName] ? 'border-red-500' : ''
            }`}
            lang={type === 'date' ? t('general.locale_code') : undefined}
          />
        )}
        {showValidation && validationErrors[fieldName] && (
          <p className="text-red-500 text-xs mt-1">{validationErrors[fieldName]}</p>
        )}
      </div>
    );
  };

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
    
    // Calculate average confidence from available OCR results
    const confidences = [];
    if (front?.confidence) confidences.push(front.confidence);
    if (back?.confidence) confidences.push(back.confidence);
    const avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
    setOcrConfidence(avgConfidence);

    if (front?.extractedData || back?.extractedData) {
      const data = { ...front?.extractedData, ...back?.extractedData };
      console.log('=== MERGED OCR EXTRACTED DATA ===');
      console.log('Combined OCR data:', JSON.stringify(data, null, 2));

      // Use Zustand's populateFromOCR function
      populateFromOCR(data);
      
      // Update card collapse states based on confidence
      const shouldCollapse = shouldCollapseCard(avgConfidence);
      setPersonalInfoCollapsed(shouldCollapse);
      setAddressInfoCollapsed(shouldCollapse);

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
          <Collapsible open={!personalInfoCollapsed} onOpenChange={setPersonalInfoCollapsed}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {hasDocumentProcessed && getCardIcon(ocrConfidence)}
                      {t('registration.personal_info')}
                    </div>
                    {personalInfoCollapsed ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronUp className="w-5 h-5" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <LockableInput
                  fieldName="firstName"
                  label={t('registration.first_name')}
                  required={true}
                  maxLength={50}
                />
                
                <LockableInput
                  fieldName="lastName1"
                  label={t('registration.last_name_1')}
                  required={true}
                  maxLength={50}
                />
                
                <LockableInput
                  fieldName="lastName2"
                  label={t('registration.last_name_2')}
                  maxLength={50}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LockableInput
                  fieldName="birthDate"
                  label={t('registration.birth_date')}
                  type="date"
                  required={true}
                />

                <LockableInput
                  fieldName="gender"
                  label={t('registration.gender')}
                  required={true}
                >
                  <Select value={formData.gender || ''} onValueChange={(value) => updateField('gender', value)} disabled={isFieldReadOnly('gender')}>
                    <SelectTrigger className={`${isFieldReadOnly('gender') ? 'bg-gray-50 text-gray-700' : ''} ${showValidation && validationErrors.gender ? 'border-red-500' : ''}`}>
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
                </LockableInput>

                <LockableInput
                  fieldName="nationality"
                  label={t('registration.nationality')}
                  required={true}
                  maxLength={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LockableInput
                  fieldName="documentType"
                  label={t('registration.document_type')}
                  required={true}
                >
                  <Select value={selectedDocumentType} onValueChange={handleDocumentTypeChange} disabled={isFieldReadOnly('documentType')}>
                    <SelectTrigger className={`${isFieldReadOnly('documentType') ? 'bg-gray-50 text-gray-700' : ''}`}>
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
                </LockableInput>

                <LockableInput
                  fieldName="documentNumber"
                  label={t('registration.document_number')}
                  required={true}
                  maxLength={20}
                />
              </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Address Information */}
          <Collapsible open={!addressInfoCollapsed} onOpenChange={setAddressInfoCollapsed}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {hasDocumentProcessed && getCardIcon(ocrConfidence)}
                      {t('registration.address_info')}
                    </div>
                    {addressInfoCollapsed ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronUp className="w-5 h-5" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LockableInput
                  fieldName="addressStreet"
                  label={t('registration.address')}
                  required={true}
                >
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
                    disabled={isFieldReadOnly('addressStreet')}
                  />
                </LockableInput>

                <LockableInput
                  fieldName="addressCity"
                  label={t('registration.city')}
                  required={true}
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LockableInput
                  fieldName="addressPostalCode"
                  label={t('registration.postal_code')}
                  maxLength={10}
                />

                <LockableInput
                  fieldName="addressCountry"
                  label={t('registration.country')}
                  required={true}
                  maxLength={100}
                />
              </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

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