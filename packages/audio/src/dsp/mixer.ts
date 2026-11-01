/**
 * FrameForge Studio: Multitrack Audio Mixer & Graph
 * 
 * Manages Web Audio API routing, gain, stereo panning, 4-band EQ, and master limiting.
 */

import { TimelineSequence, TimelineTrack, TimelineClip } from '@frameforge/core';
import { dbToGain } from './math.js';

export interface ChannelStrip {
  trackId: string;
  gainNode: GainNode;
  pannerNode: StereoPannerNode;
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
}

export class MultitrackAudioMixer {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private channelStrips: Map<string, ChannelStrip> = new Map();

  initialize(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      // Master Chain: Channel Sum -> Master Compressor (Limiter) -> Master Gain -> Destination
      this.masterCompressor = this.audioCtx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-1.0, this.audioCtx.currentTime);
      this.masterCompressor.knee.setValueAtTime(0.0, this.audioCtx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(20.0, this.audioCtx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.1, this.audioCtx.currentTime);

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

      this.masterCompressor.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);
    }
    return this.audioCtx;
  }

  getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  syncTracks(sequence: TimelineSequence): void {
    if (!this.audioCtx || !this.masterCompressor) return;

    // Build or update channel strips for each audio track
    const audioTracks = sequence.tracks.filter((t) => t.kind === 'audio');

    for (const track of audioTracks) {
      if (!this.channelStrips.has(track.id)) {
        const gainNode = this.audioCtx.createGain();
        const pannerNode = this.audioCtx.createStereoPanner();

        // 3-Band Parametric EQ
        const eqLow = this.audioCtx.createBiquadFilter();
        eqLow.type = 'lowshelf';
        eqLow.frequency.setValueAtTime(120, this.audioCtx.currentTime);

        const eqMid = this.audioCtx.createBiquadFilter();
        eqMid.type = 'peaking';
        eqMid.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
        eqMid.Q.setValueAtTime(1.0, this.audioCtx.currentTime);

        const eqHigh = this.audioCtx.createBiquadFilter();
        eqHigh.type = 'highshelf';
        eqHigh.frequency.setValueAtTime(8000, this.audioCtx.currentTime);

        // Routing: Low -> Mid -> High -> Panner -> Gain -> Master Compressor
        eqLow.connect(eqMid);
        eqMid.connect(eqHigh);
        eqHigh.connect(pannerNode);
        pannerNode.connect(gainNode);
        gainNode.connect(this.masterCompressor);

        this.channelStrips.set(track.id, {
          trackId: track.id,
          gainNode,
          pannerNode,
          eqLow,
          eqMid,
          eqHigh,
        });
      }

      // Update track volume / mute / solo
      const strip = this.channelStrips.get(track.id)!;
      const targetGain = track.muted ? 0.0 : 1.0;
      strip.gainNode.gain.setValueAtTime(targetGain, this.audioCtx.currentTime);
    }
  }

  setTrackVolume(trackId: string, volume: number): void {
    const strip = this.channelStrips.get(trackId);
    if (strip && this.audioCtx) {
      strip.gainNode.gain.setTargetAtTime(volume, this.audioCtx.currentTime, 0.02);
    }
  }

  setTrackPan(trackId: string, pan: number): void {
    const strip = this.channelStrips.get(trackId);
    if (strip && this.audioCtx) {
      strip.pannerNode.pan.setTargetAtTime(pan, this.audioCtx.currentTime, 0.02);
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(volume, this.audioCtx.currentTime, 0.02);
    }
  }
}

