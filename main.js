const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');

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

// ===== Folder Scanning =====
ipcMain.handle('scan-folder', async (event, folderPath) => {
  const supported = new Set(['.r3d', '.mov', '.mxf']);

  const files = [];
  const stack = [folderPath];

  try {
    while (stack.length) {
      const dir = stack.pop();
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (supported.has(ext)) {
            files.push(full);
          }
        }
      }
    }

    return files;
  } catch (err) {
    console.error('scan-folder error:', err);
    throw err;
  }
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
