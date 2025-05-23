// Using electronAPI from preload.js - all Node APIs are removed for security with contextIsolation
// const { ipcRenderer } = require('electron'); // REMOVED - not available in renderer
// const { exec } = require('child_process'); // REMOVED - not available in renderer

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
  // "page-audio",  // Commented out to skip
  "page-export"
];
let currentPage = 0;

function showPage(index) {
  // Hide all pages first
  document.querySelectorAll('.page').forEach(page => {
    page.classList.add('hidden');
  });
  
  // Show the current page
  const currentPageId = pages[index];
  const currentPageElement = document.getElementById(currentPageId);
  if (currentPageElement) {
    currentPageElement.classList.remove('hidden');
  }

  // Update color filters
  const body = document.body;
  if (index === 0) { body.style.filter = 'hue-rotate(0deg)'; } // page-welcome
  if (index === 1) { body.style.filter = 'hue-rotate(20deg)'; } // page-settings
  if (index === 2) { body.style.filter = 'hue-rotate(60deg)'; } // page-gallery
  if (index === 3) { body.style.filter = 'hue-rotate(180deg)'; } // page-export (was index 4)

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
    
    // Background color is now handled by CSS (.gallery-card)
    
    // Populate card content
    const firstClipInGroup = group[0]; // group is the array of files. cameraKey is the group name.
    const aspectRatioText = firstClipInGroup.aspectRatio !== "unknown" ? `(${firstClipInGroup.aspectRatio})` : "";
    const displayName = cameraKey;

    // Updated innerHTML structure as per user feedback
    card.innerHTML = `
      <div class="overlay">
        <div style="font-size: 28px; margin-bottom: 8px; opacity: 0.8;">📹</div>
        <h2>${displayName}</h2>
        <p>${group.length} clip${group.length !== 1 ? 's' : ''} ${aspectRatioText}</p> 
        <p class="small-text">${firstClipInGroup.file.name}</p>
      </div>
    `;
    // Note: The aspect ratio text is kept. The dynamic styling for aspect ratio via padding-bottom is removed
    // as the new CSS for .gallery-card sets min/max height and uses flex to center.
    
    // Add click handler to show camera details
    card.addEventListener('click', () => {
      alert(`Selected group: ${displayName} with ${group.length} clips`);
    });
    
    galleryGrid.appendChild(card);
    console.log(`Added gallery card for ${displayName} with ${group.length} clips`);
  });

  // Ensure window.cameraGroups is updated for export.js if it relies on the old structure
  // The new structure from fileManager.js is an array of groups.
  // If export.js expects an object keyed by camera name, this needs adjustment.
  // For now, let's assume export.js will be adapted or uses a flat list of files.
  // window.groupedFiles is already set in handleFolderDrop in renderer.js using the new structure.
  // window.cameraGroups = groups.reduce((acc, group) => {
  //   acc[group.name] = group.files; // This might need to change if export.js uses this
  //   return acc;
  // }, {});
  // The above reduction is from an older version of handleFolderDrop.
  // The current handleFolderDrop in renderer.js does:
  // window.cameraGroups = groups.reduce((acc, group) => {
  //   acc[group.name] = group.files; // group.name is now camera_aspectRatio
  //   return acc;
  // }, {});
  // window.groupedFiles = window.cameraGroups;
  // This seems okay for now, as export.js iterates Object.values(window.cameraGroups)
  // which would be an array of arrays of files.
}

// ===== Navigation Buttons =====
function setupNavButtons() {
  console.log("Setting up nav buttons");
  
  // Get all navigation buttons
  const nextButtons = document.querySelectorAll('.next-btn');
  const backButtons = document.querySelectorAll('.back-btn');
  
  console.log(`Found ${nextButtons.length} next buttons and ${backButtons.length} back buttons`);
  
  // Setup next button clicks
  nextButtons.forEach(button => {
    button.addEventListener('click', () => {
      console.log(`Next button clicked, current page: ${currentPage}`);
      currentPage++;
      if (currentPage >= pages.length) currentPage = pages.length - 1;
      console.log(`Moving to page: ${currentPage}`);
      showPage(currentPage);
    });
  });
  
  // Setup back button clicks
  backButtons.forEach(button => {
    button.addEventListener('click', () => {
      console.log(`Back button clicked, current page: ${currentPage}`);
      currentPage--;
      if (currentPage < 0) currentPage = 0;
      console.log(`Moving to page: ${currentPage}`);
      showPage(currentPage);
    });
  });
}

// Call this immediately
setupNavButtons();

