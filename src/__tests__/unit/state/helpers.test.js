/**
 * State Helpers Unit Tests
 * Tests for helper functions used by the state reducer
 */

// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import {
  updatePrimInHierarchy,
  addPrimToHierarchy,
  removePrimFromHierarchy,
  generateId,
} from "../../../core/state/helpers.js";

describe("State Helpers", () => {
  describe("updatePrimInHierarchy", () => {
    it("should update a prim at root level", () => {
      const hierarchy = [{ path: "/World", type: "Xform", children: [] }];

      const result = updatePrimInHierarchy(hierarchy, "/World", {
        type: "Scope",
      });

      expect(result[0].type).toBe("Scope");
      expect(result[0].path).toBe("/World");
    });

    it("should update a nested prim", () => {
      const hierarchy = [
        {
          path: "/World",
          children: [{ path: "/World/Child", name: "Child", children: [] }],
        },
      ];

      const result = updatePrimInHierarchy(hierarchy, "/World/Child", {
        name: "Updated",
      });

      expect(result[0].children[0].name).toBe("Updated");
    });

    it("should not modify other prims", () => {
      const hierarchy = [
        { path: "/A", name: "A", children: [] },
        { path: "/B", name: "B", children: [] },
      ];

      const result = updatePrimInHierarchy(hierarchy, "/A", {
        name: "Updated",
      });

      expect(result[0].name).toBe("Updated");
      expect(result[1].name).toBe("B");
    });

    it("should handle null hierarchy", () => {
      expect(updatePrimInHierarchy(null, "/World", {})).toBeNull();
    });

    it("should handle non-array hierarchy", () => {
      expect(updatePrimInHierarchy("invalid", "/World", {})).toBe("invalid");
    });

    it("should return unchanged hierarchy if path not found", () => {
      const hierarchy = [{ path: "/World", children: [] }];

      const result = updatePrimInHierarchy(hierarchy, "/NonExistent", {
        name: "Test",
      });

      expect(result[0].path).toBe("/World");
    });
  });

  describe("addPrimToHierarchy", () => {
    it("should add prim to root level", () => {
      const hierarchy = [{ path: "/World", children: [] }];
      const newPrim = { path: "/NewPrim", children: [] };

      const result = addPrimToHierarchy(hierarchy, "/", newPrim);

      expect(result).toHaveLength(2);
      expect(result[1].path).toBe("/NewPrim");
    });

    it("should add prim as child of specified parent", () => {
      const hierarchy = [{ path: "/World", children: [] }];
      const newPrim = { path: "/World/Child", children: [] };

      const result = addPrimToHierarchy(hierarchy, "/World", newPrim);

      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].path).toBe("/World/Child");
    });

    it("should add prim when parent has no children array", () => {
      const hierarchy = [{ path: "/World" }];
      const newPrim = { path: "/World/Child" };

      const result = addPrimToHierarchy(hierarchy, "/World", newPrim);

      expect(result[0].children).toHaveLength(1);
    });

    it("should handle null hierarchy", () => {
      const newPrim = { path: "/World" };
      const result = addPrimToHierarchy(null, null, newPrim);

      expect(result).toEqual([newPrim]);
    });

    it("should add to root when parentPath is null", () => {
      const hierarchy = [{ path: "/World", children: [] }];
      const newPrim = { path: "/Other", children: [] };

      const result = addPrimToHierarchy(hierarchy, null, newPrim);

      expect(result).toHaveLength(2);
    });

    it("should add to nested parent", () => {
      const hierarchy = [
        {
          path: "/World",
          children: [{ path: "/World/Group", children: [] }],
        },
      ];
      const newPrim = { path: "/World/Group/Child" };

      const result = addPrimToHierarchy(hierarchy, "/World/Group", newPrim);

      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].path).toBe("/World/Group/Child");
    });
  });

  describe("removePrimFromHierarchy", () => {
    it("should remove a prim from root level", () => {
      const hierarchy = [
        { path: "/A", children: [] },
        { path: "/B", children: [] },
      ];

      const result = removePrimFromHierarchy(hierarchy, "/A");

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe("/B");
    });

    it("should remove a nested prim", () => {
      const hierarchy = [
        {
          path: "/World",
          children: [
            { path: "/World/Child1", children: [] },
            { path: "/World/Child2", children: [] },
          ],
        },
      ];

      const result = removePrimFromHierarchy(hierarchy, "/World/Child1");

      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].path).toBe("/World/Child2");
    });

    it("should handle null hierarchy", () => {
      expect(removePrimFromHierarchy(null, "/World")).toBeNull();
    });

    it("should handle non-array hierarchy", () => {
      expect(removePrimFromHierarchy("invalid", "/World")).toBe("invalid");
    });

    it("should return unchanged hierarchy if path not found", () => {
      const hierarchy = [{ path: "/World", children: [] }];

      const result = removePrimFromHierarchy(hierarchy, "/NonExistent");

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe("/World");
    });
  });

  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
    });

    it("should generate IDs with timestamp prefix", () => {
      const id = generateId();

      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it("should generate string IDs", () => {
      const id = generateId();

      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });
  });
});
