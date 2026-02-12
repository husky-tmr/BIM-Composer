// src/components/sidebarController.js
import { initScenePanel } from "./sidebar/scenePanelController.js";
import { initLayerStack } from "./sidebar/layerStackController.js";
import { initHierarchyPanel } from "./sidebar/hierarchyPanelController.js";
import { initPanelDockers } from "./sidebar/panelDockerController.js"; // <-- Import

export function initSidebar(fileThreeScene, stageThreeScene, updateView) {
  initScenePanel(updateView);
  initLayerStack(updateView, fileThreeScene, stageThreeScene);
  initHierarchyPanel(updateView);

  // Initialize the new docker/pin logic
  initPanelDockers();
}
