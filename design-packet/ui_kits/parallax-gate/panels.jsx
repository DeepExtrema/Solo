// Panels: StatusPanel, ProfilePanel, QuestLogPanel, JournalPanel, ConfigPanel, RecoveryPanel stub
const { useState } = React;

function StatusPanel({ stats, setStats, xp }) {
  return (
    <div className="col">
      <div className="panel">
        <div className="panel-title"><span>HUNTER STATUS</span><span style={{ fontSize:9, color:'var(--text-muted)' }}>LAST SYNC :: JUST NOW</span></div>
        <div className="panel-body">
          <XPBar xp={xp} />
        </div>
      </div>
      <div className="grid-2">
        <div className="panel">
          <div className="panel-title"><span>ATTRIBUTES</span><span style={{ fontSize:9, color:'var(--text-muted)' }}>6 / 6</span></div>
          <div className="panel-body">
            <StatRadar stats={stats} size={260} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-title"><span>DAILY DUNGEON</span><span style={{ fontSize:9, color:'var(--ok)' }}>◆ AVAILABLE</span></div>
          <div className="panel-body">
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, letterSpacing:'0.15em', color:'var(--sys-cyan)', textShadow:'0 0 12px var(--sys-cyan-glow)' }}>SUBARRAY WITH K DISTINCT</div>
            <div style={{ fontSize:10, letterSpacing:'0.2em', color:'var(--text-secondary)', marginTop:6, textTransform:'uppercase' }}>DIFFICULTY :: MEDIUM · ACCEPTANCE :: 61%</div>
            <div style={{ fontSize:12, color:'var(--text-primary)', marginTop:12, lineHeight:1.6 }}>Given an array of positive integers and integer K, return the number of contiguous subarrays whose number of distinct elements is exactly K.</div>
            <div style={{ marginTop:14, display:'flex', gap:10 }}>
              <button style={{ borderColor:'var(--rank-color)', color:'var(--rank-color)', boxShadow:'0 0 14px var(--rank-glow)' }}>▸ ENTER DUNGEON</button>
              <button>▸ DISMISS</button>
            </div>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-title"><span>STAT BREAKDOWN</span><span style={{ fontSize:9, color:'var(--text-muted)' }}>CLICK TO EXPAND</span></div>
        <div className="panel-body col">
          <StatBar k="STR" value={stats.STR} trend="up" live />
          <StatBar k="VIT" value={stats.VIT} trend="flat" live />
          <StatBar k="INT" value={stats.INT} trend="up" live />
          <StatBar k="AGI" value={stats.AGI} trend="down" live />
          <StatBar k="SEN" value={stats.SEN} trend="up" live />
          <StatBar k="CHA" value={stats.CHA} trend="flat" live={false} />
        </div>
      </div>
    </div>
  );
}

