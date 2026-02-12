// src/utils/validators.js
// Validation functions for user inputs and data

/**
 * Validates a property value based on its type
 * @param {any} value - The value to validate
 * @param {string} type - The property type (string, int, float, bool, etc.)
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validatePropertyValue(value, type) {
  switch (type) {
    case "int": {
      const intVal = parseInt(value, 10);
      if (isNaN(intVal)) {
        return { valid: false, error: "Value must be an integer" };
      }
      return { valid: true };
    }

    case "float":
    case "double": {
      const floatVal = parseFloat(value);
      if (isNaN(floatVal)) {
        return { valid: false, error: "Value must be a number" };
      }
      return { valid: true };
    }

    case "bool":
      if (
        value !== "true" &&
        value !== "false" &&
        value !== true &&
        value !== false
      ) {
        return { valid: false, error: "Value must be true or false" };
      }
      return { valid: true };

    case "string":
    case "token":
    default:
      return { valid: true };
  }
}

/**
 * Validates a file path
 * @param {string} path - The file path to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateFilePath(path) {
  if (!path || typeof path !== "string") {
    return { valid: false, error: "File path is required" };
  }

  if (!path.endsWith(".usda") && !path.endsWith(".usd")) {
    return { valid: false, error: "File must be a .usda or .usd file" };
  }

  return { valid: true };
}

/**
 * Validates a layer status
 * @param {string} status - The status to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateLayerStatus(status) {
  const validStatuses = ["WIP", "Shared", "Published", "Archived"];

  if (!validStatuses.includes(status)) {
    return {
      valid: false,
      error: `Status must be one of: ${validStatuses.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Validates a user name
 * @param {string} userName - The user name to validate
 * @param {Array<string>} validUsers - List of valid users
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateUser(userName, validUsers) {
  if (!validUsers.includes(userName)) {
    return {
      valid: false,
      error: `User must be one of: ${validUsers.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Validates a commit message
 * @param {string} message - The commit message
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateCommitMessage(message) {
  if (!message || typeof message !== "string") {
    return { valid: false, error: "Commit message is required" };
  }

  if (message.trim().length < 3) {
    return {
      valid: false,
      error: "Commit message must be at least 3 characters",
    };
  }

  if (message.length > 500) {
    return {
      valid: false,
      error: "Commit message must be less than 500 characters",
    };
  }

  return { valid: true };
}
