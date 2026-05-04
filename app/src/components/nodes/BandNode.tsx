import { NodeResizer, type NodeProps } from '@xyflow/react'

export default function BandNode({ data, selected }: NodeProps & { selected?: boolean }) {
  const { label, color } = data as { label: string; color: string }
  return (
    <>
      <NodeResizer isVisible={selected} minWidth={200} minHeight={80} color="#8a96b8" />
      <div style={{
        width: '100%', height: '100%',
        border: `1px solid ${color}`,
        borderRadius: 6,
        background: `${color}12`,
        pointerEvents: 'none',
        position: 'relative',
      }}>
        <span style={{
          position: 'absolute', top: 8, left: 12,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
          color, opacity: 1, textTransform: 'uppercase',
          textShadow: `0 0 12px ${color}80`,
        }}>
          {label}
        </span>
      </div>
    </>
  )
}
