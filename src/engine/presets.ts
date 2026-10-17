/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NeonPreset, NeonSettings } from '../types/neon';

export const DEFAULT_SETTINGS: NeonSettings = {
  lineArt: {
    mode: 'auto',
    threshold: 128,
    contrast: 20,
    invert: false,
    denoise: 1,
    smoothing: 2,
    gapRepair: 1,
    previewMask: false,
  },
  tube: {
    thickness: 3,
    edgeSharpness: 95,
    lineCap: 'round',
    lineJoin: 'round',
    tubeBrightness: 115,
    tubeOpacity: 98,
    coreVisible: true,
    coreWidth: 35,
    coreBrightness: 175,
    coreColor: '#ffffff',
    glassBorder: false,
    laserSharpCore: true,
  },
  glow: {
    innerGlowEnabled: true,
    innerGlowRadius: 7,
    innerGlowIntensity: 110,
    outerGlowEnabled: true,
    outerGlowRadius: 38,
    outerGlowIntensity: 95,
    ambientGlowEnabled: true,
    ambientGlowRadius: 95,
    ambientGlowIntensity: 65,
    bloomIntensity: 85,
    glowFalloff: 'smooth',
    glowMultiplier: 1.6,
    hyperGlow: true,
    dazzleBoost: 85,
  },
  color: {
    colorMode: 'dual',
    primaryColor: '#ff007f',
    secondaryColor: '#00f3ff',
    glowColor: '#ff007f',
    syncGlowColor: true,
    hueShift: 0,
    saturation: 110,
    brightness: 110,
    gradientAngle: 45,
  },
  background: {
    type: 'black',
    customColor: '#080a12',
    customImageSrc: null,
    brightness: 0,
    contrast: 15,
    blur: 0,
    vignette: 65,
  },
  realism: {
    lightSpill: true,
    lightSpillIntensity: 65,
    wallReflection: true,
    reflectionStrength: 45,
    glassHighlights: false,
    contactShadows: false,
    wallMounts: false,
    starburstFlares: false,
    flareIntensity: 0,
    flicker: false,
    flickerSpeed: 4,
  },
  tone: {
    blendMode: 'lighter',
    overallOpacity: 100,
    toneBrightness: 5,
    toneContrast: 15,
    gamma: 1.05,
    grain: 10,
    qualityMode: 'high-quality',
  },
};

