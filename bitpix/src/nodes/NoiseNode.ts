import { LiteGraph, LGraphNode } from 'litegraph.js'
import { PixelBuffer, BUFFER_WIDTH, BUFFER_HEIGHT } from '../core/PixelBuffer'
import { SimplexNoise } from '../core/Noise'
import { SLOT_TYPES, createBuffer } from './types'

/**
 * Generates simplex noise as a pixel buffer.
 * Outputs grayscale noise that can be used for textures, displacement, etc.
 */
export class NoiseNode extends LGraphNode {
  static title = 'Noise'
  static desc = 'Simplex noise generator'

  outputBuffer: PixelBuffer
  private noise: SimplexNoise

  constructor() {
    super()
    this.addOutput('pixels', SLOT_TYPES.PIXELS)
    this.addInput('scale', SLOT_TYPES.NUMBER)
    this.addInput('speed', SLOT_TYPES.NUMBER)
    this.addInput('offset', SLOT_TYPES.NUMBER)

    this.properties = {
      scale: 0.1,
      speed: 1,
      seed: Math.floor(Math.random() * 65536),
      octaves: 1
    }

    this.outputBuffer = createBuffer()
    this.noise = new SimplexNoise(this.properties.seed)

    this.size = [180, 100]
  }

  onExecute() {
    const time = ((this.graph as any)?.globaltime || 0) as number
    const scale = this.getInputData(0) ?? this.properties.scale
    const speed = this.getInputData(1) ?? this.properties.speed
    const offset = this.getInputData(2) ?? 0

    const timeOffset = time * speed + offset

    for (let y = 0; y < BUFFER_HEIGHT; y++) {
      for (let x = 0; x < BUFFER_WIDTH; x++) {
        let value = 0
        let amp = 1
        let freq = scale
        let maxAmp = 0

        // Octaves for detail
        for (let o = 0; o < this.properties.octaves; o++) {
          value += this.noise.noise2DNormalized(x * freq + timeOffset, y * freq + timeOffset) * amp
          maxAmp += amp
          amp *= 0.5
          freq *= 2
        }

        value /= maxAmp
        const c = Math.floor(value * 255)
        this.outputBuffer.setPixel(x, y, c, c, c, 255)
      }
    }

    this.setOutputData(0, this.outputBuffer)
  }

  onPropertyChanged(name: string, value: any) {
    if (name === 'seed') {
      this.noise = new SimplexNoise(value)
    }
  }
}

LiteGraph.registerNodeType('generators/noise', NoiseNode)
