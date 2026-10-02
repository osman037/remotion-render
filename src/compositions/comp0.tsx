/**
 * HowAHealthPlanWorks.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Teaches health-plan money mechanics: a $4,800 medical bill flows through
 * four stages — BILL -> DEDUCTIBLE (you pay first $2,000) -> COINSURANCE
 * (80/20 split of the rest) -> OUT-OF-POCKET MAX ($2,560 of $8,000) —
 * ending in the "PLAN PAYS 100%" payoff. Brand-neutral, deterministic.
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
// Palette (deep navy, plan teal, patient amber)
// ---------------------------------------------------------------------------
const BG = '#060B16';
const INK = '#F1F5FB';
const MUTED = 'rgba(241,245,251,0.62)';
const FAINT = 'rgba(241,245,251,0.34)';
const TEAL = '#2DD4BF';
const TEAL_DEEP = '#0F766E';
const AMBER = '#FBBF24';
const AMBER_DEEP = '#92400E';
const CYAN = '#67E8F9';
const ROSE = '#FB7185';
const PANEL = 'rgba(9,14,26,0.92)';
const HAIRLINE = 'rgba(241,245,251,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding (full-frame per-frame motion). Seed prefix: hp
// ---------------------------------------------------------------------------
const Background_hp: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#9FD8E8" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(45,212,191,0.13), rgba(45,212,191,0.03) 46%, rgba(6,11,22,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#hpVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(45,212,191,0.045)" />
        <defs>
          <radialGradient id="hpVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(6,11,22,0)" />
            <stop offset="100%" stopColor="rgba(2,4,9,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_hp: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`hp-amb-x-${i}`) * 3840;
    const by = random(`hp-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`hp-amb-s-${i}`) * 1.4;
    const ang = random(`hp-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`hp-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? CYAN : i % 4 === 1 ? TEAL : 'rgba(241,245,251,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_hp: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`hp-dth-x-${i}`) * 3840;
    const by = random(`hp-dth-y-${i}`) * 2160;
    const jx = (random(`hp-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`hp-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`hp-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`hp-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#CFE9FF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_hp = [
  'DEDUCTIBLE $2,000',
  'COINSURANCE 80 / 20',
  'OUT-OF-POCKET MAX $8,000',
  'YOUR COST $2,560',
  'PLAN PAYS $2,240',
  'IN-NETWORK RATES',
  'HSA / FSA ELIGIBLE',
  'PLAN PAYS 100% AFTER MAX',
];
const TickerTape_hp: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_hp.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(103,232,249,0.60)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(3,7,14,0.66)', borderBottom: '1px solid rgba(241,245,251,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_hp: React.FC<{frame: number}> = ({frame}) => {
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
            <circle cx={0} cy={0} r={6} fill={TEAL} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? TEAL : 'rgba(241,245,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? TEAL : 'rgba(241,245,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_hp: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`hp-grain-x-${frame}-${i}`) * 3840;
    const y = random(`hp-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`hp-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`hp-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Money model (fixed, deterministic)
// ---------------------------------------------------------------------------
const BILL = 4800;
const DEDUCTIBLE = 2000;
const COIN_YOU = 560;   // 20% of remaining 2800
const COIN_PLAN = 2240; // 80% of remaining 2800
const YOU_TOTAL = DEDUCTIBLE + COIN_YOU; // 2560
const OOP_MAX = 8000;

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_hp: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        HOW A HEALTH PLAN WORKS
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        One $4,800 medical bill &middot; the four money stages, step by step
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage rail (4 nodes, draws across the film)
// ---------------------------------------------------------------------------
const STAGES_hp = [
  {label: 'BILL', sub: '$4,800 arrives'},
  {label: 'DEDUCTIBLE', sub: 'you pay $2,000'},
  {label: 'COINSURANCE', sub: 'split 80 / 20'},
  {label: 'OOP MAX', sub: '$2,560 of $8,000'},
];
const Rail_hp: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const x0 = 320;
  const x1 = 3520;
  const y = 560;
  const draw = interpolate(frame, [110, 700], [0, 1], clamp01);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke={HAIRLINE} strokeWidth={6} />
      <line x1={x0} y1={y} x2={x0 + (x1 - x0) * draw} y2={y} stroke={TEAL} strokeWidth={6} strokeLinecap="round" />
      {STAGES_hp.map((st, i) => {
        const fx = x0 + ((x1 - x0) / 3) * i;
        const on = draw >= (i + 1) / 4 - 0.02;
        const s = spring({frame: frame - (110 + i * 130), fps, config: {damping: 200, stiffness: 110}});
        if (s <= 0.001) return null;
        return (
          <g key={st.label} opacity={Math.min(1, s)}>
            <circle cx={fx} cy={y} r={34} fill={on ? TEAL : '#0B1220'} stroke={on ? TEAL : HAIRLINE} strokeWidth={4} />
            {on && <circle cx={fx} cy={y} r={14} fill="#06231F" />}
            <text x={fx} y={y + 92} fill={on ? INK : FAINT} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {st.label}
            </text>
            <text x={fx} y={y + 138} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle">
              {st.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Stage 1: the bill arrives
// ---------------------------------------------------------------------------
const BillCard_hp: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 130, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const stamp = interpolate(frame, [220, 260], [0, 1], clamp01);
  return (
    <div style={{
      position: 'absolute', left: 300, top: 830, width: 780, height: 560, borderRadius: 28,
      background: `linear-gradient(160deg, rgba(251,191,36,0.12), rgba(251,191,36,0.02) 60%, rgba(255,255,255,0.02))`,
      border: '2px solid rgba(251,191,36,0.35)', padding: '44px 52px',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>STAGE 1 &middot; HOSPITAL BILL</div>
      <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 120, marginTop: 24, textShadow: '0 0 30px rgba(251,191,36,0.35)'}}>
        $4,800
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 32, marginTop: 18, lineHeight: 1.5}}>
        Emergency visit &middot; in-network<br />This is the <b style={{color: INK}}>billed amount</b> —<br />not what you pay yet.
      </div>
      <div style={{
        position: 'absolute', right: 40, top: 40, color: AMBER, fontFamily: MONO, fontWeight: 800,
        fontSize: 34, border: `3px solid ${AMBER}`, borderRadius: 12, padding: '10px 22px',
        transform: `rotate(-8deg) scale(${0.6 + stamp * 0.4})`, opacity: stamp,
      }}>
        DUE
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 2: deductible bar (you pay the first $2,000)
// ---------------------------------------------------------------------------
const Deductible_hp: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 280, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const fill = interpolate(frame, [330, 500], [0, 1], clamp01);
  const paid = Math.round(DEDUCTIBLE * fill);
  return (
    <div style={{
      position: 'absolute', left: 1180, top: 830, width: 780, height: 560, borderRadius: 28,
      background: `linear-gradient(160deg, rgba(251,191,36,0.10), rgba(251,191,36,0.02) 60%, rgba(255,255,255,0.02))`,
      border: '2px solid rgba(251,191,36,0.30)', padding: '44px 52px',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>STAGE 2 &middot; DEDUCTIBLE</div>
      <div style={{color: AMBER, fontFamily: MONO, fontWeight: 800, fontSize: 72, marginTop: 20}}>
        ${paid.toLocaleString('en-US')}
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 6}}>of $2,000 deductible — <b style={{color: AMBER}}>you pay first</b></div>
      <div style={{marginTop: 34, height: 46, borderRadius: 23, background: 'rgba(241,245,251,0.08)', border: `1px solid ${HAIRLINE}`, overflow: 'hidden'}}>
        <div style={{width: `${fill * 100}%`, height: '100%', borderRadius: 23, background: `linear-gradient(90deg, ${AMBER_DEEP}, ${AMBER})`, transition: 'none'}} />
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 26, lineHeight: 1.55}}>
        The plan starts helping <b style={{color: INK}}>only after</b><br />you cover the deductible.
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 3: coinsurance donut (80/20 of the remaining $2,800)
// ---------------------------------------------------------------------------
const Coinsurance_hp: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 440, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const draw = interpolate(frame, [490, 660], [0, 1], clamp01);
  const R = 150;
  const C = 2 * Math.PI * R;
  const planFrac = 0.8;
  return (
    <div style={{
      position: 'absolute', left: 2060, top: 830, width: 780, height: 560, borderRadius: 28,
      background: `linear-gradient(160deg, rgba(45,212,191,0.10), rgba(45,212,191,0.02) 60%, rgba(255,255,255,0.02))`,
      border: '2px solid rgba(45,212,191,0.30)', padding: '44px 52px',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>STAGE 3 &middot; COINSURANCE</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 40, marginTop: 26}}>
        <svg width={360} height={360} viewBox="0 0 360 360">
          <circle cx={180} cy={180} r={R} fill="none" stroke="rgba(241,245,251,0.10)" strokeWidth={44} />
          <circle cx={180} cy={180} r={R} fill="none" stroke={TEAL} strokeWidth={44}
            strokeDasharray={C} strokeDashoffset={C * (1 - planFrac * draw)}
            transform="rotate(-90 180 180)" strokeLinecap="round" />
          <circle cx={180} cy={180} r={R} fill="none" stroke={AMBER} strokeWidth={44}
            strokeDasharray={C} strokeDashoffset={C * (1 - (1 - planFrac) * draw)}
            transform={`rotate(${-90 + 360 * planFrac * draw} 180 180)`} strokeLinecap="round" opacity={draw > 0.02 ? 1 : 0} />
          <text x={180} y={172} fill={INK} fontSize={52} fontFamily={MONO} fontWeight={800} textAnchor="middle">80/20</text>
          <text x={180} y={214} fill={MUTED} fontSize={26} fontFamily={MONO} textAnchor="middle">SPLIT</text>
        </svg>
        <div>
          <div style={{color: TEAL, fontFamily: MONO, fontWeight: 800, fontSize: 56}}>PLAN ${Math.round(COIN_PLAN * draw).toLocaleString('en-US')}</div>
          <div style={{color: AMBER, fontFamily: MONO, fontWeight: 800, fontSize: 56, marginTop: 14}}>YOU ${Math.round(COIN_YOU * draw).toLocaleString('en-US')}</div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 28, marginTop: 14}}>of the remaining $2,800</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 4: out-of-pocket max meter
// ---------------------------------------------------------------------------
const OopMax_hp: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 600, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const fill = interpolate(frame, [650, 790], [0, 1], clamp01);
  const youNow = Math.round(YOU_TOTAL * fill);
  return (
    <div style={{
      position: 'absolute', left: 2940, top: 830, width: 640, height: 560, borderRadius: 28,
      background: `linear-gradient(160deg, rgba(103,232,249,0.10), rgba(103,232,249,0.02) 60%, rgba(255,255,255,0.02))`,
      border: '2px solid rgba(103,232,249,0.30)', padding: '44px 52px',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>STAGE 4 &middot; OOP MAX</div>
      <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 64, marginTop: 20}}>
        ${youNow.toLocaleString('en-US')}
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 6}}>your total vs <b style={{color: INK }}>$8,000 max</b></div>
      <div style={{marginTop: 34, height: 46, borderRadius: 23, background: 'rgba(241,245,251,0.08)', border: `1px solid ${HAIRLINE}`, overflow: 'hidden'}}>
        <div style={{width: `${(YOU_TOTAL / OOP_MAX) * fill * 100}%`, height: '100%', borderRadius: 23, background: `linear-gradient(90deg, ${TEAL_DEEP}, ${CYAN})`}} />
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 26, lineHeight: 1.55}}>
        Below the max — so the<br />split keeps applying.
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payoff banner: PLAN PAYS 100%
// ---------------------------------------------------------------------------
const Payoff_hp: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 790, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin((frame - 790) * 0.1);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 1480, display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `scale(${0.9 + s * 0.1})`,
    }}>
      <div style={{
        borderRadius: 30, padding: '44px 110px', textAlign: 'center',
        background: 'rgba(6,20,18,0.92)', border: `3px solid ${TEAL}`,
        boxShadow: `0 0 ${60 + pulse * 60}px rgba(45,212,191,0.45)`,
      }}>
        <div style={{color: TEAL, fontFamily: FONT, fontWeight: 800, fontSize: 84, letterSpacing: 2}}>
          PLAN PAYS 100%
        </div>
        <div style={{color: INK, fontFamily: MONO, fontSize: 40, marginTop: 14}}>
          once your $8,000 out-of-pocket max is reached &middot; <span style={{color: AMBER}}>your cost this bill: $2,560</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ledger (right side): running YOU vs PLAN totals
// ---------------------------------------------------------------------------
const Ledger_hp: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [150, 210], [0, 1], clamp01);
  if (fade <= 0) return null;
  const youBill = Math.round(YOU_TOTAL * interpolate(frame, [490, 790], [0, 1], clamp01));
  const planBill = Math.round(COIN_PLAN * interpolate(frame, [490, 790], [0, 1], clamp01));
  return (
    <div style={{position: 'absolute', top: 104, right: 220, opacity: fade, textAlign: 'right'}}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>THIS BILL &middot; RUNNING TOTAL</div>
      <div style={{color: AMBER, fontFamily: MONO, fontWeight: 800, fontSize: 72, marginTop: 10, textShadow: '0 0 26px rgba(251,191,36,0.4)'}}>
        YOU ${youBill.toLocaleString('en-US')}
      </div>
      <div style={{color: TEAL, fontFamily: MONO, fontWeight: 800, fontSize: 72, marginTop: 6, textShadow: '0 0 26px rgba(45,212,191,0.4)'}}>
        PLAN ${planBill.toLocaleString('en-US')}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const HowAHealthPlanWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_hp frame={frame} />
      <AmbientParticles_hp frame={frame} />
      <Title_hp frame={frame} fps={fps} />
      <Ledger_hp frame={frame} />
      <Rail_hp frame={frame} fps={fps} />
      <BillCard_hp frame={frame} fps={fps} />
      <Deductible_hp frame={frame} fps={fps} />
      <Coinsurance_hp frame={frame} fps={fps} />
      <OopMax_hp frame={frame} fps={fps} />
      <Payoff_hp frame={frame} fps={fps} />
      <TickerTape_hp frame={frame} />
      <CornerHud_hp frame={frame} />
      <FineDither_hp frame={frame} />
      <FilmGrain_hp frame={frame} />
    </AbsoluteFill>
  );
};
