import React, { useMemo } from 'react'

const GLYPHS = ['✦', '◆', '⟡', '✧', '⬢', '⌬', '✺', '◈', '◇']

export default function Runes() {
  const runes = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 22,
      duration: 18 + Math.random() * 14,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      size: 12 + Math.random() * 10,
      opacity: 0.25 + Math.random() * 0.4
    }))
  }, [])
  return (
    <div className="runes">
      {runes.map(r => (
        <span
          key={r.id}
          className="rune"
          style={{
            left: `${r.left}%`,
            animationDelay: `-${r.delay}s`,
            animationDuration: `${r.duration}s`,
            fontSize: `${r.size}px`,
            opacity: r.opacity
          }}
        >
          {r.glyph}
        </span>
      ))}
    </div>
  )
}
