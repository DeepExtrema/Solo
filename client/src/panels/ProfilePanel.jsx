import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { useStats } from '../state/statsStore.jsx'
import { TITLES_MASTER } from '../data/quests.js'
import { RANKS } from '../data/ranks.js'
import { NODES } from '../data/skillTree.js'
import { MAIN_QUESTS } from '../data/quests.js'
import { STAT_KEYS, STATS } from '../data/stats.js'
import StatBar from '../components/StatBar.jsx'
import StatRadar from '../components/StatRadar.jsx'
import StatDetailDrawer from '../components/StatDetailDrawer.jsx'
import FatigueBadge from '../components/FatigueBadge.jsx'
import WorkoutLogPanel from '../components/WorkoutLogPanel.jsx'
import { CLASSES } from '../data/classes.js'

export default function ProfilePanel() {
  const { state, rank, equipTitle, setName, resetAll, allocatePoint } = useStore()
  const { stats, trends, raw, status, debuffByStat } = useStats()
  const pointsAvailable = state.pointsAvailable ?? 0
  const allocatedPoints = state.allocatedPoints || {}
  const flags = state.featureFlags || {}
  const cls = state.classKey ? CLASSES[state.classKey] : null
  const [nameEdit, setNameEdit] = useState(state.hunterName)
  const [confirmReset, setConfirmReset] = useState(false)
  const [drawerStat, setDrawerStat] = useState(null)

  const daysSinceAwakening = Math.max(1, Math.floor((Date.now() - new Date(state.firstLogin).getTime()) / 86400000))
  const titleDef = (k) => TITLES_MASTER.find(t => t.key === k)

  return (
    <div className="col">
      <section className="panel">
        <div className="panel-title">
          <span>HUNTER :: IDENTITY</span>
          <span style={{ color: 'var(--text-muted)' }}>AWAKENED {new Date(state.firstLogin).toLocaleDateString()}</span>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, alignItems: 'center' }}>
          <div style={{
            width: 160, height: 160,
            border: '2px solid var(--rank-color)',
            boxShadow: '0 0 36px var(--rank-glow), inset 0 0 20px rgba(255,255,255,0.04)',
            display: 'grid', placeItems: 'center',
            background: 'radial-gradient(circle at center, rgba(0,0,0,0.3), rgba(0,0,0,0.9))',
            position: 'relative'
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 900,
              fontSize: 96, color: 'var(--rank-color)',
              textShadow: '0 0 32px var(--rank-glow)',
              lineHeight: 1
            }}>{rank.key}</div>
            <div style={{ position: 'absolute', bottom: 8, fontSize: 9, letterSpacing: '0.3em', color: 'var(--text-secondary)' }}>
              CLASSIFICATION
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input
                value={nameEdit}
                onChange={e => setNameEdit(e.target.value)}
                maxLength={16}
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--border-mid)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 22, fontWeight: 800, letterSpacing: '0.15em',
                  padding: '6px 10px',
                  width: 260,
                  outline: 'none'
                }}
              />
              <button onClick={() => setName(nameEdit)}>SAVE</button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--rank-color)', letterSpacing: '0.15em', marginBottom: 8 }}>
              {rank.title} :: {rank.subtitle}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {cls && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px',
                  border: `1px solid ${cls.color}`,
                  color: cls.color,
                  fontFamily: 'var(--font-display)',
                  fontSize: 10, letterSpacing: '0.22em',
                  textShadow: `0 0 10px ${cls.color}`,
                  background: 'rgba(0,0,0,0.4)'
                }}>
                  ◆ CLASS :: {cls.key}
                </div>
              )}
              {state.allStatUnlocked && (
                <div className="gold-shimmer" style={{
                  padding: '4px 10px',
                  border: '1px solid var(--legendary)',
                  color: 'var(--legendary)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 10, letterSpacing: '0.22em',
                  textShadow: '0 0 12px var(--legendary-glow)',
                  background: 'rgba(255,215,106,0.06)'
                }}>
                  ◆ ALL-STAT PLAYER
                </div>
              )}
              {flags.SLEEP_PROTOCOL_ENABLED && state.fatigue >= 50 && (
                <FatigueBadge fatigue={state.fatigue} />
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic', maxWidth: 560 }}>
              {rank.lore}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <Stat label="XP TOTAL" value={state.xp} />
              <Stat label="STREAK" value={state.streak + 'D'} />
              <Stat label="DAYS ACTIVE" value={state.daysActive + 'D'} />
              <Stat label="SINCE AWAKENING" value={daysSinceAwakening + 'D'} />
              <Stat label="QUESTS" value={`${state.completedQuests.length}/${MAIN_QUESTS.length}`} />
              <Stat label="NODES" value={`${state.completedNodes.length}/${NODES.length}`} />
            </div>
          </div>
        </div>
      </section>

      {pointsAvailable > 0 && (
        <section className="panel" style={{ borderColor: 'var(--legendary)', boxShadow: '0 0 28px var(--legendary-glow)' }}>
          <div className="panel-title" style={{ color: 'var(--legendary)' }}>
            <span>◆ RANK-UP POINTS AVAILABLE</span>
            <span style={{ color: 'var(--legendary)', textShadow: '0 0 10px var(--legendary-glow)' }}>
              {pointsAvailable} UNSPENT
            </span>
          </div>
          <div className="panel-body" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            The System has recognized your rise. Click <span style={{ color: 'var(--legendary)' }}>+</span> next to any stat below to commit a point. Up to +40 per stat.
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-title">
          <span>STAT DISTRIBUTION :: LIVE BIOMETRIC LINK</span>
          <span style={{
            color: status === 'ok' ? 'var(--ok)' : status === 'stale' ? 'var(--rank-a)' : status === 'loading' ? 'var(--sys-cyan)' : 'var(--warn)'
          }}>
            {status === 'ok' ? '◆ SYNCED' : status === 'stale' ? '◇ STALE' : status === 'loading' ? '◇ SYNCING' : '⬚ OFFLINE'}
          </span>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center' }} className={state.allStatUnlocked ? 'radar-allstat' : ''}>
            <StatRadar stats={stats} size={280} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STAT_KEYS.map(k => {
              const source = STATS[k].source === 'FITBIT' ? raw?.fitbit
                : STATS[k].source === 'LEETCODE' ? raw?.leetcode
                : { connected: true, lastUpdated: null }
              return (
                <StatBar
                  key={k}
                  statKey={k}
                  value={stats[k]}
                  trend={trends[k]}
                  source={source}
                  debuffs={debuffByStat?.[k]}
                  allocated={allocatedPoints[k] || 0}
                  onAllocate={allocatePoint}
                  canAllocate={pointsAvailable > 0 && (allocatedPoints[k] || 0) < 40}
                  onClick={() => setDrawerStat(k)}
                />
              )
            })}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em', marginTop: 4, textAlign: 'right' }}>
              ▸ CLICK ANY STAT TO INSPECT RAW DATA
            </div>
          </div>
        </div>
      </section>

      <StatDetailDrawer statKey={drawerStat} onClose={() => setDrawerStat(null)} />

      <WorkoutLogPanel />

      <section className="panel">
        <div className="panel-title">
          <span>TITLES :: EARNED {state.titlesEarned.length}</span>
          <span style={{ color: 'var(--text-muted)' }}>EQUIPPED: {state.equippedTitle}</span>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {TITLES_MASTER.map(t => {
            const earned = state.titlesEarned.includes(t.key)
            const equipped = state.equippedTitle === t.key
            return (
              <div key={t.key}
                onClick={() => earned && equipTitle(t.key)}
                style={{
                  padding: 14,
                  border: `1px solid ${equipped ? 'var(--legendary)' : (earned ? 'var(--border-mid)' : 'var(--border-dim)')}`,
                  background: equipped ? 'rgba(255,215,106,0.06)' : 'rgba(0,0,0,0.3)',
                  opacity: earned ? 1 : 0.4,
                  cursor: earned ? 'pointer' : 'not-allowed',
                  transition: 'all 160ms var(--ease-out)',
                  boxShadow: equipped ? '0 0 22px var(--legendary-glow)' : 'none'
                }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                  color: equipped ? 'var(--legendary)' : (earned ? 'var(--sys-cyan)' : 'var(--text-muted)'),
                  letterSpacing: '0.12em',
                  textShadow: equipped ? '0 0 12px var(--legendary-glow)' : 'none'
                }}>
                  {earned ? t.key : '[ LOCKED ]'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic', lineHeight: 1.5 }}>
                  {earned ? t.desc : '— title not yet granted —'}
                </div>
                {earned && !equipped && <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'var(--text-muted)', marginTop: 8 }}>CLICK TO EQUIP</div>}
                {equipped && <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'var(--legendary)', marginTop: 8 }}>◆ EQUIPPED</div>}
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title"><span>RANK CODEX</span></div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RANKS.map(r => {
            const achieved = state.xp >= r.threshold
            const current = rank.key === r.key
            return (
              <div key={r.key} style={{
                display: 'grid', gridTemplateColumns: '52px 120px 1fr 80px', gap: 14, alignItems: 'center',
                padding: '10px 12px',
                border: `1px solid ${current ? r.color : 'var(--border-dim)'}`,
                background: current ? `linear-gradient(90deg, ${r.color}18, transparent)` : 'transparent',
                opacity: achieved ? 1 : 0.55
              }}>
                <div style={{
                  width: 36, height: 36,
                  border: `1.5px solid ${r.color}`, color: r.color,
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16,
                  boxShadow: achieved ? `0 0 14px ${r.glow}` : 'none'
                }}>{r.key}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', color: r.color, fontSize: 12, letterSpacing: '0.15em' }}>{r.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.threshold} XP</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{r.lore}</div>
                <div style={{ textAlign: 'right', fontSize: 10, color: achieved ? 'var(--ok)' : 'var(--text-muted)', letterSpacing: '0.2em' }}>
                  {achieved ? 'ACHIEVED' : 'LOCKED'}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
        <div className="panel-title" style={{ color: 'var(--rank-s)' }}>
          <span>DANGER ZONE :: RESET</span>
        </div>
        <div className="panel-body">
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
            Wipe all progression. XP, rank, streak, titles, journal. The System does not keep backups.
          </div>
          {!confirmReset
            ? <button onClick={() => setConfirmReset(true)} style={{ color: 'var(--rank-s)', borderColor: 'var(--rank-s)' }}>▸ RESET HUNTER</button>
            : <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { resetAll(); setConfirmReset(false); }} style={{ color: 'var(--rank-s)', borderColor: 'var(--rank-s)', boxShadow: '0 0 16px var(--rank-s-glow)' }}>◆ CONFIRM WIPE</button>
                <button onClick={() => setConfirmReset(false)}>CANCEL</button>
              </div>
          }
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--rank-color)', textShadow: '0 0 10px var(--rank-glow)' }}>{value}</div>
    </div>
  )
}
