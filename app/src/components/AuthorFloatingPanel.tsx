// Floating panel that appears when nodes/edges are selected in In Action author mode.
// Shows Active / Dim toggles for nodes and Animated / Static for edges.

interface AuthorFloatingPanelProps {
  selectedNodeIds:  string[]
  selectedEdgeIds:  string[]
  activeNodeIds:    string[]
  activeFlowIds:    string[]
  animatedFlowIds:  string[]
  onSetNodesActive:   (ids: string[], active: boolean) => void
  onSetNodesDim:      (ids: string[], dim: boolean) => void
  onSetEdgesAnimated: (ids: string[], animated: boolean) => void
  onHideEdges:        (ids: string[]) => void
}

export default function AuthorFloatingPanel({
  selectedNodeIds,
  selectedEdgeIds,
  activeNodeIds,
  activeFlowIds,
  animatedFlowIds,
  onSetNodesActive,
  onSetNodesDim,
  onSetEdgesAnimated,
  onHideEdges,
}: AuthorFloatingPanelProps) {
  if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return null

  const allNodesActive = selectedNodeIds.length > 0 && selectedNodeIds.every(id => activeNodeIds.includes(id))
  const allNodesDim    = selectedNodeIds.length > 0 && selectedNodeIds.every(id => !activeNodeIds.includes(id))
  const allEdgesAnim   = selectedEdgeIds.length > 0 && selectedEdgeIds.every(id => animatedFlowIds.includes(id))
  const allEdgesStatic = selectedEdgeIds.length > 0 && selectedEdgeIds.every(id => !animatedFlowIds.includes(id))

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100, display: 'flex', alignItems: 'center', gap: 6,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '6px 10px',
      boxShadow: '0 4px 16px rgba(0,0,0,.4)',
      pointerEvents: 'all',
    }}>
      {selectedNodeIds.length > 0 && (
        <>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginRight: 2 }}>
            {selectedNodeIds.length} node{selectedNodeIds.length > 1 ? 's' : ''}
          </span>
          <button
            className={`btn${allNodesActive ? ' primary' : ''}`}
            style={{ fontSize: 12, padding: '3px 10px', color: allNodesActive ? undefined : '#39ff84' }}
            onClick={() => onSetNodesActive(selectedNodeIds, !allNodesActive)}
            title="Mark selected nodes as active (highlighted) in this step"
          >
            Active
          </button>
          <button
            className={`btn${allNodesDim ? ' primary' : ''}`}
            style={{ fontSize: 12, padding: '3px 10px', color: allNodesDim ? undefined : '#5a6584' }}
            onClick={() => onSetNodesDim(selectedNodeIds, !allNodesDim)}
            title="Mark selected nodes as dimmed in this step"
          >
            Dim
          </button>
        </>
      )}

      {selectedNodeIds.length > 0 && selectedEdgeIds.length > 0 && (
        <div style={{ width: 1, height: 18, background: 'rgba(61,74,115,0.6)', margin: '0 2px' }} />
      )}

      {selectedEdgeIds.length > 0 && (
        <>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginRight: 2 }}>
            {selectedEdgeIds.length} edge{selectedEdgeIds.length > 1 ? 's' : ''}
          </span>
          {activeFlowIds.some(id => selectedEdgeIds.includes(id)) ? (
            <>
              <button
                className={`btn${allEdgesAnim ? ' primary' : ''}`}
                style={{ fontSize: 12, padding: '3px 10px', color: allEdgesAnim ? undefined : '#38bdf8' }}
                onClick={() => onSetEdgesAnimated(selectedEdgeIds, !allEdgesAnim)}
                title="Animate selected edges in this step"
              >
                Animated
              </button>
              <button
                className={`btn${allEdgesStatic ? ' primary' : ''}`}
                style={{ fontSize: 12, padding: '3px 10px', color: allEdgesStatic ? undefined : '#5a6584' }}
                onClick={() => onSetEdgesAnimated(selectedEdgeIds, false)}
                title="Make selected edges static (visible but not animated) in this step"
              >
                Static
              </button>
              <button
                className="btn"
                style={{ fontSize: 12, padding: '3px 10px', color: '#f87171' }}
                onClick={() => onHideEdges(selectedEdgeIds)}
                title="Remove selected edges from this step"
              >
                Hide
              </button>
            </>
          ) : (
            <button
              className="btn"
              style={{ fontSize: 12, padding: '3px 10px', color: '#39ff84' }}
              onClick={() => onSetEdgesAnimated(selectedEdgeIds, true)}
              title="Show selected edges in this step"
            >
              Show
            </button>
          )}
        </>
      )}
    </div>
  )
}
