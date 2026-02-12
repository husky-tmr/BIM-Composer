// src/components/sidebar/panelDockerController.js

// Module-level state to persist across re-initializations
let activePanelId = "layersPanel"; // Default open panel
const pinnedPanelIds = new Set(["layersPanel", "hierarchyPanel"]); // Pin Layer Stack and Hierarchy by default

export function initPanelDockers() {
  const panels = document.querySelectorAll(".panel");

  function updatePanelStates() {
    panels.forEach((panel) => {
      const panelId = panel.id;
      const isPinned = pinnedPanelIds.has(panelId);
      const isActive = activePanelId === panelId;
      const content = panel.querySelector(".panel-content");
      const pinBtn = panel.querySelector(".pin-button");

      // Update Pin Button Visuals
      if (pinBtn) {
        pinBtn.classList.toggle("active", isPinned);
        pinBtn.textContent = isPinned ? "📌" : "📍";
      }

      // Determine if expanded
      // It is expanded if it's Pinned OR if it's the current Active panel
      if (isPinned || isActive) {
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

    // Preventive check: If we've already initialized this panel, skip re-binding
    if (header.dataset.dockerInitialized === "true") {
      return;
    }
    header.dataset.dockerInitialized = "true";

    // Setup Pin Button
    // Check if it already exists (redundancy for safety)
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

    // Header Click (Accordion Logic)
    header.addEventListener("click", (e) => {
      // Check if the click originated from the pin button (or its children if we had any)
      if (e.target.closest(".pin-button")) {
        e.stopPropagation(); // Prevent triggering the accordion toggle

        const panelId = panel.id;
        if (pinnedPanelIds.has(panelId)) {
          pinnedPanelIds.delete(panelId);
        } else {
          pinnedPanelIds.add(panelId);
          // If we pin it, make it the active one too so it doesn't close others immediately
          activePanelId = panelId;
        }
        updatePanelStates();
        return;
      }

      // Ignore clicks on OTHER controls/buttons inside the header
      // (e.g. Add File, Add Prim buttons)
      if (e.target.tagName === "BUTTON" || e.target.closest("button")) {
        return;
      }

      // Normal Header Click: Set Active (Accordion behavior)
      // Only collapse/expand if not pinned (pinned panels stay open)
      // But setting it as active allows unpinned panels to close.
      activePanelId = panel.id;
      updatePanelStates();
    });
  });

  // Initial Update
  updatePanelStates();
}
