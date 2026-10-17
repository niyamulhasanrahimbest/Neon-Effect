/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  FolderOpen,
  PlusCircle,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  SlidersHorizontal,
  Download,
  Zap,
  Bookmark,
  Eraser
} from 'lucide-react';

interface ToolbarProps {
  onOpenFile: (files: FileList | File[]) => void;
  onAddStrokeLayer: (files: FileList | File[]) => void;
  onClearImage?: () => void;
  onSelectSample?: (sampleId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitCanvas: () => void;
  splitView: boolean;
  onToggleSplitView: () => void;
  showOriginal: boolean;
  onToggleShowOriginal: () => void;
  flicker: boolean;
  onToggleFlicker: () => void;
  hyperGlow?: boolean;
  onToggleHyperGlow?: () => void;
  onOpenPresets: () => void;
  onOpenExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenFile,
  onAddStrokeLayer,
  onClearImage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitCanvas,
  splitView,
  onToggleSplitView,
  showOriginal,
  onToggleShowOriginal,
  flicker,
  onToggleFlicker,
  hyperGlow,
  onToggleHyperGlow,
  onOpenPresets,
  onOpenExport,
}) => {
  const openFileInputRef = useRef<HTMLInputElement>(null);
  const addLayerInputRef = useRef<HTMLInputElement>(null);

  const handleOpenFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onOpenFile(e.target.files);
      e.target.value = '';
    }
  };

  const handleAddLayers = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddStrokeLayer(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <header className="h-14 bg-slate-950/90 border-b border-slate-800/80 px-4 flex items-center justify-between gap-4 backdrop-blur-md z-30 select-none">
      {/* Zone 1: Wordmark & File/Layer Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
            Neon Sign Studio
          </span>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        {/* File & Layer Actions */}
        <div className="flex items-center gap-1.5">
          {/* Main Open File Input */}
          <input
            ref={openFileInputRef}
            type="file"
            multiple
            accept=".eps,.svg,.png,.jpg,.jpeg,.webp,application/postscript,image/svg+xml,image/*"
            className="hidden"
            onChange={handleOpenFiles}
          />

          <button
            onClick={() => openFileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
            title="Open artwork (EPS, SVG, PNG, JPG, WebP)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Open Artwork</span>
          </button>

          {/* Add Layer Input */}
          <input
            ref={addLayerInputRef}
            type="file"
            multiple
            accept=".eps,.svg,.png,.jpg,.jpeg,.webp,application/postscript,image/svg+xml,image/*"
            className="hidden"
            onChange={handleAddLayers}
          />

          <button
            onClick={() => addLayerInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:text-white bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/60 hover:border-emerald-600 rounded-md transition-colors whitespace-nowrap shrink-0"
            title="Add additional EPS or SVG stroke layer to current design"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">+ Add Layer</span>
          </button>

          {onClearImage && (
            <button
              onClick={onClearImage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/60 hover:border-rose-600 rounded-md transition-colors whitespace-nowrap shrink-0"
              title="Clear current artwork (ইমেজ ক্লিয়ার)"
            >
              <Eraser className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xl:inline">Clear Artwork</span>
            </button>
          )}
        </div>
      </div>

      {/* Zone 2: Viewport & History Controls */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-md p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors rounded"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors rounded"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-md p-0.5 text-xs">
          <button
            onClick={onZoomOut}
            className="p-1.5 text-slate-400 hover:text-white transition-colors rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-[11px] text-slate-300 min-w-12 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1.5 text-slate-400 hover:text-white transition-colors rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onFitCanvas}
            className="p-1.5 text-slate-400 hover:text-white transition-colors rounded border-l border-slate-800/80 ml-0.5"
            title="Fit to Canvas"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode & Split Compare */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-md p-0.5">
          <button
            onClick={onToggleShowOriginal}
            className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center gap-1.5 ${
              showOriginal ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Hold or toggle to inspect original line art"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Before / After</span>
          </button>

          <button
            onClick={onToggleSplitView}
            className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center gap-1.5 ${
              splitView ? 'bg-pink-500/20 text-pink-300' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Interactive Split Screen comparison slider"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>
        </div>

        {/* Live Electrical Flicker */}
        <button
          onClick={onToggleFlicker}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
            flicker
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle realistic electrical tube flicker simulation"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Flicker</span>
        </button>

        {/* Hyper Glow Blinding Button */}
        {onToggleHyperGlow && (
          <button
            onClick={onToggleHyperGlow}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-all ${
              hyperGlow
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.45)] font-semibold'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Hyper-Glow Blinding Radiance (চোখে জ্বলজ্বল নিয়ন আলো)"
          >
            <Zap className={`w-3.5 h-3.5 ${hyperGlow ? 'text-cyan-300' : 'text-slate-500'}`} />
            <span>Hyper Glow</span>
          </button>
        )}
      </div>

      {/* Zone 3: Primary Action & Preset CTA */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenPresets}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Bookmark className="w-3.5 h-3.5 text-yellow-400" />
          <span>Presets</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-white rounded-lg shadow-[0_0_14px_rgba(6,182,212,0.35)] transition-all whitespace-nowrap shrink-0 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Artwork</span>
        </button>
      </div>
    </header>
  );
};
