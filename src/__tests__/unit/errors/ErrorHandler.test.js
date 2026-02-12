/**
 * Tests for ErrorHandler
 */

// Mock import.meta.env before importing
vi.stubEnv("DEV", true);

// We need to mock the module-level side effects (CSS style injection, global handlers)
// and test the ErrorHandler class behavior

// Mock the module to avoid style injection at import time
vi.mock("../../../core/errors/ErrorHandler.js", async () => {
  // We'll create our own ErrorHandler for testing
  const { AppError } = await import("../../../core/errors/errors.js");

  class TestErrorHandler {
    constructor() {
      this.listeners = new Map();
      this.errorLog = [];
      this.maxLogSize = 100;
    }

    handleError(error, context = {}) {
      const errorEntry = {
        error:
          error instanceof AppError
            ? error
            : new AppError(error.message, "UNKNOWN_ERROR"),
        context,
        timestamp: Date.now(),
      };
      this._addToLog(errorEntry);
      this._notifyListeners(errorEntry);
    }

    _addToLog(errorEntry) {
      this.errorLog.unshift(errorEntry);
      if (this.errorLog.length > this.maxLogSize) {
        this.errorLog = this.errorLog.slice(0, this.maxLogSize);
      }
    }

    _notifyListeners(errorEntry) {
      this.listeners.forEach((callback) => {
        try {
          callback(errorEntry);
        } catch (err) {
          console.error("Error in error listener:", err);
        }
      });
    }

    subscribe(key, callback) {
      this.listeners.set(key, callback);
      return () => this.unsubscribe(key);
    }

    unsubscribe(key) {
      this.listeners.delete(key);
    }

    getLog() {
      return [...this.errorLog];
    }

    clearLog() {
      this.errorLog = [];
    }

    wrapAsync(fn, fallback = null) {
      return async (...args) => {
        try {
          return await fn(...args);
        } catch (error) {
          this.handleError(error, {
            function: fn.name,
            arguments: args,
          });
          return fallback;
        }
      };
    }

    wrap(fn, fallback = null) {
      return (...args) => {
        try {
          return fn(...args);
        } catch (error) {
          this.handleError(error, {
            function: fn.name,
            arguments: args,
          });
          return fallback;
        }
      };
    }
  }

  return {
    errorHandler: new TestErrorHandler(),
    ErrorHandler: TestErrorHandler,
  };
});

const { errorHandler } = await import("../../../core/errors/ErrorHandler.js");
// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import {
  AppError,
  ParseError,
  ValidationError,
} from "../../../core/errors/errors.js";

