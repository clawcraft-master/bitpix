import { LiteGraph, LGraphNode } from 'litegraph.js'
import { PixelBuffer, BUFFER_WIDTH, BUFFER_HEIGHT } from '../core/PixelBuffer'
import { hsvToRgb } from '../core/Palette'
import { SLOT_TYPES, createBuffer } from './types'

/**
 * Generates a solid color buffer.
 * Can be modulated by input for animation.
 */
export class ColorNode extends LGraphNode {
  static title = 'Color'
  static desc = 'Solid color generator'

  outputBuffer: PixelBuffer

  constructor() {
    super()
    this.addOutput('pixels', SLOT_TYPES.PIXELS)
    this.addInput('hue', SLOT_TYPES.NUMBER)
    this.addInput('saturation', SLOT_TYPES.NUMBER)
    this.addInput('value', SLOT_TYPES.NUMBER)

    this.properties = {
      hue: 0.0,        // 0-1
      saturation: 1.0, // 0-1
      value: 1.0       // 0-1
    }

    this.outputBuffer = createBuffer()
    this.size = [160, 90]
  }

  onExecute() {
    const h = this.getInputData(0) ?? this.properties.hue
    const s = this.getInputData(1) ?? this.properties.saturation
    const v = this.getInputData(2) ?? this.properties.value

    const [r, g, b] = hsvToRgb(h % 1, Math.max(0, Math.min(1, s)), Math.max(0, Math.min(1, v)))
    this.outputBuffer.fill(r, g, b, 255)

    this.setOutputData(0, this.outputBuffer)
  }
}

LiteGraph.registerNodeType('generators/color', ColorNode)

/**
 * Gradient generator - creates a gradient between two colors.
 */
export class GradientNode extends LGraphNode {
  static title = 'Gradient'
  static desc = 'Color gradient generator'

  outputBuffer: PixelBuffer

  constructor() {
    super()
    this.addOutput('pixels', SLOT_TYPES.PIXELS)
    this.addInput('offset', SLOT_TYPES.NUMBER)

    this.properties = {
      hue1: 0.0,
      hue2: 0.5,
      direction: 'horizontal' // horizontal, vertical, radial
    }

    this.outputBuffer = createBuffer()
    this.size = [160, 90]
  }

  onExecute() {
    const offset = this.getInputData(0) ?? 0
    const h1 = (this.properties.hue1 + offset) % 1
    const h2 = (this.properties.hue2 + offset) % 1

    for (let y = 0; y < BUFFER_HEIGHT; y++) {
      for (let x = 0; x < BUFFER_WIDTH; x++) {
        let t: number

        switch (this.properties.direction) {
          case 'vertical':
            t = y / BUFFER_HEIGHT
            break
          case 'radial':
            const cx = BUFFER_WIDTH / 2
            const cy = BUFFER_HEIGHT / 2
            const dx = x - cx
            const dy = y - cy
            t = Math.sqrt(dx * dx + dy * dy) / Math.sqrt(cx * cx + cy * cy)
            break
          default: // horizontal
            t = x / BUFFER_WIDTH
        }

        const h = h1 + (h2 - h1) * t
        const [r, g, b] = hsvToRgb(h, 1, 1)
        this.outputBuffer.setPixel(x, y, r, g, b, 255)
      }
    }

    this.setOutputData(0, this.outputBuffer)
  }
}

LiteGraph.registerNodeType('generators/gradient', GradientNode)
