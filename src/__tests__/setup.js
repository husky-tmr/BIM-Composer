/**
 * Global test setup for Vitest
 * This file runs before all tests
 * Note: vi, afterEach, beforeEach, etc. are available globally via globals: true in vite.config.js
 */

// Extend matchers if needed
// import matchers from '@testing-library/jest-dom/matchers';
// expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks();
});

// Mock global objects that might not be available in test environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock WebGL context for Three.js tests
HTMLCanvasElement.prototype.getContext = vi.fn(function (contextType) {
  if (contextType === "2d") {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: [] })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => []),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      canvas: this,
    };
  }
  if (contextType === "webgl" || contextType === "webgl2") {
    return {
      canvas: this,
      drawingBufferWidth: 800,
      drawingBufferHeight: 600,
      getExtension: vi.fn(() => null),
      getParameter: vi.fn((param) => {
        // Return reasonable defaults for common parameters
        if (param === 0x1f02) return "WebGL 2.0 (Mock)"; // VERSION
        if (param === 0x8b8c) return 16; // MAX_VERTEX_ATTRIBS
        if (param === 0x8869) return 16; // MAX_VERTEX_TEXTURE_IMAGE_UNITS
        if (param === 0x8872) return 16; // MAX_TEXTURE_IMAGE_UNITS
        if (param === 0x0d33) return 4096; // MAX_TEXTURE_SIZE
        if (param === 0x851c) return 4096; // MAX_CUBE_MAP_TEXTURE_SIZE
        if (param === 0x8dfb) return 4; // MAX_SAMPLES
        return 0;
      }),
      getShaderPrecisionFormat: vi.fn(() => ({
        rangeMin: 127,
        rangeMax: 127,
        precision: 23,
      })),
      createShader: vi.fn(() => ({})),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn(() => true),
      getShaderInfoLog: vi.fn(() => ""),
      createProgram: vi.fn(() => ({})),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn(() => true),
      getProgramInfoLog: vi.fn(() => ""),
      useProgram: vi.fn(),
      deleteShader: vi.fn(),
      deleteProgram: vi.fn(),
      createBuffer: vi.fn(() => ({})),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      deleteBuffer: vi.fn(),
      createTexture: vi.fn(() => ({})),
      bindTexture: vi.fn(),
      texImage2D: vi.fn(),
      texParameteri: vi.fn(),
      deleteTexture: vi.fn(),
      activeTexture: vi.fn(),
      generateMipmap: vi.fn(),
      pixelStorei: vi.fn(),
      createFramebuffer: vi.fn(() => ({})),
      bindFramebuffer: vi.fn(),
      framebufferTexture2D: vi.fn(),
      checkFramebufferStatus: vi.fn(() => 0x8cd5), // FRAMEBUFFER_COMPLETE
      deleteFramebuffer: vi.fn(),
      createRenderbuffer: vi.fn(() => ({})),
      bindRenderbuffer: vi.fn(),
      renderbufferStorage: vi.fn(),
      renderbufferStorageMultisample: vi.fn(),
      framebufferRenderbuffer: vi.fn(),
      deleteRenderbuffer: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      blendFunc: vi.fn(),
      blendFuncSeparate: vi.fn(),
      blendEquation: vi.fn(),
      blendEquationSeparate: vi.fn(),
      depthFunc: vi.fn(),
      depthMask: vi.fn(),
      colorMask: vi.fn(),
      stencilFunc: vi.fn(),
      stencilOp: vi.fn(),
      stencilMask: vi.fn(),
      cullFace: vi.fn(),
      frontFace: vi.fn(),
      lineWidth: vi.fn(),
      polygonOffset: vi.fn(),
      scissor: vi.fn(),
      viewport: vi.fn(),
      clear: vi.fn(),
      clearColor: vi.fn(),
      clearDepth: vi.fn(),
      clearStencil: vi.fn(),
      getAttribLocation: vi.fn(() => 0),
      getUniformLocation: vi.fn(() => ({})),
      enableVertexAttribArray: vi.fn(),
      disableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      uniform1i: vi.fn(),
      uniform1f: vi.fn(),
      uniform2f: vi.fn(),
      uniform3f: vi.fn(),
      uniform4f: vi.fn(),
      uniform1fv: vi.fn(),
      uniform2fv: vi.fn(),
      uniform3fv: vi.fn(),
      uniform4fv: vi.fn(),
      uniform1iv: vi.fn(),
      uniformMatrix3fv: vi.fn(),
      uniformMatrix4fv: vi.fn(),
      drawArrays: vi.fn(),
      drawElements: vi.fn(),
      drawArraysInstanced: vi.fn(),
      drawElementsInstanced: vi.fn(),
      readPixels: vi.fn(),
      getContextAttributes: vi.fn(() => ({
        alpha: true,
        antialias: true,
        depth: true,
        stencil: false,
      })),
      isContextLost: vi.fn(() => false),
      getSupportedExtensions: vi.fn(() => []),
      createVertexArray: vi.fn(() => ({})),
      bindVertexArray: vi.fn(),
      deleteVertexArray: vi.fn(),
      blitFramebuffer: vi.fn(),
    };
  }
  return null;
});

// Suppress console errors during tests (optional)
// global.console.error = vi.fn();
// global.console.warn = vi.fn();
