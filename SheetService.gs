const SheetService = {
  /**
   * Función genérica para guardar datos
   * @param {Object} dataObject - Objeto con llaves que coinciden con los headers
   * @param {String} sheetName - Nombre de la hoja donde guardar
   * @param {Array} headers - Array de strings con los nombres de las columnas
   */
  saveData: function(dataObject, sheetName, headers) {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
    }

    const row = headers.map(header => {
      // Si el header pide fecha y no viene en el objeto, la generamos
      if ((header === 'FechaRegistro' || header === 'FechaHora') && !dataObject[header]) {
        return new Date();
      }
      return dataObject[header] || '';
    });

    sheet.appendRow(row);
  }
};