import React, { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RANKS } from '../data/ranks.js'

export default function Ceremony({ ceremony, dismiss }) {
  useEffect(() => {
    if (!ceremony) return
    // XP + node + quest toasts auto-dismiss. Rank-up stays until click.
    if (ceremony.type === 'xp') {
      const t = setTimeout(dismiss, 1600); return () => clearTimeout(t)
    }
    if (ceremony.type === 'quest' || ceremony.type === 'node') {
      const t = setTimeout(dismiss, 3200); return () => clearTimeout(t)
    }
  }, [ceremony, dismiss])

  return (
    <AnimatePresence>
      {ceremony?.type === 'rankup' && <RankUp key="rankup" rankKey={ceremony.rankKey} dismiss={dismiss} />}
      {ceremony?.type === 'quest'  && <QuestToast key="quest-toast" quest={ceremony.quest} />}
      {ceremony?.type === 'node'   && <NodeToast key="node-toast" node={ceremony.node} />}
      {ceremony?.type === 'xp'     && <XpToast key="xp-toast" amount={ceremony.amount} source={ceremony.source} />}
    </AnimatePresence>
  )
}

function RankUp({ rankKey, dismiss }) {
  const rank = RANKS.find(r => r.key === rankKey)
  const particles = useMemo(() => (
    Array.from({ length: 48 }, (_, i) => ({
      id: i,
      angle: (i / 48) * Math.PI * 2,
      dist: 140 + Math.random() * 360,
      delay: 0.2 + Math.random() * 0.4,
      size: 3 + Math.random() * 4
    }))
  ), [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.98) 70%)',
        zIndex: 100,
        display: 'grid', placeItems: 'center',
        cursor: 'pointer'
      }}
    >
      {/* Scanline shimmer */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(0deg, transparent 0 2px, ${rank.color} 2px 3px)`,
        opacity: 0.04, pointerEvents: 'none'
      }} />

      {/* Rays */}
      <motion.div
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 360, opacity: 0.4 }}
        transition={{ rotate: { duration: 18, repeat: Infinity, ease: 'linear' }, opacity: { duration: 1.2 } }}
        style={{
          position: 'absolute', width: 1200, height: 1200,
          background: `conic-gradient(from 0deg, transparent 0deg, ${rank.glow} 20deg, transparent 40deg, transparent 180deg, ${rank.glow} 200deg, transparent 220deg)`,
          filter: 'blur(20px)',
          pointerEvents: 'none'
        }}
      />

      {/* Particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: Math.cos(p.angle) * p.dist,
            y: Math.sin(p.angle) * p.dist,
            opacity: [0, 1, 0],
            scale: [0, 1, 0.5]
          }}
          transition={{ duration: 2.2, delay: p.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: rank.color,
            boxShadow: `0 0 14px ${rank.color}, 0 0 30px ${rank.color}`,
            pointerEvents: 'none'
          }}
        />
      ))}

      {/* Rank letter */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: -20, letterSpacing: '2em' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '0.4em' }}
          transition={{ delay: 0.2, duration: 0.8 }}
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-display)',
            marginBottom: 20
          }}
        >
          RANK UPGRADE INITIATED
        </motion.div>

        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotateY: 180 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{ delay: 0.5, type: 'spring', damping: 10, stiffness: 80 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 320,
            fontWeight: 900,
            color: rank.color,
            textShadow: `0 0 60px ${rank.color}, 0 0 120px ${rank.color}, 0 0 180px ${rank.color}`,
            lineHeight: 0.9,
            letterSpacing: '-0.05em'
          }}
        >
          {rank.key}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 44, fontWeight: 800, letterSpacing: '0.3em',
            color: rank.color,
            textShadow: `0 0 24px ${rank.color}`,
            marginTop: -20
          }}
        >
          {rank.title}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.7 }}
          style={{
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            fontSize: 16, letterSpacing: '0.15em',
            marginTop: 12
          }}
        >
          "{rank.subtitle}"
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.1, duration: 1 }}
          style={{
            color: 'var(--text-primary)',
            fontSize: 13, lineHeight: 1.8,
            marginTop: 24,
            maxWidth: 640, margin: '24px auto 0',
            padding: '0 20px'
          }}
        >
          INSUFFICIENT. YOU HAVE PROVEN OTHERWISE.<br/><br/>
          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{rank.lore}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6, 1] }}
          transition={{ delay: 3.5, duration: 1.8, repeat: Infinity }}
          style={{
            marginTop: 30,
            fontSize: 11, letterSpacing: '0.4em',
            color: 'var(--text-muted)'
          }}
        >
          [ CLICK TO DISMISS ]
        </motion.div>
      </div>
    </motion.div>
  )
}

function QuestToast({ quest }) {
  const color = quest.legendary ? 'var(--legendary)' : 'var(--sys-cyan)'
  const glow = quest.legendary ? 'var(--legendary-glow)' : 'var(--sys-cyan-glow)'
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', damping: 18 }}
      style={{
        position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
        zIndex: 90,
        minWidth: 380, maxWidth: 520,
        padding: 18,
        background: 'linear-gradient(180deg, rgba(10,12,22,0.97), rgba(5,6,10,0.97))',
        border: `1px solid ${color}`,
        boxShadow: `0 0 32px ${glow}`,
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: '0.35em', color, marginBottom: 8 }}>
        ▸ OBJECTIVE CLEARED ▸
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800,
        color, textShadow: `0 0 18px ${glow}`, letterSpacing: '0.1em'
      }}>
        {quest.name.toUpperCase()}
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 8, fontStyle: 'italic' }}>
        THE SYSTEM ACKNOWLEDGES YOUR PROGRESS.
      </div>
      <div style={{ color: 'var(--rank-color)', fontSize: 11, marginTop: 8, letterSpacing: '0.2em' }}>+{quest.xp} XP</div>
    </motion.div>
  )
}

function NodeToast({ node }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', damping: 18 }}
      style={{
        position: 'fixed', top: 70, right: 30,
        zIndex: 90,
        minWidth: 260, maxWidth: 320,
        padding: 14,
        background: 'rgba(5,6,10,0.97)',
        border: '1px solid var(--sys-cyan)',
        boxShadow: '0 0 22px var(--sys-cyan-glow)'
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--sys-cyan)' }}>▸ NODE UNLOCKED :: {node.branch}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: node.legendary ? 'var(--legendary)' : 'var(--sys-cyan)', marginTop: 6, letterSpacing: '0.1em' }}>
        {node.name}
      </div>
      <div style={{ fontSize: 10, color: 'var(--rank-color)', marginTop: 6, letterSpacing: '0.2em' }}>+{node.xp} XP</div>
    </motion.div>
  )
}

function XpToast({ amount, source }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', bottom: 30, right: 30,
        zIndex: 90,
        padding: '10px 16px',
        background: 'rgba(5,6,10,0.97)',
        border: '1px solid var(--sys-cyan)',
        boxShadow: '0 0 18px var(--sys-cyan-glow)',
        fontSize: 11, letterSpacing: '0.2em'
      }}
    >
      <span style={{ color: 'var(--sys-cyan)' }}>+{amount} XP</span>
      <span style={{ color: 'var(--text-muted)', marginLeft: 10 }}>:: {source}</span>
    </motion.div>
  )
}
