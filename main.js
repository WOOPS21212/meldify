const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false
  }
  });

  win.loadFile('src/index.html');

  // Open DevTools automatically (optional during development)
  // win.webContents.openDevTools();
}

// ===== Folder Picker Handling =====
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

// ===== App Lifecycle =====
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (event, contents) => {
  // Prevent navigation when dragging files in
  contents.on('will-navigate', (e) => {
    e.preventDefault();
    console.log('Navigation prevented');
  });
  
  // Prevent opening new windows
  contents.setWindowOpenHandler(() => {
    console.log('Window open prevented');
    return { action: 'deny' };
  });

  // Enable DevTools for debugging
  contents.openDevTools();
});
