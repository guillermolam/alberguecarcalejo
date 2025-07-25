import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { MapPin, Calendar, Info, User } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Albergue del Carrascalejo
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Tu refugio en la Vía de la Plata. Bienvenido a nuestro albergue municipal 
          en el corazón de Extremadura, camino a Santiago de Compostela.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/booking">
            <Button size="lg" className="gap-2">
              <Calendar className="h-5 w-5" />
              Reservar Ahora
            </Button>
          </Link>
          <Link href="/info">
            <Button variant="outline" size="lg" className="gap-2">
              <Info className="h-5 w-5" />
              Información Local
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicación Perfecta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Situado en el kilómetro 626 de la Vía de la Plata, el lugar ideal 
              para descansar en tu peregrinaje hacia Santiago.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Reserva Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Sistema de reservas 24/7 con confirmación inmediata. 
              Garantiza tu lugar en nuestras instalaciones.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Información Completa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Descubre qué ver en Mérida, dónde comer, cómo moverte 
              y toda la información que necesitas para tu estancia.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="bg-muted rounded-lg p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          ¿Listo para continuar tu camino?
        </h2>
        <p className="text-muted-foreground mb-6">
          Reserva tu lugar en el Albergue del Carrascalejo y disfruta de una 
          estancia cómoda en tu peregrinaje por la Vía de la Plata.
        </p>
        <Link href="/booking">
          <Button size="lg">
            Hacer Reserva
          </Button>
        </Link>
      </div>
    </div>
  );
}