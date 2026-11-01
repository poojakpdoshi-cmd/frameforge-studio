/**
 * FrameForge Studio: Time Range Representation
 * 
 * Represents a contiguous span of time bounded by a start time and duration.
 */

import { RationalTime } from './rational-time.js';

export class TimeRange {
  readonly start: RationalTime;
  readonly duration: RationalTime;

  constructor(start: RationalTime, duration: RationalTime) {
    if (duration.value < 0n) {
      throw new Error(`TimeRange duration cannot be negative: ${duration.value}`);
    }
    this.start = start;
    this.duration = duration;
  }

  get end(): RationalTime {
    return this.start.add(this.duration);
  }

  get startSeconds(): number {
    return this.start.toSeconds();
  }

  get durationSeconds(): number {
    return this.duration.toSeconds();
  }

  get endSeconds(): number {
    return this.end.toSeconds();
  }

  containsTime(time: RationalTime): boolean {
    return (
      (this.start.compare(time) <= 0) &&
      (time.compare(this.end) < 0)
    );
  }

  containsTimeInclusive(time: RationalTime): boolean {
    return (
      (this.start.compare(time) <= 0) &&
      (time.compare(this.end) <= 0)
    );
  }

  overlaps(other: TimeRange): boolean {
    return (
      this.start.isLessThan(other.end) &&
      other.start.isLessThan(this.end)
    );
  }

  clamp(time: RationalTime): RationalTime {
    if (time.isLessThan(this.start)) return this.start;
    if (time.isGreaterThan(this.end)) return this.end;
    return time;
  }

  toJSON() {
    return {
      start: this.start.toJSON(),
      duration: this.duration.toJSON(),
    };
  }

  static fromJSON(data: {
    start: { value: string | number; timescale: number };
    duration: { value: string | number; timescale: number };
  }): TimeRange {
    return new TimeRange(
      RationalTime.fromJSON(data.start),
      RationalTime.fromJSON(data.duration)
    );
  }
}

