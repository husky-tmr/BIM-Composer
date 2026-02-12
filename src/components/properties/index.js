// src/components/properties/index.js
// REFACTORED: Enhanced with error handling and core architecture
// Main orchestrator for the properties panel

import { store, errorHandler, ValidationError } from "../../core/index.js";
import { findPrimByPath } from "../../utils/primHelpers.js";
import {
  renderPropertiesPanel,
  renderPlaceholder,
} from "./PropertyRenderer.js";
import { applyPrimRename } from "./PrimRenamer.js";
import { applyAttributeChange } from "./AttributeUpdater.js";
import { attachPropertyEventListeners } from "./PropertyEditor.js";

/**
 * Initializes the properties controller
 * @param {Function} updateView - Callback to update the view
 */
export function initPropertiesController(updateView) {
  const propertiesContent = document.getElementById("properties-content");
  const commitButton = document.getElementById("commitButton");

  if (!propertiesContent) {
    throw new ValidationError(
      "properties-content element not found",
      "propertiesContent",
      null
    );
  }

  // Listen for prim selection events
  const handlePrimSelected = errorHandler.wrap((e) => {
    const { primPath } = e.detail;

    // No prim selected
    if (!primPath) {
      renderPlaceholder(propertiesContent);
      return;
    }

    // Find the prim in the composed hierarchy
    const primData = findPrimByPath(
      store.getState().composedHierarchy,
      primPath
    );

    if (primData) {
      // Render the properties panel
      renderPropertiesPanel(propertiesContent, primData);

      // Attach event listeners
      attachPropertyEventListeners(
        propertiesContent,
        primData,
        { applyPrimRename, applyAttributeChange },
        updateView,
        commitButton
      );

      console.log(`✅ Rendered properties for prim: ${primPath}`);
    } else {
      renderPlaceholder(propertiesContent, `No data found for ${primPath}`);
    }
  });

  document.addEventListener("primSelected", handlePrimSelected);

  console.log("✅ Properties Controller initialized with error handling");
}
