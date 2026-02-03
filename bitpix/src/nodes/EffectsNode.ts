import { LiteGraph, LGraphNode } from 'litegraph.js'
import { PixelBuffer, BUFFER_WIDTH, BUFFER_HEIGHT } from '../core/PixelBuffer'
import { PALETTES, nearestColor } from '../core/Palette'
import { SLOT_TYPES, createBuffer } from './types'

/**
 * Quantize colors to a palette - classic pixel art look.
 */
export class PaletteNode extends LGraphNode {
  static title = 'Palette'
  static desc = 'Quantize to a color palette'

  outputBuffer: PixelBuffer

  constructor() {
    super()
    this.addInput('pixels', SLOT_TYPES.PIXELS)
    this.addOutput('pixels', SLOT_TYPES.PIXELS)

    this.properties = {
      palette: 'pico8'
    }

    this.outputBuffer = createBuffer()
    this.size = [140, 50]
  }

  onExecute() {
    const input = this.getInputData(0) as PixelBuffer | undefined
    if (!input) {
      this.outputBuffer.clear()
      this.setOutputData(0, this.outputBuffer)
      return
    }

    const palette = PALETTES[this.properties.palette] || PALETTES.pico8

    for (let i = 0; i < input.data.length; i += 4) {
      const [r, g, b, a] = nearestColor(input.data[i], input.data[i + 1], input.data[i + 2], palette)
      this.outputBuffer.data[i] = r
      this.outputBuffer.data[i + 1] = g
      this.outputBuffer.data[i + 2] = b
      this.outputBuffer.data[i + 3] = input.data[i + 3] // preserve original alpha
    }

    this.setOutputData(0, this.outputBuffer)
  }
}

LiteGraph.registerNodeType('effects/palette', PaletteNode)

/**
 * Pixelate - reduce resolution then scale back up.
 */
export class PixelateNode extends LGraphNode {
  static title = 'Pixelate'
  static desc = 'Reduce resolution (more chunky pixels)'

  outputBuffer: PixelBuffer

  constructor() {
    super()
    this.addInput('pixels', SLOT_TYPES.PIXELS)
    this.addInput('size', SLOT_TYPES.NUMBER)
    this.addOutput('pixels', SLOT_TYPES.PIXELS)

    this.properties = {
      size: 4
    }

    this.outputBuffer = createBuffer()
    this.size = [140, 60]
  }

  onExecute() {
    const input = this.getInputData(0) as PixelBuffer | undefined
    const size = Math.max(1, Math.floor(this.getInputData(1) ?? this.properties.size))

    if (!input) {
      this.outputBuffer.clear()
      this.setOutputData(0, this.outputBuffer)
      return
    }

    for (let by = 0; by < BUFFER_HEIGHT; by += size) {
      for (let bx = 0; bx < BUFFER_WIDTH; bx += size) {
        // Sample center of block
        const sx = Math.min(bx + Math.floor(size / 2), BUFFER_WIDTH - 1)
        const sy = Math.min(by + Math.floor(size / 2), BUFFER_HEIGHT - 1)
        const [r, g, b, a] = input.getPixel(sx, sy)

        // Fill block
        for (let y = by; y < Math.min(by + size, BUFFER_HEIGHT); y++) {
          for (let x = bx; x < Math.min(bx + size, BUFFER_WIDTH); x++) {
            this.outputBuffer.setPixel(x, y, r, g, b, a)
          }
        }
      }
    }

    this.setOutputData(0, this.outputBuffer)
  }
}

LiteGraph.registerNodeType('effects/pixelate', PixelateNode)

/**
 * Invert colors.
 */
export class InvertNode extends LGraphNode {
  static title = 'Invert'
  static desc = 'Invert colors'

  outputBuffer: PixelBuffer

  constructor() {
    super()
    this.addInput('pixels', SLOT_TYPES.PIXELS)
    this.addOutput('pixels', SLOT_TYPES.PIXELS)

    this.properties = {}

    this.outputBuffer = createBuffer()
    this.size = [100, 50]
  }

  onExecute() {
    const input = this.getInputData(0) as PixelBuffer | undefined
    if (!input) {
      this.outputBuffer.clear()
      this.setOutputData(0, this.outputBuffer)
      return
    }

    for (let i = 0; i < input.data.length; i += 4) {
      this.outputBuffer.data[i] = 255 - input.data[i]
      this.outputBuffer.data[i + 1] = 255 - input.data[i + 1]
      this.outputBuffer.data[i + 2] = 255 - input.data[i + 2]
      this.outputBuffer.data[i + 3] = input.data[i + 3]
    }

    this.setOutputData(0, this.outputBuffer)
  }
}

LiteGraph.registerNodeType('effects/invert', InvertNode)

/**
 * Threshold - convert to 1-bit black and white.
 */
export class ThresholdNode extends LGraphNode {
  static title = 'Threshold'
  static desc = '1-bit black and white'

  outputBuffer: PixelBuffer

  constructor() {
    super()
    this.addInput('pixels', SLOT_TYPES.PIXELS)
    this.addInput('threshold', SLOT_TYPES.NUMBER)
    this.addOutput('pixels', SLOT_TYPES.PIXELS)

    this.properties = {
      threshold: 0.5
    }

    this.outputBuffer = createBuffer()
    this.size = [140, 60]
  }

  onExecute() {
    const input = this.getInputData(0) as PixelBuffer | undefined
    const threshold = (this.getInputData(1) ?? this.properties.threshold) * 255

    if (!input) {
      this.outputBuffer.clear()
      this.setOutputData(0, this.outputBuffer)
      return
    }

    for (let i = 0; i < input.data.length; i += 4) {
      const lum = input.data[i] * 0.299 + input.data[i + 1] * 0.587 + input.data[i + 2] * 0.114
      const c = lum >= threshold ? 255 : 0
      this.outputBuffer.data[i] = c
      this.outputBuffer.data[i + 1] = c
      this.outputBuffer.data[i + 2] = c
      this.outputBuffer.data[i + 3] = input.data[i + 3]
    }

    this.setOutputData(0, this.outputBuffer)
  }
}

LiteGraph.registerNodeType('effects/threshold', ThresholdNode)
