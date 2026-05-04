import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { getDefaultEdgeStyle, EDGE_TYPES } from '../../lib/edgeTypes'

export interface CurvedEdgeData {
  label?: string
  showLabel?: boolean
  curvature?: number
}

const CurvedEdge = memo(({
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
  const edgeData  = data as CurvedEdgeData | undefined
  const curvature = edgeData?.curvature ?? 0.25

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    curvature,
  })

  const defaultStyle = getDefaultEdgeStyle(EDGE_TYPES.CURVED)

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{ ...defaultStyle, ...style, ...(selected && { stroke: '#6366f1', strokeWidth: 3 }) }}
      />
      {edgeData?.showLabel && edgeData?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              padding: '4px 8px',
              background: 'var(--bg-card)',
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

CurvedEdge.displayName = 'CurvedEdge'

export default CurvedEdge
