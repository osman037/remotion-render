/**
 * VehicleMaintenanceSchedule.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A cinematic automotive visual for parts brands, service chains and
 * insurers: a mechanical odometer rolls from 42,000 to 92,000 miles while
 * four service lanes (oil, tires, brakes, inspection) tick off their
 * mileage gates with green service stamps. Per-service health gauges feed
 * an overall vehicle-health score that lands on a "HEALTHY CAR" payoff.
 * Deterministic seeded randomness only.
 *
 * Register in Root.tsx:
 *   <Composition id="VehicleMaintenanceSchedule" component={VehicleMaintenanceSchedule}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
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
// Palette (garage cinematic: asphalt navy, service amber, healthy green)
// ---------------------------------------------------------------------------
const BG = '#080B12';
const INK = '#F1F5FA';
const MUTED = 'rgba(241,245,250,0.60)';
const FAINT = 'rgba(241,245,250,0.32)';
const AMBER = '#FBBF24';
const ORANGE = '#FB923C';
const GREEN = '#34D399';
const GREEN_DEEP = '#065F46';
const CYAN = '#67E8F9';
const STEEL = '#94A3B8';
const PANEL = 'rgba(9,13,22,0.90)';
const HAIRLINE = 'rgba(241,245,250,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const ODO_START = 60;
const ODO_END = 800;
const MILE_START = 42000;
const MILE_END = 92000;
const RAIL_LO = 40000;
const RAIL_HI = 95000;
const PAYOFF_START = 812;

const milesAt = (frame: number) =>
  MILE_START + (MILE_END - MILE_START) * interpolate(frame, [ODO_START, ODO_END], [0, 1], clamp01);
const frameOfMile = (mi: number) =>
  ODO_START + ((mi - MILE_START) / (MILE_END - MILE_START)) * (ODO_END - ODO_START);

interface Service {
  name: string;
  interval: string;
  miles: number;   // service interval in miles
  gates: number[];
  color: string;
}
const SERVICES: Service[] = [
  {name: 'ENGINE OIL', interval: 'EVERY 7,500 MI', miles: 7500, gates: [45000, 52500, 60000, 67500, 75000, 82500, 90000], color: AMBER},
  {name: 'TIRE ROTATION', interval: 'EVERY 15,000 MI', miles: 15000, gates: [45000, 60000, 75000, 90000], color: ORANGE},
  {name: 'BRAKE SERVICE', interval: 'EVERY 30,000 MI', miles: 30000, gates: [60000, 90000], color: CYAN},
  {name: 'FULL INSPECTION', interval: 'EVERY 30,000 MI', miles: 30000, gates: [60000, 90000], color: GREEN},
];
// Health: 100 at last service, decays toward 60 at the next gate
const healthAt = (s: Service, miles: number) => {
  const done = s.gates.filter((g) => g <= miles);
  const last = done.length > 0 ? done[done.length - 1] : MILE_START;
  const upcoming = s.gates.filter((g) => g > miles);
  const next = upcoming.length > 0 ? upcoming[0] : last + s.miles;
  const t = (miles - last) / Math.max(1, next - last);
  return 100 - 40 * Math.min(1, Math.max(0, t));
};
const fmtMi = (v: number) =>
  Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const LANE_X0 = 220;
const LANE_X1 = 2400;
const laneY = (i: number) => 720 + i * 230;
const railX = (mi: number) => LANE_X0 + ((mi - RAIL_LO) / (RAIL_HI - RAIL_LO)) * (LANE_X1 - LANE_X0);

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="vmGlow" cx="40%" cy="28%" r="80%">
      <stop offset="0%" stopColor="rgba(251,191,36,0.10)" />
      <stop offset="45%" stopColor="rgba(103,232,249,0.05)" />
      <stop offset="100%" stopColor="rgba(8,11,18,0)" />
    </radialGradient>
    <radialGradient id="vmVignette" cx="50%" cy="50%" r="76%">
      <stop offset="58%" stopColor="rgba(3,5,10,0)" />
      <stop offset="100%" stopColor="rgba(1,2,6,0.80)" />
    </radialGradient>
    <linearGradient id="vmScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(251,191,36,0)" />
      <stop offset="50%" stopColor="rgba(251,191,36,0.12)" />
      <stop offset="100%" stopColor="rgba(251,191,36,0)" />
    </linearGradient>
    <linearGradient id="vmPayoff" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={GREEN} />
      <stop offset="55%" stopColor={CYAN} />
      <stop offset="100%" stopColor={AMBER} />
    </linearGradient>
    <filter id="vmBlur70" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
    <filter id="vmBlur16" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="16" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: asphalt texture, drifting orbs, road-line sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const drift = Math.sin((frame / 900) * Math.PI * 2) * 90;
  const scanY = (frame / 900) * 2500 - 300;
  const orbs: React.ReactElement[] = [];
  for (let i = 0; i < 6; i++) {
    const ox = random(`vm-orb-x-${i}`) * 3840;
    const oy = random(`vm-orb-y-${i}`) * 2160;
    const r = 260 + random(`vm-orb-r-${i}`) * 320;
    const hue =
      i % 3 === 0
        ? 'rgba(251,191,36,0.07)'
        : i % 3 === 1
        ? 'rgba(103,232,249,0.06)'
        : 'rgba(52,211,153,0.05)';
    const mx = Math.sin((frame / 900) * Math.PI * 2 + i * 2.0) * 120;
    const my = Math.cos((frame / 900) * Math.PI * 2 + i * 1.6) * 90;
    orbs.push(<circle key={i} cx={ox + mx} cy={oy + my} r={r} fill={hue} filter="url(#vmBlur70)" />);
  }
  const dots: React.ReactElement[] = [];
  for (let gx = 70; gx < 3840; gx += 175) {
    for (let gy = 70; gy < 2160; gy += 175) {
      const jx = (random(`vm-dot-x-${gx}-${gy}`) - 0.5) * 26;
      const jy = (random(`vm-dot-y-${gx}-${gy}`) - 0.5) * 26;
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx + jx} cy={gy + jy} r={2.2} fill="rgba(241,245,250,0.05)" />
      );
    }
  }
  // road dashes streaming left (per-frame motion)
  const dashes: React.ReactElement[] = [];
  for (let i = 0; i < 14; i++) {
    const dy = 1900 + (i % 2) * 60;
    const dx = ((random(`vm-dash-x-${i}`) * 4200 - frame * 26) % 4400 + 4400) % 4400 - 300;
    dashes.push(<rect key={i} x={dx} y={dy} width={150} height={14} rx={7} fill="rgba(241,245,250,0.08)" />);
  }
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect width={3840} height={2160} fill="url(#vmGlow)" transform={`translate(${drift},${-drift * 0.6})`} />
        {orbs}
        <g transform={`translate(${drift * 0.4},0)`}>{dots}</g>
        {dashes}
        <rect x={0} y={scanY} width={3840} height={340} fill="url(#vmScan)" />
        <rect width={3840} height={2160} fill="url(#vmVignette)" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const rise = spring({frame, fps, config: {damping: 200, stiffness: 90, mass: 1}});
  const y = interpolate(rise, [0, 1], [70, 0]);
  const opacity = interpolate(rise, [0, 1], [0, 1]);
  const blink = 0.6 + 0.4 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div style={{position: 'absolute', top: 118, left: 220, right: 220, opacity, transform: `translateY(${y}px)`}}>
      <div style={{display: 'flex', alignItems: 'flex-start'}}>
        <div>
          <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 14, color: AMBER}}>
            AUTOMOTIVE &nbsp;·&nbsp; PREVENTIVE CARE
          </div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 148, color: INK, marginTop: 16, letterSpacing: -2}}>
            Vehicle Maintenance
          </div>
          <div style={{fontFamily: FONT, fontSize: 40, color: MUTED, marginTop: 14}}>
            The odometer never lies — service every interval, on the mile
          </div>
        </div>
        <div style={{marginLeft: 'auto', textAlign: 'right'}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 22, border: `2px solid ${AMBER}`, borderRadius: 16, padding: '14px 32px', backgroundColor: 'rgba(12,9,4,0.6)'}}>
            <div style={{width: 24, height: 24, borderRadius: 12, backgroundColor: AMBER, opacity: blink, boxShadow: `0 0 26px ${AMBER}`}} />
            <div style={{fontFamily: MONO, fontSize: 40, fontWeight: 700, color: INK, letterSpacing: 4}}>
              SERVICE SCHEDULE
            </div>
          </div>
          <div style={{fontFamily: MONO, fontSize: 32, color: FAINT, marginTop: 14}}>
            4 SYSTEMS · 15 GATES · 50,000 MI
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Rolling mechanical odometer (top-right hero)
// ---------------------------------------------------------------------------
const DH = 170;
const Odometer: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 30, fps, config: {damping: 200, stiffness: 80}});
  const miles = milesAt(frame);
  const drums: React.ReactElement[] = [];
  for (let k = 5; k >= 0; k--) {
    const dv = miles / Math.pow(10, k);
    const d = Math.floor(dv) % 10;
    const frac = dv - Math.floor(dv);
    const digits: React.ReactElement[] = [];
    for (let n = 0; n <= 10; n++) {
      digits.push(
        <div key={n} style={{height: DH, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {n % 10}
        </div>
      );
    }
    drums.push(
      <div
        key={k}
        style={{
          width: 128,
          height: DH,
          overflow: 'hidden',
          backgroundColor: '#0B0F18',
          border: `2px solid ${HAIRLINE}`,
          borderRadius: 14,
        }}
      >
        <div style={{transform: `translateY(${-(d + Math.min(0.999, frac)) * DH}px)`}}>{digits}</div>
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', right: 220, top: 400, opacity: Math.min(1, enter), textAlign: 'right'}}>
      <div style={{fontFamily: MONO, fontSize: 38, letterSpacing: 10, color: MUTED, marginBottom: 18}}>
        ODOMETER · MI
      </div>
      <div style={{display: 'flex', gap: 14, justifyContent: 'flex-end', fontFamily: MONO, fontWeight: 800, fontSize: 148, color: INK}}>
        {drums}
      </div>
      <div style={{fontFamily: MONO, fontSize: 34, color: FAINT, marginTop: 16}}>
        TRIP {fmtMi(miles - MILE_START)} MI THIS CYCLE
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Service lanes: mileage rail + gate nodes that stamp green when passed
// ---------------------------------------------------------------------------
const ServiceLanes: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const miles = milesAt(frame);
  const cursorX = railX(miles);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <text x={LANE_X0} y={660} fill={AMBER} fontSize={32} fontFamily={MONO} letterSpacing={8}>
          MILEAGE GATES · {fmtMi(RAIL_LO)}–{fmtMi(RAIL_HI)} MI
        </text>
        {SERVICES.map((s, i) => {
          const enter = spring({frame: frame - (50 + i * 30), fps, config: {damping: 200, stiffness: 100}});
          if (enter <= 0.001) return null;
          const y = laneY(i);
          const h = healthAt(s, miles);
          return (
            <g key={s.name} opacity={Math.min(1, enter)}>
              {/* lane header */}
              <text x={LANE_X0} y={y - 78} fill={INK} fontSize={44} fontFamily={FONT} fontWeight={750}>
                {s.name}
              </text>
              <text x={LANE_X0 + 560} y={y - 78} fill={FAINT} fontSize={30} fontFamily={MONO} letterSpacing={4}>
                {s.interval}
              </text>
              <text x={LANE_X1} y={y - 74} fill={h >= 85 ? GREEN : h >= 70 ? AMBER : ORANGE} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="end">
                {Math.round(h)}%
              </text>
              {/* health micro-bar */}
              <rect x={LANE_X1 - 320} y={y - 40} width={320} height={16} rx={8} fill="rgba(241,245,250,0.08)" />
              <rect x={LANE_X1 - 320} y={y - 40} width={320 * (h / 100)} height={16} rx={8} fill={h >= 85 ? GREEN : h >= 70 ? AMBER : ORANGE} />
              {/* rail */}
              <line x1={LANE_X0} y1={y} x2={LANE_X1} y2={y} stroke="rgba(241,245,250,0.16)" strokeWidth={8} strokeLinecap="round" />
              <line x1={LANE_X0} y1={y} x2={Math.min(cursorX, LANE_X1)} y2={y} stroke={s.color} strokeWidth={8} strokeLinecap="round" opacity={0.85} />
              {/* 10k ruler ticks */}
              {Array.from({length: 6}).map((_, k) => {
                const rm = 40000 + k * 10000 + 5000;
                if (rm > RAIL_HI) return null;
                const rx = railX(rm);
                return (
                  <g key={k}>
                    <line x1={rx} y1={y - 14} x2={rx} y2={y + 14} stroke="rgba(241,245,250,0.22)" strokeWidth={3} />
                    <text x={rx} y={y + 52} fill={FAINT} fontSize={24} fontFamily={MONO} textAnchor="middle">
                      {rm / 1000}K
                    </text>
                  </g>
                );
              })}
              {/* gate nodes */}
              {s.gates.map((g) => {
                const gx = railX(g);
                const done = miles >= g;
                const dueSoon = !done && g - miles < 1500;
                const stS = spring({frame: frame - frameOfMile(g), fps, config: {damping: 200, stiffness: 130}});
                const pulse = dueSoon ? 0.55 + 0.45 * Math.sin((frame / 60) * Math.PI * 2) : 1;
                return (
                  <g key={g}>
                    <circle cx={gx} cy={y} r={done ? 24 : 17} fill={done ? GREEN : dueSoon ? AMBER : '#131A28'} stroke={done ? GREEN : dueSoon ? AMBER : STEEL} strokeWidth={4} opacity={pulse} />
                    {done && (
                      <text x={gx} y={y + 12} fill="#06281C" fontSize={28} fontFamily={FONT} fontWeight={800} textAnchor="middle">
                        ✓
                      </text>
                    )}
                    {done && stS > 0.02 && (
                      <g opacity={Math.min(1, stS)} transform={`translate(${gx - 110},${y - 108}) scale(${Math.min(1, stS)})`}>
                        <rect x={0} y={0} width={220} height={64} rx={12} fill="rgba(6,40,28,0.94)" stroke={GREEN} strokeWidth={3} />
                        <text x={110} y={44} fill={GREEN} fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                          {(g / 1000).toFixed(g % 1000 === 0 ? 0 : 1)}K ✓
                        </text>
                      </g>
                    )}
                    {dueSoon && (
                      <text x={gx} y={y - 40} fill={AMBER} fontSize={28} fontFamily={MONO} fontWeight={700} textAnchor="middle" opacity={pulse}>
                        DUE
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* odometer cursor across all lanes */}
        <g opacity={interpolate(frame, [ODO_START, ODO_START + 30], [0, 1], clamp01)}>
          <line x1={cursorX} y1={640} x2={cursorX} y2={1620} stroke={AMBER} strokeWidth={4} strokeDasharray="16 12" opacity={0.75} />
          <circle cx={cursorX} cy={640} r={14} fill={AMBER} style={{filter: 'drop-shadow(0 0 14px rgba(251,191,36,0.9))'}} />
          <text x={cursorX} y={618} fill={AMBER} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle">
            {fmtMi(miles)} MI
          </text>
        </g>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Vehicle health dashboard (right column): overall ring + per-system bars
// ---------------------------------------------------------------------------
const HealthDashboard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 140, fps, config: {damping: 200, stiffness: 80}});
  const miles = milesAt(frame);
  const PX = 2620;
  const overall = SERVICES.reduce((a, s) => a + healthAt(s, miles), 0) / SERVICES.length;
  const RC = 150;
  const circ = 2 * Math.PI * RC;
  const dash = (overall / 100) * circ;
  const done = SERVICES.flatMap((s) => s.gates).filter((g) => miles >= g).length;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={PX} y={700} width={980} height={940} rx={22} fill={PANEL} stroke={HAIRLINE} strokeWidth={2} />
        <text x={PX + 44} y={772} fill={GREEN} fontSize={32} fontFamily={MONO} letterSpacing={8}>
          VEHICLE HEALTH
        </text>
        {/* overall ring */}
        <circle cx={PX + 490} cy={1020} r={RC} fill="none" stroke="rgba(241,245,250,0.08)" strokeWidth={30} />
        <circle
          cx={PX + 490}
          cy={1020}
          r={RC}
          fill="none"
          stroke={overall >= 85 ? GREEN : AMBER}
          strokeWidth={30}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - overall / 100}
          transform={`rotate(-90 ${PX + 490} 1020)`}
          style={{filter: `drop-shadow(0 0 18px ${overall >= 85 ? 'rgba(52,211,153,0.6)' : 'rgba(251,191,36,0.6)'})`}}
        />
        <text x={PX + 490} y={1000} fill={INK} fontSize={110} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {Math.round(overall)}
        </text>
        <text x={PX + 490} y={1058} fill={MUTED} fontSize={32} fontFamily={MONO} textAnchor="middle">
          / 100
        </text>
        {/* per-system bars */}
        {SERVICES.map((s, i) => {
          const h = healthAt(s, miles);
          const by = 1240 + i * 84;
          return (
            <g key={s.name}>
              <text x={PX + 44} y={by + 6} fill={MUTED} fontSize={28} fontFamily={MONO} letterSpacing={2}>
                {s.name}
              </text>
              <rect x={PX + 420} y={by - 22} width={516} height={26} rx={13} fill="rgba(241,245,250,0.08)" />
              <rect x={PX + 420} y={by - 22} width={516 * (h / 100)} height={26} rx={13} fill={s.color} opacity={0.92} />
              <text x={PX + 44} y={by + 42} fill={FAINT} fontSize={24} fontFamily={MONO}>
                NEXT {fmtMi(s.gates.find((g) => g > miles) ?? s.gates[s.gates.length - 1] + s.miles)} MI
              </text>
            </g>
          );
        })}
        <text x={PX + 44} y={1600} fill={FAINT} fontSize={26} fontFamily={MONO} letterSpacing={2} opacity={0}>
          {done}
        </text>
      </svg>
      <div style={{position: 'absolute', left: PX + 44, top: 1560, fontFamily: MONO, fontSize: 32, color: GREEN}}>
        {done} / 15 SERVICES COMPLETED · 0 OVERDUE
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Service log: last completed events (bottom-right strip)
// ---------------------------------------------------------------------------
const LOG_LINES = [
  'OIL CHANGE · 45,000 MI ✓',
  'TIRE ROTATION · 45,000 MI ✓',
  'OIL CHANGE · 52,500 MI ✓',
  'OIL · TIRES · BRAKES · INSPECTION · 60,000 MI ✓',
  'OIL CHANGE · 67,500 MI ✓',
  'OIL · TIRE ROTATION · 75,000 MI ✓',
  'OIL CHANGE · 82,500 MI ✓',
  'OIL · TIRES · BRAKES · INSPECTION · 90,000 MI ✓',
];
const LOG_AT = [45000, 45000, 52500, 60000, 67500, 75000, 82500, 90000];
const ServiceLog: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 220, fps, config: {damping: 200, stiffness: 80}});
  const miles = milesAt(frame);
  const shown = LOG_LINES.filter((_, i) => miles >= LOG_AT[i]);
  const last3 = shown.slice(-3);
  const live = 0.55 + 0.45 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div
      style={{
        position: 'absolute',
        left: 2620,
        top: 1660,
        width: 980,
        opacity: Math.min(1, enter),
        backgroundColor: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 20,
        padding: '30px 40px',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <div style={{width: 20, height: 20, borderRadius: 10, backgroundColor: GREEN, opacity: live, boxShadow: `0 0 24px ${GREEN}`}} />
        <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: GREEN}}>SERVICE LOG</div>
      </div>
      <div style={{marginTop: 20, minHeight: 150}}>
        {last3.map((line, k) => (
          <div
            key={`${shown.length}-${k}`}
            style={{
              fontFamily: MONO,
              fontSize: 32,
              color: k === last3.length - 1 ? INK : MUTED,
              marginTop: k === 0 ? 0 : 12,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {line}
          </div>
        ))}
        {last3.length === 0 && (
          <div style={{fontFamily: MONO, fontSize: 32, color: FAINT}}>AWAITING FIRST SERVICE…</div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payoff banner: HEALTHY CAR
// ---------------------------------------------------------------------------
const PayoffBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - PAYOFF_START, fps, config: {damping: 200, stiffness: 70}});
  if (enter <= 0.001) return null;
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const flash = interpolate(frame, [PAYOFF_START + 20, PAYOFF_START + 80], [0, 1], clamp01);
  const health = Math.round(SERVICES.reduce((a, s) => a + healthAt(s, MILE_END), 0) / SERVICES.length);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `scale(${0.94 + enter * 0.06})`,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(4,10,8,0.95)',
          border: `3px solid ${GREEN}`,
          borderRadius: 26,
          padding: '44px 90px',
          textAlign: 'center',
          boxShadow: `0 0 140px rgba(52,211,153,${0.25 + flash * 0.35})`,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 42, letterSpacing: 16, color: GREEN}}>
          VEHICLE HEALTH {health} / 100
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 108,
            marginTop: 8,
            background: 'linear-gradient(90deg,#34D399,#67E8F9,#FBBF24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 6,
          }}
        >
          HEALTHY CAR
        </div>
        <div style={{fontFamily: MONO, fontSize: 36, color: MUTED, marginTop: 12}}>
          15/15 SERVICES ON TIME · 0 OVERDUE · 50,000 MI COVERED
        </div>
      </div>
    </div>
  );
};


