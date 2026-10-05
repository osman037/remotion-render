/**
 * CollegeSavings529Journey.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * 529 college-savings mechanics: a baby (Class of 2044), a parent opens a 529
 * with the child named as beneficiary, monthly contributions drop in, the
 * growth curve steepens tax-free with a state-tax break, a tuition bill
 * arrives and the 529 pays it tax-free as a qualified expense, and the
 * leftover balance rolls into a Roth IRA under SECURE 2.0.
 * (529-specific mechanics only — beneficiary, qualified expenses, Roth
 * rollover escape hatch. Never generic compounding, never FAFSA.)
 */
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette — warm amber + navy on near-black
// ---------------------------------------------------------------------------
const BG = '#050B16';
const INK = '#EEF2F9';
const MUTED = 'rgba(196,210,232,0.62)';
const AMBER = '#FBBF24';
const AMBER_DK = '#B45309';
const NAVY = '#16294D';
const NAVY_LT = '#274069';
const GREEN = '#4ADE80';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// Deterministic fund model (frames drive the story)
const balAt = (f: number): number => {
  const c = interpolate(f, [240, 420], [0, 1800], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const g = interpolate(f, [420, 600], [0, 700], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = interpolate(f, [650, 710], [0, 1200], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return Math.max(0, c + g - s);
};
const BAL_MAX = 2500;

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}jar`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.85} />
      <stop offset="100%" stopColor="#B45309" stopOpacity={0.95} />
    </linearGradient>
    <linearGradient id={`${p}curve`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#274069" />
      <stop offset="60%" stopColor="#FBBF24" />
      <stop offset="100%" stopColor="#4ADE80" />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(5,11,22,0)" />
      <stop offset="100%" stopColor="rgba(2,5,11,0.8)" />
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
            'radial-gradient(circle at 62% 34%, rgba(251,191,36,0.12), rgba(251,191,36,0.04) 45%, rgba(5,11,22,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="cs529" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#cs529vig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(251,191,36,0.030)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`cs529-p-x-${i}`) * 3840;
    const by = random(`cs529-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`cs529-p-s-${i}`) * 1.0;
    const ang = random(`cs529-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.5));
    const sz = 2.5 + random(`cs529-p-z-${i}`) * 5;
    els.push(
      <circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? GREEN : 'rgba(251,191,36,0.8)'} opacity={tw} />
    );
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
    const bx = random(`cs529-d-x-${i}`) * 3840;
    const by = random(`cs529-d-y-${i}`) * 2160;
    const jx = (random(`cs529-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`cs529-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`cs529-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`cs529-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#E8D9B8" opacity={o} />);
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
    const x = random(`cs529-g-x-${frame}-${i}`) * 3840;
    const y = random(`cs529-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`cs529-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`cs529-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'BENEFICIARY: BABY', 'QUALIFIED EXPENSES', 'STATE TAX BREAK', 'TAX-FREE GROWTH',
  'ROTH ROLLOVER · SECURE 2.0', 'START EARLY',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 4200;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 700} y={46} fill="rgba(251,191,36,0.75)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
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
    {x: 3050, y: 2090, t: '529 COLLEGE SAVINGS'},
    {x: 2790, y: 130, t: 'BUSINESS · FAMILY FINANCE'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={AMBER} opacity={0.35 + blink * 0.55} />
          <text x={c.x + 24} y={c.y} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={3}>
            {c.t}
          </text>
        </g>
      ))}
    </svg>
  );
};

const Title: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [20, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [20, 60], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 130 + rise, left: 180, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        529 COLLEGE <span style={{color: AMBER}}>SAVINGS</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        Save for tuition · grow <span style={{color: AMBER, fontWeight: 700}}>tax-free</span> · spend tax-free on{' '}
        <span style={{color: AMBER, fontWeight: 700}}>qualified expenses</span>
      </div>
    </div>
  );
};

