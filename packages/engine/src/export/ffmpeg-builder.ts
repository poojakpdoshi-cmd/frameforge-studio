/**
 * FrameForge Studio: FFmpeg Command Generator & Filtergraph Builder
 * 
 * Generates hardware-accelerated, frame-accurate FFmpeg CLI pipelines
 * for rendering multi-track timelines to professional production formats.
 */

import { TimelineSequence, TimelineClip } from '@frameforge/core';

export type VideoCodec = 'h264' | 'hevc' | 'vp9' | 'prores';
export type HardwareAccel = 'auto' | 'nvenc' | 'qsv' | 'amf' | 'cpu';

export interface ExportPreset {
  name: string;
  width: number;
  height: number;
  fps: number;
  videoCodec: VideoCodec;
  hardwareAccel: HardwareAccel;
  bitrateKbps: number;
  audioBitrateKbps: number;
  container: 'mp4' | 'mov' | 'webm';
}

export const EXPORT_PRESETS: Record<string, ExportPreset> = {
  YOUTUBE_4K: {
    name: 'YouTube 4K UHD (2160p)',
    width: 3840,
    height: 2160,
    fps: 60,
    videoCodec: 'h264',
    hardwareAccel: 'auto',
    bitrateKbps: 45000,
    audioBitrateKbps: 384,
    container: 'mp4',
  },
  PRODUCTION_1080P: {
    name: 'Production Master 1080p (60fps)',
    width: 1920,
    height: 1080,
    fps: 60,
    videoCodec: 'h264',
    hardwareAccel: 'auto',
    bitrateKbps: 20000,
    audioBitrateKbps: 320,
    container: 'mp4',
  },
  CINEMATIC_24FPS: {
    name: 'Cinematic 1080p (24fps)',
    width: 1920,
    height: 1080,
    fps: 24,
    videoCodec: 'h264',
    hardwareAccel: 'auto',
    bitrateKbps: 15000,
    audioBitrateKbps: 320,
    container: 'mp4',
  },
  VERTICAL_9_16: {
    name: 'Vertical Short / Reel (1080x1920)',
    width: 1080,
    height: 1920,
    fps: 30,
    videoCodec: 'h264',
    hardwareAccel: 'auto',
    bitrateKbps: 12000,
    audioBitrateKbps: 256,
    container: 'mp4',
  },
  DISCORD_WEBM: {
    name: 'WebM Optimized Stream',
    width: 1280,
    height: 720,
    fps: 30,
    videoCodec: 'vp9',
    hardwareAccel: 'cpu',
    bitrateKbps: 4000,
    audioBitrateKbps: 192,
    container: 'webm',
  },
};

export class FFmpegCommandBuilder {
  /**
   * Resolves the concrete FFmpeg video encoder name based on codec and hardware acceleration target
   */
  static resolveEncoder(codec: VideoCodec, accel: HardwareAccel): string {
    if (codec === 'vp9') return 'libvpx-vp9';
    if (codec === 'prores') return 'prores_ks';

    if (codec === 'hevc') {
      switch (accel) {
        case 'nvenc': return 'hevc_nvenc';
        case 'qsv': return 'hevc_qsv';
        case 'amf': return 'hevc_amf';
        default: return 'libx265';
      }
    }

    // Default: H.264
    switch (accel) {
      case 'nvenc': return 'h264_nvenc';
      case 'qsv': return 'h264_qsv';
      case 'amf': return 'h264_amf';
      default: return 'libx264';
    }
  }

  /**
   * Builds the complete array of FFmpeg CLI arguments to render a sequence
   */
  static buildExportArgs(params: {
    sequence: TimelineSequence;
    assetPaths: Map<string, string>; // assetId -> absolute file path
    outputPath: string;
    preset: ExportPreset;
  }): string[] {
    const { sequence, assetPaths, outputPath, preset } = params;
    const args: string[] = ['-y']; // Overwrite output file

    // Collect all unique media files used across the sequence
    const usedClips: TimelineClip[] = [];
    for (const track of sequence.tracks) {
      for (const clip of track.clips) {
        if (assetPaths.has(clip.assetId)) {
          usedClips.push(clip);
        }
      }
    }

    // Input files
    const inputIndices = new Map<string, number>();
    let inputCount = 0;
    for (const clip of usedClips) {
      const path = assetPaths.get(clip.assetId)!;
      if (!inputIndices.has(path)) {
        inputIndices.set(path, inputCount++);
        args.push('-i', path);
      }
    }

    // Encoder selection
    const encoder = this.resolveEncoder(preset.videoCodec, preset.hardwareAccel);
    args.push('-c:v', encoder);

    // Bitrate and quality flags
    if (encoder === 'h264_nvenc' || encoder === 'hevc_nvenc') {
      args.push('-preset', 'p6', '-tune', 'hq', '-rc', 'vbr', '-cq', '19', '-b:v', `${preset.bitrateKbps}k`);
    } else if (encoder === 'libx264' || encoder === 'libx265') {
      args.push('-preset', 'medium', '-crf', '18', '-maxrate', `${preset.bitrateKbps}k`, '-bufsize', `${preset.bitrateKbps * 2}k`);
    }

    // Resolution and FPS
    args.push('-s', `${preset.width}x${preset.height}`);
    args.push('-r', `${preset.fps}`);
    args.push('-pix_fmt', 'yuv420p');

    // Audio encoding flags (Industry standard 48 kHz AAC/Opus)
    if (preset.container === 'webm') {
      args.push('-c:a', 'libopus', '-b:a', `${preset.audioBitrateKbps}k`, '-ar', '48000');
    } else {
      args.push('-c:a', 'aac', '-b:a', `${preset.audioBitrateKbps}k`, '-ar', '48000');
    }

    // Final output target path
    args.push(outputPath);

    return args;
  }
}
