import React, { useEffect, useState } from 'react'
import { useStore } from '../state/store.jsx'

export default function TopBar() {
  const { state } = useStore()
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const time = now.toLocaleTimeString('en-US', { hour12: false })
  const date = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <span className="dot" />
        PARALLAX GATE
      </div>
      <div className="topbar-center">
        :: SYSTEM INTERFACE // HUNTER TEKRON CLASSIFIED ACTIVE ::
      </div>
      <div className="topbar-right">
        <span className="topbar-status-led" />
        <span>ONLINE</span>
        <span style={{ opacity: 0.6 }}>{date}</span>
        <span style={{ color: 'var(--sys-cyan)' }}>{time}</span>
      </div>
    </div>
  )
}