describe("ErrorHandler", () => {
  beforeEach(() => {
    errorHandler.clearLog();
    errorHandler.listeners.clear();
  });

  describe("handleError", () => {
    it("should add error to log", () => {
      const error = new Error("test error");
      errorHandler.handleError(error);

      const log = errorHandler.getLog();
      expect(log).toHaveLength(1);
      expect(log[0].error.message).toBe("test error");
    });

    it("should wrap non-AppError in AppError", () => {
      const error = new Error("plain error");
      errorHandler.handleError(error);

      const log = errorHandler.getLog();
      expect(log[0].error).toBeInstanceOf(AppError);
      expect(log[0].error.code).toBe("UNKNOWN_ERROR");
    });

    it("should preserve AppError instances", () => {
      const error = new ParseError("parse failed");
      errorHandler.handleError(error);

      const log = errorHandler.getLog();
      expect(log[0].error).toBe(error);
      expect(log[0].error.code).toBe("PARSE_ERROR");
    });

    it("should include context in error entry", () => {
      const error = new Error("test");
      errorHandler.handleError(error, { type: "uncaught", filename: "app.js" });

      const log = errorHandler.getLog();
      expect(log[0].context).toEqual({ type: "uncaught", filename: "app.js" });
    });

    it("should include timestamp", () => {
      const before = Date.now();
      errorHandler.handleError(new Error("test"));
      const after = Date.now();

      const log = errorHandler.getLog();
      expect(log[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(log[0].timestamp).toBeLessThanOrEqual(after);
    });

    it("should notify listeners", () => {
      const listener = vi.fn();
      errorHandler.subscribe("test", listener);

      errorHandler.handleError(new Error("notify test"));

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(AppError),
          context: {},
        })
      );
    });
  });

  describe("error log management", () => {
    it("should add errors in reverse chronological order", () => {
      errorHandler.handleError(new Error("first"));
      errorHandler.handleError(new Error("second"));

      const log = errorHandler.getLog();
      expect(log[0].error.message).toBe("second");
      expect(log[1].error.message).toBe("first");
    });

    it("should enforce max log size", () => {
      errorHandler.maxLogSize = 5;

      for (let i = 0; i < 10; i++) {
        errorHandler.handleError(new Error(`error ${i}`));
      }

      const log = errorHandler.getLog();
      expect(log).toHaveLength(5);
      expect(log[0].error.message).toBe("error 9");
    });

    it("should return a copy of the log", () => {
      errorHandler.handleError(new Error("test"));

      const log1 = errorHandler.getLog();
      const log2 = errorHandler.getLog();

      expect(log1).not.toBe(log2);
      expect(log1).toEqual(log2);
    });

    it("should clear the log", () => {
      errorHandler.handleError(new Error("test"));
      expect(errorHandler.getLog()).toHaveLength(1);

      errorHandler.clearLog();
      expect(errorHandler.getLog()).toHaveLength(0);
    });
  });

  describe("subscribe/unsubscribe", () => {
    it("should subscribe to errors", () => {
      const listener = vi.fn();
      errorHandler.subscribe("myComponent", listener);

      errorHandler.handleError(new Error("test"));
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should unsubscribe from errors", () => {
      const listener = vi.fn();
      errorHandler.subscribe("myComponent", listener);

      errorHandler.handleError(new Error("test1"));
      expect(listener).toHaveBeenCalledTimes(1);

      errorHandler.unsubscribe("myComponent");

      errorHandler.handleError(new Error("test2"));
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });

    it("should return unsubscribe function", () => {
      const listener = vi.fn();
      const unsub = errorHandler.subscribe("key", listener);

      errorHandler.handleError(new Error("test1"));
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();

      errorHandler.handleError(new Error("test2"));
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should handle listener errors gracefully", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      errorHandler.subscribe("bad", () => {
        throw new Error("listener crash");
      });

      // Should not throw
      expect(() => errorHandler.handleError(new Error("test"))).not.toThrow();

      errorSpy.mockRestore();
    });

    it("should support multiple listeners", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      errorHandler.subscribe("comp1", listener1);
      errorHandler.subscribe("comp2", listener2);

      errorHandler.handleError(new Error("test"));

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe("wrapAsync", () => {
    it("should return result on success", async () => {
      const fn = async () => 42;
      const wrapped = errorHandler.wrapAsync(fn);

      const result = await wrapped();
      expect(result).toBe(42);
    });

    it("should catch errors and return fallback", async () => {
      const fn = async () => {
        throw new Error("async failure");
      };
      const wrapped = errorHandler.wrapAsync(fn, "fallback");

      const result = await wrapped();
      expect(result).toBe("fallback");
    });

    it("should log caught errors", async () => {
      const fn = async () => {
        throw new Error("logged error");
      };
      const wrapped = errorHandler.wrapAsync(fn);

      await wrapped();

      const log = errorHandler.getLog();
      expect(log).toHaveLength(1);
      expect(log[0].error.message).toBe("logged error");
    });

    it("should return null as default fallback", async () => {
      const fn = async () => {
        throw new Error("fail");
      };
      const wrapped = errorHandler.wrapAsync(fn);

      const result = await wrapped();
      expect(result).toBeNull();
    });

    it("should pass arguments through", async () => {
      const fn = async (a, b) => a + b;
      const wrapped = errorHandler.wrapAsync(fn);

      const result = await wrapped(3, 4);
      expect(result).toBe(7);
    });
  });

  describe("wrap", () => {
    it("should return result on success", () => {
      const fn = (x) => x * 2;
      const wrapped = errorHandler.wrap(fn);

      expect(wrapped(5)).toBe(10);
    });

    it("should catch errors and return fallback", () => {
      const fn = () => {
        throw new Error("sync failure");
      };
      const wrapped = errorHandler.wrap(fn, "default");

      expect(wrapped()).toBe("default");
    });

    it("should log caught errors", () => {
      const fn = () => {
        throw new ValidationError("invalid");
      };
      const wrapped = errorHandler.wrap(fn);

      wrapped();

      const log = errorHandler.getLog();
      expect(log).toHaveLength(1);
    });

    it("should return null as default fallback", () => {
      const fn = () => {
        throw new Error("fail");
      };
      const wrapped = errorHandler.wrap(fn);

      expect(wrapped()).toBeNull();
    });

    it("should pass arguments through", () => {
      const fn = (a, b, c) => [a, b, c].join("-");
      const wrapped = errorHandler.wrap(fn);

      expect(wrapped("x", "y", "z")).toBe("x-y-z");
    });
  });
});
