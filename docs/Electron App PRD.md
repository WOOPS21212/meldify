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

⏳ 4. Export Screen Incomplete

Problem:

"Start Export" button is non-functional. UI displays "Pending API update."

Fix:

Wire the button to a backend ipcRenderer.send('start-export', options).

Ensure FFmpeg is executed with correct arguments.

Add progress feedback to UI.

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
