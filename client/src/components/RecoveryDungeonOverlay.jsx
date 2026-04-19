import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../state/store.jsx'

export default function RecoveryDungeonOverlay() {
  const { state } = useStore()
  const active = state.recoveryDungeon?.active
  if (!active) return null
  const done = state.recoveryDungeon.nightsCompleted
  const need = state.recoveryDungeon.nightsRequired

  return (
    <AnimatePresence>
      <motion.div
        key="recovery-dungeon"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'fixed', bottom: 20, left: 20,
          maxWidth: 360, padding: 16,
          border: '1px solid var(--warn)',
          background: 'rgba(5,6,10,0.95)',
          boxShadow: '0 0 30px rgba(239,68,68,0.4)',
          zIndex: 55
        }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 12,
          letterSpacing: '0.3em', color: 'var(--warn)'
        }}>
          ◆ MANDATORY RECOVERY DUNGEON
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6 }}>
          Hunter cannot advance in a compromised state. Rest 8+ hours for two consecutive nights to restore operating parameters.
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
          {Array.from({ length: need }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 8,
              background: i < done ? 'var(--ok)' : 'rgba(0,0,0,0.5)',
              border: '1px solid var(--border-dim)',
              boxShadow: i < done ? '0 0 10px var(--ok)' : 'none'
            }} />
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, letterSpacing: '0.2em' }}>
          {done}/{need} NIGHTS RESTORED :: XP LOCKED UNTIL COMPLETE
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
