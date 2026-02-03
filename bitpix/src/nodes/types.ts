import { LGraphNode } from 'litegraph.js'
import { PixelBuffer, BUFFER_WIDTH, BUFFER_HEIGHT } from '../core/PixelBuffer'

/**
 * Base interface for BitPix nodes.
 * All nodes that output pixels extend this.
 */
export interface BitPixNode extends LGraphNode {
  outputBuffer?: PixelBuffer
}

/** Create a fresh buffer at standard resolution */
export function createBuffer(): PixelBuffer {
  return new PixelBuffer(BUFFER_WIDTH, BUFFER_HEIGHT)
}

/** Slot types for LiteGraph */
export const SLOT_TYPES = {
  PIXELS: 'PIXELS',
  NUMBER: 'number',
  COLOR: 'COLOR',
} as const
