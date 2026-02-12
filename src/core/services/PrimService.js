/**
 * Prim Service - Business logic for prim operations
 */

import { ValidationError } from "../errors/errors.js";

export class PrimService {
  /**
   * Validate prim path for correctness
   * Checks that path starts with '/' and contains no invalid characters
   *
   * @param {string} path - The prim path to validate (e.g., "/World/Character")
   * @returns {boolean} True if validation passes
   * @throws {ValidationError} If path is invalid or contains forbidden characters
   * @example
   * primService.validatePrimPath('/World/Character'); // Returns: true
   */
  validatePrimPath(path) {
    if (!path) {
      throw new ValidationError("Prim path is required", "path", path);
    }

    if (!path.startsWith("/")) {
      throw new ValidationError("Prim path must start with /", "path", path);
    }

    // Check for invalid characters
    const invalidChars = ["<", ">", '"', "|", "?", "*"];
    for (const char of invalidChars) {
      if (path.includes(char)) {
        throw new ValidationError(
          `Prim path contains invalid character: ${char}`,
          "path",
          path
        );
      }
    }

    return true;
  }

  /**
   * Normalize prim path by removing trailing/duplicate slashes and ensuring leading slash
   *
   * @param {string} path - The path to normalize
   * @returns {string} Normalized path
   * @example
   * primService.normalizePrimPath('World/Character/'); // Returns: "/World/Character"
   * primService.normalizePrimPath('//World///Character'); // Returns: "/World/Character"
   */
  normalizePrimPath(path) {
    // Remove trailing slashes
    path = path.replace(/\/+$/, "");

    // Remove duplicate slashes
    path = path.replace(/\/+/g, "/");

    // Ensure starts with /
    if (!path.startsWith("/")) {
      path = "/" + path;
    }

    return path;
  }

  /**
   * Get parent path from a prim path
   * Returns null for root path, '/' for top-level prims
   *
   * @param {string} path - The prim path (e.g., "/World/Character/Mesh")
   * @returns {string|null} Parent path or null if path is root
   * @throws {ValidationError} If path is invalid
   * @example
   * primService.getParentPath('/World/Character/Mesh'); // Returns: "/World/Character"
   * primService.getParentPath('/World'); // Returns: "/"
   * primService.getParentPath('/'); // Returns: null
   */
  getParentPath(path) {
    this.validatePrimPath(path);

    if (path === "/") {
      return null; // Root has no parent
    }

    const lastSlash = path.lastIndexOf("/");
    return lastSlash === 0 ? "/" : path.substring(0, lastSlash);
  }

  /**
   * Get prim name (last segment) from a prim path
   *
   * @param {string} path - The prim path (e.g., "/World/Character")
   * @returns {string} The prim name (e.g., "Character") or "Root" for root path
   * @throws {ValidationError} If path is invalid
   * @example
   * primService.getPrimName('/World/Character'); // Returns: "Character"
   * primService.getPrimName('/'); // Returns: "Root"
   */
  getPrimName(path) {
    this.validatePrimPath(path);

    if (path === "/") {
      return "Root";
    }

    const lastSlash = path.lastIndexOf("/");
    return path.substring(lastSlash + 1);
  }

  /**
   * Join paths
   */
  joinPaths(...paths) {
    const joined = paths
      .filter((p) => p)
      .map((p) => p.replace(/^\/+|\/+$/g, ""))
      .join("/");

    return "/" + joined;
  }

  /**
   * Create a new prim with the specified path, type, and properties
   *
   * @param {string} path - The prim path (e.g., "/World/Character")
   * @param {string} [type='Xform'] - The prim type (e.g., 'Xform', 'Mesh', 'Sphere')
   * @param {Object} [properties={}] - Initial properties for the prim
   * @returns {Object} New prim object with path, type, properties, children, and metadata
   * @throws {ValidationError} If path is invalid
   * @example
   * const prim = primService.createPrim('/World/Sphere', 'Sphere', { radius: 1.0 });
   * // Returns: { path: "/World/Sphere", type: "Sphere", properties: { radius: 1.0 }, ... }
   */
  createPrim(path, type = "Xform", properties = {}) {
    this.validatePrimPath(path);

    return {
      path: this.normalizePrimPath(path),
      type,
      properties: { ...properties },
      children: [],
      metadata: {
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      },
    };
  }

  /**
   * Update prim properties with new values
   * Merges updates into existing properties and updates modifiedAt timestamp
   *
   * @param {Object} prim - The prim to update
   * @param {Object} updates - Properties to add or update (e.g., { radius: 2.0 })
   * @returns {Object} New prim object with merged properties
   * @example
   * const updated = primService.updatePrimProperties(prim, { radius: 2.0 });
   */
  updatePrimProperties(prim, updates) {
    return {
      ...prim,
      properties: {
        ...prim.properties,
        ...updates,
      },
      metadata: {
        ...prim.metadata,
        modifiedAt: Date.now(),
      },
    };
  }

