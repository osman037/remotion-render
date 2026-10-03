/**
 * ContactlessTransitFareFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The contactless transit fare flow: a rider approaches a turnstile,
 * payment options fan out, a tap fires a ripple pulse at the reader, the
 * fare deducts from the card balance, a weekly-cap ring ticks 1 to 12 —
 * the 12th ride is FREE — and the week resets on Monday. Deterministic.
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
// Palette (transit teal / lime on dark)
// ---------------------------------------------------------------------------
const BG = '#081210';
const INK = '#EAFDF6';
const MUTED = 'rgba(234,253,246,0.62)';
const FAINT = 'rgba(234,253,246,0.32)';
const TEAL = '#2DD4BF';
const LIME = '#A3E635';
const GREEN = '#34D399';
const AMBER = '#FBBF24';
const PANEL = 'rgba(9,20,18,0.94)';
const HAIRLINE = 'rgba(234,253,246,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: fare
// ---------------------------------------------------------------------------
const Background_fare: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#A7F3D0" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 28%, rgba(45,212,191,0.13), rgba(163,230,53,0.04) 46%, rgba(8,18,16,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#fareVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(45,212,191,0.045)" />
        <defs>
          <radialGradient id="fareVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(8,18,16,0)" />
            <stop offset="100%" stopColor="rgba(2,8,7,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_fare: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`fare-amb-x-${i}`) * 3840;
    const by = random(`fare-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`fare-amb-s-${i}`) * 1.4;
    const ang = random(`fare-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`fare-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? TEAL : i % 4 === 1 ? LIME : 'rgba(234,253,246,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_fare: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`fare-dth-x-${i}`) * 3840;
    const by = random(`fare-dth-y-${i}`) * 2160;
    const jx = (random(`fare-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`fare-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`fare-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`fare-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#A7F3D0" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_fare = [
  'TAP TO RIDE',
  'FARE $2.75',
  'WEEKLY CAP 12 RIDES',
  'RIDE 12 FREE',
  'CONTACTLESS ONLY',
  'NO TICKET NEEDED',
  'CAP RESETS MONDAY',
  'BALANCE AUTO-TOP-UP',
];
const TickerTape_fare: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_fare.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(45,212,191,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(3,10,9,0.66)', borderBottom: '1px solid rgba(234,253,246,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_fare: React.FC<{frame: number}> = ({frame}) => {
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
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? TEAL : 'rgba(234,253,246,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? TEAL : 'rgba(234,253,246,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_fare: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`fare-grain-x-${frame}-${i}`) * 3840;
    const y = random(`fare-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`fare-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`fare-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Shared scene geometry
// ---------------------------------------------------------------------------
const GROUND_Y = 1560;
const READER_X = 2520;
const READER_Y = 1120;

// Rider x: walks in, stops at the reader, then passes through the gate
const riderX = (frame: number): number => {
  if (frame < 60) return 420;
  if (frame < 330) return interpolate(frame, [60, 330], [420, 2230], clamp01);
  if (frame < 560) return 2230;
  return interpolate(frame, [560, 700], [2230, 2960], clamp01);
};

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_fare: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        CONTACTLESS TRANSIT FARES
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        tap in &middot; weekly fare capping &middot; the 12th ride is free
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Rider silhouette (walking figure, frame-driven leg swing)
// ---------------------------------------------------------------------------
const Rider_fare: React.FC<{frame: number}> = ({frame}) => {
  const x = riderX(frame);
  const walking = (frame >= 60 && frame < 330) || (frame >= 560 && frame < 700);
  const swing = walking ? Math.sin(frame * 0.28) * 26 : 0;
  const bob = walking ? Math.abs(Math.sin(frame * 0.28)) * 14 : 0;
  const hipY = GROUND_Y - 260 - bob;
  const legL = 260;
  const rad = (swing * Math.PI) / 180;
  const fx1 = x + Math.sin(rad) * legL;
  const fx2 = x - Math.sin(rad) * legL;
  const fy = GROUND_Y;
  const armSwing = walking ? Math.sin(frame * 0.28 + Math.PI) * 20 : 0;
  const arad = (armSwing * Math.PI) / 180;
  const hx = x + Math.sin(arad) * 130;
  return (
    <g>
      {/* shadow */}
      <ellipse cx={x} cy={GROUND_Y + 26} rx={120} ry={22} fill="rgba(0,0,0,0.5)" />
      {/* legs */}
      <line x1={x} y1={hipY} x2={fx1} y2={fy} stroke={INK} strokeWidth={36} strokeLinecap="round" />
      <line x1={x} y1={hipY} x2={fx2} y2={fy} stroke={INK} strokeWidth={36} strokeLinecap="round" opacity={0.55} />
      {/* torso */}
      <line x1={x} y1={hipY} x2={x} y2={hipY - 230} stroke={TEAL} strokeWidth={64} strokeLinecap="round" />
      {/* arm */}
      <line x1={x} y1={hipY - 200} x2={hx} y2={hipY - 110} stroke={INK} strokeWidth={30} strokeLinecap="round" />
      {/* head */}
      <circle cx={x} cy={hipY - 320} r={62} fill={INK} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Turnstile + reader + tap ripple
