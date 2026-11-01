import React, { useState } from 'react';
import {
  FolderPlus,
  Video,
  Music,
  Tv,
  Plus,
  Search,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useEditorStore } from '../store/editor-store.js';
import { RationalTime, MediaAsset } from '@frameforge/core';

export const MediaBrowser: React.FC = () => {
  const { mediaAssets, importAsset, addClipToTrack, sequence } = useEditorStore();
  const [search, setSearch] = useState('');

  const filteredAssets = mediaAssets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleGenerateAsset = (type: 'smpte' | 'countdown' | 'audio') => {
    const id = `asset_gen_${Date.now()}`;
    let newAsset: MediaAsset;

    if (type === 'smpte') {
      newAsset = {
        id,
        name: `SMPTE Pattern [${new Date().toLocaleTimeString()}].mp4`,
        filePath: 'internal://generators/smpte.mp4',
        mediaType: 'generator',
        duration: RationalTime.fromSeconds(20, 24),
        width: 1920,
        height: 1080,
        fps: 24,
        dateAdded: Date.now(),
      };
    } else if (type === 'countdown') {
      newAsset = {
        id,
        name: `Academy Film Leader 10s.mp4`,
        filePath: 'internal://generators/countdown.mp4',
        mediaType: 'video',
        duration: RationalTime.fromSeconds(10, 24),
        width: 1920,
        height: 1080,
        fps: 24,
        dateAdded: Date.now(),
      };
    } else {
      newAsset = {
        id,
        name: `Voiceover Recording Master.wav`,
        filePath: 'internal://audio/voiceover.wav',
        mediaType: 'audio',
        duration: RationalTime.fromSeconds(35, 24),
        sampleRate: 48000,
        channels: 2,
        dateAdded: Date.now(),
      };
    }

    importAsset(newAsset);
  };

  const handleAddToTimeline = (asset: MediaAsset) => {
    // Pick first matching track
    const targetTrack = sequence.tracks.find(
      (t) => (asset.mediaType === 'audio' ? t.kind === 'audio' : t.kind === 'video')
    );
    if (targetTrack) {
      addClipToTrack(targetTrack.id, asset.id, 0, asset.duration.toFrames(sequence.fps));
    }
  };

  return (
    <div className="h-full flex flex-col bg-studio-900 border-r border-studio-750 text-slate-200">
      {/* Panel Header */}
      <div className="p-3 border-b border-studio-750 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-xs uppercase tracking-wider text-slate-300">
            Project Media
          </span>
          <span className="text-[10px] bg-studio-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
            {mediaAssets.length}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleGenerateAsset('smpte')}
            title="Generate SMPTE Color Bars"
            className="p-1 rounded hover:bg-studio-800 text-slate-400 hover:text-blue-400 text-xs flex items-center space-x-1 transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleGenerateAsset('audio')}
            title="Generate Audio Track"
            className="p-1 rounded hover:bg-studio-800 text-slate-400 hover:text-emerald-400 text-xs flex items-center space-x-1 transition-colors"
          >
            <Music className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-2 border-b border-studio-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter media assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-studio-950 border border-studio-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Asset Grid / List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredAssets.map((asset) => {
          const isAudio = asset.mediaType === 'audio';
          return (
            <div
              key={asset.id}
              className="group p-2 rounded bg-studio-850 hover:bg-studio-800 border border-studio-800/80 hover:border-studio-700 transition-all flex items-center justify-between"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                    isAudio
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                      : 'bg-blue-950/60 text-blue-400 border border-blue-800/50'
                  }`}
                >
                  {isAudio ? <Music className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate group-hover:text-blue-300">
                    {asset.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {asset.duration.toSMPTE(sequence.fps)} |{' '}
                    {asset.width ? `${asset.width}x${asset.height}` : '48 kHz'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAddToTimeline(asset)}
                title="Add to sequence"
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white transition-all shadow"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {filteredAssets.length === 0 && (
          <div className="p-6 text-center text-slate-500 text-xs">
            No media files match your query.
          </div>
        )}
      </div>

      {/* Import Footer Action */}
      <div className="p-2 border-t border-studio-850 bg-studio-950/40">
        <button
          onClick={() => handleGenerateAsset('countdown')}
          className="w-full py-2 px-3 rounded bg-studio-800 hover:bg-studio-750 text-slate-300 text-xs font-medium flex items-center justify-center space-x-2 border border-studio-700 transition-colors"
        >
          <FolderPlus className="w-4 h-4 text-blue-400" />
          <span>Import Media File</span>
        </button>
      </div>
    </div>
  );
};

