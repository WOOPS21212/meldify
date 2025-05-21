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
  window.groupByCamera = async function(files) {
    try {
      console.log("Wrapper: Grouping files by camera", files.length);
      const groups = {};
      files.forEach((p) => {
        const name = p.split(/[/\\]/).pop();
        const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
        const key = ext.replace('.', '').toUpperCase();
        if (!groups[key]) groups[key] = [];
        groups[key].push({ file: { name }, path: p });
      });
      return Object.keys(groups).map(k => ({
        name: k,
        files: groups[k],
        totalSize: groups[k].length,
        fileCount: groups[k].length
      }));
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
