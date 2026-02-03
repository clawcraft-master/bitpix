import { LiteGraph, LGraphNode } from 'litegraph.js'
import { SLOT_TYPES } from './types'

/**
 * Time-based oscillator for animation.
 * Outputs values that can drive other node parameters.
 */
export class OscillatorNode extends LGraphNode {
  static title = 'Oscillator'
  static desc = 'Time-based oscillator (sine, saw, square)'

  constructor() {
    super()
    this.addOutput('value', SLOT_TYPES.NUMBER)
    this.addInput('frequency', SLOT_TYPES.NUMBER)
    this.addInput('amplitude', SLOT_TYPES.NUMBER)
    this.addInput('offset', SLOT_TYPES.NUMBER)

    this.properties = {
      waveform: 'sine', // sine, saw, square, triangle
      frequency: 1,      // Hz
      amplitude: 1,
      offset: 0,
      min: 0,
      max: 1
    }

    this.size = [160, 80]
  }

  onExecute() {
    const time = ((this.graph as any)?.globaltime || 0) as number
    const freq = this.getInputData(0) ?? this.properties.frequency
    const amp = this.getInputData(1) ?? this.properties.amplitude
    const off = this.getInputData(2) ?? this.properties.offset

    const phase = (time * freq + off) % 1
    let value: number

    switch (this.properties.waveform) {
      case 'saw':
        value = phase
        break
      case 'square':
        value = phase < 0.5 ? 0 : 1
        break
      case 'triangle':
        value = phase < 0.5 ? phase * 2 : 2 - phase * 2
        break
      default: // sine
        value = (Math.sin(phase * Math.PI * 2) + 1) / 2
    }

    // Apply amplitude and map to min/max range
    value = value * amp
    value = this.properties.min + value * (this.properties.max - this.properties.min)

    this.setOutputData(0, value)
  }
}

LiteGraph.registerNodeType('animation/oscillator', OscillatorNode)

/**
 * LFO - Low Frequency Oscillator with more control.
 */
export class LFONode extends LGraphNode {
  static title = 'LFO'
  static desc = 'Low frequency oscillator with BPM sync'

  constructor() {
    super()
    this.addOutput('value', SLOT_TYPES.NUMBER)
    this.addInput('bpm', SLOT_TYPES.NUMBER)

    this.properties = {
      bpm: 120,
      division: 4, // beats per cycle
      waveform: 'sine'
    }

    this.size = [140, 70]
  }

  onExecute() {
    const time = ((this.graph as any)?.globaltime || 0) as number
    const bpm = this.getInputData(0) ?? this.properties.bpm
    const beatsPerSecond = bpm / 60
    const cyclesPerSecond = beatsPerSecond / this.properties.division
    const phase = (time * cyclesPerSecond) % 1

    let value: number
    switch (this.properties.waveform) {
      case 'saw':
        value = phase
        break
      case 'square':
        value = phase < 0.5 ? 0 : 1
        break
      case 'triangle':
        value = phase < 0.5 ? phase * 2 : 2 - phase * 2
        break
      default:
        value = (Math.sin(phase * Math.PI * 2) + 1) / 2
    }

    this.setOutputData(0, value)
  }
}

LiteGraph.registerNodeType('animation/lfo', LFONode)
