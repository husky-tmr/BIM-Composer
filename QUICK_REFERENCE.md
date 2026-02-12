# 🎯 Quick Reference Card

## Essential Imports

```javascript
import {
  // State Management
  store, // Global store
  actions, // All action creators
  applyMiddleware, // Apply middleware
  createLoggerMiddleware, // Logger middleware
  createAsyncMiddleware, // Async middleware

  // Services
  layerService, // Layer operations
  primService, // Prim operations

  // Error Handling
  errorHandler, // Global error handler
  ValidationError, // Validation errors
  ParseError, // Parse errors
  StateError, // State errors
  FileError, // File errors
  RenderError, // Render errors
} from "@core";
```

## Common Patterns

### 1. Dispatch Action

```javascript
store.dispatch(actions.addLayer(layer));
store.dispatch(actions.setSceneName("Project"));
```

### 2. Create Layer

```javascript
const layer = layerService.createLayer("file.usda", "WIP");
```

### 3. Validate Path

```javascript
try {
  primService.validatePrimPath(path);
} catch (error) {
  // Handle validation error
}
```

### 4. Wrap Function

```javascript
const safe = errorHandler.wrap(riskyFunction, fallback);
safe(); // Auto error handling
```

### 5. Subscribe to State

```javascript
store.subscribe("component", (newState, oldState) => {
  // React to changes
});
```

## File Locations

| What          | Where                                 |
| ------------- | ------------------------------------- |
| Core exports  | `src/core/index.js`                   |
| Actions       | `src/core/state/actions/index.js`     |
| Logger        | `src/core/state/middleware/logger.js` |
| Async         | `src/core/state/middleware/async.js`  |
| LayerService  | `src/core/services/LayerService.js`   |
| PrimService   | `src/core/services/PrimService.js`    |
| ErrorHandler  | `src/core/errors/ErrorHandler.js`     |
| Error classes | `src/core/errors/errors.js`           |

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm test                 # Run tests (watch)
npm run test:coverage    # Coverage report
npm run type-check       # TypeScript check
npm run lint             # Lint code
npm run validate         # All checks
```

## Layer Service Methods

```javascript
layerService.createLayer(path, status);
layerService.validateLayerStack(stack);
layerService.promoteLayer(layer);
layerService.demoteLayer(layer);
layerService.toggleLayerVisibility(stack, id);
layerService.setActiveLayer(stack, id);
layerService.reorderLayers(stack, from, to);
layerService.filterLayersByStatus(stack, status);
layerService.getVisibleLayers(stack);
layerService.getActiveLayer(stack);
```

## Prim Service Methods

```javascript
primService.validatePrimPath(path);
primService.normalizePrimPath(path);
primService.getParentPath(path);
primService.getPrimName(path);
primService.joinPaths(...paths);
primService.createPrim(path, type, properties);
primService.findPrimByPath(hierarchy, path);
primService.getDescendants(prim);
primService.getPrimDepth(path);
primService.isAncestor(ancestor, descendant);
primService.buildPrimMap(hierarchy);
primService.getDisplayName(prim);
primService.setDisplayName(prim, name);
```

## All Actions

```javascript
// Scene
actions.setSceneName(name);
actions.setCurrentUser(user);

// Layers
actions.addLayer(layer);
actions.removeLayer(id);
actions.updateLayer(id, updates);
actions.toggleLayerVisibility(id);
actions.toggleLayerActive(id);
actions.reorderLayers(stack);
actions.setLayerFilter(filter);
actions.toggleStatusColor();

// Prims
actions.setComposedHierarchy(hierarchy);
actions.updatePrim(path, updates);
actions.addPrim(parent, prim);
actions.removePrim(path);

// Staging
actions.stageChange(change);
actions.unstageChange(index);
actions.clearStagedChanges();
actions.commitChanges(message);

// View
actions.setCurrentView(view);

// Files
actions.loadFile(path, content);
actions.unloadFile(path);
actions.updateFile(path, content);
```

## Documentation

| Doc                                                    | Purpose                |
| ------------------------------------------------------ | ---------------------- |
| [CODE_EXPLORATION_GUIDE.md](CODE_EXPLORATION_GUIDE.md) | Learn the architecture |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)           | How to integrate       |
| [QUICK_START.md](QUICK_START.md)                       | Get started fast       |
| [PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md)             | What was built         |
| [ARCHITECTURE.md](ARCHITECTURE.md)                     | System design          |

---

Keep this handy! 📌
