/**
 * ExpenseReimbursementFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The universal expense-report process: CAPTURE a receipt -> assemble the
 * REPORT -> manager REVIEW -> APPROVE stamp -> REIMBURSE payout to the bank.
 * Three receipts ($184.20, $62.40, $1,240.00) travel the rail and land as a
 * $1,486.60 reimbursement. Brand-neutral, deterministic.
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
// Palette (deep slate, emerald)
// ---------------------------------------------------------------------------
const BG = '#0A0E0C';
const INK = '#F2F7F4';
const MUTED = 'rgba(242,247,244,0.62)';
const FAINT = 'rgba(242,247,244,0.32)';
const EMERALD = '#10B981';
const MINT = '#6EE7B7';
const GOLD = '#FBBF24';
const CYAN = '#67E8F9';
const PANEL = 'rgba(11,16,13,0.92)';
const HAIRLINE = 'rgba(242,247,244,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: er
// ---------------------------------------------------------------------------
const Background_er: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#A9E8C9" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 32%, rgba(16,185,129,0.13), rgba(16,185,129,0.03) 46%, rgba(10,14,12,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#erVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(16,185,129,0.045)" />
        <defs>
          <radialGradient id="erVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(10,14,12,0)" />
            <stop offset="100%" stopColor="rgba(3,6,4,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_er: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`er-amb-x-${i}`) * 3840;
    const by = random(`er-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`er-amb-s-${i}`) * 1.4;
    const ang = random(`er-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`er-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? CYAN : i % 4 === 1 ? EMERALD : 'rgba(242,247,244,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_er: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`er-dth-x-${i}`) * 3840;
    const by = random(`er-dth-y-${i}`) * 2160;
    const jx = (random(`er-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`er-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`er-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`er-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#D3F5E3" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_er = [
  'RECEIPT CAPTURED',
  'REPORT ASSEMBLED',
  'MANAGER REVIEW',
  'APPROVED \u2713',
  '$1,486.60 REIMBURSED',
  'POLICY COMPLIANT',
  'AUDIT TRAIL SAVED',
  'PAYOUT IN 3 DAYS',
];
const TickerTape_er: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_er.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(16,185,129,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(4,8,6,0.66)', borderBottom: '1px solid rgba(242,247,244,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_er: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(16,185,129,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={EMERALD} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? EMERALD : 'rgba(242,247,244,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? EMERALD : 'rgba(242,247,244,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_er: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`er-grain-x-${frame}-${i}`) * 3840;
    const y = random(`er-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`er-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`er-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Expense model
// ---------------------------------------------------------------------------
const RECEIPTS_er = [
  {label: 'CLIENT DINNER', amount: 184.2},
  {label: 'RIDESHARE', amount: 62.4},
  {label: 'FLIGHT \u2013 CHI', amount: 1240.0},
];
const TOTAL_er = 1486.6;
const fmt = (n: number) => '$' + n.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_er: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        EXPENSE REIMBURSEMENT FLOW
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        Receipt to refund in five steps &middot; three expenses, one payout
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Five-stage flow rail with traveling receipt
// ---------------------------------------------------------------------------
const STEPS_er = ['CAPTURE', 'REPORT', 'REVIEW', 'APPROVE', 'REIMBURSE'];
const STEP_AT_er = [120, 300, 470, 620, 740];
const Rail_er: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const x0 = 280;
  const x1 = 3560;
  const y = 620;
  const draw = interpolate(frame, [110, 760], [0, 1], clamp01);
  const packetX = x0 + (x1 - x0) * draw;
  const packetBob = Math.sin(frame * 0.18) * 14;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke={HAIRLINE} strokeWidth={8} />
      <line x1={x0} y1={y} x2={packetX} y2={y} stroke={EMERALD} strokeWidth={8} strokeLinecap="round"
        style={{filter: 'drop-shadow(0 0 16px rgba(16,185,129,0.6))'}} />
      {STEPS_er.map((st, i) => {
        const fx = x0 + ((x1 - x0) / 4) * i;
        const on = frame >= STEP_AT_er[i];
        const s = spring({frame: frame - STEP_AT_er[i], fps, config: {damping: 200, stiffness: 110}});
        if (s <= 0.001) return null;
        return (
          <g key={st} opacity={Math.min(1, s)}>
            <circle cx={fx} cy={y} r={40} fill={on ? EMERALD : '#0D1411'} stroke={on ? EMERALD : HAIRLINE} strokeWidth={5} />
            {on && <text x={fx} y={y + 15} fill="#05281D" fontSize={40} fontWeight={800} textAnchor="middle">\u2713</text>}
            <text x={fx} y={y + 108} fill={on ? INK : FAINT} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {st}
            </text>
          </g>
        );
      })}
      {/* traveling receipt packet */}
      {draw > 0.01 && draw < 0.995 && (
        <g transform={`translate(${packetX},${y + packetBob})`}>
          <rect x={-64} y={-46} width={128} height={92} rx={14} fill="#F2F7F4" stroke={EMERALD} strokeWidth={4} />
          <text x={0} y={10} fill="#0A0E0C" fontSize={40} textAnchor="middle">$</text>
          <circle cx={0} cy={0} r={86} fill="none" stroke={EMERALD} strokeWidth={3} opacity={0.5} />
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Receipts assembling into the report (left)
// ---------------------------------------------------------------------------
const Receipts_er: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const total = TOTAL_er * interpolate(frame, [330, 460], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', left: 220, top: 880, width: 900}}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>EXPENSE REPORT \u00B7 Q3 TRAVEL</div>
      <div style={{display: 'flex', gap: 32, marginTop: 26}}>
        {RECEIPTS_er.map((r, i) => {
          const s = spring({frame: frame - (120 + i * 55), fps, config: {damping: 200, stiffness: 100}});
          if (s <= 0.001) return null;
          const scanned = interpolate(frame, [120 + i * 55 + 40, 120 + i * 55 + 90], [0, 1], clamp01);
          return (
            <div key={r.label} style={{
              width: 276, borderRadius: 22, background: PANEL, border: `2px solid ${HAIRLINE}`,
              padding: '26px 30px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 46}px)`,
            }}>
              <div style={{height: 110, borderRadius: 12, background: 'rgba(242,247,244,0.06)', border: `2px dashed ${FAINT}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative'}}>
                <div style={{color: FAINT, fontFamily: MONO, fontSize: 24}}>RECEIPT</div>
                <div style={{position: 'absolute', left: 0, right: 0, top: `${scanned * 110}px`, height: 4, backgroundColor: EMERALD, boxShadow: '0 0 16px rgba(16,185,129,0.9)'}} />
              </div>
              <div style={{color: MUTED, fontFamily: FONT, fontSize: 24, marginTop: 16}}>{r.label}</div>
              <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 44, marginTop: 6}}>{fmt(r.amount)}</div>
            </div>
          );
        })}
      </div>
      <div style={{marginTop: 30, display: 'flex', alignItems: 'baseline', gap: 24}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 2}}>REPORT TOTAL</div>
        <div style={{color: EMERALD, fontFamily: MONO, fontWeight: 800, fontSize: 84, textShadow: '0 0 30px rgba(16,185,129,0.4)'}}>
          {fmt(total)}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Manager review + approve stamp (center-right)
// ---------------------------------------------------------------------------
const Review_er: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 470, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const stamp = interpolate(frame, [650, 690], [0, 1], clamp01);
  const checks = ['Policy match \u2713', 'Receipts attached \u2713', 'Amounts verified \u2713'];
  return (
    <div style={{
      position: 'absolute', left: 1300, top: 880, width: 760, borderRadius: 28,
      background: PANEL, border: `2px solid ${HAIRLINE}`, padding: '40px 48px',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>MANAGER REVIEW QUEUE</div>
      <div style={{marginTop: 20}}>
        {checks.map((c, k) => {
          const on = frame >= 520 + k * 40;
          return (
            <div key={c} style={{display: 'flex', gap: 18, alignItems: 'center', marginTop: 14, opacity: on ? 1 : 0.3}}>
              <div style={{width: 36, height: 36, borderRadius: 18, backgroundColor: on ? EMERALD : 'rgba(242,247,244,0.12)', color: '#05281D', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {on ? '\u2713' : ''}
              </div>
              <div style={{color: MUTED, fontFamily: FONT, fontSize: 32}}>{c}</div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 30, textAlign: 'center', color: EMERALD, fontFamily: MONO, fontWeight: 800, fontSize: 54,
        border: `4px solid ${EMERALD}`, borderRadius: 16, padding: '16px 0',
        transform: `rotate(-5deg) scale(${0.5 + stamp * 0.5})`, opacity: stamp,
        boxShadow: '0 0 50px rgba(16,185,129,0.35)',
      }}>
        APPROVED
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Reimburse payout (right)
// ---------------------------------------------------------------------------
const Payout_er: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 740, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const paid = TOTAL_er * interpolate(frame, [770, 860], [0, 1], clamp01);
  const pulse = 0.5 + 0.5 * Math.sin((frame - 740) * 0.12);
  return (
    <div style={{
      position: 'absolute', right: 220, top: 880, width: 760, borderRadius: 28,
      background: 'rgba(5,20,14,0.94)', border: `3px solid ${EMERALD}`, padding: '40px 48px',
      opacity: Math.min(1, s), transform: `translateX(${(1 - s) * 80}px)`,
      boxShadow: `0 0 ${50 + pulse * 50}px rgba(16,185,129,0.4)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>PAYOUT \u00B7 DIRECT DEPOSIT</div>
      <div style={{color: EMERALD, fontFamily: MONO, fontWeight: 800, fontSize: 92, marginTop: 16, textShadow: '0 0 34px rgba(16,185,129,0.5)'}}>
        {fmt(paid)}
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 14, lineHeight: 1.5}}>
        Sent to <b style={{color: INK}}>checking \u00B7\u00B74218</b><br />
        Arrives in 3 business days
      </div>
      <div style={{marginTop: 24, display: 'flex', gap: 14, alignItems: 'center'}}>
        <div style={{width: 34, height: 34, borderRadius: 17, backgroundColor: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3A2A05', fontWeight: 800, fontSize: 22}}>$</div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 26}}>AUDIT TRAIL SAVED</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bottom caption strip
// ---------------------------------------------------------------------------
const Caption_er: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 180], [0, 1], clamp01);
  const step = STEP_AT_er.reduce((acc, at, i) => (frame >= at ? i : acc), 0);
  const captions = [
    'Snap the receipt the moment you spend',
    'Receipts auto-assemble into one report',
    'Your manager reviews against policy',
    'One stamp — approved',
    'Money lands in your account',
  ];
  return (
    <div style={{position: 'absolute', bottom: 130, left: 0, right: 0, textAlign: 'center', opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontSize: 44, fontWeight: 600}}>{captions[step]}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const ExpenseReimbursementFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_er frame={frame} />
      <AmbientParticles_er frame={frame} />
      <Title_er frame={frame} fps={fps} />
      <Rail_er frame={frame} fps={fps} />
      <Receipts_er frame={frame} fps={fps} />
      <Review_er frame={frame} fps={fps} />
      <Payout_er frame={frame} fps={fps} />
      <Caption_er frame={frame} />
      <TickerTape_er frame={frame} />
      <CornerHud_er frame={frame} />
      <FineDither_er frame={frame} />
      <FilmGrain_er frame={frame} />
    </AbsoluteFill>
  );
};
