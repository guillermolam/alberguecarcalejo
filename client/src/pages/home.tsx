import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";
import { StayInfoForm, StayData } from "@/components/stay-info-form";
import { RegistrationForm } from "@/components/registration-form";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ShieldQuestion, Mountain, CheckCircle } from "lucide-react";
import { i18n } from "@/lib/i18n";
import { PRICE_PER_NIGHT } from "@/lib/constants";

type Step = 'stay-info' | 'registration' | 'success';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('stay-info');
  const [stayData, setStayData] = useState<StayData | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dashboard/stats');
      return response.json();
    }
  });

  const handleStayInfoSubmit = (data: StayData) => {
    setStayData(data);
    setCurrentStep('registration');
  };

  const handleBackToStayInfo = () => {
    setCurrentStep('stay-info');
  };

  const handleRegistrationSuccess = () => {
    setCurrentStep('success');
  };

  const handleStartOver = () => {
    setCurrentStep('stay-info');
    setStayData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Mountain className="text-blue-600 text-2xl" />
                <h1 className="text-xl font-semibold text-gray-900">
                  {i18n.t('nav.title')}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <Button
                onClick={() => setShowAdmin(!showAdmin)}
                variant="outline"
                size="sm"
              >
                <ShieldQuestion className="w-4 h-4 mr-2" />
                {i18n.t('nav.admin')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {i18n.t('hero.welcome')}
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              {i18n.t('hero.subtitle')}
            </p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-4 text-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-300">
                    {dashboardStats?.occupancy?.available || 0}
                  </div>
                  <div className="text-sm text-blue-100">
                    {i18n.t('hero.beds_available')}
                  </div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-300">
                    {PRICE_PER_NIGHT}€
                  </div>
                  <div className="text-sm text-blue-100">
                    {i18n.t('hero.price_per_night')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentStep === 'stay-info' && (
            <StayInfoForm onContinue={handleStayInfoSubmit} />
          )}
          
          {currentStep === 'registration' && stayData && (
            <RegistrationForm
              stayData={stayData}
              onBack={handleBackToStayInfo}
              onSuccess={handleRegistrationSuccess}
            />
          )}
          
          {currentStep === 'success' && (
            <Card className="w-full max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    ¡Registro completado!
                  </h3>
                  <p className="text-gray-600">
                    Tu registro ha sido enviado exitosamente a las autoridades españolas.
                  </p>
                </div>
                
                <Alert className="bg-blue-50 border-blue-200 mb-6">
                  <AlertDescription className="text-blue-700">
                    <strong>Próximos pasos:</strong><br />
                    • Dirígete a la recepción para el check-in<br />
                    • Presenta tu documento de identidad<br />
                    • Realiza el pago si seleccionaste efectivo
                  </AlertDescription>
                </Alert>
                
                <Button onClick={handleStartOver} className="w-full">
                  Realizar otro registro
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
