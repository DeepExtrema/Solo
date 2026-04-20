import React, { useEffect, useState } from 'react'
import { useStats } from '../state/statsStore.jsx'
import { useStore } from '../state/store.jsx'
import { apiUrl, fitbitCallbackUrl } from '../lib/apiBase.js'

const FLAG_META = [
  { key: 'SLEEP_PROTOCOL_ENABLED',    label: 'SLEEP PROTOCOL',       desc: 'Nightly recovery score, debuffs, fatigue meter.' },
  { key: 'JOB_CHANGE_ENABLED',        label: 'JOB CHANGE QUEST',     desc: 'Class unlock trial at B-Rank.' },
  { key: 'LOOT_DROPS_ENABLED',        label: 'REWARD BOXES',         desc: 'Blessed / Cursed drops on 4/4 daily completion.' },
  { key: 'INSTANCE_DUNGEONS_ENABLED', label: 'INSTANCE DUNGEONS',    desc: 'Spawn private dungeons from keys.' },
  { key: 'BEDTIME_ALERT_ENABLED',     label: 'BEDTIME ALERT',        desc: 'System voice reminder 30 min before target bedtime.' }
]

export default function ConfigPanel() {
  const { health, refreshHealth, refresh, status, lastSync } = useStats()
  const { state: game, setSchedule, toggleFlag } = useStore()
  const [config, setConfig] = useState(null)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [lcUser, setLcUser] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const callbackUrl = fitbitCallbackUrl()

  useEffect(() => { loadConfig() }, [])

  async function loadConfig() {
    try {
      const r = await fetch(apiUrl('/api/config'))
      if (!r.ok) throw new Error('config ' + r.status)
      const j = await r.json()
      setConfig(j)
      setLcUser(j.leetcode?.username || '')
    } catch (e) { setMsg({ err: true, text: 'Backend unreachable. Check VITE_API_BASE_URL and server deployment.' }) }
  }

  async function saveFitbit() {
    const cleanId = clientId.trim()
    const cleanSecret = clientSecret.trim()
    if (!cleanId || !cleanSecret) return setMsg({ err: true, text: 'Both client_id and client_secret required.' })
    setSaving(true); setMsg(null)
    try {
      const r = await fetch(apiUrl('/api/config/fitbit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: cleanId, client_secret: cleanSecret })
      })
      if (!r.ok) throw new Error(await r.text())
      setMsg({ ok: true, text: 'Fitbit credentials saved. Ready to authorize.' })
      await loadConfig(); await refreshHealth()
      setClientId(''); setClientSecret('')
    } catch (e) { setMsg({ err: true, text: e.message }) }
    finally { setSaving(false) }
  }

  async function saveLeetcode() {
    if (!lcUser.trim()) return setMsg({ err: true, text: 'Username required.' })
    setSaving(true); setMsg(null)
    try {
      const r = await fetch(apiUrl('/api/config/leetcode'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: lcUser.trim() })
      })
      if (!r.ok) throw new Error(await r.text())
      setMsg({ ok: true, text: 'LeetCode username saved. Syncing…' })
      await loadConfig(); await refresh(true)
    } catch (e) { setMsg({ err: true, text: e.message }) }
    finally { setSaving(false) }
  }

  async function startFitbitAuth() {
    window.open(apiUrl('/fitbit/authorize'), '_blank')
    setMsg({ ok: true, text: 'Fitbit auth opened in new tab. Complete authorization, then click REFRESH STATUS.' })
  }

  async function disconnectFitbit() {
    if (!confirm('Disconnect Fitbit? You will need to re-authorize.')) return
    const r = await fetch(apiUrl('/api/fitbit/disconnect'), { method: 'POST' })
    if (r.ok) { setMsg({ ok: true, text: 'Fitbit disconnected.' }); await loadConfig(); await refreshHealth() }
  }

  async function forceSync() {
    setMsg({ ok: true, text: 'Forcing sync…' })
    const j = await refresh(true)
    setMsg(j ? { ok: true, text: 'Sync complete.' } : { err: true, text: 'Sync failed — check error.log' })
  }

  const fbConfigured = config?.fitbit?.configured
  const fbConnected = health?.fitbit?.connected
  const lcConfigured = !!config?.leetcode?.username

  return (
    <div className="col">
      <section className="panel">
        <div className="panel-title">
          <span>SYSTEM CFG :: BIOMETRIC LINK</span>
          <span style={{ color: fbConnected ? 'var(--ok)' : 'var(--warn)' }}>
            {fbConnected ? '◆ FITBIT SYNC ACTIVE' : (fbConfigured ? '◇ AWAITING AUTH' : '⬚ NOT CONFIGURED')}
          </span>
        </div>
        <div className="panel-body">
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
            Register a <strong style={{ color: 'var(--sys-cyan)' }}>Personal</strong> Fitbit app at
            {' '}<a href="https://dev.fitbit.com/apps/new" target="_blank" rel="noreferrer" style={{ color: 'var(--sys-cyan)' }}>dev.fitbit.com</a>.
            Set the callback URL to:
            <code style={{ display: 'inline-block', margin: '0 4px', padding: '2px 6px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-dim)', color: 'var(--sys-cyan)' }}>
              {callbackUrl}
            </code>
            Request the scopes: <em style={{ color: 'var(--text-primary)' }}>activity heartrate sleep profile settings</em>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <Field label="CURRENT CLIENT ID" value={config?.fitbit?.client_id || '— not set —'} />
            <Field label="CURRENT CLIENT SECRET" value={config?.fitbit?.client_secret || '— not set —'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
            <div>
              <Label>NEW CLIENT ID</Label>
              <Input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="23XXXX" />
            </div>
            <div>
              <Label>NEW CLIENT SECRET</Label>
              <Input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="••••••••••••••••" />
            </div>
            <button disabled={saving} onClick={saveFitbit}>SAVE CREDENTIALS</button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button
              disabled={!fbConfigured}
              onClick={startFitbitAuth}
              style={{ color: fbConfigured ? 'var(--sys-cyan)' : undefined, borderColor: fbConfigured ? 'var(--sys-cyan)' : undefined, boxShadow: fbConfigured ? '0 0 18px var(--sys-cyan-glow)' : 'none' }}
            >
              ▸ INITIALIZE FITBIT SYNC
            </button>
            <button onClick={() => { refreshHealth(); loadConfig() }}>REFRESH STATUS</button>
            {fbConnected && <button style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }} onClick={disconnectFitbit}>DISCONNECT FITBIT</button>}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>SYSTEM CFG :: COMBAT DATA</span>
          <span style={{ color: lcConfigured ? 'var(--ok)' : 'var(--warn)' }}>
            {lcConfigured ? '◆ LEETCODE LIVE' : '⬚ NOT CONFIGURED'}
          </span>
        </div>
        <div className="panel-body">
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
            Uses <a href="https://github.com/alfaarghya/alfa-leetcode-api" target="_blank" rel="noreferrer" style={{ color: 'var(--sys-cyan)' }}>alfa-leetcode-api</a>. No auth required.
            Cached 30 minutes server-side to respect rate limits.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
            <div>
              <Label>LEETCODE USERNAME</Label>
              <Input value={lcUser} onChange={e => setLcUser(e.target.value)} placeholder="e.g. uwi" />
            </div>
            <button disabled={saving} onClick={saveLeetcode}>SAVE USERNAME</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>SYSTEM CFG :: SLEEP PROTOCOL</span>
          <span style={{ color: game.featureFlags?.SLEEP_PROTOCOL_ENABLED ? 'var(--ok)' : 'var(--text-muted)' }}>
            {game.featureFlags?.SLEEP_PROTOCOL_ENABLED ? '◆ ACTIVE' : '⬚ DISABLED'}
          </span>
        </div>
        <div className="panel-body">
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
            Target bedtime and wake define the Recovery Score window. Late sleep incurs a bedtime penalty.
            Minimum hours threshold triggers automatic <strong style={{ color: 'var(--sys-cyan)' }}>d5 REST PROTOCOL</strong> clear.
          </p>
          <SleepScheduleEditor schedule={game.sleepSchedule} onSave={s => { setSchedule(s); setMsg({ ok: true, text: 'Sleep schedule updated.' }) }} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>SYSTEM CFG :: FEATURE FLAGS</span>
          <span style={{ color: 'var(--text-muted)' }}>MODULE 3 :: MANHWA MECHANICS</span>
        </div>
        <div className="panel-body">
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>
            Enable or disable subsystems independently. Disabled modules stop dispatching but preserve state —
            you can re-enable without losing progress.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FLAG_META.map(f => {
              const on = !!game.featureFlags?.[f.key]
              return (
                <div key={f.key} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
                  padding: '10px 12px',
                  border: `1px solid ${on ? 'var(--border-mid)' : 'var(--border-dim)'}`,
                  background: on ? 'rgba(74,222,128,0.04)' : 'rgba(0,0,0,0.3)'
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.25em',
                      color: on ? 'var(--ok)' : 'var(--text-primary)'
                    }}>
                      {on ? '◆' : '⬚'} {f.label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                      {f.desc}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFlag(f.key)}
                    style={{
                      color: on ? 'var(--ok)' : 'var(--text-muted)',
                      borderColor: on ? 'var(--ok)' : 'var(--border-mid)',
                      minWidth: 72,
                      padding: '6px 10px'
                    }}>
                    {on ? 'ON' : 'OFF'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>SYNC STATUS</span>
          <span style={{ color: status === 'ok' ? 'var(--ok)' : status === 'stale' ? 'var(--rank-a)' : status === 'loading' ? 'var(--sys-cyan)' : 'var(--warn)' }}>
            {status.toUpperCase()}
          </span>
        </div>
        <div className="panel-body" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <Label>LAST SYNC</Label>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--sys-cyan)' }}>
              {lastSync ? new Date(lastSync).toLocaleTimeString() : '— never —'}
            </div>
          </div>
          <div>
            <Label>POLL INTERVAL</Label>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-primary)' }}>15 MIN</div>
          </div>
          <button onClick={forceSync}>▸ FORCE SYNC NOW</button>
        </div>
      </section>

      {msg && (
        <div style={{
          padding: 12, border: `1px solid ${msg.err ? 'var(--warn)' : 'var(--ok)'}`,
          background: `rgba(${msg.err ? '239,68,68' : '74,222,128'},0.06)`,
          color: msg.err ? 'var(--warn)' : 'var(--ok)',
          fontSize: 11, letterSpacing: '0.15em',
          fontFamily: 'var(--font-mono)',
          textShadow: `0 0 10px ${msg.err ? 'rgba(255,107,107,0.4)' : 'rgba(74,222,128,0.4)'}`
        }}>
          {msg.err ? '◇ ' : '◆ '}{msg.text}
        </div>
      )}
    </div>
  )
}

