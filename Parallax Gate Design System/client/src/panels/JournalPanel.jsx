import React from 'react'
import { useStore } from '../state/store.jsx'
import { IQBAL_QUOTE } from '../data/lore.js'

export default function JournalPanel() {
  const { state } = useStore()
  const entries = [...state.journal].reverse()

  return (
    <div className="col">
      <section className="panel">
        <div className="panel-title">
          <span>LORE JOURNAL :: HUNTER'S LOG</span>
          <span style={{ color: 'var(--text-muted)' }}>{state.journal.length} ENTRIES</span>
        </div>
        <div className="panel-body">
          {/* Iqbal Epigraph */}
          <div style={{
            padding: 18,
            marginBottom: 20,
            border: '1px solid var(--legendary)',
            background: 'radial-gradient(ellipse at top, rgba(255,215,106,0.05) 0%, transparent 70%), rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'var(--legendary)', marginBottom: 10 }}>
              ◆ EPIGRAPH ◆ THE ORIGIN-TEXT ◆
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 14,
              color: 'var(--legendary)',
              textShadow: '0 0 14px var(--legendary-glow)',
              whiteSpace: 'pre-line', lineHeight: 1.8,
              letterSpacing: '0.05em'
            }}>
              {IQBAL_QUOTE.text}
            </div>
            <div style={{
              whiteSpace: 'pre-line', color: 'var(--text-secondary)',
              fontStyle: 'italic', fontSize: 11, lineHeight: 1.7, marginTop: 12
            }}>
              {IQBAL_QUOTE.translation}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em', marginTop: 10, textAlign: 'right' }}>
              {IQBAL_QUOTE.attribution}
            </div>
          </div>

          {entries.length === 0 && (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              — The journal is empty. Complete a quest or unlock a node. —
            </div>
          )}

          <div style={{ position: 'relative', paddingLeft: 24 }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute', left: 7, top: 8, bottom: 8,
              width: 1, background: 'var(--border-dim)'
            }} />
            {entries.map((e, i) => (
              <div key={e.id} style={{ position: 'relative', marginBottom: 20, animation: `fadeInUp 400ms var(--ease-out) ${i * 40}ms both` }}>
                <div style={{
                  position: 'absolute', left: -21, top: 6,
                  width: 10, height: 10,
                  border: '1.5px solid var(--sys-cyan)',
                  background: 'var(--bg-deep)',
                  boxShadow: '0 0 10px var(--sys-cyan-glow)',
                  transform: 'rotate(45deg)'
                }} />
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.25em' }}>
                  {new Date(e.date).toLocaleString()}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                  color: 'var(--sys-cyan)',
                  textShadow: '0 0 10px var(--sys-cyan-glow)',
                  letterSpacing: '0.1em',
                  margin: '4px 0 8px'
                }}>
                  {e.title}
                </div>
                <div style={{
                  whiteSpace: 'pre-line', fontSize: 12, lineHeight: 1.7,
                  color: 'var(--text-secondary)'
                }}>
                  {e.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
