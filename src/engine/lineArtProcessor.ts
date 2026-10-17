/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InputMode, LineArtSettings } from '../types/neon';

export interface ImageAnalysis {
  hasAlpha: boolean;
  averageLuminance: number;
  suggestedMode: InputMode;
}

/**
 * Analyzes image pixel characteristics to determine whether it has transparency
 * or light/dark background, suggesting the best processing mode.
 */
export function analyzeImage(canvas: HTMLCanvasElement): ImageAnalysis {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { hasAlpha: false, averageLuminance: 128, suggestedMode: 'auto' };
  }

  // Sample up to 10,000 pixels evenly across the canvas for fast analysis
  const w = canvas.width;
  const h = canvas.height;
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 10000)));
  
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  let totalLuminance = 0;
  let transparentCount = 0;
  let sampleCount = 0;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      if (a < 240) {
        transparentCount++;
      }
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Rec. 601 perceived luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += lum;
      sampleCount++;
    }
  }

  const avgLuminance = sampleCount > 0 ? totalLuminance / sampleCount : 128;
  const alphaRatio = sampleCount > 0 ? transparentCount / sampleCount : 0;
  const hasAlpha = alphaRatio > 0.05;

  let suggestedMode: InputMode = 'dark-on-light';
  if (hasAlpha) {
    suggestedMode = 'transparent-line';
  } else if (avgLuminance > 140) {
    suggestedMode = 'dark-on-light';
  } else {
    suggestedMode = 'light-on-dark';
  }

  return {
    hasAlpha,
    averageLuminance: Math.round(avgLuminance),
    suggestedMode,
  };
}

/**
 * Extracts a pristine line mask from source image using the specified mode,
 * threshold, contrast, denoise, smoothing, and gap repair.
 */
export function extractLineMask(
  sourceCanvas: HTMLCanvasElement,
  settings: LineArtSettings
): HTMLCanvasElement {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  if (!maskCtx) return maskCanvas;

  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return maskCanvas;

  const srcData = srcCtx.getImageData(0, 0, w, h);
  const src = srcData.data;

  const outData = maskCtx.createImageData(w, h);
  const out = outData.data;

  // Determine effective mode
  let effectiveMode = settings.mode;
  if (effectiveMode === 'auto') {
    const analysis = analyzeImage(sourceCanvas);
    effectiveMode = analysis.suggestedMode;
  }

  // Pre-calculate contrast lookup
  const contrast = Math.max(-100, Math.min(100, settings.contrast));
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const threshold = settings.threshold;

  // Buffer to hold 1-byte raw intensity values for image operations
  const buffer: Uint8Array<any> = new Uint8Array(w * h);

  for (let i = 0, p = 0; i < src.length; i += 4, p++) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    const a = src[i + 3];

    let val = 0;

    if (effectiveMode === 'transparent-line') {
      // Use alpha channel + inverted darkness
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const strokeWeight = (255 - lum) / 255;
      val = Math.round(a * (0.5 + 0.5 * strokeWeight));
    } else if (effectiveMode === 'dark-on-light') {
      // Dark lines on light background (e.g. pencil sketch or black ink on white)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      val = 255 - lum; // Invert: darker pixels get higher intensity
    } else if (effectiveMode === 'light-on-dark') {
      // Light lines on dark background
      val = 0.299 * r + 0.587 * g + 0.114 * b;
    } else if (effectiveMode === 'colored-outline') {
      // Extract color saturation and edge variance
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC === 0 ? 0 : ((maxC - minC) / maxC) * 255;
      val = sat;
    }

    // Apply contrast
    if (contrast !== 0) {
      val = contrastFactor * (val - 128) + 128;
      val = Math.max(0, Math.min(255, val));
    }

    // Threshold cutoff with soft knee
    if (val < threshold - 20) {
      val = 0;
    } else if (val > threshold + 20) {
      val = 255;
    } else {
      // Smooth gradient across the 40-unit knee
      val = ((val - (threshold - 20)) / 40) * 255;
    }

    if (settings.invert) {
      val = 255 - val;
    }

    buffer[p] = Math.round(val);
  }

  // Step 2: Denoise pass (Median / min-filter to remove single pixel specks)
  let processed: Uint8Array<any> = buffer;
  if (settings.denoise > 0) {
    const denoiseRadius = Math.min(3, Math.ceil(settings.denoise / 3));
    processed = applyDenoise(processed, w, h, denoiseRadius);
  }

  // Step 3: Gap repair (Morphological closing: dilation then erosion)
  if (settings.gapRepair > 0) {
    const radius = settings.gapRepair;
    // Dilation
    const dilated = applyMorphology(processed, w, h, radius, 'dilate');
    // Erosion
    processed = applyMorphology(dilated, w, h, radius, 'erode');
  }

  // Step 4: Smoothing (Gaussian-like separable blur filter)
  if (settings.smoothing > 0) {
    processed = applySmoothing(processed, w, h, settings.smoothing);
  }

  // Copy to RGBA output (Pure white line mask with variable alpha)
  for (let p = 0, i = 0; p < buffer.length; p++, i += 4) {
    const alpha = processed[p];
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
    out[i + 3] = alpha;
  }

  maskCtx.putImageData(outData, 0, 0);
  return maskCanvas;
}

