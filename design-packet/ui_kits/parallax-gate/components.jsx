// Shared UI components for the Parallax Gate kit (Babel/JSX)
// Exports to window at bottom.

const RANKS = [
  { key: 'E', title: 'AWAKENED', threshold: 0 },
  { key: 'D', title: 'HUNTER', threshold: 100 },
  { key: 'C', title: 'SOLO RAIDER', threshold: 250 },
  { key: 'B', title: 'RANKED HUNTER', threshold: 500 },
  { key: 'A', title: 'ELITE HUNTER', threshold: 900 },
  { key: 'S', title: 'MONARCH', threshold: 1500 }
];
function rankFromXP(xp) { let cur = RANKS[0]; for (const r of RANKS) if (xp >= r.threshold) cur = r; return cur; }
function nextRank(k) { const i = RANKS.findIndex(r => r.key === k); return i < RANKS.length - 1 ? RANKS[i+1] : null; }
function rankProgress(xp) { const c = rankFromXP(xp); const n = nextRank(c.key); if (!n) return { current:c, next:null, pct:1, within:0, span:0 }; const span = n.threshold - c.threshold; const within = xp - c.threshold; return { current:c, next:n, pct: Math.min(1, within/span), within, span }; }

const STATS = {
  STR: { name:'STRENGTH', label:'PHYSICAL CONDITIONING', source:'FITBIT',  color:'var(--rank-s)',   glow:'var(--rank-s-glow)',   flavor:'Iron forged in motion.' },
  VIT: { name:'VITALITY', label:'ENDURANCE & RECOVERY', source:'FITBIT',   color:'var(--rank-d)',   glow:'var(--rank-d-glow)',   flavor:"Recovery is a hunter's inheritance." },
  INT: { name:'INTELLIGENCE', label:'TECHNICAL COMBAT POWER', source:'LEETCODE', color:'var(--rank-c)', glow:'var(--rank-c-glow)', flavor:'The mind that solves the maze.' },
  AGI: { name:'AGILITY', label:'EXECUTION SPEED', source:'LEETCODE', color:'var(--sys-cyan)', glow:'var(--sys-cyan-glow)', flavor:'Cadence. Consistency.' },
  SEN: { name:'SENSE', label:'SITUATIONAL AWARENESS', source:'FITBIT', color:'var(--legendary)', glow:'var(--legendary-glow)', flavor:'The hunter who walks the world sees the world\u2019s moves.' },
  CHA: { name:'CHARISMA', label:'COMMAND PRESENCE', source:'QUEST', color:'var(--rank-b)', glow:'var(--rank-b-glow)', flavor:'Voice earns rooms.' }
};
const STAT_KEYS = ['STR','VIT','INT','AGI','SEN','CHA'];

// TOPBAR
function TopBar() {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const time = now.toLocaleTimeString('en-US', { hour12:false });
  const date = now.toLocaleDateString('en-US', { year:'numeric', month:'2-digit', day:'2-digit' });
  return (
    <div className="topbar">
      <div className="topbar-brand"><span className="dot" />PARALLAX GATE</div>
      <div className="topbar-center">:: SYSTEM INTERFACE // HUNTER TEKRON CLASSIFIED ACTIVE ::</div>
      <div className="topbar-right">
        <span className="topbar-status-led" /><span>ONLINE</span>
        <span style={{ opacity:0.6 }}>{date}</span>
        <span style={{ color:'var(--sys-cyan)' }}>{time}</span>
      </div>
    </div>
  );
}

