import React from 'react';
import { Layers, Plus, Sparkles, Box, Sliders } from 'lucide-react';
import { useEditorStore } from '../store/editor-store.js';

export const VFXWorkspace: React.FC = () => {
  const { sequence, selectedClipId } = useEditorStore();

  const nodes = [
    { id: 'node_1', title: 'Media In (V1)', type: 'input', x: 60, y: 120 },
    { id: 'node_2', title: 'Chroma Keyer', type: 'keyer', x: 260, y: 80 },
    { id: 'node_3', title: 'Bézier Matte Mask', type: 'mask', x: 260, y: 220 },
    { id: 'node_4', title: 'Alpha Merge & Despill', type: 'composite', x: 480, y: 140 },
    { id: 'node_5', title: 'Film Halation & Grain', type: 'shader', x: 700, y: 140 },
    { id: 'node_6', title: 'Composite Out (RGBA)', type: 'output', x: 920, y: 140 },
  ];

  return (
    <div className="flex-1 flex flex-col bg-studio-950 select-none overflow-hidden relative">
      {/* VFX Header */}
      <div className="h-9 bg-studio-900 border-b border-studio-800 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-slate-200">VFX Node Compositor</span>
          <span className="text-[10px] font-mono text-slate-500 bg-studio-850 px-2 py-0.5 rounded border border-studio-800">
            DAG Pipeline
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-2 py-1 rounded bg-studio-800 hover:bg-studio-750 text-slate-300 text-[11px] font-medium flex items-center space-x-1 border border-studio-700">
            <Plus className="w-3.5 h-3.5" />
            <span>Add VFX Node</span>
          </button>
        </div>
      </div>

      {/* Node Canvas Area */}
      <div className="flex-1 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] p-8 overflow-auto">
        {/* SVG Bezier Connectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-blue-500/60 stroke-2 fill-none">
          <path d="M 180 145 C 220 145, 220 105, 260 105" />
          <path d="M 380 105 C 430 105, 430 165, 480 165" />
          <path d="M 380 245 C 430 245, 430 165, 480 165" />
          <path d="M 600 165 C 650 165, 650 165, 700 165" />
          <path d="M 820 165 C 870 165, 870 165, 920 165" />
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute w-44 bg-studio-900 border border-studio-700 rounded-lg shadow-xl cursor-move hover:border-blue-500 transition-all text-xs"
            style={{ left: `${node.x}px`, top: `${node.y}px` }}
          >
            <div className="p-2 bg-studio-850 rounded-t-lg border-b border-studio-800 flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-[11px]">{node.title}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="p-2.5 space-y-1.5 text-[10px] text-slate-400">
              <div className="flex justify-between">
                <span>Pass:</span>
                <span className="font-mono text-slate-300 uppercase">{node.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-emerald-400 font-medium">Active (GPU)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

