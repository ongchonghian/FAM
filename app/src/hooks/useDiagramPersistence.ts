import { useState, useCallback, useEffect } from 'react'
import type { Node, Edge } from '@xyflow/react'

type SavedLayout = Record<string, { x: number; y: number; width?: number; height?: number }>

// Minimal node definition saved for user-created nodes (not in BASE_NODES)
interface SavedUserNode {
  id: string
  type: string | undefined
  position: { x: number; y: number }
  data: Record<string, unknown>
  style?: Record<string, unknown>
  zIndex?: number
}

interface UseDiagramPersistenceReturn {
  isLocked: boolean
  toggleLock: () => void
  savedPositions: SavedLayout
  savedEdges: Edge[] | null
  savedUserNodes: SavedUserNode[]
  save: (nodes: Node[], edges: Edge[]) => void
  reset: () => void
  showSaved: boolean
  resetCount: number
}

function loadPositions(key: string): SavedLayout {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function loadEdges(key: string): Edge[] | null {
  try {
    const raw = localStorage.getItem(`${key}-edges`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function loadUserNodes(key: string): SavedUserNode[] {
  try {
    const raw = localStorage.getItem(`${key}-user-nodes`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useDiagramPersistence(storageKey: string): UseDiagramPersistenceReturn {
  const [isLocked, setIsLocked] = useState(true)
  const [showSaved, setShowSaved] = useState(false)
  const [resetCount, setResetCount] = useState(0)
  const [savedPositions, setSavedPositions] = useState<SavedLayout>(() => loadPositions(storageKey))
  const [savedEdges, setSavedEdges] = useState<Edge[] | null>(() => loadEdges(storageKey))
  const [savedUserNodes, setSavedUserNodes] = useState<SavedUserNode[]>(() => loadUserNodes(storageKey))

  const toggleLock = useCallback(() => setIsLocked(v => !v), [])

  const save = useCallback((nodes: Node[], edges: Edge[]) => {
    const positions: SavedLayout = {}
    nodes.forEach(n => {
      const entry: SavedLayout[string] = { x: n.position.x, y: n.position.y }
      // In @xyflow/react v12, NodeResizer updates node.measured (not node.style),
      // so measured is the authoritative source for the current rendered dimensions.
      const w = n.measured?.width ?? (n.style as { width?: number } | undefined)?.width
      const h = n.measured?.height ?? (n.style as { height?: number } | undefined)?.height
      if (w !== undefined) entry.width = w
      if (h !== undefined) entry.height = h
      positions[n.id] = entry
    })
    try { localStorage.setItem(storageKey, JSON.stringify(positions)) } catch { /* ignore */ }
    setSavedPositions(positions)

    try { localStorage.setItem(`${storageKey}-edges`, JSON.stringify(edges)) } catch { /* ignore */ }
    setSavedEdges(edges)

    // Save full definitions for user-created nodes so they survive a page reload
    const userNodes: SavedUserNode[] = nodes
      .filter(n => n.id.startsWith('user-node-'))
      .map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data as Record<string, unknown>,
        style: n.style as Record<string, unknown> | undefined,
        ...(n.zIndex !== undefined ? { zIndex: n.zIndex } : {}),
      }))
    try { localStorage.setItem(`${storageKey}-user-nodes`, JSON.stringify(userNodes)) } catch { /* ignore */ }
    setSavedUserNodes(userNodes)

    setShowSaved(true)
  }, [storageKey])

  const reset = useCallback(() => {
    // Only resets the current view; save in localStorage is preserved.
    // To hard-reset: click Reset then Save.
    setResetCount(c => c + 1)
  }, [])

  useEffect(() => {
    if (!showSaved) return
    const id = setTimeout(() => setShowSaved(false), 1800)
    return () => clearTimeout(id)
  }, [showSaved])

  return { isLocked, toggleLock, savedPositions, savedEdges, savedUserNodes, save, reset, showSaved, resetCount }
}
