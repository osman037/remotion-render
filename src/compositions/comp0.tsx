/**
 * AdobeStockTrajectory.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 21 s (1260 frames).
 * Animates Adobe Inc. (NASDAQ: ADBE) 10-year price trajectory
 * (late Sep 2016 -> late Sep 2026) as a self-drawing financial chart,
 * with phase callouts, a live price cursor, and key financial stats.
 *
 * Register in Root.tsx:
 *   <Composition id="AdobeStockTrajectory" component={AdobeStockTrajectory}
 *     width={3840} height={2160} fps={60} durationInFrames={1260} />
 *
 * Render:
 *   npx remotion render AdobeStockTrajectory out/adobe-stock.mp4
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const BG = '#07090F';
const GRID_COLOR = 'rgba(148,163,184,0.09)';
const AXIS_COLOR = 'rgba(148,163,184,0.55)';
const INK = '#E8EDF6';
const MUTED = 'rgba(203,213,225,0.62)';
const ADOBE_RED = '#FA0F00';
const ADOBE_ORANGE = '#FF7A45';
const UP = '#34D399';
const DOWN = '#F87171';
const WARN = '#FBBF24';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 1260 frames = 21 s
// ---------------------------------------------------------------------------
const DRAW_START = 105; // chart line begins drawing
const DRAW_END = 855; // chart line fully drawn
const STATS_START = 915; // stat cards begin animating in

// ---------------------------------------------------------------------------
// Chart geometry (device px, 4K)
// ---------------------------------------------------------------------------
const PLOT_LEFT = 330;
const PLOT_RIGHT = 3570;
const PLOT_TOP = 430;
const PLOT_BOTTOM = 1610;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;
const PRICE_MIN = 90;
const PRICE_MAX = 700;
const PRICE_TICKS = [100, 200, 300, 400, 500, 600, 700];

// ---------------------------------------------------------------------------
// Data model: monthly series, index 0 = Sep 2016 ... index 120 = Sep 2026.
// Anchor points derived from the 10-year trajectory narrative; the gaps are
// filled with cosine-interpolated values for a smooth, organic curve.
// ---------------------------------------------------------------------------
const ANCHORS: [number, number][] = [
  [0, 108.54], // Sep 2016 - cloud subscription momentum
  [12, 178], // Sep 2017
  [18, 232], // Mar 2018 - steps past 250
  [21, 256],
  [24, 250], // Sep 2018
  [27, 234], // Dec 2018
  [33, 268],
  [36, 294], // Sep 2019 - Creative Cloud adoption
  [40, 312], // Dec 2019
  [44, 392],
  [48, 452], // Sep 2020 - pandemic boom accelerates past 450
  [52, 486], // Dec 2020
  [56, 565],
  [60, 628], // Sep 2021
  [63, 660], // Dec 2021 - peak ~$658-662
  [66, 432], // Mar 2022 - macro downturn
  [69, 395],
  [72, 300], // Sep 2022
  [75, 348], // Dec 2022 - $330-$360 range
  [78, 330],
  [81, 390],
  [84, 552], // Sep 2023
  [88, 627], // early 2024 - AI transition peak
  [92, 512],
  [96, 428], // Sep 2024 - pulling back
  [100, 385],
  [104, 312],
  [108, 296], // Sep 2025 - recent correction
  [112, 268],
  [116, 252],
  [120, 238.93], // Sep 2026 - current
];

const N_MONTHS = 121;

function buildSeries(): number[] {
  const out = new Array<number>(N_MONTHS);
  for (let i = 0; i < N_MONTHS; i++) {
    let a = 0;
    for (let k = 0; k < ANCHORS.length - 1; k++) {
      if (i >= ANCHORS[k][0] && i <= ANCHORS[k + 1][0]) {
        a = k;
        break;
      }
    }
    const i0 = ANCHORS[a][0];
    const p0 = ANCHORS[a][1];
    const i1 = ANCHORS[a + 1][0];
    const p1 = ANCHORS[a + 1][1];
    const t = i1 === i0 ? 0 : (i - i0) / (i1 - i0);
    const eased = 0.5 - 0.5 * Math.cos(t * Math.PI);
    out[i] = p0 + (p1 - p0) * eased;
  }
  return out;
}

const SERIES = buildSeries();

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------
const xForIndex = (i: number) => PLOT_LEFT + (i / (N_MONTHS - 1)) * PLOT_WIDTH;
const yForPrice = (p: number) =>
  PLOT_BOTTOM - ((p - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * PLOT_HEIGHT;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const monthLabel = (i: number) => {
  const m = (8 + i) % 12;
  const y = 2016 + Math.floor((8 + i) / 12);
  return `${MONTHS[m]} ${y}`;
};

// ---------------------------------------------------------------------------
// Phase callouts (appear as the drawing cursor passes their x position)
// ---------------------------------------------------------------------------
interface Phase {
  i: number;
  title: string;
  sub: string;
  color: string;
  dx: number;
  dy: number;
  anchor: 'start' | 'end';
}
const PHASES: Phase[] = [
  {i: 5, title: 'Cloud Momentum', sub: 'Subscription shift takes hold', color: UP, dx: 24, dy: -118, anchor: 'start'},
  {i: 34, title: 'Creative Cloud', sub: 'Adoption accelerates past $250', color: UP, dx: 0, dy: 132, anchor: 'middle'},
  {i: 61, title: 'Pandemic Boom', sub: 'Peak ~ $660 - late 2021', color: WARN, dx: 0, dy: -128, anchor: 'middle'},
  {i: 71, title: 'Macro Downturn', sub: 'Retreats to $330-$360 - 2022', color: DOWN, dx: 0, dy: 150, anchor: 'middle'},
  {i: 87, title: 'AI Transition', sub: '~ $627 by early 2024', color: WARN, dx: 0, dy: -128, anchor: 'middle'},
  {i: 111, title: 'Recent Correction', sub: 'Revenue up, multiple down', color: DOWN, dx: -26, dy: 150, anchor: 'end'},
];

// ---------------------------------------------------------------------------
// Stat cards
// ---------------------------------------------------------------------------
interface Stat {
  label: string;
  value: string;
  sub: string;
  color: string;
}
const STATS: Stat[] = [
  {
    label: 'MARKET CAP',
    value: '~$93B',
    sub: '2016: $51.8B   |   2021 peak: $322B',
    color: '#E8EDF6',
  },
  {
    label: 'EPS (TTM)',
    value: '$17.92',
    sub: 'up from ~$3.38 in 2017',
    color: UP,
  },
  {
    label: 'P/E RATIO',
    value: '13.33x',
    sub: 'compressed from ~50x+ historical average',
    color: WARN,
  },
];

// ---------------------------------------------------------------------------
// Static SVG defs (gradients / clip paths / filters)
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={ADOBE_ORANGE} />
      <stop offset="45%" stopColor={ADOBE_RED} />
      <stop offset="100%" stopColor={'#D62246'} />
    </linearGradient>
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={ADOBE_RED} stopOpacity={0.32} />
      <stop offset="55%" stopColor={ADOBE_RED} stopOpacity={0.08} />
      <stop offset="100%" stopColor={ADOBE_RED} stopOpacity={0} />
    </linearGradient>
    <radialGradient id="bgGlow" cx="50%" cy="38%" r="72%">
      <stop offset="0%" stopColor={'rgba(250,15,0,0.10)'} />
      <stop offset="55%" stopColor={'rgba(250,15,0,0.03)'} />
      <stop offset="100%" stopColor={'rgba(7,9,15,0)'} />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stopColor={'rgba(7,9,15,0)'} />
      <stop offset="100%" stopColor={'rgba(2,3,6,0.72)'} />
    </radialGradient>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="9" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Chart: grid, axes, area fill, self-drawing line, cursor + tooltip
// ---------------------------------------------------------------------------
interface ChartProps {
  frame: number;
  fps: number;
}
const PriceChart: React.FC<ChartProps> = ({frame, fps}) => {
  const draw = interpolate(
    frame,
    [DRAW_START, DRAW_END],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  const axesFade = interpolate(frame, [55, 115], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Full-geometry paths built once from the series.
  const {linePath, areaPath} = useMemo(() => {
    const lp = SERIES.map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${xForIndex(i).toFixed(1)} ${yForPrice(p).toFixed(1)}`
    ).join(' ');
    const ap = `${lp} L ${xForIndex(N_MONTHS - 1).toFixed(1)} ${PLOT_BOTTOM} L ${xForIndex(
      0
    ).toFixed(1)} ${PLOT_BOTTOM} Z`;
    return {linePath: lp, areaPath: ap};
  }, []);

  // Fractional drawing front + cursor position.
  const front = draw * (N_MONTHS - 1);
  const i0 = Math.min(N_MONTHS - 2, Math.floor(front));
  const frac = front - i0;
  const cx = xForIndex(i0) + (xForIndex(i0 + 1) - xForIndex(i0)) * frac;
  const cy = yForPrice(SERIES[i0] + (SERIES[i0 + 1] - SERIES[i0]) * frac);
  const cursorPrice = SERIES[i0] + (SERIES[i0 + 1] - SERIES[i0]) * frac;

  const cursorVisible = draw > 0.004 && draw < 0.995;

  // Tooltip flips to the left side near the right plot edge.
  const flip = cx > PLOT_RIGHT - 560;
  const tx = flip ? cx - 26 : cx + 26;
  const anchor = flip ? 'end' : 'start';
  const priceStr = `$${cursorPrice.toFixed(2)}`;

  return (
    <svg
      width={3840}
      height={2160}
      style={{position: 'absolute', top: 0, left: 0}}
    >
      <Defs />

      {/* horizontal price gridlines + y labels */}
      <g opacity={axesFade}>
        {PRICE_TICKS.map((p) => (
          <g key={`g${p}`}>
            <line
              x1={PLOT_LEFT}
              y1={yForPrice(p)}
              x2={PLOT_RIGHT}
              y2={yForPrice(p)}
              stroke={GRID_COLOR}
              strokeWidth={1.5}
            />
            <text
              x={PLOT_LEFT - 28}
              y={yForPrice(p) + 14}
              fill={MUTED}
              fontSize={30}
              fontFamily={MONO}
              textAnchor="end"
            >
              ${p}
            </text>
          </g>
        ))}
      </g>

      {/* x year labels (Sep of each year) */}
      <g opacity={axesFade}>
        {SERIES.map((_, i) => {
          if (i % 12 !== 0) return null;
          const year = 2016 + i / 12;
          return (
            <g key={`x${i}`}>
              <line
                x1={xForIndex(i)}
                y1={PLOT_BOTTOM}
                x2={xForIndex(i)}
                y2={PLOT_BOTTOM + 16}
                stroke={AXIS_COLOR}
                strokeWidth={1.5}
              />
              <text
                x={xForIndex(i)}
                y={PLOT_BOTTOM + 62}
                fill={MUTED}
                fontSize={30}
                fontFamily={MONO}
                textAnchor="middle"
              >
                {year}
              </text>
            </g>
          );
        })}
      </g>

      {/* axis baselines */}
      <line
        x1={PLOT_LEFT}
        y1={PLOT_BOTTOM}
        x2={PLOT_RIGHT}
        y2={PLOT_BOTTOM}
        stroke={AXIS_COLOR}
        strokeWidth={2}
        opacity={axesFade}
      />
      <line
        x1={PLOT_LEFT}
        y1={PLOT_TOP}
        x2={PLOT_LEFT}
        y2={PLOT_BOTTOM}
        stroke={AXIS_COLOR}
        strokeWidth={2}
        opacity={axesFade}
      />

      {/* area fill, clipped to the drawn portion */}
      <g clipPath="url(#drawClip)">
        <path d={areaPath} fill="url(#areaGrad)" />
      </g>
      <clipPath id="drawClip">
        <rect
          x={PLOT_LEFT - 4}
          y={PLOT_TOP - 60}
          width={draw * PLOT_WIDTH + 8}
          height={PLOT_HEIGHT + 68}
        />
      </clipPath>

      {/* the self-drawing price line */}
      <path
        d={linePath}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
        style={{filter: 'drop-shadow(0 0 14px rgba(250,15,0,0.55))'}}
      />

      {/* phase callouts */}
      {PHASES.map((ph) => {
        const appear = DRAW_START + (ph.i / (N_MONTHS - 1)) * (DRAW_END - DRAW_START);
        const s = spring({
          frame: frame - appear,
          fps,
          config: {damping: 200, stiffness: 90, mass: 1},
        });
        if (s <= 0.001) return null;
        const px = xForIndex(ph.i);
        const py = yForPrice(SERIES[ph.i]);
        const ox = px + ph.dx;
        const oy = py + ph.dy;
        return (
          <g key={`ph${ph.i}`} opacity={Math.min(1, s)}>
            <g transform={`translate(0, ${(1 - s) * 22})`}>
              <line
                x1={px}
                y1={py}
                x2={ox}
                y2={oy + (ph.dy < 0 ? 22 : -22)}
                stroke={ph.color}
                strokeWidth={2}
                opacity={0.6}
              />
              <circle cx={px} cy={py} r={8} fill={ph.color} opacity={0.9} />
              <circle
                cx={px}
                cy={py}
                r={16}
                fill="none"
                stroke={ph.color}
                strokeWidth={2}
                opacity={0.4}
              />
              <text
                x={ox}
                y={oy}
                fill={ph.color}
                fontSize={38}
                fontFamily={FONT}
                fontWeight={700}
                textAnchor={ph.anchor}
                style={{filter: `drop-shadow(0 0 8px ${ph.color}66)`}}
              >
                {ph.title}
              </text>
              <text
                x={ox}
                y={oy + 42}
                fill={MUTED}
                fontSize={27}
                fontFamily={FONT}
                textAnchor={ph.anchor}
              >
                {ph.sub}
              </text>
            </g>
          </g>
        );
      })}

      {/* live cursor + readout */}
      {cursorVisible && (
        <g>
          <circle cx={cx} cy={cy} r={26} fill={ADOBE_RED} opacity={0.18} />
          <circle
            cx={cx}
            cy={cy}
            r={11}
            fill="#FFFFFF"
            style={{filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.9))'}}
          />
          <g transform={`translate(${tx}, ${cy - 34})`}>
            <rect
              x={anchor === 'start' ? 0 : -250}
              y={-34}
              width={250}
              height={86}
              rx={14}
              fill={'rgba(10,14,24,0.88)'}
              stroke={'rgba(250,15,0,0.5)'}
              strokeWidth={1.5}
            />
            <text
              x={anchor === 'start' ? 20 : -230}
              y={4}
              fill={MUTED}
              fontSize={24}
              fontFamily={MONO}
            >
              {monthLabel(Math.round(front))}
            </text>
            <text
              x={anchor === 'start' ? 20 : -230}
              y={40}
              fill={INK}
              fontSize={36}
              fontFamily={MONO}
              fontWeight={700}
            >
              {priceStr}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, 45], [28, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 96 + rise,
        left: PLOT_LEFT,
        right: 3840 - PLOT_RIGHT,
        opacity: fade,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 28,
        }}
      >
        <span
          style={{
            color: INK,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 84,
            letterSpacing: -1,
          }}
        >
          ADOBE INC.
        </span>
        <span
          style={{
            color: ADOBE_RED,
            fontFamily: MONO,
            fontSize: 38,
            fontWeight: 700,
            border: `2px solid ${ADOBE_RED}`,
            borderRadius: 10,
            padding: '6px 18px',
          }}
        >
          NASDAQ: ADBE
        </span>
      </div>
      <div
        style={{
          color: MUTED,
          fontFamily: FONT,
          fontSize: 36,
          marginTop: 14,
        }}
      >
        10-Year Price Trajectory &middot; Sep 2016 &ndash; Sep 2026
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Final price HUD (appears once the line completes)
// ---------------------------------------------------------------------------
const CurrentPriceHud: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - (DRAW_END - 15),
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin((frame - DRAW_END) * 0.09);
  return (
    <div
      style={{
        position: 'absolute',
        top: 118,
        right: 300,
        textAlign: 'right',
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 30}px) scale(${0.92 + s * 0.08})`,
        transformOrigin: 'right center',
      }}
    >
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 30}}>Current price</div>
      <div
        style={{
          color: INK,
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: 92,
          lineHeight: 1.05,
          textShadow: `0 0 34px rgba(250,15,0,${0.25 + pulse * 0.35})`,
        }}
      >
        $238.93
      </div>
      <div style={{color: DOWN, fontFamily: FONT, fontSize: 30, marginTop: 6}}>
        late September 2026 &middot; &#8722;63.8% from 2021 peak
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Dashed "now" reference line at the final price
// ---------------------------------------------------------------------------
const NowLine: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [DRAW_END - 10, DRAW_END + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (fade <= 0) return null;
  const y = yForPrice(238.93);
  return (
    <svg
      width={3840}
      height={2160}
      style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}
    >
      <g opacity={fade}>
        <line
          x1={PLOT_LEFT}
          y1={y}
          x2={PLOT_RIGHT}
          y2={y}
          stroke={DOWN}
          strokeWidth={2.5}
          strokeDasharray="14 16"
          opacity={0.65}
        />
        <text
          x={PLOT_LEFT + 18}
          y={y - 16}
          fill={DOWN}
          fontSize={28}
          fontFamily={MONO}
          fontWeight={700}
        >
          NOW $238.93
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Stat cards row
// ---------------------------------------------------------------------------
const StatCards: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const cardW = 980;
  const gap = 60;
  const totalW = STATS.length * cardW + (STATS.length - 1) * gap;
  const startX = (3840 - totalW) / 2;
  const y = 1770;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: y,
        width: 3840,
        height: 300,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{display: 'flex', gap}}>
        {STATS.map((st, k) => {
          const s = spring({
            frame: frame - (STATS_START + k * 22),
            fps,
            config: {damping: 200, stiffness: 95},
          });
          return (
            <div
              key={st.label}
              style={{
                width: cardW,
                height: 260,
                borderRadius: 24,
                background:
                  'linear-gradient(160deg, rgba(250,15,0,0.10), rgba(250,15,0,0.02) 60%, rgba(255,255,255,0.02))',
                border: '1.5px solid rgba(250,15,0,0.28)',
                backdropFilter: 'blur(4px)',
                padding: '34px 44px',
                opacity: Math.min(1, s),
                transform: `translateY(${(1 - s) * 46}px)`,
              }}
            >
              <div
                style={{
                  color: MUTED,
                  fontFamily: MONO,
                  fontSize: 28,
                  letterSpacing: 2,
                }}
              >
                {st.label}
              </div>
              <div
                style={{
                  color: st.color,
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: 84,
                  lineHeight: 1.1,
                  marginTop: 12,
                  textShadow: `0 0 22px ${st.color}44`,
                }}
              >
                {st.value}
              </div>
              <div
                style={{
                  color: MUTED,
                  fontFamily: FONT,
                  fontSize: 27,
                  marginTop: 14,
                }}
              >
                {st.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Footer note
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [STATS_START + 120, STATS_START + 170], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 52,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: 'rgba(148,163,184,0.55)',
        fontFamily: FONT,
        fontSize: 26,
        opacity: fade,
      }}
    >
      Prices indicative (monthly close basis). Financial milestones: market cap,
      EPS (TTM) and P/E as of late September 2026.
    </div>
  );
};

// ---------------------------------------------------------------------------
// Background (glow + vignette + faint grid + scan sweep)
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 1260) * (2160 + 240)) % (2160 + 240) - 120;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 34%, rgba(250,15,0,0.10), rgba(250,15,0,0.03) 45%, rgba(7,9,15,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
        <rect
          x={0}
          y={scanY - 90}
          width={3840}
          height={180}
          fill="rgba(250,15,0,0.035)"
        />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const AdobeStockTrajectory: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <CurrentPriceHud frame={frame} fps={fps} />
      <PriceChart frame={frame} fps={fps} />
      <NowLine frame={frame} />
      <StatCards frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default AdobeStockTrajectory;
