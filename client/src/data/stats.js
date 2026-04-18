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
  const STR = fitbit?.connected
    ? clamp100(((fitbit.activeMinutes ?? 0) / 60) * 50 + ((fitbit.floors ?? 0) / 10) * 50)
    : 0
  const VIT = fitbit?.connected
    ? clamp100(((fitbit.sleepEfficiency ?? 0) / 100) * 60 + (100 - (fitbit.restingHeartRate ?? 100)) * 0.4)
    : 0
  const INT = leetcode?.connected
    ? clamp100(((leetcode.easySolved ?? 0) * 1 + (leetcode.mediumSolved ?? 0) * 2 + (leetcode.hardSolved ?? 0) * 4) / 5)
    : 0
  const AGI = leetcode?.connected
    ? clamp100(((leetcode.submissionsLast30 ?? 0) / 30) * 70 + (leetcode.acceptanceRate ?? 0) * 0.3)
    : 0
  const SEN = fitbit?.connected
    ? clamp100(((fitbit.steps ?? 0) / 10000) * 100)
    : 0
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
