import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Bed {
  id: string;
  room: string;
  number: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  guestName?: string;
  checkOut?: string;
}

export const BedMap: React.FC = () => {
  const [beds] = useState<Bed[]>([
    // Dormitorio A - 12 camas
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `dorm-a-${i + 1}`,
      room: 'Dormitorio A',
      number: i + 1,
      status: i < 8 ? 'occupied' : i < 10 ? 'reserved' : 'available',
      guestName: i < 8 ? `Peregrino ${i + 1}` : undefined,
      checkOut: i < 8 ? '2025-07-26' : undefined,
    } as Bed)),
    // Dormitorio B - 10 camas  
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `dorm-b-${i + 1}`,
      room: 'Dormitorio B',
      number: i + 1,
      status: i < 6 ? 'occupied' : i < 8 ? 'reserved' : 'available',
      guestName: i < 6 ? `Peregrino ${i + 13}` : undefined,
      checkOut: i < 6 ? '2025-07-26' : undefined,
    } as Bed)),
    // Habitaciones privadas - 2 habitaciones
    {
      id: 'private-1',
      room: 'Habitación Privada',
      number: 1,
      status: 'occupied',
      guestName: 'María González',
      checkOut: '2025-07-27',
    },
    {
      id: 'private-2', 
      room: 'Habitación Privada',
      number: 2,
      status: 'available',
    },
  ]);

  const getStatusColor = (status: Bed['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'occupied':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'maintenance':
        return 'bg-gray-100 border-gray-500 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getStatusText = (status: Bed['status']) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return 'Desconocido';
    }
  };

  const bedsByRoom = beds.reduce((acc, bed) => {
    if (!acc[bed.room]) {
      acc[bed.room] = [];
    }
    acc[bed.room].push(bed);
    return acc;
  }, {} as Record<string, Bed[]>);

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm">Ocupada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm">Reservada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span className="text-sm">Mantenimiento</span>
        </div>
      </div>

      {/* Bed Rooms */}
      {Object.entries(bedsByRoom).map(([roomName, roomBeds]) => (
        <Card key={roomName}>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{roomName}</h3>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {roomBeds.map((bed) => (
                <Card
                  key={bed.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${getStatusColor(bed.status)} border-2`}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">
                          {bed.room.includes('Privada') ? `Hab. ${bed.number}` : `Cama ${bed.number}`}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getStatusText(bed.status)}
                        </Badge>
                      </div>
                      
                      {bed.guestName && (
                        <div className="text-xs space-y-1">
                          <p className="font-medium truncate">{bed.guestName}</p>
                          {bed.checkOut && (
                            <p className="text-muted-foreground">
                              Sale: {new Date(bed.checkOut).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </div>
                      )}

                      {bed.status === 'available' && (
                        <Button size="sm" variant="outline" className="w-full text-xs">
                          Asignar
                        </Button>
                      )}

                      {bed.status === 'occupied' && (
                        <div className="space-y-1">
                          <Button size="sm" variant="outline" className="w-full text-xs">
                            Ver Detalle
                          </Button>
                          <Button size="sm" variant="ghost" className="w-full text-xs">
                            Check-out
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {beds.filter(b => b.status === 'available').length}
              </p>
              <p className="text-sm text-muted-foreground">Disponibles</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {beds.filter(b => b.status === 'occupied').length}
              </p>
              <p className="text-sm text-muted-foreground">Ocupadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {beds.filter(b => b.status === 'reserved').length}
              </p>
              <p className="text-sm text-muted-foreground">Reservadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {beds.filter(b => b.status === 'maintenance').length}
              </p>
              <p className="text-sm text-muted-foreground">Mantenimiento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};