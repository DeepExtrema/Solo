import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../state/store.jsx'

const DISMISSAL_HOURS = 3 // re-show every 3h if still critical

export default function FatigueDebuffOverlay() {
  const { state, dismissFatigueOverlay } = useStore()

  const critical = state.debuffs?.some(d => d.severity === 'critical')
  const recentlyDismissed = state.fatigueOverlayDismissedAt &&
    (Date.now() - state.fatigueOverlayDismissedAt < DISMISSAL_HOURS * 3600 * 1000)

  const visible = critical && !recentlyDismissed

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="fatigue-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'grid', placeItems: 'center' }}>
          <div className="crack-overlay" />
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            style={{
              position: 'relative', zIndex: 2,
              padding: 44, maxWidth: 640,
              border: '2px solid var(--rank-s)',
              background: 'rgba(5,0,0,0.85)',
              boxShadow: '0 0 60px var(--rank-s-glow)',
              textAlign: 'center'
            }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 18,
              letterSpacing: '0.32em', color: 'var(--rank-s)',
              textShadow: '0 0 18px var(--rank-s-glow)'
            }}>
              ✖ CRITICAL FATIGUE STATUS ACTIVE ✖
            </div>
            <div style={{
              fontSize: 12, color: 'var(--text-secondary)',
              lineHeight: 1.7, marginTop: 18, fontStyle: 'italic'
            }}>
              HUNTER {state.hunterName} IS OPERATING BELOW SAFE PARAMETERS.<br/>
              IMMEDIATE REST REQUIRED.
            </div>
            <div style={{ marginTop: 26 }}>
              <button onClick={dismissFatigueOverlay}
                style={{ color: 'var(--rank-s)', borderColor: 'var(--rank-s)' }}>
                ACKNOWLEDGED
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
