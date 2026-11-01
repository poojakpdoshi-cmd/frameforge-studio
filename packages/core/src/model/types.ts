/**
 * FrameForge Studio: Core Domain Models & Entity Typings
 */

import { RationalTime } from '../time/rational-time.js';
import { TimeRange } from '../time/time-range.js';

export type MediaType = 'video' | 'audio' | 'image' | 'title' | 'generator';

export interface MediaAsset {
  id: string;
  name: string;
  filePath: string;
  mediaType: MediaType;
  duration: RationalTime;
  width?: number;
  height?: number;
  fps?: number;
  sampleRate?: number;
  channels?: number;
  thumbnailUrl?: string;
  dateAdded: number;
}

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export interface TransformProperties {
  position: { x: number; y: number }; // Offset in pixels from sequence center
  scale: { x: number; y: number };    // Uniform or independent scale (1.0 = 100%)
  rotation: number;                   // In degrees
  anchor: { x: number; y: number };   // Anchor point normalized (0.5, 0.5 = center)
  opacity: number;                    // 0.0 to 1.0
}

export interface EffectInstance {
  id: string;
  effectType: string;
  name: string;
  enabled: boolean;
  parameters: Record<string, number | string | boolean>;
}

export interface TimelineClip {
  id: string;
  name: string;
  assetId: string;
  trackId: string;
  timelineRange: TimeRange;
  sourceRange: TimeRange;
  speed: number;
  transform: TransformProperties;
  blendMode: BlendMode;
  effects: EffectInstance[];
  volume: number; // 0.0 to 2.0 (1.0 = 0dB unity gain)
  pan: number;    // -1.0 (Left) to +1.0 (Right)
  color?: string; // UI accent badge
}

export type TrackKind = 'video' | 'audio' | 'overlay';

export interface TimelineTrack {
  id: string;
  name: string;
  kind: TrackKind;
  index: number;
  muted: boolean;
  solo: boolean;
  locked: boolean;
  clips: TimelineClip[];
}

export interface Marker {
  id: string;
  time: RationalTime;
  name: string;
  color: string;
  comment?: string;
}

export interface TimelineSequence {
  id: string;
  name: string;
  fps: number;
  width: number;
  height: number;
  tracks: TimelineTrack[];
  markers: Marker[];
}
