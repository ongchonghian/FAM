import React, { useEffect, useRef, useState } from 'react'
import { type AlignType } from '../utils/nodeAlignment'
import { type LayoutType, LAYOUT_TYPE_LABELS } from '../hooks/useElkLayout'

interface DiagramToolbarProps {
  isLocked: boolean
  onToggleLock: () => void
  onSave: () => void
  onReset: () => void
  onAutoAlign?: () => void
  onRerouteEdges?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onAlign?: (type: AlignType) => void
  onAddNode?: (type: string) => void
  onDeleteSelected?: () => void
  onSetActive?: () => void
  onSetDim?: () => void
  onSetStatic?: () => void
  onSetAnimate?: () => void
  onSetColor?: (color: string) => void
  selectedColor?: string
  canUndo?: boolean
  canRedo?: boolean
  selectedCount?: number
  edgeSelectedCount?: number
  deletableCount?: number
  showSaved: boolean
  hasSavedData: boolean
  isLayouting?: boolean
  layoutType?: LayoutType
  onLayoutTypeChange?: (type: LayoutType) => void
  // New separate routing + line-style selectors (replaces old bundled defaultEdgeType)
  defaultRouting?: string
  onRoutingChange?: (routing: string) => void
  defaultLineStyle?: string
  onLineStyleChange?: (style: string) => void
  // Extra slot for injecting version management or other controls
  extraControls?: React.ReactNode
}

const PRESET_COLORS = [
  '#39ff84', '#38bdf8', '#fbbf24', '#f472b6', '#a78bfa',
  '#ef4444', '#fb923c', '#34d399', '#8a96b8', '#e8edf7',
]

const NODE_TYPE_ITEMS = [
  { type: 'mesh',    label: 'Mesh Node',  color: '#39ff84' },
  { type: 'actor',   label: 'Actor',      color: '#38bdf8' },
  { type: 'service', label: 'Service',    color: '#ef4444' },
  { type: 'compact', label: 'Compact',    color: '#fbbf24' },
  { type: 'band',    label: 'Container',  color: '#3d4a73' },
]

const ROUTING_OPTIONS = [
  { value: 'smoothstep', label: 'Smooth' },
  { value: 'straight',   label: 'Straight' },
  { value: 'curved',     label: 'Curved' },
  { value: 'routed',     label: 'Orthogonal (A*)' },
]

const LINE_STYLE_OPTIONS = [
  { value: 'solid',   label: 'Solid' },
  { value: 'dashed',  label: 'Dashed' },
  { value: 'dotted',  label: 'Dotted' },
]

// Compute the ReactFlow edge type from routing + line style
export function computeEdgeType(routing: string, lineStyle: string): string {
  if (routing === 'routed') return 'routed'
  if (lineStyle === 'dashed') return 'dashed'
  if (lineStyle === 'dotted') return 'dotted'
  return routing  // 'smoothstep' | 'straight' | 'curved'
}

// ── Icons ────────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="10" height="8" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

function UnlockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="10" height="8" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0" />
    </svg>
  )
}

function AlignIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="5" height="4" rx="1" />
      <rect x="10" y="2" width="5" height="4" rx="1" />
      <rect x="5" y="9" width="6" height="4" rx="1" />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7.5A5 5 0 1 1 5 12" />
      <polyline points="1,5 3,7.5 5.5,5.5" />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7.5A5 5 0 1 0 11 12" />
      <polyline points="15,5 13,7.5 10.5,5.5" />
    </svg>
  )
}

// Alignment icons — 16×16 viewBox, filled rects + anchor line

function AlignLeftIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <rect x="1" y="0" width="1.5" height="16" rx="0.5" opacity="0.5" />
      <rect x="2.5" y="3" width="8" height="3.5" rx="0.5" />
      <rect x="2.5" y="9.5" width="12" height="3.5" rx="0.5" />
    </svg>
  )
}

function AlignCenterHIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <rect x="7.25" y="0" width="1.5" height="16" rx="0.5" opacity="0.5" />
      <rect x="3.5" y="3" width="9" height="3.5" rx="0.5" />
      <rect x="1" y="9.5" width="14" height="3.5" rx="0.5" />
    </svg>
  )
}

function AlignRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <rect x="13.5" y="0" width="1.5" height="16" rx="0.5" opacity="0.5" />
      <rect x="5.5" y="3" width="8" height="3.5" rx="0.5" />
      <rect x="1.5" y="9.5" width="12" height="3.5" rx="0.5" />
    </svg>
  )
}

function AlignTopIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <rect x="0" y="1" width="16" height="1.5" rx="0.5" opacity="0.5" />
      <rect x="2" y="2.5" width="4" height="8" rx="0.5" />
      <rect x="10" y="2.5" width="4" height="12" rx="0.5" />
    </svg>
  )
}

function AlignMiddleVIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <rect x="0" y="7.25" width="16" height="1.5" rx="0.5" opacity="0.5" />
      <rect x="2" y="3.5" width="4" height="9" rx="0.5" />
      <rect x="10" y="1" width="4" height="14" rx="0.5" />
    </svg>
  )
}

function AlignBottomIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <rect x="0" y="13.5" width="16" height="1.5" rx="0.5" opacity="0.5" />
      <rect x="2" y="5.5" width="4" height="8" rx="0.5" />
      <rect x="10" y="1.5" width="4" height="12" rx="0.5" />
    </svg>
  )
}

function DistHIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <rect x="0.5" y="4" width="3.5" height="8" rx="0.5" />
      <rect x="6.25" y="4" width="3.5" height="8" rx="0.5" />
      <rect x="12" y="4" width="3.5" height="8" rx="0.5" />
      <rect x="4" y="7.25" width="2.25" height="1.5" rx="0.5" opacity="0.5" />
      <rect x="9.75" y="7.25" width="2.25" height="1.5" rx="0.5" opacity="0.5" />
    </svg>
  )
}

function DistVIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <rect x="4" y="0.5" width="8" height="3.5" rx="0.5" />
      <rect x="4" y="6.25" width="8" height="3.5" rx="0.5" />
      <rect x="4" y="12" width="8" height="3.5" rx="0.5" />
      <rect x="7.25" y="4" width="1.5" height="2.25" rx="0.5" opacity="0.5" />
      <rect x="7.25" y="9.75" width="1.5" height="2.25" rx="0.5" opacity="0.5" />
    </svg>
  )
}

function RouteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="3" cy="3" r="1.5" />
      <circle cx="13" cy="13" r="1.5" />
      <path d="M3 4.5 L3 8 Q3 11 6 11 L10 11 Q13 11 13 8 L13 4.5" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,4 14,4" />
      <path d="M5 4V2h6v2" />
      <path d="M3 4l1 10h8l1-10" />
      <line x1="6.5" y1="7" x2="6.5" y2="11" />
      <line x1="9.5" y1="7" x2="9.5" y2="11" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="7" y1="1" x2="7" y2="13" />
      <line x1="1" y1="7" x2="13" y2="7" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,3 5,7 8,3" />
    </svg>
  )
}

function ColorSwatchIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14">
      <circle cx="7" cy="7" r="5.5" fill={color} />
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    </svg>
  )
}

function Sep() {
  return <div style={{ width: 1, height: 18, background: 'rgba(61,74,115,0.6)', margin: '0 2px', flexShrink: 0 }} />
}

function ActiveDotIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="3.5" fill="currentColor" />
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    </svg>
  )
}

function DimDotIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" strokeDasharray="3 2" />
      <circle cx="7" cy="7" r="2.5" fill="currentColor" opacity="0.35" />
    </svg>
  )
}

function StaticLineIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="1" y1="8" x2="15" y2="8" />
      <line x1="13" y1="5" x2="13" y2="11" />
    </svg>
  )
}

function AnimateLineIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M1 8 L5 8" strokeDasharray="3 2" />
      <path d="M6 8 L10 8" strokeDasharray="3 2" />
      <path d="M11 8 L15 8" strokeDasharray="3 2" />
      <polyline points="11,5 15,8 11,11" strokeWidth="1.4" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DiagramToolbar({
  isLocked,
  onToggleLock,
  onSave,
  onReset,
  onAutoAlign,
  onRerouteEdges,
  onUndo,
  onRedo,
  onAlign,
  onAddNode,
  onDeleteSelected,
  onSetActive,
  onSetDim,
  onSetStatic,
  onSetAnimate,
  onSetColor,
  selectedColor = '#8a96b8',
  canUndo = false,
  canRedo = false,
  selectedCount = 0,
  edgeSelectedCount = 0,
  deletableCount,
  showSaved,
  hasSavedData,
  isLayouting,
  layoutType = 'layered-lr',
  onLayoutTypeChange,
  defaultRouting = 'smoothstep',
  onRoutingChange,
  defaultLineStyle = 'solid',
  onLineStyleChange,
  extraControls,
}: DiagramToolbarProps) {
  const showAlignRow = !isLocked && selectedCount >= 2
  const deleteCount = deletableCount ?? selectedCount
  const hasSelection = !isLocked && deleteCount >= 1

  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)
  const [colorMenuOpen, setColorMenuOpen] = useState(false)
  const colorMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!addMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (!addMenuRef.current?.contains(e.target as globalThis.Node)) setAddMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [addMenuOpen])

  useEffect(() => {
    if (!colorMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (!colorMenuRef.current?.contains(e.target as globalThis.Node)) setColorMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [colorMenuOpen])

  return (
    <div className="diagram-toolbar">
      {/* ── Layout tools row — only when unlocked ── */}
      {!isLocked && (
        <div className="diagram-toolbar-row">
          {hasSavedData && (
            <button className="btn reset-muted" onClick={onReset} title="Reset to default layout">Reset</button>
          )}
          {onAutoAlign && (
            <>
              <button className="btn" onClick={onAutoAlign} disabled={isLayouting}
                title="Auto-align selected nodes (or all if none selected)"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlignIcon />
                {isLayouting ? 'Aligning…' : 'Auto-align'}
              </button>
              <select
                className="layout-type-select"
                value={layoutType}
                onChange={e => onLayoutTypeChange?.(e.target.value as LayoutType)}
                title="Layout algorithm used by Auto-align"
              >
                {(Object.keys(LAYOUT_TYPE_LABELS) as LayoutType[]).map(k => (
                  <option key={k} value={k}>{LAYOUT_TYPE_LABELS[k]}</option>
                ))}
              </select>
            </>
          )}
          {onRerouteEdges && (
            <button className="btn" onClick={onRerouteEdges}
              title="Re-route all edges to avoid node overlaps"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RouteIcon />
              Re-route
            </button>
          )}
          {onAddNode && (
            <>
              <Sep />
              {/* Add Node dropdown */}
              <div ref={addMenuRef} style={{ position: 'relative' }}>
                <button
                  className="btn"
                  onClick={() => setAddMenuOpen(v => !v)}
                  title="Add a new node to the diagram"
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <PlusIcon /> Add node <ChevronDownIcon />
                </button>
                {addMenuOpen && (
                  <div className="add-node-menu">
                    {NODE_TYPE_ITEMS.map(item => (
                      <button
                        key={item.type}
                        className="add-node-menu-item"
                        onClick={() => { onAddNode(item.type); setAddMenuOpen(false) }}
                      >
                        <span className="add-node-menu-dot" style={{ background: item.color }} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Routing selector */}
              <select
                className="layout-type-select"
                value={defaultRouting}
                onChange={e => onRoutingChange?.(e.target.value)}
                title="How new connectors travel between nodes"
              >
                {ROUTING_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {/* Line style selector */}
              <select
                className="layout-type-select"
                value={defaultLineStyle}
                onChange={e => onLineStyleChange?.(e.target.value)}
                title="Visual appearance of new connectors"
              >
                {LINE_STYLE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      {/* ── Main row ── */}
      <div className="diagram-toolbar-row">
        {!isLocked && (
          <>
            <button className="btn icon-btn" onClick={onUndo} disabled={!canUndo}
              title="Undo (⌘Z)" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <UndoIcon />Undo
            </button>
            <button className="btn icon-btn" onClick={onRedo} disabled={!canRedo}
              title="Redo (⌘⇧Z)" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <RedoIcon />Redo
            </button>
            <Sep />
            <button className={`btn${showSaved ? ' saved' : ' primary'}`} onClick={onSave}
              title="Save current layout">
              {showSaved ? 'Saved!' : 'Save'}
            </button>
            {hasSelection && onDeleteSelected && (
              <>
                <Sep />
                <button
                  className="btn danger"
                  onClick={onDeleteSelected}
                  title={`Delete ${deleteCount} selected item${deleteCount > 1 ? 's' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <TrashIcon />
                  Delete{deleteCount > 1 ? ` (${deleteCount})` : ''}
                </button>
              </>
            )}
            {hasSelection && (onSetActive || onSetDim) && (
              <>
                <Sep />
                {onSetActive && (
                  <button
                    className="btn"
                    onClick={onSetActive}
                    title="Toggle active state on selected nodes (full colour + glow)"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#39ff84' }}
                  >
                    <ActiveDotIcon />
                    Active
                  </button>
                )}
                {onSetDim && (
                  <button
                    className="btn"
                    onClick={onSetDim}
                    title="Toggle dim state on selected nodes (faded, 35% opacity)"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#5a6584' }}
                  >
                    <DimDotIcon />
                    Dim
                  </button>
                )}
              </>
            )}
            {!isLocked && edgeSelectedCount > 0 && (onSetStatic || onSetAnimate) && (
              <>
                <Sep />
                {onSetStatic && (
                  <button
                    className="btn"
                    onClick={onSetStatic}
                    title="Toggle static state on selected connectors (no animation)"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#5a6584' }}
                  >
                    <StaticLineIcon />
                    Static
                  </button>
                )}
                {onSetAnimate && (
                  <button
                    className="btn"
                    onClick={onSetAnimate}
                    title="Toggle animation on selected connectors"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#38bdf8' }}
                  >
                    <AnimateLineIcon />
                    Animate
                  </button>
                )}
              </>
            )}
            {hasSelection && onSetColor && (
              <>
                <Sep />
                <div ref={colorMenuRef} style={{ position: 'relative' }}>
                  <button
                    className="btn icon-btn"
                    onClick={() => setColorMenuOpen(v => !v)}
                    title="Change colour of selected nodes / edges"
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <ColorSwatchIcon color={selectedColor} />
                    Color
                  </button>
                  {colorMenuOpen && (
                    <div className="color-picker-menu">
                      <div className="color-presets">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            className={`color-preset-swatch${selectedColor === c ? ' active' : ''}`}
                            style={{ background: c }}
                            onClick={() => { onSetColor(c); setColorMenuOpen(false) }}
                            title={c}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        className="color-custom-input"
                        value={selectedColor}
                        onChange={e => onSetColor(e.target.value)}
                        title="Custom colour"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
        {extraControls && (
          <>
            <Sep />
            {extraControls}
          </>
        )}
        <button className="btn" onClick={onToggleLock}
          title={isLocked ? 'Unlock to edit layout' : 'Lock layout'}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLocked ? <LockIcon /> : <UnlockIcon />}
          {isLocked ? 'Edit layout' : 'Lock layout'}
        </button>
      </div>

      {/* ── Alignment row — only when 2+ nodes selected ── */}
      {showAlignRow && onAlign && (
        <div className="diagram-toolbar-row">
          <button className="btn icon-btn" onClick={() => onAlign('align-left')}    title="Align left edges">     <AlignLeftIcon /></button>
          <button className="btn icon-btn" onClick={() => onAlign('align-center-h')} title="Center horizontally">  <AlignCenterHIcon /></button>
          <button className="btn icon-btn" onClick={() => onAlign('align-right')}   title="Align right edges">    <AlignRightIcon /></button>
          <Sep />
          <button className="btn icon-btn" onClick={() => onAlign('align-top')}     title="Align top edges">      <AlignTopIcon /></button>
          <button className="btn icon-btn" onClick={() => onAlign('align-center-v')} title="Center vertically">   <AlignMiddleVIcon /></button>
          <button className="btn icon-btn" onClick={() => onAlign('align-bottom')}  title="Align bottom edges">   <AlignBottomIcon /></button>
          <Sep />
          <button className="btn icon-btn" onClick={() => onAlign('dist-h')} title="Distribute horizontally"> <DistHIcon /></button>
          <button className="btn icon-btn" onClick={() => onAlign('dist-v')} title="Distribute vertically">   <DistVIcon /></button>
        </div>
      )}
    </div>
  )
}
