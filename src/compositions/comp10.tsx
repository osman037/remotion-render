/**
 * ColdChainMonitoringProcess.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A vaccine shipment travels a route map while its temperature trace stays
 * in the safe 2-8°C green band — until an excursion spikes red, an alert
 * fires, a cooling pulse brings the line back down, and the CHAIN INTACT
 * seal stamps at delivery. Ice blue on dark navy. Deterministic.
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
// Palette (ice blue on dark navy)
// ---------------------------------------------------------------------------
const BG = '#081019';
const INK = '#EAF6FF';
const MUTED = 'rgba(234,246,255,0.64)';
const FAINT = 'rgba(234,246,255,0.34)';
const ICE = '#7DD3FC';
const GREEN = '#34D399';
const RED = '#F87171';
const AMBER = '#FBBF24';
const PANEL = 'rgba(10,18,30,0.94)';
const HAIRLINE = 'rgba(234,246,255,0.15)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: cold
// ---------------------------------------------------------------------------
const Background_cold: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#BAE6FD" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(125,211,252,0.13), rgba(125,211,252,0.03) 46%, rgba(8,16,25,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#coldVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(125,211,252,0.05)" />
        <defs>
          <radialGradient id="coldVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(8,16,25,0)" />
            <stop offset="100%" stopColor="rgba(3,6,11,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_cold: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`cold-amb-x-${i}`) * 3840;
    const by = random(`cold-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`cold-amb-s-${i}`) * 1.4;
    const ang = random(`cold-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`cold-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? ICE : i % 4 === 1 ? GREEN : 'rgba(234,246,255,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_cold: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`cold-dth-x-${i}`) * 3840;
    const by = random(`cold-dth-y-${i}`) * 2160;
    const jx = (random(`cold-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`cold-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`cold-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`cold-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#D6F0FF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_cold = [
  'SHIPMENT VX-8841 · VACCINES',
  'SETPOINT 5.0°C',
  'SAFE RANGE 2–8°C',
  'GPS TRACKING LIVE',
  'EXCURSION LOGGED 11.2°C',
  'BACKUP COOLANT ENGAGED',
  'TIME OUT OF RANGE 04:12',
  'CHAIN INTACT ✓',
];
const TickerTape_cold: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_cold.join('   ◆   ') + '   ◆   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(125,211,252,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(5,9,15,0.66)', borderBottom: '1px solid rgba(234,246,255,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_cold: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(125,211,252,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={ICE} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? ICE : 'rgba(234,246,255,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? ICE : 'rgba(234,246,255,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_cold: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`cold-grain-x-${frame}-${i}`) * 3840;
    const y = random(`cold-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`cold-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`cold-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Temperature model (°C), deterministic. Safe band 2–8, excursion ~450–560.
// ---------------------------------------------------------------------------
const tempAt = (f: number): number => {
  const base = 5 + 0.8 * Math.sin(f * 0.02) + 0.4 * Math.sin(f * 0.055 + 1);
  if (f < 450) return base;
  if (f <= 560) {
    const bump = Math.pow(Math.sin((Math.PI * (f - 450)) / 110), 1.2);
    return 5 + 6.4 * bump;
  }
  if (f <= 700) {
    const k = (f - 560) / 140;
    return 11.4 - (11.4 - 5) * Math.pow(k, 0.7);
  }
  return base;
};
const excursion = (f: number): boolean => f >= 450 && f < 560;
const recovering = (f: number): boolean => f >= 560 && f < 700;

// ---------------------------------------------------------------------------
// Route polyline + point-along-path helper (SSR-safe)
// ---------------------------------------------------------------------------
const ROUTE: number[][] = [
  [320, 1050], [700, 900], [1050, 980], [1350, 800],
  [1700, 880], [2000, 720], [2280, 860],
];
const SEG_LEN: number[] = [];
let ROUTE_TOTAL = 0;
for (let i = 0; i < ROUTE.length - 1; i++) {
  const dx = ROUTE[i + 1][0] - ROUTE[i][0];
  const dy = ROUTE[i + 1][1] - ROUTE[i][1];
  const len = Math.sqrt(dx * dx + dy * dy);
  SEG_LEN.push(len);
  ROUTE_TOTAL += len;
}
const routePoint = (frac: number): number[] => {
  const f = Math.max(0, Math.min(1, frac));
  let target = f * ROUTE_TOTAL;
  for (let i = 0; i < SEG_LEN.length; i++) {
    if (target <= SEG_LEN[i]) {
      const t = SEG_LEN[i] === 0 ? 0 : target / SEG_LEN[i];
      return [
        ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * t,
        ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * t,
      ];
    }
    target -= SEG_LEN[i];
  }
  return ROUTE[ROUTE.length - 1].slice();
};

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_cold: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        COLD CHAIN MONITORING PROCESS
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        Shipment VX-8841 — vaccines held at <span style={{color: GREEN}}>2–8°C</span>, tracked live, excursion corrected
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Route map: shipment box travels the polyline; pulses + alert during events
// ---------------------------------------------------------------------------
const WAYPOINTS = [
  {name: 'DEPOT A', frac: 0},
  {name: 'HUB B', frac: 0.34},
  {name: 'HUB C', frac: 0.67},
  {name: 'CLINIC D', frac: 1},
];
const RouteMap_cold: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const frac = interpolate(frame, [120, 700], [0, 1], clamp01);
  const [bx, by] = routePoint(frac);
  const isExc = excursion(frame);
  const isRec = recovering(frame);
  const routeD = ROUTE.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const alertFlash = 0.5 + 0.5 * Math.sin(frame * 0.35);
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={180} y={380} width={2220} height={920} rx={30} fill={PANEL} stroke={HAIRLINE} strokeWidth={3} />
      {/* map grid */}
      {Array.from({length: 11}, (_, i) => (
        <line key={`v${i}`} x1={180 + i * 222} y1={380} x2={180 + i * 222} y2={1300}
          stroke="rgba(125,211,252,0.07)" strokeWidth={2} />
      ))}
      {Array.from({length: 5}, (_, i) => (
        <line key={`h${i}`} x1={180} y1={380 + i * 230} x2={2400} y2={380 + i * 230}
          stroke="rgba(125,211,252,0.07)" strokeWidth={2} />
      ))}
      {/* faint city dots */}
      {Array.from({length: 40}, (_, i) => {
        const cx = 240 + random(`cold-city-x-${i}`) * 2100;
        const cy = 440 + random(`cold-city-y-${i}`) * 800;
        const tw = 0.12 + 0.12 * Math.sin(frame * 0.06 + i * 2.2);
        return <circle key={i} cx={cx} cy={cy} r={5} fill={ICE} opacity={tw} />;
      })}
      <text x={240} y={462} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        LIVE ROUTE
      </text>
      <text x={240} y={510} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        DEPOT A → CLINIC D · 1,240 KM
      </text>
      {/* route path */}
      <path d={routeD} fill="none" stroke="rgba(125,211,252,0.35)" strokeWidth={8} strokeDasharray="22 18" />
      <path d={routeD} fill="none" stroke={isExc ? RED : ICE} strokeWidth={4} opacity={0.85}
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - frac}
        style={{filter: `drop-shadow(0 0 12px ${isExc ? 'rgba(248,113,113,0.7)' : 'rgba(125,211,252,0.7)'})`}} />
      {/* waypoints */}
      {WAYPOINTS.map((w) => {
        const [wx, wy] = routePoint(w.frac);
        const reached = frac >= w.frac - 0.01;
        return (
          <g key={w.name}>
            <circle cx={wx} cy={wy} r={reached ? 22 : 14} fill={reached ? GREEN : 'rgba(234,246,255,0.15)'}
              stroke={reached ? GREEN : FAINT} strokeWidth={4} />
            <text x={wx} y={wy - 44} fill={reached ? INK : MUTED} fontSize={30} fontFamily={MONO}
              fontWeight={800} textAnchor="middle" letterSpacing={2}>
              {w.name}
            </text>
          </g>
        );
      })}
      {/* cooling pulse rings */}
      {isRec && [0, 1, 2].map((k) => {
        const ph = ((frame - 560 + k * 40) % 120) / 120;
        return (
          <circle key={k} cx={bx} cy={by} r={60 + ph * 260} fill="none"
            stroke={ICE} strokeWidth={10 * (1 - ph)} opacity={0.7 * (1 - ph)} />
        );
      })}
      {/* the vaccine box */}
      <g transform={`translate(${bx},${by})`}>
        {isExc && (
          <rect x={-110} y={-110} width={220} height={220} rx={36} fill="none" stroke={RED}
            strokeWidth={8} opacity={0.5 + alertFlash * 0.5} />
        )}
        <rect x={-90} y={-90} width={180} height={180} rx={26} fill="#0D1B2E"
          stroke={isExc ? RED : ICE} strokeWidth={7}
          style={{filter: `drop-shadow(0 0 24px ${isExc ? 'rgba(248,113,113,0.8)' : 'rgba(125,211,252,0.7)'})`}} />
        {/* snowflake mark */}
        <g stroke={isExc ? RED : ICE} strokeWidth={9} strokeLinecap="round">
          <line x1={0} y1={-44} x2={0} y2={44} />
          <line x1={-38} y1={-22} x2={38} y2={22} />
          <line x1={-38} y1={22} x2={38} y2={-22} />
        </g>
        <text y={78} fill={isExc ? RED : ICE} fontSize={30} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          2–8°C
        </text>
      </g>
      {/* excursion alert banner */}
      {isExc && (
        <g opacity={0.55 + alertFlash * 0.45}>
          <rect x={900} y={560} width={960} height={130} rx={24} fill="rgba(60,8,12,0.92)"
            stroke={RED} strokeWidth={6} />
          <text x={1380} y={624} fill={RED} fontSize={48} fontFamily={MONO} fontWeight={900}
            textAnchor="middle" letterSpacing={3}>
            ⚠ TEMP EXCURSION
          </text>
          <text x={1380} y={672} fill={INK} fontSize={32} fontFamily={MONO} textAnchor="middle">
            {tempAt(frame).toFixed(1)}°C — ABOVE 8.0°C LIMIT
          </text>
        </g>
      )}
      {isRec && (
        <g>
          <rect x={930} y={560} width={900} height={110} rx={24} fill="rgba(8,40,52,0.92)"
            stroke={ICE} strokeWidth={5} />
          <text x={1380} y={632} fill={ICE} fontSize={40} fontFamily={MONO} fontWeight={800}
            textAnchor="middle" letterSpacing={2}>
            ❄ CORRECTIVE ACTION — BACKUP COOLANT
          </text>
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Thermometer gauge panel (right)
// ---------------------------------------------------------------------------
const TempGauge_cold: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 100, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const t = tempAt(frame);
  const isExc = excursion(frame);
  const isRec = recovering(frame);
  // gauge geometry: tube y 560..1120 maps 14°C..0°C
  const yFor = (temp: number): number => 1120 - (temp / 14) * 560;
  const fillCol = isExc ? RED : isRec ? ICE : GREEN;
  const status = isExc ? 'EXCURSION' : isRec ? 'RECOVERING' : frame < 120 ? 'STANDBY' : 'IN RANGE';
  const statusCol = isExc ? RED : isRec ? ICE : GREEN;
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={2480} y={380} width={680} height={920} rx={30} fill={PANEL} stroke={HAIRLINE} strokeWidth={3} />
      <text x={2540} y={462} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        CARGO TEMP
      </text>
      <text x={2540} y={510} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        PROBE 1 · CALIBRATED
      </text>
      {/* digital readout */}
      <text x={2820} y={620} fill={fillCol} fontSize={120} fontFamily={MONO} fontWeight={900} textAnchor="middle"
        style={{filter: `drop-shadow(0 0 22px ${fillCol}66)`}}>
        {t.toFixed(1)}°
      </text>
      <text x={2820} y={668} fill={MUTED} fontSize={32} fontFamily={MONO} textAnchor="middle" letterSpacing={4}>
        CELSIUS
      </text>
      {/* status chip */}
      <rect x={2640} y={700} width={360} height={80} rx={40} fill="rgba(234,246,255,0.06)"
        stroke={statusCol} strokeWidth={4} />
      <text x={2820} y={752} fill={statusCol} fontSize={34} fontFamily={MONO} fontWeight={800}
        textAnchor="middle" letterSpacing={3}>
        {status}
      </text>
      {/* thermometer tube */}
      <rect x={2560} y={560} width={70} height={560} rx={35} fill="rgba(234,246,255,0.06)" stroke={FAINT} strokeWidth={3} />
      {/* safe band 2–8 */}
      <rect x={2560} y={yFor(8)} width={70} height={yFor(2) - yFor(8)} fill="rgba(52,211,153,0.22)" />
      <line x1={2540} y1={yFor(8)} x2={2650} y2={yFor(8)} stroke={RED} strokeWidth={4} strokeDasharray="10 8" />
      <text x={2670} y={yFor(8) + 10} fill={RED} fontSize={28} fontFamily={MONO}>8.0 LIMIT</text>
      <text x={2670} y={yFor(2) + 10} fill={GREEN} fontSize={28} fontFamily={MONO}>2.0 FLOOR</text>
      {/* mercury fill */}
      <rect x={2572} y={yFor(Math.max(0, t))} width={46} height={1120 - yFor(Math.max(0, t))} rx={23} fill={fillCol} />
      <circle cx={2595} cy={1150} r={52} fill={fillCol} opacity={0.9} />
      {/* tick marks */}
      {Array.from({length: 15}, (_, i) => {
        const yy = 560 + i * 40;
        return <line key={i} x1={2630} y1={yy} x2={2652} y2={yy} stroke={FAINT} strokeWidth={3} />;
      })}
      {/* elapsed transit clock */}
      <text x={2540} y={1260} fill={MUTED} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        ELAPSED <tspan fill={INK}>{`14:${String(22 + Math.floor(interpolate(frame, [120, 700], [0, 38], clamp01))).padStart(2, '0')}:${String(Math.floor((frame * 7) % 60)).padStart(2, '0')}`}</tspan>
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Temperature trace chart (bottom): green band, excursion spike, recovery
// ---------------------------------------------------------------------------
const TempChart_cold: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 140, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const L = 180;
  const Rr = 2400;
  const T = 1400;
  const Bb = 1700;
  const F0 = 120;
  const F1 = 820;
  const xFor = (f: number): number => L + ((f - F0) / (F1 - F0)) * (Rr - L);
  const yFor = (temp: number): number => Bb - (temp / 14) * (Bb - T);
  const endF = Math.min(frame, F1);
  const pts: string[] = [];
  for (let f = F0; f <= endF; f += 6) {
    pts.push(`${xFor(f).toFixed(1)},${yFor(tempAt(f)).toFixed(1)}`);
  }
  const curT = tempAt(Math.min(frame, F1));
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={L} y={T - 90} width={Rr - L} height={Bb - T + 90} rx={30} fill={PANEL} stroke={HAIRLINE} strokeWidth={3} />
      <text x={L + 60} y={T - 20} fill={INK} fontSize={34} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        TEMPERATURE TRACE — FULL TRANSIT
      </text>
      {/* safe band 2–8 */}
      <rect x={L + 60} y={yFor(8)} width={Rr - L - 120} height={yFor(2) - yFor(8)} fill="rgba(52,211,153,0.10)" />
      <line x1={L + 60} y1={yFor(8)} x2={Rr - 60} y2={yFor(8)} stroke={RED} strokeWidth={3} strokeDasharray="14 12" opacity={0.7} />
      <text x={Rr - 80} y={yFor(8) - 14} fill={RED} fontSize={26} fontFamily={MONO} textAnchor="end">8.0°C LIMIT</text>
      <text x={L + 84} y={yFor(5)} fill={GREEN} fontSize={26} fontFamily={MONO}>SAFE BAND 2–8°C</text>
      {/* excursion window shading */}
      <rect x={xFor(450)} y={T} width={xFor(560) - xFor(450)} height={Bb - T} fill="rgba(248,113,113,0.10)" />
      <text x={xFor(505)} y={T + 40} fill={RED} fontSize={26} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
        EXCURSION WINDOW
      </text>
      {/* y ticks */}
      {[0, 4, 8, 12].map((v) => (
        <g key={v}>
          <line x1={L + 60} y1={yFor(v)} x2={Rr - 60} y2={yFor(v)} stroke="rgba(234,246,255,0.08)" strokeWidth={2} />
          <text x={L + 48} y={yFor(v) + 9} fill={MUTED} fontSize={24} fontFamily={MONO} textAnchor="end">{v}°</text>
        </g>
      ))}
      {/* trace */}
      {pts.length > 1 && (
        <polyline points={pts.join(' ')} fill="none" stroke={frame >= 450 && frame < 700 ? RED : ICE}
          strokeWidth={7} strokeLinejoin="round" strokeLinecap="round"
          style={{filter: 'drop-shadow(0 0 10px rgba(125,211,252,0.55))'}} />
      )}
      {/* current dot + label */}
      {frame >= F0 && (
        <g>
          <circle cx={xFor(endF)} cy={yFor(curT)} r={16} fill={excursion(frame) ? RED : GREEN}
            stroke={INK} strokeWidth={4} />
          <text x={xFor(endF) + 30} y={yFor(curT) - 30} fill={INK} fontSize={34} fontFamily={MONO} fontWeight={800}>
            {curT.toFixed(1)}°C
          </text>
        </g>
      )}
      <text x={L + 60} y={Bb + 0} fill={FAINT} fontSize={24} fontFamily={MONO} letterSpacing={2}>
        t →
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Finale: CHAIN INTACT seal stamps at the destination
// ---------------------------------------------------------------------------
const ChainSeal_cold: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const sealS = spring({frame: frame - 720, fps, config: {damping: 170, stiffness: 120}});
  if (sealS <= 0.001) return null;
  const [dx, dy] = routePoint(1);
  const shock = interpolate(frame, [720, 800], [0, 1], clamp01);
  return (
    <g opacity={Math.min(1, sealS)}>
      <defs>
        <filter id="coldSealGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={30} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {shock > 0 && shock < 1 && (
        <circle cx={dx} cy={dy - 190} r={120 + shock * 380} fill="none" stroke={GREEN}
          strokeWidth={10 * (1 - shock)} opacity={0.85 * (1 - shock)} />
      )}
      <g transform={`translate(${dx},${dy - 190}) scale(${0.4 + 0.6 * Math.min(1, sealS)}) rotate(${(1 - Math.min(1, sealS)) * -16})`}
        filter="url(#coldSealGlow)">
        <circle r={130} fill="#0B2A1E" stroke={GREEN} strokeWidth={10} />
        <circle r={104} fill="none" stroke={GREEN} strokeWidth={3} strokeDasharray="12 9" />
        <path d={`M -52 -6 l 36 36 l 72 -84`} fill="none" stroke={GREEN} strokeWidth={20}
          strokeLinecap="round" strokeLinejoin="round" transform="translate(0,-34)" />
        <text y={64} fill={INK} fontSize={34} fontFamily={MONO} fontWeight={900} textAnchor="middle" letterSpacing={2}>
          CHAIN INTACT
        </text>
      </g>
      <text x={dx} y={dy + 40} fill={GREEN} fontSize={32} fontFamily={MONO} fontWeight={800}
        textAnchor="middle" letterSpacing={3}>
        DELIVERED · CLINIC D
      </text>
    </g>
  );
};

