/**
 * FrameForge Studio: FFmpeg Command Generator & Render Pipeline
 * 
 * Generates and executes production-grade FFmpeg pipelines with hardware acceleration,
 * multi-track compositing, xfade transitions, image/text overlays, and audio mixing.
 */

import { TimelineSequence, TimelineClip } from '@frameforge/core';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

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
    name: 'Production Master 1080p (24fps)',
    width: 1920,
    height: 1080,
    fps: 24,
    videoCodec: 'h264',
    hardwareAccel: 'cpu',
    bitrateKbps: 15000,
    audioBitrateKbps: 320,
    container: 'mp4',
  },
};

export interface CompositionExportParams {
  videoInputs: {
    filePath: string;
    trimStart: number;
    duration: number;
    effects?: string[]; // 'vignette', 'color_grade', 'film_grain'
  }[];
  transition?: {
    type: 'fade' | 'wipeleft' | 'circlecrop';
    duration: number;
    offset: number;
  };
  imageOverlay?: {
    filePath: string;
    x: number;
    y: number;
    opacity?: number;
  };
  textOverlay?: {
    text: string;
    fontSize: number;
    fontColor: string;
    x: string | number;
    y: string | number;
  };
  audioInput?: {
    filePath: string;
    duration: number;
    volume?: number;
  };
  totalDuration: number;
  width: number;
  height: number;
  fps: number;
  outputPath: string;
}

export class FFmpegCommandBuilder {
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

