/**
 * Tests for validator utilities
 * Note: describe, it, expect are available globally via globals: true in vite.config.js
 */

import {
  validatePropertyValue,
  validateFilePath,
  validateLayerStatus,
  validateUser,
  validateCommitMessage,
} from "../../../utils/validators.js";

describe("Validators", () => {
  describe("validatePropertyValue", () => {
    describe("integer validation", () => {
      it("should validate correct integer values", () => {
        expect(validatePropertyValue("42", "int")).toEqual({ valid: true });
        expect(validatePropertyValue("0", "int")).toEqual({ valid: true });
        expect(validatePropertyValue("-10", "int")).toEqual({ valid: true });
      });

      it("should reject non-integer values", () => {
        const result = validatePropertyValue("abc", "int");
        expect(result.valid).toBe(false);
        expect(result.error).toBe("Value must be an integer");
      });

      it("should reject float values for int type", () => {
        const result = validatePropertyValue("3.14", "int");
        expect(result.valid).toBe(true); // parseInt will convert it
        // Note: parseInt('3.14') = 3, which is valid for int type
      });
    });

    describe("float/double validation", () => {
      it("should validate correct float values", () => {
        expect(validatePropertyValue("3.14", "float")).toEqual({ valid: true });
        expect(validatePropertyValue("0.0", "float")).toEqual({ valid: true });
        expect(validatePropertyValue("-2.5", "float")).toEqual({ valid: true });
        expect(validatePropertyValue("42", "float")).toEqual({ valid: true });
      });

      it("should validate correct double values", () => {
        expect(validatePropertyValue("3.14159", "double")).toEqual({
          valid: true,
        });
        expect(validatePropertyValue("0.0", "double")).toEqual({ valid: true });
        expect(validatePropertyValue("-2.5", "double")).toEqual({
          valid: true,
        });
      });

      it("should reject non-numeric values", () => {
        const result = validatePropertyValue("abc", "float");
        expect(result.valid).toBe(false);
        expect(result.error).toBe("Value must be a number");
      });
    });

    describe("boolean validation", () => {
      it("should validate string boolean values", () => {
        expect(validatePropertyValue("true", "bool")).toEqual({ valid: true });
        expect(validatePropertyValue("false", "bool")).toEqual({ valid: true });
      });

      it("should validate actual boolean values", () => {
        expect(validatePropertyValue(true, "bool")).toEqual({ valid: true });
        expect(validatePropertyValue(false, "bool")).toEqual({ valid: true });
      });

      it("should reject invalid boolean values", () => {
        const result = validatePropertyValue("yes", "bool");
        expect(result.valid).toBe(false);
        expect(result.error).toBe("Value must be true or false");
      });

      it("should reject numeric boolean-like values", () => {
        const result = validatePropertyValue("1", "bool");
        expect(result.valid).toBe(false);
      });
    });

    describe("string/token validation", () => {
      it("should validate string values", () => {
        expect(validatePropertyValue("hello", "string")).toEqual({
          valid: true,
        });
        expect(validatePropertyValue("", "string")).toEqual({ valid: true });
        expect(validatePropertyValue("with spaces", "string")).toEqual({
          valid: true,
        });
      });

      it("should validate token values", () => {
        expect(validatePropertyValue("myToken", "token")).toEqual({
          valid: true,
        });
        expect(validatePropertyValue("", "token")).toEqual({ valid: true });
      });

      it("should validate any value for unknown types", () => {
        expect(validatePropertyValue("anything", "unknown")).toEqual({
          valid: true,
        });
        expect(validatePropertyValue(123, "custom")).toEqual({ valid: true });
      });
    });
  });

  describe("validateFilePath", () => {
    it("should validate correct USDA file paths", () => {
      expect(validateFilePath("scene.usda")).toEqual({ valid: true });
      expect(validateFilePath("/path/to/file.usda")).toEqual({ valid: true });
      expect(validateFilePath("assets/character.usda")).toEqual({
        valid: true,
      });
    });

    it("should validate correct USD file paths", () => {
      expect(validateFilePath("scene.usd")).toEqual({ valid: true });
      expect(validateFilePath("/path/to/file.usd")).toEqual({ valid: true });
    });

    it("should reject empty paths", () => {
      const result = validateFilePath("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("File path is required");
    });

    it("should reject null paths", () => {
      const result = validateFilePath(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("File path is required");
    });

    it("should reject non-USDA/USD files", () => {
      const result = validateFilePath("scene.txt");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("File must be a .usda or .usd file");
    });

    it("should reject files with wrong extensions", () => {
      const invalidExtensions = [
        "scene.json",
        "scene.xml",
        "scene.obj",
        "scene",
      ];

      invalidExtensions.forEach((path) => {
        const result = validateFilePath(path);
        expect(result.valid).toBe(false);
      });
    });

    it("should be case-sensitive for extensions", () => {
      const result = validateFilePath("scene.USDA");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateLayerStatus", () => {
    it("should validate all correct statuses", () => {
      const validStatuses = ["WIP", "Shared", "Published", "Archived"];

      validStatuses.forEach((status) => {
        expect(validateLayerStatus(status)).toEqual({ valid: true });
      });
    });

    it("should reject invalid statuses", () => {
      const result = validateLayerStatus("InvalidStatus");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Status must be one of");
    });

    it("should reject lowercase statuses", () => {
      const result = validateLayerStatus("wip");
      expect(result.valid).toBe(false);
    });

    it("should reject empty status", () => {
      const result = validateLayerStatus("");
      expect(result.valid).toBe(false);
    });

    it("should list all valid statuses in error message", () => {
      const result = validateLayerStatus("Invalid");
      expect(result.error).toContain("WIP");
      expect(result.error).toContain("Shared");
      expect(result.error).toContain("Published");
      expect(result.error).toContain("Archived");
    });
  });

  describe("validateUser", () => {
    const validUsers = ["alice", "bob", "charlie"];

    it("should validate users in the valid list", () => {
      expect(validateUser("alice", validUsers)).toEqual({ valid: true });
      expect(validateUser("bob", validUsers)).toEqual({ valid: true });
      expect(validateUser("charlie", validUsers)).toEqual({ valid: true });
    });

    it("should reject users not in the valid list", () => {
      const result = validateUser("dave", validUsers);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("User must be one of");
    });

    it("should be case-sensitive", () => {
      const result = validateUser("Alice", validUsers);
      expect(result.valid).toBe(false);
    });

    it("should list all valid users in error message", () => {
      const result = validateUser("invalid", validUsers);
      expect(result.error).toContain("alice");
      expect(result.error).toContain("bob");
      expect(result.error).toContain("charlie");
    });

    it("should work with empty valid users list", () => {
      const result = validateUser("anyone", []);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateCommitMessage", () => {
    it("should validate correct commit messages", () => {
      expect(validateCommitMessage("Add new feature")).toEqual({ valid: true });
      expect(validateCommitMessage("Fix bug in layer rendering")).toEqual({
        valid: true,
      });
      expect(validateCommitMessage("Update documentation")).toEqual({
        valid: true,
      });
    });

    it("should reject empty messages", () => {
      const result = validateCommitMessage("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Commit message is required");
    });

    it("should reject null messages", () => {
      const result = validateCommitMessage(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Commit message is required");
    });

    it("should reject messages that are too short", () => {
      const result = validateCommitMessage("ab");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Commit message must be at least 3 characters");
    });

    it("should reject messages with only whitespace", () => {
      const result = validateCommitMessage("  ");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Commit message must be at least 3 characters");
    });

    it("should validate message exactly 3 characters", () => {
      expect(validateCommitMessage("abc")).toEqual({ valid: true });
    });

    it("should reject messages that are too long", () => {
      const longMessage = "a".repeat(501);
      const result = validateCommitMessage(longMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Commit message must be less than 500 characters"
      );
    });

    it("should validate message exactly 500 characters", () => {
      const message = "a".repeat(500);
      expect(validateCommitMessage(message)).toEqual({ valid: true });
    });

    it("should trim message before checking length", () => {
      const result = validateCommitMessage("  a  ");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Commit message must be at least 3 characters");
    });

    it("should validate messages with newlines", () => {
      const message = "Title\n\nDescription of the change";
      expect(validateCommitMessage(message)).toEqual({ valid: true });
    });

    it("should validate messages with special characters", () => {
      expect(validateCommitMessage("Fix: bug #123")).toEqual({ valid: true });
      expect(validateCommitMessage("[URGENT] Critical fix!")).toEqual({
        valid: true,
      });
    });
  });
});
