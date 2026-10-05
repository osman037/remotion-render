/**
 * HSAAccountMechanics.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * Account mechanics of a Health Savings Account: paycheck arrives, HDHP pairs
 * with the HSA, pre-tax dollars flow into the HSA jar, a tax shield appears,
 * the HSA debit card pays a medical bill tax-free, the balance crosses the
 * investment threshold, and the triple tax advantage lands: tax-free in,
 * tax-free growth, tax-free out on qualified expenses.
 * (Account mechanics only — contribute / spend / invest. Never enrollment
 * windows, never plan mechanics.)
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
// Palette — deep teal + gold on near-black
// ---------------------------------------------------------------------------
const BG = '#041210';
const INK = '#EDF5F2';
const MUTED = 'rgba(200,224,216,0.62)';
const TEAL = '#2DD4BF';
const TEAL_DK = '#0E7C6F';
const GOLD = '#FBBF24';
const GREEN = '#4ADE80';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// Deterministic balance model driven by frame (piecewise contribute/spend/invest)
const balAt = (f: number): number => {
  const c1 = interpolate(f, [240, 420], [0, 1750], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const spent = interpolate(f, [500, 560], [0, 200], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const c2 = interpolate(f, [560, 720], [0, 450], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const c3 = interpolate(f, [820, 900], [0, 300], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return Math.max(0, c1 - spent + c2 + c3);
};
const BAL_MAX = 2500;

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}jar`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.85} />
      <stop offset="100%" stopColor="#0E7C6F" stopOpacity={0.95} />
    </linearGradient>
    <linearGradient id={`${p}goldline`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={TEAL} />
      <stop offset="60%" stopColor={GOLD} />
      <stop offset="100%" stopColor={GREEN} />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(4,18,16,0)" />
      <stop offset="100%" stopColor="rgba(1,8,7,0.8)" />
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
            'radial-gradient(circle at 62% 34%, rgba(45,212,191,0.13), rgba(45,212,191,0.04) 45%, rgba(4,18,16,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="hsa" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#hsavig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(251,191,36,0.030)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`hsa-p-x-${i}`) * 3840;
    const by = random(`hsa-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`hsa-p-s-${i}`) * 1.0;
    const ang = random(`hsa-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.5));
    const sz = 2.5 + random(`hsa-p-z-${i}`) * 5;
    els.push(
      <circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? GOLD : 'rgba(45,212,191,0.8)'} opacity={tw} />
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
    const bx = random(`hsa-d-x-${i}`) * 3840;
    const by = random(`hsa-d-y-${i}`) * 2160;
    const jx = (random(`hsa-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`hsa-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`hsa-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`hsa-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#BFE6D8" opacity={o} />);
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
    const x = random(`hsa-g-x-${frame}-${i}`) * 3840;
    const y = random(`hsa-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`hsa-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`hsa-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'PRE-TAX IN', 'TAX-FREE GROWTH', 'TAX-FREE OUT', 'TRIPLE TAX ADVANTAGE',
  'HSA DEBIT CARD', 'YOUR MONEY — PORTABLE',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 4200;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 700} y={46} fill="rgba(45,212,191,0.75)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(45,212,191,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(45,212,191,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3110, y: 2090, t: 'HSA ACCOUNT MECHANICS'},
    {x: 2790, y: 130, t: 'BUSINESS · EMPLOYEE BENEFITS'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={TEAL} opacity={0.35 + blink * 0.55} />
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
        HSA ACCOUNT <span style={{color: TEAL}}>MECHANICS</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        Contribute <span style={{color: GOLD, fontWeight: 700}}>pre-tax</span> · spend{' '}
        <span style={{color: GOLD, fontWeight: 700}}>tax-free</span> · invest the surplus
      </div>
    </div>
  );
};

const BalanceHud: React.FC<{frame: number}> = ({frame}) => {
  const inAt = spring({frame: frame - 60, fps: 60, config: {damping: 200, stiffness: 90}});
  if (inAt <= 0.01) return null;
  const bal = balAt(frame);
  const cents = Math.floor((bal % 1) * 100);
  const fillC = interpolateColors(bal / BAL_MAX, [0, 0.5, 1], [TEAL_DK, TEAL, GOLD]);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={Math.min(1, inAt)} transform={`translate(2810, 150) scale(${0.9 + Math.min(1, inAt) * 0.1})`}>
        <rect x={0} y={0} width={880} height={230} rx={28} fill="rgba(3,12,10,0.92)" stroke={TEAL} strokeWidth={3} filter="url(#hsaglow)" />
        <text x={44} y={62} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={4}>HSA BALANCE</text>
        <text x={44} y={158} fill={fillC} fontSize={92} fontFamily={MONO} fontWeight={800}>
          ${Math.floor(bal).toLocaleString('en-US')}<tspan fontSize={44} fill={MUTED}>.{String(cents).padStart(2, '0')}</tspan>
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 1 — Paycheck arrives (frames 60–260)
// ---------------------------------------------------------------------------
const Paycheck: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 60 || frame > 270) return null;
  const fade = interpolate(frame, [210, 260], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 100}});
  const rows = [
    {t: 'FEDERAL TAX', v: '$620'},
    {t: 'STATE TAX', v: '$240'},
    {t: 'HSA CONTRIBUTION', v: '$350', hl: true},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade * Math.min(1, s)} transform={`translate(350, ${560 + (1 - Math.min(1, s)) * 120})`}>
        <rect x={0} y={0} width={920} height={540} rx={30} fill="rgba(3,14,11,0.94)" stroke={TEAL} strokeWidth={4} filter="url(#hsaglow)" />
        <text x={46} y={92} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={5}>PAY STUB · BIWEEKLY</text>
        <text x={46} y={180} fill={INK} fontSize={56} fontFamily={FONT} fontWeight={800}>GROSS PAY</text>
        <text x={874} y={180} fill={INK} fontSize={56} fontFamily={MONO} fontWeight={800} textAnchor="end">$5,000</text>
        <line x1={46} y1={220} x2={874} y2={220} stroke="rgba(45,212,191,0.25)" strokeWidth={2} />
        {rows.map((r, i) => {
          const ry = 300 + i * 72;
          const ron = interpolate(frame - (90 + i * 30), [0, 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <g key={i} opacity={ron}>
              <text x={46} y={ry} fill={r.hl ? GOLD : MUTED} fontSize={36} fontFamily={MONO} fontWeight={r.hl ? 800 : 400}>
                {r.hl ? '▸ ' : ''}{r.t}
              </text>
              <text x={874} y={ry} fill={r.hl ? GOLD : MUTED} fontSize={36} fontFamily={MONO} fontWeight={r.hl ? 800 : 400} textAnchor="end">
                {r.v}
              </text>
              {r.hl && (
                <rect x={30} y={ry - 50} width={860} height={70} rx={16} fill="none" stroke={GOLD} strokeWidth={3} strokeDasharray="14 10" opacity={0.9} />
              )}
            </g>
          );
        })}
        <text x={46} y={510} fill={TEAL} fontSize={30} fontFamily={MONO} letterSpacing={2}>HSA MONEY NEVER GETS TAXED</text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 2 — HDHP card pairs with HSA account card (frames 120–320)
// ---------------------------------------------------------------------------
const Pairing: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 120 || frame > 330) return null;
  const fade = interpolate(frame, [290, 330], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s1 = spring({frame: frame - 120, fps, config: {damping: 200, stiffness: 105}});
  const s2 = spring({frame: frame - 165, fps, config: {damping: 200, stiffness: 105}});
  const link = interpolate(frame, [210, 245], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        <g opacity={Math.min(1, s1)} transform={`translate(350, ${1180 + (1 - Math.min(1, s1)) * 120})`}>
          <rect x={0} y={0} width={760} height={420} rx={30} fill="rgba(3,14,11,0.94)" stroke={MUTED} strokeWidth={3} />
          <text x={44} y={96} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={5}>HEALTH PLAN</text>
          <text x={44} y={196} fill={INK} fontSize={96} fontFamily={FONT} fontWeight={800}>HDHP</text>
          <text x={44} y={270} fill={MUTED} fontSize={32} fontFamily={FONT}>High-deductible health plan</text>
          <text x={44} y={330} fill={MUTED} fontSize={32} fontFamily={FONT}>Unlocks HSA eligibility</text>
        </g>
        <g opacity={link}>
          <line x1={1140} y1={1390} x2={1220} y2={1390} stroke={TEAL} strokeWidth={7} strokeDasharray="16 12" />
          <polygon points="1236,1390 1212,1374 1212,1406" fill={TEAL} />
          <line x1={1140} y1={1440} x2={1220} y2={1440} stroke={GOLD} strokeWidth={7} strokeDasharray="16 12" />
          <polygon points="1124,1440 1148,1424 1148,1456" fill={GOLD} />
          <text x={1180} y={1350} fill={TEAL} fontSize={28} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>PAIRS WITH</text>
        </g>
        <g opacity={Math.min(1, s2)} transform={`translate(1250, ${1180 + (1 - Math.min(1, s2)) * 120})`}>
          <rect x={0} y={0} width={760} height={420} rx={30} fill="rgba(3,14,11,0.94)" stroke={TEAL} strokeWidth={5} filter="url(#hsaglow)" />
          <text x={44} y={96} fill={TEAL} fontSize={30} fontFamily={MONO} letterSpacing={5}>SAVINGS ACCOUNT</text>
          <text x={44} y={196} fill={TEAL} fontSize={96} fontFamily={FONT} fontWeight={800}>HSA</text>
          <text x={44} y={270} fill={MUTED} fontSize={32} fontFamily={FONT}>Health savings account</text>
          <text x={44} y={330} fill={MUTED} fontSize={32} fontFamily={FONT}>The money is yours forever</text>
        </g>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// The HSA jar (anchor, frames 240–900) + contribution coins + tax shield
// ---------------------------------------------------------------------------
const JAR = {x: 2600, y: 900, w: 500, h: 720};
const jarY = (frac: number) => JAR.y + JAR.h - frac * JAR.h;

const Coins: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 240 || frame > 460) return null;
  const N = 36;
  const sx = 810; const sy = 830; const ex = 2850; const ey = 930;
  const cx = 1800; const cy = 480;
  const els: React.ReactElement[] = [];
  for (let i = 0; i < N; i++) {
    const p = interpolate(frame, [240 + i * 4.5, 240 + i * 4.5 + 100], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    if (p <= 0 || p >= 1) continue;
    const mx = (1 - p) * (1 - p) * sx + 2 * (1 - p) * p * cx + p * p * ex;
    const my = (1 - p) * (1 - p) * sy + 2 * (1 - p) * p * cy + p * p * ey;
    const r = 26 + random(`hsa-c-r-${i}`) * 8;
    els.push(
      <g key={i} transform={`translate(${mx}, ${my}) rotate(${p * 540})`}>
        <circle cx={0} cy={0} r={r} fill="#FBBF24" opacity={0.95} />
        <circle cx={0} cy={0} r={r - 7} fill="none" stroke="#92400E" strokeWidth={3} />
        <text y={12} fill="#92400E" fontSize={30} fontFamily={MONO} fontWeight={800} textAnchor="middle">$</text>
      </g>
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <path d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`} fill="none" stroke="rgba(251,191,36,0.35)" strokeWidth={4} strokeDasharray="18 16" />
      {els}
    </svg>
  );
};

const Shield: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 330 || frame > 700) return null;
  const s = spring({frame: frame - 330, fps, config: {damping: 200, stiffness: 110}});
  if (s <= 0.01) return null;
  const fade = interpolate(frame, [660, 700], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade * Math.min(1, s)} transform={`translate(2420, 560) scale(${Math.min(1, s)})`}>
        <path d="M 110 0 L 220 44 L 220 130 C 220 210 165 262 110 290 C 55 262 0 210 0 130 L 0 44 Z"
          fill="rgba(251,191,36,0.14)" stroke={GOLD} strokeWidth={7} filter="url(#hsaglow)" />
        <text x={110} y={140} fill={GOLD} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">TAX</text>
        <text x={110} y={196} fill={GOLD} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">SHIELD</text>
        <text x={110} y={336} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle" letterSpacing={3}>PRE-TAX IN</text>
      </g>
    </svg>
  );
};

const Jar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 240) return null;
  const bal = balAt(frame);
  const frac = Math.min(1, bal / BAL_MAX);
  const fillC = interpolateColors(frac, [0, 0.45, 0.8], [TEAL_DK, TEAL, GOLD]);
  const inAt = spring({frame: frame - 240, fps, config: {damping: 200, stiffness: 100}});
  const y = jarY(frac);
  const thY = jarY(1000 / BAL_MAX);
  const thOn = interpolate(frame, [560, 600], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <clipPath id="hsajarclip">
        <rect x={JAR.x + 14} y={JAR.y + 14} width={JAR.w - 28} height={JAR.h - 28} rx={40} />
      </clipPath>
      <g opacity={Math.min(1, inAt)} transform={`translate(0, ${(1 - Math.min(1, inAt)) * 100})`}>
        {/* fill */}
        <g clipPath="url(#hsajarclip)">
          <rect x={JAR.x} y={y} width={JAR.w} height={JAR.y + JAR.h - y} fill="url(#hsajar)" />
          <rect x={JAR.x} y={y} width={JAR.w} height={10} fill={fillC} opacity={0.9} />
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1={JAR.x} y1={JAR.y + t * JAR.h} x2={JAR.x + JAR.w} y2={JAR.y + t * JAR.h}
              stroke="rgba(255,255,255,0.10)" strokeWidth={2} strokeDasharray="10 10" />
          ))}
          {/* rising shimmer */}
          <rect x={JAR.x} y={y + 40} width={JAR.w} height={26} fill="#FFFFFF" opacity={0.06 + 0.05 * Math.sin(frame * 0.2)} />
        </g>
        {/* glass */}
        <rect x={JAR.x} y={JAR.y} width={JAR.w} height={JAR.h} rx={48} fill="rgba(45,212,191,0.05)" stroke={TEAL} strokeWidth={6} />
        <rect x={JAR.x + 40} y={JAR.y + 40} width={26} height={JAR.h - 120} rx={13} fill="#FFFFFF" opacity={0.14} />
        {/* rim */}
        <rect x={JAR.x - 60} y={JAR.y - 44} width={JAR.w + 120} height={52} rx={20} fill="#0B2622" stroke={TEAL} strokeWidth={5} />
        <text x={JAR.x + JAR.w / 2} y={JAR.y + JAR.h + 96} fill={INK} fontSize={64} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={6}>
          HSA
        </text>
        {/* investment threshold */}
        <g opacity={thOn}>
          <line x1={JAR.x - 240} y1={thY} x2={JAR.x + JAR.w + 60} y2={thY} stroke={GOLD} strokeWidth={4} strokeDasharray="20 14" />
          <text x={JAR.x - 260} y={thY + 14} fill={GOLD} fontSize={30} fontFamily={MONO} textAnchor="end">
            INVESTABLE ABOVE $1,000
          </text>
        </g>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 4 — HSA debit card pays the medical bill (frames 460–660)
