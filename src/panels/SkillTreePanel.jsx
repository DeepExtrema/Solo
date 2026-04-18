import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../state/store.jsx'
import { NODES, BRANCHES, nodeStatus } from '../data/skillTree.js'

const COL_X = { COMBAT: 180, RAID: 540, GUILD: 900 }
const COL_ORDER = ['COMBAT', 'RAID', 'GUILD']
const TIER_Y_BASE = 110
const TIER_GAP = 110
const NODE_R = 22
const WIDTH = 1080
const HEIGHT = TIER_Y_BASE + TIER_GAP * 8 + 60

function nodeXY(n) {
  return { x: COL_X[n.branch], y: TIER_Y_BASE + n.tier * TIER_GAP }
}

function branchColor(key) {
  return {
    COMBAT: { stroke: 'var(--sys-cyan)',  glow: 'var(--sys-cyan-glow)' },
    RAID:   { stroke: 'var(--rank-b)',    glow: 'var(--rank-b-glow)' },
    GUILD:  { stroke: 'var(--rank-a)',    glow: 'var(--rank-a-glow)' }
  }[key]
}

export default function SkillTreePanel() {
  const { state, completeNode } = useStore()
  const [selectedId, setSelectedId] = useState(null)

  const edges = useMemo(() => {
    const out = []
    for (const n of NODES) {
      for (const p of n.prereqs) {
        const from = NODES.find(x => x.id === p)
        if (from) out.push({ id: `${p}->${n.id}`, from, to: n })
      }
    }
    return out
  }, [])

  const selected = selectedId ? NODES.find(n => n.id === selectedId) : null
  const selectedStatus = selected ? nodeStatus(selected.id, state.completedNodes) : null

  return (
    <div className="col">
      <section className="panel">
        <div className="panel-title">
          <span>SKILL TREE :: GATE SIGIL</span>
          <span style={{ color: 'var(--text-muted)' }}>{state.completedNodes.length} / {NODES.length} NODES</span>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18 }}>
          {/* SVG tree */}
          <div style={{
            position: 'relative',
            background: 'radial-gradient(ellipse at top, rgba(94,225,255,0.04) 0%, transparent 60%), rgba(0,0,0,0.3)',
            border: '1px solid var(--border-dim)',
            overflow: 'auto',
            maxHeight: 'calc(100vh - 220px)'
          }}>
            <svg width={WIDTH} height={HEIGHT} style={{ display: 'block' }}>
              <defs>
                <linearGradient id="edge-active" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--sys-cyan)" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="var(--sys-cyan)" stopOpacity="0.2" />
                </linearGradient>
                <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Column headers */}
              {COL_ORDER.map(key => {
                const b = BRANCHES[key]
                const c = branchColor(key)
                return (
                  <g key={key}>
                    <text x={COL_X[key]} y={40} textAnchor="middle"
                      fill={c.stroke}
                      style={{
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 900,
                        fontSize: 22,
                        letterSpacing: '0.25em',
                        filter: 'url(#soft-glow)'
                      }}>{b.name}</text>
                    <text x={COL_X[key]} y={62} textAnchor="middle"
                      fill="var(--text-secondary)" fontSize="10" style={{ letterSpacing: '0.25em' }}>
                      {b.subtitle.toUpperCase()}
                    </text>
                    <line x1={COL_X[key] - 140} y1={76} x2={COL_X[key] + 140} y2={76}
                      stroke={c.stroke} strokeOpacity="0.3" strokeDasharray="3 6" />
                  </g>
                )
              })}

              {/* Edges */}
              {edges.map(e => {
                const a = nodeXY(e.from), b = nodeXY(e.to)
                const toDone = state.completedNodes.includes(e.to.id)
                const fromDone = state.completedNodes.includes(e.from.id)
                const col = branchColor(e.to.branch)
                const active = fromDone
                return (
                  <line key={e.id}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={active ? col.stroke : 'var(--text-muted)'}
                    strokeOpacity={active ? (toDone ? 0.9 : 0.55) : 0.2}
                    strokeWidth={toDone ? 2 : 1.2}
                    strokeDasharray={active ? '0' : '4 6'}
                    filter={active ? 'url(#soft-glow)' : undefined}
                  />
                )
              })}

              {/* Nodes */}
              {NODES.map(n => {
                const { x, y } = nodeXY(n)
                const status = nodeStatus(n.id, state.completedNodes)
                const col = branchColor(n.branch)
                const isSelected = selectedId === n.id
                const isLegendary = n.legendary

                const ringColor =
                  status === 'complete' ? (isLegendary ? 'var(--legendary)' : col.stroke)
                  : status === 'available' ? col.stroke
                  : 'var(--text-muted)'

                return (
                  <g key={n.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(n.id)}>
                    {/* Outer halo */}
                    {status !== 'locked' && (
                      <circle cx={x} cy={y} r={NODE_R + 10}
                        fill="none"
                        stroke={isLegendary ? 'var(--legendary)' : col.stroke}
                        strokeOpacity={status === 'complete' ? 0.45 : 0.25}
                        strokeWidth="1"
                      >
                        {status === 'available' && (
                          <animate attributeName="r" from={NODE_R + 6} to={NODE_R + 14} dur="2.2s" repeatCount="indefinite" />
                        )}
                        {status === 'available' && (
                          <animate attributeName="stroke-opacity" from="0.4" to="0" dur="2.2s" repeatCount="indefinite" />
                        )}
                      </circle>
                    )}

                    {/* Selection ring */}
                    {isSelected && (
                      <circle cx={x} cy={y} r={NODE_R + 14}
                        fill="none" stroke="var(--sys-cyan)" strokeWidth="1.5" strokeDasharray="2 3" />
                    )}

                    {/* Core */}
                    <circle cx={x} cy={y} r={NODE_R}
                      fill="rgba(0,0,0,0.85)"
                      stroke={ringColor}
                      strokeWidth={status === 'complete' ? 2.5 : 1.5}
                      filter={status !== 'locked' ? 'url(#soft-glow)' : undefined}
                    />
                    {status === 'complete' && (
                      <circle cx={x} cy={y} r={NODE_R - 6}
                        fill={isLegendary ? 'url(#node-glow)' : 'none'}
                        stroke={isLegendary ? 'var(--legendary)' : col.stroke}
                        strokeOpacity="0.6" />
                    )}

                    {/* Icon */}
                    <text x={x} y={y + 5} textAnchor="middle"
                      fontSize="16"
                      fill={ringColor}
                      style={{ fontFamily: 'Orbitron, monospace', fontWeight: 700 }}>
                      {status === 'complete' ? '✦' : status === 'available' ? '◇' : '🔒'.replace('🔒','⬚')}
                    </text>

                    {/* Label */}
                    <text x={x} y={y + NODE_R + 18} textAnchor="middle"
                      fontSize="10.5"
                      fill={status === 'locked' ? 'var(--text-muted)' : 'var(--text-primary)'}
                      style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
                      {n.name.length > 28 ? n.name.slice(0, 27) + '…' : n.name}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Side detail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <NodeDetail node={selected} status={selectedStatus} onUnlock={() => selected && completeNode(selected.id)} />
            <BranchLegend />
          </div>
        </div>
      </section>
    </div>
  )
}

function NodeDetail({ node, status, onUnlock }) {
  if (!node) return (
    <div className="panel" style={{ minHeight: 220 }}>
      <div className="panel-title"><span>NODE INSPECTOR</span></div>
      <div className="panel-body" style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.7 }}>
        ▸ Click a node to inspect.<br/>
        ▸ Available nodes pulse.<br/>
        ▸ Locked nodes require prerequisites.
      </div>
    </div>
  )

  const color = node.legendary ? 'var(--legendary)'
    : { COMBAT: 'var(--sys-cyan)', RAID: 'var(--rank-b)', GUILD: 'var(--rank-a)' }[node.branch]

  return (
    <div className="panel">
      <div className="panel-title">
        <span>NODE :: {node.branch}</span>
        <span style={{ color }}>{status.toUpperCase()}</span>
      </div>
      <div className="panel-body">
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
          color, letterSpacing: '0.08em', lineHeight: 1.3, marginBottom: 8,
          textShadow: node.legendary ? '0 0 20px var(--legendary-glow)' : '0 0 12px',
        }}>
          {node.name}
        </div>
        <div className="tag" style={{ color, borderColor: color, marginBottom: 10 }}>+{node.xp} XP</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 14 }}>
          {node.desc}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: 4 }}>TYPE</div>
        <div style={{ fontSize: 11, marginBottom: 10 }}>{node.type}</div>
        {node.prereqs.length > 0 && (
          <>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: 4 }}>REQUIRES</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14 }}>
              {node.prereqs.map(p => NODES.find(n => n.id === p)?.name).join(' • ')}
            </div>
          </>
        )}
        {node.legendary && (
          <div style={{
            padding: 8, marginBottom: 12,
            border: '1px solid var(--legendary)',
            background: 'rgba(255,215,106,0.06)',
            fontSize: 10, letterSpacing: '0.2em',
            color: 'var(--legendary)',
            textShadow: '0 0 10px var(--legendary-glow)',
            textAlign: 'center'
          }}>
            ◆ LEGENDARY NODE ◆
          </div>
        )}
        <button
          disabled={status !== 'available'}
          onClick={onUnlock}
          style={{ width: '100%', padding: '12px', borderColor: status === 'available' ? color : 'var(--border-dim)', color: status === 'available' ? color : 'var(--text-muted)' }}
        >
          {status === 'complete' ? '◆ CLEARED' : status === 'available' ? '▸ CLEAR NODE' : '⬚ LOCKED'}
        </button>
      </div>
    </div>
  )
}

function BranchLegend() {
  return (
    <div className="panel">
      <div className="panel-title"><span>BRANCH CODEX</span></div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
        {Object.values(BRANCHES).map(b => (
          <div key={b.key}>
            <div style={{ color: b.color, letterSpacing: '0.15em', fontFamily: 'var(--font-display)', fontSize: 12 }}>
              {b.name}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 2, lineHeight: 1.5 }}>
              {b.flavor}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
