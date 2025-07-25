import React from 'react'
import { ArrowLeft, Calendar, Bed, Users } from 'lucide-react'
import { Link } from 'wouter'

const BookingPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/">
          <ArrowLeft className="w-6 h-6 mr-3 text-gray-600 hover:text-gray-800 cursor-pointer" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Reservar Cama</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Calendar className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Próximamente disponible
          </h2>
          <p className="text-gray-600">
            El sistema de reservas online estará disponible próximamente. 
            Mientras tanto, puedes contactar directamente con el albergue.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Información de Contacto
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-700 w-20">Teléfono:</span>
                <a href="tel:+34924123456" className="text-blue-600 hover:text-blue-700">
                  +34 924 123 456
                </a>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-700 w-20">Email:</span>
                <a href="mailto:info@alberguecarrascalejo.com" className="text-blue-600 hover:text-blue-700">
                  info@alberguecarrascalejo.com
                </a>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-gray-700 w-20">Horario:</span>
                <div className="text-gray-600">
                  <div>8:00 - 22:00 (Recepción)</div>
                  <div>24h (Emergencias)</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Disponibilidad y Precios
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Bed className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="text-gray-700">Cama en dormitorio</span>
                </div>
                <span className="font-semibold text-gray-800">15€/noche</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="text-gray-700">Habitación privada</span>
                </div>
                <span className="font-semibold text-gray-800">35€/noche</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                Servicios incluidos:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ropa de cama y toallas</li>
                <li>• WiFi gratuito</li>
                <li>• Cocina equipada</li>
                <li>• Lavadora y secadora</li>
                <li>• Sello del Camino</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Llamar para Reservar
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingPage