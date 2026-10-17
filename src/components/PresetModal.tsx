/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Bookmark, Plus, Trash2, Download, Upload, Check } from 'lucide-react';
import { NeonPreset, NeonSettings } from '../types/neon';
import {
  BUILT_IN_PRESETS,
  getCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
} from '../engine/presets';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: NeonSettings;
  onApplyPreset: (preset: NeonPreset) => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onApplyPreset,
}) => {
  const [customPresets, setCustomPresets] = useState<NeonPreset[]>(getCustomPresets());
  const [newPresetName, setNewPresetName] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    saveCustomPreset(newPresetName.trim(), currentSettings);
    setCustomPresets(getCustomPresets());
    setNewPresetName('');
    setIsSavingNew(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomPreset(id);
    setCustomPresets(getCustomPresets());
  };

  const handleSelect = (preset: NeonPreset) => {
    onApplyPreset(preset);
    setAppliedId(preset.id);
    setTimeout(() => {
      setAppliedId(null);
      onClose();
    }, 400);
  };

  const handleExportJson = () => {
    const allPresets = [...BUILT_IN_PRESETS, ...customPresets];
    const blob = new Blob([JSON.stringify(allPresets, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neon_sign_presets_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            parsed.forEach((p) => {
              if (p.name && p.settings) {
                saveCustomPreset(p.name, p.settings);
              }
            });
            setCustomPresets(getCustomPresets());
          }
        } catch {
          alert('Invalid presets JSON file.');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-white">Neon Effect Presets</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Save new preset section */}
          {isSavingNew ? (
            <form onSubmit={handleSave} className="p-3 bg-slate-950 border border-cyan-500/40 rounded-lg space-y-2">
              <span className="text-slate-200 font-medium block">Save Current Effect as Preset</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Midnight Cyberpunk Red"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  autoFocus
                  className="flex-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-cyan-400 text-slate-950 font-semibold rounded hover:bg-cyan-300 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingNew(false)}
                  className="px-2 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsSavingNew(true)}
              className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-850 border border-dashed border-slate-700 hover:border-cyan-500/60 rounded-lg text-slate-300 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Save Current Settings as New Preset</span>
            </button>
          )}

          {/* Built-in Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Built-In Studio Styles ({BUILT_IN_PRESETS.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BUILT_IN_PRESETS.map((preset) => {
                const isSelected = appliedId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelect(preset)}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg text-left flex items-start gap-3 transition-colors relative group"
                  >
                    <div
                      className="w-7 h-7 rounded-full shrink-0 mt-0.5"
                      style={{
                        backgroundColor: preset.previewColor,
                        boxShadow: `0 0 12px ${preset.previewColor}88`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-200 text-xs flex items-center justify-between">
                        <span>{preset.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {preset.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Presets */}
          {customPresets.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                My Custom Presets ({customPresets.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleSelect(preset)}
                    className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer flex items-start gap-3 transition-colors relative group"
                  >
                    <div
                      className="w-7 h-7 rounded-full shrink-0 mt-0.5"
                      style={{
                        backgroundColor: preset.previewColor,
                        boxShadow: `0 0 12px ${preset.previewColor}88`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-200 text-xs flex items-center justify-between">
                        <span>{preset.name}</span>
                        <button
                          onClick={(e) => handleDelete(preset.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                          title="Delete preset"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        Custom User Preset
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Import & Export JSON */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON</span>
            </button>
            <label className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-white cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-pink-400" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJson}
              />
            </label>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-300 hover:text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
