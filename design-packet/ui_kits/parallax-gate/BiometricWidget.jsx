// BiometricWidget: Fitbit-style recovery panel — sleep ring + HRV + RHR + readiness.
// Uses current rank color for the arc.
const { useState: useBState } = React;

function RingGauge({ value, max = 100, size = 140, stroke = 10, color = 'var(--rank-color)', glow = 'var(--rank-glow)', label, sublabel }) {
  const r = size/2 - stroke;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(1, value/max);
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-dim)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`} strokeLinecap="butt"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ filter:`drop-shadow(0 0 8px ${glow})`, transition:'stroke-dasharray 800ms var(--ease-out)' }} />
        {/* tick marks every 10% */}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2 - Math.PI/2;
          const r1 = r + stroke/2 + 2, r2 = r + stroke/2 + 5;
          return <line key={i}
            x1={size/2 + Math.cos(a)*r1} y1={size/2 + Math.sin(a)*r1}
            x2={size/2 + Math.cos(a)*r2} y2={size/2 + Math.sin(a)*r2}
            stroke="var(--border-mid)" strokeOpacity={0.4} strokeWidth={1} />;
        })}
      </svg>
      <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center' }}>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize: size * 0.26, color, textShadow:`0 0 14px ${glow}`, lineHeight:1 }}>{value}</div>
          {sublabel && <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.25em', color:'var(--text-muted)', textTransform:'uppercase', marginTop:4 }}>{sublabel}</div>}
        </div>
      </div>
      {label && <div style={{ textAlign:'center', fontFamily:'var(--font-display)', fontSize:10, letterSpacing:'0.3em', color:'var(--text-secondary)', textTransform:'uppercase', marginTop:8 }}>{label}</div>}
    </div>
  );
}

function HRVSparkline({ data = [38,40,42,39,44,41,43,42,46,44,42,43], width = 260, height = 48 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad*2);
    const y = pad + (1 - (v - min) / (max - min || 1)) * (height - pad*2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      <defs>
        <linearGradient id="hrv-fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--sys-cyan)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--sys-cyan)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`${pad},${height-pad} ${pts} ${width-pad},${height-pad}`} fill="url(#hrv-fade)" stroke="none" />
      <polyline points={pts} fill="none" stroke="var(--sys-cyan)" strokeWidth="1.5" style={{ filter:'drop-shadow(0 0 4px var(--sys-cyan-glow))' }} />
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (width - pad*2);
        const y = pad + (1 - (v - min) / (max - min || 1)) * (height - pad*2);
        return <circle key={i} cx={x} cy={y} r={1.5} fill="var(--sys-cyan)" />;
      })}
    </svg>
  );
}

function SleepStages({ stages = [['DEEP', 1.3], ['REM', 1.8], ['LIGHT', 3.6], ['AWAKE', 0.5]] }) {
  const total = stages.reduce((s, [, v]) => s + v, 0);
  const colors = { DEEP: 'var(--rank-c)', REM: 'var(--legendary)', LIGHT: 'var(--sys-cyan-dim)', AWAKE: 'var(--warn)' };
  return (
    <div>
      <div style={{ display:'flex', height:8, border:'1px solid var(--border-dim)', overflow:'hidden' }}>
        {stages.map(([name, v], i) => (
          <div key={i} style={{ width:`${(v/total)*100}%`, background: colors[name], boxShadow:`inset 0 0 4px ${colors[name]}` }} />
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:9, letterSpacing:'0.2em', fontFamily:'var(--font-mono)', textTransform:'uppercase' }}>
        {stages.map(([name, v], i) => (
          <div key={i} style={{ textAlign:'center' }}>
            <div style={{ width:6, height:6, background: colors[name], margin:'0 auto 3px' }} />
            <div style={{ color:'var(--text-secondary)' }}>{name}</div>
            <div style={{ color:'var(--text-muted)', marginTop:1 }}>{v}H</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BiometricWidget() {
  return (
    <div className="col">
      <div className="panel">
        <div className="panel-title">
          <span>RECOVERY VITALS</span>
          <span style={{ fontSize:9, color:'var(--ok)' }}>◆ FITBIT SYNC ACTIVE · 00:04 AGO</span>
        </div>
        <div className="panel-body" style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:28, alignItems:'center' }}>
          <RingGauge value={78} sublabel="READINESS" label="READY FOR RAID" />
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:14, letterSpacing:'0.3em', color:'var(--sys-cyan)', textTransform:'uppercase', textShadow:'0 0 12px var(--sys-cyan-glow)' }}>
              ▸ THE HUNTER IS RESTED
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontStyle:'italic', fontSize:13, color:'var(--text-primary)', marginTop:10, lineHeight:1.7, maxWidth:440 }}>
              "Recovery is a hunter's inheritance. Rest is strategy."
            </div>
            <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'repeat(3, auto)', gap:32 }}>
              {[
                { t:'RHR',  v:'58', u:'BPM', c:'var(--ok)' },
                { t:'HRV',  v:'42', u:'MS',  c:'var(--sys-cyan)' },
                { t:'SPO₂', v:'97', u:'%',   c:'var(--rank-color)' }
              ].map(m => (
                <div key={m.t}>
                  <div style={{ fontSize:9, letterSpacing:'0.3em', color:'var(--text-muted)', textTransform:'uppercase' }}>{m.t}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, color: m.c, textShadow: `0 0 12px ${m.c}`, lineHeight:1, marginTop:4 }}>
                    {m.v}<span style={{ fontSize:10, marginLeft:4, color:'var(--text-muted)', textShadow:'none' }}>{m.u}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title"><span>SLEEP LOG</span><span style={{ fontSize:9, color:'var(--text-muted)' }}>7H 12M · 23:24 → 06:36</span></div>
          <div className="panel-body">
            <SleepStages />
            <div style={{ marginTop:16, padding:10, border:'1px solid var(--border-dim)', background:'rgba(0,0,0,0.35)' }}>
              <div style={{ fontSize:10, letterSpacing:'0.25em', color:'var(--ok)', textTransform:'uppercase', marginBottom:4 }}>◆ QUEST COMPLETE</div>
              <div style={{ fontSize:11, color:'var(--text-primary)' }}>SLEEP BEFORE 23:30 · <span style={{ color:'var(--legendary)' }}>+6 XP</span></div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title"><span>HRV TREND</span><span style={{ fontSize:9, color:'var(--text-muted)' }}>12D ROLLING</span></div>
          <div className="panel-body">
            <HRVSparkline />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, fontSize:10, letterSpacing:'0.2em', color:'var(--text-secondary)', textTransform:'uppercase', fontFamily:'var(--font-mono)' }}>
              <span>12 DAYS AGO</span><span>TODAY</span>
            </div>
            <div style={{ marginTop:16, fontFamily:'var(--font-mono)', fontStyle:'italic', fontSize:12, color:'var(--text-primary)', lineHeight:1.6 }}>
              Autonomic drift is positive. The System marks you steady.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BiometricWidget, RingGauge });
