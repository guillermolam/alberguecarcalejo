import React from 'react';
import { Bed, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface BedInfo {
  id: string;
  number: number;
  room: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  guest?: string;
}

interface BedSelectionMapProps {
  onBedSelect: (bedId: string) => void;
  selectedBed?: string;
  availableBeds?: BedInfo[];
  className?: string;
}

export function BedSelectionMap({ 
  onBedSelect, 
  selectedBed, 
  availableBeds = [],
  className 
}: BedSelectionMapProps) {
  // Mock bed data if none provided
  const defaultBeds: BedInfo[] = [
    // Dormitorio A
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `A${i + 1}`,
      number: i + 1,
      room: 'Dormitorio A',
      status: Math.random() > 0.3 ? 'available' : 'occupied' as BedInfo['status']
    })),
    // Dormitorio B
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `B${i + 1}`,
      number: i + 1,
      room: 'Dormitorio B',
      status: Math.random() > 0.4 ? 'available' : 'occupied' as BedInfo['status']
    })),
    // Private rooms
    { id: 'P1A', number: 1, room: 'Habitación Privada 1', status: 'available' },
    { id: 'P1B', number: 2, room: 'Habitación Privada 1', status: 'occupied' },
    { id: 'P2A', number: 1, room: 'Habitación Privada 2', status: 'available' },
    { id: 'P2B', number: 2, room: 'Habitación Privada 2', status: 'available' },
  ];

  const beds = availableBeds.length > 0 ? availableBeds : defaultBeds;

  const getBedStatusColor = (status: BedInfo['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 hover:bg-green-200';
      case 'occupied':
        return 'bg-red-100 border-red-300 cursor-not-allowed';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-300 cursor-not-allowed';
      case 'maintenance':
        return 'bg-gray-100 border-gray-300 cursor-not-allowed';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getBedStatusText = (status: BedInfo['status']) => {
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

  const groupedBeds = beds.reduce((groups, bed) => {
    const room = bed.room;
    if (!groups[room]) {
      groups[room] = [];
    }
    groups[room].push(bed);
    return groups;
  }, {} as Record<string, BedInfo[]>);

  const handleBedClick = (bed: BedInfo) => {
    if (bed.status === 'available') {
      onBedSelect(bed.id);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Selecciona tu cama</h3>
        <p className="text-sm text-gray-600 mb-4">
          Haz clic en una cama disponible para seleccionarla
        </p>
        
        <div className="flex justify-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>Ocupada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>Reservada</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {Object.entries(groupedBeds).map(([roomName, roomBeds]) => (
          <Card key={roomName}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bed className="h-4 w-4" />
                {roomName}
                <Badge variant="outline">
                  {roomBeds.filter(b => b.status === 'available').length} disponibles
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {roomBeds.map((bed) => (
                  <Button
                    key={bed.id}
                    variant="outline"
                    size="sm"
                    className={`
                      relative h-16 w-16 p-1 flex flex-col items-center justify-center
                      ${getBedStatusColor(bed.status)}
                      ${selectedBed === bed.id ? 'ring-2 ring-blue-500 bg-blue-100' : ''}
                    `}
                    onClick={() => handleBedClick(bed)}
                    disabled={bed.status !== 'available'}
                  >
                    <Bed className="h-4 w-4 mb-1" />
                    <span className="text-xs font-medium">{bed.id}</span>
                    {bed.status === 'occupied' && (
                      <User className="absolute top-1 right-1 h-2 w-2 text-red-600" />
                    )}
                  </Button>
                ))}
              </div>
              
              {selectedBed && roomBeds.some(b => b.id === selectedBed) && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Cama seleccionada:</strong> {selectedBed} en {roomName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}