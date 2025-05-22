const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { spawn } = require('child_process');

let activeFFmpegProcs = []; // To keep track of active FFmpeg processes

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

// ===== Export Folder Picker Handling =====
ipcMain.handle('select-export-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Export Destination Folder'
  });
  // Check if dialog was cancelled or no path was selected
  if (result.canceled || result.filePaths.length === 0) {
    return null; // Return null if cancelled or no folder selected
  }
  return result.filePaths[0]; // Return the selected folder path
});

// ===== FFmpeg Export Handling =====
// const { ipcMain } = require('electron'); // Already required at the top
// const { spawn } = require('child_process'); // Already required at the top
// const path = require('path'); // Already required at the top
const fsSync = require('fs'); // fs/promises is used above, ensure this is okay or switch to fs/promises

ipcMain.on('export-media', (event, options) => {
  const { inputFiles, format, outputDir } = options;

  if (!inputFiles || inputFiles.length === 0) {
    console.error("No input files passed to export-media");
    event.reply('export-complete', { status: 'fail', message: 'No input files' });
    return;
  }

  if (!fsSync.existsSync(outputDir)) {
    fsSync.mkdirSync(outputDir, { recursive: true });
  }

  inputFiles.forEach((filePath) => {
    // Assuming filePath is an absolute path string.
    // The patch implies inputFiles are already absolute paths from export.js.

    if (typeof filePath !== 'string' || !fsSync.existsSync(filePath)) {
      console.error("Missing or invalid file path:", filePath);
      // Reply with an error for this specific file and continue to the next.
      event.reply('export-complete', {
        status: 'fail',
        file: filePath, // Or a placeholder for outputPath if not yet determined
        originalFile: filePath,
        message: `File not found or path is invalid: ${filePath}`
      });
      return; // Skip this file
    }

    const outputFileName = path.basename(filePath, path.extname(filePath)) + (format === 'mp4' ? '.mp4' : '.mov');
    const outputPath = path.join(outputDir, outputFileName);
    
    // Using relative path to ffmpeg.exe from project root, as main.js is at project root.
    // Ensure ffmpeg/ffmpeg.exe exists at this location.
    const ffmpegPath = './ffmpeg/ffmpeg.exe'; 

    const ffmpegArgs = format === 'mp4'
      ? ['-i', filePath, '-c:v', 'libx264', '-b:v', '10M', '-preset', 'fast', outputPath]
      : ['-i', filePath, '-c:v', 'prores_ks', '-profile:v', '3', outputPath];

    const ffmpeg = spawn(ffmpegPath, ffmpegArgs);
    activeFFmpegProcs.push(ffmpeg);

    // Helper function to remove a process from the active list
    const removeProc = (procToRemove) => {
      activeFFmpegProcs = activeFFmpegProcs.filter(p => p !== procToRemove);
    };

    ffmpeg.stdout.on('data', (data) => console.log(`[FFmpeg stdout for ${path.basename(filePath)}] ${data}`));
    ffmpeg.stderr.on('data', (data) => console.error(`[FFmpeg stderr for ${path.basename(filePath)}] ${data}`));

    ffmpeg.on('close', (code) => {
      console.log(`FFmpeg process for ${path.basename(filePath)} exited with code ${code}`);
      removeProc(ffmpeg);
      event.reply('export-complete', {
        status: code === 0 ? 'success' : 'fail',
        file: outputPath,
        originalFile: filePath,
        message: code === 0 ? 'Exported successfully' : `FFmpeg failed with code ${code}`
      });
    });

    ffmpeg.on('error', (err) => {
      console.error(`Failed to start FFmpeg for ${path.basename(filePath)}:`, err);
      removeProc(ffmpeg);
      event.reply('export-complete', {
        status: 'fail',
        file: outputPath, // outputPath might not be relevant if ffmpeg failed to start
        originalFile: filePath,
        message: `Failed to start FFmpeg: ${err.message}`
      });
    });
  });
});

// ===== Cancel Export Handling =====
ipcMain.on('cancel-export', () => {
  console.log(`Cancel signal received. Terminating ${activeFFmpegProcs.length} FFmpeg processes...`);
  activeFFmpegProcs.forEach(proc => {
    if (proc && !proc.killed) {
      console.log(`Killing FFmpeg process with PID: ${proc.pid}`);
      proc.kill('SIGKILL'); // Force kill
    }
  });
  activeFFmpegProcs = []; // Clear the array after attempting to kill all
  // Optionally, send a confirmation back to renderer or log completion of cancellation.
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
