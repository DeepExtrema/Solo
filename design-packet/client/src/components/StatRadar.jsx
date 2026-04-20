import React from 'react'
import { STAT_KEYS, STATS } from '../data/stats.js'

// Hexagonal radar plot of the six stats.
export default function StatRadar({ stats, size = 260 }) {
  const cx = size / 2, cy = size / 2
  const R = size / 2 - 28
  const angleFor = i => (Math.PI * 2 * i / 6) - Math.PI / 2

  const gridLevels = [0.25, 0.5, 0.75, 1]

  function polygon(fn) {
    return STAT_KEYS.map((k, i) => {
      const r = fn(k, i)
      const a = angleFor(i)
      return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`
    }).join(' ')
  }

  return (
    <svg width={size} height={size}>
      <defs>
        <filter id="radar-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {gridLevels.map((lv, i) => (
        <polygon key={i}
          points={polygon(() => R * lv)}
          fill="none"
          stroke="var(--border-mid)"
          strokeOpacity={0.35}
          strokeDasharray={i < 3 ? '2 4' : '0'}
        />
      ))}

      {STAT_KEYS.map((k, i) => {
        const a = angleFor(i)
        return (
          <line key={k}
            x1={cx} y1={cy}
            x2={cx + Math.cos(a) * R}
            y2={cy + Math.sin(a) * R}
            stroke="var(--border-dim)" strokeOpacity={0.5}
          />
        )
      })}

      {/* Fill */}
      <polygon
        points={polygon(k => R * ((stats[k] ?? 0) / 100))}
        fill="var(--rank-color)"
        fillOpacity={0.18}
        stroke="var(--rank-color)"
        strokeWidth="1.5"
        filter="url(#radar-glow)"
      />

      {/* Vertex markers */}
      {STAT_KEYS.map((k, i) => {
        const def = STATS[k]
        const a = angleFor(i)
        const r = R * ((stats[k] ?? 0) / 100)
        const lx = cx + Math.cos(a) * (R + 18)
        const ly = cy + Math.sin(a) * (R + 18)
        return (
          <g key={k}>
            <circle cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r="3.5"
              fill={def.color} stroke="white" strokeOpacity="0.3" strokeWidth="0.5"
              filter="url(#radar-glow)"
            />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
              fill={def.color}
              style={{ fontFamily: 'Orbitron, monospace', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em' }}>
              {def.name.slice(0, 3)}
            </text>
            <text x={lx} y={ly + 12} textAnchor="middle" dominantBaseline="central"
              fill="var(--text-muted)"
              style={{ fontSize: 9, letterSpacing: '0.1em' }}>
              {Math.round(stats[k] ?? 0)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
