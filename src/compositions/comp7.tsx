/**
 * CrowdfundingMilestoneTracker.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A campaign story on deep plum: the funding bar climbs past the goal line,
 * stretch-goal flags unlock with glow bursts, the backer ticker races upward,
 * reward tiers stack, and the pledge-manager phase timeline lands.
 * Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="CrowdfundingMilestoneTracker" component={CrowdfundingMilestoneTracker}
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
// Palette (deep plum + magenta campaign)
// ---------------------------------------------------------------------------
const BG = '#1E0A22';
const INK = '#F8EEFB';
const MUTED = 'rgba(248,238,251,0.60)';
const MAGENTA = '#F04FC4';
const MAGENTA_DEEP = '#9C1F7E';
const GOLD = '#F5C044';
const GREEN = '#34D399';
const CYAN = '#5EEAD4';
const PANEL = 'rgba(48,18,54,0.82)';
const HAIRLINE = 'rgba(248,238,251,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const BAR_START = 60;
const GOAL_LINE = 100000;
const FUND_END = 520;
const STRETCH_START = 380;
const TIERS_START = 480;
const FULFILL_START = 660;
const RESOLVE_START = 810;

const STRETCH_GOALS = [
  {at: 150000, label: 'STRETCH 1 · APP COMPANION'},
  {at: 250000, label: 'STRETCH 2 · PREMIUM CASE'},
  {at: 400000, label: 'STRETCH 3 · WIRELESS DOCK'},
];

const TIERS = [
  {name: 'EARLY BIRD', price: 79, backers: 1240, color: CYAN},
  {name: 'STANDARD', price: 99, backers: 2860, color: MAGENTA},
  {name: 'FOUNDER', price: 149, backers: 480, color: GOLD},
];

const PHASES = ['LIVE', 'STRETCH GOALS', 'LATE PLEDGES', 'FULFILLMENT'];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="cmGlow" cx="50%" cy="30%" r="72%">
      <stop offset="0%" stopColor="rgba(240,79,196,0.13)" />
      <stop offset="55%" stopColor="rgba(240,79,196,0.035)" />
      <stop offset="100%" stopColor="rgba(30,10,34,0)" />
    </radialGradient>
    <radialGradient id="cmVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(14,4,18,0)" />
      <stop offset="100%" stopColor="rgba(14,4,18,0.72)" />
    </radialGradient>
    <linearGradient id="cmBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={MAGENTA_DEEP} />
      <stop offset="60%" stopColor={MAGENTA} />
      <stop offset="100%" stopColor={GOLD} />
    </linearGradient>
    <filter id="cmGlow14" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="cmShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.55" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const driftX = (frame * 0.32) % 120;
  const scanY = ((frame / 900) * (2160 + 300)) % (2160 + 300) - 150;
  const dots: React.ReactElement[] = [];
  for (let gx = 0; gx <= 33; gx++) {
    for (let gy = 0; gy <= 19; gy++) {
      const shimmer = 0.05 + 0.05 * Math.sin(frame * 0.085 + gx * 0.8 + gy * 1.2);
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx * 120 - driftX} cy={gy * 120} r={2.2} fill="#F04FC4" opacity={shimmer} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#cmGlow)" />
        {dots}
        <rect x={0} y={scanY - 80} width={3840} height={160} fill="rgba(240,79,196,0.03)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#cmVignette)" />
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
        The <span style={{color: MAGENTA}}>48-hour</span> that funded a company
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        CROWDFUNDING CAMPAIGN &middot; AURORA LAMP MK II
      </div>
    </div>
  );
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`);

// ---------------------------------------------------------------------------
// Funding bar with goal line + stretch-goal flags
// ---------------------------------------------------------------------------
const BAR_X = 200;
const BAR_W = 2160;
const BAR_Y = 700;
const BAR_H = 120;
const MAX_FUND = 500000;

const FundingBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (BAR_START - 30), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const funded = interpolate(frame, [BAR_START, FUND_END], [0, 462000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => 1 - Math.pow(1 - t, 2)});
  const goalX = BAR_X + (GOAL_LINE / MAX_FUND) * BAR_W;
  const barW = (funded / MAX_FUND) * BAR_W;
  const goalHit = funded >= GOAL_LINE;
  const pct = Math.round((funded / GOAL_LINE) * 100);
  const backers = Math.round(interpolate(frame, [BAR_START, FUND_END], [0, 4580], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <div style={{position: 'absolute', left: BAR_X, top: 440, width: BAR_W}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>FUNDING PROGRESS</span>
          <span style={{color: goalHit ? GREEN : MAGENTA, fontFamily: MONO, fontWeight: 800, fontSize: 44}}>
            {pct}% OF {fmt(GOAL_LINE)}
          </span>
        </div>
        <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 120, marginTop: 6, textShadow: '0 0 40px rgba(240,79,196,0.45)'}}>
          {fmt(funded)}
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, marginTop: 4}}>
          <span style={{color: INK, fontWeight: 800}}>{backers.toLocaleString('en-US')}</span> backers
        </div>
      </div>

      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <rect x={BAR_X} y={BAR_Y} width={BAR_W} height={BAR_H} rx={60}
          fill="rgba(248,238,251,0.07)" stroke={HAIRLINE} strokeWidth={3} />
        <rect x={BAR_X} y={BAR_Y} width={Math.max(1, barW)} height={BAR_H} rx={60}
          fill="url(#cmBar)" filter="url(#cmGlow14)" />
        {/* goal line */}
        <line x1={goalX} y1={BAR_Y - 60} x2={goalX} y2={BAR_Y + BAR_H + 60} stroke={GREEN} strokeWidth={5} strokeDasharray="16 14" />
        <text x={goalX} y={BAR_Y - 84} textAnchor="middle" fill={GREEN} fontSize={32} fontFamily={MONO} fontWeight={800} letterSpacing={2}>
          GOAL {fmt(GOAL_LINE)}
        </text>
        {goalHit && (
          <text x={goalX + 30} y={BAR_Y + BAR_H + 116} fill={GREEN} fontSize={30} fontFamily={MONO} fontWeight={800}>
            FUNDED IN 11 HOURS
          </text>
        )}
        {/* stretch goal flags */}
        {STRETCH_GOALS.map((g, i) => {
          const gx = BAR_X + (g.at / MAX_FUND) * BAR_W;
          const unlocked = funded >= g.at;
          const bs = spring({frame: frame - (STRETCH_START + i * 70), fps, config: {damping: 140, stiffness: 160}});
          if (bs <= 0.001) return null;
          return (
            <g key={g.label} transform={`translate(${gx}, ${BAR_Y - 130})`} opacity={Math.min(1, bs)}>
              <line x1={0} y1={0} x2={0} y2={130} stroke={unlocked ? GOLD : HAIRLINE} strokeWidth={5} />
              <g transform={`scale(${0.6 + 0.4 * Math.min(1, bs)})`}>
                <path d="M 0 -56 L 120 -56 L 120 0 L 0 0 Z" fill={unlocked ? GOLD : 'rgba(248,238,251,0.12)'} />
                <path d="M 120 -56 L 88 -28 L 120 0" fill={unlocked ? '#B07E1E' : 'rgba(248,238,251,0.06)'} />
                <circle cx={-26} cy={-28} r={30 + (unlocked ? 8 * Math.sin(frame * 0.2) : 0)}
                  fill="none" stroke={unlocked ? GOLD : HAIRLINE} strokeWidth={4} />
              </g>
              <text x={-10} y={170} fill={unlocked ? GOLD : MUTED} fontSize={26} fontFamily={MONO} fontWeight={800}>
                {g.label}
              </text>
              <text x={-10} y={204} fill={unlocked ? INK : MUTED} fontSize={30} fontFamily={MONO} fontWeight={700}>
                {fmt(g.at)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Reward tiers (right column) + fulfillment phase timeline (bottom)
// ---------------------------------------------------------------------------
const TiersPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (TIERS_START - 40), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: 2560, top: 440, width: 1080,
      opacity: Math.min(1, s), transform: `translateX(${(1 - s) * 80}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3, marginBottom: 26}}>
        REWARD TIERS
      </div>
      {TIERS.map((t, i) => {
        const ts = spring({frame: frame - (TIERS_START + i * 55), fps, config: {damping: 200, stiffness: 120}});
        if (ts <= 0.001) return null;
        const claimed = Math.round(interpolate(frame, [TIERS_START + i * 55, TIERS_START + i * 55 + 130], [0, t.backers], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
        return (
          <div key={t.name} style={{
            marginTop: i === 0 ? 0 : 22, background: PANEL,
            border: `3px solid ${t.color}`, borderRadius: 24, padding: '30px 40px',
            filter: 'url(#cmShadow)',
            opacity: Math.min(1, ts), transform: `translateX(${(1 - Math.min(1, ts)) * 60}px)`,
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
              <span style={{color: t.color, fontFamily: MONO, fontWeight: 800, fontSize: 38, letterSpacing: 2}}>
                {t.name}
              </span>
              <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 56}}>
                ${t.price}
              </span>
            </div>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, marginTop: 8}}>
              <span style={{color: INK, fontWeight: 800}}>{claimed.toLocaleString('en-US')}</span> backers claimed
            </div>
            <div style={{height: 16, borderRadius: 8, background: 'rgba(248,238,251,0.08)', marginTop: 16, overflow: 'hidden'}}>
              <div style={{height: '100%', width: `${(claimed / t.backers) * 100}%`, borderRadius: 8, background: t.color}} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Fulfillment: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (FULFILL_START - 40), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const x0 = 200; const w = 3440;
  return (
    <div style={{
      position: 'absolute', left: x0, top: 1620, width: w,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3, marginBottom: 22}}>
        AFTER THE CAMPAIGN
      </div>
      <div style={{position: 'relative', height: 130}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 40, height: 8, borderRadius: 4, background: HAIRLINE}} />
        {PHASES.map((p, i) => {
          const ps = spring({frame: frame - (FULFILL_START + i * 55), fps, config: {damping: 200, stiffness: 130}});
          if (ps <= 0.001) return null;
          const x = (i / (PHASES.length - 1)) * w;
          return (
            <div key={p} style={{
              position: 'absolute', left: x - 14, top: 0,
              opacity: Math.min(1, ps),
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: GREEN, border: `5px solid ${BG}`,
                boxShadow: '0 0 24px rgba(52,211,153,0.6)',
              }} />
              <div style={{
                position: 'absolute', top: 66, left: -160, width: 360, textAlign: 'center',
                color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 32, letterSpacing: 1,
              }}>
                {p}
              </div>
            </div>
          );
        })}
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
        background: 'rgba(240,79,196,0.10)', border: `2px solid ${MAGENTA}`,
        borderRadius: 999, padding: '28px 90px',
        display: 'flex', alignItems: 'center', gap: 44,
      }}>
        <span style={{
          width: 58, height: 58, borderRadius: '50%', background: MAGENTA,
          color: '#1E0A22', fontSize: 36, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#10003;</span>
        <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 48, letterSpacing: 2}}>
          4,580 BACKERS &middot; 462% FUNDED &middot; STRETCH GOALS UNLOCKED
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
    const x = random(`cm-grain-x-${frame}-${i}`) * 3840;
    const y = random(`cm-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`cm-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`cm-grain-s-${frame}-${i}`) * 2.5;
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
export const CrowdfundingMilestoneTracker: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <FundingBar frame={frame} fps={fps} />
      <TiersPanel frame={frame} fps={fps} />
      <Fulfillment frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default CrowdfundingMilestoneTracker;
