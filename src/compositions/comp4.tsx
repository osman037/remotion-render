/**
 * EmployeeOnboardingJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A warm, brand-neutral ONBOARDING visual for HR teams, people-ops decks and
 * corporate comms: a six-stage journey rail (offer -> paperwork -> IT setup ->
 * training -> mentor -> 30/60/90 check-ins) draws itself left to right, each
 * stage lights up with live metrics, a readiness ring fills, day/task counters
 * tick, and the last two seconds stamp "FULLY RAMPED" with a glow payoff.
 * Deterministic seeded randomness only (remotion `random`).
 *
 * Register in Root.tsx:
 *   <Composition id="EmployeeOnboardingJourney" component={EmployeeOnboardingJourney}
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
// Palette (warm corporate: espresso bg, amber/gold accent, copper + teal)
// ---------------------------------------------------------------------------
const BG = '#0C0906';
const INK = '#F7EFE2';
const MUTED = 'rgba(247,239,226,0.60)';
const FAINT = 'rgba(247,239,226,0.34)';
const AMBER = '#F59E0B';
const GOLD = '#FBBF24';
const COPPER = '#C2703D';
const TEAL = '#2DD4BF';
const GREEN = '#34D399';
const PANEL = 'rgba(22,15,10,0.92)';
const HAIRLINE = 'rgba(247,239,226,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const clamp01 = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const NODE_START = 110; // first stage lights up
const NODE_STEP = 100; // frames between stage activations
const CONNECT_START = 60; // connector starts drawing
const CONNECT_END = 700; // connector fully drawn
const RING_END = 790; // readiness ring complete
const PAYOFF_START = 780; // final banner (last ~2 s)

// ---------------------------------------------------------------------------
// Data: 6 onboarding stages
// ---------------------------------------------------------------------------
interface Stage {
  key: string;
  label: string;
  day: string;
  tasks: number;
  metric1: string;
  metric2: string;
  color: string;
}
const STAGES: Stage[] = [
  {key: 'offer', label: 'OFFER', day: 'DAY 0', tasks: 4, metric1: 'offer letter e-signed · 2 days', metric2: 'acceptance rate 100%', color: GOLD},
  {key: 'paperwork', label: 'PAPERWORK', day: 'DAY 1', tasks: 6, metric1: '6 forms completed · 0 errors', metric2: 'ID verification passed', color: AMBER},
  {key: 'it', label: 'IT SETUP', day: 'DAY 2', tasks: 8, metric1: 'laptop provisioned · 12 apps', metric2: 'access checklist 8/8', color: COPPER},
  {key: 'training', label: 'TRAINING', day: 'WEEK 1', tasks: 7, metric1: '5 modules finished · quiz 94%', metric2: 'role certification issued', color: TEAL},
  {key: 'mentor', label: 'MENTOR', day: 'WEEK 2', tasks: 5, metric1: 'buddy assigned · 8 sessions', metric2: 'satisfaction 4.8 / 5', color: GOLD},
  {key: 'checkins', label: 'CHECK-INS', day: '30 · 60 · 90', tasks: 4, metric1: 'reviews on schedule · 3/3', metric2: 'goals tracking 9/10', color: GREEN},
];
const TOTAL_TASKS = STAGES.reduce((a, s) => a + s.tasks, 0);

// ---------------------------------------------------------------------------
// Geometry: horizontal stage rail
// ---------------------------------------------------------------------------
const RAIL_X0 = 300;
const RAIL_X1 = 3540;
const RAIL_Y = 940;
const RAIL_W = RAIL_X1 - RAIL_X0;
const nodeX = (i: number) => RAIL_X0 + (i / (STAGES.length - 1)) * RAIL_W;
const nodeFrame = (i: number) => NODE_START + i * NODE_STEP;

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="obGlow" cx="42%" cy="30%" r="80%">
      <stop offset="0%" stopColor="rgba(245,158,11,0.14)" />
      <stop offset="55%" stopColor="rgba(194,112,61,0.05)" />
      <stop offset="100%" stopColor="rgba(12,9,6,0)" />
    </radialGradient>
    <radialGradient id="obVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(4,3,2,0)" />
      <stop offset="100%" stopColor="rgba(3,2,1,0.78)" />
    </radialGradient>
    <linearGradient id="obScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(251,191,36,0)" />
      <stop offset="50%" stopColor="rgba(251,191,36,0.13)" />
      <stop offset="100%" stopColor="rgba(251,191,36,0)" />
    </linearGradient>
    <linearGradient id="obRail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={GOLD} />
      <stop offset="50%" stopColor={AMBER} />
      <stop offset="100%" stopColor={GREEN} />
    </linearGradient>
    <linearGradient id="obBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={COPPER} />
      <stop offset="100%" stopColor={GOLD} />
    </linearGradient>
    <pattern id="obDots" width="110" height="110" patternUnits="userSpaceOnUse">
      <circle cx={55} cy={55} r={2.6} fill="rgba(247,239,226,0.10)" />
    </pattern>
    <filter id="obBlur60" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="60" />
    </filter>
    <filter id="obBlur9" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="9" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: warm layered, drifting, never flat
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const drift1 = Math.sin((frame / 900) * Math.PI * 2) * 80;
  const drift2 = Math.cos((frame / 900) * Math.PI * 2) * 60;
  const scanY = (frame / 900) * 2400 - 240;
  const orbs: React.ReactElement[] = [];
  for (let i = 0; i < 5; i++) {
    const ox = random(`ob-orb-x-${i}`) * 3840;
    const oy = random(`ob-orb-y-${i}`) * 2160;
    const r = 240 + random(`ob-orb-r-${i}`) * 300;
    const hue =
      i % 3 === 0
        ? 'rgba(245,158,11,0.10)'
        : i % 3 === 1
          ? 'rgba(194,112,61,0.08)'
          : 'rgba(45,212,191,0.05)';
    const mx = Math.sin((frame / 900) * Math.PI * 2 + i * 1.9) * 110;
    const my = Math.cos((frame / 900) * Math.PI * 2 + i * 2.4) * 80;
    orbs.push(
      <circle key={i} cx={ox + mx} cy={oy + my} r={r} fill={hue} filter="url(#obBlur60)" />
    );
  }
  const grid: React.ReactElement[] = [];
  for (let gx = 0; gx <= 3840; gx += 240) {
    grid.push(
      <line key={`v${gx}`} x1={gx} y1={0} x2={gx} y2={2160} stroke="rgba(247,239,226,0.038)" strokeWidth={1} />
    );
  }
  for (let gy = 0; gy <= 2160; gy += 240) {
    grid.push(
      <line key={`h${gy}`} x1={0} y1={gy} x2={3840} y2={gy} stroke="rgba(247,239,226,0.038)" strokeWidth={1} />
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect width={3840} height={2160} fill="url(#obGlow)" transform={`translate(${drift1},${drift2})`} />
        {orbs}
        {grid}
        <rect
          width={3840}
          height={2160}
          fill="url(#obDots)"
          transform={`translate(${drift1 * 0.3},${drift2 * 0.3})`}
        />
        <rect x={0} y={scanY} width={3840} height={300} fill="url(#obScan)" />
        <rect width={3840} height={2160} fill="url(#obVignette)" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Drifting dust particles (per-frame motion, always alive)
// ---------------------------------------------------------------------------
const Particles: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 46; i++) {
    const bx = random(`ob-p-x-${i}`) * 3840;
    const by = random(`ob-p-y-${i}`) * 2160;
    const r = 2 + random(`ob-p-r-${i}`) * 4;
    const px = bx + Math.sin(frame * 0.012 + i * 2.1) * 130;
    const py = by + Math.cos(frame * 0.009 + i * 1.4) * 90 - (frame / 900) * 120;
    const o = 0.10 + 0.10 * Math.sin(frame * 0.03 + i);
    const col = i % 4 === 0 ? TEAL : i % 4 === 1 ? COPPER : GOLD;
    dots.push(
      <circle key={i} cx={px} cy={py} r={r} fill={col} opacity={Math.max(0.04, o)} />
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Title bar + live clock ticker
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const rise = spring({frame, fps, config: {damping: 200, stiffness: 90, mass: 1}});
  const y = interpolate(rise, [0, 1], [60, 0], clamp01);
  const opacity = interpolate(rise, [0, 1], [0, 1], clamp01);
  const pulse = 0.70 + 0.30 * Math.sin((frame / 60) * Math.PI * 2);
  const elapsed = interpolate(frame, [0, 899], [0, 15], clamp01);
  const mm = Math.floor(elapsed / 60);
  const ss = Math.floor(elapsed % 60);
  const clock = `T+${mm}:${ss < 10 ? '0' : ''}${ss}`;
  return (
    <div
      style={{
        position: 'absolute',
        top: 110,
        left: 220,
        right: 220,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 42, letterSpacing: 14, color: AMBER}}>
        PEOPLE OPS &nbsp;·&nbsp; NEW-HIRE JOURNEY
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 148,
          color: INK,
          marginTop: 16,
          letterSpacing: -2,
          textShadow: '0 6px 60px rgba(245,158,11,0.25)',
        }}
      >
        Employee Onboarding Journey
      </div>
      <div style={{display: 'flex', alignItems: 'center', marginTop: 26, gap: 28}}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: GREEN,
            opacity: pulse,
            boxShadow: `0 0 30px ${GREEN}`,
          }}
        />
        <div style={{fontFamily: MONO, fontSize: 40, color: MUTED}}>
          6 STAGES &nbsp;·&nbsp; {TOTAL_TASKS} TASKS &nbsp;·&nbsp; JOURNEY ACTIVE
        </div>
        <div
          style={{
            marginLeft: 'auto',
            fontFamily: MONO,
            fontSize: 40,
            color: GOLD,
            border: `2px solid ${GOLD}`,
            borderRadius: 12,
            padding: '10px 26px',
            backgroundColor: 'rgba(251,191,36,0.06)',
          }}
        >
          {clock}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage icons (line-drawn, vendor-neutral)
// ---------------------------------------------------------------------------
const Icon: React.FC<{kind: string; x: number; y: number; s: number; color: string}> = ({
  kind,
  x,
  y,
  s,
  color,
}) => {
  const st = {stroke: color, strokeWidth: s * 0.09, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const h = s / 2;
  let body: React.ReactElement | null = null;
  if (kind === 'offer') {
    body = (
      <g>
        <rect x={x - h * 0.8} y={y - h * 0.5} width={h * 1.6} height={h} rx={h * 0.12} {...st} />
        <path d={`M ${x - h * 0.8} ${y - h * 0.32} L ${x} ${y + h * 0.16} L ${x + h * 0.8} ${y - h * 0.32}`} {...st} />
      </g>
    );
  } else if (kind === 'paperwork') {
    body = (
      <g>
        <rect x={x - h * 0.55} y={y - h * 0.62} width={h * 1.1} height={h * 1.3} rx={h * 0.1} {...st} />
        <rect x={x - h * 0.3} y={y - h * 0.78} width={h * 0.6} height={h * 0.26} rx={h * 0.08} {...st} />
        <line x1={x - h * 0.34} y1={y - h * 0.2} x2={x + h * 0.34} y2={y - h * 0.2} {...st} />
        <line x1={x - h * 0.34} y1={y + h * 0.06} x2={x + h * 0.34} y2={y + h * 0.06} {...st} />
        <line x1={x - h * 0.34} y1={y + h * 0.32} x2={x + h * 0.1} y2={y + h * 0.32} {...st} />
      </g>
    );
  } else if (kind === 'it') {
    body = (
      <g>
        <rect x={x - h * 0.62} y={y - h * 0.5} width={h * 1.24} height={h * 0.78} rx={h * 0.08} {...st} />
        <path d={`M ${x - h * 0.85} ${y + h * 0.5} L ${x + h * 0.85} ${y + h * 0.5} L ${x + h * 0.68} ${y + h * 0.28} L ${x - h * 0.68} ${y + h * 0.28} Z`} {...st} />
        <line x1={x - h * 0.12} y1={y + h * 0.5} x2={x + h * 0.12} y2={y + h * 0.5} {...st} />
      </g>
    );
  } else if (kind === 'training') {
    body = (
      <g>
        <path d={`M ${x - h * 0.85} ${y - h * 0.28} L ${x} ${y - h * 0.72} L ${x + h * 0.85} ${y - h * 0.28} L ${x + h * 0.85} ${y - h * 0.12} L ${x} ${y - h * 0.56} L ${x - h * 0.85} ${y - h * 0.12} Z`} {...st} />
        <line x1={x + h * 0.85} y1={y - h * 0.12} x2={x + h * 0.85} y2={y + h * 0.5} {...st} />
        <circle cx={x + h * 0.85} cy={y + h * 0.62} r={h * 0.1} fill={color} />
      </g>
    );
  } else if (kind === 'mentor') {
    body = (
      <g>
        <circle cx={x - h * 0.32} cy={y - h * 0.28} r={h * 0.28} {...st} />
        <path d={`M ${x - h * 0.78} ${y + h * 0.55} A ${h * 0.46} ${h * 0.46} 0 0 1 ${x + h * 0.14} ${y + h * 0.55}`} {...st} />
        <circle cx={x + h * 0.42} cy={y - h * 0.34} r={h * 0.22} {...st} />
        <path d={`M ${x + h * 0.06} ${y + h * 0.55} A ${h * 0.38} ${h * 0.38} 0 0 1 ${x + h * 0.82} ${y + h * 0.55}`} {...st} />
      </g>
    );
  } else {
    body = (
      <g>
        <line x1={x - h * 0.4} y1={y - h * 0.75} x2={x - h * 0.4} y2={y + h * 0.75} {...st} />
        <path d={`M ${x - h * 0.4} ${y - h * 0.75} L ${x + h * 0.7} ${y - h * 0.5} L ${x - h * 0.4} ${y - h * 0.25} Z`} {...st} />
      </g>
    );
  }
  return <g>{body}</g>;
};

// ---------------------------------------------------------------------------
// Stage rail: tick marks, base hairline, self-drawing connector, nodes
// ---------------------------------------------------------------------------
const StageRail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [20, 80], [0, 1], clamp01);
  const prog = interpolate(frame, [CONNECT_START, CONNECT_END], [0, 1], clamp01);
  const frontX = RAIL_X0 + prog * RAIL_W;
  const frontPulse = 0.55 + 0.45 * Math.sin(frame * 0.22);
  const ticks: React.ReactElement[] = [];
  for (let i = 0; i <= 54; i++) {
    const tx = RAIL_X0 + (i / 54) * RAIL_W;
    const tall = i % 9 === 0;
    ticks.push(
      <line
        key={i}
        x1={tx}
        y1={RAIL_Y + 118}
        x2={tx}
        y2={RAIL_Y + (tall ? 152 : 136)}
        stroke={tall ? 'rgba(251,191,36,0.5)' : 'rgba(247,239,226,0.18)'}
        strokeWidth={tall ? 4 : 2}
      />
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      <g opacity={fade}>
        {ticks}
        {/* day axis labels */}
        {STAGES.map((st, i) => (
          <text
            key={st.key}
            x={nodeX(i)}
            y={RAIL_Y + 218}
            fill={FAINT}
            fontSize={30}
            fontFamily={MONO}
            fontWeight={700}
            letterSpacing={3}
            textAnchor="middle"
          >
            {st.day}
          </text>
        ))}
        {/* base hairline */}
        <line x1={RAIL_X0} y1={RAIL_Y} x2={RAIL_X1} y2={RAIL_Y} stroke={HAIRLINE} strokeWidth={4} />
        {/* drawn connector */}
        <g clipPath="url(#obRailClip)">
          <line x1={RAIL_X0} y1={RAIL_Y} x2={RAIL_X1} y2={RAIL_Y} stroke="url(#obRail)" strokeWidth={10} strokeLinecap="round" filter="url(#obBlur9)" />
          <line x1={RAIL_X0} y1={RAIL_Y} x2={RAIL_X1} y2={RAIL_Y} stroke="url(#obRail)" strokeWidth={4} strokeLinecap="round" />
        </g>
        <clipPath id="obRailClip">
          <rect x={RAIL_X0 - 8} y={RAIL_Y - 40} width={prog * RAIL_W + 16} height={80} />
        </clipPath>
        {/* travelling pulse at the drawing front */}
        {prog > 0.004 && prog < 0.995 && (
          <g>
            <circle cx={frontX} cy={RAIL_Y} r={30 * frontPulse + 14} fill={GOLD} opacity={0.22} />
            <circle cx={frontX} cy={RAIL_Y} r={14} fill="#FFF7E6" style={{filter: `drop-shadow(0 0 18px ${GOLD})`}} />
          </g>
        )}
        {/* nodes */}
        {STAGES.map((st, i) => {
          const s = spring({
            frame: frame - nodeFrame(i),
            fps,
            config: {damping: 200, stiffness: 95, mass: 1},
          });
          if (s <= 0.001) return null;
          const cx = nodeX(i);
          const done = frame >= nodeFrame(i) + 70;
          const ring = 64 * s;
          const halo = done ? 0 : 0.5 + 0.5 * Math.sin(frame * 0.12 + i);
          return (
            <g key={st.key} opacity={Math.min(1, s)}>
              <g transform={`translate(0, ${(1 - s) * 40})`}>
                {/* halo while active */}
                {!done && (
                  <circle cx={cx} cy={RAIL_Y} r={ring + 34} fill="none" stroke={st.color} strokeWidth={3} opacity={halo * 0.7} />
                )}
                {/* node disc */}
                <circle cx={cx} cy={RAIL_Y} r={ring + 26} fill={PANEL} opacity={0.55} />
                <circle cx={cx} cy={RAIL_Y} r={ring} fill={BG} stroke={st.color} strokeWidth={done ? 5 : 8} />
                <circle cx={cx} cy={RAIL_Y} r={ring} fill="none" stroke={st.color} strokeWidth={2} opacity={0.35} filter="url(#obBlur9)" />
                <Icon kind={st.key} x={cx} y={RAIL_Y} s={72 * s} color={st.color} />
                {/* completion check */}
                {done && (
                  <g>
                    <circle cx={cx + 44} cy={RAIL_Y - 44} r={26} fill={GREEN} />
                    <text x={cx + 44} y={RAIL_Y - 26} fill="#06281C" fontSize={34} fontFamily={FONT} fontWeight={800} textAnchor="middle">
                      ✓
                    </text>
                  </g>
                )}
                {/* stage label above */}
                <text
                  x={cx}
                  y={RAIL_Y - 128}
                  fill={INK}
                  fontSize={46}
                  fontFamily={FONT}
                  fontWeight={800}
                  letterSpacing={2}
                  textAnchor="middle"
                >
                  {st.label}
                </text>
                {/* step number below label */}
                <text
                  x={cx}
                  y={RAIL_Y + 96}
                  fill={st.color}
                  fontSize={34}
                  fontFamily={MONO}
                  fontWeight={700}
                  textAnchor="middle"
                >
                  STEP {i + 1}/6
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Stage detail cards under the rail
// ---------------------------------------------------------------------------
const StageCards: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const cardW = 500;
  const gap = 48;
  const x0 = RAIL_X0;
  const y = 1230;
  return (
    <div style={{position: 'absolute', top: y, left: 0, width: 3840}}>
      {STAGES.map((st, i) => {
        const s = spring({
          frame: frame - (nodeFrame(i) + 34),
          fps,
          config: {damping: 200, stiffness: 100, mass: 1},
        });
        if (s <= 0.001) return null;
        const cx = nodeX(i);
        const left = cx - cardW / 2;
        const taskDone = interpolate(frame, [nodeFrame(i), nodeFrame(i) + 80], [0, st.tasks], clamp01);
        const tick1 = frame >= nodeFrame(i) + 40;
        const tick2 = frame >= nodeFrame(i) + 80;
        const barW = interpolate(taskDone / st.tasks, [0, 1], [0, 100], clamp01);
        return (
          <div
            key={st.key}
            style={{
              position: 'absolute',
              left,
              top: 0,
              width: cardW,
              borderRadius: 22,
              background: `linear-gradient(165deg, rgba(245,158,11,0.10), rgba(245,158,11,0.02) 55%, rgba(247,239,226,0.02))`,
              border: `1.5px solid ${HAIRLINE}`,
              borderTop: `4px solid ${st.color}`,
              padding: '30px 36px',
              opacity: Math.min(1, s),
              transform: `translateY(${(1 - s) * 50}px)`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 28,
                  letterSpacing: 2,
                  color: st.color,
                  border: `1px solid ${st.color}`,
                  borderRadius: 8,
                  padding: '4px 14px',
                }}
              >
                {st.day}
              </div>
              <div style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 30, color: FAINT}}>
                {Math.round(taskDone)}/{st.tasks} TASKS
              </div>
            </div>
            <div style={{fontFamily: FONT, fontWeight: 750, fontSize: 44, color: INK, marginTop: 14}}>
              {st.label}
            </div>
            <div style={{height: 12, backgroundColor: 'rgba(247,239,226,0.10)', borderRadius: 6, marginTop: 18, overflow: 'hidden'}}>
              <div
                style={{
                  width: `${barW}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg,#C2703D,#FBBF24)',
                  borderRadius: 6,
                }}
              />
            </div>
            <div style={{marginTop: 20}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12}}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: tick1 ? GREEN : 'rgba(247,239,226,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FONT,
                    fontWeight: 800,
                    fontSize: 20,
                    color: '#06281C',
                  }}
                >
                  {tick1 ? '✓' : ''}
                </div>
                <div style={{fontFamily: FONT, fontSize: 31, color: tick1 ? INK : MUTED}}>{st.metric1}</div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: tick2 ? GREEN : 'rgba(247,239,226,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FONT,
                    fontWeight: 800,
                    fontSize: 20,
                    color: '#06281C',
                  }}
                >
                  {tick2 ? '✓' : ''}
                </div>
                <div style={{fontFamily: FONT, fontSize: 31, color: tick2 ? INK : MUTED}}>{st.metric2}</div>
              </div>
            </div>
          </div>
        );
      })}
      <div style={{display: 'none'}}>{x0}{gap}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bottom panel: readiness ring, day + task counters, milestones, sparkline
// ---------------------------------------------------------------------------
const RING_CX = 460;
const RING_CY = 1880;
const RING_R = 190;
const RING_C = 2 * Math.PI * RING_R;

const SPARK_N = 64;
const SPARK: number[] = [];
for (let i = 0; i < SPARK_N; i++) {
  SPARK.push(0.35 + 0.6 * (i / (SPARK_N - 1)) + (random(`ob-spark-${i}`) - 0.5) * 0.22);
}

const BottomPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [60, 130], [0, 1], clamp01);
  const ringP = interpolate(frame, [CONNECT_START, RING_END], [0, 1], clamp01);
  const pct = Math.round(ringP * 100);
  const day = Math.round(interpolate(frame, [CONNECT_START, RING_END], [0, 90], clamp01));
  const tasksDone = Math.round(
    STAGES.reduce(
      (a, st, i) => a + interpolate(frame, [nodeFrame(i), nodeFrame(i) + 80], [0, st.tasks], clamp01),
      0
    )
  );
  const ringRot = -90;
  const dashOff = RING_C * (1 - ringP);
  const glowPulse = 0.6 + 0.4 * Math.sin(frame * 0.08);

  const sparkProg = interpolate(frame, [40, 880], [0, 1], clamp01);
  const sx0 = 2560;
  const sx1 = 3620;
  const sy0 = 1990;
  const sy1 = 1770;
  const sparkPath = SPARK.map(
    (v, i) =>
      `${i === 0 ? 'M' : 'L'} ${(sx0 + (i / (SPARK_N - 1)) * (sx1 - sx0)).toFixed(1)} ${(sy1 + (1 - Math.min(1, Math.max(0, v))) * (sy0 - sy1)).toFixed(1)}`
  ).join(' ');

  const ms = [
    {d: 30, label: 'DAY 30 · role clarity'},
    {d: 60, label: 'DAY 60 · full ownership'},
    {d: 90, label: 'DAY 90 · ramped & reviewed'},
  ];

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        {/* divider hairline */}
        <line x1={220} y1={1670} x2={3620} y2={1670} stroke={HAIRLINE} strokeWidth={2} />
        <text x={220} y={1728} fill={FAINT} fontSize={30} fontFamily={MONO} letterSpacing={6}>
          READINESS DASHBOARD
        </text>

        {/* progress ring */}
        <circle cx={RING_CX} cy={RING_CY} r={RING_R} fill="none" stroke="rgba(247,239,226,0.10)" strokeWidth={26} />
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke="url(#obBar)"
          strokeWidth={26}
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={dashOff}
          transform={`rotate(${ringRot} ${RING_CX} ${RING_CY})`}
          style={{filter: `drop-shadow(0 0 ${18 * glowPulse}px rgba(251,191,36,0.6))`}}
        />
        <text x={RING_CX} y={RING_CY - 18} fill={INK} fontSize={120} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {pct}%
        </text>
        <text x={RING_CX} y={RING_CY + 56} fill={MUTED} fontSize={36} fontFamily={MONO} letterSpacing={6} textAnchor="middle">
          RAMP-UP
        </text>

        {/* day counter */}
        <text x={800} y={1800} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={6}>
          ONBOARDING DAY
        </text>
        <text x={800} y={1960} fill={INK} fontSize={190} fontFamily={MONO} fontWeight={800} style={{textShadow: '0 0 40px rgba(251,191,36,0.35)'}}>
          {day}
        </text>
        <text x={1060} y={1960} fill={FAINT} fontSize={70} fontFamily={MONO} textAnchor="start">
          / 90
        </text>

        {/* tasks counter */}
        <text x={1420} y={1800} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={6}>
          TASKS COMPLETED
        </text>
        <text x={1420} y={1960} fill={GOLD} fontSize={190} fontFamily={MONO} fontWeight={800} style={{textShadow: '0 0 40px rgba(251,191,36,0.35)'}}>
          {tasksDone}
        </text>
        <text x={1660} y={1960} fill={FAINT} fontSize={70} fontFamily={MONO}>
          / {TOTAL_TASKS}
        </text>

        {/* 30/60/90 milestone badges */}
        {ms.map((m, i) => {
          const hit = day >= m.d;
          const bx = 2120;
          const by = 1800 + i * 86;
          return (
            <g key={m.d} opacity={hit ? 1 : 0.38}>
              <circle cx={bx} cy={by} r={24} fill={hit ? GREEN : 'rgba(247,239,226,0.12)'} />
              {hit && (
                <text x={bx} y={by + 12} fill="#06281C" fontSize={30} fontFamily={FONT} fontWeight={800} textAnchor="middle">
                  ✓
                </text>
              )}
              <text x={bx + 52} y={by + 13} fill={hit ? INK : FAINT} fontSize={40} fontFamily={MONO} fontWeight={hit ? 700 : 400}>
                {m.label}
              </text>
            </g>
          );
        })}

        {/* engagement sparkline */}
        <text x={sx0} y={sy1 - 44} fill={FAINT} fontSize={30} fontFamily={MONO} letterSpacing={6}>
          ENGAGEMENT TREND
        </text>
        <g clipPath="url(#obSparkClip)">
          <path d={sparkPath} fill="none" stroke={TEAL} strokeWidth={6} strokeLinecap="round" style={{filter: 'drop-shadow(0 0 12px rgba(45,212,191,0.7))'}} />
        </g>
        <clipPath id="obSparkClip">
          <rect x={sx0} y={sy1 - 60} width={sparkProg * (sx1 - sx0)} height={sy0 - sy1 + 120} />
        </clipPath>
        <line x1={sx0} y1={sy0} x2={sx1} y2={sy0} stroke={HAIRLINE} strokeWidth={2} />
        {/* sparkline head dot */}
        {sparkProg > 0.01 && sparkProg < 0.999 && (
          <circle
            cx={sx0 + sparkProg * (sx1 - sx0)}
            cy={sy1 + (1 - Math.min(1, Math.max(0, SPARK[Math.min(SPARK_N - 1, Math.floor(sparkProg * SPARK_N))])) * (sy0 - sy1))}
            r={12}
            fill={TEAL}
            style={{filter: 'drop-shadow(0 0 14px rgba(45,212,191,0.9))'}}
          />
        )}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Bottom ticker tape (seamless loop, always moving)
// ---------------------------------------------------------------------------
const TICKER_ITEMS = [
  'offer accepted',
  'docs e-signed',
  'laptop shipped',
  'accounts provisioned',
  'buddy matched',
  'week-1 training live',
  'day-30 review booked',
  'goals set',
  'day-60 check-in',
  'feedback collected',
  'day-90 review',
  'fully ramped',
];
const TickerTape: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 200], [0, 1], clamp01);
  const unitW = 640;
  const loopW = TICKER_ITEMS.length * unitW;
  const off = -((frame * 5) % unitW);
  const cols: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER_ITEMS.length; i++) {
      const x = off + r * loopW + i * unitW;
      cols.push(
        <g key={`${r}-${i}`}>
          <circle cx={x + 40} cy={2095} r={9} fill={AMBER} opacity={0.8} />
          <text x={x + 72} y={2110} fill={FAINT} fontSize={34} fontFamily={MONO} letterSpacing={3}>
            {TICKER_ITEMS[i].toUpperCase()}
          </text>
        </g>
      );
    }
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      <g opacity={fade * 0.9}>
        <line x1={0} y1={2062} x2={3840} y2={2062} stroke={HAIRLINE} strokeWidth={1.5} />
        {cols}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Payoff banner (final ~2 s)
// ---------------------------------------------------------------------------
const PayoffBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - PAYOFF_START, fps, config: {damping: 200, stiffness: 70, mass: 1}});
  if (s <= 0.001) return null;
  const opacity = interpolate(s, [0, 1], [0, 1], clamp01);
  const scale = interpolate(s, [0, 1], [0.9, 1], clamp01);
  const sweep = interpolate(frame, [PAYOFF_START + 10, PAYOFF_START + 70], [-600, 3400], clamp01);
  const ringR = interpolate(frame, [PAYOFF_START, PAYOFF_START + 60], [120, 700], clamp01);
  const ringO = interpolate(frame, [PAYOFF_START + 20, PAYOFF_START + 70], [0.8, 0], clamp01);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
        pointerEvents: 'none',
      }}
    >
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <circle cx={1920} cy={1080} r={ringR} fill="none" stroke={GOLD} strokeWidth={6} opacity={ringO} />
        <circle cx={1920} cy={1080} r={ringR * 0.72} fill="none" stroke={AMBER} strokeWidth={3} opacity={ringO * 0.8} />
      </svg>
      <div
        style={{
          position: 'relative',
          backgroundColor: 'rgba(10,7,4,0.94)',
          border: `3px solid ${GOLD}`,
          borderRadius: 34,
          padding: '70px 160px',
          textAlign: 'center',
          overflow: 'hidden',
          boxShadow: `0 0 140px rgba(251,191,36,0.45), 0 30px 90px rgba(0,0,0,0.6)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            bottom: -40,
            left: sweep - 150,
            width: 300,
            background: 'linear-gradient(105deg, rgba(251,191,36,0) 0%, rgba(251,191,36,0.35) 50%, rgba(251,191,36,0) 100%)',
            transform: 'skewX(-18deg)',
          }}
        />
        <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 18, color: GOLD}}>
          ONBOARDING COMPLETE
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 190,
            color: INK,
            marginTop: 24,
            letterSpacing: 4,
            textShadow: `0 0 70px rgba(251,191,36,0.75)`,
          }}
        >
          FULLY RAMPED
        </div>
        <div style={{fontFamily: MONO, fontSize: 42, color: MUTED, marginTop: 26, letterSpacing: 4}}>
          90 DAYS &nbsp;·&nbsp; 6 STAGES &nbsp;·&nbsp; {TOTAL_TASKS} TASKS DONE
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain (full-frame, re-seeded every frame)
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 900;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`ob-grain-x-${frame}-${i}`) * 3840;
    const y = random(`ob-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`ob-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`ob-grain-s-${frame}-${i}`) * 2.5;
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
export const EmployeeOnboardingJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <StageRail frame={frame} fps={fps} />
      <StageCards frame={frame} fps={fps} />
      <BottomPanel frame={frame} fps={fps} />
      <TickerTape frame={frame} />
      <PayoffBanner frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
