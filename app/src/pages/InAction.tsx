import { useState, useCallback, useEffect, useRef, Fragment } from 'react'
import FamOverviewDiagram from '../components/FamOverviewDiagram'
import { scenarios } from '../data/scenarios'
import AuthorFloatingPanel from '../components/AuthorFloatingPanel'
import { useScenariosState } from '../hooks/useScenariosState'
import type { StepState } from '../hooks/useScenariosState'
import { useAuthorUndoRedo } from '../hooks/useAuthorUndoRedo'

const DEV = import.meta.env.DEV
const INFRA_ACTORS = ['ASE-1','ASE-2','ASE-3','ASE-4','ASE-5','Broker','VCIS','Policy Engine','TLog','DLT']

function resolveAudience(step: typeof scenarios.A.steps[0], audience: 'technical' | 'business') {
  if (audience === 'business' && step.business) {
    return { title: step.business.title, narrative: step.business.narrative, privacy: step.business.privacy }
  }
  return { title: step.title, narrative: step.narrative, privacy: step.privacy }
}

function formatNarrative(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [text]
  const lead = sentences[0].trim()
  const rest = sentences.slice(1)
  const paras: string[] = []
  for (let i = 0; i < rest.length; i += 2) paras.push(rest.slice(i, i + 2).join('').trim())
  return (
    <>
      <p className="narrative-lead" dangerouslySetInnerHTML={{ __html: lead }} />
      {paras.length > 0 && (
        <>
          <span className="narrative-section-label">Sequence</span>
          {paras.map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p }} />)}
        </>
      )}
    </>
  )
}

const AUTHOR_INPUT: React.CSSProperties = {
  background: 'var(--bg-deep)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text-primary)',
  padding: '4px 8px',
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
}

const AUTHOR_TEXTAREA: React.CSSProperties = {
  ...AUTHOR_INPUT,
  lineHeight: 1.5,
  resize: 'vertical',
  marginBottom: 8,
}

