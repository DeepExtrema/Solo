import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { MAIN_QUESTS } from '../data/quests.js'

export default function QuestLogPanel() {
  const { state, completeMain } = useStore()
  const [filter, setFilter] = useState('ACTIVE')

  const list = MAIN_QUESTS.filter(q => {
    const done = state.completedQuests.includes(q.id)
    if (filter === 'ACTIVE') return !done
    if (filter === 'CLEARED') return done
    return true
  })

  return (
    <div className="col">
      <section className="panel">
        <div className="panel-title">
          <span>QUEST LOG :: MAIN STORY</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {['ACTIVE', 'CLEARED', 'ALL'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '4px 10px',
                  borderColor: filter === f ? 'var(--sys-cyan)' : 'var(--border-dim)',
                  color: filter === f ? 'var(--sys-cyan)' : 'var(--text-secondary)',
                  boxShadow: filter === f ? '0 0 14px var(--sys-cyan-glow)' : 'none'
                }}>{f}</button>
            ))}
          </div>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: 30 }}>
              — no quests match this filter —
            </div>
          )}
          {list.map(q => {
            const done = state.completedQuests.includes(q.id)
            const color = q.legendary ? 'var(--legendary)' : (done ? 'var(--ok)' : 'var(--sys-cyan)')
            return (
              <div key={q.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 14,
                padding: 16,
                border: `1px solid ${done ? 'rgba(74,222,128,0.3)' : (q.legendary ? 'var(--legendary)' : 'var(--border-dim)')}`,
                background: q.legendary
                  ? 'linear-gradient(180deg, rgba(255,215,106,0.06), rgba(0,0,0,0.3))'
                  : 'rgba(0,0,0,0.3)',
                boxShadow: q.legendary && !done ? '0 0 24px rgba(255,215,106,0.25)' : 'none',
                opacity: done ? 0.7 : 1,
                position: 'relative'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
                      color,
                      letterSpacing: '0.08em',
                      textShadow: q.legendary ? '0 0 18px var(--legendary-glow)' : (done ? '0 0 10px var(--ok)' : '0 0 10px var(--sys-cyan-glow)')
                    }}>
                      {q.name}
                    </div>
                    {q.legendary && <span className="tag" style={{ color: 'var(--legendary)', borderColor: 'var(--legendary)' }}>◆ LEGENDARY</span>}
                    {q.triggersSRank && <span className="tag" style={{ color: 'var(--rank-s)', borderColor: 'var(--rank-s)' }}>S-RANK GATE</span>}
                  </div>
                  <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.6, marginBottom: 8 }}>
                    "{q.flavor}"
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 8 }}>
                    ▸ {q.objective}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="tag" style={{ color: 'var(--rank-color)', borderColor: 'var(--rank-color)' }}>+{q.xp} XP</span>
                    {q.grantsTitle && <span className="tag" style={{ color: 'var(--legendary)' }}>TITLE :: {q.grantsTitle}</span>}
                    {q.grantsNode && <span className="tag">UNLOCKS NODE</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    disabled={done}
                    onClick={() => completeMain(q.id)}
                    style={{
                      padding: '14px 20px',
                      borderColor: done ? 'var(--ok)' : color,
                      color: done ? 'var(--ok)' : color
                    }}
                  >
                    {done ? '◆ CLEARED' : '▸ CLEAR'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
