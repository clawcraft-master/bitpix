# BitPix 🎨

**The TouchDesigner of pixel art.**

A browser-based, node-based generative tool for creating live pixel art visuals. Think live coding music, but for lo-fi visuals.

## Features

- **Node-based workflow** - Connect generators, effects, and compositing nodes
- **Real-time preview** - See changes instantly
- **Pixel art first** - Palettes, dithering, pixelation effects built-in
- **Live performance ready** - BPM sync, oscillators, fullscreen output

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:3000

## Node Types

### Generators
- **Noise** - Simplex noise with octaves, animated
- **Color** - Solid HSV color
- **Gradient** - Two-color gradients (horizontal, vertical, radial)

### Animation
- **Oscillator** - Sine, saw, square, triangle waves
- **LFO** - BPM-synced oscillator

### Effects
- **Palette** - Quantize to classic palettes (PICO-8, Game Boy, CGA)
- **Pixelate** - Reduce resolution for chunkier pixels
- **Threshold** - 1-bit black and white
- **Invert** - Invert colors

### Compositing
- **Blend** - Mix, add, multiply, screen, overlay modes
- **Mask** - Use one buffer as alpha mask

### Output
- **Display** - Final output for rendering

## Controls

- **▶ Play / ⏸ Pause** - Toggle animation
- **⛶ Fullscreen** - Full-screen preview (ESC to exit)
- **Right-click canvas** - Add nodes
- **Drag** - Move nodes
- **Click output → drag to input** - Connect nodes

## Roadmap

- [ ] Audio input (Web Audio API)
- [ ] MIDI mapping (Web MIDI API)
- [ ] Sprite import node
- [ ] Dithering node (Floyd-Steinberg, ordered)
- [ ] Export GIF/sprite sheet
- [ ] Preset save/load
- [ ] More generators (shapes, patterns, text)

## Tech Stack

- TypeScript
- Vite
- LiteGraph.js
- Canvas 2D

## License

MIT
