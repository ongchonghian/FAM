import { useCallback, useRef } from 'react'
import { BaseEdge, EdgeLabelRenderer, useReactFlow, type EdgeProps } from '@xyflow/react'

export default function RoutedEdge(props: EdgeProps) {
  const {
    id, sourceX, sourceY, targetX, targetY,
    style, markerEnd, markerStart,
    label, labelStyle, labelBgStyle, labelBgBorderRadius,
    data, selected,
  } = props

  const { setEdges, screenToFlowPosition } = useReactFlow()
  const waypoints = (data as { waypoints?: [number, number][] } | undefined)?.waypoints ?? []

  // Build polyline path through waypoints
  let path = `M ${sourceX} ${sourceY}`
  for (const [x, y] of waypoints) path += ` L ${x} ${y}`
  path += ` L ${targetX} ${targetY}`

  // Label at midpoint of middle segment
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

  // ── Waypoint dragging ──────────────────────────────────────────────────────

  const draggingRef = useRef<{ index: number } | null>(null)

  const startWaypointDrag = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    e.preventDefault()
    draggingRef.current = { index }

    const onMove = (me: MouseEvent) => {
      if (!draggingRef.current) return
      const fp = screenToFlowPosition({ x: me.clientX, y: me.clientY })
      setEdges(eds => eds.map(edge => {
        if (edge.id !== id) return edge
        const wps = [...((edge.data as { waypoints?: [number, number][] })?.waypoints ?? [])] as [number, number][]
        wps[draggingRef.current!.index] = [Math.round(fp.x), Math.round(fp.y)]
        return { ...edge, data: { ...(edge.data as object), waypoints: wps } }
      }))
    }

    const onUp = () => {
      draggingRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [id, setEdges, screenToFlowPosition])

  // ── Delete waypoint on right-click ─────────────────────────────────────────

  const deleteWaypoint = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setEdges(eds => eds.map(edge => {
      if (edge.id !== id) return edge
      const wps = [...((edge.data as { waypoints?: [number, number][] })?.waypoints ?? [])] as [number, number][]
      wps.splice(index, 1)
      return { ...edge, data: { ...(edge.data as object), waypoints: wps } }
    }))
  }

  // ── Add waypoint at segment midpoint ───────────────────────────────────────

  const addMidpointWaypoint = (e: React.MouseEvent, segIdx: number) => {
    e.stopPropagation()
    const allPts: [number, number][] = [[sourceX, sourceY], ...waypoints, [targetX, targetY]]
    const [ax, ay] = allPts[segIdx]
    const [bx, by] = allPts[segIdx + 1]
    const mid: [number, number] = [Math.round((ax + bx) / 2), Math.round((ay + by) / 2)]
    setEdges(eds => eds.map(edge => {
      if (edge.id !== id) return edge
      const wps = [...((edge.data as { waypoints?: [number, number][] })?.waypoints ?? [])] as [number, number][]
      wps.splice(segIdx, 0, mid)
      return { ...edge, data: { ...(edge.data as object), waypoints: wps } }
    }))
  }

  const allPoints: [number, number][] = [[sourceX, sourceY], ...waypoints, [targetX, targetY]]

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

      {selected && (
        <EdgeLabelRenderer>
          {/* Draggable waypoint handles */}
          {waypoints.map(([wx, wy], i) => (
            <div
              key={`wp-${i}`}
              className="nodrag nopan edge-waypoint-handle"
              style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${wx}px, ${wy}px)` }}
              onMouseDown={e => startWaypointDrag(e, i)}
              onContextMenu={e => deleteWaypoint(e, i)}
              title="Drag to move · Right-click to remove"
            />
          ))}

          {/* Segment midpoint add buttons */}
          {allPoints.slice(0, -1).map((p, segIdx) => {
            const next = allPoints[segIdx + 1]
            const mx = (p[0] + next[0]) / 2
            const my = (p[1] + next[1]) / 2
            return (
              <div
                key={`add-${segIdx}`}
                className="nodrag nopan edge-waypoint-add"
                style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${mx}px, ${my}px)` }}
                onClick={e => addMidpointWaypoint(e, segIdx)}
                title="Click to add bend point"
              >+</div>
            )
          })}
        </EdgeLabelRenderer>
      )}
    </>
  )
}
