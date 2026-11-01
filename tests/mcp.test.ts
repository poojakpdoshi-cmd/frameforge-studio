import { describe, it, expect } from 'vitest';
import {
  createSequence,
  UndoManager,
  RationalTime,
} from '../packages/core/src/index.js';
import { FrameForgeMCPServer } from '../packages/mcp/src/index.js';

describe('FrameForge MCP: Official SDK Protocol & Zod Validation', () => {
  it('initializes official MCP Server instance and handles get_timeline', async () => {
    const seq = createSequence('MCP Feature Project', 24);
    const undoManager = new UndoManager({ sequence: seq });
    const mcpServer = new FrameForgeMCPServer(seq, undoManager);

    const sdkServer = mcpServer.getServer();
    expect(sdkServer).toBeDefined();

    const res = await mcpServer.executeTool('get_timeline', {});
    expect(res.isError).toBeUndefined();
    expect(res.content[0].type).toBe('text');

    const data = JSON.parse(res.content[0].text);
    expect(data.name).toBe('MCP Feature Project');
    expect(data.fps).toBe(24);
  });

  it('validates tool arguments with Zod and rejects malformed calls', async () => {
    const seq = createSequence('MCP Feature Project', 24);
    const undoManager = new UndoManager({ sequence: seq });
    const mcpServer = new FrameForgeMCPServer(seq, undoManager);

    // Call add_clip without required trackId and assetId
    const res = await mcpServer.executeTool('add_clip', {
      startFrame: -5, // Invalid negative frame
    });

    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Tool error');
  });

  it('executes add_clip, split_clip and undo through verified command bus', async () => {
    const seq = createSequence('MCP Edit Sequence', 24);
    const undoManager = new UndoManager({ sequence: seq });
    const mcpServer = new FrameForgeMCPServer(seq, undoManager);

    const trackId = seq.tracks[0].id;

    // 1. Add Clip
    const addRes = await mcpServer.executeTool('add_clip', {
      trackId,
      assetId: 'asset_real_1',
      name: 'Agent Ingested Shot',
      startFrame: 0,
      durationFrames: 96,
    });
    expect(addRes.isError).toBeUndefined();
    expect(seq.tracks[0].clips.length).toBe(1);

    const clipId = seq.tracks[0].clips[0].id;

    // 2. Split Clip at Frame 48 (Blade Tool)
    const splitRes = await mcpServer.executeTool('split_clip', {
      clipId,
      splitFrame: 48,
    });
    expect(splitRes.isError).toBeUndefined();
    expect(seq.tracks[0].clips.length).toBe(2);

    // 3. Undo
    const undoRes = await mcpServer.executeTool('undo', {});
    expect(undoRes.isError).toBeUndefined();
    expect(seq.tracks[0].clips.length).toBe(1);
    expect(seq.tracks[0].clips[0].timelineRange.duration.toFrames(24)).toBe(96);
  });
});
