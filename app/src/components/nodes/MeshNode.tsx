import { Handle, Position, NodeResizer } from '@xyflow/react'

export interface MeshNodeData {
  label: string
  sublabel?: string
  meta?: string
  color: string
  isActive?: boolean
  isDim?: boolean
  initialDim?: boolean
}

export default function MeshNode({ data, selected }: { data: MeshNodeData; selected?: boolean }) {
  const { label, sublabel, meta, color, isActive, isDim, initialDim } = data
  const dim = isDim ?? initialDim ?? false

  return (
    <div
      style={{
        background: '#0f1626',
        border: `1.6px solid ${dim ? '#3d4a73' : color}`,
        borderRadius: 8,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: '6px 8px',
        opacity: dim ? 0.35 : 1,
        transition: 'opacity 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
        boxShadow: isActive ? `0 0 10px ${color}55` : 'none',
        position: 'relative',
      }}
    >
      <NodeResizer isVisible={selected} minWidth={60} minHeight={30} color="#39ff84" />
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      <span style={{
        color: dim ? '#5a6584' : color,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1.2,
        textAlign: 'center',
        transition: 'color 0.3s ease',
      }}>
        {label}
      </span>
      {sublabel && (
        <span style={{
          color: dim ? '#5a6584' : '#cdd5e8',
          fontSize: 9,
          lineHeight: 1.2,
          textAlign: 'center',
          transition: 'color 0.3s ease',
        }}>
          {sublabel}
        </span>
      )}
      {meta && (
        <span style={{
          color: dim ? '#5a6584' : '#a3aec9',
          fontSize: 9,
          lineHeight: 1.2,
          textAlign: 'center',
          transition: 'color 0.3s ease',
        }}>
          {meta}
        </span>
      )}
    </div>
  )
}
