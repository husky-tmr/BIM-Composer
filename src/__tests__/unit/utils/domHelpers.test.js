// src/__tests__/unit/utils/domHelpers.test.js
/**
 * Tests for DOM utility functions
 * Note: describe, it, expect are available globally via globals: true in vite.config.js
 */
import {
  createElement,
  clearElement,
  toggleClass,
  findAncestorWithAttribute,
  batchAppend,
  debounce,
  throttle,
} from "../../../utils/domHelpers.js";

describe("domHelpers", () => {
  describe("createElement", () => {
    it("should create element with specified tag", () => {
      const element = createElement("div");
      expect(element.tagName).toBe("DIV");
    });

    it("should set className attribute", () => {
      const element = createElement("div", { className: "test-class" });
      expect(element.className).toBe("test-class");
    });

    it("should set multiple attributes", () => {
      const element = createElement("input", {
        type: "text",
        id: "test-input",
        placeholder: "Enter text",
      });

      expect(element.getAttribute("type")).toBe("text");
      expect(element.getAttribute("id")).toBe("test-input");
      expect(element.getAttribute("placeholder")).toBe("Enter text");
    });

    it("should set style object", () => {
      const element = createElement("div", {
        style: { color: "red", fontSize: "16px" },
      });

      expect(element.style.color).toBe("red");
      expect(element.style.fontSize).toBe("16px");
    });

    it("should add event listeners for on* attributes", () => {
      const clickHandler = vi.fn();
      const element = createElement("button", { onClick: clickHandler });

      element.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it("should set text content from string children", () => {
      const element = createElement("div", {}, "Hello World");
      expect(element.textContent).toBe("Hello World");
    });

    it("should append text node children from array", () => {
      const element = createElement("div", {}, ["Hello", " ", "World"]);
      expect(element.textContent).toBe("Hello World");
    });

    it("should append element children from array", () => {
      const child1 = document.createElement("span");
      child1.textContent = "Child 1";
      const child2 = document.createElement("span");
      child2.textContent = "Child 2";

      const element = createElement("div", {}, [child1, child2]);

      expect(element.children.length).toBe(2);
      expect(element.children[0]).toBe(child1);
      expect(element.children[1]).toBe(child2);
    });

    it("should handle mixed text and element children", () => {
      const span = document.createElement("span");
      span.textContent = "Bold";

      const element = createElement("div", {}, ["Text ", span, " More text"]);

      expect(element.childNodes.length).toBe(3);
      expect(element.textContent).toBe("Text Bold More text");
    });

    it("should handle empty children array", () => {
      const element = createElement("div", {}, []);
      expect(element.childNodes.length).toBe(0);
    });
  });

  describe("clearElement", () => {
    it("should remove all children from element", () => {
      const parent = document.createElement("div");
      parent.appendChild(document.createElement("span"));
      parent.appendChild(document.createElement("p"));
      parent.appendChild(document.createTextNode("text"));

      expect(parent.childNodes.length).toBe(3);

      clearElement(parent);

      expect(parent.childNodes.length).toBe(0);
    });

    it("should handle elements with no children", () => {
      const element = document.createElement("div");
      expect(() => clearElement(element)).not.toThrow();
      expect(element.childNodes.length).toBe(0);
    });

    it("should handle nested children", () => {
      const parent = document.createElement("div");
      const child = document.createElement("div");
      child.appendChild(document.createElement("span"));
      parent.appendChild(child);

      clearElement(parent);

      expect(parent.childNodes.length).toBe(0);
    });
  });

  describe("toggleClass", () => {
    it("should add class when not present", () => {
      const element = document.createElement("div");
      toggleClass(element, "active");

      expect(element.classList.contains("active")).toBe(true);
    });

    it("should remove class when present", () => {
      const element = document.createElement("div");
      element.classList.add("active");

      toggleClass(element, "active");

      expect(element.classList.contains("active")).toBe(false);
    });

    it("should force add class when force is true", () => {
      const element = document.createElement("div");
      toggleClass(element, "active", true);

      expect(element.classList.contains("active")).toBe(true);

      toggleClass(element, "active", true);
      expect(element.classList.contains("active")).toBe(true);
    });

    it("should force remove class when force is false", () => {
      const element = document.createElement("div");
      element.classList.add("active");

      toggleClass(element, "active", false);

      expect(element.classList.contains("active")).toBe(false);

      toggleClass(element, "active", false);
      expect(element.classList.contains("active")).toBe(false);
    });
  });

  describe("findAncestorWithAttribute", () => {
    it("should find immediate parent with attribute", () => {
      const parent = document.createElement("div");
      parent.setAttribute("data-id", "123");
      const child = document.createElement("span");
      parent.appendChild(child);

      const result = findAncestorWithAttribute(child, "data-id");

      expect(result).toBe(parent);
    });

    it("should find distant ancestor with attribute", () => {
      const grandparent = document.createElement("div");
      grandparent.setAttribute("data-test", "value");
      const parent = document.createElement("div");
      const child = document.createElement("span");

      grandparent.appendChild(parent);
      parent.appendChild(child);
      document.body.appendChild(grandparent);

      const result = findAncestorWithAttribute(child, "data-test");

      expect(result).toBe(grandparent);

      document.body.removeChild(grandparent);
    });

    it("should return null when no ancestor has attribute", () => {
      const parent = document.createElement("div");
      const child = document.createElement("span");
      parent.appendChild(child);
      document.body.appendChild(parent);

      const result = findAncestorWithAttribute(child, "data-nonexistent");

      expect(result).toBe(null);

      document.body.removeChild(parent);
    });

    it("should return element itself if it has the attribute", () => {
      const element = document.createElement("div");
      element.setAttribute("data-id", "123");

      const result = findAncestorWithAttribute(element, "data-id");

      expect(result).toBe(element);
    });

    it("should stop at document.body", () => {
      const element = document.createElement("div");
      document.body.appendChild(element);

      const result = findAncestorWithAttribute(element, "data-nonexistent");

      expect(result).toBe(null);

      document.body.removeChild(element);
    });
  });

  describe("batchAppend", () => {
    it("should append multiple elements at once", () => {
      const container = document.createElement("div");
      const elements = [
        document.createElement("span"),
        document.createElement("p"),
        document.createElement("div"),
      ];

      batchAppend(container, elements);

      expect(container.children.length).toBe(3);
      expect(container.children[0]).toBe(elements[0]);
      expect(container.children[1]).toBe(elements[1]);
      expect(container.children[2]).toBe(elements[2]);
    });

    it("should handle empty array", () => {
      const container = document.createElement("div");
      batchAppend(container, []);

      expect(container.children.length).toBe(0);
    });

    it("should preserve existing children", () => {
      const container = document.createElement("div");
      const existing = document.createElement("span");
      container.appendChild(existing);

      const newElements = [document.createElement("p")];
      batchAppend(container, newElements);

      expect(container.children.length).toBe(2);
      expect(container.children[0]).toBe(existing);
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should delay function execution", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should reset timer on subsequent calls", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      vi.advanceTimersByTime(50);
      debounced();
      vi.advanceTimersByTime(50);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should pass arguments to function", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced("arg1", "arg2");

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("should only call function once for multiple rapid calls", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("throttle", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should call function immediately on first call", () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should ignore calls within throttle limit", () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should allow call after throttle limit expires", () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should pass arguments to function", () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled("arg1", "arg2");

      expect(fn).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("should preserve this context", () => {
      const obj = {
        value: 42,
        fn: vi.fn(function () {
          return this.value;
        }),
      };
      obj.throttled = throttle(obj.fn, 100);

      obj.throttled();

      expect(obj.fn).toHaveBeenCalled();
    });
  });
});
