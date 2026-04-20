// Skill Tree: node graph with unlocked / locked / available states.
// Nodes are per-stat skills + class keystones. Purely visual click-thru.
const { useState: useSTState } = React;

const SKILLS = [
  // root
  { id:'root', x: 50, y: 92, tier:0, name:'AWAKENED', stat:'CORE', icon:'◈', desc:'The gate opens. You exist within the System.', cost:0, prereq:[] },

  // tier 1 - foundation
  { id:'str1', x: 15, y: 72, tier:1, name:'IRON CORE',       stat:'STR', icon:'▲', desc:'+5% physical conditioning cap. Stamina regen idle.', cost:1, prereq:['root'] },
  { id:'int1', x: 42, y: 72, tier:1, name:'LATTICE MIND',    stat:'INT', icon:'◆', desc:'Algorithmic pattern-matching: INT gains on solved dungeons compound.', cost:1, prereq:['root'] },
  { id:'agi1', x: 70, y: 72, tier:1, name:'QUICKFORM',       stat:'AGI', icon:'◇', desc:'Execution speed. AGI bar refresh rate +1 tier.', cost:1, prereq:['root'] },
  { id:'sen1', x: 90, y: 72, tier:1, name:'SIGHT WOKEN',     stat:'SEN', icon:'⊹', desc:'Ambient HRV read-back. SEN tracking becomes passive.', cost:1, prereq:['root'] },

  // tier 2 - intermediate
  { id:'str2', x: 8,  y: 48, tier:2, name:'FORGE DOCTRINE',  stat:'STR', icon:'⬢', desc:'Heavy-compound sessions count double for 48h after rank-up.', cost:2, prereq:['str1'] },
  { id:'int2', x: 32, y: 48, tier:2, name:'DEEP LATTICE',    stat:'INT', icon:'◉', desc:'Hard-tier dungeons grant 1.5× XP.', cost:2, prereq:['int1'] },
  { id:'vit2', x: 56, y: 48, tier:2, name:'SECOND HEART',    stat:'VIT', icon:'◆', desc:'Readiness above 70 grants +VIT daily.', cost:2, prereq:['int1'] },
  { id:'agi2', x: 80, y: 48, tier:2, name:'SHADOW CADENCE',  stat:'AGI', icon:'▸', desc:'Streak-days convert into compounding AGI multiplier.', cost:2, prereq:['agi1','sen1'] },

  // tier 3 - class keystones
  { id:'classA', x: 20, y: 20, tier:3, name:'IRON SOVEREIGN', stat:'CLASS', icon:'⬢', desc:'Class change. STR + VIT become co-dominant. Unlocks Dungeon: Crucible.', cost:3, prereq:['str2','vit2'], keystone:true },
  { id:'classB', x: 50, y: 20, tier:3, name:'ARCHITECT',      stat:'CLASS', icon:'◈', desc:'Class change. INT governs all scaling. Unlocks Dungeon: Recursion.', cost:3, prereq:['int2'], keystone:true },
  { id:'classC', x: 80, y: 20, tier:3, name:'SHADOW RAIDER',  stat:'CLASS', icon:'▲', desc:'Class change. AGI + SEN fuse. Unlocks Dungeon: The Vanish.', cost:3, prereq:['agi2'], keystone:true },
];

const UNLOCKED = new Set(['root','str1','int1','agi1','sen1','int2','vit2']);
const AVAILABLE = new Set(['str2','agi2','classB']);

