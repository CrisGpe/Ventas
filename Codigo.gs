/**
 * WebApp: Sistema Híbrido de Ventas y Diagnóstico
 */

function doGet() {
  // Ahora servimos Index.html como punto de entrada
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Sistema de Gestión Capilar')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Obtiene el catálogo desde el archivo externo proporcionado por el usuario
 */
function obtenerCatalogoMaestro() {
  const EXTERNAL_ID = "1U0TkAI74Q0Opqs6UcuVxYtqN41UApPorusopaQDk-3E";
  
  // 1. Obtener datos del catálogo externo
  const ssExt = SpreadsheetApp.openById(EXTERNAL_ID);
  const hojaExt = ssExt.getSheetByName("Catalogo productos");
  const datosExt = hojaExt.getDataRange().getValues();
  const headersExt = datosExt.shift();
  
  // 2. Obtener datos de stock local (BBDD_Productos)
  const ssLocal = SpreadsheetApp.openById("1RQpMXqorsIzmMyoYAv0Jp0QS2PL-w5pzDEKBMKugfXc");
  const hojaLocal = ssLocal.getSheetByName("BBDD_Productos");
  const datosLocal = hojaLocal.getDataRange().getValues();
  datosLocal.shift(); // Quitar encabezados locales
  
  // Crear un mapa de stock local para búsqueda rápida por SKU
  // { 'SKU001': { tienda: 10, principal: 20 }, ... }
  const mapaStockLocal = {};
  datosLocal.forEach(fila => {
    mapaStockLocal[String(fila[0])] = {
      tienda: parseInt(fila[7]) || 0,    // Columna H
      principal: parseInt(fila[8]) || 0 // Columna I
    };
  });

  console.log("--- CRUZANDO CATÁLOGO CON STOCK LOCAL ---");

  // 3. Cruzar datos
  return datosExt.map(fila => {
    const sku = String(fila[0]);
    const stockInfo = mapaStockLocal[sku] || { tienda: 0, principal: 0 };
    
    return {
      sku: sku,
      marca: fila[12] ? String(fila[12]) : "GENERICO",
      descripcion: fila[4] ? String(fila[4]) : "SIN NOMBRE",
      precio_unitario: parseFloat(fila[8]) || 0,
      stock_tienda: stockInfo.tienda,
      stock_principal: stockInfo.principal
    };
  });
}
function obtenerConfiguracionEmisores() {
  const ss = SpreadsheetApp.openById("1J2efkmlDygvOE9wIK0hsp-WzUevNzP8_kWi_Nz7RYGk");
  const hoja = ss.getSheetByName("Config_Sistema");
  const datos = hoja.getDataRange().getValues();
  
  // datos[0] son los encabezados: ["RUCs", "Correlativo Boleta", "Correlativo Factura", ...]
  // datos.slice(1) son las filas de emisores
  
  return {
    tiposDocumento: datos[0].slice(1), // Salta "RUCs" y trae el resto
    emisores: datos.slice(1).map(fila => fila[0]) // Trae todos los nombres de la columna A
  };
}