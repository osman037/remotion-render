/**
 * DonationThermometer.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A fundraising thermometer: animated mercury rises to a $100,000 goal,
 * milestone bursts fire at 25/50/75/100%, donor ticker scrolls below.
 *
 * Register in Root.tsx:
 *   <Composition id="DonationThermometer" component={DonationThermometer}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const BG = '#0B0710';
const PANEL = 'rgba(22, 13, 24, 0.92)';
const HAIRLINE = 'rgba(148, 163, 184, 0.22)';
const INK = '#F5EDFA';
const MUTED = 'rgba(216, 200, 228, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const MERCURY = '#FB7185';
const MERCURY_HOT = '#FCA5A5';
const GOLD = '#FBBF24';
const GOLD_DIM = 'rgba(251, 191, 36, 0.15)';
const EMERALD = '#34D399';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const GOAL = 100000;
const TOP_DONORS = [
  {name: 'Amelia R.', amount: 5000},
  {name: 'Jordan T.', amount: 3500},
  {name: 'Priya S.', amount: 2750},
  {name: 'Marcus L.', amount: 2000},
  {name: 'Sofia K.', amount: 1500},
];
const LIVE_FEED = [
  {name: 'Daniel O.', amount: 250, when: 'just now'},
  {name: 'Aisha B.', amount: 100, when: '2 min ago'},
  {name: 'Liam W.', amount: 500, when: '5 min ago'},
  {name: 'Nora F.', amount: 75, when: '9 min ago'},
  {name: 'Ethan G.', amount: 1000, when: '14 min ago'},
];
const TICKER = [
  'Amelia R. $5,000', 'Jordan T. $3,500', 'Priya S. $2,750', 'Marcus L. $2,000',
  'Sofia K. $1,500', 'Daniel O. $250', 'Aisha B. $100', 'Liam W. $500',
  'Nora F. $75', 'Ethan G. $1,000', 'Grace H. $300', 'Omar V. $450',
];
const MILESTONES = [25, 50, 75, 100];

// Thermometer geometry
const TUBE_X = 1820;
const TUBE_W = 200;
const TUBE_TOP = 470;
const TUBE_H = 1100;
const BULB_Y = 1720;
const BULB_R = 150;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const prog = (frame: number, start: number, end: number) =>
  clamp01((frame - start) / (end - start));
const entr = (frame: number, delay: number, fps: number) =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping: 19, stiffness: 130},
  });
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const money = (v: number) =>
  '$' + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// Background — warm glow, particles, vignette
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const particles = useMemo(
    () =>
      Array.from({length: 60}, (_, i) => ({
        x: rand(i * 3.1) * 3840,
        y: rand(i * 7.7) * 2160,
        r: 1.5 + rand(i * 13.3) * 3.5,
        speed: 0.3 + rand(i * 5.9) * 0.8,
        tw: rand(i * 9.4) * Math.PI * 2,
      })),
    [],
  );
  return (
    <AbsoluteFill>
      <svg width={3840} height={2160}>
        <defs>
          <radialGradient id="bgGlowA" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FB7185" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bgGlowB" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
          </radialGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="150" />
          </filter>
        </defs>
        <ellipse cx={1920} cy={1150} rx={1000} ry={800} fill="url(#bgGlowA)" filter="url(#softBlur)" />
        <ellipse cx={700} cy={1900} rx={800} ry={480} fill="url(#bgGlowB)" filter="url(#softBlur)" />
        {particles.map((p, i) => {
          const y = (p.y + frame * p.speed) % 2160;
          const tw = 0.25 + 0.55 * Math.abs(Math.sin(frame * 0.02 + p.tw));
          return (
            <circle
              key={i}
              cx={p.x}
              cy={y}
              r={p.r}
              fill={i % 3 === 0 ? GOLD : MERCURY}
              opacity={tw * 0.45}
            />
          );
        })}
        <rect width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 20, fps);
  const pulse = 0.55 + 0.45 * Math.sin(frame * 0.12);
  return (
    <div
      style={{
        position: 'absolute',
        top: 100,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: e,
        transform: `translateY(${(1 - e) * 40}px)`,
      }}
    >
      <div>
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: GOLD, marginBottom: 14}}>
          ANNUAL GALA
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: INK,
            letterSpacing: -1,
            textShadow: '0 4px 40px rgba(251,113,133,0.35)',
          }}
        >
          Fundraising Thermometer
        </div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            background: MERCURY,
            opacity: pulse,
            boxShadow: '0 0 26px rgba(251,113,133,0.9)',
          }}
        />
        <span style={{fontFamily: MONO, fontSize: 34, letterSpacing: 4, color: MERCURY}}>LIVE</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Goal counter (top center)
// ---------------------------------------------------------------------------
const GoalCounter: React.FC<{frame: number; fps: number; raised: number}> = ({frame, fps, raised}) => {
  const e = entr(frame, 60, fps);
  const pct = Math.round((raised / GOAL) * 100);
  return (
    <div
      style={{
        position: 'absolute',
        top: 330,
        left: 0,
        right: 0,
        textAlign: 'center',
        opacity: e,
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED, marginBottom: 10}}>
        RAISED SO FAR
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 120,
          fontWeight: 700,
          color: INK,
          textShadow: '0 4px 60px rgba(251,113,133,0.45)',
        }}
      >
        {money(raised)}
        <span style={{fontSize: 52, color: MUTED}}> / {money(GOAL)}</span>
      </div>
      <div style={{fontFamily: MONO, fontSize: 34, color: GOLD, letterSpacing: 3, marginTop: 8}}>
        {pct}% OF GOAL
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Thermometer
// ---------------------------------------------------------------------------
const Thermometer: React.FC<{frame: number; fps: number; raised: number}> = ({frame, fps, raised}) => {
  const e = entr(frame, 90, fps);
  const fill = clamp01(raised / GOAL);
  const wobble = Math.sin(frame * 0.09) * 7 * (fill > 0 && fill < 1 ? 1 : 0);
  const fillH = fill * TUBE_H;
  const surfY = TUBE_TOP + TUBE_H - fillH + wobble;
  const goalHit = prog(frame, 800, 840);

  return (
    <div style={{position: 'absolute', inset: 0, opacity: e}}>
      <svg width={3840} height={2160}>
        <defs>
          <linearGradient id="mercGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MERCURY_HOT} />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
          <filter id="mercGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <clipPath id="tubeClip">
            <rect x={TUBE_X} y={TUBE_TOP} width={TUBE_W} height={TUBE_H} rx={90} />
          </clipPath>
        </defs>
        {/* glass tube */}
        <rect
          x={TUBE_X}
          y={TUBE_TOP}
          width={TUBE_W}
          height={TUBE_H}
          rx={90}
          fill="rgba(20,12,22,0.85)"
          stroke={HAIRLINE}
          strokeWidth={4}
        />
        {/* mercury */}
        <g clipPath="url(#tubeClip)">
          <rect
            x={TUBE_X}
            y={surfY}
            width={TUBE_W}
            height={TUBE_H}
            fill="url(#mercGrad)"
            filter="url(#mercGlow)"
          />
          <rect x={TUBE_X} y={surfY} width={TUBE_W} height={TUBE_H} fill="url(#mercGrad)" />
          <ellipse cx={TUBE_X + TUBE_W / 2} cy={surfY} rx={TUBE_W / 2} ry={26} fill={MERCURY_HOT} opacity={0.95} />
          {/* shine */}
          <rect x={TUBE_X + 34} y={TUBE_TOP + 40} width={34} height={TUBE_H - 80} rx={17} fill="#FFFFFF" opacity={0.14} />
        </g>
        {/* bulb */}
        <circle cx={TUBE_X + TUBE_W / 2} cy={BULB_Y} r={BULB_R} fill="rgba(20,12,22,0.9)" stroke={HAIRLINE} strokeWidth={4} />
        <circle cx={TUBE_X + TUBE_W / 2} cy={BULB_Y} r={BULB_R - 26} fill="url(#mercGrad)" filter="url(#mercGlow)" />
        <circle cx={TUBE_X + TUBE_W / 2} cy={BULB_Y} r={BULB_R - 26} fill="url(#mercGrad)" opacity={0.9} />
        {/* tick marks */}
        {Array.from({length: 21}, (_, i) => {
          const p = i / 20;
          const y = TUBE_TOP + TUBE_H - p * TUBE_H;
          const major = i % 5 === 0;
          return (
            <g key={i}>
              <line
                x1={TUBE_X - (major ? 56 : 30)}
                y1={y}
                x2={TUBE_X - 8}
                y2={y}
                stroke={major ? MUTED : FAINT}
                strokeWidth={major ? 5 : 3}
              />
              {major && (
                <text x={TUBE_X - 74} y={y + 12} textAnchor="end" fontFamily={MONO} fontSize={30} fill={MUTED}>
                  {Math.round(p * 100)}%
                </text>
              )}
            </g>
          );
        })}
        {/* milestone bursts */}
        {MILESTONES.map((m) => {
          const mf = 100 + (m / 100) * 700;
          const b = spring({frame: Math.max(0, frame - mf), fps, config: {damping: 7, stiffness: 100}});
          if (frame < mf) return null;
          const y = TUBE_TOP + TUBE_H - (m / 100) * TUBE_H;
          return (
            <g key={m} transform={`translate(${TUBE_X + TUBE_W + 40} ${y})`}>
              <circle r={30 + (1 - b) * 90} fill="none" stroke={GOLD} strokeWidth={5} opacity={b * 0.9} />
              <circle r={26} fill={GOLD} opacity={0.25 * b} filter="url(#mercGlow)" />
              <g transform={`scale(${0.5 + 0.5 * b})`} opacity={b}>
                <rect x={40} y={-44} width={400} height={88} rx={20} fill="rgba(30,20,10,0.95)" stroke={GOLD} strokeWidth={3} />
                <text x={240} y={14} textAnchor="middle" fontFamily={MONO} fontSize={40} fontWeight={700} fill={GOLD}>
                  {m}% · {money((m / 100) * GOAL)}
                </text>
              </g>
            </g>
          );
        })}
        {/* goal reached halo */}
        {goalHit > 0 && (
          <circle
            cx={TUBE_X + TUBE_W / 2}
            cy={BULB_Y - 200}
            r={420}
            fill="none"
            stroke={GOLD}
            strokeWidth={8}
            opacity={goalHit * (0.5 + 0.3 * Math.sin(frame * 0.1))}
          />
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Side panels
// ---------------------------------------------------------------------------
const SidePanel: React.FC<{
  frame: number;
  fps: number;
  side: 'left' | 'right';
  title: string;
  rows: {name: string; amount: number; when?: string}[];
  delay: number;
}> = ({frame, fps, side, title, rows, delay}) => {
  const e = entr(frame, delay, fps);
  return (
    <div
      style={{
        position: 'absolute',
        left: side === 'left' ? 240 : undefined,
        right: side === 'right' ? 240 : undefined,
        top: 560,
        width: 1080,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        padding: '48px 56px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: GOLD, marginBottom: 36}}>
        {title}
      </div>
      {rows.map((r, i) => {
        const re = entr(frame, delay + 60 + i * 70, fps);
        return (
          <div
            key={r.name}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '22px 0',
              borderBottom: i < rows.length - 1 ? `1px solid ${HAIRLINE}` : 'none',
              opacity: re,
              transform: `translateX(${(1 - re) * (side === 'left' ? -40 : 40)}px)`,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
              {side === 'left' && (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    background: GOLD_DIM,
                    border: `1px solid rgba(251,191,36,0.5)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: MONO,
                    fontSize: 30,
                    fontWeight: 700,
                    color: GOLD,
                  }}
                >
                  {i + 1}
                </div>
              )}
              <div>
                <div style={{fontFamily: FONT, fontSize: 36, fontWeight: 600, color: INK}}>{r.name}</div>
                {r.when && (
                  <div style={{fontFamily: MONO, fontSize: 26, color: FAINT, marginTop: 4}}>{r.when}</div>
                )}
              </div>
            </div>
            <div style={{fontFamily: MONO, fontSize: 38, fontWeight: 700, color: MERCURY}}>
              {money(r.amount)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Donor ticker
// ---------------------------------------------------------------------------
const DonorTicker: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 200, fps);
  const items = [...TICKER, ...TICKER];
  const x = interpolate(frame, [0, 900], [0, -2600], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        bottom: 150,
        height: 110,
        background: 'rgba(14,9,17,0.9)',
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 22,
        overflow: 'hidden',
        opacity: e,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 200,
          background: GOLD,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 3,
          color: '#0B0710',
          zIndex: 2,
        }}
      >
        DONORS
      </div>
      <div style={{display: 'flex', transform: `translateX(${200 + x}px)`, whiteSpace: 'nowrap'}}>
        {items.map((t, i) => (
          <span
            key={i}
            style={{
              fontFamily: MONO,
              fontSize: 32,
              color: i % 2 === 0 ? INK : MUTED,
              padding: '0 46px',
              borderRight: `1px solid ${HAIRLINE}`,
              lineHeight: '110px',
            }}
          >
            ♥&nbsp;&nbsp;{t}
          </span>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Goal reached banner
// ---------------------------------------------------------------------------
const GoalBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const a = prog(frame, 810, 860) * (1 - prog(frame, 885, 900));
  if (a <= 0) return null;
  const pop = spring({frame: Math.max(0, frame - 810), fps, config: {damping: 9, stiffness: 110}});
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 1560,
        display: 'flex',
        justifyContent: 'center',
        opacity: a,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(28, 16, 8, 0.96)',
          border: '2px solid rgba(251,191,36,0.75)',
          borderRadius: 30,
          padding: '36px 100px',
          textAlign: 'center',
          transform: `scale(${0.7 + 0.3 * pop})`,
          boxShadow: '0 0 120px rgba(251,191,36,0.35), 0 30px 90px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{fontFamily: FONT, fontSize: 84, fontWeight: 800, color: GOLD, letterSpacing: 2}}>
          ★ GOAL REACHED ★
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 60, fps);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 56,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: MONO,
        fontSize: 27,
        letterSpacing: 4,
        color: FAINT,
        opacity: e,
      }}
    >
      <span>2,418 DONORS</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;EVERY GIFT COUNTS</span>
      <span>FUNDRAISER · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const DonationThermometer: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const raised = interpolate(frame, [100, 800], [0, GOAL], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <GoalCounter frame={frame} fps={fps} raised={raised} />
      <SidePanel frame={frame} fps={fps} side="left" title="TOP DONORS" rows={TOP_DONORS} delay={180} />
      <SidePanel frame={frame} fps={fps} side="right" title="LIVE DONATIONS" rows={LIVE_FEED} delay={260} />
      <Thermometer frame={frame} fps={fps} raised={raised} />
      <GoalBanner frame={frame} fps={fps} />
      <DonorTicker frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default DonationThermometer;
