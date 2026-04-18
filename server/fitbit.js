import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { logError } from './log.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TOKENS_FILE = path.join(__dirname, 'tokens.json')
const CREDENTIALS_FILE = path.join(__dirname, 'credentials.json')

const AUTH_URL = 'https://www.fitbit.com/oauth2/authorize'
const TOKEN_URL = 'https://api.fitbit.com/oauth2/token'
const API_BASE = 'https://api.fitbit.com/1/user/-'
const SCOPES = 'activity heartrate sleep profile settings'

// In-memory PKCE verifiers, keyed by state
const pendingAuth = new Map()

// --------- Credentials (client_id + client_secret + redirect_uri) ---------

function cleanCredential(value) {
  const trimmed = String(value ?? '').trim()
  // Common copy/paste mistake: wrapping values in quotes.
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

export function getCredentials() {
  // Priority: credentials.json (written by settings UI) → env
  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'))
      const fromFile = {
        client_id: cleanCredential(raw.client_id),
        client_secret: cleanCredential(raw.client_secret),
        redirect_uri: cleanCredential(raw.redirect_uri) || 'http://localhost:3001/fitbit/callback'
      }
      if (fromFile.client_id && fromFile.client_secret) return fromFile
    } catch (e) { logError('read credentials.json', e) }
  }
  return {
    client_id: cleanCredential(process.env.FITBIT_CLIENT_ID),
    client_secret: cleanCredential(process.env.FITBIT_CLIENT_SECRET),
    redirect_uri: cleanCredential(process.env.FITBIT_REDIRECT_URI) || 'http://localhost:3001/fitbit/callback'
  }
}

export function saveCredentials(c) {
  const payload = {
    client_id: cleanCredential(c.client_id),
    client_secret: cleanCredential(c.client_secret),
    redirect_uri: cleanCredential(c.redirect_uri) || 'http://localhost:3001/fitbit/callback'
  }
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(payload, null, 2))
  return payload
}

// --------- Token store ---------

function readTokens() {
  try {
    if (!fs.existsSync(TOKENS_FILE)) return null
    return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'))
  } catch (e) { logError('read tokens', e); return null }
}

function writeTokens(t) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(t, null, 2))
}

export function clearTokens() {
  if (fs.existsSync(TOKENS_FILE)) fs.unlinkSync(TOKENS_FILE)
}

export function isConnected() {
  const t = readTokens()
  return !!(t && t.refresh_token)
}

// --------- PKCE ---------

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function makeVerifier() {
  return base64url(crypto.randomBytes(64)).slice(0, 96)
}
function makeChallenge(verifier) {
  return base64url(crypto.createHash('sha256').update(verifier).digest())
}

// --------- Auth URL builder ---------

export function buildAuthUrl() {
  const { client_id, redirect_uri } = getCredentials()
  if (!client_id) throw new Error('FITBIT_CLIENT_ID not configured')

  const state = crypto.randomBytes(16).toString('hex')
  const verifier = makeVerifier()
  const challenge = makeChallenge(verifier)
  pendingAuth.set(state, { verifier, created: Date.now() })
  // Expire stale entries
  for (const [k, v] of pendingAuth) if (Date.now() - v.created > 10 * 60 * 1000) pendingAuth.delete(k)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id,
    redirect_uri,
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state
  })
  return `${AUTH_URL}?${params.toString()}`
}

// --------- Token exchange ---------

export async function exchangeCodeForTokens(code, state) {
  const entry = pendingAuth.get(state)
  if (!entry) throw new Error('Unknown state — PKCE verifier not found')
  pendingAuth.delete(state)

  const { client_id, client_secret, redirect_uri } = getCredentials()
  if (!client_id || !client_secret) {
    throw new Error('Fitbit credentials missing. Save Client ID/Secret in CONFIG and retry.')
  }
  const body = new URLSearchParams({
    client_id,
    grant_type: 'authorization_code',
    redirect_uri,
    code,
    code_verifier: entry.verifier
  })

  const auth = Buffer.from(`${client_id}:${client_secret}`).toString('base64')
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Token exchange failed: ${JSON.stringify(data)}`)

  const tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
    scope: data.scope,
    user_id: data.user_id
  }
  writeTokens(tokens)
  return tokens
}

async function refreshAccessToken(refresh_token) {
  const { client_id, client_secret } = getCredentials()
  if (!client_id || !client_secret) throw new Error('Fitbit credentials missing')
  const auth = Buffer.from(`${client_id}:${client_secret}`).toString('base64')
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Refresh failed: ${JSON.stringify(data)}`)
  return data
}

