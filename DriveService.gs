/**
 * Servicio para gestión de archivos en Drive
 */
const DriveService = {
  
  /**
   * Obtiene o crea una carpeta basada en el nombre del cliente
   */
  getOrCreateClientFolder: function(clientName) {
    const masterFolder = DriveApp.getFolderById(CONFIG.MASTER_FOLDER_ID);
    const folderName = clientName.trim().replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();
    const folders = masterFolder.getFoldersByName(folderName);

    return folders.hasNext() ? folders.next() : masterFolder.createFolder(folderName);
  },

  /**
   * Sube el archivo y retorna su URL pública
   */
  uploadPhoto: function(blob, clientName) {
    if (!blob || !blob.getName()) return '';

    const folder = this.getOrCreateClientFolder(clientName);
    const timestamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyyMMdd_HHmmss');
    const fileName = `${clientName.replace(/\s/g, '_')}_${timestamp}.jpg`;
    
    const file = folder.createFile(blob);
    file.setName(fileName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  }
};