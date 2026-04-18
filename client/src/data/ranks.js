export const RANKS = [
  {
    key: 'E',
    title: 'AWAKENED',
    subtitle: 'The Gate Opens',
    threshold: 0,
    color: 'var(--rank-e)',
    glow: 'var(--rank-e-glow)',
    lore: 'A faint pulse at the base of the spine. The world thins. A gate has chosen you.'
  },
  {
    key: 'D',
    title: 'HUNTER',
    subtitle: 'Dungeon Crawling Begins',
    threshold: 100,
    color: 'var(--rank-d)',
    glow: 'var(--rank-d-glow)',
    lore: 'The first low-level gates yield. You learn the rhythm of the hunt. You stop flinching.'
  },
  {
    key: 'C',
    title: 'SOLO RAIDER',
    subtitle: 'First Blood',
    threshold: 250,
    color: 'var(--rank-c)',
    glow: 'var(--rank-c-glow)',
    lore: 'You stop needing a party. The gate remembers your name. The hunt remembers your weight.'
  },
  {
    key: 'B',
    title: 'RANKED HUNTER',
    subtitle: 'The Grind Pays',
    threshold: 500,
    color: 'var(--rank-b)',
    glow: 'var(--rank-b-glow)',
    lore: 'Momentum. Output compounds. Your name begins to surface in circles you do not yet frequent.'
  },
  {
    key: 'A',
    title: 'ELITE HUNTER',
    subtitle: 'Shaping the Field',
    threshold: 900,
    color: 'var(--rank-a)',
    glow: 'var(--rank-a-glow)',
    lore: 'Others move because of decisions you made. You no longer fight the shape of the world — you bend it.'
  },
  {
    key: 'S',
    title: 'MONARCH',
    subtitle: 'The City Rises',
    threshold: 1500,
    color: 'var(--rank-s)',
    glow: 'var(--rank-s-glow)',
    lore: 'Sand cools. A city of your making stands above a desert that once swallowed everything. You built the gate.'
  }
]

export function rankFromXP(xp) {
  let current = RANKS[0]
  for (const r of RANKS) if (xp >= r.threshold) current = r
  return current
}

export function nextRank(currentKey) {
  const idx = RANKS.findIndex(r => r.key === currentKey)
  return idx >= 0 && idx < RANKS.length - 1 ? RANKS[idx + 1] : null
}

export function rankProgress(xp) {
  const current = rankFromXP(xp)
  const next = nextRank(current.key)
  if (!next) return { current, next: null, pct: 1, within: 0, span: 0 }
  const span = next.threshold - current.threshold
  const within = xp - current.threshold
  return { current, next, pct: Math.min(1, within / span), within, span }
}