export const BUILT_IN_PRESETS: NeonPreset[] = [
  {
    id: 'blazing-cyber',
    name: 'Blazing Cyber Neon',
    description: 'Ultra-intense dual-tone hot magenta & cyan with laser-sharp incandescent core',
    previewColor: '#ff007f',
    settings: {
      ...DEFAULT_SETTINGS,
      color: {
        ...DEFAULT_SETTINGS.color,
        colorMode: 'dual',
        primaryColor: '#ff007f',
        secondaryColor: '#00f3ff',
        syncGlowColor: true,
      },
      glow: {
        ...DEFAULT_SETTINGS.glow,
        innerGlowIntensity: 100,
        outerGlowIntensity: 100,
        outerGlowRadius: 42,
        ambientGlowRadius: 110,
        bloomIntensity: 85,
      },
      tube: {
        ...DEFAULT_SETTINGS.tube,
        coreBrightness: 185,
        coreWidth: 35,
        thickness: 3,
      },
      realism: {
        ...DEFAULT_SETTINGS.realism,
        starburstFlares: false,
        flareIntensity: 0,
      },
      background: {
        ...DEFAULT_SETTINGS.background,
        type: 'black',
        vignette: 70,
      },
    },
  },
  {
    id: 'classic-neon',
    name: 'Classic Neon Sign',
    description: 'Vibrant ruby red & warm glow mounted on vintage dark brick',
    previewColor: '#ff0055',
    settings: {
      ...DEFAULT_SETTINGS,
      color: {
        ...DEFAULT_SETTINGS.color,
        primaryColor: '#ff0044',
        secondaryColor: '#ffe600',
        syncGlowColor: true,
      },
      background: {
        ...DEFAULT_SETTINGS.background,
        type: 'brick-wall',
        vignette: 60,
      },
      realism: {
        ...DEFAULT_SETTINGS.realism,
        wallMounts: true,
        contactShadows: false,
        lightSpill: true,
      },
    },
  },
  {
    id: 'electric-cyan',
    name: 'Electric Cyan',
    description: 'Laser-crisp electric cyan with moody studio background',
    previewColor: '#00f3ff',
    settings: {
      ...DEFAULT_SETTINGS,
      color: {
        ...DEFAULT_SETTINGS.color,
        primaryColor: '#00f3ff',
        secondaryColor: '#0066ff',
        syncGlowColor: true,
      },
      background: {
        ...DEFAULT_SETTINGS.background,
        type: 'dark-blue',
        vignette: 50,
      },
      glow: {
        ...DEFAULT_SETTINGS.glow,
        outerGlowRadius: 32,
        ambientGlowRadius: 90,
        bloomIntensity: 55,
      },
    },
  },
  {
    id: 'hot-pink',
    name: 'Hot Pink Neon',
    description: 'Vivid magenta glow with lavender ambient wall reflections',
    previewColor: '#ff007f',
    settings: {
      ...DEFAULT_SETTINGS,
      color: {
        ...DEFAULT_SETTINGS.color,
        primaryColor: '#ff007f',
        secondaryColor: '#c026d3',
        syncGlowColor: true,
      },
      background: {
        ...DEFAULT_SETTINGS.background,
        type: 'dark-purple',
        vignette: 65,
      },
      glow: {
        ...DEFAULT_SETTINGS.glow,
        ambientGlowIntensity: 60,
        bloomIntensity: 50,
      },
    },
  },
  {
    id: 'warm-yellow',
    name: 'Warm Yellow Neon',
    description: 'Cozy golden diner yellow with soft amber radiance',
    previewColor: '#ffe600',
    settings: {
      ...DEFAULT_SETTINGS,
      color: {
        ...DEFAULT_SETTINGS.color,
        primaryColor: '#ffe600',
        secondaryColor: '#fb923c',
        syncGlowColor: true,
      },
      background: {
        ...DEFAULT_SETTINGS.background,
        type: 'charcoal',
        vignette: 45,
      },
      tube: {
        ...DEFAULT_SETTINGS.tube,
        thickness: 9,
      },
    },
  },
  {
    id: 'retro-multi',
    name: 'Retro Multi-Color',
    description: 'Vibrant 80s synthwave multi-color neon palette',
    previewColor: '#38bdf8',
    settings: {
      ...DEFAULT_SETTINGS,
      color: {
        ...DEFAULT_SETTINGS.color,
        colorMode: 'multi',
        primaryColor: '#00f3ff',
        secondaryColor: '#ff007f',
        syncGlowColor: false,
        glowColor: '#a855f7',
      },
      background: {
        ...DEFAULT_SETTINGS.background,
        type: 'brick-wall',
        vignette: 70,
      },
      glow: {
        ...DEFAULT_SETTINGS.glow,
        ambientGlowRadius: 100,
        bloomIntensity: 45,
      },
    },
  },
  {
    id: 'minimal-outline',
    name: 'Minimal Neon Outline',
    description: 'Ultra-refined thin 3px glass tubes with crisp white core',
    previewColor: '#ffffff',
    settings: {
      ...DEFAULT_SETTINGS,
      tube: {
        ...DEFAULT_SETTINGS.tube,
        thickness: 4,
        coreWidth: 45,
        coreBrightness: 150,
      },
      glow: {
        ...DEFAULT_SETTINGS.glow,
        innerGlowRadius: 4,
        outerGlowRadius: 14,
        ambientGlowRadius: 40,
        ambientGlowIntensity: 30,
        bloomIntensity: 25,
      },
      background: {
        ...DEFAULT_SETTINGS.background,
        type: 'black',
        vignette: 30,
      },
      realism: {
        ...DEFAULT_SETTINGS.realism,
        wallMounts: false,
      },
    },
  },
  {
    id: 'soft-ambient',
    name: 'Soft Ambient Neon',
    description: 'Dreamy wide diffuse bloom and atmospheric glow falloff',
    previewColor: '#a855f7',
    settings: {
      ...DEFAULT_SETTINGS,
      color: {
        ...DEFAULT_SETTINGS.color,
        primaryColor: '#a855f7',
        syncGlowColor: true,
      },
      tube: {
        ...DEFAULT_SETTINGS.tube,
        thickness: 7,
        tubeBrightness: 95,
      },
      glow: {
        ...DEFAULT_SETTINGS.glow,
        innerGlowIntensity: 70,
        outerGlowRadius: 45,
        outerGlowIntensity: 90,
        ambientGlowRadius: 140,
        ambientGlowIntensity: 75,
        bloomIntensity: 65,
      },
      background: {
        ...DEFAULT_SETTINGS.background,
        type: 'dark-purple',
        vignette: 50,
      },
    },
  },
  {
    id: 'high-intensity',
    name: 'High-Intensity Neon',
    description: 'Blistering high-voltage brilliance and intense neon bloom',
    previewColor: '#00ff66',
    settings: {
      ...DEFAULT_SETTINGS,
      color: {
        ...DEFAULT_SETTINGS.color,
        primaryColor: '#00ff66',
        syncGlowColor: true,
      },
      tube: {
        ...DEFAULT_SETTINGS.tube,
        thickness: 11,
        tubeBrightness: 140,
        coreBrightness: 160,
      },
      glow: {
        ...DEFAULT_SETTINGS.glow,
        innerGlowIntensity: 100,
        outerGlowIntensity: 100,
        outerGlowRadius: 50,
        ambientGlowRadius: 110,
        ambientGlowIntensity: 80,
        bloomIntensity: 75,
      },
      background: {
        ...DEFAULT_SETTINGS.background,
        type: 'concrete',
        vignette: 60,
      },
    },
  },
  {
    id: 'transparent-art',
    name: 'Transparent Neon Artwork',
    description: 'Engineered for transparent PNG export with crisp alpha fade',
    previewColor: '#38bdf8',
    settings: {
      ...DEFAULT_SETTINGS,
      background: {
        ...DEFAULT_SETTINGS.background,
        type: 'transparent',
      },
      glow: {
        ...DEFAULT_SETTINGS.glow,
        ambientGlowEnabled: true,
        ambientGlowRadius: 60,
        ambientGlowIntensity: 45,
      },
      realism: {
        ...DEFAULT_SETTINGS.realism,
        lightSpill: false,
        wallMounts: false,
        contactShadows: false,
      },
      tone: {
        ...DEFAULT_SETTINGS.tone,
        grain: 0,
      },
    },
  },
];

const STORAGE_KEY = 'neon_sign_custom_presets_v1';

export function getCustomPresets(): NeonPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomPreset(name: string, settings: NeonSettings): NeonPreset {
  const customPresets = getCustomPresets();
  const newPreset: NeonPreset = {
    id: `custom-${Date.now()}`,
    name,
    description: 'Custom user preset',
    previewColor: settings.color.primaryColor,
    settings: JSON.parse(JSON.stringify(settings)),
    isCustom: true,
  };
  customPresets.unshift(newPreset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets));
  return newPreset;
}

export function deleteCustomPreset(id: string): void {
  const customPresets = getCustomPresets().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets));
}
