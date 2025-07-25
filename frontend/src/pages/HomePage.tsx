import RegistrationForm from "../components/registration-form";
import { Globe, User } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" fill="#9CA65A"/>
                <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="#9CA65A" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900">Albergue Del Carrascalejo</span>
            </div>
          </div>
          
          {/* Right side navigation */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
              <Globe className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Español</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {/* Admin Link */}
            <div className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 cursor-pointer">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Administración</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section with Sage Green Background */}
        <div style={{backgroundColor: 'hsl(var(--albergue-dark-green))'}} className="text-white py-12 px-8 mb-8 -mx-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Bienvenido Peregrino
            </h1>
            <p className="text-lg opacity-90 mb-6">
              Registro rápido y seguro para tu estancia en el Camino
            </p>
            
            {/* Stats Display */}
            <div className="flex justify-center items-center gap-8 text-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">24</div>
                <div className="text-sm opacity-80">Camas disponibles</div>
              </div>
              <div className="w-px h-12 opacity-60" style={{backgroundColor: 'hsl(var(--albergue-sage))'}}></div>
              <div className="text-center">
                <div className="text-2xl font-bold">15€</div>
                <div className="text-sm opacity-80">Por persona/noche</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Registration Form */}
        <RegistrationForm />
      </div>
    </div>
  );
}