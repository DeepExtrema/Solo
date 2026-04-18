// Three branches: COMBAT (technical), RAID (career), GUILD (startup/research)
// Each node has: id, branch, tier, name, type, xp, desc, prereqs, legendary

export const BRANCHES = {
  COMBAT: {
    key: 'COMBAT',
    name: 'COMBAT',
    subtitle: 'Technical Mastery',
    color: 'var(--sys-cyan)',
    glow: 'var(--sys-cyan-glow)',
    flavor: 'Blades sharpened against algorithms. The interview is the gate.'
  },
  RAID: {
    key: 'RAID',
    name: 'RAID',
    subtitle: 'Career Assault',
    color: 'var(--rank-b)',
    glow: 'var(--rank-b-glow)',
    flavor: 'Every application is an entry. Every interview is a floor.'
  },
  GUILD: {
    key: 'GUILD',
    name: 'GUILD',
    subtitle: 'Parallax Doctrine',
    color: 'var(--rank-a)',
    glow: 'var(--rank-a-glow)',
    flavor: 'A city must be planned before it is built. A monarch must be proven before crowned.'
  }
}

export const NODES = [
  // COMBAT — tier index used for Y placement
  { id: 'c1', branch: 'COMBAT', tier: 0, name: 'Arrays & Strings Mastery',       type: 'Technical', xp: 25,  desc: 'Foundational patterns. Two pointers, sliding window, hashing. The primer.', prereqs: [] },
  { id: 'c2', branch: 'COMBAT', tier: 1, name: 'Graphs & Trees',                 type: 'Technical', xp: 40,  desc: 'Traversal as exploration. BFS, DFS, shortest paths. The maze-solver.', prereqs: ['c1'] },
  { id: 'c3', branch: 'COMBAT', tier: 2, name: 'Dynamic Programming',            type: 'Technical', xp: 60,  desc: 'Memory as weapon. Subproblems conquered and kept.', prereqs: ['c2'] },
  { id: 'c4', branch: 'COMBAT', tier: 3, name: 'System Design Fundamentals',     type: 'Technical', xp: 70,  desc: 'Scale. Latency. Failure modes. The architect\'s whiteboard.', prereqs: ['c3'] },
  { id: 'c5', branch: 'COMBAT', tier: 4, name: 'Sensor Fusion Architecture',     type: 'Robotics',  xp: 90,  desc: 'IMU, LIDAR, camera — timestamped reality stitched into one truth.', prereqs: ['c4'] },
  { id: 'c6', branch: 'COMBAT', tier: 5, name: 'Autonomous Systems Design',      type: 'Robotics',  xp: 120, desc: 'Planning, perception, control. The full loop.', prereqs: ['c5'] },
  { id: 'c7', branch: 'COMBAT', tier: 6, name: 'Robotics Interview Domination',  type: 'Capstone',  xp: 180, desc: 'The technical gauntlet mastered. No panel unprepared for.', prereqs: ['c6'] },

  // RAID
  { id: 'r1', branch: 'RAID', tier: 0, name: 'First Application Sent',      type: 'Milestone',  xp: 20,  desc: 'The first resume leaves the vault. The gate has been entered.', prereqs: [] },
  { id: 'r2', branch: 'RAID', tier: 1, name: '10 Applications',             type: 'Milestone',  xp: 40,  desc: 'Volume matters. Ten gates tested.', prereqs: ['r1'] },
  { id: 'r3', branch: 'RAID', tier: 2, name: 'First Phone Screen',          type: 'Interview',  xp: 60,  desc: 'A recruiter answered. The hunt is observed.', prereqs: ['r2'] },
  { id: 'r4', branch: 'RAID', tier: 3, name: 'First Technical Interview',   type: 'Interview',  xp: 100, desc: 'Under live fire. Code under a clock.', prereqs: ['r3'] },
  { id: 'r5', branch: 'RAID', tier: 4, name: 'First Offer Received',        type: 'Milestone',  xp: 150, desc: 'A gate opens downward — into a paycheck.', prereqs: ['r4'] },
  { id: 'r6', branch: 'RAID', tier: 5, name: 'First Paid Engineering Role', type: 'Milestone',  xp: 200, desc: 'Salary. Equity. Title. The raid returned loot.', prereqs: ['r5'] },
  { id: 'r7', branch: 'RAID', tier: 6, name: 'Senior Engineer',             type: 'Milestone',  xp: 300, desc: 'Juniors ask you. You no longer ask.', prereqs: ['r6'] },

  // GUILD
  { id: 'g1', branch: 'GUILD', tier: 0, name: 'Resume Finalized',             type: 'Prep',      xp: 15,  desc: 'The hunter\'s ledger, sharpened.', prereqs: [] },
  { id: 'g2', branch: 'GUILD', tier: 1, name: 'Research Co-authorship',       type: 'Research',  xp: 90,  desc: 'Your name appears beside another\'s. The paper remembers.', prereqs: ['g1'] },
  { id: 'g3', branch: 'GUILD', tier: 2, name: 'NSF I-Corps Completed',        type: 'Program',   xp: 120, desc: 'Customer discovery taught. The field-kit received.', prereqs: ['g2'] },
  { id: 'g4', branch: 'GUILD', tier: 3, name: 'Customer Discovery (20+)',     type: 'Founder',   xp: 140, desc: 'Twenty conversations that bent your thesis.', prereqs: ['g3'] },
  { id: 'g5', branch: 'GUILD', tier: 4, name: 'Research Paper Published',     type: 'Research',  xp: 200, desc: 'Peer-reviewed. The field cites you back.', prereqs: ['g4'] },
  { id: 'g6', branch: 'GUILD', tier: 5, name: 'First Parallax Customer',      type: 'Revenue',   xp: 260, desc: 'Money moves. A hand signs. Parallax exists because someone paid.', prereqs: ['g5'] },
  { id: 'g7', branch: 'GUILD', tier: 6, name: 'Parallax AI Seed Funded',      type: 'Legendary', xp: 500, desc: 'Investors align. The desert hums with capital.', prereqs: ['g6'], legendary: true },
  { id: 'g8', branch: 'GUILD', tier: 7, name: 'Constellation Extrema Founded', type: 'Legendary', xp: 999, desc: 'The city above sand. The monarch\'s workshop. The destination always was this.', prereqs: ['g7'], legendary: true }
]

export function nodesByBranch(branch) {
  return NODES.filter(n => n.branch === branch).sort((a, b) => a.tier - b.tier)
}

export function nodeStatus(nodeId, completed) {
  const node = NODES.find(n => n.id === nodeId)
  if (!node) return 'locked'
  if (completed.includes(nodeId)) return 'complete'
  const allPrereqsDone = node.prereqs.every(p => completed.includes(p))
  return allPrereqsDone ? 'available' : 'locked'
}
