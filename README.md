# Neon Sign Design Studio

A professional browser-based graphics editor that transforms line art, ink drawings, and vector illustrations into realistic neon sign artwork with multi-layered glow physics, custom backgrounds, and high-resolution export.

---

## Key Features

### 1. Real Local Processing Engine (100% Client-Side)
- **Zero Cloud or API Dependencies**: All raster operations, alpha masking, blur passes, and SVG vector rendering happen locally inside the browser using Canvas 2D and SVG APIs. No data or artwork leaves your machine.
- **Alpha-Aware Extraction**:
  - `Auto Detect`: Analyzes background luminance and alpha distribution.
  - `Dark Lines on Light`: Isolates ink drawings, pen sketches, and black lines on paper with adaptive thresholding.
  - `Light Lines on Dark`: Extracts white sketches or blackboard outlines.
  - `Transparent Line Art`: Direct alpha weighting for transparent PNG illustrations.
  - `Colored Outline`: Isolates chromatic contours from neutral backgrounds.
- **Line Art Cleanup & Morphology**:
  - Denoise filter: Eliminates scanning speckles and dust.
  - Smoothing filter: 2-pass separable blur for fluid lines.
  - Gap repair (morphological closing): Bridges broken hairline gaps in hand-drawn sketches.
  - Mask inspection mode: Displays extracted white/neon line mask on checkerboard.

### 2. Physical Multi-Layer Neon Glow Engine
1. **Wide Ambient Glow**: Large radius (20–250 px), soft-falloff light spread across the environment.
2. **Outer Glow Halo**: Vibrant, saturated colored halo around the tube.
3. **Inner Glow**: Tight, high-intensity illumination right at the tube perimeter.
4. **Crisp Neon Tube Body**: Solid colored glass stroke with adjustable thickness, custom caps (round, square, butt), and joins (round, miter, bevel).
5. **Hot Core Highlight**: Narrow, bright white (or tinted) center highlight simulating incandescent neon gas ionization.
6. **Physical Realism Passes**:
   - Ambient light spill cast onto the background wall.
   - 3D contact shadows offset behind elevated tubes.
   - Realistic chrome and rubber standoff mounting clips.
   - Cylindrical glass tube specular reflections.
   - Live electrical tube flicker animation simulating AC line hum and micro-dips.

### 3. Backgrounds & Environments
- **Procedural Dark Brick Wall**: Procedurally generated staggered brick rows, realistic mortar lines, uneven brick color variations, and surface noise.
- **Procedural Industrial Concrete**: Slate plaster and cement pores with subtle texture.
- **Studio Gradients**: Deep Navy Studio, Synthwave Purple, Charcoal, and Pure Black.
- **Transparent Checkerboard**: Seamless transparent background for sticker and transparent graphic export.
- **Custom Image Upload**: Use your own wall photography with brightness, blur, and vignette adjustments.

### 4. Vector EPS & SVG Multi-Layer Stroke Control
- **EPS (Encapsulated PostScript) Native Parser**: Parses both ASCII PostScript and DOS binary EPS formats directly in the browser, translating PostScript path tokens (`moveto`, `lineto`, `curveto`, `closepath`, `setlinewidth`, `setrgbcolor`) into standardized vector paths with inverted Y-axis compensation.
- **Safe SVG Parser**: XML/DOM parsing with script, event handler, and external entity sanitization.
- **Separated Stroke Layers**: Automatically extracts distinct line paths as separated layers with individual neon colors.
- **"+ Upload Stroke Layer" Workflow**: Upload multiple `.eps` or `.svg` files incrementally onto the canvas. Each stroke layer has its own:
  - Custom neon tube color picker.
  - Custom glow color picker.
  - Individual stroke thickness control (1–36 px).
  - Visibility toggle, reordering (up/down), and layer deletion.
  - "Rainbow Palette" button to auto-distribute vibrant neon colors across all strokes.

