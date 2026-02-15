// src/viewer/ifc/index.js
/**
 * IFC Module Entry Point
 *
 * Provides IFC to USD conversion functionality using web-ifc WASM library
 */

export { ifcParser, IFCParser, WebIFC } from "./ifcParser.js";
export { ifcToUsdConverter, IFCToUSDConverter } from "./ifcToUsdConverter.js";
