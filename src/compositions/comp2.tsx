/**
 * TaxFilingProcess.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral tax filing story on deep evergreen: documents check in one
 * by one, income totals climb, deductions chip away at taxable income, the
 * review pass stamps each line, the return e-files, and the refund gauge fills
 * to a payoff stamp. Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="TaxFilingProcess" component={TaxFilingProcess}
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
// Palette (deep evergreen + gold finance)
// ---------------------------------------------------------------------------
const BG = '#07211B';
const INK = '#EAF5EE';
const MUTED = 'rgba(234,245,238,0.60)';
const GOLD = '#F5C044';
const GOLD_DEEP = '#B07E1E';
const GREEN = '#34D399';
const TEAL = '#2DD4BF';
const PANEL = 'rgba(14,42,34,0.82)';
const HAIRLINE = 'rgba(234,245,238,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const DOC_START = 60;
const INCOME_START = 210;
const DEDUCT_START = 340;
const REVIEW_START = 500;
const EFILE_START = 620;
const REFUND_START = 720;
const RESOLVE_START = 830;

const STAGES = ['GATHER', 'INCOME', 'DEDUCTIONS', 'REVIEW', 'E-FILE', 'REFUND'];
const STAGE_TIMES = [DOC_START, INCOME_START, DEDUCT_START, REVIEW_START, EFILE_START, REFUND_START];

const DOCS = [
  {name: 'W-2', sub: 'Wages · Acme Corp', amount: '$92,000'},
  {name: '1099-NEC', sub: 'Freelance income', amount: '$6,400'},
  {name: '1099-INT', sub: 'Bank interest', amount: '$1,240'},
  {name: 'Receipts', sub: 'Charitable giving', amount: '$3,150'},
];

const INCOME_LINES = [
  {label: 'WAGES', value: 92000},
  {label: 'FREELANCE', value: 6400},
  {label: 'INTEREST', value: 1240},
];

const DEDUCTIONS = [
  {label: 'STANDARD DEDUCTION', value: 15000},
  {label: 'HSA CONTRIBUTION', value: 3850},
  {label: 'CHARITABLE GIFT', value: 3150},
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="tfGlow" cx="50%" cy="30%" r="72%">
      <stop offset="0%" stopColor="rgba(245,192,68,0.12)" />
      <stop offset="55%" stopColor="rgba(245,192,68,0.035)" />
      <stop offset="100%" stopColor="rgba(7,33,27,0)" />
    </radialGradient>
    <radialGradient id="tfVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(3,12,9,0)" />
      <stop offset="100%" stopColor="rgba(3,12,9,0.72)" />
    </radialGradient>
    <linearGradient id="tfGoldBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={GOLD_DEEP} />
      <stop offset="100%" stopColor={GOLD} />
    </linearGradient>
    <filter id="tfGlow14" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="tfShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.55" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: glow + vignette + drifting dot texture + scan sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const driftX = (frame * 0.35) % 120;
  const driftY = (frame * 0.22) % 120;
  const scanY = ((frame / 900) * (2160 + 300)) % (2160 + 300) - 150;
  const dots: React.ReactElement[] = [];
  for (let gx = 0; gx <= 33; gx++) {
    for (let gy = 0; gy <= 19; gy++) {
      const shimmer = 0.05 + 0.05 * Math.sin(frame * 0.08 + gx * 0.7 + gy * 1.3);
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx * 120 - driftX} cy={gy * 120 - driftY} r={2.2} fill="#F5C044" opacity={shimmer} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#tfGlow)" />
        {dots}
        <rect x={0} y={scanY - 80} width={3840} height={160} fill="rgba(245,192,68,0.03)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#tfVignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 40], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 80 + rise, left: 200, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
        From W-2 to <span style={{color: GREEN}}>refund</span>
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        TAX FILING &middot; STEP BY STEP
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage rail
// ---------------------------------------------------------------------------
const StageRail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 25, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const railX = 200; const railW = 3440; const railY = 340;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <line x1={railX} y1={railY} x2={railX + railW} y2={railY} stroke={HAIRLINE} strokeWidth={8} strokeLinecap="round" />
        {STAGES.map((st, i) => {
          const active = frame >= STAGE_TIMES[i];
          const done = i < STAGES.length - 1 ? frame >= STAGE_TIMES[i + 1] : frame >= RESOLVE_START;
          const x = railX + (i / (STAGES.length - 1)) * railW;
          return (
            <g key={st}>
              {i < STAGES.length - 1 && (() => {
                const nx = railX + ((i + 1) / (STAGES.length - 1)) * railW;
                const cf = interpolate(frame, [STAGE_TIMES[i], STAGE_TIMES[i + 1]], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
                return (
                  <line x1={x} y1={railY} x2={x + (nx - x) * cf} y2={railY}
                    stroke={done ? GREEN : GOLD} strokeWidth={8} strokeLinecap="round" filter="url(#tfGlow14)" />
                );
              })()}
              <circle cx={x} cy={railY} r={active ? 34 : 24}
                fill={done ? GREEN : active ? GOLD : BG}
                stroke={done ? GREEN : active ? GOLD : HAIRLINE} strokeWidth={6} />
              {done && (
                <text x={x} y={railY + 12} textAnchor="middle" fill="#07211B" fontSize={34} fontWeight={800}>&#10003;</text>
              )}
              <text x={x} y={railY + 84} textAnchor="middle"
                fill={active ? INK : MUTED} fontSize={30} fontFamily={MONO}
                fontWeight={active ? 800 : 500} letterSpacing={2}>{st}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Left column: documents checking in
// ---------------------------------------------------------------------------
const DocList: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (DOC_START - 30), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: 200, top: 560, width: 1020,
      opacity: Math.min(1, s), transform: `translateX(${(1 - s) * -80}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3, marginBottom: 26}}>
        DOCUMENTS GATHERED
      </div>
      {DOCS.map((d, i) => {
        const ds = spring({frame: frame - (DOC_START + i * 42), fps, config: {damping: 200, stiffness: 130}});
        if (ds <= 0.001) return null;
        return (
          <div key={d.name} style={{
            display: 'flex', alignItems: 'center', gap: 26, marginTop: 18,
            background: PANEL, border: `2px solid ${HAIRLINE}`, borderRadius: 20,
            padding: '26px 32px',
            opacity: Math.min(1, ds), transform: `translateX(${(1 - Math.min(1, ds)) * -50}px)`,
          }}>
            <span style={{
              width: 56, height: 56, borderRadius: '50%', background: GREEN,
              color: '#07211B', fontSize: 32, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>&#10003;</span>
            <div style={{flex: 1}}>
              <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 40}}>{d.name}</div>
              <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 4}}>{d.sub}</div>
            </div>
            <div style={{color: GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 38}}>{d.amount}</div>
          </div>
        );
      })}
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, marginTop: 22, letterSpacing: 1}}>
        {Math.min(DOCS.length, Math.max(0, Math.floor((frame - DOC_START) / 42) + 1))} of {DOCS.length} forms imported
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Center column: the return computation
// ---------------------------------------------------------------------------
const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

const Computation: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (INCOME_START - 40), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const AGI = 99640;
  const agi = interpolate(frame, [INCOME_START, INCOME_START + 110], [0, AGI], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dedTotal = DEDUCTIONS.reduce((a, d) => a + d.value, 0);
  const ded = interpolate(frame, [DEDUCT_START, DEDUCT_START + 110], [0, dedTotal], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const taxable = Math.max(0, agi - ded);
  const taxOwed = interpolate(frame, [REVIEW_START, REVIEW_START + 90], [0, 13328], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const reviewed = frame >= REVIEW_START;

  return (
    <div style={{
      position: 'absolute', left: 1380, top: 560, width: 1080,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 32, padding: '46px 52px',
        border: `2px solid ${reviewed ? GREEN : HAIRLINE}`,
        filter: 'url(#tfShadow)', backdropFilter: 'blur(6px)',
        boxShadow: reviewed ? '0 0 60px rgba(52,211,153,0.22)' : 'none',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>YOUR 1040, SIMPLIFIED</div>
        <div style={{marginTop: 24}}>
          {INCOME_LINES.map((l, i) => {
            const show = frame >= INCOME_START + 20 + i * 34;
            const v = interpolate(frame, [INCOME_START + 20 + i * 34, INCOME_START + 70 + i * 34], [0, l.value], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <div key={l.label} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, opacity: show ? 1 : 0.25}}>
                <span style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>{l.label}</span>
                <span style={{color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 42}}>{fmt(v)}</span>
              </div>
            );
          })}
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 20, borderTop: `2px solid ${HAIRLINE}`, paddingTop: 20}}>
          <span style={{color: GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 32, letterSpacing: 2}}>ADJUSTED GROSS INCOME</span>
          <span style={{color: GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 52}}>{fmt(agi)}</span>
        </div>
        <div style={{marginTop: 26}}>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 2, marginBottom: 10}}>DEDUCTIONS &amp; CREDITS</div>
          {DEDUCTIONS.map((d, i) => {
            const show = frame >= DEDUCT_START + i * 30;
            return (
              <div key={d.label} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10, opacity: show ? 1 : 0.25}}>
                <span style={{color: MUTED, fontFamily: MONO, fontSize: 28}}>
                  <span style={{color: show ? GREEN : MUTED, fontWeight: 800, marginRight: 14}}>{show ? '\u2212' : '\u00B7'}</span>{d.label}
                </span>
                <span style={{color: show ? GREEN : MUTED, fontFamily: MONO, fontWeight: 700, fontSize: 38}}>
                  {show ? `(${fmt(d.value)})` : fmt(d.value)}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 26, borderTop: `2px solid ${HAIRLINE}`, paddingTop: 22}}>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>TAXABLE INCOME</span>
          <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 52}}>{fmt(taxable)}</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14}}>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>FEDERAL TAX OWED</span>
          <span style={{color: taxOwed > 0 ? INK : MUTED, fontFamily: MONO, fontWeight: 800, fontSize: 52}}>{fmt(taxOwed)}</span>
        </div>
        {reviewed && (
          <div style={{
            marginTop: 24, textAlign: 'center',
            opacity: interpolate(frame, [REVIEW_START + 20, REVIEW_START + 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          }}>
            <span style={{
              display: 'inline-block', border: '3px solid rgba(52,211,153,0.75)', color: GREEN,
              fontFamily: MONO, fontWeight: 800, fontSize: 34, letterSpacing: 4,
              padding: '12px 44px', borderRadius: 14, transform: 'rotate(-4deg)',
            }}>
              REVIEWED &#10003;
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Right column: refund gauge + e-file status
// ---------------------------------------------------------------------------
const RefundPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (EFILE_START - 60), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const REFUND = 4872;
  const refund = interpolate(frame, [REFUND_START, REFUND_START + 120], [0, REFUND], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const accepted = frame >= EFILE_START + 60;
  const R = 230;
  const CX = 520; const CY = 420;
  const CIRC = 2 * Math.PI * R;
  const ringFrac = Math.min(1, refund / REFUND);

  return (
    <div style={{
      position: 'absolute', left: 2620, top: 560, width: 1020,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 32, padding: '40px 52px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#tfShadow)', backdropFilter: 'blur(6px)',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3, textAlign: 'center'}}>YOUR REFUND</div>
        <svg width={1040} height={560} viewBox="0 0 1040 560" style={{display: 'block', margin: '10px auto 0'}}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(234,245,238,0.10)" strokeWidth={34} />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#tfGoldBar)" strokeWidth={34}
            strokeLinecap="round" pathLength={1} strokeDasharray={1}
            strokeDashoffset={1 - ringFrac} transform={`rotate(-90 ${CX} ${CY})`}
            filter="url(#tfGlow14)" />
          <text x={CX} y={CY - 30} textAnchor="middle" fill={INK} fontSize={92} fontFamily={MONO} fontWeight={800}>
            {fmt(refund)}
          </text>
          <text x={CX} y={CY + 50} textAnchor="middle" fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={2}>
            ESTIMATED REFUND
          </text>
        </svg>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 8}}>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 28}}>WITHHELD {fmt(18200)}</span>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 28}}>OWED {fmt(13328)}</span>
        </div>
        <div style={{
          marginTop: 26, borderRadius: 20, padding: '22px 28px',
          background: accepted ? 'rgba(52,211,153,0.10)' : 'rgba(234,245,238,0.04)',
          border: `2px solid ${accepted ? GREEN : HAIRLINE}`,
          display: 'flex', alignItems: 'center', gap: 22,
        }}>
          <span style={{
            width: 52, height: 52, borderRadius: '50%',
            background: accepted ? GREEN : 'rgba(234,245,238,0.15)',
            color: '#07211B', fontSize: 30, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{accepted ? '\u2713' : '\u22EF'}</span>
          <div>
            <div style={{color: accepted ? GREEN : MUTED, fontFamily: MONO, fontWeight: 800, fontSize: 34, letterSpacing: 2}}>
              {accepted ? 'E-FILED · ACCEPTED' : 'PREPARING E-FILE'}
            </div>
            <div style={{color: MUTED, fontFamily: FONT, fontSize: 26, marginTop: 4}}>
              {accepted ? 'IRS confirmation TC-2026-8841' : 'transmitting return package'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Resolve strip
// ---------------------------------------------------------------------------
const ResolveStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - RESOLVE_START, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 92, left: 0, width: 3840,
      display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{
        background: 'rgba(52,211,153,0.10)', border: `2px solid ${GREEN}`,
        borderRadius: 999, padding: '28px 90px',
        display: 'flex', alignItems: 'center', gap: 44,
      }}>
        <span style={{
          width: 58, height: 58, borderRadius: '50%', background: GREEN,
          color: '#07211B', fontSize: 36, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#10003;</span>
        <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 48, letterSpacing: 2}}>
          E-FILED IN 22 MINUTES &middot; REFUND $4,872 ON THE WAY
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain — deterministic, SVG-only, bitrate insurance (>= 20 Mbps gate)
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 420;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`tf-grain-x-${frame}-${i}`) * 3840;
    const y = random(`tf-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`tf-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`tf-grain-s-${frame}-${i}`) * 2.5;
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
export const TaxFilingProcess: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <StageRail frame={frame} fps={fps} />
      <DocList frame={frame} fps={fps} />
      <Computation frame={frame} fps={fps} />
      <RefundPanel frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default TaxFilingProcess;