  /**
   * Find prim by path in a prim hierarchy tree
   * Performs recursive depth-first search
   *
   * @param {Array<Object>} hierarchy - Array of root-level prims with nested children
   * @param {string} path - The prim path to find (e.g., "/World/Character")
   * @returns {Object|null} The prim object if found, null otherwise
   * @example
   * const prim = primService.findPrimByPath(hierarchy, '/World/Character');
   * // Returns: { path: "/World/Character", type: "Xform", ... } or null
   */
  findPrimByPath(hierarchy, path) {
    const normalizedPath = this.normalizePrimPath(path);

    const search = (prims) => {
      for (const prim of prims) {
        if (prim.path === normalizedPath) {
          return prim;
        }

        if (prim.children && prim.children.length > 0) {
          const found = search(prim.children);
          if (found) return found;
        }
      }
      return null;
    };

    return search(hierarchy);
  }

  /**
   * Get all descendants of a prim
   */
  getDescendants(prim) {
    const descendants = [];

    const traverse = (node) => {
      if (node.children) {
        for (const child of node.children) {
          descendants.push(child);
          traverse(child);
        }
      }
    };

    traverse(prim);
    return descendants;
  }

  /**
   * Get prim depth in hierarchy
   */
  getPrimDepth(path) {
    this.validatePrimPath(path);

    if (path === "/") {
      return 0;
    }

    return path.split("/").filter((p) => p).length;
  }

  /**
   * Check if path is ancestor of another
   */
  isAncestor(ancestorPath, descendantPath) {
    if (ancestorPath === descendantPath) {
      return false;
    }

    return descendantPath.startsWith(ancestorPath + "/");
  }

  /**
   * Build prim path map for fast O(1) lookup by path
   * Traverses hierarchy and creates a Map with path as key and prim as value
   *
   * @param {Array<Object>} hierarchy - Array of root-level prims with nested children
   * @returns {Map<string, Object>} Map of prim paths to prim objects
   * @example
   * const primMap = primService.buildPrimMap(hierarchy);
   * const prim = primMap.get('/World/Character'); // Fast O(1) lookup
   */
  buildPrimMap(hierarchy) {
    const map = new Map();

    const traverse = (prims) => {
      for (const prim of prims) {
        map.set(prim.path, prim);

        if (prim.children) {
          traverse(prim.children);
        }
      }
    };

    traverse(hierarchy);
    return map;
  }

  /**
   * Get display name for prim
   */
  getDisplayName(prim) {
    if (prim.properties && prim.properties.displayName) {
      return prim.properties.displayName;
    }

    return this.getPrimName(prim.path);
  }

  /**
   * Set display name for prim
   */
  setDisplayName(prim, displayName) {
    return this.updatePrimProperties(prim, { displayName });
  }

  /**
   * Clone prim (deep copy)
   */
  clonePrim(prim, newPath) {
    this.validatePrimPath(newPath);

    const cloned = JSON.parse(JSON.stringify(prim));
    cloned.path = this.normalizePrimPath(newPath);
    cloned.metadata = {
      ...cloned.metadata,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };

    return cloned;
  }

  /**
   * Merge prim properties for layer composition
   * Applies overridePrim properties on top of basePrim properties
   *
   * @param {Object} basePrim - The base prim (lower layer)
   * @param {Object} overridePrim - The override prim (higher layer)
   * @returns {Object} Merged prim with combined properties
   * @example
   * const merged = primService.mergePrims(basePrim, overridePrim);
   * // Override properties take precedence over base properties
   */
  mergePrims(basePrim, overridePrim) {
    return {
      ...basePrim,
      properties: {
        ...basePrim.properties,
        ...overridePrim.properties,
      },
      metadata: {
        ...basePrim.metadata,
        ...overridePrim.metadata,
        modifiedAt: Date.now(),
      },
    };
  }

  /**
   * Filter prims by type
   */
  filterPrimsByType(hierarchy, type) {
    const results = [];

    const traverse = (prims) => {
      for (const prim of prims) {
        if (prim.type === type) {
          results.push(prim);
        }

        if (prim.children) {
          traverse(prim.children);
        }
      }
    };

    traverse(hierarchy);
    return results;
  }

  /**
   * Count prims in hierarchy
   */
  countPrims(hierarchy) {
    let count = 0;

    const traverse = (prims) => {
      count += prims.length;
      for (const prim of prims) {
        if (prim.children) {
          traverse(prim.children);
        }
      }
    };

    traverse(hierarchy);
    return count;
  }
}

// Export singleton instance
export const primService = new PrimService();
