// CRUD helpers for the Parallax Gate tables.
// All calls fail-soft: if Supabase isn't configured we return null/[] so the
// client falls back to localStorage-only persistence.

import { getSupabase, supabaseEnabled } from './supabase.js'

const DEFAULT_HUNTER = process.env.HUNTER_ID || 'solo'

// ---- Hunter state (JSONB blob) ---------------------------------------------

export async function loadHunterState(hunterId = DEFAULT_HUNTER) {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb
    .from('hunter_state')
    .select('state, schema_ver, updated_at')
    .eq('hunter_id', hunterId)
    .maybeSingle()
  if (error) throw error
  return data || null
}

export async function saveHunterState(state, hunterId = DEFAULT_HUNTER) {
  const sb = getSupabase()
  if (!sb) return { skipped: true }
  const row = {
    hunter_id:  hunterId,
    state,
    schema_ver: state?.schema ?? 3,
    updated_at: new Date().toISOString()
  }
  const { error } = await sb
    .from('hunter_state')
    .upsert(row, { onConflict: 'hunter_id' })
  if (error) throw error
  return { ok: true, updated_at: row.updated_at }
}

// ---- Sleep nights (upsert by date) -----------------------------------------

export async function recordSleepNight(night, hunterId = DEFAULT_HUNTER) {
  const sb = getSupabase()
  if (!sb) return { skipped: true }
  if (!night?.date) throw new Error('recordSleepNight: night.date required')

  const row = {
    hunter_id:        hunterId,
    date:             night.date,
    score:            night.score ?? night.recoveryScore ?? null,
    source:           night.source ?? null,
    efficiency:       night.efficiency ?? null,
    total_min:        night.totalMinutesAsleep ?? night.total_min ?? null,
    deep_min:         night.stages?.deep ?? night.deep_min ?? null,
    rem_min:          night.stages?.rem  ?? night.rem_min ?? null,
    light_min:        night.stages?.light ?? null,
    wake_min:         night.stages?.wake ?? null,
    start_time:       night.startTime ?? null,
    end_time:         night.endTime ?? null,
    schedule_status:  night.scheduleStatus ?? null,
    readiness_score:  night.readiness?.score ?? null,
    hrv_rmssd:        night.hrv?.rmssd ?? null,
    spo2_avg:         night.spo2?.avg ?? null,
    breathing_rate:   night.breathingRate?.overall ?? null,
    resting_hr:       night.restingHeartRate ?? null,
    debuffs_applied:  night.debuffsApplied ?? null,
    raw:              night.raw ?? null,
    updated_at:       new Date().toISOString()
  }
  const { error } = await sb
    .from('sleep_nights')
    .upsert(row, { onConflict: 'hunter_id,date' })
  if (error) throw error
  return { ok: true }
}

export async function listSleepNights(limit = 30, hunterId = DEFAULT_HUNTER) {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('sleep_nights')
    .select('*')
    .eq('hunter_id', hunterId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

// ---- Quest events (append-only audit log) ----------------------------------

export async function recordQuestEvent(evt, hunterId = DEFAULT_HUNTER) {
  const sb = getSupabase()
  if (!sb) return { skipped: true }
  if (!evt?.kind) throw new Error('recordQuestEvent: kind required')

  const row = {
    hunter_id:    hunterId,
    kind:         evt.kind,
    ref_id:       evt.refId ?? evt.questId ?? evt.nodeId ?? null,
    xp_awarded:   evt.xpAwarded ?? 0,
    gold_awarded: evt.goldAwarded ?? 0,
    meta:         evt.meta ?? null,
    completed_at: evt.completedAt ?? new Date().toISOString()
  }
  const { error } = await sb.from('quest_events').insert(row)
  if (error) throw error
  return { ok: true }
}

export async function listQuestEvents(limit = 100, hunterId = DEFAULT_HUNTER) {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('quest_events')
    .select('*')
    .eq('hunter_id', hunterId)
    .order('completed_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

// ---- Journal entries -------------------------------------------------------

export async function recordJournalEntry(entry, hunterId = DEFAULT_HUNTER) {
  const sb = getSupabase()
  if (!sb) return { skipped: true }
  const row = {
    hunter_id:  hunterId,
    client_id:  entry.id ?? null,
    kind:       entry.kind ?? null,
    title:      entry.title ?? null,
    body:       entry.body ?? null,
    created_at: entry.date ?? entry.created_at ?? new Date().toISOString()
  }
  const { error } = await sb
    .from('journal_entries')
    .upsert(row, { onConflict: 'hunter_id,client_id', ignoreDuplicates: true })
  if (error) throw error
  return { ok: true }
}

export async function listJournalEntries(limit = 200, hunterId = DEFAULT_HUNTER) {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('journal_entries')
    .select('*')
    .eq('hunter_id', hunterId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export { supabaseEnabled, DEFAULT_HUNTER }
