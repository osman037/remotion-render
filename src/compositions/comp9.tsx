/**
 * RestaurantTicketFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral KITCHEN DISPLAY SYSTEM visual for restaurant-tech
 * marketers, POS vendors and hospitality trainers: order tickets fire onto
 * the rail, prep-stage chips advance RECEIVED → PREPPING → READY, ticket
 * timers escalate green → amber → red, the expo board consolidates the pass,
 * and the payoff is a cleared rail with average ticket time. Deterministic
 * seeded randomness only.
 *
 * Register in Root.tsx:
 *   <Composition id="RestaurantTicketFlow" component={RestaurantTicketFlow}
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
// Palette (dark kitchen pass, ember orange)
// ---------------------------------------------------------------------------
const BG = '#0E0805';
const INK = '#F7EFE6';
const MUTED = 'rgba(247,239,230,0.58)';
const EMBER = '#FB923C';
const FLAME = '#F97316';
const GREEN = '#34D399';
const AMBER = '#FBBF24';
const RED = '#F87171';
const PANEL = 'rgba(22,13,7,0.90)';
const HAIRLINE = 'rgba(247,239,230,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const TICKET_START = 26;
const TICKET_GAP = 15;
const PREP_STEP = 62;
const READY_STEP = 62;
const EXPO_START = 640;
const PAYOFF_START = 790;

const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Data: 6 order tickets
// ---------------------------------------------------------------------------
type Stage = 'RECEIVED' | 'PREPPING' | 'READY';
interface OrderTicket {
  no: string;
  table: string;
  items: string[];
  prepSec: number;
}
const TICKETS: OrderTicket[] = [
  {no: '#1042', table: 'TABLE 12', items: ['2× Ribeye', '1× Burrata', '2× Negroni'], prepSec: 420},
  {no: '#1043', table: 'TABLE 04', items: ['1× Margherita', '1× Caesar'], prepSec: 300},
  {no: '#1044', table: 'BAR 02', items: ['3× Old Fashioned', '1× Truffle Fries'], prepSec: 240},
  {no: '#1045', table: 'TABLE 19', items: ['1× Salmon', '1× Risotto', '1× Tiramisu'], prepSec: 480},
  {no: '#1046', table: 'PATIO 07', items: ['2× Smash Burger', '2× Shake'], prepSec: 360},
  {no: '#1047', table: 'TABLE 08', items: ['1× tasting menu'], prepSec: 540},
];

const STAGE_COLOR: Record<Stage, string> = {RECEIVED: '#93C5FD', PREPPING: AMBER, READY: GREEN};

const stageOf = (frame: number, i: number): Stage => {
  const base = TICKET_START + i * TICKET_GAP;
  if (frame >= base + PREP_STEP + READY_STEP) return 'READY';
  if (frame >= base + PREP_STEP) return 'PREPPING';
  return 'RECEIVED';
};

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="ktGlow" cx="50%" cy="22%" r="80%">
      <stop offset="0%" stopColor="rgba(249,115,22,0.13)" />
      <stop offset="55%" stopColor="rgba(249,115,22,0.035)" />
      <stop offset="100%" stopColor="rgba(14,8,5,0)" />
    </radialGradient>
    <radialGradient id="ktVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(8,4,2,0)" />
      <stop offset="100%" stopColor="rgba(5,2,1,0.76)" />
    </radialGradient>
    <linearGradient id="ktScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(249,115,22,0)" />
      <stop offset="50%" stopColor="rgba(249,115,22,0.14)" />
      <stop offset="100%" stopColor="rgba(249,115,22,0)" />
    </linearGradient>
    <filter id="ktBlur70" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const drift = Math.sin((frame / 900) * Math.PI * 2) * 80;
  const scanY = (frame / 900) * 2400 - 240;
  const orbs: React.ReactElement[] = [];
  for (let i = 0; i < 5; i++) {
    const ox = random(`kt-orb-x-${i}`) * 3840;
    const oy = random(`kt-orb-y-${i}`) * 2160;
    const r = 240 + random(`kt-orb-r-${i}`) * 300;
    const hue = i % 2 === 0 ? 'rgba(249,115,22,0.09)' : 'rgba(251,146,60,0.06)';
    const my = Math.cos((frame / 900) * Math.PI * 2 + i * 1.9) * 100;
    orbs.push(<circle key={i} cx={ox} cy={oy + my} r={r} fill={hue} filter="url(#ktBlur70)" />);
  }
  const grid: React.ReactElement[] = [];
  for (let gx = 0; gx <= 3840; gx += 240) {
    grid.push(<line key={`v${gx}`} x1={gx} y1={0} x2={gx} y2={2160} stroke="rgba(247,239,230,0.04)" strokeWidth={1} />);
  }
  for (let gy = 0; gy <= 2160; gy += 240) {
    grid.push(<line key={`h${gy}`} x1={0} y1={gy} x2={3840} y2={gy} stroke="rgba(247,239,230,0.04)" strokeWidth={1} />);
  }
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect width={3840} height={2160} fill="url(#ktGlow)" transform={`translate(${drift},0)`} />
        {orbs}
        {grid}
        <rect x={0} y={scanY} width={3840} height={320} fill="url(#ktScan)" />
        <rect width={3840} height={2160} fill="url(#ktVignette)" />
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
  const pulse = 0.7 + 0.3 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div style={{position: 'absolute', top: 110, left: 220, right: 220, opacity, transform: `translateY(${y}px)`}}>
      <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 14, color: EMBER}}>
        KITCHEN DISPLAY &nbsp;·&nbsp; THE PASS
      </div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 148, color: INK, marginTop: 16}}>
        Ticket Flow
      </div>
      <div style={{display: 'flex', alignItems: 'center', marginTop: 24, gap: 30}}>
        <div style={{width: 22, height: 22, borderRadius: 11, backgroundColor: RED, opacity: pulse, boxShadow: `0 0 30px ${RED}`}} />
        <div style={{fontFamily: MONO, fontSize: 40, color: MUTED}}>6 ACTIVE TICKETS &nbsp;·&nbsp; DINNER RUSH</div>
        <div style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 40, color: EMBER, border: `2px solid ${EMBER}`, borderRadius: 12, padding: '10px 26px'}}>
          AVG 6:12
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ticket rail
// ---------------------------------------------------------------------------
const TicketRail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const cols = 3;
  return (
    <div style={{position: 'absolute', top: 500, left: 220, right: 220}}>
      {TICKETS.map((t, i) => {
        const enter = spring({frame: frame - (TICKET_START + i * TICKET_GAP), fps, config: {damping: 160, stiffness: 130}});
        const opacity = interpolate(enter, [0, 1], [0, 1]);
        const drop = interpolate(enter, [0, 1], [-160, 0]);
        const stage = stageOf(frame, i);
        const elapsed = Math.max(0, frame - (TICKET_START + i * TICKET_GAP)) / 60;
        const mm = Math.floor(elapsed / 60);
        const ss = Math.floor(elapsed % 60);
        const timer = `${mm}:${ss.toString().padStart(2, '0')}`;
        const heat = elapsed > 300 ? RED : elapsed > 150 ? AMBER : GREEN;
        const readyPulse = stage === 'READY' ? 0.75 + 0.25 * Math.sin((frame / 30) * Math.PI * 2) : 1;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const expo = frame >= EXPO_START;
        const expoShift = expo ? interpolate(frame, [EXPO_START, EXPO_START + 60], [0, 1], clamp01) : 0;
        return (
          <div
            key={t.no}
            style={{
              position: 'absolute',
              left: col * 1140 + expoShift * 200,
              top: row * 560,
              width: 1060,
              opacity,
              transform: `translateY(${drop}px)`,
              backgroundColor: PANEL,
              border: `2px solid ${stage === 'READY' ? GREEN : HAIRLINE}`,
              borderTop: `14px solid ${STAGE_COLOR[stage]}`,
              borderRadius: 20,
              padding: '34px 44px',
              boxShadow: stage === 'READY' ? `0 0 60px rgba(52,211,153,${0.35 * readyPulse})` : 'none',
            }}
          >
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 58, color: INK}}>{t.no}</div>
              <div style={{marginLeft: 30, fontFamily: MONO, fontSize: 36, letterSpacing: 6, color: MUTED}}>{t.table}</div>
              <div style={{marginLeft: 'auto', fontFamily: MONO, fontWeight: 700, fontSize: 52, color: heat}}>{timer}</div>
            </div>
            <div style={{marginTop: 26, borderTop: `1px dashed ${HAIRLINE}`, paddingTop: 24}}>
              {t.items.map((item, k) => (
                <div key={k} style={{fontFamily: FONT, fontWeight: 600, fontSize: 48, color: INK, marginBottom: 12}}>
                  {item}
                </div>
              ))}
            </div>
            <div style={{display: 'flex', marginTop: 26, gap: 14}}>
              {(['RECEIVED', 'PREPPING', 'READY'] as Stage[]).map((s) => {
                const active = stage === s;
                return (
                  <div
                    key={s}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontFamily: MONO,
                      fontSize: 32,
                      letterSpacing: 4,
                      padding: '14px 0',
                      borderRadius: 10,
                      color: active ? '#0E0805' : MUTED,
                      backgroundColor: active ? STAGE_COLOR[s] : 'rgba(247,239,230,0.07)',
                      fontWeight: active ? 800 : 400,
                    }}
                  >
                    {s}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Expo consolidation strip
// ---------------------------------------------------------------------------
const ExpoStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - EXPO_START, fps, config: {damping: 200, stiffness: 80}});
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const y = interpolate(enter, [0, 1], [80, 0]);
  const readyCount = TICKETS.filter((_, i) => stageOf(frame, i) === 'READY').length;
  return (
    <div style={{position: 'absolute', bottom: 300, left: 220, right: 220, opacity, transform: `translateY(${y}px)`}}>
      <div style={{fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: EMBER, marginBottom: 20}}>EXPO — READY FOR PASS</div>
      <div style={{display: 'flex', gap: 24}}>
        {TICKETS.map((t, i) => {
          const ready = stageOf(frame, i) === 'READY';
          return (
            <div
              key={t.no}
              style={{
                flex: 1,
                backgroundColor: ready ? 'rgba(52,211,153,0.10)' : PANEL,
                border: `2px solid ${ready ? GREEN : HAIRLINE}`,
                borderRadius: 16,
                padding: '24px 30px',
                textAlign: 'center',
              }}
            >
              <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 44, color: ready ? GREEN : MUTED}}>{t.no}</div>
              <div style={{fontFamily: MONO, fontSize: 32, color: MUTED, marginTop: 8}}>{ready ? '✓ FIRE' : '···'}</div>
            </div>
          );
        })}
      </div>
      <div style={{fontFamily: MONO, fontSize: 36, color: MUTED, marginTop: 18}}>
        {readyCount} OF 6 TICKETS READY
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payoff banner
// ---------------------------------------------------------------------------
const PayoffBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - PAYOFF_START, fps, config: {damping: 200, stiffness: 70}});
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.94, 1]);
  return (
    <div style={{position: 'absolute', bottom: 110, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity, transform: `scale(${scale})`}}>
      <div style={{backgroundColor: 'rgba(14,8,5,0.94)', border: `2px solid ${EMBER}`, borderRadius: 26, padding: '36px 90px', textAlign: 'center', boxShadow: '0 0 90px rgba(249,115,22,0.30)'}}>
        <div style={{fontFamily: MONO, fontSize: 38, letterSpacing: 12, color: EMBER}}>SERVICE COMPLETE</div>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 88, color: INK, marginTop: 10}}>Rail Clear &nbsp;·&nbsp; Avg Ticket 6:12</div>
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
    const x = random(`kt-grain-x-${frame}-${i}`) * 3840;
    const y = random(`kt-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`kt-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`kt-grain-s-${frame}-${i}`) * 2.5;
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
export const RestaurantTicketFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <TicketRail frame={frame} fps={fps} />
      <ExpoStrip frame={frame} fps={fps} />
      <PayoffBanner frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
