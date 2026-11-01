/**
 * FrameForge Studio: Central Reactive Workstation Store
 */

import { create } from 'zustand';
import {
  TimelineSequence,
  TimelineTrack,
  TimelineClip,
  MediaAsset,
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
  findClipById,
  BlendMode,
  TransformProperties,
} from '@frameforge/core';
import { FrameCompositor } from '@frameforge/engine';
import { MultitrackAudioMixer } from '@frameforge/audio';
import { FrameForgeMCPServer } from '@frameforge/mcp';

export type WorkspaceMode = 'edit' | 'vfx' | 'color' | 'audio' | 'export';
export type EditingTool = 'select' | 'blade' | 'ripple' | 'roll' | 'slip' | 'slide';

interface EditorState {
  sequence: TimelineSequence;
  mediaAssets: MediaAsset[];
  selectedClipId: string | null;
  selectedTrackId: string | null;
  playheadTime: RationalTime;
  isPlaying: boolean;
  activeTool: EditingTool;
  zoom: number; // Pixels per second
  workspaceMode: WorkspaceMode;
  exportModalOpen: boolean;
  aiDrawerOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;

  // Subsystems
  undoManager: UndoManager<{ sequence: TimelineSequence }>;
  mcpServer: FrameForgeMCPServer;
  compositor: FrameCompositor;
  audioMixer: MultitrackAudioMixer;
  mediaElements: Map<string, HTMLVideoElement | HTMLImageElement | HTMLCanvasElement>;

  // Actions
  setPlayheadTime: (time: RationalTime) => void;
  setPlayheadSeconds: (seconds: number) => void;
  togglePlay: () => void;
  setActiveTool: (tool: EditingTool) => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  setZoom: (zoom: number) => void;
  selectClip: (clipId: string | null) => void;
  setExportModalOpen: (open: boolean) => void;
  setAiDrawerOpen: (open: boolean) => void;

  // Real Project Persistence
  saveProject: () => Promise<boolean>;
  openProject: () => Promise<boolean>;
  setSequence: (seq: TimelineSequence) => void;

  // Editing Commands
  importAsset: (asset: MediaAsset) => void;
  addClipToTrack: (trackId: string, assetId: string, startFrame?: number, durationFrames?: number) => Promise<void>;
  splitClip: (clipId: string, splitPoint?: RationalTime) => Promise<void>;
  deleteClip: (clipId: string) => Promise<void>;
  moveClip: (clipId: string, newTrackId: string, newStart: RationalTime) => Promise<void>;
  trimClip: (clipId: string, edge: 'head' | 'tail', delta: RationalTime) => Promise<void>;
  updateTransform: (clipId: string, transform: Partial<TransformProperties>) => void;
  updateBlendMode: (clipId: string, blendMode: BlendMode) => void;
  updateAudio: (clipId: string, volume: number, pan: number) => void;
  addEffect: (clipId: string, effectType: string, params: Record<string, any>) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  runMCPTool: (toolName: string, args: Record<string, any>) => Promise<any>;
}

// Initial mock project sequence
const initialSeq = createSequence('Project 01 — Feature Montage', 24, 1920, 1080);

// Default sample media assets
const initialAssets: MediaAsset[] = [
  {
    id: 'asset_smpte_bars',
    name: 'SMPTE Color Calibration Bars.mp4',
    filePath: 'internal://generators/smpte.mp4',
    mediaType: 'generator',
    duration: RationalTime.fromSeconds(30, 24),
    width: 1920,
    height: 1080,
    fps: 24,
    dateAdded: Date.now(),
  },
  {
    id: 'asset_cinematic_landscape',
    name: 'Nordic Fjord Aerial 4K.mp4',
    filePath: 'internal://footage/fjord.mp4',
    mediaType: 'video',
    duration: RationalTime.fromSeconds(18, 24),
    width: 3840,
    height: 2160,
    fps: 24,
    dateAdded: Date.now(),
  },
  {
    id: 'asset_neon_city',
    name: 'Neo-Tokyo Cyberpunk Timelapse.mp4',
    filePath: 'internal://footage/city.mp4',
    mediaType: 'video',
    duration: RationalTime.fromSeconds(12, 24),
    width: 1920,
    height: 1080,
    fps: 24,
    dateAdded: Date.now(),
  },
  {
    id: 'asset_synth_soundtrack',
    name: 'Cinematic Atmosphere Master.wav',
    filePath: 'internal://audio/synth.wav',
    mediaType: 'audio',
    duration: RationalTime.fromSeconds(60, 24),
    sampleRate: 48000,
    channels: 2,
    dateAdded: Date.now(),
  },
];

