-- Parallax Gate — initial schema.
-- Design: state tree is stored as a single JSONB blob per hunter (mirrors the
-- client reducer's atomic-state treatment). Histories that we'll want to query
-- by date range are broken out into append-only / upsert-by-date tables.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- hunters: one row per player. `id='solo'` is the default single-user record.
-- ---------------------------------------------------------------------------
create table if not exists public.hunters (
  id            text primary key,
  display_name  text,
  created_at    timestamptz not null default now()
);

insert into public.hunters (id, display_name)
values ('solo', 'TEKRON')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- hunter_state: whole reducer state tree as JSONB. One row per hunter.
-- Every client state change debounces a PUT that overwrites this row.
-- ---------------------------------------------------------------------------
create table if not exists public.hunter_state (
  hunter_id    text primary key references public.hunters(id) on delete cascade,
  state        jsonb not null,
  schema_ver   int not null default 3,
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sleep_nights: one row per date, upsert on (hunter_id, date).
-- Used for 7-night history + long-term trend analysis.
-- ---------------------------------------------------------------------------
create table if not exists public.sleep_nights (
  hunter_id        text not null references public.hunters(id) on delete cascade,
  date             date not null,
  score            int,
  source           text,                -- 'fitbit_native' | 'readiness' | 'computed'
  efficiency       int,
  total_min        int,
  deep_min         int,
  rem_min          int,
  light_min        int,
  wake_min         int,
  start_time       timestamptz,
  end_time         timestamptz,
  schedule_status  text,                -- 'on_schedule' | 'late_night' | 'off_schedule'
  readiness_score  int,
  hrv_rmssd        numeric(6,2),
  spo2_avg         numeric(5,2),
  breathing_rate   numeric(5,2),
  resting_hr       int,
  debuffs_applied  jsonb,               -- snapshot of debuffs that were granted from this night
  raw              jsonb,               -- full fitbit payload for debugging / replay
  updated_at       timestamptz not null default now(),
  primary key (hunter_id, date)
);

create index if not exists sleep_nights_by_hunter_date
  on public.sleep_nights (hunter_id, date desc);

-- ---------------------------------------------------------------------------
-- quest_events: append-only audit log of quest + dungeon completions.
-- ---------------------------------------------------------------------------
create table if not exists public.quest_events (
  id            bigserial primary key,
  hunter_id     text not null references public.hunters(id) on delete cascade,
  kind          text not null,         -- 'daily' | 'main' | 'node' | 'dungeon' | 'penalty' | 'lootbox' | 'job_change'
  ref_id        text,                  -- quest_id, node_id, dungeon_id, etc.
  xp_awarded    int not null default 0,
  gold_awarded  int not null default 0,
  meta          jsonb,
  completed_at  timestamptz not null default now()
);

create index if not exists quest_events_by_hunter_time
  on public.quest_events (hunter_id, completed_at desc);

create index if not exists quest_events_by_kind
  on public.quest_events (hunter_id, kind, completed_at desc);

-- ---------------------------------------------------------------------------
-- journal_entries: narrative log for cross-device sync.
-- ---------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  hunter_id   text not null references public.hunters(id) on delete cascade,
  client_id   text,                    -- client-generated id, for idempotency
  kind        text,                    -- 'quest_complete' | 'rankup' | 'lore' | 'debuff' | etc.
  title       text,
  body        text,
  created_at  timestamptz not null default now()
);

create unique index if not exists journal_entries_client_dedupe
  on public.journal_entries (hunter_id, client_id)
  where client_id is not null;

create index if not exists journal_entries_by_hunter_time
  on public.journal_entries (hunter_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: enabled but intentionally left without policies. The server holds the
-- `sb_secret_...` key which bypasses RLS. Never expose that key to the client.
-- If/when we add browser-side writes, add policies here scoped to auth.uid().
-- ---------------------------------------------------------------------------
alter table public.hunters          enable row level security;
alter table public.hunter_state     enable row level security;
alter table public.sleep_nights     enable row level security;
alter table public.quest_events     enable row level security;
alter table public.journal_entries  enable row level security;
