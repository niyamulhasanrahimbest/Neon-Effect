/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NeonSettings, SvgPathLayer } from '../types/neon';
import { renderBackground, renderContactShadow, renderStandoffClips } from './proceduralBackgrounds';

export interface RenderOptions {
  sourceMaskCanvas?: HTMLCanvasElement | null;
  svgLayers?: SvgPathLayer[];
  svgViewBox?: { x: number; y: number; width: number; height: number };
  width: number;
  height: number;
  settings: NeonSettings;
  flickerOffset?: number; // 0 to 1 for live flicker animation
  customBackgroundImage?: HTMLImageElement | null;
  isPreview?: boolean;
}

// Reusable scratch canvases to eliminate multi-megabyte garbage collection lag during slider drags
const scratchCanvases: Record<string, HTMLCanvasElement> = {};

function getScratchCanvas(key: string, w: number, h: number): HTMLCanvasElement {
  let c = scratchCanvases[key];
  if (!c) {
    c = document.createElement('canvas');
    scratchCanvases[key] = c;
  }
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  return c;
}

/**
 * Safely renders a blurred image onto destination context without exceeding browser GPU blur caps.
 * For large radii, uses bloom downsampling to ensure smooth, unclipped bloom on any resolution (4000x4000, 8000x8000).
 */
function drawSafeBlur(
  dstCtx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number,
  blurRadius: number,
  alpha: number
) {
  if (blurRadius <= 0 || alpha <= 0) return;
  const safeAlpha = Math.min(1.0, Math.max(0, alpha));

  if (blurRadius <= 60) {
    dstCtx.save();
    dstCtx.globalAlpha = safeAlpha;
    dstCtx.filter = `blur(${Math.max(1, Math.round(blurRadius))}px)`;
    dstCtx.drawImage(image, 0, 0, width, height);
    dstCtx.restore();
    return;
  }

  // Downsample factor (2x, 4x, or 8x) so GPU blur kernel stays safely under 60px
  const downsample = blurRadius > 240 ? 8 : blurRadius > 120 ? 4 : 2;
  const sw = Math.max(32, Math.round(width / downsample));
  const sh = Math.max(32, Math.round(height / downsample));
  const bloomCanvas = getScratchCanvas(`bloom_${downsample}`, sw, sh);
  const bCtx = bloomCanvas.getContext('2d');
  if (!bCtx) return;

  bCtx.clearRect(0, 0, sw, sh);
  bCtx.imageSmoothingEnabled = true;
  bCtx.imageSmoothingQuality = 'high';
  bCtx.filter = `blur(${Math.max(1, Math.round(blurRadius / downsample))}px)`;
  bCtx.drawImage(image, 0, 0, sw, sh);

  dstCtx.save();
  dstCtx.imageSmoothingEnabled = true;
  dstCtx.imageSmoothingQuality = 'high';
  dstCtx.globalAlpha = safeAlpha;
  dstCtx.drawImage(bloomCanvas, 0, 0, width, height);
  dstCtx.restore();
}

/**
 * Converts Hex string to RGB components.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!hex) return { r: 0, g: 243, b: 255 };
  const str = hex.trim();
  if (str.startsWith('rgb')) {
    const match = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (match) {
      return {
        r: Math.max(0, Math.min(255, parseInt(match[1], 10))),
        g: Math.max(0, Math.min(255, parseInt(match[2], 10))),
        b: Math.max(0, Math.min(255, parseInt(match[3], 10))),
      };
    }
  }
  let c = str.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 0, g: 243, b: 255 }; // fallback cyan
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Adjusts color with hue shift (-180..180), saturation (0..2), and brightness (0..2).
 */
export function adjustColor(
  hex: string,
  hueShift: number,
  satFactor: number,
  brightFactor: number
): string {
  const { r, g, b } = hexToRgb(hex);

  // RGB to HSL
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rf: h = (gf - bf) / d + (gf < bf ? 6 : 0); break;
      case gf: h = (bf - rf) / d + 2; break;
      case bf: h = (rf - gf) / d + 4; break;
    }
    h /= 6;
  }

  // Adjust
  h = (h * 360 + hueShift) % 360;
  if (h < 0) h += 360;
  h /= 360;

  s = Math.max(0, Math.min(1, s * (satFactor / 100)));
  const adjustedL = Math.max(0, Math.min(1, l * (brightFactor / 100)));

  // HSL to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let ro: number, go: number, bo: number;
  if (s === 0) {
    ro = go = bo = adjustedL;
  } else {
    const q = adjustedL < 0.5 ? adjustedL * (1 + s) : adjustedL + s - adjustedL * s;
    const p = 2 * adjustedL - q;
    ro = hue2rgb(p, q, h + 1 / 3);
    go = hue2rgb(p, q, h);
    bo = hue2rgb(p, q, h - 1 / 3);
  }

  return `rgb(${Math.round(ro * 255)}, ${Math.round(go * 255)}, ${Math.round(bo * 255)})`;
}

