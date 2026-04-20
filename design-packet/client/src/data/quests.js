// Daily quests reset every 24 hours. Main quests are permanent.

export const DAILY_QUESTS = [
  { id: 'd1', name: 'LEETCODE :: 1 PROBLEM', desc: 'Solve a minimum of one problem. Easy counts.',           xp: 15 },
  { id: 'd2', name: 'APPLY :: 1 GATE',        desc: 'Send one job application. Any target.',                  xp: 20 },
  { id: 'd3', name: 'PARALLAX :: 1 ACTION',   desc: 'Customer call, deck update, or research tick.',          xp: 15 },
  { id: 'd4', name: 'STUDY :: 1 CONCEPT',     desc: 'Review or practice a robotics/ML concept.',              xp: 10 },
  { id: 'd5', name: 'REST PROTOCOL',          desc: 'Sleep at least 7 hours. Recovery is not optional.',      xp: 20, autoSleep: true }
]

export const MAIN_QUESTS = [
  { id: 'm1', name: 'The First Gate',         flavor: 'No hunter crosses their first threshold without a tremor.',                                        objective: 'Send your first job application.',                xp: 30,  grantsTitle: null,             grantsNode: 'r1' },
  { id: 'm2', name: 'Blood on the Floor',     flavor: 'The interview room smells like tungsten. That is how you know it is real.',                         objective: 'Survive your first technical interview.',          xp: 80,  grantsTitle: 'Battle-Tested',  grantsNode: 'r4' },
  { id: 'm3', name: 'The Paper Trail',        flavor: 'Parchment weighs more than it appears. A paper is the hunter\'s longer shadow.',                     objective: 'Co-author a research publication.',                xp: 200, grantsTitle: 'Scholar-Hunter', grantsNode: 'g2' },
  { id: 'm4', name: 'Parallax Protocol',      flavor: 'A name in a registry. A contract with the state. The city needs a charter.',                        objective: 'Register Parallax AI as a legal entity.',          xp: 150, grantsTitle: null,             grantsNode: null },
  { id: 'm5', name: 'The Desert Wave',        flavor: 'The first payment moves across silicon. Somewhere, sand begins to shift.',                          objective: 'Land Parallax AI\'s first paying customer.',        xp: 300, grantsTitle: null,             grantsNode: 'g6', legendary: true },
  { id: 'm6', name: 'City from Sand',         flavor: 'The term sheet signed is not the city. It is permission to pour the first foundation.',              objective: 'Parallax AI raises a seed round.',                 xp: 500, grantsTitle: 'Architect of Stars', grantsNode: 'g7', legendary: true, triggersSRank: true },
  { id: 'm7', name: "The Monarch's Workshop", flavor: 'The farm is loud. Metal meets metal. The monarch builds alone before the guild arrives.',            objective: 'Build something on the farm.',                     xp: 999, grantsTitle: "Monarch's Hand",  grantsNode: 'g8', legendary: true },
  { id: 'm8', name: 'Ten Gates Breached',     flavor: 'Volume is a virtue. The law of averages finds hunters who keep applying.',                          objective: 'Send 10 job applications.',                        xp: 40,  grantsTitle: 'Gate Breaker',   grantsNode: 'r2' },
  { id: 'm9', name: 'The Voice Across',       flavor: 'A recruiter heard your name and dialed. The silence is broken.',                                    objective: 'Complete your first phone screen.',                xp: 60,  grantsTitle: null,             grantsNode: 'r3' }
]

export const TITLES_MASTER = [
  { key: 'Awakened Hunter',      desc: 'The system has recognized you.' },
  { key: 'Battle-Tested',        desc: 'Survived a technical interview under live fire.' },
  { key: 'Scholar-Hunter',       desc: 'Your name on a paper that the field reads.' },
  { key: 'Relentless Hunter',    desc: '30-day streak. The System takes note.' },
  { key: 'Gate Breaker',         desc: 'Ten gates, ten attempts, ten records.' },
  { key: "Monarch's Hand",       desc: 'Something built by your own hands on the farm.' },
  { key: 'Architect of Stars',   desc: 'Seed funded. The plan now belongs to more than you.' }
]
