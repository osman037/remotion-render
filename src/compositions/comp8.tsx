/**
 * CompoundInterestJourney.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * A beginner opens a brokerage account, deposits a first $100, buys one index
 * fund share — and watches compounding bend the curve: each year's growth is
 * bigger than the last as earnings start earning their own earnings.
 * (Beginner-investing framing only — never retirement planning.)
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
const BG = '#07110C';
const GRID = 'rgba(160,205,175,0.10)';
const AXIS = 'rgba(160,205,175,0.55)';
const INK = '#EEF5F0';
const MUTED = 'rgba(200,220,208,0.62)';
const GREEN = '#4ADE80';
const GOLD = '#FBBF24';
const BLUE = '#5AC8FA';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// Compounding model: $100 start, 8% annual, 30 years. Deterministic.
const START_BAL = 100;
const RATE = 0.08;
const YEARS = 30;
const balAt = (y: number) => START_BAL * Math.pow(1 + RATE, y);
const FINAL_BAL = balAt(YEARS);

const PL = 340;
const PR = 3500;
const PT = 620;
const PB = 1560;
const PW = PR - PL;
const PH = PB - PT;
const xFor = (y: number) => PL + (y / YEARS) * PW;
const yFor = (b: number) => PB - (b / (FINAL_BAL * 1.08)) * PH;

function curvePath(): string {
  let d = '';
  const N = 240;
  for (let i = 0; i <= N; i++) {
    const y = (i / N) * YEARS;
    d += `${i === 0 ? 'M' : 'L'} ${xFor(y).toFixed(1)} ${yFor(balAt(y)).toFixed(1)} `;
  }
  return d;
}
const LINE = curvePath();

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}line`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={BLUE} />
      <stop offset="55%" stopColor={GREEN} />
      <stop offset="100%" stopColor={GOLD} />
    </linearGradient>
    <linearGradient id={`${p}area`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={GOLD} stopOpacity={0.28} />
      <stop offset="60%" stopColor={GOLD} stopOpacity={0.06} />
      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(7,17,12,0)" />
      <stop offset="100%" stopColor="rgba(3,8,5,0.78)" />
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
            'radial-gradient(circle at 50% 30%, rgba(251,191,36,0.10), rgba(251,191,36,0.03) 45%, rgba(7,17,12,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="ci" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#civig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(251,191,36,0.028)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`ci-p-x-${i}`) * 3840;
    const by = random(`ci-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`ci-p-s-${i}`) * 1.0;
    const ang = random(`ci-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.5));
    const sz = 2.5 + random(`ci-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? GOLD : 'rgba(238,245,240,0.85)'} opacity={tw} />);
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
    const bx = random(`ci-d-x-${i}`) * 3840;
    const by = random(`ci-d-y-${i}`) * 2160;
    const jx = (random(`ci-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`ci-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`ci-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`ci-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#EBD9A8" opacity={o} />);
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
    const x = random(`ci-g-x-${frame}-${i}`) * 3840;
    const y = random(`ci-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`ci-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`ci-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'START WITH $100', 'EARNINGS EARN EARNINGS', '8% ANNUAL GROWTH', 'TIME DOES THE HEAVY LIFTING',
  'THE 8TH WONDER OF THE WORLD', 'START EARLY · STAY INVESTED',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 1000;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 680} y={46} fill="rgba(251,191,36,0.7)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(251,191,36,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(251,191,36,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3290, y: 2090, t: 'INVESTING · FIRST STEPS'},
    {x: 60, y: 130, t: 'BEGINNER ONBOARDING SIM'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={GOLD} opacity={0.35 + blink * 0.55} />
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
        COMPOUND <span style={{color: GOLD}}>INTEREST</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        One <span style={{color: GOLD, fontWeight: 700}}>$100</span> share today — watch earnings start earning their own earnings
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Onboarding beat (frames 60–240): account → deposit → first share
// ---------------------------------------------------------------------------
const Onboard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 60 || frame > 300) return null;
  const t = frame - 60;
  const fade = interpolate(frame, [270, 300], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const steps = [
    {t: 'OPEN A BROKERAGE ACCOUNT', s: 'takes minutes online'},
    {t: 'DEPOSIT YOUR FIRST $100', s: 'link your bank, transfer in'},
    {t: 'BUY 1 INDEX-FUND SHARE', s: 'own a slice of 500 companies'},
  ];
  return (
    <g opacity={fade}>
      {steps.map((st, i) => {
        const s = spring({frame: t - i * 55, fps, config: {damping: 200, stiffness: 110}});
        if (s <= 0.001) return null;
        const x = 700 + i * 810;
        return (
          <g key={i} opacity={Math.min(1, s)} transform={`translate(${x}, ${1150 + (1 - Math.min(1, s)) * 80})`}>
            <circle cx={0} cy={-190} r={110} fill="rgba(251,191,36,0.10)" stroke={GOLD} strokeWidth={5} filter="url(#ciglow)" />
            <text y={-172} fill={GOLD} fontSize={80} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {i + 1}
            </text>
            <text y={-20} fill={INK} fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {st.t}
            </text>
            <text y={44} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
              {st.s}
            </text>
            {i === 2 && s > 0.9 && (
              <g>
                <rect x={-190} y={110} width={380} height={150} rx={24} fill="#0E1F14" stroke={GREEN} strokeWidth={4} />
                <text y={172} fill={GREEN} fontSize={56} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                  $100 ✓
                </text>
                <text y={226} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="middle">
                  1 share owned
                </text>
              </g>
            )}
          </g>
        );
      })}
      {steps.map((_, i) => {
        if (i === 0) return null;
        const on = interpolate(t - (i * 55 + 30), [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <line key={`a${i}`} x1={700 + (i - 1) * 810 + 320} y1={1150} x2={700 + i * 810 - 320} y2={1150}
            stroke={GOLD} strokeWidth={6} strokeDasharray="18 14" opacity={on} />
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// The compounding curve (frames 280–860)
// ---------------------------------------------------------------------------
const Curve: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 280) return null;
  const draw = interpolate(frame, [300, 780], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const yNow = draw * YEARS;
  const balNow = balAt(yNow);
  // linear reference (simple interest) for contrast
  const linNow = START_BAL + (START_BAL * RATE) * yNow;
  const front = draw * YEARS;
  // milestone callouts
  const miles = [
    {y: 10, t: 'YEAR 10', s: `$${Math.round(balAt(10))} — slow start`},
    {y: 20, t: 'YEAR 20', s: `$${Math.round(balAt(20))} — curve bends`},
    {y: 30, t: 'YEAR 30', s: `$${Math.round(balAt(30))} — snowball`},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs p="cic" />
      {[500, 2000, 4000, 6000, 8000, 10000].map((b) => (
        <g key={b}>
          <line x1={PL} y1={yFor(b)} x2={PR} y2={yFor(b)} stroke={GRID} strokeWidth={1.5} />
          <text x={PL - 26} y={yFor(b) + 12} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="end">
            ${(b / 1000).toFixed(0)}k
          </text>
        </g>
      ))}
      {[0, 5, 10, 15, 20, 25, 30].map((y) => (
        <g key={y}>
          <line x1={xFor(y)} y1={PB} x2={xFor(y)} y2={PB + 14} stroke={AXIS} strokeWidth={1.5} />
          <text x={xFor(y)} y={PB + 58} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle">
            YR {y}
          </text>
        </g>
      ))}
      <line x1={PL} y1={PB} x2={PR} y2={PB} stroke={AXIS} strokeWidth={2} />
      <line x1={PL} y1={PT} x2={PL} y2={PB} stroke={AXIS} strokeWidth={2} />
      {/* simple-interest dashed reference */}
      <line x1={PL} y1={yFor(START_BAL)} x2={xFor(front)} y2={yFor(linNow)} stroke="rgba(200,220,208,0.45)" strokeWidth={3} strokeDasharray="16 14" />
      <text x={xFor(Math.min(front, 26)) + 20} y={yFor(linNow) - 20} fill={MUTED} fontSize={28} fontFamily={MONO}>
        simple interest
      </text>
      {/* area + curve clipped */}
      <clipPath id="ciclip">
        <rect x={PL - 6} y={PT - 80} width={draw * PW + 12} height={PH + 90} />
      </clipPath>
      <g clipPath="url(#ciclip)">
        <path d={`${LINE} L ${xFor(30).toFixed(1)} ${PB} L ${xFor(0).toFixed(1)} ${PB} Z`} fill="url(#cicarea)" />
      </g>
      <path d={LINE} fill="none" stroke="url(#cicline)" strokeWidth={8} strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw}
        style={{filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.55))'}} />
      {/* live readout */}
      {draw > 0.01 && draw < 0.999 && (
        <g>
          <circle cx={xFor(front)} cy={yFor(balNow)} r={34} fill={GOLD} opacity={0.2} />
          <circle cx={xFor(front)} cy={yFor(balNow)} r={14} fill="#FFFFFF" style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))'}} />
          <g transform={`translate(${xFor(front) > PR - 640 ? xFor(front) - 560 : xFor(front) + 44}, ${yFor(balNow) - 60})`}>
            <rect x={0} y={-60} width={520} height={150} rx={18} fill="rgba(8,16,11,0.94)" stroke={GOLD} strokeWidth={2.5} />
            <text x={28} y={-8} fill={MUTED} fontSize={28} fontFamily={MONO}>YEAR {Math.floor(front)}</text>
            <text x={28} y={56} fill={GOLD} fontSize={58} fontFamily={MONO} fontWeight={800}>
              ${Math.round(balNow).toLocaleString('en-US')}
            </text>
          </g>
          {/* yearly growth bar */}
          <text x={PL + 20} y={PT - 30} fill={MUTED} fontSize={30} fontFamily={MONO}>
            THIS YEAR'S GROWTH: <tspan fill={GREEN} fontWeight={800}>+${Math.round(balNow * RATE).toLocaleString('en-US')}</tspan>
            {'  '}({front > 1 ? `vs +$${Math.round(START_BAL * RATE)} in year 1` : ''})
          </text>
        </g>
      )}
      {/* milestones */}
      {miles.map((m, i) => {
        const on = interpolate(draw * YEARS - m.y, [0, 1.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (on <= 0) return null;
        return (
          <g key={i} opacity={on}>
            <circle cx={xFor(m.y)} cy={yFor(balAt(m.y))} r={12} fill={GOLD} />
            <line x1={xFor(m.y)} y1={yFor(balAt(m.y))} x2={xFor(m.y)} y2={yFor(balAt(m.y)) - 150} stroke={GOLD} strokeWidth={2.5} opacity={0.7} />
            <text x={xFor(m.y)} y={yFor(balAt(m.y)) - 165} fill={GOLD} fontSize={34} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {m.t}
            </text>
            <text x={xFor(m.y)} y={yFor(balAt(m.y)) - 120} fill={MUTED} fontSize={28} fontFamily={FONT} textAnchor="middle">
              {m.s}
            </text>
          </g>
        );
      })}
      {/* payoff */}
      {(() => {
        const b = spring({frame: frame - 800, fps, config: {damping: 200, stiffness: 95}});
        if (b <= 0.01) return null;
        return (
          <g opacity={Math.min(1, b)} transform={`translate(1920, 1050) scale(${0.85 + Math.min(1, b) * 0.15})`}>
            <rect x={-640} y={-150} width={1280} height={300} rx={60} fill="rgba(8,16,11,0.94)" stroke={GOLD} strokeWidth={4} filter="url(#ciglow)" />
            <text y={-40} fill={GOLD} fontSize={72} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              $100 → ${Math.round(FINAL_BAL).toLocaleString('en-US')}
            </text>
            <text y={60} fill={INK} fontSize={44} fontFamily={FONT} fontWeight={700} textAnchor="middle">
              in 30 years — the 8th wonder of the world
            </text>
          </g>
        );
      })()}
    </svg>
  );
};

const Stage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => (
  <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
    <Onboard frame={frame} fps={fps} />
  </svg>
);

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(160,205,175,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Illustrative simulation at a steady 8% — real markets fluctuate. Not investment advice.
    </div>
  );
};

export const CompoundInterestJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <Stage frame={frame} fps={fps} />
      <Curve frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
