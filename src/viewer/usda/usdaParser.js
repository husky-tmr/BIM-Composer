// src/viewer/usda/usdaParser.js
import { parsePrimTree } from "./parser/hierarchyParser.js";
import { parseStatementLog } from "./parser/logParser.js";
import { extractGeometries } from "./parser/geometryParser.js";

function findMatchingBrace(str, start) {
  let depth = 1;
  for (let i = start + 1; i < str.length; i++) {
    if (str[i] === "{") {
      depth++;
    } else if (str[i] === "}") {
      depth--;
    }
    if (depth === 0) {
      return i;
    }
  }
  return -1;
}

export const USDA_PARSER = {
  getPrimHierarchy(usdaText) {
    if (!usdaText) return [];
    return parsePrimTree(usdaText);
  },

  appendToUsdaFile(fileContent, textToAppend, rootPrimName = null) {
    if (rootPrimName) {
      // Allow optional type: (def|over) [Type] "Name" {
      const primRegex = new RegExp(
        `(def|over)(?:\\s+\\w+)?\\s+"${rootPrimName}"\\s*\\{`
      );
      const match = fileContent.match(primRegex);
      if (match) {
        const braceIndex = match.index + match[0].length;
        const endBraceIndex = findMatchingBrace(fileContent, braceIndex - 1);
        if (endBraceIndex !== -1) {
          return `${fileContent.slice(
            0,
            endBraceIndex
          )}${textToAppend}${fileContent.slice(endBraceIndex)}`;
        }
      }
    }
    // If no root prim specified, append to the end of the file (Root level)
    return fileContent + "\n" + textToAppend;
  },

  parseStatementLog(statementContent) {
    return parseStatementLog(statementContent);
  },

  parseUSDA(usdaText) {
    const primHierarchy = parsePrimTree(usdaText);
    return extractGeometries(primHierarchy);
  },
};
