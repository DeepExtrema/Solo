import React from 'react'
import { gradeOf } from '../data/sleep.js'

const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// history[] newest first, up to 7. Displays OLDEST → NEWEST left → right.
export default function SleepHistoryChart({ history = [] }) {
  const slots = Array.from({ length: 7 }, (_, i) => history[6 - i]) // reversed
  const W = 420, H = 120
  const barW = (W - 12) / 7 - 6
  const maxScore = 100

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 28}`} style={{ display: 'block' }}>
      {/* baseline */}
      <line x1={0} x2={W} y1={H} y2={H} stroke="var(--border-dim)" strokeWidth="1" />

      {slots.map((n, i) => {
        const x = 6 + i * (barW + 6)
        const score = n?.score ?? 0
        const grade = n ? gradeOf(score) : null
        const h = n ? (score / maxScore) * (H - 8) : 0
        const y = H - h
        const dayLabel = n ? DAY_ABBR[new Date(n.date + 'T00:00:00').getDay()] : '—'
        return (
          <g key={i}>
            {n ? (
              <rect
                x={x} y={y} width={barW} height={h}
                fill={grade.color}
                opacity="0.85"
                style={{ filter: `drop-shadow(0 0 8px ${grade.color})` }}
              />
            ) : (
              <rect x={x} y={H - 4} width={barW} height={4} fill="var(--border-dim)" />
            )}
            <text
              x={x + barW / 2} y={H + 14}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="9"
              fontFamily="var(--font-display)"
              letterSpacing="0.2em"
            >{dayLabel}</text>
            {n && (
              <text
                x={x + barW / 2} y={y - 4}
                textAnchor="middle"
                fill={grade.color}
                fontSize="10"
                fontFamily="var(--font-display)"
                fontWeight="700"
              >{score}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
