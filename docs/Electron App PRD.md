**Product Requirements Document (PRD)**

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
* Recursively scan dropped folders for **.R3D**, **.MOV**, and **.MXF** files to collect absolute paths.

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
