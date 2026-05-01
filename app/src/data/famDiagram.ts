import type { Node, Edge } from '@xyflow/react'

// ─── Base node definitions ───────────────────────────────────────────────────
// Positions map 1:1 to the original SVG coordinate space (viewBox 0 0 1100 580).
// React Flow uses the top-left corner of the node bounding box as position.
// Circles: position = { cx - r, cy - r }, width = height = 2r

export const BASE_NODES: Node[] = [
  // ── Document path band (top) ──
  { id: 'n-c1',    type: 'actor',   position: { x: 74,  y: 34  }, style: { width: 52,  height: 52  }, data: { label: 'C1',    sublabel: 'Supplier',    color: '#38bdf8' } },
  { id: 'n-c2',    type: 'mesh',    position: { x: 270, y: 38  }, style: { width: 68,  height: 44  }, data: { label: 'C2',    sublabel: 'Sender AP',   color: '#818cf8' } },
  { id: 'n-c3',    type: 'mesh',    position: { x: 498, y: 38  }, style: { width: 68,  height: 44  }, data: { label: 'C3',    sublabel: 'Receiver AP', color: '#a78bfa' } },
  { id: 'n-c4',    type: 'actor',   position: { x: 684, y: 34  }, style: { width: 52,  height: 52  }, data: { label: 'C4',    sublabel: 'Buyer',       color: '#f472b6' } },

  // ── IR / ASE-IR band (between top and mesh) ──
  { id: 'n-ir',     type: 'service', position: { x: 350, y: 104 }, style: { width: 76,  height: 44  }, data: { label: 'IR',      sublabel: 'payload store',    color: '#38bdf8' } },
  { id: 'n-ase-ir', type: 'mesh',    position: { x: 436, y: 104 }, style: { width: 76,  height: 44  }, data: { label: 'ASE-IR',  sublabel: 'analytical · TEE', color: '#39ff84' } },

  // ── FAM layer (mesh ASEs) ──
  { id: 'n-ase-1', type: 'mesh', position: { x: 60,  y: 180 }, style: { width: 110, height: 60 }, data: { label: 'ASE-1', sublabel: "at Acme's AP",     meta: 'VC issuer · TEE',  color: '#39ff84' } },
  { id: 'n-ase-2', type: 'mesh', position: { x: 220, y: 180 }, style: { width: 110, height: 60 }, data: { label: 'ASE-2', sublabel: "at Bank A's AP",    meta: 'PSI · TEE',        color: '#39ff84' } },
  { id: 'n-ase-3', type: 'mesh', position: { x: 380, y: 180 }, style: { width: 110, height: 60 }, data: { label: 'ASE-3', sublabel: "at Bank B's AP",    meta: 'PSI · FL · TEE',  color: '#39ff84' } },
  { id: 'n-ase-4', type: 'mesh', position: { x: 610, y: 180 }, style: { width: 110, height: 60 }, data: { label: 'ASE-4', sublabel: "at Bank C's AP",    meta: 'PSI · FL · TEE',  color: '#39ff84' } },
  { id: 'n-ase-5', type: 'mesh', position: { x: 770, y: 180 }, style: { width: 110, height: 60 }, data: { label: 'ASE-5', sublabel: 'at AP-X (buyer)', meta: 'VC issuer · FL',   color: '#39ff84' } },

  // ── Consent / UI nodes (in clear band between ASE row [ends y=240] and services row [starts y=300]) ──
  { id: 'n-admin-ui',   type: 'compact', position: { x: 560, y: 248 }, style: { width: 160, height: 22 }, data: { label: 'admin-ui',     sublabel: 'Consent Manifest Mgr',  color: '#38bdf8' } },
  { id: 'n-admin-core', type: 'compact', position: { x: 560, y: 274 }, style: { width: 160, height: 22 }, data: { label: 'admin-corev2', sublabel: 'manifest registry',      color: '#38bdf8' } },
  { id: 'n-pitstop',    type: 'compact', position: { x: 900, y: 248 }, style: { width: 160, height: 22 }, data: { label: 'pitstop-core', sublabel: 'non-PET exchange',       color: '#5a6584', initialDim: true } },
  { id: 'n-pitstop-ui', type: 'compact', position: { x: 900, y: 274 }, style: { width: 160, height: 22 }, data: { label: 'pitstop-ui (PET mode)', sublabel: 'consumer query interface', color: '#fbbf24' } },

  // ── Central services band ──
  { id: 'n-vcis',   type: 'service', position: { x: 60,  y: 300 }, style: { width: 140, height: 58 }, data: { label: 'VCIS',               sublabel: 'VC issuance',          meta: 'SD-JWT · BBS+',  color: '#38bdf8' } },
  { id: 'n-policy', type: 'service', position: { x: 220, y: 300 }, style: { width: 140, height: 58 }, data: { label: 'Policy Engine',      sublabel: 'ABAC · ε-budget',      meta: 'Rego / Cedar',   color: '#ef4444' } },
  { id: 'n-broker', type: 'service', position: { x: 380, y: 300 }, style: { width: 160, height: 58 }, data: { label: 'Query Broker',       sublabel: 'routing · attestation', meta: 'GNAP · ABAC',    color: '#fbbf24' } },
  { id: 'n-tlog',   type: 'service', position: { x: 560, y: 300 }, style: { width: 160, height: 58 }, data: { label: 'Transparency Log',   sublabel: 'Merkle · CT-style',    meta: 'RFC 6962',       color: '#a78bfa' } },
  { id: 'n-dlt',    type: 'service', position: { x: 740, y: 300 }, style: { width: 140, height: 58 }, data: { label: 'DLT Anchor',         sublabel: 'XDC · Polygon',        meta: 'hourly STH',     color: '#f472b6' } },

  // ── Consumer band (bottom) ──
  { id: 'n-owner', type: 'service', position: { x: 40,  y: 500 }, style: { width: 140, height: 50 }, data: { label: 'Acme (data owner)', sublabel: 'audit-its-own-trail', color: '#a78bfa' } },
  { id: 'n-c5b',   type: 'service', position: { x: 200, y: 500 }, style: { width: 140, height: 50 }, data: { label: 'OCBC',              sublabel: 'cohort member',       color: '#fbbf24' } },
  { id: 'n-c5',    type: 'service', position: { x: 380, y: 500 }, style: { width: 170, height: 50 }, data: { label: 'DBS Bank',          sublabel: 'Use Case A consumer', color: '#fbbf24' } },
  { id: 'n-c5c',   type: 'service', position: { x: 600, y: 500 }, style: { width: 140, height: 50 }, data: { label: 'UOB',               sublabel: 'cohort member',       color: '#fbbf24' } },
]

