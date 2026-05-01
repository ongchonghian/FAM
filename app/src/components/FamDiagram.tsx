import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react'
import MeshNode from './nodes/MeshNode'
import ActorNode from './nodes/ActorNode'
import ServiceNode from './nodes/ServiceNode'
import CompactNode from './nodes/CompactNode'
import RoutedEdge from './edges/RoutedEdge'
import { BASE_NODES, BASE_EDGES } from '../data/famDiagram'

const nodeTypes: NodeTypes = {
  mesh:    MeshNode    as never,
  actor:   ActorNode   as never,
  service: ServiceNode as never,
  compact: CompactNode as never,
}

const edgeTypes: EdgeTypes = {
  routed: RoutedEdge,
}

interface FamDiagramProps {
  activeNodeIds: Set<string>
  activeFlowIds: Set<string>
  /** Optional dynamic label overrides per node: nodeId → partial data patch */
  nodeOverrides?: Record<string, Partial<Record<string, unknown>>>
}

export default function FamDiagram({ activeNodeIds, activeFlowIds, nodeOverrides }: FamDiagramProps) {
  const initialNodes = useMemo<Node[]>(() => BASE_NODES.map(n => ({
    ...n,
    data: {
      ...n.data,
      ...(nodeOverrides?.[n.id] ?? {}),
      isActive: activeNodeIds.has(n.id),
      isDim: activeNodeIds.size > 0 && !activeNodeIds.has(n.id) && !(n.data as { initialDim?: boolean }).initialDim,
    },
    draggable: false,
    selectable: false,
    connectable: false,
  })), []) // eslint-disable-line react-hooks/exhaustive-deps

  const initialEdges = useMemo<Edge[]>(() => BASE_EDGES.map(e => {
    const isStatic = !!(e.data as { static?: boolean } | undefined)?.static
    if (isStatic) return e
    const isActive = activeFlowIds.has(e.id)
    const baseClass = e.className?.replace('flow-hidden', '').trim() ?? ''
    return {
      ...e,
      animated: isActive,
      className: isActive ? baseClass : `${baseClass} flow-hidden`.trim(),
    }
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // Re-apply active state when props change
  const updatedNodes = useMemo<Node[]>(() =>
    nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        ...(nodeOverrides?.[n.id] ?? {}),
        isActive: activeNodeIds.has(n.id),
        isDim: activeNodeIds.size > 0 && !activeNodeIds.has(n.id) && !(n.data as { initialDim?: boolean }).initialDim,
      },
    })),
    [nodes, activeNodeIds, nodeOverrides],
  )

  const updatedEdges = useMemo<Edge[]>(() =>
    edges.map(e => {
      const isStatic = !!(e.data as { static?: boolean } | undefined)?.static
      if (isStatic) return e
      const isActive = activeFlowIds.has(e.id)
      const baseClass = (e.className ?? '')
        .replace('flow-hidden', '')
        .replace('animated', '')
        .trim()
      return {
        ...e,
        animated: isActive,
        className: isActive ? baseClass : `${baseClass} flow-hidden`.trim(),
      }
    }),
    [edges, activeFlowIds],
  )

  const onInit = useCallback((instance: { fitView: (opts?: object) => void }) => {
    instance.fitView({ padding: 0.08 })
  }, [])

  return (
    <div className="diagram-stage">
      <ReactFlow
        nodes={updatedNodes}
        edges={updatedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        minZoom={0.3}
        maxZoom={2}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#1e2a45"
        />
        <BandLabels />
      </ReactFlow>
    </div>
  )
}

function BandLabels() {
  return (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
    >
      {/* These labels sit on top of the canvas. They use approximate positions
          matching the original SVG band positions, but are purely decorative. */}
    </svg>
  )
}
