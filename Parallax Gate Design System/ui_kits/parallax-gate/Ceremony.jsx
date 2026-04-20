// Ceremony: rank-up overlay. Full-viewport, ceremonial, ~6s self-dismissing.
// Usage: <Ceremony fromRank="C" toRank="B" onClose={() => ...} />
const { useEffect, useState } = React;

function Ceremony({ fromRank = 'C', toRank = 'B', onClose = () => {} }) {
  const [phase, setPhase] = useState(0); // 0 summon, 1 glyph, 2 proclamation, 3 fade
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 2100);
    const t3 = setTimeout(() => setPhase(3), 5200);
    const t4 = setTimeout(() => onClose(), 6000);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  const RANK_TITLES = { E:'AWAKENED', D:'HUNTER', C:'SOLO RAIDER', B:'RANKED HUNTER', A:'ELITE HUNTER', S:'MONARCH' };
  const LORE = {
    D: "The smallest gates obey you now. The hunt has its rhythm. Continue.",
    C: "No more parties. The gate opens for you alone. The System has no parental settings.",
    B: "You have been named. The world takes note. Be careful whose eyes you draw.",
    A: "Elite. Few stand where you stand. The System watches closely now.",
    S: "MONARCH. The city rises. The desert remembers the boy who refused to leave."
  };
  const toColor = `var(--rank-${toRank.toLowerCase()})`;
  const toGlow  = `var(--rank-${toRank.toLowerCase()}-glow)`;

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'radial-gradient(ellipse at center, rgba(5,6,10,0.85) 0%, rgba(5,6,10,0.98) 60%, #000 100%)',
      display:'grid', placeItems:'center',
      opacity: phase === 3 ? 0 : 1, transition:'opacity 800ms var(--ease-out)',
      backdropFilter:'blur(2px)'
    }}>
      {/* concentric summon rings */}
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          position:'absolute',
          width: 200 + i*160, height: 200 + i*160,
          border:`1px solid ${toColor}`, opacity: phase >= 1 ? 0.15 + (3-i)*0.08 : 0,
          boxShadow:`0 0 ${20 + i*10}px ${toGlow}, inset 0 0 ${20 + i*10}px ${toGlow}`,
          animation: `ceremonyRing ${1.4 + i*0.2}s var(--ease-out) forwards`,
          animationDelay: `${i * 120}ms`,
          transform:'rotate(0deg)'
        }} />
      ))}

      {/* outer decorative rotating frame */}
      <div style={{
        position:'absolute', width:520, height:520,
        border:`1px dashed ${toColor}`, opacity: phase >= 1 ? 0.35 : 0,
        animation:'ceremonyRotate 20s linear infinite', transition:'opacity 600ms'
      }} />

      {/* core glyph */}
      <div style={{ position:'relative', textAlign:'center', zIndex:2 }}>
        {/* prelude */}
        <div style={{
          fontFamily:'var(--font-display)', fontSize:11, letterSpacing:'0.5em',
          color:'var(--sys-cyan)', textShadow:'0 0 12px var(--sys-cyan-glow)',
          opacity: phase >= 0 ? 1 : 0, marginBottom:24,
          animation: phase >= 0 ? 'ceremonyFadeDown 800ms var(--ease-out)' : 'none'
        }}>
          :: NOTIFICATION //  THE SYSTEM ACKNOWLEDGES YOU
        </div>

        {/* giant rank letter */}
        <div style={{
          fontFamily:'var(--font-display)', fontWeight:900,
          fontSize:180, lineHeight:1, color: toColor,
          textShadow: `0 0 60px ${toGlow}, 0 0 20px ${toGlow}`,
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'scale(1)' : 'scale(0.6)',
          transition:'all 900ms var(--ease-out)',
          filter: phase >= 2 ? 'none' : 'blur(2px)'
        }}>{toRank}</div>

        {/* title */}
        <div style={{
          fontFamily:'var(--font-display)', fontWeight:800,
          fontSize:28, letterSpacing:'0.35em', color: toColor, textTransform:'uppercase',
          textShadow:`0 0 18px ${toGlow}`,
          opacity: phase >= 2 ? 1 : 0, marginTop:8,
          transition:'opacity 700ms var(--ease-out) 200ms'
        }}>
          [ {RANK_TITLES[toRank]} ]
        </div>

        {/* proclamation */}
        <div style={{
          fontFamily:'var(--font-display)', fontSize:14, letterSpacing:'0.4em',
          color:'var(--text-primary)', textTransform:'uppercase', marginTop:40,
          opacity: phase >= 2 ? 1 : 0, transition:'opacity 700ms var(--ease-out) 500ms'
        }}>
          RANK <span style={{ color:'var(--text-muted)' }}>{fromRank}</span>
          &nbsp;&nbsp;<span style={{ color: toColor }}>→</span>&nbsp;&nbsp;
          <span style={{ color: toColor, textShadow:`0 0 14px ${toGlow}` }}>{toRank}</span>
        </div>

        {/* lore text */}
        <div style={{
          fontFamily:'var(--font-mono)', fontStyle:'italic',
          fontSize:14, color:'var(--text-primary)', maxWidth:560, margin:'28px auto 0',
          lineHeight:1.8, letterSpacing:'0.03em',
          opacity: phase >= 2 ? 0.9 : 0, transition:'opacity 800ms var(--ease-out) 800ms'
        }}>
          "{LORE[toRank] || LORE.D}"
        </div>

        {/* dismiss hint */}
        <div style={{
          fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.3em',
          color:'var(--text-muted)', textTransform:'uppercase', marginTop:40,
          opacity: phase >= 2 ? 0.7 : 0, transition:'opacity 700ms 1400ms',
          cursor:'pointer'
        }} onClick={onClose}>
          ▸ CONTINUE
        </div>
      </div>

      {/* corner brackets */}
      {[[0,0],[0,1],[1,0],[1,1]].map(([y,x], i) => (
        <div key={i} style={{
          position:'absolute',
          top: y ? 'auto' : 24, bottom: y ? 24 : 'auto',
          left: x ? 'auto' : 24, right: x ? 24 : 'auto',
          width: 28, height: 28,
          borderTop:    y ? 'none' : `1px solid ${toColor}`,
          borderBottom: y ? `1px solid ${toColor}` : 'none',
          borderLeft:   x ? 'none' : `1px solid ${toColor}`,
          borderRight:  x ? `1px solid ${toColor}` : 'none',
          opacity: phase >= 1 ? 0.8 : 0, transition:'opacity 600ms 200ms',
          boxShadow:`0 0 10px ${toGlow}`
        }} />
      ))}

      <style>{`
        @keyframes ceremonyRing { from { transform: scale(0.4) rotate(0deg); opacity:0; } to { transform: scale(1) rotate(90deg); } }
        @keyframes ceremonyRotate { to { transform: rotate(360deg); } }
        @keyframes ceremonyFadeDown { from { transform: translateY(-12px); opacity:0; } to { transform: translateY(0); opacity:1; } }
      `}</style>
    </div>
  );
}

Object.assign(window, { Ceremony });
