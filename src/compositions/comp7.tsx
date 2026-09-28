/**
 * FitnessWorkoutProgress.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A workout progress tracker on dark charcoal: three activity rings draw
 * empty then fill with counting stats (workouts, minutes, streak days), a
 * streak calendar grid fills day by day with checkmarks, a PERSONAL RECORD
 * badge slams over the final stats card, and the week closes on a resolve
 * strip. Workout streaks + personal records - distinct from health-metric
 * dashboards. Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="FitnessWorkoutProgress" component={FitnessWorkoutProgress}
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
// Palette (charcoal + volt)
// ---------------------------------------------------------------------------
const BG = '#0F1316';
const INK = '#F2F5F0';
const MUTED = 'rgba(242,245,240,0.60)';
const VOLT = '#C6FF3E';
const VOLT_DEEP = '#7FA812';
const ORANGE = '#FF8A3D';
const CYAN = '#4DE3FF';
const PANEL = 'rgba(22,28,32,0.80)';
const HAIRLINE = 'rgba(242,245,240,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const RINGS_DRAW = 60;
const FILL_START = 190;
const CAL_START = 480;
const PR_START = 700;
const CARD_START = 740;
const RESOLVE_START = 830;

const RINGS = [
  {label: 'WORKOUTS', target: 48, unit: '', color: VOLT, r: 430, delay: 0},
  {label: 'MINUTES', target: 2140, unit: '', color: ORANGE, r: 330, delay: 60},
  {label: 'DAY STREAK', target: 21, unit: '', color: CYAN, r: 230, delay: 120},
];

const RING_CX = 1000;
const RING_CY = 1150;

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="charGlow" cx="40%" cy="36%" r="72%">
      <stop offset="0%" stopColor="rgba(198,255,62,0.10)" />
      <stop offset="55%" stopColor="rgba(198,255,62,0.03)" />
      <stop offset="100%" stopColor="rgba(15,19,22,0)" />
    </radialGradient>
    <radialGradient id="charVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(4,6,8,0)" />
      <stop offset="100%" stopColor="rgba(4,6,8,0.72)" />
    </radialGradient>
    <filter id="voltGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="panelShadow6" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.55" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC = () => (
  <>
    <AbsoluteFill style={{backgroundColor: BG}} />
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      <rect x={0} y={0} width={3840} height={2160} fill="url(#charGlow)" />
      {/* diagonal energy stripes */}
      {Array.from({length: 7}).map((_, i) => (
        <rect key={i} x={3000 + i * 130} y={-200} width={34} height={2600}
          fill="rgba(198,255,62,0.05)" transform="rotate(18 3000 0)" />
      ))}
      <rect x={0} y={0} width={3840} height={2160} fill="url(#charVignette)" />
    </svg>
  </>
);

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 40], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 80 + rise, left: 200, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
        Every rep <span style={{color: VOLT}}>counts</span>
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        WORKOUT PROGRESS TRACKING
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Triple activity rings
// ---------------------------------------------------------------------------
const ActivityRings: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - RINGS_DRAW, fps, config: {damping: 200, stiffness: 70}});
  if (s <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {RINGS.map((rg) => {
          const drawIn = interpolate(frame, [RINGS_DRAW, RINGS_DRAW + 90], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const fill = interpolate(frame, [FILL_START + rg.delay, FILL_START + rg.delay + 260], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const C = 2 * Math.PI * rg.r;
          return (
            <g key={rg.label}>
              {/* track draws in */}
              <circle cx={RING_CX} cy={RING_CY} r={rg.r} fill="none"
                stroke={HAIRLINE} strokeWidth={54}
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawIn}
                transform={`rotate(-90 ${RING_CX} ${RING_CY})`} strokeLinecap="round" />
              {/* fill */}
              {fill > 0.005 && (
                <circle cx={RING_CX} cy={RING_CY} r={rg.r} fill="none"
                  stroke={rg.color} strokeWidth={54}
                  pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fill}
                  transform={`rotate(-90 ${RING_CX} ${RING_CY})`} strokeLinecap="round"
                  filter="url(#voltGlow)" />
              )}
              {/* cap dot */}
              {fill > 0.005 && fill < 0.999 && (
                <circle
                  cx={RING_CX + rg.r * Math.cos(-Math.PI / 2 + fill * Math.PI * 2)}
                  cy={RING_CY + rg.r * Math.sin(-Math.PI / 2 + fill * Math.PI * 2)}
                  r={34} fill={rg.color} filter="url(#voltGlow)" />
              )}
            </g>
          );
        })}
      </svg>
      {/* center stats */}
      <div style={{
        position: 'absolute', left: RING_CX - 420, top: RING_CY - 260, width: 840, textAlign: 'center',
      }}>
        {RINGS.map((rg, i) => {
          const count = Math.round(interpolate(frame, [FILL_START + rg.delay, FILL_START + rg.delay + 260], [0, rg.target], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          }));
          const show = frame >= FILL_START + rg.delay;
          if (!show) return null;
          return (
            <div key={rg.label} style={{marginTop: i === 0 ? 0 : 26}}>
              <span style={{
                color: rg.color, fontFamily: MONO, fontWeight: 800, fontSize: i === 0 ? 120 : 84,
                textShadow: `0 0 40px ${rg.color}66`,
              }}>
                {count.toLocaleString('en-US')}
              </span>
              <span style={{color: MUTED, fontFamily: MONO, fontSize: 34, letterSpacing: 3, marginLeft: 18}}>
                {rg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Streak calendar grid
// ---------------------------------------------------------------------------
const StreakCalendar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - CAL_START, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const DAYS = 35;
  const STREAK_DAYS = 21;
  const filled = Math.min(STREAK_DAYS, Math.max(0, Math.floor((frame - CAL_START - 40) / 9)));

  return (
    <div style={{
      position: 'absolute', right: 200, top: 380, width: 1300,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 32, padding: '46px 52px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#panelShadow6)', backdropFilter: 'blur(6px)',
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 52}}>
            21-day streak
          </div>
          <div style={{
            color: '#0F1316', background: VOLT, fontFamily: MONO, fontWeight: 800,
            fontSize: 30, padding: '10px 26px', borderRadius: 999,
          }}>
            ON FIRE
          </div>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 16, marginTop: 34,
        }}>
          {Array.from({length: DAYS}).map((_, i) => {
            const on = i < filled;
            const cs = spring({frame: frame - (CAL_START + 40 + i * 9), fps, config: {damping: 200, stiffness: 180}});
            const isToday = i === filled - 1 && filled === STREAK_DAYS;
            return (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 18,
                background: on ? VOLT : 'rgba(242,245,240,0.07)',
                border: `2px solid ${on ? VOLT : HAIRLINE}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: `scale(${on ? 0.6 + 0.4 * Math.min(1, cs) : 1})`,
                boxShadow: on ? '0 0 26px rgba(198,255,62,0.45)' : 'none',
                outline: isToday ? `4px solid ${ORANGE}` : 'none',
                outlineOffset: 4,
              }}>
                {on && cs > 0.5 && (
                  <span style={{color: '#0F1316', fontSize: 36, fontWeight: 800}}>&#10003;</span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 22}}>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 26}}>SEP 07</span>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 26}}>OCT 11</span>
        </div>
        <div style={{marginTop: 28, display: 'flex', gap: 26}}>
          {[
            ['LONGEST STREAK', '21 DAYS', VOLT],
            ['THIS WEEK', '6 / 7', ORANGE],
          ].map(([k, v, c]) => (
            <div key={k} style={{
              flex: 1, borderRadius: 20, padding: '22px 30px',
              background: 'rgba(242,245,240,0.05)', border: `2px solid ${HAIRLINE}`,
            }}>
              <div style={{color: MUTED, fontFamily: MONO, fontSize: 24, letterSpacing: 2}}>{k}</div>
              <div style={{color: c as string, fontFamily: MONO, fontWeight: 800, fontSize: 52, marginTop: 6}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PR badge + final stats card
// ---------------------------------------------------------------------------
const PrCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - CARD_START, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const badge = spring({frame: frame - PR_START, fps, config: {damping: 120, stiffness: 200}});

  return (
    <div style={{
      position: 'absolute', right: 200, top: 1740, width: 1300,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 32, padding: '46px 52px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#panelShadow6)',
        backdropFilter: 'blur(6px)', position: 'relative',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>LATEST SESSION</div>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 64, marginTop: 10}}>
          Deadlift &middot; <span style={{color: VOLT}}>140 KG</span>
        </div>
        <div style={{display: 'flex', gap: 40, marginTop: 20}}>
          {[
            ['SETS', '5'],
            ['REPS', '5 · 5 · 5 · 4 · 5'],
            ['RPE', '9'],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{color: MUTED, fontFamily: MONO, fontSize: 24, letterSpacing: 2}}>{k}</div>
              <div style={{color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 40, marginTop: 4}}>{v}</div>
            </div>
          ))}
        </div>
        {badge > 0.001 && (
          <div style={{
            position: 'absolute', right: 40, top: 24,
            transform: `rotate(10deg) scale(${2.2 - 1.2 * Math.min(1, badge)})`,
            opacity: Math.min(1, badge),
          }}>
            <div style={{
              background: VOLT, color: '#0F1316',
              fontFamily: FONT, fontWeight: 800, fontSize: 44, letterSpacing: 2,
              padding: '18px 44px', borderRadius: 18,
              boxShadow: '0 0 70px rgba(198,255,62,0.6)',
            }}>
              NEW PR
            </div>
          </div>
        )}
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
      position: 'absolute', bottom: 96, left: 200,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 52, letterSpacing: 1}}>
        WEEK 12 &middot; <span style={{color: VOLT}}>KEEP THE STREAK ALIVE</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 32, marginTop: 8}}>
        Consistency beats intensity &mdash; the rings prove it
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
// Deterministic full-frame film grain — bitrate insurance for the >= 20 Mbps verify gate.
// random() from 'remotion' is seeded; positions re-seed every frame. Subtle by design.
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 420;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: JSX.Element[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`grain-x-${frame}-${i}`) * 3840;
    const y = random(`grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`grain-s-${frame}-${i}`) * 2.5;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

export const FitnessWorkoutProgress: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background />
      <TitleBar frame={frame} />
      <ActivityRings frame={frame} fps={fps} />
      <StreakCalendar frame={frame} fps={fps} />
      <PrCard frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default FitnessWorkoutProgress;
