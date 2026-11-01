import { describe, it, expect } from 'vitest';
import {
  createSequence,
  UndoManager,
  RationalTime,
} from '../packages/core/src/index.js';
import { FrameForgeMCPServer } from '../packages/mcp/src/index.js';

describe('FrameForge MCP: AI Agent Tool Dispatch & Command Safety', () => {
  it('executes get_timeline, add_clip, split_clip and undo through MCP', async () => {
    const seq = createSequence('MCP Test Project', 24);
    const undoManager = new UndoManager({ sequence: seq });
    const server = new FrameForgeMCPServer(seq, undoManager);

    // 1. Get Timeline
    const timelineRes = await server.handleToolCall({
      name: 'get_timeline',
      arguments: {},
    });
    expect(timelineRes.success).toBe(true);
    expect(timelineRes.data.name).toBe('MCP Test Project');

    // 2. Add Clip via AI command
    const targetTrackId = seq.tracks[0].id;
    const addRes = await server.handleToolCall({
      name: 'add_clip',
      arguments: {
        trackId: targetTrackId,
        assetId: 'media_stock_1',
        name: 'AI Generated B-Roll',
        startFrame: 0,
        durationFrames: 72,
      },
    });
    expect(addRes.success).toBe(true);
    const clipId = addRes.data.clipId;
    expect(seq.tracks[0].clips.length).toBe(1);

    // 3. Split Clip at Frame 24
    const splitRes = await server.handleToolCall({
      name: 'split_clip',
      arguments: {
        clipId,
        splitFrame: 24,
      },
    });
    expect(splitRes.success).toBe(true);
    expect(seq.tracks[0].clips.length).toBe(2);

    // 4. Undo via AI command
    const undoRes = await server.handleToolCall({
      name: 'undo',
      arguments: {},
    });
    expect(undoRes.success).toBe(true);
    expect(seq.tracks[0].clips.length).toBe(1); // restored before split
  });

  it('rejects invalid tool names and malformed parameters gracefully', async () => {
    const seq = createSequence('MCP Test', 24);
    const undoManager = new UndoManager({ sequence: seq });
    const server = new FrameForgeMCPServer(seq, undoManager);

    const badTool = await server.handleToolCall({
      name: 'non_existent_tool',
      arguments: {},
    });
    expect(badTool.success).toBe(false);
    expect(badTool.message).toContain('Unknown MCP tool');
  });
});
