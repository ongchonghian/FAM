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
import { BASE_NODES, BASE_EDGES } from '../data/famDiagram'
import DiagramToolbar, { computeEdgeType } from './DiagramToolbar'
import { useFamData, type DiagramData } from '../hooks/useFamData'
import { useVersionStore } from '../hooks/useVersionStore'
import VersionDropdown from './VersionDropdown'
import { useElkLayout, type LayoutType } from '../hooks/useElkLayout'
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

const NODE_DEFAULTS: Record<string, { data: Record<string, unknown>; width: number; height: number; zIndex?: number }> = {
  mesh:    { data: { label: 'New Node',   sublabel: '', color: '#39ff84' }, width: 110, height: 60 },
  actor:   { data: { label: 'Actor',                   color: '#38bdf8' }, width: 52,  height: 52 },
  service: { data: { label: 'Service',    sublabel: '', color: '#38bdf8' }, width: 140, height: 58 },
  compact: { data: { label: 'Component',  sublabel: '', color: '#fbbf24' }, width: 160, height: 22 },
  band:    { data: { label: 'Group',                   color: '#3d4a73' }, width: 300, height: 200, zIndex: -1 },
}

const CONNECT_EDGE_CONFIGS: Record<string, { type: string; style: Record<string, unknown>; data?: Record<string, unknown> }> = {
  smoothstep: { type: 'smoothstep', style: { stroke: '#8a96b8', strokeWidth: 1.6 } },
  straight:   { type: 'straight',   style: { stroke: '#8a96b8', strokeWidth: 1.6 } },
  curved:     { type: 'curved',     style: { stroke: '#8a96b8', strokeWidth: 1.6 } },
  dashed:     { type: 'dashed',     style: { stroke: '#8a96b8', strokeWidth: 1.6 } },
  dotted:     { type: 'dotted',     style: { stroke: '#8a96b8', strokeWidth: 1.6 } },
  animated:   { type: 'animated',   style: { stroke: '#22c55e', strokeWidth: 1.6 } },
  routed:     { type: 'routed',     style: { stroke: '#8a96b8', strokeWidth: 1.6 } },
}

const edgeTypes: EdgeTypes = {
  routed:          RoutedEdge,
  floating:        FloatingEdge,
  'floating-curved': FloatingEdge,
  dashed:          DashedEdge,
  dotted:          DottedEdge,
  animated:        AnimatedEdge,
  'animated-dashed': AnimatedEdge,
  straight:        StraightEdge,
  curved:          CurvedEdge,
}

interface FamDiagramProps {
  activeNodeIds?: Set<string>
  activeFlowIds?: Set<string>
  nodeOverrides?: Record<string, Partial<Record<string, unknown>>>
  editorMode?: boolean
}

