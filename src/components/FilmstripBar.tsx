/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Film,
  Plus,
  Trash2,
  Copy,
  Eraser,
  CheckSquare,
  Square,
  Upload,
  ChevronDown,
  ChevronUp,
  Download,
  Check,
  Edit2
} from 'lucide-react';
import { ArtboardItem } from '../types/neon';

interface FilmstripBarProps {
  artboards: ArtboardItem[];
  activeArtboardId: string;
  onSelectArtboard: (id: string) => void;
  onToggleCheckArtboard: (id: string) => void;
  onToggleCheckAll: (checked: boolean) => void;
  onAddArtboard: () => void;
  onDuplicateArtboard: (id: string) => void;
  onDeleteArtboard: (id: string) => void;
  onClearActiveImage: () => void;
  onUploadArtboardFiles: (files: FileList | File[]) => void;
  onBatchExportChecked: () => void;
  onRenameArtboard: (id: string, newName: string) => void;
}

export const FilmstripBar: React.FC<FilmstripBarProps> = ({
  artboards,
  activeArtboardId,
  onSelectArtboard,
  onToggleCheckArtboard,
  onToggleCheckAll,
  onAddArtboard,
  onDuplicateArtboard,
  onDeleteArtboard,
  onClearActiveImage,
  onUploadArtboardFiles,
  onBatchExportChecked,
  onRenameArtboard,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkedCount = artboards.filter((a) => a.checked).length;
  const isAllChecked = artboards.length > 0 && checkedCount === artboards.length;

  const handleStartRename = (artboard: ArtboardItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(artboard.id);
    setEditName(artboard.name);
  };

  const handleFinishRename = (id: string) => {
    if (editName.trim()) {
      onRenameArtboard(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadArtboardFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-slate-950/95 border-t border-slate-800/90 select-none z-20 flex flex-col shrink-0 transition-all duration-200 shadow-2xl">
      {/* Top Controls Bar directly above the filmstrip */}
      <div className="h-11 px-4 flex items-center justify-between gap-3 border-b border-slate-800/60 bg-slate-900/70">
        {/* Left: Filmstrip Title & Multi-Check controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Film className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Filmstrip (মাল্টি আর্টবোর্ড)</span>
            <span className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 text-[11px] rounded-md border border-slate-700 font-mono">
              {artboards.length} Artboards
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Individual Checkmark master toggle */}
          <button
            type="button"
            onClick={() => onToggleCheckAll(!isAllChecked)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            title={isAllChecked ? 'সব আর্টবোর্ড আনচেক করুন' : 'সব আর্টবোর্ড একসাথে চেক মার্ক করুন'}
          >
            {isAllChecked ? (
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px]">
              {isAllChecked ? 'সব আনচেক' : 'সব চেক মার্ক'} ({checkedCount})
            </span>
          </button>
        </div>

        {/* Right: Actions (Clear Image, Add Artboard, Batch Export, Collapse) */}
        <div className="flex items-center gap-2">
          {/* IMAGE CLEAR BUTTON (ইউজারের নির্দেশিত উপরে মার্ক করা ইমেজ ক্লিয়ার অপশন) */}
          <button
            type="button"
            onClick={onClearActiveImage}
            className="flex items-center gap-1.5 px-3 py-1.2 bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-rose-100 text-xs font-semibold rounded-md transition-all shadow-sm group"
            title="বর্তমান আর্টবোর্ডের ইমেজ ও পাথ ক্লিয়ার করুন (Clear current artwork to start fresh)"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-12 transition-transform" />
            <span>ইমেজ ক্লিয়ার (Clear Image)</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* Hidden multi-file upload for adding new artboard from files */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".eps,.svg,.png,.jpg,.jpeg,.webp,application/postscript,image/svg+xml,image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium rounded-md transition-colors"
            title="নতুন ফাইল আপলোড করে আলাদা আর্টবোর্ড হিসেবে যুক্ত করুন"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">+ Upload to New</span>
          </button>

          <button
            type="button"
            onClick={onAddArtboard}
            className="flex items-center gap-1 px-2.5 py-1.2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium rounded-md transition-colors"
            title="নতুন ফাঁকা আর্টবোর্ড যুক্ত করুন (Add Blank Artboard)"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">+ New Artboard</span>
          </button>

          {checkedCount > 0 && (
            <button
              type="button"
              onClick={onBatchExportChecked}
              className="flex items-center gap-1.5 px-3 py-1.2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs rounded-md shadow-[0_0_12px_rgba(6,182,212,0.35)] transition-all active:scale-95"
              title={`চেক মার্ক করা ${checkedCount}টি আর্টবোর্ড একসাথে এক্সপোর্ট করুন`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Checked ({checkedCount})</span>
            </button>
          )}

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title={isCollapsed ? 'ফিল্মস্ট্রিপ প্যানেল খুলুন' : 'ফিল্মস্ট্রিপ প্যানেল সংক্ষেপ করুন'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filmstrip Cards Carousel (Horizontal Thumbnails) */}
      {!isCollapsed && (
        <div className="p-3 overflow-x-auto flex items-center gap-3.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          {artboards.map((artboard, idx) => {
            const isActive = artboard.id === activeArtboardId;
            const vb = artboard.svgViewBox || { x: 0, y: 0, width: 4000, height: 4000 };
            const visibleLayers = artboard.svgLayers.filter((l) => l.visible);

            return (
              <div
                key={artboard.id}
                onClick={() => onSelectArtboard(artboard.id)}
                className={`relative w-44 h-32 rounded-lg p-2 flex flex-col justify-between shrink-0 cursor-pointer transition-all duration-150 border ${
                  isActive
                    ? 'bg-slate-900/95 border-cyan-400 ring-2 ring-cyan-500/50 shadow-[0_0_18px_rgba(0,243,255,0.25)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                {/* Top Row: Checkmark (ইউজারের রিকোয়েস্ট: প্রতিটা filmtrip এ আলাদা আলাদা করে চেক মার্ক করা অপশন) & Badge & Actions */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5">
                    {/* INDIVIDUAL CHECKMARK CHECKBOX */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCheckArtboard(artboard.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        artboard.checked
                          ? 'text-cyan-400 bg-cyan-950/80 border border-cyan-700/60 shadow-sm'
                          : 'text-slate-500 hover:text-slate-300 bg-slate-950/80 border border-slate-800'
                      }`}
                      title={artboard.checked ? 'আর্টবোর্ড আনচেক করুন' : 'ম্যানুয়ালি বা ব্যাচে কাস্টমাইজ করতে চেক মার্ক দিন'}
                    >
                      {artboard.checked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <span className="px-1.5 py-0.2 bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 rounded font-semibold">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-0.5 bg-slate-950/85 px-1 py-0.5 rounded border border-slate-800/70">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateArtboard(artboard.id);
                      }}
                      className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors"
                      title="এই আর্টবোর্ডের হুবহু ডুপ্লিকেট কপি বানান"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    {artboards.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteArtboard(artboard.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                        title="এই আর্টবোর্ড মুছে ফেলুন"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Center: Live Neon Thumbnail Preview */}
                <div className="w-full h-16 bg-[#07080c] rounded border border-slate-800/80 flex items-center justify-center overflow-hidden relative shadow-inner my-1">
                  {artboard.sourceThumbnailUrl ? (
                    <img
                      src={artboard.sourceThumbnailUrl}
                      alt={artboard.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]"
                    />
                  ) : visibleLayers.length > 0 ? (
                    <svg
                      viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
                      className="w-full h-full p-1"
                    >
                      {/* Neon glow effect in mini thumbnail */}
                      <g style={{ filter: 'drop-shadow(0 0 3px #00f3ff)' }}>
                        {visibleLayers.map((layer) => (
                          <path
                            key={layer.id}
                            d={layer.d}
                            fill="none"
                            stroke={layer.color || artboard.settings.color.primaryColor || '#00f3ff'}
                            strokeWidth={Math.max(12, vb.width / 40)}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeOpacity="0.9"
                          />
                        ))}
                      </g>
                      {/* White core filament */}
                      <g>
                        {visibleLayers.map((layer) => (
                          <path
                            key={`core-${layer.id}`}
                            d={layer.d}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={Math.max(4, vb.width / 110)}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeOpacity="0.95"
                          />
                        ))}
                      </g>
                    </svg>
                  ) : (
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <span>Empty Canvas</span>
                    </div>
                  )}

                  {isActive && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.2 bg-cyan-500 text-slate-950 font-bold text-[9px] rounded-sm shadow-md">
                      ACTIVE
                    </div>
                  )}
                </div>

                {/* Bottom Row: Editable Name & Meta */}
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  {editingId === artboard.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleFinishRename(artboard.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishRename(artboard.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-slate-950 text-cyan-300 font-semibold px-1 py-0.5 rounded border border-cyan-500 text-[10px] w-24 focus:outline-none"
                    />
                  ) : (
                    <div
                      className="flex items-center gap-1 truncate font-medium hover:text-white"
                      onDoubleClick={(e) => handleStartRename(artboard, e)}
                      title="Double click to rename artboard"
                    >
                      <span className="truncate">{artboard.name}</span>
                      <Edit2
                        className="w-2.5 h-2.5 text-slate-500 hover:text-cyan-400 shrink-0"
                        onClick={(e) => handleStartRename(artboard, e)}
                      />
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {artboard.svgLayers.length > 0 ? `${artboard.svgLayers.length} paths` : 'Blank'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Quick "+ Add Artboard" Card at end of Filmstrip */}
          <div
            onClick={onAddArtboard}
            className="w-28 h-32 rounded-lg border-2 border-dashed border-slate-800 hover:border-cyan-500/70 bg-slate-950/40 hover:bg-slate-900/60 p-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group shrink-0"
            title="নতুন আর্টবোর্ড যোগ করুন"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 group-hover:border-cyan-400 group-hover:bg-cyan-950/40 flex items-center justify-center text-slate-400 group-hover:text-cyan-300 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-cyan-300 text-center">
              + New Artboard
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
