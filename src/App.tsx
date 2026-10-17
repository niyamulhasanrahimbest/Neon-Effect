/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { CanvasViewport } from './components/CanvasViewport';
import { StatusBar } from './components/StatusBar';
import { ExportModal } from './components/ExportModal';
import { PresetModal } from './components/PresetModal';
import {
  NeonSettings,
  ProcessedImageInfo,
  SvgPathLayer,
  NeonPreset,
} from './types/neon';
import { DEFAULT_SETTINGS } from './engine/presets';
import { parseSvgLayers, NEON_PALETTE } from './engine/svgParser';
import { parseEpsLayers } from './engine/epsParser';
import { analyzeImage, extractLineMask } from './engine/lineArtProcessor';
import { renderNeonScene } from './engine/neonRenderer';
import { exportArtwork, ExportOptions } from './engine/exportManager';
import {
  HARMONIC_NEON_PALETTES,
  applyPaletteToLayers,
  applyColorToSelectedLayers,
} from './engine/colorPalettes';

// Fixed artboard size: strictly 4000x4000 px
const ARTBOARD_SIZE = 4000;
// Fits any incoming artwork comfortably with adequate padding (75% content box = 3000px, leaving 500px padding on each side)
const CONTENT_FIT_RATIO = 0.75;
// Default zoom so that the 4000x4000 artboard fits cleanly in viewport
const DEFAULT_FIT_ZOOM = 0.18;

