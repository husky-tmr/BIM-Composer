/**
 * Layer Service - Business logic for layer management
 */

import { ValidationError } from "../errors/errors.js";

export class LayerService {
  /**
   * Generate unique layer ID
   *
   * @returns {string} Unique layer identifier in format "layer-{timestamp}-{random}"
   * @example
   * const id = layerService.generateLayerId();
   * // Returns: "layer-1234567890-abc123xyz"
   */
  generateLayerId() {
    return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new layer with the specified file path and status
   *
   * @param {string} filePath - The file path for the layer (e.g., "assets/char.usda")
   * @param {string} [status='WIP'] - The initial status: 'WIP', 'Shared', 'Published', or 'Archived'
   * @returns {Object} Layer object with id, filePath, status, active, visible, and timestamps
   * @throws {ValidationError} If filePath is missing or status is invalid
   * @example
   * const layer = layerService.createLayer('assets/char.usda', 'WIP');
   * // Returns: { id: "layer-...", filePath: "assets/char.usda", status: "WIP", ... }
   */
  createLayer(filePath, status = "WIP") {
    if (!filePath) {
      throw new ValidationError("File path is required", "filePath", filePath);
    }

    const validStatuses = ["WIP", "Shared", "Published", "Archived"];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        "status",
        status
      );
    }

    return {
      id: this.generateLayerId(),
      filePath,
      status,
      active: true,
      visible: true,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
  }

  /**
   * Update layer properties with new values
   *
   * @param {Object} layer - The layer to update
   * @param {Object} updates - Properties to update (e.g., { status: 'Shared', visible: false })
   * @returns {Object} New layer object with merged properties and updated modifiedAt timestamp
   * @throws {ValidationError} If layer is missing
   * @example
   * const updated = layerService.updateLayer(layer, { visible: false });
   */
  updateLayer(layer, updates) {
    if (!layer) {
      throw new ValidationError("Layer is required", "layer", layer);
    }

    return {
      ...layer,
      ...updates,
      modifiedAt: Date.now(),
    };
  }

  /**
   * Validate layer stack for correctness and consistency
   * Checks that the stack is an array and contains no duplicate file paths
   *
   * @param {Array<Object>} layerStack - Array of layer objects to validate
   * @returns {boolean} True if validation passes
   * @throws {ValidationError} If layerStack is not an array or contains duplicates
   * @example
   * layerService.validateLayerStack([layer1, layer2]); // Returns: true
   */
  validateLayerStack(layerStack) {
    if (!Array.isArray(layerStack)) {
      throw new ValidationError(
        "Layer stack must be an array",
        "layerStack",
        layerStack
      );
    }

    // Check for duplicate file paths
    const filePaths = layerStack.map((layer) => layer.filePath);
    const duplicates = filePaths.filter(
      (path, index) => filePaths.indexOf(path) !== index
    );

    if (duplicates.length > 0) {
      throw new ValidationError(
        `Duplicate layers found: ${duplicates.join(", ")}`,
        "layerStack",
        duplicates
      );
    }

    return true;
  }

  /**
   * Filter layers by status
   *
   * @param {Array<Object>} layerStack - The layer stack to filter
   * @param {string} status - Status to filter by ('All', 'WIP', 'Shared', 'Published', 'Archived')
   * @returns {Array<Object>} Filtered layer stack
   * @example
   * const wipLayers = layerService.filterLayersByStatus(layerStack, 'WIP');
   */
  filterLayersByStatus(layerStack, status) {
    if (status === "All") {
      return layerStack;
    }

    return layerStack.filter((layer) => layer.status === status);
  }

  /**
   * Get visible layers
   */
  getVisibleLayers(layerStack) {
    return layerStack.filter((layer) => layer.visible);
  }

  /**
   * Get active layer
   */
  getActiveLayer(layerStack) {
    return layerStack.find((layer) => layer.active);
  }