const BalanceHud: React.FC<{frame: number}> = ({frame}) => {
  const inAt = spring({frame: frame - 60, fps: 60, config: {damping: 200, stiffness: 90}});
  if (inAt <= 0.01) return null;
  const bal = balAt(frame);
  const fillC = interpolateColors(bal / BAL_MAX, [0, 0.5, 1], [AMBER_DK, AMBER, GREEN]);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={Math.min(1, inAt)} transform={`translate(2810, 150) scale(${0.9 + Math.min(1, inAt) * 0.1})`}>
        <rect x={0} y={0} width={880} height={230} rx={28} fill="rgba(4,9,18,0.92)" stroke={AMBER} strokeWidth={3} filter="url(#cs529glow)" />
        <text x={44} y={62} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={4}>529 BALANCE</text>
        <text x={44} y={158} fill={fillC} fontSize={92} fontFamily={MONO} fontWeight={800}>
          ${Math.floor(bal).toLocaleString('en-US')}
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 1 — Baby icon + Class of 2044 (frames 40–180)
// ---------------------------------------------------------------------------
const Baby: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 30 || frame > 200) return null;
  const fade = interpolate(frame, [160, 200], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = spring({frame: frame - 30, fps, config: {damping: 200, stiffness: 100}});
  const bob = Math.sin(frame * 0.09) * 10;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade * Math.min(1, s)} transform={`translate(800, ${760 + bob + (1 - Math.min(1, s)) * 120})`}>
        <circle cx={0} cy={-40} r={170} fill="#FDE8C8" stroke={AMBER} strokeWidth={6} filter="url(#cs529glow)" />
        <circle cx={-60} cy={-70} r={16} fill="#3A2E1E" />
        <circle cx={60} cy={-70} r={16} fill="#3A2E1E" />
        <path d="M -52 -14 Q 0 34 52 -14" fill="none" stroke="#3A2E1E" strokeWidth={10} strokeLinecap="round" />
        <circle cx={-105} cy={-20} r={22} fill="#F5B8A0" opacity={0.7} />
        <circle cx={105} cy={-20} r={22} fill="#F5B8A0" opacity={0.7} />
        {/* graduation cap */}
        <polygon points="-90,-200 0,-150 90,-200 0,-120" fill={NAVY} stroke={AMBER} strokeWidth={4} />
        <rect x={-16} y={-186} width={32} height={70} fill={NAVY} />
        <circle cx={90} cy={-130} r={12} fill={AMBER} />
        <text y={260} fill={INK} fontSize={72} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={4}>
          CLASS OF <tspan fill={AMBER}>2044</tspan>
        </text>
        <text y={330} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
          18 years of runway
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 2 — parent opens the 529 account card (frames 120–280)
// ---------------------------------------------------------------------------
const Open529: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 120 || frame > 300) return null;
  const fade = interpolate(frame, [260, 300], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = spring({frame: frame - 120, fps, config: {damping: 200, stiffness: 100}});
  const ben = spring({frame: frame - 190, fps, config: {damping: 200, stiffness: 120}});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade * Math.min(1, s)} transform={`translate(350, ${1180 + (1 - Math.min(1, s)) * 120})`}>
        <rect x={0} y={0} width={860} height={440} rx={30} fill="rgba(4,9,18,0.94)" stroke={AMBER} strokeWidth={5} filter="url(#cs529glow)" />
        <text x={48} y={98} fill={AMBER} fontSize={30} fontFamily={MONO} letterSpacing={5}>PARENT OPENS ACCOUNT</text>
        <text x={48} y={210} fill={INK} fontSize={110} fontFamily={FONT} fontWeight={800}>529 <tspan fill={AMBER}>PLAN</tspan></text>
        <text x={48} y={290} fill={MUTED} fontSize={34} fontFamily={FONT}>Named for education — parent stays in control</text>
        {ben > 0.01 && (
          <g opacity={Math.min(1, ben)} transform={`translate(48, ${330 + (1 - Math.min(1, ben)) * 30})`}>
            <rect x={0} y={0} width={600} height={76} rx={20} fill="rgba(251,191,36,0.12)" stroke={AMBER} strokeWidth={3} />
            <text x={28} y={50} fill={AMBER} fontSize={34} fontFamily={MONO} fontWeight={800}>
              BENEFICIARY: THE CHILD
            </text>
          </g>
        )}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// The fund jar (anchor, frames 240–900)
// ---------------------------------------------------------------------------
const JAR = {x: 2600, y: 900, w: 500, h: 720};
const jarY = (frac: number) => JAR.y + JAR.h - frac * JAR.h;

