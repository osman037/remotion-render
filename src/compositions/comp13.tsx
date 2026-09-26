/**
 * TourismStatisticsInfographics.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Tourism statistics infographics: arrivals-by-country bars, tourism
 * revenue counters, year-over-year growth badges, visit-purpose segments,
 * and a monthly arrivals trend. Illustrative data.
 *
 * Register in Root.tsx:
 *   <Composition id="TourismStatisticsInfographics" component={TourismStatisticsInfographics}
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
const BG = '#060D16';
const PANEL = 'rgba(10, 20, 34, 0.92)';
const HAIRLINE = 'rgba(148, 163, 184, 0.22)';
const INK = '#EAF0FA';
const MUTED = 'rgba(190, 203, 224, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const TEAL = '#2DD4BF';
const SKY = '#38BDF8';
const AMBER = '#FBBF24';
const EMERALD = '#34D399';
const VIOLET = '#A78BFA';
const ROSE = '#FB7185';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data — illustrative
// ---------------------------------------------------------------------------
const ARRIVALS = [
  {country: 'FRANCE', m: 89.4, yoy: 8.2, color: SKY},
  {country: 'SPAIN', m: 83.7, yoy: 11.5, color: TEAL},
  {country: 'USA', m: 79.2, yoy: 6.8, color: VIOLET},
  {country: 'ITALY', m: 64.5, yoy: 9.4, color: AMBER},
  {country: 'TURKEY', m: 51.2, yoy: 14.1, color: EMERALD},
  {country: 'MEXICO', m: 45.0, yoy: 7.7, color: ROSE},
];
const REGIONS = [
  {name: 'EUROPE', rev: 782, yoy: 9.2},
  {name: 'ASIA-PACIFIC', rev: 541, yoy: 16.4},
  {name: 'AMERICAS', rev: 398, yoy: 7.1},
  {name: 'MIDEAST & AFRICA', rev: 119, yoy: 12.8},
];
const SEGMENTS = [
  {label: 'LEISURE', pct: 58, color: TEAL},
  {label: 'BUSINESS', pct: 22, color: SKY},
  {label: 'VISITING FAMILY', pct: 12, color: VIOLET},
  {label: 'OTHER', pct: 8, color: AMBER},
];
const MONTHLY = [68, 62, 74, 82, 91, 104, 118, 122, 108, 94, 78, 86];

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

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const sweepX = interpolate(frame, [0, 900], [-1400, 5200], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const planes = useMemo(
    () =>
      Array.from({length: 8}, (_, i) => ({
        x: rand(i * 3.3) * 3840,
        y: 200 + rand(i * 8.1) * 1400,
        speed: 2 + rand(i * 5.2) * 3,
        size: 26 + rand(i * 6.6) * 22,
      })),
    [],
  );
  return (
    <AbsoluteFill>
      <svg width={3840} height={2160}>
        <defs>
          <radialGradient id="bgGlowA" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
          </radialGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="150" />
          </filter>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0" />
            <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx={1700} cy={1000} rx={1200} ry={750} fill="url(#bgGlowA)" filter="url(#softBlur)" />
        {Array.from({length: 13}, (_, i) => (
          <line key={'v' + i} x1={i * 320} y1={0} x2={i * 320} y2={2160} stroke={HAIRLINE} strokeWidth={1} />
        ))}
        {Array.from({length: 8}, (_, i) => (
          <line key={'h' + i} x1={0} y1={i * 320} x2={3840} y2={i * 320} stroke={HAIRLINE} strokeWidth={1} />
        ))}
        {planes.map((p, i) => {
          const x = (p.x + frame * p.speed) % 4000 - 80;
          return (
            <g key={i} transform={`translate(${x},${p.y}) scale(${p.size / 40})`} opacity={0.35} fill="none" stroke={TEAL} strokeWidth={2.5}>
              <path d="M0,0 L36,10 L0,20 L10,10 Z" />
              <path d="M10,10 L-14,10" />
            </g>
          );
        })}
        <rect x={sweepX - 420} y={0} width={840} height={2160} fill="url(#sweepGrad)" />
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
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: TEAL, marginBottom: 14}}>
          TRAVEL & TOURISM
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: INK,
            letterSpacing: -1,
            textShadow: '0 4px 40px rgba(45,212,191,0.30)',
          }}
        >
          Tourism Statistics
        </div>
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 34,
          letterSpacing: 3,
          color: INK,
          background: 'rgba(45,212,191,0.12)',
          border: '1px solid rgba(45,212,191,0.45)',
          borderRadius: 18,
          padding: '22px 36px',
        }}
      >
        FULL YEAR 2026
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Arrivals bars (left)
// ---------------------------------------------------------------------------
const ArrivalsBars: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 80, fps);
  const maxM = 100;
  const BW = 1050;
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        top: 430,
        width: 2000,
        height: 900,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        padding: '48px 64px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30}}>
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED}}>
          INTERNATIONAL ARRIVALS · MILLIONS
        </div>
        <div style={{fontFamily: MONO, fontSize: 28, color: EMERALD, letterSpacing: 2}}>
          ▲ +9.6% YOY
        </div>
      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly'}}>
        {ARRIVALS.map((a, i) => {
          const be = entr(frame, 140 + i * 70, fps);
          const t = Easing.out(Easing.cubic)(prog(frame, 160 + i * 70, 560 + i * 70));
          return (
            <div key={a.country} style={{opacity: be}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
                  <span style={{fontFamily: FONT, fontSize: 36, fontWeight: 700, color: INK}}>{a.country}</span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 24,
                      fontWeight: 700,
                      color: EMERALD,
                      background: 'rgba(52,211,153,0.12)',
                      border: '1px solid rgba(52,211,153,0.4)',
                      borderRadius: 10,
                      padding: '6px 14px',
                    }}
                  >
                    +{a.yoy}%
                  </span>
                </div>
                <div style={{fontFamily: MONO, fontSize: 40, fontWeight: 700, color: INK}}>
                  {(a.m * t).toFixed(1)}
                  <span style={{fontSize: 26, color: FAINT}}>M</span>
                </div>
              </div>
              <div style={{height: 40, background: 'rgba(148,163,184,0.10)', borderRadius: 12, overflow: 'hidden'}}>
                <div
                  style={{
                    width: `${(a.m / maxM) * 100 * be}%`,
                    height: '100%',
                    borderRadius: 12,
                    background: `linear-gradient(90deg, ${a.color}55, ${a.color})`,
                    boxShadow: `0 0 24px ${a.color}66`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Revenue panel (right)
// ---------------------------------------------------------------------------
const RevenuePanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 180, fps);
  const t = Easing.out(Easing.cubic)(prog(frame, 240, 700));
  const total = 1.84 * t;
  return (
    <div
      style={{
        position: 'absolute',
        left: 2360,
        top: 430,
        width: 1240,
        height: 900,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        padding: '48px 56px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED, marginBottom: 16}}>
        TOURISM REVENUE
      </div>
      <div style={{fontFamily: MONO, fontSize: 120, fontWeight: 700, color: INK, lineHeight: 1}}>
        ${total.toFixed(2)}
        <span style={{fontSize: 56, color: TEAL}}>T</span>
      </div>
      <div style={{fontFamily: MONO, fontSize: 28, color: EMERALD, letterSpacing: 2, marginTop: 12, marginBottom: 30}}>
        ▲ +11.3% VS 2025
      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly'}}>
        {REGIONS.map((r, i) => {
          const re = entr(frame, 300 + i * 80, fps);
          const rv = Math.round(r.rev * Easing.out(Easing.cubic)(prog(frame, 320 + i * 80, 700)));
          return (
            <div
              key={r.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '22px 0',
                borderBottom: i < REGIONS.length - 1 ? `1px solid ${HAIRLINE}` : 'none',
                opacity: re,
                transform: `translateX(${(1 - re) * 50}px)`,
              }}
            >
              <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 3, color: INK}}>{r.name}</div>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 24}}>
                <div style={{fontFamily: MONO, fontSize: 44, fontWeight: 700, color: INK}}>
                  ${rv}<span style={{fontSize: 28, color: FAINT}}>B</span>
                </div>
                <div style={{fontFamily: MONO, fontSize: 28, fontWeight: 700, color: EMERALD}}>+{r.yoy}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bottom strip: segments + monthly trend
// ---------------------------------------------------------------------------
const BottomStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 380, fps);
  const segT = prog(frame, 440, 800);
  const draw = prog(frame, 480, 820);
  const W = 1240;
  const H = 200;
  const X = (i: number) => 20 + (i / (MONTHLY.length - 1)) * (W - 40);
  const Y = (v: number) => H - 30 - (v / 140) * (H - 60);
  const line = MONTHLY.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        top: 1390,
        display: 'flex',
        gap: 28,
        opacity: e,
        transform: `translateY(${(1 - e) * 50}px)`,
      }}
    >
      <div
        style={{
          flex: 1.4,
          background: PANEL,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 24,
          padding: '40px 56px',
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 5, color: MUTED, marginBottom: 28}}>
          PURPOSE OF VISIT
        </div>
        <div style={{height: 64, borderRadius: 16, overflow: 'hidden', display: 'flex', marginBottom: 24}}>
          {SEGMENTS.map((s) => (
            <div key={s.label} style={{width: `${s.pct * segT}%`, background: s.color, transition: 'none'}} />
          ))}
        </div>
        <div style={{display: 'flex', gap: 44}}>
          {SEGMENTS.map((s) => (
            <div key={s.label} style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <div style={{width: 24, height: 24, borderRadius: 6, background: s.color}} />
              <span style={{fontFamily: MONO, fontSize: 26, color: MUTED}}>{s.label}</span>
              <span style={{fontFamily: MONO, fontSize: 30, fontWeight: 700, color: INK}}>
                {Math.round(s.pct * segT)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          background: PANEL,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 24,
          padding: '40px 56px',
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16}}>
          <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 5, color: MUTED}}>MONTHLY ARRIVALS</div>
          <div style={{fontFamily: MONO, fontSize: 34, fontWeight: 700, color: TEAL}}>PEAK · AUG</div>
        </div>
        <svg width={W} height={H}>
          <defs>
            <linearGradient id="monArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${X(11).toFixed(1)},${H - 30} L${X(0).toFixed(1)},${H - 30} Z`} fill="url(#monArea)" opacity={draw} />
          <path d={line} fill="none" stroke={TEAL} strokeWidth={7} strokeLinecap="round" strokeDasharray={3000} strokeDashoffset={3000 * (1 - draw)} />
        </svg>
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
      <span>SOURCE: TOURISM BOARD</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;ILLUSTRATIVE DATA</span>
      <span>TRAVEL · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const TourismStatisticsInfographics: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <ArrivalsBars frame={frame} fps={fps} />
      <RevenuePanel frame={frame} fps={fps} />
      <BottomStrip frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default TourismStatisticsInfographics;
