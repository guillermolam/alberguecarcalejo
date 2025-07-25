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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { RegistrationStepper } from './registration-stepper';
import { CountrySelector } from './country-selector';
import CountryAutocomplete from './country-autocomplete';
import { ArrivalTimePicker } from './arrival-time-picker';
import { BedSelectionMap } from './bed-selection-map';
import MultiDocumentCapture from './multi-document-capture-new';
import { Calendar, User, FileText, CreditCard, CheckCircle } from 'lucide-react';

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
  { id: 'personal', title: 'Datos Personales', description: 'Información básica' },
  { id: 'documents', title: 'Documentación', description: 'Captura de documentos' },
  { id: 'booking', title: 'Reserva', description: 'Fechas y preferencias' },
  { id: 'payment', title: 'Pago', description: 'Confirmación' },
];

export default function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      gender: undefined,
      documentType: undefined,
      consentGiven: false,
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      console.log('Form submitted:', data);
      // Here you would typically send the data to your backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setCurrentStep(3); // Move to confirmation step
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderPersonalInfoStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            {...register('firstName')}
            id="firstName"
            placeholder="Tu nombre"
          />
          {errors.firstName && (
            <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="lastName1">Primer Apellido *</Label>
          <Input
            {...register('lastName1')}
            id="lastName1"
            placeholder="Primer apellido"
          />
          {errors.lastName1 && (
            <p className="text-sm text-red-600 mt-1">{errors.lastName1.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lastName2">Segundo Apellido</Label>
          <Input
            {...register('lastName2')}
            id="lastName2"
            placeholder="Segundo apellido (opcional)"
          />
        </div>
        
        <div>
          <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
          <Input
            {...register('birthDate')}
            id="birthDate"
            type="date"
          />
          {errors.birthDate && (
            <p className="text-sm text-red-600 mt-1">{errors.birthDate.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gender">Género *</Label>
          <Select onValueChange={(value) => setValue('gender', value as 'M' | 'F' | 'O')}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Femenino</SelectItem>
              <SelectItem value="O">Otro</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-sm text-red-600 mt-1">{errors.gender.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="nationality">Nacionalidad *</Label>
          <CountryAutocomplete
            value={watch('nationality')}
            onValueChange={(value) => setValue('nationality', value)}
            placeholder="Escribe tu nacionalidad"
          />
          {errors.nationality && (
            <p className="text-sm text-red-600 mt-1">{errors.nationality.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Teléfono *</Label>
          <Input
            {...register('phone')}
            id="phone"
            type="tel"
            placeholder="+34 600 000 000"
          />
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            {...register('email')}
            id="email"
            type="email"
            placeholder="tu@email.com (opcional)"
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderDocumentStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="documentType">Tipo de Documento *</Label>
          <Select onValueChange={(value) => setValue('documentType', value as 'DNI' | 'NIE' | 'PASSPORT')}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DNI">DNI</SelectItem>
              <SelectItem value="NIE">NIE</SelectItem>
              <SelectItem value="PASSPORT">Pasaporte</SelectItem>
            </SelectContent>
          </Select>
          {errors.documentType && (
            <p className="text-sm text-red-600 mt-1">{errors.documentType.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="documentNumber">Número de Documento *</Label>
          <Input
            {...register('documentNumber')}
            id="documentNumber"
            placeholder="12345678Z"
          />
          {errors.documentNumber && (
            <p className="text-sm text-red-600 mt-1">{errors.documentNumber.message}</p>
          )}
        </div>
      </div>

      <MultiDocumentCapture
        onDocumentsCapture={setDocuments}
        requiredDocuments={['front', 'back']}
      />
    </div>
  );

  const renderBookingStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="checkInDate">Fecha de Entrada *</Label>
          <Input
            {...register('checkInDate')}
            id="checkInDate"
            type="date"
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.checkInDate && (
            <p className="text-sm text-red-600 mt-1">{errors.checkInDate.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="checkOutDate">Fecha de Salida *</Label>
          <Input
            {...register('checkOutDate')}
            id="checkOutDate"
            type="date"
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.checkOutDate && (
            <p className="text-sm text-red-600 mt-1">{errors.checkOutDate.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="arrivalTime">Hora Estimada de Llegada</Label>
        <ArrivalTimePicker
          value={watch('arrivalTime')}
          onChange={(value) => setValue('arrivalTime', value)}
        />
      </div>

      <BedSelectionMap
        selectedBed={watch('selectedBed')}
        onBedSelect={(bedId) => setValue('selectedBed', bedId)}
      />
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center mb-6">
        <CheckCircle className="h-16 w-16 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-green-600">¡Reserva Confirmada!</h2>
      <p className="text-gray-600">
        Tu reserva ha sido procesada correctamente. Recibirás un email de confirmación en breve.
      </p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>Código de reserva:</strong> ALB{Date.now()}
        </p>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalInfoStep();
      case 1:
        return renderDocumentStep();
      case 2:
        return renderBookingStep();
      case 3:
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Registro de Huésped - Albergue del Carrascalejo
            </CardTitle>
            <RegistrationStepper currentStep={currentStep} steps={steps} />
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {renderStepContent()}
              
              {currentStep < 3 && (
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    Anterior
                  </Button>
                  
                  {currentStep === 2 ? (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}
                    </Button>
                  ) : (
                    <Button type="button" onClick={nextStep}>
                      Siguiente
                    </Button>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}