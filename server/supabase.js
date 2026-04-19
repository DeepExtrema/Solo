import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL || ''
const KEY = process.env.SUPABASE_KEY || ''

let _client = null
let _warned = false

export function getSupabase() {
  if (!URL || !KEY) {
    if (!_warned) {
      // eslint-disable-next-line no-console
      console.warn('[SUPABASE] disabled — set SUPABASE_URL + SUPABASE_KEY in server/.env')
      _warned = true
    }
    return null
  }
  if (!_client) {
    _client = createClient(URL, KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      db:   { schema: 'public' }
    })
  }
  return _client
}

export function supabaseEnabled() {
  return !!(URL && KEY)
}
