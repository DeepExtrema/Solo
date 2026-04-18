import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STATS } from '../data/stats.js'
import { useStats } from '../state/statsStore.jsx'

export default function StatDetailDrawer({ statKey, onClose }) {
  const { raw } = useStats()
  const [series, setSeries] = useState(null)

  useEffect(() => {
    if (statKey === 'STR' || statKey === 'VIT' || statKey === 'SEN') {
      fetch('/api/fitbit/series').then(r => r.ok ? r.json() : null).then(setSeries).catch(() => {})
    }
  }, [statKey])

  const def = statKey ? STATS[statKey] : null

  return (
    <AnimatePresence>
      {statKey && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 80 }}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 170 }}
            style={{
              position: 'fixed', right: 0, top: 44, bottom: 0,
              width: 480,
              background: 'linear-gradient(180deg, var(--bg-panel), var(--bg-deep))',
              borderLeft: `2px solid ${def.color}`,
              boxShadow: `-20px 0 60px rgba(0,0,0,0.7), 0 0 40px ${def.glow}`,
              zIndex: 81,
              overflowY: 'auto'
            }}
          >
            <div style={{
              padding: '18px 22px', borderBottom: `1px solid ${def.color}`,
              position: 'sticky', top: 0,
              background: 'linear-gradient(180deg, rgba(10,12,22,0.97), rgba(10,12,22,0.92))', zIndex: 2
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: '0.35em', color: 'var(--text-muted)' }}>
                    STAT INSPECTION
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22,
                    color: def.color, textShadow: `0 0 16px ${def.glow}`, letterSpacing: '0.15em', marginTop: 4
                  }}>
                    {def.name}
                  </div>
                </div>
                <button onClick={onClose}>✕ CLOSE</button>
              </div>
              <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: 11, marginTop: 8 }}>
                "{def.flavor}"
              </div>
            </div>

            <div style={{ padding: 22 }}>
              {statKey === 'INT' && <IntDetail leetcode={raw.leetcode} />}
              {statKey === 'AGI' && <AgiDetail leetcode={raw.leetcode} />}
              {statKey === 'STR' && <StrDetail fitbit={raw.fitbit} series={series} />}
              {statKey === 'VIT' && <VitDetail fitbit={raw.fitbit} series={series} />}
              {statKey === 'SEN' && <SenDetail fitbit={raw.fitbit} series={series} />}
              {statKey === 'CHA' && <ChaDetail />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.35em', color: 'var(--sys-cyan)', marginBottom: 10 }}>▸ {title}</div>
      {children}
    </div>
  )
}

function Row({ k, v, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border-dim)' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 11, letterSpacing: '0.1em' }}>{k}</span>
      <span style={{ color: color || 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: 12 }}>{v}</span>
    </div>
  )
}

function IntDetail({ leetcode }) {
  if (!leetcode?.connected) return <Offline label="LEETCODE" />
  return (
    <>
      <Section title="PROBLEMS BY DIFFICULTY">
        <Row k="EASY"   v={leetcode.easySolved}   color="var(--rank-d)" />
        <Row k="MEDIUM" v={leetcode.mediumSolved} color="var(--rank-a)" />
        <Row k="HARD"   v={leetcode.hardSolved}   color="var(--rank-s)" />
        <Row k="TOTAL"  v={leetcode.totalSolved}  color="var(--sys-cyan)" />
      </Section>
      <Section title="SUBMISSIONS">
        <Row k="LAST 7 DAYS"  v={leetcode.submissionsLast7} />
        <Row k="LAST 30 DAYS" v={leetcode.submissionsLast30} />
        <Row k="STREAK"       v={`${leetcode.streak}D`} color={leetcode.streak >= 7 ? 'var(--ok)' : undefined} />
        <Row k="TODAY"        v={leetcode.submittedToday ? 'SUBMITTED' : 'PENDING'} color={leetcode.submittedToday ? 'var(--ok)' : 'var(--warn)'} />
      </Section>
      {leetcode.skills && <SkillBreakdown skills={leetcode.skills} />}
      {leetcode.submissionCalendar && <Heatmap calendar={leetcode.submissionCalendar} />}
    </>
  )
}