/**
 * Derives a luminous pastel tint of a neon gas color to create a natural volumetric core gradient.
 */
export function getCoreTint(hexOrRgb: string): string {
  const { r, g, b } = hexToRgb(hexOrRgb);
  // Blend 65% towards pure white for the inner volumetric plasma
  const tr = Math.round(r + (255 - r) * 0.65);
  const tg = Math.round(g + (255 - g) * 0.65);
  const tb = Math.round(b + (255 - b) * 0.65);
  return `rgb(${tr}, ${tg}, ${tb})`;
}

/**
 * Creates linear gradient across the canvas based on user angle.
 */
function createNeonColorGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color1: string,
  color2: string,
  angleDeg: number
): CanvasGradient {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  const length = Math.sqrt(width * width + height * height) / 2;

  const x1 = cx - Math.cos(angleRad) * length;
  const y1 = cy - Math.sin(angleRad) * length;
  const x2 = cx + Math.cos(angleRad) * length;
  const y2 = cy + Math.sin(angleRad) * length;

  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  return grad;
}

/**
 * Main neon rendering engine.
 * Renders into the provided canvas with all composited physical layers.
 */
export function renderNeonScene(
  targetCanvas: HTMLCanvasElement,
  options: RenderOptions
) {
  const {
    sourceMaskCanvas,
    svgLayers,
    svgViewBox,
    width,
    height,
    settings,
    flickerOffset = 0,
    customBackgroundImage,
    isPreview = false,
  } = options;

  targetCanvas.width = width;
  targetCanvas.height = height;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  // 1. Calculate colors with adjustments
  const primaryColor = adjustColor(
    settings.color.primaryColor,
    settings.color.hueShift,
    settings.color.saturation,
    settings.color.brightness
  );

  const secondaryColor = adjustColor(
    settings.color.secondaryColor,
    settings.color.hueShift,
    settings.color.saturation,
    settings.color.brightness
  );

  const glowColor = settings.color.syncGlowColor
    ? primaryColor
    : adjustColor(
        settings.color.glowColor,
        settings.color.hueShift,
        settings.color.saturation,
        settings.color.brightness
      );

  // Flicker factor calculation
  let flickerFactor = 1;
  if (settings.realism.flicker && flickerOffset > 0) {
    // Subtle realistic tube vibration + occasional dip
    const noise = Math.sin(flickerOffset * 40 * settings.realism.flickerSpeed) * 0.08;
    const microDip = Math.sin(flickerOffset * 17) > 0.85 ? -0.22 : 0;
    flickerFactor = Math.max(0.15, Math.min(1.15, 1 + noise + microDip));
  }

  // Proportional resolution scale relative to 500px base preset
  const resScale = Math.max(1, Math.min(width, height) / 500);

  const scaledSettings: NeonSettings = {
    ...settings,
    tube: {
      ...settings.tube,
      thickness: settings.tube.thickness * resScale,
    },
    glow: {
      ...settings.glow,
      innerGlowRadius: settings.glow.innerGlowRadius * resScale,
      outerGlowRadius: settings.glow.outerGlowRadius * resScale,
      ambientGlowRadius: settings.glow.ambientGlowRadius * resScale,
    },
  };

  // 2. Render Background Pass
  renderBackground(ctx, width, height, settings.background, customBackgroundImage);

  // Prepare a dedicated scratch canvas that holds crisp line strokes
  const strokeCanvas = getScratchCanvas('strokeCanvas', width, height);
  const strokeCtx = strokeCanvas.getContext('2d');
  if (!strokeCtx) return;

  const hasSvgLayers = svgLayers && svgLayers.length > 0;

  // Standoff anchor points accumulator for realism mounts
  const standoffAnchors: { x: number; y: number }[] = [];
  // Corner vertices for optical starburst lens flares
  const cornerVertices: { x: number; y: number; color: string }[] = [];

  if (hasSvgLayers) {
    // Render SVG path layers with vector precision
    renderSvgStrokesToCanvas(
      strokeCtx,
      width,
      height,
      svgLayers,
      svgViewBox || { x: 0, y: 0, width, height },
      scaledSettings,
      primaryColor,
      secondaryColor,
      standoffAnchors,
      cornerVertices
    );
  } else if (sourceMaskCanvas) {
    // Render raster line mask
    renderRasterMaskToStrokeCanvas(
      strokeCtx,
      width,
      height,
      sourceMaskCanvas,
      scaledSettings,
      primaryColor,
      secondaryColor,
      standoffAnchors,
      cornerVertices
    );
  }

  // 3. Render Light Spill onto Wall (if realism light spill is enabled)
  if (scaledSettings.realism.lightSpill && scaledSettings.background.type !== 'transparent') {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const spillAlpha = (scaledSettings.realism.lightSpillIntensity / 100) * 0.55 * flickerFactor;
    const spillRadius = Math.max(1, Math.round(scaledSettings.glow.ambientGlowRadius * 1.4));
    drawSafeBlur(ctx, strokeCanvas, width, height, spillRadius, spillAlpha);
    ctx.restore();
  }

  // 4. Render Contact Shadow behind neon tube
  if (scaledSettings.realism.contactShadows && scaledSettings.background.type !== 'transparent') {
    renderContactShadow(
      ctx,
      strokeCanvas,
      5 * resScale,
      9 * resScale,
      Math.max(1, Math.round(10 * resScale)),
      0.55,
      width,
      height
    );
  }

  // 5. Render Standoff mounting clips (if enabled)
  if (settings.realism.wallMounts && standoffAnchors.length > 0) {
    renderStandoffClips(ctx, standoffAnchors);
  }

  // 6. Physically Accurate Multi-Octave Optical Neon Glow & Bloom Compositing
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; // Physical additive photon emission

  // Vibrant, rich radiant glow power multiplier
  const glowMult = (settings.glow.glowMultiplier ?? 1.5) * 1.5;
  const isHyper = settings.glow.hyperGlow !== false;
  const dazzle = (settings.glow.dazzleBoost ?? 75) / 100;

  // PASS A: Deep Atmospheric Room Spill (Wide ambient wash illuminating dust and walls)
  if (scaledSettings.glow.ambientGlowEnabled && scaledSettings.glow.ambientGlowIntensity > 0) {
    const ambientAlpha = Math.min(
      1.0,
      (scaledSettings.glow.ambientGlowIntensity / 100) * 0.55 * glowMult * flickerFactor
    );
    const radius = Math.max(1, Math.round(scaledSettings.glow.ambientGlowRadius));
    drawSafeBlur(ctx, strokeCanvas, width, height, radius, ambientAlpha);

    if (isHyper) {
      drawSafeBlur(
        ctx,
        strokeCanvas,
        width,
        height,
        Math.max(1, Math.round(radius * 1.5)),
        Math.min(1.0, ambientAlpha * 0.65)
      );
    }
  }

  // PASS B: Mid-Range Chromatic Halo (Pure saturated gas halo scattering into the eye/lens)
  if (scaledSettings.glow.outerGlowEnabled && scaledSettings.glow.outerGlowIntensity > 0) {
    const outerAlpha = Math.min(
      1.0,
      (scaledSettings.glow.outerGlowIntensity / 100) * 0.85 * glowMult * flickerFactor
    );
    const radius = Math.max(1, Math.round(scaledSettings.glow.outerGlowRadius));
    drawSafeBlur(ctx, strokeCanvas, width, height, radius, outerAlpha);
  }

  // PASS C: Radiant Optical Bloom (High-voltage gas excitation scattering around the tube)
  if (scaledSettings.glow.bloomIntensity > 0) {
    const bloomAlpha = Math.min(
      1.0,
      (scaledSettings.glow.bloomIntensity / 100) * 0.9 * glowMult * flickerFactor
    );
    const bloomRadius = Math.max(1, Math.round(scaledSettings.glow.outerGlowRadius * 0.5));
    drawSafeBlur(ctx, strokeCanvas, width, height, bloomRadius, bloomAlpha);
  }

  // PASS D: Plasma Corona Edge (Intense vibrant gas layer immediately clinging to the glass)
  if (scaledSettings.glow.innerGlowEnabled && scaledSettings.glow.innerGlowIntensity > 0) {
    const innerAlpha = Math.min(
      1.0,
      (scaledSettings.glow.innerGlowIntensity / 100) * 1.05 * glowMult * flickerFactor
    );
    const innerRadius = Math.max(1, Math.round(scaledSettings.glow.innerGlowRadius * 0.7));
    drawSafeBlur(ctx, strokeCanvas, width, height, innerRadius, innerAlpha);
  }

  // PASS E: 3D Volumetric Cylindrical Glass Tube Body
  // Step 1: Subtle outer glass Fresnel refraction rim (only if explicitly enabled)
  if (scaledSettings.tube.glassBorder === true) {
    const fresnelCanvas = getScratchCanvas('fresnelCanvas', width, height);
    const fCtx = fresnelCanvas.getContext('2d');
    if (fCtx) {
      if (hasSvgLayers) {
        renderSvgGlassFresnel(
          fCtx,
          width,
          height,
          svgLayers,
          svgViewBox || { x: 0, y: 0, width, height },
          scaledSettings
        );
      }
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.55 * flickerFactor;
      ctx.drawImage(fresnelCanvas, 0, 0);
      ctx.restore();
    }
  }

  // Step 2: The Core Gas Plasma Tube Body (vivid monochromatic spectral color)
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  const tubeAlpha =
    (scaledSettings.tube.tubeOpacity / 100) * (scaledSettings.tube.tubeBrightness / 100) * flickerFactor;
  ctx.globalAlpha = Math.min(1, tubeAlpha);
  ctx.drawImage(strokeCanvas, 0, 0);

  // Additive gas plasma punch
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.min(0.85, tubeAlpha * 0.7 * glowMult);
  ctx.drawImage(strokeCanvas, 0, 0);
  ctx.restore();

  // PASS F: Volumetric Incandescent Gas Core (Smooth pastel diffusion + incandescent center filament)
  if (scaledSettings.tube.coreVisible) {
    const coreCanvas = getScratchCanvas('coreCanvas', width, height);
    const coreCtx = coreCanvas.getContext('2d');

    const sharpCoreCanvas = getScratchCanvas('sharpCoreCanvas', width, height);
    const sharpCoreCtx = sharpCoreCanvas.getContext('2d');

    if (coreCtx && sharpCoreCtx) {
      if (hasSvgLayers) {
        // Soft volumetric tinted plasma
        renderSvgCore(
          coreCtx,
          width,
          height,
          svgLayers,
          svgViewBox || { x: 0, y: 0, width, height },
          scaledSettings,
          primaryColor,
          secondaryColor,
          false
        );
        // Incandescent white filament
        renderSvgCore(
          sharpCoreCtx,
          width,
          height,
          svgLayers,
          svgViewBox || { x: 0, y: 0, width, height },
          scaledSettings,
          primaryColor,
          secondaryColor,
          true
        );
      } else if (sourceMaskCanvas) {
        renderRasterCore(coreCtx, width, height, sourceMaskCanvas, scaledSettings, primaryColor, false);
        renderRasterCore(sharpCoreCtx, width, height, sourceMaskCanvas, scaledSettings, primaryColor, true);
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter'; // Additive natural radiance

      const coreAlpha = (scaledSettings.tube.coreBrightness / 100) * flickerFactor;

      // Tier 1: Soft radiant tinted plasma core (smooth transition from gas to white)
      ctx.globalAlpha = Math.min(0.85, coreAlpha * 0.7);
      ctx.filter = `blur(${Math.max(1, Math.round(0.35 * resScale))}px)`;
      ctx.drawImage(coreCanvas, 0, 0);

      // Tier 2: Incandescent white filament (pure center electrical discharge)
      ctx.filter = 'none';
      ctx.globalAlpha = Math.min(1.0, coreAlpha * (0.95 + dazzle * 0.25));
      ctx.drawImage(sharpCoreCanvas, 0, 0);

      ctx.restore();
    }
  }

  // PASS G: 3D Cylindrical Glass Specular Highlight (Ambient reflection along top curve of glass)
  if (scaledSettings.realism.glassHighlights && hasSvgLayers) {
    const specCanvas = getScratchCanvas('specCanvas', width, height);
    const sCtx = specCanvas.getContext('2d');
    if (sCtx) {
      renderSvgSpecularHighlight(
        sCtx,
        width,
        height,
        svgLayers,
        svgViewBox || { x: 0, y: 0, width, height },
        scaledSettings
      );
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55 * flickerFactor;
      ctx.drawImage(specCanvas, 0, 0);
      ctx.restore();
    }
  }

  // PASS H: Optical Starburst Lens Flares on bent glass corners
  if (scaledSettings.realism.starburstFlares && cornerVertices.length > 0) {
    renderStarburstFlares(ctx, cornerVertices, resScale, flickerFactor);
  }

  ctx.restore(); // restores the lighter state

  // 7. Post-Processing: Film Grain & Tone Curve
  if (settings.tone.grain > 0) {
    applyFilmGrain(ctx, width, height, settings.tone.grain);
  }

  if (settings.tone.toneBrightness !== 0 || settings.tone.toneContrast !== 0 || settings.tone.gamma !== 1) {
    applyToneAdjustments(ctx, width, height, settings.tone.toneBrightness, settings.tone.toneContrast, settings.tone.gamma);
  }
}

/**
 * Renders optical 4-point star lens flares on sharp corner vertices.
 */
function renderStarburstFlares(
  ctx: CanvasRenderingContext2D,
  vertices: { x: number; y: number; color: string }[],
  resScale: number,
  flickerFactor: number
) {
  if (vertices.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const flareRadius = Math.max(6, Math.round(15 * resScale));
  const spikeLen = flareRadius * 2.4;

  const maxFlares = 16;
  const step = Math.max(1, Math.floor(vertices.length / maxFlares));

  for (let i = 0; i < vertices.length; i += step) {
    const v = vertices[i];
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.globalAlpha = 0.85 * flickerFactor;

    // Soft radiant diamond / bloom center
    const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, flareRadius);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radGrad.addColorStop(0.3, v.color);
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 0, flareRadius, 0, Math.PI * 2);
    ctx.fill();

    // 4-point star cross spikes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(1, 1.4 * resScale);
    ctx.beginPath();
    ctx.moveTo(-spikeLen, 0);
    ctx.lineTo(spikeLen, 0);
    ctx.moveTo(0, -spikeLen);
    ctx.lineTo(0, spikeLen);
    ctx.stroke();

    ctx.restore();
  }
  ctx.restore();
}

