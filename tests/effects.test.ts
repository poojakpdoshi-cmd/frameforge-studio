import { describe, it, expect } from 'vitest';
import { ShaderPipeline } from '../packages/engine/src/shaders/shader-pipeline.js';

describe('FrameForge Engine: Verified Pixel Shaders', () => {
  it('chromatic aberration physically shifts red and blue channels laterally', () => {
    const pipeline = new ShaderPipeline();
    const w = 100;
    const h = 50;
    // Create an ImageData-like buffer with a centered red square
    const data = new Uint8ClampedArray(w * h * 4);
    // Draw vertical white stripe at x = 50
    for (let y = 0; y < h; y++) {
      const idx = (y * w + 50) * 4;
      data[idx] = 255;     // R
      data[idx + 1] = 255; // G
      data[idx + 2] = 255; // B
      data[idx + 3] = 255; // A
    }

    const imgData = { data, width: w, height: h } as ImageData;

    // Apply chromatic aberration with offset = 5
    (pipeline as any).applyChromaticAberrationBuffer(imgData, w, h, { offset: 5 });

    // Pixel at (50, 25): Green stays centered, Red shifted left to (45), Blue shifted right to (55)
    const midIdx = (25 * w + 50) * 4;
    const leftIdx = (25 * w + 45) * 4;
    const rightIdx = (25 * w + 55) * 4;

    // Destination x = 55 receives Red from x = 50
    // Destination x = 45 receives Blue from x = 50
    expect(imgData.data[rightIdx]).toBe(255);
    expect(imgData.data[rightIdx + 2]).toBe(0);

    expect(imgData.data[leftIdx + 2]).toBe(255);
    expect(imgData.data[leftIdx]).toBe(0);
  });

  it('film grain modifies pixel values within expected non-zero delta', () => {
    const pipeline = new ShaderPipeline();
    const w = 40;
    const h = 40;
    const data = new Uint8ClampedArray(w * h * 4);
    // Fill mid-gray (128, 128, 128)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128;
      data[i + 1] = 128;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }

    const imgData = { data, width: w, height: h } as ImageData;
    (pipeline as any).applyFilmGrainBuffer(imgData, w, h, { intensity: 0.3 });

    // Check that pixels have changed from 128
    let changed = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 128) changed++;
    }

    expect(changed).toBeGreaterThan(100);
  });

  it('vignette darkens corner pixels while preserving center luminance', () => {
    const pipeline = new ShaderPipeline();
    const w = 100;
    const h = 100;
    const data = new Uint8ClampedArray(w * h * 4);
    // Fill with solid white (255, 255, 255)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }

    const imgData = { data, width: w, height: h } as ImageData;
    (pipeline as any).applyVignetteBuffer(imgData, w, h, { amount: 0.8 });

    // Center pixel (50, 50) should remain 255
    const centerIdx = (50 * w + 50) * 4;
    expect(imgData.data[centerIdx]).toBe(255);

    // Corner pixel (0, 0) should be darkened significantly
    const cornerIdx = 0;
    expect(imgData.data[cornerIdx]).toBeLessThan(100);
  });
});
