import type React from 'react'

export const EDGE_TYPES = {
  // Visual Pathing & Style
  STRAIGHT:        'straight',
  CURVED:          'curved',
  BEZIER:          'bezier',
  SMOOTH_STEP:     'smoothstep',
  STEP:            'step',
  POLYLINE:        'polyline',
  TREE_HORIZONTAL: 'tree-h',
  TREE_VERTICAL:   'tree-v',

  // Attachment & Routing Behavior
  FLOATING:        'floating',
  FLOATING_CURVED: 'floating-curved',

  // Logical & Functional Connectors
  DASHED:          'dashed',
  DOTTED:          'dotted',
  ON_PAGE:         'on-page',
  OFF_PAGE:        'off-page',
  ANIMATED:        'animated',
  ANIMATED_DASHED: 'animated-dashed',
} as const

export type EdgeType = typeof EDGE_TYPES[keyof typeof EDGE_TYPES]

export interface EdgeStyleConfig {
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
  strokeLinecap?: 'butt' | 'round' | 'square'
  strokeLinejoin?: 'miter' | 'round' | 'bevel'
  opacity?: number
  animated?: boolean
  curvature?: number
  borderRadius?: number
}

export interface MarkerConfig {
  type: 'arrow' | 'arrowclosed' | 'circle' | 'diamond' | 'square'
  color?: string
  width?: number
  height?: number
  orient?: 'auto' | 'auto-start-reverse' | number
}

export interface EdgeConfig {
  type: EdgeType
  style?: EdgeStyleConfig
  markerStart?: MarkerConfig
  markerEnd?: MarkerConfig
  label?: string
  labelStyle?: React.CSSProperties
  data?: Record<string, unknown>
}

export interface EdgeTypeOption {
  type: EdgeType
  label: string
  description: string
  category: 'visual' | 'attachment' | 'logical'
  preview?: string
}

export const EDGE_TYPE_OPTIONS: EdgeTypeOption[] = [
  { type: EDGE_TYPES.STRAIGHT,        label: 'Straight',          description: 'Direct line between two points',             category: 'visual',     preview: 'M 0 10 L 40 10' },
  { type: EDGE_TYPES.CURVED,          label: 'Curved',            description: 'Smooth curved line',                         category: 'visual',     preview: 'M 0 10 Q 20 0, 40 10' },
  { type: EDGE_TYPES.BEZIER,          label: 'Bezier',            description: 'Cubic bezier curve',                         category: 'visual',     preview: 'M 0 15 C 10 0, 30 20, 40 5' },
  { type: EDGE_TYPES.SMOOTH_STEP,     label: 'Smooth Step',       description: 'Rounded orthogonal path',                    category: 'visual',     preview: 'M 0 5 L 15 5 Q 20 5, 20 10 L 20 15 Q 20 20, 25 20 L 40 20' },
  { type: EDGE_TYPES.STEP,            label: 'Step',              description: 'Orthogonal path with sharp corners',         category: 'visual',     preview: 'M 0 5 L 20 5 L 20 15 L 40 15' },
  { type: EDGE_TYPES.POLYLINE,        label: 'Polyline',          description: 'Multi-segment line with custom waypoints',   category: 'visual',     preview: 'M 0 5 L 10 15 L 25 8 L 40 18' },
  { type: EDGE_TYPES.TREE_HORIZONTAL, label: 'Tree (Horizontal)', description: 'Horizontal branching for org charts',        category: 'visual',     preview: 'M 0 10 L 20 10 L 20 5 M 20 10 L 20 15 M 20 5 L 40 5 M 20 15 L 40 15' },
  { type: EDGE_TYPES.TREE_VERTICAL,   label: 'Tree (Vertical)',   description: 'Vertical branching for decision trees',      category: 'visual',     preview: 'M 20 0 L 20 10 L 10 10 M 20 10 L 30 10 M 10 10 L 10 20 M 30 10 L 30 20' },
  { type: EDGE_TYPES.FLOATING,        label: 'Floating',          description: 'Dynamic attachment to node perimeter',       category: 'attachment', preview: 'M 5 10 L 35 10' },
  { type: EDGE_TYPES.FLOATING_CURVED, label: 'Floating Curved',   description: 'Curved line with floating attachment',       category: 'attachment', preview: 'M 5 15 Q 20 0, 35 15' },
  { type: EDGE_TYPES.DASHED,          label: 'Dashed',            description: 'Secondary relationships or optional paths',  category: 'logical',    preview: 'M 0 10 L 40 10' },
  { type: EDGE_TYPES.DOTTED,          label: 'Dotted',            description: 'Weak relationships or annotations',          category: 'logical',    preview: 'M 0 10 L 40 10' },
  { type: EDGE_TYPES.ON_PAGE,         label: 'On-Page Connector', description: 'Jump to another part of same page',          category: 'logical',    preview: 'M 0 10 L 30 10 M 35 10 m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0' },
  { type: EDGE_TYPES.OFF_PAGE,        label: 'Off-Page Connector',description: 'Jump to different page or document',         category: 'logical',    preview: 'M 0 10 L 25 10 L 30 5 L 40 5 L 40 15 L 30 15 L 25 10' },
  { type: EDGE_TYPES.ANIMATED,        label: 'Animated',          description: 'Flowing animation for active connections',   category: 'logical',    preview: 'M 0 10 L 40 10' },
  { type: EDGE_TYPES.ANIMATED_DASHED, label: 'Animated Dashed',   description: 'Animated flow with dashed line',             category: 'logical',    preview: 'M 0 10 L 40 10' },
]

