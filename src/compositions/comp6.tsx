/**
 * OralHygieneDailyRoutine.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The daily oral-hygiene routine as a looping cycle: BRUSH 2 minutes ->
 * FLOSS -> RINSE 30 seconds -> drink WATER -> 6-MONTH CHECKUP — repeating
 * morning and evening. Routine only, never dental procedures.
 * Brand-neutral, deterministic.
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
// Palette (fresh mint on deep teal-navy)
// ---------------------------------------------------------------------------
const BG = '#06231F';
const INK = '#F0FBF8';
const MUTED = 'rgba(240,251,248,0.62)';
const FAINT = 'rgba(240,251,248,0.32)';
const MINT = '#5EEAD4';
const TEAL = '#2DD4BF';
const SKY = '#38BDF8';
const GOLD = '#FBBF24';
const PANEL = 'rgba(7,28,25,0.92)';
const HAIRLINE = 'rgba(240,251,248,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: oh
// ---------------------------------------------------------------------------
const Background_oh: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#A9E8DA" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 32%, rgba(94,234,212,0.13), rgba(94,234,212,0.03) 46%, rgba(6,35,31,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#ohVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(94,234,212,0.045)" />
        <defs>
          <radialGradient id="ohVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(6,35,31,0)" />
            <stop offset="100%" stopColor="rgba(2,14,12,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_oh: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`oh-amb-x-${i}`) * 3840;
    const by = random(`oh-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`oh-amb-s-${i}`) * 1.4;
    const ang = random(`oh-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`oh-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? SKY : i % 4 === 1 ? MINT : 'rgba(240,251,248,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_oh: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`oh-dth-x-${i}`) * 3840;
    const by = random(`oh-dth-y-${i}`) * 2160;
    const jx = (random(`oh-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`oh-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`oh-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`oh-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#D2F5EC" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_oh = [
  'BRUSH 2 MINUTES',
  'FLOSS DAILY',
  'RINSE 30 SECONDS',
  'DRINK WATER',
  'CHECKUP EVERY 6 MONTHS',
  'MORNING + EVENING',
  'SOFT BRISTLES',
  'HEALTHY GUMS \u2713',
];
const TickerTape_oh: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_oh.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(94,234,212,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(3,16,13,0.66)', borderBottom: '1px solid rgba(240,251,248,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_oh: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(94,234,212,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={MINT} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? MINT : 'rgba(240,251,248,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? MINT : 'rgba(240,251,248,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_oh: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`oh-grain-x-${frame}-${i}`) * 3840;
    const y = random(`oh-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`oh-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`oh-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Routine model
// ---------------------------------------------------------------------------
interface Step_oh {label: string; sub: string; glyph: string; at: number; dur: number;}
const STEPS_oh: Step_oh[] = [
  {label: 'BRUSH', sub: '2 minutes, soft bristles', glyph: '\u29BF', at: 130, dur: 150},
  {label: 'FLOSS', sub: 'between every tooth', glyph: '\u223F', at: 300, dur: 110},
  {label: 'RINSE', sub: '30 seconds', glyph: '\u25CB', at: 430, dur: 110},
  {label: 'WATER', sub: 'rinse + hydrate', glyph: '\u25BD', at: 560, dur: 100},
  {label: 'CHECKUP', sub: 'every 6 months', glyph: '\u271A', at: 680, dur: 120},
];

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_oh: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        ORAL HYGIENE DAILY ROUTINE
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        Two minutes, twice a day &middot; the complete five-step cycle
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Central cycle ring with the five steps
// ---------------------------------------------------------------------------
const Cycle_oh: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 90, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const cx = 1920;
  const cy = 1080;
  const R = 560;
  const activeIdx = STEPS_oh.reduce((acc, st, i) => (frame >= st.at ? i : acc), -1);
  // brush timer ring progress (step 0)
  const brushT = interpolate(frame, [STEPS_oh[0].at, STEPS_oh[0].at + STEPS_oh[0].dur], [0, 1], clamp01);
  const secsLeft = Math.ceil(120 * (1 - brushT));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={HAIRLINE} strokeWidth={6} />
        {/* completed arc */}
        {STEPS_oh.map((st, i) => {
          const done = interpolate(frame, [st.at + st.dur * 0.6, st.at + st.dur], [0, 1], clamp01);
          if (done <= 0) return null;
          const a0 = -Math.PI / 2 + (i / 5) * Math.PI * 2;
          const a1 = -Math.PI / 2 + ((i + done) / 5) * Math.PI * 2;
          const large = a1 - a0 > Math.PI ? 1 : 0;
          const x0 = cx + R * Math.cos(a0);
          const y0 = cy + R * Math.sin(a0);
          const x1 = cx + R * Math.cos(a1);
          const y1 = cy + R * Math.sin(a1);
          return (
            <path key={st.label} d={`M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1}`}
              fill="none" stroke={MINT} strokeWidth={14} strokeLinecap="round"
              style={{filter: 'drop-shadow(0 0 14px rgba(94,234,212,0.55))'}} />
          );
        })}
        {/* step nodes */}
        {STEPS_oh.map((st, i) => {
          const ang = -Math.PI / 2 + (i / 5) * Math.PI * 2;
          const nx = cx + R * Math.cos(ang);
          const ny = cy + R * Math.sin(ang);
          const ns = spring({frame: frame - st.at, fps, config: {damping: 200, stiffness: 110}});
          if (ns <= 0.001) return null;
          const active = i === activeIdx;
          return (
            <g key={st.label} opacity={Math.min(1, ns)}>
              <circle cx={nx} cy={ny} r={active ? 120 : 100} fill={active ? '#0B3B34' : PANEL}
                stroke={active ? MINT : HAIRLINE} strokeWidth={active ? 6 : 3}
                style={{filter: active ? 'drop-shadow(0 0 30px rgba(94,234,212,0.5))' : 'none'}} />
              <text x={nx} y={ny + 26} fill={active ? MINT : FAINT} fontSize={84} textAnchor="middle">{st.glyph}</text>
            </g>
          );
        })}
        {/* center: brush countdown while step 0 active, else routine label */}
        <text x={cx} y={cy - 60} fill={MUTED} fontSize={36} fontFamily={MONO} letterSpacing={6} textAnchor="middle">
          {activeIdx === 0 ? 'BRUSHING' : activeIdx >= 0 ? STEPS_oh[activeIdx].label : 'DAILY CYCLE'}
        </text>
        {activeIdx === 0 ? (
          <text x={cx} y={cy + 70} fill={MINT} fontSize={150} fontFamily={MONO} fontWeight={800} textAnchor="middle"
            style={{filter: 'drop-shadow(0 0 30px rgba(94,234,212,0.5))'}}>
            {Math.floor(secsLeft / 60)}:{String(secsLeft % 60).padStart(2, '0')}
          </text>
        ) : (
          <text x={cx} y={cy + 70} fill={INK} fontSize={72} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            {activeIdx > 0 ? STEPS_oh[activeIdx].sub : '5 steps \u00B7 2x daily'}
          </text>
        )}
        {activeIdx > 0 && (
          <text x={cx} y={cy + 140} fill={FAINT} fontSize={44} textAnchor="middle">{STEPS_oh[activeIdx].glyph}</text>
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step detail cards (bottom)
// ---------------------------------------------------------------------------
const Details_oh: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const activeIdx = STEPS_oh.reduce((acc, st, i) => (frame >= st.at ? i : acc), -1);
  return (
    <div style={{position: 'absolute', bottom: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 36}}>
      {STEPS_oh.map((st, i) => {
        const s = spring({frame: frame - st.at, fps, config: {damping: 200, stiffness: 100}});
        if (s <= 0.001) return null;
        const active = i === activeIdx;
        const done = frame >= st.at + st.dur;
        return (
          <div key={st.label} style={{
            width: 560, borderRadius: 26, background: PANEL,
            border: `2px solid ${active ? MINT : done ? 'rgba(94,234,212,0.4)' : HAIRLINE}`,
            padding: '30px 44px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
            boxShadow: active ? '0 0 40px rgba(94,234,212,0.25)' : 'none',
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{color: active || done ? INK : FAINT, fontFamily: FONT, fontWeight: 800, fontSize: 44}}>{st.label}</div>
              {done && !active && (
                <div style={{width: 44, height: 44, borderRadius: 22, backgroundColor: MINT, color: '#052E28', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>\u2713</div>
              )}
            </div>
            <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 8}}>{st.sub}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Morning/evening repeat badge
// ---------------------------------------------------------------------------
const Repeat_oh: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 800, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', top: 330, right: 240, opacity: Math.min(1, s),
      transform: `translateX(${(1 - s) * 80}px)`, textAlign: 'center',
    }}>
      <div style={{
        borderRadius: 26, background: 'rgba(7,30,26,0.94)', border: `2px solid ${MINT}`,
        padding: '30px 56px', boxShadow: '0 0 50px rgba(94,234,212,0.3)',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>REPEAT</div>
        <div style={{color: MINT, fontFamily: FONT, fontWeight: 800, fontSize: 52, marginTop: 8}}>AM + PM</div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 28, marginTop: 6}}>every single day</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const OralHygieneDailyRoutine: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_oh frame={frame} />
      <AmbientParticles_oh frame={frame} />
      <Title_oh frame={frame} fps={fps} />
      <Cycle_oh frame={frame} fps={fps} />
      <Details_oh frame={frame} fps={fps} />
      <Repeat_oh frame={frame} fps={fps} />
      <TickerTape_oh frame={frame} />
      <CornerHud_oh frame={frame} />
      <FineDither_oh frame={frame} />
      <FilmGrain_oh frame={frame} />
    </AbsoluteFill>
  );
};
