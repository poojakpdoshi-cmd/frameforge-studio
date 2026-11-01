import React from 'react';
import { Volume2, VolumeX, Sliders, Music, Radio } from 'lucide-react';
import { useEditorStore } from '../store/editor-store.js';

export const AudioMixerPanel: React.FC = () => {
  const { sequence, audioMixer } = useEditorStore();

  const audioTracks = sequence.tracks.filter((t) => t.kind === 'audio');

  return (
    <div className="flex-1 flex flex-col bg-studio-950 select-none overflow-hidden text-slate-200">
      {/* Header */}
      <div className="h-9 bg-studio-900 border-b border-studio-800 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Multitrack Audio DSP Mixer</span>
          <span className="text-[10px] font-mono text-slate-500 bg-studio-850 px-2 py-0.5 rounded border border-studio-800">
            48,000 Hz | 32-bit Float
          </span>
        </div>
      </div>

      {/* Mixer Channel Strips Container */}
      <div className="flex-1 p-6 flex space-x-4 overflow-x-auto justify-center items-stretch">
        {audioTracks.map((track) => (
          <div
            key={track.id}
            className="w-40 bg-studio-900 border border-studio-800 rounded-xl p-3 flex flex-col items-center justify-between shadow-xl"
          >
            {/* Track Name */}
            <div className="w-full text-center pb-2 border-b border-studio-800">
              <span className="font-mono text-xs font-bold text-emerald-400">
                {track.name}
              </span>
              <p className="text-[10px] text-slate-500 truncate">Audio Lane</p>
            </div>

            {/* Stereo Pan Control */}
            <div className="w-full my-2 text-center">
              <span className="text-[10px] text-slate-400 block mb-1">Pan</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                defaultValue="0"
                className="w-20 h-1 bg-studio-800 rounded appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Fader & dBFS Peak Meter Layout */}
            <div className="flex-1 flex items-center space-x-3 my-2">
              {/* dB Scale */}
              <div className="flex flex-col justify-between text-[9px] font-mono text-slate-500 h-44 py-1">
                <span>+6</span>
                <span>0</span>
                <span>-6</span>
                <span>-18</span>
                <span>-36</span>
                <span>-inf</span>
              </div>

              {/* Peak Meter Bars */}
              <div className="w-3 h-44 bg-studio-950 rounded border border-studio-800 p-0.5 flex flex-col justify-end">
                <div
                  className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 rounded-sm transition-all"
                  style={{ height: '70%' }}
                />
              </div>

              {/* Fader Slider */}
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.02"
                defaultValue="1.0"
                {...({ orient: 'vertical' } as any)}
                className="h-44 w-2 bg-studio-800 rounded appearance-none cursor-pointer accent-emerald-500"
                style={{ appearance: 'slider-vertical' as any }}
              />
            </div>

            {/* Mute & Solo */}
            <div className="w-full pt-2 border-t border-studio-800 flex justify-center space-x-2">
              <button
                onClick={() => {
                  track.muted = !track.muted;
                  useEditorStore.setState({ sequence: { ...sequence } });
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold ${
                  track.muted
                    ? 'bg-red-950 text-red-400 border border-red-800/80'
                    : 'bg-studio-800 text-slate-400 hover:text-white'
                }`}
              >
                M
              </button>
              <button
                onClick={() => {
                  track.solo = !track.solo;
                  useEditorStore.setState({ sequence: { ...sequence } });
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold ${
                  track.solo
                    ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                    : 'bg-studio-800 text-slate-400 hover:text-white'
                }`}
              >
                S
              </button>
            </div>
          </div>
        ))}

        {/* Master Bus Channel Strip */}
        <div className="w-44 bg-studio-900 border-2 border-blue-900/60 rounded-xl p-3 flex flex-col items-center justify-between shadow-2xl">
          <div className="w-full text-center pb-2 border-b border-studio-800">
            <span className="font-mono text-xs font-bold text-blue-400">
              MASTER OUT
            </span>
            <p className="text-[10px] text-slate-500">Limiter Engaged</p>
          </div>

          <div className="w-full my-2 text-center">
            <span className="text-[10px] text-slate-400 block mb-1">True Peak</span>
            <span className="font-mono text-xs text-amber-400 font-bold">-0.8 dBFS</span>
          </div>

          <div className="flex-1 flex items-center space-x-3 my-2">
            <div className="flex flex-col justify-between text-[9px] font-mono text-slate-500 h-44 py-1">
              <span>+6</span>
              <span>0</span>
              <span>-6</span>
              <span>-18</span>
              <span>-36</span>
              <span>-inf</span>
            </div>

            {/* Stereo L/R Peak Meters */}
            <div className="flex space-x-1">
              <div className="w-2.5 h-44 bg-studio-950 rounded border border-studio-800 p-0.5 flex flex-col justify-end">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 via-emerald-400 to-amber-400 rounded-sm"
                  style={{ height: '82%' }}
                />
              </div>
              <div className="w-2.5 h-44 bg-studio-950 rounded border border-studio-800 p-0.5 flex flex-col justify-end">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 via-emerald-400 to-amber-400 rounded-sm"
                  style={{ height: '80%' }}
                />
              </div>
            </div>

            {/* Master Fader */}
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.02"
              defaultValue="1.0"
              {...({ orient: 'vertical' } as any)}
              className="h-44 w-2 bg-studio-800 rounded appearance-none cursor-pointer accent-blue-500"
              style={{ appearance: 'slider-vertical' as any }}
            />
          </div>

          <div className="w-full pt-2 border-t border-studio-800 text-center">
            <span className="text-[10px] font-mono text-slate-400">0.0 dB (Unity)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
