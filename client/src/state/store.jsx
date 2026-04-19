import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { RANKS, rankFromXP } from '../data/ranks.js'
import { STAT_KEYS } from '../data/stats.js'
import { DAILY_QUESTS, MAIN_QUESTS } from '../data/quests.js'
import { NODES, nodeStatus } from '../data/skillTree.js'
import { LORE_ENTRIES } from '../data/lore.js'
import { rollBoxes, PENALTY_QUEST } from '../data/loot.js'
import {
  CLASSES, classFromStats, JOB_CHANGE_TASKS, JOB_CHANGE_WINDOW_MS,
  JOB_CHANGE_COOLDOWN_MS, JOB_CHANGE_XP_THRESHOLD
} from '../data/classes.js'
import { pickDungeonForRank, INSTANCE_DUNGEON_WINDOW_MS } from '../data/dungeons.js'
import { DEFAULT_SCHEDULE } from '../data/sleep.js'
import { fetchHunterState, makeStateSyncer } from './sync.js'

const STORAGE_KEY = 'parallax-gate::v1'
const SCHEMA = 3

const todayKey = () => new Date().toISOString().slice(0, 10) // YYYY-MM-DD

function freshDailyState() {
  return DAILY_QUESTS.reduce((acc, q) => { acc[q.id] = false; return acc }, {})
}

function initialFlags() {
  return {
    SLEEP_PROTOCOL_ENABLED: true,
    JOB_CHANGE_ENABLED:     true,
    LOOT_DROPS_ENABLED:     true,
    INSTANCE_DUNGEONS_ENABLED: true,
    BEDTIME_ALERT_ENABLED: false
  }
}

function initialInventory() {
  return {
    dungeonKeys: 0,
    titleFragments: 0,
    gold: 0,
    tokens: { doubleXP: 0, statBoost: null } // statBoost: { stat, amount, expiresAt }
  }
}

function initialState() {
  return {
    schema: SCHEMA,
    hunterName: 'TEKRON',
    xp: 0,
    completedQuests: [],
    completedNodes: [],
    titlesEarned: ['Awakened Hunter'],
    equippedTitle: 'Awakened Hunter',
    dailyDate: todayKey(),
    dailyProgress: freshDailyState(),
    streak: 0,
    lastStreakDate: null,
    journal: [{
      id: 'init',
      date: new Date().toISOString(),
      title: LORE_ENTRIES.init.title,
      body: LORE_ENTRIES.init.body
    }],
    daysActive: 1,
    firstLogin: new Date().toISOString(),
    lastLogin: new Date().toISOString(),

    // --- Module 3: sleep protocol & manhwa mechanics ---
    featureFlags: initialFlags(),
    sleepSchedule: { ...DEFAULT_SCHEDULE },
    debuffs: [],
    fatigue: 0,
    sleepHistory: [],            // newest first, <= 7 entries of { date, score, totalMinutesAsleep, efficiency, deep, rem, debuffed }
    lastSleepApplied: null,      // YYYY-MM-DD
    recoveryDungeon: { active: false, nightsRequired: 2, nightsCompleted: 0 },
    fatigueOverlayDismissedAt: null,

    classKey: null,              // null | ARCHITECT | IRON | SHADOW
    jobChange: {                 // locked | offered | active | failed | completed
      status: 'locked',
      startedAt: null,
      deadline: null,
      progress: { apply: 0, leetcode: 0, parallax: 0 },
      cooldownUntil: null,
      offeredSeen: false
    },

    activeDungeon: null,         // spawned from a key
    inventory: initialInventory(),

    allStatUnlocked: false,

    pendingLootBox: null,        // { left, right, leftKind, rightKind, dayKey }
    lastLootDayKey: null,
    penaltyQuest: null,          // { issuedAt, dayKey, resolved }
    interferenceFlag: false,     // next main-quest-like completion has doubled XP (or next daily)

    // --- Rank-up point allocation (manhwa "stat build" mechanic) ---
    // 5 points per rank-up, manually assigned; up to +40 per stat.
    allocatedPoints: { STR: 0, VIT: 0, INT: 0, AGI: 0, SEN: 0, CHA: 0 },
    pointsAvailable: 0,

    // --- Self-reported workout log ---
    // [{ date: 'YYYY-MM-DD', type: 'strength'|'cardio'|'mobility', duration, notes }]
    workoutLog: [],

    notifSeen: { jobChangeOffered: false, classUnlocked: false, allStat: false }
  }
}

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw)
    const merged = {
      ...initialState(),
      ...parsed,
      featureFlags:  { ...initialFlags(),     ...(parsed.featureFlags || {}) },
      sleepSchedule: { ...DEFAULT_SCHEDULE,   ...(parsed.sleepSchedule || {}) },
      inventory:     { ...initialInventory(), ...(parsed.inventory || {}),
                       tokens: { doubleXP: 0, statBoost: null, ...(parsed.inventory?.tokens || {}) } },
      jobChange:     { ...initialState().jobChange, ...(parsed.jobChange || {}) },
      recoveryDungeon: { ...initialState().recoveryDungeon, ...(parsed.recoveryDungeon || {}) },
      notifSeen:     { ...initialState().notifSeen, ...(parsed.notifSeen || {}) },
      debuffs:       Array.isArray(parsed.debuffs) ? parsed.debuffs : [],
      sleepHistory:  Array.isArray(parsed.sleepHistory) ? parsed.sleepHistory : [],
      allocatedPoints: { ...initialState().allocatedPoints, ...(parsed.allocatedPoints || {}) },
      pointsAvailable: Number.isFinite(parsed.pointsAvailable) ? parsed.pointsAvailable : 0,
      workoutLog:    Array.isArray(parsed.workoutLog) ? parsed.workoutLog : []
    }
    merged.dailyProgress = { ...freshDailyState(), ...(parsed.dailyProgress || {}) }
    return merged
  } catch {
    return initialState()
  }
}

