import React from 'react'
import { motion } from 'framer-motion'
import { gradeOf } from '../data/sleep.js'

export default function RecoveryGauge({ score = 0, size = 260 }) {
  const grade = gradeOf(score)
  const cx = size / 2, cy = size / 2
  const r = (size / 2) - 18
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100)

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="rg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={grade.color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={grade.color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#rg-grad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 14px ${grade.color})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
        textAlign: 'center'
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 900,
            color: grade.color, textShadow: `0 0 24px ${grade.color}`, lineHeight: 1
          }}>{score}</div>
          <div style={{
            fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-muted)', marginTop: 6
          }}>RECOVERY / 100</div>
          <div style={{
            marginTop: 10, fontFamily: 'var(--font-display)', fontSize: 12,
            letterSpacing: '0.22em', color: grade.color
          }}>{grade.label}</div>
        </div>
      </div>
    </div>
  )
}
