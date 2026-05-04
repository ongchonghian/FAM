import { useState, useCallback } from 'react'
import type { Node, Edge } from '@xyflow/react'
import fallbackData from '../data/famDiagram.json'

const DEV = import.meta.env.DEV
const API = 'http://localhost:3001/api/diagram'

export interface DiagramData { nodes: Node[]; edges: Edge[] }

async function fetchDiagram(): Promise<DiagramData | null> {
  if (!DEV) return null
  try {
    const r = await fetch(API)
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

async function saveDiagram(data: DiagramData): Promise<boolean> {
  if (!DEV) return false
  try {
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return r.ok
  } catch {
    return false
  }
}

export function useFamData() {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadDiagram = useCallback(async (): Promise<DiagramData> => {
    const remote = await fetchDiagram()
    return remote ?? (fallbackData as DiagramData)
  }, [])

  const persistDiagram = useCallback(async (data: DiagramData) => {
    setSaving(true)
    setSaveError(null)
    const ok = await saveDiagram(data)
    if (!ok) setSaveError('Could not save to disk. Is the dev server running?')
    setSaving(false)
    return ok
  }, [])

  return { loadDiagram, persistDiagram, saving, saveError, isDev: DEV }
}
