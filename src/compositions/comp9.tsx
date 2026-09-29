/**
 * BloodDonationProcess.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A donor journey on deep crimson: five steps flow along a lifeline — check
 * in, health screening with live vitals, the donation chair with its 10-minute
 * timer, snack and recovery, then the lab bench and hospital delivery. A blood
 * drop fills with progress, and the "every 2 seconds" stat lands the payoff.
 * Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="BloodDonationProcess" component={BloodDonationProcess}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette (deep crimson + warm ivory)
// ---------------------------------------------------------------------------
const BG = '#20090D';
const INK = '#FBEFEF';
const MUTED = 'rgba(251,239,239,0.60)';
const RED = '#F43F5E';
const RED_DEEP = '#9F1239';
const RED_SOFT = '#FB7185';
const GOLD = '#F5C044';
const GREEN = '#34D399';
const PANEL = 'rgba(46,14,20,0.82)';
const HAIRLINE = 'rgba(251,239,239,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const STEPS_START = 60;
const STEP_GAP = 105;
const DONATE_START = 330;
const DONATE_END = 600;
const LAB_START = 560;
const STAT_START = 690;
const RESOLVE_START = 810;

const STEPS = [
  {name: 'CHECK-IN', sub: 'ID + donor history', color: RED_SOFT, icon: '\u2710'},
  {name: 'SCREENING', sub: 'vitals + iron check', color: GOLD, icon: '\u2661'},
  {name: 'DONATION', sub: '8–10 minutes', color: RED, icon: '\u2665'},
  {name: 'RECOVERY', sub: 'snack + 15 min rest', color: '#FDBA74', icon: '\u2615'},
  {name: 'LAB & DELIVERY', sub: 'tested, then hospitals', color: GREEN, icon: '\u2697'},
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bdGlow" cx="50%" cy="30%" r="72%">
      <stop offset="0%" stopColor="rgba(244,63,94,0.14)" />
      <stop offset="55%" stopColor="rgba(244,63,94,0.04)" />
      <stop offset="100%" stopColor="rgba(32,9,13,0)" />
    </radialGradient>
    <radialGradient id="bdVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(16,4,7,0)" />
      <stop offset="100%" stopColor="rgba(16,4,7,0.72)" />
    </radialGradient>
    <linearGradient id="bdLifeline" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={RED_DEEP} />
      <stop offset="100%" stopColor={RED} />
    </linearGradient>
    <linearGradient id="bdDrop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={RED_SOFT} />
      <stop offset="100%" stopColor={RED_DEEP} />
    </linearGradient>
    <filter id="bdGlow14" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="bdShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.55" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const driftX = (frame * 0.3) % 120;
  const scanY = ((frame / 900) * (2160 + 300)) % (2160 + 300) - 150;
  const dots: React.ReactElement[] = [];
  for (let gx = 0; gx <= 33; gx++) {
    for (let gy = 0; gy <= 19; gy++) {
      const shimmer = 0.05 + 0.05 * Math.sin(frame * 0.08 + gx * 0.9 + gy * 1.1);
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx * 120 - driftX} cy={gy * 120} r={2.2} fill="#F43F5E" opacity={shimmer} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#bdGlow)" />
        {dots}
        <rect x={0} y={scanY - 80} width={3840} height={160} fill="rgba(244,63,94,0.03)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#bdVignette)" />
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
        One donation. <span style={{color: RED_SOFT}}>Three lives.</span>
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        THE BLOOD DONATION PROCESS &middot; START TO FINISH
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Lifeline rail with 5 steps
// ---------------------------------------------------------------------------
const StepRail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (STEPS_START - 30), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const railX = 200; const railW = 3440; const railY = 500;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <line x1={railX} y1={railY} x2={railX + railW} y2={railY} stroke={HAIRLINE} strokeWidth={8} strokeLinecap="round" />
        {STEPS.map((st, i) => {
          const start = STEPS_START + i * STEP_GAP;
          const active = frame >= start;
          const done = i < STEPS.length - 1 ? frame >= STEPS_START + (i + 1) * STEP_GAP : frame >= STAT_START;
          const x = railX + (i / (STEPS.length - 1)) * railW;
          const ns = spring({frame: frame - start, fps, config: {damping: 160, stiffness: 110}});
          if (ns <= 0.001) return null;
          return (
            <g key={st.name} opacity={Math.min(1, ns)}>
              {i < STEPS.length - 1 && (() => {
                const nx = railX + ((i + 1) / (STEPS.length - 1)) * railW;
                const cf = interpolate(frame, [start, start + STEP_GAP], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
                return (
                  <line x1={x} y1={railY} x2={x + (nx - x) * cf} y2={railY}
                    stroke="url(#bdLifeline)" strokeWidth={8} strokeLinecap="round" filter="url(#bdGlow14)" />
                );
              })()}
              <circle cx={x} cy={railY} r={active ? 62 : 46}
                fill={done ? st.color : active ? st.color : BG}
                stroke={active ? st.color : HAIRLINE} strokeWidth={6}
                filter={active ? 'url(#bdGlow14)' : undefined} />
              <text x={x} y={railY + 20} textAnchor="middle" fill={active ? '#20090D' : MUTED} fontSize={54} fontWeight={800}>
                {st.icon}
              </text>
              <text x={x} y={railY + 130} textAnchor="middle"
                fill={active ? INK : MUTED} fontSize={34} fontFamily={MONO}
                fontWeight={active ? 800 : 500} letterSpacing={2}>{st.name}</text>
              <text x={x} y={railY + 178} textAnchor="middle"
                fill={MUTED} fontSize={26} fontFamily={FONT}>{st.sub}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Vitals panel (left) + donation timer drop (center) + lab panel (right)
// ---------------------------------------------------------------------------
const VitalsPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (STEPS_START + STEP_GAP - 40), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const pulse = Math.round(68 + 3 * Math.sin(frame * 0.5));
  const iron = interpolate(frame, [STEPS_START + STEP_GAP, STEPS_START + STEP_GAP + 90], [11.2, 14.1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{
      position: 'absolute', left: 200, top: 900, width: 1000,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 30, padding: '44px 50px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#bdShadow)', backdropFilter: 'blur(6px)',
      }}>
        <div style={{color: GOLD, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>HEALTH SCREENING</div>
        <div style={{marginTop: 28}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
            <span style={{color: MUTED, fontFamily: MONO, fontSize: 30}}>HEART RATE</span>
            <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 64}}>
              {pulse}<span style={{fontSize: 30, color: MUTED}}> bpm</span>
            </span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18}}>
            <span style={{color: MUTED, fontFamily: MONO, fontSize: 30}}>BLOOD PRESSURE</span>
            <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 64}}>118<span style={{color: MUTED}}>/</span>76</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18}}>
            <span style={{color: MUTED, fontFamily: MONO, fontSize: 30}}>HEMOGLOBIN</span>
            <span style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 64}}>
              {iron.toFixed(1)}<span style={{fontSize: 30, color: MUTED}}> g/dL</span>
            </span>
          </div>
        </div>
        <div style={{
          marginTop: 26, borderRadius: 16, padding: '18px 24px',
          background: 'rgba(52,211,153,0.10)', border: `2px solid ${GREEN}`,
          color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 32, letterSpacing: 2,
          textAlign: 'center',
          opacity: interpolate(frame, [STEPS_START + STEP_GAP + 80, STEPS_START + STEP_GAP + 130], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}>
          ELIGIBLE TO DONATE &#10003;
        </div>
      </div>
    </div>
  );
};

const DonationDrop: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (DONATE_START - 40), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const fill = interpolate(frame, [DONATE_START, DONATE_END], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const elapsed = interpolate(frame, [DONATE_START, DONATE_END], [0, 10], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const mm = Math.floor(elapsed);
  const ss = Math.floor((elapsed - mm) * 60);

  return (
    <div style={{
      position: 'absolute', left: 1400, top: 900, width: 1040, textAlign: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>PINT COLLECTING</div>
      <svg width={420} height={520} viewBox="0 0 420 520" style={{margin: '20px auto 0', display: 'block'}}>
        <defs>
          <clipPath id="bdDropClip">
            <path d="M 210 20 C 210 20 90 220 90 340 A 120 120 0 0 0 330 340 C 330 220 210 20 210 20 Z" />
          </clipPath>
        </defs>
        <path d="M 210 20 C 210 20 90 220 90 340 A 120 120 0 0 0 330 340 C 330 220 210 20 210 20 Z"
          fill="rgba(251,239,239,0.06)" stroke={RED} strokeWidth={8} />
        <g clipPath="url(#bdDropClip)">
          <rect x={60} y={540 - 500 * fill} width={300} height={500} fill="url(#bdDrop)"
            opacity={0.92} />
          {/* sloshing surface waves */}
          <path d={`M 60 ${540 - 500 * fill} Q 140 ${540 - 500 * fill - 24 + 12 * Math.sin(frame * 0.25)} 210 ${540 - 500 * fill} T 360 ${540 - 500 * fill}`}
            fill="none" stroke={RED_SOFT} strokeWidth={7} />
        </g>
        <text x={210} y={400} textAnchor="middle" fill={INK} fontSize={72} fontFamily={MONO} fontWeight={800}>
          {Math.round(fill * 100)}%
        </text>
      </svg>
      <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 64, marginTop: 12, fontVariantNumeric: 'tabular-nums'}}>
        {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, marginTop: 4}}>ONE PINT &middot; ~10 MINUTES</div>
    </div>
  );
};

const LabPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (LAB_START - 40), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const tests = ['TYPE & SCREEN', 'INFECTIOUS DISEASE', 'COMPONENT SPLIT'];
  return (
    <div style={{
      position: 'absolute', left: 2640, top: 900, width: 1000,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 30, padding: '44px 50px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#bdShadow)', backdropFilter: 'blur(6px)',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>LAB &amp; DELIVERY</div>
        <div style={{marginTop: 26}}>
          {tests.map((t, i) => {
            const on = frame >= LAB_START + i * 60;
            return (
              <div key={t} style={{
                display: 'flex', alignItems: 'center', gap: 22, marginTop: i === 0 ? 0 : 16,
                opacity: on ? 1 : 0.35,
              }}>
                <span style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: on ? GREEN : 'rgba(251,239,239,0.12)',
                  color: '#20090D', fontSize: 30, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{on ? '\u2713' : '\u00B7'}</span>
                <span style={{color: on ? INK : MUTED, fontFamily: MONO, fontWeight: 700, fontSize: 36}}>{t}</span>
              </div>
            );
          })}
        </div>
        <div style={{
          marginTop: 28, borderRadius: 18, padding: '22px 28px',
          background: 'rgba(52,211,153,0.08)', border: `2px solid ${GREEN}`,
          opacity: interpolate(frame, [LAB_START + 180, LAB_START + 230], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}>
          <div style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 34, letterSpacing: 2}}>
            SPLIT INTO 3 COMPONENTS
          </div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 28, marginTop: 8}}>
            red cells &middot; plasma &middot; platelets &rarr; hospitals
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stat payoff
// ---------------------------------------------------------------------------
const StatPayoff: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - STAT_START, fps, config: {damping: 160, stiffness: 100}});
  if (s <= 0.001) return null;
  const ticker = Math.floor(interpolate(frame, [STAT_START, STAT_START + 160], [0, 80], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <div style={{
      position: 'absolute', left: 0, top: 1620, width: 3840,
      display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `scale(${0.8 + 0.2 * Math.min(1, s)})`,
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{color: RED_SOFT, fontFamily: MONO, fontWeight: 800, fontSize: 96, textShadow: '0 0 50px rgba(244,63,94,0.5)'}}>
          EVERY 2 SECONDS
        </div>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 700, fontSize: 52, marginTop: 10}}>
          someone needs blood &middot; <span style={{color: GREEN}}>{ticker}</span> donations in the last 80 seconds
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
        background: 'rgba(244,63,94,0.10)', border: `2px solid ${RED}`,
        borderRadius: 999, padding: '28px 90px',
        display: 'flex', alignItems: 'center', gap: 44,
      }}>
        <span style={{
          width: 58, height: 58, borderRadius: '50%', background: RED,
          color: '#20090D', fontSize: 36, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#10003;</span>
        <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 48, letterSpacing: 2}}>
          45 MINUTES OF YOUR DAY &middot; THREE LIVES CHANGED
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
    const x = random(`bd-grain-x-${frame}-${i}`) * 3840;
    const y = random(`bd-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`bd-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`bd-grain-s-${frame}-${i}`) * 2.5;
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
export const BloodDonationProcess: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <StepRail frame={frame} fps={fps} />
      <VitalsPanel frame={frame} fps={fps} />
      <DonationDrop frame={frame} fps={fps} />
      <LabPanel frame={frame} fps={fps} />
      <StatPayoff frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default BloodDonationProcess;
