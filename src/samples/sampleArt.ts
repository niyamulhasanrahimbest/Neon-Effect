/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SampleArtwork {
  id: string;
  title: string;
  category: string;
  type: 'svg' | 'raster';
  svgContent: string;
}

export const SAMPLE_ARTWORKS: SampleArtwork[] = [
  {
    id: 'cyber-envelope',
    title: 'Neon Cyber Envelope',
    category: 'Cyberpunk Icons',
    type: 'svg',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <!-- Outer Frame Left Side (Magenta Pink) -->
      <path d="M 250 110 L 125 110 C 95 110, 75 130, 75 160 L 75 340 C 75 370, 95 390, 125 390 L 250 390" stroke="#ff007f" />
      <!-- Outer Frame Right Side (Electric Cyan) -->
      <path d="M 250 110 L 375 110 C 405 110, 425 130, 425 160 L 425 340 C 425 370, 405 390, 375 390 L 250 390" stroke="#00f3ff" />
      <!-- Top Envelope Flap Left Half (Magenta Pink) -->
      <path d="M 105 140 L 250 270" stroke="#ff007f" />
      <!-- Top Envelope Flap Right Half (Electric Cyan) -->
      <path d="M 250 270 L 395 140" stroke="#00f3ff" />
      <!-- Bottom Diagonal Fold Left (Magenta Pink) -->
      <path d="M 105 360 L 210 250" stroke="#ff007f" />
      <!-- Bottom Diagonal Fold Right (Electric Cyan) -->
      <path d="M 395 360 L 290 250" stroke="#00f3ff" />
    </svg>`
  },
  {
    id: 'flamingo',
    title: 'Neon Flamingo',
    category: 'Fauna',
    type: 'svg',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 650" width="500" height="650" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      <!-- Flamingo Head & Beak -->
      <path d="M 280 130 C 275 80, 210 70, 185 110 C 165 140, 175 190, 205 210 C 220 220, 235 240, 240 270 C 245 320, 240 360, 225 390" stroke="#ff007f" />
      <path d="M 185 110 C 160 115, 120 130, 115 150 C 120 165, 155 160, 175 155" stroke="#ffe600" />
      <path d="M 115 150 L 130 160" stroke="#ffffff" />
      <!-- Eye -->
      <circle cx="180" cy="125" r="5" fill="#ffffff" stroke="#ffffff" stroke-width="2" />
      <!-- Body -->
      <path d="M 225 390 C 180 400, 120 370, 140 320 C 155 280, 210 275, 270 290 C 330 305, 370 360, 340 410 C 315 445, 260 450, 215 435" stroke="#ff007f" />
      <!-- Wing -->
      <path d="M 200 330 C 250 330, 295 360, 310 400 C 270 415, 220 400, 180 370 C 200 350, 225 345, 250 350" stroke="#ff40a0" />
      <!-- Standing Leg -->
      <path d="M 270 440 L 270 560 L 250 560 M 270 560 L 285 560" stroke="#00f3ff" />
      <!-- Bent Leg -->
      <path d="M 245 440 L 220 490 L 265 500" stroke="#00f3ff" />
      <!-- Water ripples -->
      <path d="M 180 580 C 230 575, 310 575, 360 580" stroke="#00f3ff" />
      <path d="M 210 605 C 245 600, 290 600, 325 605" stroke="#00bfff" />
    </svg>`
  },
  {
    id: 'cocktail',
    title: 'Cocktail & Palm',
    category: 'Bar & Lounge',
    type: 'svg',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" width="500" height="600" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      <!-- Martini Glass -->
      <path d="M 120 180 L 250 330 L 380 180 Z" stroke="#00f3ff" />
      <!-- Stem and base -->
      <path d="M 250 330 L 250 480" stroke="#00f3ff" />
      <path d="M 180 480 L 320 480" stroke="#00f3ff" />
      <!-- Liquid line -->
      <path d="M 160 230 L 340 230" stroke="#ff007f" />
      <!-- Olive on stick -->
      <path d="M 150 140 L 280 290" stroke="#ffe600" />
      <circle cx="230" cy="235" r="18" stroke="#00ff66" />
      <circle cx="230" cy="235" r="4" fill="#ff0055" stroke="#ff0055" />
      <!-- Citrus Slice on Rim -->
      <path d="M 360 170 C 375 140, 420 145, 430 175 C 440 205, 400 225, 375 200 Z" stroke="#ffe600" />
      <path d="M 370 175 L 420 190 M 395 155 L 395 210" stroke="#ffe600" stroke-width="4" />
      <!-- Sparkles -->
      <path d="M 100 130 L 100 150 M 90 140 L 110 140" stroke="#ff00ff" stroke-width="4" />
      <path d="M 390 100 L 390 120 M 380 110 L 400 110" stroke="#00f3ff" stroke-width="4" />
    </svg>`
  },
  {
    id: 'coffee',
    title: 'Cafe Espresso',
    category: 'Cafe',
    type: 'svg',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      <!-- Cup Body -->
      <path d="M 130 200 L 145 360 C 150 390, 200 410, 250 410 C 300 410, 350 390, 355 360 L 370 200 Z" stroke="#ffe600" />
      <!-- Cup Handle -->
      <path d="M 365 230 C 420 230, 430 320, 360 330" stroke="#ffe600" />
      <!-- Saucer plate -->
      <path d="M 90 410 C 130 450, 370 450, 410 410 L 90 410 Z" stroke="#ff7700" />
      <!-- Rising Steam 1 -->
      <path d="M 190 160 C 180 130, 210 100, 195 70" stroke="#00f3ff" />
      <!-- Rising Steam 2 -->
      <path d="M 250 160 C 265 125, 235 95, 255 60" stroke="#ff007f" />
      <!-- Rising Steam 3 -->
      <path d="M 310 160 C 300 130, 330 100, 315 70" stroke="#00f3ff" />
    </svg>`
  },
  {
    id: 'guitar',
    title: 'Electric Rock Guitar',
    category: 'Music',
    type: 'svg',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 650" width="500" height="650" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      <!-- Body outline -->
      <path d="M 220 330 C 180 320, 140 360, 140 420 C 140 470, 170 510, 190 560 C 210 610, 290 610, 310 560 C 330 510, 360 470, 360 420 C 360 360, 320 320, 280 330" stroke="#ff0055" />
      <!-- Horns -->
      <path d="M 180 330 C 150 290, 160 250, 185 240 C 205 250, 215 285, 220 330" stroke="#ff0055" />
      <path d="M 320 330 C 345 290, 340 260, 320 250 C 305 260, 295 295, 280 330" stroke="#ff0055" />
      <!-- Neck -->
      <path d="M 235 330 L 235 140 L 265 140 L 265 330" stroke="#00f3ff" />
      <!-- Headstock -->
      <path d="M 230 140 L 225 70 C 245 60, 275 60, 280 90 L 270 140 Z" stroke="#ffe600" />
      <!-- Tuning Pegs -->
      <path d="M 215 80 L 225 80 M 215 100 L 225 100 M 215 120 L 225 120" stroke="#ffe600" stroke-width="5" />
      <!-- Pickups & bridge -->
      <rect x="235" y="380" width="30" height="15" rx="4" stroke="#00f3ff" />
      <rect x="235" y="420" width="30" height="15" rx="4" stroke="#00f3ff" />
      <path d="M 230 470 L 270 470" stroke="#ffffff" stroke-width="5" />
      <!-- Volume knob -->
      <circle cx="310" cy="480" r="12" stroke="#ffe600" />
      <!-- Lightning bolt accent -->
      <path d="M 100 220 L 80 270 L 110 265 L 90 320" stroke="#ffe600" stroke-width="5" />
    </svg>`
  },
  {
    id: 'cyber-skull',
    title: 'Cyberpunk Skull',
    category: 'Stylized',
    type: 'svg',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 550" width="500" height="550" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      <!-- Cranium -->
      <path d="M 150 250 C 120 180, 160 80, 250 80 C 340 80, 380 180, 350 250 C 360 290, 340 330, 320 340 L 320 420 L 180 420 L 180 340 C 160 330, 140 290, 150 250 Z" stroke="#00ffcc" />
      <!-- Eye Sockets -->
      <path d="M 175 220 C 160 250, 210 290, 225 250 C 235 220, 195 200, 175 220 Z" stroke="#ff007f" />
      <path d="M 325 220 C 340 250, 290 290, 275 250 C 265 220, 305 200, 325 220 Z" stroke="#ff007f" />
      <!-- Nose cavity -->
      <path d="M 250 270 L 235 315 L 265 315 Z" stroke="#00f3ff" />
      <!-- Teeth -->
      <path d="M 195 380 L 195 410 M 220 380 L 220 410 M 250 375 L 250 415 M 280 380 L 280 410 M 305 380 L 305 410" stroke="#00ffcc" stroke-width="5" />
      <path d="M 180 395 L 320 395" stroke="#00ffcc" stroke-width="5" />
    </svg>`
  }
];
