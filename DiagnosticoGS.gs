function procesarFormulario(form) {
  try {
    // La validación ya la tenemos en una función privada
    validarDatos_(form); 

    const fotoUrl = DriveService.uploadPhoto(form.foto_diagnostico, form.nombre_apellido);

    const dataToSave = {
      'FechaRegistro': new Date(),
      'Nombres y apellidos': form.nombre_apellido,
      'Celular': form.celular,
      // ... (mapeo que ya definimos anteriormente)
      'URL de Foto Diagnóstico': fotoUrl
    };

    SheetService.saveData(dataToSave, CONFIG.DIAG_SHEET_NAME, HEADERS_DIAG);
    return "Éxito";
  } catch (e) {
    return "Error en Diagnóstico: " + e.message;
  }
}