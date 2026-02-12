// src/viewer/usda/usdaMerger.js
import { USDA_PARSER } from "./usdaParser.js";

/**
 * Merges an override layer on top of a base layer.
 * @param {string} baseContent - The USDA content of the base layer.
 * @param {string} overrideContent - The USDA content of the override layer.
 * @returns {Array} An array of prim objects representing the new, merged hierarchy.
 */
export function mergeLayers(baseContent, overrideContent) {
  const baseHierarchy = USDA_PARSER.getPrimHierarchy(baseContent);
  const overrideHierarchy = USDA_PARSER.getPrimHierarchy(overrideContent);
  return mergeHierarchies(baseHierarchy, overrideHierarchy);
}

/**
 * Merges two prim hierarchy arrays using USD layer composition rules
 * Applies override properties on top of base properties, preserving source file metadata
 *
 * Algorithm:
 * 1. Maps all base hierarchy prims by path
 * 2. Applies override prims: merges properties for existing paths, adds new definitions
 * 3. Reconstructs parent-child relationships in the final tree
 * 4. Preserves _sourceFile metadata from override layer
 *
 * @param {Array<Object>} baseHierarchy - Base layer prim hierarchy (lower strength)
 * @param {Array<Object>} overrideHierarchy - Override layer prim hierarchy (higher strength)
 * @returns {Array<Object>} Merged prim hierarchy with composed properties
 * @example
 * const base = [{ path: '/World', properties: { status: 'Published' }, children: [] }];
 * const override = [{ path: '/World', properties: { status: 'WIP' }, children: [] }];
 * const merged = mergeHierarchies(base, override);
 * // Returns: [{ path: '/World', properties: { status: 'WIP' }, children: [] }]
 */
export function mergeHierarchies(baseHierarchy, overrideHierarchy) {
  const primsByPath = new Map();

  // 1. Map Base
  function mapPrims(prims) {
    prims.forEach((prim) => {
      // Clone to avoid mutating original state if needed,
      // but shallow copy of properties is usually enough for merging.
      // We create a new object structure to hold the merged result.
      const newPrim = {
        ...prim,
        children: [],
        properties: { ...prim.properties },
      };
      primsByPath.set(prim.path, newPrim);

      if (prim.children && prim.children.length > 0) {
        mapPrims(prim.children);
      }
    });
  }
  mapPrims(baseHierarchy);

  // 2. Apply Overrides
  function applyOverrides(sourcePrims) {
    sourcePrims.forEach((sourcePrim) => {
      const existingPrim = primsByPath.get(sourcePrim.path);

      if (existingPrim) {
        // Merge Properties
        Object.assign(existingPrim.properties, sourcePrim.properties);

        // CRITICAL: Preserve Source File info if the override has it
        if (sourcePrim._sourceFile) {
          existingPrim._sourceFile = sourcePrim._sourceFile;
        }

        // If overriding, ensure specifier is def if it was a def
        // (Simple logic: if base exists, we are merging into it)

        if (sourcePrim.children && sourcePrim.children.length > 0) {
          applyOverrides(sourcePrim.children);
        }
      } else {
        // New Definition
        const newPrim = {
          ...sourcePrim,
          children: [],
          properties: { ...sourcePrim.properties },
        };
        // Ensure specifier is 'def' for new roots in the composed stage
        newPrim.specifier = "def";

        primsByPath.set(newPrim.path, newPrim);

        if (sourcePrim.children && sourcePrim.children.length > 0) {
          // We need to recursively add these children to the map
          // so they can be looked up or parented correctly
          // However, simplified approach: traverse source children and add them
          // This recursive call handles deep structures
          applyOverrides(sourcePrim.children);
        }
      }
    });
  }
  applyOverrides(overrideHierarchy);

  // 3. Reconstruct Tree
  const finalHierarchy = [];
  primsByPath.forEach((prim) => {
    const pathSegments = prim.path.split("/").filter(Boolean);
    if (pathSegments.length > 1) {
      const parentPath = "/" + pathSegments.slice(0, -1).join("/");
      const parent = primsByPath.get(parentPath);
      if (parent) {
        // Check if already added to avoid duplicates from multiple merges
        if (!parent.children.includes(prim)) {
          parent.children.push(prim);
        }
      }
    } else {
      // Top-level
      finalHierarchy.push(prim);
    }
  });

  return finalHierarchy;
}
