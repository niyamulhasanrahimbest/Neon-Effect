/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SvgPathLayer } from '../types/neon';

export interface ParsedEpsData {
  viewBox: { x: number; y: number; width: number; height: number };
  width: number;
  height: number;
  layers: SvgPathLayer[];
  sanitizedSvgString: string;
}

/**
 * High-vibrancy neon colors assigned by default to separated stroke layers
 */
const NEON_PALETTE = [
  '#00f3ff', // Electric Cyan
  '#ff007f', // Hot Pink
  '#ffe600', // Neon Yellow
  '#00ff66', // Neon Green
  '#ff0044', // Ruby Red
  '#a855f7', // Vivid Purple
  '#ff7700', // Electric Orange
  '#00d4ff', // Deep Cyan
  '#ff1493', // Deep Pink
  '#39ff14', // Acid Green
];

/**
 * Parses EPS (Encapsulated PostScript) vector files and converts them
 * into standardized SVG path layers with coordinate normalization.
 */
export function parseEpsLayers(epsBufferOrText: ArrayBuffer | string): ParsedEpsData {
  let epsText = '';

  if (typeof epsBufferOrText === 'string') {
    epsText = epsBufferOrText;
  } else {
    // Check for binary EPS header (DOS EPS format has 30-byte header: 0xC5D0D3C6)
    const view = new DataView(epsBufferOrText);
    const magic = epsBufferOrText.byteLength >= 4 ? view.getUint32(0, false) : 0;

    if (magic === 0xc5d0d3c6) {
      // Little-endian offset at byte 4
      const psOffset = view.getUint32(4, true);
      const psLength = view.getUint32(8, true);
      const decoder = new TextDecoder('latin1');
      epsText = decoder.decode(new Uint8Array(epsBufferOrText, psOffset, psLength));
    } else {
      const decoder = new TextDecoder('latin1');
      epsText = decoder.decode(epsBufferOrText);
    }
  }

  // 1. Extract BoundingBox from comments
  // Formats: %%BoundingBox: llx lly urx ury or %%HiResBoundingBox: llx lly urx ury
  let llx = 0, lly = 0, urx = 500, ury = 500;
  const bboxMatch = epsText.match(/%%(?:HiRes)?BoundingBox:\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/i);

  if (bboxMatch) {
    llx = parseFloat(bboxMatch[1]);
    lly = parseFloat(bboxMatch[2]);
    urx = parseFloat(bboxMatch[3]);
    ury = parseFloat(bboxMatch[4]);
  }

  const boxWidth = Math.max(10, Math.abs(urx - llx));
  const boxHeight = Math.max(10, Math.abs(ury - lly));

  // PostScript has Y=0 at bottom-left, SVG has Y=0 at top-left.
  // Transform: svgX = x - llx, svgY = ury - y
  const toSvgX = (x: number) => +(x - llx).toFixed(2);
  const toSvgY = (y: number) => +(ury - y).toFixed(2);

  // 2. Tokenize PostScript stream into tokens
  // Strip comments (from % to newline, except header lines that were already parsed)
  const codeWithoutComments = epsText
    .split(/\r?\n/)
    .map(line => {
      const commentIdx = line.indexOf('%');
      if (commentIdx === 0) return '';
      if (commentIdx > 0) return line.slice(0, commentIdx);
      return line;
    })
    .join(' ');

  // Tokenize by whitespace, brackets, parentheses
  const tokens = codeWithoutComments.trim().split(/\s+/).filter(Boolean);

  const layers: SvgPathLayer[] = [];
  const stack: number[] = [];

  let currentPathD = '';
  let currentStrokeColor = '';
  let currentStrokeWidth = 4;
  let layerIndex = 1;

  const flushPath = (opName: string) => {
    if (currentPathD.trim()) {
      const color = currentStrokeColor || NEON_PALETTE[(layerIndex - 1) % NEON_PALETTE.length];
      layers.push({
        id: `eps-layer-${layerIndex}-${Date.now()}`,
        name: `Stroke ${layerIndex} (${opName})`,
        d: currentPathD.trim(),
        color,
        glowColor: color,
        thickness: Math.max(2, Math.min(20, Math.round(currentStrokeWidth))),
        visible: true,
      });
      layerIndex++;
      currentPathD = '';
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const num = parseFloat(token);

    if (!isNaN(num) && isFinite(num)) {
      stack.push(num);
      continue;
    }

    const op = token.toLowerCase();

    // Moveto
    if (op === 'm' || op === 'moveto') {
      if (stack.length >= 2) {
        const y = stack.pop()!;
        const x = stack.pop()!;
        currentPathD += ` M ${toSvgX(x)} ${toSvgY(y)}`;
      }
    }
    // Lineto
    else if (op === 'l' || op === 'lineto') {
      if (stack.length >= 2) {
        const y = stack.pop()!;
        const x = stack.pop()!;
        currentPathD += ` L ${toSvgX(x)} ${toSvgY(y)}`;
      }
    }
    // Curveto (Cubic Bezier)
    else if (op === 'c' || op === 'curveto') {
      if (stack.length >= 6) {
        const y3 = stack.pop()!;
        const x3 = stack.pop()!;
        const y2 = stack.pop()!;
        const x2 = stack.pop()!;
        const y1 = stack.pop()!;
        const x1 = stack.pop()!;
        currentPathD += ` C ${toSvgX(x1)} ${toSvgY(y1)}, ${toSvgX(x2)} ${toSvgY(y2)}, ${toSvgX(x3)} ${toSvgY(y3)}`;
      }
    }
    // Closepath
    else if (op === 'h' || op === 'cp' || op === 'closepath') {
      currentPathD += ' Z';
    }
    // Setrgbcolor
    else if (op === 'setrgbcolor' || op === 'rg') {
      if (stack.length >= 3) {
        const b = Math.max(0, Math.min(1, stack.pop()!));
        const g = Math.max(0, Math.min(1, stack.pop()!));
        const r = Math.max(0, Math.min(1, stack.pop()!));
        const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
        currentStrokeColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }
    }
    // Setcmykcolor
    else if (op === 'setcmykcolor' || op === 'k') {
      if (stack.length >= 4) {
        const k = stack.pop()!;
        const y = stack.pop()!;
        const m = stack.pop()!;
        const c = stack.pop()!;
        const r = (1 - c) * (1 - k);
        const g = (1 - m) * (1 - k);
        const b = (1 - y) * (1 - k);
        const toHex = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
        currentStrokeColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }
    }
    // Setgray
    else if (op === 'setgray' || op === 'g') {
      if (stack.length >= 1) {
        const g = Math.max(0, Math.min(1, stack.pop()!));
        const toHex = Math.round(g * 255).toString(16).padStart(2, '0');
        currentStrokeColor = `#${toHex}${toHex}${toHex}`;
      }
    }
    // Setlinewidth
    else if (op === 'setlinewidth' || op === 'w') {
      if (stack.length >= 1) {
        currentStrokeWidth = Math.max(1, stack.pop()!);
      }
    }
    // Stroke / Fill / Stroke&Fill operators
    else if (op === 's' || op === 'stroke' || op === 'f' || op === 'fill' || op === 'b' || op === 'eofill') {
      flushPath(op === 's' || op === 'stroke' ? 'Line' : 'Shape');
    }
    // Clear stack on path initialization or unknown compound operators
    else if (op === 'newpath' || op === 'initmatrix' || op === 'grestore' || op === 'gsave') {
      // keep drawing uninterrupted
    }
  }

  // Flush any remaining active path
  flushPath('Stroke');

  // Fallback: If no paths were detected through standard tokens (e.g. encapsulated graphic),
  // create a default clean bounding outline
  if (layers.length === 0) {
    layers.push({
      id: `eps-layer-fallback-${Date.now()}`,
      name: 'EPS Outline',
      d: `M 10 10 L ${boxWidth - 10} 10 L ${boxWidth - 10} ${boxHeight - 10} L 10 ${boxHeight - 10} Z`,
      color: NEON_PALETTE[0],
      glowColor: NEON_PALETTE[0],
      thickness: 6,
      visible: true,
    });
  }

  // Generate equivalent clean SVG string
  const svgPaths = layers
    .map(
      l =>
        `<path id="${l.id}" d="${l.d}" stroke="${l.color}" stroke-width="${l.thickness || 6}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`
    )
    .join('\n');

  const sanitizedSvgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${boxWidth} ${boxHeight}" width="${boxWidth}" height="${boxHeight}">\n${svgPaths}\n</svg>`;

  return {
    viewBox: { x: 0, y: 0, width: Math.round(boxWidth), height: Math.round(boxHeight) },
    width: Math.round(boxWidth),
    height: Math.round(boxHeight),
    layers,
    sanitizedSvgString,
  };
}
