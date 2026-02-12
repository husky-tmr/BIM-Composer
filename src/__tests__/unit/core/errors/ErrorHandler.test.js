// src/__tests__/unit/core/errors/ErrorHandler.test.js
/**
 * Tests for centralized error handler
 * Note: describe, it, expect are available globally via globals: true in vite.config.js
 */
import { ErrorHandler } from "../../../../core/errors/ErrorHandler.js";
import { AppError, ValidationError } from "../../../../core/errors/errors.js";

describe("ErrorHandler", () => {
  let errorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    // Clear error log between tests
    errorHandler.clearLog();
    // Clear listeners between tests
    errorHandler.listeners.clear();
  });

  describe("constructor", () => {
    it("should initialize with empty listeners map", () => {
      expect(errorHandler.listeners).toBeInstanceOf(Map);
      expect(errorHandler.listeners.size).toBe(0);
    });

    it("should initialize with empty error log", () => {
      expect(errorHandler.errorLog).toEqual([]);
    });

    it("should set maxLogSize to 100", () => {
      expect(errorHandler.maxLogSize).toBe(100);
    });
  });

  describe("handleError", () => {
    it("should handle AppError instances", () => {
      const error = new AppError("Test error", "TEST_CODE");
      errorHandler.handleError(error);

      const log = errorHandler.getLog();
      expect(log).toHaveLength(1);
      expect(log[0].error).toBe(error);
    });

    it("should convert generic Error to AppError", () => {
      const error = new Error("Generic error");
      errorHandler.handleError(error);

      const log = errorHandler.getLog();
      expect(log).toHaveLength(1);
      expect(log[0].error).toBeInstanceOf(AppError);
      expect(log[0].error.message).toBe("Generic error");
      expect(log[0].error.code).toBe("UNKNOWN_ERROR");
    });

    it("should add context to error entry", () => {
      const error = new Error("Test error");
      const context = { source: "test", action: "testAction" };
      errorHandler.handleError(error, context);

      const log = errorHandler.getLog();
      expect(log[0].context).toEqual(context);
    });

    it("should add timestamp to error entry", () => {
      const before = Date.now();
      const error = new Error("Test error");
      errorHandler.handleError(error);
      const after = Date.now();

      const log = errorHandler.getLog();
      expect(log[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(log[0].timestamp).toBeLessThanOrEqual(after);
    });

    it("should notify all listeners", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      errorHandler.subscribe("listener1", listener1);
      errorHandler.subscribe("listener2", listener2);

      const error = new Error("Test error");
      errorHandler.handleError(error);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener1.mock.calls[0][0].error.message).toBe("Test error");
    });

    it("should not throw if listener throws", () => {
      const throwingListener = vi.fn(() => {
        throw new Error("Listener error");
      });
      const workingListener = vi.fn();

      errorHandler.subscribe("throwing", throwingListener);
      errorHandler.subscribe("working", workingListener);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        errorHandler.handleError(new Error("Test"));
      }).not.toThrow();

      expect(throwingListener).toHaveBeenCalled();
      expect(workingListener).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("_addToLog", () => {
    it("should add error to beginning of log", () => {
      const entry1 = { error: new Error("First"), timestamp: 1 };
      const entry2 = { error: new Error("Second"), timestamp: 2 };

      errorHandler._addToLog(entry1);
      errorHandler._addToLog(entry2);

      const log = errorHandler.getLog();
      expect(log[0]).toBe(entry2);
      expect(log[1]).toBe(entry1);
    });

    it("should maintain maxLogSize limit", () => {
      errorHandler.maxLogSize = 3;

      for (let i = 0; i < 5; i++) {
        errorHandler._addToLog({
          error: new Error(`Error ${i}`),
          timestamp: i,
        });
      }

      expect(errorHandler.errorLog).toHaveLength(3);
      expect(errorHandler.errorLog[0].timestamp).toBe(4);
      expect(errorHandler.errorLog[2].timestamp).toBe(2);
    });
  });

  describe("_notifyListeners", () => {
    it("should call all registered listeners", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      errorHandler.listeners.set("l1", listener1);
      errorHandler.listeners.set("l2", listener2);

      const errorEntry = { error: new Error("Test"), timestamp: Date.now() };
      errorHandler._notifyListeners(errorEntry);

      expect(listener1).toHaveBeenCalledWith(errorEntry);
      expect(listener2).toHaveBeenCalledWith(errorEntry);
    });

    it("should handle empty listeners", () => {
      const errorEntry = { error: new Error("Test"), timestamp: Date.now() };
      expect(() => errorHandler._notifyListeners(errorEntry)).not.toThrow();
    });
  });

  describe("_getUserMessage", () => {
    it("should return AppError message", () => {
      const error = new AppError("Custom error message", "CODE");
      const message = errorHandler._getUserMessage(error);
      expect(message).toBe("Custom error message");
    });

    it("should return ValidationError message", () => {
      const error = new ValidationError("Invalid value", "field", "value");
      const message = errorHandler._getUserMessage(error);
      expect(message).toBe("Invalid value");
    });

    it("should return generic message for non-AppError", () => {
      const error = new Error("Something broke");
      const message = errorHandler._getUserMessage(error);
      expect(message).toBe("An unexpected error occurred. Please try again.");
    });
  });

  describe("subscribe / unsubscribe", () => {
    it("should add listener on subscribe", () => {
      const callback = vi.fn();
      errorHandler.subscribe("test", callback);

      expect(errorHandler.listeners.has("test")).toBe(true);
      expect(errorHandler.listeners.get("test")).toBe(callback);
    });

    it("should return unsubscribe function", () => {
      const callback = vi.fn();
      const unsubscribe = errorHandler.subscribe("test", callback);

      expect(typeof unsubscribe).toBe("function");
    });

    it("should remove listener on unsubscribe", () => {
      const callback = vi.fn();
      errorHandler.subscribe("test", callback);
      errorHandler.unsubscribe("test");

      expect(errorHandler.listeners.has("test")).toBe(false);
    });

    it("should remove listener when calling returned function", () => {
      const callback = vi.fn();
      const unsubscribe = errorHandler.subscribe("test", callback);
      unsubscribe();

      expect(errorHandler.listeners.has("test")).toBe(false);
    });

    it("should allow multiple listeners with different keys", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      errorHandler.subscribe("key1", callback1);
      errorHandler.subscribe("key2", callback2);

      expect(errorHandler.listeners.size).toBe(2);
    });

    it("should replace listener with same key", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      errorHandler.subscribe("test", callback1);
      errorHandler.subscribe("test", callback2);

      expect(errorHandler.listeners.size).toBe(1);
      expect(errorHandler.listeners.get("test")).toBe(callback2);
    });
  });

  describe("getLog", () => {
    it("should return copy of error log", () => {
      const error = new Error("Test");
      errorHandler.handleError(error);

      const log = errorHandler.getLog();
      expect(log).toHaveLength(1);
      expect(log).not.toBe(errorHandler.errorLog);
    });

    it("should return empty array when no errors", () => {
      const log = errorHandler.getLog();
      expect(log).toEqual([]);
    });
  });

  describe("clearLog", () => {
    it("should clear error log", () => {
      errorHandler.handleError(new Error("Error 1"));
      errorHandler.handleError(new Error("Error 2"));

      expect(errorHandler.getLog()).toHaveLength(2);

      errorHandler.clearLog();

      expect(errorHandler.getLog()).toHaveLength(0);
    });
  });

  describe("wrapAsync", () => {
    it("should return function result on success", async () => {
      const fn = async (x, y) => x + y;
      const wrapped = errorHandler.wrapAsync(fn);

      const result = await wrapped(2, 3);
      expect(result).toBe(5);
    });

    it("should handle errors and return fallback", async () => {
      const fn = async () => {
        throw new Error("Async error");
      };
      const wrapped = errorHandler.wrapAsync(fn, "fallback");

      const result = await wrapped();
      expect(result).toBe("fallback");

      const log = errorHandler.getLog();
      expect(log).toHaveLength(1);
      expect(log[0].error.message).toBe("Async error");
    });

    it("should use null as default fallback", async () => {
      const fn = async () => {
        throw new Error("Error");
      };
      const wrapped = errorHandler.wrapAsync(fn);

      const result = await wrapped();
      expect(result).toBe(null);
    });

    it("should include function name and arguments in context", async () => {
      function namedFn() {
        throw new Error("Test error");
      }
      const wrapped = errorHandler.wrapAsync(namedFn);

      await wrapped(1, 2);

      const log = errorHandler.getLog();
      expect(log[0].context.function).toBe("namedFn");
      expect(log[0].context.arguments).toEqual([1, 2]);
    });
  });

  describe("wrap", () => {
    it("should return function result on success", () => {
      const fn = (x, y) => x * y;
      const wrapped = errorHandler.wrap(fn);

      const result = wrapped(3, 4);
      expect(result).toBe(12);
    });

    it("should handle errors and return fallback", () => {
      const fn = () => {
        throw new Error("Sync error");
      };
      const wrapped = errorHandler.wrap(fn, "fallback");

      const result = wrapped();
      expect(result).toBe("fallback");

      const log = errorHandler.getLog();
      expect(log).toHaveLength(1);
      expect(log[0].error.message).toBe("Sync error");
    });

    it("should use null as default fallback", () => {
      const fn = () => {
        throw new Error("Error");
      };
      const wrapped = errorHandler.wrap(fn);

      const result = wrapped();
      expect(result).toBe(null);
    });

    it("should include function name and arguments in context", () => {
      function namedFn() {
        throw new Error("Test error");
      }
      const wrapped = errorHandler.wrap(namedFn);

      wrapped(5, 6);

      const log = errorHandler.getLog();
      expect(log[0].context.function).toBe("namedFn");
      expect(log[0].context.arguments).toEqual([5, 6]);
    });
  });

  describe("integration tests", () => {
    it("should handle multiple errors in sequence", () => {
      errorHandler.handleError(new Error("Error 1"));
      errorHandler.handleError(new AppError("Error 2", "CODE_2"));
      errorHandler.handleError(new ValidationError("Error 3", "field", "val"));

      const log = errorHandler.getLog();
      expect(log).toHaveLength(3);
      expect(log[0].error.message).toBe("Error 3");
      expect(log[1].error.message).toBe("Error 2");
      expect(log[2].error.message).toBe("Error 1");
    });

    it("should work with subscribe and handleError", () => {
      const errors = [];
      errorHandler.subscribe("collector", (entry) => {
        errors.push(entry.error.message);
      });

      errorHandler.handleError(new Error("First"));
      errorHandler.handleError(new Error("Second"));

      expect(errors).toEqual(["First", "Second"]);
    });

    it("should allow unsubscribe mid-stream", () => {
      const callback = vi.fn();
      const unsubscribe = errorHandler.subscribe("test", callback);

      errorHandler.handleError(new Error("Before"));
      unsubscribe();
      errorHandler.handleError(new Error("After"));

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
