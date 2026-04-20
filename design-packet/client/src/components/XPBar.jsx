import React from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../state/store.jsx'
import { rankProgress } from '../data/ranks.js'

export default function XPBar({ height = 12 }) {
  const { state } = useStore()
  const p = rankProgress(state.xp)

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 10, letterSpacing: '0.2em',
        color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase'
      }}>
        <span>RANK {p.current.key} :: {p.current.title}</span>
        {p.next ? (
          <span>{p.within} / {p.span} XP → {p.next.key}</span>
        ) : (
          <span>MAX RANK ACHIEVED</span>
        )}
      </div>
      <div style={{
        height, width: '100%',
        border: '1px solid var(--border-mid)',
        background: 'rgba(0,0,0,0.5)',
        position: 'relative', overflow: 'hidden'
      }}>
        <motion.div
          initial={false}
          animate={{ width: `${p.pct * 100}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--rank-color) 0%, rgba(255,255,255,0.4) 50%, var(--rank-color) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s linear infinite',
            boxShadow: '0 0 18px var(--rank-glow), inset 0 0 8px rgba(255,255,255,0.3)'
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(90deg, transparent 0, transparent 22px, rgba(0,0,0,0.25) 22px, rgba(0,0,0,0.25) 23px)',
          pointerEvents: 'none'
        }} />
      </div>
    </div>
  )
}
