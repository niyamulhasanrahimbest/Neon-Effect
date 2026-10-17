/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SvgPathLayer } from '../types/neon';

export interface NeonPalette {
  id: string;
  name: string;
  bengaliName: string;
  description: string;
  colors: string[];
  isPopular?: boolean;
  popularityBadge?: string;
  rank?: number;
}

export const HARMONIC_NEON_PALETTES: NeonPalette[] = [
  {
    id: 'cyberpunk-synth',
    name: 'Cyberpunk Synthwave',
    bengaliName: 'সাইবারপাঙ্ক সিন্থওয়েভ (সবচেয়ে জনপ্রিয়)',
    description: 'Hot Magenta, Electric Cyan, Neon Lemon & Royal Violet - বিশ্বের #১ নিওন স্টাইল',
    colors: ['#ff007f', '#00f3ff', '#ffe600', '#a855f7'],
    isPopular: true,
    popularityBadge: '🔥 #1 মোস্ট পপুলার',
    rank: 1,
  },
  {
    id: 'miami-vice',
    name: 'Miami Vice Tropical',
    bengaliName: 'মিয়ামি ভাইস ট্রপিক্যাল',
    description: 'Flamingo Pink, Ocean Cyan, Coral Sunrise & Golden Palm - ৮০র দশকের সুপারহিট নিওন',
    colors: ['#ff1493', '#00f0ff', '#ff5500', '#ffd700'],
    isPopular: true,
    popularityBadge: '🔥 ট্রেন্ডিং পপুলার',
    rank: 2,
  },
  {
    id: 'tokyo-midnight',
    name: 'Tokyo Midnight Club',
    bengaliName: 'টোকিও মিডনাইট ক্লাব',
    description: 'Laser Cobalt Blue, Aqua Neon, Vivid Orchid & Ice White',
    colors: ['#0055ff', '#00ffcc', '#d946ef', '#e0f7fa'],
    isPopular: true,
    popularityBadge: '⭐ টপ চয়েস',
    rank: 3,
  },
  {
    id: 'acid-matrix',
    name: 'Acid Matrix & Lime',
    bengaliName: 'অ্যাসিড ম্যাট্রিক্স ও লাইম',
    description: 'Radioactive Neon Lime, Electric Mint, Acid Gold & Cyan',
    colors: ['#39ff14', '#00ff66', '#facc15', '#00e5ff'],
    isPopular: true,
    popularityBadge: '⭐ হট নিওন',
    rank: 4,
  },
  {
    id: 'solar-fire',
    name: 'Solar Flare & Flame',
    bengaliName: 'সোলার ফ্লেয়ার ও অগ্নিশিখা',
    description: 'Flame Crimson Red, Blazing Orange, Amber Gold & Sunbeam',
    colors: ['#ff1744', '#ff6d00', '#ffb300', '#ffee58'],
    isPopular: true,
    popularityBadge: '🔥 জনপ্রিয় ট্রেন্ড',
    rank: 5,
  },
  {
    id: 'blood-moon',
    name: 'Blood Moon & Ruby',
    bengaliName: 'ব্লাড মুন ও রুবি রেড',
    description: 'Ruby Crimson, Dark Garnet, Neon Rose & Ember Peach',
    colors: ['#e11d48', '#ff0055', '#be123c', '#fb7185'],
    isPopular: true,
    popularityBadge: '⭐ প্রিয় প্যালেট',
    rank: 6,
  },
  {
    id: 'bioluminescence',
    name: 'Deep Sea Bioluminescence',
    bengaliName: 'সমুদ্রের নিওন বায়োলুমিনেসেন্স',
    description: 'Abyssal Marine Blue, Turquoise Glow, Seafoam & Aqua',
    colors: ['#0284c7', '#06b6d4', '#10b981', '#6ee7b7'],
    rank: 7,
  },
  {
    id: 'ultra-violet-ice',
    name: 'Ultraviolet & Frost',
    bengaliName: 'আল্ট্রাভায়োলেট ও আইস ফ্রস্ট',
    description: 'Deep Cosmic Purple, Radiant Lilac, Cyan Frost & Snow White',
    colors: ['#7c3aed', '#c084fc', '#38bdf8', '#ffffff'],
    rank: 8,
  },
  {
    id: 'emerald-luxe',
    name: 'Emerald & Champagne Gold',
    bengaliName: 'পান্না ও গোল্ডেন লাক্সারি',
    description: 'Jeweled Emerald, Mint Sparkle, Warm Imperial Gold & Champagne',
    colors: ['#059669', '#34d399', '#f59e0b', '#fef08a'],
    rank: 9,
  },
  {
    id: 'retro-arcade-rainbow',
    name: 'Retro 80s Arcade Rainbow',
    bengaliName: 'রেট্রো ৮০স আর্কেড রেইনবো',
    description: 'Vibrant 6-tone arcade spectrum with maximum contrast',
    colors: ['#ff0055', '#ff9900', '#ffe600', '#00ff66', '#00f3ff', '#a855f7'],
    rank: 10,
  },
];