// SIDEBAR
const TABS = [
  { key:'STATUS', label:'STATUS', idx:'01' },
  { key:'RECOVERY', label:'RECOVERY', idx:'02' },
  { key:'SKILLTREE', label:'SKILL TREE', idx:'03' },
  { key:'QUESTS', label:'QUEST LOG', idx:'04' },
  { key:'JOURNAL', label:'LORE', idx:'05' },
  { key:'PROFILE', label:'HUNTER', idx:'06' },
  { key:'CONFIG', label:'SYSTEM CFG', idx:'07' }
];
function Sidebar({ tab, setTab, hunterName='TEKRON', title='RELENTLESS HUNTER', xp=320, streak=18, daysActive=42 }) {
  const p = rankProgress(xp);
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="hunter-name">{hunterName}</div>
        <div className="hunter-title">[ {title} ]</div>
        <div className="hunter-rank">
          <div className="rank-badge">{p.current.key}</div>
          <div className="rank-meta">
            <span className="t">RANK</span>
            <span className="v">{p.current.title}</span>
          </div>
        </div>
        <div style={{ marginTop:12, fontSize:10, letterSpacing:'0.2em', color:'var(--text-secondary)' }}>
          XP :: <span className="hl-rank">{xp}</span>
          {p.next && <> / <span style={{ color:'var(--text-muted)' }}>{p.next.threshold}</span></>}
        </div>
      </div>
      {TABS.map(t => (
        <div key={t.key} className={`nav-item ${tab===t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
          <span className="idx">{t.idx}</span><span>{t.label}</span>
        </div>
      ))}
      <div className="sidebar-footer">STREAK :: {streak}D<br/>ACTIVE :: {daysActive}D</div>
    </aside>
  );
}

// RUNES
function Runes() {
  const runes = React.useMemo(() => {
    const glyphs = ['◈','⬢','▲','◆','◇','⊹','◉','▸'];
    return Array.from({ length: 14 }, (_, i) => ({
      g: glyphs[i % glyphs.length],
      left: Math.random() * 100,
      delay: -Math.random() * 22,
      duration: 18 + Math.random() * 10,
      size: 14 + Math.random() * 8
    }));
  }, []);
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2, overflow:'hidden' }}>
      {runes.map((r, i) => (
        <span key={i} style={{
          position:'absolute', bottom:'-40px', left:`${r.left}%`,
          fontFamily:'var(--font-display)', fontSize:r.size,
          color:'var(--sys-cyan)', textShadow:'0 0 14px var(--sys-cyan)',
          opacity:0, animation:`runeFloat ${r.duration}s linear infinite`, animationDelay:`${r.delay}s`
        }}>{r.g}</span>
      ))}
    </div>
  );
}

// STAT BAR
function StatBar({ k, value, trend='flat', live=true, onClick }) {
  const def = STATS[k];
  const state = value >= 80 ? 'high' : value >= 40 ? 'mid' : value >= 20 ? 'low' : 'cold';
  const ARROW = { up:'▲', down:'▼', flat:'▬' };
  const AC = { up:'var(--ok)', down:'var(--warn)', flat:'var(--text-muted)' };
  return (
    <div onClick={onClick} style={{
      padding:12,
      border:`1px solid ${state==='high' ? def.color : (state==='cold' ? 'var(--border-dim)' : 'var(--border-mid)')}`,
      background:'rgba(0,0,0,0.35)',
      cursor: onClick ? 'pointer' : 'default',
      boxShadow: state==='high' ? `0 0 18px ${def.glow}` : 'none',
      opacity: value < 20 ? 0.7 : 1,
      transition:'all 200ms var(--ease-out)'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <div>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:800, letterSpacing:'0.2em', color:def.color, textShadow: state==='high' ? `0 0 10px ${def.glow}` : 'none', fontSize:14 }}>{def.name}</span>
          <span style={{ color:'var(--text-muted)', marginLeft:8, fontSize:9, letterSpacing:'0.25em' }}>{def.label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="tag" style={{ fontSize:9, color: live ? 'var(--ok)' : 'var(--warn)', borderColor: live ? 'var(--ok)' : 'var(--warn)' }}>
            {def.source === 'QUEST' ? 'QUEST-BASED' : `${def.source} ${live ? 'LIVE' : 'OFFLINE'}`}
          </span>
          <span style={{ color: AC[trend], fontSize:12 }}>{ARROW[trend]}</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color:def.color, textShadow: state==='high' ? `0 0 14px ${def.glow}` : 'none', minWidth:54, textAlign:'right' }}>{Math.round(value)}</div>
        <div style={{ flex:1, height:10, background:'rgba(0,0,0,0.6)', border:'1px solid var(--border-dim)', position:'relative' }}>
          <div style={{
            height:'100%', width:`${Math.max(2, Math.min(100, value))}%`,
            background:`linear-gradient(90deg, ${def.color} 0%, rgba(255,255,255,0.5) 50%, ${def.color} 100%)`,
            backgroundSize:'200% 100%',
            animation: state==='high' ? 'shimmer 2.4s linear infinite' : 'none',
            boxShadow: state==='high' ? `0 0 14px ${def.glow}` : 'none',
            transition: 'width 600ms var(--ease-out)'
          }} />
        </div>
        <div style={{ color:'var(--text-muted)', fontSize:10, letterSpacing:'0.2em', minWidth:36, textAlign:'right' }}>/ 100</div>
      </div>
    </div>
  );
}

// XP BAR
function XPBar({ xp }) {
  const p = rankProgress(xp);
  return (
    <div style={{ width:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, letterSpacing:'0.2em', color:'var(--text-secondary)', marginBottom:6, textTransform:'uppercase' }}>
        <span>RANK {p.current.key} :: {p.current.title}</span>
        {p.next ? <span>{p.within} / {p.span} XP → {p.next.key}</span> : <span>MAX RANK</span>}
      </div>
      <div style={{ height:12, border:'1px solid var(--border-mid)', background:'rgba(0,0,0,0.5)', position:'relative', overflow:'hidden' }}>
        <div style={{
          height:'100%', width:`${p.pct*100}%`,
          background:'linear-gradient(90deg, var(--rank-color) 0%, rgba(255,255,255,0.4) 50%, var(--rank-color) 100%)',
          backgroundSize:'200% 100%', animation:'shimmer 3s linear infinite',
          boxShadow:'0 0 18px var(--rank-glow), inset 0 0 8px rgba(255,255,255,0.3)',
          transition:'width 800ms var(--ease-out)'
        }} />
        <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(90deg, transparent 0, transparent 22px, rgba(0,0,0,0.25) 22px, rgba(0,0,0,0.25) 23px)', pointerEvents:'none' }} />
      </div>
    </div>
  );
}

// STAT RADAR (hexagonal)
function StatRadar({ stats, size=240 }) {
  const cx = size/2, cy = size/2, R = size/2 - 28;
  const angleFor = i => (Math.PI*2*i/6) - Math.PI/2;
  const poly = fn => STAT_KEYS.map((k,i) => { const r = fn(k,i); const a = angleFor(i); return `${cx+Math.cos(a)*r},${cy+Math.sin(a)*r}`; }).join(' ');
  return (
    <svg width={size} height={size}>
      <defs>
        <filter id="rg" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {[0.25,0.5,0.75,1].map((lv,i) => (
        <polygon key={i} points={poly(() => R*lv)} fill="none" stroke="var(--border-mid)" strokeOpacity={0.35} strokeDasharray={i<3 ? '2 4' : '0'} />
      ))}
      {STAT_KEYS.map((k,i) => { const a = angleFor(i); return <line key={k} x1={cx} y1={cy} x2={cx+Math.cos(a)*R} y2={cy+Math.sin(a)*R} stroke="var(--border-dim)" strokeOpacity={0.5} />; })}
      <polygon points={poly(k => R*((stats[k]??0)/100))} fill="var(--rank-color)" fillOpacity={0.18} stroke="var(--rank-color)" strokeWidth="1.5" filter="url(#rg)" />
      {STAT_KEYS.map((k,i) => {
        const def = STATS[k]; const a = angleFor(i); const r = R*((stats[k]??0)/100);
        const lx = cx+Math.cos(a)*(R+18), ly = cy+Math.sin(a)*(R+18);
        return (
          <g key={k}>
            <circle cx={cx+Math.cos(a)*r} cy={cy+Math.sin(a)*r} r="3.5" fill={def.color} stroke="white" strokeOpacity="0.3" strokeWidth="0.5" filter="url(#rg)" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill={def.color} style={{ fontFamily:'Orbitron, monospace', fontWeight:700, fontSize:11, letterSpacing:'0.12em' }}>{def.name.slice(0,3)}</text>
            <text x={lx} y={ly+12} textAnchor="middle" fill="var(--text-muted)" style={{ fontSize:9 }}>{Math.round(stats[k]??0)}</text>
          </g>
        );
      })}
    </svg>
  );
}

Object.assign(window, { RANKS, rankFromXP, nextRank, rankProgress, STATS, STAT_KEYS, TopBar, Sidebar, Runes, StatBar, XPBar, StatRadar });
