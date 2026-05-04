import { memo, useMemo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  useInternalNode,
  type EdgeProps,
  type InternalNode,
  Position,
} from '@xyflow/react'
import { getDefaultEdgeStyle, EDGE_TYPES } from '../../lib/edgeTypes'

export interface FloatingEdgeData {
  label?: string
  showLabel?: boolean
  curved?: boolean
  curvature?: number
}

function getNodeIntersection(
  intersectionNode: InternalNode,
  targetNode: InternalNode,
): { x: number; y: number } {
  const { measured, internals } = intersectionNode
  const targetInternals = targetNode.internals

  const width  = measured?.width  ?? 100
  const height = measured?.height ?? 50

  const nodePosition   = internals?.positionAbsolute   ?? { x: 0, y: 0 }
  const targetPosition = targetInternals?.positionAbsolute ?? { x: 0, y: 0 }

  const w = width  / 2
  const h = height / 2
  const x2 = nodePosition.x + w
  const y2 = nodePosition.y + h

  const targetWidth  = targetNode.measured?.width  ?? 100
  const targetHeight = targetNode.measured?.height ?? 50
  const x1 = targetPosition.x + targetWidth  / 2
  const y1 = targetPosition.y + targetHeight / 2

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const a   = 1 / (Math.abs(xx1) + Math.abs(yy1))
  const xx3 = a * xx1
  const yy3 = a * yy1

  return {
    x: w * (xx3 + yy3) + nodePosition.x + w,
    y: h * (-xx3 + yy3) + nodePosition.y + h,
  }
}

function getEdgePosition(
  node: InternalNode,
  intersectionPoint: { x: number; y: number },
): Position {
  const { measured, internals } = node
  const nodePosition = internals?.positionAbsolute ?? { x: 0, y: 0 }
  const width  = measured?.width  ?? 100
  const height = measured?.height ?? 50

  const nx = Math.round(nodePosition.x)
  const ny = Math.round(nodePosition.y)
  const px = Math.round(intersectionPoint.x)
  const py = Math.round(intersectionPoint.y)

  if (px <= nx + 1)             return Position.Left
  if (px >= nx + width - 1)     return Position.Right
  if (py <= ny + 1)             return Position.Top
  if (py >= ny + height - 1)    return Position.Bottom
  return Position.Top
}

const FloatingEdge = memo(({
  id,
  source,
  target,
  style = {},
  markerEnd,
  markerStart,
  data,
  selected,
}: EdgeProps) => {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  const edgeData = data as FloatingEdgeData | undefined

  const { sourceX, sourceY, targetX, targetY, sourcePos, targetPos } = useMemo(() => {
    if (!sourceNode || !targetNode) {
      return { sourceX: 0, sourceY: 0, targetX: 0, targetY: 0, sourcePos: Position.Right, targetPos: Position.Left }
    }
    const sourceIntersection = getNodeIntersection(sourceNode, targetNode)
    const targetIntersection = getNodeIntersection(targetNode, sourceNode)
    return {
      sourceX: sourceIntersection.x,
      sourceY: sourceIntersection.y,
      targetX: targetIntersection.x,
      targetY: targetIntersection.y,
      sourcePos: getEdgePosition(sourceNode, sourceIntersection),
      targetPos: getEdgePosition(targetNode, targetIntersection),
    }
  }, [sourceNode, targetNode])

  const useCurved  = edgeData?.curved    ?? false
  const curvature  = edgeData?.curvature ?? 0.25

  const [edgePath, labelX, labelY] = useMemo(() => {
    if (useCurved) {
      return getBezierPath({ sourceX, sourceY, sourcePosition: sourcePos, targetX, targetY, targetPosition: targetPos, curvature })
    }
    return getStraightPath({ sourceX, sourceY, targetX, targetY })
  }, [sourceX, sourceY, targetX, targetY, sourcePos, targetPos, useCurved, curvature])

  const defaultStyle = getDefaultEdgeStyle(useCurved ? EDGE_TYPES.FLOATING_CURVED : EDGE_TYPES.FLOATING)

  if (!sourceNode || !targetNode) return null

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

FloatingEdge.displayName = 'FloatingEdge'

export default FloatingEdge
