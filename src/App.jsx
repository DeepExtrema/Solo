import React, { useState } from 'react'
import { StoreProvider, useStore } from './state/store.jsx'
import Sidebar from './components/Sidebar.jsx'
import StatusPanel from './panels/StatusPanel.jsx'
import SkillTreePanel from './panels/SkillTreePanel.jsx'
import QuestLogPanel from './panels/QuestLogPanel.jsx'
import JournalPanel from './panels/JournalPanel.jsx'
import ProfilePanel from './panels/ProfilePanel.jsx'
import Ceremony from './components/Ceremony.jsx'
import Runes from './components/Runes.jsx'
import TopBar from './components/TopBar.jsx'
import './styles/layout.css'

function Shell() {
  const [tab, setTab] = useState('STATUS')
  const { ceremony, dismissCeremony } = useStore()

  return (
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
        </main>
      </div>
      {ceremony && <Ceremony ceremony={ceremony} dismiss={dismissCeremony} />}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
