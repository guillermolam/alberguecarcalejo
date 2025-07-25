import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, Users } from 'lucide-react';

export interface StayData {
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: 'dormitory' | 'private';
}

interface StayInfoFormProps {
  onContinue: (data: StayData) => void;
}

export const StayInfoForm: React.FC<StayInfoFormProps> = ({ onContinue }) => {
  const [formData, setFormData] = useState<StayData>({
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomType: 'dormitory'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue(formData);
  };

  const handleInputChange = (field: keyof StayData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Información de la Estancia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Fecha de llegada</Label>
              <Input
                id="checkIn"
                type="date"
                value={formData.checkIn}
                onChange={(e) => handleInputChange('checkIn', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Fecha de salida</Label>
              <Input
                id="checkOut"
                type="date"
                value={formData.checkOut}
                onChange={(e) => handleInputChange('checkOut', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="guests">Número de huéspedes</Label>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <Input
                id="guests"
                type="number"
                min="1"
                max="4"
                value={formData.guests}
                onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de habitación</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className={`p-4 border rounded-lg text-left ${
                  formData.roomType === 'dormitory' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-200'
                }`}
                onClick={() => handleInputChange('roomType', 'dormitory')}
              >
                <div className="font-semibold">Dormitorio</div>
                <div className="text-sm text-gray-600">15€ por noche</div>
              </button>
              <button
                type="button"
                className={`p-4 border rounded-lg text-left ${
                  formData.roomType === 'private' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-200'
                }`}
                onClick={() => handleInputChange('roomType', 'private')}
              >
                <div className="font-semibold">Habitación privada</div>
                <div className="text-sm text-gray-600">35€ por noche</div>
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Continuar con el registro
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};