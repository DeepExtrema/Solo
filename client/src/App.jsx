import React, { useState, useMemo } from 'react'
import { StoreProvider, useStore } from './state/store.jsx'
import { StatsProvider } from './state/statsStore.jsx'
import Sidebar from './components/Sidebar.jsx'
import StatusPanel from './panels/StatusPanel.jsx'
import SkillTreePanel from './panels/SkillTreePanel.jsx'
import QuestLogPanel from './panels/QuestLogPanel.jsx'
import JournalPanel from './panels/JournalPanel.jsx'
import ProfilePanel from './panels/ProfilePanel.jsx'
import ConfigPanel from './panels/ConfigPanel.jsx'
import Ceremony from './components/Ceremony.jsx'
import Runes from './components/Runes.jsx'
import TopBar from './components/TopBar.jsx'
import BiometricWidget from './components/BiometricWidget.jsx'
import { CHA_QUESTS } from './data/stats.js'
import './styles/layout.css'

function Shell() {
  const [tab, setTab] = useState('STATUS')
  const { ceremony, dismissCeremony, state, completeDaily } = useStore()

  const chaBonus = useMemo(() => {
    let sum = 0
    for (const qid of state.completedQuests) if (CHA_QUESTS.has(qid)) sum += 5
    return Math.min(100, sum)
  }, [state.completedQuests])

  return (
    <StatsProvider
      chaBonus={chaBonus}
      onAutoQuest={(qid) => { if (!state.dailyProgress[qid]) completeDaily(qid) }}
    >
      <div className="shell">
        <Runes />
        <TopBar />
        <div className="shell-body">
          <Sidebar tab={tab} setTab={setTab} />
          <main className="main">
            {tab === 'STATUS'    && <StatusPanel />}
            {tab === 'SKILLTREE' && <SkillTreePanel />}
            {tab === 'QUESTS'    && <QuestLogPanel />}
            {tab === 'JOURNAL'   && <JournalPanel />}
            {tab === 'PROFILE'   && <ProfilePanel />}
            {tab === 'CONFIG'    && <ConfigPanel />}
          </main>
        </div>
        {tab !== 'CONFIG' && <BiometricWidget />}
        {ceremony && <Ceremony ceremony={ceremony} dismiss={dismissCeremony} />}
      </div>
    </StatsProvider>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
