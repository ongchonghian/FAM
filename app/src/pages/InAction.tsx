import { useState, useCallback, useEffect, useRef } from 'react'
import FamDiagram from '../components/FamDiagram'
import { scenarios } from '../data/scenarios'

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

export default function InAction() {
  const [scenario, setScenario] = useState<'A' | 'B'>('A')
  const [step, setStep] = useState(0)
  const [audience, setAudience] = useState<'technical' | 'business'>('technical')
  const [copied, setCopied] = useState(false)
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const scn = scenarios[scenario]
  const currentStep = scn.steps[step]
  const aud = resolveAudience(currentStep, audience)
  const totalSteps = scn.steps.length

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) { clearInterval(autoplayRef.current); autoplayRef.current = null }
    setIsPlaying(false)
  }, [])

  const startAutoplay = useCallback(() => {
    setIsPlaying(true)
    autoplayRef.current = setInterval(() => {
      setStep(s => {
        if (s < scenarios[scenario].steps.length - 1) return s + 1
        stopAutoplay()
        return s
      })
    }, 4500)
  }, [scenario, stopAutoplay])

  useEffect(() => { stopAutoplay() }, [scenario]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopAutoplay(), [stopAutoplay])

  const handleScenarioSwitch = (s: 'A' | 'B') => {
    stopAutoplay()
    setScenario(s)
    setStep(0)
  }

  // Build active node ids — add dynamic per-scenario overrides for C5 / ASE labels
  const activeNodeIds = new Set(currentStep.active)

  const nodeOverrides: Record<string, Record<string, unknown>> = {
    'n-c5':    { label: scn.consumer.label, sublabel: scn.consumer.sub },
    'n-c5b':   { label: scn.cohort[0].label, sublabel: scn.cohort[0].sub },
    'n-c5c':   { label: scn.cohort[1].label, sublabel: scn.cohort[1].sub },
    'n-owner': { label: scn.owner.label },
    ...(Object.fromEntries(
      Object.entries(scn.aseLabels as unknown as Record<string, { sublabel: string }>).map(
        ([id, v]) => [id, v]
      )
    )),
  }

  const activeFlowIds = new Set(currentStep.flows)

  const handleCopy = () => {
    const text = currentStep.payload.replace(/<[^>]+>/g, '')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }

  return (
    <div className="doc">
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

      {/* Step strip */}
      <div className="step-strip">
        {scn.steps.map((s, i) => {
          const title = resolveAudience(s, audience).title.replace(/^Step \d+ — /, '')
          return (
            <button
              key={i}
              className={`step-pill ${i === step ? 'active' : ''}`}
              onClick={() => { stopAutoplay(); setStep(i) }}
            >
              <span className="step-num">STEP {String(i + 1).padStart(2, '0')}</span>
              <span className="step-name">{title}</span>
            </button>
          )
        })}
      </div>

      {/* Three-column scene */}
      <div className="scene-columns" style={{ '--sidebar-left-w': '300px', '--sidebar-right-w': '300px' } as React.CSSProperties}>

        {/* Left sidebar: narration */}
        <aside className="sidebar">
          <div className="sidebar-head">
            <span className="detail-label">What is happening</span>
            <span className="detail-meta">{currentStep.duration}</span>
          </div>
          <div className="sidebar-body">
            <div className="detail-title">{aud.title}</div>
            <div className="detail-actors">
              {currentStep.actors.map((a, i) => {
                const isInfra = INFRA_ACTORS.some(inf => a.startsWith(inf))
                return (
                  <span key={i} className={`actor-chip ${i === 0 ? 'primary' : isInfra ? 'infra' : ''}`}>
                    {a}
                  </span>
                )
              })}
            </div>
            <div className="detail-narrative">{formatNarrative(aud.narrative)}</div>
            <div className="privacy-callout">
              <strong>What does not leak →</strong> {aud.privacy}
            </div>
          </div>
        </aside>

        {/* Center: React Flow diagram */}
        <FamDiagram
          activeNodeIds={activeNodeIds}
          activeFlowIds={activeFlowIds}
          nodeOverrides={nodeOverrides}
        />

        {/* Right sidebar: cryptographic artefact */}
        <aside className="sidebar sidebar-right">
          <div className="sidebar-head">
            <span className="detail-label">{currentStep.payloadLabel}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="detail-meta">{currentStep.payloadTag}</span>
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
            <pre
              className="payload-pre"
              dangerouslySetInnerHTML={{ __html: currentStep.payload }}
            />
          </div>
        </aside>
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="control-grp">
          <button className="btn" onClick={() => { stopAutoplay(); setStep(s => Math.max(0, s - 1)) }} disabled={step === 0}>
            <svg className="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12L6 8l4-4"/></svg>
            Previous
          </button>
          <button className="btn primary" onClick={() => { stopAutoplay(); setStep(s => Math.min(totalSteps - 1, s + 1)) }} disabled={step === totalSteps - 1}>
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
