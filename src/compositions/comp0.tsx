/**
 * BuyNowPayLaterSchedule.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The buy-now-pay-later schedule: a $480 checkout total splits into four
 * interest-free payments on a six-week timeline. The 0% INTEREST stamp
 * lands, autopay pulses fire each chip in sequence, the timeline drains to
 * zero, and the arc resolves with PAID IN FULL. Deterministic.
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
// Palette (deep navy, violet / fuchsia)
// ---------------------------------------------------------------------------
const BG = '#0D0B1E';
const INK = '#F2EEFF';
const MUTED = 'rgba(242,238,255,0.62)';
const FAINT = 'rgba(242,238,255,0.32)';
const VIOLET = '#A78BFA';
const FUCHSIA = '#F472B6';
const GREEN = '#34D399';
const AMBER = '#FBBF24';
const PANEL = 'rgba(14,11,34,0.94)';
const HAIRLINE = 'rgba(242,238,255,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: bnpl
// ---------------------------------------------------------------------------
const Background_bnpl: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#D9C9FF" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 26%, rgba(167,139,250,0.14), rgba(244,114,182,0.04) 46%, rgba(13,11,30,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#bnplVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(167,139,250,0.045)" />
        <defs>
          <radialGradient id="bnplVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(13,11,30,0)" />
            <stop offset="100%" stopColor="rgba(5,4,14,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_bnpl: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`bnpl-amb-x-${i}`) * 3840;
    const by = random(`bnpl-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`bnpl-amb-s-${i}`) * 1.4;
    const ang = random(`bnpl-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`bnpl-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? VIOLET : i % 4 === 1 ? FUCHSIA : 'rgba(242,238,255,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_bnpl: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`bnpl-dth-x-${i}`) * 3840;
    const by = random(`bnpl-dth-y-${i}`) * 2160;
    const jx = (random(`bnpl-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`bnpl-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`bnpl-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`bnpl-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#D9C9FF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_bnpl = [
  'SPLIT INTO 4 PAYMENTS',
  '0% APR NO INTEREST',
  'AUTOPAY EVERY 2 WEEKS',
  'NO LATE FEES',
  'PAY IN 6 WEEKS',
  'CHECKOUT TOTAL $480',
  'NEVER PAY INTEREST',
  'PAY ON TIME EVERY TIME',
];
const TickerTape_bnpl: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_bnpl.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(167,139,250,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(6,4,16,0.66)', borderBottom: '1px solid rgba(242,238,255,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_bnpl: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(167,139,250,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={VIOLET} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? VIOLET : 'rgba(242,238,255,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? VIOLET : 'rgba(242,238,255,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_bnpl: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`bnpl-grain-x-${frame}-${i}`) * 3840;
    const y = random(`bnpl-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`bnpl-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`bnpl-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Payment plan model: 4 x $120 over 6 weeks. Deterministic.
// ---------------------------------------------------------------------------
const PAYMENTS_bnpl = [
  {label: 'TODAY', due: 'DUE NOW', amount: 120},
  {label: 'WEEK 2', due: 'OCT 17', amount: 120},
  {label: 'WEEK 4', due: 'OCT 31', amount: 120},
  {label: 'WEEK 6', due: 'NOV 14', amount: 120},
];
const TOTAL_bnpl = 480;
const TL_L = 300;
const TL_R = 3540;
const TL_Y = 1180;
const nodeX = (i: number) => TL_L + i * ((TL_R - TL_L) / 3);

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_bnpl: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        BUY NOW, PAY LATER SCHEDULE
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        4 interest-free payments &middot; every 2 weeks &middot; 0% APR, always
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Hero total card: splits into 4 chips that fly to the timeline
// ---------------------------------------------------------------------------
const HeroTotal_bnpl: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  // card dissolves as chips leave (f160 -> f360)
  const gone = interpolate(frame, [300, 380], [1, 0], clamp01);
  if (gone <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: 1520, top: 380, width: 800, opacity: Math.min(1, s) * gone,
      transform: `translateY(${(1 - s) * 60}px) scale(${0.92 + 0.08 * Math.min(1, s)})`,
    }}>
      <div style={{
        borderRadius: 32, background: PANEL, border: `2px solid ${VIOLET}`,
        padding: '44px 60px', textAlign: 'center',
        boxShadow: '0 0 60px rgba(167,139,250,0.35)',
      }}>
        <div style={{color: FAINT, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>CHECKOUT TOTAL</div>
        <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 150, marginTop: 8}}>$480.00</div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 34, marginTop: 10}}>SPLITTING INTO 4 PAYMENTS</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Timeline + payment chips
// ---------------------------------------------------------------------------
const Timeline_bnpl: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [150, 220], [0, 1], clamp01);
  if (fade <= 0) return null;
  // drain sweep across the timeline during autopay phase
  const drain = interpolate(frame, [470, 700], [0, 1], clamp01);
  const drainX = TL_L + drain * (TL_R - TL_L);
  const chips: React.ReactElement[] = [];
  for (let i = 0; i < 4; i++) {
    const start = 180 + i * 34;
    const fly = interpolate(frame, [start, start + 70], [0, 1], clamp01);
    const ease = 1 - Math.pow(1 - fly, 3);
    const x = interpolate(ease, [0, 1], [1920, nodeX(i)], clamp01);
    const y = interpolate(ease, [0, 1], [620, 900], clamp01);
    // autopay pulse for this chip
    const fire = 480 + i * 60;
    const p = interpolate(frame, [fire, fire + 90], [0, 1], clamp01);
    const done = interpolate(frame, [fire + 30, fire + 48], [0, 1], clamp01);
    const cx = nodeX(i);
    chips.push(
      <g key={i} opacity={fly <= 0 ? 0 : 1}>
        {/* autopay pulse ring */}
        {p > 0 && p < 1 && (
          <circle cx={cx} cy={990} r={70 + p * 430} fill="none" stroke={FUCHSIA} strokeWidth={10 * (1 - p) + 2} opacity={1 - p} />
        )}
        {p > 0 && p < 1 && (
          <circle cx={cx} cy={990} r={70 + p * 260} fill="none" stroke={VIOLET} strokeWidth={6 * (1 - p) + 1} opacity={(1 - p) * 0.8} />
        )}
        {/* chip card */}
        <g transform={`translate(${x - 210},${y}) scale(${1 + p * 0.08})`}>
          <rect x={0} y={0} width={420} height={180} rx={26}
            fill={done >= 1 ? 'rgba(20,40,30,0.96)' : PANEL}
            stroke={done >= 1 ? GREEN : VIOLET} strokeWidth={3}
            style={{filter: `drop-shadow(0 0 ${done >= 1 ? 24 : 14}px ${done >= 1 ? 'rgba(52,211,153,0.5)' : 'rgba(167,139,250,0.4)'})`}} />
          <text x={210} y={66} fill={done >= 1 ? GREEN : FAINT} fontSize={24} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
            {PAYMENTS_bnpl[i].due}
          </text>
          <text x={210} y={126} fill={INK} fontSize={56} fontFamily={MONO} fontWeight={800} textAnchor="middle">
            $120.00
          </text>
          {/* paid check overlay */}
          {done > 0 && (
            <g opacity={done}>
              <circle cx={372} cy={28} r={34} fill={GREEN} />
              <path d="M 358 28 L 368 40 L 388 16" fill="none" stroke="#04120B" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </g>
        {/* node on timeline */}
        <circle cx={cx} cy={TL_Y} r={22} fill={BG} stroke={done >= 1 ? GREEN : frame >= fire ? FUCHSIA : VIOLET} strokeWidth={6} />
        {done >= 1 && <circle cx={cx} cy={TL_Y} r={9} fill={GREEN} />}
        <text x={cx} y={TL_Y + 96} fill={done >= 1 ? GREEN : MUTED} fontSize={34} fontFamily={MONO} fontWeight={800} letterSpacing={3} textAnchor="middle">
          {PAYMENTS_bnpl[i].label}
        </text>
      </g>
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
      {/* base track */}
      <line x1={TL_L} y1={TL_Y} x2={TL_R} y2={TL_Y} stroke={HAIRLINE} strokeWidth={10} strokeLinecap="round" />
      {/* progress ticks */}
      {Array.from({length: 40}, (_, k) => {
        const xx = TL_L + k * ((TL_R - TL_L) / 39);
        const lit = xx <= drainX;
        return <rect key={k} x={xx - 3} y={TL_Y - 26} width={6} height={52} fill={lit ? FUCHSIA : 'rgba(242,238,255,0.16)'} rx={3} />;
      })}
      {/* drain sweep line */}
      {drain > 0 && drain < 1 && (
        <g>
          <line x1={TL_L} y1={TL_Y} x2={drainX} y2={TL_Y} stroke={FUCHSIA} strokeWidth={10} strokeLinecap="round"
            style={{filter: 'drop-shadow(0 0 18px rgba(244,114,182,0.8))'}} />
          <circle cx={drainX} cy={TL_Y} r={30} fill={FUCHSIA} opacity={0.9} />
        </g>
      )}
      {drain >= 1 && (
        <line x1={TL_L} y1={TL_Y} x2={TL_R} y2={TL_Y} stroke={GREEN} strokeWidth={10} strokeLinecap="round"
          style={{filter: 'drop-shadow(0 0 18px rgba(52,211,153,0.7))'}} />
      )}
      {chips}
      <text x={TL_L} y={TL_Y - 70} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={4}>6-WEEK TIMELINE</text>
      <text x={TL_R} y={TL_Y - 70} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={4} textAnchor="end">SCHEDULE 4 OF 4</text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// 0% INTEREST stamp slams in
// ---------------------------------------------------------------------------
const Stamp_bnpl: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 360, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const ringP = interpolate(frame, [392, 462], [0, 1], clamp01);
  const wobble = Math.sin((frame - 400) * 0.08) * 0.02 * (1 - s);
  return (
    <div style={{
      position: 'absolute', left: 1920 - 560, top: 1330, width: 1120, opacity: Math.min(1, s),
      transform: `rotate(${-12 + wobble}deg) scale(${0.6 + 0.4 * s})`,
    }}>
      <div style={{
        borderRadius: 28, padding: '30px 40px', textAlign: 'center',
        background: 'rgba(244,114,182,0.10)', border: '6px solid rgba(244,114,182,0.9)',
        boxShadow: '0 0 70px rgba(244,114,182,0.45), inset 0 0 40px rgba(244,114,182,0.12)',
      }}>
        <div style={{color: FUCHSIA, fontFamily: FONT, fontWeight: 800, fontSize: 110, letterSpacing: 6}}>0% INTEREST</div>
        <div style={{color: INK, fontFamily: MONO, fontSize: 34, marginTop: 6, letterSpacing: 2}}>NO INTEREST &middot; NO HIDDEN FEES &middot; EVER</div>
      </div>
      {ringP > 0 && ringP < 1 && (
        <div style={{
          position: 'absolute', inset: -30, borderRadius: 40, pointerEvents: 'none',
          border: `${Math.max(2, 14 * (1 - ringP))}px solid rgba(244,114,182,${1 - ringP})`,
          transform: `scale(${1 + ringP * 0.12})`,
        }} />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Remaining balance gauge (right side) draining to zero
// ---------------------------------------------------------------------------
const Balance_bnpl: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 420, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  let paid = 0;
  for (let i = 0; i < 4; i++) {
    if (frame >= 480 + i * 60 + 30) paid++;
  }
  const balance = TOTAL_bnpl - paid * 120;
  const frac = balance / TOTAL_bnpl;
  const BH = 640;
  return (
    <div style={{position: 'absolute', right: 260, top: 360, opacity: Math.min(1, s), textAlign: 'center'}}>
      <div style={{color: FAINT, fontFamily: MONO, fontSize: 26, letterSpacing: 4}}>REMAINING BALANCE</div>
      <div style={{color: balance === 0 ? GREEN : INK, fontFamily: MONO, fontWeight: 800, fontSize: 96, marginTop: 8}}>
        ${balance}.00
      </div>
      <svg width={260} height={BH + 60} style={{marginTop: 16}}>
        <rect x={105} y={10} width={50} height={BH} rx={25} fill="rgba(242,238,255,0.08)" />
        <rect x={105} y={10 + (1 - frac) * BH} width={50} height={Math.max(0, frac * BH)} rx={25} fill={balance === 0 ? GREEN : FUCHSIA}
          style={{filter: `drop-shadow(0 0 16px ${balance === 0 ? 'rgba(52,211,153,0.7)' : 'rgba(244,114,182,0.7)'})`}} />
        {[0, 120, 240, 360, 480].map((v) => (
          <g key={v}>
            <line x1={80} y1={10 + BH - (v / 480) * BH} x2={180} y2={10 + BH - (v / 480) * BH} stroke="rgba(242,238,255,0.22)" strokeWidth={2} />
            <text x={70} y={16 + BH - (v / 480) * BH} fill={FAINT} fontSize={24} fontFamily={MONO} textAnchor="end">${v}</text>
          </g>
        ))}
      </svg>
      <div style={{color: paid === 4 ? GREEN : MUTED, fontFamily: MONO, fontSize: 30, marginTop: 10, letterSpacing: 2}}>
        {paid === 4 ? 'AUTOPAY COMPLETE' : `AUTOPAY ${paid}/4`}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PAID IN FULL payoff
// ---------------------------------------------------------------------------
const Payoff_bnpl: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 730, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin((frame - 730) * 0.12);
  const confetti: React.ReactElement[] = [];
  for (let i = 0; i < 60; i++) {
    const ang = random(`bnpl-cf-a-${i}`) * Math.PI * 2;
    const dist = 180 + random(`bnpl-cf-d-${i}`) * 520;
    const t = interpolate(frame, [740, 900], [0, 1], clamp01);
    const cx = 1920 + Math.cos(ang) * dist * t;
    const cy = 1660 + Math.sin(ang) * dist * t * 0.6;
    const col = i % 3 === 0 ? VIOLET : i % 3 === 1 ? FUCHSIA : AMBER;
    confetti.push(<rect key={i} x={cx} y={cy} width={14} height={14} fill={col} opacity={(1 - t) * 0.95}
      transform={`rotate(${ang * 57.3 + t * 360} ${cx} ${cy})`} />);
  }
  return (
    <>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
        {confetti}
      </svg>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 150, display: 'flex', justifyContent: 'center',
        opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
      }}>
        <div style={{
          borderRadius: 32, padding: '36px 110px', background: 'rgba(8,18,12,0.95)',
          border: `3px solid ${GREEN}`, textAlign: 'center',
          boxShadow: `0 0 ${50 + pulse * 50}px rgba(52,211,153,0.45)`,
        }}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36}}>
            <div style={{width: 110, height: 110, borderRadius: 60, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, color: '#04120B', fontWeight: 800}}>&#10003;</div>
            <div style={{color: GREEN, fontFamily: FONT, fontWeight: 800, fontSize: 88, letterSpacing: 2}}>PAID IN FULL</div>
          </div>
          <div style={{color: INK, fontFamily: MONO, fontSize: 36, marginTop: 14}}>
            $480.00 &middot; 0% INTEREST &middot; 6 WEEKS &middot; ON TIME
          </div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const BuyNowPayLaterSchedule: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_bnpl frame={frame} />
      <AmbientParticles_bnpl frame={frame} />
      <Title_bnpl frame={frame} fps={fps} />
      <HeroTotal_bnpl frame={frame} fps={fps} />
      <Timeline_bnpl frame={frame} fps={fps} />
      <Stamp_bnpl frame={frame} fps={fps} />
      <Balance_bnpl frame={frame} fps={fps} />
      <Payoff_bnpl frame={frame} fps={fps} />
      <TickerTape_bnpl frame={frame} />
      <CornerHud_bnpl frame={frame} />
      <FineDither_bnpl frame={frame} />
      <FilmGrain_bnpl frame={frame} />
    </AbsoluteFill>
  );
};
