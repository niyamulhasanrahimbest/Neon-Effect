/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Download, Check, AlertCircle, FileImage, Layers } from 'lucide-react';
import { ExportFormat, ExportOptions } from '../engine/exportManager';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseWidth: number;
  baseHeight: number;
  fileName: string;
  isSvg: boolean;
  onExport: (options: ExportOptions) => Promise<{ success: boolean; error?: string }>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  baseWidth,
  baseHeight,
  fileName,
  isSvg,
  onExport,
}) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState<1 | 2 | 3>(1);
  const [quality, setQuality] = useState(0.92);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [svgGlowType, setSvgGlowType] = useState<'pure-vector' | 'filter'>('filter');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const targetWidth = Math.round(baseWidth * scale);
  const targetHeight = Math.round(baseHeight * scale);

  const cleanBaseName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

  const handleDownload = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    const result = await onExport({
      format,
      scale,
      quality,
      includeBackground,
      baseFileName: cleanBaseName || 'neon_sign',
      svgGlowType,
    });

    setIsExporting(false);
    if (result.success) {
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1500);
    } else {
      setExportError(result.error || 'Export failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Export Artwork</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          {/* Format selection */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Output Format</label>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(['png', 'jpeg', 'webp', 'svg'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => {
                    setFormat(fmt);
                    if (fmt === 'jpeg') setIncludeBackground(true);
                  }}
                  disabled={fmt === 'svg' && !isSvg}
                  className={`py-1.5 uppercase font-medium rounded transition-colors text-center ${
                    format === fmt
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : fmt === 'svg' && !isSvg
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={fmt === 'svg' && !isSvg ? 'SVG export is available for imported SVG vector paths' : ''}
                >
                  {fmt}
                </button>
              ))}
            </div>
            {format === 'svg' && (
              <div className="space-y-2 pt-1">
                <label className="text-slate-400 font-medium block">Vector Glow Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSvgGlowType('filter')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      svgGlowType === 'filter'
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 ring-1 ring-cyan-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-[11px] flex items-center gap-1">
                      {svgGlowType === 'filter' && <Check className="w-3 h-3 text-cyan-400" />}
                      <span>Photorealistic Glow</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                      প্রিভিউ এর সাথে হুবহু ১০০% সেইম অপটিক্যাল নিওন গ্লো ও ব্লুম।
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSvgGlowType('pure-vector')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      svgGlowType === 'pure-vector'
                        ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-[11px] flex items-center gap-1">
                      {svgGlowType === 'pure-vector' && <Check className="w-3 h-3 text-emerald-400" />}
                      <span>Pure Vector (No Filter)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                      জিরো ফিল্টার। Adobe Stock ও Shutterstock মাইক্রোস্টক অনুমোদনযোগ্য।
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scale selection */}
          {format !== 'svg' && (
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Resolution Multiplier</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 1, label: '1x (Original)' },
                  { value: 2, label: '2x (High-Res)' },
                  { value: 3, label: '3x (Ultra Print)' },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setScale(s.value as any)}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      scale === s.value
                        ? 'bg-slate-800 border-cyan-500 text-cyan-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Output Dimensions Calculator Card */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-slate-400">Target Resolution:</span>
              <span className="text-cyan-400 font-semibold tabular-nums">
                {targetWidth} × {targetHeight} px
              </span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-slate-400">Aspect Ratio:</span>
              <span className="text-slate-300">
                {(baseWidth / baseHeight).toFixed(2)} : 1 (Preserved)
              </span>
            </div>
          </div>

          {/* Transparency / Background Toggle */}
          {(format === 'png' || format === 'webp') && (
            <div className="flex items-center justify-between py-2 border-t border-slate-800">
              <div>
                <span className="text-slate-200 block font-medium">Include Wall Background</span>
                <span className="text-[11px] text-slate-500">
                  Turn off to export transparent PNG with alpha glow falloff
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeBackground}
                onChange={(e) => setIncludeBackground(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
            </div>
          )}

          {/* JPG Quality */}
          {format === 'jpeg' && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">JPEG Quality</span>
                <span className="font-mono text-cyan-400">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          )}

          {/* Error / Success message */}
          {exportError && (
            <div className="p-2.5 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}

          {exportSuccess && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Artwork exported and downloaded successfully!</span>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating Render...' : 'Download Image'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
