/**
 * EconomicIndicatorInfographics.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * News-explainer infographics: inflation, GDP, jobs, and interest-rate
 * cards with animated gauges, trend arrows, sparklines, and a then-vs-now
 * comparison panel. Fictional illustrative data.
 *
 * Register in Root.tsx:
 *   <Composition id="EconomicIndicatorInfographics" component={EconomicIndicatorInfographics}
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
const BG = '#070B14';
const PANEL = 'rgba(11, 18, 34, 0.92)';
const HAIRLINE = 'rgba(148, 163, 184, 0.22)';
const INK = '#EAF0FA';
const MUTED = 'rgba(190, 203, 224, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const GOLD = '#FBBF24';
const EMERALD = '#34D399';
const SKY = '#38BDF8';
const VIOLET = '#A78BFA';
const ROSE = '#FB7185';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data — fictional illustrative figures
// ---------------------------------------------------------------------------
const INDICATORS = [
  {label: 'INFLATION', value: 3.2, suffix: '%', max: 10, color: ROSE, delta: '-0.6', good: true, spark: [5.1, 4.8, 4.4, 4.1, 3.9, 3.6, 3.4, 3.2], note: 'Cooling'},
  {label: 'GDP GROWTH', value: 2.8, suffix: '%', max: 6, color: EMERALD, delta: '+0.4', good: true, spark: [1.9, 2.1, 2.0, 2.3, 2.5, 2.4, 2.6, 2.8], note: 'Steady'},
  {label: 'UNEMPLOYMENT', value: 4.1, suffix: '%', max: 10, color: SKY, delta: '-0.3', good: true, spark: [5.4, 5.1, 4.9, 4.7, 4.5, 4.4, 4.2, 4.1], note: 'Resilient'},
  {label: 'INTEREST RATE', value: 4.5, suffix: '%', max: 10, color: GOLD, delta: '0.0', good: true, spark: [5.25, 5.25, 5.0, 5.0, 4.75, 4.75, 4.5, 4.5], note: 'On hold'},
];
const THEN_NOW = [
  {label: 'INFLATION', then: 5.1, now: 3.2, suffix: '%', color: ROSE},
  {label: 'GDP GROWTH', then: 1.9, now: 2.8, suffix: '%', color: EMERALD},
  {label: 'UNEMPLOYMENT', then: 5.4, now: 4.1, suffix: '%', color: SKY},
  {label: 'INTEREST RATE', then: 5.25, now: 4.5, suffix: '%', color: GOLD},
];

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
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx={1920} cy={1000} rx={1300} ry={750} fill="url(#bgGlowA)" filter="url(#softBlur)" />
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
          EXPLAINER
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: INK,
            letterSpacing: -1,
            textShadow: '0 4px 40px rgba(251,191,36,0.25)',
          }}
        >
          The Economy, Visualized
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
        Q3 2026
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Indicator cards
// ---------------------------------------------------------------------------
const Cards: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 60, fps);
  const R = 118;
  const C = 2 * Math.PI * R;
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        top: 400,
        display: 'flex',
        gap: 28,
        opacity: e,
        transform: `translateY(${(1 - e) * 50}px)`,
      }}
    >
      {INDICATORS.map((ind, i) => {
        const ce = entr(frame, 100 + i * 90, fps);
        const t = Easing.out(Easing.cubic)(prog(frame, 160 + i * 90, 560 + i * 90));
        const val = ind.value * t;
        const sw = 560;
        const sh = 130;
        const X = (j: number) => 20 + (j / (ind.spark.length - 1)) * (sw - 40);
        const smin = Math.min(...ind.spark);
        const smax = Math.max(...ind.spark);
        const Y = (v: number) => sh - 20 - ((v - smin) / Math.max(0.001, smax - smin)) * (sh - 40);
        const sparkLine = ind.spark.map((v, j) => `${j === 0 ? 'M' : 'L'}${X(j).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
        const draw = prog(frame, 300 + i * 90, 560 + i * 90);
        const flat = ind.delta === '0.0';
        return (
          <div
            key={ind.label}
            style={{
              flex: 1,
              background: PANEL,
              border: `1px solid ${HAIRLINE}`,
              borderTop: `6px solid ${ind.color}`,
              borderRadius: 24,
              padding: '44px 48px',
              opacity: ce,
              boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
              <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 5, color: MUTED}}>{ind.label}</div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 28,
                  fontWeight: 700,
                  color: flat ? MUTED : EMERALD,
                  background: flat ? 'rgba(148,163,184,0.12)' : 'rgba(52,211,153,0.12)',
                  border: `1px solid ${flat ? HAIRLINE : 'rgba(52,211,153,0.45)'}`,
                  borderRadius: 12,
                  padding: '10px 20px',
                }}
              >
                {flat ? '▬' : ind.delta.startsWith('-') ? '▼' : '▲'} {ind.delta} PP
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
              <svg width={280} height={280}>
                <defs>
                  <filter id={`gaugeGlow${i}`} x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="14" />
                  </filter>
                </defs>
                <circle cx={140} cy={140} r={R} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={30} />
                <circle
                  cx={140}
                  cy={140}
                  r={R}
                  fill="none"
                  stroke={ind.color}
                  strokeWidth={30}
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - (val / ind.max))}
                  transform="rotate(-90 140 140)"
                  filter={`url(#gaugeGlow${i})`}
                />
                <text x={140} y={132} textAnchor="middle" fontFamily={MONO} fontSize={68} fontWeight={700} fill={INK}>
                  {val.toFixed(1)}
                </text>
                <text x={140} y={178} textAnchor="middle" fontFamily={MONO} fontSize={30} fill={FAINT}>
                  {ind.suffix}
                </text>
              </svg>
              <div>
                <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 3, color: ind.color, marginBottom: 14}}>
                  {ind.note.toUpperCase()}
                </div>
                <div style={{fontFamily: FONT, fontSize: 32, color: MUTED, lineHeight: 1.4, maxWidth: 300}}>
                  {i === 0 && 'Price growth slows for the sixth straight quarter.'}
                  {i === 1 && 'Output expands above long-run trend.'}
                  {i === 2 && 'Labor market stays tight and stable.'}
                  {i === 3 && 'Policymakers pause after cuts.'}
                </div>
              </div>
            </div>
            <svg width={sw} height={sh} style={{marginTop: 20}}>
              <path d={sparkLine} fill="none" stroke={ind.color} strokeWidth={6} strokeLinecap="round" strokeDasharray={1200} strokeDashoffset={1200 * (1 - draw)} opacity={0.9} />
            </svg>
            <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: FAINT, marginTop: 6}}>
              8 QUARTERS
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Then-vs-now panel
// ---------------------------------------------------------------------------
const ThenNow: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 420, fps);
  const maxV = 6;
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        top: 1330,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 24,
        padding: '44px 60px',
        opacity: e,
        transform: `translateY(${(1 - e) * 50}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30}}>
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED}}>
          THEN VS NOW · 2024 → 2026
        </div>
        <div style={{display: 'flex', gap: 40, fontFamily: MONO, fontSize: 26, letterSpacing: 2}}>
          <span style={{color: FAINT}}>■ 2024</span>
          <span style={{color: GOLD}}>■ 2026</span>
        </div>
      </div>
      <div style={{display: 'flex', gap: 60}}>
        {THEN_NOW.map((r, i) => {
          const be = entr(frame, 480 + i * 80, fps);
          const bw = 520;
          return (
            <div key={r.label} style={{flex: 1}}>
              <div style={{fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: MUTED, marginBottom: 16}}>
                {r.label}
              </div>
              {[
                {v: r.then, y: 2024, c: 'rgba(148,163,184,0.45)'},
                {v: r.now, y: 2026, c: r.color},
              ].map((row) => (
                <div key={row.y} style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12}}>
                  <div style={{fontFamily: MONO, fontSize: 24, color: FAINT, width: 76}}>{row.y}</div>
                  <div style={{flex: 1, height: 44, background: 'rgba(148,163,184,0.10)', borderRadius: 10, overflow: 'hidden'}}>
                    <div
                      style={{
                        width: `${(row.v / maxV) * 100 * be}%`,
                        height: '100%',
                        background: row.c,
                        borderRadius: 10,
                        boxShadow: row.y === 2026 ? `0 0 20px ${row.c}` : 'none',
                      }}
                    />
                  </div>
                  <div style={{fontFamily: MONO, fontSize: 30, fontWeight: 700, color: INK, width: 110, textAlign: 'right'}}>
                    {row.v.toFixed(row.v < 10 && row.v % 1 !== 0 ? 2 : 1)}{r.suffix}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Takeaways strip
// ---------------------------------------------------------------------------
const Takeaways: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 560, fps);
  const items = [
    {t: 'PRICES COOLING', d: 'Inflation near target for the first time in years.', c: EMERALD},
    {t: 'GROWTH STEADY', d: 'Consumers keep spending, output keeps expanding.', c: SKY},
    {t: 'RATES ON HOLD', d: 'Borrowing costs steady as policymakers wait.', c: GOLD},
  ];
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        top: 1740,
        display: 'flex',
        gap: 28,
        opacity: e,
      }}
    >
      {items.map((s, i) => (
        <div
          key={s.t}
          style={{
            flex: 1,
            background: 'rgba(6, 10, 20, 0.9)',
            border: `1px solid ${HAIRLINE}`,
            borderLeft: `6px solid ${s.c}`,
            borderRadius: 18,
            padding: '28px 40px',
            display: 'flex',
            alignItems: 'center',
            gap: 30,
            opacity: entr(frame, 600 + i * 70, fps),
          }}
        >
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: 39,
              background: s.c,
              opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: MONO,
              fontSize: 40,
              fontWeight: 700,
              color: '#0B1220',
              flexShrink: 0,
            }}
          >
            {i + 1}
          </div>
          <div>
            <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 3, color: s.c, marginBottom: 8}}>{s.t}</div>
            <div style={{fontFamily: FONT, fontSize: 30, color: MUTED}}>{s.d}</div>
          </div>
        </div>
      ))}
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
        bottom: 48,
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
      <span>SEASONALLY ADJUSTED</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;ILLUSTRATIVE DATA</span>
      <span>EXPLAINER · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const EconomicIndicatorInfographics: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <Cards frame={frame} fps={fps} />
      <ThenNow frame={frame} fps={fps} />
      <Takeaways frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default EconomicIndicatorInfographics;
