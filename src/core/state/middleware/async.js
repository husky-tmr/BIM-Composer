/**
 * Async Middleware for State Management
 *
 * Allows dispatching async functions and promises
 */

/**
 * Async middleware - supports async actions
 *
 * Usage:
 *   store.dispatch(async (dispatch, getState) => {
 *     const data = await fetchData();
 *     dispatch({ type: 'SET_DATA', payload: data });
 *   });
 */
export function createAsyncMiddleware() {
  return (store) => (next) => {
    // Create a dispatch function that goes through the middleware chain
    // We use a lazy reference to store.dispatch so it works even during initialization
    const dispatch = (action) => {
      // If store.dispatch is available (after applyMiddleware), use it
      // Otherwise fall back to next
      return store.dispatch ? store.dispatch(action) : next(action);
    };

    return (action) => {
      // If action is a function, call it with dispatch and getState
      if (typeof action === "function") {
        return action(dispatch, () => store.getState());
      }

      // If action is a promise, wait for it
      if (action && typeof action.then === "function") {
        return action.then((resolvedAction) => {
          if (resolvedAction) {
            next(resolvedAction);
          }
        });
      }

      // Otherwise, pass through
      return next(action);
    };
  };
}

/**
 * Thunk helper - creates async action creator
 *
 * @param {Function} asyncFn - Async function
 * @returns {Function} Thunk action creator
 *
 * Example:
 *   const loadData = createThunk(async (dispatch, getState, payload) => {
 *     const data = await fetchData(payload);
 *     dispatch({ type: 'SET_DATA', payload: data });
 *   });
 *
 *   store.dispatch(loadData({ id: 1 }));
 */
export function createThunk(asyncFn) {
  return (payload) => async (dispatch, getState) => {
    try {
      return await asyncFn(dispatch, getState, payload);
    } catch (error) {
      console.error("Thunk error:", error);
      throw error;
    }
  };
}

/**
 * Create an async action with loading/success/error states
 *
 * @param {string} type - Base action type
 * @param {Function} asyncFn - Async function that returns data
 * @returns {Function} Async action creator
 *
 * Example:
 *   const loadUser = createAsyncAction(
 *     'LOAD_USER',
 *     async (userId) => {
 *       const response = await fetch(`/api/users/${userId}`);
 *       return response.json();
 *     }
 *   );
 *
 *   store.dispatch(loadUser(123));
 *   // Dispatches: LOAD_USER_PENDING
 *   // Then: LOAD_USER_SUCCESS or LOAD_USER_ERROR
 */
export function createAsyncAction(type, asyncFn) {
  return (...args) =>
    async (dispatch) => {
      // Dispatch pending
      dispatch({
        type: `${type}_PENDING`,
        payload: { args },
      });

      try {
        const result = await asyncFn(...args);

        // Dispatch success
        dispatch({
          type: `${type}_SUCCESS`,
          payload: result,
        });

        return result;
      } catch (error) {
        // Dispatch error
        dispatch({
          type: `${type}_ERROR`,
          payload: { error: error.message },
          error: true,
        });

        throw error;
      }
    };
}
