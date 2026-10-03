/**
 * ChoreAllowanceCycle.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A kid's chore allowance loop: checklist appears -> completed chores turn
 * into coins flying into a jar -> payday wallet opens -> the allowance
 * splits into Spend / Save / Give jars -> the Save goal ring completes ->
 * BIKE UNLOCKED payoff -> the week resets and the loop starts again.
 * Deterministic.
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
// Palette (playful mint/peach on deep forest)
// ---------------------------------------------------------------------------
const BG = '#0B1512';
const INK = '#F2FBF5';
const MUTED = 'rgba(242,251,245,0.62)';
const FAINT = 'rgba(242,251,245,0.32)';
const MINT = '#6EE7B7';
const PEACH = '#FDBA74';
const GOLD = '#FDE68A';
const PANEL = 'rgba(16,32,24,0.94)';
const HAIRLINE = 'rgba(242,251,245,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: chore
// ---------------------------------------------------------------------------
const Background_chore: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#A9F0CE" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(110,231,183,0.12), rgba(110,231,183,0.03) 46%, rgba(11,21,18,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#choreVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(110,231,183,0.045)" />
        <defs>
          <radialGradient id="choreVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(11,21,18,0)" />
            <stop offset="100%" stopColor="rgba(3,8,6,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_chore: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`chore-amb-x-${i}`) * 3840;
    const by = random(`chore-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`chore-amb-s-${i}`) * 1.4;
    const ang = random(`chore-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`chore-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? MINT : i % 4 === 1 ? PEACH : 'rgba(242,251,245,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_chore: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`chore-dth-x-${i}`) * 3840;
    const by = random(`chore-dth-y-${i}`) * 2160;
    const jx = (random(`chore-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`chore-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`chore-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`chore-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#C9F4DC" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_chore = [
  'MAKE BED +$3',
  'DISHES +$4',
  'MOW LAWN +$9',
  'PAYDAY FRIDAY',
  'ALLOWANCE $30',
  'SPEND $10',
  'SAVE $14',
  'GIVE $6',
  'BIKE GOAL $120',
];
const TickerTape_chore: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_chore.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(110,231,183,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(4,10,7,0.66)', borderBottom: '1px solid rgba(242,251,245,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_chore: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(110,231,183,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={MINT} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? MINT : 'rgba(242,251,245,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? MINT : 'rgba(242,251,245,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_chore: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`chore-grain-x-${frame}-${i}`) * 3840;
    const y = random(`chore-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`chore-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`chore-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Allowance model: deterministic
// ---------------------------------------------------------------------------
const CHORES_chore = [
  {label: 'MAKE BED', earn: 3},
  {label: 'WASH DISHES', earn: 4},
  {label: 'VACUUM LIVING ROOM', earn: 5},
  {label: 'TAKE OUT TRASH', earn: 3},
  {label: 'FEED THE DOG', earn: 2},
  {label: 'MOW THE LAWN', earn: 9},
];
const BASE_chore = 4; // flat weekly base
const CHORE_TOTAL_chore = CHORES_chore.reduce((a, c) => a + c.earn, 0); // 26
const ALLOWANCE_chore = BASE_chore + CHORE_TOTAL_chore; // 30
const SPLIT_chore = [
  {k: 'SPEND', v: 10, color: PEACH},
  {k: 'SAVE', v: 14, color: MINT},
  {k: 'GIVE', v: 6, color: GOLD},
];
const SAVE_GOAL_chore = 120;
const SAVED_BEFORE_chore = 106;
const fmt$ = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_chore: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        CHORE ALLOWANCE CYCLE
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        Finish the list &middot; earn the coins &middot; split them like a pro
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 1: checklist -> coins fly to jar
// ---------------------------------------------------------------------------
const JAR_CX = 2460;
const JAR_MOUTH_Y = 640;

const Checklist_chore: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  // checkmark ticks: each chore checked at 100 + i*30
  const earned = CHORES_chore.reduce((a, c, i) => a + (frame >= 100 + i * 30 ? c.earn : 0), 0);
  const resetFade = interpolate(frame, [820, 870], [0, 1], clamp01);
  return (
    <div style={{
      position: 'absolute', left: 240, top: 480, width: 1350, height: 950,
      borderRadius: 36, background: PANEL, border: `2px solid ${HAIRLINE}`,
      padding: '48px 60px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>THIS WEEK'S CHORES</div>
        <div style={{color: MINT, fontFamily: MONO, fontWeight: 800, fontSize: 44}}>{fmt$(earned)}</div>
      </div>
      {CHORES_chore.map((c, i) => {
        const on = interpolate(frame, [80 + i * 24, 100 + i * 24], [0, 1], clamp01);
        const checked = frame >= 100 + i * 30;
        const dim = 1 - resetFade * 0.85;
        return (
          <div key={c.label} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 56, opacity: on * dim}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 32}}>
              <div style={{
                width: 64, height: 64, borderRadius: 32, border: `3px solid ${checked ? MINT : FAINT}`,
                background: checked ? 'rgba(110,231,183,0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: MINT, fontSize: 40, fontWeight: 800,
                boxShadow: checked ? '0 0 24px rgba(110,231,183,0.4)' : 'none',
              }}>
                {checked ? '✓' : ''}
              </div>
              <div style={{color: checked ? MUTED : INK, fontFamily: FONT, fontSize: 44, fontWeight: 600, textDecoration: checked ? 'line-through' : 'none'}}>
                {c.label}
              </div>
            </div>
            <div style={{color: PEACH, fontFamily: MONO, fontSize: 40, fontWeight: 800}}>+{fmt$(c.earn)}</div>
          </div>
        );
      })}
    </div>
  );
};

// coins flying from checklist rows into the jar mouth
const ChoreCoins_chore: React.FC<{frame: number}> = ({frame}) => {
  const coins: React.ReactElement[] = [];
  CHORES_chore.forEach((c, i) => {
    const checkAt = 100 + i * 30;
    const rowY = 700 + i * 118;
    for (let k = 0; k < 3; k++) {
      const start = checkAt + k * 8;
      const p = interpolate(frame, [start, start + 55], [0, 1], clamp01);
      if (p <= 0 || p >= 1) continue;
      const cx = interpolate(p, [0, 1], [1350, JAR_CX], clamp01);
      const cy = interpolate(p, [0, 1], [rowY, JAR_MOUTH_Y], clamp01) - Math.sin(p * Math.PI) * 160;
      const r = 20 - p * 6;
      coins.push(
        <g key={`${i}-${k}`} opacity={0.35 + 0.65 * p}>
          <circle cx={cx} cy={cy} r={r} fill={GOLD} style={{filter: 'drop-shadow(0 0 12px rgba(253,230,138,0.8))'}} />
          <text x={cx} y={cy + 11} fill={BG} fontSize={24} fontFamily={MONO} fontWeight={800} textAnchor="middle">$</text>
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

// coin jar + payday wallet (right side, top)
const JarWallet_chore: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 200, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const fillP = interpolate(frame, [140, 330], [0, 1], clamp01) * (1 - interpolate(frame, [820, 870], [0, 1], clamp01));
  // payday: wallet springs open at 360
  const ws = spring({frame: frame - 360, fps, config: {damping: 200, stiffness: 90}});
  const payday = ALLOWANCE_chore * interpolate(frame, [380, 440], [0, 1], clamp01);
  const lidOpen = interpolate(ws, [0, 1], [0, -70], clamp01);
  return (
    <div style={{position: 'absolute', left: 1900, top: 480, width: 1700, height: 950, opacity: Math.min(1, s)}}>
      {/* coin jar */}
      <svg width={700} height={950} viewBox="0 0 700 950" style={{position: 'absolute', left: 160, top: 0}}>
        <rect x={180} y={120} width={340} height={52} rx={26} fill="rgba(242,251,245,0.25)" />
        <rect x={140} y={170} width={420} height={700} rx={70} fill="rgba(110,231,183,0.07)" stroke="rgba(242,251,245,0.35)" strokeWidth={8} />
        <clipPath id="choreJarClip">
          <rect x={140} y={170} width={420} height={700} rx={70} />
        </clipPath>
        <g clipPath="url(#choreJarClip)">
          <rect x={140} y={870 - 700 * fillP} width={420} height={700 * fillP} fill="rgba(253,230,138,0.55)" />
          {Array.from({length: 40}, (_, i) => {
            const gx = 160 + random(`chore-jar-x-${i}`) * 380;
            const gy = 870 - random(`chore-jar-y-${i}`) * 700 * fillP;
            const wob = Math.sin(frame * 0.09 + i * 2.2) * 8;
            return <circle key={i} cx={gx + wob} cy={gy} r={16} fill={GOLD} opacity={0.9} />;
          })}
        </g>
        <text x={350} y={930} fill={MUTED} fontSize={34} fontFamily={MONO} textAnchor="middle" letterSpacing={4}>COIN JAR</text>
      </svg>
      <div style={{
        position: 'absolute', left: 180, top: 700, color: GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 64,
        textShadow: '0 0 26px rgba(253,230,138,0.5)',
      }}>
        {fmt$(CHORE_TOTAL_chore * fillP)}
      </div>
      {/* payday wallet */}
      {ws > 0.001 && (
        <div style={{
          position: 'absolute', right: 120, top: 120, width: 560, height: 640, opacity: Math.min(1, ws),
          transform: `translateY(${(1 - ws) * 60}px)`,
        }}>
          <svg width={560} height={640} viewBox="0 0 560 640">
            <rect x={30} y={180} width={500} height={400} rx={50} fill={PEACH} />
            <rect x={30} y={180} width={500} height={110} rx={55} fill="#C77B3E" />
            <g transform={`rotate(${lidOpen * 0.5} 280 180)`}>
              <rect x={30} y={80 + lidOpen} width={500} height={110} rx={55} fill={PEACH} stroke="#C77B3E" strokeWidth={10} />
            </g>
            <circle cx={430} cy={430} r={30} fill={BG} />
            <circle cx={430} cy={430} r={16} fill={GOLD} />
          </svg>
          <div style={{textAlign: 'center', marginTop: 16}}>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 4}}>PAYDAY FRIDAY</div>
            <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 88, textShadow: '0 0 30px rgba(253,186,116,0.5)'}}>
              {fmt$(payday)}
            </div>
            <div style={{color: FAINT, fontFamily: MONO, fontSize: 28}}>{fmt$(CHORE_TOTAL_chore)} chores + {fmt$(BASE_chore)} base</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 2: split into Spend / Save / Give jars
