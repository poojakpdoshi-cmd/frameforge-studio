/**
 * FrameForge Studio: Multi-Track Frame Compositor
 * 
 * Evaluates the timeline sequence DAG at exact playhead time t, sorting visual
 * tracks in ascending order and applying transforms, blend modes, filters, and shaders.
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

  renderFrame(
    sequence: TimelineSequence,
    time: RationalTime,
    context: RenderContext
  ): void {
    const { ctx, width, height } = context;

    // Clear background to neutral studio black
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Query active clips at this instant
    const activeClips = getClipsAtTime(sequence, time);
    if (activeClips.length === 0) return;

    // Filter to visual tracks only (video & overlay), sorted ascending (V1 -> V2 -> V3)
    const visualTracks = sequence.tracks
      .filter((t) => t.kind === 'video' || t.kind === 'overlay')
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

    // 1. Prepare Pre-Render Filters (Blur, Color Grading) BEFORE drawImage
    if (clip.effects && clip.effects.length > 0) {
      this.shaderPipeline.preparePreRenderFilters(ctx, clip.effects);
    } else {
      ctx.filter = 'none';
    }

    // 2. Apply Opacity & Blend Mode
    ctx.globalAlpha = Math.max(0, Math.min(1, clip.transform.opacity));
    ctx.globalCompositeOperation = this.mapBlendMode(clip.blendMode);

    // 3. Transform Matrix: Translation, Rotation, Anchor Point, Scale
    const centerX = width / 2 + clip.transform.position.x;
    const centerY = height / 2 + clip.transform.position.y;

    ctx.translate(centerX, centerY);
    if (clip.transform.rotation !== 0) {
      ctx.rotate((clip.transform.rotation * Math.PI) / 180);
    }
    ctx.scale(clip.transform.scale.x, clip.transform.scale.y);

    const drawW = element ? (element as any).videoWidth || (element as any).width || width : width;
    const drawH = element ? (element as any).videoHeight || (element as any).height || height : height;
    const anchorX = -drawW * clip.transform.anchor.x;
    const anchorY = -drawH * clip.transform.anchor.y;

    // 4. Draw Media Element or High-Visibility Procedural Canvas
    if (element) {
      if (element instanceof HTMLVideoElement && Math.abs(element.currentTime - sourceCurrent.toSeconds()) > 0.1) {
        element.currentTime = sourceCurrent.toSeconds();
      }
      ctx.drawImage(element, anchorX, anchorY, drawW, drawH);
    } else {
      this.drawProceduralPlaceholder(ctx, anchorX, anchorY, drawW, drawH, clip.name, clip.color);
    }

    // 5. Apply Post-Render Pixel Shaders (Grain, Vignette, Chromatic Aberration)
    if (clip.effects && clip.effects.length > 0) {
      this.shaderPipeline.applyPostRenderShaders(
        ctx,
        centerX + anchorX,
        centerY + anchorY,
        drawW * clip.transform.scale.x,
        drawH * clip.transform.scale.y,
        clip.effects
      );
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

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x + w / 2, y + h / 2);
  }
}
