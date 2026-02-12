/**
 * Test helpers exposed on window for E2E tests
 * Loaded in index.html when NODE_ENV === 'test'
 */

window.testHelpers = {
  loadMockFile() {
    const mockUSDA = `#usda 1.0
def Xform "Root" {
  def Cube "MyCube" { }
}`;
    // Simulate file load
    window.dispatchEvent(
      new CustomEvent("test:loadFile", {
        detail: { content: mockUSDA, filename: "test.usda" },
      })
    );
  },

  loadMockFileWithTimeline() {
    const mockUSDA = `#usda 1.0
(
  startTimeCode = 0
  endTimeCode = 100
)
def Xform "Animated" {
  double3 xformOp:translate.timeSamples = {
    0: (0, 0, 0),
    50: (5, 0, 0),
    100: (10, 0, 0),
  }
}`;
    window.dispatchEvent(
      new CustomEvent("test:loadFile", {
        detail: { content: mockUSDA, filename: "animated.usda" },
      })
    );
  },

  loadMockScene() {
    this.loadMockFile();
  },

  addMockLayers(names) {
    names.forEach((name, index) => {
      window.dispatchEvent(
        new CustomEvent("test:addLayer", {
          detail: {
            id: `layer-${index}`,
            name,
            status: "WIP",
          },
        })
      );
    });
  },
};
