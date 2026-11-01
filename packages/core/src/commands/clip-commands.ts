/**
 * FrameForge Studio: Concrete Timeline Clip Commands
 * 
 * Reversible, frame-accurate timeline editing operations.
 */

import { ICommand } from './command.js';
import { TimelineSequence, TimelineClip, TimelineTrack } from '../model/types.js';
import { RationalTime } from '../time/rational-time.js';
import { TimeRange } from '../time/time-range.js';
import { findClipById } from '../model/sequence.js';

export interface TimelineContext {
  sequence: TimelineSequence;
  onUpdate?: () => void;
}

export class AddClipCommand implements ICommand<TimelineContext> {
  readonly id: string;
  readonly name: string;
  readonly timestamp: number;
  private targetTrackId: string;
  private clip: TimelineClip;

  constructor(targetTrackId: string, clip: TimelineClip) {
    this.id = `cmd_add_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.name = `Add Clip "${clip.name}"`;
    this.timestamp = Date.now();
    this.targetTrackId = targetTrackId;
    this.clip = clip;
  }

  execute(context: TimelineContext): void {
    const track = context.sequence.tracks.find((t) => t.id === this.targetTrackId);
    if (!track) throw new Error(`Track with id "${this.targetTrackId}" not found`);
    this.clip.trackId = this.targetTrackId;
    track.clips.push(this.clip);
    context.onUpdate?.();
  }

  undo(context: TimelineContext): void {
    const track = context.sequence.tracks.find((t) => t.id === this.targetTrackId);
    if (!track) return;
    track.clips = track.clips.filter((c) => c.id !== this.clip.id);
    context.onUpdate?.();
  }

  serialize() {
    return {
      type: 'AddClipCommand',
      id: this.id,
      name: this.name,
      targetTrackId: this.targetTrackId,
      clip: {
        ...this.clip,
        timelineRange: this.clip.timelineRange.toJSON(),
        sourceRange: this.clip.sourceRange.toJSON(),
      },
    };
  }
}

export class DeleteClipCommand implements ICommand<TimelineContext> {
  readonly id: string;
  readonly name: string;
  readonly timestamp: number;
  private clipId: string;
  private removedClip: TimelineClip | null = null;
  private originalTrackId: string | null = null;

  constructor(clipId: string) {
    this.id = `cmd_del_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.name = `Delete Clip`;
    this.timestamp = Date.now();
    this.clipId = clipId;
  }

  execute(context: TimelineContext): void {
    const found = findClipById(context.sequence, this.clipId);
    if (!found) throw new Error(`Clip with id "${this.clipId}" not found`);
    this.removedClip = found.clip;
    this.originalTrackId = found.track.id;
    found.track.clips = found.track.clips.filter((c) => c.id !== this.clipId);
    context.onUpdate?.();
  }

  undo(context: TimelineContext): void {
    if (!this.removedClip || !this.originalTrackId) return;
    const track = context.sequence.tracks.find((t) => t.id === this.originalTrackId);
    if (!track) return;
    track.clips.push(this.removedClip);
    context.onUpdate?.();
  }

  serialize() {
    return {
      type: 'DeleteClipCommand',
      id: this.id,
      clipId: this.clipId,
    };
  }
}

export class MoveClipCommand implements ICommand<TimelineContext> {
  readonly id: string;
  readonly name: string;
  readonly timestamp: number;
  private clipId: string;
  private newTrackId: string;
  private newStartTime: RationalTime;
  private oldTrackId!: string;
  private oldStartTime!: RationalTime;

  constructor(clipId: string, newTrackId: string, newStartTime: RationalTime) {
    this.id = `cmd_move_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.name = `Move Clip`;
    this.timestamp = Date.now();
    this.clipId = clipId;
    this.newTrackId = newTrackId;
    this.newStartTime = newStartTime;
  }

  execute(context: TimelineContext): void {
    const found = findClipById(context.sequence, this.clipId);
    if (!found) throw new Error(`Clip with id "${this.clipId}" not found`);
    const { clip, track } = found;

    this.oldTrackId = track.id;
    this.oldStartTime = clip.timelineRange.start;

    // Cross-track move if required
    if (track.id !== this.newTrackId) {
      const targetTrack = context.sequence.tracks.find((t) => t.id === this.newTrackId);
      if (!targetTrack) throw new Error(`Target track "${this.newTrackId}" not found`);
      track.clips = track.clips.filter((c) => c.id !== this.clipId);
      clip.trackId = this.newTrackId;
      targetTrack.clips.push(clip);
    }

    clip.timelineRange = new TimeRange(this.newStartTime, clip.timelineRange.duration);
    context.onUpdate?.();
  }

  undo(context: TimelineContext): void {
    const found = findClipById(context.sequence, this.clipId);
    if (!found) return;
    const { clip, track } = found;

    if (track.id !== this.oldTrackId) {
      const origTrack = context.sequence.tracks.find((t) => t.id === this.oldTrackId);
      if (!origTrack) return;
      track.clips = track.clips.filter((c) => c.id !== this.clipId);
      clip.trackId = this.oldTrackId;
      origTrack.clips.push(clip);
    }

    clip.timelineRange = new TimeRange(this.oldStartTime, clip.timelineRange.duration);
    context.onUpdate?.();
  }

  serialize() {
    return {
      type: 'MoveClipCommand',
      id: this.id,
      clipId: this.clipId,
      newTrackId: this.newTrackId,
      newStartTime: this.newStartTime.toJSON(),
    };
  }
}

export class SplitClipCommand implements ICommand<TimelineContext> {
  readonly id: string;
  readonly name: string;
  readonly timestamp: number;
  private clipId: string;
  private splitPoint: RationalTime;
  private originalClip: TimelineClip | null = null;
  private rightClip: TimelineClip | null = null;
  private trackId: string | null = null;

  constructor(clipId: string, splitPoint: RationalTime) {
    this.id = `cmd_split_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.name = `Split Clip`;
    this.timestamp = Date.now();
    this.clipId = clipId;
    this.splitPoint = splitPoint;
  }

