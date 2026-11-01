import React, { useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Tv,
  Eye,
} from 'lucide-react';
import { useEditorStore } from '../store/editor-store.js';
import { RationalTime } from '@frameforge/core';

export const Monitors: React.FC = () => {
  const {
    sequence,
    playheadTime,
    setPlayheadTime,
    isPlaying,
    togglePlay,
    compositor,
    selectedClipId,
    mediaElements,
  } = useEditorStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time Viewport Render Pass
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    compositor.renderFrame(sequence, playheadTime, {
      canvas,
      ctx,
      width: canvas.width,
      height: canvas.height,
      sourceElements: mediaElements,
    });
  }, [sequence, playheadTime, compositor, mediaElements]);

  // Real-time Playback Loop (60 FPS)
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const deltaSec = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const currentSec = playheadTime.toSeconds();
      const newSec = currentSec + deltaSec;

      setPlayheadTime(RationalTime.fromSeconds(newSec, sequence.fps));
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playheadTime, sequence.fps, setPlayheadTime]);

  const stepFrame = (frames: number) => {
    const currentFrame = playheadTime.toFrames(sequence.fps);
    const newFrame = Math.max(0, currentFrame + frames);
    setPlayheadTime(RationalTime.fromFrames(newFrame, sequence.fps));
  };

  return (
    <div className="h-full grid grid-cols-2 gap-2 p-2 bg-studio-950">
      {/* Source Monitor (Left) */}
      <div className="flex flex-col bg-studio-900 rounded-lg border border-studio-800 overflow-hidden shadow-lg">
        <div className="h-7 bg-studio-850 px-3 flex items-center justify-between border-b border-studio-800 text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5 font-medium text-slate-300">
            <Tv className="w-3.5 h-3.5 text-blue-400" />
            <span>Source Monitor</span>
          </div>
          <span className="font-mono text-slate-500">Raw Media Ingest</span>
        </div>

        <div className="flex-1 bg-black flex items-center justify-center relative group p-2">
          {/* Procedural source pattern */}
          <div className="w-full h-full rounded border border-studio-800 flex flex-col items-center justify-center bg-gradient-to-br from-studio-900 to-studio-950 text-slate-500 text-xs">
            <Eye className="w-8 h-8 text-studio-700 mb-2" />
            <p className="font-medium text-slate-400">Media Preview</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Select clip in browser or press [I] / [O] for In/Out
            </p>
          </div>
        </div>

        {/* Source Controls */}
        <div className="h-8 bg-studio-850 px-3 flex items-center justify-between border-t border-studio-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-slate-400">IN: 00:00:00:00</span>
            <span className="text-[10px] font-mono text-slate-400">OUT: 00:00:10:00</span>
          </div>
          <button
            title="Mark In Point"
            className="px-2 py-0.5 rounded bg-studio-800 text-[10px] font-mono text-slate-300 hover:text-white"
          >
            [ I ]
          </button>
        </div>
      </div>

      {/* Program Monitor (Right) */}
      <div className="flex flex-col bg-studio-900 rounded-lg border border-studio-800 overflow-hidden shadow-lg">
        <div className="h-7 bg-studio-850 px-3 flex items-center justify-between border-b border-studio-800 text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5 font-medium text-slate-300">
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span>Program Monitor</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
              Live Master
            </span>
          </div>
          <span className="font-mono text-slate-500">
            {sequence.width}x{sequence.height} @ {sequence.fps}fps
          </span>
        </div>

        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
          {/* Hardware Compositor Canvas */}
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="max-w-full max-h-full object-contain shadow-2xl"
          />

          {/* Timecode Overlay */}
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2.5 py-1 rounded border border-white/10 font-mono text-xs text-amber-400">
            {playheadTime.toSMPTE(sequence.fps)}
          </div>
        </div>

        {/* Program Transport Controls */}
        <div className="h-10 bg-studio-850 px-4 flex items-center justify-between border-t border-studio-800">
          {/* Timecode */}
          <div className="font-mono text-xs font-semibold text-amber-400">
            {playheadTime.toSMPTE(sequence.fps)}
          </div>

          {/* Center Playback Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPlayheadTime(RationalTime.fromFrames(0, sequence.fps))}
              title="Jump to Start (Home)"
              className="p-1.5 rounded hover:bg-studio-800 text-slate-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => stepFrame(-1)}
              title="Step 1 Frame Back (Left Arrow)"
              className="p-1.5 rounded hover:bg-studio-800 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => togglePlay()}
              title="Play/Pause (Space)"
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-900/40 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={() => stepFrame(1)}
              title="Step 1 Frame Forward (Right Arrow)"
              className="p-1.5 rounded hover:bg-studio-800 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Extras */}
          <button
            title="Toggle Fullscreen"
            className="p-1.5 rounded hover:bg-studio-800 text-slate-400 hover:text-white transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

