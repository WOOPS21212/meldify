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
VANTA.HALO({
  el: "#backgroundHalo",
  mouseControls: true,
  touchControls: true,
  gyroControls: false,
  baseColor: 0x1a1a4d,
  backgroundColor: 0x0d0d1a,
  amplitudeFactor: 2.5,
  xOffset: 0.25,
  yOffset: 0.25,
  size: 1.5
});

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
    if (page) {
      if (i === index) {
        page.classList.remove('hidden');
      } else {
        page.classList.add('hidden');
      }
    } else {
      console.error(`❌ Page element not found: ${pageId}`);
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
    window.buildGallery();
  }
}

// ===== Update Settings Summary =====
function updateGallerySettings() {
  const summary = document.getElementById('settings-summary');
  if (!summary) return;
  
  summary.innerHTML = `
    <div><strong>Resolution:</strong> ${userSettings.resolution}</div>
    <div><strong>Apply LUTs:</strong> ${userSettings.applyLUT ? "Yes" : "No"}</div>
    <div><strong>Drone/Action Auto-Resolution:</strong> ${userSettings.droneResolution ? "Yes" : "No"}</div>
    <div><strong>Sync Audio:</strong> ${userSettings.syncAudio ? "Yes" : "No"}</div>
    <div><strong>Export Format:</strong> ${userSettings.exportFormat === "mp4" ? "MP4 (10Mbps)" : "ProRes Proxy"}</div>
  `;
}

// Helper function to lighten colors
function lightenColor(hex, percent) {
  hex = hex.replace('#', '');
  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * percent);
  const r = (num >> 16) + amt;
  const g = (num >> 8 & 0x00FF) + amt;
  const b = (num & 0x0000FF) + amt;
  
  return '#' + (
    (r < 255 ? (r < 1 ? 0 : r) : 255) * 0x10000 +
    (g < 255 ? (g < 1 ? 0 : g) : 255) * 0x100 +
    (b < 255 ? (b < 1 ? 0 : b) : 255)
  ).toString(16).padStart(6, '0');
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
    
    if (!group || !group.files || group.files.length === 0) {
      console.warn(`Empty camera group for ${group?.name || cameraKey}`);
      return;
    }

    const firstClip = group.files[0];
    const metadata = group.lutInfo || {};
    const confidenceClass = group.confidenceLevel?.toLowerCase() || 'none';
    
    // Create card element
    const card = document.createElement('div');
    card.className = `gallery-card ${confidenceClass}-confidence`;
    
    // Set background color based on camera metadata
    const cardColor = metadata.color || '#333333';
    card.style.background = `linear-gradient(45deg, ${cardColor}, ${lightenColor(cardColor, 20)})`;
    
    // Determine confidence indicator icon
    const confidenceIcon = 
      group.confidenceLevel === 'HIGH' ? '✓' : 
      (group.confidenceLevel === 'MEDIUM' ? '?' : '⚠️');
    
    // Populate card content
    card.innerHTML = `
      <div class="overlay">
        <div class="confidence-indicator ${confidenceClass}-confidence">${confidenceIcon}</div>
        <div style="font-size: 36px; margin-bottom: 10px;">${metadata.icon || '📹'}</div>
        <h2>${group.name}</h2>
        <p>${group.files.length} clip${group.files.length !== 1 ? 's' : ''}</p>
        <div class="lut-info ${group.confidenceLevel === 'HIGH' ? 'lut-high-confidence' : ''}">
          <strong>LUT:</strong> ${group.selectedLUT || 'Neutral'}
        </div>
        <p class="small-text source-info">Source: ${group.source || 'unknown'}</p>
        <p class="small-text">${firstClip.file.name}</p>
      </div>
    `;
    
    // Add click handler to show camera details
    card.addEventListener('click', () => {
      showCameraDetails(cameraKey, group);
    });
    
    galleryGrid.appendChild(card);
    console.log(`Added gallery card for ${group.name} with ${group.files.length} clips`);
  });
}