function persist(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

function grantXP(state, amount) {
  const prevRankKey = rankFromXP(state.xp).key
  const nextXP = state.xp + amount
  const nextRankKey = rankFromXP(nextXP).key
  const rankedUp = prevRankKey !== nextRankKey
  // 5 allocation points per rank gained (handles multi-rank jumps from large XP grants).
  const prevIdx = RANKS.findIndex(r => r.key === prevRankKey)
  const nextIdx = RANKS.findIndex(r => r.key === nextRankKey)
  const ranksGained = Math.max(0, nextIdx - prevIdx)
  const pointsGranted = rankedUp ? ranksGained * 5 : 0
  return { xp: nextXP, rankedUp, newRankKey: nextRankKey, pointsGranted }
}

// --- Class XP multipliers & gold hooks ---
function applyClassToDaily(state, quest, baseXp) {
  let xp = baseXp
  let goldBonus = 0
  if (state.classKey === 'IRON' && quest.id === 'd5') xp = Math.round(xp * 2)
  if (state.classKey === 'ARCHITECT' && quest.id === 'd1') xp = Math.round(xp * 1.2)
  if (state.classKey === 'SHADOW' && quest.id === 'd2') goldBonus = 10
  // Fatigue penalty: at 75+ fatigue, XP is halved
  if ((state.fatigue ?? 0) >= 75) xp = Math.round(xp * 0.5)
  return { xp, goldBonus }
}
function applyClassToMain(state, quest, baseXp) {
  let xp = baseXp
  if (state.classKey === 'ARCHITECT' && (quest.id === 'm3' || quest.id === 'm2')) xp = Math.round(xp * 1.2)
  if (state.classKey === 'IRON' && (quest.id === 'm7')) xp = Math.round(xp * 2)
  if ((state.fatigue ?? 0) >= 75) xp = Math.round(xp * 0.5)
  return { xp }
}
function consumeDoubleXP(state, xp) {
  if ((state.inventory?.tokens?.doubleXP ?? 0) > 0) {
    return { xp: xp * 2, tokens: { ...state.inventory.tokens, doubleXP: state.inventory.tokens.doubleXP - 1 } }
  }
  return { xp, tokens: state.inventory.tokens }
}
function consumeInterference(state, xp) {
  if (state.interferenceFlag) {
    return { xp: xp * 2, interferenceFlag: false }
  }
  return { xp, interferenceFlag: state.interferenceFlag }
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_TICK': {
      const today = todayKey()
      let next = { ...state, lastLogin: new Date().toISOString() }
      if (state.dailyDate !== today) {
        const allCleared = Object.values(state.dailyProgress).every(Boolean)
        let streak = state.streak
        let lastStreakDate = state.lastStreakDate
        if (allCleared) {
          if (state.lastStreakDate !== state.dailyDate) {
            streak = state.streak + 1
            lastStreakDate = state.dailyDate
          }
        } else if (state.lastStreakDate !== state.dailyDate) {
          streak = 0
        }
        next = {
          ...next,
          dailyDate: today,
          dailyProgress: freshDailyState(),
          streak,
          lastStreakDate,
          daysActive: state.daysActive + 1,
          interferenceFlag: false
        }
      }
      // Expire active dungeon
      if (next.activeDungeon && next.activeDungeon.deadline && Date.now() > next.activeDungeon.deadline) {
        next = {
          ...next,
          activeDungeon: null,
          _lastEvent: { kind: 'dungeonCollapsed', name: next.activeDungeon.name }
        }
      }
      // Expire job-change trial
      if (next.jobChange?.status === 'active' && next.jobChange.deadline && Date.now() > next.jobChange.deadline) {
        next = {
          ...next,
          jobChange: {
            ...next.jobChange,
            status: 'failed',
            cooldownUntil: Date.now() + JOB_CHANGE_COOLDOWN_MS
          }
        }
      }
      // Re-offer after cooldown
      if (next.jobChange?.status === 'failed' && next.jobChange.cooldownUntil && Date.now() > next.jobChange.cooldownUntil && next.xp >= JOB_CHANGE_XP_THRESHOLD && next.featureFlags.JOB_CHANGE_ENABLED) {
        next = { ...next, jobChange: { ...next.jobChange, status: 'offered', offeredSeen: false } }
      }
      // First-time offer at B-Rank
      if (next.jobChange?.status === 'locked' && next.xp >= JOB_CHANGE_XP_THRESHOLD && next.featureFlags.JOB_CHANGE_ENABLED && !next.classKey) {
        next = { ...next, jobChange: { ...next.jobChange, status: 'offered', offeredSeen: false } }
      }
      // Expire stat-boost potion
      if (next.inventory?.tokens?.statBoost && next.inventory.tokens.statBoost.expiresAt < Date.now()) {
        next = {
          ...next,
          inventory: { ...next.inventory, tokens: { ...next.inventory.tokens, statBoost: null } }
        }
      }
      return next
    }

    case 'COMPLETE_DAILY': {
      const { questId, bonusXp = 0 } = action
      if (state.dailyProgress[questId]) return state
      const quest = DAILY_QUESTS.find(q => q.id === questId)
      if (!quest) return state

      const { xp: classedXp, goldBonus } = applyClassToDaily(state, quest, quest.xp + bonusXp)
      const { xp: interferedXp, interferenceFlag } = consumeInterference(state, classedXp)
      const { xp: finalXp, tokens: nextTokens } = consumeDoubleXP(state, interferedXp)

      const grant = grantXP(state, finalXp)
      const dailyProgress = { ...state.dailyProgress, [questId]: true }
      const allCleared = Object.values(dailyProgress).every(Boolean)

      let journal = state.journal
      let streak = state.streak
      let lastStreakDate = state.lastStreakDate
      let titlesEarned = state.titlesEarned
      if (allCleared && state.lastStreakDate !== state.dailyDate) {
        streak = state.streak + 1
        lastStreakDate = state.dailyDate
        if (streak === 7) {
          journal = [...journal, { id: `streak7-${state.dailyDate}`, date: new Date().toISOString(), ...LORE_ENTRIES.streak7 }]
        }
        if (streak === 30 && !titlesEarned.includes('Relentless Hunter')) {
          titlesEarned = [...titlesEarned, 'Relentless Hunter']
          journal = [...journal, { id: `streak30-${state.dailyDate}`, date: new Date().toISOString(), ...LORE_ENTRIES.streak30 }]
        }
      }

      // Inventory: gold from class bonus
      let inventory = { ...state.inventory, tokens: nextTokens, gold: state.inventory.gold + goldBonus }

      // Loot box trigger on 4/4-or-all daily completion (keeping the spec: "all 4 daily quests")
      // We treat "all required daily quests complete" as the pending-loot condition, and
      // use the lastLootDayKey guard so it can't repeat.
      let pendingLootBox = state.pendingLootBox
      let lastLootDayKey = state.lastLootDayKey
      if (allCleared && state.featureFlags.LOOT_DROPS_ENABLED && state.lastLootDayKey !== state.dailyDate) {
        pendingLootBox = { ...rollBoxes(), dayKey: state.dailyDate }
        lastLootDayKey = state.dailyDate
      }

      return {
        ...state,
        xp: grant.xp,
        pointsAvailable: (state.pointsAvailable ?? 0) + (grant.pointsGranted || 0),
        dailyProgress,
        streak,
        lastStreakDate,
        titlesEarned,
        journal,
        inventory,
        interferenceFlag,
        pendingLootBox,
        lastLootDayKey,
        _lastEvent: {
          kind: 'xp',
          amount: finalXp,
          source: quest.name,
          rankedUp: grant.rankedUp,
          newRankKey: grant.newRankKey,
          pointsGranted: grant.pointsGranted
        }
      }
    }

    case 'COMPLETE_MAIN': {
      const { questId } = action
      if (state.completedQuests.includes(questId)) return state
      const quest = MAIN_QUESTS.find(q => q.id === questId)
      if (!quest) return state

      const { xp: classedXp } = applyClassToMain(state, quest, quest.xp)
      const { xp: interferedXp, interferenceFlag } = consumeInterference(state, classedXp)
      const { xp: finalXp, tokens: nextTokens } = consumeDoubleXP(state, interferedXp)

      const grant = grantXP(state, finalXp)
      let titlesEarned = state.titlesEarned
      if (quest.grantsTitle && !titlesEarned.includes(quest.grantsTitle)) {
        titlesEarned = [...titlesEarned, quest.grantsTitle]
      }
      let completedNodes = state.completedNodes
      let journal = state.journal
      if (quest.grantsNode && !completedNodes.includes(quest.grantsNode)) {
        completedNodes = [...completedNodes, quest.grantsNode]
        const entry = LORE_ENTRIES.node[quest.grantsNode]
        if (entry) journal = [...journal, { id: `node-${quest.grantsNode}`, date: new Date().toISOString(), ...entry }]
      }
      journal = [...journal, {
        id: `quest-${quest.id}`,
        date: new Date().toISOString(),
        title: quest.name.toUpperCase(),
        body: `${quest.flavor}\n\nOBJECTIVE CLEARED: ${quest.objective}`
      }]
      return {
        ...state,
        xp: grant.xp,
        pointsAvailable: (state.pointsAvailable ?? 0) + (grant.pointsGranted || 0),
        completedQuests: [...state.completedQuests, questId],
        titlesEarned,
        completedNodes,
        journal,
        inventory: { ...state.inventory, tokens: nextTokens },
        interferenceFlag,
        _lastEvent: { kind: 'quest', quest, rankedUp: grant.rankedUp, newRankKey: grant.newRankKey, pointsGranted: grant.pointsGranted }
      }
    }

    case 'COMPLETE_NODE': {
      const { nodeId } = action
      if (state.completedNodes.includes(nodeId)) return state
      const node = NODES.find(n => n.id === nodeId)
      if (!node) return state
      if (nodeStatus(nodeId, state.completedNodes) !== 'available') return state
      const grant = grantXP(state, node.xp)
      let journal = state.journal
      const entry = LORE_ENTRIES.node[node.id]
      if (entry) journal = [...journal, { id: `node-${node.id}`, date: new Date().toISOString(), ...entry }]
      return {
        ...state,
        xp: grant.xp,
        pointsAvailable: (state.pointsAvailable ?? 0) + (grant.pointsGranted || 0),
        completedNodes: [...state.completedNodes, nodeId],
        journal,
        _lastEvent: { kind: 'node', node, rankedUp: grant.rankedUp, newRankKey: grant.newRankKey, pointsGranted: grant.pointsGranted }
      }
    }

    case 'EQUIP_TITLE': {
      if (!state.titlesEarned.includes(action.title)) return state
      return { ...state, equippedTitle: action.title }
    }

    case 'SET_NAME': {
      return { ...state, hunterName: (action.name || '').toUpperCase().slice(0, 16) || 'TEKRON' }
    }

    // --- Module 3 actions ---

    case 'APPLY_SLEEP_NIGHT': {
      const { night, score, debuffs: nightDebuffs, fatigueDelta } = action
      if (!night) return state
      if (state.lastSleepApplied === night.date) return state

      // Respect feature flag
      if (!state.featureFlags.SLEEP_PROTOCOL_ENABLED) {
        return {
          ...state,
          sleepHistory: [{ date: night.date, score, totalMinutesAsleep: night.totalMinutesAsleep, efficiency: night.efficiency, deep: night.stages?.deep ?? 0, rem: night.stages?.rem ?? 0 }, ...state.sleepHistory.filter(x => x.date !== night.date)].slice(0, 7),
          lastSleepApplied: night.date
        }
      }

      // Apply Iron Sovereign damper on physical debuffs
      const damper = state.classKey === 'IRON' ? { stats: ['STR', 'VIT'], factor: 0.5 } : null
      const effectiveDebuffs = nightDebuffs.map(d => {
        if (damper && damper.stats.includes(d.stat)) return { ...d, delta: Math.round(d.delta * damper.factor) }
        return d
      })

      // Update fatigue
      let fatigue = Math.max(0, Math.min(100, state.fatigue + fatigueDelta))

      // Recovery dungeon: track consecutive 8h+ nights while at fatigue 100
      let recoveryDungeon = state.recoveryDungeon
      if (state.fatigue >= 100 && !recoveryDungeon.active) {
        recoveryDungeon = { ...recoveryDungeon, active: true, nightsCompleted: 0 }
      }
      if (recoveryDungeon.active) {
        if ((night.totalMinutesAsleep ?? 0) >= 480 && score >= 75) {
          const nextNights = recoveryDungeon.nightsCompleted + 1
          if (nextNights >= recoveryDungeon.nightsRequired) {
            recoveryDungeon = { active: false, nightsRequired: 2, nightsCompleted: 0 }
            fatigue = 0
          } else {
            recoveryDungeon = { ...recoveryDungeon, nightsCompleted: nextNights }
          }
        } else {
          recoveryDungeon = { ...recoveryDungeon, nightsCompleted: 0 }
        }
      }

      const newHistoryEntry = {
        date: night.date,
        score,
        totalMinutesAsleep: night.totalMinutesAsleep,
        efficiency: night.efficiency,
        deep: night.stages?.deep ?? 0,
        rem:  night.stages?.rem ?? 0
      }
      const sleepHistory = [newHistoryEntry, ...state.sleepHistory.filter(x => x.date !== night.date)].slice(0, 7)

      return {
        ...state,
        debuffs: effectiveDebuffs,
        fatigue,
        recoveryDungeon,
        sleepHistory,
        lastSleepApplied: night.date,
        _lastEvent: score < 40 ? { kind: 'criticalFatigue', score } : null
      }
    }

    case 'SET_SCHEDULE': {
      return { ...state, sleepSchedule: { ...state.sleepSchedule, ...action.payload } }
    }

    case 'TOGGLE_FLAG': {
      return { ...state, featureFlags: { ...state.featureFlags, [action.flag]: !state.featureFlags[action.flag] } }
    }

    case 'DISMISS_FATIGUE_OVERLAY': {
      return { ...state, fatigueOverlayDismissedAt: Date.now() }
    }

    // --- Job Change Quest ---

    case 'ACCEPT_JOB_CHANGE': {
      if (state.jobChange.status !== 'offered') return state
      return {
        ...state,
        jobChange: {
          ...state.jobChange,
          status: 'active',
          startedAt: Date.now(),
          deadline: Date.now() + JOB_CHANGE_WINDOW_MS,
          progress: { apply: 0, leetcode: 0, parallax: 0 },
          offeredSeen: true
        }
      }
    }

    case 'SEEN_JOB_OFFER': {
      return { ...state, jobChange: { ...state.jobChange, offeredSeen: true } }
    }

    case 'UPDATE_JOB_PROGRESS': {
      if (state.jobChange.status !== 'active') return state
      const { key, amount } = action
      const target = JOB_CHANGE_TASKS.find(t => t.key === key)
      if (!target) return state
      const nextVal = Math.min(target.target, (state.jobChange.progress[key] || 0) + amount)
      const progress = { ...state.jobChange.progress, [key]: nextVal }
      const allDone = JOB_CHANGE_TASKS.every(t => progress[t.key] >= t.target)

      if (allDone) {
        // Derive class from current stats snapshot passed in action (if given)
        const chosen = action.statsSnapshot ? classFromStats(action.statsSnapshot) : 'ARCHITECT'
        return {
          ...state,
          jobChange: { ...state.jobChange, status: 'completed', progress },
          classKey: chosen,
          titlesEarned: state.titlesEarned.includes(CLASSES[chosen].name) ? state.titlesEarned : [...state.titlesEarned, CLASSES[chosen].name],
          _lastEvent: { kind: 'classUnlocked', classKey: chosen }
        }
      }
      return { ...state, jobChange: { ...state.jobChange, progress } }
    }

    // --- Loot box ---

    case 'OPEN_LOOT_BOX': {
      const { side } = action // 'left' | 'right'
      const box = state.pendingLootBox?.[side]
      const kind = state.pendingLootBox?.[side === 'left' ? 'leftKind' : 'rightKind']
      if (!box) return state
      let next = { ...state, pendingLootBox: null }
      const eff = box.effect
      switch (eff.kind) {
        case 'xp': {
          const grant = grantXP(next, eff.amount)
          next = { ...next, xp: Math.max(0, grant.xp), pointsAvailable: (next.pointsAvailable ?? 0) + (grant.pointsGranted || 0), _lastEvent: { kind: 'xp', amount: eff.amount, source: box.label, rankedUp: grant.rankedUp, newRankKey: grant.newRankKey, pointsGranted: grant.pointsGranted } }
          break
        }
        case 'gold': {
          next = { ...next, inventory: { ...next.inventory, gold: Math.max(0, next.inventory.gold + eff.amount) } }
          break
        }
        case 'dungeonKey': {
          next = { ...next, inventory: { ...next.inventory, dungeonKeys: next.inventory.dungeonKeys + 1 } }
          break
        }
        case 'token': {
          if (eff.token === 'doubleXP') {
            next = { ...next, inventory: { ...next.inventory, tokens: { ...next.inventory.tokens, doubleXP: next.inventory.tokens.doubleXP + 1 } } }
          }
          break
        }
        case 'fragment': {
          next = { ...next, inventory: { ...next.inventory, titleFragments: next.inventory.titleFragments + 1 } }
          break
        }
        case 'potion': {
          const statKeys = ['STR', 'VIT', 'INT', 'AGI', 'SEN', 'CHA']
          const stat = statKeys[Math.floor(Math.random() * statKeys.length)]
          next = {
            ...next,
            inventory: {
              ...next.inventory,
              tokens: { ...next.inventory.tokens, statBoost: { stat, amount: eff.amount, expiresAt: Date.now() + eff.hours * 3600 * 1000 } }
            }
          }
          break
        }
        case 'penaltyQuest': {
          next = { ...next, penaltyQuest: { issuedAt: Date.now(), dayKey: state.dailyDate, resolved: false } }
          break
        }
        case 'interference': {
          next = { ...next, interferenceFlag: true }
          break
        }
      }
      next._lootResult = { kind, label: box.label, effect: eff }
      return next
    }

    case 'CLEAR_LOOT_RESULT': {
      const { _lootResult, ...rest } = state
      return rest
    }

    case 'RESOLVE_PENALTY_QUEST': {
      const { won } = action
      if (!state.penaltyQuest || state.penaltyQuest.resolved) return state
      const delta = won ? PENALTY_QUEST.rewardXp : PENALTY_QUEST.ignorePenaltyXp
      const grant = grantXP(state, delta)
      return {
        ...state,
        xp: Math.max(0, grant.xp),
        pointsAvailable: (state.pointsAvailable ?? 0) + (grant.pointsGranted || 0),
        penaltyQuest: { ...state.penaltyQuest, resolved: true, won },
        _lastEvent: { kind: 'xp', amount: delta, source: 'PENALTY QUEST', rankedUp: grant.rankedUp, newRankKey: grant.newRankKey, pointsGranted: grant.pointsGranted }
      }
    }

    // --- Instance dungeons ---

    case 'START_DUNGEON': {
      if (!state.featureFlags.INSTANCE_DUNGEONS_ENABLED) return state
      if (state.inventory.dungeonKeys <= 0) return state
      if (state.activeDungeon) return state
      const rank = rankFromXP(state.xp).key
      const dungeon = pickDungeonForRank(rank)
      const startedAt = Date.now()
      return {
        ...state,
        inventory: { ...state.inventory, dungeonKeys: state.inventory.dungeonKeys - 1 },
        activeDungeon: {
          ...dungeon,
          startedAt,
          deadline: startedAt + INSTANCE_DUNGEON_WINDOW_MS,
          floors: dungeon.floors.map(f => ({ ...f, done: false }))
        }
      }
    }

    case 'DUNGEON_COMPLETE_FLOOR': {
      if (!state.activeDungeon) return state
      const { floorId } = action
      const floors = state.activeDungeon.floors.map(f => f.id === floorId ? { ...f, done: true } : f)
      const thisFloor = floors.find(f => f.id === floorId)
      if (!thisFloor) return state
      const grant = grantXP(state, thisFloor.xp)
      return {
        ...state,
        xp: grant.xp,
        pointsAvailable: (state.pointsAvailable ?? 0) + (grant.pointsGranted || 0),
        activeDungeon: { ...state.activeDungeon, floors },
        _lastEvent: { kind: 'xp', amount: thisFloor.xp, source: `${state.activeDungeon.name} :: ${thisFloor.label}`, rankedUp: grant.rankedUp, newRankKey: grant.newRankKey, pointsGranted: grant.pointsGranted }
      }
    }

    case 'DUNGEON_CLAIM': {
      if (!state.activeDungeon) return state
      const d = state.activeDungeon
      if (!d.floors.every(f => f.done)) return state
      const grant = grantXP(state, d.rewardXp)
      return {
        ...state,
        xp: grant.xp,
        pointsAvailable: (state.pointsAvailable ?? 0) + (grant.pointsGranted || 0),
        activeDungeon: null,
        inventory: {
          ...state.inventory,
          gold: state.inventory.gold + (d.rewardGold || 0),
          titleFragments: state.inventory.titleFragments + (d.rewardFragment ? 1 : 0)
        },
        _lastEvent: { kind: 'xp', amount: d.rewardXp, source: `${d.name} :: CLEARED`, rankedUp: grant.rankedUp, newRankKey: grant.newRankKey, pointsGranted: grant.pointsGranted }
      }
    }

    case 'DUNGEON_ABANDON': {
      return { ...state, activeDungeon: null }
    }

    // --- All-Stat Hunter title ---

    case 'UNLOCK_ALL_STAT': {
      if (state.allStatUnlocked) return state
      const next = {
        ...state,
        allStatUnlocked: true,
        titlesEarned: state.titlesEarned.includes('All-Stat Hunter') ? state.titlesEarned : [...state.titlesEarned, 'All-Stat Hunter'],
        _lastEvent: { kind: 'allStat' }
      }
      return next
    }

    case 'ALLOCATE_POINT': {
      const { stat } = action
      if ((state.pointsAvailable ?? 0) <= 0) return state
      if (!STAT_KEYS.includes(stat)) return state
      const current = state.allocatedPoints?.[stat] ?? 0
      if (current >= 40) return state
      return {
        ...state,
        pointsAvailable: state.pointsAvailable - 1,
        allocatedPoints: { ...(state.allocatedPoints || {}), [stat]: current + 1 }
      }
    }

    case 'LOG_WORKOUT': {
      const w = action.workout
      if (!w?.date) return state
      // De-dupe by (date, type) so logging the same session twice doesn't stack.
      const key = (x) => `${x.date}::${x.type || 'any'}`
      const existingIdx = state.workoutLog.findIndex(x => key(x) === key(w))
      const entry = {
        date:     w.date,
        type:     w.type || 'strength',
        duration: Number.isFinite(w.duration) ? w.duration : null,
        notes:    w.notes || ''
      }
      const log = existingIdx >= 0
        ? state.workoutLog.map((x, i) => i === existingIdx ? entry : x)
        : [entry, ...state.workoutLog].slice(0, 365) // keep 1 year
      return { ...state, workoutLog: log }
    }

    case 'DELETE_WORKOUT': {
      const { date, workoutType } = action
      return {
        ...state,
        workoutLog: state.workoutLog.filter(w => !(w.date === date && (workoutType ? w.type === workoutType : true)))
      }
    }

    case 'RESET': return initialState()

    case 'REPLACE_STATE': {
      // Merge server state over the initial tree so any new client-only fields
      // added after the server copy was written still get defaults.
      const incoming = action.state || {}
      return {
        ...initialState(),
        ...incoming,
        featureFlags:  { ...initialFlags(),     ...(incoming.featureFlags || {}) },
        sleepSchedule: { ...DEFAULT_SCHEDULE,   ...(incoming.sleepSchedule || {}) },
        inventory:     { ...initialInventory(), ...(incoming.inventory || {}),
                         tokens: { doubleXP: 0, statBoost: null, ...(incoming.inventory?.tokens || {}) } },
        jobChange:     { ...initialState().jobChange,       ...(incoming.jobChange || {}) },
        recoveryDungeon:{ ...initialState().recoveryDungeon, ...(incoming.recoveryDungeon || {}) },
        notifSeen:     { ...initialState().notifSeen,       ...(incoming.notifSeen || {}) },
        debuffs:       Array.isArray(incoming.debuffs) ? incoming.debuffs : [],
        sleepHistory:  Array.isArray(incoming.sleepHistory) ? incoming.sleepHistory : [],
        allocatedPoints: { ...initialState().allocatedPoints, ...(incoming.allocatedPoints || {}) },
        pointsAvailable: Number.isFinite(incoming.pointsAvailable) ? incoming.pointsAvailable : 0,
        workoutLog:    Array.isArray(incoming.workoutLog) ? incoming.workoutLog : [],
        dailyProgress: { ...freshDailyState(), ...(incoming.dailyProgress || {}) }
      }
    }

    case 'CLEAR_EVENT': {
      const { _lastEvent, ...rest } = state
      return rest
    }

    default: return state
  }
}

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, hydrate)
  const [ceremony, setCeremony] = useState(null)
  const lastEventSeen = useRef(null)
  const syncer = useRef(null)
  const bootedFromServer = useRef(false)

  // Boot: pull server copy if present and newer than the local cache.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await fetchHunterState()
      if (cancelled) return
      if (result?.state && typeof result.state === 'object') {
        dispatch({ type: 'REPLACE_STATE', state: result.state })
      }
      bootedFromServer.current = true
      dispatch({ type: 'HYDRATE_TICK' })
    })()
    return () => { cancelled = true }
  }, [])

  // Persist: localStorage always; server sync only after we've booted so we
  // don't overwrite a good server copy with a fresh-init localStorage blob.
  useEffect(() => {
    persist(state)
    if (!bootedFromServer.current) return
    if (!syncer.current) syncer.current = makeStateSyncer({ debounceMs: 1500 })
    syncer.current.queue(state)
  }, [state])

  // Flush pending writes on tab close so we don't lose the last action.
  useEffect(() => {
    const onHide = () => { syncer.current?.flushNow() }
    window.addEventListener('beforeunload', onHide)
    window.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('beforeunload', onHide)
      window.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  const rank = rankFromXP(state.xp)
  useEffect(() => { document.body.setAttribute('data-rank', rank.key) }, [rank.key])

  useEffect(() => {
    const ev = state._lastEvent
    if (!ev || ev === lastEventSeen.current) return
    lastEventSeen.current = ev
    if (ev.rankedUp) {
      setCeremony({ type: 'rankup', rankKey: ev.newRankKey })
    } else if (ev.kind === 'quest') {
      setCeremony({ type: 'quest', quest: ev.quest })
    } else if (ev.kind === 'node') {
      setCeremony({ type: 'node', node: ev.node })
    } else if (ev.kind === 'xp') {
      setCeremony({ type: 'xp', amount: ev.amount, source: ev.source })
    } else if (ev.kind === 'classUnlocked') {
      setCeremony({ type: 'class', classKey: ev.classKey })
    } else if (ev.kind === 'allStat') {
      setCeremony({ type: 'allStat' })
    } else if (ev.kind === 'dungeonCollapsed') {
      setCeremony({ type: 'dungeonCollapsed', name: ev.name })
    }
    const t = setTimeout(() => dispatch({ type: 'CLEAR_EVENT' }), 100)
    return () => clearTimeout(t)
  }, [state._lastEvent])

  // Periodic tick to re-evaluate deadlines / expirations
  useEffect(() => {
    const t = setInterval(() => dispatch({ type: 'HYDRATE_TICK' }), 60 * 1000)
    return () => clearInterval(t)
  }, [])

  const api = useMemo(() => ({
    state,
    rank,
    completeDaily: (id, opts = {}) => dispatch({ type: 'COMPLETE_DAILY', questId: id, bonusXp: opts.bonusXp || 0 }),
    completeMain: (id) => dispatch({ type: 'COMPLETE_MAIN', questId: id }),
    completeNode: (id) => dispatch({ type: 'COMPLETE_NODE', nodeId: id }),
    equipTitle: (title) => dispatch({ type: 'EQUIP_TITLE', title }),
    setName: (name) => dispatch({ type: 'SET_NAME', name }),
    resetAll: () => dispatch({ type: 'RESET' }),
    // Module 3
    applySleepNight: (payload) => dispatch({ type: 'APPLY_SLEEP_NIGHT', ...payload }),
    setSchedule: (payload) => dispatch({ type: 'SET_SCHEDULE', payload }),
    toggleFlag: (flag) => dispatch({ type: 'TOGGLE_FLAG', flag }),
    dismissFatigueOverlay: () => dispatch({ type: 'DISMISS_FATIGUE_OVERLAY' }),
    acceptJobChange: () => dispatch({ type: 'ACCEPT_JOB_CHANGE' }),
    seenJobOffer: () => dispatch({ type: 'SEEN_JOB_OFFER' }),
    updateJobProgress: (key, amount, statsSnapshot) => dispatch({ type: 'UPDATE_JOB_PROGRESS', key, amount, statsSnapshot }),
    openLootBox: (side) => dispatch({ type: 'OPEN_LOOT_BOX', side }),
    clearLootResult: () => dispatch({ type: 'CLEAR_LOOT_RESULT' }),
    resolvePenaltyQuest: (won) => dispatch({ type: 'RESOLVE_PENALTY_QUEST', won }),
    startDungeon: () => dispatch({ type: 'START_DUNGEON' }),
    dungeonCompleteFloor: (floorId) => dispatch({ type: 'DUNGEON_COMPLETE_FLOOR', floorId }),
    dungeonClaim: () => dispatch({ type: 'DUNGEON_CLAIM' }),
    dungeonAbandon: () => dispatch({ type: 'DUNGEON_ABANDON' }),
    unlockAllStat: () => dispatch({ type: 'UNLOCK_ALL_STAT' }),
    allocatePoint: (stat) => dispatch({ type: 'ALLOCATE_POINT', stat }),
    logWorkout: (workout) => dispatch({ type: 'LOG_WORKOUT', workout }),
    deleteWorkout: (date, workoutType) => dispatch({ type: 'DELETE_WORKOUT', date, workoutType }),
    ceremony,
    dismissCeremony: () => setCeremony(null)
  }), [state, rank, ceremony])

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const v = useContext(StoreCtx)
  if (!v) throw new Error('useStore outside provider')
  return v
}
