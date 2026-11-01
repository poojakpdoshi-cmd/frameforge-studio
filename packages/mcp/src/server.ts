/**
 * FrameForge Studio: Official Model Context Protocol (MCP) Server
 * 
 * Implements a compliant MCP server using @modelcontextprotocol/sdk with
 * strict Zod parameter validation and command-bus transactionality.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  TimelineSequence,
  UndoManager,
  RationalTime,
  createClip,
  AddClipCommand,
  DeleteClipCommand,
  SplitClipCommand,
  TrimClipCommand,
  MoveClipCommand,
  findClipById,
} from '@frameforge/core';

// Strict Zod Schemas for Tool Arguments
export const AddClipArgsSchema = z.object({
  trackId: z.string().min(1, 'trackId is required'),
  assetId: z.string().min(1, 'assetId is required'),
  name: z.string().default('AI Added Clip'),
  startFrame: z.number().int().nonnegative().default(0),
  durationFrames: z.number().int().positive().default(120),
});

export const SplitClipArgsSchema = z.object({
  clipId: z.string().min(1, 'clipId is required'),
  splitFrame: z.number().int().nonnegative(),
});

export const TrimClipArgsSchema = z.object({
  clipId: z.string().min(1, 'clipId is required'),
  edge: z.enum(['head', 'tail']),
  deltaFrames: z.number().int(),
});

export const MoveClipArgsSchema = z.object({
  clipId: z.string().min(1, 'clipId is required'),
  newTrackId: z.string().min(1, 'newTrackId is required'),
  newStartFrame: z.number().int().nonnegative(),
});

export const DeleteClipArgsSchema = z.object({
  clipId: z.string().min(1, 'clipId is required'),
});

export class FrameForgeMCPServer {
  private server: Server;
  private sequence: TimelineSequence;
  private undoManager: UndoManager<{ sequence: TimelineSequence }>;

  constructor(sequence: TimelineSequence, undoManager: UndoManager<{ sequence: TimelineSequence }>) {
    this.sequence = sequence;
    this.undoManager = undoManager;

    this.server = new Server(
      {
        name: 'frameforge-studio-mcp',
        version: '0.1.0-alpha',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.registerHandlers();
  }

  getServer(): Server {
    return this.server;
  }

  private registerHandlers(): void {
    // 1. List Available Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'get_timeline',
          description: 'Retrieves current sequence structure, all tracks, clips, timecodes and resolution.',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'add_clip',
          description: 'Adds a clip to a track at given frame using validated AddClipCommand (undoable).',
          inputSchema: {
            type: 'object',
            properties: {
              trackId: { type: 'string' },
              assetId: { type: 'string' },
              name: { type: 'string' },
              startFrame: { type: 'number' },
              durationFrames: { type: 'number' },
            },
            required: ['trackId', 'assetId'],
          },
        },
        {
          name: 'split_clip',
          description: 'Splits an existing clip at splitFrame using SplitClipCommand (the razor blade tool).',
          inputSchema: {
            type: 'object',
            properties: {
              clipId: { type: 'string' },
              splitFrame: { type: 'number' },
            },
            required: ['clipId', 'splitFrame'],
          },
        },
        {
          name: 'trim_clip',
          description: 'Trims head or tail of a clip by deltaFrames using TrimClipCommand (undoable).',
          inputSchema: {
            type: 'object',
            properties: {
              clipId: { type: 'string' },
              edge: { type: 'string', enum: ['head', 'tail'] },
              deltaFrames: { type: 'number' },
            },
            required: ['clipId', 'edge', 'deltaFrames'],
          },
        },
        {
          name: 'move_clip',
          description: 'Moves a clip across tracks and timecode using MoveClipCommand (undoable).',
          inputSchema: {
            type: 'object',
            properties: {
              clipId: { type: 'string' },
              newTrackId: { type: 'string' },
              newStartFrame: { type: 'number' },
            },
            required: ['clipId', 'newTrackId', 'newStartFrame'],
          },
        },
        {
          name: 'delete_clip',
          description: 'Deletes a clip from track using DeleteClipCommand (undoable).',
          inputSchema: {
            type: 'object',
            properties: {
              clipId: { type: 'string' },
            },
            required: ['clipId'],
          },
        },
        {
          name: 'undo',
          description: 'Inverts and rolls back the last command on the timeline.',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'redo',
          description: 'Re-applies the last undone command on the timeline.',
          inputSchema: { type: 'object', properties: {} },
        },
      ];

      return { tools };
    });

    // 2. Call Tool Execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.executeTool(name, args || {});
    });
  }

  async executeTool(name: string, rawArgs: Record<string, any>): Promise<any> {
    try {
      switch (name) {
        case 'get_timeline': {
          const summary = {
            id: this.sequence.id,
            name: this.sequence.name,
            fps: this.sequence.fps,
            resolution: `${this.sequence.width}x${this.sequence.height}`,
            tracks: this.sequence.tracks.map((t) => ({
              id: t.id,
              name: t.name,
              kind: t.kind,
              clipCount: t.clips.length,
              clips: t.clips.map((c) => ({
                id: c.id,
                name: c.name,
                assetId: c.assetId,
                startFrame: c.timelineRange.start.toFrames(this.sequence.fps),
                durationFrames: c.timelineRange.duration.toFrames(this.sequence.fps),
                startSMPTE: c.timelineRange.start.toSMPTE(this.sequence.fps),
              })),
            })),
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
          };
        }

        case 'add_clip': {
          const parsed = AddClipArgsSchema.parse(rawArgs);
          const start = RationalTime.fromFrames(parsed.startFrame, this.sequence.fps);
          const duration = RationalTime.fromFrames(parsed.durationFrames, this.sequence.fps);

          const clip = createClip({
            name: parsed.name,
            assetId: parsed.assetId,
            trackId: parsed.trackId,
            timelineStart: start,
            duration,
          });

          await this.undoManager.executeCommand(new AddClipCommand(parsed.trackId, clip));
          return {
            content: [{ type: 'text', text: `Added clip "${clip.name}" (ID: ${clip.id}) to track ${parsed.trackId}` }],
          };
        }

        case 'split_clip': {
          const parsed = SplitClipArgsSchema.parse(rawArgs);
          const splitPoint = RationalTime.fromFrames(parsed.splitFrame, this.sequence.fps);

          await this.undoManager.executeCommand(new SplitClipCommand(parsed.clipId, splitPoint));
          return {
            content: [{ type: 'text', text: `Split clip ${parsed.clipId} at frame ${parsed.splitFrame}` }],
          };
        }

        case 'trim_clip': {
          const parsed = TrimClipArgsSchema.parse(rawArgs);
          const delta = RationalTime.fromFrames(parsed.deltaFrames, this.sequence.fps);

          await this.undoManager.executeCommand(new TrimClipCommand(parsed.clipId, parsed.edge, delta));
          return {
            content: [{ type: 'text', text: `Trimmed clip ${parsed.clipId} (${parsed.edge}) by ${parsed.deltaFrames} frames` }],
          };
        }

        case 'move_clip': {
          const parsed = MoveClipArgsSchema.parse(rawArgs);
          const newStart = RationalTime.fromFrames(parsed.newStartFrame, this.sequence.fps);

          await this.undoManager.executeCommand(new MoveClipCommand(parsed.clipId, parsed.newTrackId, newStart));
          return {
            content: [{ type: 'text', text: `Moved clip ${parsed.clipId} to track ${parsed.newTrackId} at frame ${parsed.newStartFrame}` }],
          };
        }

        case 'delete_clip': {
          const parsed = DeleteClipArgsSchema.parse(rawArgs);
          await this.undoManager.executeCommand(new DeleteClipCommand(parsed.clipId));
          return {
            content: [{ type: 'text', text: `Deleted clip ${parsed.clipId}` }],
          };
        }

        case 'undo': {
          const undone = await this.undoManager.undo();
          return {
            content: [{ type: 'text', text: undone ? 'Successfully undid last command' : 'Undo stack is empty' }],
          };
        }

        case 'redo': {
          const redone = await this.undoManager.redo();
          return {
            content: [{ type: 'text', text: redone ? 'Successfully redid command' : 'Redo stack is empty' }],
          };
        }

        default:
          throw new Error(`Unsupported tool: ${name}`);
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Tool error: ${err.message}` }],
      };
    }
  }
}
