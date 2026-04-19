// Job Change Quest — class definitions, trial tasks, dominant-stat detection.

export const JOB_CHANGE_XP_THRESHOLD = 500 // unlocks at B-Rank
export const JOB_CHANGE_WINDOW_MS = 72 * 60 * 60 * 1000
export const JOB_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days after a failed trial

export const JOB_CHANGE_TASKS = [
  { key: 'apply',    label: 'Apply to 5 robotics/AI engineering roles', target: 5 },
  { key: 'leetcode', label: 'Solve 5 LeetCode problems (any difficulty)', target: 5 },
  { key: 'parallax', label: 'Log a 200-word Parallax AI progress note',   target: 1 }
]

export const CLASSES = {
  ARCHITECT: {
    key: 'ARCHITECT',
    name: 'ARCHITECT OF SYSTEMS',
    glyph: '◈',
    color: 'var(--rank-c)',
    glow: 'var(--rank-c-glow)',
    tagline: 'Systems obey the hand that writes the axioms.',
    passive: 'All technical-quest XP +20%.',
    xpMultiplier: { tag: 'technical', value: 1.20 }
  },
  IRON: {
    key: 'IRON',
    name: 'IRON SOVEREIGN',
    glyph: '⬢',
    color: 'var(--rank-s)',
    glow: 'var(--rank-s-glow)',
    tagline: 'The body is the first fortress. Hold it, and hold everything.',
    passive: 'Gym / sleep XP doubled; physical debuffs halved.',
    xpMultiplier: { tag: 'physical', value: 2.0 },
    debuffDamper: { stats: ['STR', 'VIT'], factor: 0.5 }
  },
  SHADOW: {
    key: 'SHADOW',
    name: 'SHADOW RAIDER',
    glyph: '▲',
    color: 'var(--sys-cyan)',
    glow: 'var(--sys-cyan-glow)',
    tagline: 'Speed is a sovereignty. Move before the Gate remembers your name.',
    passive: 'Job applications grant +10 gold; Gate cooldowns reduced.',
    goldPerApply: 10
  }
}

// dominant-stat heuristic
export function classFromStats(stats) {
  if (!stats) return 'ARCHITECT'
  const { STR = 0, VIT = 0, INT = 0, AGI = 0, SEN = 0, CHA = 0 } = stats
  const physical = (STR + VIT) / 2
  const intel    = INT
  const agility  = AGI
  const best = Math.max(physical, intel, agility)
  if (best === intel)    return 'ARCHITECT'
  if (best === physical) return 'IRON'
  return 'SHADOW'
}
