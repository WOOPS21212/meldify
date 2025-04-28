// ====== METADATA MANAGER ======
// Handles extraction and analysis of video file metadata

const { ipcRenderer } = require('electron');
const path = require('path');

// ===== Metadata Extraction =====
async function extractVideoMetadata(filePath) {
  try {
    console.log(`🔍 Extracting metadata from: ${filePath}`);
    
    // Use the main process to extract metadata (safer with FFprobe)
    const metadata = await ipcRenderer.invoke('extract-metadata', filePath);
    
    if (!metadata) {
      console.warn(`⚠️ No metadata extracted from: ${filePath}`);
      return null;
    }
    
    // Extract camera info from metadata
    const cameraInfo = {
      model: extractCameraModel(metadata),
      make: extractCameraMake(metadata),
      colorSpace: extractColorSpace(metadata),
      format: extractFormat(metadata)
    };
    
    console.log(`📊 Extracted camera info:`, cameraInfo);
    return cameraInfo;
  } catch (error) {
    console.error(`❌ Metadata extraction error:`, error);
    return null;
  }
}

// Helper functions to extract specific metadata fields
function extractCameraModel(metadata) {
  return metadata?.format?.tags?.['com.apple.quicktime.model'] || 
         metadata?.streams?.[0]?.tags?.['model'] ||
         metadata?.format?.tags?.['model'] ||
         null;
}

function extractCameraMake(metadata) {
  return metadata?.format?.tags?.['com.apple.quicktime.make'] || 
         metadata?.streams?.[0]?.tags?.['make'] ||
         metadata?.format?.tags?.['make'] ||
         null;
}

function extractColorSpace(metadata) {
  const videoStream = metadata?.streams?.find(stream => stream.codec_type === 'video');
  return videoStream?.color_space || null;
}

function extractFormat(metadata) {
  return metadata?.format?.format_name || null;
}