// ---------------------------------------------------------------------------
const Turnstile_fare: React.FC<{frame: number}> = ({frame}) => {
  const open = interpolate(frame, [560, 640], [0, 1], clamp01);
  const armA = open * 62;
  const ripples: React.ReactElement[] = [];
  for (let k = 0; k < 3; k++) {
    const p = interpolate(frame, [400 + k * 46, 400 + k * 46 + 100], [0, 1], clamp01);
    if (p > 0 && p < 1) {
      ripples.push(
        <circle key={k} cx={READER_X} cy={READER_Y} r={40 + p * 380} fill="none" stroke={TEAL}
          strokeWidth={10 * (1 - p) + 2} opacity={(1 - p) * 0.9} />
      );
    }
  }
  return (
    <g>
      {/* posts */}
      <rect x={READER_X - 90} y={GROUND_Y - 560} width={150} height={560} rx={24} fill={PANEL} stroke={TEAL} strokeWidth={5} />
      <rect x={READER_X + 240} y={GROUND_Y - 560} width={150} height={560} rx={24} fill={PANEL} stroke={HAIRLINE} strokeWidth={4} />
      {/* barrier arm */}
      <g transform={`rotate(${-armA} ${READER_X + 240} ${GROUND_Y - 320})`}>
        <rect x={READER_X + 60} y={GROUND_Y - 336} width={200} height={32} rx={14} fill={open > 0.5 ? GREEN : AMBER} />
      </g>
      {/* reader */}
      <rect x={READER_X - 64} y={READER_Y - 110} width={128} height={220} rx={28} fill="#0C1A17" stroke={TEAL} strokeWidth={6}
        style={{filter: 'drop-shadow(0 0 22px rgba(45,212,191,0.7))'}} />
      <circle cx={READER_X} cy={READER_Y - 40} r={34} fill="none" stroke={TEAL} strokeWidth={6} />
      <circle cx={READER_X} cy={READER_Y - 40} r={18} fill="none" stroke={TEAL} strokeWidth={6} />
      <circle cx={READER_X} cy={READER_Y - 40} r={6} fill={TEAL} />
      <text x={READER_X} y={READER_Y + 66} fill={TEAL} fontSize={26} fontFamily={MONO} letterSpacing={3} textAnchor="middle">TAP</text>
      {ripples}
      {/* gate status */}
      <text x={READER_X + 315} y={GROUND_Y - 600} fill={open > 0.5 ? '#34D399' : FAINT} fontSize={30} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
        {open > 0.5 ? 'GATE OPEN' : 'GATE CLOSED'}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Approach + tap scene
// ---------------------------------------------------------------------------
const Approach_fare: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [30, 90], [0, 1], clamp01);
  if (fade <= 0) return null;
  const tap = interpolate(frame, [390, 450], [0, 1], clamp01);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
      {/* platform edge */}
      <line x1={200} y1={GROUND_Y + 60} x2={3640} y2={GROUND_Y + 60} stroke={HAIRLINE} strokeWidth={8} />
      <line x1={200} y1={GROUND_Y + 60} x2={3640} y2={GROUND_Y + 60} stroke={TEAL} strokeWidth={3} strokeDasharray="46 40" strokeDashoffset={-frame * 1.6} opacity={0.5} />
      <Turnstile_fare frame={frame} />
      <Rider_fare frame={frame} />
      {/* phone held up at tap */}
      {frame >= 360 && frame < 560 && (
        <g opacity={interpolate(frame, [360, 380], [0, 1], clamp01)}>
          <rect x={READER_X - 190} y={READER_Y - 210} width={120} height={210} rx={26} fill="#0C1A17" stroke={LIME} strokeWidth={6}
            style={{filter: 'drop-shadow(0 0 26px rgba(163,230,53,0.8))'}} />
          <rect x={READER_X - 168} y={READER_Y - 186} width={76} height={120} rx={10} fill={LIME} opacity={0.85} />
        </g>
      )}
      {tap >= 1 && (
        <text x={READER_X} y={READER_Y - 300} fill={LIME} fontSize={44} fontFamily={MONO} fontWeight={800} letterSpacing={3} textAnchor="middle"
          opacity={interpolate(frame, [450, 560], [1, 0], clamp01)}>
          TAP ACCEPTED
        </text>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Payment options fan out
// ---------------------------------------------------------------------------
const PayOptions_fare: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const opts = ['CONTACTLESS CARD', 'PHONE', 'SMART WATCH', 'TRANSIT CARD'];
  const cx = 1500;
  const cy = 560;
  const cards: React.ReactElement[] = [];
  for (let i = 0; i < 4; i++) {
    const s = spring({frame: frame - (250 + i * 30), fps, config: {damping: 200, stiffness: 90}});
    if (s <= 0.001) continue;
    const ang = (-54 + i * 36) * (Math.PI / 180);
    const dx = Math.sin(ang) * 560;
    const dy = (1 - Math.cos(ang)) * 260;
    const rot = (-54 + i * 36) * 0.55;
    cards.push(
      <g key={i} transform={`translate(${cx + dx},${cy + dy}) rotate(${rot}) scale(${0.7 + 0.3 * Math.min(1, s)})`} opacity={Math.min(1, s)}>
        <rect x={-220} y={-110} width={440} height={220} rx={30} fill={PANEL} stroke={i === 0 ? LIME : TEAL} strokeWidth={i === 0 ? 6 : 4}
          style={{filter: `drop-shadow(0 0 ${i === 0 ? 30 : 16}px ${i === 0 ? 'rgba(163,230,53,0.5)' : 'rgba(45,212,191,0.4)'})`}} />
        <rect x={-220} y={-110} width={440} height={70} rx={30} fill={i === 0 ? LIME : TEAL} opacity={0.85} />
        <text x={0} y={52} fill={INK} fontSize={34} fontFamily={MONO} fontWeight={800} letterSpacing={2} textAnchor="middle">{opts[i]}</text>
      </g>
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {cards}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Fare deducts from card balance (left panel)
// ---------------------------------------------------------------------------
const Balance_fare: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 440, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const drain = interpolate(frame, [480, 640], [0, 1], clamp01);
  const balance = 25 - drain * 2.75;
  const chipFly = interpolate(frame, [500, 580], [0, 1], clamp01);
  const chipX = interpolate(chipFly, [0, 1], [READER_X - 100, 700], clamp01);
  const chipY = interpolate(chipFly, [0, 1], [READER_Y + 100, 760], clamp01);
  return (
    <>
      {chipFly > 0 && chipFly < 1 && (
        <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
          <rect x={chipX - 110} y={chipY - 44} width={220} height={88} rx={44} fill={AMBER}
            style={{filter: 'drop-shadow(0 0 22px rgba(251,191,36,0.8))'}} />
          <text x={chipX} y={chipY + 16} fill="#1A1206" fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">-$2.75</text>
        </svg>
      )}
      <div style={{
        position: 'absolute', left: 260, top: 480, width: 880, opacity: Math.min(1, s),
        transform: `translateX(${(1 - s) * -120}px)`,
      }}>
        <div style={{
          borderRadius: 28, background: PANEL, border: `2px solid ${TEAL}`, padding: '36px 52px',
          boxShadow: '0 0 54px rgba(45,212,191,0.30)',
        }}>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>CARD BALANCE</div>
          <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 130, marginTop: 6}}>
            ${balance.toFixed(2)}
          </div>
          <div style={{marginTop: 14, height: 26, borderRadius: 13, background: 'rgba(234,253,246,0.10)', overflow: 'hidden'}}>
            <div style={{width: `${(balance / 25) * 100}%`, height: '100%', background: TEAL}} />
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 16}}>
            <div style={{color: AMBER, fontFamily: MONO, fontSize: 34, fontWeight: 800}}>FARE -$2.75</div>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 30}}>RIDE 11 OF 12</div>
          </div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Weekly cap ring: 12 segments tick 1 -> 12, ride 12 is FREE
