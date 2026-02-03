/**
 * SaveLoad - Graph serialization, presets, and URL sharing
 */

import { LGraph } from 'litegraph.js'

const STORAGE_KEY = 'bitpix_presets'
const CURRENT_PRESET_KEY = 'bitpix_current'

export interface Preset {
  name: string
  data: object
  createdAt: number
}

export interface PresetLibrary {
  presets: Preset[]
}

export class SaveLoad {
  private graph: LGraph

  constructor(graph: LGraph) {
    this.graph = graph
  }

  // ─────────────────────────────────────────────────────────
  // Core Serialization
  // ─────────────────────────────────────────────────────────

  /** Serialize current graph to JSON object */
  serialize(): object {
    return this.graph.serialize()
  }

  /** Load graph from JSON object */
  deserialize(data: object): void {
    this.graph.configure(data)
  }

  /** Export graph as JSON string */
  toJSON(): string {
    return JSON.stringify(this.serialize(), null, 2)
  }

  /** Import graph from JSON string */
  fromJSON(json: string): void {
    const data = JSON.parse(json)
    this.deserialize(data)
  }

  // ─────────────────────────────────────────────────────────
  // URL Sharing
  // ─────────────────────────────────────────────────────────

  /** Encode graph to base64 URL parameter */
  toURL(): string {
    const json = JSON.stringify(this.serialize())
    const compressed = this.compress(json)
    const base64 = btoa(compressed)
    const url = new URL(window.location.href)
    url.searchParams.set('graph', base64)
    return url.toString()
  }

  /** Load graph from URL if present, returns true if loaded */
  loadFromURL(): boolean {
    const url = new URL(window.location.href)
    const graphParam = url.searchParams.get('graph')
    if (!graphParam) return false

    try {
      const compressed = atob(graphParam)
      const json = this.decompress(compressed)
      this.fromJSON(json)
      // Clear URL param after loading
      url.searchParams.delete('graph')
      window.history.replaceState({}, '', url.toString())
      return true
    } catch (e) {
      console.error('Failed to load graph from URL:', e)
      return false
    }
  }

  /** Simple compression using shorter property names */
  private compress(json: string): string {
    // For now, just return as-is. Could add LZString later.
    return json
  }

  private decompress(compressed: string): string {
    return compressed
  }

  // ─────────────────────────────────────────────────────────
  // Preset Library (localStorage)
  // ─────────────────────────────────────────────────────────

  /** Get all saved presets */
  getPresets(): Preset[] {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    try {
      const lib: PresetLibrary = JSON.parse(raw)
      return lib.presets || []
    } catch {
      return []
    }
  }

  /** Save current graph as a preset */
  savePreset(name: string): Preset {
    const presets = this.getPresets()
    
    // Check for duplicate name and remove old one
    const existingIndex = presets.findIndex(p => p.name === name)
    if (existingIndex >= 0) {
      presets.splice(existingIndex, 1)
    }

    const preset: Preset = {
      name,
      data: this.serialize(),
      createdAt: Date.now()
    }
    presets.unshift(preset) // Add to front
    
    this.savePresetsToStorage(presets)
    this.setCurrentPresetName(name)
    return preset
  }

  /** Load a preset by name */
  loadPreset(name: string): boolean {
    const presets = this.getPresets()
    const preset = presets.find(p => p.name === name)
    if (!preset) return false
    
    this.deserialize(preset.data)
    this.setCurrentPresetName(name)
    return true
  }

  /** Delete a preset by name */
  deletePreset(name: string): boolean {
    const presets = this.getPresets()
    const index = presets.findIndex(p => p.name === name)
    if (index < 0) return false
    
    presets.splice(index, 1)
    this.savePresetsToStorage(presets)
    return true
  }

  /** Rename a preset */
  renamePreset(oldName: string, newName: string): boolean {
    const presets = this.getPresets()
    const preset = presets.find(p => p.name === oldName)
    if (!preset) return false
    
    preset.name = newName
    this.savePresetsToStorage(presets)
    return true
  }

  private savePresetsToStorage(presets: Preset[]): void {
    const lib: PresetLibrary = { presets }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lib))
  }

  // ─────────────────────────────────────────────────────────
  // Current Preset Tracking
  // ─────────────────────────────────────────────────────────

  getCurrentPresetName(): string | null {
    return localStorage.getItem(CURRENT_PRESET_KEY)
  }

  setCurrentPresetName(name: string | null): void {
    if (name) {
      localStorage.setItem(CURRENT_PRESET_KEY, name)
    } else {
      localStorage.removeItem(CURRENT_PRESET_KEY)
    }
  }

  // ─────────────────────────────────────────────────────────
  // File Download/Upload
  // ─────────────────────────────────────────────────────────

  /** Download current graph as .json file */
  downloadFile(filename?: string): void {
    const json = this.toJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `bitpix-${Date.now()}.json`
    a.click()
    
    URL.revokeObjectURL(url)
  }

  /** Open file picker and load selected .json file */
  uploadFile(): Promise<void> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,application/json'
      
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) {
          reject(new Error('No file selected'))
          return
        }
        
        try {
          const text = await file.text()
          this.fromJSON(text)
          this.setCurrentPresetName(null) // Clear current preset
          resolve()
        } catch (e) {
          reject(e)
        }
      }
      
      input.click()
    })
  }

  // ─────────────────────────────────────────────────────────
  // Built-in Presets
  // ─────────────────────────────────────────────────────────

  /** Get built-in demo presets */
  getBuiltinPresets(): { name: string; create: () => void }[] {
    return [
      { name: '🌊 Plasma', create: () => this.createPlasmaPreset() },
      { name: '🔥 Fire', create: () => this.createFirePreset() },
      { name: '🌈 Rainbow', create: () => this.createRainbowPreset() },
    ]
  }

  private createPlasmaPreset(): void {
    this.graph.clear()
    // Will be populated when loaded - for now just clear
  }

  private createFirePreset(): void {
    this.graph.clear()
  }

  private createRainbowPreset(): void {
    this.graph.clear()
  }
}
