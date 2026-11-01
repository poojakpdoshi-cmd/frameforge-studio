import React from 'react';
import {
  Sliders,
  Move,
  Layers,
  Sparkles,
  Volume2,
  Trash2,
} from 'lucide-react';
import { useEditorStore } from '../store/editor-store.js';
import { findClipById, BlendMode } from '@frameforge/core';

export const Inspector: React.FC = () => {
  const {
    sequence,
    selectedClipId,
    updateTransform,
    updateBlendMode,
    updateAudio,
    addEffect,
    removeEffect,
  } = useEditorStore();

  const found = selectedClipId ? findClipById(sequence, selectedClipId) : null;
  const clip = found?.clip;

  if (!clip) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-studio-900 border-l border-studio-750 select-none" data-testid="inspector-empty">
        <Sliders className="w-8 h-8 text-studio-700 mb-2" />
        <p className="text-xs font-medium text-slate-400">No Clip Selected</p>
        <p className="text-[11px] text-slate-600 mt-1 max-w-[180px]">
          Click any clip in the timeline to inspect and edit its parameters.
        </p>
      </div>
    );
  }

  const blendModes: BlendMode[] = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
  ];

  return (
    <div className="h-full flex flex-col bg-studio-900 border-l border-studio-750 text-slate-200 overflow-y-auto select-none" data-testid="inspector-panel">
      {/* Inspector Header */}
      <div className="p-3 border-b border-studio-750 flex items-center justify-between">
        <div>
          <span className="font-semibold text-xs uppercase tracking-wider text-slate-300">
            Inspector
          </span>
          <p className="text-[11px] text-blue-400 font-medium truncate max-w-[200px] mt-0.5" id="inspector-clip-name">
            {clip.name}
          </p>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-studio-800 text-slate-400">
          ID: {clip.id.slice(-6)}
        </span>
      </div>

      <div className="p-3 space-y-4 text-xs divide-y divide-studio-800/80">
        {/* Transform Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-1.5 font-medium text-slate-300">
            <Move className="w-3.5 h-3.5 text-blue-400" />
            <span>Transform</span>
          </div>

          {/* Position X / Y */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 mb-1 block">Position X (px)</label>
              <input
                id="input-pos-x"
                type="number"
                value={clip.transform.position.x}
                onChange={(e) =>
                  updateTransform(clip.id, {
                    position: { ...clip.transform.position, x: Number(e.target.value) },
                  })
                }
                className="w-full bg-studio-950 border border-studio-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 mb-1 block">Position Y (px)</label>
              <input
                id="input-pos-y"
                type="number"
                value={clip.transform.position.y}
                onChange={(e) =>
                  updateTransform(clip.id, {
                    position: { ...clip.transform.position, y: Number(e.target.value) },
                  })
                }
                className="w-full bg-studio-950 border border-studio-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Scale */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Scale ({Math.round(clip.transform.scale.x * 100)}%)</span>
            </div>
            <input
              id="slider-scale"
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              value={clip.transform.scale.x}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateTransform(clip.id, { scale: { x: val, y: val } });
              }}
              className="w-full h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Rotation */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Rotation ({clip.transform.rotation}°)</span>
            </div>
            <input
              id="slider-rotation"
              type="range"
              min="-180"
              max="180"
              value={clip.transform.rotation}
              onChange={(e) =>
                updateTransform(clip.id, { rotation: Number(e.target.value) })
              }
              className="w-full h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Opacity */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Opacity ({Math.round(clip.transform.opacity * 100)}%)</span>
            </div>
            <input
              id="slider-opacity"
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={clip.transform.opacity}
              onChange={(e) =>
                updateTransform(clip.id, { opacity: Number(e.target.value) })
              }
              className="w-full h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* Compositing / Blend Mode */}
        <div className="space-y-2 pt-3">
          <div className="flex items-center space-x-1.5 font-medium text-slate-300">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Compositing</span>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 mb-1 block">Blend Mode</label>
            <select
              id="select-blend-mode"
              value={clip.blendMode}
              onChange={(e) => updateBlendMode(clip.id, e.target.value as BlendMode)}
              className="w-full bg-studio-950 border border-studio-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 capitalize"
            >
              {blendModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode.replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Video Effects Stack */}
        <div className="space-y-2 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-medium text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Video Effects</span>
            </div>
          </div>

          {/* Effect Action Buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              id="btn-add-vignette"
              onClick={() => addEffect(clip.id, 'vignette', { amount: 0.6 })}
              title="Add Vignette Shader"
              className="px-2 py-1 rounded bg-studio-800 hover:bg-studio-750 text-[10px] font-mono text-blue-400 hover:text-blue-300 transition-colors text-left"
            >
              + Vignette
            </button>
            <button
              id="btn-add-grain"
              onClick={() => addEffect(clip.id, 'film_grain', { intensity: 0.25 })}
              title="Add 35mm Film Grain Shader"
              className="px-2 py-1 rounded bg-studio-800 hover:bg-studio-750 text-[10px] font-mono text-amber-400 hover:text-amber-300 transition-colors text-left"
            >
              + Film Grain
            </button>
            <button
              id="btn-add-color-grade"
              onClick={() =>
                addEffect(clip.id, 'color_grade', {
                  contrast: 1.25,
                  brightness: 0.05,
                  saturation: 1.3,
                })
              }
              title="Add Color Grade"
              className="px-2 py-1 rounded bg-studio-800 hover:bg-studio-750 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors text-left"
            >
              + Color Grade
            </button>
            <button
              id="btn-add-blur"
              onClick={() => addEffect(clip.id, 'blur', { radius: 10 })}
              title="Add Gaussian Blur"
              className="px-2 py-1 rounded bg-studio-800 hover:bg-studio-750 text-[10px] font-mono text-purple-400 hover:text-purple-300 transition-colors text-left"
            >
              + Blur
            </button>
          </div>

          {/* Active Effects */}
          <div className="space-y-1.5 mt-2" data-testid="effects-stack">
            {clip.effects.map((effect) => (
              <div
                key={effect.id}
                data-testid={`effect-item-${effect.effectType || effect.id}`}
                className="p-2 rounded bg-studio-950 border border-studio-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium text-slate-300">{effect.name}</span>
                  <p className="text-[10px] text-slate-500 font-mono">GPU Shader Pass</p>
                </div>
                <button
                  data-testid={`btn-remove-effect-${effect.id}`}
                  onClick={() => removeEffect(clip.id, effect.id)}
                  title="Remove effect"
                  className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {clip.effects.length === 0 && (
              <p className="text-[11px] text-slate-500 italic py-1">
                No effects applied. Click buttons above to add shaders.
              </p>
            )}
          </div>
        </div>

        {/* Audio Controls */}
        <div className="space-y-2 pt-3">
          <div className="flex items-center space-x-1.5 font-medium text-slate-300">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audio Parameters</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Volume</span>
              <span className="font-mono text-emerald-400">
                {Math.round(clip.volume * 100)}%
              </span>
            </div>
            <input
              id="slider-volume"
              type="range"
              min="0"
              max="2.0"
              step="0.05"
              value={clip.volume}
              onChange={(e) => updateAudio(clip.id, Number(e.target.value), clip.pan)}
              className="w-full h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Stereo Pan</span>
              <span className="font-mono text-slate-400">
                {clip.pan === 0
                  ? 'Center'
                  : clip.pan < 0
                  ? `L ${Math.abs(Math.round(clip.pan * 100))}`
                  : `R ${Math.round(clip.pan * 100)}`}
              </span>
            </div>
            <input
              id="slider-pan"
              type="range"
              min="-1.0"
              max="1.0"
              step="0.05"
              value={clip.pan}
              onChange={(e) => updateAudio(clip.id, clip.volume, Number(e.target.value))}
              className="w-full h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
