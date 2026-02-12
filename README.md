# USDA Composer

USDA Composer is a web-based, client-side tool for viewing, editing, and composing Universal Scene Description (`.usda`) files. It provides an interactive 3D viewport powered by **three.js** alongside a code editor, allowing for both visual inspection and direct manipulation of scene layers through a sophisticated, non-destructive workflow.

---

## Features

This application implements an advanced, layer-based workflow inspired by professional VFX pipelines and the ISO 19650 standard.

- **Layer-Based Composition**:
  - Load multiple `.usda` files, which are treated as layers in the scene stage.
  - **Layer Stack**: Manage layers in an ordered stack. The stage is composed by applying layers from the bottom up.
  - **Visibility Toggles**: Individually show or hide layers in the 3D stage view to inspect different phases of the project.

- **Non-Destructive "Git-like" Workflow**:
  - **`def` vs. `over`**: The application understands the difference between prim definitions (`def`) and overrides (`over`), forming the basis of the non-destructive workflow.
  - **Staging Area**: Edits like renaming or adding custom data are not applied directly. Instead, they are added to a staging area.
  - **Committing**: Group staged changes into a single "commit" with a descriptive message. Commits are saved as `over`s to a designated 'WIP' layer, leaving base layers untouched.

- **ISO 19650 Inspired Workflow**:
  - **Layer Status**: Layers are assigned a status (**WIP**, **Shared**, **Published**) to manage their maturity.
  - **Promotion Workflow**: A formal process to promote layers from WIP to Shared, or Shared to Published. This action merges the changes into a new, flattened layer.

- **Complete Project History & Timeline**:
  - **Statement Layer**: Every commit and promotion is recorded as a permanent, immutable entry in a dedicated `statement.usda` layer, creating a complete audit trail.
  - **Visual Timeline Slider**: An interactive slider allows you to scrub through the entire project history, viewing the state of the 3D scene after any commit.

- **Advanced Prim Manipulation**:
  - **Data Enrichment**: Select any prim and add custom attributes via the **Properties Panel**.
  - **Display Names**: "Rename" prims non-destructively by giving them a `displayName`, which is used in the UI while preserving the original prim path to maintain relationships.
  - **Entity Staging**: Stage prims as lightweight "Entity" placeholders (transparent green volumes) to represent geometry without loading full assets.

- **Visual Status Feedback**:
  - **Status Color Coding**: The Stage View provides instant visual feedback on project maturity by color-coding elements based on their status: **WIP** (Orange), **Shared** (Blue), and **Published** (Green).

- **Dual 3D Viewers & Code Editor**:
  - **File View**: Inspect and interact with a single `.usda` layer at a time.
  - **Stage View**: See a composite view of all visible layers rendered together.
  - **Live Code Editor**: Switch to a text editor to view the raw `.usda` code for any single layer or for the fully composed stage.

---

## How to Run

This project is a client-side application and does not require a build step. It can be run from any local web server.

### Option 1: Using Python's Built-in Server

1.  **Open your terminal** (or Command Prompt on Windows).
2.  **Navigate to the project's root folder**, where your `index.html` file is located.
3.  **Run the following command**:
    ```bash
    python -m http.server
    ```
4.  **Open your web browser** and go to the address `http://localhost:8000`.

### Option 2: Using the VS Code Live Server Extension

1.  **Install the "Live Server" extension** from the VS Code marketplace.
2.  **Open your project folder** in VS Code.
3.  **Right-click on the `index.html` file** in the file explorer.
4.  **Select "Open with Live Server"** from the context menu.

---

## File Structure

The project is organized into `src` and `css` directories containing all modules and a root directory for the main HTML file.

```
.
├── index.html                # Main application page, defines the UI layout
├── css/
│   ├── base.css              # Global styles
│   ├── layout.css            # Main page layout
│   ├── sidebar.css           # Sidebar styles
│   ├── panel.css             # Generic panel styles
│   ├── controls.css          # Form controls
│   ├── modal.css             # Modal styles
│   ├── outliner.css          # Outliner specific styles
│   ├── properties.css        # Properties panel styles
│   ├── filters.css           # Filter controls
│   ├── lists.css             # List styling
│   ├── view-controls.css     # 3D/Code view switcher
│   ├── panel-controls.css    # Header controls for panels
│   ├── button-group.css      # Action button groups
│   ├── action-buttons.css    # Specific action buttons
│   ├── timeline.css          # Timeline specific styles
│   └── data-inspector.css    # Data inspector styles
└── src/
    ├── main.js                 # Application entry point
    ├── state.js                # Centralized application state
    ├── components/
    │   ├── commitController.js     # Manages the commit workflow
    │   ├── dataInspector.js        # Data inspection logic
    │   ├── modalController.js      # Main modal interactions
    │   ├── outlinerController.js   # Manages the outliner tree
    │   ├── propertiesController.js # Properties panel logic
    │   ├── referenceModalController.js # Reference management
    │   ├── sidebarController.js    # Main sidebar orchestration
    │   ├── timelineController.js   # Timeline logic
    │   ├── viewControls.js         # Viewport switching logic
    │   ├── sidebar/
    │   │   ├── hierarchyPanelController.js
    │   │   ├── layerStackController.js
    │   │   ├── panelDockerController.js
    │   │   └── scenePanelController.js
    │   └── staging/
    │       ├── modalController.js    # Staging-specific modal logic
    │       └── primStaging.js        # Prim staging operations
    └── viewer/
        ├── ThreeScene.js           # Core Three.js scene wrapper
        ├── sceneSetup.js           # Scene initialization (lights, camera)
        ├── selectionController.js  # Raycasting and selection
        ├── spatialHash.js          # Spatial indexing for performance
        ├── rendering/
        │   ├── fileViewRenderer.js
        │   └── stageViewRenderer.js
        └── usda/
            ├── usdaComposer.js     # Writes USDA content
            ├── usdaMerger.js       # Merges USDA layers
            ├── usdaParser.js       # Main USDA parser entry
            └── parser/
                ├── geometryParser.js
                ├── hierarchyParser.js
                └── logParser.js
```
