// src/viewer/spatialHash.js
import * as THREE from "three";

export class SpatialHash {
  constructor() {
    this.objects = [];
  }

  insert(mesh) {
    if (!mesh.geometry) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();

    const box = new THREE.Box3().copy(mesh.geometry.boundingBox);
    box.applyMatrix4(mesh.matrixWorld);

    this.objects.push({ mesh, box });
  }

  getDebugVisuals() {
    const group = new THREE.Group();
    group.name = "SpatialHashDebug";

    for (let i = 0; i < this.objects.length; i++) {
      const { box: boxA } = this.objects[i];
      let count = 0;

      // Count intersections with other objects (including itself)
      for (let j = 0; j < this.objects.length; j++) {
        const { box: boxB } = this.objects[j];
        if (boxA.intersectsBox(boxB)) {
          count++;
        }
      }

      // Create visualization for this object's space (bounding box)
      const size = new THREE.Vector3();
      boxA.getSize(size);
      const center = new THREE.Vector3();
      boxA.getCenter(center);

      const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const edges = new THREE.EdgesGeometry(geometry);

      // Color coding based on density/overlap count
      let color = 0x00ff00; // Green (likely just itself)
      if (count > 1) color = 0xffff00; // Yellow (minor overlap)
      if (count > 2) color = 0xff0000; // Red (significant overlap)

      const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5,
      });

      const boxVisual = new THREE.LineSegments(edges, material);
      boxVisual.position.copy(center);
      group.add(boxVisual);
    }
    return group;
  }
}
