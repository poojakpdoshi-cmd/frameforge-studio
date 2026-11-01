/**
 * FrameForge Studio: Audio Math & DSP Conversions
 */

export function gainToDb(gain: number): number {
  if (gain <= 0.00001) return -96.0; // Studio noise floor limit
  return 20 * Math.log10(gain);
}

export function dbToGain(db: number): number {
  if (db <= -96.0) return 0.0;
  return Math.pow(10, db / 20);
}

export function clampGain(gain: number, minGain: number = 0, maxGain: number = 2.0): number {
  return Math.max(minGain, Math.min(maxGain, gain));
}

export function clampPan(pan: number): number {
  return Math.max(-1.0, Math.min(1.0, pan));
}

