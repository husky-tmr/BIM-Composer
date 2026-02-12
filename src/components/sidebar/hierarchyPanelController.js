import { store } from "../../core/index.js";
import { actions } from "../../state/actions.js";
import { recomposeStage } from "./layerStackController.js";
import { USDA_PARSER } from "../../viewer/usda/usdaParser.js";
import { composeLogPrim } from "../../viewer/usda/usdaComposer.js";
import { sha256 } from "js-sha256";

// Function to log deletion to statement.usda
function logDeletionToStatement(primNode, allRemainingPaths) {
  const entryNumber = actions.incrementLogEntryCounter();
  const state = store.getState();

  const fileContent = state.loadedFiles["statement.usda"] || "";
  const fileSize = new Blob([fileContent]).size;
  const contentHash = sha256(fileContent);
  const newId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const entityType = primNode.properties?.entityType || "Real Element";

  const logEntry = {
    ID: newId,
    Entry: entryNumber,
    Timestamp: new Date().toISOString(),
    "USD Reference Path": primNode.path,
    "File Name": primNode._sourceFile || "unknown",
    "Content Hash": contentHash,
    "File Size": fileSize,
    Type: "Deletion",
    User: state.currentUser,
    Status: "New",
    primName: primNode.name, // Add prim name for consistent log structure
    entityType: entityType,
    stagedPrims: allRemainingPaths,
    sourceStatus: primNode.properties?.status || "null",
    targetStatus: "null", // Deletion has no target status
    parent: state.headCommitId,
  };

  actions.setHeadCommitId(newId);

  const logPrimString = composeLogPrim(logEntry);
  const newContent = USDA_PARSER.appendToUsdaFile(
    state.loadedFiles["statement.usda"],
    logPrimString,
    "ChangeLog"
  );
  actions.updateLoadedFile("statement.usda", newContent);
}

export function initHierarchyPanel(updateView) {
  const outliner = document.getElementById("usdaOutliner");
  const expandAllButton = document.getElementById("expand-all-button");
  const collapseAllButton = document.getElementById("collapse-all-button");
  const addPrimButton = document.getElementById("add-prim-button");
  const removePrimButton = document.getElementById("remove-prim-button");

  addPrimButton.addEventListener("click", () => {
    // Don't automatically use selected item as parent
    // Let the modal determine the correct parent (defaultPrim or user-specified)
    // If user wants to add as child, they can manually fill the parent path field
    if (store.getState().isHistoryMode) {
      alert("Cannot edit hierarchy in History Mode.");
      return;
    }

    document.dispatchEvent(
      new CustomEvent("openReferenceModal", {
        detail: {
          primPath: null, // Signals "Add Mode"
          parentPath: null, // Let modal auto-detect defaultPrim
        },
      })
    );
  });

  removePrimButton.addEventListener("click", () => {
    const selectedItem = outliner.querySelector("li.selected");
    if (!selectedItem) {
      alert("Please select a prim to remove.");
      return;
    }

    // Validate that we have a composed hierarchy to work with
    const state = store.getState();
    if (state.isHistoryMode) {
      alert("Cannot edit hierarchy in History Mode.");
      return;
    }
    if (!state.composedHierarchy || state.composedHierarchy.length === 0) {
      alert("No prims in the stage to remove.");
      return;
    }

    // Find the actual prim node in our state to identify source file
    const primPath = selectedItem.dataset.primPath;

    if (!primPath) {
      alert("Invalid prim selection - no path found.");
      return;
    }

    // Recursive finder
    const findPrim = (list) => {
      if (!list || !Array.isArray(list)) return null;
      for (const p of list) {
        if (p.path === primPath) return p;
        if (p.children) {
          const f = findPrim(p.children);
          if (f) return f;
        }
      }
      return null;
    };

    const primNode = findPrim(state.composedHierarchy || []);

    if (!primNode) {
      alert("Prim not found in stage. The hierarchy may have changed.");
      return;
    }

    // Check ownership - only allow removing prims from user's own layers (UNLESS Project Manager)
    if (primNode._sourceFile && state.currentUser !== "Project Manager") {
      const sourceLayer = state.stage.layerStack.find(
        (l) => l.filePath === primNode._sourceFile
      );
      if (
        sourceLayer &&
        sourceLayer.owner &&
        sourceLayer.owner !== state.currentUser
      ) {
        alert(
          `You can only remove elements owned by ${state.currentUser}. This element belongs to ${sourceLayer.owner}.`
        );
        return;
      }
    }

    if (
      !confirm(
        `Are you sure you want to remove '${primNode.name}' from the stage?`
      )
    ) {
      return;
    }

    try {
      console.log("[REMOVE PRIM] Starting unstaging...");
      console.log("[REMOVE PRIM] Prim path:", primPath);
      console.log("[REMOVE PRIM] Prim name:", primNode.name);

      // Remove the prim from composedPrims (unstage it)
      const removePrimFromComposed = (list, pathToRemove) => {
        if (!list || !Array.isArray(list)) return [];
        return list.filter((prim) => {
          // Don't remove if this is the target prim
          if (prim.path === pathToRemove) {
            console.log(
              "[REMOVE PRIM] Removing prim:",
              prim.name,
              "at",
              prim.path
            );
            return false;
          }
          // Recursively clean children
          if (prim.children && prim.children.length > 0) {
            prim.children = removePrimFromComposed(prim.children, pathToRemove);
          }
          return true;
        });
      };

      console.log(
        "[REMOVE PRIM] After removal - composedPrims count:",
        state.stage.composedPrims?.length || 0
      ); // Before update

      // Collect all remaining paths after this deletion for the log
      const allRemainingPaths = [];
      const collectPaths = (prims) => {
        if (!prims || !Array.isArray(prims)) return;
        prims.forEach((p) => {
          if (p.path !== primPath) allRemainingPaths.push(p.path);
          if (p.children) collectPaths(p.children);
        });
      };
      collectPaths(state.stage.composedPrims || []);

      // Log the deletion to statement.usda
      console.log("[REMOVE PRIM] Logging deletion to statement...");
      logDeletionToStatement(primNode, allRemainingPaths);

      // Remove from composedPrims
      const newComposedPrims = removePrimFromComposed(
        state.stage.composedPrims || [],
        primPath
      );
      actions.setComposedPrims(newComposedPrims);

      console.log(
        "[REMOVE PRIM] After removal - composedPrims count:",
        newComposedPrims.length
      );

      // Recompose the stage to update the hierarchy
      console.log("[REMOVE PRIM] Calling recomposeStage...");
      recomposeStage();

      console.log(
        "[REMOVE PRIM] composedHierarchy count:",
        state.composedHierarchy?.length || 0
      );

      if (state.currentView === "stage") {
        console.log("[REMOVE PRIM] Calling updateView...");
        updateView();
      }

      console.log("[REMOVE PRIM] Unstaging complete!");
    } catch (e) {
      console.error("Remove failed:", e);
      alert("Failed to remove prim: " + e.message);
    }
  });

  expandAllButton.addEventListener("click", () => {
    const collapsibleItems = outliner.querySelectorAll(".collapsible");
    collapsibleItems.forEach((item) => {
      item.classList.remove("collapsed");
      const childUl = item.querySelector("ul");
      if (childUl) {
        childUl.style.display = "block";
      }
    });
  });

  collapseAllButton.addEventListener("click", () => {
    const collapsibleItems = outliner.querySelectorAll(".collapsible");
    collapsibleItems.forEach((item) => {
      item.classList.add("collapsed");
      const childUl = item.querySelector("ul");
      if (childUl) {
        childUl.style.display = "none";
      }
    });
  });
}
