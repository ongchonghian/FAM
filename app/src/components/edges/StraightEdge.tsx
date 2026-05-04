import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react'
import { getDefaultEdgeStyle, EDGE_TYPES } from '../../lib/edgeTypes'

export interface StraightEdgeData {
  label?: string
  showLabel?: boolean
}

const StraightEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  markerStart,
  data,
  selected,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  const defaultStyle = getDefaultEdgeStyle(EDGE_TYPES.STRAIGHT)
  const edgeData = data as StraightEdgeData | undefined

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

StraightEdge.displayName = 'StraightEdge'

export default StraightEdge
