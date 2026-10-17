/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InputMode = 
  | 'auto' 
  | 'dark-on-light' 
  | 'light-on-dark' 
  | 'transparent-line' 
  | 'colored-outline';

export interface LineArtSettings {
  mode: InputMode;
  threshold: number; // 0 - 255
  contrast: number; // -100 to 100
  invert: boolean;
  denoise: number; // 0 - 10
  smoothing: number; // 0 - 10
  gapRepair: number; // 0 - 5
  previewMask: boolean;
}

export interface NeonTubeSettings {
  thickness: number; // 1 - 40 px
  edgeSharpness: number; // 0 - 100
  lineCap: 'round' | 'square' | 'butt';
  lineJoin: 'round' | 'miter' | 'bevel';
  tubeBrightness: number; // 0 - 200%
  tubeOpacity: number; // 0 - 100%
  coreVisible: boolean;
  coreWidth: number; // 10 - 70% of tube
  coreBrightness: number; // 50 - 300%
  coreColor: string; // hex
  glassBorder?: boolean; // Sharp 3D glass tube border & rim highlight
  laserSharpCore?: boolean; // Ultra-crisp 0-blur pure white incandescent core
}

export interface NeonGlowSettings {
  innerGlowEnabled: boolean;
  innerGlowRadius: number; // 1 - 30 px
  innerGlowIntensity: number; // 0 - 200%
  outerGlowEnabled: boolean;
  outerGlowRadius: number; // 5 - 120 px
  outerGlowIntensity: number; // 0 - 200%
  ambientGlowEnabled: boolean;
  ambientGlowRadius: number; // 20 - 250 px
  ambientGlowIntensity: number; // 0 - 200%
  bloomIntensity: number; // 0 - 200%
  glowFalloff: 'smooth' | 'exponential' | 'linear';
  glowMultiplier: number; // 1.0 to 3.5 (Power multiplier for eye-dazzling glow)
  hyperGlow: boolean; // Blinding luminescence mode
  dazzleBoost: number; // 0 - 100% (High-intensity plasma saturation)
}

export interface NeonColorSettings {
  colorMode: 'single' | 'dual' | 'multi';
  primaryColor: string; // hex
  secondaryColor: string; // hex
  glowColor: string; // hex (optional override or matches primary)
  syncGlowColor: boolean; // if true, glowColor = primaryColor
  hueShift: number; // -180 to 180 deg
  saturation: number; // 0 - 200%
  brightness: number; // 0 - 200%
  gradientAngle: number; // 0 - 360 deg
}

export type BackgroundType = 
  | 'transparent' 
  | 'black' 
  | 'charcoal' 
  | 'dark-blue' 
  | 'dark-purple' 
  | 'brick-wall' 
  | 'concrete' 
  | 'custom-color' 
  | 'custom-image';

export interface NeonBackgroundSettings {
  type: BackgroundType;
  customColor: string;
  customImageSrc: string | null;
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  blur: number; // 0 - 40 px
  vignette: number; // 0 - 100%
}

export interface NeonRealismSettings {
  lightSpill: boolean;
  lightSpillIntensity: number; // 0 - 100%
  wallReflection: boolean;
  reflectionStrength: number; // 0 - 100%
  glassHighlights: boolean;
  contactShadows: boolean;
  wallMounts: boolean; // metallic standoff clamps holding the tube
  starburstFlares: boolean; // optical 4-point star lens flares on corners
  flareIntensity: number; // 0 - 100%
  flicker: boolean;
  flickerSpeed: number; // 1 - 10
}

export type BlendMode = 'screen' | 'lighter' | 'color-dodge' | 'source-over';

export interface NeonToneSettings {
  blendMode: BlendMode;
  overallOpacity: number; // 0 - 100%
  toneBrightness: number; // -100 to 100
  toneContrast: number; // -100 to 100
  gamma: number; // 0.4 to 2.5
  grain: number; // 0 - 100%
  qualityMode: 'preview' | 'high-quality';
}

export interface SvgPathLayer {
  id: string;
  name: string;
  d: string;
  originalStroke?: string;
  originalFill?: string;
  color?: string;
  glowColor?: string;
  thickness?: number;
  coreWidth?: number;
  opacity?: number;
  visible: boolean;
  transform?: string;
}

export interface NeonSettings {
  lineArt: LineArtSettings;
  tube: NeonTubeSettings;
  glow: NeonGlowSettings;
  color: NeonColorSettings;
  background: NeonBackgroundSettings;
  realism: NeonRealismSettings;
  tone: NeonToneSettings;
}

export interface NeonPreset {
  id: string;
  name: string;
  description: string;
  previewColor: string;
  settings: NeonSettings;
  isCustom?: boolean;
}

export interface ProcessedImageInfo {
  width: number;
  height: number;
  aspectRatio: number;
  type: 'raster' | 'svg' | 'eps';
  fileName: string;
  fileSizeFormatted: string;
  hasAlpha: boolean;
  averageLuminance: number;
}
