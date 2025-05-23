/**
 * Handles folder scanning, video file detection, and camera grouping
 * 
 * Note: This script now uses the electronAPI bridge exposed via preload.js
 * Instead of directly using Node.js APIs which aren't available in the renderer
 * with contextIsolation: true and nodeIntegration: false
 */

// Uses the electronAPI bridge instead of Node.js modules

/**
 * Exposes folder scanning and file grouping functions to the window object
 * to be accessible from the renderer
 */
(function() {
  // This is a client-side wrapper that will call electronAPI methods
  
  /**
   * Recursively scans a folder for supported video files.
   * @param {string} folderPath - Absolute path to the folder to scan.
   * @returns {Promise<string[]>} Array of absolute file paths.
   */
  window.scanFolder = async function(folderPath) {
    try {
      console.log("Wrapper: Scanning folder", folderPath);
      if (!window.electronAPI || typeof window.electronAPI.scanFolder !== 'function') {
        throw new Error('scanFolder API not available');
      }
      const files = await window.electronAPI.scanFolder(folderPath);
      return files;
    } catch (error) {
      console.error("Error in scanFolder wrapper:", error);
      throw error;
    }
  };

  /**
   * Groups video files by their camera source
   * @param {Array<{path: string, name: string, size: number}>} files - Array of video files
   * @returns {Promise<Array>} Array of camera groups with metadata
   */
  /**
   * Calculates aspect ratio from width and height.
   * @param {number} width
   * @param {number} height
   * @returns {string} Aspect ratio string (e.g., "16:9")
   */
  function getAspectRatio(width, height) {
    if (!width || !height) return "unknown";
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const commonDivisor = gcd(width, height);
    return `${width / commonDivisor}:${height / commonDivisor}`;
  }

  window.groupByCamera = async function(files) {
    try {
      console.log("Wrapper: Grouping files by camera and aspect ratio", files.length);
      const groups = {};
      
      for (const filePath of files) { // Assuming files is an array of full paths
        const name = filePath.split(/[/\\]/).pop();
        const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
        const cameraType = ext.replace('.', '').toUpperCase(); // Basic grouping by extension as camera type

        let aspectRatioKey = "unknown";
        let dimensions = { width: 0, height: 0 };
        try {
          if (window.electronAPI && typeof window.electronAPI.getVideoDimensions === 'function') {
            dimensions = await window.electronAPI.getVideoDimensions(filePath);
            if (dimensions && dimensions.width && dimensions.height) {
              aspectRatioKey = getAspectRatio(dimensions.width, dimensions.height);
            }
          } else {
            console.warn('getVideoDimensions API not available. Aspect ratio will be unknown.');
          }
        } catch (err) {
          console.error(`Error getting dimensions for ${filePath}:`, err.message);
          // Keep aspectRatioKey as "unknown"
        }

        const groupKey = `${cameraType}_${aspectRatioKey}`; // Combined key

        if (!groups[groupKey]) {
          groups[groupKey] = {
            name: groupKey, // Display name for the group
            cameraType: cameraType,
            aspectRatio: aspectRatioKey,
            files: [],
            fileCount: 0
          };
        }
        groups[groupKey].files.push({ 
          file: { name }, 
          fullPath: filePath,
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio: aspectRatioKey
        });
        groups[groupKey].fileCount++;
      }
      
      return Object.values(groups); // Return an array of group objects
    } catch (error) {
      console.error("Error in groupByCamera wrapper:", error);
      throw error;
    }
  };

  /**
   * Handles a folder drop event
   * @param {string} folderPath - Path to the dropped folder
   * @returns {Promise<Array>} Array of camera groups
   */
  window.handleFolderDrop = async function(folderPath) {
    try {
      console.log("Wrapper: Handling folder drop", folderPath);
      
      const files = await window.scanFolder(folderPath);
      const groups = await window.groupByCamera(files);
      return groups;
    } catch (error) {
      console.error("Error in handleFolderDrop wrapper:", error);
      throw error;
    }
  };
})();
