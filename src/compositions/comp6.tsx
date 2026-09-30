/**
 * PayrollRunCycle.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral PAYROLL RUN visual for HR SaaS marketers, payroll providers
 * and finance trainers: an employee roster assembles, each line runs through
 * a gross-to-net waterfall (federal tax, state tax, benefits, 401k), net-pay
 * cards stamp PAID one by one, a pay-day countdown locks, and the payoff is a
 * cycle-complete ledger with totals. Deterministic seeded randomness only.
 *
 * Register in Root.tsx:
 *   <Composition id="PayrollRunCycle" component={PayrollRunCycle}
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
// Palette (deep emerald finance console)
// ---------------------------------------------------------------------------
const BG = '#04100C';
const INK = '#EAF7F0';
const MUTED = 'rgba(234,247,240,0.58)';
const EMERALD = '#34D399';
const MINT = '#A7F3D0';
const GOLD = '#FBBF24';
const CYAN = '#67E8F9';
const DEDUCT = '#F87171';
const PANEL = 'rgba(7,20,15,0.88)';
const HAIRLINE = 'rgba(234,247,240,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const ROSTER_START = 24;
const ROSTER_GAP = 13;
const RUN_START = 190;      // payroll engine starts
const RUN_STEP = 58;        // frames per employee cycle
const STAMP_START = 620;    // PAID stamps
const PAYOFF_START = 770;

const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Data: 7 employees, gross + deduction stack
// ---------------------------------------------------------------------------
interface Employee {
  name: string;
  role: string;
  gross: number;
  fed: number;
  state: number;
  benefits: number;
  k401: number;
}
const EMPLOYEES: Employee[] = [
  {name: 'Maya Chen', role: 'ENGINEERING', gross: 9200, fed: 1840, state: 552, benefits: 310, k401: 552},
  {name: 'Jonas Weber', role: 'DESIGN', gross: 7800, fed: 1482, state: 468, benefits: 310, k401: 468},
  {name: 'Priya Nair', role: 'DATA', gross: 8600, fed: 1682, state: 516, benefits: 310, k401: 516},
  {name: 'Sam Ortiz', role: 'SUPPORT', gross: 5400, fed: 918, state: 324, benefits: 310, k401: 270},
  {name: 'Lena Kova', role: 'MARKETING', gross: 6900, fed: 1277, state: 414, benefits: 310, k401: 414},
  {name: 'Dev Patel', role: 'DEVOPS', gross: 8900, fed: 1771, state: 534, benefits: 310, k401: 534},
  {name: 'Ana Ruiz', role: 'FINANCE', gross: 7400, fed: 1391, state: 444, benefits: 310, k401: 444},
];
const netOf = (e: Employee) => e.gross - e.fed - e.state - e.benefits - e.k401;

const DEDUCTS = [
  {key: 'fed', label: 'FED TAX', color: DEDUCT},
  {key: 'state', label: 'STATE', color: '#FB923C'},
  {key: 'benefits', label: 'BENEFITS', color: GOLD},
  {key: 'k401', label: '401(K)', color: CYAN},
] as const;

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="prGlow" cx="60%" cy="30%" r="78%">
      <stop offset="0%" stopColor="rgba(52,211,153,0.13)" />
      <stop offset="55%" stopColor="rgba(52,211,153,0.035)" />
      <stop offset="100%" stopColor="rgba(4,16,12,0)" />
    </radialGradient>
    <radialGradient id="prVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(2,8,6,0)" />
      <stop offset="100%" stopColor="rgba(1,6,4,0.76)" />
    </radialGradient>
    <linearGradient id="prScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(52,211,153,0)" />
      <stop offset="50%" stopColor="rgba(52,211,153,0.15)" />
      <stop offset="100%" stopColor="rgba(52,211,153,0)" />
    </linearGradient>
    <linearGradient id="prGold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={GOLD} />
      <stop offset="100%" stopColor="#FDE68A" />
    </linearGradient>
    <filter id="prBlur70" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const drift1 = Math.sin((frame / 900) * Math.PI * 2) * 80;
  const scanY = (frame / 900) * 2400 - 240;
  const orbs: React.ReactElement[] = [];
  for (let i = 0; i < 5; i++) {
    const ox = random(`pr-orb-x-${i}`) * 3840;
    const oy = random(`pr-orb-y-${i}`) * 2160;
    const r = 240 + random(`pr-orb-r-${i}`) * 300;
    const hue = i % 2 === 0 ? 'rgba(52,211,153,0.10)' : 'rgba(251,191,36,0.06)';
    const mx = Math.sin((frame / 900) * Math.PI * 2 + i * 2.1) * 110;
    orbs.push(<circle key={i} cx={ox + mx} cy={oy} r={r} fill={hue} filter="url(#prBlur70)" />);
  }
  const grid: React.ReactElement[] = [];
  for (let gx = 0; gx <= 3840; gx += 240) {
    grid.push(<line key={`v${gx}`} x1={gx} y1={0} x2={gx} y2={2160} stroke="rgba(234,247,240,0.04)" strokeWidth={1} />);
  }
  for (let gy = 0; gy <= 2160; gy += 240) {
    grid.push(<line key={`h${gy}`} x1={0} y1={gy} x2={3840} y2={gy} stroke="rgba(234,247,240,0.04)" strokeWidth={1} />);
  }
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect width={3840} height={2160} fill="url(#prGlow)" transform={`translate(${drift1},0)`} />
        {orbs}
        {grid}
        <rect x={0} y={scanY} width={3840} height={320} fill="url(#prScan)" />
        <rect width={3840} height={2160} fill="url(#prVignette)" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const rise = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const opacity = interpolate(rise, [0, 1], [0, 1]);
  const y = interpolate(rise, [0, 1], [60, 0]);
  const engineOn = frame >= RUN_START;
  return (
    <div style={{position: 'absolute', top: 110, left: 220, right: 220, opacity, transform: `translateY(${y}px)`}}>
      <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 14, color: EMERALD}}>
        PAYROLL ENGINE &nbsp;·&nbsp; SEPTEMBER CYCLE
      </div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 148, color: INK, marginTop: 16}}>
        Payroll Run
      </div>
      <div style={{display: 'flex', alignItems: 'center', marginTop: 24, gap: 30}}>
        <div style={{fontFamily: MONO, fontSize: 40, color: MUTED}}>7 EMPLOYEES &nbsp;·&nbsp; BIWEEKLY</div>
        <div style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 40, color: engineOn ? '#04100C' : MUTED, backgroundColor: engineOn ? EMERALD : 'rgba(234,247,240,0.08)', borderRadius: 12, padding: '12px 30px', fontWeight: 700}}>
          {engineOn ? '● RUNNING' : '○ STANDBY'}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Roster with gross-to-net waterfall
// ---------------------------------------------------------------------------
const Roster: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  return (
    <div style={{position: 'absolute', top: 500, left: 220, width: 3400}}>
      {EMPLOYEES.map((e, i) => {
        const enter = spring({frame: frame - (ROSTER_START + i * ROSTER_GAP), fps, config: {damping: 200, stiffness: 110}});
        const opacity = interpolate(enter, [0, 1], [0, 1]);
        const y = interpolate(enter, [0, 1], [60, 0]);
        const runStart = RUN_START + i * RUN_STEP;
        const progress = interpolate(frame, [runStart, runStart + 120], [0, 1], clamp01);
        const net = netOf(e);
        const paid = frame >= STAMP_START + i * 26;
        const stampScale = spring({frame: frame - (STAMP_START + i * 26), fps, config: {damping: 120, stiffness: 220}});
        const maxD = e.gross;
        let used = 0;
        return (
          <div
            key={e.name}
            style={{
              position: 'relative',
              height: 190,
              opacity,
              transform: `translateY(${y}px)`,
              backgroundColor: PANEL,
              border: `1px solid ${HAIRLINE}`,
              borderRadius: 18,
              marginBottom: 20,
              padding: '26px 44px',
              overflow: 'hidden',
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
              <div style={{width: 520}}>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 56, color: INK}}>{e.name}</div>
                <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 6, color: MUTED, marginTop: 6}}>{e.role}</div>
              </div>
              <div style={{flex: 1, position: 'relative', height: 90}}>
                <div style={{position: 'absolute', top: 0, left: 0, fontFamily: MONO, fontSize: 32, color: MUTED}}>
                  GROSS ${e.gross.toLocaleString()}
                </div>
                <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 34, backgroundColor: 'rgba(234,247,240,0.08)', borderRadius: 17, overflow: 'hidden', display: 'flex'}}>
                  {DEDUCTS.map((d) => {
                    const val = e[d.key];
                    const w = (val / maxD) * 100 * progress;
                    used += val;
                    return (
                      <div key={d.key} style={{width: `${w}%`, height: '100%', backgroundColor: d.color, opacity: 0.9}} title={d.label} />
                    );
                  })}
                  <div style={{width: `${(net / maxD) * 100 * progress}%`, height: '100%', backgroundColor: EMERALD}} />
                </div>
                <div style={{position: 'absolute', top: 0, right: 0, fontFamily: MONO, fontSize: 32, color: EMERALD}}>
                  NET ${(net * progress).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </div>
              </div>
              <div style={{width: 300, textAlign: 'right'}}>
                <div style={{fontFamily: MONO, fontSize: 30, color: MUTED}}>DEDUCTIONS</div>
                <div style={{fontFamily: FONT, fontWeight: 750, fontSize: 54, color: INK}}>
                  ${((e.gross - net) * progress).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </div>
              </div>
            </div>
            {paid && (
              <div
                style={{
                  position: 'absolute',
                  right: 36,
                  top: 22,
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: 44,
                  letterSpacing: 6,
                  color: '#04100C',
                  backgroundColor: EMERALD,
                  borderRadius: 10,
                  padding: '10px 28px',
                  transform: `scale(${interpolate(stampScale, [0, 1], [1.6, 1])}) rotate(-6deg)`,
                  boxShadow: `0 0 40px ${EMERALD}`,
                }}
              >
                PAID
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payoff ledger
// ---------------------------------------------------------------------------
const Payoff: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - PAYOFF_START, fps, config: {damping: 200, stiffness: 70}});
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.94, 1]);
  const totalGross = EMPLOYEES.reduce((s, e) => s + e.gross, 0);
  const totalNet = EMPLOYEES.reduce((s, e) => s + netOf(e), 0);
  const count = interpolate(frame, [PAYOFF_START, PAYOFF_START + 60], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', bottom: 110, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity, transform: `scale(${scale})`}}>
      <div style={{backgroundColor: 'rgba(4,16,12,0.94)', border: `2px solid ${EMERALD}`, borderRadius: 26, padding: '40px 90px', display: 'flex', gap: 110, alignItems: 'center', boxShadow: '0 0 90px rgba(52,211,153,0.30)'}}>
        <div>
          <div style={{fontFamily: MONO, fontSize: 36, letterSpacing: 10, color: EMERALD}}>CYCLE COMPLETE</div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 88, color: INK, marginTop: 10}}>Payday Locked</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{fontFamily: MONO, fontSize: 36, color: MUTED}}>TOTAL GROSS</div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 72, color: INK}}>${(totalGross * count).toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{fontFamily: MONO, fontSize: 36, color: MUTED}}>TOTAL NET PAID</div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 72, color: EMERALD}}>${(totalNet * count).toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 900;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`pr-grain-x-${frame}-${i}`) * 3840;
    const y = random(`pr-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`pr-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`pr-grain-s-${frame}-${i}`) * 2.5;
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
export const PayrollRunCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <Roster frame={frame} fps={fps} />
      <Payoff frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
