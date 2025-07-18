import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

export function RegistrationForm({ stayData, onBack, onSuccess }: RegistrationFormProps) {
  const [frontOCR, setFrontOCR] = useState<ComprehensiveOCRResult | null>(null);
  const [backOCR, setBackOCR] = useState<ComprehensiveOCRResult | null>(null);
  const [hasDocumentProcessed, setHasDocumentProcessed] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [detectedCountryCode, setDetectedCountryCode] = useState("ESP");
  const [phoneFormat, setPhoneFormat] = useState("+34");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(createRegistrationSchema(selectedDocumentType, detectedCountryCode)),
    defaultValues: {
      language: 'es',
      paymentType: "EFECT", // Default to cash
      addressCountry: '',
      firstName: '',
      lastName1: '',
      lastName2: '',
      documentType: '',
      documentNumber: '',
      documentSupport: '',
      gender: '',
      nationality: '',
      birthDate: '',
      addressStreet: '',
      addressStreet2: '',
      addressCity: '',
      addressPostalCode: '',
      addressMunicipalityCode: '',
      phone: '',
      email: ''
    },
  });

  // Removed duplicate function - using the one below

  // Handle document type change - set defaults for DNI
  const handleDocumentTypeChange = (documentType: string) => {
    setSelectedDocumentType(documentType);
    
    // Set defaults for Spanish documents
    if (documentType === 'DNI' || documentType === 'NIE') {
      setDetectedCountryCode("ESP");
      setPhoneFormat("+34");
      form.setValue('addressCountry', 'Spain');
      form.setValue('nationality', 'ESP');
    }
  };

  // Handle multi-document capture results
  const handleDocumentProcessed = (result: any) => {
    const { frontOCR: front, backOCR: back, documentType } = result;
    
    setFrontOCR(front);
    setBackOCR(back);
    setHasDocumentProcessed(true);
    setSelectedDocumentType(documentType);
    
    // Merge data from both sides
    const mergedOCR = {
      extractedData: {
        ...front?.extractedData,
        ...back?.extractedData, // Back side data takes precedence for address info
      },
      detectedFields: [...(front?.detectedFields || []), ...(back?.detectedFields || [])],
      success: (front?.success || false) || (back?.success || false)
    };
    
    // Auto-fill the form
    fillFormFromOCR(mergedOCR);
  };

  // Auto-fill form when comprehensive OCR data is available  
  const fillFormFromOCR = (ocrData: any) => {
    if (ocrData && ocrData.success && ocrData.extractedData) {
      const data = ocrData.extractedData;
      const updates: Partial<RegistrationFormData> = {};
      
      // Personal information
      if (data.firstName) updates.firstName = data.firstName;
      if (data.lastName1) updates.lastName1 = data.lastName1;
      if (data.lastName2) updates.lastName2 = data.lastName2;
      if (data.documentNumber) updates.documentNumber = data.documentNumber;
      if (data.documentType) {
        updates.documentType = data.documentType;
        setSelectedDocumentType(data.documentType);
      }
      if (data.documentSupport) updates.documentSupport = data.documentSupport;
      if (data.birthDate) updates.birthDate = data.birthDate;
      if (data.gender) updates.gender = data.gender;
      if (data.nationality) updates.nationality = data.nationality;
      
      // Address information (if available)
      if (data.addressStreet) updates.addressStreet = data.addressStreet;
      if (data.addressCity) updates.addressCity = data.addressCity;
      if (data.addressPostalCode) updates.addressPostalCode = data.addressPostalCode;
      if (data.addressCountry) {
        updates.addressCountry = data.addressCountry;
        // Update country code for phone validation
        const countryCode = getCountryCode(data.addressCountry);
        setDetectedCountryCode(countryCode);
      }
      
      // Debug logging
      console.log('Processing OCR data for form filling:', data);
      console.log('Updates to apply:', updates);

      // Apply all updates immediately
      Object.entries(updates).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.trim() !== '') {
          console.log(`Setting form field ${key} to:`, value);
          form.setValue(key as keyof RegistrationFormData, value as any);
        }
      });
      
      // Force form validation and re-render
      form.trigger();
      
      setHasDocumentProcessed(true);
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
        addressCountry: data.addressCountry,
        addressStreet: data.addressStreet,
        addressStreet2: data.addressStreet2 || "",
        addressCity: data.addressCity,
        addressPostalCode: data.addressPostalCode,
        addressMunicipalityCode: data.addressMunicipalityCode || "",
        language: data.language,
        idPhotoUrl: "",
      };

      const bookingData = {
        referenceNumber: "",
        checkInDate: stayData.checkInDate,
        checkOutDate: stayData.checkOutDate,
        numberOfNights: stayData.nights,
        numberOfPersons: stayData.guests,
        numberOfRooms: 1,
        hasInternet: false,
        status: "confirmed",
      };

      const paymentData = {
        amount: (PRICE_PER_NIGHT * stayData.nights).toFixed(2),
        paymentType: data.paymentType,
        paymentStatus: "pending",
        currency: "EUR",
      };

      const response = await apiRequest("POST", "/api/register", {
        pilgrim: pilgrimData,
        booking: bookingData,
        payment: paymentData,
      });

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('notifications.success'),
        description: `Reference: ${data.referenceNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: t('notifications.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });



  // Enhanced handlePlaceSelected with comprehensive address parsing
  const handlePlaceSelected = useCallback((place: any) => {
    if (place?.address_components) {
      const components = place.address_components;
      
      // Extract all address components safely
      const streetNumber = components.find((c: any) => c.types.includes('street_number'))?.long_name || '';
      const route = components.find((c: any) => c.types.includes('route'))?.long_name || '';
      const locality = components.find((c: any) => c.types.includes('locality'))?.long_name || '';
      const adminLevel1 = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name || '';
      const adminLevel2 = components.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name || '';
      const postalCode = components.find((c: any) => c.types.includes('postal_code'))?.long_name || '';
      const countryLong = components.find((c: any) => c.types.includes('country'))?.long_name || '';
      const countryShort = components.find((c: any) => c.types.includes('country'))?.short_name || '';
      
      // Build street address
      let fullAddress = '';
      if (streetNumber && route) {
        fullAddress = `${streetNumber} ${route}`;
      } else if (route) {
        fullAddress = route;
      } else if (place.formatted_address) {
        // Fallback to formatted address if components are incomplete
        fullAddress = place.formatted_address.split(',')[0] || '';
      }
      
      // Set city (prefer locality, fallback to admin areas)
      const city = locality || adminLevel2 || adminLevel1;
      
      // Update form fields with comprehensive data
      if (fullAddress) {
        form.setValue('addressStreet', fullAddress);
      }
      if (city) {
        form.setValue('addressCity', city);
      }
      if (postalCode) {
        form.setValue('addressPostalCode', postalCode);
      }
      if (countryLong) {
        form.setValue('addressCountry', countryLong);
            // Update country code for phone validation
        const countryCode = getCountryCode(countryLong) || countryShort || 'ESP';
        setDetectedCountryCode(countryCode);
        setPhoneFormat(getCountryDialCode(countryCode));
      }
      
      console.log('Address components extracted:', {
        fullAddress,
        city,
        postalCode,
        country: countryLong,
        countryCode: countryShort,
        rawComponents: components
      });
    } else {
      console.warn('No address components found in place:', place);
    }
  }, [form, getCountryCode]);

  const onSubmit = (data: RegistrationFormData) => {
    registrationMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3D5300] via-[#4a6200] to-[#3D5300] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="mr-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
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

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Document Capture Section */}
                <MultiDocumentCapture 
                  onDocumentProcessed={handleDocumentProcessed}
                  onDocumentTypeChange={handleDocumentTypeChange}
                />
                
                {hasDocumentProcessed && (
                  <Alert className="mt-3 border-[#45c655] bg-green-50">
                    <Check className="h-4 w-4 text-[#45c655]" />
                    <AlertDescription className="text-[#3D5300]">
                      {t('registration.ocr_success')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Personal Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-[#3D5300]">{t('registration.personal_info')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('registration.first_name')} *</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={50} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('registration.last_name_1')} *</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={50} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('registration.last_name_2')}</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={50} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('registration.birth_date')} * 
                              <span className="text-sm text-gray-500 ml-2">
                                ({detectedCountryCode === 'USA' ? 'mm/dd/yyyy' : 'dd/mm/yyyy'})
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('registration.document_type')} *</FormLabel>
                            <Select onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedDocumentType(value);
                            }} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('registration.document_type')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DOCUMENT_TYPES.map((type) => (
                                  <SelectItem key={type.code} value={type.code}>
                                    {t(`document.${type.code.toLowerCase()}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="documentNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('registration.document_number')} *</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={20} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('registration.gender')} *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('registration.gender')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {GENDER_OPTIONS.map((gender) => (
                                  <SelectItem key={gender.code} value={gender.code}>
                                    {t(`gender.${gender.code.toLowerCase()}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-[#3D5300] flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      {t('registration.address_info')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="addressStreet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('registration.address')} *</FormLabel>
                            <FormControl>
                              <GooglePlacesAutocomplete
                                value={field.value}
                                onChange={field.onChange}
                                onPlaceSelected={handlePlaceSelected}
                                placeholder={t('registration.address')}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="addressCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('registration.city')} *</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={50} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="addressPostalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('registration.postal_code')} *</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={10} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="addressCountry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('registration.country')} *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                list="countries-list"
                                placeholder={t('registration.country')}
                                maxLength={50}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  // Update country code when user types
                                  const countryCode = getCountryCode(e.target.value);
                                  setDetectedCountryCode(countryCode);
                                  setPhoneFormat(getCountryDialCode(countryCode));
                                }}
                              />
                            </FormControl>
                            <datalist id="countries-list">
                              {COUNTRIES.map((country) => (
                                <option key={country.code} value={country.name} />
                              ))}
                            </datalist>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Contact & Payment */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-[#3D5300]">{t('registration.contact_info')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <CountryPhoneInput
                            countryName={form.watch('addressCountry')}
                            localPhone={field.value || ''}
                            onLocalPhoneChange={field.onChange}
                            label={t('registration.phone')}
                            required={true}
                            placeholder={t('registration.phone_local_placeholder')}
                          />
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('registration.email')}</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" maxLength={100} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('registration.payment_type')} *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('registration.payment_type')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PAYMENT_TYPES.map((payment) => (
                                  <SelectItem key={payment.code} value={payment.code}>
                                    <div className="flex items-center gap-2">
                                      <i className={`fas fa-${payment.icon} text-[#3D5300]`}></i>
                                      {payment.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Notice */}
                <Alert className="border-[#3D5300] bg-green-50">
                  <Shield className="h-4 w-4 text-[#3D5300]" />
                  <AlertDescription className="text-[#3D5300]">
                    <strong>{t('registration.compliance')}</strong><br />
                    {t('registration.compliance_text')}
                  </AlertDescription>
                </Alert>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-4">
                  <Button
                    type="button"
                    onClick={onBack}
                    variant="outline"
                    className="border-[#3D5300] text-[#3D5300] hover:bg-[#3D5300] hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('registration.back')}
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={registrationMutation.isPending}
                    className="bg-[#45c655] hover:bg-[#3bb048] text-white px-8"
                  >
                    {registrationMutation.isPending ? t('loading.processing') : t('registration.submit')}
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}