function QuestLogPanel() {
  const dailies = [
    { id:'d1', label:'Solve the Daily Dungeon', xp:10, done:true },
    { id:'d2', label:'8,000 steps', xp:8, done:true },
    { id:'d3', label:'Sleep before 23:30', xp:6, done:false },
    { id:'d4', label:'Ship a commit', xp:10, done:false }
  ];
  const mains = [
    { id:'m1', label:'Apply to 5 robotics/AI engineering roles', xp:60, tag:'APPLY' },
    { id:'m2', label:'Solve 200 weighted LeetCode problems', xp:80, tag:'TECHNICAL' },
    { id:'m4', label:'Publish Parallax paper draft', xp:120, tag:'RESEARCH' },
    { id:'m5', label:'Close seed round', xp:200, tag:'FOUNDER' }
  ];
  return (
    <div className="grid-2">
      <div className="panel">
        <div className="panel-title"><span>DAILY QUESTS</span><span style={{ fontSize:9, color:'var(--text-muted)' }}>RESET 00:00</span></div>
        <div className="panel-body col" style={{ gap:8 }}>
          {dailies.map(q => (
            <div key={q.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', border:`1px solid ${q.done ? 'var(--ok)' : 'var(--border-dim)'}`, background:'rgba(0,0,0,0.3)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontFamily:'var(--font-display)', color: q.done ? 'var(--ok)' : 'var(--text-muted)', fontSize:16 }}>{q.done ? '◆' : '◇'}</span>
                <span style={{ fontSize:12, color:'var(--text-primary)', textDecoration: q.done ? 'line-through' : 'none', opacity: q.done ? 0.6 : 1 }}>{q.label}</span>
              </div>
              <span className="tag" style={{ color:'var(--legendary)', borderColor:'var(--legendary)' }}>+{q.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="panel-title"><span>MAIN QUESTS</span><span style={{ fontSize:9, color:'var(--text-muted)' }}>RAID LINE</span></div>
        <div className="panel-body col" style={{ gap:8 }}>
          {mains.map(q => (
            <div key={q.id} style={{ padding:10, border:'1px solid var(--border-mid)', background:'rgba(0,0,0,0.35)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:11, letterSpacing:'0.25em', color:'var(--sys-cyan)', textTransform:'uppercase' }}>▸ {q.tag}</span>
                <span className="tag" style={{ color:'var(--legendary)', borderColor:'var(--legendary)' }}>+{q.xp} XP</span>
              </div>
              <div style={{ fontSize:12, color:'var(--text-primary)', marginTop:6 }}>{q.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JournalPanel() {
  const entries = [
    { t:'The Gate Opens', b:'HUNTER TEKRON. YOUR STATUS HAS BEEN UPDATED. A gate has been registered in your name.', key:'init' },
    { t:'D-Rank Achieved', b:'The smallest gates obey you now. The hunt has its rhythm. Continue.', key:'rankD' },
    { t:'Seven Days In', b:'A week without breaking the chain. The System logs it. Momentum has its own gravity.', key:'s7' },
    { t:'C-Rank Achieved', b:'No more parties. The gate opens for you alone. The System has no parental settings.', key:'rankC' }
  ];
  return (
    <div className="col">
      <div className="panel">
        <div className="panel-title"><span>LORE :: JOURNAL</span><span style={{ fontSize:9, color:'var(--text-muted)' }}>{entries.length} ENTRIES UNLOCKED</span></div>
        <div className="panel-body col" style={{ gap:14 }}>
          {entries.map(e => (
            <div key={e.key} style={{ paddingLeft:14, borderLeft:'2px solid var(--rank-color)' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:12, letterSpacing:'0.25em', color:'var(--rank-color)', textTransform:'uppercase', textShadow:'0 0 10px var(--rank-glow)' }}>{e.t}</div>
              <div style={{ fontSize:12, color:'var(--text-primary)', marginTop:6, lineHeight:1.6 }}>{e.b}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="panel-title"><span>EPIGRAPH</span></div>
        <div className="panel-body" style={{ textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:13, color:'var(--sys-cyan)', letterSpacing:'0.15em', lineHeight:1.7, textShadow:'0 0 12px var(--sys-cyan-glow)' }}>
            "Khudi ko kar buland itna ke har taqdeer se pehle<br/>
            Khuda bande se khud poochhe, bataa teri raza kya hai."
          </div>
          <div style={{ fontSize:10, letterSpacing:'0.25em', color:'var(--text-muted)', textTransform:'uppercase', marginTop:10 }}>— ALLAMA IQBAL</div>
        </div>
      </div>
    </div>
  );
}

function ProfilePanel({ stats, xp, setXP }) {
  const p = rankProgress(xp);
  return (
    <div className="col">
      <div className="panel">
        <div className="panel-title"><span>HUNTER PROFILE</span></div>
        <div className="panel-body" style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'center' }}>
          <div style={{ width:120, height:120, border:`2px solid var(--rank-color)`, color:'var(--rank-color)', display:'grid', placeItems:'center', fontFamily:'var(--font-display)', fontWeight:900, fontSize:64, boxShadow:'0 0 24px var(--rank-glow), inset 0 0 20px rgba(255,255,255,0.04)', background:'rgba(0,0,0,0.5)' }}>{p.current.key}</div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, letterSpacing:'0.2em' }}>TEKRON</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:12, letterSpacing:'0.3em', color:'var(--rank-color)', textShadow:'0 0 10px var(--rank-glow)', marginTop:4, textTransform:'uppercase' }}>[ RELENTLESS HUNTER ]</div>
            <div style={{ fontSize:12, color:'var(--text-primary)', marginTop:10, lineHeight:1.6 }}>Rank <span className="hl-rank">{p.current.key} · {p.current.title}</span> · Class <span className="hl">ARCHITECT OF SYSTEMS</span></div>
            <div style={{ marginTop:12, display:'flex', gap:10, flexWrap:'wrap' }}>
              <button onClick={() => setXP(xp + 40)}>▸ +40 XP</button>
              <button onClick={() => setXP(100)} style={{ borderColor:'var(--warn)', color:'var(--warn)' }}>▼ RESET</button>
              {typeof window !== 'undefined' && window.__triggerCeremony && (
                <button onClick={() => window.__triggerCeremony()} style={{ borderColor:'var(--legendary)', color:'var(--legendary)', boxShadow:'0 0 14px var(--legendary-glow)' }}>
                  ◈ TRIGGER RANK-UP
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-title"><span>RANK LADDER</span></div>
        <div className="panel-body" style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
          {RANKS.map(r => {
            const active = r.key === p.current.key;
            return (
              <div key={r.key} style={{ textAlign:'center', padding:10, border:`1px solid ${active ? 'var(--rank-color)' : 'var(--border-dim)'}`, background: active ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.3)', boxShadow: active ? '0 0 18px var(--rank-glow)' : 'none' }}>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:24, color: active ? 'var(--rank-color)' : 'var(--text-muted)' }}>{r.key}</div>
                <div style={{ fontSize:9, letterSpacing:'0.2em', color: active ? 'var(--rank-color)' : 'var(--text-muted)', textTransform:'uppercase', marginTop:4 }}>{r.title}</div>
                <div style={{ fontSize:9, letterSpacing:'0.15em', color:'var(--text-muted)', marginTop:4 }}>{r.threshold} XP</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ConfigPanel() {
  const [fitbit, setFitbit] = useState(true);
  const [lc, setLc] = useState(true);
  const Row = ({ label, active, setActive, subject }) => (
    <div style={{ padding:14, border:'1px solid var(--border-dim)', background:'rgba(0,0,0,0.35)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:12, letterSpacing:'0.3em', color:'var(--sys-cyan)', textTransform:'uppercase' }}>▸ {label}</div>
          <div style={{ fontSize:10, color: active ? 'var(--ok)' : 'var(--warn)', letterSpacing:'0.25em', textTransform:'uppercase', marginTop:6 }}>
            {active ? `◆ ${subject} SYNC ACTIVE` : `◇ ${subject} DISCONNECTED`}
          </div>
        </div>
        <button onClick={() => setActive(!active)} style={active ? { borderColor:'var(--warn)', color:'var(--warn)' } : { borderColor:'var(--rank-color)', color:'var(--rank-color)', boxShadow:'0 0 12px var(--rank-glow)' }}>
          {active ? '▼ DISCONNECT' : '▸ INITIALIZE'}
        </button>
      </div>
    </div>
  );
  return (
    <div className="col">
      <div className="panel">
        <div className="panel-title"><span>SYSTEM CONFIG</span></div>
        <div className="panel-body col">
          <Row label="FITBIT CREDENTIALS" active={fitbit} setActive={setFitbit} subject="FITBIT" />
          <Row label="LEETCODE HANDLE" active={lc} setActive={setLc} subject="LEETCODE" />
          <div style={{ padding:14, border:'1px solid var(--border-dim)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:12, letterSpacing:'0.3em', color:'var(--sys-cyan)' }}>▸ FORCE SYNC</div>
            <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:6, lineHeight:1.6 }}>Bypasses the 15-minute poll. Your hunter attributes will populate within ~5 seconds.</div>
            <div style={{ marginTop:10 }}><button>▸ FORCE SYNC</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecoveryPanel() {
  return (
    <div className="panel">
      <div className="panel-title"><span>RECOVERY</span><span style={{ fontSize:9, color:'var(--text-muted)' }}>SLEEP · READINESS · HRV</span></div>
      <div className="panel-body">
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ position:'relative', width:140, height:140 }}>
            <svg width="140" height="140">
              <circle cx="70" cy="70" r="58" fill="none" stroke="var(--border-dim)" strokeWidth="8" />
              <circle cx="70" cy="70" r="58" fill="none" stroke="var(--ok)" strokeWidth="8" strokeDasharray={`${2*Math.PI*58*0.78} ${2*Math.PI*58}`} strokeLinecap="butt" transform="rotate(-90 70 70)" style={{ filter:'drop-shadow(0 0 10px var(--ok))' }} />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', fontFamily:'var(--font-display)', fontWeight:900, fontSize:36, color:'var(--ok)', textShadow:'0 0 14px var(--ok)' }}>78</div>
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:14, letterSpacing:'0.25em', color:'var(--sys-cyan)', textTransform:'uppercase' }}>READINESS :: GOOD</div>
            <div style={{ fontSize:11, color:'var(--text-secondary)', letterSpacing:'0.2em', textTransform:'uppercase', marginTop:6 }}>SLEEP :: 7H 12M  ·  RHR :: 58 BPM  ·  HRV :: 42 MS</div>
            <div style={{ fontSize:12, color:'var(--text-primary)', marginTop:10, lineHeight:1.6, maxWidth:420 }}>"Recovery is a hunter's inheritance. Rest is strategy." The Gate holds patience with those who sleep.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StatusPanel, QuestLogPanel, JournalPanel, ProfilePanel, ConfigPanel, RecoveryPanel });
