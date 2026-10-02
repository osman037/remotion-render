/**
 * CashFlowForecastCycle.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The cash-flow forecasting cycle for small businesses: project cash IN vs
 * OUT across 12 weeks, watch the runway gauge, compare three scenarios,
 * then ACT — build the buffer before the dip. Deterministic.
 * (Forecasting cycle only — never invoice chasing.)
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
// Palette (deep indigo, cyan)
// ---------------------------------------------------------------------------
const BG = '#0B0D1A';
const INK = '#F0F4FB';
const MUTED = 'rgba(240,244,251,0.62)';
const FAINT = 'rgba(240,244,251,0.32)';
const CYAN = '#22D3EE';
const GREEN = '#34D399';
const RED = '#F87171';
const AMBER = '#FBBF24';
const VIOLET = '#A78BFA';
const PANEL = 'rgba(12,14,28,0.92)';
const HAIRLINE = 'rgba(240,244,251,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: cf
// ---------------------------------------------------------------------------
const Background_cf: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#9BE4F2" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(34,211,238,0.12), rgba(34,211,238,0.03) 46%, rgba(11,13,26,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#cfVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(34,211,238,0.045)" />
        <defs>
          <radialGradient id="cfVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(11,13,26,0)" />
            <stop offset="100%" stopColor="rgba(4,5,12,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_cf: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`cf-amb-x-${i}`) * 3840;
    const by = random(`cf-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`cf-amb-s-${i}`) * 1.4;
    const ang = random(`cf-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`cf-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? CYAN : i % 4 === 1 ? VIOLET : 'rgba(240,244,251,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_cf: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`cf-dth-x-${i}`) * 3840;
    const by = random(`cf-dth-y-${i}`) * 2160;
    const jx = (random(`cf-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`cf-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`cf-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`cf-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#C9F3FB" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_cf = [
  'CASH IN $412K',
  'CASH OUT $386K',
  'RUNWAY 7.4 MONTHS',
  '3 SCENARIOS MODELED',
  'DIP SPOTTED WEEK 9',
  'BUFFER +$40K',
  'FORECAST UPDATED WEEKLY',
  'NEVER RUN DRY',
];
const TickerTape_cf: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_cf.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(34,211,238,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(5,6,14,0.66)', borderBottom: '1px solid rgba(240,244,251,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_cf: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(34,211,238,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={CYAN} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? CYAN : 'rgba(240,244,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? CYAN : 'rgba(240,244,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_cf: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`cf-grain-x-${frame}-${i}`) * 3840;
    const y = random(`cf-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`cf-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`cf-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Forecast model: 12 weeks, $k. Deterministic.
// ---------------------------------------------------------------------------
const WEEKS_cf = 12;
const CASH_IN_cf = [38, 41, 36, 44, 40, 47, 35, 42, 39, 45, 41, 48];
const CASH_OUT_cf = [30, 33, 31, 36, 38, 34, 40, 37, 44, 35, 33, 36];
const NET_cf: number[] = CASH_IN_cf.map((v, i) => v - CASH_OUT_cf[i]);
const CUM_cf: number[] = [];
NET_cf.reduce((acc, n, i) => (CUM_cf[i] = acc + n, acc + n), 120); // start balance 120k

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_cf: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        CASH FLOW FORECAST CYCLE
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        Project 12 weeks ahead &middot; spot the dip &middot; act before it hits
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Runway gauge (top right)
// ---------------------------------------------------------------------------
const Runway_cf: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 120, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const months = 7.4 * interpolate(frame, [150, 420], [0, 1], clamp01);
  const R = 120;
  const C = 2 * Math.PI * R;
  const frac = Math.min(1, months / 12);
  return (
    <div style={{position: 'absolute', top: 330, right: 240, opacity: Math.min(1, s), textAlign: 'center'}}>
      <svg width={320} height={320} viewBox="0 0 320 320">
        <circle cx={160} cy={160} r={R} fill="none" stroke="rgba(240,244,251,0.10)" strokeWidth={34} />
        <circle cx={160} cy={160} r={R} fill="none" stroke={CYAN} strokeWidth={34}
          strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 160 160)"
          strokeLinecap="round" style={{filter: 'drop-shadow(0 0 18px rgba(34,211,238,0.55))'}} />
        <text x={160} y={152} fill={INK} fontSize={64} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {months.toFixed(1)}
        </text>
        <text x={160} y={196} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle">MONTHS RUNWAY</text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main chart: in/out bars + cumulative line
// ---------------------------------------------------------------------------
const Chart_cf: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [90, 150], [0, 1], clamp01);
  if (fade <= 0) return null;
  const L = 300;
  const Rr = 3080;
  const T = 700;
  const Bb = 1560;
  const draw = interpolate(frame, [140, 560], [0, 1], clamp01);
  const maxV = 55;
  const yFor = (v: number) => Bb - (v / maxV) * (Bb - T);
  const xFor = (i: number) => L + (i + 0.5) * ((Rr - L) / WEEKS_cf);
  const bw = ((Rr - L) / WEEKS_cf) * 0.26;
  const warnOn = frame >= 620;
  const path = CUM_cf.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`).join(' ');
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
      {[0, 15, 30, 45].map((v) => (
        <g key={v}>
          <line x1={L} y1={yFor(v)} x2={Rr} y2={yFor(v)} stroke="rgba(240,244,251,0.09)" strokeWidth={1.5} />
          <text x={L - 24} y={yFor(v) + 12} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="end">${v}k</text>
        </g>
      ))}
      {/* danger zone below 20k */}
      <rect x={L} y={yFor(20)} width={Rr - L} height={Bb - yFor(20)} fill="rgba(248,113,113,0.06)" opacity={warnOn ? 1 : 0.25} />
      <line x1={L} y1={yFor(20)} x2={Rr} y2={yFor(20)} stroke={RED} strokeWidth={2.5} strokeDasharray="14 14" opacity={0.6} />
      <text x={Rr - 16} y={yFor(20) - 18} fill={RED} fontSize={28} fontFamily={MONO} textAnchor="end">BUFFER FLOOR $20k</text>
      {/* bars */}
      {CASH_IN_cf.map((v, i) => {
        const on = draw * WEEKS_cf > i + 0.35;
        if (!on) return null;
        const w = CASH_OUT_cf[i];
        return (
          <g key={i}>
            <rect x={xFor(i) - bw - 8} y={yFor(v)} width={bw} height={Bb - yFor(v)} fill={GREEN} opacity={0.85} rx={6} />
            <rect x={xFor(i) + 8} y={yFor(w)} width={bw} height={Bb - yFor(w)} fill={RED} opacity={0.85} rx={6} />
            <text x={xFor(i)} y={Bb + 56} fill={FAINT} fontSize={26} fontFamily={MONO} textAnchor="middle">W{i + 1}</text>
          </g>
        );
      })}
      {/* cumulative line */}
      <path d={path} fill="none" stroke={CYAN} strokeWidth={8} strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw}
        style={{filter: 'drop-shadow(0 0 16px rgba(34,211,238,0.6))'}} />
      {/* week-9 dip marker */}
      {warnOn && (
        <g>
          <circle cx={xFor(8)} cy={yFor(CUM_cf[8])} r={26} fill="none" stroke={AMBER} strokeWidth={6} />
          <text x={xFor(8)} y={yFor(CUM_cf[8]) - 60} fill={AMBER} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle">
            DIP: WEEK 9
          </text>
        </g>
      )}
      {/* legend */}
      <g>
        <rect x={L} y={T - 110} width={34} height={34} fill={GREEN} rx={6} />
        <text x={L + 52} y={T - 82} fill={MUTED} fontSize={30} fontFamily={FONT}>Cash in</text>
        <rect x={L + 300} y={T - 110} width={34} height={34} fill={RED} rx={6} />
        <text x={L + 352} y={T - 82} fill={MUTED} fontSize={30} fontFamily={FONT}>Cash out</text>
        <line x1={L + 640} y1={T - 93} x2={L + 720} y2={T - 93} stroke={CYAN} strokeWidth={8} />
        <text x={L + 738} y={T - 82} fill={MUTED} fontSize={30} fontFamily={FONT}>Balance forecast</text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Scenario comparison (right) + ACT panel
