import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildAuthUrl, exchangeCodeForTokens, isConnected, clearTokens,
  fetchFitbitStats, fetchFitbitSeries, getCredentials, saveCredentials
} from './fitbit.js'
import {
  fetchLeetcodeStats, invalidateLeetcodeCache, getUsername
} from './leetcode.js'
import { logError } from './log.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3001)

const app = express()
app.use(cors())
app.use(express.json())

// ---- Health / status ----

app.get('/api/health', (req, res) => {
  const creds = getCredentials()
  res.json({
    ok: true,
    port: PORT,
    fitbit: {
      configured: !!(creds.client_id && creds.client_secret),
      connected: isConnected(),
      redirect_uri: creds.redirect_uri
    },
    leetcode: {
      configured: !!getUsername(),
      username: getUsername() || null
    },
    serverTime: new Date().toISOString()
  })
})

// ---- Config (settings panel) ----

app.get('/api/config', (req, res) => {
  const creds = getCredentials()
  res.json({
    fitbit: {
      client_id: creds.client_id ? mask(creds.client_id) : '',
      client_secret: creds.client_secret ? '********' : '',
      redirect_uri: creds.redirect_uri,
      connected: isConnected(),
      configured: !!(creds.client_id && creds.client_secret)
    },
    leetcode: {
      username: getUsername()
    }
  })
})

function mask(v) { return v.length <= 6 ? v : v.slice(0, 3) + '***' + v.slice(-3) }

app.post('/api/config/fitbit', (req, res) => {
  try {
    const { client_id, client_secret, redirect_uri } = req.body || {}
    if (!client_id || !client_secret) return res.status(400).json({ error: 'client_id and client_secret required' })
    const saved = saveCredentials({ client_id, client_secret, redirect_uri })
    res.json({ ok: true, redirect_uri: saved.redirect_uri })
  } catch (e) { logError('POST /api/config/fitbit', e); res.status(500).json({ error: e.message }) }
})

app.post('/api/config/leetcode', (req, res) => {
  const { username } = req.body || {}
  if (!username) return res.status(400).json({ error: 'username required' })
  process.env.LEETCODE_USERNAME = String(username).trim()
  invalidateLeetcodeCache()
  res.json({ ok: true, username: process.env.LEETCODE_USERNAME })
})

// ---- Fitbit OAuth ----

app.get('/fitbit/authorize', (req, res) => {
  try {
    const url = buildAuthUrl()
    res.redirect(url)
  } catch (e) {
    logError('GET /fitbit/authorize', e)
    res.status(500).send(oauthErrorHtml(e.message))
  }
})

app.get('/fitbit/callback', async (req, res) => {
  const { code, state, error } = req.query
  if (error) return res.status(400).send(oauthErrorHtml(error))
  if (!code || !state) return res.status(400).send(oauthErrorHtml('Missing code or state'))
  try {
    await exchangeCodeForTokens(String(code), String(state))
    res.send(oauthSuccessHtml())
  } catch (e) {
    logError('GET /fitbit/callback', e)
    res.status(500).send(oauthErrorHtml(e.message))
  }
})

app.post('/api/fitbit/disconnect', (req, res) => {
  try { clearTokens(); res.json({ ok: true }) }
  catch (e) { logError('disconnect', e); res.status(500).json({ error: e.message }) }
})

// ---- Stats endpoints ----

app.get('/api/stats', async (req, res) => {
  const [fb, lc] = await Promise.allSettled([fetchFitbitStats(), fetchLeetcodeStats()])
  res.json({
    fitbit: fb.status === 'fulfilled' ? fb.value : { connected: false, error: fb.reason?.message },
    leetcode: lc.status === 'fulfilled' ? lc.value : { connected: false, error: lc.reason?.message }
  })
})

app.get('/api/fitbit/series', async (req, res) => {
  try { res.json(await fetchFitbitSeries()) }
  catch (e) { logError('series', e); res.status(500).json({ error: e.message }) }
})

app.post('/api/stats/force-sync', async (req, res) => {
  invalidateLeetcodeCache()
  try {
    const [fb, lc] = await Promise.allSettled([fetchFitbitStats(), fetchLeetcodeStats()])
    res.json({
      fitbit: fb.status === 'fulfilled' ? fb.value : { connected: false, error: fb.reason?.message },
      leetcode: lc.status === 'fulfilled' ? lc.value : { connected: false, error: lc.reason?.message }
    })
  } catch (e) { logError('force-sync', e); res.status(500).json({ error: e.message }) }
})

// ---- 404 + error handlers ----

app.use((req, res) => res.status(404).json({ error: 'not found', path: req.path }))

app.use((err, req, res, _next) => {
  logError('unhandled', err)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`\x1b[36m[PARALLAX GATE BACKEND]\x1b[0m listening on http://localhost:${PORT}`)
})

// ---- HTML responses for OAuth flow ----

function oauthSuccessHtml() {
  return `<!doctype html><html><head><title>FITBIT SYNC ACTIVE</title>
<style>
  body { background:#05060a; color:#d9e5ff; font-family: 'JetBrains Mono', monospace; display:grid; place-items:center; height:100vh; margin:0; }
  .card { border:1px solid #4ade80; padding:40px 60px; box-shadow: 0 0 40px rgba(74,222,128,0.35); text-align:center; }
  h1 { font-family: 'Orbitron', monospace; letter-spacing: 0.2em; color:#4ade80; text-shadow: 0 0 16px #4ade80; }
  p { color:#8896b5; letter-spacing: 0.12em; margin-top: 16px; font-size: 12px; }
  .note { color: #5ee1ff; margin-top: 24px; font-size: 11px; letter-spacing: 0.2em; }
</style></head>
<body>
  <div class="card">
    <h1>&#9670; FITBIT SYNC ACTIVE &#9670;</h1>
    <p>HUNTER BIOMETRICS ONLINE :: BIOMETRIC LINK ESTABLISHED</p>
    <p class="note">RETURN TO THE GATE. YOU MAY CLOSE THIS TAB.</p>
  </div>
</body></html>`
}

function oauthErrorHtml(msg) {
  return `<!doctype html><html><head><title>FITBIT AUTH FAILED</title>
<style>
  body { background:#05060a; color:#d9e5ff; font-family: 'JetBrains Mono', monospace; display:grid; place-items:center; height:100vh; margin:0; }
  .card { border:1px solid #ef4444; padding:40px 60px; box-shadow: 0 0 40px rgba(239,68,68,0.35); text-align:center; max-width: 560px; }
  h1 { font-family: 'Orbitron', monospace; letter-spacing: 0.2em; color:#ef4444; text-shadow: 0 0 16px #ef4444; }
  code { color:#8896b5; font-size: 11px; display:block; margin-top:20px; white-space: pre-wrap; word-break:break-word; }
</style></head>
<body>
  <div class="card">
    <h1>&#9670; AUTH FAILED &#9670;</h1>
    <code>${String(msg).replace(/[<>]/g, '')}</code>
  </div>
</body></html>`
}
