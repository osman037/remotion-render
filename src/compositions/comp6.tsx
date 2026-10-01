/**
 * PetAdoptionJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A warm, brand-neutral shelter-network visual for animal-welfare marketers,
 * shelter decks and nonprofit storytelling: a featured adoption journey arcs
 * through five paw-print checkpoints (browse -> application -> meet & greet ->
 * home check -> welcome home) along a glowing connector that lights each
 * stage green as it advances, with live shelter-network counters, drifting
 * paw confetti, and a "FOUND HOME" payoff stamp in the final two seconds.
 * Deterministic seeded randomness only.
 *
 * Register in Root.tsx:
 *   <Composition id="PetAdoptionJourney" component={PetAdoptionJourney}
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
// Palette (warm hearth: deep cocoa bg, amber/coral warmth, adoption green)
// ---------------------------------------------------------------------------
const BG = '#130B07';
const INK = '#FFF6E9';
const MUTED = 'rgba(255,246,233,0.60)';
const FAINT = 'rgba(255,246,233,0.32)';
const AMBER = '#FFB454';
const CORAL = '#FF7A59';
const CREAM = '#FFE8C8';
const GREEN = '#3DDC84';
const GREEN_DEEP = '#0E3B24';
const PANEL = 'rgba(30,18,10,0.90)';
const HAIRLINE = 'rgba(255,246,233,0.15)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const STAGE_HIT = [150, 280, 410, 540, 670]; // frame each checkpoint lights up
const TRACK_START = 150;
const TRACK_END = 700;
const STRIP_START = 660;   // bottom live-stats strip
const PAYOFF_START = 786;  // dim overlay begins
const STAMP_START = 800;   // FOUND HOME stamp

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
const NODE_Y = 1050;
const NODE_X = (i: number) => 320 + i * 800;
const TRACK_X0 = 320;
const TRACK_X1 = 3520;
const NODE_R = 150;

// ---------------------------------------------------------------------------
// Data: the five checkpoints
// ---------------------------------------------------------------------------
interface Stage {
  label: string;
  day: string;
  stat: string;
  sub: string;
}
const STAGES: Stage[] = [
  {label: 'BROWSE', day: 'DAY 0', stat: '142 profiles viewed', sub: 'filter: good with kids'},
  {label: 'APPLICATION', day: 'DAY 2', stat: 'Application #A-2214', sub: 'approved in 48 hours'},
  {label: 'MEET & GREET', day: 'DAY 5', stat: '3 visits · 47 tail wags', sub: 'an instant bond'},
  {label: 'HOME CHECK', day: 'DAY 9', stat: 'Fenced yard · vet on file', sub: 'passed first visit'},
  {label: 'WELCOME HOME', day: 'DAY 12', stat: 'New name: BUDDY', sub: '2 yrs · lab mix'},
];

// ---------------------------------------------------------------------------
// Paw-print icon (pad + four toes), drawn around origin in a 60x60 box
// ---------------------------------------------------------------------------
const PawPrint: React.FC<{size: number; color: string; opacity?: number}> = ({
  size,
  color,
  opacity = 1,
}) => (
  <svg width={size} height={size} viewBox="-30 -26 60 60" style={{display: 'block'}}>
    <ellipse cx={0} cy={13} rx={15.5} ry={12} fill={color} opacity={opacity} />
    <circle cx={-19} cy={-6} r={6.8} fill={color} opacity={opacity} />
    <circle cx={-6.5} cy={-14} r={6.8} fill={color} opacity={opacity} />
    <circle cx={6.5} cy={-14} r={6.8} fill={color} opacity={opacity} />
    <circle cx={19} cy={-6} r={6.8} fill={color} opacity={opacity} />
  </svg>
);

// ---------------------------------------------------------------------------
// SVG defs (gradients / filters)
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="pjGlow" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stopColor="rgba(255,180,84,0.13)" />
      <stop offset="50%" stopColor="rgba(255,122,89,0.05)" />
      <stop offset="100%" stopColor="rgba(19,11,7,0)" />
    </radialGradient>
    <radialGradient id="pjVignette" cx="50%" cy="50%" r="76%">
      <stop offset="58%" stopColor="rgba(10,6,3,0)" />
      <stop offset="100%" stopColor="rgba(8,4,2,0.78)" />
    </radialGradient>
    <linearGradient id="pjScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(255,180,84,0)" />
      <stop offset="50%" stopColor="rgba(255,180,84,0.14)" />
      <stop offset="100%" stopColor="rgba(255,180,84,0)" />
    </linearGradient>
    <linearGradient id="pjTrack" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={AMBER} />
      <stop offset="55%" stopColor={CORAL} />
      <stop offset="100%" stopColor={GREEN} />
    </linearGradient>
    <linearGradient id="pjBar" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stopColor="rgba(255,180,84,0.45)" />
      <stop offset="100%" stopColor={AMBER} />
    </linearGradient>
    <filter id="pjBlur90" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="90" />
    </filter>
    <filter id="pjSoft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="10" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: warm glow, drifting ember orbs, fine dot grid, scan sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const drift1 = Math.sin((frame / 900) * Math.PI * 2) * 110;
  const drift2 = Math.cos((frame / 900) * Math.PI * 2) * 80;
  const scanY = (frame / 900) * 2400 - 240;
  const orbs: React.ReactElement[] = [];
  const orbHues = ['rgba(255,180,84,0.10)', 'rgba(255,122,89,0.08)', 'rgba(61,220,132,0.05)'];
  for (let i = 0; i < 6; i++) {
    const ox = random(`pj-orb-x-${i}`) * 3840;
    const oy = random(`pj-orb-y-${i}`) * 2160;
    const r = 300 + random(`pj-orb-r-${i}`) * 340;
    const mx = Math.sin((frame / 900) * Math.PI * 2 + i * 1.9) * 140;
    const my = Math.cos((frame / 900) * Math.PI * 2 + i * 2.6) * 100;
    orbs.push(
      <circle key={i} cx={ox + mx} cy={oy + my} r={r} fill={orbHues[i % 3]} filter="url(#pjBlur90)" />
    );
  }
  // Fine drifting dot grid (high-frequency texture for the render gate)
  const dots: React.ReactElement[] = [];
  const gridShift = Math.sin((frame / 900) * Math.PI * 2) * 24;
  for (let gx = 60; gx < 3840; gx += 160) {
    for (let gy = 60; gy < 2160; gy += 160) {
      if (random(`pj-grid-${gx}-${gy}`) < 0.35) continue;
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx + gridShift} cy={gy} r={2.2} fill="rgba(255,232,200,0.10)" />
      );
    }
  }
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect width={3840} height={2160} fill="url(#pjGlow)" transform={`translate(${drift1},${drift2})`} />
        {orbs}
        {dots}
        <rect x={0} y={scanY} width={3840} height={360} fill="url(#pjScan)" />
        <rect width={3840} height={2160} fill="url(#pjVignette)" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Title bar + live network HUD (top)
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const rise = spring({frame, fps, config: {damping: 200, stiffness: 90, mass: 1}});
  const y = interpolate(rise, [0, 1], [60, 0], clamp01);
  const opacity = interpolate(rise, [0, 1], [0, 1], clamp01);
  const pulse = 0.6 + 0.4 * Math.sin((frame / 60) * Math.PI * 2);
  // Adoptions tick upward every frame - never a static region up here
  const adopted = Math.round(1180 + frame * 0.83);
  const adoptedStr = adopted.toLocaleString('en-US');
  return (
    <div style={{position: 'absolute', top: 118, left: 220, right: 220, opacity, transform: `translateY(${y}px)`}}>
      <div style={{display: 'flex', alignItems: 'flex-start'}}>
        <div>
          <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 14, color: AMBER}}>
            SHELTER NETWORK &nbsp;·&nbsp; ADOPTION PIPELINE
          </div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 148, color: INK, marginTop: 18, letterSpacing: -2}}>
            The Adoption Journey
          </div>
          <div style={{display: 'flex', alignItems: 'center', marginTop: 28, gap: 28}}>
            <div style={{width: 22, height: 22, borderRadius: 11, backgroundColor: CORAL, opacity: pulse, boxShadow: `0 0 30px ${CORAL}`}} />
            <div style={{fontFamily: MONO, fontSize: 40, color: MUTED}}>5 STAGES &nbsp;·&nbsp; LIVE PIPELINE &nbsp;·&nbsp; ANIMALS</div>
          </div>
        </div>
        <div style={{marginLeft: 'auto', textAlign: 'right'}}>
          <div style={{fontFamily: MONO, fontSize: 38, letterSpacing: 8, color: MUTED}}>ADOPTIONS TODAY</div>
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 104,
              color: INK,
              lineHeight: 1.1,
              textShadow: '0 0 34px rgba(255,180,84,0.35)',
            }}
          >
            {adoptedStr}
          </div>
          <div style={{fontFamily: MONO, fontSize: 36, color: FAINT, marginTop: 6}}>
            2,408 shelters online &middot; ticking live
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Connector track: base line, advancing green gradient, head dot + day ticker
// ---------------------------------------------------------------------------
const JourneyTrack: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [60, 130], [0, 1], clamp01);
  const progress = interpolate(frame, [TRACK_START, TRACK_END], [0, 1], clamp01);
  const headX = TRACK_X0 + progress * (TRACK_X1 - TRACK_X0);
  const day = interpolate(frame, [TRACK_START, TRACK_END], [0, 12], clamp01).toFixed(1);
  const showHead = progress > 0.002 && progress < 0.998;
  const headPulse = 0.5 + 0.5 * Math.sin(frame * 0.12);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, opacity: fade}}>
      {/* endpoint captions */}
      <text x={TRACK_X0} y={NODE_Y - 250} fill={FAINT} fontSize={30} fontFamily={MONO} letterSpacing={6} textAnchor="middle">
        SHELTER
      </text>
      <text x={TRACK_X1} y={NODE_Y - 250} fill={FAINT} fontSize={30} fontFamily={MONO} letterSpacing={6} textAnchor="middle">
        FOREVER HOME
      </text>
      {/* base track */}
      <line x1={TRACK_X0} y1={NODE_Y} x2={TRACK_X1} y2={NODE_Y} stroke="rgba(255,246,233,0.16)" strokeWidth={10} strokeLinecap="round" />
      {/* advancing connector */}
      <line
        x1={TRACK_X0}
        y1={NODE_Y}
        x2={TRACK_X1}
        y2={NODE_Y}
        stroke="url(#pjTrack)"
        strokeWidth={10}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
        style={{filter: 'drop-shadow(0 0 18px rgba(61,220,132,0.45))'}}
      />
      {/* tick marks under the track */}
      {Array.from({length: 25}, (_, k) => {
        const tx = TRACK_X0 + (k / 24) * (TRACK_X1 - TRACK_X0);
        const lit = tx <= headX;
        return (
          <line
            key={k}
            x1={tx}
            y1={NODE_Y + 26}
            x2={tx}
            y2={NODE_Y + 44}
            stroke={lit ? 'rgba(61,220,132,0.55)' : 'rgba(255,246,233,0.18)'}
            strokeWidth={4}
          />
        );
      })}
      {/* traveling head */}
      {showHead && (
        <g>
          <circle cx={headX} cy={NODE_Y} r={30 + headPulse * 14} fill={AMBER} opacity={0.22} />
          <circle cx={headX} cy={NODE_Y} r={17} fill="#FFFFFF" style={{filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.9))'}} />
        </g>
      )}
    </svg>
  );
};

