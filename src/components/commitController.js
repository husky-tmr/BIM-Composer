// src/components/commitController.js
import { store } from "../core/index.js";
import { actions } from "../state/actions.js";
import { USDA_PARSER } from "../viewer/usda/usdaParser.js";
import { composeLogPrim } from "../viewer/usda/usdaComposer.js";

export function initCommitController(updateView) {
  const commitButton = document.getElementById("commitButton");

  // Polling loop to update button state
  setInterval(() => {
    const state = store.getState();
    if (state.stagedChanges.length > 0) {
      commitButton.classList.add("has-changes");
      commitButton.textContent = `Commit (${state.stagedChanges.length})`;
      commitButton.disabled = false;
    } else {
      commitButton.classList.remove("has-changes");
      commitButton.textContent = `Commit`;
      commitButton.disabled = true;
    }
  }, 500);

  commitButton.addEventListener("click", () => {
    const state = store.getState();
    console.log("[COMMIT] Commit button clicked");
    console.log("[COMMIT] Staged changes:", state.stagedChanges.length);

    if (state.stagedChanges.length === 0) return;

    const message = prompt("Enter commit message:");
    if (!message) return;

    console.log("[COMMIT] Creating commit with message:", message);

    // 1. Create the Log Entry
    const newId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newEntryNumber = actions.incrementLogEntryCounter();

    // Get unique paths affected
    const affectedPaths = [
      ...new Set(state.stagedChanges.map((c) => c.targetPath)),
    ];

    console.log("[COMMIT] Affected paths:", affectedPaths);

    const logEntry = {
      ID: newId,
      Entry: newEntryNumber,
      Timestamp: new Date().toISOString(),
      "USD Reference Path": "Multiple",
      "File Name": "Attribute Change",
      "Content Hash": "hash-placeholder",
      "File Size": 0,
      Type: "Commit",
      User: state.currentUser,
      Status: "New",
      SourceStatus: "WIP",
      TargetStatus: "WIP", // Commits don't change status
      sourceStatus: "WIP", // Lowercase version for consistency
      targetStatus: "WIP", // Lowercase version for consistency
      stagedPrims: affectedPaths,
      parent: state.headCommitId, // Link to previous head
      message: message,
    };

    console.log("[COMMIT] Log entry:", logEntry);

    // 2. Update Head
    actions.setHeadCommitId(newId);
    console.log("[COMMIT] Updated head to:", newId);

    // 3. Apply changes to the actual files in memory (Simple append)
    applyChangesToFiles();

    // 4. Write Log to Statement
    const logPrimString = composeLogPrim(logEntry);
    console.log("[COMMIT] Writing log to statement.usda");
    const newContent = USDA_PARSER.appendToUsdaFile(
      state.loadedFiles["statement.usda"],
      logPrimString,
      "ChangeLog"
    );
    actions.updateLoadedFile("statement.usda", newContent);
    console.log(
      "[COMMIT] statement.usda now has",
      newContent.length,
      "characters"
    );

    // 5. Cleanup
    actions.clearStagedChanges();
    console.log("[COMMIT] Commit complete!");
    alert("Committed successfully!");
    updateView();
  });

  function applyChangesToFiles() {
    const state = store.getState();
    state.stagedChanges.forEach((change) => {
      const pathSegments = change.targetPath.split("/").filter(Boolean);
      const rootPrimName = pathSegments[0];

      // Find which atomic file contains this root prim
      const targetFile = Object.keys(state.loadedFiles).find((f) =>
        f.includes(`_${rootPrimName}.usda`)
      );

      if (targetFile) {
        // Append an 'over' to the file
        const overrideStr = `
over "${rootPrimName}" {
    ${change.attributeName} = "${change.attributeValue}"
}
`;
        const updatedContent = state.loadedFiles[targetFile] + overrideStr;
        actions.updateLoadedFile(targetFile, updatedContent);
      }
    });
  }
}