/**
 * Renders SVG path layers onto the stroke canvas with vector accuracy.
 */
/**
 * Safely constructs a Path2D object without throwing an error if path syntax is invalid.
 */
function safePath2D(d?: string): Path2D | null {
  if (!d || typeof d !== 'string') return null;
  const trimmed = d.trim();
  if (!trimmed) return null;
  try {
    return new Path2D(trimmed);
  } catch {
    return null;
  }
}

/**
 * Applies SVG transform attribute (matrix, translate, scale) to 2D context.
 */
function applySvgTransform(ctx: CanvasRenderingContext2D, transformStr?: string) {
  if (!transformStr) return;
  try {
    const t = transformStr.trim();
    const matrixMatch = t.match(/matrix\(([^)]+)\)/i);
    if (matrixMatch) {
      const parts = matrixMatch[1].split(/[\s,]+/).map(Number);
      if (parts.length === 6 && !parts.some(isNaN)) {
        ctx.transform(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]);
        return;
      }
    }
    const translateMatch = t.match(/translate\(([^)]+)\)/i);
    if (translateMatch) {
      const parts = translateMatch[1].split(/[\s,]+/).map(Number);
      if (parts.length >= 1 && !isNaN(parts[0])) {
        ctx.translate(parts[0], parts[1] || 0);
      }
    }
    const scaleMatch = t.match(/scale\(([^)]+)\)/i);
    if (scaleMatch) {
      const parts = scaleMatch[1].split(/[\s,]+/).map(Number);
      if (parts.length >= 1 && !isNaN(parts[0])) {
        ctx.scale(parts[0], parts[1] !== undefined ? parts[1] : parts[0]);
      }
    }
  } catch {
    // Ignore malformed transform
  }
}

