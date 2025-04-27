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
      if (!file || !file.path) {
        console.warn("⚠️ Skipping invalid file:", file);
        return;
      }
      console.log('✅ File:', file.path);
      window.droppedFiles.push({
        path: file.path, // Absolute correct path!
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
  return files.filter(fileEntry => {
    if (!fileEntry || !fileEntry.path) return false;
    const lowerPath = fileEntry.path.toLowerCase();
    return validExtensions.some(ext => lowerPath.endsWith(ext));
  });
}

// Group files by Camera name, smarter detection
function groupFilesByCamera(files) {
  const cameraGroups = {};

  files.forEach(fileEntry => {
    const filename = fileEntry.file.name.toLowerCase();

    // Detect basic Camera Type
    let cameraType = "Unknown";

    if (filename.startsWith("dji")) {
      cameraType = "DJI Drone";
    } else if (filename.startsWith("gopr")) {
      cameraType = "GoPro";
    } else if (filename.endsWith(".r3d") || filename.includes("red")) {
      cameraType = "RED Camera";
    } else {
      const match = filename.match(/^([a-z]\d{3})/i);
      if (match) {
        cameraType = match[1].toUpperCase(); // e.g., "A001"
      }
    }

    if (!cameraGroups[cameraType]) {
      cameraGroups[cameraType] = [];
    }
    cameraGroups[cameraType].push(fileEntry);
  });

  return cameraGroups;
}

// Detect Duplicate Filenames
function detectDuplicateFilenames(files) {
  const nameMap = {};
  const duplicates = [];

  files.forEach(fileEntry => {
    if (!fileEntry || !fileEntry.file) return;
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
