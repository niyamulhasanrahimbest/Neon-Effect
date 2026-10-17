/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RefreshCw, SplitSquareVertical } from 'lucide-react';

interface CanvasViewportProps {
  processedCanvas: HTMLCanvasElement | null;
  sourceCanvas: HTMLCanvasElement | null;
  maskCanvas: HTMLCanvasElement | null;
  renderVersion: number;
  previewMask: boolean;
  showOriginal: boolean;
  splitView: boolean;
  isTransparentBg: boolean;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  isRendering: boolean;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  processedCanvas,
  sourceCanvas,
  maskCanvas,
  renderVersion,
  previewMask,
  showOriginal,
  splitView,
  isTransparentBg,
  zoom,
  pan,
  onPanChange,
  onZoomChange,
  isRendering,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [splitPos, setSplitPos] = useState(0.5); // 0.0 to 1.0
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Redraw onto display canvas
  const drawDisplay = useCallback(() => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const base = processedCanvas || sourceCanvas;
    if (!base) {
      if (canvas.width !== 4000 || canvas.height !== 4000) {
        canvas.width = 4000;
        canvas.height = 4000;
      }
      ctx.clearRect(0, 0, 4000, 4000);
      ctx.fillStyle = '#07080c';
      ctx.fillRect(0, 0, 4000, 4000);
      return;
    }

    const w = base.width;
    const h = base.height;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // If mask preview is active, render mask in bright high-contrast color
    if (previewMask && maskCanvas) {
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      // Green/cyan mask preview tint
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0, w, h);
      ctx.restore();
      return;
    }

    // If showing original only
    if (showOriginal && sourceCanvas) {
      ctx.drawImage(sourceCanvas, 0, 0, w, h);
      return;
    }

    // If split view comparison is enabled
    if (splitView && sourceCanvas && processedCanvas) {
      const splitX = Math.round(w * splitPos);

      // Left side: original source
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, h);
      ctx.clip();
      ctx.drawImage(sourceCanvas, 0, 0, w, h);
      ctx.restore();

      // Right side: processed neon
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, w - splitX, h);
      ctx.clip();
      ctx.drawImage(processedCanvas, 0, 0, w, h);
      ctx.restore();

      // Divider line
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, h);
      ctx.stroke();
      return;
    }

    // Default: draw processed neon canvas
    if (processedCanvas) {
      ctx.drawImage(processedCanvas, 0, 0, w, h);
    } else if (sourceCanvas) {
      ctx.drawImage(sourceCanvas, 0, 0, w, h);
    }
  }, [processedCanvas, sourceCanvas, maskCanvas, renderVersion, previewMask, showOriginal, splitView, splitPos]);

  useEffect(() => {
    drawDisplay();
  }, [drawDisplay]);

  // Handle Pan Mouse Events
  const handleMouseDown = (e: React.MouseEvent) => {
    // If middle click or space held, or regular click on background
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSplit && displayCanvasRef.current) {
      const rect = displayCanvasRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;
      setSplitPos(Math.max(0.05, Math.min(0.95, relativeX)));
      return;
    }

    if (isDragging) {
      onPanChange({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingSplit(false);
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));
    onZoomChange(newZoom);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className={`relative flex-1 h-full overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
        isTransparentBg ? 'canvas-checkerboard' : 'bg-[#07080c]'
      }`}
    >
      {/* Canvas Wrapper with transform matrix */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.05s ease-out',
        }}
        className="relative shadow-2xl rounded-sm"
      >
        <canvas
          ref={displayCanvasRef}
          className="max-w-none block"
          style={{ imageRendering: zoom > 1.5 ? 'pixelated' : 'auto' }}
        />

        {/* Split View Interactive Handle overlay */}
        {splitView && displayCanvasRef.current && (
          <div
            style={{ left: `${splitPos * 100}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
            className="absolute top-0 bottom-0 -ml-3 w-6 flex items-center justify-center cursor-ew-resize z-20 group"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg transform active:scale-95 transition-transform">
              <SplitSquareVertical className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* Before / After Badges when active */}
      {showOriginal && (
        <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500/90 text-slate-950 text-xs font-bold rounded shadow-md pointer-events-none backdrop-blur-sm">
          ORIGINAL LINE ART
        </div>
      )}

      {splitView && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-3 py-1 bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 rounded-full pointer-events-none backdrop-blur-sm font-medium">
          <span className="text-amber-400">← Original Line Art</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400">Realistic Neon →</span>
        </div>
      )}

      {/* Rendering indicator */}
      {isRendering && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 text-xs text-cyan-400 rounded-md shadow-lg pointer-events-none backdrop-blur-sm">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Rendering Neon Engine...</span>
        </div>
      )}
    </div>
  );
};
