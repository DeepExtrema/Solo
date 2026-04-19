import React from 'react'
import { scheduleStatusLabel } from '../data/sleep.js'

// Renders a 24h timeline (0..24) with target + actual sleep windows overlaid.
export default function SleepWindowBar({ tonight, schedule }) {
  const W = 560, H = 46
  const leftPad = 8, rightPad = 8
  const track = W - leftPad - rightPad

  // Target window: normalize bedtime..wake, crossing midnight
  const [tbH, tbM] = (schedule?.bedtime || '23:30').split(':').map(Number)
  const [twH, twM] = (schedule?.wake || '07:00').split(':').map(Number)
  const tbStart = tbH + tbM / 60
  const tbEnd   = twH + twM / 60 + (twH + twM / 60 <= tbH + tbM / 60 ? 24 : 0)

  // Actual sleep window — handle three cases:
  //   1) normal overnight sleep (bedtime 21-02h)  -> shift bedtime hours -24
  //   2) late-night sleep (bedtime 03-10h)        -> leave hours as-is, no penalty
  //   3) any other                                 -> render as-is
  let actualStart = null, actualEnd = null
  const status = tonight?.scheduleStatus
  if (tonight?.recorded && tonight.startTime && tonight.endTime) {
    const s = new Date(tonight.startTime)
    const e = new Date(tonight.endTime)
    actualStart = s.getHours() + s.getMinutes() / 60
    actualEnd   = e.getHours() + e.getMinutes() / 60
    if (status !== 'late_night' && actualStart > 12) {
      // overnight sleep started last evening — shift to negative hours
      actualStart = actualStart - 24
      if (actualEnd > 12) actualEnd = actualEnd - 24
    }
  }

  const barColor =
    status === 'on_schedule' ? 'var(--ok)' :
    status === 'late_night'  ? 'var(--sys-cyan)' :
    'var(--warn)'

  // Render: x range -6..24 (shift by +6). Width maps 30 hours.
  const shifted = (h) => leftPad + ((h + 6) / 30) * track
  const H_TICKS = [-6, -3, 0, 3, 6, 9, 12, 15, 18, 21, 24]

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <rect x={leftPad} y={20} width={track} height={12} fill="rgba(0,0,0,0.5)" stroke="var(--border-dim)" strokeWidth="1" />

      {/* Target window */}
      <rect
        x={shifted(tbStart > 12 ? tbStart - 24 : tbStart)}
        y={20}
        width={shifted(tbEnd > 12 ? tbEnd - 24 : tbEnd) - shifted(tbStart > 12 ? tbStart - 24 : tbStart)}
        height={12}
        fill="var(--sys-cyan)"
        opacity="0.25"
        stroke="var(--sys-cyan)"
        strokeDasharray="3 3"
      />

      {/* Actual window */}
      {actualStart !== null && (
        <rect
          x={shifted(actualStart)}
          y={20}
          width={Math.max(4, shifted(actualEnd) - shifted(actualStart))}
          height={12}
          fill={barColor}
          opacity="0.85"
          style={{ filter: `drop-shadow(0 0 8px ${barColor})` }}
        />
      )}

      {/* Hour ticks */}
      {H_TICKS.map(h => (
        <g key={h}>
          <line x1={shifted(h)} x2={shifted(h)} y1={14} y2={20} stroke="var(--border-dim)" />
          <text x={shifted(h)} y={10} fontSize="8" textAnchor="middle" fill="var(--text-muted)" letterSpacing="0.15em">
            {h < 0 ? (24 + h) + 'h-1' : h === 24 ? '0h+1' : h + 'h'}
          </text>
        </g>
      ))}

      <text x={leftPad} y={H - 2} fontSize="9" fill={actualStart === null ? 'var(--text-muted)' : barColor} letterSpacing="0.2em">
        {actualStart === null ? '— NO SLEEP RECORDED' : scheduleStatusLabel(status || 'off_schedule')}
      </text>
    </svg>
  )
}
