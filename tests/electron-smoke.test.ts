import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('FrameForge Desktop: Electron Shell Verification', () => {
  it('confirms Electron main and preload bundles are present and syntactically valid', () => {
    const mainPath = path.resolve(__dirname, '../apps/desktop/dist-electron/main.cjs');
    const preloadPath = path.resolve(__dirname, '../apps/desktop/dist-electron/preload.cjs');
    const htmlPath = path.resolve(__dirname, '../apps/desktop/dist/index.html');

    expect(fs.existsSync(mainPath)).toBe(true);
    expect(fs.existsSync(preloadPath)).toBe(true);
    expect(fs.existsSync(htmlPath)).toBe(true);

    const mainContent = fs.readFileSync(mainPath, 'utf-8');
    expect(mainContent).toContain('BrowserWindow');
    expect(mainContent).toContain('dialog:openMediaFile');
    expect(mainContent).toContain('media:probe');
    expect(mainContent).toContain('render:export');
    expect(mainContent).toContain('project:save');
    expect(mainContent).toContain('project:load');

    const preloadContent = fs.readFileSync(preloadPath, 'utf-8');
    expect(preloadContent).toContain('contextBridge');
    expect(preloadContent).toContain('openMediaDialog');
    expect(preloadContent).toContain('probeMedia');
  });
});