// Day ticker that rides the connector head
const DayTicker: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [60, 130], [0, 1], clamp01);
  const progress = interpolate(frame, [TRACK_START, TRACK_END], [0, 1], clamp01);
  if (fade <= 0.01) return null;
  const headX = TRACK_X0 + progress * (TRACK_X1 - TRACK_X0);
  const day = interpolate(frame, [TRACK_START, TRACK_END], [0, 12], clamp01).toFixed(1);
  return (
    <div
      style={{
        position: 'absolute',
        top: NODE_Y - 330,
        left: 0,
        width: 3840,
        display: 'flex',
        justifyContent: 'center',
        opacity: fade,
        pointerEvents: 'none',
      }}
    >
      <div style={{transform: `translateX(${headX - 1920}px)`}}>
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 42,
            color: '#130B07',
            backgroundColor: AMBER,
            borderRadius: 14,
            padding: '12px 30px',
            boxShadow: '0 0 40px rgba(255,180,84,0.55)',
            whiteSpace: 'nowrap',
          }}
        >
          DAY {day} OF 12
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// One checkpoint node: paw icon in a ring that lights green on activation
// ---------------------------------------------------------------------------
const StageNode: React.FC<{frame: number; fps: number; index: number}> = ({frame, fps, index}) => {
  const hit = STAGE_HIT[index];
  const enter = spring({frame: frame - (30 + index * 26), fps, config: {damping: 200, stiffness: 100}});
  const lit = spring({frame: frame - hit, fps, config: {damping: 200, stiffness: 95}});
  const inProgress = frame >= hit - 90 && frame < hit;
  const done = frame >= hit;
  const x = NODE_X(index);
  const y = interpolate(enter, [0, 1], [80, 0], clamp01);
  const opacity = interpolate(enter, [0, 1], [0, 1], clamp01);
  const litK = interpolate(lit, [0, 1], [0, 1], clamp01);
  const glowPulse = 0.5 + 0.5 * Math.sin(frame * 0.09 + index * 1.3);
  const ringColor = done ? GREEN : inProgress ? AMBER : 'rgba(255,246,233,0.28)';
  const fillColor = done
    ? `rgba(61,220,132,${0.10 + litK * 0.08})`
    : inProgress
      ? 'rgba(255,180,84,0.10)'
      : 'rgba(30,18,10,0.85)';
  const pawColor = done ? GREEN : inProgress ? AMBER : 'rgba(255,246,233,0.38)';
  const pawScale = interpolate(lit, [0, 1.35, 1], [1, 1.28, 1], clamp01);
  const st = STAGES[index];
  return (
    <div
      style={{
        position: 'absolute',
        left: x - NODE_R - 14,
        top: NODE_Y - NODE_R - 14,
        width: (NODE_R + 14) * 2,
        height: (NODE_R + 14) * 2,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: `9px solid ${ringColor}`,
          backgroundColor: fillColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: done
            ? `0 0 ${50 + glowPulse * 50}px rgba(61,220,132,${0.35 + glowPulse * 0.3})`
            : inProgress
              ? `0 0 44px rgba(255,180,84,${0.25 + glowPulse * 0.25})`
              : '0 0 24px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{transform: `scale(${pawScale})`}}>
          <PawPrint size={150} color={pawColor} />
        </div>
      </div>
      {/* stage label + status chip beneath the node */}
      <div style={{position: 'absolute', top: (NODE_R + 14) * 2 + 26, left: 0, width: '100%', textAlign: 'center'}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 52,
            color: done ? INK : MUTED,
            letterSpacing: 2,
            textShadow: done ? '0 0 24px rgba(61,220,132,0.4)' : 'none',
          }}
        >
          {st.label}
        </div>
        <div style={{display: 'flex', justifyContent: 'center', marginTop: 14}}>
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: 5,
              color: done ? '#06281C' : inProgress ? '#130B07' : FAINT,
              backgroundColor: done ? GREEN : inProgress ? AMBER : 'rgba(255,246,233,0.07)',
              border: done ? 'none' : `2px solid ${inProgress ? AMBER : HAIRLINE}`,
              borderRadius: 12,
              padding: '10px 28px',
              boxShadow: done ? '0 0 30px rgba(61,220,132,0.5)' : 'none',
            }}
          >
            {done ? '✓ COMPLETE' : inProgress ? 'IN PROGRESS' : 'PENDING'}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Detail card under each node: pops when its stage lights up
// ---------------------------------------------------------------------------
const StageCard: React.FC<{frame: number; fps: number; index: number}> = ({frame, fps, index}) => {
  const hit = STAGE_HIT[index];
  const pop = spring({frame: frame - hit, fps, config: {damping: 200, stiffness: 90}});
  if (pop <= 0.001) return null;
  const st = STAGES[index];
  const x = NODE_X(index);
  const y = interpolate(pop, [0, 1], [46, 0], clamp01);
  const opacity = interpolate(pop, [0, 1], [0, 1], clamp01);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 300,
        top: 1620,
        width: 600,
        opacity,
        transform: `translateY(${y}px)`,
        backgroundColor: PANEL,
        border: `2px solid ${index === 4 ? 'rgba(61,220,132,0.55)' : HAIRLINE}`,
        borderTop: `8px solid ${index === 4 ? GREEN : AMBER}`,
        borderRadius: 20,
        padding: '30px 40px',
        boxShadow: index === 4 ? '0 0 60px rgba(61,220,132,0.25)' : '0 8px 40px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 6, color: index === 4 ? GREEN : AMBER}}>
        {st.day}
      </div>
      <div style={{fontFamily: FONT, fontWeight: 750, fontSize: 52, color: INK, marginTop: 12}}>
        {st.stat}
      </div>
      <div style={{fontFamily: MONO, fontSize: 34, color: MUTED, marginTop: 10}}>
        {st.sub}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bottom strip: weekly adoptions bars, avg-days gauge, aftercare checks
// ---------------------------------------------------------------------------
const BottomStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - STRIP_START, fps, config: {damping: 200, stiffness: 80}});
  const opacity = interpolate(enter, [0, 1], [0, 1], clamp01);
  const y = interpolate(enter, [0, 1], [70, 0], clamp01);
  if (enter <= 0.001) return null;
  const weekly = Math.round(1150 + frame * 1.15);
  const avgDays = interpolate(frame, [200, TRACK_END], [0, 12], clamp01);
  const bars: React.ReactElement[] = [];
  for (let i = 0; i < 24; i++) {
    const h = 40 + random(`pj-bar-${i}`) * 130;
    const grow = interpolate(frame, [STRIP_START + 20 + i * 5, STRIP_START + 70 + i * 5], [0, 1], clamp01);
    const isLive = i === 23;
    const livePulse = isLive ? 0.6 + 0.4 * Math.sin(frame * 0.15) : 1;
    bars.push(
      <div
        key={i}
        style={{
          width: 26,
          height: h * grow * livePulse,
          background: isLive ? GREEN : 'linear-gradient(0deg, rgba(255,180,84,0.45), #FFB454)',
          borderRadius: 6,
          boxShadow: isLive ? '0 0 18px rgba(61,220,132,0.7)' : 'none',
        }}
      />
    );
  }
  const checks = [
    {label: '30-DAY CHECK', at: 700},
    {label: '90-DAY CHECK', at: 740},
    {label: '1-YEAR CHECK', at: 780},
  ];
  return (
    <div style={{position: 'absolute', top: 1852, left: 220, right: 220, opacity, transform: `translateY(${y}px)`}}>
      <div style={{display: 'flex', gap: 60}}>
        {/* weekly adoptions */}
        <div style={{flex: 1, backgroundColor: PANEL, border: `1.5px solid ${HAIRLINE}`, borderRadius: 20, padding: '28px 44px'}}>
          <div style={{display: 'flex', alignItems: 'baseline'}}>
            <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 6, color: MUTED}}>ADOPTIONS THIS WEEK</div>
            <div style={{marginLeft: 'auto', fontFamily: MONO, fontWeight: 800, fontSize: 64, color: INK}}>
              {weekly.toLocaleString('en-US')}
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 18, height: 150}}>
            {bars}
          </div>
        </div>
        {/* avg days gauge */}
        <div style={{flex: 1, backgroundColor: PANEL, border: `1.5px solid ${HAIRLINE}`, borderRadius: 20, padding: '28px 44px'}}>
          <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 6, color: MUTED}}>AVG. DAYS TO HOME</div>
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 120,
              color: GREEN,
              lineHeight: 1.15,
              textShadow: '0 0 30px rgba(61,220,132,0.45)',
            }}
          >
            {avgDays.toFixed(1)}
          </div>
          <div style={{height: 20, backgroundColor: 'rgba(255,246,233,0.10)', borderRadius: 10, marginTop: 20, overflow: 'hidden'}}>
            <div
              style={{
                width: `${(avgDays / 12) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg,#FFB454,#FF7A59,#3DDC84)',
                borderRadius: 10,
              }}
            />
          </div>
          <div style={{fontFamily: MONO, fontSize: 30, color: FAINT, marginTop: 12}}>SHELTER STAY SHORTENING · -18% YOY</div>
        </div>
        {/* aftercare checks */}
        <div style={{flex: 1, backgroundColor: 'rgba(61,220,132,0.06)', border: `2px solid rgba(61,220,132,0.4)`, borderRadius: 20, padding: '28px 44px'}}>
          <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 6, color: GREEN}}>POST-ADOPTION CARE</div>
          <div style={{marginTop: 22, display: 'flex', flexDirection: 'column', gap: 20}}>
            {checks.map((c) => {
              const done = frame >= c.at;
              return (
                <div key={c.label} style={{display: 'flex', alignItems: 'center', gap: 22}}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: done ? GREEN : 'rgba(255,246,233,0.08)',
                      border: `2px solid ${done ? GREEN : HAIRLINE}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONT,
                      fontWeight: 800,
                      fontSize: 34,
                      color: done ? '#06281C' : FAINT,
                      boxShadow: done ? '0 0 24px rgba(61,220,132,0.6)' : 'none',
                    }}
                  >
                    {done ? '✓' : '·'}
                  </div>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontWeight: 700,
                      fontSize: 40,
                      letterSpacing: 3,
                      color: done ? INK : FAINT,
                    }}
                  >
                    {c.label}
                  </div>
                  <div style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 32, color: done ? GREEN : FAINT}}>
                    {done ? 'DONE' : 'QUEUED'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ambient drifting paw confetti (whole frame, whole duration)
// ---------------------------------------------------------------------------
const PAW_COUNT = 42;
const PawDrift: React.FC<{frame: number}> = ({frame}) => {
  const paws: React.ReactElement[] = [];
  for (let i = 0; i < PAW_COUNT; i++) {
    const seedX = random(`pj-paw-x-${i}`);
    const seedY = random(`pj-paw-y-${i}`);
    const speed = 0.5 + random(`pj-paw-s-${i}`) * 1.1;
    const size = 26 + random(`pj-paw-z-${i}`) * 60;
    const x = seedX * 3840 + Math.sin((frame / 60) * 0.6 + i * 2.1) * 90;
    const y = ((seedY * 2400 + frame * speed * 2.2) % 2400) - 120;
    const rot = (seedX * 360 + frame * (0.2 + speed * 0.3)) % 360;
    const o = 0.05 + random(`pj-paw-o-${i}`) * 0.10;
    const tint = i % 5 === 0 ? GREEN : i % 3 === 0 ? CORAL : AMBER;
    paws.push(
      <g key={i} transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot.toFixed(1)})`} opacity={o}>
        <g transform={`scale(${(size / 60).toFixed(3)})`}>
          <ellipse cx={0} cy={13} rx={15.5} ry={12} fill={tint} />
          <circle cx={-19} cy={-6} r={6.8} fill={tint} />
          <circle cx={-6.5} cy={-14} r={6.8} fill={tint} />
          <circle cx={6.5} cy={-14} r={6.8} fill={tint} />
          <circle cx={19} cy={-6} r={6.8} fill={tint} />
        </g>
      </g>
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {paws}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Payoff: dim + FOUND HOME stamp + paw burst (last ~2 s)
// ---------------------------------------------------------------------------
const Payoff: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const dim = interpolate(frame, [PAYOFF_START, PAYOFF_START + 24], [0, 0.62], clamp01);
  if (dim <= 0.001) return null;
  const stamp = spring({frame: frame - STAMP_START, fps, config: {damping: 200, stiffness: 70}});
  const stampK = interpolate(stamp, [0, 1], [0, 1], clamp01);
  const scale = interpolate(stamp, [0, 1.3, 1], [1.6, 0.94, 1], clamp01);
  const glowPulse = 0.5 + 0.5 * Math.sin((frame - STAMP_START) * 0.18);
  const ringRot = (frame - STAMP_START) * 0.25;
  // Paw burst rising from behind the stamp
  const burstT = interpolate(frame, [STAMP_START, 900], [0, 1], clamp01);
  const burst: React.ReactElement[] = [];
  for (let i = 0; i < 56; i++) {
    const ang = random(`pj-burst-a-${i}`) * Math.PI * 2;
    const dist = 500 + random(`pj-burst-d-${i}`) * 1300;
    const rise = burstT * (700 + random(`pj-burst-r-${i}`) * 500);
    const bx = 1920 + Math.cos(ang) * dist * burstT;
    const by = 1080 + Math.sin(ang) * dist * burstT * 0.7 - rise * 0.6;
    const size = 40 + random(`pj-burst-z-${i}`) * 90;
    const rot = (random(`pj-burst-rot-${i}`) * 360 + burstT * 220) % 360;
    const tint = i % 4 === 0 ? CREAM : i % 4 === 1 ? AMBER : i % 4 === 2 ? GREEN : CORAL;
    burst.push(
      <g key={i} transform={`translate(${bx.toFixed(1)},${by.toFixed(1)}) rotate(${rot.toFixed(1)})`} opacity={(1 - burstT) * 0.9}>
        <g transform={`scale(${(size / 60).toFixed(3)})`}>
          <ellipse cx={0} cy={13} rx={15.5} ry={12} fill={tint} />
          <circle cx={-19} cy={-6} r={6.8} fill={tint} />
          <circle cx={-6.5} cy={-14} r={6.8} fill={tint} />
          <circle cx={6.5} cy={-14} r={6.8} fill={tint} />
          <circle cx={19} cy={-6} r={6.8} fill={tint} />
        </g>
      </g>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, backgroundColor: '#0A0503', opacity: dim}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {burst}
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 3840,
          height: 2160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: stampK,
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(14,59,36,0.94)',
            border: `6px solid ${GREEN}`,
            borderRadius: 40,
            padding: '90px 160px',
            textAlign: 'center',
            boxShadow: `0 0 ${120 + glowPulse * 120}px rgba(61,220,132,${0.45 + glowPulse * 0.35})`,
            position: 'relative',
          }}
        >
          {/* rotating dashed stamp ring */}
          <svg
            width={1180}
            height={640}
            style={{position: 'absolute', top: -70, left: -90, transform: `rotate(${ringRot}deg)`, opacity: 0.55}}
          >
            <ellipse cx={590} cy={320} rx={540} ry={270} fill="none" stroke={GREEN} strokeWidth={6} strokeDasharray="26 30" />
          </svg>
          <div style={{fontFamily: MONO, fontSize: 46, letterSpacing: 18, color: GREEN}}>
            ADOPTION #A-2214 &nbsp;·&nbsp; COMPLETE
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 250,
              color: '#FFFFFF',
              letterSpacing: 6,
              marginTop: 20,
              textShadow: `0 0 60px rgba(61,220,132,${0.6 + glowPulse * 0.4})`,
              whiteSpace: 'nowrap',
            }}
          >
            FOUND HOME
          </div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginTop: 30}}>
            <PawPrint size={90} color={GREEN} />
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 62, color: CREAM}}>
              BUDDY IS HOME
            </div>
            <PawPrint size={90} color={GREEN} />
          </div>
          <div style={{fontFamily: MONO, fontSize: 38, letterSpacing: 6, color: 'rgba(255,246,233,0.75)', marginTop: 34}}>
            12 DAYS &nbsp;·&nbsp; 5 STAGES &nbsp;·&nbsp; 1 FOREVER FAMILY
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain (full-frame, re-seeded every frame)
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 900;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`pj-grain-x-${frame}-${i}`) * 3840;
    const y = random(`pj-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`pj-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`pj-grain-s-${frame}-${i}`) * 2.5;
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
export const PetAdoptionJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <JourneyTrack frame={frame} />
      <DayTicker frame={frame} />
      {STAGES.map((_, i) => (
        <StageNode key={`node-${i}`} frame={frame} fps={fps} index={i} />
      ))}
      {STAGES.map((_, i) => (
        <StageCard key={`card-${i}`} frame={frame} fps={fps} index={i} />
      ))}
      <PawDrift frame={frame} />
      <BottomStrip frame={frame} fps={fps} />
      <Payoff frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
