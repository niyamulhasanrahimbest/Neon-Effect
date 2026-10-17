/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SvgPathLayer } from '../types/neon';

export interface ParsedSvgData {
  viewBox: { x: number; y: number; width: number; height: number };
  width: number;
  height: number;
  layers: SvgPathLayer[];
  sanitizedSvgString: string;
}

export const NEON_PALETTE = [
  '#00f3ff', // Cyan
  '#ff007f', // Hot Pink
  '#ffe600', // Yellow
  '#00ff66', // Green
  '#ff0044', // Red
  '#a855f7', // Purple
  '#ff7700', // Orange
  '#38bdf8', // Sky Blue
  '#ec4899', // Pink
];

/**
 * Strips dangerous scripts, handles invalid XML leniently,
 * and guarantees valid SVG namespace attributes for reliable Image decoding.
 */
export function sanitizeSvg(svgContent: string): string {
  // 1. Strip UTF-8 BOM, comments, and XML/DOCTYPE declarations that cause parser errors
  let cleaned = svgContent.replace(/^\uFEFF/, '').trim();
  cleaned = cleaned.replace(/<\?xml[^>]*\?>/gi, '');
  cleaned = cleaned.replace(/<!DOCTYPE[^>]*>/gi, '');

  const parser = new DOMParser();
  let doc: Document = parser.parseFromString(cleaned, 'image/svg+xml');

  // 2. If XML parser threw an error, fall back to lenient HTML5 parser
  const parserError = doc.querySelector('parsererror');
  if (parserError || !doc.querySelector('svg')) {
    const htmlDoc = parser.parseFromString(cleaned, 'text/html');
    const svgInHtml = htmlDoc.querySelector('svg');
    if (svgInHtml) {
      const reParsed = parser.parseFromString(svgInHtml.outerHTML, 'image/svg+xml');
      if (!reParsed.querySelector('parsererror')) {
        doc = reParsed;
      } else {
        doc = htmlDoc;
      }
    }
  }

  const svgEl = doc.querySelector('svg');
  if (!svgEl) {
    throw new Error('No valid <svg> root element found in the uploaded file.');
  }

  // 3. Ensure standard XML namespaces and valid dimensions for reliable Image decoding
  if (!svgEl.getAttribute('xmlns')) {
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  if (!svgEl.getAttribute('xmlns:xlink')) {
    svgEl.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  }

  // Ensure width and height attributes exist so browser Image() decodes properly
  const vbAttr = svgEl.getAttribute('viewBox') || svgEl.getAttribute('viewbox');
  if (!svgEl.getAttribute('width') || !svgEl.getAttribute('height')) {
    if (vbAttr) {
      const parts = vbAttr.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        if (!svgEl.getAttribute('width')) svgEl.setAttribute('width', String(parts[2]));
        if (!svgEl.getAttribute('height')) svgEl.setAttribute('height', String(parts[3]));
      }
    }
  }

  // 4. Remove dangerous executable elements
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'audio', 'video'];
  dangerousTags.forEach((tag) => {
    const elements = svgEl.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  });

  // 5. Strip inline event attributes and javascript: urls
  const allElements = svgEl.querySelectorAll('*');
  allElements.forEach((el) => {
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      const val = attr.value.toLowerCase().trim();
      if (name.startsWith('on') || val.startsWith('javascript:') || val.startsWith('data:text/html')) {
        el.removeAttribute(attr.name);
      }
    }
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgEl);
}

/**
 * Checks whether a color is black or very dark (which would be invisible under additive neon rendering).
 */
function isDarkColor(colorStr?: string): boolean {
  if (!colorStr) return true;
  const s = colorStr.trim().toLowerCase();
  if (s === 'none' || s === 'transparent' || s === 'currentcolor') return true;
  if (s === '#000' || s === '#000000' || s === 'black' || s === 'rgb(0,0,0)' || s === 'rgb(0, 0, 0)') return true;
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) < 45;
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) < 45;
    }
  }
  return false;
}