// ---------------------------------------------------------------------------
// Texture overlays: ambient particles, fine dither, top ticker, corner HUD.
// Full-frame per-frame motion + cinematic grain support. Self-contained.
// ---------------------------------------------------------------------------
const MONO_vm = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const TEAL_vm = '#2DD4BF';
const CYAN_vm = '#67E8F9';

const AmbientParticles_vm: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`vm-amb-x-${i}`) * 3840;
    const by = random(`vm-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`vm-amb-s-${i}`) * 1.4;
    const ang = random(`vm-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`vm-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? CYAN_vm : i % 4 === 1 ? TEAL_vm : 'rgba(234,242,251,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_vm: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`vm-dth-x-${i}`) * 3840;
    const by = random(`vm-dth-y-${i}`) * 2160;
    const jx = (random(`vm-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`vm-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`vm-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`vm-dth-s-${i}`) * 2;
    specks.push(
      <rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#CFE9FF" opacity={o} />
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_vm = [
  'ENGINE OIL 5W-30',
  'TIRE ROTATION 10K KM',
  'BRAKE SERVICE OK',
  'FULL INSPECTION 21 PTS',
  'NEXT SERVICE 90 DAYS',
  '0 FAULT CODES',
  'BATTERY 12.6V',
  'WARRANTY ACTIVE'
];
const TickerTape_vm: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_vm.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(103,232,249,0.60)" fontSize={27} fontFamily={MONO_vm} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(3,7,14,0.66)', borderBottom: '1px solid rgba(234,242,251,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_vm: React.FC<{frame: number}> = ({frame}) => {
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
            <circle cx={0} cy={0} r={6} fill={TEAL_vm} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? TEAL_vm : 'rgba(234,242,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? TEAL_vm : 'rgba(234,242,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain (full-frame, re-seeded every frame)
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 7000;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`vm-grain-x-${frame}-${i}`) * 3840;
    const y = random(`vm-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`vm-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`vm-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const VehicleMaintenanceSchedule: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <Odometer frame={frame} fps={fps} />
      <ServiceLanes frame={frame} fps={fps} />
      <HealthDashboard frame={frame} fps={fps} />
      <ServiceLog frame={frame} fps={fps} />
      <PayoffBanner frame={frame} fps={fps} />
      <AmbientParticles_vm frame={frame} />
      <FineDither_vm frame={frame} />
      <TickerTape_vm frame={frame} />
      <CornerHud_vm frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
