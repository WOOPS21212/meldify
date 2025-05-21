/**
 * Handles folder scanning, video file detection, and camera grouping
 * 
 * Note: This script now uses the electronAPI bridge exposed via preload.js
 * Instead of directly using Node.js APIs which aren't available in the renderer
 * with contextIsolation: true and nodeIntegration: false
 */

// Using the exposed electronAPI instead of direct Node.js modules
// These functions need to be moved to main process or preload

/**
 * Exposes folder scanning and file grouping functions to the window object
 * to be accessible from the renderer
 */
(function() {
  // This is a client-side wrapper that will call electronAPI methods
  
  /**
   * Recursively scans a folder for video files
   * @param {string} folderPath - Path to the folder to scan
   * @returns {Promise<Array<{path: string, name: string, size: number}>>} Array of video files
   */
  window.scanFolder = async function(folderPath) {
    try {
      console.log("Wrapper: Scanning folder", folderPath);
      // This should be implemented in preload/main to actually perform the scan
      
      // For now, return an empty array with a message since the functionality
      // needs to be moved to main process
      console.warn("scanFolder requires main process implementation");
      alert("Folder scanning functionality requires an update to use electronAPI instead of Node.js APIs directly. This will be implemented in main/preload.");
      
      return [];
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
      
      // For now, create a simple mock structure that the UI can work with
      // This should be implemented in main/preload
      console.warn("groupByCamera requires main process implementation");
      
      // Mock a camera group for demo purposes
      return [{
        name: "Demo Camera",
        files: files.map((f, i) => ({
          file: { name: `demo-file-${i}.mp4` },
          path: f.path || `/mock/path/demo-file-${i}.mp4`
        })),
        totalSize: 1024 * 1024, // 1MB mock size
        fileCount: files.length
      }];
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

// NOTE: The following code needs to be moved to main.js or preload.js:
/*
const fs = require('fs').promises;
const path = require('path');
const { toWindowsPath, ensureAbsolutePath, validatePath } = require('./utils/pathUtils');
const { isSupportedVideoFormat, groupFilesByCamera } = require('./utils/fileTypeUtils');

async function scanFolder(folderPath) {
    // Ensure we have a valid, absolute path
    const absolutePath = ensureAbsolutePath(folderPath);
    const windowsSafePath = toWindowsPath(absolutePath);

    // Validate the path exists
    const isValid = await validatePath(windowsSafePath);
    if (!isValid) {
        throw new Error(`Invalid or inaccessible path: ${windowsSafePath}`);
    }

    const videoFiles = [];

    async function scanDirectory(currentPath) {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);

            if (entry.isDirectory()) {
                // Recursively scan subdirectories
                await scanDirectory(fullPath);
            } else if (entry.isFile() && isSupportedVideoFormat(entry.name)) {
                // Get file stats for size
                const stats = await fs.stat(fullPath);
                
                videoFiles.push({
                    path: fullPath,
                    name: entry.name,
                    size: stats.size
                });
            }
        }
    }

    // Start the recursive scan
    await scanDirectory(windowsSafePath);
    return videoFiles;
}

async function groupByCamera(files) {
    // First group files by camera using fileTypeUtils
    const groupedByCamera = groupFilesByCamera(files);

    // Convert groups object to array format with metadata
    const cameraGroups = Object.entries(groupedByCamera).map(([camera, files]) => {
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        
        return {
            name: camera,
            files: files,
            totalSize: totalSize,
            fileCount: files.length
        };
    });

    return cameraGroups;
}

async function handleFolderDrop(folderPath) {
    try {
        const files = await scanFolder(folderPath);
        const groups = await groupByCamera(files);
        return groups;
    } catch (error) {
        console.error('Error processing folder:', error);
        throw error;
    }
}
*/
