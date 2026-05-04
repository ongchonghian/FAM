import { useState, useCallback } from 'react'
import type { DiagramData } from './useFamData'

const STORE_KEY = 'fam-diagram-versions'
const MAX_VERSIONS = 50

export interface DiagramVersion {
  id: number
  label: string
  timestamp: string
  data: DiagramData
}

function load(): DiagramVersion[] {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(versions: DiagramVersion[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(versions)) } catch { /* ignore */ }
}

export function useVersionStore() {
  const [versions, setVersions] = useState<DiagramVersion[]>(load)

  const saveVersion = useCallback((data: DiagramData, label?: string): DiagramVersion => {
    setVersions(prev => {
      const next = prev.length >= MAX_VERSIONS ? prev.slice(1) : prev
      const id   = (next[next.length - 1]?.id ?? 0) + 1
      const v: DiagramVersion = {
        id,
        label: label ?? '',
        timestamp: new Date().toISOString(),
        data,
      }
      const updated = [...next, v]
      persist(updated)
      return updated
    })
    // Return a snapshot of what was just saved (id computed outside setState for immediate return)
    const existing = load()
    return existing[existing.length - 1] ?? { id: 1, label: label ?? '', timestamp: new Date().toISOString(), data }
  }, [])

  const renameVersion = useCallback((id: number, label: string) => {
    setVersions(prev => {
      const updated = prev.map(v => v.id === id ? { ...v, label } : v)
      persist(updated)
      return updated
    })
  }, [])

  const deleteVersion = useCallback((id: number) => {
    setVersions(prev => {
      if (prev.length <= 1) return prev   // always keep at least one
      const updated = prev.filter(v => v.id !== id)
      persist(updated)
      return updated
    })
  }, [])

  const refreshVersions = useCallback(() => {
    setVersions(load())
  }, [])

  return { versions, saveVersion, renameVersion, deleteVersion, refreshVersions }
}
