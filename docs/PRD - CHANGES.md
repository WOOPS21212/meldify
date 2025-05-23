# Meldify – PRD Change Log (Living Journal)

## Purpose

This document tracks any change in scope, feature reordering, added ideas, design deviations, and experimental branches during development. It is updated in sync with the main PRD.

---

## Template for Entries

```
### [YYYY-MM-DD] – [Short Title]
**Change Type:** [Added / Removed / Changed / Reordered / Experimental]
**Description:** What changed and why.
**Impacted Sections:** List of affected parts in PRD or files.
**Next Steps:** What follow-up is required.
```

---

## Log

### [2025-05-22] – UI/UX Improvements Phase 1
**Change Type:** Changed
**Description:** Made several UI improvements for better usability:
1. Increased navigation button sizes (padding: 16px 40px, font-size: 1.4rem)
2. Made gallery cards larger and more visible (350px minimum width)
3. Increased Electron window size to 1600x900 for better content visibility
4. Removed Audio page from navigation flow (temporarily hidden)
5. Implemented scrollable gallery area to prevent button cutoff
6. Restyled gallery cards with transparent white design (80% transparency)
**Impacted Sections:** 
- `main.js` - Window dimensions
- `src/styles/style.scss` - Button sizes, gallery layout, card styling
- `src/scripts/renderer.js` - Navigation flow, removed audio page
- `src/index.html` - Gallery page structure
**Next Steps:** 
- Implement thumbnail previews for video files
- Add camera-specific LUT assignment functionality
- Complete export functionality with progress tracking

### [2025-05-22] – Design System Update
**Change Type:** Changed
**Description:** Established new design principles:
- Transparent white UI elements (rgba(255, 255, 255, 0.08) base)
- Blur backdrop effects for depth
- Consistent hover states with subtle elevation
- Folder-like card design for camera groups
- No purple/gradient backgrounds on cards
**Impacted Sections:** Design guidelines, UI styling
**Next Steps:** Apply consistent design system across all pages

### [2025-05-21] – Unified UI Style and Aspect-Ratio-Based Binning
**Change Type:** Changed/Added
**Description:** 
- Normalized all button sizes and alignment across the UI.
- Scaled down the “Detected cameras...” text by 50%.
- Gallery cards now reflect the true aspect ratio of each video clip.
- Footage with different aspect ratios is now binned separately.
**Impacted Sections:** 
- index.html
- style.scss
- Electron App PRD > UI & Gallery
- Project Overview
**Next Steps:** 
- Implement visual aspect-ratio scaling in gallery rendering logic.
- Update gallery sorting logic to bin by aspect ratio group.

### \[2025-05-20] – Project Bootstrapped for AI Agent Build

**Change Type:** Added
**Description:** Full PRD and Overview created. Development to be done step-by-step via Cursor agent with validations after each task.
**Impacted Sections:** Entire PRD, created `project-overview.md`, `PRD.md`, and this file.
**Next Steps:** Begin executing `[task]`-based construction with Cursor.

### \[2025-05-20] – Implemented File Management Core

**Change Type:** Added
**Description:** Created core file management functionality with three key modules:
1. pathUtils.js - Ensures safe Windows path handling
2. fileTypeUtils.js - Classifies video files by camera source
3. fileManager.js - Handles folder scanning and file organization

**Impacted Sections:** 
- Created `/src/scripts/utils/pathUtils.js`
- Created `/src/scripts/utils/fileTypeUtils.js`
- Created `/src/scripts/fileManager.js`
- Implemented function contracts from PRD for fileManager.js

**Next Steps:** Proceed with implementing the gallery display functionality.


📝 Change Log

[2025-05-21] – Merged PRD Versions

Change Type: Removed
Description: Consolidated PRD.md into Electron App PRD.md to avoid duplication.
Impacted Sections: PRD.md, Electron App PRD.md
Next Steps: Delete or archive PRD.md, continue edits only in Electron App PRD.md.

### [2025-05-21] – Recursive Folder Scanning
**Change Type:** Added
**Description:** Implemented IPC-based folder scanning to handle large drag-and-drop imports and gather absolute paths for .R3D, .MOV, and .MXF files.
**Impacted Sections:** main.js, preload.js, src/scripts/fileManager.js, PRD folder ingestion section.
**Next Steps:** Integrate scanned file groups into gallery display.

## 2025-05-21 — Patch 02

- 🛠 Fixed folder selection bug when using click-based picker (path undefined).
- ✅ Verified drag-and-drop folder import already works as intended.
- 🛠 Switched blocking error dialogs to non-blocking UI error flow.
- ⚙ Implemented backend hookup plan for "Start Export" button.

### [2025-05-21] – Folder Picker + Export Button Integration

**Change Type:** Added  
**Description:**  
- Applied Codex patch_02 to implement manual folder selection using `dialog.showOpenDialog` with path validation before IPC call.  
- Applied patch_03 to begin wiring up export trigger from renderer via `ipcRenderer.send('start-export', options)`.

**Impacted Sections:**  
- Electron App PRD > Folder Ingestion (manual)  
- Electron App PRD > Export Screen  
- `main.js`, `renderer.js`, `fileManager.js`, UI export page

