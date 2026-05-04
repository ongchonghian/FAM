import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type NodeChange,
  type EdgeChange,
  type HandleType,
  type FinalConnectionState,
  type ReactFlowInstance,
} from '@xyflow/react'
import MeshNode from './nodes/MeshNode'
import ActorNode from './nodes/ActorNode'
import ServiceNode from './nodes/ServiceNode'
import CompactNode from './nodes/CompactNode'
import BandNode from './nodes/BandNode'
import RoutedEdge from './edges/RoutedEdge'
import FloatingEdge from './edges/FloatingEdge'
import { DashedEdge, DottedEdge } from './edges/DashedEdge'
import AnimatedEdge from './edges/AnimatedEdge'
import StraightEdge from './edges/StraightEdge'
import CurvedEdge from './edges/CurvedEdge'
import DiagramToolbar, { computeEdgeType } from './DiagramToolbar'
import { useDiagramPersistence } from '../hooks/useDiagramPersistence'
import overviewLayoutFallback from '../data/overviewLayout.json'
import { useElkLayout } from '../hooks/useElkLayout'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { alignNodes, type AlignType } from '../utils/nodeAlignment'
import { routeEdge, getHandlePosition } from '../utils/edgeRouting'

const nodeTypes: NodeTypes = {
  mesh:    MeshNode    as never,
  actor:   ActorNode   as never,
  service: ServiceNode as never,
  compact: CompactNode as never,
  band:    BandNode    as never,
}

const edgeTypes: EdgeTypes = {
  routed:            RoutedEdge,
  floating:          FloatingEdge,
  'floating-curved': FloatingEdge,
  dashed:            DashedEdge,
  dotted:            DottedEdge,
  animated:          AnimatedEdge,
  'animated-dashed': AnimatedEdge,
  straight:          StraightEdge,
  curved:            CurvedEdge,
}

// ── Color palette ────────────────────────────────────────────────────────────
const C = {
  solidGrayBlue: '#6a7a9a',  // AS4 doc path (mandatory)
  dashedGreen:   '#39ff84',  // PSI·MPC·FL / C2/C3↔ASE (PET)
  dashedCyan:    '#38bdf8',  // parallel fwd / IR feed
  dashedGold:    '#fbbf24',  // ASE→broker fan-in / consumer queries
  dottedGray:    '#3d4a73',  // SMP lookups + broker→admin
  c1:    '#38bdf8',
  c2:    '#818cf8',
  c3:    '#a78bfa',
  c4:    '#f472b6',
  infra: '#8a96b8',
  green: '#39ff84',
  gold:  '#fbbf24',
  peppolBorder: '#2d3d6a',
  dexBorder:    '#1a4030',
} as const

// ── Edge style helpers ────────────────────────────────────────────────────────
const solid  = (c: string, w = 1.6) => ({ stroke: c, strokeWidth: w })
const dashed = (c: string, w = 1.6) => ({ stroke: c, strokeWidth: w, strokeDasharray: '5 4' })
const dotted = (c: string, w = 0.9) => ({ stroke: c, strokeWidth: w, strokeDasharray: '2 3' })
const lbl    = (c: string) => ({ labelStyle: { fill: c, fontSize: 10 }, labelBgStyle: { fill: '#0f1626' } })

function n(node: Node & { style: { width: number; height: number } }): Node {
  return { ...node, initialWidth: node.style.width, initialHeight: node.style.height }
}

const NODE_DEFAULTS: Record<string, { data: Record<string, unknown>; width: number; height: number; zIndex?: number }> = {
  mesh:    { data: { label: 'New Node',   sublabel: '', color: '#39ff84' }, width: 110, height: 60 },
  actor:   { data: { label: 'Actor',                   color: '#38bdf8' }, width: 52,  height: 52 },
  service: { data: { label: 'Service',    sublabel: '', color: '#38bdf8' }, width: 140, height: 58 },
  compact: { data: { label: 'Component',  sublabel: '', color: '#fbbf24' }, width: 160, height: 22 },
  band:    { data: { label: 'Group',                   color: '#3d4a73' }, width: 300, height: 200, zIndex: -1 },
}

