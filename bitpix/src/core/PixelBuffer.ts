/**
 * Core pixel buffer - the fundamental data structure.
 * All nodes output PixelBuffers, which get composited and rendered.
 */
export class PixelBuffer {
  readonly width: number
  readonly height: number
  readonly data: Uint8ClampedArray // RGBA

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.data = new Uint8ClampedArray(width * height * 4)
  }

  /** Get pixel index for coordinates */
  index(x: number, y: number): number {
    return (y * this.width + x) * 4
  }

  /** Set pixel color */
  setPixel(x: number, y: number, r: number, g: number, b: number, a: number = 255): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
    const i = this.index(x, y)
    this.data[i] = r
    this.data[i + 1] = g
    this.data[i + 2] = b
    this.data[i + 3] = a
  }

  /** Get pixel color */
  getPixel(x: number, y: number): [number, number, number, number] {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return [0, 0, 0, 0]
    const i = this.index(x, y)
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]]
  }

  /** Fill entire buffer with color */
  fill(r: number, g: number, b: number, a: number = 255): void {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r
      this.data[i + 1] = g
      this.data[i + 2] = b
      this.data[i + 3] = a
    }
  }

  /** Clear buffer to transparent black */
  clear(): void {
    this.data.fill(0)
  }

  /** Clone this buffer */
  clone(): PixelBuffer {
    const copy = new PixelBuffer(this.width, this.height)
    copy.data.set(this.data)
    return copy
  }

  /** Create ImageData for canvas rendering */
  toImageData(): ImageData {
    return new ImageData(this.data.slice(), this.width, this.height)
  }

  /** Blend another buffer on top using alpha */
  blendOver(other: PixelBuffer): void {
    if (other.width !== this.width || other.height !== this.height) return
    for (let i = 0; i < this.data.length; i += 4) {
      const srcA = other.data[i + 3] / 255
      const dstA = this.data[i + 3] / 255
      const outA = srcA + dstA * (1 - srcA)
      
      if (outA > 0) {
        this.data[i] = (other.data[i] * srcA + this.data[i] * dstA * (1 - srcA)) / outA
        this.data[i + 1] = (other.data[i + 1] * srcA + this.data[i + 1] * dstA * (1 - srcA)) / outA
        this.data[i + 2] = (other.data[i + 2] * srcA + this.data[i + 2] * dstA * (1 - srcA)) / outA
        this.data[i + 3] = outA * 255
      }
    }
  }
}

/** Global buffer dimensions - can be changed for different output sizes */
export const BUFFER_WIDTH = 64
export const BUFFER_HEIGHT = 64