function AgiDetail({ leetcode }) {
  if (!leetcode?.connected) return <Offline label="LEETCODE" />
  return (
    <>
      <Section title="EXECUTION METRICS">
        <Row k="ACCEPTANCE RATE"   v={`${(leetcode.acceptanceRate ?? 0).toFixed(1)}%`} />
        <Row k="SUBMISSIONS / 30D" v={leetcode.submissionsLast30} />
        <Row k="AVG / DAY"         v={((leetcode.submissionsLast30 ?? 0) / 30).toFixed(1)} />
        <Row k="RANKING"           v={leetcode.ranking ?? '—'} />
      </Section>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
        AGILITY rewards cadence over spikes. Thirty steady days beats seven hero days.
      </div>
    </>
  )
}

function StrDetail({ fitbit, series }) {
  if (!fitbit?.connected) return <Offline label="FITBIT" />
  return (
    <>
      <Section title="TODAY">
        <Row k="STEPS"           v={fitbit.steps?.toLocaleString() ?? '—'} />
        <Row k="ACTIVE MINUTES"  v={fitbit.activeMinutes ?? '—'} />
        <Row k="FLOORS CLIMBED"  v={fitbit.floors ?? '—'} />
        <Row k="CALORIES BURNED" v={fitbit.caloriesOut?.toLocaleString() ?? '—'} />
      </Section>
      {series?.steps && <StepsChart steps={series.steps} />}
    </>
  )
}

function VitDetail({ fitbit, series }) {
  if (!fitbit?.connected) return <Offline label="FITBIT" />
  const hours = (fitbit.sleepMinutes ?? 0) / 60
  return (
    <>
      <Section title="TODAY">
        <Row k="SLEEP"             v={`${hours.toFixed(1)} hrs`} color={hours >= 7 ? 'var(--ok)' : 'var(--warn)'} />
        <Row k="SLEEP EFFICIENCY"  v={`${fitbit.sleepEfficiency ?? '—'}%`} />
        <Row k="RESTING HEART RATE" v={`${fitbit.restingHeartRate ?? '—'} bpm`} />
      </Section>
      {series?.heart && <HeartChart heart={series.heart} />}
    </>
  )
}

function SenDetail({ fitbit, series }) {
  if (!fitbit?.connected) return <Offline label="FITBIT" />
  const pct = Math.min(100, ((fitbit.steps ?? 0) / 10000) * 100)
  return (
    <>
      <Section title="DAILY STEPS">
        <Row k="STEPS"    v={fitbit.steps?.toLocaleString() ?? '—'} />
        <Row k="TO 10K"   v={`${Math.max(0, 10000 - (fitbit.steps ?? 0)).toLocaleString()}`} color={pct >= 100 ? 'var(--ok)' : undefined} />
        <Row k="PERCENT"  v={`${pct.toFixed(0)}%`} />
      </Section>
      {series?.steps && <StepsChart steps={series.steps} />}
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic', marginTop: 10 }}>
        Walk the world. The hunter who moves sees.
      </div>
    </>
  )
}

function ChaDetail() {
  return (
    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
      <Section title="QUEST-BASED">
        CHARISMA is not measured by a sensor. It compounds through quest completions —
        interviews survived, pitches delivered, networking events attended. Each relevant
        main-quest clear grants <strong style={{ color: 'var(--rank-b)' }}>+5 CHA</strong>, to a
        cap of 100.
      </Section>
      <Section title="QUALIFYING QUESTS">
        <div style={{ color: 'var(--rank-b)' }}>THE FIRST GATE</div>
        <div style={{ color: 'var(--rank-b)' }}>BLOOD ON THE FLOOR</div>
        <div style={{ color: 'var(--rank-b)' }}>PARALLAX PROTOCOL</div>
        <div style={{ color: 'var(--rank-b)' }}>THE DESERT WAVE</div>
        <div style={{ color: 'var(--rank-b)' }}>THE VOICE ACROSS</div>
      </Section>
    </div>
  )
}

