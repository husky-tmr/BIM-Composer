/**
 * Integration Tests: Prim Operations
 * Tests the integration of prim service operations with hierarchy management
 */

// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import { PrimService } from "../../core/services/PrimService.js";

describe("Integration: Prim Operations", () => {
  let primService;

  beforeEach(() => {
    primService = new PrimService();
  });

  describe("Hierarchy Building and Navigation", () => {
    it("should build and navigate complex prim hierarchy", () => {
      // Build a hierarchy
      const world = primService.createPrim("/World", "Xform");
      const character = primService.createPrim("/World/Character", "Xform");
      const mesh = primService.createPrim("/World/Character/Mesh", "Mesh", {
        vertices: 100,
      });
      const light = primService.createPrim("/World/Light", "Light", {
        intensity: 1.0,
      });

      // Build tree structure
      world.children = [character, light];
      character.children = [mesh];

      const hierarchy = [world];

      // Test navigation
      const foundCharacter = primService.findPrimByPath(
        hierarchy,
        "/World/Character"
      );
      expect(foundCharacter).toBe(character);

      const foundMesh = primService.findPrimByPath(
        hierarchy,
        "/World/Character/Mesh"
      );
      expect(foundMesh).toBe(mesh);

      // Test parent path
      expect(primService.getParentPath("/World/Character/Mesh")).toBe(
        "/World/Character"
      );
    });

    it("should build prim map for fast lookups", () => {
      const world = primService.createPrim("/World", "Xform");
      const char1 = primService.createPrim("/World/Character1", "Xform");
      const char2 = primService.createPrim("/World/Character2", "Xform");

      world.children = [char1, char2];
      const hierarchy = [world];

      const primMap = primService.buildPrimMap(hierarchy);

      // Fast O(1) lookups
      expect(primMap.get("/World")).toBe(world);
      expect(primMap.get("/World/Character1")).toBe(char1);
      expect(primMap.get("/World/Character2")).toBe(char2);
      expect(primMap.size).toBe(3);
    });

    it("should get all descendants of a prim", () => {
      const world = primService.createPrim("/World");
      const character = primService.createPrim("/World/Character");
      const mesh = primService.createPrim("/World/Character/Mesh");
      const skeleton = primService.createPrim("/World/Character/Skeleton");

      world.children = [character];
      character.children = [mesh, skeleton];

      const descendants = primService.getDescendants(world);

      expect(descendants).toHaveLength(3);
      expect(descendants).toContain(character);
      expect(descendants).toContain(mesh);
      expect(descendants).toContain(skeleton);
    });
  });

  describe("Prim Composition and Merging", () => {
    it("should merge prims with property overrides", () => {
      const basePrim = primService.createPrim("/World/Sphere", "Sphere", {
        radius: 1.0,
        color: [1, 0, 0],
        visible: true,
      });

      const overridePrim = primService.createPrim("/World/Sphere", "Sphere", {
        radius: 2.0,
        segments: 32,
      });

      const merged = primService.mergePrims(basePrim, overridePrim);

      expect(merged.properties.radius).toBe(2.0); // Overridden
      expect(merged.properties.color).toEqual([1, 0, 0]); // Preserved
      expect(merged.properties.visible).toBe(true); // Preserved
      expect(merged.properties.segments).toBe(32); // Added
    });

    it("should handle multi-layer composition", () => {
      // Base layer
      const base = primService.createPrim("/Root", "Xform", {
        translate: [0, 0, 0],
      });

      // Animation layer
      const anim = primService.createPrim("/Root", "Xform", {
        translate: [5, 0, 0],
        rotate: [0, 90, 0],
      });

      // Adjustment layer
      const adj = primService.createPrim("/Root", "Xform", {
        scale: [2, 2, 2],
      });

      // Compose layers (bottom to top)
      let composed = primService.mergePrims(base, anim);
      composed = primService.mergePrims(composed, adj);

      expect(composed.properties.translate).toEqual([5, 0, 0]);
      expect(composed.properties.rotate).toEqual([0, 90, 0]);
      expect(composed.properties.scale).toEqual([2, 2, 2]);
    });

    it("should clone prims with deep copy", () => {
      const original = primService.createPrim("/World/Original", "Sphere", {
        radius: 1.0,
        material: { color: [1, 0, 0] },
      });
      original.children = [
        primService.createPrim("/World/Original/Child", "Xform"),
      ];

      const cloned = primService.clonePrim(original, "/World/Clone");

      expect(cloned.path).toBe("/World/Clone");
      expect(cloned.properties.radius).toBe(1.0);
      expect(cloned.children).toHaveLength(1);

      // Verify deep copy
      cloned.properties.radius = 2.0;
      expect(original.properties.radius).toBe(1.0);
    });
  });

  describe("Prim Filtering and Searching", () => {
    const createSceneHierarchy = () => {
      const world = primService.createPrim("/World", "Xform");
      const sphere1 = primService.createPrim("/World/Sphere1", "Sphere");
      const sphere2 = primService.createPrim("/World/Sphere2", "Sphere");
      const cube = primService.createPrim("/World/Cube", "Cube");
      const group = primService.createPrim("/World/Group", "Xform");
      const sphere3 = primService.createPrim("/World/Group/Sphere3", "Sphere");

      world.children = [sphere1, sphere2, cube, group];
      group.children = [sphere3];

      return [world];
    };

    it("should filter prims by type", () => {
      const hierarchy = createSceneHierarchy();
      const spheres = primService.filterPrimsByType(hierarchy, "Sphere");

      expect(spheres).toHaveLength(3);
      expect(spheres.every((p) => p.type === "Sphere")).toBe(true);
    });

    it("should count total prims in hierarchy", () => {
      const hierarchy = createSceneHierarchy();
      const count = primService.countPrims(hierarchy);

      expect(count).toBe(6); // World + Sphere1 + Sphere2 + Cube + Group + Sphere3
    });

    it("should check ancestor relationships", () => {
      expect(primService.isAncestor("/World", "/World/Character")).toBe(true);
      expect(primService.isAncestor("/World", "/World/Character/Mesh")).toBe(
        true
      );
      expect(primService.isAncestor("/World/Character", "/World/Light")).toBe(
        false
      );
      expect(primService.isAncestor("/World", "/World")).toBe(false);
    });

    it("should calculate prim depth", () => {
      expect(primService.getPrimDepth("/")).toBe(0);
      expect(primService.getPrimDepth("/World")).toBe(1);
      expect(primService.getPrimDepth("/World/Character")).toBe(2);
      expect(primService.getPrimDepth("/World/Character/Mesh")).toBe(3);
    });
  });

  describe("Path Operations", () => {
    it("should normalize paths correctly", () => {
      expect(primService.normalizePrimPath("World/Character/")).toBe(
        "/World/Character"
      );
      expect(primService.normalizePrimPath("//World///Character")).toBe(
        "/World/Character"
      );
      expect(primService.normalizePrimPath("/World/Character")).toBe(
        "/World/Character"
      );
    });

    it("should join paths correctly", () => {
      expect(primService.joinPaths("/World", "Character", "Mesh")).toBe(
        "/World/Character/Mesh"
      );
      expect(primService.joinPaths("/World/", "/Character/", "/Mesh")).toBe(
        "/World/Character/Mesh"
      );
      expect(primService.joinPaths("World", "", "Character")).toBe(
        "/World/Character"
      );
    });

    it("should extract prim names", () => {
      expect(primService.getPrimName("/World/Character")).toBe("Character");
      expect(primService.getPrimName("/World")).toBe("World");
      expect(primService.getPrimName("/")).toBe("Root");
    });

    it("should get parent paths", () => {
      expect(primService.getParentPath("/World/Character/Mesh")).toBe(
        "/World/Character"
      );
      expect(primService.getParentPath("/World/Character")).toBe("/World");
      expect(primService.getParentPath("/World")).toBe("/");
      expect(primService.getParentPath("/")).toBeNull();
    });
  });

  describe("Display Names and Metadata", () => {
    it("should manage display names", () => {
      const prim = primService.createPrim("/World/Character");

      // Default to prim name
      expect(primService.getDisplayName(prim)).toBe("Character");

      // Set custom display name
      const updated = primService.setDisplayName(prim, "Hero Character");
      expect(primService.getDisplayName(updated)).toBe("Hero Character");
    });

    it("should track prim metadata", () => {
      const prim = primService.createPrim("/World/Sphere");

      expect(prim.metadata.createdAt).toBeDefined();
      expect(prim.metadata.modifiedAt).toBeDefined();

      const updated = primService.updatePrimProperties(prim, { radius: 2.0 });
      expect(updated.metadata.modifiedAt).toBeGreaterThanOrEqual(
        prim.metadata.modifiedAt
      );
    });
  });

  describe("Complex Prim Workflows", () => {
    it("should handle complete scene composition workflow", () => {
      // Create base scene
      const world = primService.createPrim("/World");
      const characters = primService.createPrim("/World/Characters", "Xform");
      const props = primService.createPrim("/World/Props", "Xform");

      // Add characters
      const hero = primService.createPrim("/World/Characters/Hero", "Xform", {
        translate: [0, 0, 0],
      });
      const villain = primService.createPrim(
        "/World/Characters/Villain",
        "Xform",
        {
          translate: [10, 0, 0],
        }
      );

      // Build hierarchy
      world.children = [characters, props];
      characters.children = [hero, villain];

      const hierarchy = [world];

      // Create override layer
      const heroOverride = primService.createPrim(
        "/World/Characters/Hero",
        "Xform",
        {
          translate: [5, 2, 0],
          rotate: [0, 45, 0],
        }
      );

      // Merge override
      const foundHero = primService.findPrimByPath(
        hierarchy,
        "/World/Characters/Hero"
      );
      const composedHero = primService.mergePrims(foundHero, heroOverride);

      expect(composedHero.properties.translate).toEqual([5, 2, 0]);
      expect(composedHero.properties.rotate).toEqual([0, 45, 0]);

      // Verify hierarchy integrity (World + Characters + Props + Hero + Villain)
      expect(primService.countPrims(hierarchy)).toBe(5);
      expect(primService.filterPrimsByType(hierarchy, "Xform")).toHaveLength(5);
    });

    it("should handle prim instancing workflow", () => {
      // Create master prim
      const master = primService.createPrim("/Masters/Tree", "Mesh", {
        vertices: 1000,
        material: "bark",
      });

      // Create instances
      const instance1 = primService.clonePrim(master, "/World/Tree1");
      const instance2 = primService.clonePrim(master, "/World/Tree2");
      const instance3 = primService.clonePrim(master, "/World/Tree3");

      // Verify instances are independent copies
      const updated1 = primService.updatePrimProperties(instance1, {
        scale: [2, 2, 2],
      });

      expect(updated1.properties.scale).toEqual([2, 2, 2]);
      expect(instance2.properties.scale).toBeUndefined();
      expect(instance3.properties.scale).toBeUndefined();

      // All instances share master properties
      expect(updated1.properties.material).toBe("bark");
      expect(instance2.properties.material).toBe("bark");
      expect(instance3.properties.material).toBe("bark");
    });
  });

  describe("Error Handling and Validation", () => {
    it("should validate prim paths", () => {
      expect(() => primService.validatePrimPath("/Valid/Path")).not.toThrow();
      expect(() => primService.validatePrimPath("InvalidPath")).toThrow();
      expect(() => primService.validatePrimPath("/Invalid<Path")).toThrow();
    });

    it("should handle non-existent paths gracefully", () => {
      const hierarchy = [primService.createPrim("/World")];
      const result = primService.findPrimByPath(hierarchy, "/NonExistent");

      expect(result).toBeNull();
    });

    it("should validate prim operations", () => {
      expect(() => {
        primService.createPrim("InvalidPath");
      }).toThrow();

      expect(() => {
        primService.getParentPath("InvalidPath");
      }).toThrow();
    });
  });
});
