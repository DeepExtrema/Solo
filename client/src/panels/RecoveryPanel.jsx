import React from 'react'
import { useStore } from '../state/store.jsx'
import { useStats } from '../state/statsStore.jsx'
import { computeRecoveryScore, gradeOf, averageAndTrend } from '../data/sleep.js'
import RecoveryGauge from '../components/RecoveryGauge.jsx'
import SleepHistoryChart from '../components/SleepHistoryChart.jsx'
import SleepWindowBar from '../components/SleepWindowBar.jsx'

function MiniBar({ label, value, goal, unit, color, display }) {
  const pct = value == null ? 0 : Math.max(2, Math.min(100, (value / goal) * 100))
  const shown = display ?? (value == null ? '—' : `${value}${unit}`)
  return (
    <div style={{ padding: 10, border: '1px solid var(--border-dim)', background: 'rgba(0,0,0,0.35)' }}
         title={`${label} ${shown} / goal ${goal}${unit}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 10, letterSpacing: '0.2em' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color: value == null ? 'var(--text-muted)' : color }}>
          {shown} <span style={{ color: 'var(--text-muted)' }}>/ {goal}{unit}</span>
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border-dim)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}` }} />
      </div>
    </div>
  )
}

function hrvColor(v) {
  if (v == null) return 'var(--text-muted)'
  if (v >= 40) return 'var(--ok)'
  if (v >= 25) return 'var(--rank-a)'
  return 'var(--rank-s)'
}
function spo2Color(v) {
  if (v == null) return 'var(--text-muted)'
  if (v >= 95) return 'var(--ok)'
  if (v >= 90) return 'var(--rank-a)'
  return 'var(--rank-s)'
}
function brColor(v) {
  if (v == null) return 'var(--text-muted)'
  if (v >= 12 && v <= 20) return 'var(--ok)'
  return 'var(--warn)'
}
function readinessColor(score) {
  if (score == null) return 'var(--text-muted)'
  if (score >= 75) return 'var(--legendary)'
  if (score >= 50) return 'var(--sys-cyan)'
  return 'var(--warn)'
}

function ReadinessDial({ score, size = 200 }) {
  const color = readinessColor(score)
  const r = size / 2 - 14
  const c = 2 * Math.PI * r
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score))
  const offset = c * (1 - pct / 100)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
              stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      {score != null && (
        <circle cx={size/2} cy={size/2} r={r} fill="none"
                stroke={color} strokeWidth="10"
                strokeDasharray={c} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transform: `rotate(-90deg)`, transformOrigin: '50% 50%', filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dashoffset 800ms var(--ease-out)' }} />
      )}
      <text x="50%" y="47%" textAnchor="middle" fontSize="34" fontWeight="800"
            fontFamily="var(--font-display)"
            fill={color} style={{ textShadow: `0 0 10px ${color}` }}>
        {score == null ? '—' : score}
      </text>
      <text x="50%" y="65%" textAnchor="middle" fontSize="9" letterSpacing="0.3em"
            fill="var(--text-muted)">
        DAILY READINESS
      </text>
    </svg>
  )
}