export default function InAction() {
  const [scenario, setScenario] = useState<'A' | 'B'>('A')
  const [step, setStep] = useState(0)
  const [audience, setAudience] = useState<'technical' | 'business'>('technical')
  const [copied, setCopied] = useState(false)
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Author mode (dev only)
  const [authorMode, setAuthorMode] = useState(false)
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])

  // Draft state — uncommitted diagram highlight changes (active/flows/animated)
  const [diagramDraft, setDiagramDraft] = useState<{ active: string[], flows: string[], animated: string[] } | null>(null)
  const isDirty = diagramDraft !== null
  // Pending navigation blocked by unsaved draft
  const [pendingNav, setPendingNav] = useState<{ step: number, scenario?: 'A' | 'B' } | null>(null)

  const { overrides, load, getStep: getOverrideStep, updateStep, addStep, removeStep, initScenario, restoreOverrides } =
    useScenariosState()
  const { capture: captureAuthor, undo: undoAuthor, redo: redoAuthor, canUndo: canAuthorUndo, canRedo: canAuthorRedo } =
    useAuthorUndoRedo()

  useEffect(() => { load() }, [load])

  const scn = scenarios[scenario]

  // Merged step state
  const baseStep = scn.steps[step]
  // null means a placeholder index (see updateStep); treat it as "no override"
  const overrideStep = overrides[scenario]?.steps[step] || undefined
  const baseAud = baseStep
    ? resolveAudience(baseStep, audience)
    : { title: `Step ${step + 1}`, narrative: '', privacy: '' }

  const mergedActive   = overrideStep?.active   ?? (baseStep?.active   ?? [])
  const mergedFlows    = overrideStep?.flows     ?? (baseStep?.flows    ?? [])
  const mergedAnimated = overrideStep?.animated  ?? mergedFlows

  // Draft takes priority over committed state for what the diagram shows
  const effectiveActive   = diagramDraft?.active   ?? mergedActive
  const effectiveFlows    = diagramDraft?.flows     ?? mergedFlows
  const effectiveAnimated = diagramDraft?.animated  ?? mergedAnimated

  const activeNodeIds   = new Set(effectiveActive)
  const activeFlowIds   = new Set(effectiveFlows)
  const animatedFlowIds = new Set(effectiveAnimated)

  // Display text — override wins, else base
  const displayTitle        = overrideStep?.titleOverride        ?? baseAud.title
  const displayDuration     = overrideStep?.durationOverride     ?? (baseStep?.duration     ?? '')
  const displayActors       = overrideStep?.actorsOverride       ?? (baseStep?.actors       ?? [])
  const displayNarrative    = overrideStep?.narrativeOverride    ?? baseAud.narrative
  const displayPrivacy      = overrideStep?.privacyOverride      ?? baseAud.privacy
  const displayPayloadLabel = overrideStep?.payloadLabelOverride ?? (baseStep?.payloadLabel ?? '')
  const displayPayloadTag   = overrideStep?.payloadTagOverride   ?? (baseStep?.payloadTag   ?? '')
  const displayPayload      = overrideStep?.payloadOverride      ?? (baseStep?.payload      ?? '')

  const totalOverrideSteps = overrides[scenario]?.steps.length ?? 0
  const totalSteps = Math.max(scn.steps.length, totalOverrideSteps)

  const totalStepsRef = useRef(totalSteps)
  useEffect(() => { totalStepsRef.current = totalSteps }, [totalSteps])

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) { clearInterval(autoplayRef.current); autoplayRef.current = null }
    setIsPlaying(false)
  }, [])

  const startAutoplay = useCallback(() => {
    setIsPlaying(true)
    autoplayRef.current = setInterval(() => {
      setStep(s => {
        if (s < totalStepsRef.current - 1) return s + 1
        stopAutoplay()
        return s
      })
    }, 4500)
  }, [stopAutoplay])

  useEffect(() => { stopAutoplay() }, [scenario]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopAutoplay(), [stopAutoplay])
  // Stop autoplay the moment there are unsaved diagram changes
  useEffect(() => { if (isDirty) stopAutoplay() }, [isDirty, stopAutoplay])

  // Clear selection when step or scenario changes
  useEffect(() => {
    setSelectedNodeIds([])
    setSelectedEdgeIds([])
  }, [step, scenario])

  const handleAuthorSelectionChange = useCallback((nodeIds: string[], edgeIds: string[]) => {
    setSelectedNodeIds(nodeIds)
    setSelectedEdgeIds(edgeIds)
  }, [])

  const handleAuthorUndo = useCallback(() => {
    setDiagramDraft(null)
    const snap = undoAuthor()
    if (snap) restoreOverrides(snap)
  }, [undoAuthor, restoreOverrides])

  const handleAuthorRedo = useCallback(() => {
    setDiagramDraft(null)
    const snap = redoAuthor()
    if (snap) restoreOverrides(snap)
  }, [redoAuthor, restoreOverrides])

  // Keyboard undo/redo in author mode
  useEffect(() => {
    if (!authorMode) return
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleAuthorUndo() }
      if (e.key === 'z' &&  e.shiftKey) { e.preventDefault(); handleAuthorRedo() }
      if (e.key === 'y')                { e.preventDefault(); handleAuthorRedo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [authorMode, handleAuthorUndo, handleAuthorRedo])

  const doNavigate = useCallback((newStep: number, newScenario?: 'A' | 'B') => {
    stopAutoplay()
    if (newScenario && newScenario !== scenario) setScenario(newScenario)
    setStep(newStep)
    setDiagramDraft(null)
    setPendingNav(null)
  }, [scenario, stopAutoplay])

  const tryNavigate = useCallback((newStep: number, newScenario?: 'A' | 'B') => {
    if (authorMode && isDirty) {
      setPendingNav({ step: newStep, scenario: newScenario })
      return
    }
    doNavigate(newStep, newScenario)
  }, [authorMode, isDirty, doNavigate])

  const handleSaveDraft = useCallback(() => {
    if (!diagramDraft) return
    captureAuthor(overrides)
    updateStep(scenario, step, { active: diagramDraft.active, flows: diagramDraft.flows, animated: diagramDraft.animated })
    setDiagramDraft(null)
    if (pendingNav) doNavigate(pendingNav.step, pendingNav.scenario)
    else setPendingNav(null)
  }, [diagramDraft, scenario, step, overrides, updateStep, captureAuthor, pendingNav, doNavigate])

  const handleDiscardDraft = useCallback(() => {
    setDiagramDraft(null)
    if (pendingNav) doNavigate(pendingNav.step, pendingNav.scenario)
    else setPendingNav(null)
  }, [pendingNav, doNavigate])

  const handleScenarioSwitch = (s: 'A' | 'B') => {
    tryNavigate(0, s)
  }

  // Per-scenario node label overrides from scenarios.ts
  const nodeOverrides: Record<string, Record<string, unknown>> = {
    [scn.consumer.id]:    { label: scn.consumer.label, sublabel: scn.consumer.sub },
    [scn.cohort[0].id]:   { label: scn.cohort[0].label, sublabel: scn.cohort[0].sub },
    [scn.cohort[1].id]:   { label: scn.cohort[1].label, sublabel: scn.cohort[1].sub },
    [scn.owner.id]:       { label: scn.owner.label },
    ...(scn.supplier ? { [scn.supplier.id]: { label: scn.supplier.label, sublabel: scn.supplier.sublabel } } : {}),
    ...(Object.fromEntries(
      Object.entries(scn.aseLabels as unknown as Record<string, { sublabel: string }>).map(
        ([id, v]) => [id, v]
      )
    )),
  }

  // Initialize scenario overrides from scenarios.ts before first edit
  const ensureScenarioInit = useCallback((scenarioKey: string) => {
    const scnData = scenarios[scenarioKey as 'A' | 'B']
    if (!scnData) return
    initScenario(scenarioKey, scnData.steps.map(s => ({
      active: s.active,
      flows: s.flows,
      animated: s.flows,
      titleOverride: null,
      durationOverride: null,
      actorsOverride: null,
      narrativeOverride: null,
      privacyOverride: null,
      payloadLabelOverride: null,
      payloadTagOverride: null,
      payloadOverride: null,
    })))
  }, [initScenario])

  // ── Author mode handlers ───────────────────────────────────────────────────

  const handleSetNodesActive = useCallback((ids: string[], active: boolean) => {
    const current = new Set(effectiveActive)
    if (active) ids.forEach(id => current.add(id))
    else ids.forEach(id => current.delete(id))
    setDiagramDraft({ active: Array.from(current), flows: effectiveFlows, animated: effectiveAnimated })
  }, [effectiveActive, effectiveFlows, effectiveAnimated])

  const handleSetNodesDim = useCallback((ids: string[], dim: boolean) => {
    const current = new Set(effectiveActive)
    if (dim) ids.forEach(id => current.delete(id))
    else ids.forEach(id => current.add(id))
    setDiagramDraft({ active: Array.from(current), flows: effectiveFlows, animated: effectiveAnimated })
  }, [effectiveActive, effectiveFlows, effectiveAnimated])

  const handleSetEdgesAnimated = useCallback((ids: string[], animated: boolean) => {
    const flows = new Set(effectiveFlows)
    const anim = new Set(effectiveAnimated)
    ids.forEach(id => {
      flows.add(id)
      if (animated) anim.add(id)
      else anim.delete(id)
    })
    setDiagramDraft({ active: effectiveActive, flows: Array.from(flows), animated: Array.from(anim) })
  }, [effectiveActive, effectiveFlows, effectiveAnimated])

  const handleHideEdges = useCallback((ids: string[]) => {
    const flows = new Set(effectiveFlows)
    const anim  = new Set(effectiveAnimated)
    ids.forEach(id => { flows.delete(id); anim.delete(id) })
    setDiagramDraft({ active: effectiveActive, flows: Array.from(flows), animated: Array.from(anim) })
  }, [effectiveActive, effectiveFlows, effectiveAnimated])

  const handlePatch = useCallback((patch: Partial<StepState>) => {
    captureAuthor(overrides)
    updateStep(scenario, step, { active: mergedActive, flows: mergedFlows, animated: mergedAnimated, ...patch })
  }, [scenario, step, overrides, mergedActive, mergedFlows, mergedAnimated, updateStep, captureAuthor])

  const handleAddStepAfter = useCallback((afterIdx: number) => {
    setDiagramDraft(null)  // discard pending diagram changes before restructuring steps
    captureAuthor(overrides)
    ensureScenarioInit(scenario)
    const refStep = getOverrideStep(
      scenario, afterIdx,
      scn.steps[afterIdx]?.active ?? [],
      scn.steps[afterIdx]?.flows  ?? [],
    )
    addStep(scenario, afterIdx, refStep)
    setStep(afterIdx + 1)
  }, [scenario, scn.steps, overrides, getOverrideStep, addStep, ensureScenarioInit, captureAuthor])

  const handleRemoveStep = useCallback((idx: number) => {
    if (totalSteps <= 1) return
    captureAuthor(overrides)
    removeStep(scenario, idx)
    setStep(s => Math.min(s, totalSteps - 2))
  }, [scenario, totalSteps, overrides, removeStep, captureAuthor])

  const handleCopy = () => {
    const text = displayPayload.replace(/<[^>]+>/g, '')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }

  return (
    <div className="doc">

      {/* Author mode toggle + undo/redo — dev only, fixed top-right */}
      {DEV && (
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 300, display: 'flex', gap: 4 }}>
          {authorMode && (
            <>
              <button
                className="btn"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={handleAuthorUndo}
                disabled={!canAuthorUndo}
                title="Undo (⌘Z)"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7H11C13.2 7 15 8.8 15 11C15 13.2 13.2 15 11 15H7"/><path d="M6 4L3 7L6 10"/></svg>
              </button>
              <button
                className="btn"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={handleAuthorRedo}
                disabled={!canAuthorRedo}
                title="Redo (⌘⇧Z)"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: 'scaleX(-1)' }}><path d="M3 7H11C13.2 7 15 8.8 15 11C15 13.2 13.2 15 11 15H7"/><path d="M6 4L3 7L6 10"/></svg>
              </button>
            </>
          )}
          <button
            className={`btn${authorMode ? ' primary' : ''}`}
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => {
              setDiagramDraft(null)
              setPendingNav(null)
              setAuthorMode(m => !m)
              setSelectedNodeIds([])
              setSelectedEdgeIds([])
            }}
            title="Toggle author mode (dev only)"
          >
            ✎ {authorMode ? 'Exit Author' : 'Author'}
          </button>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="breadcrumb">
          <span>Architectural Blueprint</span>
          <span className="sep">/</span>
          <span>Federated Analytics Mesh (FAM)</span>
          <span className="sep">/</span>
          <span className="current">In Action</span>
        </div>
        <h1 className="title">FAM <span className="accent">in Action</span></h1>
        <p className="lede">
          Two end-to-end scenarios, stepped through one frame at a time. Watch which components activate,
          what cryptographic artefacts are generated, and what each party does — and crucially does not — learn at every step.
        </p>
      </header>

      {/* Scenario tabs */}
      <div className="tabs" role="tablist">
        {(['A', 'B'] as const).map(s => (
          <button
            key={s}
            className={`tab ${scenario === s ? 'active' : ''}`}
            data-scenario={s}
            role="tab"
            onClick={() => handleScenarioSwitch(s)}
          >
            <span className="tab-tag">USE CASE {s}</span>
            <span>{s === 'A' ? 'Invoice Financing — Acme × DBS' : 'GST Fraud Investigation — IRAS'}</span>
          </button>
        ))}
      </div>

      {/* Scenario heading */}
      <div className="scenario-head">
        <div className="scenario-title">{scn.title}</div>
        <div className="scenario-sub">{scn.sub}</div>
      </div>

      {/* Horizontal step strip */}
      <div className="step-strip" style={authorMode ? { alignItems: 'center' } : undefined}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const s = scn.steps[i]
          const so = overrides[scenario]?.steps[i]
          const baseTitle = s ? resolveAudience(s, audience).title : `Step ${i + 1}`
          const title = (so?.titleOverride ?? baseTitle).replace(/^Step \d+ — /, '')
          const isAdded = i >= scn.steps.length
          return (
            <Fragment key={i}>
              <button
                className={`step-pill ${i === step ? 'active' : ''}`}
                onClick={() => tryNavigate(i)}
              >
                <span className="step-num">STEP {String(i + 1).padStart(2, '0')}</span>
                <span className="step-name">{title}</span>
                {authorMode && isDirty && i === step && <span className="step-dirty-dot" />}
                {authorMode && isAdded && totalSteps > 1 && (
                  <span
                    style={{ marginLeft: 6, cursor: 'pointer', color: '#f87171', fontWeight: 700, lineHeight: 1 }}
                    onClick={e => { e.stopPropagation(); handleRemoveStep(i) }}
                    title="Remove this step"
                  >×</span>
                )}
              </button>
              {authorMode && (
                <button
                  className="btn"
                  style={{ fontSize: 11, padding: '2px 7px', flexShrink: 0 }}
                  onClick={() => handleAddStepAfter(i)}
                  title={`Insert step after step ${i + 1}`}
                >+</button>
              )}
            </Fragment>
          )
        })}
      </div>

      {/* Main layout: narration (left) + diagram (right) */}
      <div className="diagram-layout">

        {/* Left: narration — fields become inputs in author mode */}
        <div className="diagram-left">
          <div className="diagram-narration">
            <div className="sidebar-head">
              <span className="detail-label">What is happening</span>
              {authorMode ? (
                <input
                  value={displayDuration}
                  placeholder="e.g. ~2 s · per query"
                  onChange={e => handlePatch({ durationOverride: e.target.value || null })}
                  style={{ ...AUTHOR_INPUT, width: 160, fontSize: 11, padding: '2px 6px' }}
                />
              ) : (
                <span className="detail-meta">{displayDuration}</span>
              )}
            </div>
            <div className="sidebar-body">
              {authorMode ? (
                <input
                  value={displayTitle}
                  placeholder="Step title"
                  onChange={e => handlePatch({ titleOverride: e.target.value || null })}
                  style={{ ...AUTHOR_INPUT, marginBottom: 8, fontWeight: 600 }}
                />
              ) : (
                <div className="detail-title">{displayTitle}</div>
              )}
              <div className="detail-actors" style={authorMode ? { marginBottom: 8 } : undefined}>
                {authorMode ? (
                  <input
                    value={displayActors.join(', ')}
                    placeholder="Actor 1, Actor 2, ..."
                    onChange={e => handlePatch({
                      actorsOverride: e.target.value
                        ? e.target.value.split(',').map(a => a.trim()).filter(Boolean)
                        : null
                    })}
                    style={{ ...AUTHOR_INPUT, fontSize: 11 }}
                  />
                ) : (
                  displayActors.map((a, i) => {
                    const isInfra = INFRA_ACTORS.some(inf => a.startsWith(inf))
                    return (
                      <span key={i} className={`actor-chip ${i === 0 ? 'primary' : isInfra ? 'infra' : ''}`}>
                        {a}
                      </span>
                    )
                  })
                )}
              </div>
              {authorMode ? (
                <textarea
                  value={displayNarrative}
                  placeholder="Narrative text…"
                  rows={6}
                  onChange={e => handlePatch({ narrativeOverride: e.target.value || null })}
                  style={AUTHOR_TEXTAREA}
                />
              ) : (
                <div className="detail-narrative">{formatNarrative(displayNarrative)}</div>
              )}
              {authorMode ? (
                <textarea
                  value={displayPrivacy}
                  placeholder="What does not leak →"
                  rows={3}
                  onChange={e => handlePatch({ privacyOverride: e.target.value || null })}
                  style={AUTHOR_TEXTAREA}
                />
              ) : (
                <div className="privacy-callout">
                  <strong>What does not leak →</strong> {displayPrivacy}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diagram */}
        <div className="diagram-frame" style={{ position: 'relative' }}>
          <FamOverviewDiagram
            readOnly
            activeNodeIds={activeNodeIds}
            activeFlowIds={activeFlowIds}
            animatedFlowIds={animatedFlowIds}
            nodeOverrides={nodeOverrides}
            authorMode={authorMode}
            onAuthorSelectionChange={handleAuthorSelectionChange}
          />
          {authorMode && (
            <AuthorFloatingPanel
              selectedNodeIds={selectedNodeIds}
              selectedEdgeIds={selectedEdgeIds}
              activeNodeIds={effectiveActive}
              activeFlowIds={effectiveFlows}
              animatedFlowIds={effectiveAnimated}
              onSetNodesActive={handleSetNodesActive}
              onSetNodesDim={handleSetNodesDim}
              onSetEdgesAnimated={handleSetEdgesAnimated}
              onHideEdges={handleHideEdges}
            />
          )}
          {authorMode && isDirty && (
            <div className="draft-bar">
              <div className="draft-bar-info">
                {pendingNav
                  ? <>Navigate away from Step {step + 1}? Unsaved diagram changes will be lost.</>
                  : <>Step {step + 1} — unsaved diagram changes</>
                }
              </div>
              <div className="draft-bar-actions">
                {pendingNav && (
                  <button className="btn" style={{ fontSize: 11, padding: '3px 9px' }} onClick={() => setPendingNav(null)}>
                    Stay
                  </button>
                )}
                <button className="btn" style={{ fontSize: 11, padding: '3px 9px' }} onClick={handleDiscardDraft}>
                  {pendingNav ? 'Discard & continue' : 'Discard'}
                </button>
                <button className="btn primary" style={{ fontSize: 11, padding: '3px 9px' }} onClick={handleSaveDraft}>
                  {pendingNav ? 'Save & continue' : 'Save override'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payload panel below */}
      <div className="payload-panel">
        <div className="sidebar-head">
          <span className="detail-label">
            {authorMode ? (
              <input
                value={displayPayloadLabel}
                placeholder="Payload label"
                onChange={e => handlePatch({ payloadLabelOverride: e.target.value || null })}
                style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'inherit', fontSize: 'inherit', padding: '0 2px', width: 260 }}
              />
            ) : displayPayloadLabel}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {authorMode ? (
              <input
                value={displayPayloadTag}
                placeholder="e.g. JSON-LD · W3C VC"
                onChange={e => handlePatch({ payloadTagOverride: e.target.value || null })}
                style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, padding: '0 2px', width: 180 }}
              />
            ) : (
              <span className="detail-meta">{displayPayloadTag}</span>
            )}
            <button
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copy JSON"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="5" width="9" height="9" rx="1.5"/>
                <path d="M5 11H3.5A1.5 1.5 0 012 9.5v-7A1.5 1.5 0 013.5 1h7A1.5 1.5 0 0112 2.5V5"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="payload-sidebar">
          {authorMode ? (
            <textarea
              value={displayPayload.replace(/<[^>]+>/g, '')}
              placeholder="Payload JSON…"
              onChange={e => handlePatch({ payloadOverride: e.target.value || null })}
              style={{
                ...AUTHOR_TEXTAREA,
                height: 200,
                fontFamily: 'var(--mono)',
                fontSize: 12,
                marginBottom: 0,
              }}
            />
          ) : (
            <pre
              className="payload-pre"
              dangerouslySetInnerHTML={{ __html: displayPayload }}
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="control-grp">
          <button className="btn" onClick={() => tryNavigate(Math.max(0, step - 1))} disabled={step === 0}>
            <svg className="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12L6 8l4-4"/></svg>
            Previous
          </button>
          <button className="btn primary" onClick={() => tryNavigate(Math.min(totalSteps - 1, step + 1))} disabled={step === totalSteps - 1}>
            Next
            <svg className="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4l4 4-4 4"/></svg>
          </button>
          <button className="btn" onClick={() => isPlaying ? stopAutoplay() : startAutoplay()}>
            {isPlaying
              ? <><svg className="btn-icon" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="3" height="10"/><rect x="9" y="3" width="3" height="10"/></svg> Pause</>
              : <><svg className="btn-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M4 3l9 5-9 5V3z"/></svg> Auto-play</>
            }
          </button>
        </div>

        <div className="aud-wrap">
          <span className="aud-label">Narration</span>
          <div className="audience-toggle" role="tablist" aria-label="Narration audience">
            {(['technical', 'business'] as const).map(a => (
              <button
                key={a}
                className={`aud-btn ${audience === a ? 'active' : ''}`}
                onClick={() => setAudience(a)}
                role="tab"
                aria-selected={audience === a}
              >
                <span className="aud-dot" />
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="progress-text">
          Step <strong>{step + 1}</strong> of {totalSteps}
        </div>
      </div>

      {/* Journey stats */}
      <div className="journey">
        <div className="journey-title">Aggregate journey metrics for this scenario</div>
        <div className="journey-grid">
          {scn.journey.map((j, i) => (
            <div key={i} className="journey-stat">
              <div className="journey-stat-num">{j.num}</div>
              <div className="journey-stat-label">{j.label}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="footer">
        <div>
          <span className="footer-tag">Mesh in Action</span>
          <span className="footer-tag">B-1.a · FAM</span>
        </div>
        <div>April 2026 · UK English · part of the Federated Analytics Mesh (FAM) blueprint series</div>
      </footer>
    </div>
  )
}
