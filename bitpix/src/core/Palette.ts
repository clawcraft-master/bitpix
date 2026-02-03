/**
 * Color palette utilities for pixel art.
 * Includes classic palettes and color manipulation.
 */

export type Color = [number, number, number, number] // RGBA

export interface Palette {
  name: string
  colors: Color[]
}

/** Classic palettes */
export const PALETTES: Record<string, Palette> = {
  pico8: {
    name: 'PICO-8',
    colors: [
      [0, 0, 0, 255],       // black
      [29, 43, 83, 255],    // dark blue
      [126, 37, 83, 255],   // dark purple
      [0, 135, 81, 255],    // dark green
      [171, 82, 54, 255],   // brown
      [95, 87, 79, 255],    // dark grey
      [194, 195, 199, 255], // light grey
      [255, 241, 232, 255], // white
      [255, 0, 77, 255],    // red
      [255, 163, 0, 255],   // orange
      [255, 236, 39, 255],  // yellow
      [0, 228, 54, 255],    // green
      [41, 173, 255, 255],  // blue
      [131, 118, 156, 255], // lavender
      [255, 119, 168, 255], // pink
      [255, 204, 170, 255], // peach
    ]
  },
  gameboy: {
    name: 'Game Boy',
    colors: [
      [15, 56, 15, 255],    // darkest
      [48, 98, 48, 255],
      [139, 172, 15, 255],
      [155, 188, 15, 255],  // lightest
    ]
  },
  cga: {
    name: 'CGA',
    colors: [
      [0, 0, 0, 255],
      [0, 170, 170, 255],
      [170, 0, 170, 255],
      [170, 170, 170, 255],
    ]
  },
  grayscale: {
    name: 'Grayscale',
    colors: [
      [0, 0, 0, 255],
      [85, 85, 85, 255],
      [170, 170, 170, 255],
      [255, 255, 255, 255],
    ]
  }
}

/** Find nearest color in palette */
export function nearestColor(r: number, g: number, b: number, palette: Palette): Color {
  let minDist = Infinity
  let nearest = palette.colors[0]
  
  for (const color of palette.colors) {
    const dr = r - color[0]
    const dg = g - color[1]
    const db = b - color[2]
    const dist = dr * dr + dg * dg + db * db
    if (dist < minDist) {
      minDist = dist
      nearest = color
    }
  }
  
  return nearest
}

/** Convert HSV to RGB */
export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = h % 1
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  let r: number, g: number, b: number
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
    default: r = 0; g = 0; b = 0
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}