// ---------------------------------------------------------------------------
const SplitJars_chore: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 380, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const resetFade = interpolate(frame, [820, 870], [0, 1], clamp01);
  const xs = [240, 1435, 2630];
  return (
    <div style={{position: 'absolute', left: 0, top: 1450, width: 3840, height: 560, opacity: Math.min(1, s)}}>
      {SPLIT_chore.map((j, i) => {
        const fillP = interpolate(frame, [440 + i * 40, 540 + i * 40], [0, 1], clamp01) * (1 - resetFade);
        const amt = j.v * fillP;
        return (
          <div key={j.k} style={{position: 'absolute', left: xs[i], top: 0, width: 1050, height: 560}}>
            <svg width={1050} height={560} viewBox="0 0 1050 560" style={{position: 'absolute', top: 0, left: 0}}>
              <rect x={375} y={40} width={300} height={400} rx={56} fill={`${j.color}14`} stroke="rgba(242,251,245,0.35)" strokeWidth={7} />
              <clipPath id={`choreSplitClip${i}`}>
                <rect x={375} y={40} width={300} height={400} rx={56} />
              </clipPath>
              <g clipPath={`url(#choreSplitClip${i})`}>
                <rect x={375} y={440 - 400 * fillP} width={300} height={400 * fillP} fill={j.color} opacity={0.55} />
                {Array.from({length: 14}, (_, k) => {
                  const gx = 395 + random(`chore-sp-x-${i}-${k}`) * 260;
                  const gy = 440 - random(`chore-sp-y-${i}-${k}`) * 400 * fillP;
                  const wob = Math.sin(frame * 0.1 + k * 1.9 + i) * 6;
                  return <circle key={k} cx={gx + wob} cy={gy} r={13} fill={j.color} opacity={0.95} />;
                })}
              </g>
              <text x={525} y={500} fill={MUTED} fontSize={40} fontFamily={MONO} textAnchor="middle" letterSpacing={8}>{j.k}</text>
            </svg>
            <div style={{
              position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center',
              color: j.color, fontFamily: MONO, fontWeight: 800, fontSize: 64,
              textShadow: `0 0 26px ${j.color}66`,
            }}>
              {fmt$(amt)}
            </div>
          </div>
        );
      })}
      {/* stream coins from wallet to jars */}
      {Array.from({length: 30}, (_, i) => {
        const jar = i % 3;
        const start = 450 + Math.floor(i / 3) * 12;
        const p = interpolate(frame, [start, start + 80], [0, 1], clamp01);
        if (p <= 0 || p >= 1) return null;
        const tx = xs[jar] + 525;
        const cx = interpolate(p, [0, 1], [3300, tx], clamp01);
        const cy = interpolate(p, [0, 1], [900, 1620], clamp01) - Math.sin(p * Math.PI) * 120;
        return (
          <svg key={i} width={3840} height={2160} style={{position: 'absolute', top: -1450, left: 0, pointerEvents: 'none'}}>
            <circle cx={cx} cy={cy} r={17} fill={SPLIT_chore[jar].color} opacity={0.95}
              style={{filter: `drop-shadow(0 0 12px ${SPLIT_chore[jar].color})`}} />
          </svg>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 3: save goal ring -> BIKE UNLOCKED -> week reset
// ---------------------------------------------------------------------------
const SaveRing_chore: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 560, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const added = 14 * interpolate(frame, [580, 660], [0, 1], clamp01);
  const saved = SAVED_BEFORE_chore + added;
  const fill = Math.min(1, saved / SAVE_GOAL_chore);
  const C = 2 * Math.PI * 190;
  const cx = 1435 + 525;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, s), pointerEvents: 'none'}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <defs>
          <linearGradient id="choreRingG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={MINT} />
            <stop offset="100%" stopColor={PEACH} />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={1730} r={190} fill="none" stroke="rgba(242,251,245,0.12)" strokeWidth={36} />
        <circle cx={cx} cy={1730} r={190} fill="none" stroke="url(#choreRingG)" strokeWidth={36}
          strokeDasharray={C} strokeDashoffset={C * (1 - fill)} transform={`rotate(-90 ${cx} 1730)`}
          strokeLinecap="round" style={{filter: 'drop-shadow(0 0 22px rgba(110,231,183,0.6))'}} />
        <text x={cx} y={1720} fill={INK} fontSize={56} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {fmt$(saved)}
        </text>
        <text x={cx} y={1770} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle">/ {fmt$(SAVE_GOAL_chore)} BIKE</text>
      </svg>
    </div>
  );
};

const BikeUnlocked_chore: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 690, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const out = interpolate(frame, [830, 880], [0, 1], clamp01);
  const confetti: React.ReactElement[] = [];
  for (let i = 0; i < 90; i++) {
    const start = 690 + random(`chore-cf-s-${i}`) * 60;
    const p = interpolate(frame, [start, start + 110], [0, 1], clamp01);
    if (p <= 0) continue;
    const ang = random(`chore-cf-a-${i}`) * Math.PI * 2;
    const dist = p * (500 + random(`chore-cf-d-${i}`) * 700);
    const cx = 1920 + Math.cos(ang) * dist;
    const cy = 1080 + Math.sin(ang) * dist * 0.7 - p * 300;
    confetti.push(
      <rect key={i} x={cx} y={cy} width={18} height={18} fill={i % 3 === 0 ? MINT : i % 3 === 1 ? PEACH : GOLD}
        opacity={1 - p} transform={`rotate(${p * 540} ${cx} ${cy})`} />
    );
  }
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: `rgba(4,10,7,${0.62 * Math.min(1, s) * (1 - out)})`,
      opacity: Math.min(1, s) * (1 - out),
    }}>
      <div style={{transform: `scale(${0.8 + 0.2 * s})`, textAlign: 'center'}}>
        <svg width={900} height={520} viewBox="0 0 900 520">
          <circle cx={230} cy={380} r={110} fill="none" stroke={MINT} strokeWidth={26} />
          <circle cx={670} cy={380} r={110} fill="none" stroke={MINT} strokeWidth={26} />
          <path d="M 230 380 L 400 380 L 460 200 L 600 200 M 400 380 L 330 180 L 460 200 M 330 180 L 290 140 L 370 140"
            fill="none" stroke={PEACH} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={330} cy={180} r={18} fill={GOLD} />
          <rect x={255} y={100} width={120} height={60} rx={14} fill={GOLD} />
          <text x={315} y={142} fill={BG} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle">🔓</text>
        </svg>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 96, letterSpacing: 2, marginTop: 10}}>
          BIKE UNLOCKED
        </div>
        <div style={{color: MINT, fontFamily: MONO, fontSize: 42, marginTop: 14}}>
          {fmt$(SAVE_GOAL_chore)} saved &middot; 8 weeks of chores paid off
        </div>
      </div>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
        {confetti}
      </svg>
    </div>
  );
};

