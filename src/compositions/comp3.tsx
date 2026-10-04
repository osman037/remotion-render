/**
 * GlucoseMonitoringFlow.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * Continuous glucose monitoring: a sensor settles on the arm, its filament
 * samples glucose every minute, readings stream to the phone as a live curve
 * across in-range / high / low zones, the time-in-range ring fills, and a
 * gentle alert nudges when the line drifts out of band.
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
// Palette
// ---------------------------------------------------------------------------
const BG = '#081018';
const GRID = 'rgba(150,190,215,0.10)';
const INK = '#EEF4F9';
const MUTED = 'rgba(196,212,228,0.62)';
const GREEN = '#34D399';
const AMBER = '#FBBF24';
const RED = '#F87171';
const BLUE = '#5AC8FA';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// Glucose trace model (mg/dL), deterministic: baseline 118 with meals + drift.
function glucoseAt(t: number): number {
  const base = 118;
  const meal1 = 62 * Math.exp(-Math.pow((t - 0.30) * 6.2, 2));
  const meal2 = 74 * Math.exp(-Math.pow((t - 0.66) * 5.4, 2));
  const wob = 14 * Math.sin(t * 22) + 8 * Math.sin(t * 47 + 1.3);
  return base + meal1 + meal2 + wob;
}
const GMIN = 55;
const GMAX = 235;
const LO = 70;
const HI = 180;

// Plot geometry
const PL = 360;
const PR = 3480;
const PT = 620;
const PB = 1560;
const PW = PR - PL;
const xFor = (t: number) => PL + t * PW;
const yFor = (g: number) => PB - ((g - GMIN) / (GMAX - GMIN)) * (PB - PT);

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}line`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={BLUE} />
      <stop offset="50%" stopColor={GREEN} />
      <stop offset="100%" stopColor={GREEN} />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(8,16,24,0)" />
      <stop offset="100%" stopColor="rgba(2,5,9,0.78)" />
    </radialGradient>
    <filter id={`${p}glow`} x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="10" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

const Background: React.FC<{frame: number}> = ({frame}) => {
  const scan = ((frame / 900) * (2160 + 300)) % (2160 + 300) - 150;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(52,211,153,0.10), rgba(52,211,153,0.03) 45%, rgba(8,16,24,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="cgm" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#cgmvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(52,211,153,0.028)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`cgm-p-x-${i}`) * 3840;
    const by = random(`cgm-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`cgm-p-s-${i}`) * 1.0;
    const ang = random(`cgm-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 2.3));
    const sz = 2.5 + random(`cgm-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? GREEN : 'rgba(238,244,249,0.85)'} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {els}
    </svg>
  );
};

const Dither: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 2400; i++) {
    const bx = random(`cgm-d-x-${i}`) * 3840;
    const by = random(`cgm-d-y-${i}`) * 2160;
    const jx = (random(`cgm-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`cgm-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`cgm-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`cgm-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#C9E8D8" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {els}
    </svg>
  );
};

const Grain: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`cgm-g-x-${frame}-${i}`) * 3840;
    const y = random(`cgm-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`cgm-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`cgm-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'READING EVERY MINUTE', 'NO FINGERSTICKS', 'TIME IN RANGE', 'TREND ARROWS',
  'HIGH & LOW ALERTS', 'SHARE WITH YOUR CARE TEAM', '14-DAY SENSOR WEAR',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 1000;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 640} y={46} fill="rgba(52,211,153,0.7)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(52,211,153,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(52,211,153,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3260, y: 2090, t: 'CGM · LIVE TELEMETRY'},
    {x: 60, y: 130, t: 'SENSOR → PHONE · 1-MIN CADENCE'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={GREEN} opacity={0.35 + blink * 0.55} />
          <text x={c.x + 24} y={c.y} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={3}>
            {c.t}
          </text>
        </g>
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [20, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [20, 60], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 130 + rise, left: 180, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        CONTINUOUS GLUCOSE <span style={{color: GREEN}}>MONITORING</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        A tiny sensor reads glucose <span style={{color: GREEN, fontWeight: 700}}>every minute</span> — your phone draws the story
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sensor on arm (left panel)
// ---------------------------------------------------------------------------
const SensorPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [40, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const apply = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 110}});
  const warm = interpolate(frame, [120, 260], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cx = 1920;
  return (
    <div style={{position: 'absolute', top: 560, left: 120, width: 620, opacity: fade}}>
      <svg width={620} height={1120}>
        <rect x={0} y={0} width={620} height={1120} rx={40} fill="rgba(14,22,32,0.72)" stroke="rgba(52,211,153,0.3)" strokeWidth={3} />
        <text x={310} y={90} fill={MUTED} fontSize={34} fontFamily={MONO} textAnchor="middle" letterSpacing={4}>
          SENSOR
        </text>
        {/* arm */}
        <rect x={70} y={180} width={480} height={330} rx={165} fill="#1C2836" stroke="rgba(196,212,228,0.35)" strokeWidth={3} />
        {/* filament */}
        <line x1={310} y1={330} x2={310} y2={330 + 190 * apply} stroke={BLUE} strokeWidth={10} strokeLinecap="round" opacity={0.9} />
        {/* sensor disc */}
        <g transform={`translate(310, ${330 - (1 - Math.min(1, apply)) * 160})`} opacity={Math.min(1, apply)}>
          <ellipse cx={0} cy={0} rx={110} ry={64} fill="#243447" stroke={GREEN} strokeWidth={5} filter="url(#cgmglow)" />
          <ellipse cx={0} cy={-8} rx={60} ry={32} fill="rgba(52,211,153,0.25)" />
          <text y={90} fill={GREEN} fontSize={30} fontFamily={MONO} textAnchor="middle">
            {warm > 0.95 ? 'SAMPLING' : warm > 0 ? 'WARMING UP' : 'APPLYING'}
          </text>
        </g>
        {/* warmup bar */}
        <rect x={110} y={620} width={400} height={26} rx={13} fill="rgba(196,212,228,0.15)" />
        <rect x={110} y={620} width={400 * warm} height={26} rx={13} fill={GREEN} />
        {/* minute readings */}
        <text x={310} y={740} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
          READINGS / MINUTE
        </text>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const on = frame > 260 + i * 60;
          const g = glucoseAt(Math.min(1, (frame - 260) / 640));
          return (
            <g key={i} opacity={on ? 1 : 0.25}>
              <rect x={90 + i * 78} y={800} width={64} height={120} rx={14} fill={on ? 'rgba(52,211,153,0.16)' : 'rgba(196,212,228,0.08)'} stroke={on ? GREEN : 'rgba(196,212,228,0.2)'} strokeWidth={2} />
              <text x={122 + i * 78} y={880} fill={on ? INK : MUTED} fontSize={34} fontFamily={MONO} fontWeight={700} textAnchor="middle">
                {on ? Math.round(g + (random(`cgm-rd-${i}`) - 0.5) * 6) : '—'}
              </text>
            </g>
          );
        })}
        <text x={310} y={1000} fill={MUTED} fontSize={30} fontFamily={FONT} textAnchor="middle">
          14-day wear · waterproof
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Live graph (center-right) with zones + time-in-range ring
// ---------------------------------------------------------------------------
const Graph: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const draw = interpolate(frame, [140, 780], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const front = draw;
  const SUB = 200;
  let d = '';
  for (let i = 0; i <= SUB; i++) {
    const t = (i / SUB) * front;
    d += `${i === 0 ? 'M' : 'L'} ${xFor(t).toFixed(1)} ${yFor(glucoseAt(t)).toFixed(1)} `;
  }
  const gNow = glucoseAt(front);
  const inRange = gNow >= LO && gNow <= HI;
  const hiAlert = gNow > HI;
  const ring = interpolate(frame, [640, 840], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // time in range: fraction of drawn samples in band
  let inN = 0;
  const NN = 120;
  for (let i = 0; i <= NN; i++) {
    const g = glucoseAt((i / NN) * front);
    if (g >= LO && g <= HI) inN++;
  }
  const tir = inN / (NN + 1);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs p="cgmg" />
      {/* zones */}
      <rect x={PL} y={PT} width={PW} height={yFor(HI) - PT} fill="rgba(251,191,36,0.07)" />
      <rect x={PL} y={yFor(HI)} width={PW} height={yFor(LO) - yFor(HI)} fill="rgba(52,211,153,0.08)" />
      <rect x={PL} y={yFor(LO)} width={PW} height={PB - yFor(LO)} fill="rgba(248,113,113,0.07)" />
      <line x1={PL} y1={yFor(HI)} x2={PR} y2={yFor(HI)} stroke={AMBER} strokeWidth={2.5} strokeDasharray="14 12" opacity={0.8} />
      <line x1={PL} y1={yFor(LO)} x2={PR} y2={yFor(LO)} stroke={RED} strokeWidth={2.5} strokeDasharray="14 12" opacity={0.8} />
      <text x={PR - 20} y={yFor(HI) - 18} fill={AMBER} fontSize={28} fontFamily={MONO} textAnchor="end">HIGH 180</text>
      <text x={PR - 20} y={yFor(LO) - 18} fill={GREEN} fontSize={28} fontFamily={MONO} textAnchor="end">IN RANGE</text>
      <text x={PR - 20} y={yFor(LO) + 44} fill={RED} fontSize={28} fontFamily={MONO} textAnchor="end">LOW 70</text>
      {[70, 110, 150, 190, 230].map((g) => (
        <g key={g}>
          <line x1={PL} y1={yFor(g)} x2={PR} y2={yFor(g)} stroke={GRID} strokeWidth={1.5} />
          <text x={PL - 26} y={yFor(g) + 12} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="end">
            {g}
          </text>
        </g>
      ))}
      <line x1={PL} y1={PB} x2={PR} y2={PB} stroke="rgba(150,190,215,0.5)" strokeWidth={2} />
      {/* the trace */}
      <path d={d} fill="none" stroke="url(#cgmgline)" strokeWidth={8} strokeLinecap="round" filter="url(#cgmglow)" />
      {/* live dot + readout */}
      {draw > 0.01 && draw < 0.995 && (
        <g>
          <circle cx={xFor(front)} cy={yFor(gNow)} r={34} fill={inRange ? GREEN : hiAlert ? AMBER : RED} opacity={0.2} />
          <circle cx={xFor(front)} cy={yFor(gNow)} r={14} fill="#FFFFFF" style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))'}} />
          <g transform={`translate(${xFor(front) > PR - 560 ? xFor(front) - 300 : xFor(front) + 40}, ${yFor(gNow) - 40})`}>
            <rect x={0} y={-50} width={260} height={120} rx={16} fill="rgba(8,14,22,0.92)" stroke={inRange ? GREEN : hiAlert ? AMBER : RED} strokeWidth={2.5} />
            <text x={26} y={4} fill={MUTED} fontSize={26} fontFamily={MONO}>NOW</text>
            <text x={26} y={52} fill={inRange ? GREEN : hiAlert ? AMBER : RED} fontSize={46} fontFamily={MONO} fontWeight={800}>
              {Math.round(gNow)} <tspan fontSize={26}>mg/dL</tspan>
            </text>
          </g>
          {!inRange && (
            <g opacity={0.6 + 0.4 * Math.sin(frame * 0.25)}>
              <rect x={xFor(front) - 150} y={yFor(gNow) - 150} width={300} height={64} rx={32} fill={hiAlert ? AMBER : RED} />
              <text x={xFor(front)} y={yFor(gNow) - 106} fill="#1A0E02" fontSize={36} fontFamily={FONT} fontWeight={800} textAnchor="middle">
                {hiAlert ? 'HIGH — WALK IT OFF' : 'LOW — HAVE A SNACK'}
              </text>
            </g>
          )}
        </g>
      )}
      {/* time-in-range ring */}
      {ring > 0 && (
        <g transform={`translate(${PR - 330}, ${PT - 130})`} opacity={ring}>
          <circle r={110} fill="none" stroke="rgba(196,212,228,0.18)" strokeWidth={30} />
          <circle r={110} fill="none" stroke={GREEN} strokeWidth={30} strokeLinecap="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tir * ring} transform="rotate(-90)" filter="url(#cgmglow)" />
          <text y={-6} fill={INK} fontSize={64} fontFamily={MONO} fontWeight={800} textAnchor="middle">
            {Math.round(tir * 100)}%
          </text>
          <text y={44} fill={MUTED} fontSize={26} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
            TIME IN RANGE
          </text>
        </g>
      )}
      {/* meal markers */}
      {[0.3, 0.66].map((mt, i) => (
        <g key={i} opacity={draw > mt ? 1 : 0}>
          <line x1={xFor(mt)} y1={PT} x2={xFor(mt)} y2={PB} stroke="rgba(196,212,228,0.25)" strokeWidth={2} strokeDasharray="8 10" />
          <text x={xFor(mt)} y={PT - 24} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle">
            {i === 0 ? 'LUNCH' : 'DINNER'}
          </text>
        </g>
      ))}
    </svg>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(150,190,215,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Illustrative concept. Always follow your clinician's guidance for diabetes management.
    </div>
  );
};

export const GlucoseMonitoringFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <SensorPanel frame={frame} fps={fps} />
      <Graph frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
