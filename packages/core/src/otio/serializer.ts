/**
 * FrameForge Studio: OpenTimelineIO (OTIO) Interoperability
 * 
 * Provides industry-standard serialization and import conforming to the
 * Academy Software Foundation (ASWF) OpenTimelineIO specification.
 */

import { TimelineSequence, TimelineTrack, TimelineClip } from '../model/types.js';
import { RationalTime } from '../time/rational-time.js';
import { TimeRange } from '../time/time-range.js';
import { createSequence, createTrack, createClip } from '../model/sequence.js';

export function serializeToOTIO(sequence: TimelineSequence): Record<string, unknown> {
  return {
    OTIO_SCHEMA: 'Timeline.1',
    name: sequence.name,
    global_start_time: {
      OTIO_SCHEMA: 'RationalTime.1',
      value: 0,
      rate: sequence.fps,
    },
    tracks: {
      OTIO_SCHEMA: 'Stack.1',
      name: 'tracks',
      children: sequence.tracks.map((track) => ({
        OTIO_SCHEMA: 'Track.1',
        name: track.name,
        kind: track.kind === 'audio' ? 'Audio' : 'Video',
        children: track.clips.map((clip) => ({
          OTIO_SCHEMA: 'Clip.1',
          name: clip.name,
          source_range: {
            OTIO_SCHEMA: 'TimeRange.1',
            start_time: {
              OTIO_SCHEMA: 'RationalTime.1',
              value: Number(clip.sourceRange.start.value),
              rate: clip.sourceRange.start.timescale,
            },
            duration: {
              OTIO_SCHEMA: 'RationalTime.1',
              value: Number(clip.sourceRange.duration.value),
              rate: clip.sourceRange.duration.timescale,
            },
          },
          metadata: {
            frameforge: {
              assetId: clip.assetId,
              trackId: clip.trackId,
              speed: clip.speed,
              volume: clip.volume,
              pan: clip.pan,
              blendMode: clip.blendMode,
              transform: clip.transform,
              effects: clip.effects,
              timeline_start: {
                value: Number(clip.timelineRange.start.value),
                rate: clip.timelineRange.start.timescale,
              },
            },
          },
        })),
      })),
    },
    metadata: {
      frameforge: {
        width: sequence.width,
        height: sequence.height,
        version: '0.1.0-alpha',
      },
    },
  };
}

export function deserializeFromOTIO(otio: any): TimelineSequence {
  const fps = otio?.global_start_time?.rate ?? 24;
  const meta = otio?.metadata?.frameforge ?? {};
  const width = meta.width ?? 1920;
  const height = meta.height ?? 1080;

  const sequence = createSequence(otio.name || 'Imported Sequence', fps, width, height);
  sequence.tracks = [];

  const rawTracks = otio?.tracks?.children || [];
  rawTracks.forEach((t: any, idx: number) => {
    const kind = t.kind === 'Audio' ? 'audio' : 'video';
    const track = createTrack(t.name || `Track ${idx + 1}`, kind, idx);

    (t.children || []).forEach((c: any) => {
      const srcRange = c.source_range;
      const ffMeta = c.metadata?.frameforge;

      const rate = srcRange?.start_time?.rate || fps;
      const srcStart = new RationalTime(srcRange?.start_time?.value || 0, rate);
      const duration = new RationalTime(srcRange?.duration?.value || rate * 5, rate);

      const timelineStartVal = ffMeta?.timeline_start?.value ?? 0;
      const timelineStartRate = ffMeta?.timeline_start?.rate ?? rate;
      const timelineStart = new RationalTime(timelineStartVal, timelineStartRate);

      const clip = createClip({
        name: c.name || 'Untitled Clip',
        assetId: ffMeta?.assetId || `asset_${Date.now()}`,
        trackId: track.id,
        timelineStart,
        duration,
        sourceStart: srcStart,
        speed: ffMeta?.speed ?? 1.0,
      });

      if (ffMeta?.transform) clip.transform = ffMeta.transform;
      if (ffMeta?.blendMode) clip.blendMode = ffMeta.blendMode;
      if (ffMeta?.volume !== undefined) clip.volume = ffMeta.volume;
      if (ffMeta?.pan !== undefined) clip.pan = ffMeta.pan;
      if (ffMeta?.effects) clip.effects = ffMeta.effects;

      track.clips.push(clip);
    });

    sequence.tracks.push(track);
  });

  return sequence;
}

