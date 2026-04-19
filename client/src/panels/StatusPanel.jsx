import React from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../state/store.jsx'
import { useStats } from '../state/statsStore.jsx'
import { RANKS, rankFromXP, nextRank } from '../data/ranks.js'
import { DAILY_QUESTS, MAIN_QUESTS } from '../data/quests.js'
import { NODES } from '../data/skillTree.js'
import XPBar from '../components/XPBar.jsx'
import FatigueBadge from '../components/FatigueBadge.jsx'
import InstanceDungeonCard from '../components/InstanceDungeonCard.jsx'

const DIFF_COLOR = {
  Easy: 'var(--rank-d)',
  Medium: 'var(--rank-a)',
  Hard: 'var(--rank-s)'
}

export default function StatusPanel() {
  const { state, rank, completeDaily } = useStore()
  const { raw, status } = useStats()
  const flags = state.featureFlags || {}
  const showDungeonCard = flags.INSTANCE_DUNGEONS_ENABLED && state.activeDungeon
  const daily = raw?.leetcode?.daily
  const next = nextRank(rank.key)
  const activeMain = MAIN_QUESTS.find(q => !state.completedQuests.includes(q.id))
  const dailyDone = Object.values(state.dailyProgress).filter(Boolean).length
  const totalMain = MAIN_QUESTS.length
  const doneMain = state.completedQuests.length
  const totalNodes = NODES.length
  const doneNodes = state.completedNodes.length

  return (
    <div className="col">
      {showDungeonCard && <InstanceDungeonCard />}
      {/* HERO */}
      <section className="panel" style={{ overflow: 'hidden' }}>
        <div className="panel-title">
          <span>STATUS :: HUNTER PROFILE</span>
          <span style={{ color: 'var(--text-muted)' }}>[SESSION :: {new Date().toLocaleDateString()}]</span>
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 24, alignItems: 'center' }}>
            {/* Giant rank glyph */}
            <div style={{
              width: 140, height: 140, position: 'relative',
              display: 'grid', placeItems: 'center',
              border: '2px solid var(--rank-color)',
              boxShadow: '0 0 40px var(--rank-glow), inset 0 0 30px rgba(255,255,255,0.04)',
              background: 'radial-gradient(circle at center, rgba(0,0,0,0.3), rgba(0,0,0,0.8))'
            }}>
              <div style={{
                position: 'absolute', inset: -8,
                border: '1px solid var(--rank-color)', opacity: 0.3
              }} />
              <motion.div
                animate={{ opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 82,
                  color: 'var(--rank-color)',
                  textShadow: '0 0 30px var(--rank-glow)',
                  lineHeight: 1
                }}
              >
                {rank.key}
              </motion.div>
            </div>

            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-secondary)' }}>CLASSIFICATION</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: 30, letterSpacing: '0.15em',
                color: 'var(--rank-color)',
                textShadow: '0 0 18px var(--rank-glow)',
                marginTop: 4
              }}>
                {rank.title}
              </div>
              <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: 6, fontSize: 12 }}>
                "{rank.subtitle}"
              </div>
              {flags.SLEEP_PROTOCOL_ENABLED && state.fatigue >= 50 && (
                <div style={{ marginTop: 10 }}>
                  <FatigueBadge fatigue={state.fatigue} />
                </div>
              )}
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 560 }}>
                {rank.lore}
              </div>

              <div style={{ marginTop: 18 }}>
                <XPBar />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="grid-3">
        <StatCard label="STREAK" value={`${state.streak}D`} sub={state.streak >= 7 ? 'MOMENTUM LOCKED' : 'KEEP THE CHAIN'} />
        <StatCard label="QUESTS CLEARED" value={`${doneMain} / ${totalMain}`} sub="MAIN STORY" />
        <StatCard label="NODES UNLOCKED" value={`${doneNodes} / ${totalNodes}`} sub="SKILL TREE" />
      </section>

      <div className="grid-2">
        {/* DAILY QUESTS */}
        <section className="panel">
          <div className="panel-title">
            <span>DAILY RAIDS :: {dailyDone}/{DAILY_QUESTS.length}</span>
            <span style={{ color: dailyDone === DAILY_QUESTS.length ? 'var(--ok)' : 'var(--text-muted)' }}>
              {dailyDone === DAILY_QUESTS.length ? '◆ CLEARED' : '◇ ACTIVE'}
            </span>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DAILY_QUESTS.map(q => {
              const done = state.dailyProgress[q.id]
              return (
                <div key={q.id} style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr auto auto', gap: 12, alignItems: 'center',
                  padding: '10px 12px',
                  border: `1px solid ${done ? 'var(--ok)' : 'var(--border-dim)'}`,
                  background: done ? 'rgba(74,222,128,0.05)' : 'rgba(0,0,0,0.25)',
                  transition: 'all 200ms var(--ease-out)'
                }}>
                  <div style={{
                    width: 20, height: 20,
                    border: `1.5px solid ${done ? 'var(--ok)' : 'var(--border-mid)'}`,
                    display: 'grid', placeItems: 'center',
                    color: 'var(--ok)',
                    boxShadow: done ? '0 0 12px var(--ok)' : 'none'
                  }}>
                    {done && '✓'}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, letterSpacing: '0.12em', color: done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
                      {q.name}
                      {q.id === 'd1' && raw?.leetcode?.connected && (
                        <span style={{ marginLeft: 8, fontSize: 9, color: 'var(--ok)', letterSpacing: '0.2em' }}>:: AUTO-DETECT</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{q.desc}</div>
                  </div>
                  <span className="tag" style={{ color: 'var(--sys-cyan)', borderColor: 'var(--sys-cyan-dim)' }}>+{q.xp} XP</span>
                  <button disabled={done} onClick={() => completeDaily(q.id)}>
                    {done ? 'DONE' : 'CLEAR'}
                  </button>
                </div>
              )
            })}
            {dailyDone === DAILY_QUESTS.length && (
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ok)', letterSpacing: '0.15em', textAlign: 'center' }}>
                ▸ ALL DAILIES CLEARED. STREAK BANKED AT NEXT DAY ROLLOVER.
              </div>
            )}
          </div>
        </section>

        {/* ACTIVE MAIN QUEST */}
        <section className="panel">
          <div className="panel-title">
            <span>ACTIVE MAIN QUEST</span>
            <span style={{ color: 'var(--text-muted)' }}>{doneMain}/{totalMain} CLEARED</span>
          </div>
          <div className="panel-body">
            {activeMain ? (
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
                  NEXT OBJECTIVE
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: 22, letterSpacing: '0.08em',
                  color: activeMain.legendary ? 'var(--legendary)' : 'var(--sys-cyan)',
                  textShadow: activeMain.legendary ? '0 0 20px var(--legendary-glow)' : '0 0 14px var(--sys-cyan-glow)',
                  marginTop: 4, marginBottom: 10
                }}>
                  {activeMain.name}
                </div>
                <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.6, marginBottom: 14 }}>
                  "{activeMain.flavor}"
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-primary)', marginBottom: 6 }}>
                  ▸ {activeMain.objective}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
                  <span className="tag" style={{ color: 'var(--rank-color)', borderColor: 'var(--rank-color)' }}>REWARD +{activeMain.xp} XP</span>
                  {activeMain.grantsTitle && <span className="tag" style={{ color: 'var(--legendary)' }}>TITLE :: {activeMain.grantsTitle}</span>}
                  {activeMain.legendary && <span className="tag" style={{ color: 'var(--legendary)', borderColor: 'var(--legendary)' }}>◆ LEGENDARY</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 16, letterSpacing: '0.15em' }}>
                  — GO TO QUEST LOG TO CLEAR —
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--legendary)', textShadow: '0 0 18px var(--legendary-glow)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.2em' }}>ALL QUESTS CLEARED</div>
                <div style={{ fontSize: 10, marginTop: 8, color: 'var(--text-secondary)', letterSpacing: '0.2em' }}>THE MONARCH RESTS. BRIEFLY.</div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* DAILY DUNGEON — LeetCode daily problem */}
      {daily && (
        <section className="panel">
          <div className="panel-title">
            <span>DAILY DUNGEON :: LEETCODE GATE OF THE DAY</span>
            <span style={{ color: DIFF_COLOR[daily.difficulty] || 'var(--text-muted)' }}>
              ◆ {daily.difficulty?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.25em' }}>
                {daily.date || 'TODAY'}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
                color: DIFF_COLOR[daily.difficulty] || 'var(--sys-cyan)',
                letterSpacing: '0.1em', marginTop: 4,
                textShadow: `0 0 14px ${DIFF_COLOR[daily.difficulty] || 'var(--sys-cyan)'}`
              }}>
                {daily.title}
              </div>
              {daily.topicTags?.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {daily.topicTags.slice(0, 6).map(t => (
                    <span key={t.name || t} className="tag">{t.name || t}</span>
                  ))}
                </div>
              )}
              {raw?.leetcode?.submittedToday && (
                <div style={{ marginTop: 10, color: 'var(--ok)', fontSize: 11, letterSpacing: '0.2em' }}>
                  ◆ SUBMISSION DETECTED TODAY — INT SURGING
                </div>
              )}
            </div>
            {daily.link && (
              <a href={daily.link} target="_blank" rel="noreferrer">
                <button style={{ color: 'var(--sys-cyan)', borderColor: 'var(--sys-cyan)', boxShadow: '0 0 18px var(--sys-cyan-glow)', padding: '12px 18px' }}>
                  ▸ ENTER DUNGEON
                </button>
              </a>
            )}
          </div>
        </section>
      )}

      {/* SYSTEM DISPATCH */}
      <section className="panel">
        <div className="panel-title">
          <span>SYSTEM :: DISPATCH</span>
          <span style={{ color: 'var(--text-muted)' }}>LIVE</span>
        </div>
        <div className="panel-body" style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          <div style={{ color: 'var(--sys-cyan)', marginBottom: 6, letterSpacing: '0.12em' }}>▸ HUNTER {state.hunterName}. STATUS UPDATED.</div>
          {next ? (
            <div>▸ {next.threshold - state.xp} XP TO RANK {next.key} — <span style={{ color: next.color }}>{next.title}</span>.</div>
          ) : (
            <div>▸ TERMINAL RANK REACHED. THE CITY STANDS.</div>
          )}
          <div>▸ STREAK :: {state.streak} DAYS. {state.streak >= 30 ? 'RELENTLESS.' : state.streak >= 7 ? 'MOMENTUM LOCKED.' : 'BUILD THE CHAIN.'}</div>
          {dailyDone < DAILY_QUESTS.length
            ? <div style={{ color: 'var(--warn)' }}>▸ WARNING: {DAILY_QUESTS.length - dailyDone} DAILY OBJECTIVE(S) OUTSTANDING. PENALTY RAID COSMETIC.</div>
            : <div style={{ color: 'var(--ok)' }}>▸ ALL DAILY OBJECTIVES CLEARED. SYSTEM ACKNOWLEDGES.</div>
          }
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="panel" style={{ padding: 0 }}>
      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800,
          color: 'var(--rank-color)', textShadow: '0 0 18px var(--rank-glow)',
          marginTop: 6, letterSpacing: '0.05em'
        }}>{value}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em', marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  )
}
