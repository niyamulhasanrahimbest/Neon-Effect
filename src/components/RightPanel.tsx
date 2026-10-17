/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  Sun,
  Palette,
  Image as ImageIcon,
  ShieldCheck,
  Sliders,
  RotateCcw,
  Zap,
  Upload,
} from 'lucide-react';
import {
  NeonSettings,
  NeonTubeSettings,
  NeonGlowSettings,
  NeonColorSettings,
  NeonBackgroundSettings,
  NeonRealismSettings,
  NeonToneSettings,
  BackgroundType,
} from '../types/neon';
import { HARMONIC_NEON_PALETTES } from '../engine/colorPalettes';

interface RightPanelProps {
  settings: NeonSettings;
  onUpdateSettings: (updates: Partial<NeonSettings>) => void;
  onResetSettings: () => void;
  onResetPanel: (panel: keyof NeonSettings) => void;
  onApplyPalette?: (paletteColors: string[], mode: 'cycle' | 'gradient' | 'grouped') => void;
  svgLayerCount?: number;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  onResetPanel,
  onApplyPalette,
  svgLayerCount = 0,
}) => {
  const [activeTab, setActiveTab] = React.useState<
    'tube' | 'glow' | 'color' | 'environment' | 'realism' | 'advanced'
  >('tube');
  const [paletteMode, setPaletteMode] = React.useState<'gradient' | 'cycle' | 'grouped'>('gradient');

  const customBgInputRef = useRef<HTMLInputElement>(null);

  // Quick color presets
  const COLOR_SWATCHES = [
    { name: 'Cyan', color: '#00f3ff' },
    { name: 'Pink', color: '#ff007f' },
    { name: 'Ruby', color: '#ff0044' },
    { name: 'Yellow', color: '#ffe600' },
    { name: 'Emerald', color: '#00ff66' },
    { name: 'Orange', color: '#ff7700' },
    { name: 'Purple', color: '#a855f7' },
    { name: 'Ice White', color: '#e0f2fe' },
  ];

  const updateTube = (updates: Partial<NeonTubeSettings>) => {
    onUpdateSettings({ tube: { ...settings.tube, ...updates } });
  };

  const updateGlow = (updates: Partial<NeonGlowSettings>) => {
    onUpdateSettings({ glow: { ...settings.glow, ...updates } });
  };

  const updateColor = (updates: Partial<NeonColorSettings>) => {
    onUpdateSettings({ color: { ...settings.color, ...updates } });
  };

  const updateBackground = (updates: Partial<NeonBackgroundSettings>) => {
    onUpdateSettings({ background: { ...settings.background, ...updates } });
  };

  const updateRealism = (updates: Partial<NeonRealismSettings>) => {
    onUpdateSettings({ realism: { ...settings.realism, ...updates } });
  };

  const updateTone = (updates: Partial<NeonToneSettings>) => {
    onUpdateSettings({ tone: { ...settings.tone, ...updates } });
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateBackground({
            type: 'custom-image',
            customImageSrc: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  return (
    <aside className="w-88 h-full bg-slate-950/95 border-l border-slate-800/80 flex flex-col z-20 select-none overflow-hidden text-slate-300">
      {/* Tab Navigation */}
      <div className="grid grid-cols-6 border-b border-slate-800/80 bg-slate-900/60 p-1 text-[11px]">
        <button
          onClick={() => setActiveTab('tube')}
          className={`py-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === 'tube'
              ? 'bg-slate-800 text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Neon Tube & Core"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Tube</span>
        </button>

        <button
          onClick={() => setActiveTab('glow')}
          className={`py-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === 'glow'
              ? 'bg-slate-800 text-pink-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Glow & Bloom Physics"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Glow</span>
        </button>

        <button
          onClick={() => setActiveTab('color')}
          className={`py-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === 'color'
              ? 'bg-slate-800 text-yellow-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Color & Gradients"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Color</span>
        </button>

        <button
          onClick={() => setActiveTab('environment')}
          className={`py-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === 'environment'
              ? 'bg-slate-800 text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Background & Texture"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Wall</span>
        </button>

        <button
          onClick={() => setActiveTab('realism')}
          className={`py-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === 'realism'
              ? 'bg-slate-800 text-purple-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Realism & Mounts"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Realism</span>
        </button>

        <button
          onClick={() => setActiveTab('advanced')}
          className={`py-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-colors ${
            activeTab === 'advanced'
              ? 'bg-slate-800 text-slate-100 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Advanced Tone & Grain"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Tone</span>
        </button>
      </div>

      {/* Tab Panels Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* TAB 1: NEON TUBE */}
        {activeTab === 'tube' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Tube Geometry & Core
              </span>
              <button
                onClick={() => onResetPanel('tube')}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                title="Reset Tube"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* White Core Section - ভিতরের সাদা টিউব */}
            <div className="p-3 bg-slate-900/90 border border-cyan-500/30 rounded-lg space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-cyan-300 block">
                    ভিতরের সাদা টিউব (White Core Tube)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ভেতরের সাদা ইলেকট্রিক গ্যাস টিউবের থিকনেস ও দৃশ্যমানতা
                  </span>
                </div>
                <button
                  onClick={() => updateTube({ coreVisible: !settings.tube.coreVisible })}
                  className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                    settings.tube.coreVisible ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                  title="Toggle White Core Tube"
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-white transition-transform ${
                      settings.tube.coreVisible ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {settings.tube.coreVisible && (
                <>
                  {/* সাদা টিউব মোটা / চিকন করার প্রধান স্লাইডার */}
                  <div className="space-y-2 p-2.5 bg-slate-950/70 rounded border border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-200 font-medium">ভিতরের সাদা টিউবের থিকনেস (মোটা / চিকন)</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {((settings.tube.thickness * (settings.tube.coreWidth ?? 35)) / 100).toFixed(1)} px ({settings.tube.coreWidth}%)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="1"
                      value={settings.tube.coreWidth}
                      onChange={(e) => updateTube({ coreWidth: parseInt(e.target.value, 10) })}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      {[
                        { label: 'চিকন', pct: 15 },
                        { label: 'স্বাভাবিক', pct: 35 },
                        { label: 'মোটা', pct: 70 },
                        { label: 'সর্বোচ্চ', pct: 100 },
                      ].map((item) => (
                        <button
                          key={item.pct}
                          type="button"
                          onClick={() => updateTube({ coreWidth: item.pct })}
                          className={`text-[10px] py-1 px-1 rounded text-center transition-all ${
                            settings.tube.coreWidth === item.pct
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          {item.label} ({item.pct}%)
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">সাদা টিউবের উজ্জ্বলতা (Brightness)</span>
                      <span className="font-mono text-cyan-400">
                        {settings.tube.coreBrightness}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      value={settings.tube.coreBrightness}
                      onChange={(e) =>
                        updateTube({ coreBrightness: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Laser-Sharp Filament Core Toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <div>
                      <span className="text-[11px] font-medium text-slate-200 block">
                        Laser Filament (শার্প কোর)
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Pin-sharp zero-blur pure white core
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.tube.laserSharpCore !== false}
                      onChange={(e) => updateTube({ laserSharpCore: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </div>

                  {/* 3D Glass Tube Envelope Rim Toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <div>
                      <span className="text-[11px] font-medium text-slate-200 block">
                        3D Glass Rim (কাঁচের বর্ডার)
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {settings.tube.glassBorder === true
                          ? 'অন (টিউবের কিনারায় কালো রিম)'
                          : 'বন্ধ (কালো রিম ছাড়া পরিষ্কার নিওন)'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.tube.glassBorder === true}
                      onChange={(e) => updateTube({ glassBorder: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </div>

                  {/* Tube Edge Sharpness */}
                  <div className="space-y-1 pt-1 border-t border-slate-800/80">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Edge Sharpness</span>
                      <span className="font-mono text-cyan-400">
                        {settings.tube.edgeSharpness}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.tube.edgeSharpness}
                      onChange={(e) =>
                        updateTube({ edgeSharpness: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400">Core Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.tube.coreColor}
                        onChange={(e) => updateTube({ coreColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                      />
                      <span className="font-mono text-[11px] text-slate-300">
                        {settings.tube.coreColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Caps and Joins */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Line Cap</label>
                <select
                  value={settings.tube.lineCap}
                  onChange={(e) => updateTube({ lineCap: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                >
                  <option value="round">Round Cap</option>
                  <option value="square">Square Cap</option>
                  <option value="butt">Flat Butt</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Line Join</label>
                <select
                  value={settings.tube.lineJoin}
                  onChange={(e) => updateTube({ lineJoin: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                >
                  <option value="round">Round Join</option>
                  <option value="miter">Miter (Crisp)</option>
                  <option value="bevel">Bevel</option>
                </select>
              </div>
            </div>

            {/* Tube Brightness & Opacity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Tube Brightness</span>
                <span className="font-mono text-cyan-400">{settings.tube.tubeBrightness}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                value={settings.tube.tubeBrightness}
                onChange={(e) => updateTube({ tubeBrightness: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        )}

        {/* TAB 2: GLOW & BLOOM */}
        {activeTab === 'glow' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Multi-Layer Glow Engine
              </span>
              <button
                onClick={() => onResetPanel('glow')}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* HYPER-GLOW BLINDING RADIANCE HERO CARD */}
            <div className="p-3 bg-gradient-to-br from-cyan-950/40 via-purple-950/30 to-pink-950/40 border border-cyan-500/40 rounded-xl space-y-3 shadow-[0_0_18px_rgba(6,182,212,0.15)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Hyper-Glow Mode (চোখে জ্বলজ্বল)
                    </span>
                    <span className="text-[10px] text-cyan-300/80 block">
                      Blinding additive luminescence & optical halation
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => updateGlow({ hyperGlow: !(settings.glow.hyperGlow !== false) })}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    settings.glow.hyperGlow !== false
                      ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                      : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.glow.hyperGlow !== false ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Glow Power Multiplier */}
              <div className="space-y-1 pt-1 border-t border-cyan-900/40">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">Glow Multiplier (পাওয়ার গুণক)</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {(settings.glow.glowMultiplier ?? 1.8).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.5"
                  step="0.1"
                  value={settings.glow.glowMultiplier ?? 1.8}
                  onChange={(e) =>
                    updateGlow({ glowMultiplier: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Dazzle & Plasma Saturation Boost */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Dazzle Radiance (চোখ ধাঁধানো তীব্রতা)</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {settings.glow.dazzleBoost ?? 85}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.glow.dazzleBoost ?? 85}
                  onChange={(e) =>
                    updateGlow({ dazzleBoost: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Inner Glow Layer */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-200">Inner Glow (Near Tube)</span>
                <input
                  type="checkbox"
                  checked={settings.glow.innerGlowEnabled}
                  onChange={(e) => updateGlow({ innerGlowEnabled: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </div>
              {settings.glow.innerGlowEnabled && (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Radius</span>
                      <span className="font-mono text-cyan-400">
                        {settings.glow.innerGlowRadius} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="35"
                      value={settings.glow.innerGlowRadius}
                      onChange={(e) =>
                        updateGlow({ innerGlowRadius: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Intensity</span>
                      <span className="font-mono text-cyan-400">
                        {settings.glow.innerGlowIntensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={settings.glow.innerGlowIntensity}
                      onChange={(e) =>
                        updateGlow({ innerGlowIntensity: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Outer Glow Halo Layer */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-200">Outer Glow Halo</span>
                <input
                  type="checkbox"
                  checked={settings.glow.outerGlowEnabled}
                  onChange={(e) => updateGlow({ outerGlowEnabled: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </div>
              {settings.glow.outerGlowEnabled && (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Halo Radius</span>
                      <span className="font-mono text-cyan-400">
                        {settings.glow.outerGlowRadius} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      value={settings.glow.outerGlowRadius}
                      onChange={(e) =>
                        updateGlow({ outerGlowRadius: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Intensity</span>
                      <span className="font-mono text-cyan-400">
                        {settings.glow.outerGlowIntensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={settings.glow.outerGlowIntensity}
                      onChange={(e) =>
                        updateGlow({ outerGlowIntensity: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Wide Ambient Glow Layer */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-200">Wide Ambient Light</span>
                <input
                  type="checkbox"
                  checked={settings.glow.ambientGlowEnabled}
                  onChange={(e) => updateGlow({ ambientGlowEnabled: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </div>
              {settings.glow.ambientGlowEnabled && (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Spread Radius</span>
                      <span className="font-mono text-cyan-400">
                        {settings.glow.ambientGlowRadius} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="250"
                      value={settings.glow.ambientGlowRadius}
                      onChange={(e) =>
                        updateGlow({ ambientGlowRadius: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Intensity</span>
                      <span className="font-mono text-cyan-400">
                        {settings.glow.ambientGlowIntensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={settings.glow.ambientGlowIntensity}
                      onChange={(e) =>
                        updateGlow({ ambientGlowIntensity: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Optical Bloom */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Lens Bloom (লেন্স ব্লুম)</span>
                <span className="font-mono text-cyan-400">{settings.glow.bloomIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={settings.glow.bloomIntensity}
                onChange={(e) => updateGlow({ bloomIntensity: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        )}

        {/* TAB 3: COLOR & PALETTES */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Color & Gradient Mode
              </span>
              <button
                onClick={() => onResetPanel('color')}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Quick Swatches */}
            {/* Quick Swatches */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400">Single Gas Hue Swatches</span>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.name}
                    onClick={() =>
                      updateColor({
                        primaryColor: swatch.color,
                        glowColor: swatch.color,
                      })
                    }
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col items-center gap-1 transition-all"
                  >
                    <div
                      className="w-6 h-6 rounded-full shadow-sm"
                      style={{
                        backgroundColor: swatch.color,
                        boxShadow: `0 0 10px ${swatch.color}66`,
                      }}
                    />
                    <span className="text-[10px] text-slate-300 truncate max-w-full">
                      {swatch.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Harmonic Palettes for 100+ Lines (পারফেক্ট কালার কম্বিনেশন) */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Harmonic Palettes ({svgLayerCount > 0 ? `${svgLayerCount} Lines` : '100+ Lines'})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    পারফেক্ট কালার কম্বিনেশন (১০০+ লাইনের জন্য স্পেশাল)
                  </span>
                </div>
              </div>

              {/* Distribution Mode */}
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-md border border-slate-800 text-[10px]">
                <button
                  onClick={() => setPaletteMode('gradient')}
                  className={`py-1 rounded font-medium transition-colors ${
                    paletteMode === 'gradient'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Smooth Gradient Spectrum (১০০+ লাইনের জন্য শ্রেষ্ঠ)"
                >
                  Gradient
                </button>
                <button
                  onClick={() => setPaletteMode('cycle')}
                  className={`py-1 rounded font-medium transition-colors ${
                    paletteMode === 'cycle'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Cycle Palettes Alternating"
                >
                  Cycle
                </button>
                <button
                  onClick={() => setPaletteMode('grouped')}
                  className={`py-1 rounded font-medium transition-colors ${
                    paletteMode === 'grouped'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Grouped Bands"
                >
                  Grouped
                </button>
              </div>

              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {HARMONIC_NEON_PALETTES.map((pal) => (
                  <div
                    key={pal.id}
                    onClick={() => onApplyPalette && onApplyPalette(pal.colors, paletteMode)}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                        <span>{pal.bengaliName}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({pal.name})</span>
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyPalette && onApplyPalette(pal.colors, paletteMode);
                      }}
                      className="px-2 py-1 text-[10px] font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded shadow-sm transition-colors whitespace-nowrap"
                    >
                      Apply All
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mode: Single, Dual, Multi */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-xs text-slate-400">Color Mapping</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['single', 'dual', 'multi'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateColor({ colorMode: mode })}
                    className={`py-1 text-xs capitalize rounded transition-colors ${
                      settings.color.colorMode === mode
                        ? 'bg-slate-800 text-cyan-400 font-medium shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary & Secondary Color Pickers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Primary Tube Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.color.primaryColor}
                    onChange={(e) => updateColor({ primaryColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                  />
                  <input
                    type="text"
                    value={settings.color.primaryColor}
                    onChange={(e) => updateColor({ primaryColor: e.target.value })}
                    className="w-20 font-mono text-[11px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-200 uppercase"
                  />
                </div>
              </div>

              {settings.color.colorMode === 'dual' && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span>Secondary Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.color.secondaryColor}
                        onChange={(e) => updateColor({ secondaryColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent"
                      />
                      <input
                        type="text"
                        value={settings.color.secondaryColor}
                        onChange={(e) => updateColor({ secondaryColor: e.target.value })}
                        className="w-20 font-mono text-[11px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-200 uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs">
                      <span>Gradient Angle</span>
                      <span className="font-mono text-cyan-400">
                        {settings.color.gradientAngle}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={settings.color.gradientAngle}
                      onChange={(e) =>
                        updateColor({ gradientAngle: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Hue, Saturation, Brightness */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Hue Shift</span>
                  <span className="font-mono text-cyan-400">{settings.color.hueShift}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={settings.color.hueShift}
                  onChange={(e) => updateColor({ hueShift: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Saturation</span>
                  <span className="font-mono text-cyan-400">{settings.color.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={settings.color.saturation}
                  onChange={(e) => updateColor({ saturation: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ENVIRONMENT & BACKGROUND */}
        {activeTab === 'environment' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Wall & Background
              </span>
              <button
                onClick={() => onResetPanel('background')}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Background Texture Options */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Environment Preset</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'brick-wall', label: 'Dark Brick Wall' },
                  { id: 'concrete', label: 'Industrial Concrete' },
                  { id: 'dark-blue', label: 'Studio Navy' },
                  { id: 'dark-purple', label: 'Synthwave Purple' },
                  { id: 'charcoal', label: 'Charcoal Studio' },
                  { id: 'black', label: 'Pure Black' },
                  { id: 'transparent', label: 'Transparent (Alpha)' },
                  { id: 'custom-color', label: 'Custom Solid Color' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => updateBackground({ type: bg.id as BackgroundType })}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      settings.background.type === bg.id
                        ? 'bg-slate-800 border-cyan-500 text-cyan-300 font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Background Image Upload */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <input
                ref={customBgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCustomBgUpload}
              />
              <button
                onClick={() => customBgInputRef.current?.click()}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-slate-300 flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload Custom Wall Background Image</span>
              </button>
            </div>

            {/* Vignette & Contrast */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Wall Vignette</span>
                  <span className="font-mono text-cyan-400">{settings.background.vignette}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.background.vignette}
                  onChange={(e) =>
                    updateBackground({ vignette: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Wall Brightness</span>
                  <span className="font-mono text-cyan-400">{settings.background.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={settings.background.brightness}
                  onChange={(e) =>
                    updateBackground({ brightness: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: REALISM & MOUNTING */}
        {activeTab === 'realism' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Physical Realism
              </span>
              <button
                onClick={() => onResetPanel('realism')}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Wall Light Spill */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-200 block">
                    Ambient Light Spill
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Casts colored light across background wall
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.realism.lightSpill}
                  onChange={(e) => updateRealism({ lightSpill: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
              </div>

              {settings.realism.lightSpill && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Spill Intensity</span>
                    <span className="font-mono text-cyan-400">
                      {settings.realism.lightSpillIntensity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.realism.lightSpillIntensity}
                    onChange={(e) =>
                      updateRealism({ lightSpillIntensity: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              )}
            </div>

            {/* 3D Contact Shadow */}
            <div className="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  3D Contact Shadow (কালো শ্যাডো)
                </span>
                <span className="text-[10px] text-slate-400">
                  {settings.realism.contactShadows
                    ? 'অন (টিউবের পেছনে কালো ছায়া দৃশ্যমান)'
                    : 'বন্ধ (কালো ছায়া নিষ্ক্রিয়, সম্পূর্ণ পরিষ্কার ও ফুটন্ত নিওন)'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.realism.contactShadows}
                onChange={(e) => updateRealism({ contactShadows: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
            </div>

            {/* Wall Standoff Clamps */}
            <div className="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Metallic Standoff Mounts
                </span>
                <span className="text-[10px] text-slate-500">
                  Hardware clips securing tubes to wall
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.realism.wallMounts}
                onChange={(e) => updateRealism({ wallMounts: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
            </div>

            {/* Glass Tube Specular Reflection */}
            <div className="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Glass Cylindrical Highlight
                </span>
                <span className="text-[10px] text-slate-500">
                  Specular reflection along glass curvature
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.realism.glassHighlights}
                onChange={(e) => updateRealism({ glassHighlights: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
            </div>

            {/* Electrical Flicker */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-200 block">
                    Electrical Tube Flicker
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Live dynamic AC hum & micro-flicker
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.realism.flicker}
                  onChange={(e) => updateRealism({ flicker: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
              </div>

              {settings.realism.flicker && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Flicker Speed</span>
                    <span className="font-mono text-cyan-400">
                      {settings.realism.flickerSpeed}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.realism.flickerSpeed}
                    onChange={(e) =>
                      updateRealism({ flickerSpeed: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: ADVANCED TONE & GRAIN */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Tone Curves & Grain
              </span>
              <button
                onClick={() => onResetPanel('tone')}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Blend Mode */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Glow Blend Mode</label>
              <select
                value={settings.tone.blendMode}
                onChange={(e) => updateTone({ blendMode: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
              >
                <option value="screen">Screen (Soft, Realistic Light)</option>
                <option value="lighter">Lighter / Additive (High Energy)</option>
                <option value="color-dodge">Color-Dodge (Blinding Core)</option>
                <option value="source-over">Normal Alpha</option>
              </select>
            </div>

            {/* Film Grain */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Film Grain Noise</span>
                <span className="font-mono text-cyan-400">{settings.tone.grain}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={settings.tone.grain}
                onChange={(e) => updateTone({ grain: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[10px] text-slate-500 block">
                Adds analog photography camera grain.
              </span>
            </div>

            {/* Gamma */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Gamma Curve</span>
                <span className="font-mono text-cyan-400">{settings.tone.gamma.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={Math.round(settings.tone.gamma * 100)}
                onChange={(e) => updateTone({ gamma: parseInt(e.target.value, 10) / 100 })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Master Reset All */}
            <div className="pt-4 border-t border-slate-800/80">
              <button
                onClick={onResetSettings}
                className="w-full py-2 px-3 bg-red-950/20 hover:bg-red-950/40 border border-red-800/40 text-red-300 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Studio Settings to Defaults</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
