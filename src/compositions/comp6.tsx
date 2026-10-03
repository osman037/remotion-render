/**
 * EmergencyFundJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Building a safety net: the paycheck arrives -> a safety-net shield
 * appears -> transfers fill the net jar through $1k / $3k / $6k milestone
 * rings -> a lightning-bolt car repair ($1,200) hits -> the jar deploys a
 * shield while the debt-spiral path fades -> the refill loop resumes and
 * "3-6 MONTHS COVERED" lands as the payoff. Deterministic.
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
// Palette (gold/green on dark slate)
// ---------------------------------------------------------------------------
const BG = '#0C1017';
const INK = '#F4F7FB';
const MUTED = 'rgba(244,247,251,0.62)';
const FAINT = 'rgba(244,247,251,0.32)';
const GOLD = '#FBBF24';
const GREEN = '#34D399';
const RED = '#F87171';
const PANEL = 'rgba(16,22,34,0.94)';
const HAIRLINE = 'rgba(244,247,251,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: efund
// ---------------------------------------------------------------------------
const Background_efund: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#F9D67A" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(251,191,36,0.12), rgba(251,191,36,0.03) 46%, rgba(12,16,23,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#efundVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(251,191,36,0.045)" />
        <defs>
          <radialGradient id="efundVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(12,16,23,0)" />
            <stop offset="100%" stopColor="rgba(4,6,10,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_efund: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`efund-amb-x-${i}`) * 3840;
    const by = random(`efund-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`efund-amb-s-${i}`) * 1.4;
    const ang = random(`efund-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`efund-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? GOLD : i % 4 === 1 ? GREEN : 'rgba(244,247,251,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_efund: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`efund-dth-x-${i}`) * 3840;
    const by = random(`efund-dth-y-${i}`) * 2160;
    const jx = (random(`efund-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`efund-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`efund-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`efund-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#F8E3A6" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_efund = [
  'PAYCHECK $4,200',
  'AUTO-TRANSFER $500',
  'MILESTONE $1K',
  'MILESTONE $3K',
  'MILESTONE $6K',
  'CAR REPAIR $1,200',
  'SHIELD DEPLOYED',
  'NO NEW DEBT',
  '3-6 MONTHS COVERED',
];
const TickerTape_efund: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_efund.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(251,191,36,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(5,7,11,0.66)', borderBottom: '1px solid rgba(244,247,251,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_efund: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(251,191,36,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={GOLD} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? GOLD : 'rgba(244,247,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? GOLD : 'rgba(244,247,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_efund: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`efund-grain-x-${frame}-${i}`) * 3840;
    const y = random(`efund-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`efund-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`efund-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Fund model: deterministic
// ---------------------------------------------------------------------------
const PAYCHECK_efund = 4200;
const TRANSFER_efund = 500;
const MILESTONES_efund = [1000, 3000, 6000];
const HIT_efund = 1200; // car repair
const fmt$ = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

// fund balance timeline: builds 0->6000 (300-560), drops to 4800 (620-660), refills 4800->6000 (770-890)
const balanceAt_efund = (frame: number): number => {
  if (frame < 300) return 0;
  if (frame < 560) return 6000 * interpolate(frame, [300, 560], [0, 1], clamp01);
  if (frame < 620) return 6000;
  if (frame < 660) return 6000 - HIT_efund * interpolate(frame, [620, 660], [0, 1], clamp01);
  if (frame < 770) return 4800;
  return 4800 + HIT_efund * interpolate(frame, [770, 890], [0, 1], clamp01);
};

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_efund: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        EMERGENCY FUND JOURNEY
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        Build the net &middot; survive the hit &middot; never touch the credit card
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Shield graphic (safety net symbol)
// ---------------------------------------------------------------------------
const Shield_efund: React.FC<{size: number; color: string; glow?: boolean}> = ({size, color, glow = false}) => (
  <svg width={size} height={size * 1.28} viewBox="0 0 200 256"
    style={glow ? {filter: `drop-shadow(0 0 26px ${color})`} : undefined}>
    <path d="M100 8 L178 44 V132 C178 196 142 226 100 248 C58 226 22 196 22 132 V44 Z"
      fill="rgba(52,211,153,0.12)" stroke={color} strokeWidth={12} strokeLinejoin="round" />
    <path d="M70 118 L96 146 L132 92" fill="none" stroke={color} strokeWidth={16}
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------------------
// Stage 1: paycheck arrives (left card) + shield appears
// ---------------------------------------------------------------------------
const Paycheck_efund: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const pay = PAYCHECK_efund * interpolate(frame, [80, 160], [0, 1], clamp01);
  const autoOn = frame >= 300;
  return (
    <div style={{
      position: 'absolute', left: 240, top: 520, width: 1180, height: 760,
      borderRadius: 36, background: PANEL, border: `2px solid ${HAIRLINE}`,
      padding: '52px 64px', opacity: Math.min(1, s), transform: `translateX(${(1 - s) * -80}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>DIRECT DEPOSIT — PAYCHECK</div>
      <div style={{color: GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 110, marginTop: 16, textShadow: '0 0 34px rgba(251,191,36,0.5)'}}>
        {fmt$(pay)}
      </div>
      <div style={{marginTop: 40, borderTop: `2px solid ${HAIRLINE}`, paddingTop: 34}}>
        {[
          {k: 'GROSS PAY', v: '$5,100'},
          {k: 'TAXES + BENEFITS', v: '−$900'},
          {k: 'NET', v: fmt$(PAYCHECK_efund)},
        ].map((r, i) => {
          const on = interpolate(frame, [110 + i * 26, 130 + i * 26], [0, 1], clamp01);
          return (
            <div key={r.k} style={{display: 'flex', justifyContent: 'space-between', marginTop: 26, opacity: on}}>
              <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 2}}>{r.k}</div>
              <div style={{color: INK, fontFamily: MONO, fontSize: 38, fontWeight: 700}}>{r.v}</div>
            </div>
          );
        })}
      </div>
      {autoOn && (
        <div style={{
          marginTop: 44, borderRadius: 24, padding: '28px 40px', background: 'rgba(52,211,153,0.08)',
          border: `2px solid ${GREEN}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 0 30px rgba(52,211,153,0.3)',
        }}>
          <div style={{color: GREEN, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>⚡ AUTO-TRANSFER ON</div>
          <div style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 52}}>{fmt$(TRANSFER_efund)} / payday</div>
        </div>
      )}
    </div>
  );
};

const ShieldAppear_efund: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 200, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const bob = Math.sin(frame * 0.05) * 14;
  return (
    <div style={{
      position: 'absolute', left: 1640, top: 560, opacity: Math.min(1, s),
      transform: `translateY(${(1 - s) * 80 + bob}px) scale(${0.7 + 0.3 * s})`,
      textAlign: 'center',
    }}>
      <Shield_efund size={300} color={GREEN} glow />
      <div style={{color: GREEN, fontFamily: MONO, fontSize: 34, fontWeight: 800, letterSpacing: 3, marginTop: 18}}>SAFETY NET</div>
    </div>
  );
};

// transfer stream: paycheck -> jar (and refill phase)
const TransferStream_efund: React.FC<{frame: number}> = ({frame}) => {
  const coins: React.ReactElement[] = [];
  const phases: Array<[number, number]> = [[310, 560], [770, 890]];
  phases.forEach(([a, b], ph) => {
    for (let i = 0; i < 26; i++) {
      const start = a + i * ((b - a) / 26);
      const p = interpolate(frame, [start, start + 60], [0, 1], clamp01);
      if (p <= 0 || p >= 1) continue;
      const cx = interpolate(p, [0, 1], [1420, 2680], clamp01);
      const cy = 900 - Math.sin(p * Math.PI) * 130;
      coins.push(
        <g key={`${ph}-${i}`} opacity={0.35 + 0.65 * p}>
          <circle cx={cx} cy={cy} r={24} fill={GOLD} style={{filter: 'drop-shadow(0 0 14px rgba(251,191,36,0.8))'}} />
          <text x={cx} y={cy + 11} fill={BG} fontSize={28} fontFamily={MONO} fontWeight={800} textAnchor="middle">$</text>
        </g>
      );
    }
  });
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {coins}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Stage 2: the net jar + milestone rings
// ---------------------------------------------------------------------------
const NetJar_efund: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 240, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const bal = balanceAt_efund(frame);
  const fillP = Math.min(1, bal / 6000);
  const hitFlash = frame >= 620 && frame <= 680 ? 0.5 + 0.5 * Math.sin(frame * 0.5) : 0;
  return (
    <div style={{position: 'absolute', left: 2300, top: 520, width: 1200, height: 1000, opacity: Math.min(1, s)}}>
      <svg width={1200} height={1000} viewBox="0 0 1200 1000">
        <rect x={380} y={120} width={440} height={60} rx={30} fill="rgba(244,247,251,0.25)" />
        <rect x={320} y={180} width={560} height={640} rx={90} fill="rgba(251,191,36,0.06)"
          stroke="rgba(244,247,251,0.35)" strokeWidth={9} />
        <clipPath id="efundJarClip">
          <rect x={320} y={180} width={560} height={640} rx={90} />
        </clipPath>
        <g clipPath="url(#efundJarClip)">
          <rect x={320} y={820 - 640 * fillP} width={560} height={640 * fillP} fill="rgba(251,191,36,0.5)" />
          {Array.from({length: 55}, (_, i) => {
            const gx = 350 + random(`efund-jar-x-${i}`) * 500;
            const gy = 820 - random(`efund-jar-y-${i}`) * 640 * fillP;
            const wob = Math.sin(frame * 0.09 + i * 2.2) * 9;
            return <circle key={i} cx={gx + wob} cy={gy} r={20} fill={GOLD} opacity={0.92} />;
          })}
        </g>
        {hitFlash > 0 && (
          <rect x={320} y={180} width={560} height={640} rx={90} fill={RED} opacity={hitFlash * 0.28} />
        )}
        <text x={600} y={920} fill={MUTED} fontSize={40} fontFamily={MONO} textAnchor="middle" letterSpacing={8}>EMERGENCY NET</text>
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center'}}>
        <div style={{
          color: hitFlash > 0 ? RED : GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 120,
          textShadow: `0 0 40px ${hitFlash > 0 ? 'rgba(248,113,113,0.7)' : 'rgba(251,191,36,0.55)'}`,
        }}>
          {fmt$(bal)}
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3}}>FUND BALANCE</div>
      </div>
      {/* milestone rings */}
      {MILESTONES_efund.map((m, i) => {
        const cx = 2400 + i * 520;
        const lit = bal >= m - 1;
        const ringS = spring({frame: frame - (360 + i * 90), fps, config: {damping: 200, stiffness: 90}});
        if (ringS <= 0.001) return null;
        return (
          <div key={m} style={{
            position: 'absolute', left: cx - 600 - 160, top: 1560 - 520, width: 320, height: 320,
            opacity: Math.min(1, ringS), transform: `scale(${0.7 + 0.3 * ringS})`,
          }}>
            <svg width={320} height={320} viewBox="0 0 320 320">
              <circle cx={160} cy={160} r={120} fill="none" stroke="rgba(244,247,251,0.12)" strokeWidth={26} />
              <circle cx={160} cy={160} r={120} fill="none" stroke={lit ? GREEN : 'rgba(244,247,251,0.25)'}
                strokeWidth={26} strokeDasharray={2 * Math.PI * 120}
                strokeDashoffset={lit ? 0 : 2 * Math.PI * 120} transform="rotate(-90 160 160)"
                strokeLinecap="round"
                style={lit ? {filter: 'drop-shadow(0 0 20px rgba(52,211,153,0.7))'} : undefined} />
              <text x={160} y={152} fill={lit ? GREEN : MUTED} fontSize={52} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                {fmt$(m)}
              </text>
              <text x={160} y={196} fill={FAINT} fontSize={24} fontFamily={MONO} textAnchor="middle">MILESTONE</text>
            </svg>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 3: lightning hit -> shield deploys -> debt path fades
// ---------------------------------------------------------------------------
const LightningHit_efund: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 560, fps, config: {damping: 200, stiffness: 120}});
  if (s <= 0.001) return null;
  const boltOn = frame >= 580 && frame <= 640;
  const flick = boltOn ? (frame % 4 < 2 ? 1 : 0.35) : 0;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {boltOn && (
        <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={flick}>
          <polygon points="2960,180 2840,700 2920,700 2800,1180 3060,760 2970,760 3080,380 3000,380"
            fill={GOLD} style={{filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.9))'}} />
        </svg>
      )}
      <div style={{
        position: 'absolute', right: 240, top: 1520, width: 1050,
        borderRadius: 30, background: PANEL, border: `3px solid ${RED}`,
        padding: '36px 56px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
        boxShadow: '0 0 50px rgba(248,113,113,0.35)',
      }}>
        <div style={{color: RED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>⚡ UNEXPECTED EXPENSE</div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14}}>
          <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 52}}>CAR REPAIR</div>
          <div style={{color: RED, fontFamily: MONO, fontWeight: 800, fontSize: 72}}>−{fmt$(HIT_efund)}</div>
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, marginTop: 10}}>Paid from the net — balance drops to {fmt$(6000 - HIT_efund)}</div>
      </div>
    </div>
  );
};

