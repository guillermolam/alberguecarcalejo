import { LANGUAGES } from './constants';

export interface Translations {
  [key: string]: string;
}

export const translations: Record<string, Translations> = {
  es: {
    'nav.title': 'Albergue Del Carrascalejo',
    'nav.admin': 'Administración',
    'hero.welcome': 'Bienvenido Peregrino',
    'hero.subtitle': 'Registro rápido y seguro para tu estancia en el Camino',
    'hero.beds_available': 'Camas disponibles',
    'hero.price_per_night': 'Por persona/noche',
    'stay.title': 'Información de la estancia',
    'stay.dates': 'Fechas de estancia',
    'stay.nights': 'Número de noches',
    'stay.guests': 'Personas',
    'stay.guest_single': 'persona',
    'stay.guest_plural': 'personas',
    'stay.individual_only': 'Solo registro individual',
    'stay.continue': 'Continuar con el registro',
    'stay.available': '¡Disponible! {count} camas libres para las fechas seleccionadas',
    'stay.not_available': 'No hay suficientes camas disponibles para estas fechas',
    'stay.next_available': 'Próxima fecha disponible: {date}',
    'registration.title': 'Registro de peregrino',
    'registration.protected_data': 'Datos protegidos según normativa española',
    'registration.first_name': 'Nombre',
    'registration.last_name_1': 'Primer apellido',
    'registration.last_name_2': 'Segundo apellido',
    'registration.birth_date': 'Fecha de nacimiento',
    'registration.document_type': 'Tipo de documento',
    'registration.document_number': 'Número de documento',
    'registration.gender': 'Sexo',
    'registration.id_photo': 'Fotografía del documento',
    'registration.take_photo': 'Tomar foto',
    'registration.upload_file': 'Subir archivo',
    'registration.country': 'País de residencia',
    'registration.address': 'Dirección',
    'registration.address_2': 'Dirección adicional',
    'registration.city': 'Ciudad',
    'registration.postal_code': 'Código postal',
    'registration.municipality_code': 'Código municipio',
    'registration.phone': 'Teléfono',
    'registration.email': 'Email',
    'registration.payment_info': 'Información de pago',
    'registration.payment_type': 'Tipo de pago',
    'registration.total': 'Total',
    'registration.compliance': 'Cumplimiento normativo',
    'registration.compliance_text': 'Tus datos serán transmitidos automáticamente a las autoridades españolas según el Real Decreto 933/2021 sobre obligaciones de registro en hospedajes.',
    'registration.back': 'Volver',
    'registration.submit': 'Completar registro',
    'admin.title': 'Panel de Administración',
    'admin.dashboard': 'Dashboard',
    'admin.checkin': 'Check-in',
    'admin.checkout': 'Check-out',
    'admin.beds': 'Gestión de camas',
    'admin.payments': 'Pagos',
    'admin.occupancy_today': 'Ocupación hoy',
    'admin.revenue_today': 'Ingresos hoy',
    'admin.pending_checkins': 'Check-ins pendientes',
    'admin.compliance_rate': 'Tasa cumplimiento',
    'admin.bed_status': 'Estado de las camas',
    'admin.available': 'Disponible',
    'admin.occupied': 'Ocupado',
    'admin.maintenance': 'Mantenimiento',
    'admin.recent_registrations': 'Registros recientes',
    'admin.pilgrim': 'Peregrino',
    'admin.document': 'Documento',
    'admin.bed': 'Cama',
    'admin.status': 'Estado',
    'admin.actions': 'Acciones',
    'admin.view_details': 'Ver detalles',
    'admin.assign_bed': 'Asignar cama',
    'notifications.success': 'Registro completado con éxito',
    'notifications.error': 'Error en el envío de datos',
    'loading.processing': 'Procesando registro',
    'loading.submitting': 'Enviando datos a las autoridades españolas...',
    'errors.required': 'Este campo es obligatorio',
    'errors.invalid_email': 'Email inválido',
    'errors.invalid_document': 'Formato de documento inválido',
    'errors.invalid_phone': 'Formato de teléfono inválido',
  },
  en: {
    'nav.title': 'Albergue Del Carrascalejo',
    'nav.admin': 'Administration',
    'hero.welcome': 'Welcome Pilgrim',
    'hero.subtitle': 'Quick and secure registration for your stay on the Camino',
    'hero.beds_available': 'Available beds',
    'hero.price_per_night': 'Per person/night',
    'stay.title': 'Stay Information',
    'stay.dates': 'Stay dates',
    'stay.nights': 'Number of nights',
    'stay.guests': 'Guests',
    'stay.guest_single': 'person',
    'stay.guest_plural': 'people',
    'stay.individual_only': 'Individual registration only',
    'stay.continue': 'Continue with registration',
    'stay.available': 'Available! {count} free beds for selected dates',
    'stay.not_available': 'Not enough beds available for these dates',
    'stay.next_available': 'Next available date: {date}',
    'registration.title': 'Pilgrim Registration',
    'registration.protected_data': 'Data protected according to Spanish regulations',
    'registration.first_name': 'First Name',
    'registration.last_name_1': 'Last Name',
    'registration.last_name_2': 'Second Last Name',
    'registration.birth_date': 'Birth Date',
    'registration.document_type': 'Document Type',
    'registration.document_number': 'Document Number',
    'registration.gender': 'Gender',
    'registration.id_photo': 'Document Photo',
    'registration.take_photo': 'Take Photo',
    'registration.upload_file': 'Upload File',
    'registration.country': 'Country of Residence',
    'registration.address': 'Address',
    'registration.address_2': 'Additional Address',
    'registration.city': 'City',
    'registration.postal_code': 'Postal Code',
    'registration.municipality_code': 'Municipality Code',
    'registration.phone': 'Phone',
    'registration.email': 'Email',
    'registration.payment_info': 'Payment Information',
    'registration.payment_type': 'Payment Type',
    'registration.total': 'Total',
    'registration.compliance': 'Regulatory Compliance',
    'registration.compliance_text': 'Your data will be automatically transmitted to Spanish authorities according to Royal Decree 933/2021 on accommodation registration obligations.',
    'registration.back': 'Back',
    'registration.submit': 'Complete Registration',
    'admin.title': 'Administration Panel',
    'admin.dashboard': 'Dashboard',
    'admin.checkin': 'Check-in',
    'admin.checkout': 'Check-out',
    'admin.beds': 'Bed Management',
    'admin.payments': 'Payments',
    'admin.occupancy_today': 'Occupancy Today',
    'admin.revenue_today': 'Revenue Today',
    'admin.pending_checkins': 'Pending Check-ins',
    'admin.compliance_rate': 'Compliance Rate',
    'admin.bed_status': 'Bed Status',
    'admin.available': 'Available',
    'admin.occupied': 'Occupied',
    'admin.maintenance': 'Maintenance',
    'admin.recent_registrations': 'Recent Registrations',
    'admin.pilgrim': 'Pilgrim',
    'admin.document': 'Document',
    'admin.bed': 'Bed',
    'admin.status': 'Status',
    'admin.actions': 'Actions',
    'admin.view_details': 'View Details',
    'admin.assign_bed': 'Assign Bed',
    'notifications.success': 'Registration completed successfully',
    'notifications.error': 'Error in data submission',
    'loading.processing': 'Processing registration',
    'loading.submitting': 'Submitting data to Spanish authorities...',
    'errors.required': 'This field is required',
    'errors.invalid_email': 'Invalid email',
    'errors.invalid_document': 'Invalid document format',
    'errors.invalid_phone': 'Invalid phone format',
  },
  // Additional languages would be added here...
};

export class I18n {
  private currentLanguage: string = 'es';

  constructor() {
    this.detectBrowserLanguage();
  }

  private detectBrowserLanguage(): void {
    const browserLang = navigator.language.split('-')[0];
    const supportedLang = LANGUAGES.find(lang => lang.code === browserLang);
    
    if (supportedLang && translations[browserLang]) {
      this.currentLanguage = browserLang;
    }
  }

  setLanguage(language: string): void {
    if (translations[language]) {
      this.currentLanguage = language;
    }
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  t(key: string, variables?: Record<string, string | number>): string {
    const translation = translations[this.currentLanguage]?.[key] || translations['es'][key] || key;
    
    if (variables) {
      return Object.entries(variables).reduce((str, [key, value]) => {
        return str.replace(`{${key}}`, String(value));
      }, translation);
    }
    
    return translation;
  }
}

export const i18n = new I18n();
