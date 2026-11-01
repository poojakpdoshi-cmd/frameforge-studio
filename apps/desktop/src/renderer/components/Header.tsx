import React, { useEffect } from 'react';
import {
  Film,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Magnet,
  Sparkles,
  Download,
  Scissors,
  Layers,
  Palette,
  Volume2,
  Video,
} from 'lucide-react';
import { useEditorStore, WorkspaceMode } from '../store/editor-store.js';

export const Header: React.FC = () => {
  const {
    sequence,
    playheadTime,
    workspaceMode,
    setWorkspaceMode,
    canUndo,
    canRedo,
    undo,
    redo,
    saveProject,
    openProject,
    setExportModalOpen,
    aiDrawerOpen,
    setAiDrawerOpen,
  } = useEditorStore();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        openProject();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveProject, openProject, undo, redo]);

  const timecode = playheadTime.toSMPTE(sequence.fps);

  const navItems: { id: WorkspaceMode; label: string; icon: React.ReactNode }[] = [
    { id: 'edit', label: 'Edit', icon: <Scissors className="w-3.5 h-3.5" /> },
    { id: 'vfx', label: 'VFX Nodes', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'color', label: 'Color Grade', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'audio', label: 'Audio Mixer', icon: <Volume2 className="w-3.5 h-3.5" /> },
    { id: 'export', label: 'Deliver', icon: <Download className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="h-12 bg-studio-900 border-b border-studio-750 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/40">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs tracking-wider text-slate-100 uppercase">
                FrameForge
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-studio-800 text-blue-400 border border-studio-700">
                PRO 0.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
              {sequence.name}
            </p>
          </div>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center space-x-1 pl-3 border-l border-studio-750">
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-studio-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 rounded hover:bg-studio-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Project Persistence: Save / Open */}
        <div className="flex items-center space-x-1 pl-3 border-l border-studio-750">
          <button
            onClick={() => saveProject()}
            title="Save Project (Ctrl+S)"
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-studio-800 text-slate-300 hover:text-white transition-colors text-xs"
          >
            <Save className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            onClick={() => openProject()}
            title="Open Project (Ctrl+O)"
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-studio-800 text-slate-300 hover:text-white transition-colors text-xs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Open</span>
          </button>
        </div>
      </div>

      {/* Central Workspace Mode Tabs */}
      <nav className="flex items-center space-x-1 bg-studio-950/70 p-1 rounded-lg border border-studio-800">
        {navItems.map((item) => {
          const isActive = workspaceMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'export') {
                  setExportModalOpen(true);
                } else {
                  setWorkspaceMode(item.id);
                }
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-studio-800/60'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right HUD: Timecode, AI Copilot, Export */}
      <div className="flex items-center space-x-3">
        {/* Timecode readout */}
        <div className="flex items-center space-x-2 bg-studio-950 px-3 py-1 rounded border border-studio-800 font-mono text-xs">
          <span className="text-slate-400 text-[10px]">TC</span>
          <span className="text-amber-400 font-semibold tracking-wider">{timecode}</span>
          <span className="text-slate-500 text-[10px]">| {sequence.fps} fps</span>
        </div>

        {/* AI Copilot Button */}
        <button
          onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
            aiDrawerOpen
              ? 'bg-purple-600/20 border-purple-500 text-purple-300'
              : 'bg-studio-800 border-studio-700 text-slate-300 hover:border-purple-500/50 hover:text-purple-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>AI Copilot</span>
        </button>

        {/* Deliver / Export Action */}
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Render Master</span>
        </button>
      </div>
    </header>
  );
};

