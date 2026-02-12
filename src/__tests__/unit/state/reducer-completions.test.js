// src/__tests__/unit/state/reducer-completions.test.js
// Note: describe, it, expect are available globally via globals: true in vite.config.js
import { reducer } from "../../../core/state/reducer.js";
import {
  updatePrimInHierarchy,
  addPrimToHierarchy,
  removePrimFromHierarchy,
  generateId,
} from "../../../core/state/helpers.js";

describe("Reducer - Prim Operations", () => {
  describe("UPDATE_PRIM", () => {
    it("should update a prim at root level", () => {
      const state = {
        composedHierarchy: [
          { path: "/Root", name: "Root", type: "Xform", children: [] },
        ],
      };

      const action = {
        type: "UPDATE_PRIM",
        payload: {
          primPath: "/Root",
          updates: { name: "NewRoot", customProp: "value" },
        },
      };

      const newState = reducer(state, action);
      expect(newState.composedHierarchy[0].name).toBe("NewRoot");
      expect(newState.composedHierarchy[0].customProp).toBe("value");
      expect(newState.composedHierarchy[0].type).toBe("Xform"); // Unchanged
    });

    it("should update a nested prim", () => {
      const state = {
        composedHierarchy: [
          {
            path: "/Root",
            name: "Root",
            children: [{ path: "/Root/Child", name: "Child", children: [] }],
          },
        ],
      };

      const action = {
        type: "UPDATE_PRIM",
        payload: {
          primPath: "/Root/Child",
          updates: { name: "UpdatedChild" },
        },
      };

      const newState = reducer(state, action);
      expect(newState.composedHierarchy[0].children[0].name).toBe(
        "UpdatedChild"
      );
    });

    it("should handle empty hierarchy", () => {
      const state = { composedHierarchy: [] };
      const action = {
        type: "UPDATE_PRIM",
        payload: {
          primPath: "/Root",
          updates: { name: "NewRoot" },
        },
      };

      const newState = reducer(state, action);
      expect(newState.composedHierarchy).toEqual([]);
    });
  });

  describe("ADD_PRIM", () => {
    it("should add a prim to root level", () => {
      const state = {
        composedHierarchy: [{ path: "/Root", name: "Root", children: [] }],
      };

      const action = {
        type: "ADD_PRIM",
        payload: {
          parentPath: null,
          prim: { path: "/NewPrim", name: "NewPrim", children: [] },
        },
      };

      const newState = reducer(state, action);
      expect(newState.composedHierarchy).toHaveLength(2);
      expect(newState.composedHierarchy[1].name).toBe("NewPrim");
    });

    it("should add a prim as a child", () => {
      const state = {
        composedHierarchy: [{ path: "/Root", name: "Root", children: [] }],
      };

      const action = {
        type: "ADD_PRIM",
        payload: {
          parentPath: "/Root",
          prim: { path: "/Root/Child", name: "Child", children: [] },
        },
      };

      const newState = reducer(state, action);
      expect(newState.composedHierarchy[0].children).toHaveLength(1);
      expect(newState.composedHierarchy[0].children[0].name).toBe("Child");
    });

    it("should handle empty hierarchy when adding root", () => {
      const state = { composedHierarchy: [] };
      const action = {
        type: "ADD_PRIM",
        payload: {
          parentPath: null,
          prim: { path: "/Root", name: "Root", children: [] },
        },
      };

      const newState = reducer(state, action);
      expect(newState.composedHierarchy).toHaveLength(1);
      expect(newState.composedHierarchy[0].name).toBe("Root");
    });
  });

  describe("REMOVE_PRIM", () => {
    it("should remove a prim from root level", () => {
      const state = {
        composedHierarchy: [
          { path: "/Root1", name: "Root1", children: [] },
          { path: "/Root2", name: "Root2", children: [] },
        ],
      };

      const action = {
        type: "REMOVE_PRIM",
        payload: {
          primPath: "/Root1",
        },
      };

      const newState = reducer(state, action);
      expect(newState.composedHierarchy).toHaveLength(1);
      expect(newState.composedHierarchy[0].name).toBe("Root2");
    });

    it("should remove a nested prim", () => {
      const state = {
        composedHierarchy: [
          {
            path: "/Root",
            name: "Root",
            children: [
              { path: "/Root/Child1", name: "Child1", children: [] },
              { path: "/Root/Child2", name: "Child2", children: [] },
            ],
          },
        ],
      };

      const action = {
        type: "REMOVE_PRIM",
        payload: {
          primPath: "/Root/Child1",
        },
      };

      const newState = reducer(state, action);
      expect(newState.composedHierarchy[0].children).toHaveLength(1);
      expect(newState.composedHierarchy[0].children[0].name).toBe("Child2");
    });
  });
});

