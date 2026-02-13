import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initPanelDockers, resetPanelState } from '../../../../components/sidebar/panelDockerController.js';

describe('panelDockerController', () => {
  let scenePanel, layersPanel, hierarchyPanel, propertiesPanel;

  beforeEach(() => {
    resetPanelState();
    document.body.innerHTML = `
      <div class="sidebar">
        <div class="panel" id="scenePanel">
          <div class="panel-header"><h3>Scene</h3><div class="scene-controls"></div></div>
          <div class="panel-content"></div>
        </div>
        <div class="panel" id="layersPanel">
          <div class="panel-header"><h3>Layer Stack</h3><div class="file-controls"></div></div>
          <div class="panel-content"></div>
        </div>
        <div class="panel" id="hierarchyPanel">
          <div class="panel-header"><h3>Hierarchy</h3><div class="hierarchy-controls"></div></div>
          <div class="panel-content"></div>
        </div>
        <div class="panel" id="propertiesPanel">
          <div class="panel-header"><h3>Properties</h3></div>
          <div class="panel-content"></div>
        </div>
      </div>
    `;

    scenePanel = document.getElementById('scenePanel');
    layersPanel = document.getElementById('layersPanel');
    hierarchyPanel = document.getElementById('hierarchyPanel');
    propertiesPanel = document.getElementById('propertiesPanel');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize panels with default state', () => {
    initPanelDockers();

    // Default: layersPanel and hierarchyPanel are pinned
    // Default: layersPanel is active
    expect(layersPanel.classList.contains('expanded')).toBe(true);
    expect(hierarchyPanel.classList.contains('expanded')).toBe(true);
    expect(scenePanel.classList.contains('collapsed')).toBe(true);

    const layersPinBtn = layersPanel.querySelector('.pin-button');
    expect(layersPinBtn.classList.contains('active')).toBe(true);
    expect(layersPinBtn.textContent).toBe('📌');

    const scenePinBtn = scenePanel.querySelector('.pin-button');
    expect(scenePinBtn.classList.contains('active')).toBe(false);
    expect(scenePinBtn.textContent).toBe('📍');
  });

  it('should toggle pin when pin button is clicked', () => {
    initPanelDockers();
    const scenePinBtn = scenePanel.querySelector('.pin-button');
    
    // Click pin on scenePanel
    scenePinBtn.click();
    expect(scenePanel.classList.contains('expanded')).toBe(true);
    expect(scenePinBtn.classList.contains('active')).toBe(true);

    // Click it again to unpin -> Should close
    scenePinBtn.click();
    expect(scenePanel.classList.contains('expanded')).toBe(false);
    
    // Clicking the header should toggle (open) it back
    const header = scenePanel.querySelector('.panel-header');
    header.click();
    expect(scenePanel.classList.contains('expanded')).toBe(true);
  });

  it('should allow multiple unpinned panels to be open simultaneously', () => {
    initPanelDockers();
    
    // 1. Open Scene Panel (not pinned)
    scenePanel.querySelector('.panel-header').click();
    expect(scenePanel.classList.contains('expanded')).toBe(true);
    
    // 2. Open Properties Panel (not pinned)
    propertiesPanel.querySelector('.panel-header').click();
    expect(propertiesPanel.classList.contains('expanded')).toBe(true);

    // 3. Verify Scene Panel is still open (Independent behavior)
    expect(scenePanel.classList.contains('expanded')).toBe(true);
    
    // 4. Close Scene Panel manually
    scenePanel.querySelector('.panel-header').click();
    expect(scenePanel.classList.contains('expanded')).toBe(false);
    expect(propertiesPanel.classList.contains('expanded')).toBe(true);
    
    // Pinned panels should stay expanded
    expect(layersPanel.classList.contains('expanded')).toBe(true);
  });

  it('should handle missing panel IDs gracefully', () => {
    // Manually remove an ID
    const oldId = scenePanel.id;
    scenePanel.id = '';
    initPanelDockers();
    
    const header = scenePanel.querySelector('.panel-header');
    header.click();
    
    // It shouldn't crash, but won't be able to track ID. 
    // In new logic, if no ID, cannot add to Set.
    // So it might not expand unless we handle empty ID?
    // Current code: const panelId = panel.id; ... openPanelIds.has(panelId)
    // If panelId is empty string, it technically works as a key.
    
    expect(scenePanel.classList.contains('expanded')).toBe(true);
    
    scenePanel.id = oldId;
  });

  it('should show the pin button even if the panel was re-initialized without it', () => {
    initPanelDockers();
    const header = layersPanel.querySelector('.panel-header');
    header.dataset.dockerInitialized = 'true';
    
    // Manually remove pin button
    layersPanel.querySelector('.pin-button').remove();
    
    // Re-run init
    initPanelDockers();
    
    // This should FAIL if the bug exists.
    expect(layersPanel.querySelector('.pin-button')).not.toBeNull();
  });

  it('should allow pinning/unpinning Properties panel even if content is empty', () => {
    initPanelDockers();
    
    // 1. Activate Properties Panel
    propertiesPanel.querySelector('.panel-header').click();
    expect(propertiesPanel.classList.contains('expanded')).toBe(true);
    
    // 2. Pin it
    const pinBtn = propertiesPanel.querySelector('.pin-button');
    pinBtn.click();
    expect(pinBtn.classList.contains('active')).toBe(true);
    
    // 3. Unpin it
    pinBtn.click();
    expect(pinBtn.classList.contains('active')).toBe(false);
    
    // NEW BEHAVIOR: Unpinning should close the panel (toggle behavior)
    expect(propertiesPanel.classList.contains('expanded')).toBe(false);
    
    // 4. Activate another panel -> Properties should stay closed
    scenePanel.querySelector('.panel-header').click();
    expect(propertiesPanel.classList.contains('expanded')).toBe(false);
    expect(scenePanel.classList.contains('expanded')).toBe(true);
  });

  it('should toggle (close) the active panel when clicking its header again', () => {
    initPanelDockers();
    
    // 1. Activate Scene Panel (Starts closed because not pinned by default)
    const header = scenePanel.querySelector('.panel-header');
    header.click();
    expect(scenePanel.classList.contains('expanded')).toBe(true);
    
    // 2. Click it again -> Should close
    header.click();
    expect(scenePanel.classList.contains('collapsed')).toBe(true);
  });
});