/**
 * 3x3 Denoise filter to eliminate speckle noise from scans and noisy outlines.
 */
function applyDenoise(buf: Uint8Array, w: number, h: number, radius: number): Uint8Array {
  const output = new Uint8Array(w * h);
  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      const idx = y * w + x;
      const center = buf[idx];
      if (center === 0) continue;

      let neighborCount = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (buf[(y + dy) * w + (x + dx)] > 40) {
            neighborCount++;
          }
        }
      }

      // If isolated speckle with very few neighboring line pixels, suppress it
      if (neighborCount <= (radius * 2)) {
        output[idx] = 0;
      } else {
        output[idx] = center;
      }
    }
  }
  return output;
}

/**
 * Morphological dilation or erosion for repairing broken sketch lines.
 */
function applyMorphology(
  buf: Uint8Array,
  w: number,
  h: number,
  radius: number,
  op: 'dilate' | 'erode'
): Uint8Array {
  const output = new Uint8Array(w * h);
  const isDilate = op === 'dilate';

  for (let y = 0; y < h; y++) {
    const yMin = Math.max(0, y - radius);
    const yMax = Math.min(h - 1, y + radius);

    for (let x = 0; x < w; x++) {
      const xMin = Math.max(0, x - radius);
      const xMax = Math.min(w - 1, x + radius);

      let targetVal = isDilate ? 0 : 255;

      for (let cy = yMin; cy <= yMax; cy++) {
        for (let cx = xMin; cx <= xMax; cx++) {
          const val = buf[cy * w + cx];
          if (isDilate) {
            if (val > targetVal) targetVal = val;
          } else {
            if (val < targetVal) targetVal = val;
          }
        }
      }
      output[y * w + x] = targetVal;
    }
  }
  return output;
}

/**
 * Fast 2-pass separable box/triangle smoothing filter.
 */
function applySmoothing(buf: Uint8Array, w: number, h: number, strength: number): Uint8Array {
  const radius = Math.min(5, Math.max(1, Math.round(strength / 2)));
  const temp = new Uint8Array(w * h);
  const output = new Uint8Array(w * h);

  // Horizontal pass
  for (let y = 0; y < h; y++) {
    const rowOffset = y * w;
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let k = -radius; k <= radius; k++) {
        const nx = x + k;
        if (nx >= 0 && nx < w) {
          sum += buf[rowOffset + nx];
          count++;
        }
      }
      temp[rowOffset + x] = Math.round(sum / count);
    }
  }

  // Vertical pass
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let sum = 0;
      let count = 0;
      for (let k = -radius; k <= radius; k++) {
        const ny = y + k;
        if (ny >= 0 && ny < h) {
          sum += temp[ny * w + x];
          count++;
        }
      }
      output[y * w + x] = Math.round(sum / count);
    }
  }

  return output;
}