// ---------------------------------------------------------------------------
const Spend: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 440 || frame > 680) return null;
  const fade = interpolate(frame, [620, 670], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s1 = spring({frame: frame - 440, fps, config: {damping: 200, stiffness: 105}});
  const s2 = spring({frame: frame - 470, fps, config: {damping: 200, stiffness: 105}});
  const zap = interpolate(frame, [500, 555], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const st = spring({frame: frame - 545, fps, config: {damping: 200, stiffness: 130}});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        <g opacity={Math.min(1, s1)} transform={`translate(350, ${1180 + (1 - Math.min(1, s1)) * 120})`}>
          <rect x={0} y={0} width={760} height={420} rx={30} fill="#0B2B26" stroke={GOLD} strokeWidth={5} filter="url(#hsaglow)" />
          <text x={44} y={96} fill={GOLD} fontSize={30} fontFamily={MONO} letterSpacing={5}>HSA DEBIT CARD</text>
          <rect x={44} y={130} width={120} height={88} rx={12} fill="none" stroke={GOLD} strokeWidth={4} />
          <text x={44} y={300} fill={INK} fontSize={44} fontFamily={MONO} letterSpacing={4}>···· 4021</text>
          <text x={44} y={366} fill={MUTED} fontSize={30} fontFamily={FONT}>Pays clinics + pharmacies</text>
        </g>
        <g opacity={zap}>
          <path d="M 1130 1390 Q 1500 1290 1660 1390" fill="none" stroke={GOLD} strokeWidth={7} strokeDasharray="20 14" />
          <polygon points="1660,1390 1632,1372 1634,1408" fill={GOLD} />
        </g>
        <g opacity={Math.min(1, s2)} transform={`translate(1700, ${1180 + (1 - Math.min(1, s2)) * 120})`}>
          <rect x={0} y={0} width={680} height={460} rx={18} fill="#F5F0E1" stroke="#8A7B4F" strokeWidth={3} />
          <text x={44} y={84} fill="#4A4132" fontSize={38} fontFamily={FONT} fontWeight={800}>MEDICAL BILL</text>
          <text x={636} y={84} fill="#4A4132" fontSize={38} fontFamily={MONO} fontWeight={800} textAnchor="end">$200</text>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={44} y1={150 + i * 52} x2={636 - i * 90} y2={150 + i * 52} stroke="#B9AB83" strokeWidth={10} strokeLinecap="round" />
          ))}
          <text x={44} y={420} fill="#4A4132" fontSize={28} fontFamily={MONO}>CLINIC VISIT · RX</text>
          {st > 0.01 && (
            <g opacity={Math.min(1, st)} transform={`translate(470, 300) rotate(${-14 + (1 - Math.min(1, st)) * -20}) scale(${Math.min(1, st)})`}>
              <rect x={-190} y={-70} width={380} height={140} rx={18} fill="none" stroke="#1F8A4C" strokeWidth={9} />
              <text y={30} fill="#1F8A4C" fontSize={76} fontFamily={FONT} fontWeight={800} textAnchor="middle">PAID</text>
            </g>
          )}
        </g>
        {zap > 0.02 && (
          <text x={1300} y={1240} fill={GOLD} fontSize={34} fontFamily={MONO} fontWeight={800}>
            TAX-FREE <tspan fill={MUTED}>on qualified care</tspan>
          </text>
        )}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 5 — invest the surplus: sprout grows from the jar (frames 600–780)
