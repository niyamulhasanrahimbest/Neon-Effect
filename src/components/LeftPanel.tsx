/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Sliders,
  Layers,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Info,
  PlusCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  Palette,
  CheckSquare,
  Square,
  Check,
  Flame,
  Search,
  Droplet,
  Filter,
  Copy,
  ClipboardPaste,
} from 'lucide-react';
import { InputMode, LineArtSettings, ProcessedImageInfo, SvgPathLayer } from '../types/neon';
import {
  HARMONIC_NEON_PALETTES,
  POPULAR_NEON_SWATCHES,
  NeonPalette,
} from '../engine/colorPalettes';

interface LeftPanelProps {
  imageInfo: ProcessedImageInfo | null;
  lineArtSettings: LineArtSettings;
  onUpdateLineArt: (settings: Partial<LineArtSettings>) => void;
  onResetLineArt: () => void;
  svgLayers?: SvgPathLayer[];
  svgViewBox?: { x: number; y: number; width: number; height: number };
  selectedLayerIds?: string[];
  onToggleSelectLayer?: (layerId: string) => void;
  onSelectAllLayers?: () => void;
  onDeselectAllLayers?: () => void;
  onSelectLayersByColor?: (color: string) => void;
  onInvertSelection?: () => void;
  onApplyColorToSelected?: (color: string, glowColor?: string) => void;
  onDeleteSelectedLayers?: () => void;
  onToggleVisibilitySelected?: () => void;
  currentThickness?: number;
  onUpdateAllLayersThickness?: (thickness: number) => void;
  currentCoreWidth?: number;
  onUpdateAllLayersCoreWidth?: (coreWidth: number) => void;
  onUpdateSvgLayer?: (layerId: string, updates: Partial<SvgPathLayer>) => void;
  onDeleteSvgLayer?: (layerId: string) => void;
  onReorderSvgLayer?: (layerId: string, direction: 'up' | 'down') => void;
  onAutoColorLayers?: () => void;
  onApplyPalette?: (
    paletteColors: string[],
    mode: 'cycle' | 'gradient' | 'grouped',
    onlySelected?: boolean
  ) => void;
  onAddStrokeLayer: (files: FileList | File[]) => void;
  activeTab: 'source' | 'layers';
  onTabChange: (tab: 'source' | 'layers') => void;
  sourceThumbnailUrl?: string;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  imageInfo,
  lineArtSettings,
  onUpdateLineArt,
  onResetLineArt,
  svgLayers = [],
  svgViewBox,
  selectedLayerIds = [],
  onToggleSelectLayer,
  onSelectAllLayers,
  onDeselectAllLayers,
  onSelectLayersByColor,
  onInvertSelection,
  onApplyColorToSelected,
  onDeleteSelectedLayers,
  onToggleVisibilitySelected,
  currentThickness = 3,
  onUpdateAllLayersThickness,
  currentCoreWidth = 35,
  onUpdateAllLayersCoreWidth,
  onUpdateSvgLayer,
  onDeleteSvgLayer,
  onReorderSvgLayer,
  onAutoColorLayers,
  onApplyPalette,
  onAddStrokeLayer,
  activeTab,
  onTabChange,
  sourceThumbnailUrl,
}) => {
  const isVector = imageInfo?.type === 'svg' || imageInfo?.type === 'eps' || svgLayers.length > 0;
  const layerFileInputRef = useRef<HTMLInputElement>(null);
  const [paletteMode, setPaletteMode] = useState<'gradient' | 'cycle' | 'grouped'>('gradient');
  const [paletteTab, setPaletteTab] = useState<'popular' | 'all'>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [batchColor, setBatchColor] = useState('#00f3ff');
  const [batchGlowColor, setBatchGlowColor] = useState('#00f3ff');
  const [syncGlow, setSyncGlow] = useState(true);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);

  const handleCopyColor = (colorToCopy: string, feedbackId: string) => {
    let formatted = colorToCopy.trim();
    if (!formatted.startsWith('#') && /^[0-9A-Fa-f]{3,8}$/.test(formatted)) {
      formatted = '#' + formatted;
    }
    setCopiedColor(formatted);
    setCopyFeedbackId(feedbackId);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(formatted);
      }
    } catch {
      // Fallback to internal state
    }
    setTimeout(() => {
      setCopyFeedbackId((current) => (current === feedbackId ? null : current));
    }, 2000);
  };

  const handlePasteColorToLayer = (layerId: string) => {
    if (!copiedColor || !onUpdateSvgLayer) return;
    onUpdateSvgLayer(layerId, {
      color: copiedColor,
      glowColor: copiedColor,
    });
  };

  // Distinct uppercase colors from all SVG layers for 1-click matching
  const uniqueActiveColors = Array.from(
    new Set(
      svgLayers
        .map((l) => (l.color || '#00F3FF').toUpperCase())
        .filter((c) => Boolean(c))
    )
  );

  const handleLayerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddStrokeLayer(e.target.files);
      e.target.value = '';
    }
  };

  // Filtered palettes: popular vs all
  const displayedPalettes =
    paletteTab === 'popular'
      ? HARMONIC_NEON_PALETTES.filter((p) => p.isPopular)
      : HARMONIC_NEON_PALETTES;

  // Filtered layers based on search query
  const filteredLayers = svgLayers.filter((l, idx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (l.name || `Stroke ${idx + 1}`).toLowerCase().includes(q);
    const colorMatch = (l.color || '').toLowerCase().includes(q);
    const idMatch = l.id.toLowerCase().includes(q);
    return nameMatch || colorMatch || idMatch;
  });

  const selectedCount = selectedLayerIds.length;
  const isAllSelected = svgLayers.length > 0 && selectedCount === svgLayers.length;

  const handleApplyBatchColor = (chosenColor: string) => {
    const glow = syncGlow ? chosenColor : batchGlowColor;
    if (onApplyColorToSelected) {
      onApplyColorToSelected(chosenColor, glow);
    }
  };

  return (
    <aside className="w-88 h-full bg-slate-950/95 border-r border-slate-800/80 flex flex-col z-20 select-none overflow-hidden text-slate-300">
      {/* Panel Tab Navigation */}
      <div className="flex border-b border-slate-800/80 bg-slate-900/60 p-1">
        <button
          onClick={() => onTabChange('source')}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'source'
              ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Line Art</span>
        </button>
        <button
          onClick={() => onTabChange('layers')}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'layers'
              ? 'bg-slate-800 text-pink-400 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Stroke Layers ({svgLayers.length})</span>
          {selectedCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-cyan-500 text-slate-950 text-[10px] font-bold rounded-full">
              {selectedCount}
            </span>
          )}
        </button>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'source' && (
          <>
            {/* Source Artwork Summary Card */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Source Artwork</span>
                <span className="text-[11px] font-mono text-cyan-400 uppercase font-semibold">
                  {imageInfo?.type || 'Image'}
                </span>
              </div>

              {sourceThumbnailUrl && (
                <div className="w-full h-24 bg-slate-950 rounded border border-slate-800/60 flex items-center justify-center overflow-hidden canvas-checkerboard">
                  <img
                    src={sourceThumbnailUrl}
                    alt="Source thumbnail"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 font-mono">
                <div>Dimensions:</div>
                <div className="text-right text-slate-200">
                  {imageInfo ? `${imageInfo.width} × ${imageInfo.height} px` : '—'}
                </div>
                <div>Transparency:</div>
                <div className="text-right text-slate-200">
                  {imageInfo?.hasAlpha ? 'Alpha Channel' : 'Opaque'}
                </div>
                <div>Stroke Layers:</div>
                <div className="text-right text-cyan-400 font-semibold">
                  {svgLayers.length > 0 ? `${svgLayers.length} Vector Paths` : 'Unified Mask'}
                </div>
              </div>
            </div>

            {/* Input Interpretation Mode */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-200 flex items-center justify-between">
                <span>Raster Extraction Mode</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {lineArtSettings.mode}
                </span>
              </label>

              <select
                value={lineArtSettings.mode}
                onChange={(e) =>
                  onUpdateLineArt({ mode: e.target.value as InputMode })
                }
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="auto">Auto Detect (Smart)</option>
                <option value="dark-on-light">Dark Lines on Light (Ink/Paper)</option>
                <option value="light-on-dark">Light Lines on Dark (Chalk/Invert)</option>
                <option value="transparent-line">Transparent Line Art (PNG Alpha)</option>
                <option value="colored-outline">Colored Outline / Edge Variance</option>
              </select>
            </div>

            {/* Threshold Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Extraction Threshold</span>
                <span className="font-mono text-cyan-400 text-[11px]">
                  {lineArtSettings.threshold}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="245"
                value={lineArtSettings.threshold}
                onChange={(e) =>
                  onUpdateLineArt({ threshold: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Contrast Boost */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Line Contrast</span>
                <span className="font-mono text-cyan-400 text-[11px]">
                  {lineArtSettings.contrast > 0 ? `+${lineArtSettings.contrast}` : lineArtSettings.contrast}%
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={lineArtSettings.contrast}
                onChange={(e) =>
                  onUpdateLineArt({ contrast: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Smoothing */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Line Smoothing</span>
                <span className="font-mono text-cyan-400 text-[11px]">
                  {lineArtSettings.smoothing}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={lineArtSettings.smoothing}
                onChange={(e) =>
                  onUpdateLineArt({ smoothing: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Denoise */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Noise Removal</span>
                <span className="font-mono text-cyan-400 text-[11px]">
                  {lineArtSettings.denoise}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={lineArtSettings.denoise}
                onChange={(e) =>
                  onUpdateLineArt({ denoise: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Invert Source Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label
                htmlFor="invertSource"
                className="text-xs text-slate-300 cursor-pointer"
              >
                Invert Line Extraction
              </label>
              <input
                id="invertSource"
                type="checkbox"
                checked={lineArtSettings.invert}
                onChange={(e) =>
                  onUpdateLineArt({ invert: e.target.checked })
                }
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Preview Mask Checkbox */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="previewMask"
                className="text-xs text-slate-300 cursor-pointer"
              >
                Preview Extracted Mask Only
              </label>
              <input
                id="previewMask"
                type="checkbox"
                checked={lineArtSettings.previewMask}
                onChange={(e) =>
                  onUpdateLineArt({ previewMask: e.target.checked })
                }
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Reset Button */}
            <div className="pt-2">
              <button
                onClick={onResetLineArt}
                className="w-full py-1.5 px-3 text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Extraction Settings</span>
              </button>
            </div>
          </>
        )}

        {activeTab === 'layers' && (
          <div className="space-y-3.5">
            {/* Top Layer Action Toolbar */}
            <div className="flex items-center gap-2">
              <input
                ref={layerFileInputRef}
                type="file"
                multiple
                accept=".eps,.svg,.png,.jpg,.jpeg,.webp,application/postscript,image/svg+xml,image/*"
                className="hidden"
                onChange={handleLayerFileChange}
              />
              <button
                onClick={() => layerFileInputRef.current?.click()}
                className="flex-1 py-2 px-2.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-lg text-xs font-semibold text-emerald-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                title="Import additional EPS or SVG stroke files as separate layers"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Upload Stroke Layer</span>
              </button>

              {svgLayers.length > 0 && onAutoColorLayers && (
                <button
                  onClick={onAutoColorLayers}
                  className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-pink-300 flex items-center gap-1.5 transition-colors"
                  title="Auto-assign separated vibrant neon gas colors to each stroke layer"
                >
                  <Palette className="w-3.5 h-3.5 text-pink-400" />
                  <span>Rainbow</span>
                </button>
              )}
            </div>

            {isVector && svgLayers.length > 0 ? (
              <>
                {/* 1. Global Synchronized Line Thickness (সব লাইন একসাথে মোটা/চিকন) */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>All Lines Thickness (সব লাইন একসাথে)</span>
                    </span>
                    <span className="font-mono text-cyan-400 font-bold px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-[11px]">
                      {currentThickness} px
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="36"
                    value={currentThickness}
                    onChange={(e) =>
                      onUpdateAllLayersThickness &&
                      onUpdateAllLayersThickness(parseInt(e.target.value, 10))
                    }
                    className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                  />

                  <div className="flex items-center justify-between text-[10px] text-cyan-400/90 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-800/40">
                    <span>✓ Linked: একটি লাইনের থিকনেস বাড়ালে বা কমালে সব {svgLayers.length}টি লাইন একই সাথে মোটা/চিকন হবে।</span>
                  </div>
                </div>

                {/* 2. Curated Harmonic Color Palettes (সব চেয়ে জনপ্রিয় উপরে) */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-pink-400" />
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          Color Palettes ({svgLayers.length > 50 ? `${svgLayers.length}+ Lines` : 'All Lines'})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          সব চেয়ে জনপ্রিয় কালার প্যালেট সবার উপরে
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Filter Tabs: Popular vs All */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setPaletteTab('popular')}
                      className={`flex-1 py-1 rounded font-medium transition-colors flex items-center justify-center gap-1 ${
                        paletteTab === 'popular'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>সব চেয়ে জনপ্রিয় (Top Popular)</span>
                    </button>
                    <button
                      onClick={() => setPaletteTab('all')}
                      className={`flex-1 py-1 rounded font-medium transition-colors ${
                        paletteTab === 'all'
                          ? 'bg-slate-800 text-cyan-400 border border-slate-700 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>সব প্যালেট ({HARMONIC_NEON_PALETTES.length})</span>
                    </button>
                  </div>

                  {/* Distribution Mode for 100+ lines */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>বণ্টন পদ্ধতি (Distribution Mode):</span>
                      <span className="text-[10px] text-cyan-400 font-mono">{paletteMode}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-[10px]">
                      <button
                        onClick={() => setPaletteMode('gradient')}
                        className={`py-1 rounded font-medium transition-colors ${
                          paletteMode === 'gradient'
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="মসৃণ গ্র্যাডিয়েন্ট - ১০০+ লাইনের জন্য সবচেয়ে সেরা"
                      >
                        Gradient (স্মুথ)
                      </button>
                      <button
                        onClick={() => setPaletteMode('cycle')}
                        className={`py-1 rounded font-medium transition-colors ${
                          paletteMode === 'cycle'
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="পর্যায়ক্রমিক সাইক্লিং"
                      >
                        Cycle (সাইকেল)
                      </button>
                      <button
                        onClick={() => setPaletteMode('grouped')}
                        className={`py-1 rounded font-medium transition-colors ${
                          paletteMode === 'grouped'
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="গ্রুপ ব্যান্ড"
                      >
                        Grouped (ব্যান্ড)
                      </button>
                    </div>
                  </div>

                  {/* Palettes List with Popularity Badges */}
                  <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {displayedPalettes.map((pal) => (
                      <div
                        key={pal.id}
                        className="p-2 bg-slate-950 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-lg transition-all space-y-1.5"
                        title={pal.description}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 truncate">
                              <span className="truncate">{pal.bengaliName}</span>
                              {pal.popularityBadge && (
                                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold rounded shrink-0">
                                  {pal.popularityBadge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {pal.colors.map((c, i) => (
                                <div
                                  key={i}
                                  className="w-3.5 h-3.5 rounded-full border border-slate-900 shadow-sm"
                                  style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}88` }}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {selectedCount > 0 && (
                              <button
                                onClick={() =>
                                  onApplyPalette &&
                                  onApplyPalette(pal.colors, paletteMode, true)
                                }
                                className="px-2 py-1 text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/80 rounded shadow-sm transition-colors whitespace-nowrap"
                                title={`Apply to selected ${selectedCount} paths only`}
                              >
                                Selected ({selectedCount})
                              </button>
                            )}
                            <button
                              onClick={() =>
                                onApplyPalette &&
                                onApplyPalette(pal.colors, paletteMode, false)
                              }
                              className="px-2.5 py-1 text-[10px] font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded shadow-sm transition-colors whitespace-nowrap"
                              title="Apply to all lines in artwork"
                            >
                              Apply All
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. MULTI-PATH SELECTION & BATCH COLOR ASSIGNMENT (পাথ সিলেক্ট করে একই কালার দেওয়া) */}
                <div className={`p-3 rounded-lg space-y-3 transition-all border ${
                  selectedCount > 0
                    ? 'bg-slate-900 border-cyan-500/60 shadow-[0_0_15px_rgba(0,243,255,0.12)]'
                    : 'bg-slate-900 border-slate-800'
                }`}>
                  {/* Selection Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          Multi-Path Color Match (পাথ সিলেক্ট ও রঙ পরিবর্তন)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {selectedCount > 0
                            ? `✓ ${selectedCount}টি পাথ সিলেক্ট করা আছে (একসাথে একই কালার দিন)`
                            : 'একাধিক পাথ সিলেক্ট করে একসাথে একই কালার দিন (যেমন: পাখির ২ পা)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fast Selection Actions */}
                  <div className="flex items-center justify-between gap-1 text-[11px] pt-1 border-t border-slate-800/80">
                    <button
                      onClick={isAllSelected ? onDeselectAllLayers : onSelectAllLayers}
                      className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {isAllSelected ? (
                        <>
                          <Square className="w-3 h-3 text-slate-400" />
                          <span>Deselect All</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3 h-3 text-cyan-400" />
                          <span>Select All ({svgLayers.length})</span>
                        </>
                      )}
                    </button>

                    {selectedCount > 0 && onInvertSelection && (
                      <button
                        onClick={onInvertSelection}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 hover:text-white transition-colors"
                        title="Invert selection"
                      >
                        Invert
                      </button>
                    )}

                    {selectedCount > 0 && onDeselectAllLayers && (
                      <button
                        onClick={onDeselectAllLayers}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-red-300 hover:text-red-200 transition-colors"
                      >
                        Clear Selection ({selectedCount})
                      </button>
                    )}
                  </div>

                  {/* Search / Filter Paths */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search paths (e.g. leg, wing, 12)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Copied Color Notification Banner */}
                  {copiedColor && (
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-cyan-950/60 border border-cyan-800/80 rounded-lg text-xs text-cyan-300 shadow-sm animate-fade-in">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm shrink-0"
                          style={{ backgroundColor: copiedColor }}
                        />
                        <span className="truncate">
                          কপিকৃত কালার: <strong className="font-mono text-white uppercase">{copiedColor}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400">Paste চাপুন</span>
                        <button
                          type="button"
                          onClick={() => setCopiedColor(null)}
                          className="text-slate-400 hover:text-white px-1 text-xs font-bold leading-none"
                          title="মুছুন"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE BATCH COLOR APPLICATOR (যখন পাথ সিলেক্ট করা থাকবে) */}
                  {selectedCount > 0 ? (
                    <div className="p-2.5 bg-cyan-950/30 border border-cyan-800/60 rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                          <span>সিলেক্টেড {selectedCount}টি পাথে একই কালার দিন:</span>
                        </span>
                      </div>

                      {/* 12 Instant One-Click Popular Neon Swatches */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block">
                          এক ক্লিকে নিওন কালার প্রয়োগ করুন (Click to apply same color):
                        </span>
                        <div className="grid grid-cols-6 gap-1.5">
                          {POPULAR_NEON_SWATCHES.map((swatch) => (
                            <button
                              key={swatch.hex}
                              onClick={() => {
                                setBatchColor(swatch.hex);
                                if (syncGlow) setBatchGlowColor(swatch.hex);
                                handleApplyBatchColor(swatch.hex);
                              }}
                              className="h-6 rounded border border-slate-800 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-sm relative group"
                              style={{ backgroundColor: swatch.hex }}
                              title={`Apply ${swatch.name} to all ${selectedCount} selected paths`}
                            >
                              {batchColor.toLowerCase() === swatch.hex.toLowerCase() && (
                                <Check className="w-3.5 h-3.5 text-slate-950 drop-shadow-md stroke-[3]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Color Input for Selected Paths */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-cyan-900/40">
                        {/* Custom Tube Color */}
                        <div className="space-y-1">
                          <span className="text-slate-400 block">Custom Color:</span>
                          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                            <input
                              type="color"
                              value={batchColor}
                              onChange={(e) => {
                                setBatchColor(e.target.value);
                                if (syncGlow) setBatchGlowColor(e.target.value);
                              }}
                              className="w-5 h-5 rounded cursor-pointer border border-slate-700 bg-transparent shrink-0"
                            />
                            <input
                              type="text"
                              value={batchColor}
                              onChange={(e) => {
                                let val = e.target.value.trim();
                                if (!val.startsWith('#') && /^[0-9A-Fa-f]{3,8}$/.test(val)) val = '#' + val;
                                setBatchColor(val);
                                if (syncGlow) setBatchGlowColor(val);
                              }}
                              className="font-mono text-[10px] text-cyan-300 uppercase bg-transparent w-16 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleCopyColor(batchColor, 'batch-custom')}
                              className={`p-0.5 rounded transition-colors ${
                                copyFeedbackId === 'batch-custom'
                                  ? 'text-emerald-400'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title="কালার কোড কপি করুন"
                            >
                              {copyFeedbackId === 'batch-custom' ? (
                                <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {copiedColor && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBatchColor(copiedColor);
                                  if (syncGlow) setBatchGlowColor(copiedColor);
                                }}
                                className="p-0.5 text-cyan-400 hover:text-cyan-200 transition-colors"
                                title={`কপিকৃত কালার ${copiedColor} এখানে বসান`}
                              >
                                <ClipboardPaste className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Apply Button */}
                        <div className="flex flex-col justify-end">
                          <button
                            onClick={() => handleApplyBatchColor(batchColor)}
                            className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs rounded shadow transition-all flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>এক কালার দিন</span>
                          </button>
                        </div>
                      </div>

                      {/* Batch Controls: Visibility and Delete */}
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        {onToggleVisibilitySelected && (
                          <button
                            onClick={onToggleVisibilitySelected}
                            className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3 text-cyan-400" />
                            <span>Toggle Visibility</span>
                          </button>
                        )}
                        {onDeleteSelectedLayers && (
                          <button
                            onClick={onDeleteSelectedLayers}
                            className="text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                            title="Delete all selected paths"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Selected ({selectedCount})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>টিপস:</strong> নিচের তালিকা থেকে যেকোনো পাথ-এর চেকবক্সে ক্লিক করে সিলেক্ট করুন (যেমন পাখির দুটি পা)। সিলেক্ট করার পর একসাথে একই নিওন রঙ দিতে পারবেন।
                      </span>
                    </div>
                  )}
                </div>

                {/* Master Synchronized Controls for All Lines */}
                <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded-lg space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-300">
                      সব লাইনের থিকনেস ও সাদা টিউব (All Lines Sync)
                    </span>
                    <span className="text-[10px] text-slate-400">সবগুলোতে একসাথে কাজ করবে</span>
                  </div>

                  {/* Master Thickness */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300">লাইনের থিকনেস (Weight):</span>
                      <span className="font-mono text-cyan-400 font-bold">{currentThickness ?? 3}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="36"
                      value={currentThickness ?? 3}
                      onChange={(e) =>
                        onUpdateAllLayersThickness &&
                        onUpdateAllLayersThickness(parseInt(e.target.value, 10))
                      }
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Master White Tube Thickness */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300">ভিতরের সাদা টিউব (White Tube):</span>
                      <span className="font-mono text-white font-bold">{currentCoreWidth ?? 35}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={currentCoreWidth ?? 35}
                      onChange={(e) =>
                        onUpdateAllLayersCoreWidth &&
                        onUpdateAllLayersCoreWidth(parseInt(e.target.value, 10))
                      }
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-white"
                    />
                  </div>
                </div>

                {/* 4. Stroke Layers List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>Paths ({filteredLayers.length} of {svgLayers.length})</span>
                    {selectedCount > 0 && (
                      <span className="text-cyan-400 font-semibold">{selectedCount} selected</span>
                    )}
                  </div>

                  {filteredLayers.map((layer, idx) => {
                    const isSelected = selectedLayerIds.includes(layer.id);
                    const vb = svgViewBox || { x: 0, y: 0, width: 500, height: 500 };

                    return (
                      <div
                        key={layer.id}
                        className={`p-2.5 rounded-lg space-y-2 transition-all shadow-sm border ${
                          isSelected
                            ? 'bg-slate-900/90 border-cyan-400 ring-1 ring-cyan-500/50 shadow-[0_0_12px_rgba(0,243,255,0.18)]'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Layer Header: Selection Checkbox, Mini-Thumbnail, Name & Actions */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {/* Multi-Selection Checkbox */}
                            <button
                              type="button"
                              onClick={() => onToggleSelectLayer && onToggleSelectLayer(layer.id)}
                              className={`p-1 rounded transition-colors ${
                                isSelected
                                  ? 'text-cyan-400 bg-cyan-950/80'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                              title={isSelected ? 'Deselect path' : 'Select path for batch coloring'}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-cyan-400" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>

                            {/* Mini Vector Path Thumbnail (যাতে সহজে পাখির পা বা অংশ চেনা যায়) */}
                            <div
                              onClick={() => onToggleSelectLayer && onToggleSelectLayer(layer.id)}
                              className="w-7 h-7 bg-slate-950 rounded border border-slate-800 p-0.5 shrink-0 flex items-center justify-center cursor-pointer hover:border-cyan-500 transition-colors"
                              title="Click to toggle select"
                            >
                              <svg
                                viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
                                className="w-full h-full"
                              >
                                <path
                                  d={layer.d}
                                  fill="none"
                                  stroke={layer.color || '#00f3ff'}
                                  strokeWidth={Math.max(3, vb.width / 40)}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>

                            {/* Path Name (editable) */}
                            <input
                              type="text"
                              value={layer.name || `Stroke ${idx + 1}`}
                              onChange={(e) =>
                                onUpdateSvgLayer &&
                                onUpdateSvgLayer(layer.id, { name: e.target.value })
                              }
                              className="text-xs font-semibold text-slate-200 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 focus:outline-none truncate w-full"
                            />
                          </div>

                          {/* Actions: Reorder, Copy, Paste, Visibility, Delete */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Quick Copy Layer Color */}
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyColor(layer.color || '#00f3ff', `${layer.id}-header`)
                              }
                              className={`p-1 rounded transition-colors ${
                                copyFeedbackId === `${layer.id}-header`
                                  ? 'text-emerald-400 bg-emerald-950/60'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title={`এই পাথের কালার কোড কপি করুন (${layer.color || '#00f3ff'})`}
                            >
                              {copyFeedbackId === `${layer.id}-header` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Quick Paste Copied Color */}
                            {copiedColor && (
                              <button
                                type="button"
                                onClick={() => handlePasteColorToLayer(layer.id)}
                                className="p-1 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/60 rounded transition-colors"
                                title={`কপিকৃত কালার (${copiedColor}) এই পাথে বসান`}
                              >
                                <ClipboardPaste className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onReorderSvgLayer && (
                              <>
                                <button
                                  onClick={() => onReorderSvgLayer(layer.id, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                                  title="Move up"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => onReorderSvgLayer(layer.id, 'down')}
                                  disabled={idx === svgLayers.length - 1}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                                  title="Move down"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() =>
                                onUpdateSvgLayer &&
                                onUpdateSvgLayer(layer.id, { visible: !layer.visible })
                              }
                              className={`p-1 rounded transition-colors ${
                                layer.visible ? 'text-slate-300 hover:text-white' : 'text-slate-600'
                              }`}
                              title={layer.visible ? 'Hide stroke' : 'Show stroke'}
                            >
                              {layer.visible ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {onDeleteSvgLayer && (
                              <button
                                onClick={() => onDeleteSvgLayer(layer.id)}
                                className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                title="Delete stroke layer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Individual Color Pickers with Editable Hex & Copy/Paste */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            {/* Tube Color */}
                            <div className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              <span className="text-slate-400 shrink-0">Tube:</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="color"
                                  value={layer.color || '#00f3ff'}
                                  onChange={(e) =>
                                    onUpdateSvgLayer &&
                                    onUpdateSvgLayer(layer.id, {
                                      color: e.target.value,
                                      glowColor: e.target.value,
                                    })
                                  }
                                  className="w-4 h-4 rounded cursor-pointer border border-slate-700 bg-transparent shrink-0"
                                  title="কালার পিকার দিয়ে টিউবের কালার পরিবর্তন করুন"
                                />
                                <input
                                  type="text"
                                  value={layer.color || '#00f3ff'}
                                  onChange={(e) => {
                                    let val = e.target.value.trim();
                                    if (!val.startsWith('#') && /^[0-9A-Fa-f]{3,8}$/.test(val)) {
                                      val = '#' + val;
                                    }
                                    if (onUpdateSvgLayer) {
                                      onUpdateSvgLayer(layer.id, {
                                        color: val,
                                        glowColor: val,
                                      });
                                    }
                                  }}
                                  placeholder="#00F3FF"
                                  className="w-16 font-mono text-[10px] bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-slate-200 uppercase focus:border-cyan-500 focus:outline-none"
                                  title="কালার কোড টাইপ বা পেস্ট করুন (যেমন #FF0055)"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyColor(layer.color || '#00f3ff', `${layer.id}-tube`)
                                  }
                                  className={`p-0.5 rounded transition-colors ${
                                    copyFeedbackId === `${layer.id}-tube`
                                      ? 'text-emerald-400 bg-emerald-950/60'
                                      : 'text-slate-400 hover:text-cyan-300'
                                  }`}
                                  title="কালার কোড কপি করুন (Copy hex)"
                                >
                                  {copyFeedbackId === `${layer.id}-tube` ? (
                                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                {copiedColor && (
                                  <button
                                    type="button"
                                    onClick={() => handlePasteColorToLayer(layer.id)}
                                    className="p-0.5 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/60 rounded transition-colors"
                                    title={`কপিকৃত কালার ${copiedColor} এখানে পেস্ট করুন`}
                                  >
                                    <ClipboardPaste className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Glow Color */}
                            <div className="flex items-center justify-between bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              <span className="text-slate-400 shrink-0">Glow:</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="color"
                                  value={layer.glowColor || layer.color || '#00f3ff'}
                                  onChange={(e) =>
                                    onUpdateSvgLayer &&
                                    onUpdateSvgLayer(layer.id, { glowColor: e.target.value })
                                  }
                                  className="w-4 h-4 rounded cursor-pointer border border-slate-700 bg-transparent shrink-0"
                                  title="গ্লো কালার সেট করুন"
                                />
                                <input
                                  type="text"
                                  value={layer.glowColor || layer.color || '#00f3ff'}
                                  onChange={(e) => {
                                    let val = e.target.value.trim();
                                    if (!val.startsWith('#') && /^[0-9A-Fa-f]{3,8}$/.test(val)) {
                                      val = '#' + val;
                                    }
                                    if (onUpdateSvgLayer) {
                                      onUpdateSvgLayer(layer.id, { glowColor: val });
                                    }
                                  }}
                                  placeholder="#00F3FF"
                                  className="w-16 font-mono text-[10px] bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-slate-200 uppercase focus:border-cyan-500 focus:outline-none"
                                  title="গ্লো কালার কোড টাইপ বা পেস্ট করুন"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyColor(
                                      layer.glowColor || layer.color || '#00f3ff',
                                      `${layer.id}-glow`
                                    )
                                  }
                                  className={`p-0.5 rounded transition-colors ${
                                    copyFeedbackId === `${layer.id}-glow`
                                      ? 'text-emerald-400 bg-emerald-950/60'
                                      : 'text-slate-400 hover:text-cyan-300'
                                  }`}
                                  title="গ্লো কালার কোড কপি করুন"
                                >
                                  {copyFeedbackId === `${layer.id}-glow` ? (
                                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                {copiedColor && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onUpdateSvgLayer) {
                                        onUpdateSvgLayer(layer.id, { glowColor: copiedColor });
                                      }
                                    }}
                                    className="p-0.5 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/60 rounded transition-colors"
                                    title={`কপিকৃত কালার ${copiedColor} গ্লোতে পেস্ট করুন`}
                                  >
                                    <ClipboardPaste className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Color Match Row (অন্যান্য লেয়ারের যে কোনো কালারের সাথে মেলানো) */}
                          {uniqueActiveColors.length > 1 && (
                            <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                              <span
                                className="text-slate-400 shrink-0 text-[10px] flex items-center gap-1"
                                title="অন্য লেয়ারের কালারে ক্লিক করে এই লেয়ারের কালার তার সাথে মিলান"
                              >
                                <Palette className="w-3 h-3 text-cyan-400" />
                                <span>কালার মিলান:</span>
                              </span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {uniqueActiveColors.map((hex) => {
                                  const isCurrent =
                                    (layer.color || '#00f3ff').toUpperCase() === hex;
                                  return (
                                    <button
                                      key={hex}
                                      type="button"
                                      onClick={() => {
                                        if (onUpdateSvgLayer) {
                                          onUpdateSvgLayer(layer.id, {
                                            color: hex,
                                            glowColor: hex,
                                          });
                                        }
                                      }}
                                      className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center ${
                                        isCurrent
                                          ? 'border-white scale-125 shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                                          : 'border-slate-700 hover:scale-125 opacity-75 hover:opacity-100'
                                      }`}
                                      style={{ backgroundColor: hex }}
                                      title={`এই পাথের কালার পরিবর্তন করে ${hex} করুন`}
                                    >
                                      {isCurrent && (
                                        <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Stroke thickness slider (Synchronized with all lines) */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="w-16 shrink-0" title="Changing weight scales all lines simultaneously">থিকনেস:</span>
                          <input
                            type="range"
                            min="1"
                            max="36"
                            value={currentThickness ?? layer.thickness ?? 3}
                            onChange={(e) =>
                              onUpdateAllLayersThickness
                                ? onUpdateAllLayersThickness(parseInt(e.target.value, 10))
                                : onUpdateSvgLayer &&
                                  onUpdateSvgLayer(layer.id, {
                                    thickness: parseInt(e.target.value, 10),
                                  })
                            }
                            className="flex-1 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                          />
                          <span className="font-mono text-cyan-400 w-10 text-right font-semibold text-[11px]">
                            {currentThickness ?? layer.thickness ?? 3}px
                          </span>
                        </div>

                        {/* White Tube thickness slider (Synchronized with all lines) */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="w-16 shrink-0" title="ভিতরের সাদা টিউবের থিকনেস (সবগুলোতে একসাথে পরিবর্তন হবে)">সাদা টিউব:</span>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            value={currentCoreWidth ?? layer.coreWidth ?? 35}
                            onChange={(e) =>
                              onUpdateAllLayersCoreWidth
                                ? onUpdateAllLayersCoreWidth(parseInt(e.target.value, 10))
                                : onUpdateSvgLayer &&
                                  onUpdateSvgLayer(layer.id, {
                                    coreWidth: parseInt(e.target.value, 10),
                                  })
                            }
                            className="flex-1 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-white"
                          />
                          <span className="font-mono text-white w-10 text-right font-semibold text-[11px]">
                            {currentCoreWidth ?? layer.coreWidth ?? 35}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                  <Info className="w-4 h-4" />
                  <span>Multi-Layer Vector Strokes</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  You can upload <strong>.eps</strong> or <strong>.svg</strong> vector line files, or upload separate stroke layers one by one using the <strong>"+ Upload Stroke Layer"</strong> button above.
                </p>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="font-medium text-slate-200">Supported Vector Formats:</div>
                  <div>• <strong>.EPS</strong> (Encapsulated PostScript line art)</div>
                  <div>• <strong>.SVG</strong> (Multi-path vector outlines)</div>
                  <div>• Select multiple paths to assign the exact same color!</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
