import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, ArrowLeft, Check, Camera, MapPin } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MultiDocumentCapture } from "./multi-document-capture-new";
import { StayData } from "./stay-info-form";
import { RegistrationStepper } from "./registration-stepper";
import { GooglePlacesAutocomplete } from "./google-places-autocomplete";
import { CountryPhoneInput } from "./country-phone-input";
import { COUNTRIES, DOCUMENT_TYPES, PAYMENT_TYPES, GENDER_OPTIONS, PRICE_PER_NIGHT } from "@/lib/constants";
import { useI18n } from "@/contexts/i18n-context";
import { ComprehensiveOCRResult } from "@/lib/enhanced-ocr";
import { createRegistrationSchema, getCountryCode, getCountryDialCode, validatePhoneForCountry, type RegistrationFormData } from "@/lib/validation";

interface RegistrationFormProps {
  stayData: StayData;
  onBack: () => void;
  onSuccess: () => void;
}

export function RegistrationFormNoValidation({ stayData, onBack, onSuccess }: RegistrationFormProps) {
  const [formData, setFormData] = useState<RegistrationFormData>({
    language: 'es',
    paymentType: "EFECT",
    addressCountry: 'Spain',
    firstName: '',
    lastName1: '',
    lastName2: '',
    documentType: 'NIF',
    documentNumber: '',
    documentSupport: 'físico',
    gender: 'h',
    nationality: 'ESP',
    birthDate: '',
    addressStreet: '',
    addressStreet2: '',
    addressCity: '',
    addressPostalCode: '',
    addressMunicipalityCode: '',
    phone: '',
    email: ''
  });

  const [hasDocumentProcessed, setHasDocumentProcessed] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("NIF");
  const [detectedCountryCode, setDetectedCountryCode] = useState("ESP");
  const [phoneFormat, setPhoneFormat] = useState("+34");
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [forceRerender, setForceRerender] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  // Update form field without validation - ensures immediate re-render
  const updateField = (fieldName: keyof RegistrationFormData, value: any) => {
    console.log(`Updating field ${fieldName} with value:`, value);
    setFormData(prev => {
      const newData = {
        ...prev,
        [fieldName]: value
      };
      console.log(`State updated for ${fieldName}:`, newData[fieldName]);
      return newData;
    });
    // Force re-render to ensure UI updates immediately
    setForceRerender(prev => prev + 1);
  };

  // Handle document type change
  const handleDocumentTypeChange = (documentType: string) => {
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

  // Handle OCR results
  const handleDocumentProcessed = (result: any) => {
    console.log('=== STARTING OCR PROCESSING - NO VALIDATION DURING PROCESSING ===');
    console.log('Raw OCR result received:', result);
    setIsProcessingOCR(true);
    
    const { frontOCR: front, backOCR: back, documentType } = result;
    console.log('Front OCR data:', front);
    console.log('Back OCR data:', back);

    if (front?.extractedData || back?.extractedData) {
      const data = { ...front?.extractedData, ...back?.extractedData };
      console.log('=== MERGED OCR EXTRACTED DATA ===');
      console.log('Combined OCR data:', JSON.stringify(data, null, 2));
      console.log('Individual fields:');
      console.log('firstName:', data.firstName);
      console.log('lastName1:', data.lastName1);
      console.log('lastName2:', data.lastName2);
      console.log('documentNumber:', data.documentNumber);

      // Batch update all form fields to trigger single re-render
      const updates: Partial<RegistrationFormData> = {};
      if (data.firstName) updates.firstName = data.firstName.toUpperCase();
      if (data.lastName1) updates.lastName1 = data.lastName1.toUpperCase();
      if (data.lastName2) updates.lastName2 = data.lastName2.toUpperCase();
      if (data.documentNumber) updates.documentNumber = data.documentNumber;
      if (data.documentType) {
        updates.documentType = data.documentType;
        setSelectedDocumentType(data.documentType);
      }
      if (data.documentSupport) updates.documentSupport = data.documentSupport;
      if (data.birthDate) updates.birthDate = data.birthDate;
      if (data.gender) updates.gender = data.gender;
      if (data.nationality) updates.nationality = data.nationality;
      if (data.addressStreet) updates.addressStreet = data.addressStreet;
      if (data.addressCity) updates.addressCity = data.addressCity;
      if (data.addressPostalCode) updates.addressPostalCode = data.addressPostalCode;
      if (data.addressCountry) {
        updates.addressCountry = data.addressCountry;
        const countryCode = getCountryCode(data.addressCountry);
        setDetectedCountryCode(countryCode);
      }

      // Apply all updates in a single state change to trigger re-render
      console.log('=== APPLYING FORM UPDATES ===');
      console.log('Updates to apply:', updates);
      
      setFormData(prev => {
        const newData = { ...prev, ...updates };
        console.log('Previous form state:', prev);
        console.log('New form state after OCR:', newData);
        console.log('Field comparison:');
        console.log('firstName: old =', prev.firstName, 'new =', newData.firstName);
        console.log('lastName1: old =', prev.lastName1, 'new =', newData.lastName1);
        console.log('lastName2: old =', prev.lastName2, 'new =', newData.lastName2);
        return newData;
      });

      setHasDocumentProcessed(true);
      
      setTimeout(() => {
        console.log('=== OCR PROCESSING COMPLETE - FORCING COMPONENT RELOAD ===');
        setIsProcessingOCR(false);
        setForceRerender(prev => prev + 1); // Force component re-render for i18n
        
        // Log final state after timeout
        console.log('Final form state after timeout:');
        console.log('Current formData values:');
        console.log('firstName:', formData.firstName);
        console.log('lastName1:', formData.lastName1);
        console.log('lastName2:', formData.lastName2);
      }, 500);
    } else {
      console.log('=== NO OCR DATA EXTRACTED ===');
      console.log('Front OCR result:', front);
      console.log('Back OCR result:', back);
      setIsProcessingOCR(false);
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
      const schema = createRegistrationSchema(selectedDocumentType, detectedCountryCode);
      schema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error: any) {
      const errors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          errors[field] = translateValidationError(field, err.message);
        });
      }
      setValidationErrors(errors);
      setShowValidation(true);
      return false;
    }
  };

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const pilgrimData = {
        firstName: data.firstName,
        lastName1: data.lastName1,
        lastName2: data.lastName2 || "",
        birthDate: data.birthDate,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentSupport: data.documentSupport || "",
        gender: data.gender,
        nationality: data.nationality || "",
        phone: data.phone,
        email: data.email || "",
        addressStreet: data.addressStreet || "",
        addressStreet2: data.addressStreet2 || "",
        addressCity: data.addressCity || "",
        addressPostalCode: data.addressPostalCode || "",
        addressCountry: data.addressCountry || "",
        addressMunicipalityCode: data.addressMunicipalityCode || "",
        paymentType: data.paymentType,
        language: data.language || 'es'
      };

      const bookingData = {
        checkInDate: stayData.checkInDate,
        checkOutDate: stayData.checkOutDate,
        guests: stayData.guests,
        nights: stayData.nights,
        totalAmount: PRICE_PER_NIGHT * stayData.nights
      };

      return apiRequest("POST", "/api/registration", {
        pilgrim: pilgrimData,
        booking: bookingData
      });
    },
    onSuccess: () => {
      toast({
        title: t('registration.success_title'),
        description: t('registration.success_description'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: t('registration.error_title'),
        description: error.message || t('registration.error_description'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = () => {
    if (validateForm()) {
      registrationMutation.mutate(formData);
    } else {
      toast({
        title: t('registration.validation_error'),
        description: t('registration.validation_error_description'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('registration.back')}
          </Button>
          <h1 className="text-2xl font-bold text-white">
            {t('registration.title')}
          </h1>
        </div>

        <RegistrationStepper currentStep={2} />

        <Card className="w-full bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6">
            {/* Booking Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border-l-4 border-[#45c655]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{stayData.guests}</span> {stayData.guests === 1 ? t('guest.singular') : t('guest.plural')} × 
                  <span className="font-semibold"> {stayData.nights}</span> {stayData.nights === 1 ? t('night.singular') : t('night.plural')}
                </div>
                <div className="text-lg font-bold text-[#45c655]">
                  {(PRICE_PER_NIGHT * stayData.nights).toFixed(0)}€
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(stayData.checkInDate).toLocaleDateString()} - {new Date(stayData.checkOutDate).toLocaleDateString()}
              </div>
            </div>

            {/* Document Capture Section - No Validation */}
            {!isProcessingOCR && (
              <MultiDocumentCapture 
                onDocumentProcessed={handleDocumentProcessed}
                onDocumentTypeChange={handleDocumentTypeChange}
              />
            )}

            {isProcessingOCR && (
              <Alert className="mt-3 border-blue-500 bg-blue-50">
                <Camera className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-700">
                  Processing document... Please wait.
                </AlertDescription>
              </Alert>
            )}
            
            {hasDocumentProcessed && !isProcessingOCR && (
              <Alert className="mt-3 border-[#45c655] bg-green-50">
                <Check className="h-4 w-4 text-[#45c655]" />
                <AlertDescription className="text-[#3D5300]">
                  {t('registration.ocr_success')}
                </AlertDescription>
              </Alert>
            )}

            {/* Personal Information - No Validation During OCR */}
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-[#3D5300]">{t('registration.personal_info')}</CardTitle>
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
                      key={`firstName-${forceRerender}`} // Force re-render for i18n
                    />
                    {showValidation && validationErrors.firstName && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">{t('registration.last_name_1')} *</label>
                    <Input 
                      value={formData.lastName1 || ''}
                      onChange={(e) => updateField('lastName1', e.target.value)}
                      maxLength={50}
                      className={showValidation && validationErrors.lastName1 ? 'border-red-500' : ''}
                      key={`lastName1-${forceRerender}`} // Force re-render for i18n
                    />
                    {showValidation && validationErrors.lastName1 && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.lastName1}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">{t('registration.last_name_2')}</label>
                    <Input 
                      value={formData.lastName2 || ''}
                      onChange={(e) => updateField('lastName2', e.target.value)}
                      maxLength={50}
                      key={`lastName2-${forceRerender}`} // Force re-render for i18n
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
                      key={`birthDate-${forceRerender}`} // Force re-render for i18n
                      lang={t('general.locale_code')} // Set language for date picker
                    />
                    {showValidation && validationErrors.birthDate && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.birthDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">{t('registration.gender')} *</label>
                    <Select value={formData.gender || ''} onValueChange={(value) => updateField('gender', value)}>
                      <SelectTrigger className={showValidation && validationErrors.gender ? 'border-red-500' : ''}>
                        <SelectValue />
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
                      <p className="text-sm text-red-500 mt-1">{validationErrors.gender}</p>
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
                      <p className="text-sm text-red-500 mt-1">{validationErrors.nationality}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
              <Button 
                onClick={onSubmit}
                disabled={registrationMutation.isPending}
                className="bg-[#45c655] hover:bg-[#3ba544] text-white px-8"
              >
                {registrationMutation.isPending ? t('registration.submitting') : t('registration.submit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}