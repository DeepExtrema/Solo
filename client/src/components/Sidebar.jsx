import React from 'react'
import { useStore } from '../state/store.jsx'
import { rankProgress } from '../data/ranks.js'

const TABS = [
  { key: 'STATUS',    label: 'STATUS',      idx: '01' },
  { key: 'SKILLTREE', label: 'SKILL TREE',  idx: '02' },
  { key: 'QUESTS',    label: 'QUEST LOG',   idx: '03' },
  { key: 'JOURNAL',   label: 'LORE',        idx: '04' },
  { key: 'PROFILE',   label: 'HUNTER',      idx: '05' },
  { key: 'CONFIG',    label: 'SYSTEM CFG',  idx: '06' }
]

export default function Sidebar({ tab, setTab }) {
  const { state, rank } = useStore()
  const progress = rankProgress(state.xp)

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="hunter-name">{state.hunterName}</div>
        <div className="hunter-title">[ {state.equippedTitle} ]</div>
        <div className="hunter-rank">
          <div className="rank-badge">{rank.key}</div>
          <div className="rank-meta">
            <span className="t">RANK</span>
            <span className="v">{rank.title}</span>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>
          XP :: <span className="hl-rank">{state.xp}</span>
          {progress.next && <> / <span style={{ color: 'var(--text-muted)' }}>{progress.next.threshold}</span></>}
        </div>
      </div>

      {TABS.map(t => (
        <div
          key={t.key}
          className={`nav-item ${tab === t.key ? 'active' : ''}`}
          onClick={() => setTab(t.key)}
        >
          <span className="idx">{t.idx}</span>
          <span>{t.label}</span>
        </div>
      ))}

      <div className="sidebar-footer">
        STREAK :: {state.streak}D<br/>
        ACTIVE :: {state.daysActive}D
      </div>
    </aside>
  )
}