const Jar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 240) return null;
  const bal = balAt(frame);
  const frac = Math.min(1, bal / BAL_MAX);
  const fillC = interpolateColors(frac, [0, 0.5, 1], [AMBER_DK, AMBER, GREEN]);
  const inAt = spring({frame: frame - 240, fps, config: {damping: 200, stiffness: 100}});
  const y = jarY(frac);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <clipPath id="cs529jarclip">
        <rect x={JAR.x + 14} y={JAR.y + 14} width={JAR.w - 28} height={JAR.h - 28} rx={40} />
      </clipPath>
      <g opacity={Math.min(1, inAt)} transform={`translate(0, ${(1 - Math.min(1, inAt)) * 100})`}>
        <g clipPath="url(#cs529jarclip)">
          <rect x={JAR.x} y={y} width={JAR.w} height={JAR.y + JAR.h - y} fill="url(#cs529jar)" />
          <rect x={JAR.x} y={y} width={JAR.w} height={10} fill={fillC} opacity={0.9} />
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1={JAR.x} y1={JAR.y + t * JAR.h} x2={JAR.x + JAR.w} y2={JAR.y + t * JAR.h}
              stroke="rgba(255,255,255,0.10)" strokeWidth={2} strokeDasharray="10 10" />
          ))}
          <rect x={JAR.x} y={y + 40} width={JAR.w} height={26} fill="#FFFFFF" opacity={0.06 + 0.05 * Math.sin(frame * 0.2)} />
        </g>
        <rect x={JAR.x} y={JAR.y} width={JAR.w} height={JAR.h} rx={48} fill="rgba(251,191,36,0.05)" stroke={AMBER} strokeWidth={6} />
        <rect x={JAR.x + 40} y={JAR.y + 40} width={26} height={JAR.h - 120} rx={13} fill="#FFFFFF" opacity={0.14} />
        <rect x={JAR.x - 60} y={JAR.y - 44} width={JAR.w + 120} height={52} rx={20} fill="#1B2B4A" stroke={AMBER} strokeWidth={5} />
        <text x={JAR.x + JAR.w / 2} y={JAR.y + JAR.h + 96} fill={INK} fontSize={60} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={6}>
          529 FUND
        </text>
        <text x={JAR.x + JAR.w / 2} y={JAR.y - 80} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
          $200 / MONTH IN
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 3 — monthly contribution coins drop in (frames 240–430)
// ---------------------------------------------------------------------------
const DropCoins: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 240 || frame > 440) return null;
  const N = 44;
  const els: React.ReactElement[] = [];
  for (let i = 0; i < N; i++) {
    const p = interpolate(frame, [240 + i * 4, 240 + i * 4 + 55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    if (p <= 0 || p >= 1) continue;
    const x = 2850 + (random(`cs529-c-x-${i}`) - 0.5) * 320;
    const y = 120 + p * (810 - 120);
    const r = 24 + random(`cs529-c-r-${i}`) * 8;
    els.push(
      <g key={i} transform={`translate(${x}, ${y}) rotate(${p * 360})`} opacity={1 - p * p}>
        <circle cx={0} cy={0} r={r} fill="#FBBF24" opacity={0.95} />
        <circle cx={0} cy={0} r={r - 7} fill="none" stroke="#92400E" strokeWidth={3} />
        <text y={12} fill="#92400E" fontSize={30} fontFamily={MONO} fontWeight={800} textAnchor="middle">$</text>
      </g>
    );
  }
  const label = interpolate(frame, [240, 280], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={label}>
        <text x={2850} y={60} fill={AMBER} fontSize={34} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
          MONTHLY CONTRIBUTION
        </text>
      </g>
      {els}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 4a — state tax badge (frames 460–620)
// ---------------------------------------------------------------------------
const StateBadge: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 450 || frame > 640) return null;
  const s = spring({frame: frame - 450, fps, config: {damping: 200, stiffness: 110}});
  if (s <= 0.01) return null;
  const fade = interpolate(frame, [600, 640], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade * Math.min(1, s)} transform={`translate(2380, 620) scale(${Math.min(1, s)})`}>
        <rect x={-250} y={-90} width={500} height={180} rx={90} fill="rgba(39,64,105,0.95)" stroke={AMBER} strokeWidth={4} filter="url(#cs529glow)" />
        <text y={-8} fill={AMBER} fontSize={48} fontFamily={FONT} fontWeight={800} textAnchor="middle">STATE TAX</text>
        <text y={52} fill={INK} fontSize={48} fontFamily={FONT} fontWeight={800} textAnchor="middle">BREAK</text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 4b — tax-free growth curve steepens (frames 420–620)
// ---------------------------------------------------------------------------
const Curve: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 420 || frame > 640) return null;
  const fade = interpolate(frame, [600, 640], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const draw = interpolate(frame, [430, 600], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const PL = 350; const PR = 2200; const PT = 1080; const PB = 1700;
  const N = 120;
  const xFor = (i: number) => PL + (i / N) * (PR - PL);
  const yFor = (b: number) => PB - (b / 2700) * (PB - PT);
  let d = '';
  for (let i = 0; i <= N; i++) {
    const m = (i / N) * 216; // 18 years of months
    const b = 200 * m + 700 * Math.pow(m / 216, 1.9);
    d += `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(b).toFixed(1)} `;
  }
  const mNow = draw * 216;
  const bNow = 200 * mNow + 700 * Math.pow(mNow / 216, 1.9);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        {[0, 900, 1800, 2700].map((b) => (
          <g key={b}>
            <line x1={PL} y1={yFor(b)} x2={PR} y2={yFor(b)} stroke="rgba(251,191,36,0.14)" strokeWidth={1.5} />
            <text x={PL - 26} y={yFor(b) + 12} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="end">
              ${(b / 1000).toFixed(1)}k
            </text>
          </g>
        ))}
        <clipPath id="cs529clip">
          <rect x={PL - 6} y={PT - 60} width={draw * (PR - PL) + 12} height={PB - PT + 70} />
        </clipPath>
        <g clipPath="url(#cs529clip)">
          <path d={d} fill="none" stroke="url(#cs529curve)" strokeWidth={9} strokeLinecap="round"
            style={{filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.55))'}} />
        </g>
        {draw > 0.01 && draw < 0.999 && (
          <g>
            <circle cx={xFor(draw * N)} cy={yFor(bNow)} r={15} fill="#FFFFFF" style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))'}} />
            <text x={xFor(Math.min(draw * N, N - 18)) + 40} y={yFor(bNow) - 30} fill={AMBER} fontSize={40} fontFamily={MONO} fontWeight={800}>
              ${Math.round(bNow).toLocaleString('en-US')}
            </text>
          </g>
        )}
        <text x={PL} y={PT - 40} fill={GREEN} fontSize={36} fontFamily={FONT} fontWeight={800}>
          TAX-FREE GROWTH — the curve steepens
        </text>
        <text x={PL} y={PB + 64} fill={MUTED} fontSize={30} fontFamily={MONO}>AGE 0 → 18</text>
        <text x={PR} y={PB + 64} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="end">$200/mo × 18 yrs</text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 5 — tuition bill arrives, 529 pays it tax-free (frames 600–740)
// ---------------------------------------------------------------------------
const Tuition: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 590 || frame > 760) return null;
  const fade = interpolate(frame, [715, 755], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s1 = spring({frame: frame - 590, fps, config: {damping: 200, stiffness: 105}});
  const s2 = spring({frame: frame - 640, fps, config: {damping: 200, stiffness: 105}});
  const zap = interpolate(frame, [650, 700], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const st = spring({frame: frame - 685, fps, config: {damping: 200, stiffness: 130}});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        <g opacity={Math.min(1, s1)} transform={`translate(350, ${1120 + (1 - Math.min(1, s1)) * 120})`}>
          <rect x={0} y={0} width={700} height={480} rx={18} fill="#F5F0E1" stroke="#8A7B4F" strokeWidth={3} />
          <text x={44} y={84} fill="#4A4132" fontSize={38} fontFamily={FONT} fontWeight={800}>TUITION BILL</text>
          <text x={656} y={84} fill="#4A4132" fontSize={38} fontFamily={MONO} fontWeight={800} textAnchor="end">$1,200</text>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={44} y1={150 + i * 52} x2={656 - i * 90} y2={150 + i * 52} stroke="#B9AB83" strokeWidth={10} strokeLinecap="round" />
          ))}
          <text x={44} y={440} fill="#4A4132" fontSize={28} fontFamily={MONO}>UNIVERSITY · FALL 2044</text>
          {st > 0.01 && (
            <g opacity={Math.min(1, st)} transform={`translate(480, 310) rotate(${-14 + (1 - Math.min(1, st)) * -20}) scale(${Math.min(1, st)})`}>
              <rect x={-190} y={-70} width={380} height={140} rx={18} fill="none" stroke="#1F8A4C" strokeWidth={9} />
              <text y={30} fill="#1F8A4C" fontSize={76} fontFamily={FONT} fontWeight={800} textAnchor="middle">PAID</text>
            </g>
          )}
        </g>
        <g opacity={Math.min(1, s2)} transform={`translate(1150, ${1240 + (1 - Math.min(1, s2)) * 120})`}>
          <rect x={0} y={0} width={560} height={220} rx={26} fill="rgba(4,9,18,0.94)" stroke={AMBER} strokeWidth={4} filter="url(#cs529glow)" />
          <text x={36} y={80} fill={AMBER} fontSize={40} fontFamily={FONT} fontWeight={800}>529 PAYS</text>
          <text x={36} y={140} fill={MUTED} fontSize={30} fontFamily={FONT}>Qualified expense —</text>
          <text x={36} y={186} fill={GREEN} fontSize={30} fontFamily={FONT} fontWeight={700}>tax-free withdrawal</text>
        </g>
        <g opacity={zap}>
          <line x1={1070} y1={1360} x2={1130} y2={1360} stroke={AMBER} strokeWidth={7} strokeDasharray="18 12" />
          <polygon points="1130,1360 1104,1344 1104,1376" fill={AMBER} />
        </g>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 6 — leftover rolls to Roth IRA (SECURE 2.0) (frames 740–900)
