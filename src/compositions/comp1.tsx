/**
 * ClosingCostBreakdown.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral real-estate closing-cost anatomy for realtors, mortgage
 * educators, and homebuyer courses: a $425,000 purchase price splits into
 * four fee buckets (lender / third-party / title-escrow / prepaid), flows
 * through Loan Estimate and Closing Disclosure, and lands on cash-to-close.
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
// Palette (warm paper + ink, trust blues)
// ---------------------------------------------------------------------------
const BG = '#0B0E14';
const INK = '#F4F1E8';
const MUTED = 'rgba(244,241,232,0.58)';
const NAVY = '#3B82F6';
const TEAL = '#2DD4BF';
const GOLD = '#FBBF24';
const ROSE = '#FB7185';
const GREEN = '#34D399';
const PANEL = 'rgba(12,16,24,0.94)';
const HAIRLINE = 'rgba(244,241,232,0.15)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const PRICE = 425000;
const BUCKETS = [
  {name: 'LENDER FEES', items: ['origination 1%', 'appraisal $600', 'credit report $75'], total: 4925, color: NAVY},
  {name: 'THIRD-PARTY', items: ['inspection $450', 'survey $550', 'attorney $900'], total: 1900, color: TEAL},
  {name: 'TITLE & ESCROW', items: ['title search $400', 'title insurance $1,900', 'escrow $850'], total: 3150, color: GOLD},
  {name: 'PREPAIDS', items: ['1-yr insurance $2,400', 'tax escrow $3,100', 'prepaid interest $780'], total: 6280, color: ROSE},
];
const CLOSING = BUCKETS.reduce((a, b) => a + b.total, 0);
const DOWN = Math.round(PRICE * 0.1);
const CASH_TO_CLOSE = DOWN + CLOSING;

const B_START = 200;
const B_GAP = 110;
const DOC_START = 600;
const TOTAL_START = 740;

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="ccGlow" cx="50%" cy="26%" r="80%">
      <stop offset="0%" stopColor="#14263F" stopOpacity={0.85} />
      <stop offset="55%" stopColor="#0C1626" stopOpacity={0.32} />
      <stop offset="100%" stopColor="#0B0E14" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="ccVig" cx="50%" cy="50%" r="72%">
      <stop offset="0%" stopColor="#000000" stopOpacity={0} />
      <stop offset="78%" stopColor="#000000" stopOpacity={0} />
      <stop offset="100%" stopColor="#030507" stopOpacity={0.85} />
    </radialGradient>
    <linearGradient id="ccSweep" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0} />
      <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.10} />
      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
    </linearGradient>
    <filter id="ccGlow10" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation={10} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: ink base + glow + vignette + drifting blueprint grid + sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const lines: React.ReactElement[] = [];
  const drift = (frame * 0.4) % 140;
  for (let i = 0; i <= 30; i++) {
    const x = i * 140 - drift;
    lines.push(<line key={`v${i}`} x1={x} y1={0} x2={x} y2={2160} stroke="#8FA3C8" strokeWidth={1.5} opacity={0.07} />);
  }
  for (let j = 0; j <= 18; j++) {
    const y = j * 140 - drift;
    lines.push(<line key={`h${j}`} x1={0} y1={y} x2={3840} y2={y} stroke="#8FA3C8" strokeWidth={1.5} opacity={0.07} />);
  }
  const sweepY = interpolate(frame, [0, 900], [-400, 2560], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      <rect width={3840} height={2160} fill={BG} />
      <rect width={3840} height={2160} fill="url(#ccGlow)" />
      <g>{lines}</g>
      <rect x={0} y={sweepY - 260} width={3840} height={520} fill="url(#ccSweep)" />
      <rect width={3840} height={2160} fill="url(#ccVig)" />
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
    const x = random(`cc-grain-x-${frame}-${i}`) * 3840;
    const y = random(`cc-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`cc-grain-o-${frame}-${i}`) * 0.045;
    const s = 2 + random(`cc-grain-s-${frame}-${i}`) * 2.5;
    const white = random(`cc-grain-w-${frame}-${i}`) > 0.5;
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
// Header + price hero
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const p = spring({frame: Math.max(0, frame - 8), fps, config: {damping: 120, stiffness: 160}});
  const y = interpolate(p, [0, 1], [60, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = interpolate(p, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const price = Math.floor(interpolate(frame, [30, 170], [0, PRICE], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <div style={{position: 'absolute', top: 100, left: 0, right: 0, opacity: op, transform: `translateY(${y}px)`, textAlign: 'center'}}>
      <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 10, color: MUTED}}>HOMEBUYER EDUCATION</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 104, letterSpacing: 8, color: INK, marginTop: 22}}>
        CLOSING COST <span style={{color: NAVY}}>BREAKDOWN</span>
      </div>
      <div style={{marginTop: 18, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 30}}>
        <span style={{fontFamily: MONO, fontSize: 34, letterSpacing: 6, color: MUTED}}>PURCHASE PRICE</span>
        <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 88, color: INK}}>${price.toLocaleString('en-US')}</span>
        <span style={{fontFamily: MONO, fontSize: 34, letterSpacing: 6, color: MUTED}}>10% DOWN</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Four fee-bucket cards
// ---------------------------------------------------------------------------
const Buckets: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const maxTotal = Math.max(...BUCKETS.map((b) => b.total));
  return (
    <div style={{position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 64}}>
      {BUCKETS.map((b, i) => {
        const start = B_START + i * B_GAP;
        const inn = spring({frame: Math.max(0, frame - start), fps, config: {damping: 110, stiffness: 160}});
        const op = interpolate(inn, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const yy = interpolate(inn, [0, 1], [70, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (op <= 0) return null;
        const fill = interpolate(frame, [start + 30, start + 100], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const shownTotal = Math.floor(b.total * fill);
        return (
          <div
            key={b.name}
            style={{
              width: 800,
              padding: '48px 54px',
              background: PANEL,
              border: `2px solid ${HAIRLINE}`,
              borderTop: `8px solid ${b.color}`,
              borderRadius: 26,
              opacity: op,
              transform: `translateY(${yy}px)`,
            }}
          >
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 44, color: INK, letterSpacing: 4}}>{b.name}</div>
            <div style={{marginTop: 30, display: 'flex', flexDirection: 'column', gap: 16}}>
              {b.items.map((it, k) => {
                const tick = frame >= start + 40 + k * 18;
                return (
                  <div key={it} style={{display: 'flex', justifyContent: 'space-between', opacity: tick ? 1 : 0.25}}>
                    <span style={{fontFamily: MONO, fontSize: 29, color: tick ? INK : MUTED}}>{it.split(' ').slice(0, -1).join(' ')}</span>
                    <span style={{fontFamily: MONO, fontSize: 29, color: tick ? b.color : MUTED, fontWeight: 700}}>
                      {it.split(' ').slice(-1)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop: 32, height: 26, background: 'rgba(244,241,232,0.08)', borderRadius: 13, overflow: 'hidden'}}>
              <div style={{width: `${(b.total / maxTotal) * fill * 100}%`, height: '100%', background: b.color, borderRadius: 13, boxShadow: `0 0 20px ${b.color}`}} />
            </div>
            <div style={{marginTop: 16, textAlign: 'right', fontFamily: FONT, fontWeight: 800, fontSize: 52, color: b.color}}>
              ${shownTotal.toLocaleString('en-US')}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Document rail: Loan Estimate -> Closing Disclosure
// ---------------------------------------------------------------------------
const DocRail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const docs = [
    {name: 'LOAN ESTIMATE', when: 'WITHIN 3 DAYS OF APPLICATION', start: DOC_START},
    {name: 'CLOSING DISCLOSURE', when: 'AT LEAST 3 DAYS BEFORE CLOSING', start: DOC_START + 70},
  ];
  return (
    <div style={{position: 'absolute', top: 1470, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 90, alignItems: 'center'}}>
      {docs.map((d, i) => {
        const on = frame >= d.start;
        const pop = on ? spring({frame: frame - d.start, fps, config: {damping: 95, stiffness: 220}}) : 0;
        const op = interpolate(pop, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (op <= 0) return null;
        return (
          <React.Fragment key={d.name}>
            {i > 0 && (
              <div style={{fontSize: 64, color: GREEN, opacity: op}}>→</div>
            )}
            <div
              style={{
                width: 1150,
                padding: '40px 60px',
                background: PANEL,
                border: `2px solid ${on ? GREEN : HAIRLINE}`,
                borderRadius: 24,
                opacity: op,
                transform: `scale(${0.9 + pop * 0.1})`,
                boxShadow: on ? '0 0 50px rgba(52,211,153,0.16)' : 'none',
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 44, color: INK, letterSpacing: 3}}>{d.name}</div>
                <div style={{width: 64, height: 64, borderRadius: '50%', background: GREEN, color: '#06231C', fontSize: 40, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✓</div>
              </div>
              <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, marginTop: 12, letterSpacing: 3}}>{d.when}</div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Cash-to-close payoff
// ---------------------------------------------------------------------------
const Payoff: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const on = frame >= TOTAL_START;
  const p = on ? spring({frame: frame - TOTAL_START, fps, config: {damping: 90, stiffness: 140}}) : 0;
  const op = interpolate(p, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op <= 0) return null;
  const cash = Math.floor(interpolate(frame, [TOTAL_START, 880], [0, CASH_TO_CLOSE], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const scale = 0.85 + p * 0.15;
  return (
    <div style={{position: 'absolute', bottom: 200, left: 0, right: 0, opacity: op, transform: `scale(${scale})`, textAlign: 'center'}}>
      <div style={{fontFamily: MONO, fontSize: 36, letterSpacing: 12, color: MUTED}}>
        DOWN PAYMENT ${DOWN.toLocaleString('en-US')} + CLOSING ${CLOSING.toLocaleString('en-US')}
      </div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 150, letterSpacing: 6, color: INK, marginTop: 10}}>
        CASH TO CLOSE&nbsp;&nbsp;<span style={{color: GREEN, textShadow: '0 0 60px rgba(52,211,153,0.45)'}}>${cash.toLocaleString('en-US')}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ticker strip
// ---------------------------------------------------------------------------
const STRIP = '  •  CLOSING COSTS TYPICALLY RUN 2–5% OF THE PURCHASE PRICE    •  COMPARE THE LOAN ESTIMATE AGAINST THE CLOSING DISCLOSURE    •  SOME FEES ARE NEGOTIABLE — ASK    ';

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
export const ClosingCostBreakdown: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Defs />
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <Buckets frame={frame} fps={fps} />
      <DocRail frame={frame} fps={fps} />
      <Payoff frame={frame} fps={fps} />
      <Strip frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
