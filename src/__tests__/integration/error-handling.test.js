/**
 * Integration Tests: Error Handling
 * Tests the centralized error handling system
 */

// Note: vi, describe, it, expect, beforeEach, afterEach are available globally via globals: true in vite.config.js
import {
  AppError,
  ParseError,
  ValidationError,
  StateError,
  FileError,
  RenderError,
  NetworkError,
  ERROR_MESSAGES,
} from "../../core/errors/errors.js";

describe("Integration: Error Handling", () => {
  describe("Error Classes", () => {
    describe("AppError", () => {
      it("should create an AppError with message and code", () => {
        const error = new AppError("Something failed", "TEST_ERROR");

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe("Something failed");
        expect(error.code).toBe("TEST_ERROR");
        expect(error.name).toBe("AppError");
        expect(error.timestamp).toBeDefined();
      });

      it("should include details", () => {
        const error = new AppError("Failed", "ERROR", { key: "value" });

        expect(error.details).toEqual({ key: "value" });
      });

      it("should serialize to JSON", () => {
        const error = new AppError("Test error", "TEST_CODE", {
          extra: "info",
        });
        const json = error.toJSON();

        expect(json.name).toBe("AppError");
        expect(json.message).toBe("Test error");
        expect(json.code).toBe("TEST_CODE");
        expect(json.details).toEqual({ extra: "info" });
        expect(json.timestamp).toBeDefined();
        expect(json.stack).toBeDefined();
      });

      it("should have a proper stack trace", () => {
        const error = new AppError("Stack test", "STACK_CODE");

        expect(error.stack).toBeDefined();
        expect(error.stack).toContain("Stack test");
      });
    });

    describe("ParseError", () => {
      it("should create a ParseError with line and column", () => {
        const error = new ParseError("Invalid syntax", 10, 5);

        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(ParseError);
        expect(error.code).toBe("PARSE_ERROR");
        expect(error.line).toBe(10);
        expect(error.column).toBe(5);
        expect(error.details.line).toBe(10);
        expect(error.details.column).toBe(5);
      });

      it("should include additional details", () => {
        const error = new ParseError("Bad token", 1, 1, { token: "def" });

        expect(error.details.token).toBe("def");
        expect(error.details.line).toBe(1);
      });
    });

    describe("ValidationError", () => {
      it("should create a ValidationError with field and value", () => {
        const error = new ValidationError("Invalid name", "name", "");

        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.field).toBe("name");
        expect(error.value).toBe("");
      });

      it("should include field and value in details", () => {
        const error = new ValidationError("Bad value", "status", "INVALID");

        expect(error.details.field).toBe("status");
        expect(error.details.value).toBe("INVALID");
      });
    });

    describe("StateError", () => {
      it("should create a StateError with state context", () => {
        const error = new StateError("Invalid state transition", {
          from: "A",
          to: "B",
        });

        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(StateError);
        expect(error.code).toBe("STATE_ERROR");
        expect(error.details).toEqual({ from: "A", to: "B" });
      });
    });

    describe("FileError", () => {
      it("should create a FileError with fileName", () => {
        const error = new FileError("File not found", "scene.usda");

        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(FileError);
        expect(error.code).toBe("FILE_ERROR");
        expect(error.fileName).toBe("scene.usda");
        expect(error.details.fileName).toBe("scene.usda");
      });

      it("should include additional details", () => {
        const error = new FileError("Read error", "test.usda", { size: 1024 });

        expect(error.details.fileName).toBe("test.usda");
        expect(error.details.size).toBe(1024);
      });
    });

    describe("RenderError", () => {
      it("should create a RenderError", () => {
        const error = new RenderError("WebGL context lost", { gpu: "intel" });

        expect(error).toBeInstanceOf(AppError);
        expect(error.code).toBe("RENDER_ERROR");
        expect(error.details).toEqual({ gpu: "intel" });
      });
    });

    describe("NetworkError", () => {
      it("should create a NetworkError with url and status", () => {
        const error = new NetworkError(
          "Request failed",
          "https://example.com",
          500
        );

        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(NetworkError);
        expect(error.code).toBe("NETWORK_ERROR");
        expect(error.url).toBe("https://example.com");
        expect(error.status).toBe(500);
        expect(error.details.url).toBe("https://example.com");
        expect(error.details.status).toBe(500);
      });
    });
  });

  describe("Error Messages", () => {
    it("should have parse error messages", () => {
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

    it("should have validation error messages", () => {
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

    it("should have file error messages", () => {
      expect(ERROR_MESSAGES.FILE_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.FILE_ERROR.NOT_FOUND).toBe("File not found");
      expect(ERROR_MESSAGES.FILE_ERROR.READ_ERROR).toBe("Could not read file");
      expect(ERROR_MESSAGES.FILE_ERROR.WRITE_ERROR).toBe(
        "Could not write file"
      );
      expect(ERROR_MESSAGES.FILE_ERROR.INVALID_TYPE).toBe("Invalid file type");
    });

    it("should have render error messages", () => {
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
  });

  describe("Error Propagation in Services", () => {
    it("should throw ValidationError from LayerService", async () => {
      const { LayerService } =
        await import("../../core/services/LayerService.js");
      const service = new LayerService();

      try {
        service.createLayer("", "WIP");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.field).toBe("filePath");
      }
    });

    it("should throw ValidationError from PrimService", async () => {
      const { PrimService } =
        await import("../../core/services/PrimService.js");
      const service = new PrimService();

      try {
        service.validatePrimPath("InvalidPath");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.field).toBe("path");
      }
    });

    it("should include context in error details", async () => {
      const { LayerService } =
        await import("../../core/services/LayerService.js");
      const service = new LayerService();

      try {
        service.createLayer("file.usda", "BAD_STATUS");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error.field).toBe("status");
        expect(error.value).toBe("BAD_STATUS");
      }
    });
  });

  describe("Error Chaining Scenarios", () => {
    it("should handle cascading validation errors", async () => {
      const { LayerService } =
        await import("../../core/services/LayerService.js");
      const service = new LayerService();

      const errors = [];

      // Collect multiple validation errors
      const testCases = [
        () => service.createLayer(""),
        () => service.createLayer("file.usda", "INVALID"),
        () => service.validateLayerStack("not-an-array"),
        () => service.reorderLayers([], -1, 0),
      ];

      testCases.forEach((testCase) => {
        try {
          testCase();
        } catch (error) {
          errors.push(error);
        }
      });

      expect(errors).toHaveLength(4);
      expect(errors.every((e) => e instanceof ValidationError)).toBe(true);
    });

    it("should handle error recovery patterns", async () => {
      const { LayerService } =
        await import("../../core/services/LayerService.js");
      const service = new LayerService();

      // Attempt invalid operation
      let layer = null;
      try {
        layer = service.createLayer("", "WIP");
      } catch {
        // Recover with valid input
        layer = service.createLayer("fallback.usda", "WIP");
      }

      expect(layer).not.toBeNull();
      expect(layer.filePath).toBe("fallback.usda");
    });
  });

  describe("Error Serialization", () => {
    it("should serialize error chain to JSON", () => {
      const error = new ValidationError("Bad input", "name", "", {
        context: "form",
      });
      const json = error.toJSON();

      expect(json).toEqual({
        name: "ValidationError",
        message: "Bad input",
        code: "VALIDATION_ERROR",
        details: { field: "name", value: "", context: "form" },
        timestamp: expect.any(Number),
        stack: expect.any(String),
      });
    });

    it("should round-trip error data", () => {
      const original = new ParseError("Invalid syntax", 10, 25, {
        file: "test.usda",
      });
      const json = original.toJSON();

      // Reconstruct error from JSON
      const reconstructed = new ParseError(
        json.message,
        json.details.line,
        json.details.column,
        { file: json.details.file }
      );

      expect(reconstructed.message).toBe(original.message);
      expect(reconstructed.line).toBe(original.line);
      expect(reconstructed.column).toBe(original.column);
      expect(reconstructed.details.file).toBe(original.details.file);
    });
  });
});
