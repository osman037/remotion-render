/**
 * SavingsGoalTracker.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A savings goal tracker on deep navy: an empty progress ring ($0 of $5,000)
 * fills as coins drop in rhythm, milestone badges pop at 25/50/75%, the ring
 * completes with a counting total, a goal shield materializes, a GOAL
 * REACHED banner lands, and a recurring-deposit calendar strip shows the
 * habit behind the number. Ring + milestones arc - not a piggy-bank fill.
 * Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="SavingsGoalTracker" component={SavingsGoalTracker}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Palette (deep navy + mint)
// ---------------------------------------------------------------------------
const BG = '#0A1730';
const INK = '#EAF0FA';
const MUTED = 'rgba(234,240,250,0.60)';
const MINT = '#00E6A8';
const MINT_DEEP = '#009E73';
const GOLD = '#F5C044';
const GOLD_DEEP = '#B97F1B';
const PANEL = 'rgba(16,30,58,0.78)';
const HAIRLINE = 'rgba(234,240,250,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Goal math
// ---------------------------------------------------------------------------
const GOAL = 5000;
const MILESTONES = [
  {pct: 0.25, label: 'QUARTER WAY', amount: 1250},
  {pct: 0.5, label: 'HALFWAY THERE', amount: 2500},
  {pct: 0.75, label: 'ALMOST THERE', amount: 3750},
];

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const RING_START = 60;
const FILL_START = 150;
const FILL_END = 620;
const TOTAL_START = 620;
const SHIELD_START = 660;
const BANNER_START = 720;
const CAL_START = 200;
const CAL_FILL_END = 700;
const RESOLVE_START = 800;

const fmt$ = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="navyGlow" cx="42%" cy="36%" r="72%">
      <stop offset="0%" stopColor="rgba(0,230,168,0.12)" />
      <stop offset="55%" stopColor="rgba(0,230,168,0.04)" />
      <stop offset="100%" stopColor="rgba(10,23,48,0)" />
    </radialGradient>
    <radialGradient id="navyVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(3,8,20,0)" />
      <stop offset="100%" stopColor="rgba(3,8,20,0.72)" />
    </radialGradient>
    <linearGradient id="mintRing" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={MINT_DEEP} />
      <stop offset="100%" stopColor={MINT} />
    </linearGradient>
    <linearGradient id="coinGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={'#FFE9A8'} />
      <stop offset="55%" stopColor={GOLD} />
      <stop offset="100%" stopColor={GOLD_DEEP} />
    </linearGradient>
    <filter id="mintGlow2" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="panelShadow5" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.5" />
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
      <rect x={0} y={0} width={3840} height={2160} fill="url(#navyGlow)" />
      <rect x={0} y={0} width={3840} height={2160} fill="url(#navyVignette)" />
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
        Watch your <span style={{color: MINT}}>savings grow</span>
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        GOAL TRACKER &middot; EMERGENCY FUND
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The big progress ring with falling coins + milestone badges
// ---------------------------------------------------------------------------
const RING_CX = 1050;
const RING_CY = 1180;
const RING_R = 400;

const ProgressRing: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - RING_START, fps, config: {damping: 200, stiffness: 70}});
  if (s <= 0.001) return null;

  const fill = interpolate(frame, [FILL_START, FILL_END], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const saved = fill * GOAL;

  const coins = useMemo(() => {
    const out: {seed: number; x: number; delay: number}[] = [];
    for (let i = 0; i < 46; i++) {
      out.push({seed: i * 2.3, x: RING_CX - 260 + rand(i * 5.1) * 520, delay: i * 10});
    }
    return out;
  }, []);

  const C = 2 * Math.PI * RING_R;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {/* falling coins */}
        {frame >= FILL_START && frame <= FILL_END + 40 && coins.map((c, i) => {
          const local = frame - (FILL_START + c.delay);
          if (local < 0) return null;
          const t = (local % 70) / 70;
          const y = 240 + t * 760;
          const fadeCoin = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
          return (
            <g key={i} opacity={0.9 * fadeCoin}>
              <circle cx={c.x} cy={y} r={30} fill="url(#coinGold)" filter="url(#mintGlow2)" opacity={0.5} />
              <circle cx={c.x} cy={y} r={24} fill="url(#coinGold)" stroke={GOLD_DEEP} strokeWidth={4} />
              <text x={c.x} y={y + 12} textAnchor="middle" fill={GOLD_DEEP} fontSize={34} fontFamily={MONO} fontWeight={800}>$</text>
            </g>
          );
        })}
        {/* track */}
        <circle cx={RING_CX} cy={RING_CY} r={RING_R} fill="none" stroke={HAIRLINE} strokeWidth={64} />
        {/* progress */}
        {fill > 0.005 && (
          <circle cx={RING_CX} cy={RING_CY} r={RING_R} fill="none"
            stroke="url(#mintRing)" strokeWidth={64} strokeLinecap="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fill}
            transform={`rotate(-90 ${RING_CX} ${RING_CY})`}
            filter="url(#mintGlow2)" />
        )}
        {/* tick marks */}
        {Array.from({length: 40}).map((_, i) => {
          const a = (i / 40) * Math.PI * 2 - Math.PI / 2;
          const on = i / 40 <= fill;
          return (
            <line key={i}
              x1={RING_CX + (RING_R - 52) * Math.cos(a)} y1={RING_CY + (RING_R - 52) * Math.sin(a)}
              x2={RING_CX + (RING_R - 78) * Math.cos(a)} y2={RING_CY + (RING_R - 78) * Math.sin(a)}
              stroke={on ? MINT : 'rgba(234,240,250,0.18)'} strokeWidth={7} strokeLinecap="round" />
          );
        })}
      </svg>
      {/* center readout */}
      <div style={{
        position: 'absolute', left: RING_CX - 330, top: RING_CY - 190, width: 660, textAlign: 'center',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 4}}>SAVED SO FAR</div>
        <div style={{
          color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 130, marginTop: 6,
          textShadow: '0 0 44px rgba(0,230,168,0.4)',
        }}>
          {fmt$(saved)}
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 36, marginTop: 6}}>
          of {fmt$(GOAL)} goal
        </div>
        <div style={{color: MINT, fontFamily: MONO, fontWeight: 800, fontSize: 52, marginTop: 14}}>
          {Math.round(fill * 100)}%
        </div>
      </div>
      {/* milestone badges */}
      {MILESTONES.map((m, i) => {
        const hit = fill >= m.pct;
        const bs = spring({frame: frame - (FILL_START + m.pct * (FILL_END - FILL_START)), fps, config: {damping: 150, stiffness: 170}});
        if (!hit || bs <= 0.001) return null;
        const a = -Math.PI / 2 + m.pct * Math.PI * 2;
        const bx = RING_CX + (RING_R + 150) * Math.cos(a);
        const by = RING_CY + (RING_R + 150) * Math.sin(a);
        return (
          <div key={m.label} style={{
            position: 'absolute', left: bx - 190, top: by - 70, width: 380,
            opacity: Math.min(1, bs),
            transform: `scale(${0.5 + 0.5 * Math.min(1, bs)})`,
          }}>
            <div style={{
              background: 'rgba(10,23,48,0.92)', border: `3px solid ${GOLD}`,
              borderRadius: 20, padding: '16px 20px', textAlign: 'center',
              boxShadow: '0 0 44px rgba(245,192,68,0.4)',
            }}>
              <div style={{color: GOLD, fontFamily: FONT, fontWeight: 800, fontSize: 34}}>{m.label}</div>
              <div style={{color: INK, fontFamily: MONO, fontWeight: 700, fontSize: 40, marginTop: 4}}>{fmt$(m.amount)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Goal shield + GOAL REACHED banner
// ---------------------------------------------------------------------------
const GoalPayoff: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const total = interpolate(frame, [TOTAL_START, TOTAL_START + 90], [0, GOAL], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const shield = spring({frame: frame - SHIELD_START, fps, config: {damping: 140, stiffness: 150}});
  const banner = spring({frame: frame - BANNER_START, fps, config: {damping: 200, stiffness: 110}});
  if (frame < TOTAL_START) return null;

  return (
    <div style={{position: 'absolute', left: 0, top: 0}}>
      {/* counting total above ring */}
      <div style={{
        position: 'absolute', left: RING_CX - 400, top: 300, width: 800, textAlign: 'center',
        opacity: interpolate(frame, [TOTAL_START, TOTAL_START + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>FINAL TOTAL</div>
        <div style={{
          color: MINT, fontFamily: MONO, fontWeight: 800, fontSize: 110,
          textShadow: '0 0 60px rgba(0,230,168,0.65)',
        }}>
          {fmt$(total)}
        </div>
      </div>
      {/* shield */}
      {shield > 0.001 && (
        <div style={{
          position: 'absolute', left: RING_CX - 130, top: RING_CY - 640,
          transform: `scale(${0.4 + 0.6 * Math.min(1, shield)})`,
          opacity: Math.min(1, shield),
        }}>
          <svg width={260} height={300} viewBox="0 0 260 300">
            <path d="M130 12 L238 56 V158 C238 226 190 262 130 288 C70 262 22 226 22 158 V56 Z"
              fill="rgba(0,230,168,0.14)" stroke={MINT} strokeWidth={10} filter="url(#mintGlow2)" />
            <path d="M92 148 L120 178 L172 116" fill="none" stroke={MINT} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {/* banner */}
      {banner > 0.001 && (
        <div style={{
          position: 'absolute', left: 0, top: 1780, width: 3840,
          display: 'flex', justifyContent: 'center',
          opacity: Math.min(1, banner),
          transform: `translateY(${(1 - Math.min(1, banner)) * 60}px)`,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #009E73, #00E6A8)', borderRadius: 999, padding: '30px 110px',
            boxShadow: '0 0 90px rgba(0,230,168,0.55)',
          }}>
            <span style={{color: '#06231D', fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 3}}>
              GOAL REACHED
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Recurring deposit calendar strip (the habit)
// ---------------------------------------------------------------------------
const DepositCalendar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - CAL_START, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const WEEKS = 12;
  const filled = Math.min(WEEKS, Math.max(0, Math.floor((frame - CAL_START - 60) / ((CAL_FILL_END - CAL_START) / WEEKS))));

  return (
    <div style={{
      position: 'absolute', right: 200, top: 380, width: 1240,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 32, padding: '46px 52px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#panelShadow5)', backdropFilter: 'blur(6px)',
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 52}}>
            The habit behind it
          </div>
          <div style={{color: MINT, fontFamily: MONO, fontWeight: 700, fontSize: 34}}>
            AUTO-DEPOSIT
          </div>
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 32, marginTop: 10}}>
          $200 every Friday &middot; 12 weeks straight
        </div>
        <div style={{display: 'flex', gap: 14, marginTop: 34}}>
          {Array.from({length: WEEKS}).map((_, i) => {
            const on = i < filled;
            const cs = spring({frame: frame - (CAL_START + 60 + i * ((CAL_FILL_END - CAL_START) / WEEKS)), fps, config: {damping: 200, stiffness: 170}});
            return (
              <div key={i} style={{
                flex: 1, height: 120, borderRadius: 16,
                background: on ? 'url(#mintRing)' : 'rgba(234,240,250,0.07)',
                border: `2px solid ${on ? MINT : HAIRLINE}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: `scale(${on ? 0.7 + 0.3 * Math.min(1, cs) : 1})`,
                boxShadow: on ? '0 0 26px rgba(0,230,168,0.4)' : 'none',
              }}>
                {on && cs > 0.6 && (
                  <span style={{color: '#06231D', fontSize: 40, fontWeight: 800}}>&#10003;</span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 20}}>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 26}}>WEEK 1</span>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 26}}>WEEK 12</span>
        </div>
        <div style={{marginTop: 30, padding: '24px 30px', borderRadius: 20, background: 'rgba(0,230,168,0.08)', border: `2px solid rgba(0,230,168,0.3)`}}>
          <div style={{color: INK, fontFamily: FONT, fontSize: 32}}>
            <span style={{fontWeight: 800, color: MINT}}>$2,400</span> saved on autopilot this quarter
          </div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 28, marginTop: 6}}>
            small, automatic, unstoppable
          </div>
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
      position: 'absolute', bottom: 96, right: 200,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{textAlign: 'right'}}>
        <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 52}}>
          12 WEEKS OF CONSISTENCY
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 32, marginTop: 8}}>
          Emergency fund complete &middot; next goal: travel fund
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const SavingsGoalTracker: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background />
      <TitleBar frame={frame} />
      <ProgressRing frame={frame} fps={fps} />
      <DepositCalendar frame={frame} fps={fps} />
      <GoalPayoff frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default SavingsGoalTracker;