// ---------------------------------------------------------------------------
const Scenarios_cf: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 560, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const rows = [
    {name: 'CONSERVATIVE', runway: '4.1 mo', color: RED},
    {name: 'BASE', runway: '7.4 mo', color: CYAN},
    {name: 'OPTIMISTIC', runway: '11.2 mo', color: GREEN},
  ];
  return (
    <div style={{position: 'absolute', right: 220, top: 760, width: 560, opacity: Math.min(1, s), transform: `translateX(${(1 - s) * 80}px)`}}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>SCENARIOS</div>
      <div style={{marginTop: 18, display: 'flex', flexDirection: 'column', gap: 18}}>
        {rows.map((r, i) => {
          const on = interpolate(frame, [600 + i * 40, 630 + i * 40], [0, 1], clamp01);
          return (
            <div key={r.name} style={{
              borderRadius: 20, background: PANEL, border: `2px solid ${r.name === 'BASE' ? CYAN : HAIRLINE}`,
              padding: '22px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: on,
              boxShadow: r.name === 'BASE' ? '0 0 30px rgba(34,211,238,0.25)' : 'none',
            }}>
              <div style={{color: r.name === 'BASE' ? INK : MUTED, fontFamily: MONO, fontWeight: 800, fontSize: 32}}>{r.name}</div>
              <div style={{color: r.color, fontFamily: MONO, fontWeight: 800, fontSize: 40}}>{r.runway}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Act_cf: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 700, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin((frame - 700) * 0.12);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 130, display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        borderRadius: 30, padding: '34px 100px', background: 'rgba(6,16,20,0.94)',
        border: `3px solid ${GREEN}`, textAlign: 'center',
        boxShadow: `0 0 ${50 + pulse * 50}px rgba(52,211,153,0.4)`,
      }}>
        <div style={{color: GREEN, fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 1}}>ACT: BUILD THE BUFFER</div>
        <div style={{color: INK, fontFamily: MONO, fontSize: 36, marginTop: 10}}>
          +$40k credit line &middot; runway back above <span style={{color: CYAN}}>6 months</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const CashFlowForecastCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_cf frame={frame} />
      <AmbientParticles_cf frame={frame} />
      <Title_cf frame={frame} fps={fps} />
      <Runway_cf frame={frame} fps={fps} />
      <Chart_cf frame={frame} fps={fps} />
      <Scenarios_cf frame={frame} fps={fps} />
      <Act_cf frame={frame} fps={fps} />
      <TickerTape_cf frame={frame} />
      <CornerHud_cf frame={frame} />
      <FineDither_cf frame={frame} />
      <FilmGrain_cf frame={frame} />
    </AbsoluteFill>
  );
};
