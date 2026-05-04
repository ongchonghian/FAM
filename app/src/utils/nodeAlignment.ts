import type { Node } from '@xyflow/react'

export type AlignType =
  | 'align-left' | 'align-center-h' | 'align-right'
  | 'align-top' | 'align-center-v' | 'align-bottom'
  | 'dist-h' | 'dist-v'

function nw(n: Node): number { return (n.style?.width as number) ?? (n.measured?.width as number) ?? 100 }
function nh(n: Node): number { return (n.style?.height as number) ?? (n.measured?.height as number) ?? 50 }

export function alignNodes(
  selected: Node[],
  type: AlignType,
): Record<string, { x: number; y: number }> {
  if (selected.length < 2) return {}

  const result: Record<string, { x: number; y: number }> = {}

  switch (type) {
    case 'align-left': {
      const anchor = Math.min(...selected.map(n => n.position.x))
      selected.forEach(n => { result[n.id] = { x: anchor, y: n.position.y } })
      break
    }
    case 'align-right': {
      const anchor = Math.max(...selected.map(n => n.position.x + nw(n)))
      selected.forEach(n => { result[n.id] = { x: anchor - nw(n), y: n.position.y } })
      break
    }
    case 'align-center-h': {
      const minX = Math.min(...selected.map(n => n.position.x))
      const maxX = Math.max(...selected.map(n => n.position.x + nw(n)))
      const cx = (minX + maxX) / 2
      selected.forEach(n => { result[n.id] = { x: cx - nw(n) / 2, y: n.position.y } })
      break
    }
    case 'align-top': {
      const anchor = Math.min(...selected.map(n => n.position.y))
      selected.forEach(n => { result[n.id] = { x: n.position.x, y: anchor } })
      break
    }
    case 'align-bottom': {
      const anchor = Math.max(...selected.map(n => n.position.y + nh(n)))
      selected.forEach(n => { result[n.id] = { x: n.position.x, y: anchor - nh(n) } })
      break
    }
    case 'align-center-v': {
      const minY = Math.min(...selected.map(n => n.position.y))
      const maxY = Math.max(...selected.map(n => n.position.y + nh(n)))
      const cy = (minY + maxY) / 2
      selected.forEach(n => { result[n.id] = { x: n.position.x, y: cy - nh(n) / 2 } })
      break
    }
    case 'dist-h': {
      const sorted = [...selected].sort((a, b) => a.position.x - b.position.x)
      const totalW = sorted.reduce((s, n) => s + nw(n), 0)
      const span = (sorted[sorted.length - 1].position.x + nw(sorted[sorted.length - 1])) - sorted[0].position.x
      const gap = selected.length > 2 ? (span - totalW) / (sorted.length - 1) : 0
      let cur = sorted[0].position.x
      sorted.forEach(n => { result[n.id] = { x: cur, y: n.position.y }; cur += nw(n) + gap })
      break
    }
    case 'dist-v': {
      const sorted = [...selected].sort((a, b) => a.position.y - b.position.y)
      const totalH = sorted.reduce((s, n) => s + nh(n), 0)
      const span = (sorted[sorted.length - 1].position.y + nh(sorted[sorted.length - 1])) - sorted[0].position.y
      const gap = selected.length > 2 ? (span - totalH) / (sorted.length - 1) : 0
      let cur = sorted[0].position.y
      sorted.forEach(n => { result[n.id] = { x: n.position.x, y: cur }; cur += nh(n) + gap })
      break
    }
  }

  return result
}
