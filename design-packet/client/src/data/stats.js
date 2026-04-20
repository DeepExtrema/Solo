// Six hunter attributes, each mapped to a real data source.

export const STAT_KEYS = ['STR', 'VIT', 'INT', 'AGI', 'SEN', 'CHA']

export const STATS = {
  STR: {
    key: 'STR',
    name: 'STRENGTH',
    label: 'PHYSICAL CONDITIONING',
    source: 'FITBIT',
    color: 'var(--rank-s)',       // crimson
    glow: 'var(--rank-s-glow)',
    flavor: 'Iron forged in motion. The body is the first weapon.'
  },
  VIT: {
    key: 'VIT',
    name: 'VITALITY',
    label: 'ENDURANCE & RECOVERY',
    source: 'FITBIT',
    color: 'var(--rank-d)',       // green
    glow: 'var(--rank-d-glow)',
    flavor: 'Recovery is a hunter\'s inheritance. Rest is strategy.'
  },
  INT: {
    key: 'INT',
    name: 'INTELLIGENCE',
    label: 'TECHNICAL COMBAT POWER',
    source: 'LEETCODE',
    color: 'var(--rank-c)',       // blue
    glow: 'var(--rank-c-glow)',
    flavor: 'The mind that solves the maze faster than the maze can change.'
  },
  AGI: {
    key: 'AGI',
    name: 'AGILITY',
    label: 'EXECUTION SPEED',
    source: 'LEETCODE',
    color: 'var(--sys-cyan)',     // cyan
    glow: 'var(--sys-cyan-glow)',
    flavor: 'Cadence. Consistency. The reflex of shipping daily.'
  },
  SEN: {
    key: 'SEN',
    name: 'SENSE',
    label: 'SITUATIONAL AWARENESS',
    source: 'FITBIT',
    color: 'var(--legendary)',    // gold
    glow: 'var(--legendary-glow)',
    flavor: 'The hunter who walks the world sees the world\'s moves.'
  },
  CHA: {
    key: 'CHA',
    name: 'CHARISMA',
    label: 'COMMAND PRESENCE',
    source: 'QUEST',
    color: 'var(--rank-b)',       // purple
    glow: 'var(--rank-b-glow)',
    flavor: 'Voice earns rooms. The monarch does not persuade — they are heard.'
  }
}

// Quests that award +5 CHA when cleared
export const CHA_QUESTS = new Set(['m1', 'm2', 'm4', 'm5', 'm9'])

// --- Formulas ---
// All formulas return a number 0..100 (clamped).
const clamp100 = v => Math.max(0, Math.min(100, v))