function Offline({ label }) {
  return (
    <div style={{ padding: 20, textAlign: 'center', border: '1px dashed var(--warn)', color: 'var(--warn)', letterSpacing: '0.2em' }}>
      ⬚ {label} OFFLINE — CONFIGURE IN SYSTEM CFG
    </div>
  )
}

function SkillBreakdown({ skills }) {
  // alfa-leetcode-api often returns { advanced:[{tagName,problemsSolved}], intermediate:[...], fundamental:[...] }
  const buckets = ['fundamental', 'intermediate', 'advanced']
  const found = buckets.filter(b => Array.isArray(skills[b]) && skills[b].length)
  if (!found.length) return null
  return (
    <Section title="TOPIC BREAKDOWN">
      {found.map(b => (
        <div key={b} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: 4 }}>{b.toUpperCase()}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {skills[b].slice(0, 10).map(s => (
              <span key={s.tagName} className="tag" style={{ color: 'var(--sys-cyan)', borderColor: 'var(--sys-cyan-dim)' }}>
                {s.tagName} · {s.problemsSolved}
              </span>
            ))}
          </div>
        </div>
      ))}
    </Section>
  )
}

function Heatmap({ calendar }) {
  const today = new Date()
  const cells = []
  const byDay = {}
  for (const [k, v] of Object.entries(calendar)) {
    const d = new Date(Number(k) * 1000).toISOString().slice(0, 10)
    byDay[d] = (byDay[d] || 0) + Number(v)
  }
  for (let i = 41; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const n = byDay[key] || 0
    cells.push({ key, n })
  }
  const maxN = Math.max(1, ...cells.map(c => c.n))
  return (
    <Section title="SUBMISSION HEATMAP (6 WEEKS)">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 3 }}>
        {cells.map(c => {
          const intensity = c.n === 0 ? 0.07 : 0.2 + (c.n / maxN) * 0.8
          return <div key={c.key} title={`${c.key} :: ${c.n}`} style={{
            aspectRatio: '1',
            background: c.n > 0 ? `rgba(94,225,255,${intensity})` : 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-dim)',
            boxShadow: c.n > 0 ? '0 0 6px var(--sys-cyan-glow)' : 'none'
          }} />
        })}
      </div>
    </Section>
  )
}

function StepsChart({ steps }) {
  const vals = steps.slice(-7).map(s => ({ date: s.dateTime, v: Number(s.value) || 0 }))
  const max = Math.max(10000, ...vals.map(v => v.v))
  return (
    <Section title="STEPS — LAST 7 DAYS">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
        {vals.map(v => (
          <div key={v.date} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: `${(v.v / max) * 90}px`,
              background: `linear-gradient(180deg, var(--legendary), rgba(255,215,106,0.2))`,
              boxShadow: '0 0 8px var(--legendary-glow)',
              border: '1px solid var(--legendary)'
            }} />
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>{v.date.slice(5)}</div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function HeartChart({ heart }) {
  const vals = heart.slice(-7).map(d => ({ date: d.dateTime, v: d.value?.restingHeartRate }))
  const clean = vals.filter(x => typeof x.v === 'number')
  if (!clean.length) return null
  const min = Math.min(...clean.map(v => v.v)) - 3
  const max = Math.max(...clean.map(v => v.v)) + 3
  return (
    <Section title="RESTING HR — LAST 7 DAYS">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
        {clean.map(v => (
          <div key={v.date} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              height: `${((v.v - min) / (max - min)) * 80}px`,
              background: 'linear-gradient(180deg, var(--rank-d), rgba(74,222,128,0.3))',
              border: '1px solid var(--rank-d)'
            }} />
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>{v.v}</div>
          </div>
        ))}
      </div>
    </Section>
  )
}
