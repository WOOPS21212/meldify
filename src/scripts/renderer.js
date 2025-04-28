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