/**
 * Extracts stroke or fill color from attribute, style attribute, or parent <g> element.
 */
function getElementColor(el: Element, attrName: 'stroke' | 'fill'): string | undefined {
  // 1. Direct attribute
  const direct = el.getAttribute(attrName);
  if (direct && direct !== 'none' && direct !== 'currentColor') return direct;

  // 2. Inline style
  const style = el.getAttribute('style');
  if (style) {
    const regex = new RegExp(`${attrName}\\s*:\\s*([^;]+)`, 'i');
    const match = style.match(regex);
    if (match && match[1]) {
      const val = match[1].trim();
      if (val && val !== 'none' && val !== 'currentColor') return val;
    }
  }

  // 3. Parent element (<g>, etc.)
  const parent = el.parentElement;
  if (parent && parent.tagName.toLowerCase() !== 'svg') {
    return getElementColor(parent, attrName);
  }

  return undefined;
}

/**
 * Parses a sanitized SVG string and extracts distinct path layers and safe viewBox.
 */
export function parseSvgLayers(svgContent: string): ParsedSvgData {
  const sanitized = sanitizeSvg(svgContent);
  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, 'image/svg+xml');
  const svgEl = doc.querySelector('svg') || parser.parseFromString(sanitized, 'text/html').querySelector('svg');

  if (!svgEl) {
    throw new Error('No valid <svg> element found in file.');
  }

  // Query all drawable elements including paths, lines, polylines, rects, circles, ellipses
  const drawables = svgEl.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect');
  const layers: SvgPathLayer[] = [];
  let layerIndex = 1;

  let minCoordX = Infinity;
  let minCoordY = Infinity;
  let maxCoordX = -Infinity;
  let maxCoordY = -Infinity;

  drawables.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    let d = '';
    const name = el.getAttribute('id') || `${capitalize(tag)} ${layerIndex}`;

    const stroke = getElementColor(el, 'stroke');
    const fill = getElementColor(el, 'fill');
    const transform = el.getAttribute('transform') || el.parentElement?.getAttribute('transform') || undefined;

    switch (tag) {
      case 'path':
        d = el.getAttribute('d') || '';
        break;
      case 'line': {
        const x1 = el.getAttribute('x1') || '0';
        const y1 = el.getAttribute('y1') || '0';
        const x2 = el.getAttribute('x2') || '0';
        const y2 = el.getAttribute('y2') || '0';
        d = `M ${x1} ${y1} L ${x2} ${y2}`;
        break;
      }
      case 'polyline':
      case 'polygon': {
        const points = el.getAttribute('points') || '';
        const coords = points.trim().split(/[\s,]+/).filter(Boolean);
        if (coords.length >= 2) {
          d = `M ${coords[0]} ${coords[1]}`;
          for (let i = 2; i < coords.length; i += 2) {
            d += ` L ${coords[i]} ${coords[i + 1]}`;
          }
          if (tag === 'polygon') d += ' Z';
        }
        break;
      }
      case 'circle': {
        const cx = parseFloat(el.getAttribute('cx') || '0');
        const cy = parseFloat(el.getAttribute('cy') || '0');
        const r = parseFloat(el.getAttribute('r') || '0');
        if (r > 0) {
          d = `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
        }
        break;
      }
      case 'ellipse': {
        const cx = parseFloat(el.getAttribute('cx') || '0');
        const cy = parseFloat(el.getAttribute('cy') || '0');
        const rx = parseFloat(el.getAttribute('rx') || '0');
        const ry = parseFloat(el.getAttribute('ry') || '0');
        if (rx > 0 && ry > 0) {
          d = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
        }
        break;
      }
      case 'rect': {
        const x = parseFloat(el.getAttribute('x') || '0');
        const y = parseFloat(el.getAttribute('y') || '0');
        const width = parseFloat(el.getAttribute('width') || '0');
        const height = parseFloat(el.getAttribute('height') || '0');
        const rx = parseFloat(el.getAttribute('rx') || '0');
        const ry = parseFloat(el.getAttribute('ry') || '0');
        if (width > 0 && height > 0) {
          if (rx > 0 || ry > 0) {
            const r = rx || ry;
            d = `M ${x + r} ${y} H ${x + width - r} A ${r} ${r} 0 0 1 ${x + width} ${y + r} V ${y + height - r} A ${r} ${r} 0 0 1 ${x + width - r} ${y + height} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + height - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
          } else {
            d = `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
          }
        }
        break;
      }
    }

    if (d.trim()) {
      // Accumulate coordinates for bounding box calculation
      const matches = d.match(/[-+]?[0-9]*\.?[0-9]+/g);
      if (matches && matches.length >= 2) {
        for (let m = 0; m < matches.length; m += 2) {
          const px = parseFloat(matches[m]);
          const py = parseFloat(matches[m + 1]);
          if (!isNaN(px) && !isNaN(py)) {
            if (px < minCoordX) minCoordX = px;
            if (px > maxCoordX) maxCoordX = px;
            if (py < minCoordY) minCoordY = py;
            if (py > maxCoordY) maxCoordY = py;
          }
        }
      }

      const defaultColor = NEON_PALETTE[(layerIndex - 1) % NEON_PALETTE.length];
      // If the artist drew in black or near-black lines (common in line art), assign radiant neon color
      const layerColor =
        stroke && !isDarkColor(stroke)
          ? stroke
          : fill && !isDarkColor(fill)
          ? fill
          : defaultColor;

      layers.push({
        id: `svg-layer-${layerIndex}-${Date.now()}`,
        name,
        d: d.trim(),
        originalStroke: stroke,
        originalFill: fill,
        color: layerColor,
        glowColor: layerColor,
        visible: true,
        transform,
      });
      layerIndex++;
    }
  });

  // Determine viewBox and size reliably
  let vx = 0, vy = 0, vw = 800, vh = 800;
  const viewBoxAttr = svgEl.getAttribute('viewBox') || svgEl.getAttribute('viewbox');

  if (viewBoxAttr) {
    const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && !parts.some(isNaN) && parts[2] > 0 && parts[3] > 0) {
      [vx, vy, vw, vh] = parts;
    }
  }

  // If no valid viewBox or degenerate, check coordinates from path data
  if (vw <= 0 || vh <= 0 || !viewBoxAttr) {
    if (minCoordX < maxCoordX && minCoordY < maxCoordY) {
      const paddingX = Math.max(20, (maxCoordX - minCoordX) * 0.08);
      const paddingY = Math.max(20, (maxCoordY - minCoordY) * 0.08);
      vx = minCoordX - paddingX;
      vy = minCoordY - paddingY;
      vw = (maxCoordX - minCoordX) + paddingX * 2;
      vh = (maxCoordY - minCoordY) + paddingY * 2;
    } else {
      const rawW = parseFloat(svgEl.getAttribute('width') || '800');
      const rawH = parseFloat(svgEl.getAttribute('height') || '800');
      vw = !isNaN(rawW) && rawW > 0 ? rawW : 800;
      vh = !isNaN(rawH) && rawH > 0 ? rawH : 800;
    }
  }

  // Ensure canvas dimensions are valid finite numbers
  const safeW = isNaN(vw) || vw <= 0 ? 800 : vw;
  const safeH = isNaN(vh) || vh <= 0 ? 800 : vh;
  const renderWidth = Math.max(200, Math.min(3200, Math.round(safeW)));
  const renderHeight = Math.max(200, Math.min(3200, Math.round(safeH)));

  return {
    viewBox: { x: vx, y: vy, width: vw, height: vh },
    width: renderWidth,
    height: renderHeight,
    layers,
    sanitizedSvgString: sanitized,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
