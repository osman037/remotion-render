/**
 * CreditScoreBuilding.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A cinematic personal-finance visual for credit-counseling firms, fintech
 * educators and lenders: a credit score dial climbs 300 to 850 while the
 * five FICO factors fill as arc segments around it. Utilization dips under
 * 30%, the 740 line flashes an EXCELLENT badge, and the payoff locks in the
 * final score. Deterministic seeded randomness only.
 *
 * Register in Root.tsx:
 *   <Composition id="CreditScoreBuilding" component={CreditScoreBuilding}
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
// Palette (midnight finance, score arc red -> gold -> green)
// ---------------------------------------------------------------------------
const BG = '#060A13';
const INK = '#F2F6FD';
const MUTED = 'rgba(242,246,253,0.60)';
const FAINT = 'rgba(242,246,253,0.32)';
const RED = '#F87171';
const AMBER = '#FBBF24';
const GOLD = '#FBBF24';
const GREEN = '#34D399';
const TEAL = '#2DD4BF';
const CYAN = '#67E8F9';
const BLUE = '#60A5FA';
const PANEL = 'rgba(8,12,24,0.90)';
const HAIRLINE = 'rgba(242,246,253,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const SCORE_START = 90;
const SCORE_END = 800;
const PAYOFF_START = 810;

interface Factor {
  name: string;
  sub: string;
  weight: number;   // share of the 550-point climb
  at: number;       // frame its fill begins
  color: string;
}
const FACTORS: Factor[] = [
  {name: 'Payment History', sub: 'ON-TIME PAYMENTS', weight: 0.35, at: 120, color: TEAL},
  {name: 'Credit Utilization', sub: 'BALANCE VS LIMIT', weight: 0.30, at: 260, color: CYAN},
  {name: 'Credit Age', sub: 'OLDEST ACCOUNT 9 YRS', weight: 0.15, at: 400, color: BLUE},
  {name: 'Credit Mix', sub: 'CARD + LOAN + MORTGAGE', weight: 0.10, at: 530, color: AMBER},
  {name: 'New Inquiries', sub: '0 HARD PULLS / 12 MO', weight: 0.10, at: 650, color: GREEN},
];
const RANGE = 550; // 300 -> 850
const factorFill = (fi: number, frame: number) =>
  interpolate(frame, [FACTORS[fi].at, FACTORS[fi].at + 100], [0, 1], clamp01);
const scoreAt = (frame: number) =>
  300 + FACTORS.reduce((a, f, i) => a + f.weight * RANGE * factorFill(i, frame), 0);
const utilAt = (frame: number) =>
  68 - 46 * interpolate(frame, [FACTORS[1].at, FACTORS[1].at + 130], [0, 1], clamp01) +
  0.8 * Math.sin(frame * 0.07);

// ---------------------------------------------------------------------------
// Dial geometry
// ---------------------------------------------------------------------------
const CX = 1150;
const CY = 1210;
const R = 560;
const ang = (score: number) => Math.PI - ((score - 300) / RANGE) * Math.PI;
const px = (r: number, a: number) => CX + r * Math.cos(a);
const py = (r: number, a: number) => CY + r * Math.sin(a);
const arcPath = (r: number, s0: number, s1: number) => {
  const a0 = ang(s0);
  const a1 = ang(s1);
  return `M ${px(r, a0).toFixed(1)} ${py(r, a0).toFixed(1)} A ${r} ${r} 0 0 1 ${px(r, a1).toFixed(1)} ${py(r, a1).toFixed(1)}`;
};
const TIERS = [
  {label: 'POOR', lo: 300, hi: 579, color: RED},
  {label: 'FAIR', lo: 580, hi: 669, color: '#FB923C'},
  {label: 'GOOD', lo: 670, hi: 739, color: AMBER},
  {label: 'VERY GOOD', lo: 740, hi: 799, color: TEAL},
  {label: 'EXCEPTIONAL', lo: 800, hi: 850, color: GREEN},
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="csGlow" cx="36%" cy="30%" r="80%">
      <stop offset="0%" stopColor="rgba(45,212,191,0.10)" />
      <stop offset="45%" stopColor="rgba(96,165,250,0.05)" />
      <stop offset="100%" stopColor="rgba(6,10,19,0)" />
    </radialGradient>
    <radialGradient id="csVignette" cx="50%" cy="50%" r="76%">
      <stop offset="58%" stopColor="rgba(3,5,10,0)" />
      <stop offset="100%" stopColor="rgba(1,2,6,0.80)" />
    </radialGradient>
    <linearGradient id="csScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(103,232,249,0)" />
      <stop offset="50%" stopColor="rgba(103,232,249,0.12)" />
      <stop offset="100%" stopColor="rgba(103,232,249,0)" />
    </linearGradient>
    <linearGradient id="csArc" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={RED} />
      <stop offset="45%" stopColor={AMBER} />
      <stop offset="100%" stopColor={GREEN} />
    </linearGradient>
    <linearGradient id="csPayoff" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={TEAL} />
      <stop offset="55%" stopColor={GREEN} />
      <stop offset="100%" stopColor={GOLD} />
    </linearGradient>
    <filter id="csBlur70" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
    <filter id="csBlur16" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="16" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const drift = Math.sin((frame / 900) * Math.PI * 2) * 90;
  const scanY = (frame / 900) * 2500 - 300;
  const orbs: React.ReactElement[] = [];
  for (let i = 0; i < 6; i++) {
    const ox = random(`cs-orb-x-${i}`) * 3840;
    const oy = random(`cs-orb-y-${i}`) * 2160;
    const r = 260 + random(`cs-orb-r-${i}`) * 320;
    const hue =
      i % 3 === 0
        ? 'rgba(45,212,191,0.08)'
        : i % 3 === 1
        ? 'rgba(96,165,250,0.07)'
        : 'rgba(52,211,153,0.06)';
    const mx = Math.sin((frame / 900) * Math.PI * 2 + i * 1.8) * 120;
    const my = Math.cos((frame / 900) * Math.PI * 2 + i * 2.2) * 90;
    orbs.push(<circle key={i} cx={ox + mx} cy={oy + my} r={r} fill={hue} filter="url(#csBlur70)" />);
  }
  const dots: React.ReactElement[] = [];
  for (let gx = 70; gx < 3840; gx += 175) {
    for (let gy = 70; gy < 2160; gy += 175) {
      const jx = (random(`cs-dot-x-${gx}-${gy}`) - 0.5) * 26;
      const jy = (random(`cs-dot-y-${gx}-${gy}`) - 0.5) * 26;
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx + jx} cy={gy + jy} r={2.2} fill="rgba(242,246,253,0.05)" />
      );
    }
  }
  const hairlines: React.ReactElement[] = [];
  for (let gx = 0; gx <= 3840; gx += 480) {
    hairlines.push(<line key={`v${gx}`} x1={gx} y1={0} x2={gx} y2={2160} stroke="rgba(242,246,253,0.035)" strokeWidth={1} />);
  }
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect width={3840} height={2160} fill="url(#csGlow)" transform={`translate(${drift},${-drift * 0.6})`} />
        {orbs}
        <g transform={`translate(${drift * 0.4},0)`}>{dots}</g>
        {hairlines}
        <rect x={0} y={scanY} width={3840} height={340} fill="url(#csScan)" />
        <rect width={3840} height={2160} fill="url(#csVignette)" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const rise = spring({frame, fps, config: {damping: 200, stiffness: 90, mass: 1}});
  const y = interpolate(rise, [0, 1], [70, 0]);
  const opacity = interpolate(rise, [0, 1], [0, 1]);
  const blink = 0.6 + 0.4 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div style={{position: 'absolute', top: 118, left: 220, right: 220, opacity, transform: `translateY(${y}px)`}}>
      <div style={{display: 'flex', alignItems: 'flex-start'}}>
        <div>
          <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 14, color: CYAN}}>
            PERSONAL FINANCE &nbsp;·&nbsp; CREDIT HEALTH
          </div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 148, color: INK, marginTop: 16, letterSpacing: -2}}>
            Credit Score Building
          </div>
          <div style={{fontFamily: FONT, fontSize: 40, color: MUTED, marginTop: 14}}>
            Five scoring factors, one dial — 300 to 850 in 15 seconds
          </div>
        </div>
        <div style={{marginLeft: 'auto', textAlign: 'right'}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 22, border: `2px solid ${TEAL}`, borderRadius: 16, padding: '14px 32px', backgroundColor: 'rgba(6,12,12,0.6)'}}>
            <div style={{width: 24, height: 24, borderRadius: 12, backgroundColor: TEAL, opacity: blink, boxShadow: `0 0 26px ${TEAL}`}} />
            <div style={{fontFamily: MONO, fontSize: 40, fontWeight: 700, color: INK, letterSpacing: 4}}>
              FICO FACTORS
            </div>
          </div>
          <div style={{fontFamily: MONO, fontSize: 32, color: FAINT, marginTop: 14}}>
            300 → 850 RANGE · 5 FACTORS
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Score dial: tiered arc, factor segments, needle, score history sparkline
// ---------------------------------------------------------------------------
const ScoreDial: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 80}});
  const score = scoreAt(frame);
  const prog = (score - 300) / RANGE;
  const tier = TIERS.find((t) => score >= t.lo && score <= t.hi) ?? TIERS[0];
  const excellent = score >= 740;
  const exS = spring({frame: frame - 560, fps, config: {damping: 200, stiffness: 120}});

  // factor arc segments on the inner ring (r - 90), proportional to weight
  const segs: React.ReactElement[] = [];
  let acc = 300;
  FACTORS.forEach((f, i) => {
    const fill = factorFill(i, frame);
    if (fill <= 0.001) return;
    const s0 = acc;
    const s1 = acc + f.weight * RANGE * fill;
    acc += f.weight * RANGE;
    segs.push(
      <path
        key={i}
        d={arcPath(R - 96, s0, s1)}
        fill="none"
        stroke={f.color}
        strokeWidth={34}
        strokeLinecap="round"
        style={{filter: `drop-shadow(0 0 12px ${f.color})`}}
      />
    );
  });

  // tick marks every 50 points, labels every 100
  const ticks: React.ReactElement[] = [];
  for (let s = 300; s <= 850; s += 50) {
    const a = ang(s);
    const major = s % 100 === 0;
    const x1 = px(R - (major ? 44 : 26), a);
    const y1 = py(R - (major ? 44 : 26), a);
    const x2 = px(R + 14, a);
    const y2 = py(R + 14, a);
    const lx = px(R + 62, a);
    const ly = py(R + 62, a);
    ticks.push(
      <g key={s}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={prog * RANGE + 300 >= s ? 'rgba(242,246,253,0.85)' : FAINT} strokeWidth={major ? 7 : 4} strokeLinecap="round" />
        {major && (
          <text x={lx} y={ly + 11} fill={prog * RANGE + 300 >= s ? INK : MUTED} fontSize={32} fontFamily={MONO} fontWeight={700} textAnchor="middle">
            {s}
          </text>
        )}
      </g>
    );
  }

  // needle
  const na = ang(score);
  const nx = px(R - 210, na);
  const ny = py(R - 210, na);

  // score history: trailing 120 frames, sampled every 6
  const hist: string[] = [];
  const HN = 22;
  for (let k = 0; k < HN; k++) {
    const hf = Math.max(0, frame - (HN - 1 - k) * 6);
    const hs = scoreAt(hf);
    const hx = CX - 420 + (k / (HN - 1)) * 840;
    const hy = CY + 470 - ((hs - 300) / RANGE) * 150;
    hist.push(`${hx.toFixed(1)},${hy.toFixed(1)}`);
  }

  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <circle cx={CX} cy={CY} r={R + 120} fill="rgba(8,12,24,0.55)" stroke={HAIRLINE} strokeWidth={2} />
        {/* tier bands on the outer arc */}
        {TIERS.map((t) => (
          <path key={t.label} d={arcPath(R + 60, t.lo, t.hi)} fill="none" stroke={t.color} strokeWidth={10} opacity={tier.label === t.label ? 0.95 : 0.28} strokeLinecap="round" />
        ))}
        {/* base arc + progress arc */}
        <path d={arcPath(R, 300, 850)} fill="none" stroke="rgba(242,246,253,0.10)" strokeWidth={26} strokeLinecap="round" />
        <path
          d={arcPath(R, 300, score)}
          fill="none"
          stroke="url(#csArc)"
          strokeWidth={26}
          strokeLinecap="round"
          style={{filter: 'drop-shadow(0 0 22px rgba(251,191,36,0.55))'}}
        />
        {segs}
        {ticks}
        {/* needle */}
        <line x1={CX} y1={CY} x2={nx} y2={ny} stroke={INK} strokeWidth={12} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={40} fill="#0B1220" stroke={INK} strokeWidth={6} />
        <circle cx={nx} cy={ny} r={20} fill={tier.color} style={{filter: `drop-shadow(0 0 16px ${tier.color})`}} />
        {/* score history sparkline */}
        <polyline points={hist.join(' ')} fill="none" stroke={CYAN} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
        <text x={CX} y={CY + 540} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={6} textAnchor="middle">
          SCORE TRAJECTORY · LAST 2 SEC
        </text>
      </svg>
      {/* center readout */}
      <div style={{position: 'absolute', left: CX - 380, top: CY - 160, width: 760, textAlign: 'center'}}>
        <div style={{fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: MUTED}}>CREDIT SCORE</div>
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 210,
            color: INK,
            lineHeight: 1,
            textShadow: `0 0 70px ${tier.color}`,
          }}
        >
          {Math.round(score)}
        </div>
        <div style={{fontFamily: MONO, fontSize: 44, fontWeight: 700, color: tier.color, marginTop: 14, letterSpacing: 4}}>
          {tier.label}
        </div>
      </div>
      {/* EXCELLENT badge at 740 */}
      {excellent && exS > 0.02 && (
        <div
          style={{
            position: 'absolute',
            left: CX - 330,
            top: CY + 330,
            width: 660,
            textAlign: 'center',
            transform: `scale(${Math.min(1, exS)})`,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 66,
            color: GREEN,
            border: `5px solid ${GREEN}`,
            borderRadius: 20,
            padding: '18px 0',
            backgroundColor: 'rgba(4,12,9,0.9)',
            boxShadow: '0 0 80px rgba(52,211,153,0.6)',
            letterSpacing: 6,
          }}
        >
          ★ EXCELLENT ★
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Factor cards (right column): weight, contribution points, fill bar.
// Utilization card carries a live utilization gauge dipping under 30%.
// ---------------------------------------------------------------------------
const FactorCards: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const PX = 2440;
  const PW = 1180;
  const CARD_H = 196;
  const cardY = (i: number) => 420 + i * (CARD_H + 34);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <text x={PX} y={380} fill={CYAN} fontSize={32} fontFamily={MONO} letterSpacing={8}>
          FICO SCORING FACTORS
        </text>
        {FACTORS.map((f, i) => {
          const enter = spring({frame: frame - (90 + i * 30), fps, config: {damping: 200, stiffness: 100}});
          if (enter <= 0.001) return null;
          const fill = factorFill(i, frame);
          const pts = Math.round(f.weight * RANGE * fill);
          const maxPts = Math.round(f.weight * RANGE);
          const y = cardY(i);
          const isUtil = i === 1;
          const util = utilAt(frame);
          const under30 = util < 30;
          const uTagS = spring({frame: frame - 400, fps, config: {damping: 200, stiffness: 120}});
          return (
            <g key={f.name} opacity={Math.min(1, enter)}>
              <rect x={PX} y={y} width={PW} height={CARD_H} rx={20} fill={PANEL} stroke={fill >= 1 ? f.color : HAIRLINE} strokeWidth={fill >= 1 ? 3 : 1.5} />
              <rect x={PX} y={y} width={10} height={CARD_H} fill={f.color} />
              <text x={PX + 48} y={y + 58} fill={INK} fontSize={42} fontFamily={FONT} fontWeight={750}>
                {f.name}
              </text>
              <text x={PX + 48} y={y + 100} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={3}>
                {f.sub} · {Math.round(f.weight * 100)}%
              </text>
              <text x={PX + PW - 44} y={y + 66} fill={f.color} fontSize={56} fontFamily={MONO} fontWeight={800} textAnchor="end">
                +{pts}
                <tspan fill={FAINT} fontSize={30} fontWeight={400}> / {maxPts} PTS</tspan>
              </text>
              {/* fill bar */}
              <rect x={PX + 48} y={y + 128} width={PW - 96} height={26} rx={13} fill="rgba(242,246,253,0.08)" />
              <rect x={PX + 48} y={y + 128} width={(PW - 96) * fill} height={26} rx={13} fill={f.color} opacity={0.9} />
              {fill >= 1 && (
                <text x={PX + PW - 60} y={y + 152} fill={f.color} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="end">
                  ✓
                </text>
              )}
              {/* utilization gauge */}
              {isUtil && (
                <g>
                  <text x={PX + 48} y={y + 190} fill={under30 ? GREEN : AMBER} fontSize={34} fontFamily={MONO} fontWeight={700}>
                    UTILIZATION {util.toFixed(1)}%
                  </text>
                  {under30 && uTagS > 0.02 && (
                    <g opacity={Math.min(1, uTagS)} transform={`scale(${Math.min(1, uTagS)})`}>
                      <rect x={PX + PW - 430} y={y + 148} width={386} height={56} rx={12} fill="rgba(52,211,153,0.14)" stroke={GREEN} strokeWidth={2.5} />
                      <text x={PX + PW - 237} y={y + 188} fill={GREEN} fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                        UNDER 30% ✓
                      </text>
                    </g>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tier legend (left rail)
// ---------------------------------------------------------------------------
const TierLegend: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 150, fps, config: {damping: 200, stiffness: 80}});
  const score = scoreAt(frame);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <text x={120} y={700} fill={CYAN} fontSize={30} fontFamily={MONO} letterSpacing={8}>
          SCORE TIERS
        </text>
        {TIERS.map((t, i) => {
          const s = spring({frame: frame - (150 + i * 26), fps, config: {damping: 200, stiffness: 120}});
          if (s <= 0.001) return null;
          const active = score >= t.lo && score <= t.hi;
          const y = 740 + i * 168;
          return (
            <g key={t.label} opacity={Math.min(1, s)}>
              <rect
                x={120}
                y={y}
                width={300}
                height={140}
                rx={16}
                fill={active ? 'rgba(242,246,253,0.08)' : PANEL}
                stroke={active ? t.color : HAIRLINE}
                strokeWidth={active ? 3.5 : 1.5}
              />
              <rect x={120} y={y} width={10} height={140} fill={t.color} />
              <text x={162} y={y + 58} fill={active ? INK : MUTED} fontSize={34} fontFamily={FONT} fontWeight={800} letterSpacing={1}>
                {t.label}
              </text>
              <text x={162} y={y + 102} fill={FAINT} fontSize={28} fontFamily={MONO}>
                {t.lo}–{t.hi}
              </text>
              {active && <circle cx={386} cy={y + 70} r={14} fill={t.color} style={{filter: `drop-shadow(0 0 12px ${t.color})`}} />}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payoff banner: EXCELLENT + final score
// ---------------------------------------------------------------------------
const PayoffBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - PAYOFF_START, fps, config: {damping: 200, stiffness: 70}});
  if (enter <= 0.001) return null;
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const flash = interpolate(frame, [PAYOFF_START + 20, PAYOFF_START + 80], [0, 1], clamp01);
  const score = Math.round(scoreAt(Math.min(frame, SCORE_END)));
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `scale(${0.94 + enter * 0.06})`,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(4,10,9,0.95)',
          border: `3px solid ${GREEN}`,
          borderRadius: 26,
          padding: '44px 150px',
          textAlign: 'center',
          boxShadow: `0 0 140px rgba(52,211,153,${0.25 + flash * 0.35})`,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 42, letterSpacing: 16, color: GREEN}}>SCORE {score} / 850</div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 108,
            marginTop: 8,
            background: 'linear-gradient(90deg,#2DD4BF,#34D399,#FBBF24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 6,
          }}
        >
          EXCELLENT
        </div>
        <div style={{fontFamily: MONO, fontSize: 36, color: MUTED, marginTop: 12}}>
          5/5 FACTORS OPTIMIZED · UTILIZATION UNDER 30% · 0 HARD INQUIRIES
        </div>
      </div>
    </div>
  );
};


// ---------------------------------------------------------------------------
// Texture overlays: ambient particles, fine dither, top ticker, corner HUD.
// Full-frame per-frame motion + cinematic grain support. Self-contained.
// ---------------------------------------------------------------------------
const MONO_cs = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const TEAL_cs = '#2DD4BF';
const CYAN_cs = '#67E8F9';

const AmbientParticles_cs: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`cs-amb-x-${i}`) * 3840;
    const by = random(`cs-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`cs-amb-s-${i}`) * 1.4;
    const ang = random(`cs-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`cs-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? CYAN_cs : i % 4 === 1 ? TEAL_cs : 'rgba(234,242,251,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_cs: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`cs-dth-x-${i}`) * 3840;
    const by = random(`cs-dth-y-${i}`) * 2160;
    const jx = (random(`cs-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`cs-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`cs-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`cs-dth-s-${i}`) * 2;
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

const TICKER_ITEMS_cs = [
  'SCORE 300 → 850',
  'PAYMENT HISTORY 35%',
  'UTILIZATION UNDER 30%',
  '0 HARD INQUIRIES',
  '5/5 FACTORS OPTIMIZED',
  'EXCEPTIONAL TIER 800+',
  'LENGTH OF HISTORY 15%',
  'NEW CREDIT 10%'
];
const TickerTape_cs: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_cs.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(103,232,249,0.60)" fontSize={27} fontFamily={MONO_cs} letterSpacing={4}>
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

const CornerHud_cs: React.FC<{frame: number}> = ({frame}) => {
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
            <circle cx={0} cy={0} r={6} fill={TEAL_cs} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? TEAL_cs : 'rgba(234,242,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? TEAL_cs : 'rgba(234,242,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
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
    const x = random(`cs-grain-x-${frame}-${i}`) * 3840;
    const y = random(`cs-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`cs-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`cs-grain-s-${frame}-${i}`) * 3;
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
export const CreditScoreBuilding: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <ScoreDial frame={frame} fps={fps} />
      <TierLegend frame={frame} fps={fps} />
      <FactorCards frame={frame} fps={fps} />
      <PayoffBanner frame={frame} fps={fps} />
      <AmbientParticles_cs frame={frame} />
      <FineDither_cs frame={frame} />
      <TickerTape_cs frame={frame} />
      <CornerHud_cs frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
