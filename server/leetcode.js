import { logError } from './log.js'

const BASE = 'https://alfa-leetcode-api.onrender.com'
const CACHE_MS = 30 * 60 * 1000

const cache = new Map() // key -> { value, fetchedAt }

async function getCached(key, fetcher) {
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.fetchedAt < CACHE_MS) return hit.value
  try {
    const value = await fetcher()
    cache.set(key, { value, fetchedAt: now })
    return value
  } catch (e) {
    logError(`leetcode:${key}`, e)
    if (hit) return { ...hit.value, _stale: true, _error: e.message }
    throw e
  }
}

export function invalidateLeetcodeCache() { cache.clear() }

async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`LeetCode ${res.status} @ ${url}`)
  return res.json()
}

export function getUsername() {
  return process.env.LEETCODE_USERNAME || ''
}

function calcStreak(calendar) {
  if (!calendar || typeof calendar !== 'object') return 0
  // Keys may be Unix-seconds strings. Convert to YYYY-MM-DD set.
  const days = new Set()
  for (const [k, v] of Object.entries(calendar)) {
    if (!v) continue
    const sec = Number(k)
    if (!Number.isFinite(sec)) continue
    const d = new Date(sec * 1000)
    days.add(d.toISOString().slice(0, 10))
  }
  let streak = 0
  const cur = new Date()
  for (;;) {
    const key = cur.toISOString().slice(0, 10)
    if (days.has(key)) { streak++; cur.setDate(cur.getDate() - 1) }
    else break
  }
  return streak
}

function countLastNDays(calendar, n) {
  if (!calendar) return 0
  const cutoff = Date.now() - n * 86400000
  let total = 0
  for (const [k, v] of Object.entries(calendar)) {
    const ts = Number(k) * 1000
    if (ts >= cutoff) total += Number(v) || 0
  }
  return total
}

function submittedToday(calendar) {
  if (!calendar) return false
  const today = new Date().toISOString().slice(0, 10)
  for (const [k, v] of Object.entries(calendar)) {
    if (!v) continue
    const d = new Date(Number(k) * 1000).toISOString().slice(0, 10)
    if (d === today) return true
  }
  return false
}

export async function fetchLeetcodeStats() {
  const username = getUsername()
  if (!username) return { connected: false, reason: 'LEETCODE_USERNAME not set' }

  const result = await getCached(`user:${username}`, async () => {
    const [solved, calendar, profile, skill, daily] = await Promise.allSettled([
      fetchJSON(`${BASE}/${encodeURIComponent(username)}/solved`),
      fetchJSON(`${BASE}/${encodeURIComponent(username)}/calendar`),
      fetchJSON(`${BASE}/${encodeURIComponent(username)}`),
      fetchJSON(`${BASE}/skill/${encodeURIComponent(username)}`),
      fetchJSON(`${BASE}/daily`)
    ])

    const out = { connected: true, username, lastUpdated: new Date().toISOString(), errors: [] }

    if (solved.status === 'fulfilled') {
      const s = solved.value
      out.easySolved = s.easySolved ?? 0
      out.mediumSolved = s.mediumSolved ?? 0
      out.hardSolved = s.hardSolved ?? 0
      out.totalSolved = s.solvedProblem ?? s.totalSolved ?? ((out.easySolved + out.mediumSolved + out.hardSolved))
    } else out.errors.push({ endpoint: 'solved', message: solved.reason?.message })

    if (calendar.status === 'fulfilled') {
      const cal = calendar.value?.submissionCalendar
        ? (typeof calendar.value.submissionCalendar === 'string'
            ? JSON.parse(calendar.value.submissionCalendar)
            : calendar.value.submissionCalendar)
        : calendar.value
      out.submissionCalendar = cal || {}
      out.streak = calcStreak(out.submissionCalendar)
      out.submissionsLast7 = countLastNDays(out.submissionCalendar, 7)
      out.submissionsLast30 = countLastNDays(out.submissionCalendar, 30)
      out.submittedToday = submittedToday(out.submissionCalendar)
    } else out.errors.push({ endpoint: 'calendar', message: calendar.reason?.message })

    if (profile.status === 'fulfilled') {
      const p = profile.value
      const totalSubs = p?.totalSubmissions?.[0]?.submissions ?? null
      const acSubs = p?.matchedUserStats?.acSubmissionNum?.[0]?.submissions ?? null
      if (typeof p?.totalSolved === 'number' && typeof p?.totalQuestions === 'number') {
        // not direct rate — keep as is
      }
      // alfa-leetcode-api may expose acceptanceRate in /<user> — include if present
      if (typeof p?.acceptanceRate === 'number') out.acceptanceRate = p.acceptanceRate
      else if (totalSubs && acSubs) out.acceptanceRate = (acSubs / totalSubs) * 100
      out.ranking = p?.ranking
      out.profile = {
        name: p?.name,
        avatar: p?.avatar,
        country: p?.country,
        reputation: p?.reputation,
        about: p?.about
      }
    } else out.errors.push({ endpoint: 'profile', message: profile.reason?.message })

    if (skill.status === 'fulfilled') {
      const data = skill.value?.data?.matchedUser?.tagProblemCounts || skill.value
      out.skills = data
    } else out.errors.push({ endpoint: 'skill', message: skill.reason?.message })

    if (daily.status === 'fulfilled') {
      const d = daily.value
      out.daily = {
        title: d?.questionTitle,
        titleSlug: d?.questionTitleSlug,
        difficulty: d?.difficulty,
        date: d?.date,
        link: d?.questionLink || (d?.link) || (d?.questionTitleSlug ? `https://leetcode.com/problems/${d.questionTitleSlug}/` : null),
        topicTags: d?.topicTags
      }
    } else out.errors.push({ endpoint: 'daily', message: daily.reason?.message })

    return out
  })

  return result
}
