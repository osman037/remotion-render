/**
 * HabitLoopCycle.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The Atomic Habits loop on deep twilight indigo: four nodes — cue, craving,
 * response, reward — light in sequence around a ring while small scene
 * vignettes play each stage, then the "1% better" compounding sparkline builds
 * to a full year. Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="HabitLoopCycle" component={HabitLoopCycle}
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

// ---------------------------------------------------------------------------
// Palette (twilight indigo + warm amber)
// ---------------------------------------------------------------------------
const BG = '#141228';
const INK = '#F0EDFB';
const MUTED = 'rgba(240,237,251,0.60)';
const AMBER = '#FBBF24';
const AMBER_DEEP = '#B0720A';
const VIOLET = '#A78BFA';
const CYAN = '#67E8F9';
const GREEN = '#34D399';
const ROSE = '#FB7185';
const PANEL = 'rgba(26,24,54,0.82)';
const HAIRLINE = 'rgba(240,237,251,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const LOOP_START = 80;
const STAGE_GAP = 130;
const SPARK_START = 560;
const RESOLVE_START = 810;

const NODES = [
  {name: 'CUE', sub: 'phone buzzes 6:00 AM', color: CYAN, icon: '\u23F0'},
  {name: 'CRAVING', sub: 'the pull to stay down', color: VIOLET, icon: '\u2665'},
  {name: 'RESPONSE', sub: 'lace up, step outside', color: AMBER, icon: '\u2691'},
  {name: 'REWARD', sub: 'energy + logged streak', color: GREEN, icon: '\u2605'},
];

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
const RCX = 1300;
const RCY = 1150;
const RR = 520;

const nodeXY = (i: number) => {
  const a = -Math.PI / 2 + (i / NODES.length) * Math.PI * 2;
  return {x: RCX + RR * Math.cos(a), y: RCY + RR * Math.sin(a)};
};

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="hlGlow" cx="50%" cy="34%" r="72%">
      <stop offset="0%" stopColor="rgba(167,139,250,0.13)" />
      <stop offset="55%" stopColor="rgba(167,139,250,0.035)" />
      <stop offset="100%" stopColor="rgba(20,18,40,0)" />
    </radialGradient>
    <radialGradient id="hlVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(8,7,20,0)" />
      <stop offset="100%" stopColor="rgba(8,7,20,0.72)" />
    </radialGradient>
    <linearGradient id="hlRing" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={CYAN} />
      <stop offset="50%" stopColor={VIOLET} />
      <stop offset="100%" stopColor={AMBER} />
    </linearGradient>
    <filter id="hlGlow18" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="18" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="hlShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.55" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const driftX = (frame * 0.26) % 120;
  const scanY = ((frame / 900) * (2160 + 300)) % (2160 + 300) - 150;
  const dots: React.ReactElement[] = [];
  for (let gx = 0; gx <= 33; gx++) {
    for (let gy = 0; gy <= 19; gy++) {
      const shimmer = 0.05 + 0.05 * Math.sin(frame * 0.07 + gx * 1.3 + gy * 0.7);
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx * 120 - driftX} cy={gy * 120} r={2.2} fill="#A78BFA" opacity={shimmer} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#hlGlow)" />
        {dots}
        <rect x={0} y={scanY - 80} width={3840} height={160} fill="rgba(167,139,250,0.03)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#hlVignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 40], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 80 + rise, left: 200, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
        The loop that builds a <span style={{color: AMBER}}>habit</span>
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        THE HABIT LOOP &middot; CUE &rarr; CRAVING &rarr; RESPONSE &rarr; REWARD
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Loop ring: nodes light in sequence + traveling pulse + scene vignettes
// ---------------------------------------------------------------------------
const LoopRing: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (LOOP_START - 30), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const ringT = interpolate(frame, [LOOP_START, LOOP_START + 4 * STAGE_GAP + 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pulseA = -Math.PI / 2 + ringT * Math.PI * 2;
  const pulseX = RCX + RR * Math.cos(pulseA);
  const pulseY = RCY + RR * Math.sin(pulseA);

  const ringPath = `M ${RCX} ${RCY - RR} A ${RR} ${RR} 0 1 1 ${RCX - 1} ${RCY - RR}`;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <circle cx={RCX} cy={RCY} r={RR} fill="none" stroke={HAIRLINE} strokeWidth={10} />
        <path d={ringPath} fill="none" stroke="url(#hlRing)" strokeWidth={10} strokeLinecap="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ringT} filter="url(#hlGlow18)" />
        {/* traveling pulse */}
        {ringT > 0 && ringT < 1 && (
          <g>
            <circle cx={pulseX} cy={pulseY} r={40} fill={AMBER} opacity={0.25} />
            <circle cx={pulseX} cy={pulseY} r={18} fill={AMBER} filter="url(#hlGlow18)" />
          </g>
        )}
        {/* center mantra */}
        <text x={RCX} y={RCY - 30} textAnchor="middle" fill={INK} fontSize={64} fontFamily={FONT} fontWeight={800}>
          Make it
        </text>
        <text x={RCX} y={RCY + 60} textAnchor="middle" fill={AMBER} fontSize={84} fontFamily={FONT} fontWeight={800}>
          obvious
        </text>
        <text x={RCX} y={RCY + 130} textAnchor="middle" fill={MUTED} fontSize={34} fontFamily={MONO}>
          1% BETTER EVERY DAY
        </text>
      </svg>

      {/* nodes */}
      {NODES.map((n, i) => {
        const ns = spring({frame: frame - (LOOP_START + i * STAGE_GAP), fps, config: {damping: 160, stiffness: 110}});
        if (ns <= 0.001) return null;
        const {x, y} = nodeXY(i);
        const active = frame >= LOOP_START + i * STAGE_GAP;
        return (
          <div key={n.name} style={{
            position: 'absolute', left: x - 250, top: y - 130, width: 500, textAlign: 'center',
            opacity: Math.min(1, ns), transform: `scale(${0.6 + 0.4 * Math.min(1, ns)})`,
          }}>
            <div style={{
              width: 200, height: 200, borderRadius: '50%', margin: '0 auto',
              background: active ? `${n.color}26` : 'rgba(240,237,251,0.05)',
              border: `6px solid ${active ? n.color : HAIRLINE}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 96, color: active ? n.color : MUTED,
              boxShadow: active ? `0 0 70px ${n.color}55` : 'none',
            }}>
              {n.icon}
            </div>
            <div style={{
              marginTop: 18, display: 'inline-block',
              background: PANEL, border: `2px solid ${active ? n.color : HAIRLINE}`,
              borderRadius: 18, padding: '16px 36px', filter: 'url(#hlShadow)',
            }}>
              <div style={{color: active ? n.color : MUTED, fontFamily: MONO, fontWeight: 800, fontSize: 40, letterSpacing: 3}}>
                {n.name}
              </div>
              <div style={{color: MUTED, fontFamily: FONT, fontSize: 28, marginTop: 4}}>{n.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Right panel: 1% better compounding sparkline
// ---------------------------------------------------------------------------
const CompoundPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (SPARK_START - 40), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const draw = interpolate(frame, [SPARK_START, SPARK_START + 220], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const value = Math.pow(1.01, draw * 365); // 1% daily for a year
  const worse = Math.pow(0.99, draw * 365);

  const PX = 2300; const PY = 620; const PW = 1220; const PH = 560;

  const spark = useMemo(() => {
    const pts: string[] = [];
    const ptsW: string[] = [];
    for (let d = 0; d <= 365; d++) {
      const x = PX + (d / 365) * PW;
      const y = PY + PH - ((Math.pow(1.01, d) - 1) / (Math.pow(1.01, 365) - 1)) * PH;
      pts.push(`${d === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
      const yw = PY + PH - ((1 - Math.pow(0.99, d)) / (1 - Math.pow(0.99, 365))) * PH * 0.9;
      ptsW.push(`${d === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yw.toFixed(1)}`);
    }
    return {good: pts.join(' '), bad: ptsW.join(' ')};
  }, []);

  return (
    <div style={{
      position: 'absolute', left: 2300, top: 480, width: 1340,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 32, padding: '44px 50px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#hlShadow)', backdropFilter: 'blur(6px)',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>COMPOUNDING</div>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 56, marginTop: 10}}>
          1% better <span style={{color: GREEN}}>every day</span>
        </div>
        <svg width={1240} height={640} viewBox="2300 560 1240 640" style={{marginTop: 16, overflow: 'visible'}}>
          <path d={spark.bad} fill="none" stroke={ROSE} strokeWidth={7} opacity={0.85}
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
          <path d={spark.good} fill="none" stroke={GREEN} strokeWidth={10} strokeLinecap="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} filter="url(#hlGlow18)" />
          {/* end markers */}
          {draw > 0.02 && (
            <g>
              <text x={PX + PW - 40} y={PY + PH - ((Math.pow(1.01, draw * 365) - 1) / (Math.pow(1.01, 365) - 1)) * PH - 30}
                textAnchor="end" fill={GREEN} fontSize={52} fontFamily={MONO} fontWeight={800}>
                {value.toFixed(1)}x
              </text>
              <text x={PX + PW - 40} y={PY + PH - ((1 - Math.pow(0.99, draw * 365)) / (1 - Math.pow(0.99, 365))) * PH * 0.9 + 60}
                textAnchor="end" fill={ROSE} fontSize={40} fontFamily={MONO} fontWeight={700}>
                {worse.toFixed(2)}x
              </text>
            </g>
          )}
        </svg>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 10}}>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 28}}>DAY 0</span>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 28}}>DAY 365</span>
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 18, lineHeight: 1.5}}>
          Small habits don&rsquo;t add up. They <span style={{color: INK, fontWeight: 700}}>compound</span>.
          <br />You don&rsquo;t rise to your goals — you fall to your systems.
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Resolve strip
// ---------------------------------------------------------------------------
const ResolveStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - RESOLVE_START, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 96, left: 0, width: 3840,
      display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{
        background: 'rgba(251,191,36,0.08)', border: `2px solid ${AMBER}`,
        borderRadius: 999, padding: '28px 90px',
        display: 'flex', alignItems: 'center', gap: 44,
      }}>
        <span style={{
          width: 58, height: 58, borderRadius: '50%', background: AMBER,
          color: '#141228', fontSize: 36, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#10003;</span>
        <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 48, letterSpacing: 2}}>
          MASTER THE LOOP &middot; THE RESULTS COMPOUND THEMSELVES
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 420;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`hl-grain-x-${frame}-${i}`) * 3840;
    const y = random(`hl-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`hl-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`hl-grain-s-${frame}-${i}`) * 2.5;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const HabitLoopCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <LoopRing frame={frame} fps={fps} />
      <CompoundPanel frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default HabitLoopCycle;
