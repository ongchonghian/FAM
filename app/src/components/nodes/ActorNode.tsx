import { Handle, Position, NodeResizer } from '@xyflow/react'

export interface ActorNodeData {
  label: string
  sublabel?: string
  color: string
  isActive?: boolean
  isDim?: boolean
}

export default function ActorNode({ data, selected }: { data: ActorNodeData; selected?: boolean }) {
  const { label, sublabel, color, isActive, isDim } = data

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <NodeResizer isVisible={selected} keepAspectRatio minWidth={40} minHeight={40} color="#39ff84" />
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: '#1a2238',
        border: `2px solid ${isDim ? '#3d4a73' : color}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        opacity: isDim ? 0.35 : 1,
        transition: 'opacity 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
        boxShadow: isActive ? `0 0 10px ${color}55` : 'none',
      }}>
        <span style={{
          color: isDim ? '#5a6584' : '#e8edf7',
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1.2,
          textAlign: 'center',
          transition: 'color 0.3s ease',
        }}>
          {label}
        </span>
        {sublabel && (
          <span style={{
            color: isDim ? '#5a6584' : '#cdd5e8',
            fontSize: 9,
            lineHeight: 1.2,
            textAlign: 'center',
            transition: 'color 0.3s ease',
          }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
