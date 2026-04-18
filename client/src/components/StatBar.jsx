import React from 'react'
import { motion } from 'framer-motion'
import { STATS, stateOf } from '../data/stats.js'

const ARROW = { up: '▲', down: '▼', flat: '▬' }
const ARROW_COLOR = { up: 'var(--ok)', down: 'var(--warn)', flat: 'var(--text-muted)' }

export default function StatBar({ statKey, value, trend, source, onClick }) {
  const def = STATS[statKey]
  const state = stateOf(value)
  const pct = Math.max(2, Math.min(100, value))
  const isSub20 = value < 20

  return (
    <div
      onClick={onClick}
      style={{
        padding: 12,
        border: `1px solid ${state === 'high' ? def.color : (state === 'cold' ? 'var(--border-dim)' : 'var(--border-mid)')}`,
        background: 'rgba(0,0,0,0.35)',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: state === 'high' ? `0 0 18px ${def.glow}` : 'none',
        opacity: isSub20 ? 0.7 : 1,
        transition: 'all 200ms var(--ease-out)',
        position: 'relative'
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.2em',
            color: def.color, textShadow: state === 'high' ? `0 0 10px ${def.glow}` : 'none', fontSize: 14
          }}>
            {def.name}
          </span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 9, letterSpacing: '0.25em' }}>
            {def.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="tag" style={{
            fontSize: 9, color: source?.connected ? 'var(--ok)' : 'var(--warn)',
            borderColor: source?.connected ? 'var(--ok)' : 'var(--warn)'
          }}>
            {def.source === 'QUEST' ? 'QUEST-BASED' : `${def.source} ${source?.connected ? 'LIVE' : 'OFFLINE'}`}
          </span>
          {trend && <span style={{ color: ARROW_COLOR[trend], fontSize: 12 }}>{ARROW[trend]}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900,
          color: def.color, textShadow: state === 'high' ? `0 0 14px ${def.glow}` : 'none',
          minWidth: 54, textAlign: 'right'
        }}>
          {Math.round(value)}
        </div>
        <div style={{ flex: 1, height: 10, background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border-dim)', position: 'relative' }}>
          <motion.div
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', damping: 22, stiffness: 90 }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${def.color} 0%, rgba(255,255,255,0.5) 50%, ${def.color} 100%)`,
              backgroundSize: '200% 100%',
              animation: state === 'high' ? 'shimmer 2.4s linear infinite' : 'none',
              boxShadow: state === 'high' ? `0 0 14px ${def.glow}` : 'none'
            }}
          />
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.2em', minWidth: 36, textAlign: 'right' }}>
          / 100
        </div>
      </div>

      {def.source !== 'QUEST' && source?.lastUpdated && (
        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.2em', marginTop: 6 }}>
          SYNC :: {new Date(source.lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