### 5. 9 Built-In Presets & Custom Presets
1. **Classic Neon Sign**: Vibrant ruby red & warm glow on vintage dark brick.
2. **Electric Cyan**: Laser-crisp electric cyan in dark studio environment.
3. **Hot Pink Neon**: Vivid magenta glow with lavender ambient wall reflections.
4. **Warm Yellow Neon**: Golden diner yellow with soft amber radiance.
5. **Retro Multi-Color**: 80s synthwave multi-tone palette.
6. **Minimal Neon Outline**: 4px precision glass tubes with crisp white core.
7. **Soft Ambient Neon**: Dreamy wide diffuse bloom and atmospheric spread.
8. **High-Intensity Neon**: Blistering high-voltage brilliance and lime glow.
9. **Transparent Neon Artwork**: Optimized for transparent PNG export.
- Save custom presets to `localStorage`, export as JSON, or import shared JSON preset files.

### 6. High-Resolution Export
- **PNG**: Download with true alpha transparency (preserving ambient glow falloffs) or with the background wall.
- **JPEG**: Download with selected background texture and adjustable quality (50%–100%).
- **WebP**: Modern high-compression format.
- **SVG**: Vector export with layered paths and `<feGaussianBlur>` glow filters when source is vector.
- **Resolution Scaling**: 1x (Original), 2x (High-Res), or 3x (Ultra Print) with preserved aspect ratio.

---

## Project Structure

```
src/
├── types/
│   └── neon.ts                  # Settings, presets, layers, and info interfaces
├── engine/
│   ├── lineArtProcessor.ts      # Alpha detection, thresholding, denoise, morphology, smoothing
│   ├── neonRenderer.ts          # Multi-layer glow engine, compositing, tone curves
│   ├── proceduralBackgrounds.ts # Brick wall, concrete, vignette, contact shadows, standoffs
│   ├── svgParser.ts             # Safe SVG sanitizer and path layer extractor
│   ├── presets.ts               # 9 built-in presets & localStorage custom preset storage
│   └── exportManager.ts         # Multi-format scaling export pipeline
├── samples/
│   └── sampleArt.ts             # Built-in vector line artworks (Flamingo, Coffee, Cocktail, etc.)
├── components/
│   ├── Toolbar.tsx              # Top bar (Open, Samples, Undo/Redo, Zoom, Compare, Export)
│   ├── LeftPanel.tsx            # Line art extraction settings & SVG path layer inspector
│   ├── CanvasViewport.tsx       # Interactive pan, zoom, checkerboard, and split wipe slider
│   ├── RightPanel.tsx           # Tube, Glow, Color, Wall, Realism, and Tone controls
│   ├── PresetModal.tsx          # Preset selector and JSON manager
│   ├── ExportModal.tsx          # Multi-resolution export dialog
│   └── StatusBar.tsx            # Resolution, vector path count, render latency, zoom %
├── App.tsx                      # Main application orchestrator
├── index.css                    # Tailwind CSS v4 and typography
└── main.tsx                     # Entry point
```

---

## Supported File Formats

| Format | Notes |
| :--- | :--- |
| **PNG** | Supports transparent alpha backgrounds and opaque line drawings. |
| **JPG / JPEG** | Ideal for scanned ink sketches or pencil drawings (use *Dark Lines on Light*). |
| **WebP** | Supported with or without alpha channel. |
| **SVG** | Sanitized vector paths; allows per-path independent colors and stroke thickness. |

---

## Honest Limitations

1. **Raster vs. Vector Layers**: A single raster PNG or JPG image cannot be separated into individually editable vector strokes without manual semantic tracing. For raster inputs, color mapping applies via unified gradients or multi-tone spectrums. True independent layer selection is available for SVG inputs.
2. **Extreme Resolutions**: Files larger than 4096×4096 pixels can be processed, but rendering multiple 200px Gaussian blur passes on very large canvases may increase render latency on lower-end devices.

---

## Verification & Testing Performed

- [x] Transparent PNG import with alpha-aware glow preserves transparency on export.
- [x] Scanned black ink on white paper extracted cleanly via threshold and contrast controls.
- [x] SVG parsing sanitizes dangerous scripts and extracts distinct paths with independent color assignments.
- [x] All 9 built-in presets apply genuine engine settings without UI desynchronization.
- [x] Live interactive before/after split slider enables direct visual comparison.
- [x] 1x, 2x, and 3x PNG export verified with preserved aspect ratio and proper alpha channels.
- [x] Procedural brick wall and industrial concrete render smoothly without external image assets.
- [x] Keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`, `+`, `-`, `0`) operate reliably.
