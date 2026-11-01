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
  ApplyEffectCommand,
  rehydrateSequence,
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
  selectedAssetId: string | null;
  sourcePlayheadTime: number; // In seconds
  isSourcePlaying: boolean;
  sourceInPoint: number | null;
  sourceOutPoint: number | null;
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
  selectAsset: (id: string | null) => void;
  setSourcePlayheadTime: (time: number) => void;
  toggleSourcePlay: () => void;
  setSourceInPoint: (time: number | null) => void;
  setSourceOutPoint: (time: number | null) => void;
  insertSourceToTimeline: (targetTrackId?: string) => Promise<void>;
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
  removeEffect: (clipId: string, effectId: string) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  runMCPTool: (toolName: string, args: Record<string, any>) => Promise<any>;
}

export function toMediaUrl(filePath: string): string {
  if (!filePath) return '';
  if (
    filePath.startsWith('blob:') ||
    filePath.startsWith('data:') ||
    filePath.startsWith('http://') ||
    filePath.startsWith('https://') ||
    filePath.startsWith('internal://')
  ) {
    return filePath;
  }
  if (filePath.startsWith('media://')) return filePath;
  const normalized = filePath.replace(/\\/g, '/');
  return normalized.startsWith('/') ? `media://${normalized}` : `media:///${normalized}`;
}

