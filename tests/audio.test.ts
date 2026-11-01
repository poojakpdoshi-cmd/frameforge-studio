import { describe, it, expect } from 'vitest';
import {
  gainToDb,
  dbToGain,
  clampGain,
  clampPan,
  WaveformGenerator,
} from '../packages/audio/src/index.js';

describe('FrameForge Audio: DSP Math & Waveform Generation', () => {
  it('accurately converts unity gain to 0 dBFS and half gain to -6.02 dBFS', () => {
    expect(gainToDb(1.0)).toBeCloseTo(0.0, 1);
    expect(gainToDb(0.5)).toBeCloseTo(-6.02, 1);
    expect(dbToGain(0.0)).toBeCloseTo(1.0, 2);
    expect(dbToGain(-6.02)).toBeCloseTo(0.5, 2);
  });

  it('handles studio silence and noise floor limits gracefully', () => {
    expect(gainToDb(0.0)).toBe(-96.0);
    expect(dbToGain(-120.0)).toBe(0.0);
  });

  it('clamps gain and panning within hardware safety parameters', () => {
    expect(clampGain(3.5)).toBe(2.0);
    expect(clampGain(-1.0)).toBe(0.0);
    expect(clampPan(1.5)).toBe(1.0);
    expect(clampPan(-2.0)).toBe(-1.0);
  });

  it('generates synthetic waveform peak caches with normalized envelopes', () => {
    const wave = WaveformGenerator.generateSyntheticPeaks(10, 50);
    expect(wave.length).toBe(500);
    expect(wave.peaks.length).toBe(1000); // 500 min/max pairs

    // Check min <= max
    for (let i = 0; i < 50; i++) {
      const min = wave.peaks[i * 2];
      const max = wave.peaks[i * 2 + 1];
      expect(min).toBeLessThanOrEqual(max);
      expect(min).toBeGreaterThanOrEqual(-1.0);
      expect(max).toBeLessThanOrEqual(1.0);
    }
  });
});

