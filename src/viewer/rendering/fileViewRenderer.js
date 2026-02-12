// src/viewer/rendering/fileViewRenderer.js
import * as THREE from "three";
import { buildFileOutliner } from "../../components/outlinerController.js";

function clearScene(threeScene) {
  while (threeScene.meshesGroup.children.length > 0) {
    const mesh = threeScene.meshesGroup.children[0];
    threeScene.meshesGroup.remove(mesh);
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  }
  threeScene.selectionController.clearSelection();
}

export function renderFileView(threeScene, filesData) {
  clearScene(threeScene);

  if (!filesData || filesData.length === 0) {
    threeScene.outlinerEl.innerHTML = "";
    return;
  }

  const combinedHierarchy = {};

  filesData.forEach((fileData) => {
    const { name: fileName, content: usdaContent } = fileData;
    const parsedMeshesData = threeScene.parser.parseUSDA(usdaContent);

    if (parsedMeshesData.length === 0) return;

    // Ensure file entry in hierarchy
    if (!combinedHierarchy[fileName]) {
      combinedHierarchy[fileName] = {};
    }

    parsedMeshesData.forEach((data) => {
      const [xformName, primName] = data.name.split("/");

      if (!combinedHierarchy[fileName][xformName]) {
        combinedHierarchy[fileName][xformName] = [];
      }

      const geometry = data.geometry;
      const material = new THREE.MeshStandardMaterial({
        color: data.color ? data.color.getHex() : 0xcccccc,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = data.name;

      const childItem = document.createElement("li");
      childItem.classList.add("prim-item");
      childItem.dataset.meshName = data.name;
      childItem.dataset.primPath = `/${data.name}`;
      childItem.innerHTML = `<div class="outliner-row"><span class="outliner-toggler" style="visibility: hidden;"></span><span class="outliner-icon">🧊</span><span class="outliner-text">${primName}</span><span class="visibility-toggle">👁️</span></div>`;
      mesh.userData.outlinerElement = childItem;
      mesh.userData.originalMaterial = material;
      mesh.userData.primPath = `/${data.name}`;
      mesh.userData.originFile = fileName; // Track origin file for multi-file contexts

      threeScene.meshesGroup.add(mesh);
      combinedHierarchy[fileName][xformName].push({
        name: primName,
        mesh: mesh,
      });
    });
  });

  buildFileOutliner(threeScene.outlinerEl, combinedHierarchy);
}
