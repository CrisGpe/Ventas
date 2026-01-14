/**
 * CONFIGURACIÓN GLOBAL
 */
const CONFIG = {
  SPREADSHEET_ID: '1kbj7BGZyIWcXMj2aqNelSkw25ISuFRUY6AArTt8WjzI',
  DIAG_SHEET_NAME: 'Diagnosticos',
  VENTA_SHEET_NAME: 'Ventas_Intenciones', // Nueva hoja
  MASTER_FOLDER_ID: '1C2mnKiGAptQJdFIC2aEcGUF0siDQjHXA',
  TIMEZONE: Session.getScriptTimeZone()
};

/**
 * Encabezados para Diagnóstico
 */
const HEADERS_DIAG = [
  'FechaRegistro', 'Nombres y apellidos', 'Celular', 'Día de cumpleaños', 'Redes y/o correo', 
  'Atención hoy con', 'Servicio (s)', 'Cuero cabelludo', 'Densidad del cabello', 
  'Proceso químico', 'Fibra', 'Forma del cabello', 'Tono de la base', 
  'Tono de medios y puntas', 'Porcentaje de canas', 'Expectativas de color',
  'Expectativas cosméticas', 'Expectativas de forma', 'Observaciones', 
  'Recomendaciones', 'Próximas citas', 'URL de Foto Diagnóstico'
];

/**
 * Encabezados para Orden de Venta (Demanda)
 */
const HEADERS_VENTA = [
  'FechaHora', 'Nombre Cliente', 'Asesor', 'Expectativas Cosméticas', 'Expectativas de Forma'
];