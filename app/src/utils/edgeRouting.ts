import type { Node } from '@xyflow/react'

// Grid resolution and clearance constants
const CELL     = 12   // px per grid cell
const NODE_PAD = 10   // clearance added around every node boundary
const MARGIN   = 80   // canvas padding beyond node extents

export interface RoutePoint { x: number; y: number }

// ── Grid helpers ──────────────────────────────────────────────────────────────

function toCell(px: number, origin: number): number {
  return Math.floor((px - origin) / CELL)
}
function toPixel(cell: number, origin: number): number {
  return cell * CELL + origin + CELL / 2
}

function nodeDims(n: Node): { w: number; h: number } {
  return {
    w: (n.measured?.width  ?? (n.style?.width  as number | undefined) ?? 100),
    h: (n.measured?.height ?? (n.style?.height as number | undefined) ?? 50),
  }
}

function buildGrid(nodes: Node[], excludeIds: Set<string>) {
  const obstacles = nodes.filter(n => !excludeIds.has(n.id) && n.type !== 'band')
  if (obstacles.length === 0) {
    return { grid: [] as Uint8Array[], cols: 1, rows: 1, ox: 0, oy: 0 }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of obstacles) {
    const { w, h } = nodeDims(n)
    minX = Math.min(minX, n.position.x)
    minY = Math.min(minY, n.position.y)
    maxX = Math.max(maxX, n.position.x + w)
    maxY = Math.max(maxY, n.position.y + h)
  }

  const ox = minX - MARGIN
  const oy = minY - MARGIN
  const cols = Math.ceil((maxX - minX + MARGIN * 2) / CELL) + 2
  const rows = Math.ceil((maxY - minY + MARGIN * 2) / CELL) + 2

  const grid: Uint8Array[] = Array.from({ length: rows }, () => new Uint8Array(cols))

  for (const n of obstacles) {
    const { w, h } = nodeDims(n)
    const c1 = Math.max(0, toCell(n.position.x - NODE_PAD, ox))
    const r1 = Math.max(0, toCell(n.position.y - NODE_PAD, oy))
    const c2 = Math.min(cols - 1, toCell(n.position.x + w + NODE_PAD, ox))
    const r2 = Math.min(rows - 1, toCell(n.position.y + h + NODE_PAD, oy))
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        grid[r][c] = 1
      }
    }
  }

  return { grid, cols, rows, ox, oy }
}

// ── A* pathfinder (orthogonal moves only) ─────────────────────────────────────

const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]]

function astar(
  grid: Uint8Array[], cols: number, rows: number,
  sc: number, sr: number, ec: number, er: number,
): Array<[number, number]> | null {
  sc = Math.max(0, Math.min(cols - 1, sc))
  sr = Math.max(0, Math.min(rows - 1, sr))
  ec = Math.max(0, Math.min(cols - 1, ec))
  er = Math.max(0, Math.min(rows - 1, er))

  const key = (c: number, r: number) => r * cols + c
  const h   = (c: number, r: number) => Math.abs(c - ec) + Math.abs(r - er)

  type ANode = { c: number; r: number; g: number; f: number; pk: number }

  const open   = new Map<number, ANode>()
  const gScore = new Map<number, number>()
  const parent = new Map<number, number>()

  const sk = key(sc, sr)
  open.set(sk, { c: sc, r: sr, g: 0, f: h(sc, sr), pk: -1 })
  gScore.set(sk, 0)
  const ek = key(ec, er)

  while (open.size > 0) {
    let best: ANode | null = null
    for (const n of open.values()) {
      if (!best || n.f < best.f) best = n
    }
    if (!best) break

    const bk = key(best.c, best.r)
    if (bk === ek) {
      const path: Array<[number, number]> = []
      let k = bk
      while (k !== -1) {
        const r = Math.floor(k / cols)
        const c = k - r * cols
        path.unshift([c, r])
        k = parent.get(k) ?? -1
      }
      return path
    }

    open.delete(bk)
    parent.set(bk, best.pk)

    for (const [dc, dr] of DIRS) {
      const nc = best.c + dc
      const nr = best.r + dr
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue
      const nk = key(nc, nr)
      if (grid[nr]?.[nc]) continue
      const ng = best.g + 1
      if (ng >= (gScore.get(nk) ?? Infinity)) continue
      gScore.set(nk, ng)
      open.set(nk, { c: nc, r: nr, g: ng, f: ng + h(nc, nr), pk: bk })
    }
  }
  return null
}

// Remove collinear middle points; keep only turn corners
function simplify(path: Array<[number, number]>): Array<[number, number]> {
  if (path.length <= 2) return path
  const out: Array<[number, number]> = [path[0]]
  for (let i = 1; i < path.length - 1; i++) {
    const [pc, pr] = out[out.length - 1]
    const [cc, cr] = path[i]
    const [nc, nr] = path[i + 1]
    if (cc - pc !== nc - cc || cr - pr !== nr - cr) out.push(path[i])
  }
  out.push(path[path.length - 1])
  return out
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute obstacle-avoiding waypoints between two handle positions.
 * Returns the intermediate bend points only — source and target are NOT included,
 * since RoutedEdge already uses the actual React Flow handle coords as endpoints.
 *
 * Returns [] when source and target are close enough that no detour is needed,
 * or when no path can be found (RoutedEdge will draw a straight line).
 */
export function routeEdge(
  source: RoutePoint,
  target: RoutePoint,
  nodes: Node[],
  excludeNodeIds: Set<string> = new Set(),
): [number, number][] {
  const { grid, cols, rows, ox, oy } = buildGrid(nodes, excludeNodeIds)
  if (cols <= 1 || rows <= 1) return []

  const path = astar(
    grid, cols, rows,
    toCell(source.x, ox), toCell(source.y, oy),
    toCell(target.x, ox), toCell(target.y, oy),
  )
  if (!path || path.length <= 2) return []

  const simplified = simplify(path)
  return simplified
    .slice(1, -1)  // strip endpoints — handled by RoutedEdge's source/target coords
    .map(([c, r]) => [toPixel(c, ox), toPixel(r, oy)])
}

/** Compute the pixel position of a React Flow handle on a node. */
export function getHandlePosition(node: Node, handleId?: string | null): RoutePoint {
  const { w, h } = nodeDims(node)
  const cx = node.position.x + w / 2
  const cy = node.position.y + h / 2
  switch (handleId) {
    case 'left':   return { x: node.position.x,     y: cy }
    case 'right':  return { x: node.position.x + w, y: cy }
    case 'top':    return { x: cx,                  y: node.position.y }
    case 'bottom': return { x: cx,                  y: node.position.y + h }
    default:       return { x: cx,                  y: cy }
  }
}