const ShieldDeploy_efund: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 660, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  // debt spiral path fades as the shield covers the jar
  const debtFade = interpolate(frame, [660, 730], [1, 0], clamp01);
  const dash = (frame * 14) % 80;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: Math.min(1, s)}}>
      {debtFade > 0.001 && (
        <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={debtFade * 0.9}>
          <path d="M 3050 1450 C 3350 1600, 3100 1800, 3450 1900 C 3600 1950, 3550 2050, 3700 2080"
            fill="none" stroke={RED} strokeWidth={10} strokeDasharray="26 22" strokeDashoffset={-dash}
            style={{filter: 'drop-shadow(0 0 16px rgba(248,113,113,0.7))'}} />
          <text x={3300} y={1900} fill={RED} fontSize={38} fontFamily={MONO} fontWeight={800} letterSpacing={2}>
            CREDIT-CARD DEBT SPIRAL
          </text>
          <text x={3300} y={1952} fill={MUTED} fontSize={30} fontFamily={MONO}>18% APR &middot; minimum payments</text>
        </svg>
      )}
      <div style={{
        position: 'absolute', left: 2300, top: 520, width: 1200, height: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${0.6 + 0.4 * s})`,
      }}>
        <div style={{
          position: 'absolute', inset: 60, borderRadius: 60,
          border: `10px solid rgba(52,211,153,${0.5 + 0.3 * Math.sin(frame * 0.1)})`,
          boxShadow: '0 0 80px rgba(52,211,153,0.45)',
        }} />
        <div style={{position: 'absolute', top: -30, left: 0, right: 0, textAlign: 'center'}}>
          <span style={{
            background: 'rgba(6,14,10,0.95)', border: `3px solid ${GREEN}`, borderRadius: 40,
            padding: '14px 50px', color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 40,
          }}>
            🛡 SHIELD DEPLOYED — NO DEBT TAKEN
          </span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 4: refill loop + payoff
// ---------------------------------------------------------------------------
const RefillLoop_efund: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 770) return null;
  const fade = interpolate(frame, [770, 800], [0, 1], clamp01);
  return (
    <div style={{
      position: 'absolute', left: 240, top: 1420, opacity: fade,
      borderRadius: 30, background: PANEL, border: `2px solid ${HAIRLINE}`, padding: '36px 56px',
    }}>
      <div style={{color: GREEN, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>↻ REFILL LOOP RESUMED</div>
      <div style={{color: INK, fontFamily: FONT, fontSize: 40, marginTop: 10}}>
        {fmt$(TRANSFER_efund)} auto-transfer every payday — the net rebuilds itself
      </div>
      {/* mini progress ticks */}
      <div style={{display: 'flex', gap: 12, marginTop: 22}}>
        {Array.from({length: 24}, (_, i) => {
          const on = interpolate(frame, [780 + i * 4, 790 + i * 4], [0, 1], clamp01);
          return <div key={i} style={{
            width: 34, height: 20, borderRadius: 6,
            background: on > 0.5 ? GREEN : 'rgba(244,247,251,0.12)',
            boxShadow: on > 0.5 ? '0 0 12px rgba(52,211,153,0.6)' : 'none',
          }} />;
        })}
      </div>
    </div>
  );
};

const Payoff_efund: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 820, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin((frame - 820) * 0.12);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 130, display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        borderRadius: 30, padding: '34px 100px', background: 'rgba(6,12,8,0.94)',
        border: `3px solid ${GREEN}`, textAlign: 'center',
        boxShadow: `0 0 ${50 + pulse * 50}px rgba(52,211,153,0.4)`,
      }}>
        <div style={{color: GREEN, fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 1}}>3–6 MONTHS COVERED</div>
        <div style={{color: INK, fontFamily: MONO, fontSize: 36, marginTop: 10}}>
          {fmt$(6000)} safety net &middot; the next emergency is already paid for
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const EmergencyFundJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_efund frame={frame} />
      <AmbientParticles_efund frame={frame} />
      <Title_efund frame={frame} fps={fps} />
      <Paycheck_efund frame={frame} fps={fps} />
      <ShieldAppear_efund frame={frame} fps={fps} />
      <TransferStream_efund frame={frame} />
      <NetJar_efund frame={frame} fps={fps} />
      <LightningHit_efund frame={frame} fps={fps} />
      <ShieldDeploy_efund frame={frame} fps={fps} />
      <RefillLoop_efund frame={frame} fps={fps} />
      <Payoff_efund frame={frame} fps={fps} />
      <TickerTape_efund frame={frame} />
      <CornerHud_efund frame={frame} />
      <FineDither_efund frame={frame} />
      <FilmGrain_efund frame={frame} />
    </AbsoluteFill>
  );
};
