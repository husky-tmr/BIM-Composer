/**
 * Centralized Error Handler
 */

import { AppError } from "./errors.js";

export class ErrorHandler {
  constructor() {
    this.listeners = new Map();
    this.errorLog = [];
    this.maxLogSize = 100;

    this._setupGlobalHandlers();
  }

  /**
   * Setup global error handlers
   * @private
   */
  _setupGlobalHandlers() {
    // Only set up handlers in browser environment
    if (typeof window === "undefined") {
      return;
    }

    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      this.handleError(event.error || new Error(event.message), {
        type: "uncaught",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });

      // Prevent default browser error handling
      event.preventDefault();
    });

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.handleError(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
        { type: "unhandledRejection" }
      );

      event.preventDefault();
    });
  }

  /**
   * Main error handling method
   * @param {Error} error - The error object
   * @param {Object} context - Additional context
   */
  handleError(error, context = {}) {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error("[Error Handler]", error, context);
    }

    // Create error entry
    const errorEntry = {
      error:
        error instanceof AppError
          ? error
          : new AppError(error.message, "UNKNOWN_ERROR"),
      context,
      timestamp: Date.now(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "Node.js",
      url:
        typeof window !== "undefined"
          ? window.location.href
          : "test-environment",
    };

    // Add to log
    this._addToLog(errorEntry);

    // Notify listeners
    this._notifyListeners(errorEntry);

    // Send to monitoring service (future)
    this._sendToMonitoring(errorEntry);

    // Show user-friendly message
    this._showUserMessage(errorEntry);
  }

  /**
   * Add error to log
   * @private
   */
  _addToLog(errorEntry) {
    this.errorLog.unshift(errorEntry);

    // Maintain max size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  /**
   * Notify error listeners
   * @private
   */
  _notifyListeners(errorEntry) {
    this.listeners.forEach((callback) => {
      try {
        callback(errorEntry);
      } catch (err) {
        console.error("Error in error listener:", err);
      }
    });
  }

  /**
   * Send to monitoring service
   * @private
   */
  _sendToMonitoring() {
    // TODO: Integrate with Sentry, LogRocket, etc.
    // Example:
    // if (window.Sentry) {
    //   Sentry.captureException(errorEntry.error, {
    //     extra: errorEntry.context
    //   });
    // }
  }

  /**
   * Show user-friendly error message
   * @private
   */
  _showUserMessage(errorEntry) {
    const { error } = errorEntry;

    // Don't show UI for every error
    if (error.code === "STATE_ERROR" && import.meta.env.DEV) {
      return; // Only log in development
    }

    // Create or update error notification
    const message = this._getUserMessage(error);
    this._displayNotification(message, error.code);
  }

  /**
   * Get user-friendly error message
   * @private
   */
  _getUserMessage(error) {
    if (error instanceof AppError) {
      return error.message;
    }

    return "An unexpected error occurred. Please try again.";
  }

  /**
   * Display error notification to user
   * @private
   */
  _displayNotification(message, code) {
    // Only display in browser environment
    if (typeof document === "undefined") {
      return;
    }

    // Simple notification implementation
    // Can be enhanced with a proper toast library
    const notification = document.createElement("div");
    notification.className = "error-notification";
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 16px 24px;
      border-radius: 4px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;

    notification.innerHTML = `
      <strong>Error</strong><br>
      ${message}
      ${code ? `<br><small>Code: ${code}</small>` : ""}
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  /**
   * Subscribe to errors
   * @param {string} key - Unique listener key
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    this.listeners.set(key, callback);
    return () => this.unsubscribe(key);
  }

  /**
   * Unsubscribe from errors
   * @param {string} key - Listener key
   */
  unsubscribe(key) {
    this.listeners.delete(key);
  }

  /**
   * Get error log
   * @returns {Array} Array of error entries
   */
  getLog() {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearLog() {
    this.errorLog = [];
  }

  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {*} fallback - Fallback value on error
   * @returns {Function} Wrapped function
   */
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

  /**
   * Wrap sync function with error handling
   * @param {Function} fn - Function to wrap
   * @param {*} fallback - Fallback value on error
   * @returns {Function} Wrapped function
   */
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

// Add CSS animation (only in browser environment)
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Export singleton instance
export const errorHandler = new ErrorHandler();
