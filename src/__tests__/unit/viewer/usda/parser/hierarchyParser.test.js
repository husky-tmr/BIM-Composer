import { parsePrimTree } from "../../../../../viewer/usda/parser/hierarchyParser.js";

describe("Hierarchy Parser (Regex Tests)", () => {
  it("should parse simple references correctly", () => {
    const usda = `
def Scope "SimpleRef" {
    prepend references = @file.usda@
}`;
    const prims = parsePrimTree(usda);
    expect(prims).toHaveLength(1);
    expect(prims[0].references).toBe("@file.usda@");
  });

  it("should parse references with prim path suffix (Fix for rendering bug)", () => {
    const usda = `
def Scope "ComplexRef" {
    prepend references = @file.usda@</PrimName>
}`;
    const prims = parsePrimTree(usda);
    expect(prims).toHaveLength(1);
    // This was failing before the fix (it would be @file.usda@)
    expect(prims[0].references).toBe("@file.usda@</PrimName>");
  });

  it("should parse references with deep paths", () => {
    const usda = `
def Scope "DeepRef" {
    prepend references = @path/to/asset.usda@</Root/Child/Grandchild>
}`;
    const prims = parsePrimTree(usda);
    expect(prims).toHaveLength(1);
    expect(prims[0].references).toBe(
      "@path/to/asset.usda@</Root/Child/Grandchild>"
    );
  });

  it("should handle references in metadata vs inner content", () => {
    const usdaInner = `
def Scope "InnerRef" {
    string prop = "val"
    prepend references = @file.usda@</Prim>
}`;
    const prims = parsePrimTree(usdaInner);
    expect(prims[0].references).toBe("@file.usda@</Prim>");
  });
});
