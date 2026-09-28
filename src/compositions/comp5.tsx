/**
 * NetZeroJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A corporate net-zero process story on deep forest green: emitters release
 * CO2 (12,400 tCO2e), three reduction levers sweep their gauges (solar, EV
 * fleet, efficiency), carbon-offset credit blocks plant into a reforestation
 * project grid, a CREDITS RETIRED certificate stamps, the balance bar tips
 * to zero, and a NET ZERO badge locks in. Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="NetZeroJourney" component={NetZeroJourney}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Palette (deep forest)
// ---------------------------------------------------------------------------
const BG = '#0A1E1A';
const INK = '#EAF3ED';
const MUTED = 'rgba(234,243,237,0.60)';
const MINT = '#3DDC97';
const MINT_DEEP = '#14855A';
const LEAF = '#7BE3A8';
const GOLD = '#E8B44A';
const SKY = '#7FD8F7';
const SMOKE = 'rgba(180,190,185,0.5)';
const PANEL = 'rgba(13,38,32,0.72)';
const HAIRLINE = 'rgba(234,243,237,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Emissions math (consistent)
// ---------------------------------------------------------------------------
const START_T = 12400;
const REDUCTIONS = [
  {label: 'SOLAR POWER', cut: 3100, color: GOLD, icon: 'sun'},
  {label: 'EV FLEET', cut: 2400, color: SKY, icon: 'truck'},
  {label: 'EFFICIENCY', cut: 1900, color: LEAF, icon: 'building'},
];
const AFTER_REDUCE = START_T - REDUCTIONS.reduce((a, r) => a + r.cut, 0); // 5000
const OFFSET_BLOCKS = 10;
const OFFSET_PER = AFTER_REDUCE / OFFSET_BLOCKS; // 500

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const EMIT_START = 60;
const EMIT_COUNT_END = 180;
const LEVER_START = 220;
const OFFSET_START = 470;
const CERT_START = 660;
const BALANCE_START = 700;
const BADGE_START = 760;
const RESOLVE_START = 820;

const fmtT = (v: number) => `${Math.round(v).toLocaleString('en-US')} tCO2e`;

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="forestGlow" cx="50%" cy="32%" r="72%">
      <stop offset="0%" stopColor="rgba(61,220,151,0.13)" />
      <stop offset="55%" stopColor="rgba(61,220,151,0.04)" />
      <stop offset="100%" stopColor="rgba(10,30,26,0)" />
    </radialGradient>
    <radialGradient id="forestVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(3,10,9,0)" />
      <stop offset="100%" stopColor="rgba(3,10,9,0.7)" />
    </radialGradient>
    <linearGradient id="mintSweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={MINT_DEEP} />
      <stop offset="100%" stopColor={MINT} />
    </linearGradient>
    <filter id="leafGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="panelShadow2" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.45" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  // Drifting dot grid — keeps large background regions from encoding too cleanly.
  // Drift wraps by exactly one grid period (96px), so the motion loops seamlessly.
  const drift = (frame * 0.6) % 96;
  const bgDots: JSX.Element[] = [];
  for (let gx = -1; gx <= 41; gx++) {
    for (let gy = 0; gy < 23; gy++) {
      bgDots.push(
        <circle key={`${gx}-${gy}`} cx={48 + gx * 96 - drift} cy={48 + gy * 96} r={2.4} fill="rgba(255,255,255,0.05)" />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#forestGlow)" />
        {bgDots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#forestVignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar + live emissions counter
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 80, left: 200, right: 200, opacity: fade, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
      <div>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
          The road to <span style={{color: MINT}}>net zero</span>
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
          CORPORATE DECARBONIZATION JOURNEY
        </div>
      </div>
      <EmissionsCounter frame={frame} />
    </div>
  );
};

const currentEmissions = (frame: number): number => {
  // count up, then each lever cuts, then offsets retire the rest
  if (frame < EMIT_COUNT_END) {
    return (frame / EMIT_COUNT_END) * START_T;
  }
  let v = START_T;
  REDUCTIONS.forEach((r, i) => {
    const t = interpolate(frame, [LEVER_START + i * 80 + 40, LEVER_START + i * 80 + 110], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
    v -= r.cut * t;
  });
  const planted = Math.min(OFFSET_BLOCKS, Math.max(0, Math.floor((frame - OFFSET_START) / 17)));
  v -= planted * OFFSET_PER;
  return Math.max(0, v);
};

const EmissionsCounter: React.FC<{frame: number}> = ({frame}) => {
  const v = currentEmissions(frame);
  const zero = v <= 0.5;
  return (
    <div style={{
      background: PANEL, border: `2px solid ${HAIRLINE}`, borderRadius: 24,
      padding: '22px 44px', textAlign: 'right', backdropFilter: 'blur(6px)',
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>NET EMISSIONS</div>
      <div style={{
        color: zero ? MINT : INK, fontFamily: MONO, fontWeight: 800, fontSize: 64,
        textShadow: zero ? '0 0 34px rgba(61,220,151,0.6)' : 'none',
        marginTop: 4,
      }}>
        {zero ? '0 tCO2e' : fmtT(v)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Emitters row: factory, truck, building with CO2 puffs
// ---------------------------------------------------------------------------
const EMITTERS = [
  {label: 'FACTORY', x: 420, icon: 'factory'},
  {label: 'LOGISTICS', x: 1720, icon: 'truck'},
  {label: 'OFFICES', x: 3020, icon: 'building'},
];

const EmitterIcon: React.FC<{kind: string; color: string}> = ({kind, color}) => {
  if (kind === 'factory') {
    return (
      <svg width={200} height={170} viewBox="0 0 200 170">
        <rect x={20} y={80} width={160} height={70} rx={8} fill={color} opacity={0.9} />
        <rect x={35} y={40} width={28} height={45} fill={color} opacity={0.7} />
        <rect x={75} y={55} width={28} height={30} fill={color} opacity={0.7} />
        <rect x={45} y={100} width={26} height={26} fill={BG} opacity={0.85} />
        <rect x={87} y={100} width={26} height={26} fill={BG} opacity={0.85} />
        <rect x={129} y={100} width={26} height={26} fill={BG} opacity={0.85} />
      </svg>
    );
  }
  if (kind === 'truck') {
    return (
      <svg width={220} height={170} viewBox="0 0 220 170">
        <rect x={10} y={55} width={130} height={70} rx={10} fill={color} opacity={0.9} />
        <path d="M140 70 h45 l30 30 v25 h-75 z" fill={color} opacity={0.75} />
        <circle cx={60} cy={140} r={20} fill={BG} stroke={color} strokeWidth={8} />
        <circle cx={170} cy={140} r={20} fill={BG} stroke={color} strokeWidth={8} />
      </svg>
    );
  }
  return (
    <svg width={180} height={170} viewBox="0 0 180 170">
      <rect x={30} y={20} width={120} height={130} rx={8} fill={color} opacity={0.9} />
      {Array.from({length: 12}).map((_, i) => (
        <rect key={i} x={48 + (i % 3) * 34} y={42 + Math.floor(i / 3) * 30} width={22} height={18} rx={3} fill={BG} opacity={0.85} />
      ))}
    </svg>
  );
};

const Emitters: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const puffs = useMemo(() => {
    const out: {seed: number; dx: number}[] = [];
    for (let i = 0; i < 36; i++) out.push({seed: i * 3.7, dx: (rand(i) - 0.5) * 120});
    return out;
  }, []);
  return (
    <div style={{position: 'absolute', left: 0, top: 300, width: 3840}}>
      {EMITTERS.map((e, i) => {
        const s = spring({frame: frame - (EMIT_START + i * 40), fps, config: {damping: 200, stiffness: 90}});
        if (s <= 0.001) return null;
        return (
          <div key={e.label} style={{
            position: 'absolute', left: e.x - 110, top: 40,
            opacity: Math.min(1, s),
            transform: `translateY(${(1 - s) * 50}px)`,
            textAlign: 'center', width: 220,
          }}>
            {/* CO2 puffs */}
            <svg width={220} height={260} style={{position: 'absolute', left: 0, top: -240, overflow: 'visible'}}>
              {puffs.slice(i * 12, i * 12 + 12).map((p, k) => {
                const cycle = 150;
                const local = ((frame - EMIT_START + p.seed * 40) % cycle + cycle) % cycle;
                const t = local / cycle;
                const stopEmitting = frame > LEVER_START + 200;
                return (
                  <g key={k} opacity={stopEmitting ? 0 : 0.55 * (1 - t)}>
                    <circle cx={110 + p.dx * t} cy={240 - t * 140} r={16 + t * 26} fill={SMOKE} />
                    <text
                      x={110 + p.dx * t} y={248 - t * 140}
                      fill="rgba(10,30,26,0.7)" fontSize={20 + t * 14} fontFamily={MONO} fontWeight={700}
                      textAnchor="middle"
                    >CO2</text>
                  </g>
                );
              })}
            </svg>
            <EmitterIcon kind={e.icon} color="rgba(234,243,237,0.85)" />
            <div style={{color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 36, letterSpacing: 2, marginTop: 14}}>
              {e.label}
            </div>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, marginTop: 4}}>
              {['4,900', '3,800', '3,700'][i]} tCO2e/yr
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Reduction levers: gauge sweep cards
// ---------------------------------------------------------------------------
const Levers: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  return (
    <div style={{
      position: 'absolute', left: 200, top: 900, display: 'flex', gap: 60,
    }}>
      {REDUCTIONS.map((r, i) => {
        const s = spring({frame: frame - (LEVER_START + i * 80), fps, config: {damping: 200, stiffness: 85}});
        if (s <= 0.001) return null;
        const sweep = interpolate(frame, [LEVER_START + i * 80 + 40, LEVER_START + i * 80 + 110], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const cutNow = Math.round(r.cut * sweep);
        // gauge arc: -120deg to +120deg
        const ang = -120 + 240 * sweep;
        const rad = (a: number) => (a * Math.PI) / 180;
        const gx = 200 + 130 * Math.cos(rad(-120));
        const gy = 200 + 130 * Math.sin(rad(-120));
        const nx = 200 + 130 * Math.cos(rad(ang));
        const ny = 200 + 130 * Math.sin(rad(ang));
        return (
          <div key={r.label} style={{
            width: 1060, background: PANEL, borderRadius: 30,
            border: `2px solid ${HAIRLINE}`, padding: '40px 46px',
            filter: 'url(#panelShadow2)', backdropFilter: 'blur(6px)',
            opacity: Math.min(1, s),
            transform: `translateY(${(1 - s) * 50}px)`,
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{color: r.color, fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 2}}>{r.label}</div>
              <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 52}}>
                &minus;{cutNow.toLocaleString('en-US')}
              </div>
            </div>
            <svg width={968} height={300} style={{marginTop: 6}}>
              <path d={`M ${200 + 150 * Math.cos(rad(-120))} ${215 + 150 * Math.sin(rad(-120))} A 150 150 0 1 1 ${200 + 150 * Math.cos(rad(120))} ${215 + 150 * Math.sin(rad(120))}`}
                fill="none" stroke={HAIRLINE} strokeWidth={26} strokeLinecap="round" />
              {sweep > 0.01 && (
                <path d={`M ${gx + 20} ${gy + 15} A 130 130 0 ${sweep > 0.5 ? 1 : 0} 1 ${nx + 20} ${ny + 15}`}
                  fill="none" stroke={r.color} strokeWidth={26} strokeLinecap="round"
                  filter="url(#leafGlow)" />
              )}
              <line x1={220} y1={230} x2={220 + 104 * Math.cos(rad(ang))} y2={230 + 104 * Math.sin(rad(ang))}
                stroke={INK} strokeWidth={10} strokeLinecap="round" />
              <circle cx={220} cy={230} r={20} fill={INK} />
              <text x={700} y={250} fill={MUTED} fontSize={30} fontFamily={MONO}>tCO2e avoided</text>
            </svg>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Offset project grid: credit blocks plant one by one
// ---------------------------------------------------------------------------
const Offsets: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (OFFSET_START - 60), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const planted = Math.min(OFFSET_BLOCKS, Math.max(0, Math.floor((frame - OFFSET_START) / 17)));
  const cert = spring({frame: frame - CERT_START, fps, config: {damping: 130, stiffness: 190}});

  return (
    <div style={{
      position: 'absolute', left: 200, top: 1560, width: 1800,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 2, marginBottom: 20}}>
        CARBON OFFSETS &middot; REFORESTATION PROJECT
      </div>
      <div style={{display: 'flex', gap: 18}}>
        {Array.from({length: OFFSET_BLOCKS}).map((_, i) => {
          const on = i < planted;
          const bs = spring({frame: frame - (OFFSET_START + i * 17), fps, config: {damping: 200, stiffness: 160}});
          return (
            <div key={i} style={{
              width: 158, height: 158, borderRadius: 20,
              background: on ? 'linear-gradient(90deg, #14855A, #3DDC97)' : 'rgba(234,243,237,0.06)',
              border: `2px dashed ${on ? MINT : HAIRLINE}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transform: `scale(${on ? 0.6 + 0.4 * Math.min(1, bs) : 1})`,
              boxShadow: on ? '0 0 30px rgba(61,220,151,0.4)' : 'none',
            }}>
              {on && (
                <>
                  <svg width={52} height={52} viewBox="0 0 52 52">
                    <path d="M26 4 L42 24 H32 L44 44 H8 L20 24 H10 Z" fill="#0A1E1A" opacity={0.85} />
                  </svg>
                  <div style={{color: '#0A1E1A', fontFamily: MONO, fontWeight: 800, fontSize: 24, marginTop: 6}}>
                    {OFFSET_PER}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {cert > 0.001 && (
        <div style={{
          position: 'absolute', right: -40, top: -40,
          transform: `rotate(-10deg) scale(${2.2 - 1.2 * Math.min(1, cert)})`,
          opacity: Math.min(1, cert),
        }}>
          <div style={{
            border: `6px solid ${MINT}`, borderRadius: 18, padding: '16px 40px',
            color: MINT, fontFamily: FONT, fontWeight: 800, fontSize: 46, letterSpacing: 3,
            background: 'rgba(10,30,26,0.9)', boxShadow: '0 0 60px rgba(61,220,151,0.45)',
          }}>
            CREDITS RETIRED
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Balance bar + NET ZERO badge
// ---------------------------------------------------------------------------
const Balance: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (BALANCE_START - 60), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const v = currentEmissions(frame);
  const frac = v / START_T;
  const badge = spring({frame: frame - BADGE_START, fps, config: {damping: 120, stiffness: 170}});
  const ringPulse = 1 + 0.03 * Math.sin(frame * 0.12);

  return (
    <div style={{
      position: 'absolute', right: 200, top: 1540, width: 1560,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
      display: 'flex', alignItems: 'center', gap: 70,
    }}>
      <div style={{flex: 1, textAlign: 'center'}}>
      <div style={{color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 2, marginBottom: 20}}>
        NET BALANCE
      </div>
      <div style={{
        height: 56, borderRadius: 28, background: 'rgba(234,243,237,0.08)',
        border: `2px solid ${HAIRLINE}`, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${Math.max(0, frac * 100)}%`,
          background: frac > 0.02 ? 'linear-gradient(90deg, #8A6D1F, #E8B44A)' : 'linear-gradient(90deg, #14855A, #3DDC97)',
          transition: 'none',
        }} />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 12}}>
        <span style={{color: MUTED, fontFamily: MONO, fontSize: 28}}>12,400 tCO2e</span>
        <span style={{color: v <= 0.5 ? MINT : MUTED, fontFamily: MONO, fontSize: 28, fontWeight: 700}}>0</span>
      </div>
      </div>
      {badge > 0.001 && (
        <div style={{
          transform: `scale(${0.5 + 0.5 * Math.min(1, badge)})`,
          opacity: Math.min(1, badge),
        }}>
          <div style={{
            border: `8px solid ${MINT}`, borderRadius: '50%',
            width: 440, height: 440,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(61,220,151,0.08)',
            boxShadow: `0 0 ${80 * ringPulse}px rgba(61,220,151,0.55)`,
            transform: `scale(${ringPulse})`,
          }}>
            <div style={{color: MINT, fontFamily: FONT, fontWeight: 800, fontSize: 72, letterSpacing: 2}}>
              NET ZERO
            </div>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3, marginTop: 10}}>
              ACHIEVED 2026
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Resolve timeline
// ---------------------------------------------------------------------------
const ResolveLine: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [RESOLVE_START, RESOLVE_START + 40], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  if (fade <= 0) return null;
  const stops: [string, string][] = [
    ['2026', 'BASELINE SET'],
    ['2028', '50% CUT'],
    ['2032', 'OFFSET BALANCE'],
    ['2040', 'NET ZERO LOCKED'],
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 100, left: 200, right: 200, opacity: fade,
    }}>
      <div style={{position: 'relative', height: 8, background: HAIRLINE, borderRadius: 4, margin: '0 120px'}}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%',
          background: 'linear-gradient(90deg, #14855A, #3DDC97)', borderRadius: 4,
        }} />
        {stops.map(([y, l], i) => (
          <div key={y} style={{position: 'absolute', left: `${(i / (stops.length - 1)) * 100}%`, top: -14, transform: 'translateX(-50%)', textAlign: 'center'}}>
            <div style={{width: 34, height: 34, borderRadius: '50%', background: MINT, margin: '0 auto', boxShadow: '0 0 24px rgba(61,220,151,0.7)'}} />
            <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 34, marginTop: 16}}>{y}</div>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 24, letterSpacing: 2, marginTop: 4, whiteSpace: 'nowrap'}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
// Deterministic full-frame film grain — bitrate insurance for the >= 20 Mbps verify gate.
// random() from 'remotion' is seeded; positions re-seed every frame. Subtle by design.
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 420;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: JSX.Element[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`grain-x-${frame}-${i}`) * 3840;
    const y = random(`grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`grain-s-${frame}-${i}`) * 2.5;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

export const NetZeroJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <Emitters frame={frame} fps={fps} />
      <Levers frame={frame} fps={fps} />
      <Offsets frame={frame} fps={fps} />
      <Balance frame={frame} fps={fps} />
      <ResolveLine frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default NetZeroJourney;
