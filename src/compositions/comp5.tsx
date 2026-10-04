/**
 * PerformanceReviewCycle.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * The annual performance review cycle as a vendor-neutral journey: goals are
 * set, the self-review lands, peer feedback rolls in, the manager reviews,
 * calibration balances the team, a rating is shared, and a growth plan opens.
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
const BG = '#0B0F1A';
const GRID = 'rgba(150,165,210,0.10)';
const INK = '#EDF1F8';
const MUTED = 'rgba(198,210,228,0.62)';
const INDIGO = '#818CF8';
const AMBER = '#FBBF24';
const GREEN = '#34D399';
const PINK = '#F472B6';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const STAGES = [
  {t: 'GOAL SETTING', s: 'OKRs agreed with manager', c: INDIGO},
  {t: 'SELF REVIEW', s: 'Wins, misses, and evidence', c: AMBER},
  {t: 'PEER FEEDBACK', s: 'Nominated colleagues weigh in', c: PINK},
  {t: 'MANAGER REVIEW', s: 'Assessment + written summary', c: INDIGO},
  {t: 'CALIBRATION', s: 'Ratings balanced across teams', c: AMBER},
  {t: 'GROWTH PLAN', s: 'Next cycle starts stronger', c: GREEN},
];
const S_START = [80, 200, 320, 440, 560, 700];
const CX = 1920;
const CY = 1150;
const RING = 560;

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(11,15,26,0)" />
      <stop offset="100%" stopColor="rgba(3,4,10,0.78)" />
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
            'radial-gradient(circle at 50% 30%, rgba(129,140,248,0.10), rgba(129,140,248,0.03) 45%, rgba(11,15,26,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="prc" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#prcvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(129,140,248,0.028)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`prc-p-x-${i}`) * 3840;
    const by = random(`prc-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`prc-p-s-${i}`) * 1.0;
    const ang = random(`prc-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.8));
    const sz = 2.5 + random(`prc-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? INDIGO : 'rgba(237,241,248,0.85)'} opacity={tw} />);
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
    const bx = random(`prc-d-x-${i}`) * 3840;
    const by = random(`prc-d-y-${i}`) * 2160;
    const jx = (random(`prc-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`prc-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`prc-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`prc-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#C9CFFA" opacity={o} />);
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
    const x = random(`prc-g-x-${frame}-${i}`) * 3840;
    const y = random(`prc-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`prc-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`prc-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'SET GOALS', 'SELF REVIEW', 'PEER FEEDBACK', 'MANAGER REVIEW', 'CALIBRATION',
  'SHARE THE RATING', 'GROWTH PLAN', 'FAIR · CONSISTENT · DOCUMENTED',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 1000;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 620} y={46} fill="rgba(129,140,248,0.7)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(129,140,248,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(129,140,248,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3320, y: 2090, t: 'PEOPLE OPS · CYCLE'},
    {x: 60, y: 130, t: 'ANNUAL REVIEW CYCLE'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={INDIGO} opacity={0.35 + blink * 0.55} />
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
        THE PERFORMANCE <span style={{color: INDIGO}}>REVIEW CYCLE</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        Six stages every great team runs — <span style={{color: INK, fontWeight: 700}}>fair, consistent, documented</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The cycle ring
// ---------------------------------------------------------------------------
const nodePos = (i: number) => {
  const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
  return {x: CX + Math.cos(a) * RING, y: CY + Math.sin(a) * RING, a};
};

const Cycle: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [50, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const prog = interpolate(frame, [S_START[0], S_START[5] + 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const active = STAGES.findIndex((_, i) => frame >= S_START[i] && (i === 5 || frame < S_START[i + 1]));
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, opacity: fade}}>
      <Defs p="prcc" />
      <circle cx={CX} cy={CY} r={RING} fill="none" stroke="rgba(129,140,248,0.22)" strokeWidth={6} />
      <circle cx={CX} cy={CY} r={RING} fill="none" stroke={INDIGO} strokeWidth={6} strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog} transform={`rotate(-90 ${CX} ${CY})`} filter="url(#prcglow)" />
      {/* center employee card */}
      <g>
        <circle cx={CX} cy={CY} r={200} fill="rgba(17,23,38,0.95)" stroke="rgba(129,140,248,0.5)" strokeWidth={4} />
        <circle cx={CX} cy={CY - 50} r={62} fill="none" stroke={INDIGO} strokeWidth={7} />
        <circle cx={CX} cy={CY - 72} r={24} fill={INDIGO} />
        <path d={`M ${CX - 42} ${CY + 8} a 42 34 0 0 1 84 0`} fill={INDIGO} />
        <text x={CX} y={CY + 90} fill={INK} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          Maya K.
        </text>
        <text x={CX} y={CY + 138} fill={MUTED} fontSize={30} fontFamily={FONT} textAnchor="middle">
          Product Designer
        </text>
      </g>
      {STAGES.map((st, i) => {
        const {x, y} = nodePos(i);
        const on = interpolate(frame - S_START[i], [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const isActive = i === active;
        const done = frame >= S_START[i] + 70;
        return (
          <g key={i} opacity={on}>
            {isActive && (
              <circle cx={x} cy={y} r={128} fill="none" stroke={st.c} strokeWidth={4} opacity={0.5 + 0.4 * Math.sin(frame * 0.15)} />
            )}
            <circle cx={x} cy={y} r={96} fill={done || isActive ? st.c : 'rgba(17,23,38,0.95)'} stroke={st.c} strokeWidth={4} filter="url(#prcglow)" />
            <text x={x} y={y - 12} fill={done || isActive ? '#0B0F1A' : st.c} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {i + 1}
            </text>
            <text x={x} y={y + 130} fill={isActive ? st.c : MUTED} fontSize={32} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={1}>
              {st.t}
            </text>
            {isActive && (
              <text x={x} y={y + 176} fill={MUTED} fontSize={28} fontFamily={FONT} textAnchor="middle">
                {st.s}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Detail cards that play in the corners per active stage
// ---------------------------------------------------------------------------
const Detail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const active = STAGES.findIndex((_, i) => frame >= S_START[i] && (i === 5 || frame < S_START[i + 1]));
  if (active < 0) return null;
  const t = frame - S_START[active];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 110}});
  const st = STAGES[active];
  const left = active % 2 === 0;
  const bx = left ? 150 : 3840 - 150 - 900;
  const cards: React.ReactNode[] = [
    // 0 goals
    <g key="d0">
      {['Ship onboarding v2', 'Mentor 2 juniors', 'Cut churn 8%'].map((g, i) => (
        <g key={i} opacity={interpolate(t - (15 + i * 18), [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <rect x={0} y={i * 96} width={820} height={76} rx={20} fill="rgba(129,140,248,0.10)" stroke={INDIGO} strokeWidth={2.5} />
          <circle cx={50} cy={i * 96 + 38} r={16} fill="none" stroke={INDIGO} strokeWidth={4} />
          <text x={90} y={i * 96 + 50} fill={INK} fontSize={34} fontFamily={FONT}>{g}</text>
        </g>
      ))}
    </g>,
    // 1 self review
    <g key="d1">
      {['3 big wins logged', '2 misses owned', 'Evidence attached'].map((g, i) => (
        <g key={i} opacity={interpolate(t - (15 + i * 18), [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <rect x={0} y={i * 96} width={820} height={76} rx={20} fill="rgba(251,191,36,0.08)" stroke={AMBER} strokeWidth={2.5} />
          <text x={40} y={i * 96 + 50} fill={AMBER} fontSize={34} fontFamily={FONT} fontWeight={700}>✎ {g}</text>
        </g>
      ))}
    </g>,
    // 2 peer feedback
    <g key="d2">
      {[0, 1, 2].map((i) => (
        <g key={i} opacity={interpolate(t - (15 + i * 18), [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <circle cx={50} cy={i * 96 + 38} r={34} fill={PINK} opacity={0.8} />
          <text x={50} y={i * 96 + 50} fill="#2B0A1E" fontSize={30} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            {['JT', 'AR', 'SK'][i]}
          </text>
          <rect x={110} y={i * 96} width={710} height={76} rx={20} fill="rgba(244,114,182,0.08)" stroke={PINK} strokeWidth={2.5} />
          <text x={140} y={i * 96 + 50} fill={INK} fontSize={32} fontFamily={FONT}>
            {['"Reliable under pressure"', '"Design eye is elite"', '"Great async writer"'][i]}
          </text>
        </g>
      ))}
    </g>,
    // 3 manager review
    <g key="d3">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} opacity={interpolate(t - (15 + i * 18), [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <rect x={i * 200} y={60} width={170} height={170} rx={20} fill={i < 3 ? 'rgba(129,140,248,0.16)' : 'rgba(129,140,248,0.04)'} stroke={INDIGO} strokeWidth={3} />
          <text x={i * 200 + 85} y={160} fill={i < 3 ? INDIGO : MUTED} fontSize={72} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            ★
          </text>
        </g>
      ))}
      <text x={0} y={300} fill={MUTED} fontSize={32} fontFamily={FONT}>
        Written summary + provisional rating
      </text>
    </g>,
    // 4 calibration
    <g key="d4">
      {[0, 1, 2, 3, 4].map((i) => {
        const h = [120, 200, 260, 200, 140][i];
        return (
          <g key={i} opacity={interpolate(t - (15 + i * 14), [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            <rect x={i * 160} y={280 - h} width={110} height={h} rx={14} fill={i === 2 ? AMBER : 'rgba(251,191,36,0.25)'} filter={i === 2 ? 'url(#prcglow)' : undefined} />
            <text x={i * 160 + 55} y={320} fill={MUTED} fontSize={26} fontFamily={MONO} textAnchor="middle">
              {['A', 'B', 'C', 'D', 'E'][i]}
            </text>
          </g>
        );
      })}
      <text x={0} y={390} fill={MUTED} fontSize={32} fontFamily={FONT}>
        Managers align ratings — no grade inflation
      </text>
    </g>,
    // 5 growth plan
    <g key="d5">
      <rect x={0} y={0} width={820} height={300} rx={24} fill="rgba(52,211,153,0.08)" stroke={GREEN} strokeWidth={3} filter="url(#prcglow)" />
      <text x={40} y={80} fill={GREEN} fontSize={44} fontFamily={FONT} fontWeight={800}>
        EXCEEDS EXPECTATIONS
      </text>
      {['Lead design system guild', 'Stretch: motion design'].map((g, i) => (
        <text key={i} x={40} y={160 + i * 60} fill={INK} fontSize={34} fontFamily={FONT}>
          → {g}
        </text>
      ))}
    </g>,
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g transform={`translate(${bx}, 1420)`} opacity={Math.min(1, s)}>
        <rect x={-40} y={-80} width={900} height={460} rx={28} fill="rgba(11,15,26,0.88)" stroke={st.c} strokeWidth={3} />
        <text x={0} y={-16} fill={st.c} fontSize={36} fontFamily={MONO} letterSpacing={3}>
          {st.t}
        </text>
        {cards[active]}
      </g>
    </svg>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(150,165,210,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Illustrative concept — every company's review process differs. Keep records fair and consistent.
    </div>
  );
};

export const PerformanceReviewCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <Cycle frame={frame} fps={fps} />
      <Detail frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