export default function RecoveryPanel() {
  const { state } = useStore()
  const { sleep, raw } = useStats()
  const vitals = raw?.fitbit?.vitals || {}
  const readiness = vitals.readiness || sleep?.tonight?.readiness || null

  if (!state.featureFlags?.SLEEP_PROTOCOL_ENABLED) {
    return (
      <section className="panel">
        <div className="panel-title"><span>RECOVERY :: DISABLED</span></div>
        <div className="panel-body">
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.7 }}>
            Sleep Protocol is currently disabled. Re-enable it in <span style={{ color: 'var(--sys-cyan)' }}>SYSTEM CFG :: FEATURE FLAGS</span>.
          </div>
        </div>
      </section>
    )
  }

  const connected = sleep?.connected
  const tonight = sleep?.tonight
  const { score, source } = tonight ? computeRecoveryScore(tonight, state.sleepSchedule) : { score: 0, source: 'none' }
  const grade = gradeOf(score)
  const sourceLabel = source === 'fitbit_native' ? 'FITBIT SLEEP SCORE'
                    : source === 'readiness'    ? 'FITBIT READINESS'
                    : source === 'computed'     ? 'SYSTEM ESTIMATE'
                    : null

  const history = (state.sleepHistory || []).slice(0, 7)
  const { avg, trend, sample } = averageAndTrend(history)

  return (
    <div className="col">
      <section className="panel">
        <div className="panel-title">
          <span>TONIGHT :: RECOVERY STATUS</span>
          <span style={{ color: connected ? 'var(--ok)' : 'var(--warn)' }}>
            {connected ? '◆ FITBIT LINK LIVE' : '⬚ FITBIT OFFLINE'}
          </span>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: readiness ? '240px 240px 1fr' : '280px 1fr', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <RecoveryGauge score={score} size={readiness ? 200 : 240} />
          </div>
          {readiness && (
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <ReadinessDial score={readiness.score} size={200} />
            </div>
          )}
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 13,
              letterSpacing: '0.22em', color: grade.color, textShadow: `0 0 12px ${grade.color}`,
              marginBottom: 10
            }}>
              {grade.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 12 }}>
              {grade.message}
            </div>
            {sourceLabel && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.22em', marginBottom: 6 }}>
                SOURCE :: {sourceLabel}
              </div>
            )}
            {readiness?.category && (
              <div style={{ fontSize: 10, color: readinessColor(readiness.score), letterSpacing: '0.22em' }}>
                READINESS :: {String(readiness.category).toUpperCase()}
              </div>
            )}
            {!connected && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                — Connect Fitbit in SYSTEM CFG for live sleep data.
              </div>
            )}
            {connected && !tonight?.recorded && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                No sleep logged for tonight. The System awaits your rest cycle.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title"><span>SLEEP BREAKDOWN</span></div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <MiniBar label="TOTAL"      value={tonight?.totalMinutesAsleep ?? 0} goal={480} unit="m" color="var(--sys-cyan)" />
            <MiniBar label="EFFICIENCY" value={tonight?.efficiency ?? 0}         goal={100} unit="%" color="var(--ok)" />
            <MiniBar label="DEEP"       value={tonight?.stages?.deep ?? 0}       goal={90}  unit="m" color="var(--rank-c)" />
            <MiniBar label="REM"        value={tonight?.stages?.rem  ?? 0}       goal={100} unit="m" color="var(--rank-b)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <MiniBar
              label="HRV RMSSD"
              value={vitals.hrv?.rmssd}
              goal={80}
              unit="ms"
              color={hrvColor(vitals.hrv?.rmssd)}
            />
            <MiniBar
              label="SpO2 SATURATION"
              value={vitals.spo2?.avg}
              goal={100}
              unit="%"
              color={spo2Color(vitals.spo2?.avg)}
            />
            <MiniBar
              label="RESP RATE"
              value={vitals.breathingRate?.overall}
              goal={20}
              unit=" brpm"
              color={brColor(vitals.breathingRate?.overall)}
            />
          </div>
          {(vitals.restingHeartRate != null || vitals.cardioFitness?.vo2Max) && (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 4, fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.22em' }}>
              {vitals.restingHeartRate != null && (
                <span>RHR :: <span style={{ color: 'var(--text-primary)' }}>{vitals.restingHeartRate} bpm</span></span>
              )}
              {vitals.cardioFitness?.vo2Max && (
                <span>VO2 MAX :: <span style={{ color: 'var(--text-primary)' }}>{vitals.cardioFitness.vo2Max} mL/kg/min</span></span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title"><span>SLEEP WINDOW :: 24H ALIGNMENT</span></div>
        <div className="panel-body">
          <SleepWindowBar tonight={tonight} schedule={state.sleepSchedule} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>7-NIGHT HISTORY</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
            AVG {sample ? avg : '—'} :: TREND {trend.toUpperCase()}
          </span>
        </div>
        <div className="panel-body">
          <SleepHistoryChart history={history} />
        </div>
      </section>

      {(state.debuffs?.length > 0 || state.fatigue > 0) && (
        <section className="panel" style={{ borderColor: 'rgba(239,68,68,0.25)' }}>
          <div className="panel-title" style={{ color: 'var(--rank-s)' }}>
            <span>ACTIVE DEBUFFS</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
              FATIGUE :: {state.fatigue}/100
            </span>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {state.debuffs?.length > 0 ? state.debuffs.map((d, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '60px 1fr 180px', gap: 12,
                padding: '8px 10px',
                border: '1px solid rgba(239,68,68,0.35)',
                background: 'rgba(239,68,68,0.06)',
                fontSize: 11
              }}>
                <span style={{ fontFamily: 'var(--font-display)', color: 'var(--rank-s)', letterSpacing: '0.2em' }}>{d.stat}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{d.reason}</span>
                <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>CLEARS AFTER NEXT REST CYCLE</span>
              </div>
            )) : (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No active debuffs. Only fatigue accumulation.</div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
