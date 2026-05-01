import { useCallback } from 'react'
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

const nodeTypes: NodeTypes = {
  mesh:    MeshNode    as never,
  actor:   ActorNode   as never,
  service: ServiceNode as never,
  compact: CompactNode as never,
}

const edgeTypes: EdgeTypes = {
  routed: RoutedEdge,
}

// Layout in a 1000×500 coordinate space, organised into 5 horizontal bands:
//   Discovery (y~10)
//   Document Path (y~90)
//   IR / Analytics Provider (y~170)
//   ASE Layer + Query Broker + dex Integration (y~250)
//   C5 Consumers (y~390)
const NODES: Node[] = [
  // ── Discovery Layer ──
  { id: 'sml', type: 'compact', position: { x: 320, y: 10 },  style: { width: 120, height: 30 }, data: { label: 'SML',    sublabel: 'DNS root',         color: '#8a96b8' } },
  { id: 'smp', type: 'compact', position: { x: 460, y: 10 },  style: { width: 120, height: 30 }, data: { label: 'SMP',    sublabel: 'per-AP metadata',   color: '#8a96b8' } },
  { id: 'asr', type: 'compact', position: { x: 600, y: 10 },  style: { width: 120, height: 30 }, data: { label: 'ASR ✶',  sublabel: 'analytical services', color: '#39ff84' } },

  // ── Document Path ──
  { id: 'c1', type: 'actor', position: { x: 30,  y: 78 },  style: { width: 56, height: 56 }, data: { label: 'C1', sublabel: 'Supplier',      color: '#38bdf8' } },
  { id: 'c2', type: 'mesh',  position: { x: 200, y: 84 },  style: { width: 100, height: 44 }, data: { label: 'C2', sublabel: 'Sender AP',     color: '#818cf8' } },
  { id: 'c3', type: 'mesh',  position: { x: 470, y: 84 },  style: { width: 100, height: 44 }, data: { label: 'C3', sublabel: 'Receiver AP',   color: '#a78bfa' } },
  { id: 'c4', type: 'actor', position: { x: 700, y: 78 },  style: { width: 56, height: 56 }, data: { label: 'C4', sublabel: 'Buyer',         color: '#f472b6' } },

  // ── IR (analytical Data Provider — receives parallel forward from C2) ──
  { id: 'ir', type: 'service', position: { x: 320, y: 170 }, style: { width: 130, height: 50 }, data: { label: 'IR', sublabel: 'Invoice Repository', meta: 'dex Data Provider', color: '#38bdf8' } },

  // ── dex Integration (existing infrastructure) ──
  { id: 'admin',   type: 'compact', position: { x: 800, y: 78  }, style: { width: 200, height: 30 }, data: { label: 'dex admin portal',  sublabel: 'admin-ui + admin-corev2', color: '#8a96b8', initialDim: true } },
  { id: 'pitstop', type: 'compact', position: { x: 800, y: 120 }, style: { width: 200, height: 30 }, data: { label: 'pitstop portal',    sublabel: 'pitstop-ui + pitstop-core', color: '#8a96b8', initialDim: true } },

  // ── ASE Layer ──
  { id: 'ase-c2', type: 'mesh', position: { x: 180, y: 268 }, style: { width: 140, height: 78 }, data: { label: 'ASE',  sublabel: 'at sender AP',   meta: 'VC issuer · TEE · FL', color: '#39ff84' } },
  { id: 'ase-c3', type: 'mesh', position: { x: 460, y: 268 }, style: { width: 140, height: 78 }, data: { label: 'ASE',  sublabel: 'at receiver AP', meta: 'VC issuer · TEE · FL', color: '#39ff84' } },

  // ── FAM Query Broker (right side) ──
  { id: 'broker', type: 'service', position: { x: 760, y: 260 }, style: { width: 200, height: 90 }, data: { label: 'FAM QUERY BROKER', sublabel: '+ Transparency Log', meta: 'ABAC + GNAP · Merkle · DLT anchor', color: '#fbbf24' } },

  // ── C5 Consumers (bottom row) ──
  { id: 'c5-banks',       type: 'service', position: { x: 30,  y: 400 }, style: { width: 180, height: 60 }, data: { label: 'Banks · Lenders',    sublabel: 'Use Case A · financing, KYB',     color: '#38bdf8' } },
  { id: 'c5-mas',         type: 'service', position: { x: 230, y: 400 }, style: { width: 180, height: 60 }, data: { label: 'MAS · Auditors',     sublabel: 'Use Case B · supervision (FL+DP)', color: '#fbbf24' } },
  { id: 'c5-enterprises', type: 'service', position: { x: 430, y: 400 }, style: { width: 180, height: 60 }, data: { label: 'Enterprises · Self', sublabel: 'Use Case C · cashflow, DSO',       color: '#f472b6' } },
  { id: 'c5-owner',       type: 'service', position: { x: 630, y: 400 }, style: { width: 180, height: 60 }, data: { label: 'Data Owner',         sublabel: 'audit-its-own-trail',              color: '#a78bfa' } },
]

