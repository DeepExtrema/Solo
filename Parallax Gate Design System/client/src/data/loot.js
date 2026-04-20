// Blessed / Cursed reward boxes. Dropped on 4/4 daily completion.

export const BLESSED_POOL = [
  { key: 'xp50',      label: '+50 BONUS XP',            effect: { kind: 'xp', amount: 50 },          weight: 3 },
  { key: 'gold25',    label: '+25 GOLD',                effect: { kind: 'gold', amount: 25 },         weight: 3 },
  { key: 'dungeonKey',label: 'INSTANCE DUNGEON KEY',    effect: { kind: 'dungeonKey' },               weight: 2 },
  { key: 'doubleXP',  label: 'DOUBLE XP TOKEN',         effect: { kind: 'token', token: 'doubleXP' },weight: 2 },
  { key: 'fragment',  label: 'TITLE FRAGMENT',          effect: { kind: 'fragment' },                 weight: 2 },
  { key: 'potion',    label: 'STAT BOOST POTION (+5)',  effect: { kind: 'potion', amount: 5, hours: 24 }, weight: 2 }
]

export const CURSED_POOL = [
  { key: 'xp10',       label: '+10 XP (MEAGER)',                        effect: { kind: 'xp', amount: 10 }, weight: 3 },
  { key: 'penalty',    label: 'PENALTY QUEST ISSUED',                   effect: { kind: 'penaltyQuest' },    weight: 3 },
  { key: 'interfere',  label: 'SYSTEM INTERFERENCE (NEXT QUEST DOUBLED)', effect: { kind: 'interference' },   weight: 2 },
  { key: 'goldLoss',   label: 'GOLD DEDUCTED (-15)',                    effect: { kind: 'gold', amount: -15 }, weight: 2 }
]

function pickWeighted(pool) {
  const total = pool.reduce((a, b) => a + b.weight, 0)
  let r = Math.random() * total
  for (const item of pool) { r -= item.weight; if (r <= 0) return item }
  return pool[0]
}

// Randomly assign each slot: either both random, or the player picks.
export function rollBoxes() {
  // 50/50 which slot is blessed vs cursed; contents are random within pool.
  const leftIsBlessed = Math.random() < 0.5
  return {
    left:  leftIsBlessed ? pickWeighted(BLESSED_POOL) : pickWeighted(CURSED_POOL),
    right: leftIsBlessed ? pickWeighted(CURSED_POOL)  : pickWeighted(BLESSED_POOL),
    leftKind:  leftIsBlessed ? 'BLESSED' : 'CURSED',
    rightKind: leftIsBlessed ? 'CURSED'  : 'BLESSED'
  }
}

export const PENALTY_QUEST = {
  id: 'penalty',
  name: 'PENALTY QUEST :: THE SYSTEM TESTS YOUR RESOLVE',
  desc: 'Complete one additional hard challenge before the day rolls over.',
  rewardXp: 40,
  ignorePenaltyXp: -5
}
