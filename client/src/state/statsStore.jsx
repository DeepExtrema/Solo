import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { computeStats } from '../data/stats.js'
import { apiUrl } from '../lib/apiBase.js'

const POLL_MS = 15 * 60 * 1000 // 15 minutes
const YESTERDAY_KEY = 'parallax-gate::stats-yesterday'
const STALE_MS = 30 * 60 * 1000 // after 30 min without a successful sync, show yellow

const StatsCtx = createContext(null)

function readYesterday() {
  try { return JSON.parse(localStorage.getItem(YESTERDAY_KEY) || 'null') } catch { return null }
}
function writeYesterday(obj) {
  try { localStorage.setItem(YESTERDAY_KEY, JSON.stringify(obj)) } catch {}
}

export function StatsProvider({ chaBonus = 0, children, onAutoQuest }) {
  const [raw, setRaw]           = useState({ fitbit: null, leetcode: null })
  const [health, setHealth]     = useState(null)
  const [lastSync, setLastSync] = useState(null)
  const [status, setStatus]     = useState('idle') // idle | loading | ok | stale | offline
  const onAutoQuestRef = useRef(onAutoQuest)
  useEffect(() => { onAutoQuestRef.current = onAutoQuest }, [onAutoQuest])

  const refreshHealth = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/api/health'))
      if (!r.ok) throw new Error('health ' + r.status)
      const j = await r.json()
      setHealth(j)
      return j
    } catch (e) {
      setHealth({ ok: false, error: e.message })
      return null
    }
  }, [])

  const refreshStats = useCallback(async (force = false) => {
    setStatus('loading')
    try {
      const url = force ? apiUrl('/api/stats/force-sync') : apiUrl('/api/stats')
      const r = await fetch(url, { method: force ? 'POST' : 'GET' })
      if (!r.ok) throw new Error('stats ' + r.status)
      const j = await r.json()
      setRaw(j)
      setLastSync(new Date().toISOString())
      setStatus('ok')
      triggerAutoQuests(j)
      return j
    } catch (e) {
      setStatus('offline')
      return null
    }
  }, [])

  function triggerAutoQuests(j) {
    const cb = onAutoQuestRef.current
    if (!cb) return
    if (j?.leetcode?.submittedToday) cb('d1')
  }

  // Initial load + polling
  useEffect(() => {
    refreshHealth()
    refreshStats(false)
    const t = setInterval(() => refreshStats(false), POLL_MS)
    return () => clearInterval(t)
  }, [refreshHealth, refreshStats])

  // Persist yesterday for trend
  useEffect(() => {
    if (status !== 'ok' || !raw?.fitbit) return
    const today = new Date().toISOString().slice(0, 10)
    const prev = readYesterday()
    if (!prev || prev.date !== today) {
      // Rotate: make "today" into "yesterday" at day boundary, but only after at least one successful fetch
      if (prev && prev.date) {
        // Keep prev as yesterday reference
      } else {
        writeYesterday({ date: today, stats: computeStats({ ...raw, chaBonus }) })
      }
    }
  }, [raw, chaBonus, status])

  // Stale detection (if last sync > STALE_MS)
  useEffect(() => {
    if (!lastSync) return
    const t = setInterval(() => {
      const age = Date.now() - new Date(lastSync).getTime()
      if (age > STALE_MS) setStatus(s => s === 'ok' ? 'stale' : s)
    }, 60 * 1000)
    return () => clearInterval(t)
  }, [lastSync])

  const stats    = useMemo(() => computeStats({ ...raw, chaBonus }), [raw, chaBonus])
  const yesterday = readYesterday()
  const trends = useMemo(() => {
    if (!yesterday?.stats) return {}
    const out = {}
    for (const k of Object.keys(stats)) {
      const diff = stats[k] - (yesterday.stats[k] ?? 0)
      out[k] = diff > 1 ? 'up' : diff < -1 ? 'down' : 'flat'
    }
    return out
  }, [stats, yesterday])

  const api = useMemo(() => ({
    raw, stats, trends,
    health, refreshHealth,
    status, lastSync,
    refresh: (force = true) => refreshStats(force)
  }), [raw, stats, trends, health, status, lastSync, refreshHealth, refreshStats])

  return <StatsCtx.Provider value={api}>{children}</StatsCtx.Provider>
}

export function useStats() {
  const v = useContext(StatsCtx)
  if (!v) throw new Error('useStats outside provider')
  return v
}
