import React from 'react'
import { useStore } from '../state/store.jsx'

const DIFF_COLOR = { D: 'var(--rank-d)', C: 'var(--rank-c)', B: 'var(--rank-b)' }

export default function InstanceDungeonCard() {
  const { state, dungeonCompleteFloor, dungeonClaim, dungeonAbandon } = useStore()
  const d = state.activeDungeon
  if (!d) return null
  const remaining = Math.max(0, d.deadline - Date.now())
  const hrs = Math.floor(remaining / 3600000)
  const mins = Math.floor((remaining % 3600000) / 60000)
  const allDone = d.floors.every(f => f.done)

  // Enforce boss-last: boss floor only clickable once non-boss floors are done
  const nonBossDone = d.floors.filter(f => !f.boss).every(f => f.done)

  return (
    <section className="panel" style={{ borderColor: DIFF_COLOR[d.difficulty] }}>
      <div className="panel-title" style={{ color: DIFF_COLOR[d.difficulty] }}>
        <span>INSTANCE DUNGEON :: {d.name}</span>
        <span style={{ color: 'var(--warn)' }}>
          ◆ {d.difficulty}-RANK :: {hrs}h {mins}m REMAINING
        </span>
      </div>
      <div className="panel-body">
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 14 }}>
          {d.lore}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {d.floors.map((f, i) => {
            const canComplete = !f.done && (f.boss ? nonBossDone : true)
            return (
              <div key={f.id} style={{
                padding: '10px 12px',
                border: `1px solid ${f.done ? 'var(--ok)' : (f.boss ? 'var(--rank-s)' : 'var(--border-mid)')}`,
                background: f.done ? 'rgba(74,222,128,0.05)' : (f.boss ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.3)'),
                display: 'grid', gridTemplateColumns: '40px 1fr 90px 120px', gap: 10, alignItems: 'center'
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
                  color: f.done ? 'var(--ok)' : (f.boss ? 'var(--rank-s)' : 'var(--text-muted)')
                }}>{f.boss ? 'BOSS' : `F${i + 1}`}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{f.label}</span>
                <span style={{ fontSize: 11, color: 'var(--rank-color)', textAlign: 'right' }}>+{f.xp} XP</span>
                <div style={{ textAlign: 'right' }}>
                  {!f.done && canComplete && (
                    <button style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => dungeonCompleteFloor(f.id)}>
                      ▸ CLEAR
                    </button>
                  )}
                  {f.done && <span style={{ color: 'var(--ok)', fontSize: 10, letterSpacing: '0.2em' }}>◆ DONE</span>}
                  {!f.done && !canComplete && <span style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: '0.2em' }}>LOCKED</span>}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <button onClick={dungeonAbandon} style={{ color: 'var(--text-muted)' }}>
            ABANDON DUNGEON
          </button>
          <button
            disabled={!allDone}
            onClick={dungeonClaim}
            style={{
              color: allDone ? 'var(--legendary)' : 'var(--text-muted)',
              borderColor: allDone ? 'var(--legendary)' : 'var(--border-dim)',
              boxShadow: allDone ? '0 0 14px var(--legendary-glow)' : 'none'
            }}>
            ◆ CLAIM REWARD :: +{d.rewardXp} XP{d.rewardGold ? ` / +${d.rewardGold} GOLD` : ''}
          </button>
        </div>
      </div>
    </section>
  )
}
