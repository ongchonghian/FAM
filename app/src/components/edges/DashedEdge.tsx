import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'
import { getDefaultEdgeStyle, EDGE_TYPES } from '../../lib/edgeTypes'

export interface DashedEdgeData {
  label?: string
  showLabel?: boolean
  variant?: 'dashed' | 'dotted'
  animated?: boolean
}

function getDashArray(variant: 'dashed' | 'dotted' = 'dashed'): string {
  return variant === 'dotted' ? '2 4' : '8 4'
}

export const DashedEdge = memo(({
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
  const edgeData   = data as DashedEdgeData | undefined
  const variant    = edgeData?.variant  ?? 'dashed'
  const isAnimated = edgeData?.animated ?? false

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 8,
  })

  const defaultStyle = getDefaultEdgeStyle(variant === 'dotted' ? EDGE_TYPES.DOTTED : EDGE_TYPES.DASHED)

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          ...defaultStyle,
          ...style,
          strokeDasharray: getDashArray(variant),
          strokeLinecap: variant === 'dotted' ? 'round' : 'butt',
          ...(selected && { stroke: '#6366f1', strokeWidth: 3 }),
        }}
        className={isAnimated ? 'animated-edge' : ''}
      />
      {edgeData?.showLabel && edgeData?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              padding: '4px 8px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-muted)',
            }}
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})

DashedEdge.displayName = 'DashedEdge'

export const DottedEdge = memo((props: EdgeProps) => (
  <DashedEdge {...props} data={{ ...(props.data as DashedEdgeData), variant: 'dotted' }} />
))

DottedEdge.displayName = 'DottedEdge'

export default DashedEdge
