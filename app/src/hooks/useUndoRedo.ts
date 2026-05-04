import { useState, useCallback, useRef } from 'react'
import type { Node, Edge } from '@xyflow/react'

interface Snapshot { nodes: Node[]; edges: Edge[] }

export function useUndoRedo() {
  const snapshots = useRef<Snapshot[]>([])
  const idx = useRef(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const capture = useCallback((nodes: Node[], edges: Edge[]) => {
    snapshots.current = snapshots.current.slice(0, idx.current + 1)
    snapshots.current.push({ nodes, edges })
    if (snapshots.current.length > 50) snapshots.current.shift()
    idx.current = snapshots.current.length - 1
    setCanUndo(idx.current > 0)
    setCanRedo(false)
  }, [])

  const undo = useCallback((): Snapshot | null => {
    if (idx.current <= 0) return null
    idx.current--
    setCanUndo(idx.current > 0)
    setCanRedo(true)
    return snapshots.current[idx.current]
  }, [])

  const redo = useCallback((): Snapshot | null => {
    if (idx.current >= snapshots.current.length - 1) return null
    idx.current++
    setCanUndo(idx.current > 0)
    setCanRedo(idx.current < snapshots.current.length - 1)
    return snapshots.current[idx.current]
  }, [])

  return { capture, undo, redo, canUndo, canRedo }
}
