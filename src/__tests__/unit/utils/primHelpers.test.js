// src/__tests__/unit/utils/primHelpers.test.js
// Note: describe, it, expect are available globally via globals: true in vite.config.js
import {
  validatePrimName,
  getPrimName,
  getParentPath,
  calculateNewPath,
  isDescendantOf,
  getAllPrimPaths,
} from "../../../utils/primHelpers.js";

describe("primHelpers", () => {
  describe("validatePrimName", () => {
    it("should validate correct prim names", () => {
      expect(validatePrimName("ValidName")).toBe(true);
      expect(validatePrimName("_underscore")).toBe(true);
      expect(validatePrimName("Name123")).toBe(true);
      expect(validatePrimName("_Name_123")).toBe(true);
    });

    it("should reject invalid prim names", () => {
      expect(validatePrimName("")).toBe(false);
      expect(validatePrimName("123Start")).toBe(false);
      expect(validatePrimName("Invalid Name")).toBe(false);
      expect(validatePrimName("Invalid-Name")).toBe(false);
      expect(validatePrimName(null)).toBe(false);
    });
  });

  describe("getPrimName", () => {
    it("should extract prim name from path", () => {
      expect(getPrimName("/RootPrim")).toBe("RootPrim");
      expect(getPrimName("/Parent/Child")).toBe("Child");
      expect(getPrimName("/Deep/Nested/Path/Prim")).toBe("Prim");
    });

    it("should handle edge cases", () => {
      expect(getPrimName("/")).toBe("");
      expect(getPrimName("/SinglePrim")).toBe("SinglePrim");
    });
  });

  describe("getParentPath", () => {
    it("should get parent path correctly", () => {
      expect(getParentPath("/Parent/Child")).toBe("/Parent");
      expect(getParentPath("/Deep/Nested/Path")).toBe("/Deep/Nested");
    });

    it("should return empty string for root level", () => {
      expect(getParentPath("/RootPrim")).toBe("");
    });
  });

  describe("calculateNewPath", () => {
    it("should calculate new path after rename", () => {
      expect(calculateNewPath("/Parent/OldName", "NewName")).toBe(
        "/Parent/NewName"
      );
      expect(calculateNewPath("/RootPrim", "RenamedRoot")).toBe("/RenamedRoot");
    });
  });

  describe("isDescendantOf", () => {
    it("should correctly identify descendants", () => {
      expect(isDescendantOf("/Parent/Child", "/Parent")).toBe(true);
      expect(isDescendantOf("/Parent/Child/GrandChild", "/Parent")).toBe(true);
    });

    it("should return false for non-descendants", () => {
      expect(isDescendantOf("/Parent", "/Parent/Child")).toBe(false);
      expect(isDescendantOf("/Other", "/Parent")).toBe(false);
    });
  });

  describe("getAllPrimPaths", () => {
    it("should collect all paths from hierarchy", () => {
      const hierarchy = [
        {
          path: "/Root",
          children: [
            { path: "/Root/Child1", children: [] },
            { path: "/Root/Child2", children: [] },
          ],
        },
      ];

      const paths = getAllPrimPaths(hierarchy);
      expect(paths).toHaveLength(3);
      expect(paths).toContain("/Root");
      expect(paths).toContain("/Root/Child1");
      expect(paths).toContain("/Root/Child2");
    });
  });
});
