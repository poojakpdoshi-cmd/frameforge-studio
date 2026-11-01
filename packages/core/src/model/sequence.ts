/**
 * FrameForge Studio: Timeline Sequence Operations
 */

import { RationalTime } from '../time/rational-time.js';
import { TimeRange } from '../time/time-range.js';
import { TimelineSequence, TimelineTrack, TimelineClip, TrackKind } from './types.js';

export function createSequence(
  name: string = 'Sequence 1',
  fps: number = 24,
  width: number = 1920,
  height: number = 1080
): TimelineSequence {
  return {
    id: `seq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    fps,
    width,
    height,
    tracks: [
      createTrack('V3', 'video', 0),
      createTrack('V2', 'video', 1),
      createTrack('V1', 'video', 2),
      createTrack('A1', 'audio', 3),
      createTrack('A2', 'audio', 4),
    ],
    markers: [],
  };
}

export function createTrack(
  name: string,
  kind: TrackKind,
  index: number
): TimelineTrack {
  return {
    id: `track_${kind}_${index}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    kind,
    index,
    muted: false,
    solo: false,
    locked: false,
    clips: [],
  };
}

export function createClip(params: {
  name: string;
  assetId: string;
  trackId: string;
  timelineStart: RationalTime;
  duration: RationalTime;
  sourceStart?: RationalTime;
  speed?: number;
  color?: string;
}): TimelineClip {
  const sourceStart = params.sourceStart || new RationalTime(0n, params.timelineStart.timescale);
  return {
    id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: params.name,
    assetId: params.assetId,
    trackId: params.trackId,
    timelineRange: new TimeRange(params.timelineStart, params.duration),
    sourceRange: new TimeRange(sourceStart, params.duration),
    speed: params.speed ?? 1.0,
    transform: {
      position: { x: 0, y: 0 },
      scale: { x: 1.0, y: 1.0 },
      rotation: 0,
      anchor: { x: 0.5, y: 0.5 },
      opacity: 1.0,
    },
    blendMode: 'normal',
    effects: [],
    volume: 1.0,
    pan: 0.0,
    color: params.color,
  };
}

export function getSequenceDuration(sequence: TimelineSequence): RationalTime {
  let maxEnd = new RationalTime(0n, sequence.fps);
  for (const track of sequence.tracks) {
    for (const clip of track.clips) {
      if (clip.timelineRange.end.isGreaterThan(maxEnd)) {
        maxEnd = clip.timelineRange.end;
      }
    }
  }
  return maxEnd;
}

export function findClipById(sequence: TimelineSequence, clipId: string): { clip: TimelineClip; track: TimelineTrack } | null {
  for (const track of sequence.tracks) {
    const clip = track.clips.find((c) => c.id === clipId);
    if (clip) return { clip, track };
  }
  return null;
}

export function getClipsAtTime(sequence: TimelineSequence, time: RationalTime): TimelineClip[] {
  const active: TimelineClip[] = [];
  for (const track of sequence.tracks) {
    if (track.muted) continue;
    for (const clip of track.clips) {
      if (clip.timelineRange.containsTime(time)) {
        active.push(clip);
      }
    }
  }
  return active;
}
