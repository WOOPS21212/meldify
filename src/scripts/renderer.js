// =========================
// Wait until everything is loaded first
// =========================
window.onload = function() {

  // ===== VANTA.js Halo Background =====
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
  
  // ===== Settings Memory =====
  const userSettings = {
    resolution: "HD",
    applyLUT: true,
    droneResolution: true,
    syncAudio: true
  };
  
  // ===== Page Navigation =====
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
    }
  }
  
  function updateGallerySettings() {
    const summary = document.getElementById('settings-summary');
    summary.innerHTML = `
      <div><strong>Resolution:</strong> ${userSettings.resolution}</div>
      <div><strong>Apply LUTs:</strong> ${userSettings.applyLUT ? "Yes" : "No"}</div>
      <div><strong>Drone/Action Auto-Resolution:</strong> ${userSettings.droneResolution ? "Yes" : "No"}</div>
      <div><strong>Sync Audio:</strong> ${userSettings.syncAudio ? "Yes" : "No"}</div>
    `;
  }
  
  // ===== Button Event Listeners =====
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
  
  showPage(currentPage);
  
  // ===== Settings Form Listeners =====
  document.querySelectorAll('.resolution-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.resolution-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      userSettings.resolution = btn.getAttribute('data-value');
      console.log('Resolution set to:', userSettings.resolution);
    });
  });
  
  document.getElementById('applyLUT').addEventListener('change', (e) => {
    userSettings.applyLUT = e.target.checked;
    console.log('Apply LUTs:', userSettings.applyLUT);
  });
  
  document.getElementById('droneResolution').addEventListener('change', (e) => {
    userSettings.droneResolution = e.target.checked;
    console.log('Drone Resolution:', userSettings.droneResolution);
  });
  
  document.getElementById('syncAudio').addEventListener('change', (e) => {
    userSettings.syncAudio = e.target.checked;
    console.log('Sync Audio:', userSettings.syncAudio);
  });
  
  // ===== Dropzone Logic (Drag and Drop) =====
  const dropzone = document.getElementById('dropzone');
  const droppedFiles = [];
  
  dropzone.addEventListener('click', () => {
    alert('File picker not implemented yet 🚧 (drag and drop works!)');
  });
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
  
    const items = e.dataTransfer.items;
  
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) {
        traverseFileTree(item);
      }
    }
  
    // 🧹 After dropping, filter and group
    setTimeout(() => {
      const validFiles = filterValidFiles(droppedFiles);
      const cameraGroups = groupFilesByCamera(validFiles);
      console.log('✅ Camera Groups:', cameraGroups);
  
      // (Later) Update the Gallery UI here
    }, 500);
  });
  
  // ===== Helper Functions =====
  
  // Recursively scan folders and files
  function traverseFileTree(item, path = "") {
    if (item.isFile) {
      item.file((file) => {
        console.log('File:', path + file.name);
        droppedFiles.push({
          path: path + file.name,
          file: file
        });
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      dirReader.readEntries((entries) => {
        entries.forEach((entry) => {
          traverseFileTree(entry, path + item.name + "/");
        });
      });
    }
  }
  
  // Filter only footage/audio
  function filterValidFiles(files) {
    const validExtensions = ['.r3d', '.mov', '.mxf', '.mp4', '.wav'];
    const validFiles = files.filter(fileEntry => {
      const lowerPath = fileEntry.path.toLowerCase();
      return validExtensions.some(ext => lowerPath.endsWith(ext));
    });
  
    console.log('✅ Filtered valid files:', validFiles);
    return validFiles;
  }
  
  // Group files by Camera name
  function groupFilesByCamera(files) {
    const cameraGroups = {};
  
    files.forEach(fileEntry => {
      const filename = fileEntry.file.name.toLowerCase();
  
      let cameraName = "Unknown";
  
      if (filename.startsWith("dji")) {
        cameraName = "DJI";
      } else if (filename.startsWith("gopr")) {
        cameraName = "GoPro";
      } else if (filename.startsWith("red") || filename.endsWith(".r3d")) {
        cameraName = "RED";
      } else {
        const match = filename.match(/^([a-z]\d{3})/i);
        if (match) {
          cameraName = match[1].toUpperCase(); // e.g., "A001"
        }
      }
  
      if (!cameraGroups[cameraName]) {
        cameraGroups[cameraName] = [];
      }
      cameraGroups[cameraName].push(fileEntry);
    });
  
    console.log('✅ Grouped by Cameras:', cameraGroups);
    return cameraGroups;
  }
  
  }; // <-- End of window.onload
  