// ===== Camera Detection =====
function detectCameraType(fileEntry) {
  // Extract filename, extension and path
  const filename = fileEntry.file.name.toLowerCase();
  const ext = filename.split('.').pop().toLowerCase();
  const filepath = fileEntry.path.toLowerCase();
  
  // Extract folder name from path
  const folderParts = filepath.split(/[/\\]/);
  const folderName = folderParts[folderParts.length - 2] || '';
  
  console.log(`🔍 Analyzing file: ${filename} from folder: ${folderName}`);
  
  // Get metadata if available
  const metadata = fileEntry.metadata;
  
  // Confidence levels for camera detection
  let confidenceLevel = "NONE";
  let detectionSource = "fallback";
  
  // 1. Try to detect from metadata (highest confidence)
  if (metadata && metadata.model) {
    const model = metadata.model.toUpperCase();
    const make = metadata.make ? metadata.make.toUpperCase() : '';
    
    // Look for matches in camera database
    for (const cameraKey in window.cameraLUTMapping) {
      if (model.includes(cameraKey) || (make && cameraKey.includes(make))) {
        console.log(`✅ Matched camera ${cameraKey} by metadata`);
        return {
          cameraType: cameraKey,
          confidenceLevel: "HIGH",
          source: "metadata",
          lutInfo: window.cameraLUTMapping[cameraKey]
        };
      }
    }
  }
  
  // 2. Try to detect from RED file extension and folder structure
  if (ext === 'r3d' || filepath.includes('.rdc/') || filepath.includes('.rdc\\')) {
    // Look for RED camera model in metadata if available
    if (metadata && metadata.model && metadata.model.toUpperCase().includes('RED')) {
      const redModel = metadata.model.toUpperCase();
      for (const cameraKey in window.cameraLUTMapping) {
        if (redModel.includes(cameraKey)) {
          console.log(`✅ Matched RED camera ${cameraKey} by metadata and extension`);
          return {
            cameraType: cameraKey,
            confidenceLevel: "HIGH",
            source: "metadata+extension",
            lutInfo: window.cameraLUTMapping[cameraKey]
          };
        }
      }
    }
    
    // Try to detect RED reel name pattern
    const reelMatch = filename.match(/^([a-z]\d{3})_([a-z]\d{3})/i);
    if (reelMatch) {
      const reelName = reelMatch[1].toUpperCase();
      console.log(`✅ Matched RED camera by reel pattern: ${reelName}`);
      return {
        cameraType: "RED DIGITAL CINEMA",
        reelName: reelName,
        confidenceLevel: "MEDIUM",
        source: "filename_pattern",
        lutInfo: window.cameraLUTMapping["RED DIGITAL CINEMA"]
      };
    }
    
    // Fallback to generic RED
    return {
      cameraType: "GENERIC_R3D",
      confidenceLevel: "MEDIUM",
      source: "file_extension",
      lutInfo: window.cameraLUTMapping["GENERIC_R3D"]
    };
  }
  
  // 3. Try to match by folder name (good confidence)
  const normalizedFolderName = folderName.toLowerCase();
  for (const folderKey in window.folderNameMapping) {
    if (normalizedFolderName.includes(folderKey)) {
      const cameraType = window.folderNameMapping[folderKey];
      console.log(`✅ Matched camera ${cameraType} by folder name: ${normalizedFolderName}`);
      return {
        cameraType: cameraType,
        confidenceLevel: "MEDIUM",
        source: "folder_name",
        lutInfo: window.cameraLUTMapping[cameraType]
      };
    }
  }
  
  // 4. Try to detect by file extension (lower confidence)
  if (ext === 'mxf') {
    return {
      cameraType: "GENERIC_MXF",
      confidenceLevel: "LOW",
      source: "file_extension",
      lutInfo: window.cameraLUTMapping["GENERIC_MXF"]
    };
  } else if (ext === 'mov') {
    return {
      cameraType: "GENERIC_MOV",
      confidenceLevel: "LOW",
      source: "file_extension",
      lutInfo: window.cameraLUTMapping["GENERIC_MOV"]
    };
  } else if (ext === 'mp4') {
    return {
      cameraType: "GENERIC_MP4",
      confidenceLevel: "LOW",
      source: "file_extension",
      lutInfo: window.cameraLUTMapping["GENERIC_MP4"]
    };
  }
  
  // 5. Ultimate fallback
  return {
    cameraType: "Unknown Camera",
    confidenceLevel: "NONE",
    source: "fallback",
    lutInfo: {
      defaultLUTs: ["Neutral"], 
      colorSpaces: {},
      icon: "❓",
      color: "#7f8c8d"
    }
  };
}

// ===== Batch Metadata Processing =====
async function processBatchMetadata(files, batchSize = 5) {
  console.log(`🔄 Processing metadata for ${files.length} files in batches of ${batchSize}`);
  
  const processedFiles = [];
  
  // Process in batches to avoid overwhelming the system
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    console.log(`📑 Processing batch ${i/batchSize + 1} with ${batch.length} files`);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (fileEntry) => {
      try {
        // Extract metadata
        const metadata = await extractVideoMetadata(fileEntry.path);
        
        // Store metadata with the file entry
        fileEntry.metadata = metadata;
        
        // Detect camera type
        fileEntry.cameraInfo = detectCameraType(fileEntry);
        
        return fileEntry;
      } catch (error) {
        console.error(`❌ Error processing file ${fileEntry.file.name}:`, error);
        fileEntry.error = error.message;
        return fileEntry;
      }
    });
    
    // Wait for current batch to complete
    const batchResults = await Promise.all(batchPromises);
    processedFiles.push(...batchResults);
    
    // Update progress (if a progress callback is provided)
    const progress = Math.min(100, Math.round((processedFiles.length / files.length) * 100));
    console.log(`🔄 Metadata processing: ${progress}% complete`);
  }
  
  console.log(`✅ Completed metadata processing for ${processedFiles.length} files`);
  return processedFiles;
}

// ===== Export functions =====
window.metadataManager = {
  extractVideoMetadata,
  detectCameraType,
  processBatchMetadata
};