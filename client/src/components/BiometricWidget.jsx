import React from 'react'
import { motion } from 'framer-motion'
import { useStats } from '../state/statsStore.jsx'

const STATUS_COLOR = {
  ok: 'var(--ok)',
  stale: 'var(--rank-a)',
  offline: 'var(--warn)',
  loading: 'var(--sys-cyan)',
  idle: 'var(--text-muted)'
}

export default function BiometricWidget() {
  const { raw, status, lastSync } = useStats()
  const fb = raw?.fitbit || {}
  const lc = raw?.leetcode || {}

  const steps = fb.steps ?? 0
  const stepsPct = Math.min(100, (steps / 10000) * 100)
  const hr = fb.restingHeartRate
  const today = lc.submittedToday
  const streak = lc.streak ?? 0

  const anyConnected = fb.connected || lc.connected

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{
        position: 'fixed',
        bottom: 14, right: 14,
        minWidth: 280, maxWidth: 320,
        padding: 12,
        background: 'rgba(5,6,10,0.95)',
        border: '1px solid var(--border-mid)',
        zIndex: 40,
        fontFamily: 'var(--font-mono)',
        backdropFilter: 'blur(6px)'
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[status], boxShadow: `0 0 8px ${STATUS_COLOR[status]}` }}
          />
          <span style={{ fontSize: 9, letterSpacing: '0.25em', color: 'var(--text-secondary)' }}>
            BIOMETRIC MONITOR
          </span>
        </div>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
          {lastSync ? new Date(lastSync).toLocaleTimeString().slice(0, 5) : '--:--'}
        </span>
      </div>

      {!anyConnected && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
          NO DATA LINK — SYSTEM CFG TO CONNECT
        </div>
      )}

      {/* Steps progress */}
      {fb.connected && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-secondary)', marginBottom: 3 }}>
            <span>STEPS</span>
            <span style={{ color: stepsPct >= 100 ? 'var(--legendary)' : 'var(--text-primary)' }}>
              {steps.toLocaleString()} / 10K
            </span>
          </div>
          <div style={{ height: 5, border: '1px solid var(--border-dim)', background: 'rgba(0,0,0,0.4)' }}>
            <div style={{
              height: '100%', width: `${stepsPct}%`,
              background: stepsPct >= 100 ? 'var(--legendary)' : 'var(--sys-cyan)',
              boxShadow: stepsPct >= 100 ? '0 0 10px var(--legendary-glow)' : '0 0 8px var(--sys-cyan-glow)'
            }} />
          </div>
        </div>
      )}

      {/* HR + LC quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 10 }}>
        {fb.connected && (
          <div>
            <div style={{ color: 'var(--text-muted)', letterSpacing: '0.2em' }}>HR</div>
            <div style={{ color: hr ? 'var(--rank-d)' : 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 14 }}>
              {hr ?? '—'}
              <span style={{ fontSize: 8, color: 'var(--text-muted)', marginLeft: 2 }}>bpm</span>
            </div>
          </div>
        )}
        {lc.connected && (
          <>
            <div>
              <div style={{ color: 'var(--text-muted)', letterSpacing: '0.2em' }}>LC TODAY</div>
              <div style={{ color: today ? 'var(--ok)' : 'var(--warn)', fontFamily: 'var(--font-display)', fontSize: 14 }}>
                {today ? '✓' : '◇'}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', letterSpacing: '0.2em' }}>STREAK</div>
              <div style={{ color: streak >= 7 ? 'var(--rank-a)' : 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: 14 }}>
                {streak}D
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
