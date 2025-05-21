/**
 * Utility functions for handling file paths safely across Windows systems
 */

/**
 * Converts any path to use proper Windows path separators and escaping
 * @param {string} path - The input path to sanitize
 * @returns {string} - Windows-safe absolute path
 */
function toWindowsPath(path) {
    // Replace forward slashes with backslashes
    let windowsPath = path.replace(/\//g, '\\');
    
    // Ensure UNC paths are properly formatted
    if (windowsPath.startsWith('\\\\')) {
        windowsPath = `\\\\${windowsPath.substring(2)}`;
    }
    
    // Escape spaces and special characters
    windowsPath = windowsPath.replace(/([\s"'&()[\]{}^=;!'+,`~])/g, '^$1');
    
    return windowsPath;
}

/**
 * Ensures a path is absolute, converting relative paths if needed
 * @param {string} path - The input path to check/convert
 * @returns {string} - Absolute path
 */
function ensureAbsolutePath(path) {
    if (!path) return '';
    
    // Check if path is already absolute
    if (path.match(/^[A-Za-z]:\\/) || path.match(/^\\\\/)) {
        return path;
    }
    
    // Convert relative path to absolute using process.cwd()
    const { join } = require('path');
    return join(process.cwd(), path);
}

/**
 * Validates that a path exists and is accessible
 * @param {string} path - The path to validate
 * @returns {Promise<boolean>} - True if path exists and is accessible
 */
async function validatePath(path) {
    const fs = require('fs').promises;
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    toWindowsPath,
    ensureAbsolutePath,
    validatePath
};
