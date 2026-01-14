/**
 * Registra movimientos de almacén (Facturas o Traspasos)
 * Actualiza Kardex y BBDD_Productos local.
 */
function procesarMovimientoAlmacen(payload) {
  console.log("--- PROCESANDO MOVIMIENTO ALMACEN ---");
  console.log("Payload recibido:", JSON.stringify(payload));

  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hojaKardex = ss.getSheetByName("Kardex_Movimientos");
    
    const timestamp = new Date();
    const idMovimientoBase = "MOV-" + timestamp.getTime();

    // 1. Preparar filas para el Kardex
    // Estructura sugerida: [ID, Fecha, Tipo, SKU, Descripcion, Cantidad, Origen, Destino, Documento]
    const filasKardex = payload.items.map((item, index) => [
      idMovimientoBase + "-" + index,
      timestamp,
      payload.tipo, 
      item.sku,
      item.descripcion,
      item.cantidad,
      payload.origen,
      payload.destino,
      payload.documento || ''
    ]);

    // 2. Insertar en Kardex
    hojaKardex.appendRow([]); // Asegura que no se sobrescriba la última fila si hay formatos
    hojaKardex.getRange(hojaKardex.getLastRow(), 1, filasKardex.length, filasKardex[0].length)
               .setValues(filasKardex);

    // 3. Actualizar Stock Real en BBDD_Productos
    const resultadoStock = actualizarStockMaestro_(payload.items, payload.tipo);

    if (resultadoStock.success) {
      return `✅ ${payload.tipo} registrado correctamente. ID: ${idMovimientoBase}`;
    } else {
      throw new Error("No se pudo actualizar el stock en la BBDD local.");
    }

  } catch (e) {
    console.error("Error en procesarMovimientoAlmacen:", e.message);
    return "❌ Error en Almacén: " + e.message;
  }
}

/**
 * Función interna para balancear los stocks locales
 */
function actualizarStockMaestro_(items, tipo) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const hoja = ss.getSheetByName("BBDD_Productos");
  const rango = hoja.getDataRange();
  const datos = rango.getValues();
  let cambiosRealizados = 0;

  items.forEach(item => {
    for (let i = 1; i < datos.length; i++) {
      if (String(datos[i][0]) === String(item.sku)) { // Comparación SKU (Col A)
        
        if (tipo === 'INGRESO_FACTURA') {
          // Columna I (index 8): Stock Principal
          datos[i][8] = (Number(datos[i][8]) || 0) + Number(item.cantidad); 
          // Columna J (index 9): Costo
          if(item.costo) datos[i][9] = Number(item.costo); 
        } 
        else if (tipo === 'TRASPASO') {
          // Columna I (index 8): Resta Principal
          datos[i][8] = (Number(datos[i][8]) || 0) - Number(item.cantidad); 
          // Columna H (index 7): Suma Tienda
          datos[i][7] = (Number(datos[i][7]) || 0) + Number(item.cantidad); 
        }
        else if (tipo === 'VENTA') {
          // Descontamos del Stock Tienda (Columna H - índice 7)
          datos[i][7] = (Number(datos[i][7]) || 0) - Number(item.cantidad);
        }
        cambiosRealizados++;
        break;
      }
    }
  });

  // Guardar todos los cambios de una sola vez para mayor velocidad
  rango.setValues(datos);
  console.log(`Stocks actualizados: ${cambiosRealizados} productos modificados.`);
  
  return { success: cambiosRealizados > 0 };
}