const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Make sure FFmpeg directory exists
const ffmpegDir = path.join(__dirname, 'ffmpeg');
if (!fs.existsSync(ffmpegDir)) {
  fs.mkdirSync(ffmpegDir, { recursive: true });
}

// Check for LUTs directory
const lutsDir = path.join(__dirname, 'assets', 'luts');
if (!fs.existsSync(lutsDir)) {
  fs.mkdirSync(lutsDir, { recursive: true });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,  // allow require() in renderer
      contextIsolation: false, // allow ipcRenderer
      webSecurity: false // allow local file access (needed for metadata)
    }
  });

  win.loadFile('src/index.html');

  // Open DevTools automatically during development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
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

// ===== File Metadata Extraction =====
ipcMain.handle('extract-metadata', async (event, filePath) => {
  try {
    const { execFile } = require('child_process');
    const ffprobe = require('ffprobe-static').path;
    
    return new Promise((resolve, reject) => {
      execFile(ffprobe, [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ], (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        
        try {
          const metadata = JSON.parse(stdout);
          resolve(metadata);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return null;
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

// Add to main.js - Check for ffmpeg and create folders if needed
function ensureRequiredFolders() {
  const fs = require('fs');
  const path = require('path');
  
  // Make sure FFmpeg directory exists
  const ffmpegDir = path.join(__dirname, 'ffmpeg');
  if (!fs.existsSync(ffmpegDir)) {
    console.log('Creating FFmpeg directory:', ffmpegDir);
    fs.mkdirSync(ffmpegDir, { recursive: true });
  }

  // Check for LUTs directory
  const lutsDir = path.join(__dirname, 'assets', 'luts');
  if (!fs.existsSync(lutsDir)) {
    console.log('Creating LUTs directory:', lutsDir);
    fs.mkdirSync(lutsDir, { recursive: true });
  }
}