describe("Reducer - Commit Operations", () => {
  describe("COMMIT_CHANGES", () => {
    it("should create a commit from staged changes", () => {
      const state = {
        currentUser: "TestUser",
        stagedChanges: [
          { type: "add", path: "/Root/Child1" },
          { type: "update", path: "/Root/Child2" },
        ],
        history: {
          commits: new Map(),
          roots: [],
        },
      };

      const action = {
        type: "COMMIT_CHANGES",
        payload: {
          commitMessage: "Test commit message",
        },
      };

      const newState = reducer(state, action);
      expect(newState.stagedChanges).toEqual([]);
      expect(newState.history.commits.size).toBe(1);
      expect(newState.headCommitId).toBeDefined();

      const commit = newState.history.commits.get(newState.headCommitId);
      expect(commit.message).toBe("Test commit message");
      expect(commit.author).toBe("TestUser");
      expect(commit.changes).toHaveLength(2);
      expect(commit.timestamp).toBeDefined();
      expect(commit.id).toBeDefined();
    });

    it("should not create commit when no staged changes", () => {
      const state = {
        stagedChanges: [],
        history: {
          commits: new Map(),
          roots: [],
        },
      };

      const action = {
        type: "COMMIT_CHANGES",
        payload: {
          commitMessage: "Empty commit",
        },
      };

      const newState = reducer(state, action);
      expect(newState).toBe(state); // Should return same state reference
    });

    it("should use default author when currentUser is undefined", () => {
      const state = {
        stagedChanges: [{ type: "add", path: "/Root" }],
        history: {
          commits: new Map(),
          roots: [],
        },
      };

      const action = {
        type: "COMMIT_CHANGES",
        payload: {
          commitMessage: "Test commit",
        },
      };

      const newState = reducer(state, action);
      const commit = newState.history.commits.get(newState.headCommitId);
      expect(commit.author).toBe("Unknown");
    });
  });
});

describe("Helper Functions", () => {
  describe("updatePrimInHierarchy", () => {
    it("should find and update nested prim", () => {
      const hierarchy = [
        {
          path: "/Root",
          name: "Root",
          children: [{ path: "/Root/Child", name: "Child", children: [] }],
        },
      ];

      const updated = updatePrimInHierarchy(hierarchy, "/Root/Child", {
        name: "UpdatedChild",
        value: 42,
      });
      expect(updated[0].children[0].name).toBe("UpdatedChild");
      expect(updated[0].children[0].value).toBe(42);
    });

    it("should handle null or invalid hierarchy", () => {
      expect(updatePrimInHierarchy(null, "/Root", {})).toBe(null);
      expect(updatePrimInHierarchy(undefined, "/Root", {})).toBe(undefined);
      expect(updatePrimInHierarchy("invalid", "/Root", {})).toBe("invalid");
    });
  });

  describe("addPrimToHierarchy", () => {
    it("should add to correct parent", () => {
      const hierarchy = [{ path: "/Root", name: "Root", children: [] }];
      const newPrim = { path: "/Root/Child", name: "Child", children: [] };

      const updated = addPrimToHierarchy(hierarchy, "/Root", newPrim);
      expect(updated[0].children).toHaveLength(1);
      expect(updated[0].children[0]).toBe(newPrim);
    });

    it("should handle empty hierarchy", () => {
      const newPrim = { path: "/Root", name: "Root", children: [] };
      const updated = addPrimToHierarchy(null, null, newPrim);
      expect(updated).toEqual([newPrim]);
    });
  });

  describe("removePrimFromHierarchy", () => {
    it("should remove prim and preserve others", () => {
      const hierarchy = [
        { path: "/Root1", name: "Root1", children: [] },
        { path: "/Root2", name: "Root2", children: [] },
      ];

      const updated = removePrimFromHierarchy(hierarchy, "/Root1");
      expect(updated).toHaveLength(1);
      expect(updated[0].name).toBe("Root2");
    });
  });

  describe("generateId", () => {
    it("should produce unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
    });

    it("should include timestamp", () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-/);
    });
  });
});
