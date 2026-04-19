import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../state/store.jsx'

function Box({ side, onPick, shattering }) {
  return (
    <motion.div
      className={shattering ? 'box-shatter' : 'box-rise'}
      whileHover={!shattering ? { scale: 1.05 } : {}}
      onClick={!shattering ? () => onPick(side) : undefined}
      style={{
        width: 180, height: 220,
        border: '2px solid var(--sys-cyan)',
        background: 'radial-gradient(circle at 50% 30%, rgba(94,225,255,0.15), rgba(0,0,0,0.8))',
        boxShadow: '0 0 40px var(--sys-cyan-glow), inset 0 0 30px rgba(94,225,255,0.12)',
        display: 'grid', placeItems: 'center',
        cursor: shattering ? 'default' : 'pointer',
        position: 'relative'
      }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 72,
        color: 'var(--legendary)',
        textShadow: '0 0 30px var(--legendary-glow)'
      }}>?</div>
      <div style={{ position: 'absolute', bottom: 10, fontSize: 9, letterSpacing: '0.3em', color: 'var(--text-muted)' }}>
        {side.toUpperCase()}
      </div>
    </motion.div>
  )
}

export default function RewardBoxOverlay() {
  const { state, openLootBox, clearLootResult } = useStore()
  const [shattering, setShattering] = useState(null) // 'left'|'right'

  const box = state.pendingLootBox
  const result = state._lootResult

  const pick = (side) => {
    setShattering(side)
    setTimeout(() => {
      openLootBox(side)
      setShattering(null)
    }, 800)
  }

  if (!box && !result) return null

  return (
    <AnimatePresence>
      <motion.div
        key="lootbox-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 80,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(10px)',
          display: 'grid', placeItems: 'center'
        }}>
        <div style={{ textAlign: 'center', maxWidth: 720 }}>
          {!result && (
            <>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 14,
                letterSpacing: '0.3em', color: 'var(--legendary)',
                textShadow: '0 0 18px var(--legendary-glow)', marginBottom: 12
              }}>
                ◆ DAILY PROTOCOL COMPLETE ◆
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '0.2em', marginBottom: 32 }}>
                EXCEPTIONAL PERFORMANCE DETECTED :: SELECT YOUR REWARD
              </div>
              <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
                <Box side="left"  onPick={pick} shattering={shattering === 'left'} />
                <Box side="right" onPick={pick} shattering={shattering === 'right'} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.25em', marginTop: 30 }}>
                ONE REWARD. ONE CHOICE. THE SYSTEM WATCHES.
              </div>
            </>
          )}

          {result && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 160 }}
              style={{ padding: 40, border: `2px solid ${result.kind === 'BLESSED' ? 'var(--legendary)' : 'var(--rank-s)'}`,
                       boxShadow: `0 0 50px ${result.kind === 'BLESSED' ? 'var(--legendary-glow)' : 'var(--rank-s-glow)'}`,
                       background: 'rgba(0,0,0,0.7)' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 12,
                letterSpacing: '0.3em',
                color: result.kind === 'BLESSED' ? 'var(--legendary)' : 'var(--rank-s)',
                textShadow: `0 0 14px ${result.kind === 'BLESSED' ? 'var(--legendary-glow)' : 'var(--rank-s-glow)'}`
              }}>
                {result.kind === 'BLESSED' ? '◆ BLESSED ◆' : '✖ CURSED ✖'}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, marginTop: 14,
                color: result.kind === 'BLESSED' ? 'var(--legendary)' : 'var(--text-primary)',
                textShadow: result.kind === 'BLESSED' ? '0 0 18px var(--legendary-glow)' : 'none'
              }}>
                {result.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 18, letterSpacing: '0.2em' }}>
                {result.kind === 'BLESSED'
                  ? 'THE SYSTEM REWARDS PERSEVERANCE.'
                  : 'THE SYSTEM TESTS YOUR RESOLVE.'}
              </div>
              <div style={{ marginTop: 28 }}>
                <button onClick={clearLootResult}
                  style={{ color: result.kind === 'BLESSED' ? 'var(--legendary)' : 'var(--rank-s)',
                           borderColor: result.kind === 'BLESSED' ? 'var(--legendary)' : 'var(--rank-s)' }}>
                  ACKNOWLEDGED
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
