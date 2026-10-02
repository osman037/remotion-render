/**
 * HomeInspectionProcess.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A home inspection taught as a five-system process: EXTERIOR & ROOF ->
 * PLUMBING -> ELECTRICAL -> HVAC -> the graded written REPORT. Each system
 * checks off live, earns a grade, and lands on the final report card.
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
// Palette (warm stone, amber, terracotta)
// ---------------------------------------------------------------------------
const BG = '#151009';
const INK = '#FBF6EC';
const MUTED = 'rgba(251,246,236,0.62)';
const FAINT = 'rgba(251,246,236,0.32)';
const AMBER = '#F59E0B';
const TERRA = '#EA580C';
const GREEN = '#34D399';
const BLUE = '#60A5FA';
const PANEL = 'rgba(22,17,10,0.92)';
const HAIRLINE = 'rgba(251,246,236,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: hi
// ---------------------------------------------------------------------------
const Background_hi: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#E8C98A" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 34%, rgba(245,158,11,0.13), rgba(245,158,11,0.03) 46%, rgba(21,16,9,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#hiVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(245,158,11,0.045)" />
        <defs>
          <radialGradient id="hiVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(21,16,9,0)" />
            <stop offset="100%" stopColor="rgba(8,5,2,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_hi: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`hi-amb-x-${i}`) * 3840;
    const by = random(`hi-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`hi-amb-s-${i}`) * 1.4;
    const ang = random(`hi-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`hi-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? AMBER : i % 4 === 1 ? TERRA : 'rgba(251,246,236,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_hi: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`hi-dth-x-${i}`) * 3840;
    const by = random(`hi-dth-y-${i}`) * 2160;
    const jx = (random(`hi-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`hi-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`hi-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`hi-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#FFE9C4" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_hi = [
  'ROOF: SOUND',
  'PLUMBING: NO LEAKS',
  'ELECTRICAL: 200A PANEL',
  'HVAC: 14 SEER',
  'FOUNDATION: SOLID',
  'REPORT: 5 SYSTEMS GRADED',
  'LICENSED INSPECTOR',
  'CLOSING WITH CONFIDENCE',
];
const TickerTape_hi: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_hi.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(245,158,11,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(12,8,4,0.66)', borderBottom: '1px solid rgba(251,246,236,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_hi: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(245,158,11,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={AMBER} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? AMBER : 'rgba(251,246,236,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? AMBER : 'rgba(251,246,236,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_hi: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`hi-grain-x-${frame}-${i}`) * 3840;
    const y = random(`hi-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`hi-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`hi-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Inspection model
// ---------------------------------------------------------------------------
interface Zone_hi {id: string; label: string; items: string[]; grade: string; at: number; x: number; y: number;}
const ZONES_hi: Zone_hi[] = [
  {id: 'roof', label: 'EXTERIOR & ROOF', items: ['Shingles: sound', 'Gutters: clear', 'Siding: intact'], grade: 'A', at: 150, x: 1920, y: 620},
  {id: 'plumb', label: 'PLUMBING', items: ['Water heater: 2023', 'No active leaks', 'Pressure: 62 psi'], grade: 'A\u2212', at: 300, x: 1120, y: 1080},
  {id: 'elec', label: 'ELECTRICAL', items: ['200A panel', 'GFCIs present', 'No double-taps'], grade: 'B+', at: 450, x: 2720, y: 1080},
  {id: 'hvac', label: 'HVAC', items: ['14 SEER unit', 'Filter: clean', 'Ducts sealed'], grade: 'A', at: 600, x: 1920, y: 1420},
];

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_hi: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        HOME INSPECTION PROCESS
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        Four systems checked &middot; one graded report for the buyer
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// House with zone highlights
// ---------------------------------------------------------------------------
const House_hi: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 80, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const activeIdx = ZONES_hi.reduce((acc, z, i) => (frame >= z.at ? i : acc), -1);
  const sweepX = interpolate(frame, [100, 760], [900, 2940], clamp01);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, opacity: Math.min(1, s)}}>
      {/* stylized house */}
      <g opacity={0.9}>
        <rect x={1350} y={900} width={1140} height={560} fill="#241A0E" stroke={HAIRLINE} strokeWidth={3} />
        <polygon points="1290,920 1920,560 2550,920" fill="#2E2313" stroke={AMBER} strokeWidth={4} />
        <rect x={1820} y={1200} width={200} height={260} fill="#1A130A" stroke={HAIRLINE} strokeWidth={3} />
        <rect x={1450} y={1020} width={180} height={180} fill="#1A130A" stroke={HAIRLINE} strokeWidth={3} />
        <rect x={2210} y={1020} width={180} height={180} fill="#1A130A" stroke={HAIRLINE} strokeWidth={3} />
      </g>
      {/* zone markers */}
      {ZONES_hi.map((z, i) => {
        const on = frame >= z.at;
        const zs = spring({frame: frame - z.at, fps, config: {damping: 200, stiffness: 110}});
        if (zs <= 0.001) return null;
        const ping = 0.5 + 0.5 * Math.sin((frame - z.at) * 0.15);
        return (
          <g key={z.id} opacity={Math.min(1, zs)}>
            <circle cx={z.x} cy={z.y} r={44 + ping * 10} fill="none" stroke={AMBER} strokeWidth={5} opacity={0.55} />
            <circle cx={z.x} cy={z.y} r={34} fill={on ? AMBER : '#241A0E'} stroke={AMBER} strokeWidth={4} />
            <text x={z.x} y={z.y + 14} fill={on ? '#1A1006' : AMBER} fontSize={36} fontWeight={800} fontFamily={MONO} textAnchor="middle">
              {i + 1}
            </text>
          </g>
        );
      })}
      {/* inspector sweep line */}
      {activeIdx >= 0 && activeIdx < 3 && (
        <line x1={sweepX} y1={640} x2={sweepX} y2={1520} stroke={BLUE} strokeWidth={5} opacity={0.5} strokeDasharray="16 18" />
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Zone checklist cards (left column, stack as they complete)
// ---------------------------------------------------------------------------
const Checklists_hi: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  return (
    <div style={{position: 'absolute', left: 220, top: 1520, display: 'flex', gap: 36}}>
      {ZONES_hi.map((z) => {
        const s = spring({frame: frame - z.at, fps, config: {damping: 200, stiffness: 100}});
        if (s <= 0.001) return null;
        return (
          <div key={z.id} style={{
            width: 500, borderRadius: 24, background: PANEL, border: `2px solid ${HAIRLINE}`,
            padding: '28px 36px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{color: AMBER, fontFamily: MONO, fontWeight: 800, fontSize: 30}}>{z.label}</div>
              <div style={{
                color: '#1A1006', backgroundColor: GREEN, fontFamily: MONO, fontWeight: 800,
                fontSize: 34, borderRadius: 12, padding: '4px 18px',
                transform: `rotate(-6deg) scale(${interpolate(frame, [z.at + 90, z.at + 120], [0.4, 1], clamp01)})`,
                opacity: interpolate(frame, [z.at + 90, z.at + 110], [0, 1], clamp01),
              }}>
                {z.grade}
              </div>
            </div>
            <div style={{marginTop: 16}}>
              {z.items.map((it, k) => {
                const on = frame >= z.at + 30 + k * 28;
                return (
                  <div key={it} style={{display: 'flex', gap: 16, alignItems: 'center', marginTop: 10, opacity: on ? 1 : 0.25}}>
                    <div style={{width: 30, height: 30, borderRadius: 15, backgroundColor: on ? GREEN : 'rgba(251,246,236,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#05281D', fontSize: 22, fontWeight: 800}}>
                      {on ? '\u2713' : ''}
                    </div>
                    <div style={{color: MUTED, fontFamily: FONT, fontSize: 28}}>{it}</div>
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
// Final report card (right side)
// ---------------------------------------------------------------------------
const Report_hi: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 740, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const stamp = interpolate(frame, [820, 860], [0, 1], clamp01);
  return (
    <div style={{
      position: 'absolute', right: 220, top: 330, width: 620, borderRadius: 28,
      background: 'rgba(24,18,10,0.95)', border: `3px solid ${AMBER}`, padding: '44px 52px',
      opacity: Math.min(1, s), transform: `translateX(${(1 - s) * 90}px)`,
      boxShadow: '0 0 80px rgba(245,158,11,0.25)',
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>INSPECTION REPORT</div>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 44, marginTop: 10}}>1420 Maple St.</div>
      <div style={{marginTop: 24}}>
        {ZONES_hi.map((z, i) => {
          const on = interpolate(frame, [760 + i * 24, 780 + i * 24], [0, 1], clamp01);
          return (
            <div key={z.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${HAIRLINE}`, opacity: on}}>
              <div style={{color: MUTED, fontFamily: FONT, fontSize: 30}}>{z.label}</div>
              <div style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 38}}>{z.grade}</div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 28, textAlign: 'center', color: AMBER, fontFamily: MONO, fontWeight: 800, fontSize: 40,
        border: `3px solid ${AMBER}`, borderRadius: 14, padding: '14px 0',
        transform: `rotate(-4deg) scale(${0.5 + stamp * 0.5})`, opacity: stamp,
      }}>
        REPORT READY \u2713
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 26, marginTop: 18, textAlign: 'center'}}>
        Buyer closes with confidence
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const HomeInspectionProcess: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_hi frame={frame} />
      <AmbientParticles_hi frame={frame} />
      <Title_hi frame={frame} fps={fps} />
      <House_hi frame={frame} fps={fps} />
      <Checklists_hi frame={frame} fps={fps} />
      <Report_hi frame={frame} fps={fps} />
      <TickerTape_hi frame={frame} />
      <CornerHud_hi frame={frame} />
      <FineDither_hi frame={frame} />
      <FilmGrain_hi frame={frame} />
    </AbsoluteFill>
  );
};
