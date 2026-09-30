/**
 * RentalApplicationProcess.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral renter-side rental application process for property
 * managers, rental platforms, and real-estate educators: tour the unit,
 * submit the application, pass three screening checks (credit, background,
 * income), get the APPROVED stamp, sign the lease, and receive the keys.
 * Demand-validated 2026-09-30 (PLAUSIBLE-strong).
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
// Palette (warm hospitality amber on deep slate)
// ---------------------------------------------------------------------------
const BG = '#0D0B08';
const INK = '#FAF6EC';
const MUTED = 'rgba(250,246,236,0.58)';
const AMBER = '#FBBF24';
const GREEN = '#34D399';
const BLUE = '#60A5FA';
const ROSE = '#FB7185';
const PANEL = 'rgba(16,13,9,0.94)';
const HAIRLINE = 'rgba(250,246,236,0.15)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const STEPS = [
  {key: 'tour', label: 'TOUR', start: 80},
  {key: 'apply', label: 'APPLY', start: 210},
  {key: 'screen', label: 'SCREENING', start: 360},
  {key: 'approve', label: 'APPROVED', start: 580},
  {key: 'lease', label: 'LEASE', start: 680},
  {key: 'keys', label: 'KEYS', start: 790},
];

const CHECKS = [
  {name: 'CREDIT CHECK', value: '742 SCORE', color: GREEN, dur: 60},
  {name: 'BACKGROUND CHECK', value: 'CLEAR', color: BLUE, dur: 60},
  {name: 'INCOME VERIFICATION', value: '3.2× RENT', color: AMBER, dur: 60},
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="raGlow" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stopColor="#3D2B0E" stopOpacity={0.85} />
      <stop offset="55%" stopColor="#231A0C" stopOpacity={0.32} />
      <stop offset="100%" stopColor="#0D0B08" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="raVig" cx="50%" cy="50%" r="72%">
      <stop offset="0%" stopColor="#000000" stopOpacity={0} />
      <stop offset="78%" stopColor="#000000" stopOpacity={0} />
      <stop offset="100%" stopColor="#040302" stopOpacity={0.85} />
    </radialGradient>
    <linearGradient id="raSweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#FBBF24" stopOpacity={0} />
      <stop offset="50%" stopColor="#FBBF24" stopOpacity={0.10} />
      <stop offset="100%" stopColor="#FBBF24" stopOpacity={0} />
    </linearGradient>
    <filter id="raGlow10" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation={10} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: warm glow + vignette + drifting key/dust motes + sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const motes: React.ReactElement[] = [];
  for (let i = 0; i < 110; i++) {
    const bx = random(`ra-mote-x-${i}`) * 3840;
    const by = random(`ra-mote-y-${i}`) * 2160;
    const y = ((by + frame * (0.5 + random(`ra-mote-v-${i}`) * 1.1)) % 2300) - 70;
    const o = 0.04 + random(`ra-mote-o-${i}`) * 0.06;
    const r = 2.5 + random(`ra-mote-r-${i}`) * 6;
    motes.push(<circle key={i} cx={bx} cy={y} r={r} fill="#FBBF24" opacity={o} />);
  }
  const sweepX = interpolate(frame, [0, 900], [-500, 4340], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      <rect width={3840} height={2160} fill={BG} />
      <rect width={3840} height={2160} fill="url(#raGlow)" />
      <g>{motes}</g>
      <rect x={sweepX - 300} y={0} width={600} height={2160} fill="url(#raSweep)" />
      <rect width={3840} height={2160} fill="url(#raVig)" />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Film grain
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 1100;

const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const rects: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`ra-grain-x-${frame}-${i}`) * 3840;
    const y = random(`ra-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`ra-grain-o-${frame}-${i}`) * 0.045;
    const s = 2 + random(`ra-grain-s-${frame}-${i}`) * 2.5;
    const white = random(`ra-grain-w-${frame}-${i}`) > 0.5;
    rects.push(
      <rect key={i} x={x} y={y} width={s} height={s} fill={white ? '#FFFFFF' : '#000000'} opacity={o} />,
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      {rects}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const p = spring({frame: Math.max(0, frame - 8), fps, config: {damping: 120, stiffness: 160}});
  const y = interpolate(p, [0, 1], [60, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = interpolate(p, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 100, left: 0, right: 0, opacity: op, transform: `translateY(${y}px)`, textAlign: 'center'}}>
      <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 10, color: MUTED}}>RENTER-SIDE GUIDE</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 104, letterSpacing: 8, color: INK, marginTop: 22}}>
        THE RENTAL <span style={{color: AMBER}}>APPLICATION</span>
      </div>
      <div style={{fontFamily: MONO, fontSize: 36, letterSpacing: 16, color: MUTED, marginTop: 14}}>
        TOUR → APPLY → SCREEN → MOVE IN
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Progress path: 6 milestone nodes
// ---------------------------------------------------------------------------
const PATH_TOP = 560;
const PATH_LEFT = 330;
const PATH_RIGHT = 3510;

const Path: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: Math.max(0, frame - 40), fps, config: {damping: 120, stiffness: 140}});
  const op = interpolate(enter, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const draw = interpolate(frame, [60, 800], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op}}>
      <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
        <line x1={PATH_LEFT} y1={PATH_TOP} x2={PATH_RIGHT} y2={PATH_TOP} stroke={HAIRLINE} strokeWidth={6} />
        <line
          x1={PATH_LEFT}
          y1={PATH_TOP}
          x2={PATH_LEFT + (PATH_RIGHT - PATH_LEFT) * draw}
          y2={PATH_TOP}
          stroke={AMBER}
          strokeWidth={6}
          filter="url(#raGlow10)"
        />
        {STEPS.map((s, i) => {
          const x = PATH_LEFT + (i * (PATH_RIGHT - PATH_LEFT)) / (STEPS.length - 1);
          const on = frame >= s.start;
          const pop = on ? spring({frame: frame - s.start, fps, config: {damping: 90, stiffness: 220}}) : 0;
          const active = on && (i === STEPS.length - 1 || frame < STEPS[i + 1].start);
          return (
            <g key={s.key}>
              <circle
                cx={x}
                cy={PATH_TOP}
                r={24 + pop * 22}
                fill={active ? AMBER : on ? '#2A2013' : '#141009'}
                stroke={on ? AMBER : HAIRLINE}
                strokeWidth={on ? 4 : 2}
                filter={active ? 'url(#raGlow10)' : undefined}
              />
              {on && (
                <text x={x} y={PATH_TOP + 13} textAnchor="middle" fontFamily={MONO} fontSize={36} fontWeight={800} fill={active ? '#141009' : AMBER}>
                  ✓
                </text>
              )}
              <text
                x={x}
                y={PATH_TOP + 86}
                textAnchor="middle"
                fontFamily={MONO}
                fontSize={30}
                letterSpacing={6}
                fill={active ? AMBER : on ? INK : MUTED}
                fontWeight={active ? 700 : 400}
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Screening panel: three checks with scan bars
// ---------------------------------------------------------------------------
const ScreenPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inn = spring({frame: Math.max(0, frame - 355), fps, config: {damping: 110, stiffness: 150}});
  const op = interpolate(inn, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = interpolate(inn, [0, 1], [70, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut =
    frame > 620
      ? interpolate(frame, [620, 660], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
      : 1;
  if (op * fadeOut <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 760, left: 0, right: 0, opacity: op * fadeOut, transform: `translateY(${y}px)`, display: 'flex', justifyContent: 'center', gap: 70}}>
      {CHECKS.map((c, i) => {
        const start = 380 + i * 62;
        const done = frame >= start + c.dur;
        const scan = interpolate(frame, [start, start + c.dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <div key={c.name} style={{width: 940, padding: '52px 58px', background: PANEL, border: `2px solid ${done ? c.color : HAIRLINE}`, borderRadius: 28, boxShadow: done ? `0 0 50px ${c.color}33` : 'none'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 42, color: INK, letterSpacing: 3}}>{c.name}</div>
              <div style={{width: 84, height: 84, borderRadius: '50%', background: done ? c.color : 'rgba(250,246,236,0.08)', color: done ? '#141009' : MUTED, fontSize: 44, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {done ? '✓' : Math.floor(scan * 99) + '%'}
              </div>
            </div>
            <div style={{marginTop: 34, height: 24, background: 'rgba(250,246,236,0.08)', borderRadius: 12, overflow: 'hidden', position: 'relative'}}>
              <div style={{width: `${scan * 100}%`, height: '100%', background: c.color, borderRadius: 12}} />
              {!done && scan > 0 && scan < 1 && (
                <div style={{position: 'absolute', left: `${scan * 100}%`, top: -6, bottom: -6, width: 6, background: '#fff', boxShadow: '0 0 20px #fff'}} />
              )}
            </div>
            <div style={{marginTop: 18, fontFamily: MONO, fontSize: 32, letterSpacing: 4, color: done ? c.color : MUTED, fontWeight: done ? 700 : 400}}>
              {done ? `✓ ${c.value}` : 'SCANNING RECORDS…'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Approved stamp + lease + keys payoff
// ---------------------------------------------------------------------------
const Payoff: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const stampOn = frame >= 585;
  const stampP = stampOn ? spring({frame: frame - 585, fps, config: {damping: 55, stiffness: 340}}) : 0;
  const leaseOn = frame >= 685;
  const leaseP = leaseOn ? spring({frame: frame - 685, fps, config: {damping: 110, stiffness: 160}}) : 0;
  const keysOn = frame >= 795;
  const keysP = keysOn ? spring({frame: frame - 795, fps, config: {damping: 80, stiffness: 200}}) : 0;
  return (
    <div style={{position: 'absolute', top: 760, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 90}}>
      {stampOn && (
        <div
          style={{
            width: 1050,
            padding: '70px 60px',
            textAlign: 'center',
            opacity: interpolate(stampP, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            transform: `rotate(-10deg) scale(${0.5 + stampP * 0.5})`,
          }}
        >
          <div style={{border: '10px solid #34D399', borderRadius: 26, padding: '44px 20px', boxShadow: '0 0 80px rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.06)'}}>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 120, letterSpacing: 14, color: GREEN}}>APPROVED</div>
            <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: MUTED, marginTop: 14}}>APPLICATION #R-29481</div>
          </div>
        </div>
      )}
      {leaseOn && (
        <div
          style={{
            width: 1050,
            padding: '60px 70px',
            background: PANEL,
            border: `2px solid ${HAIRLINE}`,
            borderRadius: 28,
            opacity: interpolate(leaseP, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            transform: `translateY(${interpolate(leaseP, [0, 1], [60, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`,
          }}
        >
          <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: AMBER}}>LEASE — 12 MONTHS</div>
          <div style={{marginTop: 30, display: 'flex', flexDirection: 'column', gap: 20}}>
            {['$1,850 / MO', 'SECURITY DEPOSIT PAID', 'MOVE-IN: NOV 1'].map((t, i) => {
              const on = frame >= 700 + i * 26;
              return (
                <div key={t} style={{display: 'flex', gap: 24, alignItems: 'center', opacity: on ? 1 : 0.2}}>
                  <div style={{width: 44, height: 44, borderRadius: '50%', background: on ? GREEN : 'transparent', border: `3px solid ${on ? GREEN : HAIRLINE}`, color: '#06231C', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    {on ? '✓' : ''}
                  </div>
                  <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 44, color: INK, letterSpacing: 2}}>{t}</div>
                </div>
              );
            })}
          </div>
          <svg width={910} height={90} style={{marginTop: 26}}>
            <line x1={20} y1={60} x2={890} y2={60} stroke={HAIRLINE} strokeWidth={3} />
            <path
              d="M 60 45 C 160 10, 240 70, 340 35 S 520 60, 640 30 S 800 55, 860 40"
              fill="none"
              stroke={INK}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={900}
              strokeDashoffset={900 * (1 - interpolate(frame, [740, 800], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}
            />
          </svg>
          <div style={{fontFamily: MONO, fontSize: 26, color: MUTED, letterSpacing: 4}}>E-SIGNATURE — RENTER</div>
        </div>
      )}
      {keysOn && (
        <div
          style={{
            width: 1050,
            padding: '60px 70px',
            background: PANEL,
            border: `2px solid ${AMBER}`,
            borderRadius: 28,
            textAlign: 'center',
            opacity: interpolate(keysP, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            transform: `scale(${0.9 + keysP * 0.1})`,
            boxShadow: '0 0 60px rgba(251,191,36,0.25)',
          }}
        >
          <div style={{fontSize: 170, filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.6))'}}>🔑</div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 64, color: INK, marginTop: 16, letterSpacing: 4}}>KEYS IN HAND</div>
          <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 6, color: AMBER, marginTop: 14}}>WELCOME HOME</div>
          <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, marginTop: 26, letterSpacing: 3}}>
            UNIT 4B · 2BR · MOVE-IN CHECKLIST COMPLETE
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Live application counter (per-frame motion)
// ---------------------------------------------------------------------------
const LiveCounter: React.FC<{frame: number}> = ({frame}) => {
  const n = Math.floor(interpolate(frame, [210, 580], [0, 47], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <div style={{position: 'absolute', top: 380, right: 240, textAlign: 'right'}}>
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED}}>APPLICATIONS THIS WEEK</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 84, color: INK}}>{n}</div>
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 4, color: MUTED, marginTop: 6}}>AVG DECISION · 48 HOURS</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ticker strip
// ---------------------------------------------------------------------------
const STRIP = '  •  HAVE PAY STUBS, ID, AND REFERENCES READY BEFORE YOU APPLY    •  LANDLORDS TYPICALLY WANT INCOME ≈ 3× RENT    •  READ THE LEASE — PETS, FEES, RENEWAL TERMS    ';

const Strip: React.FC<{frame: number}> = ({frame}) => {
  const x = -((frame * 7) % 2400);
  return (
    <div style={{position: 'absolute', bottom: 56, left: 0, right: 0, overflow: 'hidden', borderTop: `2px solid ${HAIRLINE}`, borderBottom: `2px solid ${HAIRLINE}`, padding: '22px 0'}}>
      <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 5, color: MUTED, whiteSpace: 'nowrap', transform: `translateX(${x}px)`}}>
        {STRIP.repeat(3)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const RentalApplicationProcess: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Defs />
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <Path frame={frame} fps={fps} />
      <LiveCounter frame={frame} />
      <ScreenPanel frame={frame} fps={fps} />
      <Payoff frame={frame} fps={fps} />
      <Strip frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