export const DEFAULT_EDGE_STYLES: Record<EdgeType, EdgeStyleConfig> = {
  [EDGE_TYPES.STRAIGHT]:        { stroke: '#64748b', strokeWidth: 2 },
  [EDGE_TYPES.CURVED]:          { stroke: '#64748b', strokeWidth: 2, curvature: 0.25 },
  [EDGE_TYPES.BEZIER]:          { stroke: '#64748b', strokeWidth: 2, curvature: 0.5 },
  [EDGE_TYPES.SMOOTH_STEP]:     { stroke: '#64748b', strokeWidth: 2, borderRadius: 5 },
  [EDGE_TYPES.STEP]:            { stroke: '#64748b', strokeWidth: 2, borderRadius: 0 },
  [EDGE_TYPES.POLYLINE]:        { stroke: '#64748b', strokeWidth: 2, strokeLinejoin: 'round' },
  [EDGE_TYPES.TREE_HORIZONTAL]: { stroke: '#8b5cf6', strokeWidth: 2 },
  [EDGE_TYPES.TREE_VERTICAL]:   { stroke: '#8b5cf6', strokeWidth: 2 },
  [EDGE_TYPES.FLOATING]:        { stroke: '#64748b', strokeWidth: 2 },
  [EDGE_TYPES.FLOATING_CURVED]: { stroke: '#64748b', strokeWidth: 2, curvature: 0.25 },
  [EDGE_TYPES.DASHED]:          { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '8 4' },
  [EDGE_TYPES.DOTTED]:          { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '2 4', strokeLinecap: 'round' },
  [EDGE_TYPES.ON_PAGE]:         { stroke: '#3b82f6', strokeWidth: 2 },
  [EDGE_TYPES.OFF_PAGE]:        { stroke: '#8b5cf6', strokeWidth: 2 },
  [EDGE_TYPES.ANIMATED]:        { stroke: '#22c55e', strokeWidth: 2, animated: true },
  [EDGE_TYPES.ANIMATED_DASHED]: { stroke: '#22c55e', strokeWidth: 2, strokeDasharray: '8 4', animated: true },
}

export function getDefaultEdgeStyle(type: EdgeType): EdgeStyleConfig {
  return DEFAULT_EDGE_STYLES[type] || DEFAULT_EDGE_STYLES[EDGE_TYPES.STRAIGHT]
}

export function mergeEdgeStyles(type: EdgeType, customStyle?: EdgeStyleConfig): EdgeStyleConfig {
  return { ...getDefaultEdgeStyle(type), ...customStyle }
}

export function getEdgeTypesByCategory(category: EdgeTypeOption['category']): EdgeTypeOption[] {
  return EDGE_TYPE_OPTIONS.filter(opt => opt.category === category)
}

export function getEdgeTypeMetadata(type: EdgeType): EdgeTypeOption | undefined {
  return EDGE_TYPE_OPTIONS.find(opt => opt.type === type)
}

export function isAnimatedEdgeType(type: EdgeType): boolean {
  return type === EDGE_TYPES.ANIMATED || type === EDGE_TYPES.ANIMATED_DASHED
}

export function isDashedEdgeType(type: EdgeType): boolean {
  return [EDGE_TYPES.DASHED, EDGE_TYPES.DOTTED, EDGE_TYPES.ANIMATED_DASHED].includes(type as never)
}
