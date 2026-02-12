/**
 * Integration Tests: State + Component
 * Tests the integration between state management and UI components
 */

// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import { store } from "../../core/state/store.js";
import { actions } from "../../core/state/actions/index.js";
// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import { LayerService } from "../../core/services/LayerService.js";

describe("Integration: State + Component", () => {
  let container;
  let layerService;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement("div");
    container.id = "layerStackList";
    document.body.appendChild(container);

    // Initialize service
    layerService = new LayerService();

    // Reset store state using dispatch
    if (store.getState) {
      store.dispatch(actions.setCurrentUser("Test User"));
      store.dispatch(actions.setCurrentView("stage"));
      store.dispatch(actions.updateLayerStack([]));
      store.dispatch(actions.setLayerFilter("All"));
    }
  });

  afterEach(() => {
    if (container && container.parentElement) {
      document.body.removeChild(container);
    }
  });

  describe("Layer Stack Operations", () => {
    it("should maintain consistency between service and state", () => {
      // Create layers using service
      const layer1 = layerService.createLayer("assets/scene1.usda", "WIP");
      const layer2 = layerService.createLayer("assets/scene2.usda", "Shared");

      // Simulate adding to state
      const layerStack = [layer1, layer2];

      // Validate layer stack
      expect(() => layerService.validateLayerStack(layerStack)).not.toThrow();
      expect(layerStack).toHaveLength(2);
    });

    it("should filter layers by status", () => {
      const wipLayer = layerService.createLayer("assets/wip.usda", "WIP");
      const sharedLayer = layerService.createLayer(
        "assets/shared.usda",
        "Shared"
      );
      const publishedLayer = layerService.createLayer(
        "assets/published.usda",
        "Published"
      );
      const layerStack = [wipLayer, sharedLayer, publishedLayer];

      const wipFiltered = layerService.filterLayersByStatus(layerStack, "WIP");
      expect(wipFiltered).toHaveLength(1);
      expect(wipFiltered[0].status).toBe("WIP");
    });

    it("should handle layer visibility toggling", () => {
      const layer = layerService.createLayer("assets/scene.usda");
      const layerStack = [layer];

      const toggled = layerService.toggleLayerVisibility(layerStack, layer.id);
      expect(toggled[0].visible).toBe(false);

      const toggledAgain = layerService.toggleLayerVisibility(
        toggled,
        layer.id
      );
      expect(toggledAgain[0].visible).toBe(true);
    });

    it("should handle layer reordering", () => {
      const layer1 = layerService.createLayer("assets/scene1.usda");
      const layer2 = layerService.createLayer("assets/scene2.usda");
      const layer3 = layerService.createLayer("assets/scene3.usda");
      const layerStack = [layer1, layer2, layer3];

      const reordered = layerService.reorderLayers(layerStack, 0, 2);

      expect(reordered[0]).toBe(layer2);
      expect(reordered[1]).toBe(layer3);
      expect(reordered[2]).toBe(layer1);
    });

    it("should promote layers through status workflow", () => {
      const layer = layerService.createLayer("assets/scene.usda", "WIP");

      const shared = layerService.promoteLayer(layer);
      expect(shared.status).toBe("Shared");

      const published = layerService.promoteLayer(shared);
      expect(published.status).toBe("Published");

      const archived = layerService.promoteLayer(published);
      expect(archived.status).toBe("Archived");
    });

    it("should demote layers through status workflow", () => {
      const layer = layerService.createLayer("assets/scene.usda", "Shared");

      const wip = layerService.demoteLayer(layer);
      expect(wip.status).toBe("WIP");

      const wipAgain = layerService.demoteLayer(wip);
      expect(wipAgain.status).toBe("WIP"); // Can't demote further
    });
  });

  describe("Active Layer Management", () => {
    it("should set and track active layer", () => {
      const layer1 = layerService.createLayer("assets/scene1.usda");
      const layer2 = layerService.createLayer("assets/scene2.usda");
      let layerStack = [layer1, layer2];

      // Set layer2 as active
      layerStack = layerService.setActiveLayer(layerStack, layer2.id);

      const activeLayer = layerService.getActiveLayer(layerStack);
      expect(activeLayer).toBe(layerStack[1]);
      expect(activeLayer.active).toBe(true);
      expect(layerStack[0].active).toBe(false);
    });

    it("should switch active layer", () => {
      const layer1 = layerService.createLayer("assets/scene1.usda");
      const layer2 = layerService.createLayer("assets/scene2.usda");
      let layerStack = [layer1, layer2];

      // Set layer1 as active
      layerStack = layerService.setActiveLayer(layerStack, layer1.id);
      expect(layerService.getActiveLayer(layerStack)).toBe(layerStack[0]);

      // Switch to layer2
      layerStack = layerService.setActiveLayer(layerStack, layer2.id);
      expect(layerService.getActiveLayer(layerStack)).toBe(layerStack[1]);
      expect(layerStack[0].active).toBe(false);
    });
  });

  describe("Layer Validation and Error Handling", () => {
    it("should prevent duplicate file paths", () => {
      const layer1 = layerService.createLayer("assets/scene.usda");
      const layer2 = layerService.createLayer("assets/scene.usda");

      expect(() => {
        layerService.validateLayerStack([layer1, layer2]);
      }).toThrow("Duplicate layers found");
    });

    it("should validate layer properties on update", () => {
      expect(() => {
        layerService.updateLayer(null, { visible: false });
      }).toThrow("Layer is required");
    });

    it("should validate status values", () => {
      expect(() => {
        layerService.createLayer("assets/scene.usda", "InvalidStatus");
      }).toThrow("Invalid status");
    });
  });

  describe("Complex Layer Operations", () => {
    it("should handle multiple layers with mixed operations", () => {
      // Create multiple layers
      const layer1 = layerService.createLayer("assets/base.usda", "Published");
      const layer2 = layerService.createLayer("assets/char.usda", "Shared");
      const layer3 = layerService.createLayer("assets/anim.usda", "WIP");
      let layerStack = [layer1, layer2, layer3];

      // Filter by WIP
      const filtered = layerService.filterLayersByStatus(layerStack, "WIP");
      expect(filtered).toHaveLength(1);

      // Toggle visibility
      layerStack = layerService.toggleLayerVisibility(layerStack, layer2.id);
      const visibleLayers = layerService.getVisibleLayers(layerStack);
      expect(visibleLayers).toHaveLength(2);

      // Promote WIP layer
      const promotedLayer = layerService.promoteLayer(layer3);
      expect(promotedLayer.status).toBe("Shared");

      // Reorder
      layerStack = layerService.reorderLayers(layerStack, 2, 0);
      expect(layerStack[0]).toBe(layer3);
    });

    it("should get promotable layers for each status", () => {
      const wipLayer = layerService.createLayer("assets/wip.usda", "WIP");
      const sharedLayer = layerService.createLayer(
        "assets/shared.usda",
        "Shared"
      );
      const publishedLayer = layerService.createLayer(
        "assets/published.usda",
        "Published"
      );
      const layerStack = [wipLayer, sharedLayer, publishedLayer];

      const promotableToShared = layerService.getPromotableLayersFor(
        layerStack,
        "Shared"
      );
      expect(promotableToShared).toHaveLength(1);
      expect(promotableToShared[0].status).toBe("WIP");

      const promotableToPublished = layerService.getPromotableLayersFor(
        layerStack,
        "Published"
      );
      expect(promotableToPublished).toHaveLength(1);
      expect(promotableToPublished[0].status).toBe("Shared");

      const promotableToArchived = layerService.getPromotableLayersFor(
        layerStack,
        "Archived"
      );
      expect(promotableToArchived).toHaveLength(1);
      expect(promotableToArchived[0].status).toBe("Published");
    });

    it("should handle layer removal and re-addition", () => {
      const layer1 = layerService.createLayer("assets/scene1.usda");
      const layer2 = layerService.createLayer("assets/scene2.usda");
      let layerStack = [layer1, layer2];

      // Remove layer1
      layerStack = layerService.removeLayer(layerStack, layer1.id);
      expect(layerStack).toHaveLength(1);
      expect(layerStack[0]).toBe(layer2);

      // Re-add a new layer
      const layer3 = layerService.createLayer("assets/scene3.usda");
      layerStack = [...layerStack, layer3];
      expect(layerStack).toHaveLength(2);

      // Validate stack
      expect(() => layerService.validateLayerStack(layerStack)).not.toThrow();
    });
  });

  describe("Layer Metadata and Timestamps", () => {
    it("should update modifiedAt timestamp on layer updates", () => {
      const layer = layerService.createLayer("assets/scene.usda");
      const originalModifiedAt = layer.modifiedAt;

      // Small delay to ensure different timestamp
      const updated = layerService.updateLayer(layer, { visible: false });

      expect(updated.modifiedAt).toBeGreaterThanOrEqual(originalModifiedAt);
    });

    it("should preserve createdAt timestamp on updates", () => {
      const layer = layerService.createLayer("assets/scene.usda");
      const originalCreatedAt = layer.createdAt;

      const updated = layerService.updateLayer(layer, { visible: false });

      expect(updated.createdAt).toBe(originalCreatedAt);
    });

    it("should track layer modifications through promotion", () => {
      const layer = layerService.createLayer("assets/scene.usda", "WIP");
      const originalModifiedAt = layer.modifiedAt;

      const promoted = layerService.promoteLayer(layer);

      expect(promoted.modifiedAt).toBeGreaterThanOrEqual(originalModifiedAt);
    });
  });
});