// ===== Show Camera Details =====
function showCameraDetails(cameraId, cameraGroup) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'camera-modal';
  
  // Get available LUTs for this camera
  const availableLUTs = cameraGroup.lutInfo?.defaultLUTs || ['Neutral'];
  const additionalLUTs = ['Neutral', 'Rec709', 'Log-to-Rec709']; // Generic fallbacks
  
  // Combine and de-duplicate LUTs
  const allLUTs = [...new Set([...availableLUTs, ...additionalLUTs])];
  
  // Create the LUT selection dropdown
  const lutOptions = allLUTs.map(lut => {
    const isSelected = lut === cameraGroup.selectedLUT;
    const isHighConfidence = cameraGroup.confidenceLevel === 'HIGH' && isSelected;
    return `<option value="${lut}" ${isSelected ? 'selected' : ''}>${lut} ${isHighConfidence ? '✓' : ''}</option>`;
  }).join('');
  
  // Build modal content
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${cameraGroup.name} Settings</h2>
        <span class="close-modal">&times;</span>
      </div>
      <div class="modal-body">
        <div class="info-row">
          <span>Camera Type:</span> <span>${cameraGroup.name}</span>
        </div>
        <div class="info-row">
          <span>Detection Method:</span> <span>${cameraGroup.source || 'Unknown'}</span>
        </div>
        <div class="info-row">
          <span>Confidence:</span> <span class="${(cameraGroup.confidenceLevel || 'none').toLowerCase()}-confidence">${cameraGroup.confidenceLevel || 'None'}</span>
        </div>
        <div class="info-row">
          <span>Clips:</span> <span>${cameraGroup.files.length}</span>
        </div>
        
        <div class="lut-selection">
          <label for="lut-select-${cameraId}">Apply LUT:</label>
          <select id="lut-select-${cameraId}" class="${cameraGroup.confidenceLevel === 'HIGH' ? 'lut-high-confidence' : ''}">
            ${lutOptions}
          </select>
        </div>
        
        <div class="clip-list">
          <h3>Clips</h3>
          <div class="clips-container">
            ${cameraGroup.files.map(file => `<div class="clip-item">${file.file.name}</div>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="apply-button">Apply</button>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(modal);
  
  // Handle close
  modal.querySelector('.close-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Handle LUT selection change
  modal.querySelector(`#lut-select-${cameraId}`).addEventListener('change', (e) => {
    const selectedLUT = e.target.value;
    cameraGroup.selectedLUT = selectedLUT;
    console.log(`Changed LUT for ${cameraGroup.name} to ${selectedLUT}`);
  });
  
  // Handle apply
  modal.querySelector('.apply-button').addEventListener('click', () => {
    const selectedLUT = modal.querySelector(`#lut-select-${cameraId}`).value;
    cameraGroup.selectedLUT = selectedLUT;
    console.log(`Applied LUT ${selectedLUT} to ${cameraGroup.name}`);
    document.body.removeChild(modal);
    
    // Refresh gallery to show updated LUT info
    window.buildGallery();
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
const exportFormatSelect = document.getElementById('exportFormat');
if (exportFormatSelect) {
  exportFormatSelect.addEventListener('change', (e) => {
    userSettings.exportFormat = e.target.value;
    console.log('✅ Export format set to:', userSettings.exportFormat);
  });
}

// ===== Build FFmpeg Command =====
function buildFFmpegCommand(inputPath, outputPath) {
  const format = userSettings.exportFormat || "mp4";
  
  // Ensure the input path is properly quoted and normalized
  const normalizedInputPath = normalizePath(inputPath).replace(/"/g, '\\"');
  const normalizedOutputPath = normalizePath(outputPath).replace(/"/g, '\\"');

  console.log('Building FFmpeg command for:', normalizedInputPath);
  console.log('Output path:', normalizedOutputPath);

  if (format === "mp4") {
    return `"${process.cwd()}/ffmpeg/ffmpeg.exe" -y -i "${normalizedInputPath}" -c:v libx264 -b:v 10M -c:a aac -movflags +faststart "${normalizedOutputPath}"`;
  } else if (format === "prores") {
    return `"${process.cwd()}/ffmpeg/ffmpeg.exe" -y -i "${normalizedInputPath}" -c:v prores_ks -profile:v 3 -c:a pcm_s16le "${normalizedOutputPath}"`;
  }
}

// ===== Start Export Process =====
const startExportBtn = document.getElementById('startExport');
if (startExportBtn) {
  startExportBtn.addEventListener('click', async () => {
    console.log("✅ Start Export button clicked!");

    const folderPath = await ipcRenderer.invoke('select-folder');

    if (!folderPath) {
      alert("❗ No output folder selected!");
      return;
    }

    console.log('Exporting to:', folderPath);

    // Gather all files from camera groups
    const allFiles = [];
    Object.values(window.cameraGroups || {}).forEach(group => {
      if (group.files && Array.isArray(group.files)) {
        allFiles.push(...group.files);
      }
    });
    
    const total = allFiles.length;

    if (total === 0) {
      alert("❗ No files to export!");
      return;
    }

    const progressContainer = document.getElementById('exportProgressContainer');
    const progressText = document.getElementById('exportProgressText');
    const progressBar = document.getElementById('exportProgressBar');

    if (progressContainer) progressContainer.style.display = 'block';
    if (progressText) progressText.textContent = `Exporting 0 / ${total}`;
    if (progressBar) progressBar.style.width = '0%';

    let current = 0;
    for (const fileEntry of allFiles) {
      const inputPath = normalizePath(fileEntry.path);
      const fileNameNoExt = fileEntry.file.name.split('.').slice(0, -1).join('.');
      const format = userSettings.exportFormat || "mp4";
      const outputExt = format === "mp4" ? ".mp4" : ".mov";
      const outputPath = normalizePath(`${folderPath}/${fileNameNoExt}${outputExt}`);

      const command = buildFFmpegCommand(inputPath, outputPath);

      console.log(`🎬 Exporting ${current + 1}/${total}: ${fileNameNoExt}`);
      console.log(`Command: ${command}`);

      await new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ FFmpeg error for ${inputPath}:`, error);
            console.error(stderr);
          } else {
            console.log(`✅ Successfully transcoded ${inputPath}`);
          }
          resolve();
        });
      });

      current++;

      const percent = Math.round((current / total) * 100);
      if (progressText) progressText.textContent = `Exporting ${current} / ${total}`;
      if (progressBar) progressBar.style.width = `${percent}%`;
    }

    alert("✅ All exports finished!");
  });
}

// ===== Initialize Dropzone =====
if (typeof window.setupDropzone === 'function') {
  window.setupDropzone();
} else {
  console.error('❌ setupDropzone function not found!');
}

// ===== Initialize First Page =====
showPage(currentPage);

}; // End window.onload