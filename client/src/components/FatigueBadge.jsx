import React from 'react'

export default function FatigueBadge({ fatigue = 0, compact = false }) {
  if (fatigue < 50) return null
  const critical = fatigue >= 100
  const penalty  = fatigue >= 75
  const color = critical ? 'var(--rank-s)' : penalty ? 'var(--warn)' : 'var(--rank-a)'
  const label = critical ? 'CRITICAL FATIGUE' : penalty ? 'FATIGUE :: XP HALVED' : 'FATIGUED'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: compact ? '2px 6px' : '4px 10px',
      border: `1px solid ${color}`,
      color, fontSize: compact ? 9 : 10,
      letterSpacing: '0.18em',
      fontFamily: 'var(--font-display)',
      textShadow: `0 0 8px ${color}`,
      background: 'rgba(0,0,0,0.4)'
    }}>
      ⚠ {label} {fatigue}/100
    </div>
  )
}