const EDGES: Edge[] = [
  // ── AS4 Document Path (the unchanged 4-corner backbone) ──
  { id: 'doc-c1-c2', source: 'c1', target: 'c2', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', label: 'AS4', labelStyle: { fill: '#5a6584', fontSize: 10 }, labelBgStyle: { fill: '#0f1626' }, style: { stroke: '#6a7a9a', strokeWidth: 1.6 } },
  { id: 'doc-c2-c3', source: 'c2', target: 'c3', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', label: 'AS4 · PINT-SG', labelStyle: { fill: '#5a6584', fontSize: 10 }, labelBgStyle: { fill: '#0f1626' }, style: { stroke: '#6a7a9a', strokeWidth: 1.6 } },
  { id: 'doc-c3-c4', source: 'c3', target: 'c4', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', label: 'AS4', labelStyle: { fill: '#5a6584', fontSize: 10 }, labelBgStyle: { fill: '#0f1626' }, style: { stroke: '#6a7a9a', strokeWidth: 1.6 } },

  // ── Parallel forward C2 → IR (cyan, dashed-animated) ──
  { id: 'c2-ir', source: 'c2', target: 'ir', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', animated: true, label: 'parallel', labelStyle: { fill: '#38bdf8', fontSize: 10 }, labelBgStyle: { fill: '#0f1626' }, style: { stroke: '#38bdf8', strokeWidth: 1.6, strokeDasharray: '4 3' } },

  // ── Analytical-overlay derivations ──
  { id: 'ir-asec2', source: 'ir',   target: 'ase-c2', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: { stroke: '#39ff84', strokeWidth: 1.2, strokeDasharray: '3 3', opacity: 0.7 } },
  { id: 'c2-ase',   source: 'c2',   target: 'ase-c2', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', animated: true, style: { stroke: '#39ff84', strokeWidth: 1.4, strokeDasharray: '4 4' } },
  { id: 'c3-ase',   source: 'c3',   target: 'ase-c3', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', animated: true, style: { stroke: '#39ff84', strokeWidth: 1.4, strokeDasharray: '4 4' } },

  // ── Mesh link between ASEs (PSI · MPC · FL aggregation) ──
  { id: 'ase-mesh', source: 'ase-c2', target: 'ase-c3', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', animated: true, label: 'PSI · MPC · FL agg', labelStyle: { fill: '#39ff84', fontSize: 10, fontWeight: 700 }, labelBgStyle: { fill: '#0f1626' }, style: { stroke: '#39ff84', strokeWidth: 2.5, strokeDasharray: '6 4' } },

  // ── Broker → ASEs (queries fan out) ──
  { id: 'broker-ase-c3', source: 'broker', target: 'ase-c3', sourceHandle: 'left',  targetHandle: 'right',  type: 'smoothstep', animated: true, style: { stroke: '#fbbf24', strokeWidth: 1.5, strokeDasharray: '5 4' } },
  { id: 'broker-ase-c2', source: 'broker', target: 'ase-c2', sourceHandle: 'bottom', targetHandle: 'bottom', type: 'smoothstep', animated: true, style: { stroke: '#fbbf24', strokeWidth: 1.2, strokeDasharray: '3 4', opacity: 0.6 } },

  // ── dex Integration → Broker (manifest fetch at query time) ──
  // admin (x=800-1000, y=78-108) → broker (x=760-960, y=260-350). Direct south path passes through pitstop (x=800-1000, y=120-150).
  // Route west of admin/pitstop column, then south to broker top.
  { id: 'admin-broker', source: 'admin', target: 'broker', sourceHandle: 'left', targetHandle: 'top', type: 'routed', data: { waypoints: [[770, 93], [770, 260]] }, label: 'manifest fetch', labelStyle: { fill: '#5a6584', fontSize: 10, fontStyle: 'italic' }, labelBgStyle: { fill: '#0f1626' }, style: { stroke: '#3d4a73', strokeWidth: 1, strokeDasharray: '2 3' } },

  // ── Consumers → Broker (queries, not data) ──
  { id: 'c5-banks-broker',       source: 'c5-banks',       target: 'broker', sourceHandle: 'top', targetHandle: 'bottom', type: 'smoothstep', style: { stroke: '#fbbf24', strokeWidth: 0.9, opacity: 0.5 } },
  { id: 'c5-mas-broker',         source: 'c5-mas',         target: 'broker', sourceHandle: 'top', targetHandle: 'bottom', type: 'smoothstep', style: { stroke: '#fbbf24', strokeWidth: 0.9, opacity: 0.5 } },
  { id: 'c5-enterprises-broker', source: 'c5-enterprises', target: 'broker', sourceHandle: 'top', targetHandle: 'bottom', type: 'smoothstep', style: { stroke: '#fbbf24', strokeWidth: 0.9, opacity: 0.5 } },
  { id: 'c5-owner-broker',       source: 'c5-owner',       target: 'broker', sourceHandle: 'top', targetHandle: 'bottom', type: 'smoothstep', style: { stroke: '#fbbf24', strokeWidth: 0.9, opacity: 0.5 } },

  // ── Discovery layer (faint dotted pointers down to APs) ──
  { id: 'smp-c2', source: 'smp', target: 'c2', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: { stroke: '#3d4a73', strokeWidth: 0.8, strokeDasharray: '2 3', opacity: 0.7 } },
  { id: 'smp-c3', source: 'smp', target: 'c3', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', style: { stroke: '#3d4a73', strokeWidth: 0.8, strokeDasharray: '2 3', opacity: 0.7 } },
  // ASR (x=600-720, y=10-40) → broker (x=760-960, y=260-350). Route via clear band y=160 (between document path y=84-128 and IR y=170-220).
  { id: 'asr-broker', source: 'asr', target: 'broker', sourceHandle: 'bottom', targetHandle: 'top', type: 'routed', data: { waypoints: [[660, 160], [860, 160]] }, style: { stroke: '#39ff84', strokeWidth: 0.8, strokeDasharray: '2 3', opacity: 0.5 } },
]

// Pre-mark all nodes as active so they render at full opacity.
const initialNodes: Node[] = NODES.map(n => ({
  ...n,
  data: { ...n.data, isActive: true, isDim: false },
  draggable: false,
  selectable: false,
  connectable: false,
}))

const initialEdges: Edge[] = EDGES

export default function FamOverviewDiagram() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onInit = useCallback((instance: { fitView: (opts?: object) => void }) => {
    instance.fitView({ padding: 0.05 })
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: 540, background: 'var(--bg-deep)', borderRadius: 8, overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.05 }}
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
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e2a45" />
      </ReactFlow>
    </div>
  )
}
