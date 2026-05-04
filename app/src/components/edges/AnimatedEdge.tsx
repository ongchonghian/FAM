import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { getDefaultEdgeStyle, EDGE_TYPES } from '../../lib/edgeTypes'

export interface AnimatedEdgeData {
  label?: string
  showLabel?: boolean
  dashed?: boolean
  speed?: 'slow' | 'normal' | 'fast'
}

function getAnimationDuration(speed: 'slow' | 'normal' | 'fast' = 'normal'): string {
  switch (speed) {
    case 'slow': return '3s'
    case 'fast': return '0.75s'
    default:     return '1.5s'
  }
}

const AnimatedEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  markerStart,
  data,
  selected,
}: EdgeProps) => {
  const edgeData          = data as AnimatedEdgeData | undefined
  const isDashed          = edgeData?.dashed ?? false
  const speed             = edgeData?.speed  ?? 'normal'
  const animationDuration = getAnimationDuration(speed)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  const defaultStyle = getDefaultEdgeStyle(isDashed ? EDGE_TYPES.ANIMATED_DASHED : EDGE_TYPES.ANIMATED)

  return (
    <>
      {/* Static background path at low opacity */}
      <BaseEdge
        id={`${id}-bg`}
        path={edgePath}
        style={{
          ...defaultStyle,
          ...style,
          opacity: 0.3,
          strokeDasharray: isDashed ? '8 4' : undefined,
          ...(selected && { stroke: '#6366f1' }),
        }}
      />

      {/* Animated flowing path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={selected ? '#6366f1' : ((style.stroke as string | undefined) || defaultStyle.stroke)}
        strokeWidth={selected ? 3 : ((style.strokeWidth as number | undefined) || defaultStyle.strokeWidth || 2)}
        strokeDasharray={isDashed ? '8 4' : '10 5'}
        strokeLinecap="round"
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{ animation: `edgeFlow ${animationDuration} linear infinite` }}
      />

      {edgeData?.showLabel && edgeData?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              padding: '4px 8px',
              background: 'rgba(57,255,132,0.12)',
              border: '1px solid rgba(57,255,132,0.3)',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
              color: '#39ff84',
            }}
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}

      <style>{`
        @keyframes edgeFlow {
          from { stroke-dashoffset: 30; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </>
  )
})

AnimatedEdge.displayName = 'AnimatedEdge'

export default AnimatedEdge
