import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { applyDebuffs, computeStats, isAllStatPlayer } from '../data/stats.js'
import { computeRecoveryScore, debuffsForScore, fatigueDelta } from '../data/sleep.js'
import { apiUrl } from '../lib/apiBase.js'
import { useStore } from './store.jsx'

const POLL_MS = 15 * 60 * 1000
const SLEEP_POLL_MS = 30 * 60 * 1000
const YESTERDAY_KEY = 'parallax-gate::stats-yesterday'
const STALE_MS = 30 * 60 * 1000

const StatsCtx = createContext(null)

function readYesterday() {
  try { return JSON.parse(localStorage.getItem(YESTERDAY_KEY) || 'null') } catch { return null }
}
function writeYesterday(obj) {
  try { localStorage.setItem(YESTERDAY_KEY, JSON.stringify(obj)) } catch {}
}

export function StatsProvider({ chaBonus = 0, children, onAutoQuest }) {
  const { state: gameState, applySleepNight, unlockAllStat } = useStore()
  const [raw, setRaw]           = useState({ fitbit: null, leetcode: null })
  const [sleep, setSleep]       = useState(null)
  const [health, setHealth]     = useState(null)
  const [lastSync, setLastSync] = useState(null)
  const [status, setStatus]     = useState('idle')
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

  const refreshSleep = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/api/sleep'))
      if (!r.ok) throw new Error('sleep ' + r.status)
      const j = await r.json()
      setSleep(j)
      return j
    } catch {
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
    refreshSleep()
    const t1 = setInterval(() => refreshStats(false), POLL_MS)
    const t2 = setInterval(refreshSleep, SLEEP_POLL_MS)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [refreshHealth, refreshStats, refreshSleep])

  // Apply nightly sleep score / debuffs once per date
  useEffect(() => {
    if (!sleep?.connected || !sleep.tonight || !sleep.tonight.recorded) return
    const night = sleep.tonight
    const { score } = computeRecoveryScore(night, gameState.sleepSchedule)
    if (gameState.lastSleepApplied === night.date) return

    const debuffs = gameState.featureFlags.SLEEP_PROTOCOL_ENABLED ? debuffsForScore(score) : []
    const fDelta  = gameState.featureFlags.SLEEP_PROTOCOL_ENABLED ? fatigueDelta(score)  : 0
    applySleepNight({ night, score, debuffs, fatigueDelta: fDelta })

    if ((night.totalMinutesAsleep ?? 0) >= 420) {
      const cb = onAutoQuestRef.current
      if (cb) cb('d5', { bonusXp: score >= 75 ? 10 : 0 })
    }
  }, [sleep, gameState.sleepSchedule, gameState.lastSleepApplied, gameState.featureFlags.SLEEP_PROTOCOL_ENABLED, applySleepNight])

  // Persist yesterday snapshot
  useEffect(() => {
    if (status !== 'ok' || !raw?.fitbit) return
    const today = new Date().toISOString().slice(0, 10)
    const prev = readYesterday()
    if (!prev || prev.date !== today) {
      if (!prev) writeYesterday({ date: today, stats: computeStats({ ...raw, chaBonus }) })
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

  const baseStats = useMemo(() => computeStats({ ...raw, chaBonus }), [raw, chaBonus])

  const damper = gameState.classKey === 'IRON' ? { stats: ['STR', 'VIT'], factor: 0.5 } : null
  const { stats: debuffed, byStat: debuffByStat } = useMemo(
    () => applyDebuffs(baseStats, gameState.debuffs || [], damper),
    [baseStats, gameState.debuffs, damper]
  )
  const stats = useMemo(() => {
    const boost = gameState.inventory?.tokens?.statBoost
    if (!boost || boost.expiresAt < Date.now()) return debuffed
    return { ...debuffed, [boost.stat]: Math.min(100, (debuffed[boost.stat] ?? 0) + boost.amount) }
  }, [debuffed, gameState.inventory?.tokens?.statBoost])

  // All-Stat Hunter detection
  useEffect(() => {
    if (!gameState.allStatUnlocked && isAllStatPlayer(stats, 60)) unlockAllStat()
  }, [stats, gameState.allStatUnlocked, unlockAllStat])

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
    raw, baseStats, stats, debuffByStat, trends,
    sleep, refreshSleep,
    health, refreshHealth,
    status, lastSync,
    refresh: (force = true) => refreshStats(force)
  }), [raw, baseStats, stats, debuffByStat, trends, sleep, refreshSleep, health, status, lastSync, refreshHealth, refreshStats])

  return <StatsCtx.Provider value={api}>{children}</StatsCtx.Provider>
}

export function useStats() {
  const v = useContext(StatsCtx)
  if (!v) throw new Error('useStats outside provider')
  return v
}
