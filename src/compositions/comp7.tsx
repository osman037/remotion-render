/**
 * TravelPriceTrends.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Travel price intelligence: a flight-price line chart draws over 12 months,
 * hotel bars, price-drop alerts, a best-time-to-book callout, and a
 * calendar heat strip. City codes only — no trademarks.
 *
 * Register in Root.tsx:
 *   <Composition id="TravelPriceTrends" component={TravelPriceTrends}
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
const BG = '#060B14';
const PANEL = 'rgba(11, 18, 32, 0.92)';
const HAIRLINE = 'rgba(148, 163, 184, 0.22)';
const INK = '#EAF0FA';
const MUTED = 'rgba(190, 203, 224, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const TEAL = '#2DD4BF';
const TEAL_DIM = 'rgba(45, 212, 191, 0.14)';
const SKY = '#38BDF8';
const AMBER = '#FBBF24';
const ROSE = '#FB7185';
const EMERALD = '#34D399';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const FLIGHT = [420, 445, 380, 310, 340, 395, 480, 520, 410, 360, 330, 455];
const HOTEL = [180, 195, 160, 140, 155, 190, 240, 260, 200, 170, 150, 210];
const ALERTS = [
  {title: 'PRICE DROP', route: 'NYC → LON', from: 394, to: 310, when: '2H AGO', color: EMERALD},
  {title: 'HOTEL DEAL', route: 'SEASIDE RESORT', from: 260, to: 189, when: '5H AGO', color: SKY},
  {title: 'FARE WATCH', route: 'LON → NYC', from: 488, to: 402, when: '1D AGO', color: TEAL},
];

// Flight chart geometry
const CX = 240;
const CW = 2240;
const CY = 430;
const CH = 880;
const PX = (i: number) => CX + 90 + (i / 11) * (CW - 180);
const FMIN = 250;
const FMAX = 580;
const PY = (v: number) => CY + CH - 90 - ((v - FMIN) / (FMAX - FMIN)) * (CH - 180);

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
        <ellipse cx={1500} cy={900} rx={1100} ry={700} fill="url(#bgGlowA)" filter="url(#softBlur)" />
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
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: TEAL, marginBottom: 14}}>
          TRAVEL INTEL
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
          Travel Price Trends
        </div>
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 34,
          letterSpacing: 3,
          color: INK,
          background: TEAL_DIM,
          border: '1px solid rgba(45,212,191,0.45)',
          borderRadius: 18,
          padding: '22px 36px',
        }}
      >
        NYC&nbsp;&nbsp;→&nbsp;&nbsp;LON
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Flight price line chart
// ---------------------------------------------------------------------------
const FlightChart: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 60, fps);
  const draw = prog(frame, 120, 520);
  const line = useMemo(
    () => FLIGHT.map((v, i) => `${i === 0 ? 'M' : 'L'}${PX(i).toFixed(0)},${PY(v).toFixed(0)}`).join(' '),
    [],
  );
  const area = useMemo(
    () =>
      `${line} L${PX(11).toFixed(0)},${(CY + CH - 90).toFixed(0)} L${PX(0).toFixed(0)},${(CY + CH - 90).toFixed(0)} Z`,
    [line],
  );
  const minIdx = FLIGHT.indexOf(Math.min(...FLIGHT));
  const callout = entr(frame, 560, fps);

  return (
    <div
      style={{
        position: 'absolute',
        left: CX,
        top: CY,
        width: CW,
        height: CH,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: MUTED, position: 'absolute', top: 40, left: 60}}>
        FLIGHT PRICE · 12 MONTHS · USD
      </div>
      <svg width={CW} height={CH}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2DD4BF" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
          </linearGradient>
          <filter id="lineGlow" x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>
        {[300, 400, 500].map((v) => (
          <g key={v}>
            <line x1={90} y1={PY(v)} x2={CW - 90} y2={PY(v)} stroke={HAIRLINE} strokeWidth={1} strokeDasharray="8 10" />
            <text x={60} y={PY(v) + 10} textAnchor="end" fontFamily={MONO} fontSize={26} fill={FAINT}>
              ${v}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#areaGrad)" opacity={draw * 0.9} />
        <path
          d={line}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth={9}
          strokeLinecap="round"
          filter="url(#lineGlow)"
          strokeDasharray={6000}
          strokeDashoffset={6000 * (1 - draw)}
        />
        {FLIGHT.map((v, i) => {
          const dp = prog(frame, 120 + (i / 11) * 400, 120 + (i / 11) * 400 + 40);
          if (dp <= 0) return null;
          const isMin = i === minIdx;
          return (
            <g key={i} opacity={dp}>
              {isMin && (
                <circle cx={PX(i)} cy={PY(v)} r={26} fill={EMERALD} opacity={0.3} filter="url(#lineGlow)" />
              )}
              <circle cx={PX(i)} cy={PY(v)} r={isMin ? 15 : 10} fill={isMin ? EMERALD : '#0B1220'} stroke={isMin ? EMERALD : SKY} strokeWidth={5} />
              <text x={PX(i)} y={CH - 34} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={FAINT}>
                {MONTHS[i]}
              </text>
            </g>
          );
        })}
      </svg>
      {/* best-time callout */}
      <div
        style={{
          position: 'absolute',
          left: PX(minIdx) - 260,
          top: PY(FLIGHT[minIdx]) - 260,
          width: 520,
          opacity: callout,
          transform: `scale(${0.7 + 0.3 * callout})`,
        }}
      >
        <div
          style={{
            background: 'rgba(6, 28, 22, 0.96)',
            border: '2px solid rgba(52,211,153,0.7)',
            borderRadius: 20,
            padding: '28px 36px',
            textAlign: 'center',
            boxShadow: '0 0 60px rgba(52,211,153,0.25)',
          }}
        >
          <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 4, color: EMERALD, marginBottom: 10}}>
            BEST TIME TO BOOK
          </div>
          <div style={{fontFamily: FONT, fontSize: 44, fontWeight: 800, color: INK}}>
            MARCH · $310
          </div>
          <div style={{fontFamily: MONO, fontSize: 28, color: MUTED, marginTop: 8}}>SAVE 40% VS PEAK</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Hotel bars
