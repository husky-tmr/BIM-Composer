// src/viewer/usda/parser/geometryParser.js
import * as THREE from "three";

export function extractGeometries(primHierarchy) {
  const meshes = [];
  if (!primHierarchy) return meshes;

  function findGeometry(prims) {
    prims.forEach((prim) => {
      let geometry;
      const materialColor = prim.properties.displayColor || null;

      const content = prim._rawContent || "";

      if (prim.type === "Mesh") {
        const pointsMatch = content.match(/point3f\[\] points = \[([^]*?)\]/);
        const indicesMatch = content.match(
          /int\[\] faceVertexIndices = \[([^]*?)\]/
        );
        if (pointsMatch && indicesMatch) {
          const points = pointsMatch[1]
            .replace(/[\n\s]/g, "")
            .split("),(")
            .map((tuple) => {
              const values = tuple.replace(/[()]/g, "").split(",").map(Number);
              return new THREE.Vector3(values[0], values[2], -values[1]);
            });
          const indices = indicesMatch[1]
            .replace(/[\n\s]/g, "")
            .split(",")
            .map(Number);
          geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(points.length * 3);
          for (let i = 0; i < points.length; i++) {
            positions[i * 3] = points[i].x;
            positions[i * 3 + 1] = points[i].y;
            positions[i * 3 + 2] = points[i].z;
          }
          geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
          );
          geometry.setIndex(indices);
          geometry.computeVertexNormals();
          meshes.push({
            name: prim.path.substring(1),
            geometry,
            color: materialColor,
            type: "Mesh",
            // Add extra properties
            opacity: prim.properties.opacity
              ? parseFloat(prim.properties.opacity)
              : undefined,
          });
        }
      } else if (prim.type === "Sphere") {
        const radiusMatch = content.match(/double radius = ([\d.]+)/);
        const radius = radiusMatch ? parseFloat(radiusMatch[1]) : 1.0;
        geometry = new THREE.SphereGeometry(radius, 32, 32);
        meshes.push({
          name: prim.path.substring(1),
          geometry,
          color: materialColor,
          type: "Sphere",
        });
      } else if (prim.type === "Cube") {
        const sizeMatch = content.match(/double size = ([\d.]+)/);
        const size = sizeMatch ? parseFloat(sizeMatch[1]) : 1.0;
        geometry = new THREE.BoxGeometry(size, size, size);
        meshes.push({
          name: prim.path.substring(1),
          geometry,
          color: materialColor,
          type: "Cube",
          // Add extra properties for Entity placeholders
          isWireframe: prim.customData?.isWireframe,
          opacity: prim.properties.opacity
            ? parseFloat(prim.properties.opacity)
            : 1.0,
        });
      }

      if (prim.children && prim.children.length > 0) {
        findGeometry(prim.children);
      }
    });
  }

  findGeometry(primHierarchy);
  return meshes;
}
