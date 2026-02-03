import 'litegraph.js/css/litegraph.css'
import { LGraph, LGraphCanvas, LiteGraph } from 'litegraph.js'
import './litegraph.d'
import { BUFFER_WIDTH, BUFFER_HEIGHT } from './core/PixelBuffer'
import { SaveLoad, Preset } from './core/SaveLoad'
import './nodes' // Register all nodes
import { OutputNode } from './nodes'

/**
 * BitPix - Node-based generative pixel art
 */

class BitPix {
  private graph: LGraph
  private graphCanvas: LGraphCanvas
  private previewCanvas: HTMLCanvasElement
  private previewCtx: CanvasRenderingContext2D
  private saveLoad: SaveLoad

  private running = false
  private lastTime = 0
  private frameCount = 0
  private fpsTime = 0

  // Preview scaling
  private readonly previewScale = 4

  constructor() {
    // Setup LiteGraph
    this.graph = new LGraph()
    this.saveLoad = new SaveLoad(this.graph)

    const graphCanvasEl = document.getElementById('graph-canvas') as HTMLCanvasElement
    this.graphCanvas = new LGraphCanvas(graphCanvasEl, this.graph)

    // Preview canvas setup
    this.previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement
    this.previewCanvas.width = BUFFER_WIDTH * this.previewScale
    this.previewCanvas.height = BUFFER_HEIGHT * this.previewScale
    this.previewCtx = this.previewCanvas.getContext('2d')!
    this.previewCtx.imageSmoothingEnabled = false

    // Resize graph canvas to fit container
    this.resizeGraphCanvas()
    window.addEventListener('resize', () => this.resizeGraphCanvas())

    // Setup controls
    this.setupControls()
    this.setupSaveLoadUI()

    // Check for URL-shared graph first
    if (!this.saveLoad.loadFromURL()) {
      // Create default graph if no URL graph
      this.createDefaultGraph()
    }

    // Update preset dropdown
    this.updatePresetDropdown()

    // Start!
    this.running = true
    this.animate(0)
  }

  private resizeGraphCanvas() {
    const container = document.getElementById('graph-container')!
    const canvas = document.getElementById('graph-canvas') as HTMLCanvasElement
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
    this.graphCanvas.resize(canvas.width, canvas.height)
  }