// Seed initial clips onto tracks
const v1 = initialSeq.tracks.find((t) => t.name === 'V1')!;
const v2 = initialSeq.tracks.find((t) => t.name === 'V2')!;
const a1 = initialSeq.tracks.find((t) => t.name === 'A1')!;

v1.clips.push(
  createClip({
    name: 'Nordic Fjord Aerial',
    assetId: 'asset_cinematic_landscape',
    trackId: v1.id,
    timelineStart: RationalTime.fromFrames(0, 24),
    duration: RationalTime.fromFrames(144, 24), // 6 sec
    color: '#0284c7',
  }),
  createClip({
    name: 'Neo-Tokyo Timelapse',
    assetId: 'asset_neon_city',
    trackId: v1.id,
    timelineStart: RationalTime.fromFrames(144, 24),
    duration: RationalTime.fromFrames(120, 24), // 5 sec
    color: '#7c3aed',
  })
);

v2.clips.push(
  createClip({
    name: 'SMPTE Overlay Test',
    assetId: 'asset_smpte_bars',
    trackId: v2.id,
    timelineStart: RationalTime.fromFrames(48, 24),
    duration: RationalTime.fromFrames(96, 24), // 4 sec
    color: '#ea580c',
  })
);

a1.clips.push(
  createClip({
    name: 'Cinematic Score Audio',
    assetId: 'asset_synth_soundtrack',
    trackId: a1.id,
    timelineStart: RationalTime.fromFrames(0, 24),
    duration: RationalTime.fromFrames(264, 24), // 11 sec
    color: '#059669',
  })
);

const undoMgr = new UndoManager<{ sequence: TimelineSequence }>({ sequence: initialSeq });
const mcp = new FrameForgeMCPServer(initialSeq, undoMgr);
const comp = new FrameCompositor();
const mixer = new MultitrackAudioMixer();

