import { useState, useCallback } from 'react'
import type { Node, Edge } from '@xyflow/react'
import ELK from 'elkjs/lib/elk.bundled.js'

const elk = new ELK()

export type LayoutType = 'layered-lr' | 'layered-tb' | 'tree-lr' | 'tree-tb' | 'force' | 'radial'

const LAYOUT_CONFIGS: Record<LayoutType, Record<string, string>> = {
  'layered-lr': {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.layered.spacing.nodeNodeBetweenLayers': '80',
    'elk.spacing.nodeNode': '50',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  },
  'layered-tb': {
    'elk.algorithm': 'layered',
    'elk.direction': 'DOWN',
    'elk.layered.spacing.nodeNodeBetweenLayers': '80',
    'elk.spacing.nodeNode': '50',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  },
  'tree-lr': {
    'elk.algorithm': 'mrtree',
    'elk.direction': 'RIGHT',
    'elk.spacing.nodeNode': '60',
  },
  'tree-tb': {
    'elk.algorithm': 'mrtree',
    'elk.direction': 'DOWN',
    'elk.spacing.nodeNode': '60',
  },
  'force': {
    'elk.algorithm': 'force',
    'elk.spacing.nodeNode': '80',
    'elk.force.iterations': '300',
    'elk.force.repulsivePower': '2',
  },
  'radial': {
    'elk.algorithm': 'radial',
    'elk.spacing.nodeNode': '50',
  },
}

export const LAYOUT_TYPE_LABELS: Record<LayoutType, string> = {
  'layered-lr': 'Layered →',
  'layered-tb': 'Layered ↓',
  'tree-lr': 'Tree →',
  'tree-tb': 'Tree ↓',
  'force': 'Force',
  'radial': 'Radial',
}

const BBOX_PADDING = 16

export function useElkLayout() {
  const [isLayouting, setIsLayouting] = useState(false)

  const runLayout = useCallback(async (
    nodes: Node[],
    edges: Edge[],
    selectedNodeIds?: Set<string>,
    layoutType: LayoutType = 'layered-lr',
  ): Promise<{ nodes: Node[]; edges: Edge[] }> => {
    setIsLayouting(true)
    try {
      const useSelection = selectedNodeIds != null && selectedNodeIds.size >= 2

      const allLayoutNodes = nodes.filter(n => n.type !== 'band')

      const targetNodes = useSelection
        ? allLayoutNodes.filter(n => selectedNodeIds.has(n.id))
        : allLayoutNodes

      const targetNodeIds = new Set(targetNodes.map(n => n.id))

      let origMinX = 0, origMinY = 0, origMaxX = 0, origMaxY = 0
      if (useSelection) {
        origMinX = Infinity; origMinY = Infinity
        origMaxX = -Infinity; origMaxY = -Infinity
        for (const n of targetNodes) {
          const w = (n.style?.width as number) ?? 100
          const h = (n.style?.height as number) ?? 50
          origMinX = Math.min(origMinX, n.position.x)
          origMinY = Math.min(origMinY, n.position.y)
          origMaxX = Math.max(origMaxX, n.position.x + w)
          origMaxY = Math.max(origMaxY, n.position.y + h)
        }
      }

      const graph = {
        id: 'root',
        layoutOptions: LAYOUT_CONFIGS[layoutType],
        children: targetNodes.map(n => ({
          id: n.id,
          width: (n.style?.width as number) ?? 100,
          height: (n.style?.height as number) ?? 50,
        })),
        edges: edges
          .filter(e => e.source && e.target && targetNodeIds.has(e.source) && targetNodeIds.has(e.target))
          .map(e => ({ id: e.id, sources: [e.source], targets: [e.target] })),
      }

      const result = await elk.layout(graph)

      const positionMap: Record<string, { x: number; y: number }> = {}

      let selElkMinX = 0, selElkMinY = 0, selScale = 1, selOx = 0, selOy = 0

      if (useSelection && result.children && result.children.length > 0) {
        let elkMinX = Infinity, elkMinY = Infinity, elkMaxX = -Infinity, elkMaxY = -Infinity
        for (const child of result.children) {
          const w = child.width ?? 100
          const h = child.height ?? 50
          elkMinX = Math.min(elkMinX, child.x ?? 0)
          elkMinY = Math.min(elkMinY, child.y ?? 0)
          elkMaxX = Math.max(elkMaxX, (child.x ?? 0) + w)
          elkMaxY = Math.max(elkMaxY, (child.y ?? 0) + h)
        }

        const availW = (origMaxX - origMinX) - BBOX_PADDING * 2
        const availH = (origMaxY - origMinY) - BBOX_PADDING * 2
        const elkW = elkMaxX - elkMinX
        const elkH = elkMaxY - elkMinY

        const scale = elkW > 0 && elkH > 0
          ? Math.min(1, availW / elkW, availH / elkH)
          : 1

        const scaledW = elkW * scale
        const scaledH = elkH * scale

        const ox = origMinX + BBOX_PADDING + (availW - scaledW) / 2
        const oy = origMinY + BBOX_PADDING + (availH - scaledH) / 2

        selElkMinX = elkMinX; selElkMinY = elkMinY
        selScale = scale; selOx = ox; selOy = oy

        for (const child of result.children) {
          positionMap[child.id] = {
            x: ox + ((child.x ?? 0) - elkMinX) * scale,
            y: oy + ((child.y ?? 0) - elkMinY) * scale,
          }
        }
      } else {
        result.children?.forEach(child => {
          positionMap[child.id] = { x: child.x ?? 0, y: child.y ?? 0 }
        })
      }

      const newNodes = nodes.map(n => {
        if (n.type === 'band') return n
        if (useSelection && !selectedNodeIds!.has(n.id)) return n
        const pos = positionMap[n.id]
        return pos ? { ...n, position: pos } : n
      })

      type ElkResultEdge = { id?: string; sections?: Array<{ bendPoints?: Array<{ x: number; y: number }> }> }
      const edgeBendMap = new Map<string, [number, number][]>()
      for (const elkEdge of (result.edges ?? []) as ElkResultEdge[]) {
        if (!elkEdge.id) continue
        const bends = elkEdge.sections?.[0]?.bendPoints
        if (!bends || bends.length === 0) continue
        if (useSelection) {
          edgeBendMap.set(elkEdge.id, bends.map(p => [
            selOx + (p.x - selElkMinX) * selScale,
            selOy + (p.y - selElkMinY) * selScale,
          ] as [number, number]))
        } else {
          edgeBendMap.set(elkEdge.id, bends.map(p => [p.x, p.y] as [number, number]))
        }
      }

      const newEdges = edges.map(e => {
        if (!targetNodeIds.has(e.source) || !targetNodeIds.has(e.target)) return e
        const waypoints = edgeBendMap.get(e.id)
        if (waypoints && waypoints.length > 0) {
          return { ...e, type: 'routed' as const, data: { ...(e.data ?? {}), waypoints } }
        }
        return { ...e, type: 'smoothstep' as const, data: { ...(e.data ?? {}), waypoints: undefined } }
      })

      return { nodes: newNodes, edges: newEdges }
    } finally {
      setIsLayouting(false)
    }
  }, [])

  return { runLayout, isLayouting }
}
