// src/viewer/ifc/ifcParser.js
import * as WebIFC from "web-ifc";

/**
 * IFC Parser Module
 * Loads and parses IFC files using web-ifc WASM library
 */
export class IFCParser {
  constructor() {
    this.ifcAPI = null;
    this.initialized = false;
  }

  /**
   * Initialize the web-ifc API
   */
  async init() {
    if (this.initialized) return;

    this.ifcAPI = new WebIFC.IfcAPI();

    // Set WASM path - Use CDN for reliable cross-platform support
    // This avoids build complexity and ensures WASM files are always available
    this.ifcAPI.SetWasmPath("https://cdn.jsdelivr.net/npm/web-ifc@0.0.66/");

    await this.ifcAPI.Init();
    this.initialized = true;

    console.log("[IFCParser] web-ifc initialized successfully");
  }

  /**
   * Load an IFC file from ArrayBuffer or File
   * @param {ArrayBuffer|File} fileData - IFC file data
   * @returns {number} - Model ID
   */
  async loadIFC(fileData) {
    if (!this.initialized) {
      await this.init();
    }

    let data;
    if (fileData instanceof File) {
      data = await fileData.arrayBuffer();
    } else {
      data = fileData;
    }

    const uint8Array = new Uint8Array(data);
    const modelID = this.ifcAPI.OpenModel(uint8Array);

    console.log(`[IFCParser] IFC model loaded. Model ID: ${modelID}`);
    return modelID;
  }

  /**
   * Get all entities of a specific IFC type
   * @param {number} modelID - Model ID
   * @param {number} ifcType - IFC type constant (e.g., IFCWALL)
   * @returns {Array} - Array of entity IDs
   */
  getAllEntitiesOfType(modelID, ifcType) {
    return this.ifcAPI.GetLineIDsWithType(modelID, ifcType);
  }

  /**
   * Get entity properties by ID
   * @param {number} modelID - Model ID
   * @param {number} entityID - Entity ID
   * @returns {Object} - Entity properties
   */
  getEntityProperties(modelID, entityID) {
    return this.ifcAPI.GetLine(modelID, entityID);
  }

  /**
   * Get geometry for an entity
   * @param {number} modelID - Model ID
   * @param {number} entityID - Entity ID
   * @returns {Object} - Geometry data
   */
  getGeometry(modelID, entityID) {
    return this.ifcAPI.GetGeometry(modelID, entityID);
  }

  /**
   * Get all property sets for an entity
   * @param {number} modelID - Model ID
   * @param {number} entityID - Entity ID
   * @param {boolean} recursive - Whether to get nested properties
   * @returns {Array} - Property sets
   */
  getPropertySets(modelID, entityID, recursive = true) {
    // web-ifc doesn't have GetPropertySets, build it manually
    try {
      const propertySets = [];

      // Find IFCRELDEFINESBYPROPERTIES relationships
      const relDefinesByProps = this.ifcAPI.GetLineIDsWithType(
        modelID,
        WebIFC.IFCRELDEFINESBYPROPERTIES
      );

      for (let i = 0; i < relDefinesByProps.size(); i++) {
        const relID = relDefinesByProps.get(i);
        const rel = this.ifcAPI.GetLine(modelID, relID);

        // Check if this relationship relates to our entity
        if (rel.RelatedObjects) {
          const relatedObjects = Array.isArray(rel.RelatedObjects)
            ? rel.RelatedObjects
            : [rel.RelatedObjects];

          const isRelated = relatedObjects.some(
            (obj) => obj && obj.value === entityID
          );

          if (isRelated && rel.RelatingPropertyDefinition) {
            const propSetID = rel.RelatingPropertyDefinition.value;
            const propSet = this.ifcAPI.GetLine(modelID, propSetID, recursive);
            propertySets.push(propSet);
          }
        }
      }

      return propertySets;
    } catch (e) {
      console.warn(`[IFCParser] Error getting property sets: ${e.message}`);
      return [];
    }
  }

  /**
   * Get spatial structure (Site, Building, Storey hierarchy)
   * @param {number} modelID - Model ID
   * @returns {Object} - Spatial tree
   */
  getSpatialStructure(modelID) {
    // web-ifc doesn't have GetSpatialStructure, so we build it manually

    // Find the project (root element)
    const projects = this.ifcAPI.GetLineIDsWithType(modelID, WebIFC.IFCPROJECT);
    if (!projects || projects.size() === 0) {
      console.warn("[IFCParser] No IFCPROJECT found in model");
      return null;
    }

    const projectID = projects.get(0);
    const project = this.ifcAPI.GetLine(modelID, projectID);

    // Build the tree recursively using IFCRELAGGREGATES relationships
    const buildTree = (elementID) => {
      const element = this.ifcAPI.GetLine(modelID, elementID);
      const node = {
        expressID: elementID,
        type: element.type || element.constructor.name,
        children: [],
      };

      // Find all IFCRELAGGREGATES relationships where this element is the parent
      const allRelAggregates = this.ifcAPI.GetLineIDsWithType(
        modelID,
        WebIFC.IFCRELAGGREGATES
      );

      for (let i = 0; i < allRelAggregates.size(); i++) {
        const relID = allRelAggregates.get(i);
        const rel = this.ifcAPI.GetLine(modelID, relID);

        // Check if this relationship's RelatingObject matches our element
        if (rel.RelatingObject && rel.RelatingObject.value === elementID) {
          // Add all related objects as children
          if (rel.RelatedObjects) {
            const relatedObjects = Array.isArray(rel.RelatedObjects)
              ? rel.RelatedObjects
              : [rel.RelatedObjects];

            relatedObjects.forEach((obj) => {
              if (obj && obj.value) {
                node.children.push(buildTree(obj.value));
              }
            });
          }
        }
      }

      return node;
    };

    return buildTree(projectID);
  }

