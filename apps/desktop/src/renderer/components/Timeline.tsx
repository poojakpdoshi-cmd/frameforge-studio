import React, { useRef, useState } from 'react';
import {
  MousePointer,
  Scissors,
  Split,
  Trash2,
  Magnet,
  ZoomIn,
  ZoomOut,
  Lock,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useEditorStore, EditingTool } from '../store/editor-store.js';
import { RationalTime, TimelineClip, TimelineTrack } from '@frameforge/core';

export const Timeline: React.FC = () => {
  const {
    sequence,
    playheadTime,
    setPlayheadTime,
    selectedClipId,
    selectClip,
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    splitClip,
    deleteClip,
    moveClip,
    trimClip,
  } = useEditorStore();

  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [snapping, setSnapping] = useState(true);

  const totalDurationSeconds = Math.max(
    30,
    sequence.tracks.reduce((max, t) => {
      const trackMax = t.clips.reduce(
        (m, c) => Math.max(m, c.timelineRange.end.toSeconds()),
        0
      );
      return Math.max(max, trackMax);
    }, 0) + 10
  );

  const timelineWidth = totalDurationSeconds * zoom;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineContainerRef.current) return;
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const scrollLeft = timelineContainerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft - 180; // 180px for track headers
    if (clickX < 0) return;

    let seconds = clickX / zoom;
    if (snapping) {
      // Snap to nearest frame
      const frame = Math.round(seconds * sequence.fps);
      seconds = frame / sequence.fps;
    }

    setPlayheadTime(RationalTime.fromSeconds(Math.max(0, seconds), sequence.fps));
  };

  const handleClipClick = (e: React.MouseEvent, clip: TimelineClip) => {
    e.stopPropagation();

    if (activeTool === 'blade') {
      // Razor Tool: Split clip at exact click position
      if (!timelineContainerRef.current) return;
      const rect = timelineContainerRef.current.getBoundingClientRect();
      const scrollLeft = timelineContainerRef.current.scrollLeft;
      const clickX = e.clientX - rect.left + scrollLeft - 180;
      const cutSeconds = clickX / zoom;
      const cutTime = RationalTime.fromSeconds(cutSeconds, sequence.fps);
      splitClip(clip.id, cutTime);
    } else {
      selectClip(clip.id);
    }
  };

  const handleSplitSelected = () => {
    if (selectedClipId) {
      splitClip(selectedClipId, playheadTime);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedClipId) {
      deleteClip(selectedClipId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-studio-950 border-t border-studio-800 select-none">
      {/* Timeline Toolbar */}
      <div className="h-9 bg-studio-900 border-b border-studio-800 px-3 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1">
          {/* Tool Palette */}
          <button
            onClick={() => setActiveTool('select')}
            title="Selection Tool (V)"
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-studio-800'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTool('blade')}
            title="Razor / Blade Tool (C)"
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'blade'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-studio-800'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-studio-800 mx-1" />

          {/* Quick Actions */}
          <button
            onClick={handleSplitSelected}
            disabled={!selectedClipId}
            title="Split Clip at Playhead (Ctrl+K)"
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-studio-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Split className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={!selectedClipId}
            title="Delete Selected Clip (Del)"
            className="p-1.5 rounded text-slate-300 hover:text-red-400 hover:bg-studio-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-studio-800 mx-1" />

          {/* Snapping Toggle */}
          <button
            onClick={() => setSnapping(!snapping)}
            title="Magnetic Snapping (S)"
            className={`p-1.5 rounded flex items-center space-x-1 ${
              snapping ? 'text-blue-400 bg-blue-950/40' : 'text-slate-500'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <ZoomOut
            className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-slate-300"
            onClick={() => setZoom(zoom - 15)}
          />
          <input
            type="range"
            min="20"
            max="200"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24 h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <ZoomIn
            className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-slate-300"
            onClick={() => setZoom(zoom + 15)}
          />
          <span className="font-mono text-[10px] text-slate-400 w-10 text-right">
            {zoom}px/s
          </span>
        </div>
      </div>

      {/* Main Multitrack Canvas Area */}
      <div
        ref={timelineContainerRef}
        onClick={handleTimelineClick}
        className="flex-1 overflow-x-auto overflow-y-auto relative bg-studio-950 flex"
      >
        {/* Left Track Headers Column (Fixed 180px width) */}
        <div className="w-[180px] shrink-0 bg-studio-900 border-r border-studio-800 z-20 flex flex-col sticky left-0">
          {/* Header spacer aligned with ruler */}
          <div className="h-6 bg-studio-850 border-b border-studio-800 px-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>TRACKS</span>
            <span>M / S / L</span>
          </div>

          {/* Individual Track Controls */}
          <div className="flex-1 divide-y divide-studio-800/60">
            {sequence.tracks.map((track) => {
              const isAudio = track.kind === 'audio';
              return (
                <div
                  key={track.id}
                  className="h-12 px-3 flex items-center justify-between bg-studio-900 hover:bg-studio-850/60 text-xs text-slate-300 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                        isAudio
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                      }`}
                    >
                      {track.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        track.muted = !track.muted;
                        useEditorStore.setState({ sequence: { ...sequence } });
                      }}
                      title="Mute Track"
                      className={`p-1 rounded text-[10px] font-mono font-bold ${
                        track.muted
                          ? 'bg-red-950 text-red-400'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      M
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        track.solo = !track.solo;
                        useEditorStore.setState({ sequence: { ...sequence } });
                      }}
                      title="Solo Track"
                      className={`p-1 rounded text-[10px] font-mono font-bold ${
                        track.solo
                          ? 'bg-amber-950 text-amber-400'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      S
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        track.locked = !track.locked;
                        useEditorStore.setState({ sequence: { ...sequence } });
                      }}
                      title="Lock Track"
                      className={`p-1 rounded text-slate-500 hover:text-slate-300 ${
                        track.locked ? 'text-amber-400' : ''
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Timeline Lanes & Ruler */}
        <div
          className="flex-1 relative"
          style={{ width: `${timelineWidth}px`, minWidth: '100%' }}
        >
          {/* Timecode Ruler (Top 24px) */}
          <div className="h-6 bg-studio-900 border-b border-studio-800 relative cursor-pointer">
            {Array.from({ length: Math.ceil(totalDurationSeconds) }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-studio-800 text-[9px] font-mono text-slate-500 pl-1 pt-0.5 select-none"
                style={{ left: `${i * zoom}px` }}
              >
                {i % 2 === 0
                  ? RationalTime.fromSeconds(i, sequence.fps).toSMPTE(sequence.fps)
                  : ''}
              </div>
            ))}
          </div>

          {/* Multitrack Lanes */}
          <div className="divide-y divide-studio-800/60 relative">
            {sequence.tracks.map((track) => (
              <div
                key={track.id}
                className="h-12 relative bg-studio-950/80 hover:bg-studio-900/40 transition-colors"
              >
                {/* Track Clips */}
                {track.clips.map((clip) => {
                  const leftPx = clip.timelineRange.start.toSeconds() * zoom;
                  const widthPx = clip.timelineRange.duration.toSeconds() * zoom;
                  const isSelected = selectedClipId === clip.id;

                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => handleClipClick(e, clip)}
                      className={`absolute top-1 bottom-1 rounded px-2.5 flex items-center justify-between text-xs font-medium cursor-pointer shadow-md transition-all overflow-hidden ${
                        isSelected
                          ? 'ring-2 ring-blue-400 z-10 shadow-blue-900/50'
                          : 'opacity-90 hover:opacity-100'
                      }`}
                      style={{
                        left: `${leftPx}px`,
                        width: `${Math.max(12, widthPx)}px`,
                        backgroundColor: clip.color || '#2563eb',
                      }}
                    >
                      <span className="truncate text-white text-[11px] font-medium drop-shadow">
                        {clip.name}
                      </span>
                      <span className="text-[9px] font-mono text-white/70 ml-1 shrink-0">
                        {clip.timelineRange.duration.toSMPTE(sequence.fps)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Playhead Needle & Vertical Line */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-30 transition-none"
              style={{
                left: `${playheadTime.toSeconds() * zoom}px`,
              }}
            >
              {/* Playhead Marker Head */}
              <div className="w-3.5 h-3.5 bg-red-500 -ml-[7px] rotate-45 -mt-1 shadow-md shadow-red-950" />
              {/* Vertical Playhead Line */}
              <div className="w-[1.5px] h-[1000px] bg-red-500 shadow-sm shadow-red-900" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

