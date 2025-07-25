import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { useRegistrationStore } from '../stores/registration-store';
import { useI18n } from '../contexts/i18n-context';
import { Calendar, User, FileText, CreditCard, CheckCircle, Plus, Minus } from 'lucide-react';

const registrationSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName1: z.string().min(2, 'El primer apellido es obligatorio'),
  lastName2: z.string().optional(),
  birthDate: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
  gender: z.enum(['M', 'F', 'O'], { required_error: 'El género es obligatorio' }),
  nationality: z.string().min(1, 'La nacionalidad es obligatoria'),
  
  // Document Information
  documentType: z.enum(['DNI', 'NIE', 'PASSPORT'], { required_error: 'Tipo de documento obligatorio' }),
  documentNumber: z.string().min(8, 'Número de documento inválido'),
  
  // Contact Information
  phone: z.string().min(9, 'Teléfono inválido'),
  email: z.string().email('Email inválido').optional(),
  
  // Address
  addressCountry: z.string().min(1, 'País obligatorio'),
  addressStreet: z.string().min(5, 'Dirección obligatoria'),
  addressCity: z.string().min(2, 'Ciudad obligatoria'),
  addressPostalCode: z.string().min(4, 'Código postal obligatorio'),
  
  // Booking Details
  checkInDate: z.string().min(1, 'Fecha de entrada obligatoria'),
  checkOutDate: z.string().min(1, 'Fecha de salida obligatoria'),
  arrivalTime: z.string().optional(),
  selectedBed: z.string().optional(),
  
  // Legal
  consentGiven: z.boolean().refine(val => val === true, 'Debes aceptar el tratamiento de datos'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const steps = [
  { id: 'dates', title: 'Fechas', description: 'Selecciona tu estancia', icon: Calendar },
  { id: 'personal', title: 'Datos Personales', description: 'Información básica', icon: User },
  { id: 'documents', title: 'Documentación', description: 'Captura de documentos', icon: FileText },
  { id: 'payment', title: 'Confirmación', description: 'Finalizar reserva', icon: CreditCard },
];

export default function RegistrationForm() {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      gender: undefined,
      documentType: undefined,
      consentGiven: false,
      checkInDate: today.toISOString().split('T')[0],
      checkOutDate: tomorrow.toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      // Here would be the actual submission logic
      console.log('Form submitted:', data);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      // Success - redirect or show success message
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    // Validate current step
    let fieldsToValidate: (keyof RegistrationFormData)[] = [];
    
    switch (currentStep) {
      case 0: // Dates
        fieldsToValidate = ['checkInDate', 'checkOutDate'];
        break;
      case 1: // Personal info
        fieldsToValidate = ['firstName', 'lastName1', 'birthDate', 'gender', 'nationality'];
        break;
      case 2: // Documents
        fieldsToValidate = ['documentType', 'documentNumber'];
        break;
      case 3: // Payment
        fieldsToValidate = ['phone', 'addressCountry', 'addressStreet', 'addressCity', 'addressPostalCode', 'consentGiven'];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    if (result && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Stepper */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              index <= currentStep ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'
            }`}>
              {index < currentStep ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                React.createElement(step.icon, { className: "w-5 h-5" })
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-24 h-1 mx-2 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep].icon, { className: "w-5 h-5" })}
            {steps[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 0: Date Selection */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Información de la estancia</h3>
                
                {/* Stay Information Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Dates Section */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Fechas de estancia
                    </Label>
                    <div className="space-y-2">
                      <Input
                        type="date"
                        {...form.register('checkInDate')}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full"
                      />
                      <Input
                        type="date"
                        {...form.register('checkOutDate')}
                        min={form.watch('checkInDate') || new Date().toISOString().split('T')[0]}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Nights Section */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Número de noches
                    </Label>
                    <div className="flex items-center justify-center border rounded-lg p-3 bg-gray-50">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const checkIn = form.watch('checkInDate');
                          if (checkIn) {
                            const nights = Math.max(1, Math.ceil((new Date(form.watch('checkOutDate')).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
                            if (nights > 1) {
                              const newDate = new Date(checkIn);
                              newDate.setDate(newDate.getDate() + nights - 1);
                              form.setValue('checkOutDate', newDate.toISOString().split('T')[0]);
                            }
                          }
                        }}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="mx-4 text-lg font-semibold min-w-[2rem] text-center">
                        {(() => {
                          const checkIn = form.watch('checkInDate');
                          const checkOut = form.watch('checkOutDate');
                          if (checkIn && checkOut) {
                            return Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
                          }
                          return 2;
                        })()}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const checkIn = form.watch('checkInDate');
                          if (checkIn) {
                            const nights = Math.max(1, Math.ceil((new Date(form.watch('checkOutDate')).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
                            if (nights < 30) { // Max 30 nights
                              const newDate = new Date(checkIn);
                              newDate.setDate(newDate.getDate() + nights + 1);
                              form.setValue('checkOutDate', newDate.toISOString().split('T')[0]);
                            }
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">Máx 30 noches</p>
                  </div>

                  {/* Persons Section */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Personas
                    </Label>
                    <Select defaultValue="1" disabled>
                      <SelectTrigger className="w-full">
                        <SelectValue>1 persona</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 persona</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Solo registro individual</p>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="bg-gray-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">15€</span> × {(() => {
                        const checkIn = form.watch('checkInDate');
                        const checkOut = form.watch('checkOutDate');
                        if (checkIn && checkOut) {
                          return Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
                        }
                        return 2;
                      })()} noches
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {(() => {
                        const checkIn = form.watch('checkInDate');
                        const checkOut = form.watch('checkOutDate');
                        const nights = checkIn && checkOut 
                          ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
                          : 2;
                        return nights * 15;
                      })()}€ Total
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Pago a la llegada</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Métodos aceptados de pago</span>
                      <div className="flex gap-1 items-center">
                        {/* Cash */}
                        <div className="w-6 h-4 bg-green-500 rounded text-white text-xs flex items-center justify-center font-bold">€</div>
                        
                        {/* Visa Logo */}
                        <div className="w-10 h-6 bg-white border rounded flex items-center justify-center">
                          <div className="text-blue-700 font-bold text-xs italic tracking-wider">VISA</div>
                        </div>
                        
                        {/* Mastercard Logo */}
                        <div className="w-10 h-6 bg-white border rounded flex items-center justify-center">
                          <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-red-500 absolute"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400 absolute left-2"></div>
                          </div>
                        </div>
                        
                        {/* Bizum Logo */}
                        <div className="w-10 h-6 bg-white border rounded flex items-center justify-center">
                          <div className="text-xs font-bold text-blue-600">bizum</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Availability Confirmation */}
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Disponibilidad confirmada</strong> - Hay camas disponibles para las fechas seleccionadas.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    {...form.register('firstName')}
                    placeholder="Tu nombre"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName1">Primer Apellido *</Label>
                  <Input
                    id="lastName1"
                    {...form.register('lastName1')}
                    placeholder="Tu primer apellido"
                  />
                  {form.formState.errors.lastName1 && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.lastName1.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName2">Segundo Apellido</Label>
                  <Input
                    id="lastName2"
                    {...form.register('lastName2')}
                    placeholder="Tu segundo apellido (opcional)"
                  />
                </div>

                <div>
                  <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...form.register('birthDate')}
                  />
                  {form.formState.errors.birthDate && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.birthDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender">Género *</Label>
                  <Select onValueChange={(value) => form.setValue('gender', value as 'M' | 'F' | 'O')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Femenino</SelectItem>
                      <SelectItem value="O">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.gender && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.gender.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="nationality">Nacionalidad *</Label>
                  <Input
                    id="nationality"
                    {...form.register('nationality')}
                    placeholder="Tu nacionalidad"
                  />
                  {form.formState.errors.nationality && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.nationality.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Documents */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="documentType">Tipo de Documento *</Label>
                    <Select onValueChange={(value) => form.setValue('documentType', value as 'DNI' | 'NIE' | 'PASSPORT')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="NIE">NIE</SelectItem>
                        <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.documentType && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.documentType.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="documentNumber">Número de Documento *</Label>
                    <Input
                      id="documentNumber"
                      {...form.register('documentNumber')}
                      placeholder="Número del documento"
                    />
                    {form.formState.errors.documentNumber && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.documentNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    La captura de documentos se implementará aquí con OCR automático.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 3: Final Details & Payment */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkInDate">Fecha de Entrada *</Label>
                    <Input
                      id="checkInDate"
                      type="date"
                      {...form.register('checkInDate')}
                    />
                    {form.formState.errors.checkInDate && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.checkInDate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="checkOutDate">Fecha de Salida *</Label>
                    <Input
                      id="checkOutDate"
                      type="date"
                      {...form.register('checkOutDate')}
                    />
                    {form.formState.errors.checkOutDate && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.checkOutDate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      {...form.register('phone')}
                      placeholder="+34 600 123 456"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register('email')}
                      placeholder="tu@email.com (opcional)"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="addressCountry">País *</Label>
                    <Input
                      id="addressCountry"
                      {...form.register('addressCountry')}
                      placeholder="España"
                    />
                    {form.formState.errors.addressCountry && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.addressCountry.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="addressCity">Ciudad *</Label>
                    <Input
                      id="addressCity"
                      {...form.register('addressCity')}
                      placeholder="Tu ciudad"
                    />
                    {form.formState.errors.addressCity && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.addressCity.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="addressStreet">Dirección *</Label>
                    <Input
                      id="addressStreet"
                      {...form.register('addressStreet')}
                      placeholder="Calle, número, piso..."
                    />
                    {form.formState.errors.addressStreet && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.addressStreet.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="addressPostalCode">Código Postal *</Label>
                    <Input
                      id="addressPostalCode"
                      {...form.register('addressPostalCode')}
                      placeholder="06810"
                    />
                    {form.formState.errors.addressPostalCode && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.addressPostalCode.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment & Consent */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pago en efectivo:</strong> Puedes pagar directamente en el albergue al llegar.
                    Precio: €15/noche en dormitorio, €35/noche habitación privada.
                  </AlertDescription>
                </Alert>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="consentGiven"
                    {...form.register('consentGiven')}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <Label htmlFor="consentGiven" className="cursor-pointer">
                      Acepto el tratamiento de mis datos personales conforme a la política de privacidad *
                    </Label>
                    {form.formState.errors.consentGiven && (
                      <p className="text-destructive mt-1">
                        {form.formState.errors.consentGiven.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-end pt-6">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="mr-4"
                >
                  Anterior
                </Button>
              )}

              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={handleNext} className="bg-green-600 hover:bg-green-700">
                  Continuar
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                  {isSubmitting ? 'Procesando...' : 'Completar registro'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}