import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { FFmpegCommandBuilder } from '../packages/engine/src/export/ffmpeg-builder.js';

const execFileAsync = promisify(execFile);

describe('FrameForge Studio: Production Export & FFprobe Verification Gate', () => {
  it('renders a real 10-second multitrack project to MP4 with effects, transitions, overlays, and verifies with FFprobe', async () => {
    const fixturesDir = path.resolve(__dirname, 'fixtures/media');
    const outputDir = path.resolve(__dirname, 'fixtures/output');
    const framesDir = path.resolve(__dirname, 'fixtures/frames');

    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(framesDir, { recursive: true });

    const clip1Path = path.join(fixturesDir, 'video_clip1.mp4');
    const clip2Path = path.join(fixturesDir, 'video_clip2.mp4');
    const overlayPath = path.join(fixturesDir, 'overlay_graphic.png');
    const audioPath = path.join(fixturesDir, 'audio_track.wav');
    const outputPath = path.join(outputDir, 'rendered_10s_master.mp4');

    expect(fs.existsSync(clip1Path)).toBe(true);
    expect(fs.existsSync(clip2Path)).toBe(true);
    expect(fs.existsSync(overlayPath)).toBe(true);
    expect(fs.existsSync(audioPath)).toBe(true);

    // 1. Build advanced FFmpeg composition arguments
    const exportArgs = FFmpegCommandBuilder.buildComplexCompositionArgs({
      videoInputs: [
        {
          filePath: clip1Path,
          trimStart: 0,
          duration: 5.5,
          effects: ['vignette'],
        },
        {
          filePath: clip2Path,
          trimStart: 0,
          duration: 5.5,
          effects: ['color_grade', 'film_grain'],
        },
      ],
      transition: {
        type: 'fade',
        duration: 1.0,
        offset: 4.5,
      },
      imageOverlay: {
        filePath: overlayPath,
        x: 80,
        y: 80,
      },
      textOverlay: {
        text: 'FRAMEFORGE MASTER 10S EXPORT',
        fontSize: 48,
        fontColor: 'white',
        x: '(w-text_w)/2',
        y: 'h-120',
      },
      audioInput: {
        filePath: audioPath,
        duration: 10.0,
      },
      totalDuration: 10.0,
      width: 1920,
      height: 1080,
      fps: 24,
      outputPath,
    });

    // 2. Execute Real Render to Disk
    const renderResult = await FFmpegCommandBuilder.renderToDisk(exportArgs);
    expect(renderResult.success).toBe(true);
    expect(fs.existsSync(outputPath)).toBe(true);

    const stats = fs.statSync(outputPath);
    expect(stats.size).toBeGreaterThan(100_000); // Greater than 100 KB

    // 3. Inspect Output via FFprobe
    const { stdout: probeOutput } = await execFileAsync('ffprobe', [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      outputPath,
    ]);

    const probe = JSON.parse(probeOutput);

    // Verify Duration
    const duration = parseFloat(probe.format.duration);
    expect(duration).toBeGreaterThanOrEqual(9.9);
    expect(duration).toBeLessThanOrEqual(10.1);

    // Verify Video Stream
    const videoStream = probe.streams.find((s: any) => s.codec_type === 'video');
    expect(videoStream).toBeDefined();
    expect(videoStream.width).toBe(1920);
    expect(videoStream.height).toBe(1080);
    expect(videoStream.r_frame_rate).toBe('24/1');

    // Verify Audio Stream
    const audioStream = probe.streams.find((s: any) => s.codec_type === 'audio');
    expect(audioStream).toBeDefined();
    expect(parseInt(audioStream.sample_rate)).toBe(48000);
    expect(audioStream.channels).toBe(2);

    // 4. Extract Real Test Frames at 2s, 5s, 8s to Disk
    const frame2s = path.join(framesDir, 'frame_02s.png');
    const frame5s = path.join(framesDir, 'frame_05s.png');
    const frame8s = path.join(framesDir, 'frame_08s.png');

    await execFileAsync('ffmpeg', ['-y', '-i', outputPath, '-ss', '2.0', '-vframes', '1', '-update', '1', frame2s]);
    await execFileAsync('ffmpeg', ['-y', '-i', outputPath, '-ss', '5.0', '-vframes', '1', '-update', '1', frame5s]);
    await execFileAsync('ffmpeg', ['-y', '-i', outputPath, '-ss', '8.0', '-vframes', '1', '-update', '1', frame8s]);

    expect(fs.existsSync(frame2s)).toBe(true);
    expect(fs.existsSync(frame5s)).toBe(true);
    expect(fs.existsSync(frame8s)).toBe(true);

    expect(fs.statSync(frame2s).size).toBeGreaterThan(5000);
    expect(fs.statSync(frame5s).size).toBeGreaterThan(5000);
    expect(fs.statSync(frame8s).size).toBeGreaterThan(5000);
  }, 60000); // 60-second timeout for full transcode and frame extractions
});