  execute(context: TimelineContext): void {
    const found = findClipById(context.sequence, this.clipId);
    if (!found) throw new Error(`Clip with id "${this.clipId}" not found for split`);
    const { clip, track } = found;
    this.trackId = track.id;

    // Verify split point is strictly inside clip
    if (
      this.splitPoint.compare(clip.timelineRange.start) <= 0 ||
      this.splitPoint.compare(clip.timelineRange.end) >= 0
    ) {
      throw new Error(`Split point is outside clip boundaries`);
    }

    // Save snapshot of original clip state for undo
    this.originalClip = {
      ...clip,
      timelineRange: new TimeRange(clip.timelineRange.start, clip.timelineRange.duration),
      sourceRange: new TimeRange(clip.sourceRange.start, clip.sourceRange.duration),
    };

    // Calculate left and right durations
    const leftDuration = this.splitPoint.subtract(clip.timelineRange.start);
    const rightDuration = clip.timelineRange.duration.subtract(leftDuration);

    // Left clip keeps original clip id, trimmed to splitPoint
    clip.timelineRange = new TimeRange(clip.timelineRange.start, leftDuration);
    clip.sourceRange = new TimeRange(clip.sourceRange.start, leftDuration);

    // Right clip begins at splitPoint with sourceRange offset by leftDuration
    const rightSourceStart = clip.sourceRange.start.add(leftDuration);
    this.rightClip = {
      ...clip,
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `${clip.name} (Part 2)`,
      timelineRange: new TimeRange(this.splitPoint, rightDuration),
      sourceRange: new TimeRange(rightSourceStart, rightDuration),
    };

    track.clips.push(this.rightClip);
    context.onUpdate?.();
  }

  undo(context: TimelineContext): void {
    if (!this.trackId || !this.originalClip || !this.rightClip) return;
    const track = context.sequence.tracks.find((t) => t.id === this.trackId);
    if (!track) return;

    // Remove right clip
    track.clips = track.clips.filter((c) => c.id !== this.rightClip!.id);

    // Restore left clip to original bounds
    const leftClip = track.clips.find((c) => c.id === this.originalClip!.id);
    if (leftClip) {
      leftClip.timelineRange = this.originalClip.timelineRange;
      leftClip.sourceRange = this.originalClip.sourceRange;
      leftClip.name = this.originalClip.name;
    }

    context.onUpdate?.();
  }

  serialize() {
    return {
      type: 'SplitClipCommand',
      id: this.id,
      clipId: this.clipId,
      splitPoint: this.splitPoint.toJSON(),
    };
  }
}

export class TrimClipCommand implements ICommand<TimelineContext> {
  readonly id: string;
  readonly name: string;
  readonly timestamp: number;
  private clipId: string;
  private edge: 'head' | 'tail';
  private delta: RationalTime;
  private oldTimelineRange!: TimeRange;
  private oldSourceRange!: TimeRange;

  constructor(clipId: string, edge: 'head' | 'tail', delta: RationalTime) {
    this.id = `cmd_trim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.name = `Trim Clip (${edge})`;
    this.timestamp = Date.now();
    this.clipId = clipId;
    this.edge = edge;
    this.delta = delta;
  }

  execute(context: TimelineContext): void {
    const found = findClipById(context.sequence, this.clipId);
    if (!found) throw new Error(`Clip "${this.clipId}" not found for trim`);
    const { clip } = found;

    this.oldTimelineRange = clip.timelineRange;
    this.oldSourceRange = clip.sourceRange;

    if (this.edge === 'tail') {
      const newDuration = clip.timelineRange.duration.add(this.delta);
      if (newDuration.value <= 0n) throw new Error(`Trim results in non-positive duration`);
      clip.timelineRange = new TimeRange(clip.timelineRange.start, newDuration);
      clip.sourceRange = new TimeRange(clip.sourceRange.start, newDuration);
    } else {
      // Head trim: shifts start point forward, shortens duration, and offsets source start
      const newDuration = clip.timelineRange.duration.subtract(this.delta);
      if (newDuration.value <= 0n) throw new Error(`Trim results in non-positive duration`);
      const newStart = clip.timelineRange.start.add(this.delta);
      const newSourceStart = clip.sourceRange.start.add(this.delta);
      clip.timelineRange = new TimeRange(newStart, newDuration);
      clip.sourceRange = new TimeRange(newSourceStart, newDuration);
    }

    context.onUpdate?.();
  }

  undo(context: TimelineContext): void {
    const found = findClipById(context.sequence, this.clipId);
    if (!found) return;
    found.clip.timelineRange = this.oldTimelineRange;
    found.clip.sourceRange = this.oldSourceRange;
    context.onUpdate?.();
  }

  serialize() {
    return {
      type: 'TrimClipCommand',
      id: this.id,
      clipId: this.clipId,
      edge: this.edge,
      delta: this.delta.toJSON(),
    };
  }
}

