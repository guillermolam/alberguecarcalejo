import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Calendar, Users, Bed, MapPin, Clock } from "lucide-react";
import { formatPrice } from "../lib/utils";
// Import types from database schema (when available)

// Room aggregation type for display
type Room = {
  id: string;
  name: string;
  type: string;
  beds: number;
  price: number;
  available: number;
  amenities: string[];
};

export default function BookingPage() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
    queryFn: () => fetch("/api/rooms").then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Cargando habitaciones...</div>
      </div>
    );
  }

  const mockRooms = [
    {
      id: "dorm-a",
      name: "Dormitorio A",
      type: "Compartido",
      beds: 12,
      price: 15,
      available: 8,
      amenities: ["Taquillas", "Enchufes", "Ventanas"]
    },
    {
      id: "dorm-b", 
      name: "Dormitorio B",
      type: "Compartido",
      beds: 10,
      price: 15,
      available: 6,
      amenities: ["Taquillas", "Enchufes", "Aire acondicionado"]
    },
    {
      id: "private-1",
      name: "Habitación Privada 1",
      type: "Privada",
      beds: 2,
      price: 35,
      available: 1,
      amenities: ["Baño privado", "TV", "Aire acondicionado"]
    },
    {
      id: "private-2",
      name: "Habitación Privada 2", 
      type: "Privada",
      beds: 2,
      price: 35,
      available: 0,
      amenities: ["Baño privado", "TV", "Terraza"]
    }
  ];

  // Use actual rooms data if available, otherwise fall back to mock data
  const displayRooms = rooms.length > 0 ? rooms : mockRooms;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Reservar Alojamiento</h1>
        <p className="text-muted-foreground">
          Elige tu habitación en el Albergue del Carrascalejo
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ventana de Reserva
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Tienes <strong>2 horas</strong> para completar tu reserva una vez iniciado el proceso.
            Después de este tiempo, tu selección será liberada automáticamente.
          </p>
        </CardContent>
      </Card>

      {/* Room Selection */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Habitaciones Disponibles</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {displayRooms.map((room) => (
            <Card 
              key={room.id} 
              className={`cursor-pointer transition-colors ${
                selectedRoom === room.id 
                  ? "border-primary bg-primary/5" 
                  : room.available === 0 
                    ? "opacity-50" 
                    : "hover:border-primary/50"
              }`}
              onClick={() => {
                const isAvailable = room.available !== undefined ? room.available > 0 : room.available;
                if (isAvailable) setSelectedRoom(room.id);
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    <CardDescription>{room.type}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {room.pricePerNight ? formatPrice(room.pricePerNight) : `€${room.price}`}
                    </div>
                    <div className="text-sm text-muted-foreground">por noche</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    <span className="text-sm">{room.capacity || room.beds} camas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {room.available !== undefined ? room.available : (room.available ? "Disponible" : "No disponible")} 
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {(room.amenities || []).map((amenity) => (
                    <Badge key={amenity} variant="outline" className="text-xs">
                      {typeof amenity === 'string' ? amenity : JSON.stringify(amenity)}
                    </Badge>
                  ))}
                </div>

                {((room.available !== undefined && room.available === 0) || !room.available) && (
                  <Badge variant="destructive" className="w-fit">
                    No disponible
                  </Badge>
                )}
                
                {selectedRoom === room.id && (
                  <Badge variant="default" className="w-fit">
                    Seleccionada
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Booking Form Preview */}
      {selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Reserva</CardTitle>
            <CardDescription>
              Confirma los detalles antes de proceder al pago
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha de llegada</label>
                <div className="mt-1 p-2 border rounded text-sm">
                  Seleccionar fecha
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Fecha de salida</label>
                <div className="mt-1 p-2 border rounded text-sm">
                  Seleccionar fecha
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Habitación seleccionada</label>
              <div className="mt-1 p-2 bg-muted rounded text-sm">
                {rooms.find(r => r.id === selectedRoom)?.name} - €{rooms.find(r => r.id === selectedRoom)?.price}/noche
              </div>
            </div>

            <div className="pt-4">
              <Button size="lg" className="w-full">
                Continuar con el Proceso de Reserva
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            El Carrascalejo, Km 626 Vía de la Plata, Cáceres, Extremadura
          </p>
          <p className="text-sm">
            Situado en el corazón de la ruta jacobea, nuestro albergue municipal 
            ofrece el descanso perfecto para continuar tu peregrinaje hacia Santiago de Compostela.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}