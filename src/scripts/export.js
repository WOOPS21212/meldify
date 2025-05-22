// PATCH: Fix input file population for export.js by assigning groupedFiles globally
// Also adds basic UI feedback if no files are passed

// --- In export.js ---
let selectedOutputPath = null;

class MediaExporter {
  constructor(cameraGroups, exportFormat) {
    this.cameraGroups = cameraGroups;
    this.exportFormat = exportFormat;
  }

  export() {
    const allFiles = [];
    // Ensure cameraGroups is not null or undefined before trying to iterate
    if (this.cameraGroups) {
      for (const group in this.cameraGroups) {
        // Ensure the group itself is an array and not empty
        if (Array.isArray(this.cameraGroups[group])) {
          this.cameraGroups[group].forEach(file => {
            // 'file' is an object like { file: { name: '...' }, fullPath: '...' }
            // We need to push the fullPath for FFmpeg.
            if (file && file.fullPath) {
              allFiles.push(file.fullPath);
            } else {
              console.warn("Skipping file in export due to missing fullPath:", file);
            }
          });
        }
      }
    }


    if (allFiles.length === 0) {
      alert("No clips selected or detected for export. Please check your footage groups.");
      console.warn("Export aborted: inputFiles is empty.");
      return;
    }

    const exportOptions = {
      inputFiles: allFiles,
      format: this.exportFormat,
      outputDir: selectedOutputPath || 'K:/Development-2025/Meldify/exports'
    };

    console.log("Sending export options:", exportOptions);
    window.electronAPI.exportMedia(exportOptions);
  }
}

const exportBtn = document.getElementById('startExport');
// Ensure exportBtn exists before adding event listener to prevent errors if HTML changes
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    // Ensure window.groupedFiles is available
    if (typeof window.groupedFiles === 'undefined') {
        alert("Footage groups not loaded. Please select and process footage first.");
        console.warn("Export aborted: window.groupedFiles is undefined.");
        return;
    }
    const exporter = new MediaExporter(window.groupedFiles, document.getElementById('exportFormat').value);
    exporter.export();
  });
} else {
  console.error("Export button with ID 'startExport' not found.");
}

const chooseFolderBtn = document.getElementById('chooseExportFolder');
if (chooseFolderBtn) {
  chooseFolderBtn.addEventListener('click', async () => {
    selectedOutputPath = await window.electronAPI.selectExportFolder();
    if (selectedOutputPath) {
      console.log('Selected output folder:', selectedOutputPath);
      // Optionally, provide UI feedback that folder has been selected, e.g., update a label
      // alert(`Export folder set to: ${selectedOutputPath}`); // Example feedback
    } else {
      console.log('No output folder selected or selection cancelled.');
      // alert("No folder selected for export output."); // Example feedback
    }
  });
} else {
  console.error("Choose Export Folder button with ID 'chooseExportFolder' not found.");
}

const cancelExportBtn = document.getElementById('cancelExport');
if (cancelExportBtn) {
  cancelExportBtn.addEventListener('click', () => {
    console.log('Cancel export button clicked.');
    window.electronAPI.cancelExport();
    // Optionally, provide UI feedback that cancellation has been requested.
    // e.g., disable start button, show "Cancelling..." message.
  });
} else {
  console.error("Cancel Export button with ID 'cancelExport' not found.");
}
