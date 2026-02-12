# Architecture Documentation

## Overview

USDA Composer is a client-side web application for viewing, editing, and composing Universal Scene Description (USDA) files. This document outlines the system architecture, design patterns, and key decisions.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Outliner │  │Properties│  │  Layers  │  │ Timeline │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
┌───────▼─────────────▼─────────────▼─────────────▼──────────┐
│                   State Management Layer                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │           StateManager (Event-Driven)               │    │
│  │  • Centralized state                                │    │
│  │  • Event-based reactivity                           │    │
│  │  • Subscription model                               │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────┬────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                     Business Logic Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ USDA Parser  │  │ USDA Merger  │  │USDA Composer │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Validators │  │   Helpers    │  │   Actions    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────┬────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                     Rendering Layer                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │              Three.js Scene Manager                 │     │
│  │  • File View                                        │     │
│  │  • Stage View (Composed)                            │     │
│  │  • History View                                     │     │
│  └────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

## 📁 Directory Structure

```
src/
├── components/          # UI Components
│   ├── properties/     # Property editing components
│   ├── sidebar/        # Sidebar panels
│   └── staging/        # Staging area components
│
├── state/              # State Management
│   ├── StateManager.js # Core state manager
│   ├── store.js        # Global store instance
│   ├── actions.js      # Action creators
│   └── state.js        # Initial state definition
│
├── viewer/             # 3D Viewer
│   ├── ThreeScene.js   # Main Three.js wrapper
│   ├── rendering/      # Renderers for different views
│   └── usda/           # USDA-specific viewer logic
│       ├── parser/     # Parsing modules
│       ├── usdaParser.js
│       ├── usdaMerger.js
│       └── usdaComposer.js
│
├── utils/              # Utility Functions
│   ├── validators.js   # Input validation
│   ├── primHelpers.js  # Prim manipulation helpers
│   └── domHelpers.js   # DOM utilities
│
├── types/              # TypeScript Definitions
│   └── index.d.ts      # Global type definitions
│
└── __tests__/          # Tests
    ├── unit/           # Unit tests
    ├── integration/    # Integration tests
    └── setup.js        # Test setup
```

## 🎯 Design Patterns

### 1. State Management Pattern

**Pattern**: Observer/Pub-Sub with centralized state

```javascript
// Subscribe to state changes
store.subscribe("component-id", (newState, oldState) => {
  // React to state changes
});

// Update state
store.setState({
  sceneName: "New Scene",
});
```

**Why**:

- Predictable state updates
- Easy to debug
- Decoupled components
- Time-travel debugging capability

### 2. Controller Pattern

Each major UI section has a controller that:

- Initializes DOM elements
- Sets up event handlers
- Coordinates between UI and state

```javascript
export function initOutlinerController() {
  // Initialize
  const outliner = document.getElementById("outliner");

  // Setup handlers
  function handlePrimClick(event) {
    // Handle interaction
  }

  // Subscribe to state
  store.subscribe("outliner", updateOutlinerView);
}
```

### 3. Parser/Composer Pattern

**Separation of concerns**:

- **Parser**: USDA → JavaScript objects
- **Composer**: JavaScript objects → USDA

```javascript
// Parse
const prims = USDA_PARSER.parse(usdaContent);

// Compose
const usda = USDA_COMPOSER.compose(prims);
```

### 4. Renderer Strategy Pattern

Different renderers for different view modes:

```javascript
class FileViewRenderer {
  render(scene, data) {
    // Render single file
  }
}

class StageViewRenderer {
  render(scene, data) {
    // Render composed stage with color coding
  }
}
```

## 🔄 Data Flow

### User Action Flow

```
User Interaction
     ↓
Event Handler
     ↓
Action Creator (optional)
     ↓
StateManager.setState()
     ↓
State Update (Deep Merge)
     ↓
Notify Subscribers
     ↓
UI Update / Re-render
```

### USDA File Loading Flow

