
**Product Requirements Document (PRD)**

---

## 🧪 How to Preview Meldify App

### Run the Electron App Locally (Windows)

1. Open a terminal in the Meldify directory:

   ```powershell
   cd K:\Development-2025\Meldify
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Launch the app:

   ```bash
   npm start
   ```

This opens the Electron UI where you can select or drop a folder to begin ingesting camera footage.

Ensure FFmpeg is present in the `ffmpeg/` folder and paths are Windows-safe.

---

### 📃 Summary

The goal is to build a **lightweight Electron app** that efficiently ingests, organizes, previews, and exports professional camera footage. It must be able to handle large folder sets without crashing or lagging, and include export support for industry formats like **MXF (Sony, Canon)** and **RED (Blackmagic Design)**.

The app will offer a **user-friendly UI** for navigation, feature customization (default export format, output folder overrides), and include helpful modules like a **support section**, **FAQ**, and **changelog**.

It will be **Windows-only**, due to dependencies on utilities such as **FFmpeg** and system-level file manipulation. Minimal dependencies will ensure it performs well even on lower-spec systems.

---

### 🌟 Goals & Objectives

* Build an **Electron-based desktop application** for Windows.
* Allow ingestion of **large folder sets** containing professional footage without performance degradation.
* Provide **export functionality** supporting multiple formats: MXF, RED, MP4.
* Offer a **clean, intuitive interface** with easy-to-navigate sections.
* Support user customization of output settings (e.g., format, destination folder).
* Include **support features**: Help, FAQ, changelog.
* Keep the app **lightweight** with minimal external dependencies.

---

### 📃 Detailed Features

#### ✂ Folder Ingestion

* Droppable area or explorer-based folder selection.
* Background indexing of folder contents.

#### 📂 Organization & Metadata

* Group footage by camera, date, file type, etc.
* Display associated metadata: resolution, codec, duration, etc.

#### 🎥 Clip Preview & Export

* Built-in visual previewer for clips.
* Allow users to:

  * Set export format per group
  * Export selected/all footage
  * Choose between MP4, MXF, or RED-supported formats

#### 🏠 UI & User Settings

* Easy-to-use layout with sidebar navigation
* Settings section for:

  * Default export format
  * Output folder override
  * Theme (optional)

#### 🌐 Support & Help

* Embedded FAQ module
* Link to support documentation
* Version changelog
* Feature roadmap (optional)

#### 🔍 Export Output

* Optional: Display exports on screen if user does not need to save them
* Persistent output management with overwrite warning dialogs

---

### 🔄 Implementation Plan (Outline)

* **Phase 1**: UI design, Electron scaffold setup
* **Phase 2**: Folder ingestion + indexing engine
* **Phase 3**: FFmpeg-based preview and export modules
* **Phase 4**: Settings & customization
* **Phase 5**: FAQ + Support integration
* **Phase 6**: Testing on large datasets (MXF, RED)
* **Phase 7**: Performance tuning + Windows packaging

---

Let me know when you’re ready to start breaking this down into development tasks or sprint planning.





Meldify – Project Overview

Purpose

Meldify is a desktop application for filmmakers to ingest, group, preview, and export large sets of camera footage using a clean, minimalist interface. The application is optimized for Windows and works entirely offline using Electron, FFmpeg, and native Node.js APIs.

Core Use Cases

Ingest entire shoot folders (up to 6TB)

Auto-group by camera source (e.g., RED-A, DJI Drone)

Review footage groups in a gallery

Transcode selected clips to MP4 (10Mbps) or ProRes Proxy MOV

Maintain accurate Windows-safe paths for all operations

Gallery Grouping Logic

Footage is binned not only by camera source (e.g., RED-A, DJI), but also by clip aspect ratio.

Each bin now reflects a single aspect ratio group to ensure visual consistency in the Gallery.

Gallery cards are styled using the actual dimensions of each video clip to preserve frame shape.

All navigation buttons maintain consistent placement and style across the app.

Technologies

Electron – app shell

Node.js – backend logic, FFmpeg integration

HTML/CSS/JS – pure frontend (no frameworks)

FFmpeg – video transcoding

PowerShell + BAT – launching on Windows

Key Principles

Local-first, no backend servers

Robust against messy folder structures

File-safe operations with absolute Windows paths

Minimalist, gradient-based UI with pill buttons

No React/Vue/Angular – vanilla JS only

Directory Structure (High-Level)

Meldify/
├── assets/            # LUTs and other media
├── docs/              # PRD, CHANGELOG, design notes
├── src/               # App source (HTML, JS, CSS)
│   └── scripts/       # App logic modules
├── ffmpeg/            # FFmpeg binaries
├── ingest-meldify.ps1
├── launch-meldify.bat
├── main.js
├── package.json

Scope and Flexibility

Scope is expected to evolve as needs and ideas change. All changes to features, flow, priorities, or tangents will be logged in a companion file:

📘 docs/PRD - CHANGES.md

Tracks new or removed features

Captures changes to implementation order

Documents design deviations or added experiments

Serves as a living changelog + dev journal

Development Workflow (AI-Driven)

Work is performed by an AI agent (Cursor).

Each unit of work is defined as a [task] block with:

File(s) to edit or create

Purpose and API

Dependencies

After each task, testing or inspection is required before moving forward.
