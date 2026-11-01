import { describe, it, expect } from 'vitest';
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
} from '../packages/core/src/index.js';
import {
  FrameCompositor,
  FFmpegCommandBuilder,
  EXPORT_PRESETS,
} from '../packages/engine/src/index.js';
import { MultitrackAudioMixer } from '../packages/audio/src/index.js';
import { FrameForgeMCPServer } from '../packages/mcp/src/index.js';

describe('FrameForge Studio: Stage 1 Master Lifecycle & Subsystem Integration', () => {
  it('executes full non-destructive editing workflow with undo/redo, OTIO and render export', async () => {
    // 1. Initialize Sequence
    const sequence = createSequence('Cinema Master Feature', 24, 3840, 2160);
    const undoManager = new UndoManager({ sequence });
    const mcpServer = new FrameForgeMCPServer(sequence, undoManager);

    const v1 = sequence.tracks.find((t) => t.name === 'V1')!;
    const v2 = sequence.tracks.find((t) => t.name === 'V2')!;
    const a1 = sequence.tracks.find((t) => t.name === 'A1')!;

    // 2. Add Clips to Timeline via Command Bus
    const clipA = createClip({
      name: 'Landscape Establishing Shot',
      assetId: 'asset_fjord',
      trackId: v1.id,
      timelineStart: RationalTime.fromFrames(0, 24),
      duration: RationalTime.fromFrames(240, 24), // 10 seconds
    });
    await undoManager.executeCommand(new AddClipCommand(v1.id, clipA));

    const clipB = createClip({
      name: 'Interview Master Audio',
      assetId: 'asset_audio_master',
      trackId: a1.id,
      timelineStart: RationalTime.fromFrames(0, 24),
      duration: RationalTime.fromFrames(480, 24), // 20 seconds
    });
    await undoManager.executeCommand(new AddClipCommand(a1.id, clipB));

    expect(v1.clips.length).toBe(1);
    expect(a1.clips.length).toBe(1);

    // 3. Precision Blade Split at 4.0 seconds (Frame 96)
    const splitPoint = RationalTime.fromFrames(96, 24);
    await undoManager.executeCommand(new SplitClipCommand(clipA.id, splitPoint));

    expect(v1.clips.length).toBe(2);
    const [part1, part2] = v1.clips;
    expect(part1.timelineRange.duration.toFrames(24)).toBe(96);
    expect(part2.timelineRange.start.toFrames(24)).toBe(96);
    expect(part2.timelineRange.duration.toFrames(24)).toBe(144);

    // 4. Move part2 up to Track V2 at Frame 120
    const newStart = RationalTime.fromFrames(120, 24);
    await undoManager.executeCommand(new MoveClipCommand(part2.id, v2.id, newStart));

    expect(v1.clips.length).toBe(1);
    expect(v2.clips.length).toBe(1);
    expect(v2.clips[0].timelineRange.start.toFrames(24)).toBe(120);

    // 5. Apply Cinematic Shader Effects to part2
    part2.effects.push({
      id: 'eff_grain_1',
      effectType: 'film_grain',
      name: '35MM GRAIN',
      enabled: true,
      parameters: { intensity: 0.2 },
    });
    part2.effects.push({
      id: 'eff_vignette_1',
      effectType: 'vignette',
      name: 'ORGANIC VIGNETTE',
      enabled: true,
      parameters: { amount: 0.5 },
    });

    expect(part2.effects.length).toBe(2);

    // 6. Test Undo Stack: Undo Move, Undo Split
    await undoManager.undo(); // Undo Move: part2 returns to V1
    expect(v1.clips.length).toBe(2);
    expect(v2.clips.length).toBe(0);

    await undoManager.undo(); // Undo Split: merges back into single clipA
    expect(v1.clips.length).toBe(1);
    expect(v1.clips[0].timelineRange.duration.toFrames(24)).toBe(240);

    // 7. Test Redo
    await undoManager.redo(); // Redo Split
    expect(v1.clips.length).toBe(2);

    // 8. OpenTimelineIO Roundtrip Export & Import
    const otioData = serializeToOTIO(sequence);
    expect(otioData.OTIO_SCHEMA).toBe('Timeline.1');

    const importedSeq = deserializeFromOTIO(otioData);
    expect(importedSeq.name).toBe('Cinema Master Feature');
    expect(importedSeq.fps).toBe(24);
    expect(importedSeq.tracks.length).toBeGreaterThan(0);

    // 9. Hardware-Accelerated Production Export Argument Generation
    const assetMap = new Map<string, string>();
    assetMap.set('asset_fjord', 'C:/Media/fjord_4k.mp4');
    assetMap.set('asset_audio_master', 'C:/Media/audio.wav');

    const exportArgs = FFmpegCommandBuilder.buildExportArgs({
      sequence,
      assetPaths: assetMap,
      outputPath: 'C:/Exports/master_deliverable.mp4',
      preset: EXPORT_PRESETS.YOUTUBE_4K,
    });

    expect(exportArgs).toContain('-y');
    expect(exportArgs).toContain('C:/Media/fjord_4k.mp4');
    expect(exportArgs).toContain('C:/Exports/master_deliverable.mp4');
    expect(exportArgs).toContain('-s');
    expect(exportArgs).toContain('3840x2160');
    expect(exportArgs).toContain('48000');
  });
});
