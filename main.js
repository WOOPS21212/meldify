const { app, BrowserWindow } = require('electron');
const path = require('path');

// Optional: Live reload
try {
  require('electron-reload')(__dirname);
} catch (_) {}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('src/index.html'); // <- Load your actual app
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
