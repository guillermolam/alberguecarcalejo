import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Info, ShieldQuestion } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/contexts/i18n-context";
import { auth0Service } from "@/lib/auth0";

export default function Home() {
  const { t } = useI18n();

  const handleAdminLogin = async () => {
    try {
      await auth0Service.loginWithRedirect();
      // If successful, user will be redirected to /admin
    } catch (error) {
      console.error('Admin login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink min-w-0">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                <img 
                  src="https://le-de.cdn-website.com/4e684d9f728943a6941686bc89abe581/dms3rep/multi/opt/logoalbergue__msi___jpeg-1920w.jpeg"
                  alt="Albergue Del Carrascalejo"
                  className="h-8 sm:h-10 w-auto flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-gray-900 font-title truncate min-w-0">
                  <span className="hidden sm:inline">Albergue del Carrascalejo</span>
                  <span className="sm:hidden">Albergue Del Carrascalejo</span>
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <LanguageSelector />
              <Button
                onClick={handleAdminLogin}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <ShieldQuestion className="w-4 h-4 mr-2" />
                Admin
              </Button>
              <Button
                onClick={handleAdminLogin}
                variant="outline"
                size="sm"
                className="sm:hidden p-2"
              >
                <ShieldQuestion className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
      </main>
    </div>
  );
}