export default function App() {
  // Studio Settings State
  const [settings, setSettings] = useState<NeonSettings>(DEFAULT_SETTINGS);

  // Undo / Redo History
  const [history, setHistory] = useState<NeonSettings[]>([DEFAULT_SETTINGS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Artwork & Image State
  const [imageInfo, setImageInfo] = useState<ProcessedImageInfo | null>(null);
  const [sourceThumbnailUrl, setSourceThumbnailUrl] = useState<string>('');
  const [svgLayers, setSvgLayers] = useState<SvgPathLayer[]>([]);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [svgViewBox, setSvgViewBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>({ x: 0, y: 0, width: ARTBOARD_SIZE, height: ARTBOARD_SIZE });

  // Canvases
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderVersion, setRenderVersion] = useState(0);

  // Viewport Interaction State
  const [zoom, setZoom] = useState(DEFAULT_FIT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showOriginal, setShowOriginal] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [leftTab, setLeftTab] = useState<'source' | 'layers'>('source');

  // Modals & Status
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderTimeMs, setRenderTimeMs] = useState(12);
  const [error, setError] = useState<string | null>(null);

  // Flicker Animation Reference
  const animFrameRef = useRef<number | null>(null);
  const flickerTimerRef = useRef(0);

  // Push new settings to history with smooth real-time slider debounce
  const pushSettings = useCallback((newSettings: NeonSettings) => {
    setSettings(newSettings);
    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
    }
    historyDebounceRef.current = setTimeout(() => {
      setHistory((prev) => {
        const upToCurrent = prev.slice(0, historyIndex + 1);
        return [...upToCurrent, JSON.parse(JSON.stringify(newSettings))].slice(-25);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 24));
    }, 250);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setSettings(JSON.parse(JSON.stringify(history[nextIdx])));
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setSettings(JSON.parse(JSON.stringify(history[nextIdx])));
    }
  }, [historyIndex, history]);

  // Stable refs for callbacks to prevent infinite re-render loops
  const svgLayersRef = useRef<SvgPathLayer[]>(svgLayers);
  svgLayersRef.current = svgLayers;

  const svgViewBoxRef = useRef(svgViewBox);
  svgViewBoxRef.current = svgViewBox;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Load an SVG string into the studio (either as new project or appending new stroke layers)
  const loadSvgString = useCallback((svgString: string, fileName: string, isAppend: boolean = false) => {
    try {
      setError(null);
      const parsed = parseSvgLayers(svgString);

      // Compute fitted viewBox for the fixed 4000x4000 artboard with adequate padding (75% content box = 3000px, 500px padding all around)
      const origVb = parsed.viewBox;
      const origW = origVb.width || parsed.width || 1000;
      const origH = origVb.height || parsed.height || 1000;
      const origX = origVb.x || 0;
      const origY = origVb.y || 0;
      const maxOrigDim = Math.max(origW, origH);
      const boxDim = maxOrigDim / CONTENT_FIT_RATIO;
      const centerX = origX + origW / 2;
      const centerY = origY + origH / 2;
      const fittedViewBox = {
        x: centerX - boxDim / 2,
        y: centerY - boxDim / 2,
        width: boxDim,
        height: boxDim,
      };

      if (isAppend && svgLayersRef.current.length > 0) {
        // Offset stroke layer colors so each newly added stroke gets a distinct neon gas color
        const baseColorIdx = svgLayersRef.current.length;
        const coloredLayers = parsed.layers.map((l, i) => {
          const color = l.color || NEON_PALETTE[(baseColorIdx + i) % NEON_PALETTE.length];
          return {
            ...l,
            id: `svg-layer-${Date.now()}-${i}`,
            color,
            glowColor: color,
          };
        });

        setSvgLayers((prev) => [...prev, ...coloredLayers]);
        setLeftTab('layers');
        return;
      }

      setSvgLayers(parsed.layers);
      setSvgViewBox(fittedViewBox);
      setSelectedLayerIds([]);

      // Always fixed strictly to 4000x4000 px artboard
      setImageInfo({
        width: ARTBOARD_SIZE,
        height: ARTBOARD_SIZE,
        aspectRatio: 1,
        type: 'svg',
        fileName,
        fileSizeFormatted: `${(svgString.length / 1024).toFixed(1)} KB`,
        hasAlpha: true,
        averageLuminance: 128,
      });

      setPan({ x: 0, y: 0 });
      setZoom(DEFAULT_FIT_ZOOM);
      setLeftTab(parsed.layers.length > 0 ? 'layers' : 'source');

      // Create a raster source canvas fixed at 4000x4000 for comparison and fallback
      const canvas = document.createElement('canvas');
      canvas.width = ARTBOARD_SIZE;
      canvas.height = ARTBOARD_SIZE;
      const ctx = canvas.getContext('2d');

      // Use Data URL with URI encoding for 100% reliable SVG decoding across all iframes
      const dataUrl =
        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(parsed.sanitizedSvgString);

      const img = new Image();
      img.onload = () => {
        if (ctx) {
          ctx.clearRect(0, 0, ARTBOARD_SIZE, ARTBOARD_SIZE);
          const maxDim = Math.max(parsed.width, parsed.height);
          const scale = (ARTBOARD_SIZE * CONTENT_FIT_RATIO) / maxDim;
          const drawW = parsed.width * scale;
          const drawH = parsed.height * scale;
          const drawX = (ARTBOARD_SIZE - drawW) / 2;
          const drawY = (ARTBOARD_SIZE - drawH) / 2;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }
        sourceCanvasRef.current = canvas;
        setSourceThumbnailUrl(dataUrl);

        // If no discrete path layers were parsed (e.g. complex clipped shapes or text),
        // automatically generate a line mask from the rendered SVG canvas so it ALWAYS renders!
        if (parsed.layers.length === 0 && ctx) {
          maskCanvasRef.current = extractLineMask(canvas, settingsRef.current.lineArt);
          setRenderVersion((v) => v + 1);
        } else {
          maskCanvasRef.current = null;
        }
      };

      img.onerror = () => {
        // Fallback thumbnail
        setSourceThumbnailUrl(dataUrl);
      };

      img.src = dataUrl;
    } catch (err: any) {
      setError(`Failed to parse SVG: ${err.message || 'Malformed vector content'}`);
    }
  }, []);

  // Load an EPS file (Encapsulated PostScript)
  const loadEpsFile = useCallback((file: File, isAppend: boolean = false) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) return;
        const parsed = parseEpsLayers(buffer);

        // Compute fitted viewBox for the fixed 4000x4000 artboard with adequate padding
        const origVb = parsed.viewBox;
        const origW = origVb.width || parsed.width || 1000;
        const origH = origVb.height || parsed.height || 1000;
        const origX = origVb.x || 0;
        const origY = origVb.y || 0;
        const maxOrigDim = Math.max(origW, origH);
        const boxDim = maxOrigDim / CONTENT_FIT_RATIO;
        const centerX = origX + origW / 2;
        const centerY = origY + origH / 2;
        const fittedViewBox = {
          x: centerX - boxDim / 2,
          y: centerY - boxDim / 2,
          width: boxDim,
          height: boxDim,
        };

        if (isAppend && svgLayersRef.current.length > 0) {
          const baseColorIdx = svgLayersRef.current.length;
          const coloredLayers = parsed.layers.map((l, i) => {
            const color = l.color || NEON_PALETTE[(baseColorIdx + i) % NEON_PALETTE.length];
            return {
              ...l,
              id: `eps-layer-${Date.now()}-${i}`,
              name: l.name || `EPS Stroke ${baseColorIdx + i + 1}`,
              color,
              glowColor: color,
            };
          });

          setSvgLayers((prev) => [...prev, ...coloredLayers]);
          setLeftTab('layers');
          return;
        }

        setSvgLayers(parsed.layers);
        setSvgViewBox(fittedViewBox);
        setSelectedLayerIds([]);

        // Always fixed strictly to 4000x4000 px artboard
        setImageInfo({
          width: ARTBOARD_SIZE,
          height: ARTBOARD_SIZE,
          aspectRatio: 1,
          type: 'eps',
          fileName: file.name,
          fileSizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
          hasAlpha: true,
          averageLuminance: 128,
        });

        setPan({ x: 0, y: 0 });
        setZoom(DEFAULT_FIT_ZOOM);
        setLeftTab('layers');

        const canvas = document.createElement('canvas');
        canvas.width = ARTBOARD_SIZE;
        canvas.height = ARTBOARD_SIZE;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        const blob = new Blob([parsed.sanitizedSvgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        img.onload = () => {
          if (ctx) {
            ctx.clearRect(0, 0, ARTBOARD_SIZE, ARTBOARD_SIZE);
            const maxDim = Math.max(parsed.width, parsed.height);
            const scale = (ARTBOARD_SIZE * CONTENT_FIT_RATIO) / maxDim;
            const drawW = parsed.width * scale;
            const drawH = parsed.height * scale;
            const drawX = (ARTBOARD_SIZE - drawW) / 2;
            const drawY = (ARTBOARD_SIZE - drawH) / 2;
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
          }
          sourceCanvasRef.current = canvas;
          maskCanvasRef.current = null;
          setSourceThumbnailUrl(url);
        };
        img.src = url;
      } catch (err: any) {
        setError(`Failed to parse EPS file: ${err.message || 'Corrupt PostScript vector structure'}`);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // Load a single file (EPS, SVG, or raster)
  const loadSingleFile = useCallback((file: File, isAppend: boolean = false) => {
    setError(null);
    const fileName = file.name.toLowerCase();

    // 1. EPS Vector
    if (fileName.endsWith('.eps') || file.type.includes('postscript')) {
      loadEpsFile(file, isAppend);
      return;
    }

    // 2. SVG Vector
    if (fileName.endsWith('.svg') || file.type.includes('svg') || file.type.includes('xml')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text && (text.includes('<svg') || fileName.endsWith('.svg'))) {
          loadSvgString(text, file.name, isAppend);
        } else {
          setError(`File "${file.name}" does not contain valid SVG markup.`);
        }
      };
      reader.onerror = () => {
        setError(`Failed to read SVG file "${file.name}".`);
      };
      reader.readAsText(file);
      return;
    }

    // 3. Raster Image (PNG, JPG, WebP)
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (w === 0 || h === 0) {
          setError('Corrupt image: zero dimensions.');
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = ARTBOARD_SIZE;
        canvas.height = ARTBOARD_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Scale and center raster onto fixed 4000x4000 artboard with adequate padding
        const maxDim = Math.max(w, h);
        const scale = (ARTBOARD_SIZE * CONTENT_FIT_RATIO) / maxDim;
        const drawW = w * scale;
        const drawH = h * scale;
        const drawX = (ARTBOARD_SIZE - drawW) / 2;
        const drawY = (ARTBOARD_SIZE - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        sourceCanvasRef.current = canvas;
        setSourceThumbnailUrl(dataUrl);

        const analysis = analyzeImage(canvas);

        setImageInfo({
          width: ARTBOARD_SIZE,
          height: ARTBOARD_SIZE,
          aspectRatio: 1,
          type: 'raster',
          fileName: file.name,
          fileSizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
          hasAlpha: analysis.hasAlpha,
          averageLuminance: analysis.averageLuminance,
        });

        if (!isAppend) {
          setSvgLayers([]);
          setSelectedLayerIds([]);
          setLeftTab('source');
        }

        setSettings((prev) => ({
          ...prev,
          lineArt: {
            ...prev.lineArt,
            mode: analysis.suggestedMode,
          },
        }));

        setPan({ x: 0, y: 0 });
        setZoom(DEFAULT_FIT_ZOOM);
        maskCanvasRef.current = extractLineMask(canvas, settingsRef.current.lineArt);
        setRenderVersion((v) => v + 1);
      };
      img.onerror = () => {
        setError('Failed to decode image file.');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [loadEpsFile, loadSvgString]);

  // Open multiple files (First file opens as base, others append as separated stroke layers)
  const handleOpenFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Load first file as base
    loadSingleFile(fileArray[0], false);

    // If multiple files selected, append subsequent files as layers
    for (let i = 1; i < fileArray.length; i++) {
      setTimeout(() => {
        loadSingleFile(fileArray[i], true);
      }, i * 150);
    }
  }, [loadSingleFile]);

  // Add one or more stroke layers to the existing design
  const handleAddStrokeLayers = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    fileArray.forEach((file, i) => {
      setTimeout(() => {
        loadSingleFile(file, true);
      }, i * 150);
    });
  }, [loadSingleFile]);


  // Main Render Routine
  const renderScene = useCallback((flickerOffset: number = 0) => {
    if (!imageInfo) return;

    if (!processedCanvasRef.current) {
      processedCanvasRef.current = document.createElement('canvas');
    }

    const t0 = performance.now();
    renderNeonScene(processedCanvasRef.current, {
      sourceMaskCanvas: maskCanvasRef.current,
      svgLayers: svgLayers.length > 0 ? svgLayers : undefined,
      svgViewBox: svgViewBox,
      width: imageInfo.width,
      height: imageInfo.height,
      settings,
      flickerOffset,
      isPreview: false,
    });

    const elapsed = Math.round(performance.now() - t0);
    if (flickerOffset === 0) {
      setRenderTimeMs(elapsed);
    }
    setRenderVersion((v) => v + 1);
  }, [imageInfo, svgLayers, svgViewBox, settings]);

  // Animation Frame Render Scheduler for 60fps buttery-smooth real-time slider responsiveness
  const rafRenderRef = useRef<number | null>(null);
  const scheduleRender = useCallback(() => {
    if (rafRenderRef.current !== null) {
      cancelAnimationFrame(rafRenderRef.current);
    }
    rafRenderRef.current = requestAnimationFrame(() => {
      rafRenderRef.current = null;
      renderScene(0);
    });
  }, [renderScene]);

  // Cache key to only re-extract raster line mask when extraction parameters actually change
  const lastExtractedLineArtRef = useRef<string>('');

  // Re-extract mask only when needed, and schedule rendering via requestAnimationFrame
  useEffect(() => {
    if (!imageInfo) return;

    if (imageInfo.type === 'raster' && sourceCanvasRef.current) {
      const lineArtKey = JSON.stringify(settings.lineArt);
      if (lastExtractedLineArtRef.current !== lineArtKey) {
        maskCanvasRef.current = extractLineMask(sourceCanvasRef.current, settings.lineArt);
        lastExtractedLineArtRef.current = lineArtKey;
      }
    }

    scheduleRender();

    return () => {
      if (rafRenderRef.current !== null) {
        cancelAnimationFrame(rafRenderRef.current);
        rafRenderRef.current = null;
      }
    };
  }, [imageInfo, settings, svgLayers, svgViewBox, scheduleRender]);

  // Electrical Flicker Animation Loop
  useEffect(() => {
    if (!settings.realism.flicker) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    const loop = () => {
      if (!isSubscribed) return;
      flickerTimerRef.current += 0.05;
      renderScene(flickerTimerRef.current);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [settings.realism.flicker, renderScene]);

  // Keyboard Shortcuts (Undo, Redo, Zoom, Fit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setZoom((z) => Math.min(5, z * 1.15));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom((z) => Math.max(0.1, z * 0.85));
      } else if (e.key === '0') {
        e.preventDefault();
        setZoom(DEFAULT_FIT_ZOOM);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Preset Selection
  const handleApplyPreset = (preset: NeonPreset) => {
    pushSettings(preset.settings);
  };

  // Handle partial settings update
  const handleUpdateSettings = (updates: Partial<NeonSettings>) => {
    // If tube thickness is updated, synchronize all layers cleanly
    if (updates.tube?.thickness !== undefined) {
      const newThickness = updates.tube.thickness;
      setSvgLayers((prev) => prev.map((l) => ({ ...l, thickness: newThickness })));
    }
    // If white tube core thickness is updated, synchronize all layers cleanly
    if (updates.tube?.coreWidth !== undefined) {
      const newCoreWidth = updates.tube.coreWidth;
      setSvgLayers((prev) => prev.map((l) => ({ ...l, coreWidth: newCoreWidth })));
    }
    pushSettings({
      ...settings,
      ...updates,
    });
  };

  // Synchronize thickness across ALL lines simultaneously
  const handleUpdateAllLayersThickness = (newThickness: number) => {
    setSettings((prev) => ({
      ...prev,
      tube: { ...prev.tube, thickness: newThickness },
    }));
    setSvgLayers((prev) =>
      prev.map((l) => ({ ...l, thickness: newThickness }))
    );
  };

  // Synchronize white tube thickness across ALL lines simultaneously
  const handleUpdateAllLayersCoreWidth = (newCoreWidth: number) => {
    setSettings((prev) => ({
      ...prev,
      tube: { ...prev.tube, coreWidth: newCoreWidth },
    }));
    setSvgLayers((prev) =>
      prev.map((l) => ({ ...l, coreWidth: newCoreWidth }))
    );
  };

  // Reset Individual Panel
  const handleResetPanel = (panelKey: keyof NeonSettings) => {
    pushSettings({
      ...settings,
      [panelKey]: DEFAULT_SETTINGS[panelKey],
    });
  };

  // Reset All Settings
  const handleResetAllSettings = () => {
    pushSettings(DEFAULT_SETTINGS);
  };

  // SVG / EPS Stroke Layer Operations
  const handleUpdateSvgLayer = (layerId: string, updates: Partial<SvgPathLayer>) => {
    // When changing a line's thickness, all lines scale simultaneously
    if (updates.thickness !== undefined) {
      const newThickness = updates.thickness;
      setSvgLayers((prev) =>
        prev.map((l) =>
          l.id === layerId
            ? { ...l, ...updates, thickness: newThickness }
            : { ...l, thickness: newThickness }
        )
      );
      setSettings((prev) => ({
        ...prev,
        tube: { ...prev.tube, thickness: newThickness },
      }));
    } else if (updates.coreWidth !== undefined) {
      // When changing white tube thickness, all lines scale simultaneously
      const newCoreWidth = updates.coreWidth;
      setSvgLayers((prev) =>
        prev.map((l) =>
          l.id === layerId
            ? { ...l, ...updates, coreWidth: newCoreWidth }
            : { ...l, coreWidth: newCoreWidth }
        )
      );
      setSettings((prev) => ({
        ...prev,
        tube: { ...prev.tube, coreWidth: newCoreWidth },
      }));
    } else {
      setSvgLayers((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, ...updates } : l))
      );
    }
  };

  const handleDeleteSvgLayer = (layerId: string) => {
    setSvgLayers((prev) => prev.filter((l) => l.id !== layerId));
    setSelectedLayerIds((prev) => prev.filter((id) => id !== layerId));
  };

  const handleReorderSvgLayer = (layerId: string, direction: 'up' | 'down') => {
    setSvgLayers((prev) => {
      const index = prev.findIndex((l) => l.id === layerId);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Multi-Path Selection Handlers
  const handleToggleSelectLayer = (layerId: string) => {
    setSelectedLayerIds((prev) =>
      prev.includes(layerId) ? prev.filter((id) => id !== layerId) : [...prev, layerId]
    );
  };

  const handleSelectAllLayers = () => {
    setSelectedLayerIds(svgLayers.map((l) => l.id));
  };

  const handleDeselectAllLayers = () => {
    setSelectedLayerIds([]);
  };

  const handleSelectLayersByColor = (color: string) => {
    const matching = svgLayers.filter(
      (l) => l.color?.toLowerCase() === color.toLowerCase()
    );
    setSelectedLayerIds(matching.map((l) => l.id));
  };

  const handleInvertSelection = () => {
    const currentSet = new Set(selectedLayerIds);
    setSelectedLayerIds(svgLayers.filter((l) => !currentSet.has(l.id)).map((l) => l.id));
  };

  // Assign the exact same color to all selected paths (e.g. bird legs)
  const handleApplyColorToSelected = (color: string, glowColor?: string) => {
    if (selectedLayerIds.length === 0) return;
    setSvgLayers((prev) =>
      applyColorToSelectedLayers(prev, selectedLayerIds, color, glowColor)
    );
  };

  const handleDeleteSelectedLayers = () => {
    if (selectedLayerIds.length === 0) return;
    const toDelete = new Set(selectedLayerIds);
    setSvgLayers((prev) => prev.filter((l) => !toDelete.has(l.id)));
    setSelectedLayerIds([]);
  };

  const handleToggleVisibilitySelected = () => {
    if (selectedLayerIds.length === 0) return;
    const targetSet = new Set(selectedLayerIds);
    const anyVisible = svgLayers.some((l) => targetSet.has(l.id) && l.visible);
    setSvgLayers((prev) =>
      prev.map((l) => (targetSet.has(l.id) ? { ...l, visible: !anyVisible } : l))
    );
  };

  // Auto-assign rainbow neon gas colors to each separated stroke layer
  const handleAutoColorLayers = () => {
    setSvgLayers((prev) =>
      prev.map((layer, idx) => {
        const color = NEON_PALETTE[idx % NEON_PALETTE.length];
        return {
          ...layer,
          color,
          glowColor: color,
        };
      })
    );
  };

  // Apply curated color combination palette across all layers or selected layers
  const handleApplyColorPalette = (
    paletteColors: string[],
    mode: 'cycle' | 'gradient' | 'grouped' = 'gradient',
    onlySelected: boolean = false
  ) => {
    if (svgLayers.length > 0) {
      const targets =
        onlySelected && selectedLayerIds.length > 0 ? selectedLayerIds : undefined;
      setSvgLayers((prev) => applyPaletteToLayers(prev, paletteColors, mode, targets));
    }
    if (!onlySelected && paletteColors.length >= 2) {
      handleUpdateSettings({
        color: {
          ...settings.color,
          colorMode: 'multi',
          primaryColor: paletteColors[0],
          secondaryColor: paletteColors[1],
          glowColor: paletteColors[0],
        },
      });
    }
  };

  // Drag and drop onto the window
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleOpenFiles(e.dataTransfer.files);
    }
  };

  // Export Artwork handler
  const handleExport = async (options: ExportOptions) => {
    if (!imageInfo) return { success: false, error: 'No active artwork.' };

    return await exportArtwork(
      maskCanvasRef.current,
      svgLayers.length > 0 ? svgLayers : undefined,
      svgViewBox,
      imageInfo.width,
      imageInfo.height,
      settings,
      options
    );
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#090a0f] text-slate-200"
    >
      {/* Top Toolbar */}
      <Toolbar
        onOpenFile={handleOpenFiles}
        onAddStrokeLayer={handleAddStrokeLayers}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(5, z * 1.2))}
        onZoomOut={() => setZoom((z) => Math.max(0.05, z * 0.8))}
        onFitCanvas={() => {
          setZoom(DEFAULT_FIT_ZOOM);
          setPan({ x: 0, y: 0 });
        }}
        splitView={splitView}
        onToggleSplitView={() => setSplitView((v) => !v)}
        showOriginal={showOriginal}
        onToggleShowOriginal={() => setShowOriginal((v) => !v)}
        flicker={settings.realism.flicker}
        onToggleFlicker={() =>
          pushSettings({
            ...settings,
            realism: { ...settings.realism, flicker: !settings.realism.flicker },
          })
        }
        hyperGlow={settings.glow.hyperGlow !== false}
        onToggleHyperGlow={() =>
          pushSettings({
            ...settings,
            glow: {
              ...settings.glow,
              hyperGlow: !(settings.glow.hyperGlow !== false),
              glowMultiplier:
                settings.glow.hyperGlow !== false ? 1.0 : (settings.glow.glowMultiplier || 1.8),
            },
          })
        }
        onOpenPresets={() => setPresetModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
      />

      {/* Main Studio Workspace (Left Panel, Center Viewport, Right Panel) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Line Art & Stroke Layers */}
        <LeftPanel
          imageInfo={imageInfo}
          lineArtSettings={settings.lineArt}
          onUpdateLineArt={(updates) =>
            pushSettings({
              ...settings,
              lineArt: { ...settings.lineArt, ...updates },
            })
          }
          onResetLineArt={() =>
            pushSettings({
              ...settings,
              lineArt: DEFAULT_SETTINGS.lineArt,
            })
          }
          svgLayers={svgLayers}
          svgViewBox={svgViewBox}
          selectedLayerIds={selectedLayerIds}
          onToggleSelectLayer={handleToggleSelectLayer}
          onSelectAllLayers={handleSelectAllLayers}
          onDeselectAllLayers={handleDeselectAllLayers}
          onSelectLayersByColor={handleSelectLayersByColor}
          onInvertSelection={handleInvertSelection}
          onApplyColorToSelected={handleApplyColorToSelected}
          onDeleteSelectedLayers={handleDeleteSelectedLayers}
          onToggleVisibilitySelected={handleToggleVisibilitySelected}
          currentThickness={settings.tube.thickness}
          onUpdateAllLayersThickness={handleUpdateAllLayersThickness}
          currentCoreWidth={settings.tube.coreWidth ?? 35}
          onUpdateAllLayersCoreWidth={handleUpdateAllLayersCoreWidth}
          onUpdateSvgLayer={handleUpdateSvgLayer}
          onDeleteSvgLayer={handleDeleteSvgLayer}
          onReorderSvgLayer={handleReorderSvgLayer}
          onAutoColorLayers={handleAutoColorLayers}
          onApplyPalette={handleApplyColorPalette}
          onAddStrokeLayer={handleAddStrokeLayers}
          activeTab={leftTab}
          onTabChange={setLeftTab}
          sourceThumbnailUrl={sourceThumbnailUrl}
        />

        {/* Center Canvas Viewport */}
        <CanvasViewport
          processedCanvas={processedCanvasRef.current}
          sourceCanvas={sourceCanvasRef.current}
          maskCanvas={maskCanvasRef.current}
          renderVersion={renderVersion}
          previewMask={settings.lineArt.previewMask}
          showOriginal={showOriginal}
          splitView={splitView}
          isTransparentBg={settings.background.type === 'transparent'}
          zoom={zoom}
          pan={pan}
          onPanChange={setPan}
          onZoomChange={setZoom}
          isRendering={isRendering}
        />

        {/* Right Panel: Effect Controls */}
        <RightPanel
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetSettings={handleResetAllSettings}
          onResetPanel={handleResetPanel}
          onApplyPalette={handleApplyColorPalette}
          svgLayerCount={svgLayers.length}
        />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        imageInfo={imageInfo}
        zoom={zoom}
        renderTimeMs={renderTimeMs}
        isRendering={isRendering}
        error={error}
        svgLayerCount={svgLayers.length}
        selectedCount={selectedLayerIds.length}
      />

      {/* Modals */}
      <PresetModal
        isOpen={presetModalOpen}
        onClose={() => setPresetModalOpen(false)}
        currentSettings={settings}
        onApplyPreset={handleApplyPreset}
      />

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        baseWidth={imageInfo?.width || 500}
        baseHeight={imageInfo?.height || 500}
        fileName={imageInfo?.fileName || 'neon_sign'}
        isSvg={imageInfo?.type === 'svg' || imageInfo?.type === 'eps'}
        onExport={handleExport}
      />
    </div>
  );
}
