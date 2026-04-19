import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../state/store.jsx'

function minutesUntilBedtime(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  const now = new Date()
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
  return Math.round((target.getTime() - now.getTime()) / 60000)
}

export default function BedtimeReminder() {
  const { state } = useStore()
  const [visible, setVisible] = useState(false)
  const shownRef = useRef(false)

  const enabled = state.featureFlags?.BEDTIME_ALERT_ENABLED
  const bedtime = state.sleepSchedule?.bedtime

  useEffect(() => {
    if (!enabled) return
    const tick = () => {
      const mins = minutesUntilBedtime(bedtime)
      if (mins === null) return
      if (mins <= 30 && mins >= 20 && !shownRef.current) {
        shownRef.current = true
        setVisible(true)
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try { new Notification('PARALLAX GATE :: REST PROTOCOL', { body: 'Optimal rest window opens in 30 minutes.' }) } catch {}
        }
      }
      // reset daily
      if (mins > 23 * 60) shownRef.current = false
    }
    const t = setInterval(tick, 60 * 1000)
    tick()
    return () => clearInterval(t)
  }, [enabled, bedtime])

  useEffect(() => {
    if (!enabled) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [enabled])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: 'fixed', bottom: 120, right: 20,
            padding: '18px 22px',
            border: '1px solid var(--rank-a)',
            background: 'rgba(5,6,10,0.95)',
            boxShadow: '0 0 32px var(--rank-a-glow)',
            zIndex: 65, minWidth: 320,
            fontFamily: 'var(--font-mono)'
          }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.25em', color: 'var(--rank-a)' }}>
            ◆ SLEEP PROTOCOL ALERT
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6 }}>
            WARNING: OPTIMAL REST WINDOW OPENS IN 30 MINUTES. HUNTER IS ADVISED TO BEGIN RECOVERY PROTOCOL.
          </div>
          <div style={{ marginTop: 14, textAlign: 'right' }}>
            <button onClick={() => setVisible(false)} style={{ color: 'var(--rank-a)', borderColor: 'var(--rank-a)' }}>
              ACKNOWLEDGED
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