/**
 * Renders SVG path layers onto the stroke canvas with vector accuracy.
 */
function renderSvgStrokesToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layers: SvgPathLayer[],
  viewBox: { x: number; y: number; width: number; height: number },
  settings: NeonSettings,
  primaryColor: string,
  secondaryColor: string,
  anchors: { x: number; y: number }[],
  cornerVertices: { x: number; y: number; color: string }[]
) {
  ctx.save();

  // Safe scale from viewBox to canvas dimensions preserving aspect ratio
  const vbW = Math.max(1, viewBox?.width || width || 800);
  const vbH = Math.max(1, viewBox?.height || height || 800);
  const scaleX = width / vbW;
  const scaleY = height / vbH;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (width - vbW * scale) / 2 - (viewBox?.x || 0) * scale;
  const offsetY = (height - vbH * scale) / 2 - (viewBox?.y || 0) * scale;

  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  ctx.lineCap = settings.tube.lineCap;
  ctx.lineJoin = settings.tube.lineJoin;
  // Blend intersecting stroke colors smoothly (e.g. magenta + cyan creates a combined luminous color)
  ctx.globalCompositeOperation = 'screen';

  // Render each visible layer
  layers.forEach((layer, idx) => {
    if (!layer.visible) return;

    ctx.save();
    if (layer.transform) {
      applySvgTransform(ctx, layer.transform);
    }
    const path = safePath2D(layer.d);
    if (!path) {
      ctx.restore();
      return;
    }

    // Determine stroke color
    let strokeColor = primaryColor;
    if (layer.color) {
      strokeColor = layer.color;
    } else if (settings.color.colorMode === 'dual') {
      strokeColor = idx % 2 === 0 ? primaryColor : secondaryColor;
    } else if (settings.color.colorMode === 'multi') {
      const colors = [
        '#00f3ff', '#ff007f', '#ffe600', '#00ff66', '#ff0044', '#a855f7', '#fb923c'
      ];
      strokeColor = colors[idx % colors.length];
    }

    const resScale = Math.max(1, Math.min(width, height) / 500);
    const lineThick = layer.thickness !== undefined ? layer.thickness * resScale : settings.tube.thickness;
    const baseLineWidth = lineThick / scale;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = baseLineWidth;
    ctx.stroke(path);
    ctx.restore();

    // Extract corner points and vertices from path string for optical starburst flares
    const coordPairs = layer.d.match(/[-+]?[0-9]*\.?[0-9]+/g);
    if (coordPairs && coordPairs.length >= 2) {
      const len = coordPairs.length;
      const step = Math.max(2, Math.floor(len / 8) * 2);
      for (let c = 0; c < len; c += step) {
        const px = parseFloat(coordPairs[c]);
        const py = parseFloat(coordPairs[c + 1]);
        if (!isNaN(px) && !isNaN(py)) {
          const cx = px * scale + offsetX;
          const cy = py * scale + offsetY;
          cornerVertices.push({ x: cx, y: cy, color: strokeColor });
        }
      }
    }

    // Sample occasional points for standoff clamps
    if (idx % 2 === 0) {
      const anchorX = (viewBox.x + viewBox.width * (0.2 + (idx * 0.25) % 0.6)) * scale + offsetX;
      const anchorY = (viewBox.y + viewBox.height * (0.3 + (idx * 0.3) % 0.5)) * scale + offsetY;
      anchors.push({ x: anchorX, y: anchorY });
    }
  });

  ctx.restore();
}

