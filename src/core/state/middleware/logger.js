/**
 * Logger Middleware for State Management
 *
 * Logs all state changes with:
 * - Timestamp
 * - Action type (if available)
 * - State diff
 * - Performance metrics
 */

export function createLoggerMiddleware(options = {}) {
  const {
    collapsed = true,
    colors = true,
    timestamp = true,
    duration = true,
    diff = true,
    enabled = import.meta.env.DEV,
  } = options;

  if (!enabled) {
    return () => (next) => (updates) => next(updates);
  }

  return (store) => (next) => (updates) => {
    const startTime = performance.now();
    const prevState = store.getState();

    // Apply updates
    const result = next(updates);

    const nextState = store.getState();
    const endTime = performance.now();
    const duration_ms = endTime - startTime;

    // Prepare log
    const logGroup = collapsed ? console.groupCollapsed : console.group;
    const actionType = updates.type || "STATE_UPDATE";
    const timestampStr = timestamp
      ? `@ ${new Date().toLocaleTimeString()}`
      : "";

    // Log group
    logGroup(
      `%c${actionType} %c${timestampStr}`,
      colors ? "color: #03A9F4; font-weight: bold;" : "",
      colors ? "color: #9E9E9E; font-weight: lighter;" : ""
    );

    // Log previous state
    console.log(
      "%cprev state",
      colors ? "color: #9E9E9E; font-weight: bold;" : "",
      prevState
    );

    // Log updates/action
    console.log(
      "%cupdates",
      colors ? "color: #03A9F4; font-weight: bold;" : "",
      updates
    );

    // Log next state
    console.log(
      "%cnext state",
      colors ? "color: #4CAF50; font-weight: bold;" : "",
      nextState
    );

    // Log diff if enabled
    if (diff) {
      const differences = getDiff(prevState, nextState);
      if (Object.keys(differences).length > 0) {
        console.log(
          "%cdiff",
          colors ? "color: #FF9800; font-weight: bold;" : "",
          differences
        );
      }
    }

    // Log duration
    if (duration) {
      console.log(
        "%cduration",
        colors ? "color: #9E9E9E; font-weight: lighter;" : "",
        `${duration_ms.toFixed(2)}ms`
      );
    }

    console.groupEnd();
    return result;
  };
}

/**
 * Get differences between two states
 * @param {Object} prev - Previous state
 * @param {Object} next - Next state
 * @returns {Object} Differences
 */
function getDiff(prev, next) {
  const diff = {};

  // Check for changed/added properties
  for (const key in next) {
    if (prev[key] !== next[key]) {
      diff[key] = {
        prev: prev[key],
        next: next[key],
      };
    }
  }

  // Check for removed properties
  for (const key in prev) {
    if (!(key in next)) {
      diff[key] = {
        prev: prev[key],
        next: undefined,
      };
    }
  }

  return diff;
}
