// Recovery Score + sleep grade + debuff configuration.

export const DEFAULT_SCHEDULE = {
  bedtime: '23:30',      // HH:MM 24h
  wake: '07:00',
  minHours: 7.5
}

export const SLEEP_GRADES = [
  {
    min: 90, max: 100, key: 'FULL_RECOVERY',   label: 'FULL RECOVERY',
    color: 'var(--ok)',
    message: 'HUNTER STATUS: OPTIMAL. ALL STATS AT PEAK PERFORMANCE.'
  },
  {
    min: 75, max: 89,  key: 'RECOVERED',       label: 'RECOVERED',
    color: 'var(--rank-d)',
    message: 'RECOVERY COMPLETE. MINOR FATIGUE DETECTED. PERFORMING AT 90%.'
  },
  {
    min: 60, max: 74,  key: 'PARTIAL_REST',    label: 'PARTIAL REST',
    color: 'var(--rank-a)',
    message: 'INCOMPLETE RECOVERY. VITALITY STAT REDUCED BY 15%. MONITOR STATUS.'
  },
  {
    min: 40, max: 59,  key: 'FATIGUED',        label: 'FATIGUED',
    color: 'var(--warn)',
    message: 'WARNING: FATIGUE ACCUMULATING. COMBAT PERFORMANCE DEGRADED.'
  },
  {
    min: 0,  max: 39,  key: 'CRITICAL',        label: 'CRITICAL FATIGUE',
    color: 'var(--rank-s)',
    message: 'CRITICAL SLEEP DEFICIT DETECTED. HUNTER IS COMPROMISED. REST IMMEDIATELY.'
  }
]

export function gradeOf(score) {
  return SLEEP_GRADES.find(g => score >= g.min && score <= g.max) || SLEEP_GRADES[SLEEP_GRADES.length - 1]
}

// Returns { score, bedtimePenalty, source }
// Prefers server-provided native score (recoveryScore from Fitbit) when available;
// falls back to client formula only if the server couldn't produce one.
export function computeRecoveryScore(tonight, schedule = DEFAULT_SCHEDULE) {
  if (!tonight || !tonight.recorded) return { score: 0, bedtimePenalty: 0, source: 'none', reason: 'no-data' }

  if (typeof tonight.recoveryScore === 'number') {
    return {
      score: Math.max(0, Math.min(100, Math.round(tonight.recoveryScore))),
      bedtimePenalty: 0,
      source: tonight.recoverySource || 'server',
      reason: null
    }
  }

  const totalSleep = tonight.totalMinutesAsleep ?? 0
  const totalHours = totalSleep / 60
  const efficiency = tonight.efficiency ?? 0
  const deep = tonight.stages?.deep ?? 0
  const rem  = tonight.stages?.rem ?? 0

  const deepScore     = Math.min(deep / 90,  1) * 25
  const remScore      = Math.min(rem  / 100, 1) * 20
  const effScore      = (efficiency / 100) * 25
  const durationScore = Math.min(totalHours / 8, 1) * 30

  // Bedtime penalty only applies when the user actually slept at a bedtime-like hour.
  let bedtimePenalty = 0
  if (tonight.scheduleStatus !== 'late_night') {
    bedtimePenalty = computeBedtimePenalty(tonight.startTime, schedule.bedtime)
  }

  const raw = deepScore + remScore + effScore + durationScore - bedtimePenalty
  const score = Math.max(0, Math.min(100, Math.round(raw)))
  return { score, bedtimePenalty, source: 'computed', reason: null }
}

// Up to -15: 0 if within 30 min of target, linear up to -15 at 3h late.
function computeBedtimePenalty(startIso, targetHHMM) {
  if (!startIso || !targetHHMM) return 0
  const start = new Date(startIso)
  const [hh, mm] = targetHHMM.split(':').map(Number)
  const target = new Date(start)
  target.setHours(hh, mm, 0, 0)
  if (start.getHours() < 6) target.setDate(target.getDate() - 1)

  const diffMin = (start.getTime() - target.getTime()) / 60000
  if (diffMin <= 30) return 0
  const overtime = Math.min(180, diffMin - 30)
  return Math.round((overtime / 180) * 15)
}

// Human-readable label for the sleep window's schedule alignment.
export function scheduleStatusLabel(status) {
  switch (status) {
    case 'on_schedule': return '◆ ON SCHEDULE'
    case 'late_night':  return '◇ LATE NIGHT SCHEDULE'
    case 'off_schedule': return '◇ OFF SCHEDULE'
    default: return '— NO SLEEP RECORDED'
  }
}

// --- Debuff rules ---
// Each rule returns [{ stat, delta, reason, severity }]
export function debuffsForScore(score) {
  if (score >= 75) return []
  if (score >= 60) {
    return [
      { stat: 'VIT', delta: -10, reason: 'POOR SLEEP — LAST NIGHT', severity: 'mild' },
      { stat: 'AGI', delta: -5,  reason: 'POOR SLEEP — LAST NIGHT', severity: 'mild' }
    ]
  }
  if (score >= 40) {
    return [
      { stat: 'VIT', delta: -20, reason: 'POOR SLEEP — LAST NIGHT', severity: 'warning' },
      { stat: 'STR', delta: -10, reason: 'POOR SLEEP — LAST NIGHT', severity: 'warning' },
      { stat: 'INT', delta: -10, reason: 'POOR SLEEP — LAST NIGHT', severity: 'warning' },
      { stat: 'AGI', delta: -10, reason: 'POOR SLEEP — LAST NIGHT', severity: 'warning' }
    ]
  }
  // score < 40
  return ['STR', 'VIT', 'INT', 'AGI', 'SEN', 'CHA'].map(s => ({
    stat: s, delta: -20, reason: 'CRITICAL FATIGUE', severity: 'critical'
  }))
}

// --- Fatigue meter rules ---
export function fatigueDelta(score) {
  if (score < 60) return +25
  if (score >= 75) return -20
  return 0
}

// Seven-night average with trend classification. Accepts history items carrying
// either `score` (persisted app state) or `recoveryScore` (server payload).
export function averageAndTrend(history) {
  const getScore = (n) => typeof n.recoveryScore === 'number' ? n.recoveryScore
                        : typeof n.score === 'number' ? n.score
                        : null
  const scored = history.filter(n => getScore(n) != null).map(n => ({ ...n, _s: getScore(n) }))
  if (!scored.length) return { avg: 0, trend: 'flat', sample: 0 }
  const avg = Math.round(scored.reduce((a, n) => a + n._s, 0) / scored.length)
  if (scored.length < 4) return { avg, trend: 'flat', sample: scored.length }
  const first3 = scored.slice(-3).reduce((a, n) => a + n._s, 0) / 3
  const last3  = scored.slice(0, 3).reduce((a, n) => a + n._s, 0) / 3
  const diff = last3 - first3
  const trend = diff > 4 ? 'improving' : diff < -4 ? 'declining' : 'stable'
  return { avg, trend, sample: scored.length }
}
