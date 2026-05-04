import { useCallback } from 'react'
import { useReactFlow, type Node } from '@xyflow/react'

export interface UseGraphNavigationOptions {
  onNodeFocus?: (nodeId: string) => void
  defaultZoom?: number
  animationDuration?: number
}

export interface UseGraphNavigationReturn {
  panToNode: (nodeId: string) => void
  fitToNodes: (nodeIds: string[]) => void
  getAbsolutePosition: (nodeId: string) => { x: number; y: number } | null
}

/**
 * Graph navigation utilities — must be called inside a ReactFlowProvider context.
 * Use inside a child component rendered within <ReactFlow>, or wrap the parent in <ReactFlowProvider>.
 */
export function useGraphNavigation(options: UseGraphNavigationOptions = {}): UseGraphNavigationReturn {
  const { onNodeFocus, defaultZoom = 1.5, animationDuration = 800 } = options
  const { getNode, setCenter, fitView } = useReactFlow()

  const getAbsolutePosition = useCallback((nodeId: string): { x: number; y: number } | null => {
    const node = getNode(nodeId)
    if (!node?.position) return null

    let x = node.position.x
    let y = node.position.y
    let parentId = node.parentId

    while (parentId) {
      const parent = getNode(parentId)
      if (parent?.position) {
        x += parent.position.x
        y += parent.position.y
        parentId = parent.parentId
      } else {
        break
      }
    }
    return { x, y }
  }, [getNode])

  const panToNode = useCallback((nodeId: string) => {
    const node = getNode(nodeId) as Node | undefined
    if (!node) return
    const pos = getAbsolutePosition(nodeId)
    if (!pos) return

    const w = node.measured?.width  ?? (node.width  as number | undefined) ?? 200
    const h = node.measured?.height ?? (node.height as number | undefined) ?? 100
    setCenter(pos.x + w / 2, pos.y + h / 2, { zoom: defaultZoom, duration: animationDuration })
    onNodeFocus?.(nodeId)
  }, [getNode, getAbsolutePosition, setCenter, defaultZoom, animationDuration, onNodeFocus])

  const fitToNodes = useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return
    fitView({ nodes: nodeIds.map(id => ({ id })), duration: animationDuration, padding: 0.2 })
  }, [fitView, animationDuration])

  return { panToNode, fitToNodes, getAbsolutePosition }
}

export default useGraphNavigation
