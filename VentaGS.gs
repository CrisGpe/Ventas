/**
 * FLUJO 1: Registro de Orden de Venta (Intención/Demanda)
 */
function registrarVenta(form) {
  try {
    // Validación mínima servidor
    if (!form.nombre_cliente || !form.asesor) {
      throw new Error("Nombre y Asesor son obligatorios.");
    }

    const dataToSave = {
      'FechaHora': new Date(),
      'Nombre Cliente': form.nombre_cliente,
      'Asesor': form.asesor,
      'Expectativas Cosméticas': Array.isArray(form.exp_cosmetica) ? form.exp_cosmetica.join(', ') : (form.exp_cosmetica || ''),
      'Expectativas de Forma': Array.isArray(form.exp_forma) ? form.exp_forma.join(', ') : (form.exp_forma || '')
    };

    SheetService.saveData(dataToSave, CONFIG.VENTA_SHEET_NAME, HEADERS_VENTA);
    return "Éxito";
  } catch (e) {
    return "Error en Venta: " + e.message;
  }
}
/**
   * Función interna para guardar el carrito
   */
  function registrarDetalleVenta_(nroTicket, items) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojaDetalle = ss.getSheetByName("Ventas_Detalle");
    
    const filas = items.map(item => [
      new Date(),        // Col A: Fecha
      nroTicket,         // Col B: Ticket
      item.sku,          // Col C: SKU
      item.descripcion,   // Col D: Producto
      item.cantidad,     // Col E: Cant
      item.precio,       // Col F: Precio Unit
      item.cantidad * item.precio // Col G: Subtotal
    ]);

    hojaDetalle.getRange(hojaDetalle.getLastRow() + 1, 1, filas.length, filas[0].length)
              .setValues(filas);
  }

const ID_LIBRO_VENTAS = "1J2efkmlDygvOE9wIK0hsp-WzUevNzP8_kWi_Nz7RYGk";
/**
 * FUNCIÓN PRINCIPAL DE COBRO
 * Recibe el payload del panel de cobro y procesa todo el sistema.
 */
function procesarVentaFinal(payload) {
  // 1. Bloqueo de seguridad para evitar duplicidad de correlativos
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Espera hasta 30 seg

    const ss = SpreadsheetApp.openById("1RQpMXqorsIzmMyoYAv0Jp0QS2PL-w5pzDEKBMKugfXc");
    const nroTicket = obtenerCorrelativoDinamico(payload.emisor, payload.comprobanteCol);
    
    if (nroTicket === "ERROR-ID") throw new Error("No se pudo generar el correlativo. Verifique el Emisor.");

    const fecha = new Date();
    const totalVenta = payload.items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    // 2. REGISTRAR CABECERA (Ventas_Tickets)
    const hojaTickets = ss.getSheetByName("Ventas_Tickets");
    hojaTickets.appendRow([
      fecha,            // A: Fecha
      nroTicket,        // B: Ticket (Correlativo real)
      payload.nombre,   // C: Cliente
      payload.comprobanteCol.replace('Correlativo ', ''), // D: Tipo
      totalVenta,       // E: Total
      payload.metodo,   // F: Método de Pago
      payload.asesor,   // G: Asesor
      payload.emisor,   // H: Emisor
      payload.expectativas // I: Notas
    ]);

    // 3. REGISTRAR DETALLE, KARDEX Y ACTUALIZAR STOCK
    const hojaDetalle = ss.getSheetByName("Ventas_Detalle");
    const hojaKardex = ss.getSheetByName("Kardex_Movimientos");
    const hojaBBDD = ss.getSheetByName("BBDD_Productos");
    const datosBBDD = hojaBBDD.getDataRange().getValues();

    const filasDetalle = [];
    
    payload.items.forEach(item => {
      // Detalle para batch insert
      filasDetalle.push([
        fecha, 
        nroTicket, 
        item.sku, 
        item.descripcion, 
        item.cantidad, 
        item.precio, 
        (item.precio * item.cantidad)
      ]);

      // Kardex (Salida por Venta)
      hojaKardex.appendRow([
        "MOV-" + fecha.getTime(),
        fecha,
        "VENTA",
        item.sku,
        item.descripcion,
        item.cantidad,
        "ALMACEN_TIENDA",
        "CLIENTE",
        nroTicket,
        "" // Costo
      ]);

      // Actualizar Stock en memoria
      for (let i = 1; i < datosBBDD.length; i++) {
        if (datosBBDD[i][0] == item.sku) {
          datosBBDD[i][7] -= item.cantidad; // Columna H: Stock Tienda
          break;
        }
      }
    });

    // Guardar Detalle y BBDD (Optimizado)
    hojaDetalle.getRange(hojaDetalle.getLastRow() + 1, 1, filasDetalle.length, filasDetalle[0].length).setValues(filasDetalle);
    hojaBBDD.getDataRange().setValues(datosBBDD);

    return { status: "OK", ticket: nroTicket };

  } catch (e) {
    console.error("Error: " + e.message);
    return { status: "ERROR", message: e.message };
  } finally {
    lock.releaseLock();
  }
}
function obtenerCorrelativoDinamico(nombreEmisor, columnaNombre) {
  const ss = SpreadsheetApp.openById("1J2efkmlDygvOE9wIK0hsp-WzUevNzP8_kWi_Nz7RYGk");
  const hoja = ss.getSheetByName("Config_Sistema");
  const datos = hoja.getDataRange().getValues();
  const headers = datos[0];
  
  const colIndex = headers.indexOf(columnaNombre);
  const rowIndex = datos.findIndex(fila => fila[0] === nombreEmisor);

  if (colIndex === -1 || rowIndex === -1) return "ERROR-ID";

  let valorActual = datos[rowIndex][colIndex].toString();
  let partes = valorActual.split('-');
  let serie = partes[0];
  let numero = parseInt(partes[1]) + 1;
  
  let nuevoCorrelativo = serie + "-" + numero.toString().padStart(8, '0');
  
  // Actualizar el Excel
  hoja.getRange(rowIndex + 1, colIndex + 1).setValue(nuevoCorrelativo);
  
  return nuevoCorrelativo;
}
function obtenerDetallePorComprobante(nroComprobante) {
  const ss = SpreadsheetApp.openById("1RQpMXqorsIzmMyoYAv0Jp0QS2PL-w5pzDEKBMKugfXc");
  const hojaDetalle = ss.getSheetByName("Ventas_Detalle");
  const datos = hojaDetalle.getDataRange().getValues();
  
  // Filtramos las filas que coincidan con el nroComprobante
  // Asumiendo que el nroComprobante está en la Columna B (índice 1)
  return datos.filter(fila => fila[1] === nroComprobante).map(fila => ({
    descripcion: fila[3],
    cantidad: fila[4],
    precio: fila[5]
  }));
}
function obtenerVentasDelDia() {
  const ss = SpreadsheetApp.openById("1RQpMXqorsIzmMyoYAv0Jp0QS2PL-w5pzDEKBMKugfXc");
  const hoja = ss.getSheetByName("Ventas_Tickets");
  const datos = hoja.getDataRange().getValues();
  datos.shift(); // Quitar encabezados

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Filtramos las ventas cuya fecha coincida con hoy
  const ventasHoy = datos.filter(fila => {
    const fechaVenta = new Date(fila[0]);
    fechaVenta.setHours(0, 0, 0, 0);
    return fechaVenta.getTime() === hoy.getTime();
  });

  // Devolvemos invertido para que la última venta salga primero
  return ventasHoy.reverse();
}