  /**
   * Get type properties for an entity
   * @param {number} modelID - Model ID
   * @param {number} entityID - Entity ID
   * @returns {Object} - Type properties
   */
  getTypeProperties(modelID, entityID) {
    // web-ifc doesn't have GetTypeProperties, build it manually
    try {
      // Find IFCRELDEFINESBYTYPE relationships
      const relDefinesByType = this.ifcAPI.GetLineIDsWithType(
        modelID,
        WebIFC.IFCRELDEFINESBYTYPE
      );

      for (let i = 0; i < relDefinesByType.size(); i++) {
        const relID = relDefinesByType.get(i);
        const rel = this.ifcAPI.GetLine(modelID, relID);

        // Check if this relationship relates to our entity
        if (rel.RelatedObjects) {
          const relatedObjects = Array.isArray(rel.RelatedObjects)
            ? rel.RelatedObjects
            : [rel.RelatedObjects];

          const isRelated = relatedObjects.some(
            (obj) => obj && obj.value === entityID
          );

          if (isRelated && rel.RelatingType) {
            const typeID = rel.RelatingType.value;
            return this.ifcAPI.GetLine(modelID, typeID);
          }
        }
      }

      return null;
    } catch (e) {
      console.warn(`[IFCParser] Error getting type properties: ${e.message}`);
      return null;
    }
  }

  /**
   * Get all materials for an entity
   * @param {number} modelID - Model ID
   * @param {number} entityID - Entity ID
   * @returns {Array} - Materials
   */
  getMaterials(modelID, entityID) {
    // web-ifc doesn't have GetMaterials, build it manually
    try {
      const materials = [];

      // Find IFCRELASSOCIATESMATERIAL relationships
      const relAssociatesMaterial = this.ifcAPI.GetLineIDsWithType(
        modelID,
        WebIFC.IFCRELASSOCIATESMATERIAL
      );

      for (let i = 0; i < relAssociatesMaterial.size(); i++) {
        const relID = relAssociatesMaterial.get(i);
        const rel = this.ifcAPI.GetLine(modelID, relID);

        // Check if this relationship relates to our entity
        if (rel.RelatedObjects) {
          const relatedObjects = Array.isArray(rel.RelatedObjects)
            ? rel.RelatedObjects
            : [rel.RelatedObjects];

          const isRelated = relatedObjects.some(
            (obj) => obj && obj.value === entityID
          );

          if (isRelated && rel.RelatingMaterial) {
            const materialID = rel.RelatingMaterial.value;
            const material = this.ifcAPI.GetLine(modelID, materialID);
            materials.push(material);
          }
        }
      }

      return materials;
    } catch (e) {
      console.warn(`[IFCParser] Error getting materials: ${e.message}`);
      return [];
    }
  }

  /**
   * Close a loaded model
   * @param {number} modelID - Model ID
   */
  closeModel(modelID) {
    if (this.ifcAPI && modelID !== undefined) {
      this.ifcAPI.CloseModel(modelID);
    }
  }

  /**
   * Dispose the IFC API
   */
  dispose() {
    if (this.ifcAPI) {
      this.ifcAPI = null;
      this.initialized = false;
    }
  }

  /**
   * Get all entity IDs in the model
   * @param {number} modelID - Model ID
   * @returns {Array} - All entity IDs
   */
  getAllEntities(modelID) {
    const allLines = this.ifcAPI.GetAllLines(modelID);
    return allLines;
  }

  /**
   * Get IFC type name from type constant
   * @param {number} typeID - IFC type ID
   * @returns {string} - Type name
   */
  getTypeName(typeID) {
    // Use web-ifc constants to map IDs to names
    for (const [key, value] of Object.entries(WebIFC)) {
      if (value === typeID && key.startsWith("IFC")) {
        return key;
      }
    }
    return `UNKNOWN_TYPE_${typeID}`;
  }
}

// Create singleton instance
export const ifcParser = new IFCParser();

// Export web-ifc constants for use in converter
export { WebIFC };
