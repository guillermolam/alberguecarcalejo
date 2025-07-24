import { LANGUAGES } from "./constants";

export interface Translations {
  [key: string]: string;
}

export const translations: Record<string, Translations> = {
  es: {
    "nav.title": "Albergue Del Carrascalejo",
    "nav.admin": "Administración",
    "hero.welcome": "Bienvenido Peregrino",
    "hero.subtitle": "Registro rápido y seguro para tu estancia en el Camino",
    "hero.beds_available": "Camas disponibles",
    "hero.price_per_night": "Por persona/noche",
    "stay.title": "Información de la estancia",
    "stay.dates": "Fechas de estancia",
    "stay.nights": "Número de noches",
    "stay.guests": "Personas",
    "stay.guest_single": "persona",
    "stay.guest_plural": "personas",
    "stay.individual_only": "Solo registro individual",
    "stay.continue": "Continuar con el registro",
    "stay.available": "¡Disponible! {count} camas libres para las fechas seleccionadas",
    "stay.not_available": "No hay suficientes camas disponibles para estas fechas",
    "stay.next_available": "Próxima fecha disponible: {date}",
    "stay.check_in": "Entrada",
    "stay.check_out": "Salida",
    
    "pricing.per_night": "por noche",
    "pricing.night": "noche",
    "pricing.nights": "noches",
    "pricing.total": "Total",
    "pricing.payment_due": "Pago a la llegada",
    "pricing.accepted_methods": "Métodos aceptados de pago",
    
    "registration.title": "Registro de peregrino",
    "registration.step1": "Fechas y huéspedes",
    "registration.step2": "Información personal",
    "registration.step3": "Confirmación",
    "registration.photo_capture": "Fotografía del documento",
    "registration.take_photo": "Tomar foto",
    "registration.upload_photo": "Subir imagen",
    "registration.photo_instructions": "Tome una foto clara de su DNI, NIE o pasaporte",
    "registration.processing_ocr": "Procesando documento...",
    "registration.ocr_success": "Documento procesado correctamente",
    "registration.document_type": "Tipo de documento",
    "registration.select_document_type": "Seleccionar tipo de documento",
    "registration.document_info_title": "Información del documento",
    "registration.document_info_text": "Selecciona el tipo de documento y sube fotos para procesar",
    "registration.personal_info": "Información personal",
    "registration.address_info": "Dirección",
    "registration.contact_info": "Contacto",
    "registration.payment_info": "Información de pago",
    "registration.first_name": "Nombre",
    "registration.last_name_1": "Primer apellido",
    "registration.last_name_2": "Segundo apellido",
    "registration.birth_date": "Fecha de nacimiento",
    "registration.document_number": "Número de documento",
    "registration.document_support": "Número de soporte",
    "registration.expiry_date": "Fecha de vencimiento",
    "registration.gender": "Sexo",
    "registration.nationality": "Nacionalidad",
    "registration.upload_file": "Subir archivo",
    "registration.country": "País",
    "registration.select_country": "Seleccionar país",
    "registration.address": "Dirección",
    "registration.address_2": "Dirección adicional",
    "registration.city": "Ciudad",
    "registration.postal_code": "Código postal",
    "registration.municipality_code": "Código municipio",
    "registration.phone": "Teléfono",
    "registration.email": "Email",
    "registration.payment_type": "Tipo de pago",
    "registration.total": "Total",
    "registration.compliance": "Cumplimiento normativo",
    "registration.compliance_text": "Tus datos serán transmitidos automáticamente a las autoridades españolas según el Real Decreto 933/2021 sobre obligaciones de registro en hospedajes.",
    "registration.back": "Volver",
    "registration.submit": "Completar registro",
    "registration.continue_to_bed_selection": "Continuar a selección de cama",
    "registration.check_required_fields": "Por favor revise los campos requeridos",
    "registration.booking_confirmed": "Reserva confirmada exitosamente",
    "registration.male": "Hombre",
    "registration.female": "Mujer",
    "registration.other": "Otro",
    "registration.select_gender": "Seleccionar sexo",
    
    // Arrival time picker
    "arrival.title": "Hora estimada de llegada",
    "arrival.estimated_time": "Hora estimada de llegada",
    "arrival.select_time": "Seleccionar hora",
    "arrival.required": "La hora de llegada es obligatoria",
    
    // Bed selection
    "bed_selection.title": "Selección de cama",
    "bed_selection.choose_bed": "Elige tu cama",
    "bed_selection.available": "Disponible",
    "bed_selection.occupied": "Ocupado",
    "bed_selection.selected": "Seleccionado",
    "bed_selection.confirm": "Confirmar selección",
    "bed_selection.confirmed": "Confirmado",
    "bed_selection.top_bunk": "Litera superior",
    "bed_selection.bottom_bunk": "Litera inferior",
    
    // Confirmation
    "confirmation.review_booking": "Revisar reserva",
    "confirmation.review_details": "Por favor revise todos los detalles antes de confirmar",
    "confirmation.personal_info": "Información personal",
    "confirmation.contact_info": "Información de contacto",
    "confirmation.stay_info": "Información de estancia",
    "confirmation.bed_assignment": "Asignación de cama",
    "confirmation.payment_info": "Información de pago",
    "confirmation.important_notice": "Aviso importante",
    "confirmation.cancellation_policy": "Política de cancelación de 1 hora después de la llegada",
    "confirmation.check_in_time": "Check-in disponible a partir de las 15:00",
    "confirmation.payment_due": "Pago debido a la llegada",
    "confirmation.back": "Volver",
    "confirmation.confirm_booking": "Confirmar reserva",
    "confirmation.processing": "Procesando...",
    
    // Success
    "success.congratulations": "¡Felicitaciones!",
    "success.booking_confirmed": "Su reserva ha sido confirmada",
    "success.reference_number": "Número de referencia",
    "success.what_happens_next": "¿Qué pasa ahora?",
    "success.email_sent": "Email de confirmación enviado",
    "success.owner_notified": "Propietario notificado",
    "success.government_submitted": "Datos enviados al gobierno",
    "success.bed_reserved": "Cama reservada",
    "success.explore_area": "Explora el área",
    "success.recommendations": "Recomendaciones para peregrinos",
    "success.attractions": "Atracciones",
    "success.dining": "Restaurantes",
    "success.services": "Servicios",
    "success.need_help": "¿Necesitas ayuda?",
    "success.contact_reception": "Contacta con recepción:",
    "success.new_booking": "Nueva reserva",
    
    // Documents
    "document.nif": "DNI/NIF",
    "document.nie": "NIE",
    "document.pas": "Pasaporte",
    "document.otro": "Otro documento",
    "document.upload_title": "Escanea y sube tu documento",
    "document.type_required": "Tipo de documento *",
    "document.select_first": "Seleccione el tipo de documento primero",
    "document.front_side": "Cara frontal",
    "document.back_side": "Cara trasera",
    "document.main_page": "Página principal",
    "document.processed_successfully": "Procesado correctamente",
    "document.processing_complete": "¡Procesamiento de documento completado!",
    "document.processing_complete_desc": "Todas las caras requeridas del documento han sido procesadas correctamente.",
    "document.remove": "Eliminar",
    "document.camera": "Cámara",
    "document.upload": "Subir archivo",
    "document.take_photo": "Tomar foto",
    "document.select_file": "Seleccionar archivo",
    "document.expected_front": "Esperado: Nombre, número de documento, foto, fecha de validez",
    "document.expected_back": "Esperado: Dirección, código postal, detalles adicionales",
    
    // Payment
    "payment.efect": "Efectivo (en recepción)",
    "payment.tarjt": "Tarjeta de crédito/débito",
    "payment.trans": "Transferencia bancaria",
    "payment.cash": "Efectivo (en recepción)",
    "payment.card": "Tarjeta de crédito/débito",
    "payment.bizum": "Bizum",
    "payment.transfer": "Transferencia bancaria",
    
    // Gender
    "gender.h": "Hombre",
    "gender.m": "Mujer",
    "gender.o": "Otro",
    
    // Documents
    "documents.dni": "DNI/NIF (España)",
    "documents.nie": "NIE (España)",
    "documents.passport": "Pasaporte",
    "documents.other": "Otro documento",
    
    // Guest/Night
    "guest.singular": "persona",
    "guest.plural": "personas",
    "night.singular": "noche",
    "night.plural": "noches",
    
    // Admin
    "admin.title": "Panel de Administración",
    "admin.dashboard": "Dashboard",
    "admin.checkin": "Check-in",
    "admin.checkout": "Check-out",
    "admin.beds": "Gestión de camas",
    "admin.payments": "Pagos",
    "admin.occupancy_today": "Ocupación hoy",
    "admin.revenue_today": "Ingresos hoy",
    "admin.pending_checkins": "Check-ins pendientes",
    "admin.compliance_rate": "Tasa cumplimiento",
    "admin.bed_status": "Estado de las camas",
    "admin.available": "Disponible",
    "admin.occupied": "Ocupado",
    "admin.maintenance": "Mantenimiento",
    "admin.recent_registrations": "Registros recientes",
    "admin.pilgrim": "Peregrino",
    "admin.document": "Documento",
    "admin.bed": "Cama",
    "admin.status": "Estado",
    "admin.actions": "Acciones",
    "admin.view_details": "Ver detalles",
    "admin.assign_bed": "Asignar cama",
    "admin.no_bookings": "No hay reservas recientes",
    "admin.coming_soon": "Funcionalidad de pagos próximamente...",
    
    // Notifications
    "notifications.success": "Registro completado con éxito",
    "notifications.error": "Error en el envío de datos",
    "notifications.validation_error": "Error de validación",
    
    // Loading
    "loading.submitting": "Enviando datos a las autoridades españolas...",
    "loading.processing": "Procesando...",
    
    // Errors
    "errors.required": "Este campo es obligatorio",
    "errors.invalid_email": "Email inválido",
    "errors.invalid_document": "Formato de documento inválido",
    "errors.invalid_phone": "Formato de teléfono inválido",
    
    // Auth
    "auth.welcome": "Bienvenido",
    "auth.logout": "Cerrar sesión",
    "auth.login_required": "Autenticación requerida",
    "auth.loading": "Cargando panel de administración...",
    
    // Validation
    "validation.first_name_required": "El nombre es obligatorio",
    "validation.last_name_required": "El apellido es obligatorio",
    "validation.birth_date_required": "La fecha de nacimiento es obligatoria",
    "validation.document_number_required": "El número de documento es obligatorio",
    "validation.document_type_required": "El tipo de documento es obligatorio",
    "validation.gender_required": "El género es obligatorio",
    "validation.nationality_required": "La nacionalidad es obligatoria",
    "validation.phone_required": "El teléfono es obligatorio",
    "validation.country_required": "El país es obligatorio",
    "validation.email_invalid": "Email inválido",
    "validation.address_required": "La dirección es obligatoria",
    "validation.city_required": "La ciudad es obligatoria",
    "validation.postal_code_required": "El código postal es obligatorio",
    "validation.payment_type_required": "El tipo de pago es obligatorio",
    "validation.document_expired": "Documento caducado",
    "validation.document_expired_desc": "El documento ha caducado. Por favor, utilice un documento vigente.",
    
    // Common
    "common.cancel": "Cancelar",
    
    // General
    "general.locale_code": "es-ES",
  },
  
  en: {
    "nav.title": "Albergue Del Carrascalejo",
    "nav.admin": "Administration",
    "hero.welcome": "Welcome Pilgrim",
    "hero.subtitle": "Quick and secure registration for your stay on the Camino",
    "hero.beds_available": "Beds available",
    "hero.price_per_night": "Per person/night",
    "stay.title": "Stay information",
    "stay.dates": "Stay dates",
    "stay.nights": "Number of nights",
    "stay.guests": "Guests",
    "stay.guest_single": "person",
    "stay.guest_plural": "people",
    "stay.individual_only": "Individual registration only",
    "stay.continue": "Continue with registration",
    "stay.available": "Available! {count} free beds for selected dates",
    "stay.not_available": "Not enough beds available for these dates",
    "stay.next_available": "Next available date: {date}",
    "stay.check_in": "Check-in",
    "stay.check_out": "Check-out",
    
    // Continue with English translations - abbreviated for now
    "registration.title": "Pilgrim registration",
    "registration.submit": "Complete registration",
    "registration.continue_to_bed_selection": "Continue to bed selection",
    "arrival.title": "Estimated arrival time",
    "bed_selection.title": "Bed selection",
    "confirmation.review_booking": "Review booking",
    "success.congratulations": "Congratulations!",
    "general.locale_code": "en-GB",
  }
};

export class I18n {
  private currentLanguage: string = "es";

  constructor() {
    // Try to get language from localStorage or use default
    const savedLang = localStorage.getItem("preferred-language");
    if (savedLang && LANGUAGES.some(l => l.code === savedLang)) {
      this.currentLanguage = savedLang;
    }
  }

  setLanguage(language: string): void {
    if (LANGUAGES.some(l => l.code === language)) {
      this.currentLanguage = language;
      localStorage.setItem("preferred-language", language);
    }
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  t(key: string, variables?: Record<string, string | number>): string {
    const translation = translations[this.currentLanguage]?.[key] || 
                       translations.es[key] || 
                       key;

    if (!variables) {
      return translation;
    }

    return Object.keys(variables).reduce((result, varKey) => {
      return result.replace(new RegExp(`{${varKey}}`, 'g'), String(variables[varKey]));
    }, translation);
  }
}

export const i18n = new I18n();