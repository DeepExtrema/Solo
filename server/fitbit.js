import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { logError } from './log.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TOKENS_FILE = path.join(__dirname, 'tokens.json')
const CREDENTIALS_FILE = path.join(__dirname, 'credentials.json')
const FITBIT_LOG = path.join(__dirname, 'fitbit.log')
const FITBIT_DEBUG = path.join(__dirname, 'fitbit.debug.json')

const AUTH_URL = 'https://www.fitbit.com/oauth2/authorize'
const TOKEN_URL = 'https://api.fitbit.com/oauth2/token'
const API_BASE = 'https://api.fitbit.com'
// Scopes expanded to cover HRV, breathing rate, SpO2, readiness, cardio fitness
const SCOPES = 'activity heartrate sleep profile settings respiratory_rate oxygen_saturation cardio_fitness'

// In-memory PKCE verifiers, keyed by state
const pendingAuth = new Map()

function fitbitLog(line) {
  try { fs.appendFileSync(FITBIT_LOG, `[${new Date().toISOString()}] ${line}\n`) } catch {}
}

// --------- Credentials (client_id + client_secret + redirect_uri) ---------

function cleanCredential(value) {
  const trimmed = String(value ?? '').trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

export function getCredentials() {
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

// --------- HTTP helpers ---------

// apiGet accepts a full path starting with '/1/user/-/...' or '/1.2/user/-/...'
async function apiGet(fullPath) {
  const token = await getValidToken()
  const res = await fetch(`${API_BASE}${fullPath}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept-Language': 'en_US' }
  })
  if (res.status === 429) throw new Error('Fitbit rate limit — try again later')
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`Fitbit ${res.status}: ${text.slice(0, 200)}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

// Safe variant — returns null on any failure, logs reason.
async function apiGetSafe(fullPath, label) {
  try {
    return await apiGet(fullPath)
  } catch (e) {
    fitbitLog(`${label} FAILED :: ${e.status || '?'} ${e.message?.slice(0, 140)}`)
    return null
  }
}

function todayLocalISO() {
  // Local date (YYYY-MM-DD) — Fitbit dateOfSleep is in the user's registered timezone.
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function isoNDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function syncAge(iso) {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`
  const hr = Math.round(min / 60)
  return `${hr} hour${hr === 1 ? '' : 's'} ago`
}

// --------- Sleep parsing (stages + classic fallback) ---------

// Parse a single Fitbit sleep record (from /sleep/date endpoint).
// Handles both stages and classic formats. Returns a normalized record.
function parseSleepRecord(main, { logFormat = false } = {}) {
  if (!main) return null
  const type = main.type || (main?.levels?.summary?.deep ? 'stages' : 'classic')
  const summary = main?.levels?.summary || {}

  let deep = 0, light = 0, rem = 0, wake = 0
  if (type === 'stages') {
    deep  = summary.deep?.minutes ?? 0
    light = summary.light?.minutes ?? 0
    rem   = summary.rem?.minutes ?? 0
    wake  = summary.wake?.minutes ?? 0
  } else {
    // Classic format: asleep / restless / awake
    light = summary.asleep?.minutes ?? main.minutesAsleep ?? 0
    wake  = (summary.awake?.minutes ?? 0) + (summary.restless?.minutes ?? 0)
  }

  if (logFormat) {
    fitbitLog(`SLEEP_PARSE: format=${type} | deep=${deep}m rem=${rem}m light=${light}m wake=${wake}m | efficiency=${main.efficiency ?? 'null'} minutesAsleep=${main.minutesAsleep ?? 'null'}`)
  }

  return {
    date: main.dateOfSleep || null,
    type,
    recorded: true,
    isMainSleep: !!main.isMainSleep,
    startTime: main.startTime || null,
    endTime: main.endTime || null,
    durationMinutes: Math.round((main.duration ?? 0) / 60000),
    totalMinutesAsleep: main.minutesAsleep ?? 0,
    efficiency: typeof main.efficiency === 'number' ? main.efficiency : null,
    stages: { deep, light, rem, wake },
    // Fitbit may include a score on the record itself
    fitbitScore: main?.levels?.score ?? main?.score ?? null
  }
}

// Decide schedule status given the start time and configured target.
// Returns one of: on_schedule | off_schedule | late_night
function scheduleStatusFor(startIso) {
  if (!startIso) return 'unknown'
  const s = new Date(startIso)
  const h = s.getHours() + s.getMinutes() / 60
  // If sleep started 3am-10am it's a "late night" pattern, not a simple bedtime miss
  if (h >= 3 && h < 10) return 'late_night'
  // 21:00–02:30 is the normal bedtime window
  if (h >= 21 || h <= 2.5) return 'on_schedule'
  return 'off_schedule'
}

// --------- Sleep score (native) ---------

async function fetchFitbitSleepScore(date) {
  // Fitbit has released /1/user/-/sleep/score/date/{date}.json for some accounts.
  // We attempt it; if it 404s or requires premium, we skip gracefully.
  const res = await apiGetSafe(`/1/user/-/sleep/score/date/${date}.json`, 'sleepScore')
  if (!res) return null
  // Common shapes: { sleepScore: { score, composition, revitalization, duration } }
  //             or: { sleepScore: [ { value: 90 } ] }
  if (typeof res?.sleepScore?.score === 'number') return res.sleepScore.score
  if (Array.isArray(res?.sleepScore) && typeof res.sleepScore[0]?.value === 'number') return res.sleepScore[0].value
  if (typeof res?.score === 'number') return res.score
  return null
}

// --------- Vitals fetchers (all null-safe) ---------

async function fetchHRV(date) {
  const r = await apiGetSafe(`/1/user/-/hrv/date/${date}.json`, 'hrv')
  if (!r) return null
  const v = r?.hrv?.[0]?.value
  if (!v) return null
  return {
    rmssd: typeof v.dailyRmssd === 'number' ? Math.round(v.dailyRmssd) : null,
    deepRmssd: typeof v.deepRmssd === 'number' ? Math.round(v.deepRmssd) : null
  }
}

async function fetchBreathingRate(date) {
  const r = await apiGetSafe(`/1/user/-/br/date/${date}.json`, 'br')
  if (!r) return null
  const v = r?.br?.[0]?.value
  if (!v) return null
  const num = (x) => typeof x === 'number' ? Math.round(x * 10) / 10 : null
  return {
    overall: num(v.breathingRate),
    deep:    num(v.deepSleepSummary?.breathingRate),
    rem:     num(v.remSleepSummary?.breathingRate),
    light:   num(v.lightSleepSummary?.breathingRate),
    full:    num(v.fullSleepSummary?.breathingRate)
  }
}

async function fetchSpO2(date) {
  const r = await apiGetSafe(`/1/user/-/spo2/date/${date}.json`, 'spo2')
  if (!r) return null
  const v = r?.value
  if (!v) return null
  const num = (x) => typeof x === 'number' ? Math.round(x) : null
  return { avg: num(v.avg), min: num(v.min), max: num(v.max) }
}

async function fetchReadiness(date) {
  // Readiness may require Premium; apiGetSafe handles 401/403 gracefully.
  const r = await apiGetSafe(`/1/user/-/readiness/date/${date}.json`, 'readiness')
  if (!r) return null
  const v = r?.readinessScore || r?.readiness?.[0]?.value || null
  if (!v) return null
  const score = typeof v.score === 'number' ? Math.round(v.score) : null
  if (score == null) return null
  return { score, category: v.category || null }
}

async function fetchCardioFitness(date) {
  const r = await apiGetSafe(`/1/user/-/cardioscore/date/${date}.json`, 'cardioscore')
  if (!r) return null
  const v = r?.cardioScore?.[0]?.value
  if (!v) return null
  return { vo2Max: typeof v.vo2Max === 'string' ? v.vo2Max : (typeof v.vo2Max === 'number' ? String(v.vo2Max) : null) }
}

// --------- Recovery score fallback formula ---------

function computeRecoveryScoreServer(sleep) {
  if (!sleep || !sleep.recorded) return null
  const totalMinutes = sleep.totalMinutesAsleep || 0
  const totalHours = totalMinutes / 60
  const deepScore     = Math.min((sleep.stages.deep  || 0) / 90,  1) * 25
  const remScore      = Math.min((sleep.stages.rem   || 0) / 100, 1) * 20
  const effScore      = ((sleep.efficiency ?? 0) / 100) * 25
  const durationScore = Math.min(totalHours / 8, 1) * 30
  const raw = deepScore + remScore + effScore + durationScore

  // Bedtime penalty: -5 per hour past 23:30, capped at -15. Skip for late_night mode.
  let bedtimePenalty = 0
  if (sleep.startTime) {
    const s = new Date(sleep.startTime)
    const actualBedHour = s.getHours() + s.getMinutes() / 60
    const status = scheduleStatusFor(sleep.startTime)
    if (status !== 'late_night') {
      const targetBedtime = 23.5
      // allow bed in early morning hours (past midnight) -> normalize
      const normalized = actualBedHour < 6 ? actualBedHour + 24 : actualBedHour
      const hoursPast = Math.max(0, normalized - targetBedtime)
      bedtimePenalty = Math.min(hoursPast * 5, 15)
    }
  }
  return Math.max(0, Math.round(raw - bedtimePenalty))
}

// --------- Main aggregate fetcher (used by /api/stats) ---------

export async function fetchFitbitStats() {
  if (!isConnected()) return { connected: false }
  const date = todayLocalISO()

  const [activityR, sleepR, hrR] = await Promise.allSettled([
    apiGet(`/1/user/-/activities/date/${date}.json`),
    apiGet(`/1.2/user/-/sleep/date/${date}.json`),
    apiGet(`/1/user/-/activities/heart/date/${date}/1d.json`)
  ])

  const out = {
    connected: true,
    date,
    lastUpdated: new Date().toISOString(),
    errors: []
  }

  // ---- Activity ----
  const activity = {}
  if (activityR.status === 'fulfilled') {
    const s = activityR.value.summary || {}
    activity.steps              = s.steps ?? 0
    activity.activeMinutes      = (s.veryActiveMinutes ?? 0) + (s.fairlyActiveMinutes ?? 0)
    activity.floors             = s.floors ?? 0
    activity.caloriesBurned     = s.caloriesOut ?? 0
    activity.activeZoneMinutes  = s.activeZoneMinutes?.activeZoneMinutes ?? s.activeZoneMinutes ?? 0
    // Back-compat top-level fields for existing client
    out.steps         = activity.steps
    out.activeMinutes = activity.activeMinutes
    out.floors        = activity.floors
    out.caloriesOut   = activity.caloriesBurned
    out.activeZoneMinutes = activity.activeZoneMinutes
    if (typeof s.restingHeartRate === 'number') out.restingHeartRate = s.restingHeartRate
  } else out.errors.push({ endpoint: 'activity', message: activityR.reason?.message })
  out.activity = activity

  // ---- Sleep (with robust parse) ----
  let sleepNormalized = null
  if (sleepR.status === 'fulfilled') {
    try {
      // dump the raw payload for debugging
      fs.writeFileSync(FITBIT_DEBUG, JSON.stringify({
        fetchedAt: new Date().toISOString(),
        date,
        sleepPayload: sleepR.value
      }, null, 2))
    } catch {}

    const sleeps = sleepR.value.sleep || []
    const main = sleeps.find(x => x.isMainSleep) || sleeps[0] || null
    if (main) {
      sleepNormalized = parseSleepRecord(main, { logFormat: true })
      sleepNormalized.scheduleStatus = scheduleStatusFor(sleepNormalized.startTime)
      // Back-compat:
      out.sleepMinutes = sleepNormalized.totalMinutesAsleep
      out.sleepEfficiency = sleepNormalized.efficiency
    } else {
      fitbitLog('SLEEP_PARSE: no sleep records for date=' + date)
    }
  } else out.errors.push({ endpoint: 'sleep', message: sleepR.reason?.message })

  // ---- Heart rate fallback (RHR may also live in heart series) ----
  if (hrR.status === 'fulfilled') {
    const hr = hrR.value['activities-heart']?.[0]?.value?.restingHeartRate
    if (typeof hr === 'number') out.restingHeartRate = hr
  } else out.errors.push({ endpoint: 'heart', message: hrR.reason?.message })

  // ---- Vitals (fetched in parallel, each independently tolerant) ----
  const [nativeScore, hrv, br, spo2, readiness, cardio] = await Promise.all([
    sleepNormalized ? fetchFitbitSleepScore(date) : Promise.resolve(null),
    fetchHRV(date),
    fetchBreathingRate(date),
    fetchSpO2(date),
    fetchReadiness(date),
    fetchCardioFitness(date)
  ])

  const vitals = {
    restingHeartRate: out.restingHeartRate ?? null,
    hrv: hrv || null,
    breathingRate: br || null,
    spo2: spo2 || null,
    readiness: readiness || null,
    cardioFitness: cardio || null
  }
  out.vitals = vitals

  // ---- Recovery score: native first, else fallback formula ----
  if (sleepNormalized) {
    let recoveryScore = null
    let recoverySource = null
    const fromRecord = sleepNormalized.fitbitScore
    if (typeof fromRecord === 'number') {
      recoveryScore = fromRecord
      recoverySource = 'fitbit_native'
    } else if (typeof nativeScore === 'number') {
      recoveryScore = nativeScore
      recoverySource = 'fitbit_native'
    } else if (readiness?.score != null) {
      // Readiness is a more holistic signal when sleep score is unavailable.
      recoveryScore = readiness.score
      recoverySource = 'readiness'
    } else {
      const computed = computeRecoveryScoreServer(sleepNormalized)
      if (computed != null) {
        recoveryScore = computed
        recoverySource = 'computed'
      }
    }
    sleepNormalized.recoveryScore = recoveryScore
    sleepNormalized.recoverySource = recoverySource
    fitbitLog(`RECOVERY :: score=${recoveryScore} source=${recoverySource} date=${date}`)
  }
  out.sleep = sleepNormalized || null

  // ---- Structured summary log ----
  fitbitLog(
    `STATS :: steps=${out.steps ?? 0} azm=${out.activeZoneMinutes ?? 0} active=${out.activeMinutes ?? 0} ` +
    `floors=${out.floors ?? 0} rhr=${out.restingHeartRate ?? '?'} hrv=${hrv?.rmssd ?? '?'} ` +
    `br=${br?.overall ?? '?'} spo2=${spo2?.avg ?? '?'} readiness=${readiness?.score ?? '?'} ` +
    `sleep=${sleepNormalized?.totalMinutesAsleep ?? 0}m deep=${sleepNormalized?.stages?.deep ?? 0}m ` +
    `rem=${sleepNormalized?.stages?.rem ?? 0}m eff=${sleepNormalized?.efficiency ?? '?'}%`
  )

  out.syncAge = syncAge(out.lastUpdated)
  return out
}

// --------- 7-day steps/heart series (stat detail drawer) ---------

export async function fetchFitbitSeries() {
  if (!isConnected()) return { connected: false }
  const [stepsR, hrR] = await Promise.allSettled([
    apiGet('/1/user/-/activities/steps/date/today/7d.json'),
    apiGet('/1/user/-/activities/heart/date/today/7d.json')
  ])
  const series = { connected: true, lastUpdated: new Date().toISOString() }
  if (stepsR.status === 'fulfilled') series.steps = stepsR.value['activities-steps'] || []
  if (hrR.status === 'fulfilled') series.heart = hrR.value['activities-heart'] || []
  return series
}

// --------- Sleep detail + 7-night history (for RECOVERY panel) ---------

export async function fetchFitbitSleep() {
  if (!isConnected()) return { connected: false }
  const today = todayLocalISO()
  const start = isoNDaysAgo(6)

  const rangeR = await apiGet(`/1.2/user/-/sleep/date/${start}/${today}.json`)
    .catch(e => ({ __err: e.message }))

  const out = { connected: true, lastUpdated: new Date().toISOString() }
  const byDate = new Map()

  if (rangeR && !rangeR.__err) {
    for (const s of (rangeR.sleep || [])) {
      if (!s.dateOfSleep) continue
      const existing = byDate.get(s.dateOfSleep)
      if (!existing || s.isMainSleep) byDate.set(s.dateOfSleep, s)
    }
  } else if (rangeR?.__err) {
    out.errors = [{ endpoint: 'sleep-range', message: rangeR.__err }]
  }

  // Build 7 consecutive nights (newest first)
  const nights = []
  for (let i = 0; i < 7; i++) {
    const d = isoNDaysAgo(i)
    const main = byDate.get(d)
    if (!main) { nights.push({ date: d, recorded: false }); continue }
    const parsed = parseSleepRecord(main, { logFormat: i === 0 })
    parsed.scheduleStatus = scheduleStatusFor(parsed.startTime)
    nights.push(parsed)
  }

  // Enrich tonight with native score / readiness in parallel with sleep-range fetch result
  const tonight = nights[0]
  if (tonight?.recorded) {
    const [nativeScore, readiness] = await Promise.all([
      fetchFitbitSleepScore(tonight.date).catch(() => null),
      fetchReadiness(tonight.date).catch(() => null)
    ])
    let recoveryScore = null
    let recoverySource = null
    if (typeof tonight.fitbitScore === 'number') {
      recoveryScore = tonight.fitbitScore; recoverySource = 'fitbit_native'
    } else if (typeof nativeScore === 'number') {
      recoveryScore = nativeScore; recoverySource = 'fitbit_native'
    } else if (readiness?.score != null) {
      recoveryScore = readiness.score; recoverySource = 'readiness'
    } else {
      const computed = computeRecoveryScoreServer(tonight)
      if (computed != null) { recoveryScore = computed; recoverySource = 'computed' }
    }
    tonight.recoveryScore = recoveryScore
    tonight.recoverySource = recoverySource
    if (readiness) tonight.readiness = readiness
  }

  out.tonight = tonight
  out.history = nights
  return out
}
