import { useRef, useState, useCallback } from 'react'
import type { OverridesMap } from './useScenariosState'

export function useAuthorUndoRedo() {
  const snapshots = useRef<OverridesMap[]>([])
  const idx       = useRef(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const capture = useCallback((state: OverridesMap) => {
    snapshots.current = snapshots.current.slice(0, idx.current + 1)
    snapshots.current.push(JSON.parse(JSON.stringify(state)))
    if (snapshots.current.length > 50) snapshots.current.shift()
    idx.current = snapshots.current.length - 1
    setCanUndo(idx.current > 0)
    setCanRedo(false)
  }, [])

  const undo = useCallback((): OverridesMap | null => {
    if (idx.current <= 0) return null
    idx.current--
    setCanUndo(idx.current > 0)
    setCanRedo(true)
    return snapshots.current[idx.current]
  }, [])

  const redo = useCallback((): OverridesMap | null => {
    if (idx.current >= snapshots.current.length - 1) return null
    idx.current++
    setCanUndo(true)
    setCanRedo(idx.current < snapshots.current.length - 1)
    return snapshots.current[idx.current]
  }, [])

  return { capture, undo, redo, canUndo, canRedo }
}