function Label({ children }) {
  return <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--text-muted)', marginBottom: 4 }}>{children}</div>
}

function Input(props) {
  return <input
    {...props}
    style={{
      width: '100%',
      background: 'rgba(0,0,0,0.5)',
      border: '1px solid var(--border-mid)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      padding: '8px 10px',
      outline: 'none',
      letterSpacing: '0.05em'
    }}
  />
}

function SleepScheduleEditor({ schedule, onSave }) {
  const [bedtime, setBedtime] = useState(schedule?.bedtime || '23:30')
  const [wake, setWake] = useState(schedule?.wake || '07:00')
  const [minHours, setMinHours] = useState(String(schedule?.minHours ?? 7.5))

  useEffect(() => {
    setBedtime(schedule?.bedtime || '23:30')
    setWake(schedule?.wake || '07:00')
    setMinHours(String(schedule?.minHours ?? 7.5))
  }, [schedule?.bedtime, schedule?.wake, schedule?.minHours])

  const dirty =
    bedtime !== (schedule?.bedtime || '23:30') ||
    wake !== (schedule?.wake || '07:00') ||
    Number(minHours) !== (schedule?.minHours ?? 7.5)

  function save() {
    const mh = Math.max(4, Math.min(12, Number(minHours) || 7.5))
    onSave({ bedtime, wake, minHours: mh })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
      <div>
        <Label>TARGET BEDTIME</Label>
        <Input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} />
      </div>
      <div>
        <Label>TARGET WAKE</Label>
        <Input type="time" value={wake} onChange={e => setWake(e.target.value)} />
      </div>
      <div>
        <Label>MIN HOURS</Label>
        <Input type="number" step="0.5" min="4" max="12" value={minHours} onChange={e => setMinHours(e.target.value)} />
      </div>
      <button disabled={!dirty} onClick={save}
        style={{ color: dirty ? 'var(--sys-cyan)' : undefined, borderColor: dirty ? 'var(--sys-cyan)' : undefined }}>
        SAVE SCHEDULE
      </button>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{
        padding: '8px 10px',
        border: '1px solid var(--border-dim)',
        fontSize: 12, color: 'var(--text-primary)',
        background: 'rgba(0,0,0,0.3)',
        fontFamily: 'var(--font-mono)'
      }}>{value}</div>
    </div>
  )
}
