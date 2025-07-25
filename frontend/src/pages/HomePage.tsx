import React from 'react'
import { Link } from 'wouter'
import { MapPin, Info, Calendar, Settings } from 'lucide-react'

const HomePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Albergue del Carrascalejo
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Bienvenido a tu refugio en la Vía de la Plata. 
          Tu hogar en el Camino de Santiago hacia Compostela.
        </p>
        <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
          <MapPin className="w-4 h-4 mr-1" />
          <span>Carrascalejo, Cáceres • Extremadura • España</span>
        </div>
      </header>

      {/* Navigation Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Link href="/info">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer group">
            <div className="flex items-center mb-4">
              <Info className="w-8 h-8 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">
                Información Local
              </h2>
            </div>
            <p className="text-gray-600 text-sm">
              Descubre qué ver en Mérida, dónde comer, servicios de taxi, 
              alquiler de coches y información de emergencia.
            </p>
            <div className="mt-4 text-blue-600 text-sm font-medium group-hover:text-blue-700">
              Ver información →
            </div>
          </div>
        </Link>

        <Link href="/booking">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer group">
            <div className="flex items-center mb-4">
              <Calendar className="w-8 h-8 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">
                Reservar Cama
              </h2>
            </div>
            <p className="text-gray-600 text-sm">
              Reserva tu cama en nuestro albergue. 24 plazas disponibles 
              en habitaciones compartidas y privadas.
            </p>
            <div className="mt-4 text-green-600 text-sm font-medium group-hover:text-green-700">
              Hacer reserva →
            </div>
          </div>
        </Link>

        <Link href="/admin">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer group">
            <div className="flex items-center mb-4">
              <Settings className="w-8 h-8 text-purple-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">
                Administración
              </h2>
            </div>
            <p className="text-gray-600 text-sm">
              Panel de control para gestionar reservas, pagos en efectivo 
              y estadísticas del albergue.
            </p>
            <div className="mt-4 text-purple-600 text-sm font-medium group-hover:text-purple-700">
              Acceder →
            </div>
          </div>
        </Link>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Sobre el Albergue
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Nuestra Historia
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              El Albergue del Carrascalejo se encuentra en el corazón de la 
              Vía de la Plata, la ruta jacobea que conecta Sevilla con Santiago 
              de Compostela. Nuestro pequeño pueblo de 300 habitantes acoge 
              cada año a miles de peregrinos en su camino hacia Santiago.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Servicios
            </h3>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• 24 camas en habitaciones compartidas</li>
              <li>• 2 habitaciones privadas</li>
              <li>• Cocina equipada para peregrinos</li>
              <li>• WiFi gratuito</li>
              <li>• Lavadora y secadora</li>
              <li>• Desayuno casero (opcional)</li>
              <li>• Sello del Camino</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage