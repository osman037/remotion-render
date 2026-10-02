/**
 * SavingsChallengeJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The 52-week savings challenge as an escalating arc: save $1 in week 1,
 * $2 in week 2 ... $52 in week 52, for $1,378 total. Bars grow week by week,
 * milestones pop at 25/50/75/100%, and the payoff lands the full amount.
 * Distinct from a generic goal dashboard. Brand-neutral, deterministic.
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
// Palette (deep pine, gold)
// ---------------------------------------------------------------------------
const BG = '#0C120A';
const INK = '#F7F3E8';
const MUTED = 'rgba(247,243,232,0.62)';
const FAINT = 'rgba(247,243,232,0.32)';
const GOLD = '#FBBF24';
const GOLD_DEEP = '#92400E';
const GREEN = '#34D399';
const CYAN = '#67E8F9';
const PANEL = 'rgba(13,19,11,0.92)';
const HAIRLINE = 'rgba(247,243,232,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: sc
// ---------------------------------------------------------------------------
const Background_sc: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#E8D48A" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 32%, rgba(251,191,36,0.13), rgba(251,191,36,0.03) 46%, rgba(12,18,10,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#scVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(251,191,36,0.045)" />
        <defs>
          <radialGradient id="scVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(12,18,10,0)" />
            <stop offset="100%" stopColor="rgba(5,8,4,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_sc: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`sc-amb-x-${i}`) * 3840;
    const by = random(`sc-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`sc-amb-s-${i}`) * 1.4;
    const ang = random(`sc-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`sc-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? CYAN : i % 4 === 1 ? GOLD : 'rgba(247,243,232,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_sc: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`sc-dth-x-${i}`) * 3840;
    const by = random(`sc-dth-y-${i}`) * 2160;
    const jx = (random(`sc-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`sc-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`sc-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`sc-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#F5E8C4" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_sc = [
  'WEEK 1: SAVE $1',
  'WEEK 26: SAVE $26',
  'WEEK 52: SAVE $52',
  'TOTAL $1,378',
  '25% MILESTONE',
  '50% MILESTONE',
  '75% MILESTONE',
  'CHALLENGE COMPLETE \u2713',
];
const TickerTape_sc: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_sc.join('   \u25C6   ') + '   \u25C6   ';
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
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(7,10,5,0.66)', borderBottom: '1px solid rgba(247,243,232,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_sc: React.FC<{frame: number}> = ({frame}) => {
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
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? GOLD : 'rgba(247,243,232,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? GOLD : 'rgba(247,243,232,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_sc: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`sc-grain-x-${frame}-${i}`) * 3840;
    const y = random(`sc-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`sc-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`sc-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Challenge model: week w saves $w; total = 52*53/2 = 1378
// ---------------------------------------------------------------------------
const WEEKS_sc = 52;
const TOTAL_sc = (WEEKS_sc * (WEEKS_sc + 1)) / 2; // 1378
const cumAt = (w: number) => (w * (w + 1)) / 2;

// ---------------------------------------------------------------------------
// Title + total HUD
// ---------------------------------------------------------------------------
const Title_sc: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  const weekF = interpolate(frame, [120, 780], [0, WEEKS_sc], clamp01);
  const week = Math.min(WEEKS_sc, Math.max(0, Math.floor(weekF)));
  const saved = Math.round(cumAt(weekF));
  return (
    <>
      <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
          SAVINGS CHALLENGE JOURNEY
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
          Save $1 in week 1, $2 in week 2 \u2026 $52 in week 52
        </div>
      </div>
      <div style={{position: 'absolute', top: 104, right: 240, textAlign: 'right', opacity: fade}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>SAVED SO FAR</div>
        <div style={{color: GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 110, textShadow: '0 0 36px rgba(251,191,36,0.45)'}}>
          ${saved.toLocaleString('en-US')}
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 32}}>WEEK {Math.max(1, week)} / 52</div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Escalating 52-week bar field
// ---------------------------------------------------------------------------
const Bars_sc: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [90, 150], [0, 1], clamp01);
  if (fade <= 0) return null;
  const L = 260;
  const Rr = 3580;
  const T = 560;
  const Bb = 1560;
  const weekF = interpolate(frame, [120, 780], [0, WEEKS_sc], clamp01);
  const xFor = (i: number) => L + (i / (WEEKS_sc - 1)) * (Rr - L);
  const hFor = (w: number) => (w / WEEKS_sc) * (Bb - T);
  const milestones = [13, 26, 39, 52];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
      {[344.5, 689, 1033.5].map((v, k) => {
        const y = Bb - (cumAt(milestones[k]) / TOTAL_sc) * (Bb - T);
        return (
          <g key={v} opacity={0.5}>
            <line x1={L} y1={y} x2={Rr} y2={y} stroke={HAIRLINE} strokeWidth={2} strokeDasharray="12 14" />
            <text x={Rr + 8} y={y + 10} fill={FAINT} fontSize={24} fontFamily={MONO}>${v.toLocaleString('en-US')}</text>
          </g>
        );
      })}
      {Array.from({length: WEEKS_sc}, (_, i) => {
        const w = i + 1;
        if (weekF < w - 0.6) return null;
        const grow = interpolate(weekF, [w - 0.6, w], [0.15, 1], clamp01);
        const h = hFor(w) * grow;
        const hot = w >= weekF - 1.5;
        return (
          <rect key={w} x={xFor(i) - 24} y={Bb - h} width={48} height={h} rx={8}
            fill={hot ? GOLD : GREEN} opacity={hot ? 1 : 0.72}
            style={{filter: hot ? 'drop-shadow(0 0 18px rgba(251,191,36,0.7))' : 'none'}} />
        );
      })}
      {/* milestone flags */}
      {milestones.map((m) => {
        if (weekF < m) return null;
        const ms = spring({frame: frame - (120 + (m / WEEKS_sc) * 660), fps, config: {damping: 200, stiffness: 110}});
        const y = Bb - (cumAt(m) / TOTAL_sc) * (Bb - T);
        const pct = Math.round((m / WEEKS_sc) * 100);
        return (
          <g key={m} opacity={Math.min(1, ms)}>
            <g transform={`translate(${xFor(m - 1)},${y - 130}) scale(${0.7 + ms * 0.3})`}>
              <rect x={-110} y={-46} width={220} height={92} rx={18} fill={m === 52 ? GOLD : '#0F1A0E'} stroke={GOLD} strokeWidth={4} />
              <text x={0} y={8} fill={m === 52 ? '#3A2A05' : GOLD} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                {pct}%
              </text>
            </g>
          </g>
        );
      })}
      <text x={L} y={Bb + 70} fill={FAINT} fontSize={30} fontFamily={MONO}>WEEK 1 \u00B7 $1</text>
      <text x={Rr} y={Bb + 70} fill={FAINT} fontSize={30} fontFamily={MONO} textAnchor="end">WEEK 52 \u00B7 $52</text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Payoff
// ---------------------------------------------------------------------------
const Payoff_sc: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 800, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin((frame - 800) * 0.12);
  const coins: React.ReactElement[] = [];
  for (let i = 0; i < 40; i++) {
    const bx = random(`sc-coin-x-${i}`) * 3840;
    const fall = ((frame - 800) * (6 + random(`sc-coin-s-${i}`) * 10) + random(`sc-coin-o-${i}`) * 2160) % 2400 - 200;
    coins.push(
      <circle key={i} cx={bx} cy={fall} r={10 + random(`sc-coin-r-${i}`) * 14} fill={GOLD} opacity={0.5} />
    );
  }
  return (
    <>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, opacity: Math.min(1, s)}}>
        {coins}
      </svg>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 170, display: 'flex', justifyContent: 'center',
        opacity: Math.min(1, s), transform: `scale(${0.9 + s * 0.1})`,
      }}>
        <div style={{
          borderRadius: 30, padding: '36px 110px', background: 'rgba(14,18,6,0.94)',
          border: `3px solid ${GOLD}`, textAlign: 'center',
          boxShadow: `0 0 ${60 + pulse * 60}px rgba(251,191,36,0.45)`,
        }}>
          <div style={{color: GOLD, fontFamily: FONT, fontWeight: 800, fontSize: 72, letterSpacing: 1}}>
            CHALLENGE COMPLETE \u2713
          </div>
          <div style={{color: INK, fontFamily: MONO, fontSize: 44, marginTop: 12}}>
            $1,378 saved in 52 weeks \u00B7 one habit at a time
          </div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const SavingsChallengeJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_sc frame={frame} />
      <AmbientParticles_sc frame={frame} />
      <Title_sc frame={frame} fps={fps} />
      <Bars_sc frame={frame} fps={fps} />
      <Payoff_sc frame={frame} fps={fps} />
      <TickerTape_sc frame={frame} />
      <CornerHud_sc frame={frame} />
      <FineDither_sc frame={frame} />
      <FilmGrain_sc frame={frame} />
    </AbsoluteFill>
  );
};
