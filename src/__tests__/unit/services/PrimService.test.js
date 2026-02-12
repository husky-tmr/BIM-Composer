/**
 * PrimService Unit Tests
 * Tests for core prim operations and path management
 */

// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import { PrimService } from "../../../core/services/PrimService.js";
// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import { ValidationError } from "../../../core/errors/errors.js";

describe("PrimService", () => {
  let service;

  beforeEach(() => {
    service = new PrimService();
  });

  describe("validatePrimPath", () => {
    it("should validate correct prim paths", () => {
      expect(service.validatePrimPath("/Root")).toBe(true);
      expect(service.validatePrimPath("/World/Character")).toBe(true);
      expect(service.validatePrimPath("/World/Character/Mesh")).toBe(true);
    });

    it("should throw ValidationError for missing path", () => {
      expect(() => service.validatePrimPath("")).toThrow(ValidationError);
      expect(() => service.validatePrimPath(null)).toThrow(ValidationError);
    });

    it("should throw ValidationError for path not starting with /", () => {
      expect(() => service.validatePrimPath("Root")).toThrow(ValidationError);
      expect(() => service.validatePrimPath("Root")).toThrow(
        "Prim path must start with /"
      );
    });

    it("should throw ValidationError for invalid characters", () => {
      const invalidChars = ["<", ">", '"', "|", "?", "*"];

      invalidChars.forEach((char) => {
        expect(() => service.validatePrimPath(`/Root${char}Path`)).toThrow(
          ValidationError
        );
        expect(() => service.validatePrimPath(`/Root${char}Path`)).toThrow(
          "invalid character"
        );
      });
    });
  });

  describe("normalizePrimPath", () => {
    it("should remove trailing slashes", () => {
      expect(service.normalizePrimPath("/World/Character/")).toBe(
        "/World/Character"
      );
      expect(service.normalizePrimPath("/World//")).toBe("/World");
    });

    it("should remove duplicate slashes", () => {
      expect(service.normalizePrimPath("//World///Character")).toBe(
        "/World/Character"
      );
    });

    it("should ensure path starts with /", () => {
      expect(service.normalizePrimPath("World/Character")).toBe(
        "/World/Character"
      );
    });

    it("should handle already normalized paths", () => {
      expect(service.normalizePrimPath("/World/Character")).toBe(
        "/World/Character"
      );
    });

    it("should handle root path", () => {
      expect(service.normalizePrimPath("/")).toBe("/");
      expect(service.normalizePrimPath("///")).toBe("/");
    });
  });

  describe("getParentPath", () => {
    it("should return parent path for nested prims", () => {
      expect(service.getParentPath("/World/Character/Mesh")).toBe(
        "/World/Character"
      );
      expect(service.getParentPath("/World/Character")).toBe("/World");
    });

    it("should return / for top-level prims", () => {
      expect(service.getParentPath("/World")).toBe("/");
    });

    it("should return null for root path", () => {
      expect(service.getParentPath("/")).toBeNull();
    });

    it("should throw ValidationError for invalid path", () => {
      expect(() => service.getParentPath("Root")).toThrow(ValidationError);
    });
  });

  describe("getPrimName", () => {
    it("should extract prim name from path", () => {
      expect(service.getPrimName("/World/Character")).toBe("Character");
      expect(service.getPrimName("/World/Character/Mesh")).toBe("Mesh");
      expect(service.getPrimName("/World")).toBe("World");
    });

    it('should return "Root" for root path', () => {
      expect(service.getPrimName("/")).toBe("Root");
    });

    it("should throw ValidationError for invalid path", () => {
      expect(() => service.getPrimName("Root")).toThrow(ValidationError);
    });
  });

  describe("joinPaths", () => {
    it("should join multiple path segments", () => {
      expect(service.joinPaths("/World", "Character", "Mesh")).toBe(
        "/World/Character/Mesh"
      );
    });

    it("should handle paths with slashes", () => {
      expect(service.joinPaths("/World/", "/Character/", "/Mesh")).toBe(
        "/World/Character/Mesh"
      );
    });

    it("should filter out empty segments", () => {
      expect(service.joinPaths("/World", "", "Character")).toBe(
        "/World/Character"
      );
    });

    it("should handle single segment", () => {
      expect(service.joinPaths("World")).toBe("/World");
    });
  });

  describe("createPrim", () => {
    it("should create a prim with default type", () => {
      const prim = service.createPrim("/World/Character");

      expect(prim.path).toBe("/World/Character");
      expect(prim.type).toBe("Xform");
      expect(prim.properties).toEqual({});
      expect(prim.children).toEqual([]);
      expect(prim.metadata).toHaveProperty("createdAt");
      expect(prim.metadata).toHaveProperty("modifiedAt");
    });

    it("should create a prim with specified type", () => {
      const prim = service.createPrim("/World/Sphere", "Sphere");

      expect(prim.type).toBe("Sphere");
    });

    it("should create a prim with properties", () => {
      const prim = service.createPrim("/World/Sphere", "Sphere", {
        radius: 1.0,
      });

      expect(prim.properties.radius).toBe(1.0);
    });

    it("should normalize the path", () => {
      const prim = service.createPrim("/World//Character/");

      expect(prim.path).toBe("/World/Character");
    });

    it("should throw ValidationError for invalid path", () => {
      expect(() => service.createPrim("Root")).toThrow(ValidationError);
    });
  });

  describe("updatePrimProperties", () => {
    it("should update prim properties", () => {
      const prim = service.createPrim("/World/Sphere", "Sphere", {
        radius: 1.0,
      });
      const updated = service.updatePrimProperties(prim, {
        radius: 2.0,
        color: "red",
      });

      expect(updated.properties.radius).toBe(2.0);
      expect(updated.properties.color).toBe("red");
    });

    it("should preserve existing properties", () => {
      const prim = service.createPrim("/World/Sphere", "Sphere", {
        radius: 1.0,
        height: 5.0,
      });
      const updated = service.updatePrimProperties(prim, { radius: 2.0 });

      expect(updated.properties.radius).toBe(2.0);
      expect(updated.properties.height).toBe(5.0);
    });

    it("should update modifiedAt timestamp", () => {
      const prim = service.createPrim("/World/Sphere");
      const updated = service.updatePrimProperties(prim, { radius: 2.0 });

      expect(updated.metadata.modifiedAt).toBeGreaterThanOrEqual(
        prim.metadata.modifiedAt
      );
    });

    it("should not modify original prim", () => {
      const prim = service.createPrim("/World/Sphere", "Sphere", {
        radius: 1.0,
      });
      const originalRadius = prim.properties.radius;

      service.updatePrimProperties(prim, { radius: 2.0 });

      expect(prim.properties.radius).toBe(originalRadius);
    });
  });

  describe("findPrimByPath", () => {
    const createHierarchy = () => [
      {
        path: "/World",
        name: "World",
        children: [
          {
            path: "/World/Character",
            name: "Character",
            children: [
              { path: "/World/Character/Mesh", name: "Mesh", children: [] },
            ],
          },
          { path: "/World/Light", name: "Light", children: [] },
        ],
      },
    ];

    it("should find prim by exact path", () => {
      const hierarchy = createHierarchy();
      const prim = service.findPrimByPath(hierarchy, "/World/Character");

      expect(prim).toBeDefined();
      expect(prim.name).toBe("Character");
    });

    it("should find nested prim", () => {
      const hierarchy = createHierarchy();
      const prim = service.findPrimByPath(hierarchy, "/World/Character/Mesh");

      expect(prim).toBeDefined();
      expect(prim.name).toBe("Mesh");
    });

    it("should find root prim", () => {
      const hierarchy = createHierarchy();
      const prim = service.findPrimByPath(hierarchy, "/World");

      expect(prim).toBeDefined();
      expect(prim.name).toBe("World");
    });

    it("should return null for non-existent path", () => {
      const hierarchy = createHierarchy();
      const prim = service.findPrimByPath(hierarchy, "/World/NonExistent");

      expect(prim).toBeNull();
    });

    it("should handle normalized paths", () => {
      const hierarchy = createHierarchy();
      const prim = service.findPrimByPath(hierarchy, "//World///Character/");

      expect(prim).toBeDefined();
      expect(prim.name).toBe("Character");
    });
  });

  describe("getDescendants", () => {
    it("should return all descendants", () => {
      const prim = {
        path: "/World",
        children: [
          {
            path: "/World/Character",
            children: [{ path: "/World/Character/Mesh", children: [] }],
          },
          { path: "/World/Light", children: [] },
        ],
      };

      const descendants = service.getDescendants(prim);

      expect(descendants).toHaveLength(3);
      expect(descendants.map((d) => d.path)).toContain("/World/Character");
      expect(descendants.map((d) => d.path)).toContain("/World/Character/Mesh");
      expect(descendants.map((d) => d.path)).toContain("/World/Light");
    });

    it("should return empty array for leaf prim", () => {
      const prim = { path: "/World/Leaf", children: [] };
      const descendants = service.getDescendants(prim);

      expect(descendants).toHaveLength(0);
    });
  });

  describe("getPrimDepth", () => {
    it("should return 0 for root path", () => {
      expect(service.getPrimDepth("/")).toBe(0);
    });

    it("should return correct depth for nested paths", () => {
      expect(service.getPrimDepth("/World")).toBe(1);
      expect(service.getPrimDepth("/World/Character")).toBe(2);
      expect(service.getPrimDepth("/World/Character/Mesh")).toBe(3);
    });

    it("should throw ValidationError for invalid path", () => {
      expect(() => service.getPrimDepth("Root")).toThrow(ValidationError);
    });
  });

  describe("isAncestor", () => {
    it("should return true for ancestor paths", () => {
      expect(service.isAncestor("/World", "/World/Character")).toBe(true);
      expect(service.isAncestor("/World", "/World/Character/Mesh")).toBe(true);
    });

    it("should return false for non-ancestor paths", () => {
      expect(service.isAncestor("/World/Character", "/World/Light")).toBe(
        false
      );
      expect(service.isAncestor("/World/Character", "/World")).toBe(false);
    });

    it("should return false for same path", () => {
      expect(service.isAncestor("/World", "/World")).toBe(false);
    });
  });

  describe("buildPrimMap", () => {
    it("should build map of all prims", () => {
      const hierarchy = [
        {
          path: "/World",
          children: [
            { path: "/World/Character", children: [] },
            { path: "/World/Light", children: [] },
          ],
        },
      ];

      const map = service.buildPrimMap(hierarchy);

      expect(map.size).toBe(3);
      expect(map.has("/World")).toBe(true);
      expect(map.has("/World/Character")).toBe(true);
      expect(map.has("/World/Light")).toBe(true);
    });

    it("should allow O(1) lookups", () => {
      const hierarchy = [
        {
          path: "/World",
          name: "World",
          children: [
            { path: "/World/Character", name: "Character", children: [] },
          ],
        },
      ];

      const map = service.buildPrimMap(hierarchy);
      const prim = map.get("/World/Character");

      expect(prim).toBeDefined();
      expect(prim.name).toBe("Character");
    });

    it("should handle empty hierarchy", () => {
      const map = service.buildPrimMap([]);

      expect(map.size).toBe(0);
    });
  });

  describe("getDisplayName", () => {
    it("should return displayName property if present", () => {
      const prim = service.createPrim("/World/Character", "Xform", {
        displayName: "Hero Character",
      });
      const displayName = service.getDisplayName(prim);

      expect(displayName).toBe("Hero Character");
    });

    it("should return prim name if displayName not present", () => {
      const prim = service.createPrim("/World/Character");
      const displayName = service.getDisplayName(prim);

      expect(displayName).toBe("Character");
    });
  });

  describe("setDisplayName", () => {
    it("should set displayName property", () => {
      const prim = service.createPrim("/World/Character");
      const updated = service.setDisplayName(prim, "Hero Character");

      expect(updated.properties.displayName).toBe("Hero Character");
    });
  });

  describe("clonePrim", () => {
    it("should create a deep copy with new path", () => {
      const original = service.createPrim("/World/Original", "Sphere", {
        radius: 1.0,
      });
      original.children = [{ path: "/World/Original/Child", children: [] }];

      const cloned = service.clonePrim(original, "/World/Clone");

      expect(cloned.path).toBe("/World/Clone");
      expect(cloned.type).toBe("Sphere");
      expect(cloned.properties.radius).toBe(1.0);
      expect(cloned.children).toHaveLength(1);
      expect(cloned).not.toBe(original);
    });

    it("should update timestamps", () => {
      const original = service.createPrim("/World/Original");
      const cloned = service.clonePrim(original, "/World/Clone");

      expect(cloned.metadata.createdAt).toBeGreaterThanOrEqual(
        original.metadata.createdAt
      );
      expect(cloned.metadata.modifiedAt).toBeGreaterThanOrEqual(
        original.metadata.modifiedAt
      );
    });

    it("should throw ValidationError for invalid path", () => {
      const original = service.createPrim("/World/Original");

      expect(() => service.clonePrim(original, "Invalid")).toThrow(
        ValidationError
      );
    });
  });

  describe("mergePrims", () => {
    it("should merge properties with override taking precedence", () => {
      const base = service.createPrim("/World/Sphere", "Sphere", {
        radius: 1.0,
        color: "red",
      });
      const override = service.createPrim("/World/Sphere", "Sphere", {
        radius: 2.0,
      });

      const merged = service.mergePrims(base, override);

      expect(merged.properties.radius).toBe(2.0);
      expect(merged.properties.color).toBe("red");
    });

    it("should preserve base properties not in override", () => {
      const base = service.createPrim("/World/Sphere", "Sphere", {
        radius: 1.0,
        height: 5.0,
      });
      const override = service.createPrim("/World/Sphere", "Sphere", {
        radius: 2.0,
      });

      const merged = service.mergePrims(base, override);

      expect(merged.properties.height).toBe(5.0);
    });

    it("should update modifiedAt timestamp", () => {
      const base = service.createPrim("/World/Sphere");
      const override = service.createPrim("/World/Sphere");

      const merged = service.mergePrims(base, override);

      expect(merged.metadata.modifiedAt).toBeGreaterThanOrEqual(
        base.metadata.modifiedAt
      );
    });
  });

  describe("filterPrimsByType", () => {
    const createHierarchy = () => [
      {
        path: "/World",
        type: "Xform",
        children: [
          { path: "/World/Sphere1", type: "Sphere", children: [] },
          { path: "/World/Sphere2", type: "Sphere", children: [] },
          { path: "/World/Cube", type: "Cube", children: [] },
        ],
      },
    ];

    it("should filter prims by type", () => {
      const hierarchy = createHierarchy();
      const spheres = service.filterPrimsByType(hierarchy, "Sphere");

      expect(spheres).toHaveLength(2);
      expect(spheres.every((p) => p.type === "Sphere")).toBe(true);
    });

    it("should return empty array when no matches", () => {
      const hierarchy = createHierarchy();
      const lights = service.filterPrimsByType(hierarchy, "Light");

      expect(lights).toHaveLength(0);
    });

    it("should search recursively", () => {
      const hierarchy = [
        {
          path: "/World",
          type: "Xform",
          children: [
            {
              path: "/World/Group",
              type: "Xform",
              children: [
                { path: "/World/Group/Sphere", type: "Sphere", children: [] },
              ],
            },
          ],
        },
      ];

      const spheres = service.filterPrimsByType(hierarchy, "Sphere");

      expect(spheres).toHaveLength(1);
    });
  });

  describe("countPrims", () => {
    it("should count all prims in hierarchy", () => {
      const hierarchy = [
        {
          path: "/World",
          children: [
            { path: "/World/Character", children: [] },
            {
              path: "/World/Group",
              children: [{ path: "/World/Group/Mesh", children: [] }],
            },
          ],
        },
      ];

      const count = service.countPrims(hierarchy);

      expect(count).toBe(4);
    });

    it("should return 0 for empty hierarchy", () => {
      const count = service.countPrims([]);

      expect(count).toBe(0);
    });

    it("should count single prim", () => {
      const hierarchy = [{ path: "/World", children: [] }];
      const count = service.countPrims(hierarchy);

      expect(count).toBe(1);
    });
  });
});
