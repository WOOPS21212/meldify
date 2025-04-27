const { ipcRenderer } = require('electron');
const { exec } = require('child_process');

window.onload = function() {

// ===== Settings Memory =====
const userSettings = {
  resolution: "HD",
  applyLUT: true,
  droneResolution: true,
  syncAudio: true,
  exportFormat: "mp4" // Default export format
};

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
  galleryGrid.innerHTML = "";

  if (Object.keys(window.cameraGroups).length === 0) {
    galleryGrid.innerHTML = "<p>No cameras detected yet.</p>";
    return;
  }

  Object.keys(window.cameraGroups).forEach(cameraName => {
    const group = window.cameraGroups[cameraName];

    const firstClip = group.length > 0 ? group[0] : null;
    let thumbnailURL = "";

    if (firstClip) {
      thumbnailURL = "url('assets/placeholder-thumb.jpg')";
    }

    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.style.backgroundImage = thumbnailURL;
    card.style.backgroundSize = 'cover';
    card.style.backgroundPosition = 'center';
    card.style.backgroundRepeat = 'no-repeat';
    card.style.borderRadius = '20px';

    card.innerHTML = `
      <div class="overlay">
        <h2>${cameraName}</h2>
        <p>${group.length} clips</p>
      </div>
    `;
    galleryGrid.appendChild(card);
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

  const allFiles = Object.values(window.cameraGroups).flat();
  let current = 0;
  const total = allFiles.length;

  if (total === 0) {
    alert("❗ No files to export!");
    return;
  }

  // Show Progress UI
  const progressContainer = document.getElementById('exportProgressContainer');
  const progressText = document.getElementById('exportProgressText');
  const progressBar = document.getElementById('exportProgressBar');

  progressContainer.style.display = 'block';
  progressText.textContent = `Exporting 0 / ${total}`;
  progressBar.style.width = '0%';

  for (const fileEntry of allFiles) {
    const inputPath = fileEntry.path;
    const fileNameNoExt = fileEntry.file.name.split('.').slice(0, -1).join('.');
    const format = userSettings.exportFormat || "mp4";
    const outputExt = format === "mp4" ? ".mp4" : ".mov";
    const outputPath = `${folderPath}/${fileNameNoExt}${outputExt}`;

    const command = buildFFmpegCommand(inputPath, outputPath);

    console.log(`🎬 Exporting ${current + 1}/${total}: ${fileNameNoExt}`);
    console.log('Running Command:', command);

    await new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Error transcoding ${inputPath}:`, error);
        } else {
          console.log(`✅ Successfully transcoded ${inputPath}`);
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

// ===== Initialize Dropzone (Drag and Drop) =====
setupDropzone();

// ===== Initialize First Page =====
showPage(currentPage);

}; // End window.onload
