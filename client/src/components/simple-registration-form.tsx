import React, { useState, useEffect, Suspense } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useRegistrationStore, type RegistrationFormData } from '@/stores/registration-store';
import { StayData } from './stay-info-form';
import { ComprehensiveOCRResult } from '@/lib/enhanced-ocr';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/i18n-context';
import { User, MapPin, Phone, CreditCard, Camera, Upload } from 'lucide-react';

// Import document capture component
import MultiDocumentCapture from './multi-document-capture-new';

interface SimpleRegistrationFormProps {
  stayData: StayData;
  onBack: () => void;
  onSuccess: () => void;
  ocrResult?: ComprehensiveOCRResult;
}

export const SimpleRegistrationForm: React.FC<SimpleRegistrationFormProps> = ({ 
  stayData, 
  onBack, 
  onSuccess, 
  ocrResult 
}) => {
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

  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Document upload states
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Set default document type based on browser language
  useEffect(() => {
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    const isSpanish = browserLang.toLowerCase().startsWith('es');
    const defaultDocType = isSpanish ? 'NIF' : 'Passport';
    
    if (!formData.documentType) {
      updateField('documentType', defaultDocType);
      setSelectedDocumentType(defaultDocType);
    }
  }, [formData.documentType, updateField, setSelectedDocumentType]);

  // Process OCR result when it arrives
  useEffect(() => {
    if (ocrResult?.data && !hasDocumentProcessed) {
      console.log('Processing OCR result:', ocrResult.data);
      populateFromOCR(ocrResult.data);
      setDocumentProcessed(true);
      
      toast({
        title: 'Document processed',
        description: 'Document information has been extracted successfully',
      });
    }
  }, [ocrResult, hasDocumentProcessed, populateFromOCR, setDocumentProcessed, toast]);

  const handleDocumentProcessed = (result: any) => {
    console.log('Document processing completed:', result);
    if (result.frontOCR?.extractedData || result.backOCR?.extractedData) {
      // Combine data from front and back OCR if available
      const extractedData = {
        ...result.frontOCR?.extractedData,
        ...result.backOCR?.extractedData
      };
      populateFromOCR(extractedData);
      setDocumentProcessed(true);
      setShowDocumentUpload(false);
      
      toast({
        title: 'Document processed successfully',
        description: 'Your document information has been extracted and populated in the form.',
      });
    }
  };

  const handleDocumentTypeChange = (documentType: string) => {
    updateField('documentType', documentType);
    setSelectedDocumentType(documentType);
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      errors.firstName = t('validation.first_name_required');
    }
    if (!formData.lastName1?.trim()) {
      errors.lastName1 = t('validation.last_name_required');
    }
    if (!formData.birthDate) {
      errors.birthDate = t('validation.birth_date_required');
    }
    if (!formData.documentNumber?.trim()) {
      errors.documentNumber = t('validation.document_number_required');
    }
    if (!formData.gender) {
      errors.gender = t('validation.gender_required');
    }
    if (!formData.nationality?.trim()) {
      errors.nationality = t('validation.nationality_required');
    }
    if (!formData.phone?.trim()) {
      errors.phone = t('validation.phone_required');
    }
    if (!formData.addressCountry?.trim()) {
      errors.addressCountry = t('validation.country_required');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit registration
  const registrationMutation = useMutation({
    mutationFn: async (registrationData: any) => {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('registration.success_title'),
        description: t('registration.success_description'),
      });
      onSuccess();
    },
    onError: (error: Error) => {
      console.error('Registration error:', error);
      toast({
        title: t('registration.error_title'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);

    if (!validateForm()) {
      toast({
        title: t('validation.form_errors_title'),
        description: t('validation.form_errors_description'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const registrationData = {
        ...formData,
        ...stayData,
        totalAmount: (stayData.nights * 15), // Calculate based on nights and price per night
        establishmentCode: 'H28079511',
      };

      await registrationMutation.mutateAsync(registrationData);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Document Upload Section */}
      {!hasDocumentProcessed && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Camera className="w-5 h-5" />
              Document Upload (Optional)
            </CardTitle>
            <p className="text-blue-700 text-sm">
              Upload your ID document to automatically fill the form fields, or fill them manually below.
            </p>
          </CardHeader>
          <CardContent>
            {!showDocumentUpload ? (
              <Button
                type="button"
                onClick={() => setShowDocumentUpload(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Upload or Take Photo
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowDocumentUpload(false)}
                    variant="ghost"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
                
                <Suspense fallback={<div className="p-4 text-center">Loading document uploader...</div>}>
                  <MultiDocumentCapture
                    onDocumentProcessed={handleDocumentProcessed}
                    onDocumentTypeChange={handleDocumentTypeChange}
                    selectedDocumentType={selectedDocumentType}
                  />
                </Suspense>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('registration.personal_info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.first_name')} *
                </label>
                <Input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className={showValidation && validationErrors.firstName ? 'border-red-500' : ''}
                  placeholder={t('registration.first_name')}
                />
                {showValidation && validationErrors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.last_name_1')} *
                </label>
                <Input
                  type="text"
                  value={formData.lastName1 || ''}
                  onChange={(e) => updateField('lastName1', e.target.value)}
                  className={showValidation && validationErrors.lastName1 ? 'border-red-500' : ''}
                  placeholder={t('registration.last_name_1')}
                />
                {showValidation && validationErrors.lastName1 && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.lastName1}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.last_name_2')}
                </label>
                <Input
                  type="text"
                  value={formData.lastName2 || ''}
                  onChange={(e) => updateField('lastName2', e.target.value)}
                  placeholder={t('registration.last_name_2')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.birth_date')} *
                </label>
                <Input
                  type="date"
                  value={formData.birthDate || ''}
                  onChange={(e) => updateField('birthDate', e.target.value)}
                  className={showValidation && validationErrors.birthDate ? 'border-red-500' : ''}
                />
                {showValidation && validationErrors.birthDate && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.birthDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.gender')} *
                </label>
                <Select value={formData.gender || ''} onValueChange={(value) => updateField('gender', value)}>
                  <SelectTrigger className={showValidation && validationErrors.gender ? 'border-red-500' : ''}>
                    <SelectValue placeholder={t('registration.select_gender')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">{t('registration.male')}</SelectItem>
                    <SelectItem value="F">{t('registration.female')}</SelectItem>
                    <SelectItem value="X">{t('registration.other')}</SelectItem>
                  </SelectContent>
                </Select>
                {showValidation && validationErrors.gender && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.gender}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.nationality')} *
                </label>
                <Input
                  type="text"
                  value={formData.nationality || ''}
                  onChange={(e) => updateField('nationality', e.target.value)}
                  className={showValidation && validationErrors.nationality ? 'border-red-500' : ''}
                  placeholder={t('registration.nationality')}
                />
                {showValidation && validationErrors.nationality && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.nationality}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.document_type')} *
                </label>
                <Select value={formData.documentType || ''} onValueChange={(value) => updateField('documentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('registration.select_document_type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIF">NIF/DNI</SelectItem>
                    <SelectItem value="NIE">NIE</SelectItem>
                    <SelectItem value="Passport">{t('registration.passport')}</SelectItem>
                    <SelectItem value="Other">{t('registration.other_document')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.document_number')} *
                </label>
                <Input
                  type="text"
                  value={formData.documentNumber || ''}
                  onChange={(e) => updateField('documentNumber', e.target.value)}
                  className={showValidation && validationErrors.documentNumber ? 'border-red-500' : ''}
                  placeholder={t('registration.document_number')}
                />
                {showValidation && validationErrors.documentNumber && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.documentNumber}</p>
                )}
              </div>
            </div>

            {formData.documentSupport && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.document_support')}
                </label>
                <Input
                  type="text"
                  value={formData.documentSupport || ''}
                  onChange={(e) => updateField('documentSupport', e.target.value)}
                  placeholder={t('registration.document_support')}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t('registration.address_info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('registration.address_street')}
              </label>
              <Input
                type="text"
                value={formData.addressStreet || ''}
                onChange={(e) => updateField('addressStreet', e.target.value)}
                placeholder={t('registration.address_street')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.address_city')}
                </label>
                <Input
                  type="text"
                  value={formData.addressCity || ''}
                  onChange={(e) => updateField('addressCity', e.target.value)}
                  placeholder={t('registration.address_city')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.address_postal_code')}
                </label>
                <Input
                  type="text"
                  value={formData.addressPostalCode || ''}
                  onChange={(e) => updateField('addressPostalCode', e.target.value)}
                  placeholder={t('registration.address_postal_code')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.address_country')} *
                </label>
                <Input
                  type="text"
                  value={formData.addressCountry || ''}
                  onChange={(e) => updateField('addressCountry', e.target.value)}
                  className={showValidation && validationErrors.addressCountry ? 'border-red-500' : ''}
                  placeholder={t('registration.address_country')}
                />
                {showValidation && validationErrors.addressCountry && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.addressCountry}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              {t('registration.contact_info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.phone')} *
                </label>
                <Input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={showValidation && validationErrors.phone ? 'border-red-500' : ''}
                  placeholder={t('registration.phone')}
                />
                {showValidation && validationErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('registration.email')}
                </label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={t('registration.email')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t('registration.payment_info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">{t('registration.stay_summary')}</h3>
              <p className="text-blue-800">
                Dates: {stayData.checkInDate} - {stayData.checkOutDate}
              </p>
              <p className="text-blue-800">
                Nights: {stayData.nights}
              </p>
              <p className="text-blue-800 font-bold">
                Total: €{stayData.nights * 15}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Special Requests
              </label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Any special requests or notes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto"
          >
            {t('navigation.back')}
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || registrationMutation.isPending}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting || registrationMutation.isPending
              ? 'Submitting...'
              : `Complete Registration (€${stayData.nights * 15})`
            }
          </Button>
        </div>
      </form>
    </div>
  );
};