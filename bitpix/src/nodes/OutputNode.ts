import { LiteGraph, LGraphNode } from 'litegraph.js'
import { PixelBuffer } from '../core/PixelBuffer'
import { SLOT_TYPES } from './types'

/**
 * Output node - receives the final pixel buffer for rendering.
 * There should only be one output node in the graph.
 */
export class OutputNode extends LGraphNode {
  static title = 'Output'
  static desc = 'Final output for rendering'

  outputBuffer: PixelBuffer | null = null

  constructor() {
    super()
    this.addInput('pixels', SLOT_TYPES.PIXELS)
    this.size = [120, 50]
    this.color = '#e94560'
    this.bgcolor = '#1a1a2e'
  }

  onExecute() {
    this.outputBuffer = this.getInputData(0) as PixelBuffer | null
  }

  /** Called by the renderer to get the final buffer */
  getOutput(): PixelBuffer | null {
    return this.outputBuffer
  }
}

LiteGraph.registerNodeType('output/display', OutputNode)
