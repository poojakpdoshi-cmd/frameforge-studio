import { describe, it, expect } from 'vitest';
import {
  createSequence,
  createClip,
  RationalTime,
} from '../packages/core/src/index.js';
import {
  EXPORT_PRESETS,
  FFmpegCommandBuilder,
} from '../packages/engine/src/index.js';

describe('FrameForge Engine: FFmpeg Command Builder & Hardware Acceleration', () => {
  it('resolves correct hardware encoder based on platform settings', () => {
    expect(FFmpegCommandBuilder.resolveEncoder('h264', 'nvenc')).toBe('h264_nvenc');
    expect(FFmpegCommandBuilder.resolveEncoder('h264', 'qsv')).toBe('h264_qsv');
    expect(FFmpegCommandBuilder.resolveEncoder('h264', 'amf')).toBe('h264_amf');
    expect(FFmpegCommandBuilder.resolveEncoder('h264', 'cpu')).toBe('libx264');
    expect(FFmpegCommandBuilder.resolveEncoder('hevc', 'nvenc')).toBe('hevc_nvenc');
    expect(FFmpegCommandBuilder.resolveEncoder('vp9', 'cpu')).toBe('libvpx-vp9');
  });

  it('constructs complete valid export command arguments', () => {
    const seq = createSequence('Export Test', 60, 3840, 2160);
    const track = seq.tracks[0];
    const clip = createClip({
      name: 'Source 1',
      assetId: 'asset_a',
      trackId: track.id,
      timelineStart: RationalTime.fromFrames(0, 60),
      duration: RationalTime.fromFrames(300, 60),
    });
    track.clips.push(clip);

    const assetPaths = new Map<string, string>();
    assetPaths.set('asset_a', 'C:/Media/shot1.mp4');

    const args = FFmpegCommandBuilder.buildExportArgs({
      sequence: seq,
      assetPaths,
      outputPath: 'C:/Exports/final.mp4',
      preset: EXPORT_PRESETS.YOUTUBE_4K,
    });

    expect(args).toContain('-y');
    expect(args).toContain('C:/Media/shot1.mp4');
    expect(args).toContain('C:/Exports/final.mp4');
    expect(args).toContain('-s');
    expect(args).toContain('3840x2160');
    expect(args).toContain('-r');
    expect(args).toContain('60');
    expect(args).toContain('48000'); // 48kHz audio standard
  });
});