// ---------------------------------------------------------------------------
const CapRing_fare: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 540, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const R = 200;
  // reset sweep at the end
  const reset = interpolate(frame, [830, 895], [0, 1], clamp01);
  const segs: React.ReactElement[] = [];
  for (let m = 0; m < 12; m++) {
    const a0 = (m / 12) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((m + 1) / 12) * Math.PI * 2 - Math.PI / 2;
    const fillAt = 560 + m * 18;
    let on = frame >= fillAt;
    if (reset > 0) on = frame < 830 + m * 5;
    const isFree = m === 11;
    const x0 = 640 + R * Math.cos(a0);
    const y0 = 380 + R * Math.sin(a0);
    const x1 = 640 + R * Math.cos(a1);
    const y1 = 380 + R * Math.sin(a1);
    segs.push(
      <path key={m} d={`M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`}
        fill="none" stroke={on ? (isFree ? LIME : TEAL) : 'rgba(234,253,246,0.14)'}
        strokeWidth={on && isFree ? 40 : 30} strokeLinecap="round"
        style={on ? {filter: `drop-shadow(0 0 14px ${isFree ? 'rgba(163,230,53,0.9)' : 'rgba(45,212,191,0.8)'})`} : undefined} />
    );
  }
  const count = Math.min(12, Math.max(0, Math.floor((frame - 560) / 18) + (frame >= 560 ? 1 : 0)));
  const disp = reset > 0 ? 12 - Math.min(12, Math.floor((frame - 830) / 5)) : count;
  const freeOn = frame >= 560 + 11 * 18 && reset <= 0;
  return (
    <div style={{
      position: 'absolute', right: 240, top: 380, width: 1280, opacity: Math.min(1, s),
      transform: `translateX(${(1 - s) * 120}px)`, textAlign: 'center',
    }}>
      <div style={{color: FAINT, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>WEEKLY FARE CAP</div>
      <svg width={1280} height={760} style={{overflow: 'visible', marginTop: 6}}>
        {segs}
        <text x={640} y={366} fill={INK} fontSize={110} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {disp}
        </text>
        <text x={640} y={420} fill={MUTED} fontSize={36} fontFamily={MONO} letterSpacing={3} textAnchor="middle">/ 12 RIDES</text>
        {freeOn && (
          <g>
            <circle cx={640} cy={380} r={R + 52} fill="none" stroke={LIME} strokeWidth={8} opacity={0.9 - reset}
              strokeDasharray="30 24" strokeDashoffset={-frame * 3} />
            <text x={640} y={620} fill={LIME} fontSize={56} fontFamily={FONT} fontWeight={800} letterSpacing={4} textAnchor="middle">
              RIDE 12 FREE
            </text>
          </g>
        )}
      </svg>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 2, marginTop: 4}}>
        {freeOn ? 'CAP REACHED \u2014 NO FARE CHARGED' : 'EVERY TAP COUNTS TOWARD THE CAP'}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Week resets Monday: calendar strip + reset label (payoff)
// ---------------------------------------------------------------------------
const WeekReset_fare: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 820, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const activeDay = Math.min(6, Math.floor(interpolate(frame, [830, 895], [0, 7], clamp01)));
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 130, display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{
        borderRadius: 30, padding: '30px 70px', background: 'rgba(9,20,18,0.95)',
        border: `3px solid ${TEAL}`, textAlign: 'center',
        boxShadow: '0 0 60px rgba(45,212,191,0.40)',
      }}>
        <div style={{color: TEAL, fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 2}}>NEW WEEK &middot; CAP RESET</div>
        <div style={{display: 'flex', gap: 18, justifyContent: 'center', marginTop: 22}}>
          {days.map((d, i) => {
            const on = i <= activeDay;
            return (
              <div key={d} style={{
                width: 150, borderRadius: 18, padding: '16px 0',
                background: i === 0 ? LIME : on ? 'rgba(45,212,191,0.16)' : 'rgba(234,253,246,0.06)',
                border: `2px solid ${i === 0 ? LIME : HAIRLINE}`,
                color: i === 0 ? '#0A1408' : on ? INK : FAINT,
                fontFamily: MONO, fontWeight: 800, fontSize: 34,
                boxShadow: i === 0 ? '0 0 26px rgba(163,230,53,0.55)' : 'none',
              }}>
                {d}
              </div>
            );
          })}
        </div>
        <div style={{color: INK, fontFamily: MONO, fontSize: 32, marginTop: 18}}>
          MONDAY 00:00 &middot; COUNTER 0/12 &middot; RIDE AGAIN
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const ContactlessTransitFareFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_fare frame={frame} />
      <AmbientParticles_fare frame={frame} />
      <Title_fare frame={frame} fps={fps} />
      <Approach_fare frame={frame} fps={fps} />
      <PayOptions_fare frame={frame} fps={fps} />
      <Balance_fare frame={frame} fps={fps} />
      <CapRing_fare frame={frame} fps={fps} />
      <WeekReset_fare frame={frame} fps={fps} />
      <TickerTape_fare frame={frame} />
      <CornerHud_fare frame={frame} />
      <FineDither_fare frame={frame} />
      <FilmGrain_fare frame={frame} />
    </AbsoluteFill>
  );
};