// Initial clean project sequence
const initialSeq = createSequence('Sequence 1', 24, 1920, 1080);
const initialAssets: MediaAsset[] = [];

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
    selectedClipId: null,
    selectedTrackId: null,
    selectedAssetId: null,
    sourcePlayheadTime: 0,
    isSourcePlaying: false,
    sourceInPoint: null,
    sourceOutPoint: null,
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
    selectAsset: (id) =>
      set({
        selectedAssetId: id,
        sourcePlayheadTime: 0,
        isSourcePlaying: false,
        sourceInPoint: null,
        sourceOutPoint: null,
      }),
    setSourcePlayheadTime: (time) => set({ sourcePlayheadTime: time }),
    toggleSourcePlay: () => set((s) => ({ isSourcePlaying: !s.isSourcePlaying })),
    setSourceInPoint: (time) => set({ sourceInPoint: time }),
    setSourceOutPoint: (time) => set({ sourceOutPoint: time }),

    insertSourceToTimeline: async (targetTrackId?: string) => {
      const state = get();
      if (!state.selectedAssetId) return;
      const asset = state.mediaAssets.find((a) => a.id === state.selectedAssetId);
      if (!asset) return;

      const fps = state.sequence.fps;
      let track = targetTrackId ? state.sequence.tracks.find((t) => t.id === targetTrackId) : null;
      if (!track) {
        track = state.sequence.tracks.find((t) =>
          asset.mediaType === 'audio' ? t.kind === 'audio' : t.kind === 'video'
        );
      }
      if (!track) return;

      const inSec = state.sourceInPoint ?? 0;
      const outSec = state.sourceOutPoint ?? asset.duration.toSeconds();
      const durSec = Math.max(0.1, outSec - inSec);

      const clip = createClip({
        name: asset.name.replace(/\.[^/.]+$/, ''),
        assetId: asset.id,
        trackId: track.id,
        timelineStart: state.playheadTime,
        duration: RationalTime.fromSeconds(durSec, fps),
        color:
          asset.mediaType === 'audio'
            ? '#059669'
            : asset.mediaType === 'image'
            ? '#7c3aed'
            : '#2563eb',
      });

      clip.sourceRange = new TimeRange(
        RationalTime.fromSeconds(inSec, fps),
        RationalTime.fromSeconds(durSec, fps)
      );

      const cmd = new AddClipCommand(track.id, clip);
      await state.undoManager.executeCommand(cmd);
      set({ selectedClipId: clip.id, sequence: { ...state.sequence } });
    },

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

    saveProject: async (targetPath?: string) => {
      const state = get();
      const projectPayload = {
        version: '0.1.0',
        savedAt: Date.now(),
        assets: state.mediaAssets,
        sequence: state.sequence,
      };
      const jsonStr = JSON.stringify(
        projectPayload,
        (_k, v) => (typeof v === 'bigint' ? v.toString() : v),
        2
      );

      if (window.frameforge?.saveProject) {
        const res = await window.frameforge.saveProject(targetPath, jsonStr);
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

    openProject: async (targetPath?: string) => {
      if (window.frameforge?.loadProject) {
        const res = await window.frameforge.loadProject(targetPath);
        if (res.success && res.data) {
          const payload = res.data;
          if (payload.sequence) {
            const rehydratedSeq = rehydrateSequence(payload.sequence);
            get().setSequence(rehydratedSeq);
            if (payload.assets && Array.isArray(payload.assets)) {
              const rehydratedAssets = payload.assets.map((a: any) => ({
                ...a,
                duration: new RationalTime(
                  BigInt(a.duration?.value ?? 0),
                  Number(a.duration?.timescale ?? rehydratedSeq.fps)
                ),
              }));
              set({ mediaAssets: rehydratedAssets });
              for (const asset of rehydratedAssets) {
                get().importAsset(asset);
              }
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
        const streamUrl = toMediaUrl(asset.filePath);
        if (asset.mediaType === 'video') {
          const video = document.createElement('video');
          video.src = streamUrl;
          video.preload = 'auto';
          video.muted = true;
          video.playsInline = true;
          state.mediaElements.set(asset.id, video);
        } else if (asset.mediaType === 'image') {
          const img = new Image();
          img.src = streamUrl;
          state.mediaElements.set(asset.id, img);
        }
      }
      set((s) => ({
        mediaAssets: [...s.mediaAssets, asset],
        selectedAssetId: s.selectedAssetId || asset.id,
      }));
    },

    addClipToTrack: async (trackId, assetId, startFrame = 0, durationFrames?: number) => {
      const state = get();
      const asset = state.mediaAssets.find((a) => a.id === assetId);
      const name = asset ? asset.name.replace(/\.[^/.]+$/, '') : 'New Clip';
      const fps = state.sequence.fps;
      const actualDuration =
        durationFrames !== undefined
          ? durationFrames
          : asset
          ? asset.duration.toFrames(fps)
          : 120;

      const clip = createClip({
        name,
        assetId,
        trackId,
        timelineStart: RationalTime.fromFrames(startFrame, fps),
        duration: RationalTime.fromFrames(actualDuration, fps),
        color:
          asset?.mediaType === 'audio'
            ? '#059669'
            : asset?.mediaType === 'image'
            ? '#7c3aed'
            : '#2563eb',
      });

      const cmd = new AddClipCommand(trackId, clip);
      await state.undoManager.executeCommand(cmd);
      set({ selectedClipId: clip.id, sequence: { ...state.sequence } });
    },

    splitClip: async (clipId, splitPoint) => {
      const state = get();
      const cut = splitPoint || state.playheadTime;
      const cmd = new SplitClipCommand(clipId, cut);
      await state.undoManager.executeCommand(cmd);
      set({ sequence: { ...state.sequence } });
    },

    deleteClip: async (clipId) => {
      const state = get();
      const cmd = new DeleteClipCommand(clipId);
      await state.undoManager.executeCommand(cmd);
      set({
        sequence: { ...state.sequence },
        selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
      });
    },

    moveClip: async (clipId, newTrackId, newStart) => {
      const state = get();
      const cmd = new MoveClipCommand(clipId, newTrackId, newStart);
      await state.undoManager.executeCommand(cmd);
      set({ sequence: { ...state.sequence } });
    },

    trimClip: async (clipId, edge, delta) => {
      const state = get();
      const cmd = new TrimClipCommand(clipId, edge, delta);
      await state.undoManager.executeCommand(cmd);
      set({ sequence: { ...state.sequence } });
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

    addEffect: async (clipId, effectType, params) => {
      const state = get();
      const effect = {
        id: `eff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        effectType,
        name: effectType.toUpperCase(),
        enabled: true,
        parameters: params,
      };
      const cmd = new ApplyEffectCommand(clipId, effect);
      await state.undoManager.executeCommand(cmd);
      set({ sequence: { ...state.sequence } });
    },

    removeEffect: (clipId, effectId) => {
      const state = get();
      const found = findClipById(state.sequence, clipId);
      if (found) {
        found.clip.effects = found.clip.effects.filter((e) => e.id !== effectId);
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

if (typeof window !== 'undefined') {
  (window as any).__editorStore = useEditorStore;
}

