import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { RANKS, rankFromXP } from '../data/ranks.js'
import { DAILY_QUESTS, MAIN_QUESTS } from '../data/quests.js'
import { NODES, nodeStatus } from '../data/skillTree.js'
import { LORE_ENTRIES } from '../data/lore.js'

const STORAGE_KEY = 'parallax-gate::v1'
const SCHEMA = 1

const todayKey = () => new Date().toISOString().slice(0, 10) // YYYY-MM-DD

function freshDailyState() {
  return DAILY_QUESTS.reduce((acc, q) => { acc[q.id] = false; return acc }, {})
}

function initialState() {
  return {
    schema: SCHEMA,
    hunterName: 'TEKRON',
    xp: 0,
    completedQuests: [],        // main quest ids
    completedNodes: [],         // node ids
    titlesEarned: ['Awakened Hunter'],
    equippedTitle: 'Awakened Hunter',
    dailyDate: todayKey(),
    dailyProgress: freshDailyState(),
    streak: 0,
    lastStreakDate: null,       // last date a full daily set was cleared
    journal: [{
      id: 'init',
      date: new Date().toISOString(),
      title: LORE_ENTRIES.init.title,
      body: LORE_ENTRIES.init.body
    }],
    daysActive: 1,
    firstLogin: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  }
}

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw)
    // shallow merge with fresh defaults so new fields appear
    const merged = { ...initialState(), ...parsed }
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
  const prevRank = rankFromXP(state.xp).key
  const nextXP = state.xp + amount
  const nextRankKey = rankFromXP(nextXP).key
  const rankedUp = prevRank !== nextRankKey
  return { xp: nextXP, rankedUp, newRankKey: nextRankKey }
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_TICK': {
      // Called on app load — rotates dailies if day changed, tracks streak
      const today = todayKey()
      let next = { ...state, lastLogin: new Date().toISOString() }
      if (state.dailyDate !== today) {
        // Did the previous day have all 4 cleared?
        const allCleared = Object.values(state.dailyProgress).every(Boolean)
        let streak = state.streak
        let lastStreakDate = state.lastStreakDate
        if (allCleared) {
          // Continue streak if lastStreakDate === yesterday(state.dailyDate)
          const prev = new Date(state.dailyDate + 'T00:00:00')
          const prevPlus1 = new Date(prev); prevPlus1.setDate(prev.getDate() + 1)
          const prevKey = prevPlus1.toISOString().slice(0, 10)
          if (state.lastStreakDate === state.dailyDate) {
            // streak already credited — noop
          } else {
            streak = (state.lastStreakDate === prevKey || state.lastStreakDate === null) ? streak + 1 : streak + 1
            lastStreakDate = state.dailyDate
          }
        } else if (state.lastStreakDate !== state.dailyDate) {
          // missed a full day — streak breaks
          streak = 0
        }
        next = {
          ...next,
          dailyDate: today,
          dailyProgress: freshDailyState(),
          streak,
          lastStreakDate,
          daysActive: state.daysActive + 1
        }
      }
      return next
    }
    case 'COMPLETE_DAILY': {
      const { questId } = action
      if (state.dailyProgress[questId]) return state
      const quest = DAILY_QUESTS.find(q => q.id === questId)
      if (!quest) return state
      const grant = grantXP(state, quest.xp)
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
      return {
        ...state,
        xp: grant.xp,
        dailyProgress,
        streak,
        lastStreakDate,
        titlesEarned,
        journal,
        _lastEvent: { kind: 'xp', amount: quest.xp, source: quest.name, rankedUp: grant.rankedUp, newRankKey: grant.newRankKey }
      }
    }
    case 'COMPLETE_MAIN': {
      const { questId } = action
      if (state.completedQuests.includes(questId)) return state
      const quest = MAIN_QUESTS.find(q => q.id === questId)
      if (!quest) return state
      const grant = grantXP(state, quest.xp)
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
        completedQuests: [...state.completedQuests, questId],
        titlesEarned,
        completedNodes,
        journal,
        _lastEvent: { kind: 'quest', quest, rankedUp: grant.rankedUp, newRankKey: grant.newRankKey }
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
        completedNodes: [...state.completedNodes, nodeId],
        journal,
        _lastEvent: { kind: 'node', node, rankedUp: grant.rankedUp, newRankKey: grant.newRankKey }
      }
    }
    case 'EQUIP_TITLE': {
      if (!state.titlesEarned.includes(action.title)) return state
      return { ...state, equippedTitle: action.title }
    }
    case 'SET_NAME': {
      return { ...state, hunterName: (action.name || '').toUpperCase().slice(0, 16) || 'TEKRON' }
    }
    case 'RESET': {
      return initialState()
    }
    case 'CLEAR_EVENT': {
      const { _lastEvent, ...rest } = state
      return rest
    }
    default:
      return state
  }
}

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, hydrate)
  const [ceremony, setCeremony] = useState(null) // { type: 'rankup', rankKey } | { type: 'quest', ... }
  const lastEventSeen = useRef(null)

  // Hydrate tick on mount
  useEffect(() => { dispatch({ type: 'HYDRATE_TICK' }) }, [])

  // Persist on every change
  useEffect(() => { persist(state) }, [state])

  // Derive rank + apply data-attr
  const rank = rankFromXP(state.xp)
  useEffect(() => {
    document.body.setAttribute('data-rank', rank.key)
  }, [rank.key])

  // Watch _lastEvent to trigger ceremonies / toasts
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
    }
    const t = setTimeout(() => dispatch({ type: 'CLEAR_EVENT' }), 100)
    return () => clearTimeout(t)
  }, [state._lastEvent])

  const api = useMemo(() => ({
    state,
    rank,
    completeDaily: (id) => dispatch({ type: 'COMPLETE_DAILY', questId: id }),
    completeMain: (id) => dispatch({ type: 'COMPLETE_MAIN', questId: id }),
    completeNode: (id) => dispatch({ type: 'COMPLETE_NODE', nodeId: id }),
    equipTitle: (title) => dispatch({ type: 'EQUIP_TITLE', title }),
    setName: (name) => dispatch({ type: 'SET_NAME', name }),
    resetAll: () => dispatch({ type: 'RESET' }),
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
