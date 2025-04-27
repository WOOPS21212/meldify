// ====== FILE MANAGER ======
// Handles: Dropzone, File Processing, Grouping, Duplicates

// ===== Global Memory =====
window.droppedFiles = [];
window.validFiles = [];
window.cameraGroups = {};

// ===== Dropzone Setup =====
function setupDropzone() {
  const dropzone = document.getElementById('dropzone');

  dropzone.addEventListener('click', () => {
    alert('File picker not implemented yet 🚧 (drag and drop works!)');
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
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

    setTimeout(() => {
      window.validFiles = filterValidFiles(window.droppedFiles);
      window.cameraGroups = groupFilesByCamera(window.validFiles);

      console.log('✅ Camera Groups:', window.cameraGroups);

      detectDuplicateFilenames(window.validFiles);

      if (typeof buildGallery === "function") {
        buildGallery();
      }
    }, 500);
  });
}

// ===== Helper Functions =====

// Recursively scan folders and files
function traverseFileTree(item, path = "") {
  if (item.isFile) {
    item.file((file) => {
      console.log('File:', path + file.name);
      window.droppedFiles.push({
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
  
    const fileMap = {};
  
    validFiles.forEach(fileEntry => {
      // Ignore extension
      const cleanName = fileEntry.file.name.split('.').slice(0, -1).join('.').toLowerCase();
  
      if (!fileMap[cleanName]) {
        fileMap[cleanName] = fileEntry;
      } else {
        // Keep the larger file
        if (fileEntry.file.size > fileMap[cleanName].file.size) {
          fileMap[cleanName] = fileEntry;
        }
      }
    });
  
    return Object.values(fileMap);
  }
  

// Group files by Camera smartly
function groupFilesByCamera(files) {
    const cameraGroups = {};
  
    files.forEach(fileEntry => {
      const fullPath = fileEntry.path;
      const filename = fileEntry.file.name;
  
      const parts = fullPath.split(/[\\/]/);
  
      let folderName = "Unknown Folder";
  
      if (parts.length >= 3) {
        const parentFolder = parts[parts.length - 2];
        const grandParentFolder = parts[parts.length - 3];
  
        if (parentFolder.toLowerCase().endsWith(".rdc")) {
          folderName = grandParentFolder;
        } else {
          folderName = parentFolder;
        }
      }
  
      // Unified Camera Type Detection
      let cameraType = "Unknown";
  
      const nameCheck = filename.toLowerCase();
  
      if (nameCheck.includes("dji")) {
        cameraType = "DJI";
      } else if (nameCheck.includes("gopr")) {
        cameraType = "GoPro";
      } else if (nameCheck.includes("red") || nameCheck.includes(".r3d") || nameCheck.includes(".rdc")) {
        cameraType = "RED";
      } else {
        const match = filename.match(/^([a-z]\d{3})/i);
        if (match) {
          cameraType = match[1].toUpperCase(); // e.g., A001
        }
      }
  
      // === SMART LOGIC - Keyword Based Grouping ===
      let smartGroup = "";
  
      const folderNameLower = folderName.toLowerCase();
  
      if (folderNameLower.includes("lens")) {
        smartGroup = "Lens Tests";
      } else if (folderNameLower.includes("test")) {
        smartGroup = "Camera Tests";
      } else if (folderNameLower.includes("b cam") || folderNameLower.includes("b-cam") || folderNameLower.includes("2")) {
        smartGroup = "B-Cam";
      } else if (folderNameLower.includes("c cam") || folderNameLower.includes("c-cam") || folderNameLower.includes("3")) {
        smartGroup = "C-Cam";
      } else if (folderNameLower.includes("raw")) {
        smartGroup = "RAW Main";
      } else {
        smartGroup = folderName.replace(/[_\-]/g, ' ').trim();
      }
  
      const groupKey = `${cameraType} – ${smartGroup}`;
  
      if (!cameraGroups[groupKey]) {
        cameraGroups[groupKey] = [];
      }
      cameraGroups[groupKey].push(fileEntry);
    });
  
    return cameraGroups;
  }
  

// Detect Duplicate Filenames
function detectDuplicateFilenames(files) {
  const nameMap = {};
  const duplicates = [];

  files.forEach(fileEntry => {
    const name = fileEntry.file.name;
    if (nameMap[name]) {
      duplicates.push(name);
    } else {
      nameMap[name] = true;
    }
  });

  if (duplicates.length > 0) {
    console.warn('⚠️ Duplicate filenames detected:', duplicates);

    alert("⚠️ We found duplicate clip names. Don't worry! Meldify will auto-organize them safely during transcoding. 🎥✅");
  }
}
