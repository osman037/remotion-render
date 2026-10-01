/**
 * RetirementSavingsJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A 40-year retirement savings story (age 25 -> 65): a compounding balance
 * curve draws itself with per-year ticks, an equity->bond glidepath band
 * shifts beneath it, employer-match "FREE MONEY" pulses fire along the way,
 * and the final ~2s pay off with an income-replacement gauge stamp at 78%.
 * Gold/green on deep navy. Deterministic seeded randomness only.
 *
 * Register in Root.tsx:
 *   <Composition id="RetirementSavingsJourney" component={RetirementSavingsJourney}
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
// Palette: gold / green on deep navy
// ---------------------------------------------------------------------------
const BG = '#060B18';
const INK = '#F2F4FA';
const MUTED = 'rgba(242,244,250,0.58)';
const FAINT = 'rgba(242,244,250,0.30)';
const GOLD = '#F2B544';
const GOLD_BRIGHT = '#FFD98A';
const GREEN = '#34D399';
const GREEN_SOFT = '#6EE7B7';
const AMBER = '#FBBF24';
const RED = '#F87171';
const PANEL = 'rgba(10,18,38,0.88)';
const HAIRLINE = 'rgba(242,244,250,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const clamp01 = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const TITLE_END = 70;
const AXES_START = 90;
const DRAW_START = 120; // balance curve begins drawing
const DRAW_END = 740; // balance curve fully drawn
const PAYOFF_DIM_START = 790; // scene dims for the gauge payoff
const GAUGE_START = 810; // needle sweep begins
const STAMP_START = 836; // RETIREMENT READY stamp

// ---------------------------------------------------------------------------
// Data model: 41 annual points, index 0 = age 25 ... index 40 = age 65.
// $6,000/yr contributions growing 2.5%/yr, 7% avg return,
// 50% employer match capped at $3,000/yr.
// ---------------------------------------------------------------------------
const N_YEARS = 41;
const BAL: number[] = [];
const CONTRIB: number[] = [];
const MATCH: number[] = [];
{
  let bal = 0;
  let contribCum = 0;
  let matchCum = 0;
  let contrib = 6000;
  for (let a = 0; a < N_YEARS; a++) {
    const match = Math.min(contrib * 0.5, 3000);
    bal = bal * 1.07 + contrib + match;
    contribCum += contrib;
    matchCum += match;
    BAL.push(bal);
    CONTRIB.push(contribCum);
    MATCH.push(matchCum);
    contrib *= 1.025;
  }
}
const Y_MAX = Math.ceil(BAL[N_YEARS - 1] / 250000) * 250000;
const FINAL_BAL = BAL[N_YEARS - 1];
const FINAL_CONTRIB = CONTRIB[N_YEARS - 1];
const FINAL_MATCH = MATCH[N_YEARS - 1];

const fmt = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;
const fmtAxis = (v: number) =>
  v >= 1000000 ? `$${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)}M` : `$${Math.round(v / 1000)}K`;
const Y_TICKS: number[] = [];
for (let t = 0; t <= Y_MAX + 1; t += 250000) Y_TICKS.push(t);

// ---------------------------------------------------------------------------
// Chart geometry (device px, 4K)
// ---------------------------------------------------------------------------
const PLOT_LEFT = 300;
const PLOT_RIGHT = 3540;
const PLOT_TOP = 620;
const PLOT_BOTTOM = 1480;
const PLOT_W = PLOT_RIGHT - PLOT_LEFT;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;

const xForIdx = (i: number) => PLOT_LEFT + (i / (N_YEARS - 1)) * PLOT_W;
const yForBal = (b: number) => PLOT_BOTTOM - (b / Y_MAX) * PLOT_H;

// Glidepath: equity share glides 90% -> 35% over the 40 years.
const eqFracFor = (drawFrac: number) => 0.9 - 0.55 * drawFrac;

// Employer-match pulse years (every 5 years)
const MATCH_YEARS = [0, 5, 10, 15, 20, 25, 30, 35];

// Fractional draw state shared by several components
interface DrawState {
  draw: number;
  idx: number; // fractional index 0..40
  bal: number;
  contrib: number;
  match: number;
  age: number;
  eq: number;
  frontX: number;
}
const drawState = (frame: number): DrawState => {
  const draw = interpolate(frame, [DRAW_START, DRAW_END], [0, 1], clamp01);
  const idx = draw * (N_YEARS - 1);
  const i0 = Math.min(N_YEARS - 2, Math.floor(idx));
  const f = idx - i0;
  const bal = BAL[i0] + (BAL[i0 + 1] - BAL[i0]) * f;
  const contrib = CONTRIB[i0] + (CONTRIB[i0 + 1] - CONTRIB[i0]) * f;
  const match = MATCH[i0] + (MATCH[i0 + 1] - MATCH[i0]) * f;
  return {
    draw,
    idx,
    bal,
    contrib,
    match,
    age: 25 + idx,
    eq: eqFracFor(draw),
    frontX: PLOT_LEFT + draw * PLOT_W,
  };
};

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="rsGlow" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stopColor="rgba(242,181,68,0.13)" />
      <stop offset="50%" stopColor="rgba(242,181,68,0.04)" />
      <stop offset="100%" stopColor="rgba(6,11,24,0)" />
    </radialGradient>
    <radialGradient id="rsVignette" cx="50%" cy="50%" r="76%">
      <stop offset="58%" stopColor="rgba(3,6,14,0)" />
      <stop offset="100%" stopColor="rgba(2,4,10,0.78)" />
    </radialGradient>
    <linearGradient id="rsScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(242,181,68,0)" />
      <stop offset="50%" stopColor="rgba(242,181,68,0.14)" />
      <stop offset="100%" stopColor="rgba(242,181,68,0)" />
    </linearGradient>
    <linearGradient id="rsLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={GOLD} />
      <stop offset="60%" stopColor={GOLD_BRIGHT} />
      <stop offset="100%" stopColor={GREEN_SOFT} />
    </linearGradient>
    <linearGradient id="rsArea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={GOLD} stopOpacity={0.30} />
      <stop offset="55%" stopColor={GOLD} stopOpacity={0.07} />
      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
    </linearGradient>
    <linearGradient id="rsEq" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#C98A1F" />
      <stop offset="100%" stopColor={GOLD_BRIGHT} />
    </linearGradient>
    <linearGradient id="rsBd" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#1FA97C" />
      <stop offset="100%" stopColor={GREEN_SOFT} />
    </linearGradient>
    <linearGradient id="rsGauge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={GOLD} />
      <stop offset="70%" stopColor={GOLD_BRIGHT} />
      <stop offset="100%" stopColor={GREEN} />
    </linearGradient>
    <filter id="rsBlur90" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="90" />
    </filter>
    <filter id="rsBlur18" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: layered navy, gold glow, drifting dot-grid, orbs, scan sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const drift = Math.sin((frame / 900) * Math.PI * 2) * 60;
  const scanY = (frame / 900) * 2500 - 300;
  const orbs: React.ReactElement[] = [];
  for (let i = 0; i < 4; i++) {
    const ox = random(`rs-orb-x-${i}`) * 3840;
    const oy = random(`rs-orb-y-${i}`) * 2160;
    const r = 300 + random(`rs-orb-r-${i}`) * 380;
    const hue = i % 2 === 0 ? 'rgba(242,181,68,0.09)' : 'rgba(52,211,153,0.06)';
    const mx = Math.sin((frame / 900) * Math.PI * 2 + i * 2.1) * 140;
    const my = Math.cos((frame / 900) * Math.PI * 2 + i * 1.4) * 100;
    orbs.push(
      <circle key={i} cx={ox + mx} cy={oy + my} r={r} fill={hue} filter="url(#rsBlur90)" />
    );
  }
  const dots: React.ReactElement[] = [];
  for (let gx = 120; gx < 3840; gx += 200) {
    for (let gy = 120; gy < 2160; gy += 200) {
      const jx = (random(`rs-dot-jx-${gx}-${gy}`) - 0.5) * 40;
      const jy = (random(`rs-dot-jy-${gx}-${gy}`) - 0.5) * 40;
      const tw = 0.5 + 0.5 * Math.sin(frame * 0.05 + gx * 0.01 + gy * 0.013);
      dots.push(
        <circle
          key={`${gx}-${gy}`}
          cx={gx + jx}
          cy={gy + jy + drift * 0.4}
          r={3}
          fill="#FFFFFF"
          opacity={0.028 + tw * 0.035}
        />
      );
    }
  }
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={-200} y={-200} width={4240} height={2560} fill="url(#rsGlow)" transform={`translate(${drift},0)`} />
        {orbs}
        {dots}
        <rect x={0} y={scanY} width={3840} height={300} fill="url(#rsScan)" />
        <rect width={3840} height={2160} fill="url(#rsVignette)" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number; age: number}> = ({frame, fps, age}) => {
  const rise = spring({frame, fps, config: {damping: 200, stiffness: 95, mass: 1}});
  const y = interpolate(rise, [0, 1], [70, 0]);
  const opacity = interpolate(rise, [0, 1], [0, 1]);
  const pulse = 0.65 + 0.35 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div
      style={{
        position: 'absolute',
        top: 110,
        left: 300,
        right: 300,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
        <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 14, color: GOLD}}>
          WEALTH BUILDING &nbsp;·&nbsp; 40-YEAR PLAN
        </div>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            border: `2px solid ${GOLD}`,
            borderRadius: 14,
            padding: '12px 34px',
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: GREEN,
              opacity: pulse,
              boxShadow: `0 0 26px ${GREEN}`,
            }}
          />
          <div style={{fontFamily: MONO, fontSize: 42, fontWeight: 700, color: INK}}>
            AGE {Math.round(age)}
          </div>
        </div>
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 150,
          color: INK,
          marginTop: 16,
          letterSpacing: -2,
          textShadow: '0 0 60px rgba(242,181,68,0.25)',
        }}
      >
        Retirement Savings Journey
      </div>
      <div style={{fontFamily: FONT, fontSize: 42, color: MUTED, marginTop: 14}}>
        Start at 25 &middot; compound at 7% &middot; glide from equities into bonds &middot; never miss the match
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Age timeline: decades 25 -> 65 with a travelling marker
// ---------------------------------------------------------------------------
const AgeTimeline: React.FC<{frame: number; fps: number; st: DrawState}> = ({frame, fps, st}) => {
  const enter = spring({frame: frame - 40, fps, config: {damping: 200, stiffness: 90}});
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const TOP = 470;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, opacity}}>
      <line x1={PLOT_LEFT} y1={TOP} x2={PLOT_RIGHT} y2={TOP} stroke={HAIRLINE} strokeWidth={3} />
      {Array.from({length: 9}).map((_, k) => {
        const i = k * 5;
        const x = xForIdx(i);
        const passed = st.draw * 40 >= i;
        return (
          <g key={k}>
            <line
              x1={x}
              y1={TOP - 14}
              x2={x}
              y2={TOP + 14}
              stroke={passed ? GOLD : FAINT}
              strokeWidth={passed ? 5 : 3}
            />
            <text
              x={x}
              y={TOP + 58}
              fill={passed ? INK : MUTED}
              fontSize={34}
              fontFamily={MONO}
              fontWeight={passed ? 700 : 400}
              textAnchor="middle"
            >
              {25 + i}
            </text>
          </g>
        );
      })}
      {st.draw > 0.002 && (
        <g>
          <circle cx={st.frontX} cy={TOP} r={30} fill={GOLD} opacity={0.22} />
          <circle
            cx={st.frontX}
            cy={TOP}
            r={14}
            fill={GOLD}
            style={{filter: 'drop-shadow(0 0 16px rgba(242,181,68,0.9))'}}
          />
          <text
            x={st.frontX}
            y={TOP - 52}
            fill={GOLD_BRIGHT}
            fontSize={36}
            fontFamily={MONO}
            fontWeight={700}
            textAnchor="middle"
          >
            AGE {Math.round(st.age)}
          </text>
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Balance chart: compounding curve, contributions baseline, ticks, cursor,
// employer-match pulses
// ---------------------------------------------------------------------------
const BalanceChart: React.FC<{frame: number; fps: number; st: DrawState}> = ({frame, fps, st}) => {
  const axesFade = interpolate(frame, [AXES_START, AXES_START + 60], [0, 1], clamp01);

  const balPath = BAL.map(
    (b, i) => `${i === 0 ? 'M' : 'L'} ${xForIdx(i).toFixed(1)} ${yForBal(b).toFixed(1)}`
  ).join(' ');
  const areaPath = `${balPath} L ${xForIdx(N_YEARS - 1).toFixed(1)} ${PLOT_BOTTOM} L ${xForIdx(0).toFixed(1)} ${PLOT_BOTTOM} Z`;
  const contribPath = CONTRIB.map(
    (c, i) => `${i === 0 ? 'M' : 'L'} ${xForIdx(i).toFixed(1)} ${yForBal(c).toFixed(1)}`
  ).join(' ');

  const {frontX} = st;
  const i0 = Math.min(N_YEARS - 2, Math.floor(st.idx));
  const fr = st.idx - i0;
  const cx = xForIdx(i0) + (xForIdx(i0 + 1) - xForIdx(i0)) * fr;
  const cy = yForBal(st.bal);
  const cursorVisible = st.draw > 0.004 && st.draw < 0.995;
  const flip = cx > PLOT_RIGHT - 700;
  const tx = flip ? cx - 30 : cx + 30;
  const anchor = flip ? 'end' : 'start';

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      {/* y gridlines + labels */}
      <g opacity={axesFade}>
        {Y_TICKS.map((t) => (
          <g key={`y${t}`}>
            <line
              x1={PLOT_LEFT}
              y1={yForBal(t)}
              x2={PLOT_RIGHT}
              y2={yForBal(t)}
              stroke="rgba(242,244,250,0.08)"
              strokeWidth={1.5}
            />
            <text
              x={PLOT_LEFT - 30}
              y={yForBal(t) + 13}
              fill={MUTED}
              fontSize={30}
              fontFamily={MONO}
              textAnchor="end"
            >
              {fmtAxis(t)}
            </text>
          </g>
        ))}
      </g>

      {/* per-year ticks + decade labels */}
      <g opacity={axesFade}>
        {BAL.map((_, i) => {
          const passed = i / (N_YEARS - 1) <= st.draw;
          const decade = i % 5 === 0;
          return (
            <g key={`t${i}`}>
              <line
                x1={xForIdx(i)}
                y1={PLOT_BOTTOM}
                x2={xForIdx(i)}
                y2={PLOT_BOTTOM + (decade ? 24 : 12)}
                stroke={passed ? GOLD : 'rgba(242,244,250,0.22)'}
                strokeWidth={decade ? 3 : 1.5}
                opacity={passed ? 0.85 : 0.5}
              />
              {decade && (
                <text
                  x={xForIdx(i)}
                  y={PLOT_BOTTOM + 72}
                  fill={passed ? INK : MUTED}
                  fontSize={32}
                  fontFamily={MONO}
                  fontWeight={passed ? 700 : 400}
                  textAnchor="middle"
                >
                  {25 + i}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* axis baselines */}
      <line x1={PLOT_LEFT} y1={PLOT_BOTTOM} x2={PLOT_RIGHT} y2={PLOT_BOTTOM} stroke="rgba(242,244,250,0.5)" strokeWidth={2.5} opacity={axesFade} />
      <line x1={PLOT_LEFT} y1={PLOT_TOP} x2={PLOT_LEFT} y2={PLOT_BOTTOM} stroke="rgba(242,244,250,0.5)" strokeWidth={2.5} opacity={axesFade} />

      {/* contributions-only dashed baseline */}
      <g opacity={axesFade * 0.9}>
        <path
          d={contribPath}
          fill="none"
          stroke={FAINT}
          strokeWidth={3}
          strokeDasharray="16 14"
          pathLength={1}
          style={{strokeDasharray: '16 14'}}
          strokeOpacity={1}
          strokeLinecap="round"
        />
      </g>
      {axesFade > 0.9 && (
        <text x={PLOT_RIGHT - 560} y={yForBal(CONTRIB[N_YEARS - 1]) - 24} fill={FAINT} fontSize={28} fontFamily={MONO}>
          CONTRIBUTIONS ONLY {fmt(FINAL_CONTRIB)}
        </text>
      )}

      {/* area fill clipped to drawn portion */}
      <g clipPath="url(#rsDrawClip)">
        <path d={areaPath} fill="url(#rsArea)" opacity={axesFade} />
      </g>
      <clipPath id="rsDrawClip">
        <rect
          x={PLOT_LEFT - 6}
          y={PLOT_TOP - 80}
          width={st.draw * PLOT_W + 12}
          height={PLOT_H + 90}
        />
      </clipPath>

      {/* compounding curve, self-drawing */}
      <path
        d={balPath}
        fill="none"
        stroke="url(#rsLine)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - st.draw}
        style={{filter: 'drop-shadow(0 0 18px rgba(242,181,68,0.55))'}}
      />

      {/* employer-match pulses: FREE MONEY rings every 5 years */}
      {MATCH_YEARS.map((mi, k) => {
        const appear = DRAW_START + (mi / (N_YEARS - 1)) * (DRAW_END - DRAW_START);
        const local = frame - appear;
        if (local < 0 || local > 110) return null;
        const px = xForIdx(mi);
        const py = yForBal(BAL[mi]);
        const s = spring({frame: local, fps, config: {damping: 200, stiffness: 100}});
        const ringR = interpolate(local, [0, 90], [14, 150], clamp01);
        const ringO = interpolate(local, [0, 90], [0.85, 0], clamp01);
        const cardY = Math.max(PLOT_TOP + 60, py - 250);
        return (
          <g key={`mp${k}`} opacity={Math.min(1, s)}>
            <circle cx={px} cy={py} r={ringR} fill="none" stroke={GREEN} strokeWidth={6} opacity={ringO} />
            <circle cx={px} cy={py} r={10} fill={GREEN} style={{filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.9))'}} />
            <g transform={`translate(0, ${(1 - s) * 26})`}>
              <line x1={px} y1={py - 18} x2={px} y2={cardY + 96} stroke={GREEN} strokeWidth={2.5} opacity={0.7} />
              <rect x={px - 300} y={cardY} width={600} height={96} rx={16} fill="rgba(6,16,12,0.92)" stroke={GREEN} strokeWidth={2.5} />
              <text x={px} y={cardY + 62} fill={GREEN_SOFT} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                +$3,000 MATCH · FREE MONEY
              </text>
            </g>
          </g>
        );
      })}

      {/* live cursor + readout */}
      {cursorVisible && (
        <g>
          <circle cx={cx} cy={cy} r={30} fill={GOLD} opacity={0.20} />
          <circle cx={cx} cy={cy} r={13} fill="#FFFFFF" style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))'}} />
          <g transform={`translate(${tx}, ${cy - 40})`}>
            <rect
              x={anchor === 'start' ? 0 : -330}
              y={-40}
              width={330}
              height={104}
              rx={16}
              fill="rgba(8,14,30,0.92)"
              stroke="rgba(242,181,68,0.55)"
              strokeWidth={2}
            />
            <text x={anchor === 'start' ? 24 : -306} y={4} fill={MUTED} fontSize={28} fontFamily={MONO}>
              AGE {Math.round(st.age)}
            </text>
            <text x={anchor === 'start' ? 24 : -306} y={52} fill={GOLD_BRIGHT} fontSize={42} fontFamily={MONO} fontWeight={800}>
              {fmt(st.bal)}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Glidepath band: equity (gold) glides into bonds (green) as age rises
// ---------------------------------------------------------------------------
const Glidepath: React.FC<{frame: number; st: DrawState}> = ({frame, st}) => {
  const BAND_Y = 1560;
  const BAND_H = 150;
  const fade = interpolate(frame, [AXES_START + 40, AXES_START + 110], [0, 1], clamp01);
  if (fade <= 0) return null;
  const divX = PLOT_LEFT + st.eq * PLOT_W;
  const eqPct = Math.round(st.eq * 100);
  const bdPct = 100 - eqPct;
  const shimmer = 0.5 + 0.5 * Math.sin(frame * 0.08);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
      <text x={PLOT_LEFT} y={BAND_Y - 34} fill={MUTED} fontSize={32} fontFamily={MONO} letterSpacing={6}>
        GLIDEPATH · ALLOCATION SHIFTS WITH AGE
      </text>
      <text x={PLOT_RIGHT} y={BAND_Y - 34} fill={GOLD} fontSize={32} fontFamily={MONO} textAnchor="end">
        90/10 → 35/65
      </text>
      <rect x={PLOT_LEFT} y={BAND_Y} width={PLOT_W} height={BAND_H} rx={26} fill="rgba(242,244,250,0.05)" />
      <g clipPath="url(#rsBandClip)">
        <rect x={PLOT_LEFT} y={BAND_Y} width={Math.max(0, divX - PLOT_LEFT)} height={BAND_H} fill="url(#rsEq)" />
        <rect x={divX} y={BAND_Y} width={Math.max(0, PLOT_RIGHT - divX)} height={BAND_H} fill="url(#rsBd)" />
        <rect
          x={divX - 8}
          y={BAND_Y}
          width={16}
          height={BAND_H}
          fill="#FFFFFF"
          opacity={0.35 + shimmer * 0.35}
        />
      </g>
      <clipPath id="rsBandClip">
        <rect x={PLOT_LEFT} y={BAND_Y} width={PLOT_W} height={BAND_H} rx={26} />
      </clipPath>
      <rect x={PLOT_LEFT} y={BAND_Y} width={PLOT_W} height={BAND_H} rx={26} fill="none" stroke={HAIRLINE} strokeWidth={2} />
      {st.eq > 0.12 && (
        <text x={PLOT_LEFT + 44} y={BAND_Y + 96} fill="#1A1206" fontSize={48} fontFamily={FONT} fontWeight={800}>
          EQUITY {eqPct}%
        </text>
      )}
      {st.eq < 0.88 && (
        <text x={PLOT_RIGHT - 44} y={BAND_Y + 96} fill="#06281C" fontSize={48} fontFamily={FONT} fontWeight={800} textAnchor="end">
          BONDS {bdPct}%
        </text>
      )}
      <text x={PLOT_LEFT} y={BAND_Y + BAND_H + 52} fill={MUTED} fontSize={30} fontFamily={MONO}>
        AGGRESSIVE EARLY · CONSERVATIVE LATE
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Stat cards: live counters for invested, match, portfolio
// ---------------------------------------------------------------------------
const StatCards: React.FC<{frame: number; fps: number; st: DrawState}> = ({frame, fps, st}) => {
  const cards = [
    {
      label: 'TOTAL INVESTED',
      value: fmt(st.contrib),
      sub: 'OUT OF POCKET · 40 YEARS',
      color: INK,
      border: 'rgba(242,244,250,0.25)',
    },
    {
      label: 'EMPLOYER MATCH',
      value: fmt(st.match),
      sub: 'FREE MONEY · 50% MATCH',
      color: GREEN_SOFT,
      border: 'rgba(52,211,153,0.45)',
    },
    {
      label: 'PORTFOLIO VALUE',
      value: fmt(st.bal),
      sub: '7% AVG ANNUAL RETURN',
      color: GOLD_BRIGHT,
      border: 'rgba(242,181,68,0.5)',
    },
  ];
  const cardW = 1000;
  const gap = 60;
  const y = 1800;
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: 3840, height: 280, display: 'flex', justifyContent: 'center'}}>
      <div style={{display: 'flex', gap}}>
        {cards.map((c, k) => {
          const s = spring({frame: frame - (200 + k * 26), fps, config: {damping: 200, stiffness: 95}});
          if (s <= 0.001) return null;
          return (
            <div
              key={c.label}
              style={{
                width: cardW,
                height: 250,
                borderRadius: 26,
                background: PANEL,
                border: `2px solid ${c.border}`,
                padding: '30px 46px',
                opacity: Math.min(1, s),
                transform: `translateY(${(1 - s) * 50}px)`,
              }}
            >
              <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 4}}>{c.label}</div>
              <div
                style={{
                  color: c.color,
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: 88,
                  lineHeight: 1.15,
                  marginTop: 10,
                  textShadow: `0 0 30px ${c.color}55`,
                }}
              >
                {c.value}
              </div>
              <div style={{color: MUTED, fontFamily: FONT, fontSize: 28, marginTop: 10}}>{c.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bottom live ticker
// ---------------------------------------------------------------------------
const Ticker: React.FC<{st: DrawState; frame: number}> = ({st, frame}) => {
  const fade = interpolate(frame, [140, 200], [0, 1], clamp01);
  if (fade <= 0) return null;
  const txt = `AGE ${Math.round(st.age)}   ·   PORTFOLIO ${fmt(st.bal)}   ·   EQUITY ${Math.round(st.eq * 100)}% / BONDS ${100 - Math.round(st.eq * 100)}%   ·   MATCH BANKED ${fmt(st.match)}   ·   COMPOUNDING @ 7%`;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 44,
        left: 0,
        width: 3840,
        textAlign: 'center',
        fontFamily: MONO,
        fontSize: 34,
        color: 'rgba(242,244,250,0.66)',
        letterSpacing: 2,
        opacity: fade,
      }}
    >
      {txt}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Final payoff: income-replacement gauge + RETIREMENT READY stamp (last ~2s)
// ---------------------------------------------------------------------------
const GaugePayoff: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const dim = interpolate(frame, [PAYOFF_DIM_START, PAYOFF_DIM_START + 45], [0, 0.68], clamp01);
  if (dim <= 0) return null;
  const needleS = spring({frame: frame - GAUGE_START, fps, config: {damping: 200, stiffness: 60}});
  const frac = 0.78 * Math.min(1, Math.max(0, needleS));
  const pct = Math.round(frac * 100);

  const CX = 1920;
  const CY = 1300;
  const R = 620;
  const pt = (a: number, r: number): [number, number] => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  const arcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  const stamp = spring({frame: frame - STAMP_START, fps, config: {damping: 200, stiffness: 80}});
  const stampOp = interpolate(stamp, [0, 1], [0, 1]);
  const stampScale = interpolate(stamp, [0, 1], [1.18, 1]);

  const sparks: React.ReactElement[] = [];
  for (let i = 0; i < 70; i++) {
    const sx = random(`rs-sp-x-${i}`) * 3840;
    const sy0 = 2100 - random(`rs-sp-y-${i}`) * 400;
    const spd = 4 + random(`rs-sp-s-${i}`) * 8;
    const life = interpolate(frame, [820, 900], [0, 1], clamp01);
    const y = sy0 - life * spd * 90;
    const driftX = (random(`rs-sp-d-${i}`) - 0.5) * 260 * life;
    const sz = 4 + random(`rs-sp-z-${i}`) * 7;
    const col = i % 3 === 0 ? GREEN_SOFT : GOLD_BRIGHT;
    sparks.push(
      <circle
        key={i}
        cx={sx + driftX}
        cy={y}
        r={sz}
        fill={col}
        opacity={life > 0 ? (1 - life) * 0.85 : 0}
      />
    );
  }

  const needleA = Math.PI + frac * Math.PI;
  const [nx, ny] = pt(needleA, R - 60);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: 0, backgroundColor: '#02040A', opacity: dim}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        {sparks}
        {/* gauge backdrop glow */}
        <circle cx={CX} cy={CY} r={R + 160} fill="rgba(52,211,153,0.08)" filter="url(#rsBlur90)" opacity={dim} />
        {/* track */}
        <path d={arcPath} fill="none" stroke="rgba(242,244,250,0.14)" strokeWidth={84} strokeLinecap="round" />
        {/* progress arc */}
        <path
          d={arcPath}
          fill="none"
          stroke="url(#rsGauge)"
          strokeWidth={84}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - frac}
          style={{filter: 'drop-shadow(0 0 30px rgba(52,211,153,0.6))'}}
        />
        {/* ticks 0..100 */}
        {[0, 25, 50, 75, 100].map((t) => {
          const a = Math.PI + (t / 100) * Math.PI;
          const [x1, y1] = pt(a, R - 74);
          const [x2, y2] = pt(a, R + 74);
          const [lx, ly] = pt(a, R + 150);
          return (
            <g key={t}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={t === 75 ? GOLD_BRIGHT : 'rgba(242,244,250,0.55)'} strokeWidth={t === 75 ? 8 : 4} />
              <text x={lx} y={ly + 16} fill={t === 75 ? GOLD_BRIGHT : MUTED} fontSize={44} fontFamily={MONO} fontWeight={t === 75 ? 800 : 400} textAnchor="middle">
                {t}%
              </text>
            </g>
          );
        })}
        {/* target marker at 75% */}
        {(() => {
          const a = Math.PI + 0.75 * Math.PI;
          const [mx, my] = pt(a, R + 236);
          return (
            <g>
              <text x={mx} y={my} fill={GOLD} fontSize={36} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={3}>
                TARGET 75%
              </text>
            </g>
          );
        })()}
        {/* needle */}
        <line x1={CX} y1={CY} x2={nx} y2={ny} stroke={INK} strokeWidth={14} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={34} fill={INK} />
        <circle cx={CX} cy={CY} r={16} fill={GOLD} />
      </svg>
      {/* big percent readout */}
      <div
        style={{
          position: 'absolute',
          top: CY - 260,
          left: 0,
          width: 3840,
          textAlign: 'center',
          opacity: dim > 0.3 ? 1 : 0,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 230,
            color: GREEN_SOFT,
            textShadow: '0 0 70px rgba(52,211,153,0.65)',
            lineHeight: 1,
          }}
        >
          {pct}%
        </div>
        <div style={{fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: INK, marginTop: 18}}>
          OF PRE-RETIREMENT INCOME REPLACED
        </div>
      </div>
      {/* stamp banner */}
      {stampOp > 0.001 && (
        <div
          style={{
            position: 'absolute',
            top: 250,
            left: 0,
            width: 3840,
            display: 'flex',
            justifyContent: 'center',
            opacity: stampOp,
            transform: `rotate(-4deg) scale(${stampScale})`,
          }}
        >
          <div
            style={{
              border: `8px double ${GOLD}`,
              borderRadius: 30,
              padding: '34px 110px',
              backgroundColor: 'rgba(20,14,4,0.88)',
              boxShadow: '0 0 110px rgba(242,181,68,0.45)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 132,
                letterSpacing: 10,
                color: GOLD_BRIGHT,
                textShadow: '0 0 44px rgba(242,181,68,0.7)',
              }}
            >
              RETIREMENT READY
            </div>
            <div style={{fontFamily: MONO, fontSize: 42, color: GREEN_SOFT, marginTop: 16, letterSpacing: 4}}>
              NEST EGG {fmt(FINAL_BAL)} · AGE 65 · TARGET BEATEN
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ---------------------------------------------------------------------------
// Texture overlays: ambient particles, fine dither, top ticker, corner HUD.
// Full-frame per-frame motion + cinematic grain support. Self-contained.
// ---------------------------------------------------------------------------
const MONO_rs = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const TEAL_rs = '#2DD4BF';
const CYAN_rs = '#67E8F9';

const AmbientParticles_rs: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`rs-amb-x-${i}`) * 3840;
    const by = random(`rs-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`rs-amb-s-${i}`) * 1.4;
    const ang = random(`rs-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`rs-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? CYAN_rs : i % 4 === 1 ? TEAL_rs : 'rgba(234,242,251,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_rs: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`rs-dth-x-${i}`) * 3840;
    const by = random(`rs-dth-y-${i}`) * 2160;
    const jx = (random(`rs-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`rs-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`rs-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`rs-dth-s-${i}`) * 2;
    specks.push(
      <rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#CFE9FF" opacity={o} />
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_rs = [
  '7% AVG ANNUAL RETURN',
  'EMPLOYER MATCH 50%',
  'FREE MONEY CLAIMED',
  '40-YEAR HORIZON',
  'PORTFOLIO $1.2M',
  'TOTAL INVESTED $280K',
  'COMPOUNDING ON',
  '0 WITHDRAWALS'
];
const TickerTape_rs: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_rs.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(103,232,249,0.60)" fontSize={27} fontFamily={MONO_rs} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(3,7,14,0.66)', borderBottom: '1px solid rgba(234,242,251,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_rs: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.55 + 0.45 * Math.sin((frame / 60) * Math.PI * 2);
  const corners = [
    {x: 60, y: 92, sx: 1, sy: 1},
    {x: 3780, y: 92, sx: -1, sy: 1},
    {x: 60, y: 2068, sx: 1, sy: -1},
    {x: 3780, y: 2068, sx: -1, sy: -1},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {corners.map((c, i) => (
          <g key={i} transform={`translate(${c.x},${c.y}) scale(${c.sx},${c.sy})`}>
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(45,212,191,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={TEAL_rs} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? TEAL_rs : 'rgba(234,242,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? TEAL_rs : 'rgba(234,242,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain (full-frame, re-seeded every frame)
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 7000;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`rs-grain-x-${frame}-${i}`) * 3840;
    const y = random(`rs-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`rs-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`rs-grain-s-${frame}-${i}`) * 3;
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
export const RetirementSavingsJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const st = drawState(frame);

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} fps={fps} age={st.age} />
      <AgeTimeline frame={frame} fps={fps} st={st} />
      <BalanceChart frame={frame} fps={fps} st={st} />
      <Glidepath frame={frame} st={st} />
      <StatCards frame={frame} fps={fps} st={st} />
      <Ticker frame={frame} st={st} />
      <GaugePayoff frame={frame} fps={fps} />
      <AmbientParticles_rs frame={frame} />
      <FineDither_rs frame={frame} />
      <TickerTape_rs frame={frame} />
      <CornerHud_rs frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
