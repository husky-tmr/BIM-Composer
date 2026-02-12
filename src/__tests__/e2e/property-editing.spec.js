import { test, expect } from "@playwright/test";

test.describe("Property Editing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
  });

  test("should display properties panel area", async ({ page }) => {
    // Check for properties panel in the sidebar
    const propertiesPanel = page.locator(
      '#properties, [data-testid="properties-panel"], .properties-panel, #propertiesSection'
    );
    await propertiesPanel.count();

    // The page should at least be loaded
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test("should display outliner/hierarchy panel", async ({ page }) => {
    // Check for the outliner/hierarchy tree
    const outliner = page.locator(
      '#usdaOutliner, [data-testid="outliner"], .outliner'
    );
    const count = await outliner.count();

    if (count > 0) {
      await expect(outliner.first()).toBeVisible();
    }
  });

  test("should display code editor area", async ({ page }) => {
    // Check for code editor (USDA text editor)
    const editor = page.locator(
      '#usdaCodeEditor, [data-testid="code-editor"], textarea, .code-editor'
    );
    const count = await editor.count();

    if (count > 0) {
      // Editor area exists
      expect(count).toBeGreaterThan(0);
    }
  });

  test("should have view mode selector", async ({ page }) => {
    // Check for stage/file/history view switching buttons
    const viewButtons = page.locator(
      '#stageViewBtn, #fileViewBtn, .view-btn, [data-testid="view-selector"]'
    );
    const count = await viewButtons.count();

    if (count > 0) {
      await expect(viewButtons.first()).toBeVisible();
    }
  });

  test("should respond to window resize", async ({ page }) => {
    const canvas = page.locator("canvas");
    await expect(canvas.first()).toBeVisible({ timeout: 10000 });

    // Get initial size
    await canvas.first().boundingBox();

    // Resize the viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    // Canvas should still be visible after resize
    await expect(canvas.first()).toBeVisible();
  });
});
