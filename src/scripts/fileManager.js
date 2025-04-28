// ====== FILE MANAGER ======
// Handles: Dropzone, File Processing, Grouping, Duplicates

// ===== Global Memory =====
window.droppedFiles = [];
window.validFiles = [];
window.cameraGroups = {};
window.processingState = {
  isProcessing: false,
  progress: 0,
  stage: ''
};

// ===== Dropzone Setup =====
window.setupDropzone = function() {
  const dropzone = document.getElementById('dropzone');
  if (!dropzone) {
    console.error('❌ Dropzone element not found!');
    return;
  }

  console.log('🔄 Setting up dropzone handlers');

  dropzone.addEventListener('click', async () => {
    try {
      const folderPath = await window.ipcRenderer.invoke('select-folder');
      if (folderPath) {
        // TODO: Implement folder scanning
        console.log('Selected folder:', folderPath);
        alert('Folder scanning coming soon! For now, please drag and drop files directly.');
      }
    } catch (error) {
      console.error('❌ Error selecting folder:', error);
    }
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
    
    // Set processing state
    window.processingState = {
      isProcessing: true,
      progress: 0,
      stage: 'scanning'
    };
    
    // Update UI to show processing state
    updateProcessingUI();

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
          
          // Calculate progress percentage
          const scanProgress = Math.round((processedEntries / pendingEntries) * 100);
          window.processingState.progress = scanProgress;
          updateProcessingUI();
          
          // When all entries processed, move to file analysis
          if (processedEntries === pendingEntries) {
            console.log('✅ All files scanned. Found:', window.droppedFiles.length);
            processFiles();
          }
        });
      }
    }
  });
  
  console.log('✅ Dropzone setup complete');
};

// Recursively scan folders and files with callback
function traverseFileTree(item, path = "", callback) {
  if (item.isFile) {
    item.file((file) => {
      // Normalize file object with path
      if (!file.path) {
        file.path = path + file.name;
      }
      
      console.log('📄 Found file:', file.path || path + file.name);
      window.droppedFiles.push({
        path: file.path || path + file.name,
        file: file
      });
      
      if (callback) callback();
    }, (error) => {
      console.error('❌ Error accessing file:', error);
      if (callback) callback();
    });
  } else if (item.isDirectory) {
    // Improved directory reading
    const dirReader = item.createReader();
    let pendingDirEntries = 0;
    let processedDirEntries = 0;
    
    const readEntries = () => {
      dirReader.readEntries((entries) => {
        if (entries.length > 0) {
          pendingDirEntries += entries.length;
          
          entries.forEach((entry) => {
            traverseFileTree(entry, path + item.name + "/", () => {
              processedDirEntries++;
              if (processedDirEntries >= pendingDirEntries) {
                if (callback) callback();
              }
            });
          });
          
          // Continue reading if there might be more entries
          readEntries();
        } else {
          // If no entries found and we haven't processed any yet, 
          // this is an empty directory
          if (pendingDirEntries === 0 && callback) {
            callback();
          }
          console.log('📁 Finished reading directory:', path + item.name);
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

// Update UI to reflect processing state
function updateProcessingUI() {
  const dropzone = document.getElementById('dropzone');
  if (!dropzone) return;
  
  if (window.processingState.isProcessing) {
    const progress = window.processingState.progress;
    const stage = window.processingState.stage;
    
    dropzone.innerHTML = `
      <div>
        <p>${stage === 'scanning' ? 'Scanning files' : 'Analyzing cameras'}... ${progress}%</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>
    `;
  } else {
    dropzone.innerHTML = 'Drop your files here or click to browse';
  }
}

// Process the collected files
async function processFiles() {
  console.log('🔄 Processing files...');
  
  // Update UI state
  window.processingState.stage = 'analyzing';
  window.processingState.progress = 0;
  updateProcessingUI();
  
  // Filter only media files
  window.validFiles = filterValidFiles(window.droppedFiles);
  console.log('✅ Valid media files found:', window.validFiles.length);
  
  // Early exit if no valid files
  if (window.validFiles.length === 0) {
    window.processingState.isProcessing = false;
    updateProcessingUI();
    alert('No valid media files found. Please drag and drop video files (R3D, MOV, MXF, MP4, etc.)');
    return;
  }

  try {
    // Process metadata and group files
    const files = await window.metadataManager.processBatchMetadata(window.validFiles);
    window.validFiles = files;
    
    // Group files by camera
    window.cameraGroups = groupFilesByCamera(window.validFiles);
    
    // Detect duplicates
    detectDuplicateFilenames(window.validFiles);
    
    // Update UI state
    window.processingState.isProcessing = false;
    window.processingState.progress = 100;
    updateProcessingUI();
    
    // Update gallery if function exists
    if (typeof window.buildGallery === "function") {
      window.buildGallery();
    } else {
      console.error('❌ buildGallery function not found!');
    }
  } catch (error) {
    console.error('❌ Error processing files:', error);
    window.processingState.isProcessing = false;
    updateProcessingUI();
    alert('Error processing files: ' + error.message);
  }
}

// Filter only footage/audio
function filterValidFiles(files) {
  const validExtensions = ['.r3d', '.mov', '.mxf', '.mp4', '.wav', '.ari'];
  return files.filter(fileEntry => {
    if (!fileEntry || !fileEntry.path) return false;
    const lowerPath = fileEntry.path.toLowerCase();
    return validExtensions.some(ext => lowerPath.endsWith(ext));
  });
}

// Group files by Camera info
function groupFilesByCamera(files) {
  const cameraGroups = {};
  
  console.log('🔍 Starting camera grouping with', files.length, 'files');

  files.forEach(fileEntry => {
    if (!fileEntry || !fileEntry.file || !fileEntry.cameraInfo) {
      console.warn('⚠️ Invalid file entry or missing camera info:', fileEntry);
      return;
    }
    
    // Extract the camera info
    const cameraInfo = fileEntry.cameraInfo;
    const cameraType = cameraInfo.cameraType;
    
    // Handle reel names for certain cameras (like RED)
    let groupKey = cameraType;
    if (cameraInfo.reelName && ['RED DIGITAL CINEMA', 'GENERIC_R3D'].includes(cameraType)) {
      groupKey = `${cameraType} - ${cameraInfo.reelName}`;
    }
    
    // Create group if it doesn't exist
    if (!cameraGroups[groupKey]) {
      cameraGroups[groupKey] = {
        name: groupKey,
        source: cameraInfo.source,
        confidenceLevel: cameraInfo.confidenceLevel,
        lutInfo: cameraInfo.lutInfo,
        // Default selected LUT is the first in the list
        selectedLUT: cameraInfo.lutInfo?.defaultLUTs?.[0] || 'Neutral',
        files: []
      };
    }
    
    // Add file to group
    cameraGroups[groupKey].files.push(fileEntry);
  });

  console.log('✅ Finished grouping. Camera groups:', Object.keys(cameraGroups));
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