// ---------------------------------------------------------------------------
const Roth: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 730) return null;
  const s1 = spring({frame: frame - 730, fps, config: {damping: 200, stiffness: 100}});
  const flow = interpolate(frame, [770, 850], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const badge = spring({frame: frame - 820, fps, config: {damping: 200, stiffness: 120}});
  const N = 14;
  const coins: React.ReactElement[] = [];
  for (let i = 0; i < N; i++) {
    const p = interpolate(frame, [770 + i * 4.5, 770 + i * 4.5 + 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    if (p <= 0 || p >= 1) continue;
    const x = 2560 + p * (1720 - 2560);
    const y = 1150 - Math.sin(p * Math.PI) * 220;
    coins.push(
      <g key={i} transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={26} fill="#4ADE80" opacity={0.95} />
        <text y={11} fill="#0A3D22" fontSize={30} fontFamily={MONO} fontWeight={800} textAnchor="middle">R</text>
      </g>
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={Math.min(1, s1)} transform={`translate(1150, ${1290 + (1 - Math.min(1, s1)) * 120})`}>
        <rect x={0} y={0} width={640} height={430} rx={30} fill="rgba(4,9,18,0.94)" stroke={GREEN} strokeWidth={5} filter="url(#cs529glow)" />
        <text x={44} y={96} fill={GREEN} fontSize={30} fontFamily={MONO} letterSpacing={5}>ESCAPE HATCH</text>
        <text x={44} y={200} fill={INK} fontSize={92} fontFamily={FONT} fontWeight={800}>ROTH <tspan fill={GREEN}>IRA</tspan></text>
        <text x={44} y={278} fill={MUTED} fontSize={32} fontFamily={FONT}>Leftover balance rolls over</text>
        <text x={44} y={336} fill={GREEN} fontSize={44} fontFamily={MONO} fontWeight={800}>
          ${Math.round(balAt(frame)).toLocaleString('en-US')}
        </text>
        <text x={44} y={392} fill={MUTED} fontSize={28} fontFamily={FONT}>no penalty, no tax</text>
      </g>
      <g opacity={flow}>
        <path d="M 2560 1150 Q 2140 900 1800 1330" fill="none" stroke={GREEN} strokeWidth={6} strokeDasharray="20 16" />
      </g>
      {coins}
      {badge > 0.01 && (
        <g opacity={Math.min(1, badge)} transform={`translate(1920, 780) scale(${Math.min(1, badge)})`}>
          <rect x={-330} y={-80} width={660} height={160} rx={80} fill="rgba(74,222,128,0.14)" stroke={GREEN} strokeWidth={5} filter="url(#cs529glow)" />
          <text y={-6} fill={GREEN} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">SECURE 2.0</text>
          <text y={52} fill={INK} fontSize={34} fontFamily={FONT} textAnchor="middle">leftover 529 → Roth IRA</text>
        </g>
      )}
    </svg>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(196,210,232,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Educational illustration — state rules and rollover limits vary. Not tax advice.
    </div>
  );
};

export const CollegeSavings529Journey: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <BalanceHud frame={frame} />
      <Baby frame={frame} fps={fps} />
      <Open529 frame={frame} fps={fps} />
      <Jar frame={frame} fps={fps} />
      <DropCoins frame={frame} />
      <StateBadge frame={frame} fps={fps} />
      <Curve frame={frame} />
      <Tuition frame={frame} fps={fps} />
      <Roth frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