const Payoff_cold: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 830, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin((frame - 830) * 0.1);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 120, display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        borderRadius: 30, padding: '34px 110px', background: 'rgba(8,18,30,0.95)',
        border: `3px solid ${GREEN}`, textAlign: 'center',
        boxShadow: `0 0 ${50 + pulse * 50}px rgba(52,211,153,0.35)`,
      }}>
        <div style={{color: GREEN, fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 1}}>
          UNBROKEN COLD CHAIN
        </div>
        <div style={{color: INK, fontFamily: MONO, fontSize: 36, marginTop: 10}}>
          Excursion caught in <span style={{color: RED}}>4 min 12 s</span> — corrected, delivered at <span style={{color: ICE}}>2–8°C</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const ColdChainMonitoringProcess: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_cold frame={frame} />
      <AmbientParticles_cold frame={frame} />
      <Title_cold frame={frame} fps={fps} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <RouteMap_cold frame={frame} fps={fps} />
        <TempGauge_cold frame={frame} fps={fps} />
        <TempChart_cold frame={frame} fps={fps} />
        <ChainSeal_cold frame={frame} fps={fps} />
      </svg>
      <Payoff_cold frame={frame} fps={fps} />
      <TickerTape_cold frame={frame} />
      <CornerHud_cold frame={frame} />
      <FineDither_cold frame={frame} />
      <FilmGrain_cold frame={frame} />
    </AbsoluteFill>
  );
};
