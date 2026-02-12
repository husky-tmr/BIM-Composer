// src/utils/primHelpers.js
// Reusable utility functions for working with prims

/**
 * Finds a prim in the hierarchy by its path
 * @param {Array} prims - The hierarchy to search
 * @param {string} path - The prim path (e.g., "/Root/Child")
 * @returns {Object|null} The prim object or null if not found
 */
export function findPrimByPath(prims, path) {
  if (!prims || !Array.isArray(prims)) return null;

  for (const prim of prims) {
    if (prim.path === path) return prim;
    if (prim.children) {
      const found = findPrimByPath(prim.children, path);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Validates a prim name according to USD naming rules
 * @param {string} name - The name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validatePrimName(name) {
  if (!name || typeof name !== "string") return false;
  // USD naming: must start with letter or underscore, followed by letters, numbers, or underscores
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Calculates the new path for a renamed prim
 * @param {string} oldPath - The current prim path
 * @param {string} newName - The new name for the prim
 * @returns {string} The new path
 */
export function calculateNewPath(oldPath, newName) {
  const parts = oldPath.split("/");
  parts[parts.length - 1] = newName;
  return parts.join("/");
}

/**
 * Gets the parent path from a prim path
 * @param {string} path - The prim path
 * @returns {string} The parent path, or empty string if root
 */
export function getParentPath(path) {
  const parts = path.split("/").filter((p) => p);
  if (parts.length <= 1) return "";
  parts.pop();
  return "/" + parts.join("/");
}

/**
 * Gets the name (last segment) from a prim path
 * @param {string} path - The prim path
 * @returns {string} The prim name
 */
export function getPrimName(path) {
  const parts = path.split("/").filter((p) => p);
  return parts[parts.length - 1] || "";
}

/**
 * Collects all prim paths from a hierarchy
 * @param {Array} hierarchy - The hierarchy to traverse
 * @returns {Array<string>} Array of all prim paths
 */
export function getAllPrimPaths(hierarchy) {
  const paths = [];

  function traverse(prims) {
    if (!prims) return;
    for (const prim of prims) {
      paths.push(prim.path);
      if (prim.children) {
        traverse(prim.children);
      }
    }
  }

  traverse(hierarchy);
  return paths;
}

/**
 * Checks if a path is a descendant of another path
 * @param {string} childPath - The potential child path
 * @param {string} parentPath - The potential parent path
 * @returns {boolean} True if childPath is under parentPath
 */
export function isDescendantOf(childPath, parentPath) {
  return childPath.startsWith(parentPath + "/");
}

/**
 * Updates a prim path after a parent rename
 * @param {string} primPath - The prim's current path
 * @param {string} oldParentPath - The old parent path
 * @param {string} newParentPath - The new parent path
 * @returns {string} The updated path
 */
export function updatePathAfterParentRename(
  primPath,
  oldParentPath,
  newParentPath
) {
  if (primPath === oldParentPath) {
    return newParentPath;
  }
  if (primPath.startsWith(oldParentPath + "/")) {
    return primPath.replace(oldParentPath, newParentPath);
  }
  return primPath;
}
