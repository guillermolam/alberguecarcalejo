import { Pilgrim, Booking, Payment } from "@shared/schema";

export class XmlGenerator {
  generateParteViajeros(pilgrim: Pilgrim, booking: Booking, payment: Payment): string {
    const establishmentCode = process.env.ESTABLISHMENT_CODE || "0000000000";
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<peticion>
  <solicitud>
    <codigoEstablecimiento>${establishmentCode}</codigoEstablecimiento>
    <comunicacion>
      <contrato>
        <referencia>${booking.referenceNumber}</referencia>
        <fechaContrato>${booking.createdAt?.toISOString().split('T')[0]}</fechaContrato>
        <fechaEntrada>${booking.checkInDate}T15:00:00</fechaEntrada>
        <fechaSalida>${booking.checkOutDate}T12:00:00</fechaSalida>
        <numPersonas>${booking.numberOfPersons}</numPersonas>
        <numHabitaciones>${booking.numberOfRooms}</numHabitaciones>
        <internet>${booking.hasInternet}</internet>
        <pago>
          <importe>${payment.amount}</importe>
          <formaPago>${payment.paymentType}</formaPago>
          <fechaPago>${payment.paymentDate?.toISOString().split('T')[0] || booking.createdAt?.toISOString().split('T')[0]}</fechaPago>
        </pago>
      </contrato>
      <persona>
        <rol>VI</rol>
        <nombre>${this.escapeXml(pilgrim.firstName)}</nombre>
        <apellido1>${this.escapeXml(pilgrim.lastName1)}</apellido1>
        ${pilgrim.lastName2 ? `<apellido2>${this.escapeXml(pilgrim.lastName2)}</apellido2>` : ''}
        <tipoDocumento>${pilgrim.documentType}</tipoDocumento>
        <numeroDocumento>${pilgrim.documentNumber}</numeroDocumento>
        ${pilgrim.documentSupport ? `<soporteDocumento>${pilgrim.documentSupport}</soporteDocumento>` : ''}
        <fechaNacimiento>${pilgrim.birthDate}</fechaNacimiento>
        ${pilgrim.nationality ? `<nacionalidad>${pilgrim.nationality}</nacionalidad>` : ''}
        <sexo>${pilgrim.gender}</sexo>
        <direccion>
          <pais>${pilgrim.addressCountry}</pais>
          <direccion>${this.escapeXml(pilgrim.addressStreet)}</direccion>
          ${pilgrim.addressStreet2 ? `<direccion2>${this.escapeXml(pilgrim.addressStreet2)}</direccion2>` : ''}
          <localidad>${this.escapeXml(pilgrim.addressCity)}</localidad>
          <codigoPostal>${pilgrim.addressPostalCode}</codigoPostal>
          ${pilgrim.addressMunicipalityCode ? `<codigoMunicipio>${pilgrim.addressMunicipalityCode}</codigoMunicipio>` : ''}
        </direccion>
        <telefono>${pilgrim.phone}</telefono>
        ${pilgrim.email ? `<correo>${this.escapeXml(pilgrim.email)}</correo>` : ''}
      </persona>
    </comunicacion>
  </solicitud>
</peticion>`;

    return xml;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export const xmlGenerator = new XmlGenerator();
