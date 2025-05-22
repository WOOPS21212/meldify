const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanFolder: (folderPath) => ipcRenderer.invoke('scan-folder', folderPath),
  selectExportFolder: () => ipcRenderer.invoke('select-export-folder'),
  exportMedia: (args) => ipcRenderer.send('export-media', args), // Changed from 'start-export'
  cancelExport: () => ipcRenderer.send('cancel-export'),
  onExportComplete: (callback) => {
    // The main process now sends an object: { status, file, originalFile, message }
    const handler = (event, exportResult) => callback(exportResult);
    ipcRenderer.on('export-complete', handler);
    // Return cleanup function
    return () => ipcRenderer.removeListener('export-complete', handler);
  }
});
