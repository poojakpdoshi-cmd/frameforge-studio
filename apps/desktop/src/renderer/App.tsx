import React from 'react';
import { Header } from './components/Header.js';
import { MediaBrowser } from './components/MediaBrowser.js';
import { Monitors } from './components/Monitors.js';
import { Timeline } from './components/Timeline.js';
import { Inspector } from './components/Inspector.js';
import { ExportModal } from './components/ExportModal.js';
import { AIAssistantDrawer } from './components/AIAssistantDrawer.js';
import { VFXWorkspace } from './components/VFXWorkspace.js';
import { ColorWorkspace } from './components/ColorWorkspace.js';
import { AudioMixerPanel } from './components/AudioMixerPanel.js';
import { useEditorStore } from './store/editor-store.js';

export const App: React.FC = () => {
  const { workspaceMode } = useEditorStore();

  return (
    <div className="w-screen h-screen flex flex-col bg-studio-950 font-sans text-slate-100 overflow-hidden">
      {/* Top Application Header */}
      <Header />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Workspace Central Views */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {workspaceMode === 'edit' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Media Ingestion Browser (Left 260px) */}
              <div className="w-64 shrink-0">
                <MediaBrowser />
              </div>

              {/* Dual Viewports: Source & Program Monitors (Center) */}
              <div className="flex-1 overflow-hidden">
                <Monitors />
              </div>

              {/* Inspector Panel (Right 280px) */}
              <div className="w-72 shrink-0">
                <Inspector />
              </div>
            </div>
          )}

          {workspaceMode === 'vfx' && <VFXWorkspace />}
          {workspaceMode === 'color' && <ColorWorkspace />}
          {workspaceMode === 'audio' && <AudioMixerPanel />}

          {/* Multitrack NLE Timeline (Always anchored at bottom 45% of height) */}
          <div className="h-[42%] shrink-0">
            <Timeline />
          </div>
        </div>

        {/* AI Agent Drawer (Sliding MCP Copilot Pane) */}
        <AIAssistantDrawer />
      </div>

      {/* Production Delivery & Export Modal */}
      <ExportModal />
    </div>
  );
};
