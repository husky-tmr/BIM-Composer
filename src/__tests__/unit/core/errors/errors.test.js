// src/__tests__/unit/core/errors/errors.test.js
/**
 * Tests for custom error classes
 * Note: describe, it, expect are available globally via globals: true in vite.config.js
 */
import {
  AppError,
  ParseError,
  ValidationError,
  StateError,
  FileError,
  RenderError,
  NetworkError,
  ERROR_MESSAGES,
} from "../../../../core/errors/errors.js";

describe("Custom Error Classes", () => {
  describe("AppError", () => {
    it("should create an error with message, code, and details", () => {
      const error = new AppError("Test error", "TEST_ERROR", {
        extra: "info",
      });

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_ERROR");
      expect(error.details).toEqual({ extra: "info" });
      expect(error.name).toBe("AppError");
    });

    it("should have a timestamp", () => {
      const before = Date.now();
      const error = new AppError("Test", "CODE");
      const after = Date.now();

      expect(error.timestamp).toBeGreaterThanOrEqual(before);
      expect(error.timestamp).toBeLessThanOrEqual(after);
    });

    it("should have default empty details", () => {
      const error = new AppError("Test", "CODE");
      expect(error.details).toEqual({});
    });

    it("should have a stack trace", () => {
      const error = new AppError("Test", "CODE");
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
    });

    it("should be an instance of Error", () => {
      const error = new AppError("Test", "CODE");
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it("should serialize to JSON", () => {
      const error = new AppError("Test error", "TEST_CODE", { key: "value" });
      const json = error.toJSON();

      expect(json).toEqual({
        name: "AppError",
        message: "Test error",
        code: "TEST_CODE",
        details: { key: "value" },
        timestamp: error.timestamp,
        stack: error.stack,
      });
    });

    it("should capture stack trace correctly", () => {
      const error = new AppError("Test", "CODE");
      expect(error.stack).toContain("AppError");
    });
  });

  describe("ParseError", () => {
    it("should create a parse error with line and column", () => {
      const error = new ParseError("Syntax error", 10, 5);

      expect(error.message).toBe("Syntax error");
      expect(error.code).toBe("PARSE_ERROR");
      expect(error.line).toBe(10);
      expect(error.column).toBe(5);
      expect(error.details.line).toBe(10);
      expect(error.details.column).toBe(5);
    });

    it("should include additional details", () => {
      const error = new ParseError("Syntax error", 10, 5, { token: "}" });

      expect(error.details.token).toBe("}");
      expect(error.details.line).toBe(10);
      expect(error.details.column).toBe(5);
    });

    it("should be an instance of AppError", () => {
      const error = new ParseError("Test", 1, 1);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof ParseError).toBe(true);
    });

    it("should have correct name", () => {
      const error = new ParseError("Test", 1, 1);
      expect(error.name).toBe("ParseError");
    });

    it("should serialize to JSON with parse-specific fields", () => {
      const error = new ParseError("Syntax error", 10, 5, { token: "}" });
      const json = error.toJSON();

      expect(json.name).toBe("ParseError");
      expect(json.code).toBe("PARSE_ERROR");
      expect(json.details.line).toBe(10);
      expect(json.details.column).toBe(5);
      expect(json.details.token).toBe("}");
    });
  });

  describe("ValidationError", () => {
    it("should create a validation error with field and value", () => {
      const error = new ValidationError("Invalid input", "email", "test@");

      expect(error.message).toBe("Invalid input");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.field).toBe("email");
      expect(error.value).toBe("test@");
      expect(error.details.field).toBe("email");
      expect(error.details.value).toBe("test@");
    });

    it("should include additional details", () => {
      const error = new ValidationError("Invalid input", "age", -5, {
        min: 0,
        max: 120,
      });

      expect(error.details.min).toBe(0);
      expect(error.details.max).toBe(120);
      expect(error.details.field).toBe("age");
      expect(error.details.value).toBe(-5);
    });

    it("should be an instance of AppError", () => {
      const error = new ValidationError("Test", "field", "value");
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
    });

    it("should have correct name", () => {
      const error = new ValidationError("Test", "field", "value");
      expect(error.name).toBe("ValidationError");
    });

    it("should handle null or undefined values", () => {
      const error1 = new ValidationError("Required", "field", null);
      const error2 = new ValidationError("Required", "field", undefined);

      expect(error1.value).toBe(null);
      expect(error2.value).toBe(undefined);
    });
  });

  describe("StateError", () => {
    it("should create a state error", () => {
      const error = new StateError("Invalid state transition");

      expect(error.message).toBe("Invalid state transition");
      expect(error.code).toBe("STATE_ERROR");
      expect(error.name).toBe("StateError");
    });

    it("should include details", () => {
      const error = new StateError("Invalid state", {
        from: "WIP",
        to: "Archived",
      });

      expect(error.details.from).toBe("WIP");
      expect(error.details.to).toBe("Archived");
    });

    it("should be an instance of AppError", () => {
      const error = new StateError("Test");
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof StateError).toBe(true);
    });

    it("should have default empty details", () => {
      const error = new StateError("Test");
      expect(error.details).toEqual({});
    });
  });

  describe("FileError", () => {
    it("should create a file error with fileName", () => {
      const error = new FileError("File not found", "scene.usda");

      expect(error.message).toBe("File not found");
      expect(error.code).toBe("FILE_ERROR");
      expect(error.fileName).toBe("scene.usda");
      expect(error.details.fileName).toBe("scene.usda");
      expect(error.name).toBe("FileError");
    });

    it("should include additional details", () => {
      const error = new FileError("Read error", "scene.usda", {
        path: "/full/path/scene.usda",
      });

      expect(error.details.path).toBe("/full/path/scene.usda");
      expect(error.details.fileName).toBe("scene.usda");
    });

    it("should be an instance of AppError", () => {
      const error = new FileError("Test", "file.txt");
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof FileError).toBe(true);
    });

    it("should handle empty fileName", () => {
      const error = new FileError("Error", "");
      expect(error.fileName).toBe("");
    });
  });

  describe("RenderError", () => {
    it("should create a render error", () => {
      const error = new RenderError("WebGL not supported");

      expect(error.message).toBe("WebGL not supported");
      expect(error.code).toBe("RENDER_ERROR");
      expect(error.name).toBe("RenderError");
    });

    it("should include details", () => {
      const error = new RenderError("Shader error", {
        shader: "vertex",
        line: 42,
      });

      expect(error.details.shader).toBe("vertex");
      expect(error.details.line).toBe(42);
    });

    it("should be an instance of AppError", () => {
      const error = new RenderError("Test");
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof RenderError).toBe(true);
    });

    it("should have default empty details", () => {
      const error = new RenderError("Test");
      expect(error.details).toEqual({});
    });
  });

  describe("NetworkError", () => {
    it("should create a network error with url and status", () => {
      const error = new NetworkError(
        "Request failed",
        "https://api.example.com",
        404
      );

      expect(error.message).toBe("Request failed");
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.url).toBe("https://api.example.com");
      expect(error.status).toBe(404);
      expect(error.details.url).toBe("https://api.example.com");
      expect(error.details.status).toBe(404);
      expect(error.name).toBe("NetworkError");
    });

    it("should include additional details", () => {
      const error = new NetworkError("Timeout", "https://api.example.com", 0, {
        timeout: 5000,
      });

      expect(error.details.timeout).toBe(5000);
      expect(error.details.url).toBe("https://api.example.com");
      expect(error.details.status).toBe(0);
    });

    it("should be an instance of AppError", () => {
      const error = new NetworkError("Test", "url", 500);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof NetworkError).toBe(true);
    });

    it("should handle various HTTP status codes", () => {
      const error400 = new NetworkError("Bad Request", "url", 400);
      const error500 = new NetworkError("Server Error", "url", 500);
      const error0 = new NetworkError("Network Error", "url", 0);

      expect(error400.status).toBe(400);
      expect(error500.status).toBe(500);
      expect(error0.status).toBe(0);
    });
  });

  describe("ERROR_MESSAGES", () => {
    it("should have PARSE_ERROR messages", () => {
      expect(ERROR_MESSAGES.PARSE_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.PARSE_ERROR.INVALID_SYNTAX).toBe(
        "Invalid USDA syntax"
      );
      expect(ERROR_MESSAGES.PARSE_ERROR.UNEXPECTED_TOKEN).toBe(
        "Unexpected token in USDA file"
      );
      expect(ERROR_MESSAGES.PARSE_ERROR.MISSING_BRACKET).toBe(
        "Missing closing bracket"
      );
      expect(ERROR_MESSAGES.PARSE_ERROR.INVALID_PRIM_PATH).toBe(
        "Invalid prim path"
      );
    });

    it("should have VALIDATION_ERROR messages", () => {
      expect(ERROR_MESSAGES.VALIDATION_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.VALIDATION_ERROR.REQUIRED_FIELD).toBe(
        "This field is required"
      );
      expect(ERROR_MESSAGES.VALIDATION_ERROR.INVALID_FORMAT).toBe(
        "Invalid format"
      );
      expect(ERROR_MESSAGES.VALIDATION_ERROR.OUT_OF_RANGE).toBe(
        "Value out of valid range"
      );
    });

    it("should have FILE_ERROR messages", () => {
      expect(ERROR_MESSAGES.FILE_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.FILE_ERROR.NOT_FOUND).toBe("File not found");
      expect(ERROR_MESSAGES.FILE_ERROR.READ_ERROR).toBe("Could not read file");
      expect(ERROR_MESSAGES.FILE_ERROR.WRITE_ERROR).toBe(
        "Could not write file"
      );
      expect(ERROR_MESSAGES.FILE_ERROR.INVALID_TYPE).toBe("Invalid file type");
    });

    it("should have RENDER_ERROR messages", () => {
      expect(ERROR_MESSAGES.RENDER_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.RENDER_ERROR.WEBGL_NOT_SUPPORTED).toBe(
        "WebGL is not supported in your browser"
      );
      expect(ERROR_MESSAGES.RENDER_ERROR.CONTEXT_LOST).toBe(
        "WebGL context was lost"
      );
      expect(ERROR_MESSAGES.RENDER_ERROR.SHADER_ERROR).toBe(
        "Shader compilation error"
      );
    });

    it("should have all required error categories", () => {
      expect(ERROR_MESSAGES).toHaveProperty("PARSE_ERROR");
      expect(ERROR_MESSAGES).toHaveProperty("VALIDATION_ERROR");
      expect(ERROR_MESSAGES).toHaveProperty("FILE_ERROR");
      expect(ERROR_MESSAGES).toHaveProperty("RENDER_ERROR");
    });

    it("should have non-empty message strings", () => {
      Object.values(ERROR_MESSAGES).forEach((category) => {
        Object.values(category).forEach((message) => {
          expect(typeof message).toBe("string");
          expect(message.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("Error inheritance chain", () => {
    it("should maintain proper inheritance for all error types", () => {
      const errors = [
        new ParseError("Test", 1, 1),
        new ValidationError("Test", "field", "value"),
        new StateError("Test"),
        new FileError("Test", "file"),
        new RenderError("Test"),
        new NetworkError("Test", "url", 500),
      ];

      errors.forEach((error) => {
        expect(error instanceof Error).toBe(true);
        expect(error instanceof AppError).toBe(true);
      });
    });

    it("should have unique names for each error type", () => {
      const errors = [
        new AppError("Test", "CODE"),
        new ParseError("Test", 1, 1),
        new ValidationError("Test", "field", "value"),
        new StateError("Test"),
        new FileError("Test", "file"),
        new RenderError("Test"),
        new NetworkError("Test", "url", 500),
      ];

      const names = errors.map((e) => e.name);
      const uniqueNames = new Set(names);

      expect(names.length).toBe(uniqueNames.size);
    });
  });
});
