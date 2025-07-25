import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useBookingStore } from '../store/bookingStore';

export const BookingPage: React.FC = () => {
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [selectedBedType, setSelectedBedType] = useState<string>('');
  const { isLoading, createBooking, checkAvailability } = useBookingStore();

  const [guestData, setGuestData] = useState({
    name: '',
    email: '',
    phone: '',
    nationality: '',
    documentType: '',
    documentNumber: '',
  });

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkIn || !checkOut || !selectedBedType) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const bookingData = {
      ...guestData,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      bedType: selectedBedType,
    };

    try {
      await createBooking(bookingData);
      alert('Reserva creada exitosamente');
    } catch (error) {
      alert('Error al crear la reserva');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Nueva Reserva</h1>
          <p className="text-muted-foreground">
            Albergue del Carrascalejo - Camino de Santiago
          </p>
        </div>

        <Tabs defaultValue="dates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dates">1. Fechas</TabsTrigger>
            <TabsTrigger value="guest">2. Datos</TabsTrigger>
            <TabsTrigger value="document">3. Documento</TabsTrigger>
            <TabsTrigger value="payment">4. Pago</TabsTrigger>
          </TabsList>

          {/* Step 1: Dates and Bed Selection */}
          <TabsContent value="dates">
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Fechas y Tipo de Cama</CardTitle>
                <CardDescription>
                  Elige las fechas de tu estancia y el tipo de alojamiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fecha de Entrada</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkIn ? format(checkIn, 'dd/MM/yyyy') : 'Seleccionar fecha'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={checkIn}
                          onSelect={setCheckIn}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Salida</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkOut ? format(checkOut, 'dd/MM/yyyy') : 'Seleccionar fecha'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={checkOut}
                          onSelect={setCheckOut}
                          disabled={(date) => date <= (checkIn || new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Tipo de Alojamiento</Label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className={`cursor-pointer transition-colors ${selectedBedType === 'DormA' ? 'border-primary bg-primary/5' : ''}`}>
                      <CardContent className="p-4" onClick={() => setSelectedBedType('DormA')}>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Dormitorio A</h3>
                            <Badge variant="secondary">12 camas</Badge>
                          </div>
                          <p className="text-2xl font-bold">€15<span className="text-sm font-normal">/noche</span></p>
                          <p className="text-sm text-muted-foreground">Dormitorio compartido mixto</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={`cursor-pointer transition-colors ${selectedBedType === 'DormB' ? 'border-primary bg-primary/5' : ''}`}>
                      <CardContent className="p-4" onClick={() => setSelectedBedType('DormB')}>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Dormitorio B</h3>
                            <Badge variant="secondary">10 camas</Badge>
                          </div>
                          <p className="text-2xl font-bold">€15<span className="text-sm font-normal">/noche</span></p>
                          <p className="text-sm text-muted-foreground">Dormitorio compartido mixto</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={`cursor-pointer transition-colors ${selectedBedType === 'Private' ? 'border-primary bg-primary/5' : ''}`}>
                      <CardContent className="p-4" onClick={() => setSelectedBedType('Private')}>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Habitación Privada</h3>
                            <Badge variant="secondary">2 habitaciones</Badge>
                          </div>
                          <p className="text-2xl font-bold">€35<span className="text-sm font-normal">/noche</span></p>
                          <p className="text-sm text-muted-foreground">Habitación individual</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 2: Guest Information */}
          <TabsContent value="guest">
            <Card>
              <CardHeader>
                <CardTitle>Datos del Peregrino</CardTitle>
                <CardDescription>
                  Información personal requerida para el registro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={guestData.name}
                      onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
                      placeholder="Juan García López"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={guestData.email}
                      onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                      placeholder="juan@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={guestData.phone}
                      onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                      placeholder="+34 600 000 000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nacionalidad</Label>
                    <Select onValueChange={(value) => setGuestData({ ...guestData, nationality: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar nacionalidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ESP">España</SelectItem>
                        <SelectItem value="FRA">Francia</SelectItem>
                        <SelectItem value="DEU">Alemania</SelectItem>
                        <SelectItem value="ITA">Italia</SelectItem>
                        <SelectItem value="PRT">Portugal</SelectItem>
                        <SelectItem value="USA">Estados Unidos</SelectItem>
                        <SelectItem value="OTHER">Otra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 3: Document Validation */}
          <TabsContent value="document">
            <Card>
              <CardHeader>
                <CardTitle>Validación de Documento</CardTitle>
                <CardDescription>
                  Subir foto del documento de identidad para validación automática
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de Documento</Label>
                    <Select onValueChange={(value) => setGuestData({ ...guestData, documentType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI (España)</SelectItem>
                        <SelectItem value="NIE">NIE (España)</SelectItem>
                        <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">Número de Documento</Label>
                    <Input
                      id="documentNumber"
                      value={guestData.documentNumber}
                      onChange={(e) => setGuestData({ ...guestData, documentNumber: e.target.value })}
                      placeholder="12345678A"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Foto Frontal del Documento</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <p className="text-sm text-muted-foreground">Arrastra la imagen o haz clic para subir</p>
                        <Button variant="outline" className="mt-2">Seleccionar Archivo</Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Foto Trasera del Documento (Opcional)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <p className="text-sm text-muted-foreground">Arrastra la imagen o haz clic para subir</p>
                        <Button variant="outline" className="mt-2">Seleccionar Archivo</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 4: Payment */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Pago y Confirmación</CardTitle>
                <CardDescription>
                  Completa el pago para confirmar tu reserva
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Resumen de la Reserva</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Fechas:</span>
                      <span>{checkIn && checkOut ? `${format(checkIn, 'dd/MM')} - ${format(checkOut, 'dd/MM')}` : 'No seleccionadas'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tipo de cama:</span>
                      <span>{selectedBedType || 'No seleccionada'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Noches:</span>
                      <span>{checkIn && checkOut ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) : 0}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>€{checkIn && checkOut && selectedBedType ? 
                        (Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) * 
                        (selectedBedType === 'Private' ? 35 : 15)) : 0}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleBookingSubmit} 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading || !checkIn || !checkOut || !selectedBedType}
                >
                  {isLoading ? 'Procesando...' : 'Confirmar Reserva y Pagar'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};