    switch (accel) {
      case 'nvenc': return 'h264_nvenc';
      case 'qsv': return 'h264_qsv';
      case 'amf': return 'h264_amf';
      default: return 'libx264';
    }
  }

  /**
   * Builds the complete array of standard FFmpeg CLI arguments to render a sequence
   */
  static buildExportArgs(params: {
    sequence: TimelineSequence;
    assetPaths: Map<string, string>;
    outputPath: string;
    preset: ExportPreset;
  }): string[] {
    const { sequence, assetPaths, outputPath, preset } = params;
    const args: string[] = ['-y'];

    const usedClips: TimelineClip[] = [];
    for (const track of sequence.tracks) {
      for (const clip of track.clips) {
        if (assetPaths.has(clip.assetId)) {
          usedClips.push(clip);
        }
      }
    }

    const inputIndices = new Map<string, number>();
    let inputCount = 0;
    for (const clip of usedClips) {
      const path = assetPaths.get(clip.assetId)!;
      if (!inputIndices.has(path)) {
        inputIndices.set(path, inputCount++);
        args.push('-i', path);
      }
    }

    const encoder = this.resolveEncoder(preset.videoCodec, preset.hardwareAccel);
    args.push('-c:v', encoder);

    if (encoder === 'h264_nvenc' || encoder === 'hevc_nvenc') {
      args.push('-preset', 'p6', '-tune', 'hq', '-rc', 'vbr', '-cq', '19', '-b:v', `${preset.bitrateKbps}k`);
    } else if (encoder === 'libx264' || encoder === 'libx265') {
      args.push('-preset', 'medium', '-crf', '18', '-maxrate', `${preset.bitrateKbps}k`, '-bufsize', `${preset.bitrateKbps * 2}k`);
    }

    args.push('-s', `${preset.width}x${preset.height}`);
    args.push('-r', `${preset.fps}`);
    args.push('-pix_fmt', 'yuv420p');

    if (preset.container === 'webm') {
      args.push('-c:a', 'libopus', '-b:a', `${preset.audioBitrateKbps}k`, '-ar', '48000');
    } else {
      args.push('-c:a', 'aac', '-b:a', `${preset.audioBitrateKbps}k`, '-ar', '48000');
    }

    args.push(outputPath);
    return args;
  }

  /**
   * Builds advanced multi-layer filter complex with transitions, overlays, effects, and text
   */
  static buildComplexCompositionArgs(params: CompositionExportParams): string[] {
    const {
      videoInputs,
      transition,
      imageOverlay,
      textOverlay,
      audioInput,
      totalDuration,
      width,
      height,
      fps,
      outputPath,
    } = params;

    const args: string[] = ['-y'];
    let inputCount = 0;

    // 1. Add video inputs
    for (const v of videoInputs) {
      args.push('-i', v.filePath);
      inputCount++;
    }

    // 2. Add image overlay input (looped infinitely so it does not terminate base stream)
    let imageInputIndex = -1;
    if (imageOverlay) {
      imageInputIndex = inputCount++;
      args.push('-loop', '1', '-i', imageOverlay.filePath);
    }

    // 3. Add audio input
    let audioInputIndex = -1;
    if (audioInput) {
      audioInputIndex = inputCount++;
      args.push('-i', audioInput.filePath);
    }

    // Build filter complex
    const filterComplex: string[] = [];

    // Process Video 1
    let v0Chain = `[0:v]trim=start=${videoInputs[0].trimStart}:duration=${videoInputs[0].duration},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
    if (videoInputs[0].effects?.includes('vignette')) {
      v0Chain += `,vignette=PI/4`;
    }
    v0Chain += `[v0]`;
    filterComplex.push(v0Chain);

    // Process Video 2
    let v1Chain = `[1:v]trim=start=${videoInputs[1].trimStart}:duration=${videoInputs[1].duration},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
    if (videoInputs[1].effects?.includes('color_grade')) {
      v1Chain += `,eq=contrast=1.2:brightness=0.04:saturation=1.3`;
    }
    if (videoInputs[1].effects?.includes('film_grain')) {
      v1Chain += `,noise=alls=15:allf=t+u`;
    }
    v1Chain += `[v1]`;
    filterComplex.push(v1Chain);

    // Transition between v0 and v1
    let currentVideoNode = '[base]';
    if (transition) {
      filterComplex.push(
        `[v0][v1]xfade=transition=${transition.type}:duration=${transition.duration}:offset=${transition.offset}[base]`
      );
    } else {
      filterComplex.push(`[v0][v1]concat=n=2:v=1:a=0[base]`);
    }

    // Overlay Image
    if (imageOverlay && imageInputIndex >= 0) {
      filterComplex.push(
        `${currentVideoNode}[${imageInputIndex}:v]overlay=x=${imageOverlay.x}:y=${imageOverlay.y}:shortest=1[with_img]`
      );
      currentVideoNode = '[with_img]';
    }

    // Overlay Text
    if (textOverlay) {
      const fontArg = process.platform === 'win32'
        ? ":fontfile='C\\:/Windows/Fonts/arial.ttf'"
        : '';
      filterComplex.push(
        `${currentVideoNode}drawtext=text='${textOverlay.text}'${fontArg}:fontsize=${textOverlay.fontSize}:fontcolor=${textOverlay.fontColor}:x=${textOverlay.x}:y=${textOverlay.y}:shadowcolor=black@0.8:shadowx=3:shadowy=3[final_v]`
      );
      currentVideoNode = '[final_v]';
    }

    args.push('-filter_complex', filterComplex.join(';'));
    args.push('-map', currentVideoNode);

    // Audio mapping
    if (audioInputIndex >= 0) {
      args.push('-map', `${audioInputIndex}:a`);
      args.push('-c:a', 'aac', '-b:a', '256k', '-ar', '48000');
    }

    // Video encoding flags
    args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p');
    args.push('-r', `${fps}`);
    args.push('-t', `${totalDuration}`);
    args.push(outputPath);

    return args;
  }

  /**
   * Executes FFmpeg asynchronously and verifies completion
   */
  static async renderToDisk(args: string[]): Promise<{ success: boolean; stdout: string; stderr: string }> {
    const { stdout, stderr } = await execFileAsync('ffmpeg', args);
    return { success: true, stdout, stderr };
  }
}
