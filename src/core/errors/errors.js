/**
 * Custom Error Classes for USDA Composer
 */

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * USDA parsing errors
 */
export class ParseError extends AppError {
  constructor(message, line, column, details = {}) {
    super(message, "PARSE_ERROR", { ...details, line, column });
    this.line = line;
    this.column = column;
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message, field, value, details = {}) {
    super(message, "VALIDATION_ERROR", { ...details, field, value });
    this.field = field;
    this.value = value;
  }
}

/**
 * State management errors
 */
export class StateError extends AppError {
  constructor(message, details = {}) {
    super(message, "STATE_ERROR", details);
  }
}

/**
 * File operation errors
 */
export class FileError extends AppError {
  constructor(message, fileName, details = {}) {
    super(message, "FILE_ERROR", { ...details, fileName });
    this.fileName = fileName;
  }
}

/**
 * Three.js/WebGL errors
 */
export class RenderError extends AppError {
  constructor(message, details = {}) {
    super(message, "RENDER_ERROR", details);
  }
}

/**
 * Network errors (future use)
 */
export class NetworkError extends AppError {
  constructor(message, url, status, details = {}) {
    super(message, "NETWORK_ERROR", { ...details, url, status });
    this.url = url;
    this.status = status;
  }
}

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  PARSE_ERROR: {
    INVALID_SYNTAX: "Invalid USDA syntax",
    UNEXPECTED_TOKEN: "Unexpected token in USDA file",
    MISSING_BRACKET: "Missing closing bracket",
    INVALID_PRIM_PATH: "Invalid prim path",
  },
  VALIDATION_ERROR: {
    REQUIRED_FIELD: "This field is required",
    INVALID_FORMAT: "Invalid format",
    OUT_OF_RANGE: "Value out of valid range",
  },
  FILE_ERROR: {
    NOT_FOUND: "File not found",
    READ_ERROR: "Could not read file",
    WRITE_ERROR: "Could not write file",
    INVALID_TYPE: "Invalid file type",
  },
  RENDER_ERROR: {
    WEBGL_NOT_SUPPORTED: "WebGL is not supported in your browser",
    CONTEXT_LOST: "WebGL context was lost",
    SHADER_ERROR: "Shader compilation error",
  },
};