  /**
   * Promote layer to next status in the workflow
   * Status flow: WIP → Shared → Published → Archived
   *
   * @param {Object} layer - The layer to promote
   * @returns {Object} Updated layer with new status
   * @example
   * const wipLayer = { id: '123', status: 'WIP', filePath: 'scene.usda' };
   * const promoted = layerService.promoteLayer(wipLayer);
   * // Returns: { ...wipLayer, status: 'Shared', modifiedAt: ... }
   */
  promoteLayer(layer) {
    const statusFlow = {
      WIP: "Shared",
      Shared: "Published",
      Published: "Archived",
      Archived: "Archived", // Can't promote further
    };

    const nextStatus = statusFlow[layer.status];

    return this.updateLayer(layer, {
      status: nextStatus,
    });
  }

  /**
   * Demote layer to previous status in the workflow
   * Status flow: Archived → Published → Shared → WIP
   *
   * @param {Object} layer - The layer to demote
   * @returns {Object} Updated layer with previous status
   * @example
   * const sharedLayer = { id: '123', status: 'Shared', filePath: 'scene.usda' };
   * const demoted = layerService.demoteLayer(sharedLayer);
   * // Returns: { ...sharedLayer, status: 'WIP', modifiedAt: ... }
   */
  demoteLayer(layer) {
    const statusFlow = {
      Archived: "Published",
      Published: "Shared",
      Shared: "WIP",
      WIP: "WIP", // Can't demote further
    };

    const prevStatus = statusFlow[layer.status];

    return this.updateLayer(layer, {
      status: prevStatus,
    });
  }

  /**
   * Reorder layers by moving a layer from one index to another
   *
   * @param {Array<Object>} layerStack - The current layer stack
   * @param {number} fromIndex - The index to move from (0-based)
   * @param {number} toIndex - The index to move to (0-based)
   * @returns {Array<Object>} New layer stack with reordered layers
   * @throws {ValidationError} If fromIndex or toIndex is out of bounds
   * @example
   * const reordered = layerService.reorderLayers(layerStack, 0, 2);
   * // Moves layer at index 0 to index 2
   */
  reorderLayers(layerStack, fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= layerStack.length) {
      throw new ValidationError("Invalid from index", "fromIndex", fromIndex);
    }

    if (toIndex < 0 || toIndex >= layerStack.length) {
      throw new ValidationError("Invalid to index", "toIndex", toIndex);
    }

    const newStack = [...layerStack];
    const [movedLayer] = newStack.splice(fromIndex, 1);
    newStack.splice(toIndex, 0, movedLayer);

    return newStack;
  }

  /**
   * Get layer by ID
   */
  getLayerById(layerStack, layerId) {
    return layerStack.find((layer) => layer.id === layerId);
  }

  /**
   * Get layer by file path
   */
  getLayerByPath(layerStack, filePath) {
    return layerStack.find((layer) => layer.filePath === filePath);
  }

  /**
   * Remove layer from the layer stack by ID
   *
   * @param {Array<Object>} layerStack - The current layer stack
   * @param {string} layerId - The ID of the layer to remove
   * @returns {Array<Object>} New layer stack without the removed layer
   * @example
   * const newStack = layerService.removeLayer(layerStack, 'layer-123');
   */
  removeLayer(layerStack, layerId) {
    return layerStack.filter((layer) => layer.id !== layerId);
  }

  /**
   * Toggle layer visibility
   */
  toggleLayerVisibility(layerStack, layerId) {
    return layerStack.map((layer) =>
      layer.id === layerId
        ? this.updateLayer(layer, { visible: !layer.visible })
        : layer
    );
  }

  /**
   * Set active layer
   */
  setActiveLayer(layerStack, layerId) {
    return layerStack.map((layer) =>
      this.updateLayer(layer, { active: layer.id === layerId })
    );
  }

  /**
   * Get eligible layers for promotion
   */
  getPromotableLayersFor(layerStack, targetStatus) {
    const statusHierarchy = {
      Shared: ["WIP"],
      Published: ["Shared"],
      Archived: ["Published"],
    };

    const eligibleStatuses = statusHierarchy[targetStatus] || [];

    return layerStack.filter((layer) =>
      eligibleStatuses.includes(layer.status)
    );
  }
}

// Export singleton instance
export const layerService = new LayerService();
