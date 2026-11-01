import React, { useState } from 'react';
import { Palette, Sun, Contrast, Sliders, RotateCcw } from 'lucide-react';
import { useEditorStore } from '../store/editor-store.js';

export const ColorWorkspace: React.FC = () => {
  const { sequence, selectedClipId } = useEditorStore();
  const [exposure, setExposure] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(5600); // 5600K daylight default
  const [tint, setTint] = useState<number>(0);

  const wheels = [
    { name: 'LIFT (Shadows)', color: '#3b82f6', defaultAngle: 210 },
    { name: 'GAMMA (Midtones)', color: '#10b981', defaultAngle: 120 },
    { name: 'GAIN (Highlights)', color: '#f59e0b', defaultAngle: 45 },
  ];

  return (
    <div className="flex-1 flex flex-col bg-studio-950 select-none overflow-hidden text-slate-200">
      {/* Header */}
      <div className="h-9 bg-studio-900 border-b border-studio-800 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <Palette className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Cinematic Color Wheels & Primary Grading</span>
        </div>
        <button
          onClick={() => {
            setExposure(0);
            setContrast(0);
            setSaturation(0);
            setTemperature(5600);
            setTint(0);
          }}
          className="px-2 py-1 rounded bg-studio-800 hover:bg-studio-750 text-slate-300 text-[11px] flex items-center space-x-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Grade</span>
        </button>
      </div>

      <div className="flex-1 p-6 grid grid-cols-3 gap-6 overflow-y-auto">
        {/* 3-Way Color Wheels */}
        {wheels.map((wheel) => (
          <div
            key={wheel.name}
            className="bg-studio-900 border border-studio-800 rounded-xl p-4 flex flex-col items-center justify-between shadow-lg"
          >
            <span className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-2">
              {wheel.name}
            </span>

            {/* Radial Color Wheel */}
            <div className="relative w-40 h-40 rounded-full border-2 border-studio-700 bg-[conic-gradient(from_0deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] p-1 flex items-center justify-center shadow-inner my-2">
              <div className="w-full h-full rounded-full bg-studio-950/80 backdrop-blur-sm flex items-center justify-center relative">
                {/* Crosshairs */}
                <div className="w-full h-[1px] bg-studio-700/60 absolute" />
                <div className="h-full w-[1px] bg-studio-700/60 absolute" />
                {/* Center Puck */}
                <div className="w-4 h-4 rounded-full bg-white shadow-md border-2 border-slate-900 cursor-grab" />
              </div>
            </div>

            {/* Master Luminance Slider */}
            <div className="w-full mt-3">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Master Luma</span>
                <span className="font-mono text-slate-200">0.00</span>
              </div>
              <input
                type="range"
                min="-1.0"
                max="1.0"
                step="0.02"
                defaultValue="0"
                className="w-full h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        ))}

        {/* Primary Sliders Panel spanning 3 columns */}
        <div className="col-span-3 bg-studio-900 border border-studio-800 rounded-xl p-4 grid grid-cols-4 gap-4 text-xs">
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Exposure (EV)</span>
              <span className="font-mono text-blue-400">{exposure > 0 ? `+${exposure}` : exposure}</span>
            </div>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.1"
              value={exposure}
              onChange={(e) => setExposure(Number(e.target.value))}
              className="w-full h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Contrast</span>
              <span className="font-mono text-blue-400">{contrast}</span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Saturation</span>
              <span className="font-mono text-blue-400">{saturation}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Temperature</span>
              <span className="font-mono text-amber-400">{temperature} K</span>
            </div>
            <input
              type="range"
              min="2500"
              max="10000"
              step="50"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
