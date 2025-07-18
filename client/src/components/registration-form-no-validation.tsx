import React, { Suspense, memo, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useRegistrationStore } from '@/stores/registration-store';
import { StayData } from './stay-info-form';
import { ComprehensiveOCRResult } from '@/lib/enhanced-ocr';
import { createRegistrationSchema } from '@/lib/validation';
import { type RegistrationFormData } from '@/stores/registration-store';
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

export const RegistrationForm: React.FC<RegistrationFormProps> = memo(({ stayData, onBack, onSuccess }) => {
  const { t } = useI18n();
  const {
    formData,
    isOcrProcessing,
    hasDocumentProcessed,
    selectedDocumentType,
    detectedCountryCode,
    phoneFormat,
    updateField,
    updateFormData,
    setOcrProcessing,
    setDocumentProcessed,
    setSelectedDocumentType,
    setDetectedCountryCode,
    setPhoneFormat,
    populateFromOCR
  } = useRegistrationStore();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation(
    (payload: { pilgrim: RegistrationFormData; booking: StayData }) =>
      apiRequest('POST', '/api/registration', payload),
    {
      onSuccess: () => {
        toast({
          title: t('registration.success_title'),
          description: t('registration.success_description'),
        });
        queryClient.invalidateQueries(['/api/dashboard']);
        onSuccess();
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        toast({
          title: t('registration.error_title'),
          description: message || t('registration.error_description'),
          variant: 'destructive',
        });
      },
    }
  );

  const onDocumentProcessed = (result: ComprehensiveOCRResult) => {
    const front = result.frontOCR?.extractedData ?? {};
    const back = result.backOCR?.extractedData ?? {};
    const merged = { ...front, ...back };
    Object.entries(merged).forEach(([key, val]) => {
      if (val != null && key in ({} as RegistrationFormData)) {
        setValue(key as keyof RegistrationFormData, String(val));
      }
    });
    setProcessed(true);
  };

  const onSubmit = (data: RegistrationFormData) => {
    mutation.mutate({ pilgrim: data, booking: stayData });
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Document Capture */}
          <Suspense fallback={<Alert><AlertDescription>{t('registration.loading_documents')}</AlertDescription></Alert>}>
            <MultiDocumentCapture onDocumentProcessed={onDocumentProcessed} />
          </Suspense>
          {hasProcessed && (
            <Alert className="border-green-500 bg-green-50">
              <AlertDescription>{t('registration.ocr_success')}</AlertDescription>
            </Alert>
          )}

          {/* Personal Info */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>{t('registration.personal_info')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('registration.first_name')}
                    error={!!errors.firstName}
                  />
                )}
              />
              <Controller
                name="lastName1"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('registration.last_name_1')}
                    error={!!errors.lastName1}
                  />
                )}
              />
              <Controller
                name="lastName2"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder={t('registration.last_name_2')} />
                )}
              />

              <Controller
                name="birthDate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    lang={t('general.locale_code')}
                    error={!!errors.birthDate}
                  />
                )}
              />
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={GENDER_OPTIONS.map(opt => ({ label: t(opt.label), value: opt.value }))}
                    error={!!errors.gender}
                  />
                )}
              />
              <Controller
                name="nationality"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('registration.nationality')}
                    maxLength={3}
                    error={!!errors.nationality}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Document Details */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>{t('registration.document_info')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Controller
                name="documentType"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={DOCUMENT_TYPES.map(opt => ({ label: t(opt.label), value: opt.value }))}
                    error={!!errors.documentType}
                  />
                )}
              />
              <Controller
                name="documentNumber"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('registration.document_number')}
                    error={!!errors.documentNumber}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Address & Contact */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>{t('registration.address_contact')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="addressStreet"
                control={control}
                render={({ field }) => (
                  <GooglePlacesAutocomplete {...field} />
                )}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <CountryPhoneInput {...field} />
                )}
              />
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>{t('registration.payment')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="paymentType"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={PAYMENT_TYPES.map(opt => ({ label: t(opt.label), value: opt.value }))}
                    error={!!errors.paymentType}
                  />
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || mutation.isLoading}
              className="bg-[#45c655] hover:bg-[#3ba544] text-white px-8"
            >
              {mutation.isLoading ? t('registration.submitting') : t('registration.submit')}
            </Button>
          </div>
        </form>
      </div>

      {/* Service worker registration */}
      {typeof window !== 'undefined' && 'serviceWorker' in navigator &&
        navigator.serviceWorker.register('/sw.js').catch(console.error)
      }
    </div>
  );
});

export { RegistrationForm as RegistrationFormNoValidation };
