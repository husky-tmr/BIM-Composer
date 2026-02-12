/**
 * Core Module - Central exports for all core functionality
 */

// State Management (new Redux-style store)
export { store } from "./state/store.js";
// Action creators and middleware
export { actions, ActionTypes } from "./state/actions/index.js";
export {
  applyMiddleware,
  createLoggerMiddleware,
  createAsyncMiddleware,
  createThunk,
  createAsyncAction,
} from "./state/middleware/index.js";
export { reducer } from "./state/reducer.js";

// Services
export { layerService, primService, services } from "./services/index.js";

// Error Handling
export { errorHandler } from "./errors/ErrorHandler.js";
export {
  AppError,
  ParseError,
  ValidationError,
  StateError,
  FileError,
  RenderError,
  NetworkError,
  ERROR_MESSAGES,
} from "./errors/errors.js";
