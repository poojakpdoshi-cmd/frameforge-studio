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
  CornerDownRight,
  Volume2,
  FileVideo,
  FileImage,
  FileAudio,
} from 'lucide-react';
import { useEditorStore, toMediaUrl } from '../store/editor-store.js';
import { RationalTime } from '@frameforge/core';

export const Monitors: React.FC = () => {
  const {
    sequence,
    playheadTime,
    setPlayheadTime,
    isPlaying,
    togglePlay,
    compositor,
    mediaElements,
    mediaAssets,
    selectedAssetId,
    sourcePlayheadTime,
    isSourcePlaying,
    sourceInPoint,
    sourceOutPoint,
    setSourcePlayheadTime,
    toggleSourcePlay,
    setSourceInPoint,
    setSourceOutPoint,
    insertSourceToTimeline,
  } = useEditorStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceVideoRef = useRef<HTMLVideoElement | null>(null);
  const sourceAudioRef = useRef<HTMLAudioElement | null>(null);
  const playheadRef = useRef(playheadTime);
  playheadRef.current = playheadTime;

  const selectedAsset = mediaAssets.find((a) => a.id === selectedAssetId) || mediaAssets[0] || null;

  // Real-time Viewport Render Pass for Program Monitor
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

  // Real-time Playback Loop (60 FPS) for Program Monitor
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const deltaSec = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const currentSec = playheadRef.current.toSeconds();
      const newSec = currentSec + deltaSec;

      setPlayheadTime(RationalTime.fromSeconds(newSec, sequence.fps));
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, sequence.fps, setPlayheadTime]);

  // Real-time Playback Loop for Source Monitor
  useEffect(() => {
    if (!isSourcePlaying || !selectedAsset) return;

    let animId: number;
    let lastTime = performance.now();
    const maxDur = selectedAsset.duration.toSeconds();

    const loop = (currentTime: number) => {
      const deltaSec = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const nextSec = (sourcePlayheadTime + deltaSec);
      if (nextSec >= maxDur) {
        setSourcePlayheadTime(0);
        toggleSourcePlay();
      } else {
        setSourcePlayheadTime(nextSec);
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isSourcePlaying, selectedAsset, sourcePlayheadTime, setSourcePlayheadTime, toggleSourcePlay]);

  // Synchronize Source HTML Video/Audio tag time
  useEffect(() => {
    if (sourceVideoRef.current && Math.abs(sourceVideoRef.current.currentTime - sourcePlayheadTime) > 0.15) {
      sourceVideoRef.current.currentTime = sourcePlayheadTime;
    }
    if (sourceAudioRef.current && Math.abs(sourceAudioRef.current.currentTime - sourcePlayheadTime) > 0.15) {
      sourceAudioRef.current.currentTime = sourcePlayheadTime;
    }
  }, [sourcePlayheadTime]);

  const stepProgramFrame = (frames: number) => {
    const currentFrame = playheadTime.toFrames(sequence.fps);
    const newFrame = Math.max(0, currentFrame + frames);
    setPlayheadTime(RationalTime.fromFrames(newFrame, sequence.fps));
  };

  const stepSourceFrame = (frames: number) => {
    if (!selectedAsset) return;
    const fps = selectedAsset.fps || 24;
    const newSec = Math.max(0, sourcePlayheadTime + frames / fps);
    setSourcePlayheadTime(newSec);
  };

  const sourceMaxDuration = selectedAsset ? selectedAsset.duration.toSeconds() : 10;
  const sourceFps = selectedAsset?.fps || 24;

  return (
    <div className="h-full grid grid-cols-2 gap-2 p-2 bg-studio-950">
      {/* Source Monitor (Left) */}
      <div className="flex flex-col bg-studio-900 rounded-lg border border-studio-800 overflow-hidden shadow-lg" data-testid="source-monitor">
        <div className="h-7 bg-studio-850 px-3 flex items-center justify-between border-b border-studio-800 text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5 font-medium text-slate-300">
            <Tv className="w-3.5 h-3.5 text-blue-400" />
            <span>Source Monitor</span>
            {selectedAsset && (
              <span className="text-[10px] text-blue-300 font-mono bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40 truncate max-w-[180px]">
                {selectedAsset.name}
              </span>
            )}
          </div>
          <span className="font-mono text-slate-500">
            {selectedAsset ? `${selectedAsset.width || 1920}x${selectedAsset.height || 1080} @ ${sourceFps}fps` : 'Raw Ingest'}
          </span>
        </div>

        <div className="flex-1 bg-black flex items-center justify-center relative group p-1 overflow-hidden" data-testid="source-viewport">
          {selectedAsset ? (
            selectedAsset.mediaType === 'video' ? (
              <video
                ref={sourceVideoRef}
                src={toMediaUrl(selectedAsset.filePath)}
                className="max-w-full max-h-full object-contain"
                playsInline
                muted
                data-testid="source-video-element"
              />
            ) : selectedAsset.mediaType === 'image' ? (
              <img
                src={toMediaUrl(selectedAsset.filePath)}
                alt={selectedAsset.name}
                className="max-w-full max-h-full object-contain"
                data-testid="source-image-element"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-studio-950 to-studio-900 text-emerald-400">
                <FileAudio className="w-12 h-12 mb-3 text-emerald-500 animate-pulse" />
                <p className="font-mono text-xs">{selectedAsset.name}</p>
                <p className="text-[10px] text-slate-500 mt-1">48kHz Audio Master Track</p>
                <audio ref={sourceAudioRef} src={toMediaUrl(selectedAsset.filePath)} />
              </div>
            )
          ) : (
            <div className="w-full h-full rounded border border-studio-800 flex flex-col items-center justify-center bg-gradient-to-br from-studio-900 to-studio-950 text-slate-500 text-xs">
              <Eye className="w-8 h-8 text-studio-700 mb-2" />
              <p className="font-medium text-slate-400">Media Preview</p>
              <p className="text-[10px] text-slate-600 mt-1">
                Select a media clip from project bin to preview & mark In/Out
              </p>
            </div>
          )}

          {/* Source Timecode Badge */}
          {selectedAsset && (
            <div className="absolute top-2 right-2 bg-black/75 backdrop-blur px-2 py-0.5 rounded border border-white/10 font-mono text-[11px] text-blue-400" id="source-timecode">
              {RationalTime.fromSeconds(sourcePlayheadTime, sourceFps).toSMPTE(sourceFps)}
            </div>
          )}
        </div>

        {/* Source Scrubber Bar */}
        <div className="h-5 bg-studio-950 px-3 flex items-center border-t border-studio-800">
          <input
            id="source-scrubber"
            type="range"
            min="0"
            max={sourceMaxDuration}
            step="0.04"
            value={sourcePlayheadTime}
            onChange={(e) => setSourcePlayheadTime(Number(e.target.value))}
            className="w-full h-1 bg-studio-800 rounded appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Source Controls */}
        <div className="h-9 bg-studio-850 px-3 flex items-center justify-between border-t border-studio-800 text-xs">
          <div className="flex items-center space-x-1.5 font-mono text-[10px] text-slate-400">
            <span>IN: {sourceInPoint !== null ? RationalTime.fromSeconds(sourceInPoint, sourceFps).toSMPTE(sourceFps) : '--:--:--:--'}</span>
            <span className="text-slate-600">|</span>
            <span>OUT: {sourceOutPoint !== null ? RationalTime.fromSeconds(sourceOutPoint, sourceFps).toSMPTE(sourceFps) : RationalTime.fromSeconds(sourceMaxDuration, sourceFps).toSMPTE(sourceFps)}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              id="btn-source-mark-in"
              onClick={() => setSourceInPoint(sourcePlayheadTime)}
              title="Mark In Point [I]"
              className="px-2 py-1 rounded bg-studio-800 hover:bg-studio-750 text-[10px] font-mono font-bold text-slate-300 hover:text-white"
            >
              [ I ]
            </button>
            <button
              id="btn-source-step-back"
              onClick={() => stepSourceFrame(-1)}
              title="Step 1 Frame Back"
              className="p-1 rounded hover:bg-studio-800 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-source-play-pause"
              onClick={() => toggleSourcePlay()}
              title="Play/Pause Source"
              className="w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow"
            >
              {isSourcePlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
            </button>
            <button
              id="btn-source-step-forward"
              onClick={() => stepSourceFrame(1)}
              title="Step 1 Frame Forward"
              className="p-1 rounded hover:bg-studio-800 text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-source-mark-out"
              onClick={() => setSourceOutPoint(sourcePlayheadTime)}
              title="Mark Out Point [O]"
              className="px-2 py-1 rounded bg-studio-800 hover:bg-studio-750 text-[10px] font-mono font-bold text-slate-300 hover:text-white"
            >
              [ O ]
            </button>
          </div>

          <button
            id="btn-source-insert"
            onClick={() => insertSourceToTimeline()}
            disabled={!selectedAsset}
            title="Insert In/Out Range to Active Track"
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold shadow disabled:opacity-40"
          >
            <CornerDownRight className="w-3 h-3" />
            <span>+ Insert</span>
          </button>
        </div>
      </div>

      {/* Program Monitor (Right) */}
      <div className="flex flex-col bg-studio-900 rounded-lg border border-studio-800 overflow-hidden shadow-lg" data-testid="program-monitor">
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

        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden" data-testid="program-viewport">
          {/* Hardware Compositor Canvas */}
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="max-w-full max-h-full object-contain shadow-2xl"
            data-testid="program-canvas"
          />

          {/* Timecode Overlay */}
          <div className="absolute top-2 right-2 bg-black/75 backdrop-blur px-2.5 py-1 rounded border border-white/10 font-mono text-xs text-amber-400" id="program-timecode">
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
              id="btn-program-start"
              onClick={() => setPlayheadTime(RationalTime.fromFrames(0, sequence.fps))}
              title="Jump to Start (Home)"
              className="p-1.5 rounded hover:bg-studio-800 text-slate-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              id="btn-program-step-back"
              onClick={() => stepProgramFrame(-1)}
              title="Step 1 Frame Back (Left Arrow)"
              className="p-1.5 rounded hover:bg-studio-800 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="btn-program-play-pause"
              onClick={() => togglePlay()}
              title="Play/Pause (Space)"
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-900/40 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              id="btn-program-step-forward"
              onClick={() => stepProgramFrame(1)}
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