// ---------------------------------------------------------------------------
const Sprout: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 590 || frame > 800) return null;
  const fade = interpolate(frame, [740, 800], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const g = spring({frame: frame - 600, fps, config: {damping: 200, stiffness: 70}});
  if (g <= 0.01) return null;
  const grow = Math.min(1, g);
  const fruits = [
    {x: -120, y: -330}, {x: 130, y: -380}, {x: 10, y: -470},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade} transform={`translate(2850, 880)`}>
        <path d={`M 0 0 C -40 ${-160 * grow}, 40 ${-320 * grow}, 0 ${-460 * grow}`} fill="none" stroke={GREEN} strokeWidth={18} strokeLinecap="round" />
        <path d={`M 0 ${-180 * grow} C -90 ${-200 * grow}, -150 ${-260 * grow}, -170 ${-330 * grow}`} fill="none" stroke={GREEN} strokeWidth={13} strokeLinecap="round" />
        <path d={`M 0 ${-240 * grow} C 90 ${-260 * grow}, 150 ${-320 * grow}, 170 ${-390 * grow}`} fill="none" stroke={GREEN} strokeWidth={13} strokeLinecap="round" />
        <ellipse cx={-190 * grow} cy={-350 * grow} rx={70 * grow} ry={40 * grow} fill={GREEN} opacity={0.85} transform={`rotate(-30 ${-190 * grow} ${-350 * grow})`} />
        <ellipse cx={190 * grow} cy={-410 * grow} rx={70 * grow} ry={40 * grow} fill={GREEN} opacity={0.85} transform={`rotate(30 ${190 * grow} ${-410 * grow})`} />
        {fruits.map((f, i) => {
          const on = interpolate(grow - (0.55 + i * 0.12), [0, 0.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          if (on <= 0) return null;
          return (
            <g key={i} opacity={on}>
              <circle cx={f.x} cy={f.y} r={30} fill={GOLD} filter="url(#hsaglow)" />
              <text x={f.x} y={f.y + 11} fill="#92400E" fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle">$</text>
            </g>
          );
        })}
        {grow > 0.6 && (
          <text x={0} y={-560} fill={GREEN} fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            INVEST THE SURPLUS
          </text>
        )}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 6 — payoff badge: TRIPLE TAX-FREE (frames 720–870)
// ---------------------------------------------------------------------------
const Payoff: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 700 || frame > 890) return null;
  const fade = interpolate(frame, [845, 885], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const b = spring({frame: frame - 710, fps, config: {damping: 200, stiffness: 95}});
  if (b <= 0.01) return null;
  const rows = [
    {t: 'CONTRIBUTE', s: 'PRE-TAX'},
    {t: 'GROWTH', s: 'TAX-FREE'},
    {t: 'SPEND', s: 'TAX-FREE'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade * Math.min(1, b)} transform={`translate(1920, 980) scale(${0.85 + Math.min(1, b) * 0.15})`}>
        <rect x={-850} y={-330} width={1700} height={660} rx={70} fill="rgba(3,12,10,0.96)" stroke={GOLD} strokeWidth={6} filter="url(#hsaglow)" />
        <text y={-200} fill={GOLD} fontSize={44} fontFamily={MONO} letterSpacing={10} textAnchor="middle">THE PAYOFF</text>
        <text y={-70} fill={INK} fontSize={120} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          TRIPLE <tspan fill={GOLD}>TAX-FREE</tspan>
        </text>
        {rows.map((r, i) => {
          const ron = interpolate(frame - (750 + i * 40), [0, 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <g key={i} opacity={ron}>
              <text x={-560} y={110 + i * 78} fill={MUTED} fontSize={42} fontFamily={MONO} letterSpacing={2} textAnchor="end">{r.t}</text>
              <text x={-480} y={110 + i * 78} fill={TEAL} fontSize={42} fontFamily={MONO} fontWeight={800}>{r.s}</text>
              {i < 2 && <line x1={-560} y1={150 + i * 78} x2={560} y2={150 + i * 78} stroke="rgba(45,212,191,0.18)" strokeWidth={2} />}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 7 — age 65: jar keeps growing (frames 840–900)
// ---------------------------------------------------------------------------
const Age65: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 830) return null;
  const s = spring({frame: frame - 830, fps, config: {damping: 200, stiffness: 110}});
  if (s <= 0.01) return null;
  const o = Math.min(1, s);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={o} transform={`translate(3350, 560) scale(${o})`}>
        <rect x={-230} y={-110} width={460} height={220} rx={40} fill="rgba(3,12,10,0.94)" stroke={GOLD} strokeWidth={5} filter="url(#hsaglow)" />
        <text y={-10} fill={GOLD} fontSize={88} fontFamily={FONT} fontWeight={800} textAnchor="middle">65+</text>
        <text y={62} fill={MUTED} fontSize={34} fontFamily={MONO} letterSpacing={3} textAnchor="middle">AGE</text>
      </g>
      <g opacity={o}>
        <text x={3350} y={1740} fill={INK} fontSize={40} fontFamily={FONT} fontWeight={700} textAnchor="middle">
          After 65, it behaves like a retirement account
        </text>
        <text x={3350} y={1800} fill={TEAL} fontSize={36} fontFamily={FONT} textAnchor="middle">
          the jar keeps growing
        </text>
      </g>
    </svg>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(200,224,216,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Educational illustration of account mechanics — limits and rules change over time. Not tax advice.
    </div>
  );
};

export const HSAAccountMechanics: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <BalanceHud frame={frame} />
      <Paycheck frame={frame} fps={fps} />
      <Pairing frame={frame} fps={fps} />
      <Jar frame={frame} fps={fps} />
      <Coins frame={frame} />
      <Shield frame={frame} fps={fps} />
      <Spend frame={frame} fps={fps} />
      <Sprout frame={frame} fps={fps} />
      <Payoff frame={frame} fps={fps} />
      <Age65 frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
