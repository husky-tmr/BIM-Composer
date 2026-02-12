/**
 * usdaEditor Unit Tests
 * Tests for USDA file manipulation: inserting, removing, updating, and renaming prims
 */

import {
  insertPrimIntoFile,
  removePrimFromFile,
  updatePropertyInFile,
  renamePrimInFile,
} from "../../../../viewer/usda/usdaEditor.js";
import { USDA_PARSER } from "../../../../viewer/usda/usdaParser.js";

// Mock USDA_PARSER
vi.mock("../../../../viewer/usda/usdaParser.js", () => ({
  USDA_PARSER: {
    getPrimHierarchy: vi.fn(),
  },
}));

describe("usdaEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("insertPrimIntoFile()", () => {
    it("should insert prim at root when targetParentPath is empty string", () => {
      const fileContent = 'def Xform "Root" { }';
      const primText = 'def Xform "NewPrim" { }';

      const result = insertPrimIntoFile(fileContent, "", primText);

      expect(result).toContain(fileContent);
      expect(result).toContain(primText);
      expect(result).toBe(`${fileContent}\n${primText}`);
    });

    it("should insert prim at root when targetParentPath is /", () => {
      const fileContent = 'def Xform "Root" { }';
      const primText = 'def Xform "NewPrim" { }';

      const result = insertPrimIntoFile(fileContent, "/", primText);

      expect(result).toContain(fileContent);
      expect(result).toContain(primText);
      expect(result).toBe(`${fileContent}\n${primText}`);
    });

    it("should insert prim inside existing parent", () => {
      const fileContent = 'def Xform "World" { }';
      const primText = 'def Xform "Character" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "World",
          path: "/World",
          startIndex: 0,
          endIndex: 20,
          children: [],
        },
      ]);

      const result = insertPrimIntoFile(fileContent, "/World", primText);

      expect(result).toContain('def Xform "World"');
      expect(result).toContain('def Xform "Character"');
      // Should be inserted before closing brace
      expect(result.indexOf("Character")).toBeLessThan(result.lastIndexOf("}"));
    });

    it("should create wrapper over blocks for missing parent path", () => {
      const fileContent = 'def Xform "Root" { }';
      const primText = 'def Xform "Character" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Root",
          path: "/Root",
          startIndex: 0,
          endIndex: 20,
          children: [],
        },
      ]);

      const result = insertPrimIntoFile(
        fileContent,
        "/World/Characters",
        primText
      );

      expect(result).toContain('over "World"');
      expect(result).toContain('over "Characters"');
      expect(result).toContain('def Xform "Character"');
    });

    it("should create partial wrapper for partially matching path", () => {
      const fileContent = 'def Xform "World" { }';
      const primText = 'def Xform "Hero" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "World",
          path: "/World",
          startIndex: 0,
          endIndex: 20,
          children: [],
        },
      ]);

      const result = insertPrimIntoFile(
        fileContent,
        "/World/Characters",
        primText
      );

      expect(result).toContain('over "Characters"');
      expect(result).toContain('def Xform "Hero"');
      expect(result).not.toContain('over "World"'); // World already exists
    });

    it("should handle nested existing hierarchy", () => {
      const fileContent = 'def Xform "World" { def Xform "Characters" { } }';
      const primText = 'def Xform "Hero" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "World",
          path: "/World",
          startIndex: 0,
          endIndex: 48,
          children: [
            {
              name: "Characters",
              path: "/World/Characters",
              startIndex: 20,
              endIndex: 46,
              children: [],
            },
          ],
        },
      ]);

      const result = insertPrimIntoFile(
        fileContent,
        "/World/Characters",
        primText
      );

      expect(result).toContain('def Xform "Hero"');
      expect(result).not.toContain('over "World"');
      expect(result).not.toContain('over "Characters"');
    });

    it("should append to root when no matching root node found", () => {
      const fileContent = 'def Xform "ExistingRoot" { }';
      const primText = 'def Xform "NewPrim" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "ExistingRoot",
          path: "/ExistingRoot",
          startIndex: 0,
          endIndex: 28,
          children: [],
        },
      ]);

      const result = insertPrimIntoFile(
        fileContent,
        "/NewRoot/NewPrim",
        primText
      );

      expect(result).toContain('over "NewRoot"');
      expect(result).toContain('over "NewPrim"');
      expect(result).toContain(primText);
    });

    it("should handle multi-level missing hierarchy", () => {
      const fileContent = "";
      const primText = 'def Xform "Leaf" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([]);

      const result = insertPrimIntoFile(
        fileContent,
        "/Level1/Level2/Level3",
        primText
      );

      expect(result).toContain('over "Level1"');
      expect(result).toContain('over "Level2"');
      expect(result).toContain('over "Level3"');
      expect(result).toContain('def Xform "Leaf"');
    });

    it("should match path parts case-sensitively", () => {
      const fileContent = 'def Xform "world" { }';
      const primText = 'def Xform "Character" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "world",
          path: "/world",
          startIndex: 0,
          endIndex: 20,
          children: [],
        },
      ]);

      const result = insertPrimIntoFile(fileContent, "/World", primText);

      // Should not match "world" with "World"
      expect(result).toContain('over "World"');
    });

    it("should handle empty hierarchy", () => {
      const fileContent = "";
      const primText = 'def Xform "Root" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([]);

      const result = insertPrimIntoFile(fileContent, "/World", primText);

      expect(result).toContain('over "World"');
      expect(result).toContain(primText);
    });

    it("should preserve file content when inserting", () => {
      const fileContent =
        '#usda 1.0\ndef Xform "Existing" { custom string name = "test" }';
      const primText = 'def Xform "New" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Existing",
          path: "/Existing",
          startIndex: 11,
          endIndex: 62,
          children: [],
        },
      ]);

      const result = insertPrimIntoFile(fileContent, "/Existing", primText);

      expect(result).toContain("#usda 1.0");
      expect(result).toContain('custom string name = "test"');
      expect(result).toContain('def Xform "New"');
    });
  });

  describe("removePrimFromFile()", () => {
    it("should remove prim at root level", () => {
      const fileContent = 'def Xform "ToRemove" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "ToRemove",
          path: "/ToRemove",
          startIndex: 0,
          endIndex: 23,
          children: [],
        },
      ]);

      const result = removePrimFromFile(fileContent, "/ToRemove");

      expect(result).not.toContain("ToRemove");
      expect(result).toBe("");
    });

    it("should remove nested prim", () => {
      const fileContent = 'def Xform "World" { def Xform "ToRemove" { } }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "World",
          path: "/World",
          startIndex: 0,
          endIndex: 45,
          children: [
            {
              name: "ToRemove",
              path: "/World/ToRemove",
              startIndex: 20,
              endIndex: 43,
              children: [],
            },
          ],
        },
      ]);

      const result = removePrimFromFile(fileContent, "/World/ToRemove");

      expect(result).not.toContain("ToRemove");
      expect(result).toContain('def Xform "World"');
    });

    it("should warn and return original content when prim not found", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();
      const fileContent = 'def Xform "Existing" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Existing",
          path: "/Existing",
          startIndex: 0,
          endIndex: 23,
          children: [],
        },
      ]);

      const result = removePrimFromFile(fileContent, "/NonExistent");

      expect(result).toBe(fileContent);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Prim not found for removal: /NonExistent"
      );
    });

    it("should handle prim with missing startIndex", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();
      const fileContent = 'def Xform "Prim" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: undefined,
          endIndex: 19,
          children: [],
        },
      ]);

      const result = removePrimFromFile(fileContent, "/Prim");

      expect(result).toBe(fileContent);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should handle prim with missing endIndex", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();
      const fileContent = 'def Xform "Prim" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: 0,
          endIndex: undefined,
          children: [],
        },
      ]);

      const result = removePrimFromFile(fileContent, "/Prim");

      expect(result).toBe(fileContent);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should remove prim deeply nested in hierarchy", () => {
      const fileContent =
        'def Xform "A" { def Xform "B" { def Xform "C" { } } }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "A",
          path: "/A",
          startIndex: 0,
          endIndex: 52,
          children: [
            {
              name: "B",
              path: "/A/B",
              startIndex: 16,
              endIndex: 50,
              children: [
                {
                  name: "C",
                  path: "/A/B/C",
                  startIndex: 32,
                  endIndex: 48,
                  children: [],
                },
              ],
            },
          ],
        },
      ]);

      const result = removePrimFromFile(fileContent, "/A/B/C");

      expect(result).not.toContain('"C"');
      expect(result).toContain('"A"');
      expect(result).toContain('"B"');
    });

    it("should handle empty hierarchy", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();
      const fileContent = "";

      USDA_PARSER.getPrimHierarchy.mockReturnValue([]);

      const result = removePrimFromFile(fileContent, "/NonExistent");

      expect(result).toBe("");
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe("updatePropertyInFile()", () => {
    it("should update existing property value", () => {
      const fileContent =
        'def Xform "Prim" { custom string primvars:displayName = "OldName" }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: 0,
          endIndex: 67,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/Prim",
        "displayName",
        "NewName"
      );

      expect(result).toContain("NewName");
      expect(result).not.toContain("OldName");
    });

    it("should insert new property when it doesn't exist", () => {
      const fileContent = 'def Xform "Prim" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: 0,
          endIndex: 19,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/Prim",
        "displayName",
        "NewName"
      );

      expect(result).toContain(
        'custom string primvars:displayName = "NewName"'
      );
    });

    it("should use primvars namespace for regular properties", () => {
      const fileContent = 'def Xform "Prim" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: 0,
          endIndex: 19,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/Prim",
        "status",
        "Active"
      );

      expect(result).toContain("primvars:status");
    });

    it("should preserve Pset property namespace", () => {
      const fileContent = 'def Xform "Prim" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: 0,
          endIndex: 19,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/Prim",
        "Pset_Wall:FireRating",
        "2HR"
      );

      expect(result).toContain("Pset_Wall:FireRating");
      expect(result).not.toContain("primvars:");
    });

    it("should use custom property type", () => {
      const fileContent = 'def Xform "Prim" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: 0,
          endIndex: 19,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/Prim",
        "count",
        "42",
        "int"
      );

      expect(result).toContain("custom int");
    });

    it("should default to string property type", () => {
      const fileContent = 'def Xform "Prim" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: 0,
          endIndex: 19,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/Prim",
        "name",
        "TestName"
      );

      expect(result).toContain("custom string");
    });

    it("should detect indentation from existing properties", () => {
      const fileContent =
        'def Xform "Prim" {\n  custom string existing = "value"\n}';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: 0,
          endIndex: 56,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/Prim",
        "newProp",
        "newValue"
      );

      // Should match the 2-space indentation
      expect(result).toMatch(/\n {2}custom string primvars:newProp/);
    });

    it("should use default indentation when no existing properties", () => {
      const fileContent = 'def Xform "Prim" {\n}';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: 0,
          endIndex: 20,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/Prim",
        "prop",
        "value"
      );

      // Should use default 4-space indentation
      expect(result).toMatch(/\n {4}custom string primvars:prop/);
    });

    it("should fallback to finding by name when path not found", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();
      const fileContent = 'def Xform "MyPrim" { }';

      // First call returns empty (path search fails)
      // Second call should find by name
      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "MyPrim",
          path: "/DifferentPath/MyPrim",
          startIndex: 0,
          endIndex: 21,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/World/MyPrim", // Wrong path
        "prop",
        "value"
      );

      expect(result).toContain('custom string primvars:prop = "value"');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("trying by name")
      );
    });

    it("should return original content when prim not found by path or name", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();
      const fileContent = 'def Xform "Existing" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Existing",
          path: "/Existing",
          startIndex: 0,
          endIndex: 23,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/NonExistent",
        "prop",
        "value"
      );

      expect(result).toBe(fileContent);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Prim not found")
      );
    });

    it("should handle prim with missing indices", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();
      const fileContent = 'def Xform "Prim" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: undefined,
          endIndex: undefined,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/Prim",
        "prop",
        "value"
      );

      expect(result).toBe(fileContent);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should warn when closing brace not found", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();
      const fileContent = 'def Xform "Prim" {'; // Missing closing brace

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: 0,
          endIndex: 17,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/Prim",
        "prop",
        "value"
      );

      expect(result).toBe(fileContent);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not find closing brace")
      );
    });

    it("should escape special regex characters in property name", () => {
      const fileContent =
        'def Xform "Prim" { custom string Pset_Test:Prop.Name = "old" }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: 0,
          endIndex: 61,
          children: [],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/Prim",
        "Pset_Test:Prop.Name",
        "new"
      );

      expect(result).toContain('"new"');
      expect(result).not.toContain('"old"');
    });

    it("should update property with nested prim", () => {
      const fileContent =
        'def Xform "World" { def Xform "Prim" { custom string primvars:status = "Draft" } }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "World",
          path: "/World",
          startIndex: 0,
          endIndex: 82,
          children: [
            {
              name: "Prim",
              path: "/World/Prim",
              startIndex: 20,
              endIndex: 80,
              children: [],
            },
          ],
        },
      ]);

      const result = updatePropertyInFile(
        fileContent,
        "/World/Prim",
        "status",
        "Active"
      );

      expect(result).toContain('"Active"');
      expect(result).not.toContain('"Draft"');
    });
  });

  describe("renamePrimInFile()", () => {
    it("should rename prim successfully", () => {
      const fileContent = 'def Xform "OldName" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "OldName",
          path: "/OldName",
          startIndex: 0,
          endIndex: 22,
          children: [],
        },
      ]);

      const result = renamePrimInFile(fileContent, "/OldName", "NewName");

      expect(result.content).toContain('"NewName"');
      expect(result.content).not.toContain('"OldName"');
      expect(result.newPath).toBe("/NewName");
    });

    it("should throw error for invalid prim name with spaces", () => {
      const fileContent = 'def Xform "Old" { }';

      expect(() => {
        renamePrimInFile(fileContent, "/Old", "New Name");
      }).toThrow("Invalid prim name");
    });

    it("should throw error for prim name starting with number", () => {
      const fileContent = 'def Xform "Old" { }';

      expect(() => {
        renamePrimInFile(fileContent, "/Old", "123New");
      }).toThrow("Invalid prim name");
    });

    it("should allow prim name with underscores", () => {
      const fileContent = 'def Xform "Old" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Old",
          path: "/Old",
          startIndex: 0,
          endIndex: 18,
          children: [],
        },
      ]);

      const result = renamePrimInFile(fileContent, "/Old", "New_Name_123");

      expect(result.content).toContain('"New_Name_123"');
      expect(result.newPath).toBe("/New_Name_123");
    });

    it("should allow prim name starting with underscore", () => {
      const fileContent = 'def Xform "Old" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Old",
          path: "/Old",
          startIndex: 0,
          endIndex: 18,
          children: [],
        },
      ]);

      const result = renamePrimInFile(fileContent, "/Old", "_Private");

      expect(result.content).toContain('"_Private"');
    });

    it("should reject prim name with special characters", () => {
      const fileContent = 'def Xform "Old" { }';

      expect(() => {
        renamePrimInFile(fileContent, "/Old", "New-Name");
      }).toThrow("Invalid prim name");
    });

    it("should rename nested prim and update path", () => {
      const fileContent = 'def Xform "Parent" { def Xform "Child" { } }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Parent",
          path: "/Parent",
          startIndex: 0,
          endIndex: 43,
          children: [
            {
              name: "Child",
              path: "/Parent/Child",
              startIndex: 21,
              endIndex: 41,
              children: [],
            },
          ],
        },
      ]);

      const result = renamePrimInFile(fileContent, "/Parent/Child", "NewChild");

      expect(result.content).toContain('"NewChild"');
      expect(result.newPath).toBe("/Parent/NewChild");
    });

    it("should return original when prim not found", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();
      const fileContent = 'def Xform "Existing" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Existing",
          path: "/Existing",
          startIndex: 0,
          endIndex: 23,
          children: [],
        },
      ]);

      const result = renamePrimInFile(fileContent, "/NonExistent", "NewName");

      expect(result.content).toBe(fileContent);
      expect(result.newPath).toBe("/NonExistent");
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should handle prim with type specification", () => {
      const fileContent = 'def Mesh "Cube" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Cube",
          path: "/Cube",
          startIndex: 0,
          endIndex: 18,
          children: [],
        },
      ]);

      const result = renamePrimInFile(fileContent, "/Cube", "Sphere");

      expect(result.content).toContain('def Mesh "Sphere"');
      expect(result.content).not.toContain('"Cube"');
    });

    it("should handle over statement", () => {
      const fileContent = 'over "Existing" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Existing",
          path: "/Existing",
          startIndex: 0,
          endIndex: 18,
          children: [],
        },
      ]);

      const result = renamePrimInFile(fileContent, "/Existing", "Modified");

      expect(result.content).toContain('over "Modified"');
    });

    it("should update references when renaming", () => {
      const fileContent =
        'def Xform "Old" { }\ndef Xform "Ref" { prepend references = @file.usda@</Old> }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Old",
          path: "/Old",
          startIndex: 0,
          endIndex: 18,
          children: [],
        },
        {
          name: "Ref",
          path: "/Ref",
          startIndex: 20,
          endIndex: 78,
          children: [],
        },
      ]);

      const result = renamePrimInFile(fileContent, "/Old", "New");

      expect(result.content).toContain("@file.usda@</New>");
      expect(result.content).not.toContain("@file.usda@</Old>");
    });

    it("should update nested path in references", () => {
      const fileContent =
        'def Xform "Parent" { def Xform "Child" { } }\ndef Xform "Ref" { prepend references = @file.usda@</Parent/Child> }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Parent",
          path: "/Parent",
          startIndex: 0,
          endIndex: 43,
          children: [
            {
              name: "Child",
              path: "/Parent/Child",
              startIndex: 21,
              endIndex: 41,
              children: [],
            },
          ],
        },
      ]);

      const result = renamePrimInFile(fileContent, "/Parent/Child", "NewChild");

      expect(result.content).toContain("@file.usda@</Parent/NewChild>");
    });

    it("should handle prim with missing indices", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation();
      const fileContent = 'def Xform "Prim" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: undefined,
          endIndex: undefined,
          children: [],
        },
      ]);

      const result = renamePrimInFile(fileContent, "/Prim", "NewName");

      expect(result.content).toBe(fileContent);
      expect(result.newPath).toBe("/Prim");
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should return original when def regex doesn't match", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation();
      const fileContent = 'invalid syntax "Prim" { }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Prim",
          path: "/Prim",
          startIndex: 0,
          endIndex: 24,
          children: [],
        },
      ]);

      const result = renamePrimInFile(fileContent, "/Prim", "NewName");

      expect(result.content).toBe(fileContent);
      expect(result.newPath).toBe("/Prim");
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain(
        "Could not find prim definition"
      );
    });

    it("should escape special characters in path for reference regex", () => {
      const fileContent =
        'def Xform "Test.Old" { }\ndef Xform "Ref" { prepend references = @file.usda@</Test.Old> }';

      USDA_PARSER.getPrimHierarchy.mockReturnValue([
        {
          name: "Test.Old",
          path: "/Test.Old",
          startIndex: 0,
          endIndex: 23,
          children: [],
        },
      ]);

      const result = renamePrimInFile(fileContent, "/Test.Old", "TestNew");

      expect(result.content).toContain('"TestNew"');
      expect(result.content).toContain("@file.usda@</TestNew>");
    });
  });
});
