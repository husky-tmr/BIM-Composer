// src/core/state/helpers.js
// Helper functions for state reducer operations

/**
 * Updates a prim in the hierarchy tree
 * @param {Array} hierarchy - The prim hierarchy
 * @param {string} primPath - Path to the prim
 * @param {Object} updates - Properties to update
 * @returns {Array} Updated hierarchy
 */
export function updatePrimInHierarchy(hierarchy, primPath, updates) {
  if (!hierarchy || !Array.isArray(hierarchy)) {
    return hierarchy;
  }

  // Recursive search and update
  return hierarchy.map((prim) => {
    if (prim.path === primPath) {
      return { ...prim, ...updates };
    }
    if (prim.children && prim.children.length > 0) {
      return {
        ...prim,
        children: updatePrimInHierarchy(prim.children, primPath, updates),
      };
    }
    return prim;
  });
}

/**
 * Adds a prim to the hierarchy at the specified parent path
 * @param {Array} hierarchy - The prim hierarchy
 * @param {string} parentPath - Parent prim path (or null for root)
 * @param {Object} primData - New prim data
 * @returns {Array} Updated hierarchy
 */
export function addPrimToHierarchy(hierarchy, parentPath, primData) {
  if (!hierarchy || !Array.isArray(hierarchy)) {
    return [primData];
  }

  // If no parent path, add to root
  if (!parentPath || parentPath === "/") {
    return [...hierarchy, primData];
  }

  // Find parent and add as child
  return hierarchy.map((prim) => {
    if (prim.path === parentPath) {
      const children = prim.children || [];
      return {
        ...prim,
        children: [...children, primData],
      };
    }
    if (prim.children && prim.children.length > 0) {
      return {
        ...prim,
        children: addPrimToHierarchy(prim.children, parentPath, primData),
      };
    }
    return prim;
  });
}

/**
 * Removes a prim from the hierarchy
 * @param {Array} hierarchy - The prim hierarchy
 * @param {string} primPath - Path to prim to remove
 * @returns {Array} Updated hierarchy
 */
export function removePrimFromHierarchy(hierarchy, primPath) {
  if (!hierarchy || !Array.isArray(hierarchy)) {
    return hierarchy;
  }

  // Filter out the prim at root level or recurse into children
  return hierarchy
    .filter((prim) => prim.path !== primPath)
    .map((prim) => {
      if (prim.children && prim.children.length > 0) {
        return {
          ...prim,
          children: removePrimFromHierarchy(prim.children, primPath),
        };
      }
      return prim;
    });
}

/**
 * Generates a unique ID for changes/commits
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
