import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../state/store.jsx'
import { useStats } from '../state/statsStore.jsx'
import { JOB_CHANGE_TASKS, CLASSES, JOB_CHANGE_WINDOW_MS } from '../data/classes.js'

export default function JobChangeOverlay() {
  const { state, acceptJobChange, seenJobOffer, updateJobProgress } = useStore()
  const { baseStats } = useStats()
  const [expanded, setExpanded] = useState(false)
  const jc = state.jobChange

  if (!state.featureFlags?.JOB_CHANGE_ENABLED) return null

  // Offer full-screen only on first view
  if (jc?.status === 'offered' && !jc.offeredSeen) {
    return (
      <AnimatePresence>
        <motion.div
          key="jc-offer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 88,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(14px)',
            display: 'grid', placeItems: 'center'
          }}>
          <motion.div
            initial={{ y: 30, scale: 0.95 }} animate={{ y: 0, scale: 1 }}
            style={{
              padding: 50, maxWidth: 720,
              border: '2px solid var(--legendary)',
              boxShadow: '0 0 60px var(--legendary-glow)',
              background: 'rgba(5,6,10,0.92)', textAlign: 'center'
            }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 16,
              letterSpacing: '0.35em', color: 'var(--legendary)',
              textShadow: '0 0 22px var(--legendary-glow)'
            }}>
              ◆ JOB CHANGE QUEST UNLOCKED ◆
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 18, fontStyle: 'italic' }}>
              THE SYSTEM HAS DETECTED SUFFICIENT GROWTH.<br/>
              A TRIAL AWAITS. ACCEPT, OR REMAIN CLASSLESS.<br/>
              <span style={{ color: 'var(--text-muted)' }}>72 HOURS :: THREE OBJECTIVES :: ONE CLASS</span>
            </div>
            <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={acceptJobChange}
                style={{ color: 'var(--legendary)', borderColor: 'var(--legendary)',
                         boxShadow: '0 0 18px var(--legendary-glow)', padding: '10px 24px' }}>
                ◆ ACCEPT
              </button>
              <button onClick={seenJobOffer}>REMAIN CLASSLESS</button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Active trial: show a collapsible floating tracker
  if (jc?.status !== 'active') return null
  const remaining = Math.max(0, jc.deadline - Date.now())
  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  const totalDone = JOB_CHANGE_TASKS.every(t => (jc.progress[t.key] || 0) >= t.target)

  return (
    <div style={{
      position: 'fixed', top: 90, right: 14, zIndex: 45,
      width: expanded ? 340 : 180,
      border: '1px solid var(--legendary)',
      background: 'rgba(5,6,10,0.95)',
      boxShadow: '0 0 24px var(--legendary-glow)',
      fontFamily: 'var(--font-mono)'
    }}>
      <div onClick={() => setExpanded(!expanded)}
        style={{
          padding: '8px 12px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.2em',
          color: 'var(--legendary)'
        }}>
        <span>◆ JOB TRIAL</span>
        <span style={{ color: 'var(--warn)' }}>{hours}h {minutes}m</span>
      </div>
      {expanded && (
        <div style={{ padding: 12 }}>
          {JOB_CHANGE_TASKS.map(t => {
            const v = jc.progress[t.key] || 0
            const pct = Math.min(100, (v / t.target) * 100)
            return (
              <div key={t.key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.15em', marginBottom: 4 }}>
                  {t.label} <span style={{ color: 'var(--legendary)' }}>({v}/{t.target})</span>
                </div>
                <div style={{ height: 5, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-dim)' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--legendary)', boxShadow: '0 0 10px var(--legendary-glow)' }} />
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <button style={{ padding: '4px 10px', fontSize: 9 }}
                    onClick={() => updateJobProgress(t.key, 1, baseStats)}>+1</button>
                  {t.target > 1 && (
                    <button style={{ padding: '4px 10px', fontSize: 9 }}
                      onClick={() => updateJobProgress(t.key, 5, baseStats)}>+5</button>
                  )}
                </div>
              </div>
            )
          })}
          {totalDone && (
            <div style={{ fontSize: 10, color: 'var(--ok)', marginTop: 6, letterSpacing: '0.2em' }}>
              ◆ TRIAL COMPLETE — CLASS DERIVED ON NEXT PROGRESS TICK
            </div>
          )}
        </div>
      )}
    </div>
  )
}
