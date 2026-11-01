/**
 * FrameForge Studio: Rational Time Arithmetic Engine
 * 
 * Provides exact fractional time representation to eliminate floating-point
 * rounding errors and frame drift in professional NLE workflows.
 */

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export class RationalTime {
  readonly value: bigint;
  readonly timescale: number;

  constructor(value: bigint | number, timescale: number = 24) {
    if (timescale <= 0 || !Number.isFinite(timescale)) {
      throw new Error(`Invalid timescale: ${timescale}. Must be a positive integer.`);
    }
    const intTimescale = Math.round(timescale);
    const bigVal = typeof value === 'bigint' ? value : BigInt(Math.round(value));
    
    // Normalize fraction via GCD
    const divisor = gcd(bigVal, BigInt(intTimescale));
    if (divisor > 1n) {
      this.value = bigVal / divisor;
      this.timescale = Number(BigInt(intTimescale) / divisor);
    } else {
      this.value = bigVal;
      this.timescale = intTimescale;
    }
  }

  /**
   * Returns time in floating-point seconds (for audio/video playback synchronization).
   */
  toSeconds(): number {
    return Number(this.value) / this.timescale;
  }

  /**
   * Creates a RationalTime from seconds at a given target timescale.
   */
  static fromSeconds(seconds: number, timescale: number = 24): RationalTime {
    const value = BigInt(Math.round(seconds * timescale));
    return new RationalTime(value, timescale);
  }

  /**
   * Returns whole frame index at a given frame rate.
   */
  toFrames(fps: number = this.timescale): number {
    return Math.floor((Number(this.value) * fps) / this.timescale);
  }

  /**
   * Creates a RationalTime from a frame count and framerate.
   */
  static fromFrames(frame: number, fps: number = 24): RationalTime {
    return new RationalTime(BigInt(frame), fps);
  }

  /**
   * Resamples this RationalTime to a new timescale without losing precision.
   */
  rescaledTo(newTimescale: number): RationalTime {
    if (this.timescale === newTimescale) return this;
    const newValue = (this.value * BigInt(newTimescale)) / BigInt(this.timescale);
    return new RationalTime(newValue, newTimescale);
  }

  add(other: RationalTime): RationalTime {
    const commonTimescale = BigInt(this.timescale) * BigInt(other.timescale);
    const valA = this.value * BigInt(other.timescale);
    const valB = other.value * BigInt(this.timescale);
    const sum = valA + valB;
    const commonScaleNum = Number(commonTimescale);
    return new RationalTime(sum, commonScaleNum);
  }

  subtract(other: RationalTime): RationalTime {
    const commonTimescale = BigInt(this.timescale) * BigInt(other.timescale);
    const valA = this.value * BigInt(other.timescale);
    const valB = other.value * BigInt(this.timescale);
    const diff = valA - valB;
    return new RationalTime(diff, Number(commonTimescale));
  }

  multiply(scalar: number): RationalTime {
    const val = BigInt(Math.round(Number(this.value) * scalar));
    return new RationalTime(val, this.timescale);
  }

  compare(other: RationalTime): number {
    const valA = this.value * BigInt(other.timescale);
    const valB = other.value * BigInt(this.timescale);
    if (valA < valB) return -1;
    if (valA > valB) return 1;
    return 0;
  }

  equals(other: RationalTime): boolean {
    return this.compare(other) === 0;
  }

  isLessThan(other: RationalTime): boolean {
    return this.compare(other) < 0;
  }

  isGreaterThan(other: RationalTime): boolean {
    return this.compare(other) > 0;
  }

  isZero(): boolean {
    return this.value === 0n;
  }

  /**
   * Formats into professional SMPTE Timecode (HH:MM:SS:FF).
   */
  toSMPTE(fps: number = 24): string {
    const totalFrames = Math.max(0, this.toFrames(fps));
    const frames = totalFrames % fps;
    const totalSeconds = Math.floor(totalFrames / fps);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const pad = (n: number, z: number = 2) => String(n).padStart(z, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
  }

  /**
   * Parses standard SMPTE timecode (HH:MM:SS:FF) into RationalTime.
   */
  static fromSMPTE(timecode: string, fps: number = 24): RationalTime {
    const parts = timecode.split(':').map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some(isNaN)) {
      throw new Error(`Invalid SMPTE timecode format: "${timecode}". Expected HH:MM:SS:FF`);
    }
    const [hours, minutes, seconds, frames] = parts;
    const totalFrames = ((hours * 60 + minutes) * 60 + seconds) * fps + frames;
    return RationalTime.fromFrames(totalFrames, fps);
  }

  toJSON() {
    return {
      value: this.value.toString(),
      timescale: this.timescale,
    };
  }

  static fromJSON(data: { value: string | number; timescale: number }): RationalTime {
    return new RationalTime(BigInt(data.value), data.timescale);
  }
}
