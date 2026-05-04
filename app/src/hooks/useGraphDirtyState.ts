import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { Node, Edge } from '@xyflow/react'

export interface GraphSnapshot {
  nodes: Node[]
  edges: Edge[]
}

export interface UseGraphDirtyStateOptions {
  initialNodes: Node[]
  initialEdges: Edge[]
  currentNodes: Node[]
  currentEdges: Edge[]
}

export interface UseGraphDirtyStateReturn {
  isDirty: boolean
  pendingChanges: GraphSnapshot
  markClean: () => void
  takeSnapshot: (nodes?: Node[], edges?: Edge[]) => void
  cleanSnapshot: GraphSnapshot
  changedNodeCount: number
  changedEdgeCount: number
}

function sanitizeNode(node: Node): unknown {
  return {
    id: node.id,
    type: node.type,
    // Round positions to avoid floating-point jitter
    position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
    data: node.data,
    parentId: node.parentId,
  }
}

function sanitizeEdge(edge: Edge): unknown {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    data: edge.data,
  }
}

function hasChanges(original: { id: string }[], current: { id: string }[], sanitizer: (item: { id: string }) => unknown): boolean {
  if (original.length !== current.length) return true
  const originalMap = new Map(original.map(item => [item.id, JSON.stringify(sanitizer(item))]))
  for (const item of current) {
    if (originalMap.get(item.id) !== JSON.stringify(sanitizer(item))) return true
  }
  return false
}

function countChanges(original: { id: string }[], current: { id: string }[], sanitizer: (item: { id: string }) => unknown): number {
  const originalMap = new Map(original.map(item => [item.id, JSON.stringify(sanitizer(item))]))
  const currentIds  = new Set(current.map(item => item.id))
  let changes = 0
  for (const item of current) {
    if (originalMap.get(item.id) !== JSON.stringify(sanitizer(item))) changes++
  }
  for (const id of originalMap.keys()) {
    if (!currentIds.has(id)) changes++
  }
  return changes
}

export function useGraphDirtyState({
  initialNodes,
  initialEdges,
  currentNodes,
  currentEdges,
}: UseGraphDirtyStateOptions): UseGraphDirtyStateReturn {
  const [cleanSnapshot, setCleanSnapshot] = useState<GraphSnapshot>(() => ({
    nodes: initialNodes,
    edges: initialEdges,
  }))

  const initialNodesRef = useRef(initialNodes)
  const initialEdgesRef = useRef(initialEdges)

  useEffect(() => {
    const nodesChanged = initialNodes !== initialNodesRef.current
    const edgesChanged = initialEdges !== initialEdgesRef.current
    if (nodesChanged || edgesChanged) {
      initialNodesRef.current = initialNodes
      initialEdgesRef.current = initialEdges
      setCleanSnapshot({ nodes: initialNodes, edges: initialEdges })
    }
  }, [initialNodes, initialEdges])

  const isDirty = useMemo(
    () =>
      hasChanges(cleanSnapshot.nodes as { id: string }[], currentNodes as { id: string }[], sanitizeNode as (item: { id: string }) => unknown) ||
      hasChanges(cleanSnapshot.edges as { id: string }[], currentEdges as { id: string }[], sanitizeEdge as (item: { id: string }) => unknown),
    [cleanSnapshot, currentNodes, currentEdges],
  )

  const changedNodeCount = useMemo(
    () => countChanges(cleanSnapshot.nodes as { id: string }[], currentNodes as { id: string }[], sanitizeNode as (item: { id: string }) => unknown),
    [cleanSnapshot.nodes, currentNodes],
  )

  const changedEdgeCount = useMemo(
    () => countChanges(cleanSnapshot.edges as { id: string }[], currentEdges as { id: string }[], sanitizeEdge as (item: { id: string }) => unknown),
    [cleanSnapshot.edges, currentEdges],
  )

  const pendingChanges = useMemo<GraphSnapshot>(
    () => ({ nodes: currentNodes, edges: currentEdges }),
    [currentNodes, currentEdges],
  )

  const markClean = useCallback(() => {
    setCleanSnapshot({ nodes: currentNodes, edges: currentEdges })
  }, [currentNodes, currentEdges])

  const takeSnapshot = useCallback((snapshotNodes?: Node[], snapshotEdges?: Edge[]) => {
    setCleanSnapshot({
      nodes: snapshotNodes ?? currentNodes,
      edges: snapshotEdges ?? currentEdges,
    })
  }, [currentNodes, currentEdges])

  return { isDirty, pendingChanges, markClean, takeSnapshot, cleanSnapshot, changedNodeCount, changedEdgeCount }
}

export default useGraphDirtyState
