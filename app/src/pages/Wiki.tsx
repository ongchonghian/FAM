import { useState } from 'react'
import { Link } from 'react-router-dom'
import FamDiagram from '../components/FamDiagram'

const docs = [
  {
    tag: '01 — Overview',
    title: 'Executive Infographic',
    desc: 'High-level blueprint · PET layers · use cases · roadmap · constraints satisfied',
    to: '/5th-corner',
    color: 'var(--accent)',
    bg: 'rgba(57,255,132,.12)',
  },
  {
    tag: '02 — Deep Dive',
    title: 'Architecture Deep-Dive',
    desc: 'Component anatomy · sequence flows · protocol stack · threat model · failure modes',
    to: '/architecture',
    color: 'var(--accent-2)',
    bg: 'rgba(56,189,248,.12)',
  },
  {
    tag: '03 — In Action',
    title: 'Mesh in Action',
    desc: 'Interactive walk-through · Use Case A (invoice financing) · Use Case B (MAS cross-bank FL)',
    to: '/in-action',
    color: 'var(--accent-3)',
    bg: 'rgba(251,191,36,.12)',
  },
  {
    tag: '04 — Reference',
    title: 'Data Dictionary',
    desc: '103 terms · 8 categories · acronyms, protocols, standards, institutions',
    to: '/data-dictionary',
    color: 'var(--accent-5)',
    bg: 'rgba(167,139,250,.12)',
  },
]

type Tab = 'docs' | 'diagram'

export default function Wiki() {
  const [tab, setTab] = useState<Tab>('docs')

  return (
    <div className="doc">
      <header className="header">
        <div className="breadcrumb">
          <span>Architectural Blueprint</span>
          <span className="sep">/</span>
          <span>Federated Analytics Mesh (FAM)</span>
          <span className="sep">/</span>
          <span className="current">Knowledge Base</span>
        </div>
        <h1 className="title">FAM <span className="accent">Knowledge Base</span></h1>
        <p className="lede">
          Four interconnected documents that together constitute the architectural blueprint for the
          Federated Analytics Mesh — from executive overview to deep-dive reference.
        </p>
      </header>

      {/* Tab strip */}
      <div className="tabs" role="tablist" style={{ marginBottom: 32 }}>
        <button
          className={`tab ${tab === 'docs' ? 'active' : ''}`}
          role="tab"
          onClick={() => setTab('docs')}
        >
          <span className="tab-tag">KNOWLEDGE BASE</span>
          <span>Documents</span>
        </button>
        <button
          className={`tab ${tab === 'diagram' ? 'active' : ''}`}
          role="tab"
          onClick={() => setTab('diagram')}
        >
          <span className="tab-tag">EDITOR</span>
          <span>FAM Diagram</span>
        </button>
      </div>

      {tab === 'docs' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 48 }}>
            {docs.map(d => (
              <Link
                key={d.to}
                to={d.to}
                style={{
                  display: 'block',
                  background: 'var(--bg-card)',
                  border: `1px solid var(--border)`,
                  borderRadius: 12,
                  padding: '28px 32px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.18s, box-shadow 0.18s, transform 0.15s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = d.color
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = `0 8px 24px rgba(0,0,0,.3), 0 0 0 1px ${d.color}22`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = 'var(--border)'
                  el.style.transform = ''
                  el.style.boxShadow = ''
                }}
              >
                <div style={{
                  display: 'inline-flex', background: d.bg, color: d.color,
                  fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.1em', padding: '4px 10px',
                  borderRadius: 4, marginBottom: 16, textTransform: 'uppercase',
                }}>
                  {d.tag}
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>
                  {d.title}
                </div>
                <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {d.desc}
                </div>
                <div style={{
                  position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-dim)', fontSize: 20, opacity: 0.5,
                }}>
                  →
                </div>
              </Link>
            ))}
          </div>

          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderLeft: '3px solid var(--accent)', borderRadius: 8,
            padding: '18px 22px', marginBottom: 48,
            fontSize: 15, color: 'var(--text)', lineHeight: 1.65,
          }}>
            <strong style={{ color: 'var(--accent)' }}>About this blueprint —</strong>{' '}
            The Federated Analytics Mesh (FAM) extends the canonical PEPPOL 4-corner network with a privacy-preserving
            analytical layer for banks, auditors and enterprises operating on Singapore InvoiceNow.
            No invoices are centralised; queries travel to data, not the reverse.
          </div>

          <footer className="footer">
            <div>
              <span className="footer-tag">Knowledge Base</span>
              <span className="footer-tag">B-1.a · FAM</span>
            </div>
            <div>April 2026 · UK English · part of the Federated Analytics Mesh (FAM) blueprint series</div>
          </footer>
        </>
      )}

      {tab === 'diagram' && (
        <div style={{ height: 'calc(100vh - 260px)', minHeight: 560 }}>
          <FamDiagram editorMode />
        </div>
      )}
    </div>
  )
}
