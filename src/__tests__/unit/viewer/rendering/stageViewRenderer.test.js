import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderStageView } from "../../../../viewer/rendering/stageViewRenderer.js";
import * as THREE from "three";

// Mock dependencies
vi.mock("../../../../components/outlinerController.js", () => ({
  buildStageOutliner: vi.fn(),
}));

vi.mock("../../../../viewer/spatialHash.js", () => ({
  SpatialHash: class {
    constructor() {}
    insert() {}
    getDebugVisuals() { return new THREE.Group(); }
  },
}));

vi.mock("../../../../utils/statusUtils.js", () => ({
  resolvePrimStatus: vi.fn(),
  getStatusColor: vi.fn(),
}));

describe("Stage View Renderer", () => {
  let mockScene;
  let mockState;
  
  beforeEach(() => {
    mockScene = {
      meshesGroup: {
        children: [],
        remove: vi.fn(),
        add: vi.fn((mesh) => mockScene.meshesGroup.children.push(mesh)),
      },
      scene: {
        getObjectByName: vi.fn(),
        remove: vi.fn(),
        add: vi.fn(),
      },
      selectionController: {
        clearSelection: vi.fn(),
      },
      parser: {
        parseUSDA: vi.fn(),
      },
      outlinerEl: { innerHTML: "" },
      _viewType: "history",
    };

    mockState = {
      composedHierarchy: [],
      loadedFiles: {},
      stage: {
        layerStack: [],
        colorizeByStatus: false,
      },
    };
  });

  it("should resolve geometry from geometryCache using exact path", () => {
    const prim = {
      path: "/Cube",
      type: "Mesh",
      properties: {},
    };
    mockState.composedHierarchy = [prim];
    
    // Mock cache population
    mockState.loadedFiles = { "test.usda": "def Mesh \"Cube\" {}" };
    // Mocks return a list of geometries
    mockScene.parser.parseUSDA.mockReturnValue([{
      name: "Cube", // Cache key will be /Cube
      geometry: new THREE.BoxGeometry(),
      type: "Mesh"
    }]);

    renderStageView(mockScene, mockState);

    expect(mockScene.meshesGroup.children).toHaveLength(1);
    expect(mockScene.meshesGroup.children[0].name).toBe("Cube");
  });

  it("should resolve geometry from references if direct path fails", () => {
    // This prim has a path that doesn't match the cache, but a reference that does
    const prim = {
      path: "/RenamedCube",
      type: "Mesh",
      references: "@file.usda@</OriginalCube>",
      properties: {},
    };
    mockState.composedHierarchy = [prim];
    mockState.loadedFiles = { "test.usda": "def Mesh \"OriginalCube\" {}" };

    // Mock cache with OriginalCube
    mockScene.parser.parseUSDA.mockReturnValue([{
      name: "OriginalCube", // Cache key /OriginalCube
      geometry: new THREE.BoxGeometry(),
      type: "Mesh"
    }]);

    renderStageView(mockScene, mockState);

    expect(mockScene.meshesGroup.children).toHaveLength(1);
    expect(mockScene.meshesGroup.children[0].userData.primPath).toBe("/RenamedCube");
    expect(mockScene.meshesGroup.children[0].name).toBe("OriginalCube");
  });

  it("should render Entity Placeholder as transparent green box", () => {
    // Placeholder has no geometry in cache, but entityType="placeholder"
    const prim = {
      path: "/Placeholder",
      type: "Cube",
      customData: { isWireframe: true },
      properties: {
        entityType: "placeholder",
        opacity: "0.1"
      }
    };
    mockState.composedHierarchy = [prim];
    
    // Empty cache
    mockScene.parser.parseUSDA.mockReturnValue([]);

    renderStageView(mockScene, mockState);

    expect(mockScene.meshesGroup.children).toHaveLength(1);
    const mesh = mockScene.meshesGroup.children[0];
    
    expect(mesh.material.transparent).toBe(true);
    expect(mesh.material.opacity).toBe(0.1);
    // Color should be green (0x8fff8f)
    expect(mesh.material.color.getHexString()).toBe("8fff8f");
  });
});
