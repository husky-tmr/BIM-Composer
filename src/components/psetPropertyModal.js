// src/components/psetPropertyModal.js

let psetDefinitions = null;

/**
 * Load Pset definitions from JSON file
 */
async function loadPsetDefinitions() {
  if (psetDefinitions) return psetDefinitions;

  try {
    const response = await fetch("./src/data/pset_definitions.json");
    psetDefinitions = await response.json();
    console.log(
      "[PSET] Loaded",
      Object.keys(psetDefinitions).length,
      "Pset categories"
    );
    return psetDefinitions;
  } catch (error) {
    console.error("[PSET] Failed to load pset_definitions.json:", error);
    alert(
      "Failed to load property definitions. Please check console for details."
    );
    return null;
  }
}

/**
 * Show the Pset property selection modal
 * @param {Function} onAdd - Callback function when property is added (propertyName, propertyValue)
 */
export async function showPsetPropertyModal(onAdd) {
  const definitions = await loadPsetDefinitions();
  if (!definitions) return;

  // Get list of Pset categories (not individual properties)
  const psetCategories = Object.keys(definitions).sort();

  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.id = "pset-property-modal";
  overlay.className = "modal-overlay";
  overlay.style.display = "flex";

  overlay.innerHTML = `
    <div class="modal-content" style="
      max-width: 900px;
      width: 95%;
      max-height: 80vh;
      background: #1e1e1e;
      border: 1px solid #3a3a3a;
    ">
      <div class="modal-header" style="
        background: #3a3a3a;
        color: white;
        padding: 20px 24px;
        border-radius: 8px 8px 0 0;
        margin: -1px -1px 0 -1px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      ">
        <h2 style="margin: 0; font-size: 20px; font-weight: 600;">Add Properties from Pset</h2>
      </div>
      <div class="modal-body" style="padding: 0; display: flex; height: 500px;">
        <!-- Left Column: Pset Selection -->
        <div style="
          width: 350px;
          border-right: 2px solid #3a3a3a;
          padding: 24px;
          overflow-y: auto;
          background: #252525;
        ">
          <div style="position: sticky; top: 0; background: #252525; padding-bottom: 16px; z-index: 10;">
            <label style="
              display: block;
              margin-bottom: 8px;
              font-weight: 600;
              color: #e0e0e0;
              font-size: 14px;
            ">Select Property Set</label>
            <input 
              type="text" 
              id="pset-search-input" 
              style="
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #3a3a3a;
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.2s;
                box-sizing: border-box;
                background: #1e1e1e;
                color: #e0e0e0;
              " 
              placeholder="Search Psets (e.g., Pset_Wall)..."
              autocomplete="off"
            />
          </div>
          <div id="pset-list" style="margin-top: 12px;"></div>
        </div>
        
        <!-- Right Column: Attributes Form -->
        <div style="
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          background: #1e1e1e;
        ">
          <div id="attributes-form">
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: #888;
              font-size: 14px;
            ">
              Select a Property Set to view its attributes
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer" style="
        padding: 16px 24px;
        background: #252525;
        border-top: 2px solid #3a3a3a;
        border-radius: 0 0 8px 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div id="selected-pset-name" style="font-weight: 500; color: #888; font-size: 14px;"></div>
        <div style="display: flex; gap: 12px;">
          <button id="pset-cancel-button" style="
            padding: 10px 20px;
            border: 2px solid #3a3a3a;
            background: #1e1e1e;
            color: #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          ">Cancel</button>
          <button id="pset-add-button" disabled style="
            padding: 10px 20px;
            border: none;
            background: #007aff;
            color: white;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            opacity: 0.5;
          ">Add Properties</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Get elements
  const searchInput = document.getElementById("pset-search-input");
  const psetList = document.getElementById("pset-list");
  const attributesForm = document.getElementById("attributes-form");
  const selectedPsetName = document.getElementById("selected-pset-name");
  const addButton = document.getElementById("pset-add-button");
  const cancelButton = document.getElementById("pset-cancel-button");

  let currentPset = null;

  // Render Pset list
  function renderPsetList(filter = "") {
    const filterLower = filter.toLowerCase();
    const filtered = psetCategories.filter((pset) =>
      pset.toLowerCase().includes(filterLower)
    );

    if (filtered.length === 0) {
      psetList.innerHTML = `
        <div style="padding: 16px; text-align: center; color: #666; font-size: 14px;">
          No Psets found matching "${filter}"
        </div>
      `;
      return;
    }

    psetList.innerHTML = filtered
      .map(
        (pset) => `
      <div class="pset-item" data-pset="${pset}" style="
        padding: 12px 16px;
        margin-bottom: 6px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
        background: #1e1e1e;
        border: 2px solid transparent;
      ">
        <div style="font-weight: 500; color: #e0e0e0; font-size: 14px;">${pset}</div>
        <div style="font-size: 12px; color: #888; margin-top: 2px;">
          ${Object.keys(definitions[pset]).length} attributes
        </div>
      </div>
    `
      )
      .join("");

    // Add click handlers
    psetList.querySelectorAll(".pset-item").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        if (item.dataset.pset !== currentPset) {
          item.style.background = "#2a2a2a";
        }
      });
      item.addEventListener("mouseleave", () => {
        if (item.dataset.pset !== currentPset) {
          item.style.background = "#1e1e1e";
        }
      });
      item.addEventListener("click", () => {
        selectPset(item.dataset.pset);
      });
    });
  }

  // Select a Pset and show its attributes
  function selectPset(psetName) {
    currentPset = psetName;
    selectedPsetName.textContent = `Selected: ${psetName}`;

    // Update visual selection
    psetList.querySelectorAll(".pset-item").forEach((item) => {
      if (item.dataset.pset === psetName) {
        item.style.background = "#2d2d4a";
        item.style.borderColor = "#007aff";
      } else {
        item.style.background = "#1e1e1e";
        item.style.borderColor = "transparent";
      }
    });

    // Render attributes form
    const attributes = definitions[psetName];
    const attributeNames = Object.keys(attributes).sort();

    attributesForm.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #e0e0e0;">
          ${psetName}
        </h3>
        <p style="margin: 0; font-size: 13px; color: #888;">
          Fill in values for the attributes you want to add (leave blank to skip)
        </p>
      </div>
      ${attributeNames
        .map(
          (attr) => `
        <div class="attribute-input-group" style="margin-bottom: 16px;">
          <label style="
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #b0b0b0;
            font-size: 13px;
          ">${attr}</label>
          <input 
            type="text" 
            data-attribute="${attr}"
            style="
              width: 100%;
              padding: 10px 14px;
              border: 2px solid #3a3a3a;
              border-radius: 6px;
              font-size: 13px;
              transition: all 0.2s;
              box-sizing: border-box;
              background: #252525;
              color: #e0e0e0;
            " 
            placeholder="Enter value (optional)..."
          />
        </div>
      `
        )
        .join("")}
    `;

    // Add focus effects to inputs
    attributesForm.querySelectorAll("input").forEach((input) => {
      input.addEventListener("focus", () => {
        input.style.borderColor = "#007aff";
        input.style.boxShadow = "0 0 0 3px rgba(0, 122, 255, 0.2)";
      });
      input.addEventListener("blur", () => {
        input.style.borderColor = "#3a3a3a";
        input.style.boxShadow = "none";
      });
    });

    // Enable add button
    addButton.disabled = false;
    addButton.style.opacity = "1";
    addButton.style.cursor = "pointer";
  }

  // Handle search
  searchInput.addEventListener("input", () => {
    renderPsetList(searchInput.value);
  });

  searchInput.addEventListener("focus", () => {
    searchInput.style.borderColor = "#007aff";
    searchInput.style.boxShadow = "0 0 0 3px rgba(0, 122, 255, 0.2)";
  });
  searchInput.addEventListener("blur", () => {
    searchInput.style.borderColor = "#3a3a3a";
    searchInput.style.boxShadow = "none";
  });

  // Handle Enter key on search
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const firstPset = psetList.querySelector(".pset-item");
      if (firstPset) {
        selectPset(firstPset.dataset.pset);
      }
    }
  });

  // Handle add button
  addButton.addEventListener("click", () => {
    if (!currentPset) {
      alert("Please select a Property Set first.");
      return;
    }

    // Collect all filled-in attributes
    const inputs = attributesForm.querySelectorAll("input[data-attribute]");
    const propertiesToAdd = [];

    inputs.forEach((input) => {
      const value = input.value.trim();
      if (value) {
        propertiesToAdd.push({
          name: input.dataset.attribute,
          value: value,
        });
      }
    });

    if (propertiesToAdd.length === 0) {
      alert("Please enter at least one attribute value.");
      return;
    }

    console.log(
      "[PSET] Adding",
      propertiesToAdd.length,
      "properties from",
      currentPset
    );

    // Close modal
    document.body.removeChild(overlay);

    // Call callback ONCE with all properties AND the Pset name
    if (onAdd) {
      onAdd(propertiesToAdd, currentPset);
    }
  });

  // Button hover effects
  cancelButton.addEventListener("mouseenter", () => {
    cancelButton.style.background = "#2a2a2a";
    cancelButton.style.borderColor = "#4a4a4a";
  });
  cancelButton.addEventListener("mouseleave", () => {
    cancelButton.style.background = "#1e1e1e";
    cancelButton.style.borderColor = "#3a3a3a";
  });

  addButton.addEventListener("mouseenter", () => {
    if (!addButton.disabled) {
      addButton.style.transform = "translateY(-1px)";
      addButton.style.boxShadow = "0 4px 12px rgba(0, 122, 255, 0.4)";
    }
  });
  addButton.addEventListener("mouseleave", () => {
    addButton.style.transform = "translateY(0)";
    addButton.style.boxShadow = "none";
  });

  // Handle cancel button
  cancelButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  // Initial render
  renderPsetList();

  // Focus on search input
  setTimeout(() => searchInput.focus(), 100);
}