/**
 * Parses Hex color string to {r, g, b}
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 0, g: 243, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Converts {r, g, b} to #rrggbb string
 */
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Interpolates smoothly between multi-stop color palette for factor t in [0, 1]
 */
export function interpolatePaletteColor(paletteColors: string[], t: number): string {
  if (paletteColors.length === 0) return '#00f3ff';
  if (paletteColors.length === 1) return paletteColors[0];

  const clampedT = Math.max(0, Math.min(1, t));
  const scaled = clampedT * (paletteColors.length - 1);
  const index = Math.floor(scaled);
  const fraction = scaled - index;

  if (index >= paletteColors.length - 1) {
    return paletteColors[paletteColors.length - 1];
  }

  const c1 = hexToRgb(paletteColors[index]);
  const c2 = hexToRgb(paletteColors[index + 1]);

  const r = c1.r + (c2.r - c1.r) * fraction;
  const g = c1.g + (c2.g - c1.g) * fraction;
  const b = c1.b + (c2.b - c1.b) * fraction;

  return rgbToHex(r, g, b);
}

/**
 * Curated Top Vibrant Single Neon Color Swatches for instant multi-path coloring
 */
export const POPULAR_NEON_SWATCHES = [
  { name: 'Electric Cyan (সায়ান)', hex: '#00f3ff' },
  { name: 'Neon Hot Pink (গোলাপি)', hex: '#ff007f' },
  { name: 'Radioactive Lime (সবুজ)', hex: '#39ff14' },
  { name: 'Neon Lemon Yellow (হলুদ)', hex: '#ffe600' },
  { name: 'Blazing Orange (কমলা)', hex: '#ff6600' },
  { name: 'Ruby Crimson Red (লাল)', hex: '#ff1744' },
  { name: 'Cosmic Violet (বেগুনি)', hex: '#a855f7' },
  { name: 'Pure White Frost (সাদা)', hex: '#ffffff' },
  { name: 'Golden Amber (সোনালী)', hex: '#ffb300' },
  { name: 'Turquoise Aqua (নীল-সবুজ)', hex: '#00ffcc' },
  { name: 'Laser Cobalt Blue (নীল)', hex: '#0066ff' },
  { name: 'Coral Sunrise (কোরাল)', hex: '#ff5533' },
];

/**
 * Applies a selected palette across SVG layers (all layers or only selected ones).
 * Modes:
 * - 'cycle': alternates palette colors 0, 1, 2, ... sequentially
 * - 'gradient': smoothly interpolates palette across layers 0 to 1
 * - 'grouped': groups layers in sequential bands
 */
export function applyPaletteToLayers(
  layers: SvgPathLayer[],
  paletteColors: string[],
  mode: 'cycle' | 'gradient' | 'grouped' = 'gradient',
  targetLayerIds?: string[]
): SvgPathLayer[] {
  if (layers.length === 0 || paletteColors.length === 0) return layers;

  const targetSet = targetLayerIds && targetLayerIds.length > 0 ? new Set(targetLayerIds) : null;
  const filteredLayers = targetSet ? layers.filter((l) => targetSet.has(l.id)) : layers;
  const total = filteredLayers.length;

  let filteredIdx = 0;

  return layers.map((layer) => {
    if (targetSet && !targetSet.has(layer.id)) {
      return layer;
    }

    const index = filteredIdx++;
    let chosenColor: string;

    if (mode === 'gradient') {
      const t = total <= 1 ? 0 : index / (total - 1);
      chosenColor = interpolatePaletteColor(paletteColors, t);
    } else if (mode === 'grouped') {
      const groupSize = Math.max(3, Math.ceil(total / paletteColors.length));
      const groupIdx = Math.floor(index / groupSize) % paletteColors.length;
      chosenColor = paletteColors[groupIdx];
    } else {
      // cycle
      chosenColor = paletteColors[index % paletteColors.length];
    }

    return {
      ...layer,
      color: chosenColor,
      glowColor: chosenColor,
    };
  });
}

/**
 * Assigns the EXACT same color to all selected paths.
 * E.g., for bird legs: selects both legs and gives them the same #ff6600 or any chosen color!
 */
export function applyColorToSelectedLayers(
  layers: SvgPathLayer[],
  selectedIds: string[],
  color: string,
  glowColor?: string
): SvgPathLayer[] {
  if (!selectedIds || selectedIds.length === 0) return layers;
  const set = new Set(selectedIds);
  const glow = glowColor || color;

  return layers.map((layer) => {
    if (set.has(layer.id)) {
      return {
        ...layer,
        color,
        glowColor: glow,
      };
    }
    return layer;
  });
}

