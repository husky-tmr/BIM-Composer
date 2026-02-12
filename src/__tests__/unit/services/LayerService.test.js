/**
 * LayerService Unit Tests
 * Tests for core layer management business logic
 */

// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import { LayerService } from "../../../core/services/LayerService.js";
// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import { ValidationError } from "../../../core/errors/errors.js";

describe("LayerService", () => {
  let service;

  beforeEach(() => {
    service = new LayerService();
  });

  describe("generateLayerId", () => {
    it("should generate unique layer IDs", () => {
      const id1 = service.generateLayerId();
      const id2 = service.generateLayerId();

      expect(id1).toMatch(/^layer-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^layer-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe("createLayer", () => {
    it("should create a layer with valid parameters", () => {
      const layer = service.createLayer("assets/scene.usda", "WIP");

      expect(layer).toHaveProperty("id");
      expect(layer.filePath).toBe("assets/scene.usda");
      expect(layer.status).toBe("WIP");
      expect(layer.active).toBe(true);
      expect(layer.visible).toBe(true);
      expect(layer).toHaveProperty("createdAt");
      expect(layer).toHaveProperty("modifiedAt");
    });

    it("should use WIP as default status", () => {
      const layer = service.createLayer("assets/scene.usda");

      expect(layer.status).toBe("WIP");
    });

    it("should accept all valid statuses", () => {
      const statuses = ["WIP", "Shared", "Published", "Archived"];

      statuses.forEach((status) => {
        const layer = service.createLayer("assets/scene.usda", status);
        expect(layer.status).toBe(status);
      });
    });

    it("should throw ValidationError for missing filePath", () => {
      expect(() => service.createLayer("")).toThrow(ValidationError);
      expect(() => service.createLayer("")).toThrow("File path is required");
    });

    it("should throw ValidationError for invalid status", () => {
      expect(() => service.createLayer("assets/scene.usda", "INVALID")).toThrow(
        ValidationError
      );
      expect(() => service.createLayer("assets/scene.usda", "INVALID")).toThrow(
        "Invalid status"
      );
    });
  });

  describe("updateLayer", () => {
    it("should update layer properties", () => {
      const layer = service.createLayer("assets/scene.usda");
      const updated = service.updateLayer(layer, {
        visible: false,
        status: "Shared",
      });

      expect(updated.visible).toBe(false);
      expect(updated.status).toBe("Shared");
      expect(updated.modifiedAt).toBeGreaterThanOrEqual(layer.modifiedAt);
    });

    it("should preserve other properties when updating", () => {
      const layer = service.createLayer("assets/scene.usda");
      const updated = service.updateLayer(layer, { visible: false });

      expect(updated.id).toBe(layer.id);
      expect(updated.filePath).toBe(layer.filePath);
      expect(updated.status).toBe(layer.status);
    });

    it("should throw ValidationError for missing layer", () => {
      expect(() => service.updateLayer(null, { visible: false })).toThrow(
        ValidationError
      );
    });
  });

  describe("validateLayerStack", () => {
    it("should validate a valid layer stack", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layer2 = service.createLayer("assets/scene2.usda");

      expect(service.validateLayerStack([layer1, layer2])).toBe(true);
    });

    it("should throw ValidationError for non-array input", () => {
      expect(() => service.validateLayerStack("not an array")).toThrow(
        ValidationError
      );
      expect(() => service.validateLayerStack("not an array")).toThrow(
        "Layer stack must be an array"
      );
    });

    it("should throw ValidationError for duplicate file paths", () => {
      const layer1 = service.createLayer("assets/scene.usda");
      const layer2 = service.createLayer("assets/scene.usda");

      expect(() => service.validateLayerStack([layer1, layer2])).toThrow(
        ValidationError
      );
      expect(() => service.validateLayerStack([layer1, layer2])).toThrow(
        "Duplicate layers found"
      );
    });

    it("should validate empty layer stack", () => {
      expect(service.validateLayerStack([])).toBe(true);
    });
  });

  describe("filterLayersByStatus", () => {
    it("should filter layers by status", () => {
      const wipLayer = service.createLayer("assets/wip.usda", "WIP");
      const sharedLayer = service.createLayer("assets/shared.usda", "Shared");
      const publishedLayer = service.createLayer(
        "assets/published.usda",
        "Published"
      );
      const layerStack = [wipLayer, sharedLayer, publishedLayer];

      const wipFiltered = service.filterLayersByStatus(layerStack, "WIP");
      expect(wipFiltered).toHaveLength(1);
      expect(wipFiltered[0].status).toBe("WIP");

      const sharedFiltered = service.filterLayersByStatus(layerStack, "Shared");
      expect(sharedFiltered).toHaveLength(1);
      expect(sharedFiltered[0].status).toBe("Shared");
    });

    it('should return all layers when status is "All"', () => {
      const layer1 = service.createLayer("assets/scene1.usda", "WIP");
      const layer2 = service.createLayer("assets/scene2.usda", "Shared");
      const layerStack = [layer1, layer2];

      const filtered = service.filterLayersByStatus(layerStack, "All");
      expect(filtered).toHaveLength(2);
    });

    it("should return empty array when no layers match", () => {
      const wipLayer = service.createLayer("assets/wip.usda", "WIP");
      const layerStack = [wipLayer];

      const filtered = service.filterLayersByStatus(layerStack, "Published");
      expect(filtered).toHaveLength(0);
    });
  });

  describe("getVisibleLayers", () => {
    it("should return only visible layers", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layer2 = service.createLayer("assets/scene2.usda");
      const layer3 = service.updateLayer(
        service.createLayer("assets/scene3.usda"),
        { visible: false }
      );

      const visible = service.getVisibleLayers([layer1, layer2, layer3]);
      expect(visible).toHaveLength(2);
      expect(visible.every((l) => l.visible)).toBe(true);
    });
  });

  describe("getActiveLayer", () => {
    it("should return the active layer", () => {
      const layer1 = service.updateLayer(
        service.createLayer("assets/scene1.usda"),
        { active: false }
      );
      const layer2 = service.createLayer("assets/scene2.usda");
      const layer3 = service.updateLayer(
        service.createLayer("assets/scene3.usda"),
        { active: false }
      );

      const active = service.getActiveLayer([layer1, layer2, layer3]);
      expect(active).toBe(layer2);
    });

    it("should return undefined when no layer is active", () => {
      const layer1 = service.updateLayer(
        service.createLayer("assets/scene1.usda"),
        { active: false }
      );

      const active = service.getActiveLayer([layer1]);
      expect(active).toBeUndefined();
    });
  });

  describe("promoteLayer", () => {
    it("should promote WIP layer to Shared", () => {
      const layer = service.createLayer("assets/scene.usda", "WIP");
      const promoted = service.promoteLayer(layer);

      expect(promoted.status).toBe("Shared");
      expect(promoted.modifiedAt).toBeGreaterThanOrEqual(layer.modifiedAt);
    });

    it("should promote Shared layer to Published", () => {
      const layer = service.createLayer("assets/scene.usda", "Shared");
      const promoted = service.promoteLayer(layer);

      expect(promoted.status).toBe("Published");
    });

    it("should promote Published layer to Archived", () => {
      const layer = service.createLayer("assets/scene.usda", "Published");
      const promoted = service.promoteLayer(layer);

      expect(promoted.status).toBe("Archived");
    });

    it("should not promote Archived layer further", () => {
      const layer = service.createLayer("assets/scene.usda", "Archived");
      const promoted = service.promoteLayer(layer);

      expect(promoted.status).toBe("Archived");
    });
  });

  describe("demoteLayer", () => {
    it("should demote Shared layer to WIP", () => {
      const layer = service.createLayer("assets/scene.usda", "Shared");
      const demoted = service.demoteLayer(layer);

      expect(demoted.status).toBe("WIP");
    });

    it("should demote Published layer to Shared", () => {
      const layer = service.createLayer("assets/scene.usda", "Published");
      const demoted = service.demoteLayer(layer);

      expect(demoted.status).toBe("Shared");
    });

    it("should demote Archived layer to Published", () => {
      const layer = service.createLayer("assets/scene.usda", "Archived");
      const demoted = service.demoteLayer(layer);

      expect(demoted.status).toBe("Published");
    });

    it("should not demote WIP layer further", () => {
      const layer = service.createLayer("assets/scene.usda", "WIP");
      const demoted = service.demoteLayer(layer);

      expect(demoted.status).toBe("WIP");
    });
  });

  describe("reorderLayers", () => {
    it("should reorder layers in the stack", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layer2 = service.createLayer("assets/scene2.usda");
      const layer3 = service.createLayer("assets/scene3.usda");
      const layerStack = [layer1, layer2, layer3];

      const reordered = service.reorderLayers(layerStack, 0, 2);

      expect(reordered[0]).toBe(layer2);
      expect(reordered[1]).toBe(layer3);
      expect(reordered[2]).toBe(layer1);
    });

    it("should throw ValidationError for invalid fromIndex", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layerStack = [layer1];

      expect(() => service.reorderLayers(layerStack, -1, 0)).toThrow(
        ValidationError
      );
      expect(() => service.reorderLayers(layerStack, 5, 0)).toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError for invalid toIndex", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layerStack = [layer1];

      expect(() => service.reorderLayers(layerStack, 0, -1)).toThrow(
        ValidationError
      );
      expect(() => service.reorderLayers(layerStack, 0, 5)).toThrow(
        ValidationError
      );
    });

    it("should handle reordering to same position", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layer2 = service.createLayer("assets/scene2.usda");
      const layerStack = [layer1, layer2];

      const reordered = service.reorderLayers(layerStack, 0, 0);

      expect(reordered[0]).toBe(layer1);
      expect(reordered[1]).toBe(layer2);
    });
  });

  describe("getLayerById", () => {
    it("should find layer by ID", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layer2 = service.createLayer("assets/scene2.usda");
      const layerStack = [layer1, layer2];

      const found = service.getLayerById(layerStack, layer2.id);
      expect(found).toBe(layer2);
    });

    it("should return undefined when layer not found", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layerStack = [layer1];

      const found = service.getLayerById(layerStack, "non-existent-id");
      expect(found).toBeUndefined();
    });
  });

  describe("getLayerByPath", () => {
    it("should find layer by file path", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layer2 = service.createLayer("assets/scene2.usda");
      const layerStack = [layer1, layer2];

      const found = service.getLayerByPath(layerStack, "assets/scene2.usda");
      expect(found).toBe(layer2);
    });

    it("should return undefined when layer not found", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layerStack = [layer1];

      const found = service.getLayerByPath(layerStack, "non-existent.usda");
      expect(found).toBeUndefined();
    });
  });

  describe("removeLayer", () => {
    it("should remove layer by ID", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layer2 = service.createLayer("assets/scene2.usda");
      const layerStack = [layer1, layer2];

      const newStack = service.removeLayer(layerStack, layer1.id);

      expect(newStack).toHaveLength(1);
      expect(newStack[0]).toBe(layer2);
    });

    it("should not modify original stack", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layerStack = [layer1];

      service.removeLayer(layerStack, layer1.id);

      expect(layerStack).toHaveLength(1);
    });

    it("should return same stack when layer not found", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layerStack = [layer1];

      const newStack = service.removeLayer(layerStack, "non-existent-id");

      expect(newStack).toHaveLength(1);
    });
  });

  describe("toggleLayerVisibility", () => {
    it("should toggle layer visibility", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layerStack = [layer1];

      const toggled = service.toggleLayerVisibility(layerStack, layer1.id);

      expect(toggled[0].visible).toBe(false);
    });

    it("should only toggle specified layer", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layer2 = service.createLayer("assets/scene2.usda");
      const layerStack = [layer1, layer2];

      const toggled = service.toggleLayerVisibility(layerStack, layer1.id);

      expect(toggled[0].visible).toBe(false);
      expect(toggled[1].visible).toBe(true);
    });
  });

  describe("setActiveLayer", () => {
    it("should set specified layer as active", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layer2 = service.createLayer("assets/scene2.usda");
      const layerStack = [layer1, layer2];

      const updated = service.setActiveLayer(layerStack, layer2.id);

      expect(updated[0].active).toBe(false);
      expect(updated[1].active).toBe(true);
    });

    it("should deactivate all other layers", () => {
      const layer1 = service.createLayer("assets/scene1.usda");
      const layer2 = service.createLayer("assets/scene2.usda");
      const layer3 = service.createLayer("assets/scene3.usda");
      const layerStack = [layer1, layer2, layer3];

      const updated = service.setActiveLayer(layerStack, layer2.id);

      expect(updated[0].active).toBe(false);
      expect(updated[1].active).toBe(true);
      expect(updated[2].active).toBe(false);
    });
  });

  describe("getPromotableLayersFor", () => {
    it("should return WIP layers promotable to Shared", () => {
      const wipLayer = service.createLayer("assets/wip.usda", "WIP");
      const sharedLayer = service.createLayer("assets/shared.usda", "Shared");
      const layerStack = [wipLayer, sharedLayer];

      const promotable = service.getPromotableLayersFor(layerStack, "Shared");

      expect(promotable).toHaveLength(1);
      expect(promotable[0].status).toBe("WIP");
    });

    it("should return Shared layers promotable to Published", () => {
      const wipLayer = service.createLayer("assets/wip.usda", "WIP");
      const sharedLayer = service.createLayer("assets/shared.usda", "Shared");
      const layerStack = [wipLayer, sharedLayer];

      const promotable = service.getPromotableLayersFor(
        layerStack,
        "Published"
      );

      expect(promotable).toHaveLength(1);
      expect(promotable[0].status).toBe("Shared");
    });

    it("should return Published layers promotable to Archived", () => {
      const publishedLayer = service.createLayer(
        "assets/published.usda",
        "Published"
      );
      const sharedLayer = service.createLayer("assets/shared.usda", "Shared");
      const layerStack = [publishedLayer, sharedLayer];

      const promotable = service.getPromotableLayersFor(layerStack, "Archived");

      expect(promotable).toHaveLength(1);
      expect(promotable[0].status).toBe("Published");
    });

    it("should return empty array for invalid target status", () => {
      const wipLayer = service.createLayer("assets/wip.usda", "WIP");
      const layerStack = [wipLayer];

      const promotable = service.getPromotableLayersFor(layerStack, "WIP");

      expect(promotable).toHaveLength(0);
    });
  });
});
