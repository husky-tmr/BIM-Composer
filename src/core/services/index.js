/**
 * Service Layer - Central export
 *
 * Services contain pure business logic separated from UI concerns.
 * They can be:
 * - Tested independently
 * - Reused across components
 * - Modified without affecting UI
 */

export { LayerService, layerService } from "./LayerService.js";
export { PrimService, primService } from "./PrimService.js";

/**
 * Service registry for dependency injection (optional)
 */
export const services = {
  layer: null,
  prim: null,

  /**
   * Initialize services
   */
  async init() {
    const { layerService } = await import("./LayerService.js");
    const { primService } = await import("./PrimService.js");

    this.layer = layerService;
    this.prim = primService;

    return this;
  },

  /**
   * Get service by name
   */
  get(name) {
    if (!this[name]) {
      throw new Error(`Service "${name}" not found`);
    }
    return this[name];
  },
};