// ---------------------------------------------------------------------------
const HotelBars: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 200, fps);
  const maxH = 260;
  return (
    <div
      style={{
        position: 'absolute',
        left: CX,
        top: 1370,
        width: CW,
        height: 460,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
        padding: '36px 60px',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: MUTED, marginBottom: 24}}>
        HOTEL NIGHTLY RATE · USD
      </div>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 44, height: maxH + 50}}>
        {HOTEL.map((v, i) => {
          const be = entr(frame, 260 + i * 35, fps);
          const h = (v / 280) * maxH * be;
          const cheap = v <= 160;
          return (
            <div key={i} style={{textAlign: 'center', flex: 1}}>
              <div style={{fontFamily: MONO, fontSize: 22, color: MUTED, marginBottom: 8, opacity: be}}>
                ${v}
              </div>
              <div
                style={{
                  height: Math.max(10, h),
                  borderRadius: 10,
                  background: cheap ? 'linear-gradient(180deg,#34D399,#059669)' : 'linear-gradient(180deg,#38BDF8,#0369A1)',
                  boxShadow: cheap ? '0 0 22px rgba(52,211,153,0.45)' : 'none',
                  opacity: 0.4 + 0.6 * be,
                }}
              />
              <div style={{fontFamily: MONO, fontSize: 24, color: FAINT, marginTop: 10}}>{MONTHS[i]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Right column: alerts + best-time card
// ---------------------------------------------------------------------------
const RightColumn: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 300, fps);
  return (
    <div
      style={{
        position: 'absolute',
        left: 2600,
        top: 430,
        width: 1000,
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
      }}
    >
      <div
        style={{
          background: PANEL,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 28,
          padding: '44px 52px',
          marginBottom: 32,
          boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: AMBER, marginBottom: 32}}>
          PRICE ALERTS
        </div>
        {ALERTS.map((a, i) => {
          const re = entr(frame, 420 + i * 110, fps);
          const drop = Math.round(((a.from - a.to) / a.from) * 100);
          return (
            <div
              key={a.route}
              style={{
                border: `1px solid ${HAIRLINE}`,
                borderLeft: `6px solid ${a.color}`,
                borderRadius: 18,
                padding: '28px 32px',
                marginBottom: i < ALERTS.length - 1 ? 24 : 0,
                opacity: re,
                transform: `translateX(${(1 - re) * 60}px)`,
                background: 'rgba(148,163,184,0.05)',
              }}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                <span style={{fontFamily: MONO, fontSize: 26, letterSpacing: 3, color: a.color}}>▼ {a.title}</span>
                <span style={{fontFamily: MONO, fontSize: 24, color: FAINT}}>{a.when}</span>
              </div>
              <div style={{fontFamily: FONT, fontSize: 34, fontWeight: 700, color: INK, marginBottom: 10}}>
                {a.route}
              </div>
              <div style={{fontFamily: MONO, fontSize: 32, color: MUTED}}>
                <span style={{textDecoration: 'line-through', color: FAINT}}>${a.from}</span>
                {'  →  '}
                <span style={{color: EMERALD, fontWeight: 700}}>${a.to}</span>
                <span style={{color: EMERALD, marginLeft: 18}}>(-{drop}%)</span>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          background: 'rgba(6, 24, 22, 0.94)',
          border: '1px solid rgba(45,212,191,0.45)',
          borderRadius: 28,
          padding: '44px 52px',
          boxShadow: '0 0 60px rgba(45,212,191,0.12)',
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: TEAL, marginBottom: 24}}>
          FARE FORECAST
        </div>
        <div style={{fontFamily: FONT, fontSize: 40, fontWeight: 700, color: INK, marginBottom: 16, lineHeight: 1.35}}>
          Prices rising into summer peak. Book before May.
        </div>
        <div style={{fontFamily: MONO, fontSize: 30, color: MUTED, letterSpacing: 2}}>
          CONFIDENCE <span style={{color: TEAL}}>●●●●○</span> HIGH
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Calendar heat strip
// ---------------------------------------------------------------------------
const HeatStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 380, fps);
  const max = Math.max(...FLIGHT);
  const min = Math.min(...FLIGHT);
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        top: 1890,
        height: 120,
        display: 'flex',
        gap: 14,
        opacity: e,
      }}
    >
      {FLIGHT.map((v, i) => {
        const t = (v - min) / (max - min);
        const be = entr(frame, 400 + i * 30, fps);
        const bg = t < 0.33 ? EMERALD : t < 0.66 ? AMBER : ROSE;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 14,
              background: `rgba(${t < 0.33 ? '52,211,153' : t < 0.66 ? '251,191,36' : '251,113,133'},${0.18 + 0.62 * t * be})`,
              border: `1px solid ${HAIRLINE}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scaleY(${0.3 + 0.7 * be})`,
              opacity: be,
            }}
          >
            <div style={{fontFamily: MONO, fontSize: 26, fontWeight: 700, color: INK}}>{MONTHS[i]}</div>
            <div style={{fontFamily: MONO, fontSize: 24, color: bg}}>${v}</div>
          </div>
        );
      })}
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
        bottom: 40,
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
      <span>FARE DATA · 12 MO</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;UPDATED HOURLY</span>
      <span>TRAVEL INTEL · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const TravelPriceTrends: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <FlightChart frame={frame} fps={fps} />
      <HotelBars frame={frame} fps={fps} />
      <RightColumn frame={frame} fps={fps} />
      <HeatStrip frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default TravelPriceTrends;
