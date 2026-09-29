/**
 * SalesPipelineStages.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A sales pipeline story on deep indigo: deals flow left to right through
 * five stages, conversion counters tick between stages, stalled deals pulse
 * for attention, and the forecast gauge rolls up to a closed-won total.
 * Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="SalesPipelineStages" component={SalesPipelineStages}
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
// Palette (deep indigo + violet sales)
// ---------------------------------------------------------------------------
const BG = '#0E1030';
const INK = '#EEF0FD';
const MUTED = 'rgba(238,240,253,0.60)';
const VIOLET = '#8B7CFF';
const VIOLET_DEEP = '#4A3FBF';
const GREEN = '#34D399';
const AMBER = '#FFB020';
const RED = '#FF6B6B';
const PANEL = 'rgba(20,24,66,0.82)';
const HAIRLINE = 'rgba(238,240,253,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const PIPE_START = 60;
const DEALS_START = 140;
const CONV_START = 420;
const FORECAST_START = 560;
const RESOLVE_START = 800;

const STAGES = [
  {name: 'LEAD', deals: 48, value: 240000, color: '#8B7CFF'},
  {name: 'QUALIFIED', deals: 32, value: 198000, color: '#7CC4FF'},
  {name: 'MEETING', deals: 21, value: 164000, color: '#5EEAD4'},
  {name: 'PROPOSAL', deals: 12, value: 118000, color: '#FBBF24'},
  {name: 'CLOSED WON', deals: 7, value: 84000, color: '#34D399'},
];
const CONVERSIONS = [67, 66, 57, 58]; // % between stages

const DEALS = [
  {label: 'NOVA LABS', value: 18000, stage: 4},
  {label: 'HELIX CO', value: 24000, stage: 4},
  {label: 'BRIGHTLINE', value: 12000, stage: 3},
  {label: 'KODO', value: 31000, stage: 3},
  {label: 'MERIDIAN', value: 9000, stage: 2},
  {label: 'ATLAS FOODS', value: 27000, stage: 2},
  {label: 'PULSEPOINT', value: 15000, stage: 1},
  {label: 'FERNWAY', value: 22000, stage: 0},
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="spGlow" cx="50%" cy="30%" r="72%">
      <stop offset="0%" stopColor="rgba(139,124,255,0.13)" />
      <stop offset="55%" stopColor="rgba(139,124,255,0.035)" />
      <stop offset="100%" stopColor="rgba(14,16,48,0)" />
    </radialGradient>
    <radialGradient id="spVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(6,7,22,0)" />
      <stop offset="100%" stopColor="rgba(6,7,22,0.72)" />
    </radialGradient>
    <linearGradient id="spFlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={VIOLET_DEEP} />
      <stop offset="100%" stopColor={VIOLET} />
    </linearGradient>
    <filter id="spGlow14" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="spShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.55" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const driftX = (frame * 0.3) % 120;
  const driftY = (frame * 0.18) % 120;
  const scanY = ((frame / 900) * (2160 + 300)) % (2160 + 300) - 150;
  const dots: React.ReactElement[] = [];
  for (let gx = 0; gx <= 33; gx++) {
    for (let gy = 0; gy <= 19; gy++) {
      const shimmer = 0.05 + 0.05 * Math.sin(frame * 0.07 + gx * 0.9 + gy * 1.1);
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx * 120 - driftX} cy={gy * 120 - driftY} r={2.2} fill="#8B7CFF" opacity={shimmer} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#spGlow)" />
        {dots}
        <rect x={0} y={scanY - 80} width={3840} height={160} fill="rgba(139,124,255,0.03)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#spVignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 40], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 80 + rise, left: 200, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
        Watch a quarter&rsquo;s <span style={{color: VIOLET}}>pipeline</span> take shape
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        SALES PIPELINE &middot; LEAD TO CLOSED WON
      </div>
    </div>
  );
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

// ---------------------------------------------------------------------------
// Pipeline: 5 stage columns + flowing deal cards + conversion counters
// ---------------------------------------------------------------------------
const COL_W = 640;
const COL_GAP = 70;
const PIPE_X = 200;
const PIPE_Y = 470;
const COL_TOP = 640;

const Pipeline: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (PIPE_START - 30), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const colX = (i: number) => PIPE_X + i * (COL_W + COL_GAP);

  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      {/* connector rail */}
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <line x1={PIPE_X} y1={PIPE_Y} x2={PIPE_X + 5 * COL_W + 4 * COL_GAP} y2={PIPE_Y} stroke={HAIRLINE} strokeWidth={8} strokeLinecap="round" />
        {CONVERSIONS.map((c, i) => {
          const cf = interpolate(frame, [CONV_START + i * 40, CONV_START + i * 40 + 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const x0 = colX(i) + COL_W;
          const x1 = colX(i + 1);
          const conv = Math.round(c * cf);
          return (
            <g key={i} opacity={cf > 0 ? 1 : 0}>
              <line x1={x0} y1={PIPE_Y} x2={x0 + (x1 - x0) * cf} y2={PIPE_Y} stroke="url(#spFlow)" strokeWidth={8} strokeLinecap="round" filter="url(#spGlow14)" />
              <text x={(x0 + x1) / 2} y={PIPE_Y - 40} textAnchor="middle"
                fill={INK} fontSize={38} fontFamily={MONO} fontWeight={800}>
                {conv}%
              </text>
              <text x={(x0 + x1) / 2} y={PIPE_Y + 62} textAnchor="middle"
                fill={MUTED} fontSize={24} fontFamily={MONO} letterSpacing={2}>
                CONVERSION
              </text>
            </g>
          );
        })}
      </svg>

      {/* stage columns */}
      {STAGES.map((st, i) => {
        const cs = spring({frame: frame - (PIPE_START + i * 45), fps, config: {damping: 200, stiffness: 90}});
        if (cs <= 0.001) return null;
        const dealN = Math.round(interpolate(frame, [PIPE_START + 60 + i * 45, PIPE_START + 160 + i * 45], [0, st.deals], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
        const val = interpolate(frame, [PIPE_START + 60 + i * 45, PIPE_START + 160 + i * 45], [0, st.value], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <div key={st.name} style={{
            position: 'absolute', left: colX(i), top: COL_TOP, width: COL_W,
            opacity: Math.min(1, cs), transform: `translateY(${(1 - Math.min(1, cs)) * 60}px)`,
          }}>
            <div style={{
              background: PANEL, borderRadius: 26, padding: '34px 36px',
              border: `3px solid ${st.color}`, filter: 'url(#spShadow)',
              boxShadow: `0 0 50px ${st.color}33`,
            }}>
              <div style={{color: st.color, fontFamily: MONO, fontWeight: 800, fontSize: 36, letterSpacing: 3}}>
                {st.name}
              </div>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 10}}>
                <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 64}}>{dealN}</span>
                <span style={{color: MUTED, fontFamily: FONT, fontSize: 28}}>deals</span>
              </div>
              <div style={{color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 40, marginTop: 6}}>
                {fmt(val)}
              </div>
              <div style={{marginTop: 22}}>
                {Array.from({length: Math.min(5, Math.ceil(st.deals / 10))}, (_, r) => (
                  <div key={r} style={{
                    height: 14, borderRadius: 7, marginTop: r === 0 ? 0 : 10,
                    background: `linear-gradient(90deg, ${st.color}, ${st.color}55)`,
                    width: `${92 - r * 12}%`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* advancing deal cards */}
      {DEALS.map((d, i) => {
        const start = DEALS_START + i * 46;
        const end = Math.min(720, start + 200);
        const t = interpolate(frame, [start, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (t <= 0 || t >= 1) return null;
        const from = colX(0) + COL_W / 2;
        const to = colX(d.stage) + COL_W / 2;
        const x = from + (to - from) * t;
        const y = 1500 + Math.sin(t * Math.PI) * -90;
        const stalled = i === 5 && frame > start + 90;
        return (
          <div key={d.label} style={{
            position: 'absolute', left: x - 130, top: y,
            width: 260, borderRadius: 18, padding: '18px 22px',
            background: stalled ? 'rgba(255,176,32,0.14)' : PANEL,
            border: `2px solid ${stalled ? AMBER : STAGES[d.stage].color}`,
            boxShadow: stalled ? `0 0 34px rgba(255,176,32,${0.4 + 0.3 * Math.sin(frame * 0.3)})` : 'none',
            opacity: 1 - t * 0.15,
          }}>
            <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 28}}>{d.label}</div>
            <div style={{color: STAGES[d.stage].color, fontFamily: MONO, fontWeight: 700, fontSize: 30, marginTop: 6}}>
              {fmt(d.value)}
            </div>
            {stalled && (
              <div style={{color: AMBER, fontFamily: MONO, fontSize: 24, marginTop: 6, fontWeight: 800}}>
                STALLED · 9 DAYS
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Forecast rollup panel
// ---------------------------------------------------------------------------
const Forecast: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (FORECAST_START - 40), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const closed = interpolate(frame, [FORECAST_START, FORECAST_START + 110], [0, 84000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const target = 100000;
  const cov = closed / target;
  const R = 92;

  return (
    <div style={{
      position: 'absolute', left: 200, top: 1630, width: 3440,
      opacity: Math.min(1, s),
      transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 56,
        background: PANEL, borderRadius: 30, padding: '26px 54px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#spShadow)',
      }}>
        <svg width={250} height={250} viewBox="0 0 250 250">
          <circle cx={125} cy={125} r={R} fill="none" stroke="rgba(238,240,253,0.10)" strokeWidth={26} />
          <circle cx={125} cy={125} r={R} fill="none" stroke={GREEN} strokeWidth={26}
            strokeLinecap="round" pathLength={1} strokeDasharray={1}
            strokeDashoffset={1 - cov} transform="rotate(-90 125 125)" filter="url(#spGlow14)" />
          <text x={125} y={118} textAnchor="middle" fill={INK} fontSize={48} fontFamily={MONO} fontWeight={800}>
            {Math.round(cov * 100)}%
          </text>
          <text x={125} y={156} textAnchor="middle" fill={MUTED} fontSize={22} fontFamily={MONO}>OF TARGET</text>
        </svg>
        <div style={{flex: 1}}>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>QUARTER FORECAST</div>
          <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 78, marginTop: 4, textShadow: '0 0 30px rgba(52,211,153,0.4)'}}>
            {fmt(closed)}
          </div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 28, marginTop: 6}}>
            closed-won to date &middot; {fmt(target)} target &middot; weighted pipeline {fmt(312000)}
          </div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 38}}>&#9650; 12% QoQ</div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 26, marginTop: 8}}>velocity rising</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Resolve strip
// ---------------------------------------------------------------------------
const ResolveStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - RESOLVE_START, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 96, left: 0, width: 3840,
      display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{
        background: 'rgba(139,124,255,0.10)', border: `2px solid ${VIOLET}`,
        borderRadius: 999, padding: '28px 90px',
        display: 'flex', alignItems: 'center', gap: 44,
      }}>
        <span style={{
          width: 58, height: 58, borderRadius: '50%', background: VIOLET,
          color: '#0E1030', fontSize: 36, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#10003;</span>
        <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 48, letterSpacing: 2}}>
          EVERY STAGE HAS A CONVERSION RATE &middot; FIX THE WEAKEST LINK FIRST
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 420;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`sp-grain-x-${frame}-${i}`) * 3840;
    const y = random(`sp-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`sp-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`sp-grain-s-${frame}-${i}`) * 2.5;
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
export const SalesPipelineStages: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <Pipeline frame={frame} fps={fps} />
      <Forecast frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default SalesPipelineStages;
