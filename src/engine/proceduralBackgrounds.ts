/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NeonBackgroundSettings } from '../types/neon';

// Cached procedural brick canvas to avoid regenerating per frame
let cachedBrickCanvas: HTMLCanvasElement | null = null;
let cachedConcreteCanvas: HTMLCanvasElement | null = null;

/**
 * Generates or retrieves a high-fidelity procedural dark brick wall pattern.
 */
function getBrickWallPattern(width: number, height: number): HTMLCanvasElement {
  if (cachedBrickCanvas && cachedBrickCanvas.width >= width && cachedBrickCanvas.height >= height) {
    return cachedBrickCanvas;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(width, 1920);
  canvas.height = Math.max(height, 1080);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Base mortar dark charcoal
  ctx.fillStyle = '#0c0e14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const brickHeight = 36;
  const brickWidth = 84;
  const mortar = 4;

  const rows = Math.ceil(canvas.height / (brickHeight + mortar));
  const cols = Math.ceil(canvas.width / (brickWidth + mortar)) + 1;

  for (let r = 0; r < rows; r++) {
    const isShifted = r % 2 === 1;
    const xOffset = isShifted ? -(brickWidth / 2) : 0;
    const y = r * (brickHeight + mortar);

    for (let c = 0; c < cols; c++) {
      const x = xOffset + c * (brickWidth + mortar);

      // Deterministic slight color variation per brick
      const seed = Math.sin(r * 37 + c * 17) * 10000;
      const rand = seed - Math.floor(seed);
      
      const rBase = 18 + Math.floor(rand * 14);
      const gBase = 20 + Math.floor(rand * 12);
      const bBase = 26 + Math.floor(rand * 16);

      // Draw brick with subtle rounded corners
      ctx.fillStyle = `rgb(${rBase}, ${gBase}, ${bBase})`;
      ctx.fillRect(x, y, brickWidth, brickHeight);

      // Brick surface highlight / shadow edge
      ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + rand * 0.02})`;
      ctx.fillRect(x, y, brickWidth, 2);

      ctx.fillStyle = `rgba(0, 0, 0, ${0.15 + rand * 0.1})`;
      ctx.fillRect(x, y + brickHeight - 2, brickWidth, 2);
    }
  }

  // Add subtle natural wall grunge / micro-texture
  const noiseData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = noiseData.data;
  for (let i = 0; i < data.length; i += 16) {
    const n = (Math.random() - 0.5) * 8;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }
  ctx.putImageData(noiseData, 0, 0);

  cachedBrickCanvas = canvas;
  return canvas;
}

/**
 * Generates or retrieves a procedural industrial concrete surface.
 */
function getConcretePattern(width: number, height: number): HTMLCanvasElement {
  if (cachedConcreteCanvas && cachedConcreteCanvas.width >= width && cachedConcreteCanvas.height >= height) {
    return cachedConcreteCanvas;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(width, 1920);
  canvas.height = Math.max(height, 1080);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Base slate tone
  ctx.fillStyle = '#14171f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft cloudy patches
  for (let i = 0; i < 40; i++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const r = 100 + Math.random() * 300;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const alpha = 0.03 + Math.random() * 0.05;
    grad.addColorStop(0, Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha * 1.5})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grain noise
  const noiseData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = noiseData.data;
  for (let i = 0; i < data.length; i += 8) {
    const n = (Math.random() - 0.5) * 14;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }
  ctx.putImageData(noiseData, 0, 0);

  cachedConcreteCanvas = canvas;
  return canvas;
}

/**
 * Renders the chosen background texture, solid color, or custom image with lighting adjustments.
 */
export function renderBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: NeonBackgroundSettings,
  customImageEl?: HTMLImageElement | null
) {
  if (settings.type === 'transparent') {
    return;
  }

  ctx.save();

  // Draw background base
  switch (settings.type) {
    case 'black':
      ctx.fillStyle = '#06070a';
      ctx.fillRect(0, 0, width, height);
      break;

    case 'charcoal':
      ctx.fillStyle = '#11131a';
      ctx.fillRect(0, 0, width, height);
      break;

    case 'dark-blue': {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0d1527');
      grad.addColorStop(1, '#05070f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case 'dark-purple': {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#190e28');
      grad.addColorStop(1, '#07040d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case 'brick-wall': {
      const brick = getBrickWallPattern(width, height);
      ctx.drawImage(brick, 0, 0, width, height);
      break;
    }

    case 'concrete': {
      const concrete = getConcretePattern(width, height);
      ctx.drawImage(concrete, 0, 0, width, height);
      break;
    }

    case 'custom-color':
      ctx.fillStyle = settings.customColor || '#101015';
      ctx.fillRect(0, 0, width, height);
      break;

    case 'custom-image':
      if (customImageEl && customImageEl.complete && customImageEl.naturalWidth > 0) {
        // Draw image covering canvas keeping aspect ratio
        const imgRatio = customImageEl.naturalWidth / customImageEl.naturalHeight;
        const canRatio = width / height;
        let dw = width, dh = height, dx = 0, dy = 0;
        if (canRatio > imgRatio) {
          dh = width / imgRatio;
          dy = (height - dh) / 2;
        } else {
          dw = height * imgRatio;
          dx = (width - dw) / 2;
        }
        ctx.drawImage(customImageEl, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = '#0c0d12';
        ctx.fillRect(0, 0, width, height);
      }
      break;
  }

  // Apply Brightness & Contrast adjustments overlay
  if (settings.brightness !== 0 || settings.contrast !== 0) {
    if (settings.brightness > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${settings.brightness / 200})`;
      ctx.fillRect(0, 0, width, height);
    } else if (settings.brightness < 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.abs(settings.brightness) / 100})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Vignette overlay
  if (settings.vignette > 0) {
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.sqrt(cx * cx + cy * cy);
    const vignetteGrad = ctx.createRadialGradient(cx, cy, maxRadius * 0.4, cx, cy, maxRadius);
    const vigAlpha = (settings.vignette / 100) * 0.85;
    vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGrad.addColorStop(1, `rgba(0, 0, 0, ${vigAlpha})`);
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

/**
 * Renders contact shadows cast by neon glass tubes onto the background wall.
 */
export function renderContactShadow(
  ctx: CanvasRenderingContext2D,
  tubeCanvas: HTMLCanvasElement,
  offsetX: number = 6,
  offsetY: number = 10,
  blur: number = 12,
  opacity: number = 0.55,
  destWidth?: number,
  destHeight?: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = 'multiply';
  ctx.filter = `blur(${blur}px) brightness(0)`;
  if (destWidth && destHeight) {
    ctx.drawImage(tubeCanvas, offsetX, offsetY, destWidth, destHeight);
  } else {
    ctx.drawImage(tubeCanvas, offsetX, offsetY);
  }
  ctx.restore();
}

/**
 * Renders realistic metallic wall standoff brackets/clips at key anchor points.
 */
export function renderStandoffClips(
  ctx: CanvasRenderingContext2D,
  anchors: { x: number; y: number }[]
) {
  if (anchors.length === 0) return;

  ctx.save();
  for (const pt of anchors) {
    // 1. Bracket drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(pt.x + 3, pt.y + 5, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Black rubber standoff foot
    ctx.fillStyle = '#111216';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Metallic chrome mounting screw/clamp
    const metalGrad = ctx.createLinearGradient(pt.x - 4, pt.y - 4, pt.x + 4, pt.y + 4);
    metalGrad.addColorStop(0, '#7a828e');
    metalGrad.addColorStop(0.5, '#e2e8f0');
    metalGrad.addColorStop(1, '#334155');
    ctx.fillStyle = metalGrad;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // 4. Center slot/screw dot
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
