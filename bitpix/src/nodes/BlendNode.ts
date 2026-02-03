import { LiteGraph, LGraphNode } from 'litegraph.js'
import { PixelBuffer } from '../core/PixelBuffer'
import { SLOT_TYPES, createBuffer } from './types'

/**
 * Blends two pixel buffers together with various blend modes.
 */
export class BlendNode extends LGraphNode {
  static title = 'Blend'
  static desc = 'Blend two pixel buffers'

  outputBuffer: PixelBuffer

  constructor() {
    super()
    this.addInput('A', SLOT_TYPES.PIXELS)
    this.addInput('B', SLOT_TYPES.PIXELS)
    this.addInput('mix', SLOT_TYPES.NUMBER)
    this.addOutput('pixels', SLOT_TYPES.PIXELS)

    this.properties = {
      mode: 'mix', // mix, add, multiply, screen, overlay
      mix: 0.5
    }

    this.outputBuffer = createBuffer()
    this.size = [140, 80]
  }

  onExecute() {
    const bufA = this.getInputData(0) as PixelBuffer | undefined
    const bufB = this.getInputData(1) as PixelBuffer | undefined
    const mix = this.getInputData(2) ?? this.properties.mix

    this.outputBuffer.clear()

    if (!bufA && !bufB) {
      this.setOutputData(0, this.outputBuffer)
      return
    }

    if (!bufA) {
      this.outputBuffer.data.set(bufB!.data)
      this.setOutputData(0, this.outputBuffer)
      return
    }

    if (!bufB) {
      this.outputBuffer.data.set(bufA.data)
      this.setOutputData(0, this.outputBuffer)
      return
    }

    for (let i = 0; i < this.outputBuffer.data.length; i += 4) {
      const rA = bufA.data[i], gA = bufA.data[i + 1], bA = bufA.data[i + 2], aA = bufA.data[i + 3]
      const rB = bufB.data[i], gB = bufB.data[i + 1], bB = bufB.data[i + 2], aB = bufB.data[i + 3]

      let r: number, g: number, b: number

      switch (this.properties.mode) {
        case 'add':
          r = Math.min(255, rA + rB)
          g = Math.min(255, gA + gB)
          b = Math.min(255, bA + bB)
          break
        case 'multiply':
          r = (rA * rB) / 255
          g = (gA * gB) / 255
          b = (bA * bB) / 255
          break
        case 'screen':
          r = 255 - ((255 - rA) * (255 - rB)) / 255
          g = 255 - ((255 - gA) * (255 - gB)) / 255
          b = 255 - ((255 - bA) * (255 - bB)) / 255
          break
        case 'overlay':
          r = rA < 128 ? (2 * rA * rB) / 255 : 255 - (2 * (255 - rA) * (255 - rB)) / 255
          g = gA < 128 ? (2 * gA * gB) / 255 : 255 - (2 * (255 - gA) * (255 - gB)) / 255
          b = bA < 128 ? (2 * bA * bB) / 255 : 255 - (2 * (255 - bA) * (255 - bB)) / 255
          break
        default: // mix
          r = rA * (1 - mix) + rB * mix
          g = gA * (1 - mix) + gB * mix
          b = bA * (1 - mix) + bB * mix
      }

      this.outputBuffer.data[i] = r
      this.outputBuffer.data[i + 1] = g
      this.outputBuffer.data[i + 2] = b
      this.outputBuffer.data[i + 3] = Math.max(aA, aB)
    }

    this.setOutputData(0, this.outputBuffer)
  }
}

LiteGraph.registerNodeType('compositing/blend', BlendNode)

/**
 * Mask node - uses one buffer as an alpha mask for another.
 */
export class MaskNode extends LGraphNode {
  static title = 'Mask'
  static desc = 'Apply one buffer as a mask to another'

  outputBuffer: PixelBuffer

  constructor() {
    super()
    this.addInput('source', SLOT_TYPES.PIXELS)
    this.addInput('mask', SLOT_TYPES.PIXELS)
    this.addOutput('pixels', SLOT_TYPES.PIXELS)

    this.properties = {
      invert: false,
      channel: 'luminance' // luminance, red, green, blue, alpha
    }

    this.outputBuffer = createBuffer()
    this.size = [140, 70]
  }

  onExecute() {
    const source = this.getInputData(0) as PixelBuffer | undefined
    const mask = this.getInputData(1) as PixelBuffer | undefined

    this.outputBuffer.clear()

    if (!source) {
      this.setOutputData(0, this.outputBuffer)
      return
    }

    this.outputBuffer.data.set(source.data)

    if (!mask) {
      this.setOutputData(0, this.outputBuffer)
      return
    }

    for (let i = 0; i < this.outputBuffer.data.length; i += 4) {
      let maskValue: number

      switch (this.properties.channel) {
        case 'red': maskValue = mask.data[i]; break
        case 'green': maskValue = mask.data[i + 1]; break
        case 'blue': maskValue = mask.data[i + 2]; break
        case 'alpha': maskValue = mask.data[i + 3]; break
        default: // luminance
          maskValue = (mask.data[i] * 0.299 + mask.data[i + 1] * 0.587 + mask.data[i + 2] * 0.114)
      }

      if (this.properties.invert) maskValue = 255 - maskValue

      this.outputBuffer.data[i + 3] = (this.outputBuffer.data[i + 3] * maskValue) / 255
    }

    this.setOutputData(0, this.outputBuffer)
  }
}

LiteGraph.registerNodeType('compositing/mask', MaskNode)