export default function FamDiagram({
  activeNodeIds = new Set(),
  activeFlowIds = new Set(),
  nodeOverrides,
  editorMode = false,
}: FamDiagramProps) {
  const { loadDiagram, persistDiagram, isDev } = useFamData()
  const { versions, saveVersion, renameVersion, deleteVersion, refreshVersions } = useVersionStore()

  const [isLocked, setIsLocked] = useState(true)
  const [showSaved, setShowSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const loadedData = useRef<DiagramData | null>(null)

  const { runLayout, isLayouting } = useElkLayout()
  const [layoutType, setLayoutType] = useState<LayoutType>('layered-lr')
  const [defaultRouting, setDefaultRouting] = useState('smoothstep')
  const [defaultLineStyle, setDefaultLineStyle] = useState('solid')
  const { capture, undo, redo, canUndo, canRedo } = useUndoRedo()
  const rfInstance = useRef<ReactFlowInstance | null>(null)
  const addNodeOffset = useRef(0)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Prepare nodes from raw data (mark draggable based on lock state)
  const hydrateNodes = useCallback((raw: Node[], locked: boolean): Node[] =>
    raw.map(n => ({ ...n, draggable: !locked, selectable: !locked, connectable: false }))
  , [])

  // Load data from server (or fallback JSON) on mount
  useEffect(() => {
    loadDiagram().then(data => {
      loadedData.current = data
      const ns = hydrateNodes(data.nodes, isLocked)
      const es = data.edges
      setNodes(ns)
      setEdges(es)
      capture(ns, es)
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync draggable/selectable with lock state changes
  useEffect(() => {
    setNodes(nds => nds.map(n => ({ ...n, draggable: !isLocked, selectable: !isLocked })))
  }, [isLocked, setNodes])

  const handleReset = useCallback(() => {
    if (!loadedData.current) return
    const ns = hydrateNodes(loadedData.current.nodes, isLocked)
    const es = loadedData.current.edges
    setNodes(ns)
    setEdges(es)
    capture(ns, es)
  }, [hydrateNodes, isLocked, setNodes, setEdges, capture])

  // Re-apply active state when props change; in edit mode use internal state
  const updatedNodes = useMemo<Node[]>(() => {
    if (!isLocked) {
      return nodes.map(n => ({
        ...n,
        data: { ...n.data, ...(nodeOverrides?.[n.id] ?? {}) },
      }))
    }
    return nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        ...(nodeOverrides?.[n.id] ?? {}),
        isActive: activeNodeIds.has(n.id),
        isDim: activeNodeIds.size > 0 && !activeNodeIds.has(n.id) && !(n.data as { initialDim?: boolean }).initialDim,
      },
    }))
  }, [nodes, activeNodeIds, nodeOverrides, isLocked])

  const updatedEdges = useMemo<Edge[]>(() => {
    // In edit mode, use internal edge state so toolbar animation toggles work
    if (!isLocked) return edges
    return edges.map(e => {
      const isStatic = !!(e.data as { static?: boolean } | undefined)?.static
      if (isStatic) return e
      const isActive = editorMode || activeFlowIds.has(e.id)
      const baseClass = (e.className ?? '')
        .replace('flow-hidden', '')
        .replace('animated', '')
        .trim()
      return {
        ...e,
        animated: isActive && !editorMode,
        className: isActive ? baseClass : `${baseClass} flow-hidden`.trim(),
      }
    })
  }, [edges, activeFlowIds, editorMode, isLocked])

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
    let edgeData: Record<string, unknown> = { static: true }

    if (cfg.type === 'routed' && conn.source && conn.target) {
      const srcNode = nodes.find(n => n.id === conn.source)
      const tgtNode = nodes.find(n => n.id === conn.target)
      if (srcNode && tgtNode) {
        const srcPos = getHandlePosition(srcNode, conn.sourceHandle as string | undefined)
        const tgtPos = getHandlePosition(tgtNode, conn.targetHandle as string | undefined)
        const waypoints = routeEdge(srcPos, tgtPos, nodes, new Set([conn.source, conn.target]))
        if (waypoints.length > 0) edgeData = { ...edgeData, waypoints }
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
      data: { ...defs.data },
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
      if ((e.data as { static?: boolean } | undefined)?.static) return e
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
    const result = await runLayout(nodes, edges, selectedIds.size >= 2 ? selectedIds : undefined, layoutType)
    const newNodes = result.nodes.map(n => ({ ...n, draggable: !isLocked, selectable: !isLocked }))
    setNodes(newNodes)
    setEdges(result.edges)
    capture(newNodes, result.edges)
  }, [nodes, edges, runLayout, setNodes, setEdges, isLocked, capture, layoutType])

  // ── Re-route all edges ────────────────────────────────────────────────────

  const handleRerouteEdges = useCallback(() => {
    const reroutedEdges = edges.map(e => {
      if ((e.data as { static?: boolean } | undefined)?.static) return e
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
    const selected = nodes.filter(n => n.selected)
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
      return (d.isActive ?? false) && !(d.isDim ?? false)
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
      const base = (e.className ?? '').replace('flow-static', '').replace('flow-hidden', '').trim()
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
      const base = (e.className ?? '').replace('flow-static', '').replace('flow-hidden', '').trim()
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
      const base = (e.className ?? '').replace('flow-static', '').replace('flow-hidden', '').trim()
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
      const base = (e.className ?? '').replace('flow-static', '').replace('flow-hidden', '').trim()
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

  const hasSavedData = nodes.length > 0

  const handleSave = useCallback(async () => {
    if (!isDev) return
    const data: DiagramData = { nodes, edges }
    const ok = await persistDiagram(data)
    if (ok) {
      loadedData.current = data
      saveVersion(data)
      refreshVersions()
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 1800)
    }
  }, [nodes, edges, isDev, persistDiagram, saveVersion, refreshVersions])

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

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 14 }}>Loading diagram…</div>
  }

  return (
    <div className={`diagram-stage${!isLocked ? ' diagram-edit-mode' : ''}`}>
      <DiagramToolbar
        isLocked={isLocked}
        onToggleLock={() => setIsLocked(v => !v)}
        onSave={handleSave}
        onReset={handleReset}
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
        layoutType={layoutType}
        onLayoutTypeChange={setLayoutType}
        defaultRouting={defaultRouting}
        onRoutingChange={setDefaultRouting}
        defaultLineStyle={defaultLineStyle}
        onLineStyleChange={setDefaultLineStyle}
        extraControls={isDev ? (
          <VersionDropdown
            versions={versions}
            onSaveNew={() => handleSave()}
            onLoad={v => {
              const ns = hydrateNodes(v.data.nodes, isLocked)
              setNodes(ns)
              setEdges(v.data.edges)
            }}
            onPromote={v => {
              const ns = hydrateNodes(v.data.nodes, isLocked)
              setNodes(ns)
              setEdges(v.data.edges)
              persistDiagram(v.data)
              loadedData.current = v.data
            }}
            onRename={renameVersion}
            onDelete={deleteVersion}
          />
        ) : undefined}
      />
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
        connectionMode={ConnectionMode.Loose}
        minZoom={0.3}
        maxZoom={2}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        edgesReconnectable={!isLocked}
        elementsSelectable={!isLocked}
        deleteKeyCode={isLocked ? null : 'Delete'}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e2a45" />
        <BandLabels />
      </ReactFlow>
    </div>
  )
}

function BandLabels() {
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
    </svg>
  )
}
