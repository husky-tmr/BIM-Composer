// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import { initModal } from "./modalController";
// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import { store } from "../core/index.js";
// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import * as USDA_PARSER from "../viewer/usda/usdaParser.js";

// Mock dependencies
vi.mock("../core/index.js", () => ({
  store: {
    getState: vi.fn(),
    dispatch: vi.fn(),
    subscribe: vi.fn(),
  },
  errorHandler: {
    wrap: (fn) => fn,
    wrapAsync: (fn) => fn,
  },
  ValidationError: class extends Error {},
  FileError: class extends Error {},
  ParseError: class extends Error {},
}));

vi.mock("../viewer/usda/usdaParser.js", () => ({
  USDA_PARSER: {
    getPrimHierarchy: vi.fn(),
  },
}));

vi.mock("./staging/primStaging.js", () => ({
  stagePrims: vi.fn(),
}));

describe("modalController", () => {
  let availablePrimsList;
  let stagePrimsList;

  beforeEach(() => {
    // Setup DOM elements
    document.body.innerHTML = `
      <div id="prim-selection-modal" style="display: none;">
        <div class="modal-header"><h2></h2></div>
        <ul id="available-prims-list"></ul>
        <ul id="stage-prims-list"></ul>
        <button id="add-prim-to-stage">></button>
        <button id="remove-prim-from-stage"><</button>
        <button id="add-all-prims-to-stage">>></button>
        <button id="remove-all-prims-from-stage"><<</button>
        <button id="save-hierarchy-button">Save</button>
        <button id="close-modal-button">Close</button>
      </div>
    `;

    availablePrimsList = document.getElementById("available-prims-list");
    stagePrimsList = document.getElementById("stage-prims-list");

    // Initialize controller
    initModal(vi.fn());
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("should move multiple pre-selected objects to stage list when opening modal", async () => {
    const fileName = "test.usda";
    const preSelectedPaths = ["/World/Cube", "/World/Sphere"];

    // Mock store state
    store.getState.mockReturnValue({
      loadedFiles: {
        [fileName]: "some content",
      },
      stage: {
        layerStack: [],
      },
    });

    // Mock parser result
    USDA_PARSER.USDA_PARSER.getPrimHierarchy.mockReturnValue([
      {
        path: "/World",
        name: "World",
        type: "Xform",
        children: [
          { path: "/World/Cube", name: "Cube", type: "Mesh", properties: {} },
          {
            path: "/World/Sphere",
            name: "Sphere",
            type: "Mesh",
            properties: {},
          },
          { path: "/World/Cone", name: "Cone", type: "Mesh", properties: {} },
        ],
        properties: {},
      },
    ]);

    // Dispatch event to open modal
    const event = new CustomEvent("openPrimModal", {
      detail: {
        fileName,
        mode: "normal",
        preSelectedPaths,
      },
    });
    document.dispatchEvent(event);

    // Wait for async operations (buildTreeUI uses requestAnimationFrame/Promises)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check directly if items are in the stage list
    // The implementation should move them from available to stage

    // Helper to find li by data-prim-path
    const findInList = (list, path) => {
      // Logic in controller might nest them or flatten them depending on implementation
      // But typically it moves the LI element.
      // Let's check if the text content or dataset exists in the stage list
      const items = list.querySelectorAll("li");
      for (const item of items) {
        if (item.dataset.primPath === path) return item;
      }
      return null;
    };

    const cubeInStage = findInList(stagePrimsList, "/World/Cube");
    const sphereInStage = findInList(stagePrimsList, "/World/Sphere");
    const coneInAvailable = findInList(availablePrimsList, "/World/Cone");

    expect(cubeInStage).not.toBeNull();
    expect(sphereInStage).not.toBeNull();
    // Expect Cone to still be in available
    expect(coneInAvailable).not.toBeNull();

    // Also verify they are NOT in available anymore (moveSelected moves them)
    const cubeInAvailable = findInList(availablePrimsList, "/World/Cube");
    expect(cubeInAvailable).toBeNull();
  });
});
