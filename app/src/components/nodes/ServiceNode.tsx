import { Handle, Position } from '@xyflow/react'

export interface ServiceNodeData {
  label: string
  sublabel?: string
  meta?: string
  color: string
  isActive?: boolean
  isDim?: boolean
}

export default function ServiceNode({ data }: { data: ServiceNodeData }) {
  const { label, sublabel, meta, color, isActive, isDim } = data

  return (
    <div style={{
      background: '#1a2238',
      border: `1.8px solid ${isDim ? '#3d4a73' : color}`,
      borderRadius: 8,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      padding: '6px 10px',
      opacity: isDim ? 0.35 : 1,
      transition: 'opacity 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
      boxShadow: isActive ? `0 0 12px ${color}55` : 'none',
      position: 'relative',
    }}>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />

      <span style={{
        color: isDim ? '#5a6584' : color,
        fontSize: 12,
        fontWeight: 700,
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
      {meta && (
        <span style={{
          color: isDim ? '#5a6584' : '#a3aec9',
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
