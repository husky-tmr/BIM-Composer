// src/utils/atomicFileHandler.js
import { USDA_PARSER } from "../viewer/usda/usdaParser.js";

export function explodeUsda(fileContent, originalFileName) {
  const hierarchy = USDA_PARSER.getPrimHierarchy(fileContent);
  const atomicFiles = {};

  if (!hierarchy || hierarchy.length === 0) {
    console.warn(
      `No hierarchy found in ${originalFileName}, loading as single file.`
    );
    atomicFiles[originalFileName] = fileContent;
    return atomicFiles;
  }

  const cleanName = originalFileName.replace(/\.(usda|usd)$/i, "");

  // --- INTELLIGENT UNWRAPPING ---
  // If the file contains only ONE top-level prim (e.g., "IFCModel" or "World"),
  // we likely want to explode its CHILDREN, not the container itself.
  let primsToExplode = hierarchy;
  const parentWrapper = null; // To preserve the hierarchy structure

  if (
    hierarchy.length === 1 &&
    hierarchy[0].children &&
    hierarchy[0].children.length > 0
  ) {
    console.log(
      `Single root detected (${hierarchy[0].name}), exploding children...`
    );
    // parentWrapper = hierarchy[0]; // DISABLE parentWrapper context to avoid filename pollution
    primsToExplode = hierarchy[0].children;
  }
  // ------------------------------

  primsToExplode.forEach((prim) => {
    // Generate filename: Barsa_Window23.usda (No IFCModel prefix)
    const prefix = parentWrapper
      ? `${cleanName}_${parentWrapper.name}`
      : cleanName;
    const fileName = `${prefix}_${prim.name}.usda`;

    // If we unwrapped a parent, we must wrap the child in an 'over'
    // to ensure it loads back into the correct place in the hierarchy.
    let contentBody = prim.rawText;

    // Logic: If the exploded prim is a Mesh, we MUST wrap it in an Xform
    // and rename the Mesh to avoid naming collisions/bad structure.
    if (prim.type === "Mesh" || parentWrapper) {
      // Modify the inner definition to add "Mesh_" prefix
      // e.g., def Mesh "IfcBuildingElement..." -> def Mesh "Mesh_IfcBuildingElement..."
      const typeMatch = prim.rawText.match(
        /(def|over|class)\s+(\w+)\s+"([^"]+)"/
      );
      let modifiedRawText = prim.rawText;

      if (typeMatch) {
        const specifier = typeMatch[1];
        const type = typeMatch[2];
        // Use the actual matched string for replacement to handle variable whitespace
        modifiedRawText = prim.rawText.replace(
          typeMatch[0],
          `${specifier} ${type} "Mesh_${prim.name}"`
        );
      }

      // Wrap in an Xform with the original prim name
      contentBody = `
def Xform "${prim.name}"
{
    ${modifiedRawText}
}
`;
    }

    const atomicContent = `#usda 1.0
(
    defaultPrim = "${prim.name}"
    upAxis = "Z"
)

${contentBody}
`;

    atomicFiles[fileName] = atomicContent;
  });

  return atomicFiles;
}
