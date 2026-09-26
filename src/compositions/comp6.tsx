/**
 * RankingRaceCharts.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A bar-chart race: 8 fictional companies' market caps, 2018 -> 2026,
 * with smooth interpolated values, eased rank swaps, and a year counter.
 * All company names are fictional.
 *
 * Register in Root.tsx:
 *   <Composition id="RankingRaceCharts" component={RankingRaceCharts}
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
const BG = '#060913';
const PANEL = 'rgba(11, 17, 32, 0.92)';
const HAIRLINE = 'rgba(148, 163, 184, 0.22)';
const INK = '#EAF0FA';
const MUTED = 'rgba(190, 203, 224, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const GOLD = '#FBBF24';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data — fictional companies, market cap in $B, 2018..2026
// ---------------------------------------------------------------------------
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const COMPANIES = [
  {name: 'NORTHWIND', color: '#38BDF8', vals: [120, 145, 178, 210, 265, 320, 388, 445, 512]},
  {name: 'HELIX LABS', color: '#A78BFA', vals: [95, 130, 165, 240, 310, 355, 402, 470, 540]},
  {name: 'BLUEPEAK', color: '#34D399', vals: [210, 225, 248, 270, 295, 330, 365, 410, 448]},
  {name: 'VANTACORE', color: '#FBBF24', vals: [80, 95, 140, 190, 250, 300, 350, 395, 460]},
  {name: 'LUMEN & CO', color: '#FB7185', vals: [150, 160, 175, 195, 220, 260, 300, 340, 380]},
  {name: 'ORBITAL', color: '#22D3EE', vals: [60, 85, 120, 165, 210, 275, 330, 385, 430]},
  {name: 'FERNWORKS', color: '#A3E635', vals: [180, 190, 205, 225, 245, 270, 295, 320, 345]},
  {name: 'KITE SYSTEMS', color: '#FB923C', vals: [40, 70, 110, 150, 195, 240, 285, 330, 375]},
];
const MAX_V = 600;

// Chart geometry
const CHART_TOP = 470;
const CHART_BOTTOM = 1880;
const ROW_H = (CHART_BOTTOM - CHART_TOP) / 8;
const NAME_X = 240;
const BAR_X = 760;
const BAR_MAX_W = 1980;
const BAR_H = 104;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
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
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const sweepX = interpolate(frame, [0, 900], [-1400, 5200], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill>
      <svg width={3840} height={2160}>
        <defs>
          <radialGradient id="bgGlowA" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
          </radialGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="150" />
          </filter>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx={1920} cy={1100} rx={1200} ry={750} fill="url(#bgGlowA)" filter="url(#softBlur)" />
        {Array.from({length: 13}, (_, i) => (
          <line key={'v' + i} x1={i * 320} y1={0} x2={i * 320} y2={2160} stroke={HAIRLINE} strokeWidth={1} />
        ))}
        {Array.from({length: 8}, (_, i) => (
          <line key={'h' + i} x1={0} y1={i * 320} x2={3840} y2={i * 320} stroke={HAIRLINE} strokeWidth={1} />
        ))}
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
        top: 110,
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
          DATA VISUALIZATION
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: INK,
            letterSpacing: -1,
            textShadow: '0 4px 40px rgba(56,189,248,0.30)',
          }}
        >
          Market Cap Race
        </div>
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 34,
          letterSpacing: 3,
          color: INK,
          background: 'rgba(251,191,36,0.12)',
          border: '1px solid rgba(251,191,36,0.45)',
          borderRadius: 18,
          padding: '22px 36px',
        }}
      >
        TOP 8 · FICTIONAL DATA
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Race chart
// ---------------------------------------------------------------------------
const RaceChart: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 40, fps);

  // ranks[yearIdx][companyIdx] = rank position (0 = top)
  const ranks = useMemo(() => {
    return YEARS.map((_, yi) => {
      const order = COMPANIES.map((c, ci) => ({ci, v: c.vals[yi]})).sort((a, b) => b.v - a.v);
      const r = new Array(COMPANIES.length).fill(0);
      order.forEach((o, pos) => {
        r[o.ci] = pos;
      });
      return r;
    });
  }, []);

  const yearFrac = clamp01((frame - 60) / 780) * (YEARS.length - 1);
  const y0 = Math.min(YEARS.length - 2, Math.floor(yearFrac));
  const y1 = y0 + 1;
  const lt = smooth(clamp01(yearFrac - y0));
  const year = YEARS[Math.round(clamp01((frame - 60) / 780) * (YEARS.length - 1))];

  const rows = COMPANIES.map((c, ci) => {
    const v = lerp(c.vals[y0], c.vals[y1], lt);
    const rankY = lerp(ranks[y0][ci], ranks[y1][ci], lt);
    return {c, v, rankY, rank: Math.round(rankY)};
  });

  const leader = rows.reduce((a, b) => (b.v > a.v ? b : a));

  return (
    <div style={{position: 'absolute', inset: 0, opacity: e}}>
      <svg width={3840} height={2160}>
        <defs>
          <filter id="barGlow" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        {/* row gridlines */}
        {Array.from({length: 8}, (_, i) => (
          <line
            key={i}
            x1={BAR_X}
            y1={CHART_TOP + i * ROW_H}
            x2={BAR_X + BAR_MAX_W}
            y2={CHART_TOP + i * ROW_H}
            stroke={HAIRLINE}
            strokeWidth={1}
          />
        ))}
        {/* x axis ticks */}
        {[0, 100, 200, 300, 400, 500, 600].map((v) => {
          const x = BAR_X + (v / MAX_V) * BAR_MAX_W;
          return (
            <g key={v}>
              <line x1={x} y1={CHART_BOTTOM} x2={x} y2={CHART_BOTTOM + 18} stroke={FAINT} strokeWidth={3} />
              <text x={x} y={CHART_BOTTOM + 62} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={FAINT}>
                ${v}B
              </text>
            </g>
          );
        })}
        {rows.map(({c, v, rankY}) => {
          const y = CHART_TOP + rankY * ROW_H + (ROW_H - BAR_H) / 2;
          const w = Math.max(8, (v / MAX_V) * BAR_MAX_W);
          return (
            <g key={c.name}>
              <rect x={BAR_X} y={y} width={w} height={BAR_H} rx={20} fill={c.color} opacity={0.30} filter="url(#barGlow)" />
              <rect x={BAR_X} y={y} width={w} height={BAR_H} rx={20} fill={c.color} opacity={0.88} />
              <rect x={BAR_X} y={y} width={w} height={BAR_H / 2} rx={20} fill="#FFFFFF" opacity={0.14} />
            </g>
          );
        })}
      </svg>
      {/* HTML labels overlay */}
      {rows.map(({c, v, rankY}) => {
        const y = CHART_TOP + rankY * ROW_H + (ROW_H - BAR_H) / 2;
        const w = Math.max(8, (v / MAX_V) * BAR_MAX_W);
        return (
          <React.Fragment key={c.name}>
            <div
              style={{
                position: 'absolute',
                left: NAME_X,
                top: y,
                height: BAR_H,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 40,
                  fontWeight: 700,
                  color: FAINT,
                  width: 70,
                }}
              >
                {Math.round(rankY) + 1}
              </div>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: c.color,
                  flexShrink: 0,
                }}
              />
              <div style={{fontFamily: FONT, fontSize: 38, fontWeight: 700, color: INK, whiteSpace: 'nowrap'}}>
                {c.name}
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                left: BAR_X + w + 26,
                top: y,
                height: BAR_H,
                display: 'flex',
                alignItems: 'center',
                fontFamily: MONO,
                fontSize: 38,
                fontWeight: 700,
                color: INK,
                whiteSpace: 'nowrap',
              }}
            >
              ${Math.round(v)}B
            </div>
          </React.Fragment>
        );
      })}
      {/* year counter */}
      <div
        style={{
          position: 'absolute',
          right: 240,
          top: 400,
          textAlign: 'right',
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 210,
            fontWeight: 700,
            color: INK,
            letterSpacing: -4,
            textShadow: '0 4px 80px rgba(56,189,248,0.35)',
            lineHeight: 1,
          }}
        >
          {year}
        </div>
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 5, color: MUTED, marginTop: 12}}>
          MARKET CAP · USD BILLIONS
        </div>
      </div>
      {/* leader card */}
      <div
        style={{
          position: 'absolute',
          right: 240,
          top: 780,
          width: 620,
          background: PANEL,
          border: `1px solid ${HAIRLINE}`,
          borderLeft: `6px solid ${leader.c.color}`,
          borderRadius: 22,
          padding: '36px 44px',
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: FAINT, marginBottom: 12}}>
          CURRENT LEADER
        </div>
        <div style={{fontFamily: FONT, fontSize: 52, fontWeight: 800, color: INK}}>{leader.c.name}</div>
        <div style={{fontFamily: MONO, fontSize: 56, fontWeight: 700, color: leader.c.color, marginTop: 8}}>
          ${Math.round(leader.v)}B
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
      <span>2018 — 2026</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;FICTIONAL COMPANIES · ILLUSTRATIVE DATA</span>
      <span>DATA STORY · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const RankingRaceCharts: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <RaceChart frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default RankingRaceCharts;
