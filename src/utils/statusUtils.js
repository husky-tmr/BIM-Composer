// src/utils/statusUtils.js

export const STATUS_COLORS = {
  WIP: 0xffa500, // Vibrant Orange
  Shared: 0x007aff, // Vibrant Blue
  Published: 0x28a745, // Vibrant Green
  Archived: 0x808080, // Gray
};

export const STATUS_HEX_COLORS = {
  WIP: "#ffa500",
  Shared: "#007aff",
  Published: "#28a745",
  Archived: "#808080",
};

/**
 * Resolves the effective status of a prim.
 * Under the "Active State Management" strategy, the prim.properties.status
 * should ALWAYS be the source of truth if it exists.
 * If strictly missing, we fallback to "Published" or Layer Status as safety net,
 * but ideally the data model should have been updated to be explicit.
 *
 * @param {Object} prim - The prim object
 * @param {Array} layerStack - The current layer stack (optional context)
 * @returns {string} The effective status string
 */
export function resolvePrimStatus(prim, layerStack = []) {
  // 1. Local Property (Source of Truth)
  if (prim.properties && prim.properties.status) {
    return prim.properties.status;
  }

  // 2. Fallback: Source Layer (if prim status is missing for some reason)
  if (prim._sourceFile && layerStack.length > 0) {
    const layer = layerStack.find((l) => l.filePath === prim._sourceFile);
    if (layer && layer.status) {
      return layer.status;
    }
  }

  // 3. Last Resort Default
  return "Published";
}

/**
 * Gets the color for a given status
 * @param {string} status
 * @returns {number} Hex integer color
 */
export function getStatusColor(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.Published;
}

/**
 * Gets the CSS hex string for a given status
 * @param {string} status
 * @returns {string} Hex string color
 */
export function getStatusCssColor(status) {
  return STATUS_HEX_COLORS[status] || STATUS_HEX_COLORS.Published;
}