/**
 * Renders physical 3D glass tube Fresnel contour.
 * In real glass neon tubes, light passing through the outer glass cylinder boundary
 * creates a subtle darker refraction rim against the surrounding ambient glow.
 */
function renderSvgGlassFresnel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layers: SvgPathLayer[],
  viewBox: { x: number; y: number; width: number; height: number },
  settings: NeonSettings
) {
  ctx.save();
  const vbW = Math.max(1, viewBox?.width || width || 800);
  const vbH = Math.max(1, viewBox?.height || height || 800);
  const scale = Math.min(width / vbW, height / vbH);

  const offsetX = (width - vbW * scale) / 2 - (viewBox?.x || 0) * scale;
  const offsetY = (height - vbH * scale) / 2 - (viewBox?.y || 0) * scale;

  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  ctx.lineCap = settings.tube.lineCap;
  ctx.lineJoin = settings.tube.lineJoin;

  const baseThickness = settings.tube.thickness / scale;
  // Outer glass cylinder envelope
  const resScale = Math.max(1, Math.min(width, height) / 500);
  ctx.lineWidth = baseThickness + Math.max(1.0, (1.6 * resScale) / scale);
  ctx.strokeStyle = 'rgba(5, 8, 15, 0.5)';

  layers.forEach((layer) => {
    if (!layer.visible) return;
    ctx.save();
    if (layer.transform) {
      applySvgTransform(ctx, layer.transform);
    }
    const path = safePath2D(layer.d);
    if (path) {
      ctx.stroke(path);
    }
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Renders delicate cylindrical glass specular reflection along the top-left curved shoulder of the tube.
 * This optical cue creates the immediate, tangible perception of real bent glass.
 */
function renderSvgSpecularHighlight(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layers: SvgPathLayer[],
  viewBox: { x: number; y: number; width: number; height: number },
  settings: NeonSettings
) {
  ctx.save();
  const vbW = Math.max(1, viewBox?.width || width || 800);
  const vbH = Math.max(1, viewBox?.height || height || 800);
  const scale = Math.min(width / vbW, height / vbH);

  const offsetX = (width - vbW * scale) / 2 - (viewBox?.x || 0) * scale;
  const offsetY = (height - vbH * scale) / 2 - (viewBox?.y || 0) * scale;

  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const baseThickness = settings.tube.thickness / scale;
  ctx.lineWidth = Math.max(0.65, baseThickness * 0.16);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';

  layers.forEach((layer) => {
    if (!layer.visible) return;
    ctx.save();
    if (layer.transform) {
      applySvgTransform(ctx, layer.transform);
    }
    const path = safePath2D(layer.d);
    if (path) {
      ctx.stroke(path);
    }
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Renders the volumetric incandescent core:
 * - isWhiteFilament = false: Renders smooth tinted pastel gas plasma (52% width) that bridges gas to core.
 * - isWhiteFilament = true: Renders razor-sharp incandescent white filament (24% width) with additive brilliance.
 */
function renderSvgCore(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layers: SvgPathLayer[],
  viewBox: { x: number; y: number; width: number; height: number },
  settings: NeonSettings,
  primaryColor: string,
  secondaryColor: string,
  isWhiteFilament: boolean = false
) {
  ctx.save();
  const vbW = Math.max(1, viewBox?.width || width || 800);
  const vbH = Math.max(1, viewBox?.height || height || 800);
  const scale = Math.min(width / vbW, height / vbH);

  const offsetX = (width - vbW * scale) / 2 - (viewBox?.x || 0) * scale;
  const offsetY = (height - vbH * scale) / 2 - (viewBox?.y || 0) * scale;

  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  ctx.lineCap = settings.tube.lineCap;
  ctx.lineJoin = settings.tube.lineJoin;
  ctx.globalCompositeOperation = 'screen';

  // Normalized core width ratio from user slider (5% to 100%)
  const coreRatio = Math.max(0.05, Math.min(1.0, (settings.tube.coreWidth ?? 35) / 100));

  layers.forEach((layer, idx) => {
    if (!layer.visible) return;

    const resScale = Math.max(1, Math.min(width, height) / 500);
    const lineThick = layer.thickness !== undefined ? layer.thickness * resScale : settings.tube.thickness;
    const baseThickness = lineThick / scale;

    const layerCoreWidth = layer.coreWidth ?? settings.tube.coreWidth ?? 35;
    const coreRatio = Math.max(0.05, Math.min(1.0, layerCoreWidth / 100));

    // Accurate thickness scaling for inner white tube:
    // When coreWidth is low (5-20%): razor-sharp thin filament (চিকন)
    // When coreWidth is high (60-100%): thick, bold white incandescent core (মোটা)
    const coreThickness = isWhiteFilament
      ? Math.max(0.3, baseThickness * coreRatio)
      : Math.max(0.6, baseThickness * Math.min(1.0, coreRatio * 1.25));

    ctx.lineWidth = coreThickness;

    let layerColor = primaryColor;
    if (layer.color) {
      layerColor = layer.color;
    } else if (settings.color.colorMode === 'dual') {
      layerColor = idx % 2 === 0 ? primaryColor : secondaryColor;
    }

    if (isWhiteFilament) {
      ctx.strokeStyle = settings.tube.coreColor || '#ffffff';
    } else {
      ctx.strokeStyle = getCoreTint(layerColor);
    }

    ctx.save();
    if (layer.transform) {
      applySvgTransform(ctx, layer.transform);
    }
    const path = safePath2D(layer.d);
    if (path) {
      ctx.stroke(path);
    }
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Renders raster mask lines onto stroke canvas, tinted with color modes.
 */
function renderRasterMaskToStrokeCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  maskCanvas: HTMLCanvasElement,
  settings: NeonSettings,
  primaryColor: string,
  secondaryColor: string,
  anchors: { x: number; y: number }[],
  cornerVertices: { x: number; y: number; color: string }[]
) {
  let fillStyle: string | CanvasGradient = primaryColor;

  if (settings.color.colorMode === 'dual') {
    fillStyle = createNeonColorGradient(
      ctx,
      width,
      height,
      primaryColor,
      secondaryColor,
      settings.color.gradientAngle
    );
  }

  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';

  if (settings.tube.thickness > 4) {
    const extra = Math.min(12, Math.floor((settings.tube.thickness - 4) / 4));
    if (extra > 0) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.filter = `blur(${extra}px)`;
      ctx.drawImage(maskCanvas, 0, 0, width, height);
      ctx.restore();
    }
  }

  anchors.push(
    { x: width * 0.25, y: height * 0.25 },
    { x: width * 0.75, y: height * 0.25 },
    { x: width * 0.35, y: height * 0.75 },
    { x: width * 0.70, y: height * 0.70 }
  );

  // Four corner vertices for raster flares
  cornerVertices.push(
    { x: width * 0.22, y: height * 0.22, color: primaryColor },
    { x: width * 0.78, y: height * 0.22, color: secondaryColor },
    { x: width * 0.22, y: height * 0.78, color: primaryColor },
    { x: width * 0.78, y: height * 0.78, color: secondaryColor }
  );
}

/**
 * Renders white hot core highlight from raster line mask.
 */
function renderRasterCore(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  maskCanvas: HTMLCanvasElement,
  settings: NeonSettings,
  primaryColor: string,
  isWhiteFilament: boolean = false
) {
  ctx.fillStyle = isWhiteFilament ? (settings.tube.coreColor || '#ffffff') : getCoreTint(primaryColor);
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-in';
  const coreRatio = Math.max(0.05, Math.min(1.0, (settings.tube.coreWidth ?? 35) / 100));

  if (isWhiteFilament) {
    ctx.save();
    if (coreRatio < 0.25) {
      // Thin white core for raster
      ctx.globalAlpha = Math.max(0.4, 0.4 + coreRatio * 2.0);
    } else if (coreRatio > 0.45) {
      // Thick white core for raster
      const extraBlur = Math.round((coreRatio - 0.45) * 6);
      if (extraBlur > 0) {
        ctx.filter = `blur(${extraBlur}px)`;
      }
    }
    ctx.drawImage(maskCanvas, 0, 0, width, height);
    ctx.restore();
  } else {
    ctx.save();
    ctx.filter = `blur(${Math.max(1, Math.round(coreRatio * 3.5))}px)`;
    ctx.drawImage(maskCanvas, 0, 0, width, height);
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
}



/**
 * Procedural film grain overlay.
 */
function applyFilmGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
) {
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 256;
  noiseCanvas.height = 256;
  const nCtx = noiseCanvas.getContext('2d');
  if (!nCtx) return;

  const imgData = nCtx.createImageData(256, 256);
  const data = imgData.data;
  const strength = (intensity / 100) * 35;

  for (let i = 0; i < data.length; i += 4) {
    const val = 128 + (Math.random() - 0.5) * strength;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }
  nCtx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = (intensity / 100) * 0.45;
  const pattern = ctx.createPattern(noiseCanvas, 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

/**
 * Tone curve adjustment: brightness, contrast, gamma.
 * Uses a precomputed 256-entry Look-Up Table (LUT) for instantaneous O(1) byte replacement.
 */
function applyToneAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brightness: number,
  contrast: number,
  gamma: number
) {
  if (brightness === 0 && contrast === 0 && Math.abs(gamma - 1) < 0.005) {
    return;
  }

  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const gammaInv = 1 / gamma;

  // Precompute 256-value Look-Up Table (LUT) - eliminates 48,000,000 Math.pow calls!
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let v = i;
    if (brightness !== 0) {
      v += (brightness / 100) * 50;
    }
    if (contrast !== 0) {
      v = contrastFactor * (v - 128) + 128;
    }
    if (Math.abs(gamma - 1) >= 0.005) {
      v = 255 * Math.pow(Math.max(0, Math.min(255, v)) / 255, gammaInv);
    }
    lut[i] = Math.max(0, Math.min(255, Math.round(v)));
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    if (data[i + 3] === 0) continue; // Skip transparent pixels
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }

  ctx.putImageData(imgData, 0, 0);
}