  private setupControls() {
    const playBtn = document.getElementById('btn-play')!
    const fullscreenBtn = document.getElementById('btn-fullscreen')!

    playBtn.addEventListener('click', () => {
      this.running = !this.running
      playBtn.textContent = this.running ? '⏸ Pause' : '▶ Play'
      if (this.running) this.animate(performance.now())
    })

    fullscreenBtn.addEventListener('click', () => {
      this.previewCanvas.classList.toggle('fullscreen')
      if (this.previewCanvas.classList.contains('fullscreen')) {
        // Scale to fill screen while maintaining pixel ratio
        const scale = Math.min(
          window.innerWidth / BUFFER_WIDTH,
          window.innerHeight / BUFFER_HEIGHT
        )
        this.previewCanvas.style.width = `${BUFFER_WIDTH * scale}px`
        this.previewCanvas.style.height = `${BUFFER_HEIGHT * scale}px`
      } else {
        this.previewCanvas.style.width = ''
        this.previewCanvas.style.height = ''
      }
    })

    // ESC to exit fullscreen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.previewCanvas.classList.contains('fullscreen')) {
        this.previewCanvas.classList.remove('fullscreen')
        this.previewCanvas.style.width = ''
        this.previewCanvas.style.height = ''
      }
    })
  }

  private setupSaveLoadUI() {
    const saveBtn = document.getElementById('btn-save')!
    const loadBtn = document.getElementById('btn-load')!
    const shareBtn = document.getElementById('btn-share')!
    const newBtn = document.getElementById('btn-new')!
    const presetSelect = document.getElementById('preset-select') as HTMLSelectElement
    const deleteBtn = document.getElementById('btn-delete')!

    // Save button - prompts for name
    saveBtn.addEventListener('click', () => this.handleSave())

    // Load from file
    loadBtn.addEventListener('click', async () => {
      try {
        await this.saveLoad.uploadFile()
        this.showToast('Loaded from file')
      } catch (e) {
        console.error('Load failed:', e)
      }
    })

    // Share URL
    shareBtn.addEventListener('click', () => this.handleShare())

    // New/Clear
    newBtn.addEventListener('click', () => {
      if (confirm('Clear current graph?')) {
        this.graph.clear()
        this.saveLoad.setCurrentPresetName(null)
        this.updatePresetDropdown()
        this.showToast('Cleared')
      }
    })

    // Preset dropdown change
    presetSelect.addEventListener('change', () => {
      const selected = presetSelect.value
      if (!selected) return
      
      if (selected.startsWith('builtin:')) {
        // Built-in preset
        const builtinName = selected.replace('builtin:', '')
        const builtin = this.saveLoad.getBuiltinPresets().find(b => b.name === builtinName)
        if (builtin) {
          builtin.create()
          this.createDefaultGraph() // For now, builtins reset to default
          this.saveLoad.setCurrentPresetName(null)
          this.showToast(`Loaded ${builtinName}`)
        }
      } else {
        // User preset
        if (this.saveLoad.loadPreset(selected)) {
          this.showToast(`Loaded "${selected}"`)
        }
      }
      this.updatePresetDropdown()
    })

    // Delete current preset
    deleteBtn.addEventListener('click', () => {
      const current = this.saveLoad.getCurrentPresetName()
      if (!current) {
        this.showToast('No preset selected')
        return
      }
      if (confirm(`Delete preset "${current}"?`)) {
        this.saveLoad.deletePreset(current)
        this.saveLoad.setCurrentPresetName(null)
        this.updatePresetDropdown()
        this.showToast(`Deleted "${current}"`)
      }
    })

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S = Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        this.handleSave()
      }
      // Ctrl/Cmd + O = Load
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        loadBtn.click()
      }
      // Ctrl/Cmd + Shift + S = Download file
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        this.saveLoad.downloadFile()
        this.showToast('Downloaded')
      }
    })
  }

  private handleSave() {
    const current = this.saveLoad.getCurrentPresetName()
    const name = prompt('Preset name:', current || 'My Preset')
    if (!name) return
    
    this.saveLoad.savePreset(name)
    this.updatePresetDropdown()
    this.showToast(`Saved "${name}"`)
  }

  private handleShare() {
    const url = this.saveLoad.toURL()
    
    // Try to copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      this.showToast('Share URL copied!')
    }).catch(() => {
      // Fallback: show in prompt
      prompt('Share this URL:', url)
    })
  }

  private updatePresetDropdown() {
    const select = document.getElementById('preset-select') as HTMLSelectElement
    const currentName = this.saveLoad.getCurrentPresetName()
    
    // Clear existing options
    select.innerHTML = ''
    
    // Add placeholder
    const placeholder = document.createElement('option')
    placeholder.value = ''
    placeholder.textContent = currentName ? `📂 ${currentName}` : '📂 Select preset...'
    placeholder.disabled = true
    placeholder.selected = true
    select.appendChild(placeholder)
    
    // Add user presets
    const presets = this.saveLoad.getPresets()
    if (presets.length > 0) {
      const userGroup = document.createElement('optgroup')
      userGroup.label = 'Your Presets'
      presets.forEach(p => {
        const opt = document.createElement('option')
        opt.value = p.name
        opt.textContent = p.name
        userGroup.appendChild(opt)
      })
      select.appendChild(userGroup)
    }
    
    // Add built-in presets
    const builtins = this.saveLoad.getBuiltinPresets()
    if (builtins.length > 0) {
      const builtinGroup = document.createElement('optgroup')
      builtinGroup.label = 'Examples'
      builtins.forEach(b => {
        const opt = document.createElement('option')
        opt.value = `builtin:${b.name}`
        opt.textContent = b.name
        builtinGroup.appendChild(opt)
      })
      select.appendChild(builtinGroup)
    }
  }

  private showToast(message: string) {
    // Remove existing toast
    const existing = document.querySelector('.toast')
    if (existing) existing.remove()
    
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.textContent = message
    document.body.appendChild(toast)
    
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'))
    
    // Remove after delay
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => toast.remove(), 300)
    }, 2000)
  }

  private createDefaultGraph() {
    // Create a simple demo graph: Noise -> Palette -> Output
    const noiseNode = LiteGraph.createNode('generators/noise')!
    noiseNode.pos = [100, 150]
    this.graph.add(noiseNode)

    const oscNode = LiteGraph.createNode('animation/oscillator')!
    oscNode.pos = [100, 300]
    oscNode.properties.frequency = 0.5
    oscNode.properties.min = 0.02
    oscNode.properties.max = 0.15
    this.graph.add(oscNode)

    const paletteNode = LiteGraph.createNode('effects/palette')!
    paletteNode.pos = [350, 150]
    this.graph.add(paletteNode)

    const outputNode = LiteGraph.createNode('output/display')!
    outputNode.pos = [550, 150]
    this.graph.add(outputNode)

    // Connect: oscillator -> noise scale, noise -> palette -> output
    oscNode.connect(0, noiseNode, 0) // osc value -> noise scale
    noiseNode.connect(0, paletteNode, 0) // noise pixels -> palette
    paletteNode.connect(0, outputNode, 0) // palette pixels -> output
  }

  private animate(time: number) {
    if (!this.running) return

    // Update time
    const dt = (time - this.lastTime) / 1000
    this.lastTime = time
    this.graph.globaltime = time / 1000

    // Run the graph
    this.graph.runStep()

    // Render preview
    this.render()

    // FPS counter
    this.frameCount++
    if (time - this.fpsTime >= 1000) {
      document.getElementById('fps')!.textContent = `${this.frameCount} FPS`
      this.frameCount = 0
      this.fpsTime = time
    }

    requestAnimationFrame((t) => this.animate(t))
  }

  private render() {
    // Find the output node using public API
    const outputNode = this.graph.findNodesByType('output/display')[0] as OutputNode | undefined

    if (!outputNode?.outputBuffer) {
      this.previewCtx.fillStyle = '#000'
      this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height)
      return
    }

    // Create ImageData and draw
    const imageData = outputNode.outputBuffer.toImageData()

    // Create temp canvas at buffer size, then scale up
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = BUFFER_WIDTH
    tempCanvas.height = BUFFER_HEIGHT
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(imageData, 0, 0)

    // Draw scaled up with nearest-neighbor (pixelated)
    this.previewCtx.drawImage(
      tempCanvas,
      0, 0, BUFFER_WIDTH, BUFFER_HEIGHT,
      0, 0, this.previewCanvas.width, this.previewCanvas.height
    )
  }
}

// Boot
new BitPix()
