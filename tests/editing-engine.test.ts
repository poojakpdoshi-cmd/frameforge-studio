import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  RationalTime,
  TimeRange,
  createSequence,
  createClip,
  UndoManager,
  AddClipCommand,
  SplitClipCommand,
  TrimClipCommand,
  MoveClipCommand,
  findClipById,
  serializeToOTIO,
  deserializeFromOTIO,
  MediaAsset,
} from '../packages/core/src/index.js';

const execFileAsync = promisify(execFile);

describe('FrameForge Core: Real Media Editing Engine & Persistence Verification', () => {
  it('imports real media files, probes streams, performs frame-accurate edits, and saves/reopens project', async () => {
    const fixturesDir = path.resolve(__dirname, 'fixtures/media');
    const projectDir = path.resolve(__dirname, 'fixtures/projects');
    fs.mkdirSync(projectDir, { recursive: true });

    const video1Path = path.join(fixturesDir, 'video_clip1.mp4');
    const video2Path = path.join(fixturesDir, 'video_clip2.mp4');
    const imagePath = path.join(fixturesDir, 'overlay_graphic.png');
    const audioPath = path.join(fixturesDir, 'audio_track.wav');

    // 1. Probe Real Media with FFprobe
    const { stdout: probeV1 } = await execFileAsync('ffprobe', [
      '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', video1Path
    ]);
    const metaV1 = JSON.parse(probeV1);
    const videoStream = metaV1.streams.find((s: any) => s.codec_type === 'video');

    expect(videoStream).toBeDefined();
    expect(videoStream.width).toBe(1920);
    expect(videoStream.height).toBe(1080);
    expect(videoStream.r_frame_rate).toBe('24/1');

    // 2. Create Real Media Assets
    const assetVideo1: MediaAsset = {
      id: 'asset_real_v1',
      name: 'video_clip1.mp4',
      filePath: video1Path,
      mediaType: 'video',
      duration: RationalTime.fromSeconds(parseFloat(metaV1.format.duration), 24),
      width: videoStream.width,
      height: videoStream.height,
      fps: 24,
      dateAdded: Date.now(),
    };

    const assetImage: MediaAsset = {
      id: 'asset_real_img',
      name: 'overlay_graphic.png',
      filePath: imagePath,
      mediaType: 'image',
      duration: RationalTime.fromSeconds(10, 24),
      width: 400,
      height: 200,
      dateAdded: Date.now(),
    };

    const assetAudio: MediaAsset = {
      id: 'asset_real_aud',
      name: 'audio_track.wav',
      filePath: audioPath,
      mediaType: 'audio',
      duration: RationalTime.fromSeconds(10, 24),
      sampleRate: 48000,
      channels: 2,
      dateAdded: Date.now(),
    };

    // 3. Assemble Sequence with Real Media Clips
    const sequence = createSequence('Cinema Real Project', 24, 1920, 1080);
    const undoManager = new UndoManager({ sequence });

    const v1 = sequence.tracks.find((t) => t.name === 'V1')!;
    const v2 = sequence.tracks.find((t) => t.name === 'V2')!;
    const a1 = sequence.tracks.find((t) => t.name === 'A1')!;

    // Video Clip on V1
    const clipVideo = createClip({
      name: 'Main Video Track',
      assetId: assetVideo1.id,
      trackId: v1.id,
      timelineStart: RationalTime.fromFrames(0, 24),
      duration: RationalTime.fromFrames(144, 24), // 6 seconds
    });
    await undoManager.executeCommand(new AddClipCommand(v1.id, clipVideo));

    // Image Overlay on V2
    const clipOverlay = createClip({
      name: 'Logo Overlay',
      assetId: assetImage.id,
      trackId: v2.id,
      timelineStart: RationalTime.fromFrames(24, 24), // Starts at 1.0s
      duration: RationalTime.fromFrames(96, 24),      // 4.0s duration
    });
    await undoManager.executeCommand(new AddClipCommand(v2.id, clipOverlay));

    // Audio on A1
    const clipAudio = createClip({
      name: 'Synchronized Stereo Audio',
      assetId: assetAudio.id,
      trackId: a1.id,
      timelineStart: RationalTime.fromFrames(0, 24),
      duration: RationalTime.fromFrames(240, 24), // 10 seconds
    });
    await undoManager.executeCommand(new AddClipCommand(a1.id, clipAudio));

    expect(v1.clips.length).toBe(1);
    expect(v2.clips.length).toBe(1);
    expect(a1.clips.length).toBe(1);

    // 4. Frame-Accurate Blade Split at Frame 72 (3.0s)
    const splitPoint = RationalTime.fromFrames(72, 24);
    await undoManager.executeCommand(new SplitClipCommand(clipVideo.id, splitPoint));

    expect(v1.clips.length).toBe(2);
    const [leftPart, rightPart] = v1.clips;
    expect(leftPart.timelineRange.duration.toFrames(24)).toBe(72);
    expect(rightPart.timelineRange.start.toFrames(24)).toBe(72);
    expect(rightPart.timelineRange.duration.toFrames(24)).toBe(72);

    // 5. Trim Right Part by +24 Frames
    await undoManager.executeCommand(
      new TrimClipCommand(rightPart.id, 'tail', RationalTime.fromFrames(24, 24))
    );
    expect(rightPart.timelineRange.duration.toFrames(24)).toBe(96);

    // 6. Move Right Part to V2 at Frame 120
    const newStart = RationalTime.fromFrames(120, 24);
    await undoManager.executeCommand(new MoveClipCommand(rightPart.id, v2.id, newStart));
    expect(v1.clips.length).toBe(1);
    expect(v2.clips.length).toBe(2);

    // 7. Save Project to .frameforge JSON Bundle on Disk
    const projectPath = path.join(projectDir, 'cinema_project_test.frameforge');
    const projectData = {
      version: '0.1.0',
      created: Date.now(),
      assets: [assetVideo1, assetImage, assetAudio],
      sequence: serializeToOTIO(sequence),
    };

    fs.writeFileSync(projectPath, JSON.stringify(projectData, null, 2), 'utf-8');
    expect(fs.existsSync(projectPath)).toBe(true);

    // 8. Reopen Project from Disk & Reconstruct
    const reloadedRaw = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));
    const reloadedSequence = deserializeFromOTIO(reloadedRaw.sequence);

    expect(reloadedSequence.name).toBe('Cinema Real Project');
    expect(reloadedSequence.fps).toBe(24);
    expect(reloadedSequence.width).toBe(1920);
    expect(reloadedSequence.height).toBe(1080);

    const reloadedV1 = reloadedSequence.tracks.find((t) => t.name === 'V1')!;
    const reloadedV2 = reloadedSequence.tracks.find((t) => t.name === 'V2')!;
    const reloadedA1 = reloadedSequence.tracks.find((t) => t.name === 'A1')!;

    expect(reloadedV1.clips.length).toBe(1);
    expect(reloadedV2.clips.length).toBe(2);
    expect(reloadedA1.clips.length).toBe(1);
  });
});

