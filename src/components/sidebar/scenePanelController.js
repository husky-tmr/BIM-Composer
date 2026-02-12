// src/components/sidebar/scenePanelController.js
// REFACTORED: Uses new core architecture with middleware and error handling
import {
  store,
  actions as coreActions,
  errorHandler,
} from "../../core/index.js";

/**
 * Initialize Scene Panel Controller
 * Handles scene name editing and status color toggle
 *
 * @param {Function} updateView - Function to update the view
 */
export function initScenePanel(updateView) {
  const sampleSceneItem = document.getElementById("sampleSceneItem");
  const toggleStatusColorButton = document.getElementById(
    "toggle-status-color-button"
  );
  const layerStackList = document.getElementById("layerStackList");
  const renameSceneButton = document.getElementById("rename-scene-button");

  // ==================== Rename Scene ====================
  if (renameSceneButton) {
    // Wrap in error handler for automatic error catching
    const handleRename = errorHandler.wrap(() => {
      const currentSceneName = store.getState().sceneName;
      const newName = prompt("Enter new scene name:", currentSceneName);
      if (newName && newName.trim() !== "") {
        // Using new action creator with middleware
        store.dispatch(coreActions.setSceneName(newName.trim()));
        sampleSceneItem.textContent = newName.trim();

        // Update top bar if showing stage
        const state = store.getState();
        const currentFileTab = document.getElementById("currentFileTab");
        if (state.currentView === "stage" && currentFileTab) {
          currentFileTab.textContent = state.sceneName;
        }
        updateView();
      }
    });

    renameSceneButton.addEventListener("click", handleRename);
  }

  // ==================== Scene Selection ====================
  const handleSceneSelect = errorHandler.wrap(() => {
    const selectedLayer = layerStackList.querySelector("li.selected");
    if (selectedLayer) {
      selectedLayer.classList.remove("selected");
    }
    sampleSceneItem.classList.add("selected");

    // Using new core actions
    store.dispatch(coreActions.setCurrentView("stage"));
    store.dispatch(coreActions.setCurrentFile(null));

    document.getElementById("currentFileTab").textContent =
      store.getState().sceneName;
    updateView();
  });

  sampleSceneItem.addEventListener("click", handleSceneSelect);

  // ==================== Toggle Status Color ====================
  const handleToggleStatus = errorHandler.wrap(() => {
    const newState = !store.getState().stage.colorizeByStatus;

    // Using new action with middleware
    store.dispatch(coreActions.toggleStatusColor());

    toggleStatusColorButton.classList.toggle("active", newState);
    if (store.getState().currentView === "stage") {
      updateView();
    }
  });

  toggleStatusColorButton.addEventListener("click", handleToggleStatus);

  // ==================== Initialize UI State ====================
  // Set initial state
  toggleStatusColorButton.classList.toggle(
    "active",
    store.getState().stage.colorizeByStatus
  );

  console.log("✅ Scene Panel initialized with new architecture");
}
