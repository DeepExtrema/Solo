// Server sync for hunter state.
// - Fetches from server on boot (falls back to localStorage on failure).
// - Debounces PUTs so a ceremony that fires multiple actions collapses to 1 write.

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (location.hostname === 'localhost' ? 'http://localhost:3001' : '')

export async function fetchHunterState() {
  try {
    const r = await fetch(`${API_BASE}/api/state`, { headers: { 'accept': 'application/json' } })
    if (r.status === 503) return { disabled: true }
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const json = await r.json()
    return { state: json?.state ?? null, updated_at: json?.updated_at ?? null }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[sync] fetchHunterState failed, using localStorage only:', e.message)
    return { offline: true }
  }
}

export function makeStateSyncer({ debounceMs = 1500 } = {}) {
  let timer = null
  let pending = null
  let lastSent = null

  async function flush() {
    timer = null
    const payload = pending
    if (!payload) return
    // Skip if nothing actually changed since the last PUT
    const serialized = JSON.stringify(payload)
    if (serialized === lastSent) return
    lastSent = serialized
    pending = null
    try {
      await fetch(`${API_BASE}/api/state`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ state: payload })
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[sync] PUT /api/state failed:', e.message)
      lastSent = null // allow retry on next change
    }
  }

  return {
    queue(state) {
      pending = state
      if (timer) clearTimeout(timer)
      timer = setTimeout(flush, debounceMs)
    },
    flushNow() {
      if (timer) { clearTimeout(timer); timer = null }
      return flush()
    }
  }
}

export async function postSleepNight(night) {
  try {
    await fetch(`${API_BASE}/api/sleep-nights`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ night })
    })
  } catch (e) { /* soft-fail */ }
}

export async function postQuestEvent(event) {
  try {
    await fetch(`${API_BASE}/api/quest-events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event })
    })
  } catch (e) { /* soft-fail */ }
}

export async function postJournalEntry(entry) {
  try {
    await fetch(`${API_BASE}/api/journal`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ entry })
    })
  } catch (e) { /* soft-fail */ }
}