function SkillTreePanel() {
  const [selected, setSelected] = useSTState('classB');
  const sel = SKILLS.find(s => s.id === selected) || SKILLS[0];

  const nodeState = (id) => UNLOCKED.has(id) ? 'unlocked' : AVAILABLE.has(id) ? 'available' : 'locked';
  const stateStyle = (state, keystone) => {
    if (state === 'unlocked') return { color: keystone ? 'var(--legendary)' : 'var(--rank-color)', glow: keystone ? 'var(--legendary-glow)' : 'var(--rank-glow)', opacity:1 };
    if (state === 'available') return { color: 'var(--sys-cyan)', glow: 'var(--sys-cyan-glow)', opacity:1 };
    return { color: 'var(--text-muted)', glow: 'transparent', opacity:0.35 };
  };

  const findNode = id => SKILLS.find(s => s.id === id);
  const H = 560; // svg viewbox scale for edges

  return (
    <div className="col">
      <div className="panel">
        <div className="panel-title">
          <span>SKILL TREE :: HUNTER TEKRON</span>
          <span style={{ fontSize:9, color:'var(--text-muted)' }}>POINTS :: <span style={{ color:'var(--legendary)' }}>3</span> · SKILLS UNLOCKED :: 7 / {SKILLS.length}</span>
        </div>
        <div className="panel-body" style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20 }}>
          {/* graph */}
          <div style={{ position:'relative', height:H, background:'rgba(0,0,0,0.45)', border:'1px solid var(--border-dim)', overflow:'hidden' }}>
            {/* grid */}
            <div style={{ position:'absolute', inset:0,
              backgroundImage:'linear-gradient(rgba(94,225,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(94,225,255,0.05) 1px, transparent 1px)',
              backgroundSize:'32px 32px' }} />
            {/* edges */}
            <svg width="100%" height="100%" style={{ position:'absolute', inset:0 }}>
              {SKILLS.flatMap(s => s.prereq.map(p => {
                const from = findNode(p); if (!from) return null;
                const state = nodeState(s.id) === 'unlocked' && nodeState(from.id) === 'unlocked' ? 'unlocked' : nodeState(s.id) === 'available' ? 'available' : 'locked';
                const { color } = stateStyle(state);
                return <line key={`${p}-${s.id}`}
                  x1={`${from.x}%`} y1={`${from.y}%`} x2={`${s.x}%`} y2={`${s.y}%`}
                  stroke={color} strokeOpacity={state === 'locked' ? 0.15 : 0.6} strokeWidth={state === 'unlocked' ? 1.5 : 1} strokeDasharray={state === 'available' ? '4 4' : '0'}
                  style={{ filter: state !== 'locked' ? `drop-shadow(0 0 4px ${color})` : 'none' }} />;
              }))}
            </svg>

            {/* nodes */}
            {SKILLS.map(s => {
              const state = nodeState(s.id);
              const { color, glow, opacity } = stateStyle(state, s.keystone);
              const size = s.keystone ? 56 : s.tier === 0 ? 50 : 40;
              const isSel = s.id === selected;
              return (
                <div key={s.id}
                  onClick={() => setSelected(s.id)}
                  style={{
                    position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
                    transform:'translate(-50%,-50%)',
                    width:size, height:size, display:'grid', placeItems:'center',
                    border:`${isSel ? 2 : 1}px solid ${color}`, background:'rgba(5,6,10,0.9)',
                    boxShadow: state !== 'locked' ? `0 0 ${isSel ? 20 : 12}px ${glow}${state === 'unlocked' ? ', inset 0 0 10px rgba(255,255,255,0.05)' : ''}` : 'none',
                    color, fontFamily:'var(--font-display)', fontSize: size * 0.4, fontWeight:900,
                    cursor:'pointer', opacity,
                    transition:'all 200ms var(--ease-out)',
                    transform: `translate(-50%,-50%) ${isSel ? 'scale(1.1)' : 'scale(1)'}`,
                    animation: state === 'available' ? 'pulseGlow 2.4s ease-in-out infinite' : 'none',
                    clipPath: s.keystone ? 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' : 'none'
                  }}>
                  {s.icon}
                  {/* tier-0 root label below */}
                  {s.tier === 0 && <div style={{
                    position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)',
                    marginTop:8, fontSize:9, letterSpacing:'0.3em', whiteSpace:'nowrap', color:'var(--text-secondary)', fontFamily:'var(--font-mono)'
                  }}>▸ {s.name}</div>}
                </div>
              );
            })}

            {/* tier labels */}
            <div style={{ position:'absolute', left:10, top:12, fontFamily:'var(--font-display)', fontSize:9, letterSpacing:'0.3em', color:'var(--text-muted)' }}>TIER III · CLASS</div>
            <div style={{ position:'absolute', left:10, top:'42%', fontFamily:'var(--font-display)', fontSize:9, letterSpacing:'0.3em', color:'var(--text-muted)' }}>TIER II</div>
            <div style={{ position:'absolute', left:10, top:'66%', fontFamily:'var(--font-display)', fontSize:9, letterSpacing:'0.3em', color:'var(--text-muted)' }}>TIER I</div>
          </div>

          {/* detail pane */}
          <div style={{ border:'1px solid var(--border-dim)', background:'rgba(0,0,0,0.5)', padding:16 }}>
            {sel && (() => {
              const state = nodeState(sel.id);
              const { color, glow } = stateStyle(state, sel.keystone);
              return (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div style={{
                      width:52, height:52, display:'grid', placeItems:'center',
                      border:`2px solid ${color}`, background:'rgba(0,0,0,0.6)',
                      color, fontFamily:'var(--font-display)', fontSize:24, fontWeight:900,
                      boxShadow:`0 0 14px ${glow}`,
                      clipPath: sel.keystone ? 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' : 'none'
                    }}>{sel.icon}</div>
                    <div>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:14, letterSpacing:'0.2em', color, textShadow:`0 0 10px ${glow}` }}>{sel.name}</div>
                      <div style={{ fontSize:10, letterSpacing:'0.25em', color:'var(--text-muted)', textTransform:'uppercase', marginTop:3 }}>{sel.stat} · TIER {sel.tier}</div>
                    </div>
                  </div>

                  <div className="tag" style={{
                    color: state==='unlocked' ? 'var(--ok)' : state==='available' ? 'var(--sys-cyan)' : 'var(--text-muted)',
                    borderColor: state==='unlocked' ? 'var(--ok)' : state==='available' ? 'var(--sys-cyan)' : 'var(--border-dim)',
                    marginBottom:12
                  }}>
                    {state==='unlocked' ? '◆ UNLOCKED' : state==='available' ? '◇ AVAILABLE' : '✕ LOCKED'}
                  </div>

                  <div style={{ fontSize:12, color:'var(--text-primary)', lineHeight:1.7, letterSpacing:'0.02em' }}>
                    {sel.desc}
                  </div>

                  {sel.prereq.length > 0 && (
                    <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border-dim)' }}>
                      <div style={{ fontSize:9, letterSpacing:'0.3em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:6 }}>REQUIRES</div>
                      {sel.prereq.map(p => {
                        const pn = findNode(p);
                        const ps = nodeState(p);
                        return <div key={p} style={{ fontSize:11, color: ps==='unlocked' ? 'var(--ok)' : 'var(--text-muted)', marginBottom:2 }}>
                          {ps==='unlocked' ? '◆' : '◇'} {pn?.name}
                        </div>;
                      })}
                    </div>
                  )}

                  <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border-dim)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:10, letterSpacing:'0.25em', color:'var(--text-muted)', textTransform:'uppercase' }}>COST</span>
                    <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:14, color:'var(--legendary)', textShadow:'0 0 10px var(--legendary-glow)' }}>{sel.cost} PTS</span>
                  </div>

                  <button disabled={state!=='available'} style={{
                    width:'100%', marginTop:14,
                    borderColor: state==='available' ? 'var(--sys-cyan)' : 'var(--border-dim)',
                    color: state==='available' ? 'var(--sys-cyan)' : 'var(--text-muted)',
                    boxShadow: state==='available' ? '0 0 14px var(--sys-cyan-glow)' : 'none'
                  }}>
                    {state==='unlocked' ? '◆ UNLOCKED' : state==='available' ? '▸ ACQUIRE SKILL' : '✕ PREREQ UNMET'}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SkillTreePanel });