// ===== Handle Export Format Change =====
document.getElementById('exportFormat').addEventListener('change', (e) => {
  userSettings.exportFormat = e.target.value;
  console.log('✅ Export format set to:', userSettings.exportFormat);
});

// ===== Build FFmpeg Command =====
function buildFFmpegCommand(inputPath, outputPath) {
  const format = userSettings.exportFormat || "mp4";

  // Using relative paths since process.cwd() isn't available in renderer
  if (format === "mp4") {
    return `./ffmpeg/ffmpeg.exe -y -i "${inputPath}" -c:v libx264 -b:v 10M -c:a aac -movflags +faststart "${outputPath}"`;
  } else if (format === "prores") {
    return `./ffmpeg/ffmpeg.exe -y -i "${inputPath}" -c:v prores_ks -profile:v 3 -c:a pcm_s16le "${outputPath}"`;
  }
}

// ===== Start Export Process =====
// document.getElementById('startExport').addEventListener('click', async () => {
//   console.log("✅ Start Export button clicked!");

//   // Use electronAPI from preload.js instead of direct ipcRenderer
//   const folderPath = await window.electronAPI.selectFolder();

//   if (!folderPath) {
//     alert("❗ No output folder selected!");
//     return;
//   }

//   console.log('Exporting to:', folderPath);

//   // Flatten the array of arrays in cameraGroups
//   const allFiles = [];
//   Object.values(window.cameraGroups).forEach(group => {
//     if (Array.isArray(group)) {
//       allFiles.push(...group);
//     }
//   });
//   let current = 0;
//   const total = allFiles.length;

//   if (total === 0) {
//     alert("❗ No files to export!");
//     return;
//   }

//   const progressContainer = document.getElementById('exportProgressContainer');
//   const progressText = document.getElementById('exportProgressText');
//   const progressBar = document.getElementById('exportProgressBar');

//   progressContainer.style.display = 'block';
//   progressText.textContent = `Exporting 0 / ${total}`;
//   progressBar.style.width = '0%';

//   // We can't use exec directly anymore - need to modify main.js and preload.js to add a channel for this
//   alert("Export functionality requires an update to use electronAPI instead of Node.js APIs directly. Please contact the developer.");
  
//   // Show progress for demo purposes
//   progressText.textContent = `Export pending API update`;
//   progressBar.style.width = `100%`;
// });

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
    // We need to use the electronAPI for this functionality since we can't access Node.js APIs directly
    if (typeof window.scanFolder === 'function') {
      // If scanFolder has been exposed to window by fileManager.js
      const files = await window.scanFolder(folderPath);
      console.log("Found files:", files.length);
      
      if (typeof window.groupByCamera === 'function') {
        const groupsArray = await window.groupByCamera(files); // This now returns an array of group objects
        
        // Populate window.cameraGroups as an object for buildGallery and potentially export.js
        window.cameraGroups = {};
        groupsArray.forEach(group => {
          // group.name is like "MOV_16:9", group.files is the array of file objects
          window.cameraGroups[group.name] = group.files; 
        });
        
        // For export.js, which flattens Object.values(window.cameraGroups)
        // This structure should still work, as Object.values will give an array of arrays of files.
        window.groupedFiles = window.cameraGroups; 

        buildGallery();
      } else {
        console.error("groupByCamera function not available");
        alert("File processing functionality requires an update to use electronAPI instead of Node.js APIs directly.");
      }
    } else {
      console.error("scanFolder function not available");
      alert("File scanning functionality requires an update to use electronAPI instead of Node.js APIs directly.");
    }
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

// Initialize Vanta background outside onload to ensure it runs regardless of other errors
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Initializing Vanta");
  
  // Wait a short time to ensure elements are fully rendered
  setTimeout(() => {
    initVantaBackground();
  }, 100);
});

// Separate function to initialize Vanta background
function initVantaBackground() {
  try {
    console.log("Initializing Vanta background");
    const backgroundEl = document.getElementById("backgroundHalo");
    
    if (!backgroundEl) {
      console.error("Background element not found!");
      return;
    }
    
    console.log("Background element found:", backgroundEl);
    
    if (typeof VANTA !== 'undefined' && VANTA.HALO) {
      console.log("VANTA is defined, creating effect");
      
      VANTA.HALO({
        el: backgroundEl, // Use the direct element reference
        mouseControls: true,
        touchControls: true,
        minHeight: 200.00,
        minWidth: 200.00,
        baseColor: 0x111111,
        backgroundColor: 0x000000
      });
      
      console.log("✅ Vanta background initialized successfully");
    } else {
      console.error("❌ VANTA or VANTA.HALO is not defined");
    }
  } catch (error) {
    console.error("❌ Error initializing Vanta background:", error);
  }
}
