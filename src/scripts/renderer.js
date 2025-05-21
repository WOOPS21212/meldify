const { ipcRenderer } = require('electron');
const { exec } = require('child_process');

window.onload = function() {

// ===== Settings Memory =====
const userSettings = {
  resolution: "HD",
  applyLUT: true,
  droneResolution: true,
  syncAudio: true,
  exportFormat: "mp4"
};

// ===== Path Normalization (for Windows safety) =====
function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

// ===== VANTA Background =====
// Moved to DOMContentLoaded event listener at the bottom of the file

// ===== Pages =====
const pages = [
  "page-welcome",
  "page-settings",
  "page-gallery",
  "page-audio",
  "page-export"
];
let currentPage = 0;

function showPage(index) {
  pages.forEach((pageId, i) => {
    const page = document.getElementById(pageId);
    if (i === index) {
      page.classList.remove('hidden');
    } else {
      page.classList.add('hidden');
    }
  });

  const body = document.body;
  if (index === 0) { body.style.filter = 'hue-rotate(0deg)'; }
  if (index === 1) { body.style.filter = 'hue-rotate(20deg)'; }
  if (index === 2) { body.style.filter = 'hue-rotate(60deg)'; }
  if (index === 3) { body.style.filter = 'hue-rotate(100deg)'; }
  if (index === 4) { body.style.filter = 'hue-rotate(180deg)'; }

  if (pages[index] === "page-gallery") {
    updateGallerySettings();
    buildGallery();
  }
}

// ===== Update Settings Summary =====
function updateGallerySettings() {
  const summary = document.getElementById('settings-summary');
  summary.innerHTML = `
    <div><strong>Resolution:</strong> ${userSettings.resolution}</div>
    <div><strong>Apply LUTs:</strong> ${userSettings.applyLUT ? "Yes" : "No"}</div>
    <div><strong>Drone/Action Auto-Resolution:</strong> ${userSettings.droneResolution ? "Yes" : "No"}</div>
    <div><strong>Sync Audio:</strong> ${userSettings.syncAudio ? "Yes" : "No"}</div>
    <div><strong>Export Format:</strong> ${userSettings.exportFormat === "mp4" ? "MP4 (10Mbps)" : "ProRes Proxy"}</div>
  `;
}

// ===== Build Gallery =====
window.buildGallery = function() {
  const galleryGrid = document.getElementById('gallery-grid');
  if (!galleryGrid) {
    console.error('❌ Gallery grid element not found!');
    return;
  }
  
  galleryGrid.innerHTML = "";

  console.log('Building gallery with camera groups:', window.cameraGroups);

  if (!window.cameraGroups || Object.keys(window.cameraGroups).length === 0) {
    console.warn('No camera groups available for gallery');
    galleryGrid.innerHTML = "<p>No cameras detected yet. Try dropping some video files.</p>";
    return;
  }

  Object.keys(window.cameraGroups).forEach(cameraKey => {
    const group = window.cameraGroups[cameraKey];
    
    if (!group || group.length === 0) {
      console.warn(`Empty camera group for ${cameraKey}`);
      return;
    }

    const firstClip = group[0];
    
    // Create card element
    const card = document.createElement('div');
    card.className = 'gallery-card';
    
    // Set background color
    const cardColor = '#333333';
    card.style.background = `linear-gradient(45deg, ${cardColor}, #555555)`;
    
    // Populate card content
    card.innerHTML = `
      <div class="overlay">
        <div style="font-size: 36px; margin-bottom: 10px;">📹</div>
        <h2>${cameraKey}</h2>
        <p>${group.length} clip${group.length !== 1 ? 's' : ''}</p>
        <p class="small-text">${firstClip.file.name}</p>
      </div>
    `;
    
    // Add click handler to show camera details
    card.addEventListener('click', () => {
      alert(`Selected camera: ${cameraKey} with ${group.length} clips`);
    });
    
    galleryGrid.appendChild(card);
    console.log(`Added gallery card for ${cameraKey} with ${group.length} clips`);
  });
}

// ===== Navigation Buttons =====
document.querySelectorAll('.next-btn').forEach(button => {
  button.addEventListener('click', () => {
    currentPage++;
    if (currentPage >= pages.length) currentPage = pages.length - 1;
    showPage(currentPage);
  });
});

document.querySelectorAll('.back-btn').forEach(button => {
  button.addEventListener('click', () => {
    currentPage--;
    if (currentPage < 0) currentPage = 0;
    showPage(currentPage);
  });
});

// ===== Handle Export Format Change =====
document.getElementById('exportFormat').addEventListener('change', (e) => {
  userSettings.exportFormat = e.target.value;
  console.log('✅ Export format set to:', userSettings.exportFormat);
});

// ===== Build FFmpeg Command =====
function buildFFmpegCommand(inputPath, outputPath) {
  const format = userSettings.exportFormat || "mp4";

  if (format === "mp4") {
    return `"${process.cwd()}/ffmpeg/ffmpeg.exe" -y -i "${inputPath}" -c:v libx264 -b:v 10M -c:a aac -movflags +faststart "${outputPath}"`;
  } else if (format === "prores") {
    return `"${process.cwd()}/ffmpeg/ffmpeg.exe" -y -i "${inputPath}" -c:v prores_ks -profile:v 3 -c:a pcm_s16le "${outputPath}"`;
  }
}

// ===== Start Export Process =====
document.getElementById('startExport').addEventListener('click', async () => {
  console.log("✅ Start Export button clicked!");

  const folderPath = await ipcRenderer.invoke('select-folder');

  if (!folderPath) {
    alert("❗ No output folder selected!");
    return;
  }

  console.log('Exporting to:', folderPath);

  // Flatten the array of arrays in cameraGroups
  const allFiles = [];
  Object.values(window.cameraGroups).forEach(group => {
    if (Array.isArray(group)) {
      allFiles.push(...group);
    }
  });
  let current = 0;
  const total = allFiles.length;

  if (total === 0) {
    alert("❗ No files to export!");
    return;
  }

  const progressContainer = document.getElementById('exportProgressContainer');
  const progressText = document.getElementById('exportProgressText');
  const progressBar = document.getElementById('exportProgressBar');

  progressContainer.style.display = 'block';
  progressText.textContent = `Exporting 0 / ${total}`;
  progressBar.style.width = '0%';

  for (const fileEntry of allFiles) {
    const inputPath = normalizePath(fileEntry.path);
    const fileNameNoExt = fileEntry.file.name.split('.').slice(0, -1).join('.');
    const format = userSettings.exportFormat || "mp4";
    const outputExt = format === "mp4" ? ".mp4" : ".mov";
    const outputPath = normalizePath(`${folderPath}/${fileNameNoExt}${outputExt}`);

    const command = buildFFmpegCommand(inputPath, outputPath);

    console.log(`🎬 Exporting ${current + 1}/${total}: ${fileNameNoExt}`);
    console.log(`Input Path: ${inputPath}`);
    console.log(`Output Path: ${outputPath}`);
    console.log(`Command: ${command}`);

    await new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ FFmpeg error for ${inputPath}:`);
          console.error(stderr);
        } else {
          console.log(`✅ Successfully transcoded ${inputPath}`);
          console.log(stdout);
        }
        resolve();
      });
    });

    current++;

    const percent = Math.round((current / total) * 100);
    progressText.textContent = `Exporting ${current} / ${total}`;
    progressBar.style.width = `${percent}%`;
  }

  alert("✅ All exports finished!");
});

// ===== Handle Drop Event =====
function handleDrop(event) {
  const files = [...event.dataTransfer.files];
  if (files.length && files[0].type === "") {
    // Use fileManager's scanFolder function, which is loaded via script tag in HTML
    const scanPath = files[0].path;
    console.log("Dropped folder:", scanPath);
    handleFolderDrop(scanPath);
  } else {
    alert("Please drop a folder");
  }
}

// Helper function to process scanned folders
async function handleFolderDrop(folderPath) {
  try {
    console.log("Scanning folder:", folderPath);
    // This uses the scanFolder and groupByCamera functions from fileManager.js
    const files = await scanFolder(folderPath);
    console.log("Found files:", files.length);
    const groups = await groupByCamera(files);
    window.cameraGroups = groups.reduce((acc, group) => {
      acc[group.name] = group.files;
      return acc;
    }, {});
    buildGallery();
  } catch (error) {
    console.error("Error processing folder:", error);
    alert("Error processing folder: " + error.message);
  }
}

// ===== Prevent Default Drag/Drop Behavior =====
window.addEventListener("dragover", event => {
  event.preventDefault();
});

window.addEventListener("drop", event => {
  event.preventDefault();
  handleDrop(event);
});

function selectFolder() {
  window.electronAPI.selectFolder().then(folderPath => {
    if (folderPath) {
      console.log("Selected folder:", folderPath);
      handleFolderDrop(folderPath);
    }
  });
}


// ===== Initialize Dropzone =====
window.setupDropzone = function() {
  const dropzone = document.getElementById('dropzone');
  if (!dropzone) {
    console.error('❌ Dropzone element not found!');
    return;
  }

  // Setup visual feedback for drag-over events
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('active');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('active');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('active');
    handleDrop(e);
  });

  // Setup click behavior
  dropzone.addEventListener('click', () => {
    selectFolder();
  });

  console.log('✅ Dropzone initialized');
};

// Initialize the dropzone
window.setupDropzone();

// ===== Initialize First Page =====
showPage(currentPage);

}; // End window.onload

window.addEventListener("DOMContentLoaded", () => {
  if (typeof VANTA !== 'undefined' && VANTA.HALO) {
    VANTA.HALO({
      el: "#backgroundHalo",
      mouseControls: true,
      touchControls: true,
      minHeight: 200.00,
      minWidth: 200.00,
      baseColor: 0x111111,
      backgroundColor: 0x000000
    });
  } else {
    console.error("VANTA or VANTA.HALO is not defined");
  }
});
