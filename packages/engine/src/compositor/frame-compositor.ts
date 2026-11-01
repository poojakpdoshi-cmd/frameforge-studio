/**
 * FrameForge Studio: Multi-Track Frame Compositor
 * 
 * Evaluates the timeline sequence DAG at exact playhead time t, sorting visual
 * tracks in ascending order and applying transforms, blend modes, and opacity.
 */

import {
  TimelineSequence,
  TimelineClip,
  RationalTime,
  getClipsAtTime,
  BlendMode,
} from '@frameforge/core';
import { ShaderPipeline } from '../shaders/shader-pipeline.js';

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  sourceElements: Map<string, HTMLVideoElement | HTMLImageElement | HTMLCanvasElement>;
}

export class FrameCompositor {
  private shaderPipeline: ShaderPipeline;

  constructor() {
    this.shaderPipeline = new ShaderPipeline();
  }

  /**
   * Maps FrameForge blend modes to HTML5 Canvas globalCompositeOperation
   */
  private mapBlendMode(mode: BlendMode): GlobalCompositeOperation {
    switch (mode) {
      case 'multiply': return 'multiply';
      case 'screen': return 'screen';
      case 'overlay': return 'overlay';
      case 'darken': return 'darken';
      case 'lighten': return 'lighten';
      case 'color-dodge': return 'color-dodge';
      case 'color-burn': return 'color-burn';
      case 'hard-light': return 'hard-light';
      case 'soft-light': return 'soft-light';
      case 'difference': return 'difference';
      case 'exclusion': return 'exclusion';
      case 'normal':
      default:
        return 'source-over';
    }
  }

  /**
   * Renders the complete timeline at the given playhead time
   */
  renderFrame(
    sequence: TimelineSequence,
    time: RationalTime,
    context: RenderContext
  ): void {
    const { ctx, width, height, sourceElements } = context;

    // Clear background to neutral studio black
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Query active clips at this instant
    const activeClips = getClipsAtTime(sequence, time);
    if (activeClips.length === 0) return;

    // Filter to visual tracks only (video & overlay)
    const visualTracks = sequence.tracks
      .filter((t) => t.kind === 'video' || t.kind === 'overlay')
      // Sort lowest index first so higher tracks composite over lower tracks
      .sort((a, b) => b.index - a.index);

    for (const track of visualTracks) {
      if (track.muted) continue;
      const trackClips = activeClips.filter((c) => c.trackId === track.id);

      for (const clip of trackClips) {
        this.renderClip(clip, time, context);
      }
    }
  }

  private renderClip(
    clip: TimelineClip,
    playheadTime: RationalTime,
    context: RenderContext
  ): void {
    const { ctx, width, height, sourceElements } = context;
    const element = sourceElements.get(clip.assetId);

    // Compute relative source time
    const clipOffset = playheadTime.subtract(clip.timelineRange.start);
    const sourceCurrent = clip.sourceRange.start.add(clipOffset.multiply(clip.speed));

    ctx.save();

    // Apply Opacity & Blend Mode
    ctx.globalAlpha = Math.max(0, Math.min(1, clip.transform.opacity));
    ctx.globalCompositeOperation = this.mapBlendMode(clip.blendMode);

    // Transform Matrix: Translation, Rotation, Anchor Point, Scale
    const centerX = width / 2 + clip.transform.position.x;
    const centerY = height / 2 + clip.transform.position.y;

    ctx.translate(centerX, centerY);
    if (clip.transform.rotation !== 0) {
      ctx.rotate((clip.transform.rotation * Math.PI) / 180);
    }
    ctx.scale(clip.transform.scale.x, clip.transform.scale.y);

    // Draw element or procedural placeholder
    const drawW = element ? (element as any).videoWidth || (element as any).width || width : width;
    const drawH = element ? (element as any).videoHeight || (element as any).height || height : height;
    const anchorX = -drawW * clip.transform.anchor.x;
    const anchorY = -drawH * clip.transform.anchor.y;

    if (element) {
      // Seek video element if not playing
      if (element instanceof HTMLVideoElement && Math.abs(element.currentTime - sourceCurrent.toSeconds()) > 0.1) {
        element.currentTime = sourceCurrent.toSeconds();
      }
      ctx.drawImage(element, anchorX, anchorY, drawW, drawH);
    } else {
      // High-visibility procedural fallback pattern (SMPTE gradient)
      this.drawProceduralPlaceholder(ctx, anchorX, anchorY, drawW, drawH, clip.name, clip.color);
    }

    // Apply Shader Effects if any are attached
    if (clip.effects && clip.effects.length > 0) {
      this.shaderPipeline.applyEffects(ctx, anchorX, anchorY, drawW, drawH, clip.effects);
    }

    ctx.restore();
  }

  private drawProceduralPlaceholder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    name: string,
    color?: string
  ): void {
    ctx.fillStyle = color || '#1e293b';
    ctx.fillRect(x, y, w, h);

    // Studio grid accent
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Label
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x + w / 2, y + h / 2);
  }
}
