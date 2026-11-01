/**
 * FrameForge Studio: Model Context Protocol (MCP) Server
 * 
 * Provides an external JSON-RPC tool interface for AI agents (Gemini, Claude, GPT)
 * to control the non-linear editing engine using the exact same invertible
 * command bus as human keyboard/mouse operations.
 */

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
import { EXPORT_PRESETS, FFmpegCommandBuilder } from '@frameforge/engine';

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class FrameForgeMCPServer {
  private sequence: TimelineSequence;
  private undoManager: UndoManager<{ sequence: TimelineSequence }>;

  constructor(sequence: TimelineSequence, undoManager: UndoManager<{ sequence: TimelineSequence }>) {
    this.sequence = sequence;
    this.undoManager = undoManager;
  }

  /**
   * Dispatches an incoming MCP tool invocation through validated command handlers
   */
  async handleToolCall(call: MCPToolCall): Promise<MCPResponse> {
    try {
      switch (call.name) {
        case 'get_timeline':
          return this.getTimeline();

        case 'add_clip':
          return await this.addClip(call.arguments);

        case 'split_clip':
          return await this.splitClip(call.arguments);

        case 'trim_clip':
          return await this.trimClip(call.arguments);

        case 'move_clip':
          return await this.moveClip(call.arguments);

        case 'delete_clip':
          return await this.deleteClip(call.arguments);

        case 'apply_effect':
          return this.applyEffect(call.arguments);

        case 'undo':
          const undone = await this.undoManager.undo();
          return { success: undone, message: undone ? 'Undid last operation' : 'Undo stack is empty' };

        case 'redo':
          const redone = await this.undoManager.redo();
          return { success: redone, message: redone ? 'Redid operation' : 'Redo stack is empty' };

        default:
          return {
            success: false,
            message: `Unknown MCP tool: "${call.name}"`,
          };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Command execution failed: ${err.message}`,
      };
    }
  }

  private getTimeline(): MCPResponse {
    return {
      success: true,
      message: 'Retrieved active timeline state',
      data: {
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
            startFrames: c.timelineRange.start.toFrames(this.sequence.fps),
            durationFrames: c.timelineRange.duration.toFrames(this.sequence.fps),
            startSMPTE: c.timelineRange.start.toSMPTE(this.sequence.fps),
          })),
        })),
      },
    };
  }

  private async addClip(args: Record<string, any>): Promise<MCPResponse> {
    const { trackId, assetId, name, startFrame, durationFrames } = args;
    const start = RationalTime.fromFrames(startFrame ?? 0, this.sequence.fps);
    const duration = RationalTime.fromFrames(durationFrames ?? this.sequence.fps * 5, this.sequence.fps);

    const clip = createClip({
      name: name || 'AI Added Clip',
      assetId: assetId || `asset_${Date.now()}`,
      trackId,
      timelineStart: start,
      duration,
    });

    const cmd = new AddClipCommand(trackId, clip);
    await this.undoManager.executeCommand(cmd);

    return {
      success: true,
      message: `Clip "${clip.name}" added to track ${trackId} at frame ${startFrame}`,
      data: { clipId: clip.id },
    };
  }

  private async splitClip(args: Record<string, any>): Promise<MCPResponse> {
    const { clipId, splitFrame } = args;
    const splitPoint = RationalTime.fromFrames(splitFrame, this.sequence.fps);

    const cmd = new SplitClipCommand(clipId, splitPoint);
    await this.undoManager.executeCommand(cmd);

    return {
      success: true,
      message: `Clip ${clipId} split at frame ${splitFrame}`,
    };
  }

  private async trimClip(args: Record<string, any>): Promise<MCPResponse> {
    const { clipId, edge, deltaFrames } = args;
    const delta = RationalTime.fromFrames(deltaFrames, this.sequence.fps);

    const cmd = new TrimClipCommand(clipId, edge, delta);
    await this.undoManager.executeCommand(cmd);

    return {
      success: true,
      message: `Clip ${clipId} trimmed at ${edge} by ${deltaFrames} frames`,
    };
  }

  private async moveClip(args: Record<string, any>): Promise<MCPResponse> {
    const { clipId, newTrackId, newStartFrame } = args;
    const newStart = RationalTime.fromFrames(newStartFrame, this.sequence.fps);

    const cmd = new MoveClipCommand(clipId, newTrackId, newStart);
    await this.undoManager.executeCommand(cmd);

    return {
      success: true,
      message: `Clip ${clipId} moved to track ${newTrackId} at frame ${newStartFrame}`,
    };
  }

  private async deleteClip(args: Record<string, any>): Promise<MCPResponse> {
    const { clipId } = args;
    const cmd = new DeleteClipCommand(clipId);
    await this.undoManager.executeCommand(cmd);

    return {
      success: true,
      message: `Clip ${clipId} deleted`,
    };
  }

  private applyEffect(args: Record<string, any>): MCPResponse {
    const { clipId, effectType, parameters } = args;
    const found = findClipById(this.sequence, clipId);
    if (!found) throw new Error(`Clip with id "${clipId}" not found`);

    found.clip.effects.push({
      id: `eff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      effectType,
      name: effectType.replace('_', ' ').toUpperCase(),
      enabled: true,
      parameters: parameters || {},
    });

    return {
      success: true,
      message: `Applied effect "${effectType}" to clip ${clipId}`,
    };
  }
}
