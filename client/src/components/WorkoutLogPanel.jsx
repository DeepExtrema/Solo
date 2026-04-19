import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { useStats } from '../state/statsStore.jsx'

const TYPES = [
  { key: 'strength', label: 'STRENGTH', color: 'var(--rank-s)' },
  { key: 'cardio',   label: 'CARDIO',   color: 'var(--sys-cyan)' },
  { key: 'mobility', label: 'MOBILITY', color: 'var(--rank-d)' }
]

const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function WorkoutLogPanel() {
  const { state, logWorkout, deleteWorkout } = useStore()
  const { workout } = useStats()
  const [date, setDate] = useState(todayKey())
  const [type, setType] = useState('strength')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')

  const streak = workout?.streak ?? 0
  const last7  = workout?.sessionsLast7 ?? 0
  const log    = state.workoutLog || []

  const canSave = !!date && !!type
  const submit = () => {
    if (!canSave) return
    logWorkout({
      date, type,
      duration: duration ? Number(duration) : null,
      notes: notes.trim()
    })
    setDuration(''); setNotes('')
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <span>WORKOUT LOG :: STRENGTH INPUT</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.2em' }}>
          STREAK :: <span style={{ color: streak > 0 ? 'var(--legendary)' : 'var(--text-muted)' }}>{streak}D</span>
          &nbsp;::&nbsp;LAST 7 :: <span style={{ color: last7 >= 4 ? 'var(--ok)' : 'var(--text-muted)' }}>{last7}</span>
        </span>
      </div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Fitbit can't see weight training. Log it here — sessions count toward STR,
          and every consecutive day pushes a <span style={{ color: 'var(--legendary)' }}>streak bonus</span> (up to +15).
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 100px auto', gap: 8, alignItems: 'stretch' }}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-mid)',
              color: 'var(--text-primary)', padding: '6px 10px', fontSize: 12, outline: 'none'
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                style={{
                  flex: 1, padding: '6px 10px',
                  fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.22em',
                  color: type === t.key ? t.color : 'var(--text-muted)',
                  borderColor: type === t.key ? t.color : 'var(--border-dim)',
                  background: type === t.key ? `${t.color}10` : 'rgba(0,0,0,0.3)',
                  boxShadow: type === t.key ? `0 0 10px ${t.color}55` : 'none'
                }}>
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="MIN"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min="0"
            max="600"
            style={{
              background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-mid)',
              color: 'var(--text-primary)', padding: '6px 10px', fontSize: 12, outline: 'none',
              fontFamily: 'var(--font-display)', letterSpacing: '0.15em'
            }}
          />
          <button onClick={submit} disabled={!canSave}>LOG</button>
        </div>

        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="notes (optional) — e.g. heavy squat day, PR pull"
          style={{
            background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-mid)',
            color: 'var(--text-primary)', padding: '6px 10px', fontSize: 12, outline: 'none'
          }}
        />

        {log.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
            {log.slice(0, 30).map((w, i) => {
              const typeDef = TYPES.find(t => t.key === w.type) || TYPES[0]
              return (
                <div key={`${w.date}-${w.type}-${i}`} style={{
                  display: 'grid', gridTemplateColumns: '110px 110px 70px 1fr 60px', gap: 8, alignItems: 'center',
                  padding: '6px 10px',
                  border: '1px solid var(--border-dim)',
                  background: 'rgba(0,0,0,0.3)',
                  fontSize: 11
                }}>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', letterSpacing: '0.15em' }}>
                    {w.date}
                  </span>
                  <span style={{ color: typeDef.color, fontFamily: 'var(--font-display)', letterSpacing: '0.2em', fontSize: 10 }}>
                    {typeDef.label}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {w.duration ? `${w.duration}m` : '—'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w.notes || '—'}
                  </span>
                  <button
                    onClick={() => deleteWorkout(w.date, w.type)}
                    style={{ fontSize: 9, color: 'var(--text-muted)', borderColor: 'var(--border-dim)', padding: '2px 6px' }}
                    title="Delete this entry">
                    DEL
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