const CONNECT_EDGE_CONFIGS: Record<string, { type: string; style: Record<string, unknown> }> = {
  smoothstep: { type: 'smoothstep', style: { stroke: '#8a96b8', strokeWidth: 1.6 } },
  straight:   { type: 'straight',   style: { stroke: '#8a96b8', strokeWidth: 1.6 } },
  curved:     { type: 'curved',     style: { stroke: '#8a96b8', strokeWidth: 1.6 } },
  dashed:     { type: 'dashed',     style: { stroke: '#8a96b8', strokeWidth: 1.6 } },
  dotted:     { type: 'dotted',     style: { stroke: '#8a96b8', strokeWidth: 1.6 } },
  animated:   { type: 'animated',   style: { stroke: '#22c55e', strokeWidth: 1.6 } },
  routed:     { type: 'routed',     style: { stroke: '#8a96b8', strokeWidth: 1.6 } },
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout: ~1140 × 840 coordinate space, two bands
//
//  PEPPOL ECOSYSTEM (y 40 → 255): Discovery row + Document path
//  dex ECOSYSTEM    (y 248 → 828): IR, ASEs, pitstops, broker, admin
//
//  IR sits on the right side (x 960) straddling both bands.
//  ASE nodes are optional AP-Plus deployments inside the dex band.
//  Consumer pitstops (y 510) sit above the FAM Query Broker (y 610).
//  ASEs fan-in to the broker; pitstops query the broker.
// ─────────────────────────────────────────────────────────────────────────────

const NODES: Node[] = [
  // ── Band backgrounds (zIndex –1 = rendered behind all data nodes) ──────────
  n({ id: 'band-peppol', type: 'band', position: { x: 20,  y: 40  }, style: { width: 870,  height: 210, zIndex: -1 }, data: { label: 'PEPPOL Ecosystem', color: C.peppolBorder } }),
  n({ id: 'band-dex',    type: 'band', position: { x: 20,  y: 251 }, style: { width: 1120, height: 574, zIndex: -1 }, data: { label: 'dex Ecosystem',    color: C.dexBorder    } }),

  // ── Discovery row (PEPPOL band, y 65) ─────────────────────────────────────
  n({ id: 'sml', type: 'compact', position: { x: 100, y: 65 }, style: { width: 120, height: 34 }, data: { label: 'SML',   sublabel: 'DNS root',            color: C.infra } }),
  n({ id: 'smp', type: 'compact', position: { x: 270, y: 65 }, style: { width: 120, height: 34 }, data: { label: 'SMP',   sublabel: 'per-AP metadata',     color: C.infra } }),
  n({ id: 'asr', type: 'compact', position: { x: 440, y: 65 }, style: { width: 120, height: 34 }, data: { label: 'ASR ✶', sublabel: 'analytical services', color: C.green } }),

  // ── Document path (PEPPOL band, y 150–220) ────────────────────────────────
  n({ id: 'c1', type: 'actor', position: { x: 100, y: 150 }, style: { width: 70,  height: 70 }, data: { label: 'C1', sublabel: 'Supplier',    color: C.c1 } }),
  n({ id: 'c2', type: 'mesh',  position: { x: 245, y: 158 }, style: { width: 125, height: 54 }, data: { label: 'C2', sublabel: 'Sender AP',   color: C.c2 } }),
  n({ id: 'c3', type: 'mesh',  position: { x: 510, y: 158 }, style: { width: 125, height: 54 }, data: { label: 'C3', sublabel: 'Receiver AP', color: C.c3 } }),
  n({ id: 'c4', type: 'actor', position: { x: 710, y: 150 }, style: { width: 70,  height: 70 }, data: { label: 'C4', sublabel: 'Buyer',       color: C.c4 } }),

  // ── IR — right side, straddles bands (x 960) ──────────────────────────────
  n({ id: 'ir', type: 'service', position: { x: 960, y: 155 }, style: { width: 130, height: 70 }, data: { label: 'IR', sublabel: 'Invoice Repository', meta: 'dex Data Provider', color: C.c1 } }),

  // ── dex band: ASEs + pitstop-ir ───────────────────────────────────────────
  n({ id: 'pitstop-ir', type: 'compact', position: { x: 960, y: 340 }, style: { width: 155, height: 36 }, data: { label: 'pitstop-ir', sublabel: 'pitstop-ui + core',    color: C.infra } }),
  n({ id: 'ase-c2',     type: 'mesh',    position: { x: 245, y: 370 }, style: { width: 130, height: 68 }, data: { label: 'ASE at C2', sublabel: 'VC · TEE · FL',         color: C.green } }),
  n({ id: 'ase-c3',     type: 'mesh',    position: { x: 510, y: 370 }, style: { width: 130, height: 68 }, data: { label: 'ASE at C3', sublabel: 'VC · TEE · FL',         color: C.green } }),
  n({ id: 'ase-ir',     type: 'mesh',    position: { x: 960, y: 374 }, style: { width: 130, height: 68 }, data: { label: 'ASE at IR',  sublabel: 'VC · TEE · FL',        color: C.green } }),

  // ── dex band: Consumer pitstop portals (y 510) ────────────────────────────
  n({ id: 'pitstop-banks',       type: 'compact', position: { x: 50,  y: 510 }, style: { width: 155, height: 36 }, data: { label: 'pitstop', sublabel: 'Banks · Lenders',    color: C.c1   } }),
  n({ id: 'pitstop-mas',         type: 'compact', position: { x: 245, y: 510 }, style: { width: 155, height: 36 }, data: { label: 'pitstop', sublabel: 'MAS · Auditors',     color: C.gold } }),
  n({ id: 'pitstop-enterprises', type: 'compact', position: { x: 440, y: 510 }, style: { width: 155, height: 36 }, data: { label: 'pitstop', sublabel: 'Enterprises · Self', color: C.c4   } }),
  n({ id: 'pitstop-owner',       type: 'compact', position: { x: 635, y: 510 }, style: { width: 155, height: 36 }, data: { label: 'pitstop', sublabel: 'Data Owner',         color: C.c3   } }),

  // ── dex band: FAM Query Broker + Admin (y 610, 740) ───────────────────────
  n({ id: 'broker', type: 'service', position: { x: 310, y: 610 }, style: { width: 230, height: 80 }, data: { label: 'FAM QUERY BROKER', sublabel: '+ Transparency Log', meta: 'ABAC + GNAP · Merkle · DLT', color: C.gold  } }),
  n({ id: 'admin',  type: 'compact', position: { x: 310, y: 740 }, style: { width: 230, height: 54 }, data: { label: 'dex admin portal', sublabel: 'admin-ui + admin-corev2',                                color: C.infra } }),
]

const EDGES: Edge[] = [
  // ── AS4 document path (solid gray-blue) ───────────────────────────────────
  { id: 'doc-c1-c2', source: 'c1', target: 'c2', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', label: 'AS4',           ...lbl(C.solidGrayBlue), style: solid(C.solidGrayBlue) },
  { id: 'doc-c2-c3', source: 'c2', target: 'c3', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', label: 'AS4 · PINT-SG', ...lbl(C.solidGrayBlue), style: solid(C.solidGrayBlue) },
  { id: 'doc-c3-c4', source: 'c3', target: 'c4', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', label: 'AS4',           ...lbl(C.solidGrayBlue), style: solid(C.solidGrayBlue) },

  // ── C2 → IR parallel forward (bridges over C3/C4 at y=130, between discovery and document rows)
  { id: 'c2-ir', source: 'c2', target: 'ir', sourceHandle: 'right', targetHandle: 'left', type: 'routed', data: { waypoints: [[370, 130], [960, 130]] }, animated: true, label: 'parallel fwd', ...lbl(C.dashedCyan), style: dashed(C.dashedCyan, 1.8) },

  // ── IR → pitstop-ir ───────────────────────────────────────────────────────
  { id: 'ir-pitstop-ir', source: 'ir', target: 'pitstop-ir', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: dashed(C.dashedCyan, 1.2) },

  // ── C2/C3 → ASEs (optional AP-Plus deployment) ───────────────────────────
  { id: 'c2-ase-c2', source: 'c2', target: 'ase-c2', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', animated: true, style: dashed(C.dashedGreen) },
  { id: 'c3-ase-c3', source: 'c3', target: 'ase-c3', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', animated: true, style: dashed(C.dashedGreen) },

  // ── ASE mesh links (PET: PSI · MPC · FL) ─────────────────────────────────
  { id: 'ase-mesh',      source: 'ase-c2', target: 'ase-c3', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', animated: true, label: 'PSI · MPC · FL', ...lbl(C.dashedGreen), style: dashed(C.dashedGreen, 2.0) },
  { id: 'ase-c3-ase-ir', source: 'ase-c3', target: 'ase-ir', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', animated: true, style: dashed(C.dashedGreen, 2.0) },

  // ── ASEs → Broker (fan-in; routes avoid pitstop row) ─────────────────────
  { id: 'ase-c2-broker', source: 'ase-c2', target: 'broker', sourceHandle: 'bottom', targetHandle: 'left',  type: 'routed', data: { waypoints: [[225, 480], [225, 555]] },       animated: true, style: dashed(C.dashedGold) },
  { id: 'ase-c3-broker', source: 'ase-c3', target: 'broker', sourceHandle: 'right',  targetHandle: 'top',   type: 'routed', data: { waypoints: [[810, 500], [810, 600]] },       animated: true, style: dashed(C.dashedGold) },
  { id: 'ase-ir-broker', source: 'ase-ir', target: 'broker', sourceHandle: 'bottom', targetHandle: 'top',   type: 'routed', data: { waypoints: [[1025, 600], [425, 600]] },      animated: true, style: dashed(C.dashedGold) },

  // ── Consumer pitstops → Broker ────────────────────────────────────────────
  { id: 'pitstop-banks-broker',       source: 'pitstop-banks',       target: 'broker', sourceHandle: 'bottom', targetHandle: 'left', type: 'smoothstep', animated: true, style: dashed(C.dashedGold, 0.9) },
  { id: 'pitstop-mas-broker',         source: 'pitstop-mas',         target: 'broker', sourceHandle: 'bottom', targetHandle: 'top',  type: 'smoothstep', animated: true, style: dashed(C.dashedGold, 0.9) },
  { id: 'pitstop-enterprises-broker', source: 'pitstop-enterprises', target: 'broker', sourceHandle: 'bottom', targetHandle: 'top',  type: 'smoothstep', animated: true, style: dashed(C.dashedGold, 0.9) },
  { id: 'pitstop-owner-broker',       source: 'pitstop-owner',       target: 'broker', sourceHandle: 'bottom', targetHandle: 'top',  type: 'smoothstep', animated: true, style: dashed(C.dashedGold, 0.9) },

  // ── Discovery lookups (dotted gray) ──────────────────────────────────────
  { id: 'smp-c2', source: 'smp', target: 'c2', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: dotted(C.dottedGray) },
  { id: 'smp-c3', source: 'smp', target: 'c3', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: dotted(C.dottedGray) },

  // ── ASR → Broker (routes through 40px gap between pitstop-mas and pitstop-enterprises at x=425) ──
  { id: 'asr-broker', source: 'asr', target: 'broker', sourceHandle: 'bottom', targetHandle: 'top', type: 'routed', data: { waypoints: [[425, 500]] }, style: dotted(C.dashedGreen, 0.8) },

  // ── Broker → Admin ────────────────────────────────────────────────────────
  { id: 'admin-broker', source: 'broker', target: 'admin', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', label: 'manifest fetch', labelStyle: { fill: '#5a6584', fontSize: 10, fontStyle: 'italic' }, labelBgStyle: { fill: '#0f1626' }, style: dotted(C.dottedGray) },
]

interface FamOverviewDiagramProps {
  activeNodeIds?: Set<string>
  activeFlowIds?: Set<string>
  animatedFlowIds?: Set<string>
  nodeOverrides?: Record<string, Partial<Record<string, unknown>>>
  readOnly?: boolean
  authorMode?: boolean
  onAuthorSelectionChange?: (nodeIds: string[], edgeIds: string[]) => void
}

export default function FamOverviewDiagram({
  activeNodeIds,
  activeFlowIds,
  animatedFlowIds,
  nodeOverrides,
  readOnly,
  authorMode,
  onAuthorSelectionChange,
}: FamOverviewDiagramProps) {
  const { isLocked, toggleLock, savedPositions, savedEdges, savedUserNodes, save, reset, showSaved, resetCount } =
    useDiagramPersistence('fam-overview-diagram-positions', {
      fallback: overviewLayoutFallback as never,
      fileApiPath: '/api/overview-layout',
    })

  const { runLayout, isLayouting } = useElkLayout()
  const [defaultRouting, setDefaultRouting] = useState('smoothstep')
  const [defaultLineStyle, setDefaultLineStyle] = useState('solid')
  const { capture, undo, redo, canUndo, canRedo } = useUndoRedo()
  const rfInstance = useRef<ReactFlowInstance | null>(null)
  const addNodeOffset = useRef(0)

  const [nodes, setNodes, onNodesChange] = useNodesState(() => {
    const baseNodes = NODES.map(node => {
      const saved = savedPositions[node.id]
      const w = saved?.width
      const h = saved?.height
      return {
        ...node,
        data: { ...node.data, isActive: true, isDim: false },
        draggable: false,
        selectable: false,
        connectable: false,
        position: saved ?? node.position,
        ...(w !== undefined ? { initialWidth:  w } : {}),
        ...(h !== undefined ? { initialHeight: h } : {}),
        style: {
          ...node.style,
          ...(w !== undefined ? { width:  w } : {}),
          ...(h !== undefined ? { height: h } : {}),
        },
      }
    })
    const userNodes = savedUserNodes.map(node => {
      const saved = savedPositions[node.id]
      const w = saved?.width ?? (node.style as { width?: number } | undefined)?.width
      const h = saved?.height ?? (node.style as { height?: number } | undefined)?.height
      return {
        ...node,
        data: { ...node.data, isActive: true, isDim: false },
        draggable: false,
        selectable: false,
        connectable: false,
        position: saved ? { x: saved.x, y: saved.y } : node.position,
        ...(w !== undefined ? { initialWidth:  w } : {}),
        ...(h !== undefined ? { initialHeight: h } : {}),
        style: { ...node.style, ...(w !== undefined ? { width: w } : {}), ...(h !== undefined ? { height: h } : {}) },
      }
    })
    return [...baseNodes, ...userNodes]
  })
  const [edges, setEdges, onEdgesChange] = useEdgesState(() => savedEdges ?? EDGES)

  // Capture initial state once on mount
  const initialCaptured = useRef(false)
  useEffect(() => {
    if (initialCaptured.current) return
    initialCaptured.current = true
    capture(nodes, edges)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync draggable/connectable with lock state (selectable is derived in updatedNodes to avoid StoreUpdater conflicts)
  useEffect(() => {
    setNodes(nds => nds.map(n => ({ ...n, draggable: !isLocked, selectable: !isLocked, connectable: !isLocked })))
  }, [isLocked, setNodes])

  // Restore defaults on reset
  useEffect(() => {
    if (resetCount === 0) return
    const fresh = NODES.map(node => ({
      ...node,
      data: { ...node.data, isActive: true, isDim: false },
      draggable: !isLocked,
      selectable: !isLocked || !!authorMode,
      connectable: false,
      position: node.position,
    }))
    setNodes(fresh)
    setEdges(EDGES)
    capture(fresh, EDGES)
  }, [resetCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Push InAction active/dim state directly into React Flow's node store.
  // useMemo alone doesn't reliably propagate data changes through the internal Zustand store.
  useEffect(() => {
    if (activeNodeIds === undefined) return
    const hasActive = !!activeNodeIds.size
    setNodes(nds => nds.map(n => ({
      ...n,
      data: {
        ...n.data,
        ...(nodeOverrides?.[n.id] ?? {}),
        isActive: hasActive ? activeNodeIds.has(n.id) : true,
        isDim:    hasActive ? !activeNodeIds.has(n.id) : false,
      },
    })))
  }, [activeNodeIds, nodeOverrides]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeFlowIds === undefined) return
    setEdges(eds => eds.map(e => {
      const isActive = activeFlowIds.size > 0 ? activeFlowIds.has(e.id) : true
      const isAnimated = animatedFlowIds !== undefined
        ? (animatedFlowIds.size > 0 ? animatedFlowIds.has(e.id) : isActive)
        : isActive
      const baseClass = (e.className ?? '').replace('flow-static', '').trim()
      return {
        ...e,
        animated: isAnimated,
        className: isActive ? baseClass : `${baseClass} flow-static`.trim(),
      }
    }))
  }, [activeFlowIds, animatedFlowIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const onInit = useCallback((instance: ReactFlowInstance) => {
    rfInstance.current = instance
    instance.fitView({ padding: 0.08 })
  }, [])

  // ── Undo / Redo ────────────────────────────────────────────────────────────

  const applySnapshot = useCallback((snapshot: { nodes: Node[]; edges: Edge[] } | null) => {
    if (!snapshot) return
    setNodes(snapshot.nodes.map(n => ({ ...n, draggable: !isLocked, selectable: !isLocked })))
    setEdges(snapshot.edges)
  }, [setNodes, setEdges, isLocked])

  useEffect(() => {
    if (isLocked) return
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); applySnapshot(undo()) }
      if (e.key === 'z' &&  e.shiftKey) { e.preventDefault(); applySnapshot(redo()) }
      if (e.key === 'y')                { e.preventDefault(); applySnapshot(redo()) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isLocked, undo, redo, applySnapshot])

  // ── Edge / Node change wrappers (capture on delete) ───────────────────────

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    const removes = changes.filter(c => c.type === 'remove')
    if (removes.length > 0) {
      const removed = new Set(removes.map(c => c.id))
      capture(nodes.filter(n => !removed.has(n.id)), edges)
    }
    onNodesChange(changes)
  }, [nodes, edges, capture, onNodesChange])

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    const removes = changes.filter(c => c.type === 'remove')
    if (removes.length > 0) {
      const removed = new Set(removes.map(c => c.id))
      capture(nodes, edges.filter(e => !removed.has(e.id)))
    }
    onEdgesChange(changes)
  }, [nodes, edges, capture, onEdgesChange])

  // ── Connect / Reconnect ───────────────────────────────────────────────────

  const handleConnect = useCallback((conn: Connection) => {
    const edgeType = computeEdgeType(defaultRouting, defaultLineStyle)
    const cfg = CONNECT_EDGE_CONFIGS[edgeType] ?? CONNECT_EDGE_CONFIGS.smoothstep
    let edgeData: Record<string, unknown> = {}

    if (cfg.type === 'routed' && conn.source && conn.target) {
      const srcNode = nodes.find(n => n.id === conn.source)
      const tgtNode = nodes.find(n => n.id === conn.target)
      if (srcNode && tgtNode) {
        const srcPos = getHandlePosition(srcNode, conn.sourceHandle as string | undefined)
        const tgtPos = getHandlePosition(tgtNode, conn.targetHandle as string | undefined)
        const waypoints = routeEdge(srcPos, tgtPos, nodes, new Set([conn.source, conn.target]))
        if (waypoints.length > 0) edgeData = { waypoints }
      }
    }

    const newEdges = addEdge({
      ...conn,
      id: `user-${Date.now()}`,
      type: cfg.type,
      style: cfg.style,
      data: edgeData,
    }, edges)
    setEdges(newEdges)
    capture(nodes, newEdges)
  }, [edges, nodes, setEdges, capture, defaultRouting, defaultLineStyle])

  const addNode = useCallback((type: string) => {
    const defs = NODE_DEFAULTS[type]
    if (!defs) return
    const offset = (addNodeOffset.current % 8) * 24
    addNodeOffset.current++
    const canvasEl = document.querySelector('.react-flow') as HTMLElement | null
    const center = canvasEl && rfInstance.current
      ? rfInstance.current.screenToFlowPosition({
          x: canvasEl.getBoundingClientRect().left + canvasEl.getBoundingClientRect().width / 2 + offset,
          y: canvasEl.getBoundingClientRect().top  + canvasEl.getBoundingClientRect().height / 2 + offset,
        })
      : { x: 400 + offset, y: 300 + offset }

    const newNode: Node = {
      id: `user-node-${Date.now()}`,
      type,
      position: { x: center.x - defs.width / 2, y: center.y - defs.height / 2 },
      data: { ...defs.data, isActive: false, isDim: false },
      style: { width: defs.width, height: defs.height },
      draggable: !isLocked,
      selectable: !isLocked,
      ...(defs.zIndex !== undefined ? { zIndex: defs.zIndex } : {}),
    }
    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    capture(newNodes, edges)
  }, [nodes, edges, isLocked, capture, setNodes])

  const handleDeleteSelected = useCallback(() => {
    const removedNodeIds = new Set(nodes.filter(n => n.selected).map(n => n.id))
    const removedEdgeIds = new Set(edges.filter(e => e.selected).map(e => e.id))
    const newNodes = nodes.filter(n => !removedNodeIds.has(n.id))
    const newEdges = edges.filter(e => !removedEdgeIds.has(e.id) && !removedNodeIds.has(e.source) && !removedNodeIds.has(e.target))
    setNodes(newNodes)
    setEdges(newEdges)
    capture(newNodes, newEdges)
  }, [nodes, edges, setNodes, setEdges, capture])

  const edgeBeingReconnected = useRef<Edge | null>(null)

  const handleReconnectStart = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
    edgeBeingReconnected.current = edge
  }, [])

  const handleReconnect = useCallback((oldEdge: Edge, conn: Connection) => {
    const saved = edgeBeingReconnected.current ?? oldEdge
    // ReactFlow removes the edge via onEdgesChange before calling onReconnect,
    // so restore it in the array first so reconnectEdge can find and update it.
    const edgesWithSaved = edges.some(e => e.id === saved.id) ? edges : [...edges, saved]
    // Clear absolute waypoints; we'll recompute obstacle-aware ones below.
    const template = { ...saved, data: { ...(saved.data as object ?? {}), waypoints: undefined } }
    const newEdges = reconnectEdge(template, conn, edgesWithSaved, { shouldReplaceId: false })

    // Route the reconnected edge around obstacles
    const srcNode = nodes.find(n => n.id === conn.source)
    const tgtNode = nodes.find(n => n.id === conn.target)
    if (srcNode && tgtNode && conn.source && conn.target) {
      const srcPos = getHandlePosition(srcNode, conn.sourceHandle)
      const tgtPos = getHandlePosition(tgtNode, conn.targetHandle)
      const waypoints = routeEdge(srcPos, tgtPos, nodes, new Set([conn.source, conn.target]))
      if (waypoints.length > 0) {
        const idx = newEdges.findIndex(e => e.id === template.id)
        if (idx >= 0) {
          newEdges[idx] = { ...newEdges[idx], type: 'routed', data: { ...(newEdges[idx].data as object ?? {}), waypoints } }
        }
      }
    }

    setEdges(newEdges)
    capture(nodes, newEdges)
  }, [edges, nodes, setEdges, capture])

  const handleReconnectEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge, _handleType: HandleType, connectionState: FinalConnectionState) => {
    if (connectionState.isValid === false) {
      setEdges(eds => eds.some(e => e.id === edge.id) ? eds : [...eds, edgeBeingReconnected.current ?? edge])
    }
    edgeBeingReconnected.current = null
  }, [setEdges])

  // ── Drag stop ─────────────────────────────────────────────────────────────

  const onNodeDragStop = useCallback((_: MouseEvent, node: Node) => {
    const updated = nodes.map(n => n.id === node.id ? { ...n, position: node.position } : n)
    // Re-route non-static edges touching the moved node around obstacles
    const reroutedEdges = edges.map(e => {
      if (e.source !== node.id && e.target !== node.id) return e
      const srcNode = updated.find(n => n.id === e.source)
      const tgtNode = updated.find(n => n.id === e.target)
      if (!srcNode || !tgtNode) return e
      const srcPos = getHandlePosition(srcNode, e.sourceHandle as string | undefined)
      const tgtPos = getHandlePosition(tgtNode, e.targetHandle as string | undefined)
      const waypoints = routeEdge(srcPos, tgtPos, updated, new Set([e.source, e.target]))
      return waypoints.length > 0
        ? { ...e, type: 'routed' as const, data: { ...(e.data as object ?? {}), waypoints } }
        : { ...e, type: 'smoothstep' as const, data: { ...(e.data as object ?? {}), waypoints: undefined } }
    })
    setEdges(reroutedEdges)
    capture(updated, reroutedEdges)
  }, [nodes, edges, capture, setEdges])

  // ── Auto-align ────────────────────────────────────────────────────────────

  const handleAutoAlign = useCallback(async () => {
    const selectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id))
    const result = await runLayout(nodes, edges, selectedIds.size >= 2 ? selectedIds : undefined)
    const newNodes = result.nodes.map(n => ({ ...n, draggable: !isLocked, selectable: !isLocked }))
    setNodes(newNodes)
    setEdges(result.edges)
    capture(newNodes, result.edges)
  }, [nodes, edges, runLayout, setNodes, setEdges, isLocked, capture])

  // ── Re-route all edges ────────────────────────────────────────────────────

  const handleRerouteEdges = useCallback(() => {
    const reroutedEdges = edges.map(e => {
      const srcNode = nodes.find(n => n.id === e.source)
      const tgtNode = nodes.find(n => n.id === e.target)
      if (!srcNode || !tgtNode) return e
      const srcPos = getHandlePosition(srcNode, e.sourceHandle as string | undefined)
      const tgtPos = getHandlePosition(tgtNode, e.targetHandle as string | undefined)
      const waypoints = routeEdge(srcPos, tgtPos, nodes, new Set([e.source, e.target]))
      return waypoints.length > 0
        ? { ...e, type: 'routed' as const, data: { ...(e.data as object ?? {}), waypoints } }
        : { ...e, type: 'smoothstep' as const, data: { ...(e.data as object ?? {}), waypoints: undefined } }
    })
    setEdges(reroutedEdges)
    capture(nodes, reroutedEdges)
  }, [nodes, edges, setEdges, capture])

  // ── Manual alignment ──────────────────────────────────────────────────────

  const handleAlign = useCallback((type: AlignType) => {
    const selected = nodes.filter(n => n.selected && n.type !== 'band')
    if (selected.length < 2) return
    const newPositions = alignNodes(selected, type)
    const newNodes = nodes.map(n => {
      const pos = newPositions[n.id]
      return pos ? { ...n, position: pos } : n
    })
    setNodes(newNodes.map(n => ({ ...n, draggable: !isLocked, selectable: !isLocked })))
    capture(newNodes, edges)
  }, [nodes, edges, setNodes, isLocked, capture])

  const handleSetActive = useCallback(() => {
    const selNodes = nodes.filter(n => n.selected)
    const selEdges = edges.filter(e => e.selected)
    const allNodesActive = selNodes.every(n => {
      const d = n.data as { isActive?: boolean; isDim?: boolean }
      return (d.isActive ?? true) && !(d.isDim ?? false)
    })
    const allEdgesActive = selEdges.every(e =>
      e.animated && !(e.className ?? '').includes('flow-static')
    )
    const allActive = (selNodes.length > 0 || selEdges.length > 0) && allNodesActive && allEdgesActive
    const newNodes = nodes.map(n => {
      if (!n.selected) return n
      return allActive
        ? { ...n, data: { ...n.data, isActive: false, isDim: false } }
        : { ...n, data: { ...n.data, isActive: true, isDim: false } }
    })
    const newEdges = edges.map(e => {
      if (!e.selected) return e
      const base = (e.className ?? '').replace('flow-static', '').trim()
      return allActive
        ? { ...e, animated: false, className: `${base} flow-static`.trim() }
        : { ...e, animated: true, className: base }
    })
    setNodes(newNodes); setEdges(newEdges); capture(newNodes, newEdges)
  }, [nodes, edges, setNodes, setEdges, capture])

  const handleSetDim = useCallback(() => {
    const selNodes = nodes.filter(n => n.selected)
    const selEdges = edges.filter(e => e.selected)
    const allNodesDim = selNodes.every(n => {
      const d = n.data as { isDim?: boolean }
      return d.isDim ?? false
    })
    const allEdgesDim = selEdges.every(e =>
      !e.animated && (e.className ?? '').includes('flow-static')
    )
    const allDim = (selNodes.length > 0 || selEdges.length > 0) && allNodesDim && allEdgesDim
    const newNodes = nodes.map(n => {
      if (!n.selected) return n
      return allDim
        ? { ...n, data: { ...n.data, isActive: true, isDim: false } }
        : { ...n, data: { ...n.data, isActive: false, isDim: true } }
    })
    const newEdges = edges.map(e => {
      if (!e.selected) return e
      const base = (e.className ?? '').replace('flow-static', '').trim()
      return allDim
        ? { ...e, animated: true, className: base }
        : { ...e, animated: false, className: `${base} flow-static`.trim() }
    })
    setNodes(newNodes); setEdges(newEdges); capture(newNodes, newEdges)
  }, [nodes, edges, setNodes, setEdges, capture])

  const handleSetStatic = useCallback(() => {
    const selectedEdges = edges.filter(e => e.selected)
    const allStatic = selectedEdges.length > 0 && selectedEdges.every(e => !e.animated)
    const newEdges = edges.map(e => {
      if (!e.selected) return e
      const base = (e.className ?? '').replace('flow-static', '').trim()
      return allStatic
        ? { ...e, animated: true, className: base }
        : { ...e, animated: false, className: `${base} flow-static`.trim() }
    })
    setEdges(newEdges); capture(nodes, newEdges)
  }, [edges, nodes, setEdges, capture])

  const handleSetAnimate = useCallback(() => {
    const selectedEdges = edges.filter(e => e.selected)
    const allAnimated = selectedEdges.length > 0 && selectedEdges.every(e => e.animated)
    const newEdges = edges.map(e => {
      if (!e.selected) return e
      const base = (e.className ?? '').replace('flow-static', '').trim()
      return allAnimated
        ? { ...e, animated: false, className: `${base} flow-static`.trim() }
        : { ...e, animated: true, className: base }
    })
    setEdges(newEdges); capture(nodes, newEdges)
  }, [edges, nodes, setEdges, capture])

  const handleSetColor = useCallback((color: string) => {
    const newNodes = nodes.map(n => {
      if (!n.selected) return n
      return { ...n, data: { ...n.data, color } }
    })
    const newEdges = edges.map(e => {
      if (!e.selected) return e
      return { ...e, style: { ...(e.style ?? {}), stroke: color } }
    })
    setNodes(newNodes)
    setEdges(newEdges)
    capture(newNodes, newEdges)
  }, [nodes, edges, setNodes, setEdges, capture])

  const handleSelectionChange = useCallback(({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
    onAuthorSelectionChange?.(selNodes.map(n => n.id), selEdges.map(e => e.id))
  }, [onAuthorSelectionChange])

  const hasSavedData = Object.keys(savedPositions).length > 0 || savedEdges !== null
  const selectedCount = nodes.filter(n => n.selected && n.type !== 'band').length
  const edgeSelectedCount = edges.filter(e => e.selected).length
  const deletableCount = nodes.filter(n => n.selected).length + edgeSelectedCount

  const firstSelectedNode = nodes.find(n => n.selected)
  const firstSelectedEdge = edges.find(e => e.selected)
  const selectedColor = firstSelectedNode
    ? ((firstSelectedNode.data as { color?: string }).color ?? '#8a96b8')
    : firstSelectedEdge
      ? ((firstSelectedEdge.style?.stroke as string | undefined) ?? '#8a96b8')
      : '#8a96b8'

  const updatedNodes = useMemo<Node[]>(() => {
    const hasActive = !!activeNodeIds?.size
    return nodes.map(n => {
      const d = n.data as { isActive?: boolean; isDim?: boolean }
      // In view mode only, let prop-driven active state take priority over internal state
      const usePropState = isLocked && hasActive
      return {
        ...n,
        // authorMode overrides the locked selectable without touching internal node state
        selectable: n.selectable || !!authorMode,
        data: {
          ...n.data,
          ...(nodeOverrides?.[n.id] ?? {}),
          isActive: usePropState ? activeNodeIds!.has(n.id) : (d.isActive ?? true),
          isDim:    usePropState ? !activeNodeIds!.has(n.id) : (d.isDim   ?? false),
        },
      }
    })
  }, [nodes, activeNodeIds, nodeOverrides, isLocked, authorMode])

  const updatedEdges = useMemo<Edge[]>(() => {
    // In edit mode, use internal edge state so toolbar animation toggles work.
    // Use undefined (not empty Set) to mean "no InAction context" — an explicitly
    // passed empty Set means "this step has no active flows" and should dim all edges.
    if (activeFlowIds === undefined || !isLocked) return edges
    return edges.map(e => {
      const isActive = activeFlowIds.has(e.id)
      const isAnimated = animatedFlowIds !== undefined ? animatedFlowIds.has(e.id) : isActive
      const baseClass = (e.className ?? '').trim()
      return {
        ...e,
        animated: isAnimated,
        className: isActive ? baseClass : `${baseClass} flow-static`.trim(),
      }
    })
  }, [edges, activeFlowIds, animatedFlowIds, isLocked])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--bg-deep)', overflow: 'hidden' }} className={[!isLocked ? 'diagram-edit-mode' : '', authorMode ? 'diagram-author-mode' : ''].filter(Boolean).join(' ')}>
      {!authorMode && !readOnly && import.meta.env.VITE_AUTHOR_MODE_ENABLED === 'true' && (
        <DiagramToolbar
          isLocked={isLocked}
          onToggleLock={toggleLock}
          onSave={() => save(nodes, edges)}
          onReset={reset}
          onAutoAlign={handleAutoAlign}
          onRerouteEdges={handleRerouteEdges}
          onUndo={() => applySnapshot(undo())}
          onRedo={() => applySnapshot(redo())}
          onAlign={handleAlign}
          onAddNode={addNode}
          onDeleteSelected={handleDeleteSelected}
          onSetActive={handleSetActive}
          onSetDim={handleSetDim}
          onSetStatic={handleSetStatic}
          onSetAnimate={handleSetAnimate}
          onSetColor={handleSetColor}
          selectedColor={selectedColor}
          canUndo={canUndo}
          canRedo={canRedo}
          selectedCount={selectedCount}
          edgeSelectedCount={edgeSelectedCount}
          deletableCount={deletableCount}
          showSaved={showSaved}
          hasSavedData={hasSavedData}
          isLayouting={isLayouting}
          defaultRouting={defaultRouting}
          onRoutingChange={setDefaultRouting}
          defaultLineStyle={defaultLineStyle}
          onLineStyleChange={setDefaultLineStyle}
        />
      )}
      <ReactFlow
        nodes={updatedNodes}
        edges={updatedEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onReconnect={handleReconnect}
        onReconnectStart={handleReconnectStart}
        onReconnectEnd={handleReconnectEnd}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        zoomOnScroll={!isLocked}
        zoomOnPinch={!isLocked}
        connectionMode={ConnectionMode.Loose}
        zoomOnDoubleClick={false}
        panOnDrag={!isLocked}
        preventScrolling={!isLocked}
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        edgesReconnectable={!isLocked}
        elementsSelectable={!isLocked || !!authorMode}
        onSelectionChange={authorMode ? handleSelectionChange : undefined}
        deleteKeyCode={isLocked ? null : 'Delete'}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e2a45" />
      </ReactFlow>
    </div>
  )
}