```
File Upload
     ↓
Read File Content
     ↓
Parse USDA (usdaParser.js)
     ↓
Build Prim Hierarchy
     ↓
Store in State
     ↓
Render in Three.js Scene
     ↓
Update Outliner UI
```

### Commit Flow

```
User Makes Changes
     ↓
Changes Added to Staging Area
     ↓
User Commits
     ↓
Generate Override ("over") Statements
     ↓
Create Commit Record
     ↓
Write to WIP Layer
     ↓
Update History Timeline
     ↓
Record in statement.usda
```

## 🎨 Component Interactions

### State → Components

```javascript
// Components subscribe to specific state slices
store.subscribe("outliner", (newState, oldState) => {
  if (newState.composedHierarchy !== oldState.composedHierarchy) {
    updateOutlinerView(newState.composedHierarchy);
  }
});
```

### Components → State

```javascript
// Components dispatch state updates
function handleLayerToggle(layerId) {
  const layers = store.getState().stage.layerStack;
  const updatedLayers = layers.map((layer) =>
    layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
  );

  store.setState({
    stage: { layerStack: updatedLayers },
  });
}
```

## 🔐 Key Design Decisions

### Decision 1: Custom State Management

**Decision**: Build custom StateManager vs using Redux/MobX

**Rationale**:

- ✅ No external dependencies
- ✅ Simple API matching project needs
- ✅ Learning opportunity
- ⚠️ Less ecosystem support
- ⚠️ No dev tools initially

**Future**: Consider migrating to Zustand for better DX

### Decision 2: Vanilla JavaScript (transitioning to TypeScript)

**Decision**: Start with vanilla JS, gradually adopt TypeScript

**Rationale**:

- ✅ Lower initial barrier
- ✅ Faster prototyping
- ✅ Incremental adoption possible
- ⚠️ More runtime errors initially

**Current**: TypeScript infrastructure in place for gradual migration

### Decision 3: Component-Based Controllers

**Decision**: Use controller functions vs React/Vue components

**Rationale**:

- ✅ No framework dependency
- ✅ Smaller bundle size
- ✅ Direct DOM control
- ⚠️ More manual DOM manipulation
- ⚠️ Less declarative

**Future**: Consider Svelte for component areas with complex state

### Decision 4: Layer-Based Composition

**Decision**: Implement layer stack similar to VFX pipelines

**Rationale**:

- ✅ Non-destructive workflow
- ✅ Familiar to industry professionals
- ✅ Enables collaboration
- ✅ Audit trail via statement.usda

## 🚀 Performance Considerations

### Three.js Optimizations

1. **Spatial Hashing**: Fast object picking
2. **Frustum Culling**: Only render visible objects
3. **Object Pooling**: Reuse geometries/materials (TODO)
4. **LOD**: Level of detail for complex scenes (TODO)

### Code Splitting

Implemented in vite.config.js:

- Vendor chunks (three.js, etc.)
- Feature chunks (viewer, parser, state)
- Better caching strategy

### Web Workers (Planned)

Move USDA parsing to worker thread for better performance on large files.

## 🧪 Testing Strategy

### Unit Tests

- All utility functions
- State management
- Parsers/composers

### Integration Tests

- Component interactions
- State + UI updates
- Parser + Renderer

### E2E Tests

- Critical user flows
- File loading
- Commit workflow
- Layer management

## 📈 Future Improvements

### Short Term

1. Complete TypeScript migration
2. Add Web Worker for parsing
3. Implement object pooling
4. Add error boundaries

### Medium Term

1. Progressive Web App (PWA)
2. Offline support
3. Virtual scrolling for large hierarchies
4. Performance profiling dashboard

### Long Term

1. Real-time collaboration
2. Plugin system
3. Cloud storage integration
4. Mobile support

## 🔗 Related Documentation

- [Contributing Guide](./CONTRIBUTING.md)
- [API Documentation](./docs/API.md) (TODO)
- [Testing Guide](./docs/TESTING.md) (TODO)

---

Last Updated: 2026-02-11