**Next Steps:**  
- Validate end-to-end export process using FFmpeg  
- Add error feedback and export progress indicator to UI

### [2025-05-21] – Corrected Export Button "Pending API Update" Error
**Change Type:** Changed/Fixed
**Description:** Resolved an issue where the "Start Export" button would show a "Pending API update" alert. The root cause was `export.js` (containing the correct `MediaExporter` class using `electronAPI`) not being included in `index.html`, and a conflicting event listener for the same button ID existing in `renderer.js` which showed the alert.
**Impacted Sections:** 
- `src/index.html` (added script include for `export.js`)
- `src/scripts/renderer.js` (commented out conflicting event listener)
- `src/scripts/export.js` (now correctly loaded and handling the export button)
- Electron App PRD > Export Screen (updated problem/fix description)
**Next Steps:** Continue with validating the end-to-end export process, including dynamic path selection and progress feedback.

### [2025-05-21] – Applied Patch for FFmpeg Input Path and Error Tracing
**Change Type:** Changed/Fixed
**Description:** Applied a user-provided patch to enhance FFmpeg export functionality.
- `src/scripts/export.js`: Rewritten to use a new `MediaExporter` class structure. It now collects all files from `window.groupedFiles`, prepares `exportOptions` (including multiple input files, format, and a temporary hardcoded output directory), and sends them via `window.electronAPI.exportMedia()`. An event listener is now directly attached to the export button.
- `main.js`: The IPC handler for exports was changed from `start-export` to `export-media`. The new handler iterates through each input file, spawns an FFmpeg process, and provides more detailed status objects (`{ status, file, originalFile, message }`) via `export-complete` for each file. It also creates the output directory if it doesn't exist.
- `preload.js`: Updated `electronAPI.exportMedia` to use the new `export-media` IPC channel. The `onExportComplete` handler was modified to pass the entire detailed status object to the renderer's callback.
**Impacted Sections:** 
- `src/scripts/export.js`
- `main.js`
- `preload.js`
- Electron App PRD > Export Functionality (updated problem/fix description and addendum)
**Next Steps:** 
- Test the patched export functionality thoroughly.
- Address potential discrepancies in the patched `export.js` (HTML element IDs: `start-export` vs `startExport`, `export-format` vs `exportFormat`; structure/source of `window.groupedFiles`).
- Implement dynamic output directory selection.
- Enhance UI to display batch progress and individual file export statuses using the new detailed information from `export-complete`.

### [2025-05-21] – Resolved Runtime Errors in `main.js` and `export.js`
**Change Type:** Changed/Fixed
**Description:** 
- Fixed `SyntaxError: Identifier 'fs' has already been declared` in `main.js` by renaming the duplicate `fs` import (for synchronous operations) to `fsSync` and updating its usages. The `fs/promises` import remains as `fs`.
- Fixed `Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')` in `src/scripts/export.js` by correcting the `getElementById` call for the export button from `start-export` to `startExport` to match the ID in `index.html`.
**Impacted Sections:** `main.js`, `src/scripts/export.js`.
**Next Steps:** Verify application stability and continue with export functionality testing.

### [2025-05-21] – Applied Patch for Export File Handling and UI Feedback
**Change Type:** Changed/Fixed
**Description:** Applied a user-provided patch to improve export functionality:
- `renderer.js`: Ensured `window.groupedFiles` is populated from `window.cameraGroups` for use by `export.js`.
- `export.js`: Added a check to prevent export and alert the user if no files are selected/detected. Added minor robustness checks.
- `main.js`: Updated the `export-media` IPC handler to use `'./ffmpeg/ffmpeg.exe'` as the path, improved individual file existence checks before processing, and refined logging/reply messages. Retained `ffmpeg.on('error')` handler for robust error catching.
**Impacted Sections:** `src/scripts/renderer.js`, `src/scripts/export.js`, `main.js`, Electron App PRD > Export Functionality.
**Next Steps:** Thoroughly test the export process with various scenarios, including empty selections and missing files.

### [2025-05-21] – Export Input Path Now Uses Full Absolute Path
**Change Type:** Fixed
**Description:** Ensured export uses correct `.fullPath` to prevent FFmpeg from failing with 'file not found'. Resolved RED/MXF subfolder issues during export.
**Impacted Sections:** fileManager.js, renderer.js, export.js
**Next Steps:** Add per-file success/failure feedback to gallery.

### [2025-05-21] – Added Export Folder Picker
**Change Type:** Added
**Description:** Allows users to select output folder for transcoded exports via Electron dialog. Falls back to default if none selected.
**Impacted Sections:** export.js, preload.js, main.js, index.html, Electron App PRD (Export Screen)
**Next Steps:** Persist last-used folder, add UI validation if folder is not writable.

### [2025-05-21] – Added Cancel Export Button
**Change Type:** Added
**Description:** Users can now cancel all in-progress FFmpeg transcodes via a “Cancel Transcode” button. Useful for large batches or emergency stops.
**Impacted Sections:** export.js, main.js, preload.js, index.html
**Next Steps:** Add UI message on cancellation.
