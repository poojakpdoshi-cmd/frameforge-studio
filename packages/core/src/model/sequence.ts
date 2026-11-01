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

export function rehydrateSequence(raw: any): TimelineSequence {
  if (!raw) return createSequence();
  const fps = Number(raw.fps) || 24;
  return {
    id: raw.id || `seq_${Date.now()}`,
    name: raw.name || 'Sequence 1',
    fps,
    width: Number(raw.width) || 1920,
    height: Number(raw.height) || 1080,
    markers: raw.markers || [],
    tracks: (raw.tracks || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      kind: t.kind,
      index: Number(t.index) || 0,
      muted: Boolean(t.muted),
      solo: Boolean(t.solo),
      locked: Boolean(t.locked),
      clips: (t.clips || []).map((c: any) => {
        const startVal = c.timelineRange?.start?.value !== undefined ? BigInt(c.timelineRange.start.value) : 0n;
        const startScale = Number(c.timelineRange?.start?.timescale) || fps;
        const durVal = c.timelineRange?.duration?.value !== undefined ? BigInt(c.timelineRange.duration.value) : BigInt(fps * 5);
        const durScale = Number(c.timelineRange?.duration?.timescale) || fps;

        const srcStartVal = c.sourceRange?.start?.value !== undefined ? BigInt(c.sourceRange.start.value) : 0n;
        const srcStartScale = Number(c.sourceRange?.start?.timescale) || fps;
        const srcDurVal = c.sourceRange?.duration?.value !== undefined ? BigInt(c.sourceRange.duration.value) : durVal;
        const srcDurScale = Number(c.sourceRange?.duration?.timescale) || fps;

        return {
          id: c.id,
          name: c.name,
          assetId: c.assetId,
          trackId: c.trackId,
          speed: Number(c.speed) || 1.0,
          color: c.color,
          blendMode: c.blendMode || 'normal',
          volume: Number(c.volume) ?? 1.0,
          pan: Number(c.pan) ?? 0.0,
          transform: c.transform || {
            position: { x: 0, y: 0 },
            scale: { x: 1, y: 1 },
            rotation: 0,
            anchor: { x: 0.5, y: 0.5 },
            opacity: 1,
          },
          effects: c.effects || [],
          timelineRange: new TimeRange(
            new RationalTime(startVal, startScale),
            new RationalTime(durVal, durScale)
          ),
          sourceRange: new TimeRange(
            new RationalTime(srcStartVal, srcStartScale),
            new RationalTime(srcDurVal, srcDurScale)
          ),
        };
      }),
    })),
  };
}

