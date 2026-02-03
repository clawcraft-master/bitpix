/**
 * Extended type declarations for LiteGraph.js
 * The bundled types are incomplete, so we augment them here.
 */

import 'litegraph.js'

declare module 'litegraph.js' {
  interface LGraph {
    globaltime: number
    _nodes: LGraphNode[]
  }

  interface LGraphNode {
    // Allow any properties
    properties: Record<string, any>
  }

  namespace LiteGraph {
    function createNode(type: string): LGraphNode
  }
}
