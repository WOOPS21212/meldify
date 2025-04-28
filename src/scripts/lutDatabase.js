// ====== LUT DATABASE ======
// This file contains a comprehensive database of camera models and their associated LUTs

// Camera to LUT mapping database
const cameraLUTMapping = {
    // RED Cameras
    "RED DIGITAL CINEMA": {
      defaultLUTs: ["REDLogFilm", "REDWideGamutRGB"],
      colorSpaces: {
        "bt2020": "REDWideGamutRGB_BT2020.cube",
        "bt709": "REDWideGamutRGB_BT709.cube"
      },
      icon: "🔴",
      color: "#e74c3c"
    },
    "RED KOMODO": {
      defaultLUTs: ["REDWideGamutRGB/Log3G10", "REDLogFilm"],
      colorSpaces: {
        "bt2020": "REDWideGamutRGB_BT2020.cube",
        "bt709": "REDWideGamutRGB_BT709.cube"
      },
      icon: "🔴",
      color: "#c0392b"
    },
    "RED DSMC2": {
      defaultLUTs: ["REDWideGamutRGB/Log3G10", "REDLogFilm"],
      colorSpaces: {
        "bt2020": "REDWideGamutRGB_BT2020.cube",
        "bt709": "REDWideGamutRGB_BT709.cube"
      },
      icon: "🔴",
      color: "#c0392b"
    },
    "RED EPIC": {
      defaultLUTs: ["REDLogFilm", "REDcolor4"],
      colorSpaces: {
        "bt709": "REDcolor4_BT709.cube"
      },
      icon: "🔴",
      color: "#c0392b"
    },
    
    // ARRI Cameras
    "ARRI ALEXA": {
      defaultLUTs: ["ARRI_LogC-to-Rec709", "ARRI_K1S1"],
      colorSpaces: {
        "bt2020": "ARRI_LogC_to_BT2020.cube",
        "bt709": "ARRI_LogC_to_Rec709.cube"
      },
      icon: "🎬",
      color: "#2980b9"
    },
    "ALEXA": {
      defaultLUTs: ["ARRI_LogC-to-Rec709", "ARRI_K1S1"],
      colorSpaces: {
        "bt2020": "ARRI_LogC_to_BT2020.cube",
        "bt709": "ARRI_LogC_to_Rec709.cube"
      },
      icon: "🎬",
      color: "#2980b9"
    },
    "ARRI ALEXA MINI": {
      defaultLUTs: ["ARRI_LogC-to-Rec709", "ARRI_K1S1"],
      colorSpaces: {
        "bt2020": "ARRI_LogC_to_BT2020.cube",
        "bt709": "ARRI_LogC_to_Rec709.cube"
      },
      icon: "🎬",
      color: "#2980b9"
    },
    "ARRI AMIRA": {
      defaultLUTs: ["ARRI_LogC-to-Rec709", "ARRI_K1S1"],
      colorSpaces: {
        "bt2020": "ARRI_LogC_to_BT2020.cube",
        "bt709": "ARRI_LogC_to_Rec709.cube"
      },
      icon: "🎬",
      color: "#3498db"
    },
    
    // Sony Cameras
    "SONY VENICE": {
      defaultLUTs: ["S-Gamut3.Cine/S-Log3", "Sony_LC-709"],
      colorSpaces: {
        "bt2020": "SGamut3Cine_SLog3_to_BT2020.cube",
        "bt709": "SGamut3Cine_SLog3_to_Rec709.cube"
      },
      icon: "📽️",
      color: "#8e44ad"
    },
    "SONY FX9": {
      defaultLUTs: ["S-Gamut3.Cine/S-Log3", "Sony_LC-709"],
      colorSpaces: {
        "bt709": "SGamut3Cine_SLog3_to_Rec709.cube"
      },
      icon: "📽️",
      color: "#9b59b6"
    },
    "SONY F55": {
      defaultLUTs: ["S-Gamut3/S-Log3", "Sony_LC-709"],
      colorSpaces: {
        "bt709": "SGamut3_SLog3_to_Rec709.cube"
      },
      icon: "📽️",
      color: "#9b59b6"
    },
    "SONY FS7": {
      defaultLUTs: ["S-Gamut3/S-Log3", "Sony_LC-709"],
      colorSpaces: {
        "bt709": "SGamut3_SLog3_to_Rec709.cube"
      },
      icon: "📽️",
      color: "#9b59b6"
    },
    "SONY A7S": {
      defaultLUTs: ["S-Gamut3.Cine/S-Log3", "Sony_LC-709"],
      colorSpaces: {
        "bt709": "SGamut3Cine_SLog3_to_Rec709.cube"
      },
      icon: "📽️",
      color: "#9b59b6"
    },
    
    // Canon Cameras
    "CANON C300": {
      defaultLUTs: ["Canon_C-Log", "Canon_C-Log_to_Rec709"],
      colorSpaces: {
        "bt709": "Canon_C-Log_to_Rec709.cube"
      },
      icon: "🎥",
      color: "#d35400"
    },
    "CANON C100": {
      defaultLUTs: ["Canon_C-Log", "Canon_C-Log_to_Rec709"],
      colorSpaces: {
        "bt709": "Canon_C-Log_to_Rec709.cube"
      },
      icon: "🎥",
      color: "#d35400"
    },
    "CANON C500": {
      defaultLUTs: ["Canon_C-Log2", "Canon_C-Log2_to_Rec709"],
      colorSpaces: {
        "bt709": "Canon_C-Log2_to_Rec709.cube"
      },
      icon: "🎥",
      color: "#e67e22"
    },
    
    // Blackmagic Cameras
    "BLACKMAGIC": {
      defaultLUTs: ["BMD_Film_to_Rec709", "BMD_4K_Film"],
      colorSpaces: {
        "bt709": "BMD_Film_to_Rec709.cube"
      },
      icon: "🎭",
      color: "#2c3e50"
    },
    "BMPCC": {
      defaultLUTs: ["BMD_Film_to_Rec709", "BMD_4K_Film"],
      colorSpaces: {
        "bt709": "BMD_Film_to_Rec709.cube"
      },
      icon: "🎭",
      color: "#2c3e50"
    },
    "URSA": {
      defaultLUTs: ["BMD_Film_to_Rec709", "BMD_4.6K_Film"],
      colorSpaces: {
        "bt709": "BMD_Film_to_Rec709.cube"
      },
      icon: "🎭",
      color: "#2c3e50"
    },
    
    // Action Cameras
    "GOPRO": {
      defaultLUTs: ["GoPro_Flat_to_Rec709", "GoPro_Protune"],
      colorSpaces: {
        "bt709": "GoPro_Flat_to_Rec709.cube"
      },
      icon: "📱",
      color: "#2ecc71"
    },
    "DJI": {
      defaultLUTs: ["DJI_D-Log_to_Rec709", "DJI_D-Cinelike"],
      colorSpaces: {
        "bt709": "DJI_D-Log_to_Rec709.cube"
      },
      icon: "🚁",
      color: "#27ae60"
    },
    "PHANTOM": {
      defaultLUTs: ["Phantom_Log_to_Rec709"],
      colorSpaces: {
        "bt709": "Phantom_Log_to_Rec709.cube"
      },
      icon: "🚁",
      color: "#16a085"
    },
    
    // Generic fallbacks by video type
    "GENERIC_R3D": {
      defaultLUTs: ["REDLogFilm"],
      colorSpaces: {},
      icon: "🔴",
      color: "#c0392b"
    },
    "GENERIC_MXF": {
      defaultLUTs: ["LogC-to-Rec709", "S-Log3_to_Rec709"],
      colorSpaces: {},
      icon: "🎬",
      color: "#34495e"
    },
    "GENERIC_MOV": {
      defaultLUTs: ["Neutral", "Log-to-Rec709"],
      colorSpaces: {},
      icon: "🎥",
      color: "#7f8c8d"
    },
    "GENERIC_MP4": {
      defaultLUTs: ["Neutral"],
      colorSpaces: {},
      icon: "📱",
      color: "#95a5a6"
    }
  };
  
  // Folder name to camera mapping for common folder structures
  const folderNameMapping = {
    // RED
    "red": "RED DIGITAL CINEMA",
    "r3d": "RED DIGITAL CINEMA",
    "komodo": "RED KOMODO",
    "epic": "RED EPIC",
    "helium": "RED DSMC2",
    "gemini": "RED DSMC2",
    "dragon": "RED DSMC2",
    "monstro": "RED DSMC2",
    "reel": "RED DIGITAL CINEMA", // Common RED shoot folder
    
    // ARRI
    "arri": "ARRI ALEXA",
    "alexa": "ARRI ALEXA",
    "mini": "ARRI ALEXA MINI",
    "amira": "ARRI AMIRA",
    
    // Sony
    "sony": "SONY VENICE",
    "venice": "SONY VENICE",
    "fx9": "SONY FX9",
    "fs7": "SONY FS7",
    "f55": "SONY F55",
    "a7s": "SONY A7S",
    
    // Canon
    "canon": "CANON C300",
    "c300": "CANON C300",
    "c100": "CANON C100",
    "c500": "CANON C500",
    
    // Blackmagic
    "blackmagic": "BLACKMAGIC",
    "bmpcc": "BMPCC",
    "ursa": "URSA",
    "pocket": "BMPCC",
    
    // Action cameras
    "gopro": "GOPRO",
    "hero": "GOPRO",
    "action": "GOPRO",
    "dji": "DJI",
    "drone": "DJI",
    "phantom": "PHANTOM",
    "mavic": "DJI",
    "air": "DJI"
  };
  
  // Export the databases
  window.cameraLUTMapping = cameraLUTMapping;
  window.folderNameMapping = folderNameMapping;