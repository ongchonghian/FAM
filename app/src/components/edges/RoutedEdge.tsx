import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react'

/**
 * Custom edge that routes through explicit waypoints.
 *
 * Use when smoothstep would route through a node body. Pass an array of
 * [x, y] coordinates as data.waypoints; the edge draws straight segments
 * source → waypoint[0] → waypoint[1] → ... → target.
 *
 * Coordinates are in the React Flow layout space (same as node.position).
 *
 * Example: an edge from C1 (right side, top of diagram) to admin-ui (right
 * side, middle of diagram) needs to traverse a clear band at y=160 between
 * the document-path row (y=38–82) and the IR row (y=104–148):
 *
 *   { type: 'routed', source: 'n-c1', target: 'n-admin-ui',
 *     sourceHandle: 'bottom', targetHandle: 'top',
 *     data: { waypoints: [[100, 160], [640, 160]] } }
 */
export default function RoutedEdge(props: EdgeProps) {
  const {
    sourceX, sourceY, targetX, targetY,
    style, markerEnd, markerStart,
    label, labelStyle, labelBgStyle, labelBgBorderRadius,
    data,
  } = props

  const waypoints = (data as { waypoints?: [number, number][] } | undefined)?.waypoints ?? []

  // Build orthogonal path: source → waypoints → target
  let path = `M ${sourceX} ${sourceY}`
  for (const [x, y] of waypoints) path += ` L ${x} ${y}`
  path += ` L ${targetX} ${targetY}`

  // Label position: midpoint of the longest waypoint-to-waypoint segment,
  // or midpoint of source-to-target if no waypoints.
  let labelX = (sourceX + targetX) / 2
  let labelY = (sourceY + targetY) / 2
  if (waypoints.length >= 2) {
    const mid = waypoints[Math.floor(waypoints.length / 2) - 1]
    const next = waypoints[Math.floor(waypoints.length / 2)]
    labelX = (mid[0] + next[0]) / 2
    labelY = (mid[1] + next[1]) / 2
  } else if (waypoints.length === 1) {
    labelX = waypoints[0][0]
    labelY = waypoints[0][1]
  }

  return (
    <>
      <BaseEdge path={path} style={style} markerEnd={markerEnd} markerStart={markerStart} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              padding: 2,
              borderRadius: labelBgBorderRadius ?? 2,
              ...(labelBgStyle as object),
              ...(labelStyle as object),
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
