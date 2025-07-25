import React from 'react'
import { ArrowLeft, Shield, Settings, BarChart3, Users } from 'lucide-react'
import { Link } from 'wouter'

const AdminPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/">
          <ArrowLeft className="w-6 h-6 mr-3 text-gray-600 hover:text-gray-800 cursor-pointer" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-gray-600">
            Esta área está reservada para el personal autorizado del albergue.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Estadísticas</h3>
            <p className="text-sm text-gray-600">
              Ocupación, ingresos y métricas del albergue
            </p>
          </div>
          
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <Users className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Reservas</h3>
            <p className="text-sm text-gray-600">
              Gestión de reservas y pagos en efectivo
            </p>
          </div>
          
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <Settings className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Configuración</h3>
            <p className="text-sm text-gray-600">
              Precios, disponibilidad y configuración
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">
              🔐 Autenticación requerida
            </h4>
            <p className="text-sm text-yellow-700 mb-4">
              Para acceder al panel de administración, necesitas credenciales válidas. 
              El sistema de autenticación se integrará con Auth0 en la próxima versión.
            </p>
            <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors">
              Solicitar Acceso
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage