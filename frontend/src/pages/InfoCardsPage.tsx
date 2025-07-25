import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Utensils, Car, Phone, AlertTriangle, ExternalLink } from 'lucide-react'
import { Link } from 'wouter'

interface InfoCard {
  id: string
  title: string
  content: string
  links: Array<{
    title: string
    url: string
    description?: string
    phone?: string
    address?: string
    rating?: number
    price_range?: string
    link_type: string
  }>
  priority: number
  last_updated: string
}

const InfoCardsPage: React.FC = () => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  // Simulate loading info cards data
  const { data: cards, isLoading, error } = useQuery({
    queryKey: ['info-cards'],
    queryFn: async () => {
      // In a real implementation, this would call the WASM info-on-arrival service
      const mockCards: InfoCard[] = [
        {
          id: 'merida-attractions',
          title: 'Qué ver en Mérida',
          content: 'Descubre los tesoros romanos de Mérida, Patrimonio de la Humanidad UNESCO.',
          links: [
            {
              title: 'Teatro Romano',
              url: 'https://www.consorciomerida.org/teatro-romano',
              description: 'Espectacular teatro del siglo I a.C.',
              link_type: 'Website'
            },
            {
              title: 'Museo Nacional de Arte Romano',
              url: 'https://www.culturaydeporte.gob.es/mnar',
              description: 'Impresionante colección de arte romano',
              link_type: 'Website'
            }
          ],
          priority: 1,
          last_updated: '2024-01-15T10:30:00Z'
        },
        {
          id: 'restaurants',
          title: 'Dónde y qué comer cerca',
          content: 'Restaurantes recomendados en Mérida con cocina tradicional extremeña.',
          links: [
            {
              title: 'Restaurante Rex Numitor',
              url: 'https://turismomerida.org/donde-comer/',
              description: 'Cocina extremeña junto al Teatro Romano. Especialidad en carnes ibéricas.',
              phone: '+34 924 314 261',
              address: 'Calle de José Ramón Mélida, 06800 Mérida',
              rating: 4.3,
              price_range: '25-35€ por persona',
              link_type: 'Restaurant'
            },
            {
              title: 'Tabula Calda',
              url: 'https://www.tabulacalda.com/',
              description: 'Restaurante romano temático con ambiente histórico.',
              phone: '+34 924 304 512',
              address: 'Calle Romero Leal, 11, 06800 Mérida',
              rating: 4.5,
              price_range: '30-40€ por persona',
              link_type: 'Restaurant'
            }
          ],
          priority: 4,
          last_updated: '2024-01-15T10:30:00Z'
        },
        {
          id: 'taxi-services',
          title: 'Servicios de Taxi',
          content: 'Servicios de taxi disponibles 24 horas en Mérida y alrededores.',
          links: [
            {
              title: 'Radio Taxi Mérida',
              url: 'https://www.radiotaximerida.es/',
              description: 'Servicio principal de taxi 24 horas. Tarifas oficiales.',
              phone: '+34 924 371 111',
              address: 'Mérida centro',
              rating: 4.1,
              price_range: 'Desde Carrascalejo: ~35-45€',
              link_type: 'Taxi'
            }
          ],
          priority: 6,
          last_updated: '2024-01-15T10:30:00Z'
        },
        {
          id: 'emergency-contacts',
          title: 'Emergencias y Contactos Útiles',
          content: 'Números importantes para tu seguridad.',
          links: [
            {
              title: '🚨 Emergencias',
              url: 'tel:112',
              description: 'Número europeo de emergencias (24h)',
              phone: '112',
              link_type: 'Emergency'
            },
            {
              title: '👮 Guardia Civil',
              url: 'tel:062',
              description: 'Fuerzas de seguridad (24h)',
              phone: '062',
              link_type: 'Emergency'
            }
          ],
          priority: 10,
          last_updated: '2024-01-15T10:30:00Z'
        }
      ]
      return mockCards
    }
  })

  const getCardIcon = (cardId: string) => {
    switch (cardId) {
      case 'merida-attractions':
        return <MapPin className="w-6 h-6" />
      case 'restaurants':
        return <Utensils className="w-6 h-6" />
      case 'taxi-services':
      case 'car-rentals':
        return <Car className="w-6 h-6" />
      case 'emergency-contacts':
        return <AlertTriangle className="w-6 h-6" />
      default:
        return <Phone className="w-6 h-6" />
    }
  }

  const getIconColor = (cardId: string) => {
    switch (cardId) {
      case 'merida-attractions':
        return 'text-blue-600'
      case 'restaurants':
        return 'text-green-600'
      case 'taxi-services':
      case 'car-rentals':
        return 'text-yellow-600'
      case 'emergency-contacts':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/">
            <ArrowLeft className="w-6 h-6 mr-3 text-gray-600 hover:text-gray-800 cursor-pointer" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Información para Peregrinos</h1>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/">
            <ArrowLeft className="w-6 h-6 mr-3 text-gray-600 hover:text-gray-800 cursor-pointer" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Información para Peregrinos</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error al cargar información</h2>
          <p className="text-red-600">
            No se pudo cargar la información de servicios. Por favor, intente más tarde.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/">
          <ArrowLeft className="w-6 h-6 mr-3 text-gray-600 hover:text-gray-800 cursor-pointer" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Información para Peregrinos</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cards List */}
        <div className="lg:col-span-1">
          <div className="space-y-3">
            {cards?.sort((a, b) => b.priority - a.priority).map((card) => (
              <div
                key={card.id}
                onClick={() => setSelectedCard(card.id)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedCard === card.id
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className={`mr-3 ${getIconColor(card.id)}`}>
                    {getCardIcon(card.id)}
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {card.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {card.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Card Details */}
        <div className="lg:col-span-2">
          {selectedCard ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              {(() => {
                const card = cards?.find(c => c.id === selectedCard)
                if (!card) return null

                return (
                  <>
                    <div className="flex items-center mb-4">
                      <div className={`mr-3 ${getIconColor(card.id)}`}>
                        {getCardIcon(card.id)}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {card.title}
                      </h2>
                    </div>
                    
                    <p className="text-gray-600 mb-6">
                      {card.content}
                    </p>

                    <div className="space-y-4">
                      {card.links.map((link, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 mb-1">
                                {link.title}
                              </h3>
                              {link.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {link.description}
                                </p>
                              )}
                              
                              <div className="space-y-1 text-sm">
                                {link.phone && (
                                  <div className="flex items-center text-gray-700">
                                    <Phone className="w-4 h-4 mr-2" />
                                    <a href={`tel:${link.phone}`} className="hover:text-blue-600">
                                      {link.phone}
                                    </a>
                                  </div>
                                )}
                                {link.address && (
                                  <div className="flex items-center text-gray-700">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    <span>{link.address}</span>
                                  </div>
                                )}
                                {link.rating && (
                                  <div className="flex items-center text-gray-700">
                                    <span className="mr-2">⭐</span>
                                    <span>{link.rating}/5</span>
                                  </div>
                                )}
                                {link.price_range && (
                                  <div className="text-green-600 font-medium">
                                    {link.price_range}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {link.url && !link.url.startsWith('tel:') && (
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-4 p-2 text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Última actualización: {new Date(card.last_updated).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Info className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Selecciona una categoría
              </h3>
              <p className="text-gray-500">
                Elige una categoría de la lista para ver información detallada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InfoCardsPage