export function computeStats({ fitbit, leetcode, chaBonus, workout, allocated } = {}) {
  const vit = fitbit?.vitals || {}
  const readiness    = vit.readiness?.score
  const hrvRmssd     = vit.hrv?.rmssd
  const rhr          = vit.restingHeartRate ?? fitbit?.restingHeartRate ?? null
  const spo2Avg      = vit.spo2?.avg
  const brOverall    = vit.breathingRate?.overall
  const recoveryScore = fitbit?.sleep?.recoveryScore

  // ---- STRENGTH ----
  // Each sub-score is capped at 100 before weighting, so no single metric can
  // saturate STR on its own. Workout streak adds a small bonus on top (up to +15).
  const activeMin = fitbit?.activeMinutes ?? 0
  const azm       = fitbit?.activeZoneMinutes ?? 0
  const floors    = fitbit?.floors ?? 0
  const wStreak   = workout?.streak ?? 0
  const wLast7    = workout?.sessionsLast7 ?? 0

  const strBase = fitbit?.connected
    ? (sub(activeMin, 60) * 0.30
     + sub(azm, 22)       * 0.35
     + sub(floors, 15)    * 0.15
     + sub(wLast7, 4)     * 0.20)
    : 0
  const streakBonus = Math.min(15, wStreak)
  const STR = strBase + streakBonus

  // ---- VITALITY ----
  // Priority: readiness.score > sleep.recoveryScore > legacy fallback.
  let vitBase
  if (typeof readiness === 'number')            vitBase = readiness
  else if (typeof recoveryScore === 'number')   vitBase = recoveryScore
  else if (fitbit?.connected) {
    vitBase = ((fitbit.sleepEfficiency ?? 0) / 100) * 60 + Math.max(0, 100 - (rhr ?? 100)) * 0.4
  } else {
    vitBase = 0
  }
  let hrvMod = 0
  if (typeof hrvRmssd === 'number') hrvMod = hrvRmssd > 50 ? +5 : hrvRmssd < 25 ? -10 : 0
  let rhrMod = 0
  if (typeof rhr === 'number')      rhrMod = rhr < 60 ? +5 : rhr > 80 ? -10 : 0
  const VIT = fitbit?.connected ? (vitBase + hrvMod + rhrMod) : 0

  // ---- INTELLIGENCE ----
  // Cumulative with diminishing returns via log1p. ~200 weighted-problems ≈ 85 pts.
  const weighted =
    (leetcode?.easySolved   ?? 0) * 1 +
    (leetcode?.mediumSolved ?? 0) * 2 +
    (leetcode?.hardSolved   ?? 0) * 4
  const INT = leetcode?.connected
    ? Math.min(100, Math.log1p(weighted) * 16)
    : 0

  // ---- AGILITY ----
  // Cadence over spikes. Breathing-rate penalty retained.
  const subs30     = leetcode?.submissionsLast30 ?? 0
  const subs7      = leetcode?.submissionsLast7 ?? 0
  const acceptance = leetcode?.acceptanceRate ?? 0

  const agiBase = leetcode?.connected
    ? (sub(subs30 / 30, 1.5) * 0.45
     + sub(subs7, 10)         * 0.30
     + sub(acceptance, 70)    * 0.25)
    : 0
  const brMod = typeof brOverall === 'number' && (brOverall < 12 || brOverall > 20) ? -5 : 0
  const AGI = leetcode?.connected ? (agiBase + brMod) : 0

  // ---- SENSE ----
  let spo2Mod = 0
  if (typeof spo2Avg === 'number') spo2Mod = spo2Avg < 90 ? -15 : spo2Avg < 95 ? -5 : 0
  const senBase = fitbit?.connected ? sub(fitbit?.steps ?? 0, 12000) : 0
  const SEN = fitbit?.connected ? (senBase + spo2Mod) : 0

  // ---- CHARISMA ----
  const CHA = chaBonus || 0

  // Apply allocated points, then final clamp.
  const raw = { STR, VIT, INT, AGI, SEN, CHA }
  const out = {}
  for (const k of STAT_KEYS) {
    out[k] = clamp100(Math.round((raw[k] ?? 0) + (allocated?.[k] ?? 0)))
  }
  return out
}

// Cap a single metric at 100 before weighting — prevents any one input
// (e.g. 42 floors) from saturating the stat on its own.
const sub = (v, target) => Math.min(100, Math.max(0, ((v ?? 0) / target) * 100))

// Tier colors for bar visual states
export function stateOf(value) {
  if (value >= 80) return 'high'
  if (value >= 40) return 'mid'
  if (value >= 20) return 'low'
  return 'cold'
}

// Apply active debuffs to a base stat block. Returns { stats, byStat } where byStat
// collects the active debuff metadata per stat so bars can render badges.
export function applyDebuffs(baseStats, debuffs = [], damper = null) {
  const out = { ...baseStats }
  const byStat = {}
  for (const d of debuffs) {
    let delta = d.delta
    if (damper && damper.stats?.includes(d.stat)) delta = delta * (damper.factor ?? 1)
    out[d.stat] = clamp100((out[d.stat] ?? 0) + delta)
    if (!byStat[d.stat]) byStat[d.stat] = []
    byStat[d.stat].push({ ...d, effectiveDelta: Math.round(delta) })
  }
  return { stats: out, byStat }
}

export function isAllStatPlayer(stats, threshold = 60) {
  if (!stats) return false
  return STAT_KEYS.every(k => (stats[k] ?? 0) >= threshold)
}
