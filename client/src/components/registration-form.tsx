import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, ArrowLeft, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { IdPhotoCapture } from "./id-photo-capture";
import { StayData } from "./stay-info-form";
import { COUNTRIES, DOCUMENT_TYPES, PAYMENT_TYPES, GENDER_OPTIONS, PRICE_PER_NIGHT } from "@/lib/constants";
import { i18n } from "@/lib/i18n";
import { OCRResult } from "@/lib/ocr";

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName1: z.string().min(1, "Last name is required").max(50),
  lastName2: z.string().max(50).optional(),
  birthDate: z.string().min(1, "Birth date is required"),
  documentType: z.string().min(1, "Document type is required"),
  documentNumber: z.string().min(1, "Document number is required").max(20),
  documentSupport: z.string().max(9).optional(),
  gender: z.string().min(1, "Gender is required"),
  nationality: z.string().max(3).optional(),
  addressCountry: z.string().min(1, "Country is required"),
  addressStreet: z.string().min(1, "Address is required").max(100),
  addressStreet2: z.string().max(100).optional(),
  addressCity: z.string().min(1, "City is required").max(50),
  addressPostalCode: z.string().min(1, "Postal code is required").max(10),
  addressMunicipalityCode: z.string().max(5).optional(),
  phone: z.string().min(1, "Phone is required").max(15),
  email: z.string().email("Invalid email").max(100).optional(),
  paymentType: z.string().min(1, "Payment type is required"),
  language: z.string().default("es"),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  stayData: StayData;
  onBack: () => void;
  onSuccess: () => void;
}

export function RegistrationForm({ stayData, onBack, onSuccess }: RegistrationFormProps) {
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      language: i18n.getLanguage(),
      paymentType: "EFECT",
    },
  });

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
        idPhotoUrl: "", // TODO: Implement photo upload
      };

      const bookingData = {
        referenceNumber: "", // Will be generated server-side
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
        title: i18n.t('notifications.success'),
        description: `Reference: ${data.referenceNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: i18n.t('notifications.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePhotoProcessed = (result: OCRResult) => {
    setOcrResult(result);
    
    // Auto-fill form with OCR data
    if (result.extractedData) {
      const { documentNumber, name, surname, birthDate } = result.extractedData;
      
      if (documentNumber) {
        form.setValue('documentNumber', documentNumber);
      }
      if (name) {
        form.setValue('firstName', name);
      }
      if (surname) {
        const surnameParts = surname.split(' ');
        if (surnameParts.length >= 1) {
          form.setValue('lastName1', surnameParts[0]);
        }
        if (surnameParts.length >= 2) {
          form.setValue('lastName2', surnameParts[1]);
        }
      }
      if (birthDate) {
        form.setValue('birthDate', birthDate);
      }
    }
  };

  const onSubmit = (data: RegistrationFormData) => {
    registrationMutation.mutate(data);
  };

  const watchedCountry = form.watch('addressCountry');
  const isSpain = watchedCountry === 'ESP';

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">
            {i18n.t('registration.title')}
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <Shield className="h-4 w-4 mr-2 text-green-500" />
            {i18n.t('registration.protected_data')}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{i18n.t('registration.first_name')} *</FormLabel>
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
                    <FormLabel>{i18n.t('registration.last_name_1')} *</FormLabel>
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
                    <FormLabel>{i18n.t('registration.last_name_2')}</FormLabel>
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
                    <FormLabel>{i18n.t('registration.birth_date')} *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Document Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{i18n.t('registration.document_type')} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.code} value={type.code}>
                            {type.name}
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
                    <FormLabel>{i18n.t('registration.document_number')} *</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={20} placeholder="12345678Z" />
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
                    <FormLabel>{i18n.t('registration.gender')} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((gender) => (
                          <SelectItem key={gender.code} value={gender.code}>
                            {gender.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ID Photo Capture */}
            <IdPhotoCapture onPhotoProcessed={handlePhotoProcessed} />

            {/* Address Information */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="addressCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{i18n.t('registration.country')} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <div className="flex items-center space-x-2">
                              <span>{country.flag}</span>
                              <span>{country.name}</span>
                            </div>
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
                name="addressStreet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{i18n.t('registration.address')} *</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="addressStreet2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{i18n.t('registration.address_2')}</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="addressCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{i18n.t('registration.city')} *</FormLabel>
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
                      <FormLabel>{i18n.t('registration.postal_code')} *</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={10} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {isSpain && (
                  <FormField
                    control={form.control}
                    name="addressMunicipalityCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{i18n.t('registration.municipality_code')}</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={5} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{i18n.t('registration.phone')} *</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={15} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{i18n.t('registration.email')}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Information */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-yellow-800 mb-4">
                  {i18n.t('registration.payment_info')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{i18n.t('registration.payment_type')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_TYPES.map((type) => (
                              <SelectItem key={type.code} value={type.code}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <div className="text-lg font-semibold text-yellow-800">
                      {i18n.t('registration.total')}: {PRICE_PER_NIGHT * stayData.nights}€
                    </div>
                    <div className="text-sm text-yellow-600">
                      {stayData.guests} persona × {stayData.nights} noche{stayData.nights > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Notice */}
            <Alert className="bg-blue-50 border-blue-200">
              <Shield className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                <p className="font-medium mb-1">{i18n.t('registration.compliance')}</p>
                <p>{i18n.t('registration.compliance_text')}</p>
              </AlertDescription>
            </Alert>

            {/* Submit Buttons */}
            <div className="flex space-x-4">
              <Button
                type="button"
                onClick={onBack}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {i18n.t('registration.back')}
              </Button>
              <Button
                type="submit"
                disabled={registrationMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {registrationMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {i18n.t('registration.submit')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