export async function getValidToken() {
  const tokens = readTokens()
  if (!tokens) throw new Error('Not connected to Fitbit')
  const now = Date.now()
  if (tokens.expires_at - now < 5 * 60 * 1000) {
    try {
      const refreshed = await refreshAccessToken(tokens.refresh_token)
      const updated = {
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token || tokens.refresh_token,
        expires_at: Date.now() + (refreshed.expires_in * 1000),
        scope: refreshed.scope,
        user_id: refreshed.user_id
      }
      writeTokens(updated)
      return updated.access_token
    } catch (e) {
      logError('refresh_token', e)
      throw new Error('BIOMETRIC LINK SEVERED — re-auth required')
    }
  }
  return tokens.access_token
}

// --------- Data fetchers ---------

async function apiGet(pathStr) {
  const token = await getValidToken()
  const res = await fetch(`${API_BASE}${pathStr}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept-Language': 'en_US' }
  })
  if (res.status === 429) throw new Error('Fitbit rate limit — try again later')
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Fitbit ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

function todayISO() { return new Date().toISOString().slice(0, 10) }

export async function fetchFitbitStats() {
  if (!isConnected()) return { connected: false }
  const date = todayISO()

  // Fire all three in parallel but tolerate partial failures
  const [activityR, sleepR, hrR] = await Promise.allSettled([
    apiGet(`/activities/date/${date}.json`),
    apiGet(`/sleep/date/${date}.json`),
    apiGet(`/activities/heart/date/${date}/1d.json`)
  ])

  const out = {
    connected: true,
    date,
    lastUpdated: new Date().toISOString(),
    errors: []
  }

  if (activityR.status === 'fulfilled') {
    const s = activityR.value.summary || {}
    out.steps = s.steps ?? 0
    out.activeMinutes = (s.veryActiveMinutes ?? 0) + (s.fairlyActiveMinutes ?? 0)
    out.floors = s.floors ?? 0
    if (typeof s.restingHeartRate === 'number') out.restingHeartRate = s.restingHeartRate
    out.caloriesOut = s.caloriesOut ?? 0
  } else out.errors.push({ endpoint: 'activity', message: activityR.reason?.message })

  if (sleepR.status === 'fulfilled') {
    const sum = sleepR.value.summary || {}
    out.sleepMinutes = sum.totalMinutesAsleep ?? 0
    const sleeps = sleepR.value.sleep || []
    if (sleeps.length) {
      const main = sleeps.find(x => x.isMainSleep) || sleeps[0]
      out.sleepEfficiency = main.efficiency ?? null
    }
  } else out.errors.push({ endpoint: 'sleep', message: sleepR.reason?.message })

  if (hrR.status === 'fulfilled') {
    const hr = hrR.value['activities-heart']?.[0]?.value?.restingHeartRate
    if (typeof hr === 'number') out.restingHeartRate = hr
  } else out.errors.push({ endpoint: 'heart', message: hrR.reason?.message })

  return out
}

// --------- 7-day steps/sleep series (for stat detail drawer) ---------

export async function fetchFitbitSeries() {
  if (!isConnected()) return { connected: false }
  const [stepsR, hrR] = await Promise.allSettled([
    apiGet('/activities/steps/date/today/7d.json'),
    apiGet('/activities/heart/date/today/7d.json')
  ])
  const series = { connected: true, lastUpdated: new Date().toISOString() }
  if (stepsR.status === 'fulfilled') series.steps = stepsR.value['activities-steps'] || []
  if (hrR.status === 'fulfilled') series.heart = hrR.value['activities-heart'] || []
  return series
}
