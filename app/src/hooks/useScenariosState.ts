import { useState, useCallback } from 'react'
import bundledOverrides from '../data/scenarios-overrides.json'

const DEV = import.meta.env.DEV
const API = 'http://localhost:3001/api/scenarios-overrides'
const STORAGE_KEY = 'fam-step-overrides'

function loadFromStorage(): OverridesMap | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as OverridesMap
  } catch { return null }
}

function saveToStorage(data: OverridesMap) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export interface StepState {
  active: string[]
  flows: string[]
  animated: string[]
  // Text overrides — null means "use scenarios.ts default"
  titleOverride:     string | null
  durationOverride:  string | null
  actorsOverride:    string[] | null
  narrativeOverride: string | null
  privacyOverride:   string | null
  payloadLabelOverride: string | null
  payloadTagOverride:   string | null
  payloadOverride:      string | null
}

export interface ScenarioOverride {
  steps: (StepState | null)[]  // null = index placeholder; only real overrides contain StepState
}

export type ScenarioKey = string
export type OverridesMap = Record<ScenarioKey, ScenarioOverride>

function emptyStep(active: string[], flows: string[]): StepState {
  return {
    active,
    flows,
    animated: [...flows],
    titleOverride: null,
    durationOverride: null,
    actorsOverride: null,
    narrativeOverride: null,
    privacyOverride: null,
    payloadLabelOverride: null,
    payloadTagOverride: null,
    payloadOverride: null,
  }
}

async function fetchOverrides(): Promise<OverridesMap | null> {
  const local = loadFromStorage()
  if (!DEV) return local ?? (bundledOverrides as OverridesMap)
  try {
    const r = await fetch(API)
    if (!r.ok) return local
    const data: OverridesMap = await r.json()
    saveToStorage(data)
    return data
  } catch { return local }
}

async function saveOverrides(data: OverridesMap): Promise<boolean> {
  saveToStorage(data)
  if (!DEV) return true
  try {
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return r.ok
  } catch { return false }
}

export function useScenariosState() {
  const [overrides, setOverrides] = useState<OverridesMap>({})
  const [loaded, setLoaded]       = useState(false)

  const load = useCallback(async () => {
    const remote = await fetchOverrides()
    if (remote) setOverrides(remote)
    setLoaded(true)
  }, [])

  const getStep = useCallback((scenarioKey: ScenarioKey, stepIdx: number, defaultActive: string[], defaultFlows: string[]): StepState => {
    const s = overrides[scenarioKey]?.steps[stepIdx]
    if (s) return s
    return emptyStep(defaultActive, defaultFlows)
  }, [overrides])

  const updateStep = useCallback((scenarioKey: ScenarioKey, stepIdx: number, patch: Partial<StepState>) => {
    setOverrides(prev => {
      const scenario = prev[scenarioKey] ?? { steps: [] }
      const steps = [...scenario.steps]
      // Fill intermediate indices with null (not emptyStep) so they don't
      // appear as real overrides when accessed via overrides[key].steps[i]
      while (steps.length <= stepIdx) steps.push(null)
      steps[stepIdx] = { ...(steps[stepIdx] ?? emptyStep([], [])), ...patch }
      const next = { ...prev, [scenarioKey]: { ...scenario, steps } }
      saveOverrides(next)
      return next
    })
  }, [])

  const addStep = useCallback((scenarioKey: ScenarioKey, afterIdx: number, refStep: StepState) => {
    setOverrides(prev => {
      const scenario = prev[scenarioKey] ?? { steps: [] }
      const steps = [...scenario.steps]
      // Insert a copy of refStep after afterIdx
      const newStep = { ...refStep, titleOverride: null, narrativeOverride: null }
      steps.splice(afterIdx + 1, 0, newStep)
      const next = { ...prev, [scenarioKey]: { steps } }
      saveOverrides(next)
      return next
    })
  }, [])

  const removeStep = useCallback((scenarioKey: ScenarioKey, stepIdx: number) => {
    setOverrides(prev => {
      const scenario = prev[scenarioKey]
      if (!scenario || scenario.steps.length <= 1) return prev
      const steps = scenario.steps.filter((_, i) => i !== stepIdx)
      const next = { ...prev, [scenarioKey]: { steps } }
      saveOverrides(next)
      return next
    })
  }, [])

  const initScenario = useCallback((scenarioKey: ScenarioKey, initialSteps: StepState[]) => {
    setOverrides(prev => {
      if (prev[scenarioKey]) return prev
      const next = { ...prev, [scenarioKey]: { steps: initialSteps } }
      saveOverrides(next)
      return next
    })
  }, [])

  const restoreOverrides = useCallback((snapshot: OverridesMap) => {
    setOverrides(snapshot)
    saveOverrides(snapshot)
  }, [])

  return { overrides, loaded, load, getStep, updateStep, addStep, removeStep, initScenario, restoreOverrides }
}

export { emptyStep }
