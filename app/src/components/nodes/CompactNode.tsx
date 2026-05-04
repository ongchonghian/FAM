import { Handle, Position, NodeResizer } from '@xyflow/react'

export interface CompactNodeData {
  label: string
  sublabel?: string
  color: string
  isActive?: boolean
  isDim?: boolean
  initialDim?: boolean
}

export default function CompactNode({ data, selected }: { data: CompactNodeData; selected?: boolean }) {
  const { label, sublabel, color, isActive, isDim, initialDim } = data
  const dim = isDim ?? initialDim ?? false

  return (
    <div style={{
      background: '#1a2238',
      border: `1.4px solid ${dim ? '#3d4a73' : color}`,
      borderRadius: 6,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      padding: '3px 8px',
      opacity: dim ? 0.35 : 1,
      transition: 'opacity 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
      boxShadow: isActive ? `0 0 8px ${color}44` : 'none',
      position: 'relative',
    }}>
      <NodeResizer isVisible={selected} minWidth={60} minHeight={22} color="#39ff84" />
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      <span style={{
        color: dim ? '#5a6584' : color,
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1.2,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        transition: 'color 0.3s ease',
      }}>
        {label}
      </span>
      {sublabel && (
        <span style={{
          color: dim ? '#5a6584' : '#cdd5e8',
          fontSize: 8,
          lineHeight: 1.2,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          transition: 'color 0.3s ease',
        }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}
