import React, { Suspense, memo, useState, useEffect, useRef, useCallback } from 'react';
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
import { CountrySelector } from './country-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Lock, Unlock, CheckCircle, AlertTriangle, User, MapPin, Phone, CreditCard, Pencil, Coins } from 'lucide-react';
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
  
  // Simple state for tracking which fields have been focused
  const [focusedFields, setFocusedFields] = useState<Set<string>>(new Set());
  
  // State for field locking system (lockable fields)
  const [fieldLocks, setFieldLocks] = useState<Record<string, boolean>>({});
  
  // Refs for input fields
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Set default document type based on browser language
  useEffect(() => {
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    const isSpanish = browserLang.toLowerCase().startsWith('es');
    const defaultDocType = isSpanish ? 'NIF' : 'Passport';
    
    if (!formData.documentType) {
      console.log('Setting default document type based on browser language:', browserLang, '->', defaultDocType);
      updateField('documentType', defaultDocType);
      setSelectedDocumentType(defaultDocType);
    }
  }, [formData.documentType, updateField, setSelectedDocumentType]);

  // Helper functions for field management
  const toggleFieldLock = (fieldName: string) => {
    console.log('=== TOGGLE FIELD LOCK ===');
    console.log('Field:', fieldName);
    console.log('Current locks:', fieldLocks);
    console.log('Current lock state for field:', fieldLocks[fieldName]);
    
    setFieldLocks(prev => {
      const newLocks = {
        ...prev,
        [fieldName]: !prev[fieldName]
      };
      console.log('New locks state:', newLocks);
      
      // If we're unlocking the field, focus it after a short delay
      if (!prev[fieldName]) {
        setTimeout(() => {
          const inputEl = inputRefs.current[fieldName];
          if (inputEl) {
            inputEl.focus();
            inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
            console.log(`Field ${fieldName} focused after unlock`);
          }
        }, 100);
      }
      
      return newLocks;
    });
  };

  const isFieldReadOnly = (fieldName: string): boolean => {
    // Field is read-only if it has meaningful content (>3 chars) AND not manually unlocked
    const fieldValue = formData[fieldName as keyof RegistrationFormData] || '';
    const hasSignificantValue = fieldValue.toString().length >= 3;
    const isUnlocked = fieldLocks[fieldName];
    const readOnly = hasDocumentProcessed && hasSignificantValue && !isUnlocked;
    
    console.log(`=== isFieldReadOnly(${fieldName}) ===`);
    console.log('fieldValue:', fieldValue);
    console.log('hasSignificantValue:', hasSignificantValue);
    console.log('isUnlocked:', isUnlocked);
    console.log('hasDocumentProcessed:', hasDocumentProcessed);
    console.log('final readOnly:', readOnly);
    
    return readOnly;
  };

  const isFieldEmpty = (fieldName: string): boolean => {
    const fieldValue = formData[fieldName as keyof RegistrationFormData] || '';
    return fieldValue.toString().length < 3;
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



  // Clear low confidence warning when field is focused
  const handleFieldFocus = (fieldName: string) => {
    setFocusedFields(prev => new Set(Array.from(prev).concat([fieldName])));
  };

  // Component for input fields with embedded edit button
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
    const inputRef = useRef<HTMLInputElement>(null);
    const isReadOnly = isFieldReadOnly(fieldName);
    const isEmpty = isFieldEmpty(fieldName);
    const isLocked = fieldLocks[fieldName];
    const hasError = showValidation && validationErrors[fieldName];
    const hasBeenFocused = focusedFields.has(fieldName);
    const isLowConfidence = hasDocumentProcessed && ocrConfidence < 0.9 && !isEmpty && !hasBeenFocused;
    
    // Set up ref for this input
    const setInputRef = useCallback((el: HTMLInputElement | null) => {
      inputRefs.current[fieldName] = el;
      // Note: inputRef is readonly, no assignment needed
    }, [fieldName]);
    
    // Determine label and border color based on field state
    const getLabelColor = () => {
      if (hasError) return 'text-red-600'; // Missing/invalid field = red
      if (isLowConfidence) return 'text-orange-600'; // Low confidence = orange
      return 'text-gray-900'; // Normal = dark gray
    };
    
    const getBorderColor = () => {
      if (hasError) return 'border-red-500'; // Missing/invalid field = red border
      if (isLowConfidence) return 'border-orange-400'; // Low confidence = orange border
      return ''; // Normal border
    };
    
    return (
      <div>
        <label className={`text-sm font-medium ${getLabelColor()} block mb-1`}>
          {label} {required && '*'}
        </label>
        {children ? (
          children
        ) : (
          <div className="relative">
            {isReadOnly ? (
              // Read-only display mode - completely separate from Input
              <div
                className={`${className} ${getBorderColor()} ${hasDocumentProcessed && !isEmpty ? 'pr-10' : ''} bg-gray-50 text-gray-700 cursor-pointer flex items-center min-h-10 px-3 py-2 rounded-md border border-input`}
                onClick={() => {
                  console.log(`=== Clicking to unlock ${fieldName} ===`);
                  toggleFieldLock(fieldName);
                }}
              >
                {formData[fieldName as keyof RegistrationFormData] || ''}
              </div>
            ) : (
              // Fully editable Input mode - no readOnly attributes at all
              <Input
                ref={setInputRef}
                type={type}
                value={formData[fieldName as keyof RegistrationFormData] || ''}
                onChange={(e) => updateField(fieldName as keyof RegistrationFormData, e.target.value)}
                onFocus={() => {
                  console.log(`=== onFocus EDITABLE ${fieldName} ===`);
                  handleFieldFocus(fieldName);
                }}
                maxLength={maxLength}
                className={`${className} ${getBorderColor()} ${hasDocumentProcessed && !isEmpty ? 'pr-10' : ''} bg-white text-black`}
                lang={type === 'date' ? t('general.locale_code') : undefined}
                placeholder={label}
                inputMode={type === 'date' ? 'numeric' : 'text'}
              />
            )}
            {hasDocumentProcessed && !isEmpty && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  console.log(`=== PENCIL BUTTON CLICKED for ${fieldName} ===`);
                  toggleFieldLock(fieldName);
                  handleFieldFocus(fieldName);
                }}
                onMouseEnter={() => handleFieldFocus(fieldName)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-md"
                title={isReadOnly ? "Click to edit this field" : "Field is editable"}
              >
                <Pencil className={`w-4 h-4 ${isReadOnly ? 'text-blue-600' : 'text-green-600'}`} />
              </Button>
            )}
          </div>
        )}
        {hasError && (
          <p className="text-red-500 text-xs mt-1">{validationErrors[fieldName]}</p>
        )}
        {!hasError && isLowConfidence && (
          <p className="text-orange-600 text-xs mt-1">Low confidence - please verify</p>
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

      // Check for document expiry before populating form
      if (data.expiryDate) {
        // Parse the date - OCR typically returns DD/MM/YYYY format
        let expiryDate: Date;
        if (data.expiryDate.includes('/')) {
          const [day, month, year] = data.expiryDate.split('/');
          expiryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          expiryDate = new Date(data.expiryDate);
        }
        
        const today = new Date();
        
        if (expiryDate < today) {
          toast({
            title: t('validation.document_expired'),
            description: t('validation.document_expired_desc'),
            variant: "destructive",
          });
          setOcrProcessing(false);
          return; // Don't populate the form if document is expired
        }
      }

      // Use Zustand's populateFromOCR function
      populateFromOCR(data);
      
      // Update card collapse states based on confidence - collapse when confidence is HIGH
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
      'documentType': t('validation.document_type_required'),
      'gender': t('validation.gender_required'),
      'nationality': t('validation.nationality_required'),
      'phone': t('validation.phone_required'),
      'email': t('validation.email_invalid'),
      'addressCountry': t('validation.country_required'),
      'addressStreet': t('validation.address_required'),
      'addressCity': t('validation.city_required'),
      'addressPostalCode': t('validation.postal_code_required'),
      'paymentType': t('validation.payment_type_required')
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
      
      // Create detailed error list
      const errorList = Object.entries(validation.errors)
        .map(([field, message]) => `• ${message}`)
        .join('\n');
      
      toast({
        title: t('registration.validation_error'),
        description: `${t('registration.fix_errors')}\n${errorList}`,
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
      
      queryClient.invalidateQueries({ queryKey: ['api/dashboard'] });
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
          {/* Document Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                {t('registration.document_type')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">
                    {t('registration.document_type')} *
                  </label>
                  <Select 
                    value={formData.documentType || ''} 
                    onValueChange={(value) => {
                      updateField('documentType', value);
                      setSelectedDocumentType(value);
                      handleFieldFocus('documentType');
                    }}
                  >
                    <SelectTrigger className={`${showValidation && validationErrors.documentType ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder={t('registration.select_document_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(type.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidation && validationErrors.documentType && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.documentType}</p>
                  )}
                </div>
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">{t('registration.document_info_title')}</p>
                  <p>{t('registration.document_info_text')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Capture */}
          <Suspense fallback={<Alert><AlertDescription>{t('loading.processing')}</AlertDescription></Alert>}>
            <MultiDocumentCapture 
              onDocumentProcessed={handleDocumentProcessed} 
              onDocumentTypeChange={handleDocumentTypeChange}
              selectedDocumentType={selectedDocumentType}
            />
          </Suspense>
          
          {hasDocumentProcessed && (
            <Alert className="border-green-500 bg-green-50">
              <AlertDescription className="text-green-700">
                {t('registration.ocr_success')}
              </AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          {hasDocumentProcessed && (
            <Collapsible open={!personalInfoCollapsed} onOpenChange={(open) => setPersonalInfoCollapsed(!open)}>
              <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
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
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.first_name')} *
                  </label>
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
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.last_name_1')} *
                  </label>
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
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.last_name_2')}
                  </label>
                  <Input
                    value={formData.lastName2 || ''}
                    onChange={(e) => updateField('lastName2', e.target.value)}
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.birth_date')} *
                  </label>
                  <Input
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => updateField('birthDate', e.target.value)}
                    className={showValidation && validationErrors.birthDate ? 'border-red-500' : ''}
                  />
                  {showValidation && validationErrors.birthDate && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.birthDate}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.gender')} *
                  </label>
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
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.nationality')} *
                  </label>
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
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.document_number')} *
                  </label>
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

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.document_support')}
                  </label>
                  <Input
                    value={formData.documentSupport || ''}
                    onChange={(e) => updateField('documentSupport', e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
            </Collapsible>
          )}

          {/* Address Information */}
          {hasDocumentProcessed && (
            <Collapsible open={!addressInfoCollapsed} onOpenChange={(open) => setAddressInfoCollapsed(!open)}>
              <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
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
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.address')} *
                  </label>
                  <GooglePlacesAutocomplete
                    value={formData.addressStreet || ''}
                    onChange={(address) => updateField('addressStreet', address)}
                    onPlaceSelected={(place) => {
                      if (place.formattedAddress) {
                        updateField('addressStreet', place.formattedAddress);
                      }
                      // Extract address components
                      if (place.addressComponents) {
                        place.addressComponents.forEach((component: any) => {
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
                    className={showValidation && validationErrors.addressStreet ? 'border-red-500' : ''}
                  />
                  {showValidation && validationErrors.addressStreet && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.addressStreet}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.city')} *
                  </label>
                  <Input
                    value={formData.addressCity || ''}
                    onChange={(e) => updateField('addressCity', e.target.value)}
                    maxLength={100}
                    className={showValidation && validationErrors.addressCity ? 'border-red-500' : ''}
                  />
                  {showValidation && validationErrors.addressCity && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.addressCity}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.postal_code')}
                  </label>
                  <Input
                    value={formData.addressPostalCode || ''}
                    onChange={(e) => updateField('addressPostalCode', e.target.value)}
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.country')} *
                  </label>
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
              </CollapsibleContent>
            </Card>
            </Collapsible>
          )}

          {/* Contact Information */}
          {hasDocumentProcessed && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-orange-600" />
                  {t('registration.contact_info')}
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('registration.country')} *</label>
                  <CountrySelector
                    value={detectedCountryCode}
                    onCountryChange={(country) => {
                      setDetectedCountryCode(country.code);
                      setPhoneFormat(country.phoneCode);
                      updateField('addressCountry', country.name);
                      updateField('nationality', country.code);
                    }}
                    placeholder={t('registration.select_country')}
                  />
                </div>
                
                <div className="grid grid-cols-5 gap-2">

                  <div className="col-span-3">
                    <label className="text-sm font-medium">{t('registration.phone')} *</label>
                    <Input 
                      value={formData.phone || ''}
                      onChange={(e) => {
                        // Only allow numerical characters
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        updateField('phone', numericValue);
                      }}
                      type="tel"
                      placeholder="123456789"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      className={showValidation && validationErrors.phone ? 'border-red-500' : ''}
                    />
                    {showValidation && validationErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-1 block">
                    {t('registration.email')} *
                  </label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    maxLength={100}
                    className={showValidation && validationErrors.email ? 'border-red-500' : ''}
                  />
                  {showValidation && validationErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                {t('registration.payment_info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('registration.payment_type')} *</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => updateField('paymentType', 'tarjeta')}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                      formData.paymentType === 'tarjeta'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title="Pay with Visa or Mastercard credit/debit card"
                  >
                    <div className="flex space-x-1">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Former_Visa_%28company%29_logo.svg/330px-Former_Visa_%28company%29_logo.svg.png" 
                        alt="Visa" 
                        className="h-6 w-auto"
                        title="Visa credit/debit cards accepted"
                      />
                      <img 
                        src="https://brand.mastercard.com/content/dam/mccom/brandcenter/thumbnails/mastercard_circles_92px_2x.png" 
                        alt="Mastercard" 
                        className="h-6 w-auto"
                        title="Mastercard credit/debit cards accepted"
                      />
                    </div>
                    <span className="text-sm font-medium">Credit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField('paymentType', 'efect')}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                      formData.paymentType === 'efect'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title="Pay with cash at reception"
                  >
                    <Coins className="w-6 h-6" />
                    <span className="text-sm font-medium">Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField('paymentType', 'bizum')}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                      formData.paymentType === 'bizum'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title="Pay instantly with Bizum mobile payment"
                  >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/2/2b/Bizum.svg" 
                      alt="Bizum" 
                      className="h-6 w-auto"
                      title="Bizum instant mobile payments"
                    />
                    <span className="text-sm font-medium">Bizum</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField('paymentType', 'transferencia')}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                      formData.paymentType === 'transferencia'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title="Pay via bank transfer or wire transfer"
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-sm font-medium">Bank Transfer</span>
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>{t('pricing.total')}: €{(stayData.nights * 15).toFixed(2)}</p>
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