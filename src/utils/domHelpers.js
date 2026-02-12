// src/utils/domHelpers.js
// DOM manipulation utilities

/**
 * Creates a DOM element with attributes and children
 * @param {string} tag - The element tag name
 * @param {Object} attrs - Attributes to set on the element
 * @param {Array|string} children - Child elements or text content
 * @returns {HTMLElement} The created element
 */
export function createElement(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);

  // Set attributes
  Object.keys(attrs).forEach((key) => {
    if (key === "className") {
      element.className = attrs[key];
    } else if (key === "style" && typeof attrs[key] === "object") {
      Object.assign(element.style, attrs[key]);
    } else if (key.startsWith("on") && typeof attrs[key] === "function") {
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, attrs[key]);
    } else {
      element.setAttribute(key, attrs[key]);
    }
  });

  // Add children
  if (typeof children === "string") {
    element.textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach((child) => {
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    });
  }

  return element;
}

/**
 * Clears all children from an element
 * @param {HTMLElement} element - The element to clear
 */
export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Toggles a class on an element
 * @param {HTMLElement} element - The element
 * @param {string} className - The class name
 * @param {boolean} force - Optional force add/remove
 */
export function toggleClass(element, className, force) {
  if (force !== undefined) {
    element.classList.toggle(className, force);
  } else {
    element.classList.toggle(className);
  }
}

/**
 * Finds the closest ancestor with a specific attribute
 * @param {HTMLElement} element - Starting element
 * @param {string} attribute - Attribute name to search for
 * @returns {HTMLElement|null} The ancestor element or null
 */
export function findAncestorWithAttribute(element, attribute) {
  let current = element;
  while (current && current !== document.body) {
    if (current.hasAttribute(attribute)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * Batch DOM updates using DocumentFragment
 * @param {HTMLElement} container - The container to append to
 * @param {Array<HTMLElement>} elements - Elements to append
 */
export function batchAppend(container, elements) {
  const fragment = document.createDocumentFragment();
  elements.forEach((el) => fragment.appendChild(el));
  container.appendChild(fragment);
}

/**
 * Debounces a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function call
 * @param {Function} func - The function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Shows a temporary toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast (success, error, info)
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = "info", duration = 3000) {
  const toast = createElement(
    "div",
    {
      className: `toast toast-${type}`,
      style: {
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "15px 20px",
        borderRadius: "5px",
        backgroundColor:
          type === "error"
            ? "#ff4444"
            : type === "success"
              ? "#44ff44"
              : "#4444ff",
        color: "white",
        zIndex: "10000",
        animation: "slideIn 0.3s ease-out",
      },
    },
    message
  );

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Add CSS animations if not already present
if (!document.getElementById("toast-animations")) {
  const style = createElement("style", { id: "toast-animations" });
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}