const WeekReset_chore: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 810, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 150, display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        borderRadius: 30, padding: '30px 90px', background: 'rgba(6,14,10,0.94)',
        border: `3px solid ${MINT}`, textAlign: 'center',
        boxShadow: '0 0 60px rgba(110,231,183,0.4)',
      }}>
        <div style={{color: MINT, fontFamily: FONT, fontWeight: 800, fontSize: 60, letterSpacing: 2}}>↻ WEEK RESET</div>
        <div style={{color: INK, fontFamily: MONO, fontSize: 34, marginTop: 8}}>
          Monday &middot; fresh checklist &middot; jars empty &middot; we go again
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const ChoreAllowanceCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_chore frame={frame} />
      <AmbientParticles_chore frame={frame} />
      <Title_chore frame={frame} fps={fps} />
      <Checklist_chore frame={frame} fps={fps} />
      <ChoreCoins_chore frame={frame} />
      <JarWallet_chore frame={frame} fps={fps} />
      <SplitJars_chore frame={frame} fps={fps} />
      <SaveRing_chore frame={frame} fps={fps} />
      <BikeUnlocked_chore frame={frame} fps={fps} />
      <WeekReset_chore frame={frame} fps={fps} />
      <TickerTape_chore frame={frame} />
      <CornerHud_chore frame={frame} />
      <FineDither_chore frame={frame} />
      <FilmGrain_chore frame={frame} />
    </AbsoluteFill>
  );
};
