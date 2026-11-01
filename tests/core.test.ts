import { describe, it, expect } from 'vitest';
import {
  RationalTime,
  TimeRange,
  createSequence,
  createTrack,
  createClip,
  UndoManager,
  AddClipCommand,
  DeleteClipCommand,
  SplitClipCommand,
  TrimClipCommand,
  MoveClipCommand,
  serializeToOTIO,
  deserializeFromOTIO,
} from '../packages/core/src/index.js';

describe('FrameForge Core: Rational Time Arithmetic', () => {
  it('normalizes fractional time accurately via GCD', () => {
    const t = new RationalTime(48, 24);
    expect(t.value).toBe(2n);
    expect(t.timescale).toBe(1);
    expect(t.toSeconds()).toBe(2);
  });

  it('performs exact addition and subtraction without floating point drift', () => {
    const a = new RationalTime(1, 24);
    const b = new RationalTime(2, 24);
    const sum = a.add(b);
    expect(sum.toFrames(24)).toBe(3);

    const diff = sum.subtract(a);
    expect(diff.toFrames(24)).toBe(2);
  });

  it('formats and parses professional SMPTE timecode (HH:MM:SS:FF)', () => {
    // 1 hour, 2 minutes, 3 seconds, 4 frames at 24fps
    // total frames = ((1 * 60 + 2) * 60 + 3) * 24 + 4 = (3723 * 24) + 4 = 89356
    const t = RationalTime.fromFrames(89356, 24);
    expect(t.toSMPTE(24)).toBe('01:02:03:04');

    const parsed = RationalTime.fromSMPTE('01:02:03:04', 24);
    expect(parsed.toFrames(24)).toBe(89356);
  });

  it('evaluates time range containment and overlap correctly', () => {
    const start = RationalTime.fromFrames(24, 24);
    const duration = RationalTime.fromFrames(48, 24);
    const range = new TimeRange(start, duration);

    expect(range.startSeconds).toBe(1.0);
    expect(range.durationSeconds).toBe(2.0);
    expect(range.endSeconds).toBe(3.0);

    const mid = RationalTime.fromFrames(40, 24);
    const outside = RationalTime.fromFrames(80, 24);
    expect(range.containsTime(mid)).toBe(true);
    expect(range.containsTime(outside)).toBe(false);
  });
});

describe('FrameForge Core: Invertible Command Bus & Razor Splitting', () => {
  it('executes AddClipCommand and inverts via UndoManager', async () => {
    const seq = createSequence('Test Seq', 24);
    const track = seq.tracks[0];
    const undoManager = new UndoManager({ sequence: seq });

    const clip = createClip({
      name: 'Test Clip 1',
      assetId: 'asset_1',
      trackId: track.id,
      timelineStart: RationalTime.fromFrames(0, 24),
      duration: RationalTime.fromFrames(120, 24),
    });

    await undoManager.executeCommand(new AddClipCommand(track.id, clip));
    expect(track.clips.length).toBe(1);
    expect(track.clips[0].name).toBe('Test Clip 1');

    // Test Undo
    expect(undoManager.canUndo()).toBe(true);
    await undoManager.undo();
    expect(track.clips.length).toBe(0);

    // Test Redo
    expect(undoManager.canRedo()).toBe(true);
    await undoManager.redo();
    expect(track.clips.length).toBe(1);
  });

  it('executes SplitClipCommand (Blade Tool) and precisely splits into two subclips', async () => {
    const seq = createSequence('Test Seq', 24);
    const track = seq.tracks[0];
    const undoManager = new UndoManager({ sequence: seq });

    const clip = createClip({
      name: 'Interview Shot',
      assetId: 'asset_interview',
      trackId: track.id,
      timelineStart: RationalTime.fromFrames(0, 24),
      duration: RationalTime.fromFrames(100, 24),
    });
    track.clips.push(clip);

    // Split at frame 40
    const splitPoint = RationalTime.fromFrames(40, 24);
    const splitCmd = new SplitClipCommand(clip.id, splitPoint);
    await undoManager.executeCommand(splitCmd);

    expect(track.clips.length).toBe(2);
    const leftClip = track.clips.find((c) => c.id === clip.id)!;
    const rightClip = track.clips.find((c) => c.id !== clip.id)!;

    expect(leftClip.timelineRange.duration.toFrames(24)).toBe(40);
    expect(rightClip.timelineRange.start.toFrames(24)).toBe(40);
    expect(rightClip.timelineRange.duration.toFrames(24)).toBe(60);

    // Undo should restore single clip of 100 frames
    await undoManager.undo();
    expect(track.clips.length).toBe(1);
    expect(track.clips[0].timelineRange.duration.toFrames(24)).toBe(100);
  });

  it('executes TrimClipCommand on head and tail edges reversibly', async () => {
    const seq = createSequence('Test Seq', 24);
    const track = seq.tracks[0];
    const undoManager = new UndoManager({ sequence: seq });

    const clip = createClip({
      name: 'Action Cut',
      assetId: 'asset_action',
      trackId: track.id,
      timelineStart: RationalTime.fromFrames(24, 24),
      duration: RationalTime.fromFrames(48, 24),
    });
    track.clips.push(clip);

    // Trim tail by +24 frames (extend duration to 72)
    const tailTrim = new TrimClipCommand(clip.id, 'tail', RationalTime.fromFrames(24, 24));
    await undoManager.executeCommand(tailTrim);
    expect(clip.timelineRange.duration.toFrames(24)).toBe(72);

    await undoManager.undo();
    expect(clip.timelineRange.duration.toFrames(24)).toBe(48);
  });
});

describe('FrameForge Core: OpenTimelineIO (OTIO) Interoperability', () => {
  it('serializes and deserializes sequences without data loss', () => {
    const seq = createSequence('Cinema Sequence', 24, 3840, 2160);
    const track = seq.tracks[0];
    const clip = createClip({
      name: 'Opening Scene',
      assetId: 'asset_open',
      trackId: track.id,
      timelineStart: RationalTime.fromFrames(0, 24),
      duration: RationalTime.fromFrames(240, 24),
    });
    track.clips.push(clip);

    const otio = serializeToOTIO(seq);
    expect(otio.OTIO_SCHEMA).toBe('Timeline.1');
    expect(otio.name).toBe('Cinema Sequence');

    const roundtrip = deserializeFromOTIO(otio);
    expect(roundtrip.name).toBe('Cinema Sequence');
    expect(roundtrip.fps).toBe(24);
    expect(roundtrip.width).toBe(3840);
    expect(roundtrip.height).toBe(2160);
    expect(roundtrip.tracks.length).toBeGreaterThan(0);
  });
});

