import { useEffect, useRef, useState } from 'react'
import type { DiagramVersion } from '../hooks/useVersionStore'

interface Props {
  versions: DiagramVersion[]
  onSaveNew:    (label?: string) => void
  onLoad:       (v: DiagramVersion) => void
  onPromote:    (v: DiagramVersion) => void
  onRename:     (id: number, label: string) => void
  onDelete:     (id: number) => void
}

function fmt(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

function HistoryIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 8a7 7 0 1 0 2-4.9" />
      <polyline points="1,3 1,8 6,8" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,3 5,7 8,3" />
    </svg>
  )
}

export default function VersionDropdown({ versions, onSaveNew, onLoad, onPromote, onRename, onDelete }: Props) {
  const [open, setOpen]           = useState(false)
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameVal, setRenameVal] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as globalThis.Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const latest = versions[versions.length - 1]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn icon-btn"
        onClick={() => setOpen(v => !v)}
        title="Manage diagram versions"
        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
      >
        <HistoryIcon />
        {latest ? `v${latest.id}` : 'Versions'}
        <ChevronDown />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 8, minWidth: 280, zIndex: 999,
          boxShadow: '0 8px 24px rgba(0,0,0,.4)',
          overflow: 'hidden',
        }}>
          {/* Save new version */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <button
              className="btn primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { onSaveNew(); setOpen(false) }}
            >
              Save new version
            </button>
          </div>

          {/* Version list */}
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {versions.length === 0 && (
              <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 13 }}>
                No saved versions yet.
              </div>
            )}
            {[...versions].reverse().map(v => (
              <div
                key={v.id}
                style={{
                  padding: '8px 14px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                    v{v.id} · {fmt(v.timestamp)}
                  </div>
                  {renamingId === v.id ? (
                    <form
                      onSubmit={e => {
                        e.preventDefault()
                        onRename(v.id, renameVal)
                        setRenamingId(null)
                      }}
                      style={{ marginTop: 4 }}
                    >
                      <input
                        autoFocus
                        value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onBlur={() => { onRename(v.id, renameVal); setRenamingId(null) }}
                        style={{
                          background: 'var(--bg)', border: '1px solid var(--accent)',
                          borderRadius: 4, color: 'var(--text)', padding: '2px 6px',
                          fontSize: 13, width: '100%', outline: 'none',
                        }}
                        placeholder="Label (optional)"
                      />
                    </form>
                  ) : (
                    <div
                      style={{ fontSize: 13, color: v.label ? 'var(--text)' : 'var(--text-dim)', marginTop: 2, cursor: 'pointer' }}
                      title="Click to rename"
                      onClick={() => { setRenamingId(v.id); setRenameVal(v.label) }}
                    >
                      {v.label || '— add label —'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 4, flexShrink: 0, paddingTop: 2 }}>
                  <button
                    className="btn"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => { onLoad(v); setOpen(false) }}
                    title="Preview this version (view-only)"
                  >
                    Load
                  </button>
                  <button
                    className="btn primary"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => {
                      if (confirm(`Promote v${v.id} to live? Unsaved changes will be replaced.`)) {
                        onPromote(v); setOpen(false)
                      }
                    }}
                    title="Make this version the live diagram"
                  >
                    Promote
                  </button>
                  {versions.length > 1 && (
                    <button
                      className="btn danger"
                      style={{ fontSize: 11, padding: '2px 8px' }}
                      onClick={() => onDelete(v.id)}
                      title="Delete this version"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