// ─── Base edge definitions ────────────────────────────────────────────────────
// className:
//   'flow-static'  → always visible, faint (opacity 0.18)
//   'flow-hidden'  → hidden by default (toggled by step state)
// animated: true   → dashed animated flow (set dynamically by step state)

export const BASE_EDGES: Edge[] = [
  // ── Static AS4 document path ──
  { id: 'static-c1-c2', source: 'n-c1', target: 'n-c2', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', className: 'flow-static', style: { stroke: '#8a96b8', strokeWidth: 1.4 }, data: { static: true } },
  { id: 'static-c2-c3', source: 'n-c2', target: 'n-c3', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', className: 'flow-static', style: { stroke: '#8a96b8', strokeWidth: 1.4 }, data: { static: true } },
  { id: 'static-c3-c4', source: 'n-c3', target: 'n-c4', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', className: 'flow-static', style: { stroke: '#8a96b8', strokeWidth: 1.4 }, data: { static: true } },

  // ── Static AP→ASE verticals ──
  { id: 'static-c2-ase2', source: 'n-c2', target: 'n-ase-2', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', className: 'flow-static', style: { stroke: '#39ff84', strokeWidth: 1 }, data: { static: true } },
  // C3 (x=498-566) bends west to reach ASE-3 (x=380-490). Route via the clear band y=148-180 (below IR) so the bend doesn't cross ASE-IR.
  { id: 'static-c3-ase3', source: 'n-c3', target: 'n-ase-3', sourceHandle: 'bottom', targetHandle: 'top', type: 'routed', className: 'flow-static', style: { stroke: '#39ff84', strokeWidth: 1 }, data: { static: true, waypoints: [[532, 165], [435, 165]] } },

  // ── Static internal service links ──
  { id: 'static-vcis-policy',   source: 'n-vcis',   target: 'n-policy', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', className: 'flow-static', style: { stroke: '#8a96b8', strokeWidth: 1 }, data: { static: true } },
  { id: 'static-policy-broker', source: 'n-policy', target: 'n-broker', sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', className: 'flow-static', style: { stroke: '#8a96b8', strokeWidth: 1 }, data: { static: true } },
  { id: 'static-broker-tlog',   source: 'n-broker', target: 'n-tlog',   sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', className: 'flow-static', style: { stroke: '#8a96b8', strokeWidth: 1 }, data: { static: true } },
  { id: 'static-tlog-dlt',      source: 'n-tlog',   target: 'n-dlt',    sourceHandle: 'right', targetHandle: 'left', type: 'smoothstep', className: 'flow-static', style: { stroke: '#8a96b8', strokeWidth: 1 }, data: { static: true } },
  { id: 'static-admin-ui-core', source: 'n-admin-ui', target: 'n-admin-core', sourceHandle: 'bottom', targetHandle: 'top', type: 'smoothstep', className: 'flow-static', style: { stroke: '#38bdf8', strokeWidth: 1.2 }, data: { static: true } },

  // ── Active flows (hidden by default, toggled per step) ──
  // Document path
  { id: 'f-c1-c2',     source: 'n-c1',        target: 'n-c2',        sourceHandle: 'right',  targetHandle: 'left',   type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#39ff84', strokeWidth: 2.2 } },
  // Top band → Mesh
  { id: 'f-c1-ase1',   source: 'n-c1',        target: 'n-ase-1',     sourceHandle: 'bottom', targetHandle: 'top',    type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#39ff84', strokeWidth: 1.6 } },
  { id: 'f-c2-ase2',   source: 'n-c2',        target: 'n-ase-2',     sourceHandle: 'bottom', targetHandle: 'top',    type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#39ff84', strokeWidth: 1.8 } },
  { id: 'f-c2-ir',     source: 'n-c2',        target: 'n-ir',        sourceHandle: 'bottom', targetHandle: 'top',    type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#38bdf8', strokeWidth: 1.8 } },
  { id: 'f-ir-aseir',  source: 'n-ir',        target: 'n-ase-ir',    sourceHandle: 'right',  targetHandle: 'left',   type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#39ff84', strokeWidth: 1.6 } },
  // ASE-IR (mid-top, x=474, y=148) → VCIS (bottom-left, x=130, y=300). Route via clear band y=165 west, then via clear corridor x=200 (between ASE-1 ends 170 and ASE-2 starts 220) south.
  { id: 'f-ir-vcis',   source: 'n-ase-ir',    target: 'n-vcis',      sourceHandle: 'bottom', targetHandle: 'top',    type: 'routed', className: 'flow-hidden', style: { stroke: '#38bdf8', strokeWidth: 1.4 }, data: { waypoints: [[474, 165], [200, 165], [200, 290], [130, 290]] } },
  // Inter-ASE mesh
  { id: 'f-ase2-3',    source: 'n-ase-2',     target: 'n-ase-3',     sourceHandle: 'right',  targetHandle: 'left',   type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#39ff84', strokeWidth: 1.6 } },
  { id: 'f-ase3-4',    source: 'n-ase-3',     target: 'n-ase-4',     sourceHandle: 'right',  targetHandle: 'left',   type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#39ff84', strokeWidth: 1.6 } },
  { id: 'f-ase4-5',    source: 'n-ase-4',     target: 'n-ase-5',     sourceHandle: 'right',  targetHandle: 'left',   type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#39ff84', strokeWidth: 1.6 } },
  // ASE → Broker fan-out. Use routed edges to drop into the clear band y=244 (above admin-ui top y=248)
  // before converging on the broker, so drops don't cross admin-ui (which sits at x=560-720, y=248-270).
  { id: 'f-ase1-broker', source: 'n-ase-1', target: 'n-broker', sourceHandle: 'bottom', targetHandle: 'top', type: 'routed', className: 'flow-hidden', style: { stroke: '#fbbf24', strokeWidth: 1.4 }, data: { waypoints: [[115, 244], [460, 244]] } },
  { id: 'f-ase2-broker', source: 'n-ase-2', target: 'n-broker', sourceHandle: 'bottom', targetHandle: 'top', type: 'routed', className: 'flow-hidden', style: { stroke: '#fbbf24', strokeWidth: 1.4 }, data: { waypoints: [[275, 244], [460, 244]] } },
  { id: 'f-ase3-broker', source: 'n-ase-3', target: 'n-broker', sourceHandle: 'bottom', targetHandle: 'top', type: 'routed', className: 'flow-hidden', style: { stroke: '#fbbf24', strokeWidth: 1.4 }, data: { waypoints: [[435, 244], [460, 244]] } },
  { id: 'f-ase4-broker', source: 'n-ase-4', target: 'n-broker', sourceHandle: 'bottom', targetHandle: 'top', type: 'routed', className: 'flow-hidden', style: { stroke: '#fbbf24', strokeWidth: 1.4 }, data: { waypoints: [[665, 244], [460, 244]] } },
  { id: 'f-ase5-broker', source: 'n-ase-5', target: 'n-broker', sourceHandle: 'bottom', targetHandle: 'top', type: 'routed', className: 'flow-hidden', style: { stroke: '#fbbf24', strokeWidth: 1.4 }, data: { waypoints: [[825, 244], [460, 244]] } },
  // ASE-1 → VCIS (vertical drop, both at x ≈ 115; routes directly)
  { id: 'f-ase1-vcis',   source: 'n-ase-1',    target: 'n-vcis',      sourceHandle: 'bottom', targetHandle: 'top',    type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#38bdf8', strokeWidth: 1.6 } },
  // VCIS (x=60-200, y=300) → C1 (x=74-126, y=34). Direct vertical at x=100 passes through ASE-1 (x=60-170); reroute via left margin x=20.
  { id: 'f-vcis-c1',     source: 'n-vcis',     target: 'n-c1',        sourceHandle: 'left',   targetHandle: 'left',   type: 'routed', className: 'flow-hidden flow-dashed', style: { stroke: '#38bdf8', strokeWidth: 1.4 }, data: { waypoints: [[20, 329], [20, 60]] } },
  // Services
  { id: 'f-policy-broker', source: 'n-policy', target: 'n-broker',    sourceHandle: 'right',  targetHandle: 'left',   type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#ef4444', strokeWidth: 1.8 } },
  { id: 'f-broker-tlog',   source: 'n-broker', target: 'n-tlog',      sourceHandle: 'right',  targetHandle: 'left',   type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#a78bfa', strokeWidth: 1.8 } },
  { id: 'f-tlog-dlt',      source: 'n-tlog',   target: 'n-dlt',       sourceHandle: 'right',  targetHandle: 'left',   type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#a78bfa', strokeWidth: 1.6 } },
  // Consent paths — explicit waypoints to avoid passing through ASE row / Broker.
  // C1 (top-left) → admin-ui (mid-right). Route south to clear band y=165, east through corridor, then south to admin-ui's left handle at (560, 259).
  { id: 'f-c1-dex',        source: 'n-c1',       target: 'n-admin-ui',  sourceHandle: 'bottom', targetHandle: 'left',   type: 'routed', className: 'flow-hidden flow-dashed', style: { stroke: '#38bdf8', strokeWidth: 1.4 }, data: { waypoints: [[100, 165], [550, 165], [550, 259]] } },
  // admin-core (mid-right, y=274-296) → ASE-IR (top-mid, y=104-148). Route via clear corridor x=550 (between Broker x=380-540 and TLog x=560).
  { id: 'f-ir-dex',        source: 'n-admin-core', target: 'n-ase-ir',  sourceHandle: 'left',   targetHandle: 'right',  type: 'routed', className: 'flow-hidden flow-dashed', style: { stroke: '#38bdf8', strokeWidth: 1.4 }, data: { waypoints: [[550, 285], [550, 126]] } },
  // Policy (x=220-360, y=300-358) → admin-core (x=560-720, y=274-296). Route via clear band y=295 (between admin-core bottom 296 and services top 300 — narrow but no node).
  { id: 'f-policy-admin',  source: 'n-policy',   target: 'n-admin-core', sourceHandle: 'top',   targetHandle: 'bottom', type: 'routed', className: 'flow-hidden flow-dashed', style: { stroke: '#ef4444', strokeWidth: 1.4 }, data: { waypoints: [[290, 295], [640, 295]] } },
  // pitstop-ui → Broker
  { id: 'f-pitstop-ui-broker', source: 'n-pitstop-ui', target: 'n-broker', sourceHandle: 'left', targetHandle: 'right', type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#fbbf24', strokeWidth: 1.6 } },
  // Consumers → Broker
  { id: 'f-c5-broker',  source: 'n-c5',    target: 'n-broker', sourceHandle: 'top', targetHandle: 'bottom', type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#fbbf24', strokeWidth: 2 } },
  { id: 'f-c5b-broker', source: 'n-c5b',   target: 'n-broker', sourceHandle: 'top', targetHandle: 'bottom', type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#fbbf24', strokeWidth: 1.6 } },
  { id: 'f-c5c-broker', source: 'n-c5c',   target: 'n-broker', sourceHandle: 'top', targetHandle: 'bottom', type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#fbbf24', strokeWidth: 1.6 } },
  // Owner → TLog
  { id: 'f-owner-tlog', source: 'n-owner', target: 'n-tlog',   sourceHandle: 'right', targetHandle: 'bottom', type: 'smoothstep', className: 'flow-hidden', style: { stroke: '#a78bfa', strokeWidth: 1.6 } },
]