export const useEditorStore = create<EditorState>((set, get) => {
  undoMgr.subscribe(() => {
    set({
      canUndo: undoMgr.canUndo(),
      canRedo: undoMgr.canRedo(),
      sequence: { ...get().sequence }, // Trigger re-render
    });
  });

  return {
    sequence: initialSeq,
    mediaAssets: initialAssets,
    selectedClipId: v1.clips[0]?.id || null,
    selectedTrackId: v1.id,
    playheadTime: RationalTime.fromFrames(0, 24),
    isPlaying: false,
    activeTool: 'select',
    zoom: 60, // 60 pixels per second
    workspaceMode: 'edit',
    exportModalOpen: false,
    aiDrawerOpen: false,
    canUndo: false,
    canRedo: false,

    undoManager: undoMgr,
    mcpServer: mcp,
    compositor: comp,
    audioMixer: mixer,
    mediaElements: new Map(),

    setPlayheadTime: (time) => set({ playheadTime: time }),
    setPlayheadSeconds: (seconds) => {
      const fps = get().sequence.fps;
      set({ playheadTime: RationalTime.fromSeconds(seconds, fps) });
    },
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setActiveTool: (tool) => set({ activeTool: tool }),
    setWorkspaceMode: (mode) => set({ workspaceMode: mode }),
    setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(300, zoom)) }),
    selectClip: (clipId) => set({ selectedClipId: clipId }),
    setExportModalOpen: (open) => set({ exportModalOpen: open }),
    setAiDrawerOpen: (open) => set({ aiDrawerOpen: open }),

    setSequence: (seq: TimelineSequence) => {
      undoMgr.setContext({ sequence: seq });
      set({ sequence: seq, selectedClipId: null });
    },

    saveProject: async () => {
      const state = get();
      const projectPayload = {
        version: '0.1.0',
        savedAt: Date.now(),
        assets: state.mediaAssets,
        sequence: state.sequence,
      };
      const jsonStr = JSON.stringify(projectPayload, null, 2);

      if (window.frameforge?.saveProject) {
        const res = await window.frameforge.saveProject(undefined, jsonStr);
        return res.success;
      } else {
        // Web fallback: download file
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${state.sequence.name.replace(/\s+/g, '_')}.frameforge`;
        a.click();
        URL.revokeObjectURL(url);
        return true;
      }
    },

    openProject: async () => {
      if (window.frameforge?.loadProject) {
        const res = await window.frameforge.loadProject();
        if (res.success && res.data) {
          const payload = res.data;
          if (payload.sequence) {
            get().setSequence(payload.sequence);
            if (payload.assets) {
              set({ mediaAssets: payload.assets });
            }
            return true;
          }
        }
      }
      return false;
    },

    importAsset: (asset) => {
      // Create and cache actual media elements for realtime canvas rendering
      const state = get();
      if (typeof document !== 'undefined') {
        if (asset.mediaType === 'video') {
          const video = document.createElement('video');
          video.src = asset.filePath;
          video.crossOrigin = 'anonymous';
          video.preload = 'auto';
          video.muted = true;
          state.mediaElements.set(asset.id, video);
        } else if (asset.mediaType === 'image') {
          const img = new Image();
          img.src = asset.filePath;
          img.crossOrigin = 'anonymous';
          state.mediaElements.set(asset.id, img);
        }
      }
      set((s) => ({ mediaAssets: [asset, ...s.mediaAssets] }));
    },

    addClipToTrack: async (trackId, assetId, startFrame = 0, durationFrames = 120) => {
      const state = get();
      const asset = state.mediaAssets.find((a) => a.id === assetId);
      const name = asset ? asset.name.replace(/\.[^/.]+$/, '') : 'New Clip';
      const fps = state.sequence.fps;

      const clip = createClip({
        name,
        assetId,
        trackId,
        timelineStart: RationalTime.fromFrames(startFrame, fps),
        duration: RationalTime.fromFrames(durationFrames, fps),
        color: '#2563eb',
      });

      const cmd = new AddClipCommand(trackId, clip);
      await state.undoManager.executeCommand(cmd);
      set({ selectedClipId: clip.id });
    },

    splitClip: async (clipId, splitPoint) => {
      const state = get();
      const cut = splitPoint || state.playheadTime;
      const cmd = new SplitClipCommand(clipId, cut);
      await state.undoManager.executeCommand(cmd);
    },

    deleteClip: async (clipId) => {
      const state = get();
      const cmd = new DeleteClipCommand(clipId);
      await state.undoManager.executeCommand(cmd);
      if (state.selectedClipId === clipId) {
        set({ selectedClipId: null });
      }
    },

    moveClip: async (clipId, newTrackId, newStart) => {
      const state = get();
      const cmd = new MoveClipCommand(clipId, newTrackId, newStart);
      await state.undoManager.executeCommand(cmd);
    },

    trimClip: async (clipId, edge, delta) => {
      const state = get();
      const cmd = new TrimClipCommand(clipId, edge, delta);
      await state.undoManager.executeCommand(cmd);
    },

    updateTransform: (clipId, transformUpdates) => {
      const state = get();
      const found = findClipById(state.sequence, clipId);
      if (found) {
        found.clip.transform = { ...found.clip.transform, ...transformUpdates };
        set({ sequence: { ...state.sequence } });
      }
    },

    updateBlendMode: (clipId, blendMode) => {
      const state = get();
      const found = findClipById(state.sequence, clipId);
      if (found) {
        found.clip.blendMode = blendMode;
        set({ sequence: { ...state.sequence } });
      }
    },

    updateAudio: (clipId, volume, pan) => {
      const state = get();
      const found = findClipById(state.sequence, clipId);
      if (found) {
        found.clip.volume = volume;
        found.clip.pan = pan;
        set({ sequence: { ...state.sequence } });
      }
    },

    addEffect: (clipId, effectType, params) => {
      const state = get();
      const found = findClipById(state.sequence, clipId);
      if (found) {
        found.clip.effects.push({
          id: `eff_${Date.now()}`,
          effectType,
          name: effectType.toUpperCase(),
          enabled: true,
          parameters: params,
        });
        set({ sequence: { ...state.sequence } });
      }
    },

    undo: async () => {
      await get().undoManager.undo();
    },

    redo: async () => {
      await get().undoManager.redo();
    },

    runMCPTool: async (toolName, args) => {
      const res = await get().mcpServer.executeTool(toolName, args);
      set({ sequence: { ...get().sequence } });
      const text = res.content?.[0]?.text || '';
      return {
        success: !res.isError,
        message: text,
      };
    },
  };
});

