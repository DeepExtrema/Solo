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

export function computeStats({ fitbit, leetcode, chaBonus }) {
  const vit = fitbit?.vitals || {}
  const readiness = vit.readiness?.score
  const hrvRmssd  = vit.hrv?.rmssd
  const rhr       = vit.restingHeartRate ?? fitbit?.restingHeartRate ?? null
  const spo2Avg   = vit.spo2?.avg
  const brDeep    = vit.breathingRate?.deep
  const brOverall = vit.breathingRate?.overall
  const recoveryScore = fitbit?.sleep?.recoveryScore

  // ---- STRENGTH ----
  // Active Zone Minutes are Fitbit's own elevated-heart-rate metric — weight them as the
  // strongest signal, and keep raw active minutes + floors as supporting inputs.
  const activeMinutes = fitbit?.activeMinutes ?? 0
  const azm           = fitbit?.activeZoneMinutes ?? 0
  const floors        = fitbit?.floors ?? 0
  const STR = fitbit?.connected
    ? clamp100((activeMinutes / 60) * 40 + (azm / 30) * 30 + (floors / 10) * 30)
    : 0

  // ---- VITALITY ----
  // Priority: readiness.score > sleep.recoveryScore > legacy efficiency/rhr formula.
  // Then apply HRV + RHR modifiers.
  let vitBase
  if (typeof readiness === 'number') {
    vitBase = readiness
  } else if (typeof recoveryScore === 'number') {
    vitBase = recoveryScore
  } else if (fitbit?.connected) {
    vitBase = ((fitbit.sleepEfficiency ?? 0) / 100) * 60 + (100 - (rhr ?? 100)) * 0.4
  } else {
    vitBase = 0
  }
  let hrvMod = 0
  if (typeof hrvRmssd === 'number') {
    if (hrvRmssd > 50) hrvMod = +5
    else if (hrvRmssd < 25) hrvMod = -10
  }
  let rhrMod = 0
  if (typeof rhr === 'number') {
    if (rhr < 60) rhrMod = +5
    else if (rhr > 80) rhrMod = -10
  }
  const VIT = fitbit?.connected ? clamp100(vitBase + hrvMod + rhrMod) : 0

  // ---- INTELLIGENCE ----
  const INT = leetcode?.connected
    ? clamp100(((leetcode.easySolved ?? 0) * 1 + (leetcode.mediumSolved ?? 0) * 2 + (leetcode.hardSolved ?? 0) * 4) / 5)
    : 0

  // ---- AGILITY ----
  // Execution speed via LeetCode cadence, with a small breathing-rate penalty
  // when deep-sleep respiration is outside the healthy 12-20 brpm band.
  const agiBase = leetcode?.connected
    ? ((leetcode.submissionsLast30 ?? 0) / 30) * 70 + (leetcode.acceptanceRate ?? 0) * 0.3
    : 0
  const brRef = typeof brDeep === 'number' ? brDeep : brOverall
  const brMod = typeof brRef === 'number' && (brRef < 12 || brRef > 20) ? -5 : 0
  const AGI = leetcode?.connected ? clamp100(agiBase + brMod) : 0

  // ---- SENSE ----
  // Steps-driven, moderated by blood-oxygen saturation. Low SpO2 means the body isn't
  // operating at peak and should dim perception.
  let spo2Mod = 0
  if (typeof spo2Avg === 'number') {
    if (spo2Avg < 90) spo2Mod = -15
    else if (spo2Avg < 95) spo2Mod = -5
  }
  const senBase = fitbit?.connected ? ((fitbit.steps ?? 0) / 10000) * 100 : 0
  const SEN = fitbit?.connected ? clamp100(senBase + spo2Mod) : 0

  const CHA = clamp100(chaBonus || 0)
  return { STR, VIT, INT, AGI, SEN, CHA }
}

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
