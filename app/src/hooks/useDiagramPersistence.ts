import { useState, useCallback, useEffect } from 'react'
import type { Node, Edge } from '@xyflow/react'

const DEV = import.meta.env.DEV

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

export interface PersistedDiagramData {
  positions: SavedLayout
  edges: Edge[] | null
  userNodes: SavedUserNode[]
}

interface PersistenceOptions {
  /** Bundled JSON imported statically — used as fallback when localStorage is empty in production. */
  fallback?: PersistedDiagramData
  /** Dev-server API path (e.g. '/api/overview-layout'). When provided, saves are also written to disk in DEV mode. */
  fileApiPath?: string
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

export function useDiagramPersistence(storageKey: string, options?: PersistenceOptions): UseDiagramPersistenceReturn {
  const { fallback, fileApiPath } = options ?? {}

  const [isLocked, setIsLocked] = useState(true)
  const [showSaved, setShowSaved] = useState(false)
  const [resetCount, setResetCount] = useState(0)

  const [savedPositions, setSavedPositions] = useState<SavedLayout>(() => {
    const local = loadPositions(storageKey)
    if (Object.keys(local).length > 0) return local
    return fallback?.positions ?? {}
  })
  const [savedEdges, setSavedEdges] = useState<Edge[] | null>(() => {
    const local = loadEdges(storageKey)
    if (local !== null) return local
    return fallback?.edges ?? null
  })
  const [savedUserNodes, setSavedUserNodes] = useState<SavedUserNode[]>(() => {
    const local = loadUserNodes(storageKey)
    if (local.length > 0) return local
    return fallback?.userNodes ?? []
  })

  // In DEV mode, sync the latest saved state from the file (written by the dev server)
  // so the author always starts from the committed layout, not a stale localStorage snapshot.
  useEffect(() => {
    if (!DEV || !fileApiPath) return
    fetch(`http://localhost:3001${fileApiPath}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: PersistedDiagramData | null) => {
        if (!data) return
        setSavedPositions(data.positions ?? {})
        setSavedEdges(data.edges ?? null)
        setSavedUserNodes(data.userNodes ?? [])
        try { localStorage.setItem(storageKey, JSON.stringify(data.positions ?? {})) } catch { /* ignore */ }
        try { localStorage.setItem(`${storageKey}-edges`, JSON.stringify(data.edges)) } catch { /* ignore */ }
        try { localStorage.setItem(`${storageKey}-user-nodes`, JSON.stringify(data.userNodes ?? [])) } catch { /* ignore */ }
      })
      .catch(() => { /* dev server not running — fall back to localStorage/bundled data */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

    // In DEV mode, also persist to disk so the layout gets committed and deployed
    if (DEV && fileApiPath) {
      const payload: PersistedDiagramData = { positions, edges, userNodes }
      fetch(`http://localhost:3001${fileApiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => { /* dev server not running */ })
    }

    setShowSaved(true)
  }, [storageKey, fileApiPath])

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
