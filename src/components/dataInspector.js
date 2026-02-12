// src/components/dataInspector.js
// REFACTORED: Enhanced with error handling and core architecture
import {
  store,
  errorHandler,
  ValidationError,
  FileError,
} from "../core/index.js";

export function initDataInspector() {
  if (!document.getElementById("data-inspector")) {
    const inspectorHtml = `
      <div id="data-inspector" class="data-inspector-panel" style="display: none;">
        <div class="data-inspector-header">
          <h3>Data Inspector</h3>
          <button id="close-inspector-btn" class="close-inspector-btn">×</button>
        </div>
        <div id="data-inspector-body" class="data-inspector-body">
          <div class="data-inspector-placeholder">No data loaded</div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", inspectorHtml);
  }

  const inspector = document.getElementById("data-inspector");
  const body = document.getElementById("data-inspector-body");
  const closeBtn = document.getElementById("close-inspector-btn");

  if (!inspector || !body || !closeBtn) {
    throw new ValidationError(
      "Data inspector elements not found in DOM",
      "inspector",
      {
        inspector: !!inspector,
        body: !!body,
        closeBtn: !!closeBtn,
      }
    );
  }

  const handleClose = errorHandler.wrap(() => {
    inspector.style.display = "none";
  });

  closeBtn.addEventListener("click", handleClose);

  const handleInspectData = errorHandler.wrapAsync(async (e) => {
    const uri = e.detail?.uri;

    if (!uri || typeof uri !== "string") {
      throw new ValidationError(
        "URI is required to inspect data",
        "uri",
        e.detail
      );
    }

    inspector.style.display = "flex";
    body.innerHTML = '<div class="data-inspector-placeholder">Loading...</div>';

    try {
      const state = store.getState();
      let jsonData = null;

      if (state.loadedFiles[uri]) {
        // Try to parse as JSON
        try {
          jsonData = JSON.parse(state.loadedFiles[uri]);
        } catch {
          // Not valid JSON, show as error with content
          jsonData = {
            error: "Invalid JSON in virtual file",
            content: state.loadedFiles[uri],
          };
        }
      } else if (uri.startsWith("http")) {
        // Fetch from remote URL
        const response = await fetch(uri);
        if (!response.ok) {
          throw new FileError(`HTTP Error ${response.status}`, uri);
        }
        jsonData = await response.json();
      } else {
        throw new FileError(`Data source '${uri}' not found`, uri);
      }

      renderJson(jsonData);
      console.log(`✅ Loaded data from: ${uri}`);
    } catch (error) {
      // Display error in inspector
      body.innerHTML = `<div style="color: #d9534f; padding: 10px;">Error: ${error.message}</div>`;
      throw error; // Re-throw to let error handler show toast
    }
  });

  document.addEventListener("inspectData", handleInspectData);

  function renderJson(data) {
    if (typeof data !== "object" || data === null) {
      body.innerHTML = `<div>${data}</div>`;
      return;
    }
    function syntaxHighlight(json) {
      if (typeof json !== "string") {
        json = JSON.stringify(json, undefined, 2);
      }
      json = json
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
        function (match) {
          let cls = "json-number";
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = "json-key";
            } else {
              cls = "json-string";
            }
          } else if (/true|false/.test(match)) {
            cls = "json-boolean";
          } else if (/null/.test(match)) {
            cls = "json-null";
          }
          return '<span class="' + cls + '">' + match + "</span>";
        }
      );
    }
    body.innerHTML = `<pre style="margin: 0; white-space: pre-wrap;">${syntaxHighlight(
      data
    )}</pre>`;
  }
}
