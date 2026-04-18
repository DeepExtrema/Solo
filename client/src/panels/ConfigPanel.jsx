import React, { useEffect, useState } from 'react'
import { useStats } from '../state/statsStore.jsx'
import { apiUrl, fitbitCallbackUrl } from '../lib/apiBase.js'

export default function ConfigPanel() {
  const { health, refreshHealth, refresh, status, lastSync } = useStats()
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
          fontSize: 11, letterSpacing: '0.15em'
        }}>
          {msg.err ? '✕ ' : '✓ '}{msg.text}
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
