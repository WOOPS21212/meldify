Electron App PRD (Updated May 21, 2025)

📄 Summary

This document outlines updated requirements and fixes for Meldify, a lightweight Electron app for professional camera footage ingestion, organization, and export. This update incorporates bug discoveries and workflow improvements confirmed during local testing.

✨ Goals & Objectives

Build a Windows-only Electron app for ingesting and organizing large sets of raw footage.

Support drag-and-drop and manual folder selection for ingesting footage.

Enable export to industry-standard formats (MP4, MXF, ProRes/RED proxy).

Maintain a clean UI with fast performance and minimal dependencies.

💪 Feature Updates

✅ 1. Folder Ingestion: Manual Selection Bug

Problem:
Clicking the "browse" button to select a folder throws:

Error invoking remote method 'scan-folder': TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string ... Received undefined

Cause:

The file input is not configured to return a directory path.

Fix:

Use Electron's dialog.showOpenDialog in main.js with { properties: ['openDirectory'] }.

Validate the selected path before sending it to the IPC handler scan-folder.

✔ 2. Drag-and-Drop Behavior (Confirmed Working)

Status:

Dragging folders into the UI successfully triggers folder scan and grouping.

No crash or input errors observed during this interaction.

⚠ 3. UI Error Dialog Blocking (IPC Errors)

Problem:

When a scan fails, a blocking dialog.showErrorBox halts the app.

Fix:

Replace modal with a non-blocking alert/toast or sidebar error.

Allow users to continue interacting with the app even after an error.

✅ 4. Export Functionality Enhanced (Patch Applied)

Problem:
Initial export wiring was corrected, but the underlying FFmpeg execution logic needed refinement for handling multiple files, ensuring correct input paths, and providing better error/success feedback.

Fix (based on user-provided patch May 21, 2025):
- Updated `export.js`:
    - `MediaExporter` class now takes `cameraGroups` and `exportFormat` in constructor.
    - `export()` method gathers all files, sets up `exportOptions` (including a temporary hardcoded `outputDir`), and calls `window.electronAPI.exportMedia(exportOptions)`.
    - A new event listener is directly attached to the export button, instantiating `MediaExporter` on click.
- Updated `main.js`:
    - Replaced `start-export` IPC listener with `export-media`.
    - New handler iterates through `inputFiles`, constructs FFmpeg arguments based on format, and spawns an FFmpeg process for each file.
    - Includes basic validation for `inputFiles` and `outputDir` (creates if not exists).
    - Replies with more detailed status (`{ status, file, originalFile, message }`) on `export-complete` for each file.
- Updated `preload.js`:
    - Changed `exportMedia` to send to `export-media` IPC channel.
    - Modified `onExportComplete` to pass the full result object from `main.js` to the renderer callback.

Outstanding:
- ~~Reconcile element IDs in patched `export.js` (`start-export`, `export-format`) with actual HTML IDs (`startExport`, `exportFormat`).~~ (Resolved: `start-export` ID mismatch corrected to `startExport`. `export-format` ID mismatch corrected to `exportFormat`.)
- ~~Ensure `window.groupedFiles` (used in patched `export.js`) has the correct structure expected by `MediaExporter`.~~ (Resolved: `renderer.js` now populates `window.groupedFiles` from `window.cameraGroups` after scan/grouping.)
- Implement dynamic output directory selection instead of hardcoded path.
- Refine UI feedback for batch export progress and individual file statuses.
Ensure FFmpeg is executed with correct arguments. (Covered by patch)

Add progress feedback to UI. (Partially addressed by more detailed IPC, UI needs to use it)

## 📐 Design System Updates (May 22, 2025)

### Window Specifications
- **Default Size:** 1600x900 (increased from 1280x800)
- **Framework:** Electron with pure HTML/CSS/JS

### UI Components
- **Navigation Buttons:** Large pill-style (16px 40px padding, 1.4rem font)
- **Gallery Cards:** Transparent white folders (8% opacity white background)
- **Scrollable Areas:** Custom webkit scrollbars with 30% opacity white
- **Typography:** Helvetica Neue, varied sizes for hierarchy

### Navigation Flow
- Welcome → Settings → Gallery → Export (Audio page temporarily hidden)

📅 Timeline (Revised)

Phase | Focus | Status
------|-------|-------
1 | Electron app scaffold | Complete
2 | Folder ingestion (drag-drop) | Complete
3 | Folder ingestion (manual) | In Progress
4 | FFmpeg integration + Export UI | Pending
5 | Error handling UX | Pending
6 | Settings + Theming | Later
7 | FAQ + Support Section | Later

### Current Implementation Status
✅ Folder drag-and-drop ingestion
✅ Camera grouping by file type (R3D, MOV, MXF)
✅ Scrollable gallery with improved card design
✅ Basic settings configuration
⏳ Export functionality (partially implemented)
❌ Thumbnail generation
❌ LUT assignment per camera
❌ Audio sync features

---

### ✅ Patch Addendum – May 21, 2025

🆕 Manual Folder Picker:
- Fully implemented using Electron's `dialog.showOpenDialog`.
- Path validation added before IPC call to `scan-folder`.
- Corrected a `SyntaxError` in `main.js` caused by duplicate `fs` module declarations by renaming the synchronous import to `fsSync`.
- 📤 Export Destination Picker: Users can now select a custom output folder for exports via a dialog. If no folder is chosen, output defaults to `PROJECT_ROOT/exports/`.
- 🛑 Cancel Transcode: The export screen now includes an emergency ‘Cancel Transcode’ button that halts all active FFmpeg processes mid-operation.

🚀 Export Trigger & FFmpeg Handling (Patch Applied May 21, 2025):
- Previous: Resolved "Pending API update" alert by correcting script loading.
- Current: Applied a patch to `export.js`, `main.js`, and `preload.js` to:
    - Refine how export options (multiple input files, format, output directory) are collected in `export.js` and sent via IPC.
    - Overhaul the `export-media` IPC handler in `main.js` to process each input file with FFmpeg, with improved argument construction and error/success reporting per file.
    - Update `preload.js` to match the new IPC channel and richer `export-complete` data.
    - Further refined by a subsequent patch (May 21 evening): `renderer.js` now explicitly sets `window.groupedFiles` from `window.cameraGroups`; `export.js` alerts if no files are available for export and includes robustness checks; `main.js` uses a relative path for FFmpeg (`./ffmpeg/ffmpeg.exe`), includes more robust per-file checks, and ensures the `ffmpeg.on('error')` handler is present. This series of changes also included updating `fileManager.js` to store full absolute paths as `fullPath` in its file objects, and modifying `export.js` to use these `fullPath` properties when collecting files for FFmpeg. This resolves potential 'file not found' errors, especially for footage in subdirectories.
- FFmpeg execution logic is significantly improved.
- Pending: Dynamic output path, UI integration for detailed progress/status.
