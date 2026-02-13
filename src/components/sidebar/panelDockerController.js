// src/components/sidebar/panelDockerController.js

// Module-level state to persist across re-initializations
const openPanelIds = new Set(["layersPanel", "hierarchyPanel"]); // Default open panels
const pinnedPanelIds = new Set(["layersPanel", "hierarchyPanel"]); // Pin Layer Stack and Hierarchy by default

export function resetPanelState() {
  openPanelIds.clear();
  openPanelIds.add("layersPanel");
  openPanelIds.add("hierarchyPanel");
  pinnedPanelIds.clear();
  pinnedPanelIds.add("layersPanel");
  pinnedPanelIds.add("hierarchyPanel");
}

export function initPanelDockers() {
  const panels = document.querySelectorAll(".panel");

  function updatePanelStates() {
    panels.forEach((panel) => {
      const panelId = panel.id;
      const isPinned = pinnedPanelIds.has(panelId);
      const isOpen = openPanelIds.has(panelId);
      const content = panel.querySelector(".panel-content");
      const pinBtn = panel.querySelector(".pin-button");

      // Update Pin Button Visuals
      if (pinBtn) {
        if (isPinned) {
          pinBtn.classList.add("active");
          pinBtn.innerHTML = "📌"; // Pinned icon
          pinBtn.title = "Unpin Panel";
        } else {
          pinBtn.classList.remove("active");
          pinBtn.innerHTML = "📍"; // Unpinned icon
          pinBtn.title = "Pin Panel";
        }
      }

      // Determine if expanded
      // It is expanded if it's Pinned OR if it's the current Active panel
      if (isPinned || isOpen) {
        panel.classList.remove("collapsed");
        panel.classList.add("expanded");
        if (content) content.style.display = "flex"; // Use flex to fill height
      } else {
        panel.classList.remove("expanded");
        panel.classList.add("collapsed");
        if (content) content.style.display = "none";
      }
    });
  }

  panels.forEach((panel) => {
    const header = panel.querySelector(".panel-header");
    if (!header) return;

    // Preventive check: If we've already initialized this panel, skip re-binding logic
    // BUT we must ensure the pin button exists (in case it was removed by a re-render)
    let pinBtn = header.querySelector(".pin-button");
    if (!pinBtn) {
      pinBtn = document.createElement("button");
      pinBtn.className = "pin-button";
      pinBtn.title = "Pin Panel";
      pinBtn.innerHTML = "📍";

      // Insert Pin button before the controls
      const controls = header.querySelector(
        ".scene-controls, .file-controls, .hierarchy-controls"
      );
      if (controls) {
        header.insertBefore(pinBtn, controls);
      } else {
        header.appendChild(pinBtn);
      }
    }

    if (header.dataset.dockerInitialized === "true") {
      return;
    }
    header.dataset.dockerInitialized = "true";

    // Header Click
    header.addEventListener("click", (e) => {
      // Check if the click originated from the pin button (or its children if we had any)
      if (e.target.closest(".pin-button")) {
        e.stopPropagation(); // Prevent triggering the accordion toggle

        const panelId = panel.id;
        // Toggle Pin logic
        if (pinnedPanelIds.has(panelId)) {
          pinnedPanelIds.delete(panelId);
          // Auto-close on unpin
          openPanelIds.delete(panelId);
        } else {
          pinnedPanelIds.add(panelId);
          // If we pin it, make sure it's marked as Open too
          openPanelIds.add(panelId);
        }
        updatePanelStates();
        return;
      }

      // Ignore clicks on OTHER controls/buttons inside the header
      // (e.g. Add File, Add Prim buttons)
      if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
        return;
      }

      // Normal Header Click: Toggle Open/Closed
      const panelId = panel.id;
      if (openPanelIds.has(panelId)) {
        openPanelIds.delete(panelId);
      } else {
        openPanelIds.add(panelId);
      }
      updatePanelStates();
    });
  });

  // Initial Update
  updatePanelStates();
}
