// Instance Dungeons — private sealed training grounds. Spawned from keys.

export const INSTANCE_DUNGEON_WINDOW_MS = 48 * 60 * 60 * 1000

export const DUNGEON_POOL = [
  {
    id: 'fractured-logic',
    name: 'GATE OF FRACTURED LOGIC',
    difficulty: 'C',
    lore: 'The walls rearrange as you read them. Math is a weapon here.',
    floors: [
      { id: 'f1', label: 'Solve 3 LeetCode Medium problems',                          xp: 30 },
      { id: 'f2', label: 'Send 3 tailored robotics-company applications',             xp: 40 },
      { id: 'f3', label: 'Log a full mock system-design interview in the journal',   xp: 80, boss: true }
    ],
    rewardXp: 150,
    rewardGold: 30,
    rewardFragment: true
  },
  {
    id: 'hapjeong-trial',
    name: 'HAPJEONG STATION TRIAL',
    difficulty: 'D',
    lore: 'A station that shouldn\'t exist. Doors open onto different Seouls.',
    floors: [
      { id: 'f1', label: 'Solve 2 LeetCode Easy problems',                            xp: 20 },
      { id: 'f2', label: 'Reach out to 2 operators in Seoul / Tokyo networks',        xp: 30 },
      { id: 'f3', label: 'Log a 300-word field report on one city of the future',     xp: 60, boss: true }
    ],
    rewardXp: 100,
    rewardGold: 20,
    rewardFragment: false
  },
  {
    id: 'crimson-labyrinth',
    name: 'CRIMSON LABYRINTH',
    difficulty: 'B',
    lore: 'A hunter enters alone. The maze remembers who left.',
    floors: [
      { id: 'f1', label: 'Solve 2 LeetCode Hard problems',                            xp: 60 },
      { id: 'f2', label: 'Ship one demo / prototype on the Parallax farm',            xp: 80 },
      { id: 'f3', label: 'Record a 5-minute Loom pitch for Parallax AI',             xp: 110, boss: true }
    ],
    rewardXp: 220,
    rewardGold: 50,
    rewardFragment: true
  },
  {
    id: 'silent-stack',
    name: 'GATE OF THE SILENT STACK',
    difficulty: 'C',
    lore: 'Every frame echoes. Wrong move and the recursion eats you.',
    floors: [
      { id: 'f1', label: 'Write a blog post / technical README (≥600 words)',         xp: 35 },
      { id: 'f2', label: 'Refactor one personal project with measurable improvement',  xp: 55 },
      { id: 'f3', label: 'Teach one concept to someone junior (log the session)',    xp: 70, boss: true }
    ],
    rewardXp: 160,
    rewardGold: 25,
    rewardFragment: false
  }
]

export function pickDungeonForRank(rankKey) {
  // Map rank → difficulty pool
  const pool = DUNGEON_POOL.filter(d => {
    if (['E', 'D'].includes(rankKey)) return ['D', 'C'].includes(d.difficulty)
    if (rankKey === 'C')              return ['C', 'B'].includes(d.difficulty)
    return ['B', 'C'].includes(d.difficulty)
  })
  const list = pool.length ? pool : DUNGEON_POOL
  const chosen = list[Math.floor(Math.random() * list.length)]
  return JSON.parse(JSON.stringify(chosen))
}
