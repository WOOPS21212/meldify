// ====== FILE MANAGER ======
// Handles: Dropzone, File Processing, Grouping, Duplicates

// ===== Global Memory =====
window.droppedFiles = [];
window.validFiles = [];
window.cameraGroups = {};

// ===== Dropzone Setup =====
window.setupDropzone = function() {
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

    // Reset global arrays
    window.droppedFiles = [];
    window.validFiles = [];
    window.cameraGroups = {};

    const items = e.dataTransfer.items;
    console.log(`🔄 Processing ${items.length} dropped items...`);

    // Count to track when all entries have been processed
    let pendingEntries = 0;
    let processedEntries = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item) {
        pendingEntries++;
        traverseFileTree(item, '', () => {
          processedEntries++;
          
          // When all entries processed, process the files
          if (processedEntries === pendingEntries) {
            console.log('✅ All files scanned. Found:', window.droppedFiles.length);
            processFiles();
          }
        });
      }
    }
  });

  // Process the collected files
  function processFiles() {
    console.log('🔄 Processing files...');
    
    // Filter only media files
    window.validFiles = filterValidFiles(window.droppedFiles);
    console.log('✅ Valid media files found:', window.validFiles.length);
    
    // Early exit if no valid files
    if (window.validFiles.length === 0) {
      alert('No valid media files found. Please drag and drop video files (R3D, MOV, MXF, MP4, etc.)');
      return;
    }

    // Group files by camera
    window.cameraGroups = groupFilesByCamera(window.validFiles);
    console.log('✅ Camera Groups:', window.cameraGroups);
    
    // Detect duplicates
    detectDuplicateFilenames(window.validFiles);
    
    // Update gallery if function exists
    if (typeof window.buildGallery === "function") {
      window.buildGallery();
    } else {
      console.error('❌ buildGallery function not found!');
    }
  }
}

// ===== Helper Functions =====

// Recursively scan folders and files with callback
function traverseFileTree(item, path = "", callback) {
  if (item.isFile) {
    item.file((file) => {
      if (!file || !file.path) {
        console.warn("⚠️ Skipping invalid file:", file);
        if (callback) callback();
        return;
      }
      console.log('✅ File:', file.path);
      window.droppedFiles.push({
        path: file.path, // Absolute correct path!
        file: file
      });
      if (callback) callback();
    }, (error) => {
      console.error('❌ Error accessing file:', error);
      if (callback) callback();
    });
  } else if (item.isDirectory) {
    const dirReader = item.createReader();
    let pendingEntries = 0;
    let processedEntries = 0;
    
    const readEntries = () => {
      dirReader.readEntries((entries) => {
        if (entries.length > 0) {
          pendingEntries += entries.length;
          
          entries.forEach((entry) => {
            traverseFileTree(entry, path + item.name + "/", () => {
              processedEntries++;
              if (processedEntries >= pendingEntries && callback) {
                callback();
              }
            });
          });
          
          // Continue reading if there might be more entries
          readEntries();
        } else {
          // If no entries found and we haven't processed any yet, 
          // this is an empty directory
          if (pendingEntries === 0 && callback) {
            callback();
          }
        }
      }, (error) => {
        console.error('❌ Error reading directory:', error);
        if (callback) callback();
      });
    };
    
    readEntries();
  } else {
    // Neither file nor directory
    console.warn('⚠️ Unknown item type:', item);
    if (callback) callback();
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
