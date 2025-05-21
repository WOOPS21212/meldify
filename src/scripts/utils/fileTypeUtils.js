/**
 * Utility functions for detecting and classifying video file types by camera source
 */

// Supported file extensions and their potential camera sources
const CAMERA_FORMATS = {
    '.r3d': ['RED'],
    '.mxf': ['Sony', 'Canon'],
    '.mov': ['Blackmagic', 'ARRI', 'Canon'],
    '.mp4': ['DJI', 'GoPro', 'Generic']
};

// Common camera model identifiers in filenames
const CAMERA_IDENTIFIERS = {
    RED: ['red', 'komodo', 'helium', 'gemini', 'dragon'],
    Sony: ['sony', 'venice', 'fx', 'fs'],
    Canon: ['canon', 'c300', 'c500', 'eos'],
    Blackmagic: ['bmd', 'bmpcc', 'ursa'],
    ARRI: ['arri', 'alexa', 'amira'],
    DJI: ['dji', 'mavic', 'phantom', 'inspire'],
    GoPro: ['gopro', 'hero']
};

/**
 * Determines if a file is a supported video format
 * @param {string} filename - The filename to check
 * @returns {boolean} - True if file is a supported video format
 */
function isSupportedVideoFormat(filename) {
    const ext = getFileExtension(filename).toLowerCase();
    return Object.keys(CAMERA_FORMATS).includes(ext);
}

/**
 * Gets the file extension including the dot
 * @param {string} filename - The filename to process
 * @returns {string} - The file extension (e.g., '.mp4')
 */
function getFileExtension(filename) {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    return ext;
}

/**
 * Detects the likely camera source based on filename and extension
 * @param {string} filename - The filename to analyze
 * @returns {string} - The detected camera source (e.g., 'RED', 'Sony', etc.)
 */
function detectCameraSource(filename) {
    const ext = getFileExtension(filename);
    const lowercaseFilename = filename.toLowerCase();
    
    // Get possible camera sources for this extension
    const possibleSources = CAMERA_FORMATS[ext] || [];
    
    // Look for camera identifiers in filename
    for (const [camera, identifiers] of Object.entries(CAMERA_IDENTIFIERS)) {
        if (identifiers.some(id => lowercaseFilename.includes(id))) {
            // Verify this camera matches the file extension
            if (possibleSources.includes(camera)) {
                return camera;
            }
        }
    }
    
    // If no specific camera detected, return first possible source or 'Unknown'
    return possibleSources[0] || 'Unknown';
}

/**
 * Groups an array of files by their camera source
 * @param {Array<{path: string, name: string}>} files - Array of file objects
 * @returns {Object} - Files grouped by camera source
 */
function groupFilesByCamera(files) {
    return files.reduce((groups, file) => {
        const source = detectCameraSource(file.name);
        if (!groups[source]) {
            groups[source] = [];
        }
        groups[source].push(file);
        return groups;
    }, {});
}

module.exports = {
    isSupportedVideoFormat,
    detectCameraSource,
    groupFilesByCamera,
    CAMERA_FORMATS,
    CAMERA_IDENTIFIERS
};
