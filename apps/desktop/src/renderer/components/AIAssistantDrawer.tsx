import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Split,
  Film,
  Plus,
  Undo2,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { useEditorStore } from '../store/editor-store.js';

interface Message {
  role: 'agent' | 'user';
  text: string;
  data?: any;
}

export const AIAssistantDrawer: React.FC = () => {
  const {
    aiDrawerOpen,
    setAiDrawerOpen,
    runMCPTool,
    selectedClipId,
    sequence,
    playheadTime,
  } = useEditorStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      text: 'FrameForge AI Copilot ready. I have direct programmatic control over the non-linear editing engine via Model Context Protocol (MCP). How can I assist with your sequence?',
    },
  ]);

  if (!aiDrawerOpen) return null;

  const handleExecuteTool = async (toolName: string, args: Record<string, any>, userPrompt: string) => {
    setMessages((prev) => [...prev, { role: 'user', text: userPrompt }]);
    const res = await runMCPTool(toolName, args);

    setMessages((prev) => [
      ...prev,
      {
        role: 'agent',
        text: res.message,
        data: res.data,
      },
    ]);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const prompt = input.trim();
    setInput('');

    // Simple NLP heuristic to tool call mapping
    if (prompt.toLowerCase().includes('split') && selectedClipId) {
      handleExecuteTool(
        'split_clip',
        { clipId: selectedClipId, splitFrame: playheadTime.toFrames(sequence.fps) },
        prompt
      );
    } else if (prompt.toLowerCase().includes('undo')) {
      handleExecuteTool('undo', {}, prompt);
    } else if (prompt.toLowerCase().includes('grain') && selectedClipId) {
      handleExecuteTool(
        'apply_effect',
        { clipId: selectedClipId, effectType: 'film_grain', parameters: { intensity: 0.3 } },
        prompt
      );
    } else {
      // Default: inspect timeline
      handleExecuteTool('get_timeline', {}, prompt);
    }
  };

  return (
    <div className="w-80 bg-studio-900 border-l border-studio-750 flex flex-col z-40 select-none shadow-2xl">
      {/* Header */}
      <div className="p-3 bg-studio-850 border-b border-studio-750 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-purple-300 font-semibold">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI Editing Copilot (MCP)</span>
        </div>
        <button
          onClick={() => setAiDrawerOpen(false)}
          className="p-1 rounded hover:bg-studio-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Actions */}
      <div className="p-2 border-b border-studio-800 bg-studio-950/60 space-y-1">
        <p className="text-[10px] font-mono uppercase text-slate-500 px-1">
          Quick AI Directives
        </p>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => {
              if (selectedClipId) {
                handleExecuteTool(
                  'split_clip',
                  { clipId: selectedClipId, splitFrame: playheadTime.toFrames(sequence.fps) },
                  'Split selected clip at current playhead position'
                );
              }
            }}
            disabled={!selectedClipId}
            className="p-1.5 rounded bg-studio-850 hover:bg-studio-800 disabled:opacity-30 border border-studio-750 text-[10px] text-left flex items-center space-x-1.5 text-slate-300"
          >
            <Split className="w-3 h-3 text-red-400 shrink-0" />
            <span className="truncate">Split at Playhead</span>
          </button>

          <button
            onClick={() => {
              if (selectedClipId) {
                handleExecuteTool(
                  'apply_effect',
                  { clipId: selectedClipId, effectType: 'film_grain', parameters: { intensity: 0.25 } },
                  'Apply 35mm film grain shader to selected clip'
                );
              }
            }}
            disabled={!selectedClipId}
            className="p-1.5 rounded bg-studio-850 hover:bg-studio-800 disabled:opacity-30 border border-studio-750 text-[10px] text-left flex items-center space-x-1.5 text-slate-300"
          >
            <Film className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Add Film Grain</span>
          </button>

          <button
            onClick={() => {
              const v2 = sequence.tracks.find((t) => t.name === 'V2');
              if (v2) {
                handleExecuteTool(
                  'add_clip',
                  {
                    trackId: v2.id,
                    name: 'AI Auto B-Roll',
                    startFrame: playheadTime.toFrames(sequence.fps),
                    durationFrames: 96,
                  },
                  'Insert 4-second overlay B-Roll on V2'
                );
              }
            }}
            className="p-1.5 rounded bg-studio-850 hover:bg-studio-800 border border-studio-750 text-[10px] text-left flex items-center space-x-1.5 text-slate-300"
          >
            <Plus className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="truncate">Insert B-Roll</span>
          </button>

          <button
            onClick={() => handleExecuteTool('undo', {}, 'Undo last edit')}
            className="p-1.5 rounded bg-studio-850 hover:bg-studio-800 border border-studio-750 text-[10px] text-left flex items-center space-x-1.5 text-slate-300"
          >
            <Undo2 className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="truncate">Undo Action</span>
          </button>
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-lg border ${
              m.role === 'user'
                ? 'bg-blue-950/40 border-blue-800/60 text-blue-200 ml-4'
                : 'bg-studio-950 border-studio-800 text-slate-300 mr-4'
            }`}
          >
            <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-slate-500 font-mono">
              {m.role === 'agent' ? (
                <>
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>FrameForge Agent</span>
                </>
              ) : (
                <span>Editor Operator</span>
              )}
            </div>
            <p className="leading-relaxed">{m.text}</p>
            {m.data && (
              <pre className="mt-1.5 p-1.5 rounded bg-black/60 border border-white/5 font-mono text-[9px] text-emerald-400 overflow-x-auto">
                {JSON.stringify(m.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleCustomSubmit} className="p-2 border-t border-studio-800 bg-studio-950">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command AI editor..."
            className="w-full bg-studio-900 border border-studio-800 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 p-1.5 text-slate-400 hover:text-purple-400 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
