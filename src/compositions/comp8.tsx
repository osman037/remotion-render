/**
 * FinOpsCloudDashboard.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * "FinOps Cloud Cost Control Dashboard": unit cost trend, AI-spend breakout,
 * anomaly detection alert, and forecast-vs-budget grouped bars, with KPI cards.
 *
 * Register in Root.tsx:
 *   <Composition id="FinOpsCloudDashboard" component={FinOpsCloudDashboard}
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

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const BG = '#0A0E14';
const INK = '#E9EEF6';
const MUTED = 'rgba(203,213,225,0.62)';
const FAINT = 'rgba(203,213,225,0.34)';
const CARD = 'rgba(17,24,38,0.78)';
const CARD_EDGE = 'rgba(148,163,184,0.22)';
const HAIRLINE = 'rgba(148,163,184,0.14)';
const GRID = 'rgba(148,163,184,0.10)';
const AXIS = 'rgba(148,163,184,0.55)';
const EMERALD = '#34D399';
const AMBER = '#FBBF24';
const RED = '#F87171';
const CYAN = '#22D3EE';
const VIOLET = '#A78BFA';
const SLATE = '#94A3B8';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Deterministic seeded random (never Math.random)
// ---------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Data: unit cost ($/1K requests), 12 months, declining 0.58 -> 0.42
// ---------------------------------------------------------------------------
const MONTHS = [
  'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR',
  'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP',
];

const UNIT_COST: number[] = (() => {
  const rnd = mulberry32(20260926);
  const out: number[] = [];
  for (let i = 0; i < 12; i++) {
    const base = 0.58 + (i / 11) * (0.42 - 0.58);
    out.push(base + (rnd() - 0.5) * 0.028);
  }
  out[11] = 0.42; // pin the endpoint exactly
  return out;
})();

// ---------------------------------------------------------------------------
// Data: AI-spend breakout stacked areas ($M/month): compute / ai / saas
// ---------------------------------------------------------------------------
interface BreakoutPoint {
  compute: number;
  ai: number;
  saas: number;
}
const BREAKOUT: BreakoutPoint[] = (() => {
  const rnd = mulberry32(777);
  const out: BreakoutPoint[] = [];
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    out.push({
      compute: 0.55 - t * 0.08 + (rnd() - 0.5) * 0.02,
      ai: 0.18 + t * 0.32 + (rnd() - 0.5) * 0.025,
      saas: 0.24 + t * 0.04 + (rnd() - 0.5) * 0.015,
    });
  }
  return out;
})();

// ---------------------------------------------------------------------------
// Data: forecast vs budget ($M) per quarter
// ---------------------------------------------------------------------------
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const FORECAST = [0.52, 0.58, 0.66, 0.65];
const BUDGET = [0.6, 0.6, 0.68, 0.68];

// ---------------------------------------------------------------------------
// Data: anomaly sparkline (28 points, spike near 2/3)
// ---------------------------------------------------------------------------
const SPARK: number[] = (() => {
  const rnd = mulberry32(1042);
  const out: number[] = [];
  for (let i = 0; i < 28; i++) {
    let v = 0.14 + (rnd() - 0.5) * 0.07;
    if (i >= 17 && i <= 21) {
      const peak = 1 - Math.abs(i - 19) / 2.4;
      v = 0.2 + Math.max(0, peak) * 0.78;
    }
    out.push(v);
  }
  return out;
})();

// ---------------------------------------------------------------------------
// Shared background defs
// ---------------------------------------------------------------------------
const BgDefs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlowFin" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stopColor="rgba(52,211,153,0.10)" />
      <stop offset="45%" stopColor="rgba(34,211,238,0.035)" />
      <stop offset="100%" stopColor="rgba(10,14,20,0)" />
    </radialGradient>
    <radialGradient id="vignetteFin" cx="50%" cy="50%" r="78%">
      <stop offset="58%" stopColor="rgba(10,14,20,0)" />
      <stop offset="100%" stopColor="rgba(3,5,8,0.78)" />
    </radialGradient>
    <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="rgba(52,211,153,0)" />
      <stop offset="50%" stopColor="rgba(52,211,153,0.10)" />
      <stop offset="100%" stopColor="rgba(52,211,153,0)" />
    </linearGradient>
    <linearGradient id="lineGradFin" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={CYAN} />
      <stop offset="100%" stopColor={EMERALD} />
    </linearGradient>
    <linearGradient id="areaGradFin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={EMERALD} stopOpacity={0.30} />
      <stop offset="60%" stopColor={EMERALD} stopOpacity={0.07} />
      <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
    </linearGradient>
    <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={VIOLET} stopOpacity={0.55} />
      <stop offset="100%" stopColor={VIOLET} stopOpacity={0.12} />
    </linearGradient>
    <linearGradient id="computeGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={CYAN} stopOpacity={0.50} />
      <stop offset="100%" stopColor={CYAN} stopOpacity={0.10} />
    </linearGradient>
    <linearGradient id="saasGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={SLATE} stopOpacity={0.45} />
      <stop offset="100%" stopColor={SLATE} stopOpacity={0.10} />
    </linearGradient>
    <filter id="softGlowFin" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="redGlowFin" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <pattern id="dotGridFin" width="72" height="72" patternUnits="userSpaceOnUse">
      <circle cx="36" cy="36" r="2.2" fill="rgba(148,163,184,0.16)" />
    </pattern>
  </defs>
);

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface RiseProps {
  frame: number;
  fps: number;
  start: number;
  children: React.ReactNode;
}
const Rise: React.FC<RiseProps> = ({frame, fps, start, children}) => {
  const s = spring({
    frame: frame - start,
    fps,
    config: {damping: 200, stiffness: 90, mass: 1},
  });
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - Math.min(1, s)) * 44}px)`,
        position: 'absolute',
        inset: 0,
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------
interface KpiProps {
  frame: number;
  fps: number;
  start: number;
  x: number;
  label: string;
  sub: string;
  subColor: string;
  valueNode: React.ReactNode;
  extra?: React.ReactNode;
}
const KpiCard: React.FC<KpiProps> = ({
  frame,
  fps,
  start,
  x,
  label,
  sub,
  subColor,
  valueNode,
  extra,
}) => (
  <Rise frame={frame} fps={fps} start={start}>
    <div
      style={{
        position: 'absolute',
        left: x,
        top: 380,
        width: 820,
        height: 300,
        background: CARD,
        border: `1.5px solid ${CARD_EDGE}`,
        borderRadius: 26,
        padding: '40px 48px',
        boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 28,
          letterSpacing: 5,
          color: MUTED,
        }}
      >
        {label}
      </div>
      <div style={{marginTop: 34, display: 'flex', alignItems: 'center'}}>
        {valueNode}
        {extra}
      </div>
      <div
        style={{
          marginTop: 26,
          fontFamily: MONO,
          fontSize: 30,
          color: subColor,
        }}
      >
        {sub}
      </div>
    </div>
  </Rise>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const FinOpsCloudDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // ---- Title (0-60) ----
  const titleS = spring({
    frame,
    fps,
    config: {damping: 200, stiffness: 90, mass: 1},
  });
  const titleFade = interpolate(frame, [0, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const badgeFade = interpolate(frame, [40, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ---- KPI count-ups (finalize in payoff 650-780) ----
  const spendT = easeOutCubic(
    interpolate(frame, [120, 620], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const aiShareT = easeOutCubic(
    interpolate(frame, [140, 600], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const unitT = easeOutCubic(
    interpolate(frame, [160, 640], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const budgetT = easeOutCubic(
    interpolate(frame, [180, 660], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const deltaGlow = interpolate(frame, [650, 780], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ---- Background: scan sweep + resolve breathing ----
  const sweepX = interpolate(frame, [0, 900], [-1400, 4300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const breathe = interpolate(frame, [780, 900], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const breatheGlow =
    0.05 + 0.035 * Math.sin(((frame - 780) / 120) * Math.PI * 2);

  // ---- Anomaly alert ----
  const anomalyS = spring({
    frame: frame - 420,
    fps,
    config: {damping: 200, stiffness: 90, mass: 1},
  });
  const pulseEnvelope = interpolate(frame, [450, 650], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulseFade = interpolate(frame, [650, 720], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulse =
    pulseEnvelope * pulseFade * (0.45 + 0.35 * Math.sin(frame * 0.18));
  const ackS = spring({
    frame: frame - 650,
    fps,
    config: {damping: 200, stiffness: 90, mass: 1},
  });

  // ---- Footer ----
  const footerFade = interpolate(frame, [680, 760], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ================= UNIT COST CHART =================
  const U_LEFT = 300;
  const U_RIGHT = 1810;
  const U_TOP = 940;
  const U_BOTTOM = 1390;
  const U_W = U_RIGHT - U_LEFT;
  const U_H = U_BOTTOM - U_TOP;
  const U_MIN = 0.34;
  const U_MAX = 0.64;
  const uX = (i: number) => U_LEFT + (i / 11) * U_W;
  const uY = (v: number) =>
    U_BOTTOM - ((v - U_MIN) / (U_MAX - U_MIN)) * U_H;
  const U_TICKS = [0.4, 0.45, 0.5, 0.55, 0.6];

  const unitDraw = interpolate(frame, [150, 550], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const unitAxes = interpolate(frame, [150, 210], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const {unitLine, unitArea} = useMemo(() => {
    const lp = UNIT_COST.map(
      (v, i) =>
        `${i === 0 ? 'M' : 'L'} ${uX(i).toFixed(1)} ${uY(v).toFixed(1)}`
    ).join(' ');
    const ap = `${lp} L ${U_RIGHT.toFixed(1)} ${U_BOTTOM} L ${U_LEFT.toFixed(
      1
    )} ${U_BOTTOM} Z`;
    return {unitLine: lp, unitArea: ap};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const front = unitDraw * 11;
  const fi = Math.min(10, Math.floor(front));
  const ff = front - fi;
  const curX = uX(fi) + (uX(fi + 1) - uX(fi)) * ff;
  const curY =
    uY(UNIT_COST[fi]) + (uY(UNIT_COST[fi + 1]) - uY(UNIT_COST[fi])) * ff;
  const cursorVisible = unitDraw > 0.004 && unitDraw < 0.995;
  const calloutS = spring({
    frame: frame - 560,
    fps,
    config: {damping: 200, stiffness: 90, mass: 1},
  });

  // ================= STACKED BREAKOUT CHART =================
  const S_LEFT = 2140;
  const S_RIGHT = 3600;
  const S_TOP = 940;
  const S_BOTTOM = 1390;
  const S_W = S_RIGHT - S_LEFT;
  const S_H = S_BOTTOM - S_TOP;
  const S_MIN = 0.8;
  const S_MAX = 1.38;
  const sX = (i: number) => S_LEFT + (i / 11) * S_W;
  const sY = (v: number) =>
    S_BOTTOM - ((v - S_MIN) / (S_MAX - S_MIN)) * S_H;
  const S_TICKS = [0.8, 1.0, 1.2];

  const stackDraw = interpolate(frame, [200, 600], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stackAxes = interpolate(frame, [200, 260], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const legendFade = interpolate(frame, [320, 400], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const stackPaths = useMemo(() => {
    const cumA = BREAKOUT.map((p) => p.compute);
    const cumB = BREAKOUT.map((p) => p.compute + p.ai);
    const cumC = BREAKOUT.map((p) => p.compute + p.ai + p.saas);
    const topOf = (arr: number[], i: number) =>
      `${i === 0 ? 'M' : 'L'} ${sX(i).toFixed(1)} ${sY(arr[i]).toFixed(1)}`;
    const computePath =
      cumA.map((_, i) => topOf(cumA, i)).join(' ') +
      ` L ${S_RIGHT.toFixed(1)} ${S_BOTTOM} L ${S_LEFT.toFixed(1)} ${S_BOTTOM} Z`;
    const aiPath =
      cumB.map((_, i) => topOf(cumB, i)).join(' ') +
      cumA
        .map((_, i) => `L ${sX(11 - i).toFixed(1)} ${sY(cumA[11 - i]).toFixed(1)}`)
        .join(' ') +
      ' Z';
    const saasPath =
      cumC.map((_, i) => topOf(cumC, i)).join(' ') +
      cumB
        .map((_, i) => `L ${sX(11 - i).toFixed(1)} ${sY(cumB[11 - i]).toFixed(1)}`)
        .join(' ') +
      ' Z';
    const totalLine = cumC
      .map((_, i) => topOf(cumC, i))
      .join(' ');
    return {computePath, aiPath, saasPath, totalLine};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ ANOMALY SPARKLINE (local coords inside the card's SVG) ============
  // SVG is 1644x150; x runs 52 -> 1602, y = 118 - v*100 (baseline ~104, spike ~20)
  const lx = (i: number) => 52 + (i / 27) * 1550;
  const ly = (v: number) => 118 - v * 100;
  const sparkLocalPath = SPARK.map(
    (v, i) => `${i === 0 ? 'M' : 'L'} ${lx(i).toFixed(1)} ${ly(v).toFixed(1)}`
  ).join(' ');
  const spikeLocalSeg = SPARK.map((v, i) => ({v, i}))
    .filter((p) => p.i >= 15 && p.i <= 23)
    .map((p, j) => `${j === 0 ? 'M' : 'L'} ${lx(p.i).toFixed(1)} ${ly(p.v).toFixed(1)}`)
    .join(' ');
  const peakIdx = SPARK.reduce((best, v, i) => (v > SPARK[best] ? i : best), 0);
  const peakLX = lx(peakIdx);
  const peakLY = ly(SPARK[peakIdx]);
  const baseLY = ly(0.14);
  const sparkDraw = interpolate(frame, [470, 620], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ================= FORECAST BARS =================
  const B_BASE = 1810;
  const B_MAXV = 0.8;
  const bH = (v: number) => (v / B_MAXV) * 130;
  const groupCX = (i: number) => 2140 + 182.5 + i * 365;

  // ---- Donut geometry (AI share) ----
  const RING_R = 50;
  const RING_C = 2 * Math.PI * RING_R;

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
      {/* ================= BACKGROUND ================= */}
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0}}
      >
        <BgDefs />
        <rect x={0} y={0} width={3840} height={2160} fill={BG} />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#bgGlowFin)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#dotGridFin)" opacity={0.5} />
        {/* slow scan sweep */}
        <g transform={`translate(${sweepX.toFixed(1)}, 0) skewX(-12)`}>
          <rect x={0} y={-200} width={640} height={2560} fill="url(#sweepGrad)" />
        </g>
        {/* resolve-phase breathing glow */}
        <rect
          x={0}
          y={0}
          width={3840}
          height={2160}
          fill={EMERALD}
          opacity={breathe * breatheGlow}
        />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignetteFin)" />
      </svg>

      {/* ================= TITLE ================= */}
      <div
        style={{
          position: 'absolute',
          left: 160,
          top: 150,
          opacity: titleFade,
          transform: `translateY(${(1 - Math.min(1, titleS)) * 36}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 84,
            letterSpacing: 3,
            color: INK,
            textShadow: '0 0 44px rgba(52,211,153,0.28)',
          }}
        >
          FINOPS · CLOUD COST CONTROL
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: FONT,
            fontSize: 34,
            letterSpacing: 2,
            color: MUTED,
          }}
        >
          unit economics · anomaly detection · forecast vs budget
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 160,
          top: 190,
          opacity: badgeFade,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: EMERALD,
            boxShadow: '0 0 18px rgba(52,211,153,0.9)',
          }}
        />
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: MUTED}}>
          LIVE · SEP 2026
        </div>
      </div>

      {/* ================= KPI CARDS ================= */}
      <KpiCard
        frame={frame}
        fps={fps}
        start={60}
        x={160}
        label="TOTAL CLOUD SPEND"
        sub={`▼ ${(4.2).toFixed(1)}% vs forecast`}
        subColor={deltaGlow > 0.5 ? EMERALD : 'rgba(52,211,153,0.75)'}
        valueNode={
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 108,
              color: INK,
              textShadow: `0 0 ${26 + deltaGlow * 22}px rgba(52,211,153,${
                0.3 + deltaGlow * 0.35
              })`,
            }}
          >
            ${(2.41 * spendT).toFixed(2)}M
          </div>
        }
      />
      <KpiCard
        frame={frame}
        fps={fps}
        start={100}
        x={1060}
        label="AI SPEND SHARE"
        sub="of total cloud bill"
        subColor={MUTED}
        valueNode={
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 108,
              color: INK,
              textShadow: '0 0 26px rgba(167,139,250,0.4)',
            }}
          >
            {Math.round(31 * aiShareT)}%
          </div>
        }
        extra={
          <svg width={170} height={170} style={{marginLeft: 44}}>
            <circle
              cx={85}
              cy={85}
              r={RING_R}
              fill="none"
              stroke="rgba(148,163,184,0.18)"
              strokeWidth={20}
            />
            <circle
              cx={85}
              cy={85}
              r={RING_R}
              fill="none"
              stroke={VIOLET}
              strokeWidth={20}
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - aiShareT * 0.31)}
              transform="rotate(-90 85 85)"
              style={{filter: 'drop-shadow(0 0 10px rgba(167,139,250,0.7))'}}
            />
          </svg>
        }
      />
      <KpiCard
        frame={frame}
        fps={fps}
        start={140}
        x={1960}
        label="UNIT COST"
        sub={`▼ 18% QoQ`}
        subColor={deltaGlow > 0.5 ? EMERALD : 'rgba(52,211,153,0.75)'}
        valueNode={
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 108,
              color: INK,
              textShadow: `0 0 ${26 + deltaGlow * 22}px rgba(34,211,238,${
                0.3 + deltaGlow * 0.35
              })`,
            }}
          >
            ${(0.42 * unitT).toFixed(2)}
            <span
              style={{fontSize: 44, fontWeight: 600, color: MUTED, marginLeft: 14}}
            >
              / 1K req
            </span>
          </div>
        }
      />
      <KpiCard
        frame={frame}
        fps={fps}
        start={180}
        x={2860}
        label="BUDGET USED"
        sub="of $3.26M annual budget"
        subColor={MUTED}
        valueNode={
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 108,
              color: INK,
              textShadow: '0 0 26px rgba(251,191,36,0.32)',
            }}
          >
            {Math.round(74 * budgetT)}%
          </div>
        }
        extra={
          <div style={{position: 'absolute', left: 48, right: 48, bottom: 84}}>
            <div
              style={{
                height: 18,
                borderRadius: 9,
                background: 'rgba(148,163,184,0.16)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${74 * budgetT}%`,
                  height: '100%',
                  borderRadius: 9,
                  background: `linear-gradient(90deg, ${EMERALD}, ${CYAN})`,
                  boxShadow: '0 0 16px rgba(52,211,153,0.6)',
                }}
              />
            </div>
          </div>
        }
      />

      {/* ================= PANEL FRAMES ================= */}
      {/* Unit cost panel */}
      <Rise frame={frame} fps={fps} start={120}>
        <div
          style={{
            position: 'absolute',
            left: 160,
            top: 780,
            width: 1740,
            height: 720,
            background: CARD,
            border: `1.5px solid ${CARD_EDGE}`,
            borderRadius: 26,
            boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
          }}
        />
      </Rise>
      {/* Stacked breakout panel */}
      <Rise frame={frame} fps={fps} start={160}>
        <div
          style={{
            position: 'absolute',
            left: 2020,
            top: 780,
            width: 1660,
            height: 720,
            background: CARD,
            border: `1.5px solid ${CARD_EDGE}`,
            borderRadius: 26,
            boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
          }}
        />
      </Rise>
      {/* Forecast panel */}
      <Rise frame={frame} fps={fps} start={460}>
        <div
          style={{
            position: 'absolute',
            left: 2020,
            top: 1560,
            width: 1660,
            height: 340,
            background: CARD,
            border: `1.5px solid ${CARD_EDGE}`,
            borderRadius: 26,
            boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
          }}
        />
      </Rise>

      {/* Panel headers */}
      <div
        style={{
          position: 'absolute',
          left: 210,
          top: 826,
          opacity: unitAxes,
          display: 'flex',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 5, color: INK}}>
          UNIT COST TREND
        </div>
        <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: FAINT}}>
          blended · $ / 1K requests
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 2070,
          top: 826,
          opacity: stackAxes,
          display: 'flex',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 5, color: INK}}>
          AI-SPEND BREAKOUT
        </div>
        <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: FAINT}}>
          $M / month
        </div>
      </div>
      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          right: 210,
          top: 820,
          opacity: legendFade,
          display: 'flex',
          gap: 40,
          alignItems: 'center',
        }}
      >
        {[
          {c: CYAN, t: 'COMPUTE'},
          {c: VIOLET, t: 'AI / ML'},
          {c: SLATE, t: 'SAAS'},
        ].map((l) => (
          <div key={l.t} style={{display: 'flex', alignItems: 'center', gap: 14}}>
            <div
              style={{
                width: 30,
                height: 18,
                borderRadius: 6,
                background: l.c,
                boxShadow: `0 0 12px ${l.c}88`,
              }}
            />
            <div style={{fontFamily: MONO, fontSize: 26, letterSpacing: 3, color: MUTED}}>
              {l.t}
            </div>
          </div>
        ))}
      </div>

      {/* ================= UNIT COST CHART SVG ================= */}
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0}}
      >
        <BgDefs />
        {/* y gridlines + labels */}
        <g opacity={unitAxes}>
          {U_TICKS.map((v) => (
            <g key={`u${v}`}>
              <line
                x1={U_LEFT}
                y1={uY(v)}
                x2={U_RIGHT}
                y2={uY(v)}
                stroke={GRID}
                strokeWidth={1.5}
              />
              <text
                x={U_LEFT - 26}
                y={uY(v) + 10}
                fill={MUTED}
                fontSize={27}
                fontFamily={MONO}
                textAnchor="end"
              >
                ${v.toFixed(2)}
              </text>
            </g>
          ))}
          {/* target dashed line */}
          <line
            x1={U_LEFT}
            y1={uY(0.45)}
            x2={U_RIGHT}
            y2={uY(0.45)}
            stroke={AMBER}
            strokeWidth={2}
            strokeDasharray="14 12"
            opacity={0.55}
          />
          <text
            x={U_RIGHT - 14}
            y={uY(0.45) - 16}
            fill={AMBER}
            fontSize={26}
            fontFamily={MONO}
            textAnchor="end"
            opacity={0.9}
          >
            target $0.45
          </text>
        </g>
        {/* x month ticks */}
        <g opacity={unitAxes}>
          {MONTHS.map((m, i) => (
            <g key={`um${i}`}>
              <line
                x1={uX(i)}
                y1={U_BOTTOM}
                x2={uX(i)}
                y2={U_BOTTOM + 14}
                stroke={AXIS}
                strokeWidth={1.5}
              />
              <text
                x={uX(i)}
                y={U_BOTTOM + 56}
                fill={MUTED}
                fontSize={26}
                fontFamily={MONO}
                textAnchor="middle"
              >
                {m}
              </text>
            </g>
          ))}
        </g>
        <line
          x1={U_LEFT}
          y1={U_BOTTOM}
          x2={U_RIGHT}
          y2={U_BOTTOM}
          stroke={AXIS}
          strokeWidth={2}
          opacity={unitAxes}
        />
        <line
          x1={U_LEFT}
          y1={U_TOP}
          x2={U_LEFT}
          y2={U_BOTTOM}
          stroke={AXIS}
          strokeWidth={2}
          opacity={unitAxes}
        />

        {/* area fill clipped to drawn portion */}
        <g clipPath="url(#unitClip)">
          <path d={unitArea} fill="url(#areaGradFin)" />
        </g>
        <clipPath id="unitClip">
          <rect
            x={U_LEFT - 4}
            y={U_TOP - 70}
            width={unitDraw * U_W + 8}
            height={U_H + 78}
          />
        </clipPath>

        {/* self-drawing line */}
        <path
          d={unitLine}
          fill="none"
          stroke="url(#lineGradFin)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - unitDraw}
          style={{filter: 'drop-shadow(0 0 16px rgba(52,211,153,0.55))'}}
        />

        {/* live cursor */}
        {cursorVisible && (
          <g>
            <circle cx={curX} cy={curY} r={24} fill={EMERALD} opacity={0.2} />
            <circle
              cx={curX}
              cy={curY}
              r={10}
              fill="#FFFFFF"
              style={{filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.9))'}}
            />
          </g>
        )}

        {/* end callout */}
        {calloutS > 0.001 && (
          <g opacity={Math.min(1, calloutS)}>
            <g transform={`translate(0, ${(1 - Math.min(1, calloutS)) * 24})`}>
              <line
                x1={uX(11)}
                y1={uY(0.42)}
                x2={uX(11) + 130}
                y2={uY(0.42) - 110}
                stroke={EMERALD}
                strokeWidth={2.5}
                opacity={0.7}
              />
              <circle
                cx={uX(11)}
                cy={uY(0.42)}
                r={9}
                fill={EMERALD}
                style={{filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.8))'}}
              />
              <text
                x={uX(11) + 148}
                y={uY(0.42) - 100}
                fill={INK}
                fontSize={56}
                fontWeight={800}
                fontFamily={FONT}
                style={{filter: 'drop-shadow(0 0 14px rgba(52,211,153,0.6))'}}
              >
                $0.42
              </text>
              <text
                x={uX(11) + 148}
                y={uY(0.42) - 48}
                fill={MUTED}
                fontSize={28}
                fontFamily={MONO}
              >
                SEP 2026 · −28% YoY
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* ================= STACKED BREAKOUT SVG ================= */}
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0}}
      >
        {/* y gridlines + labels */}
        <g opacity={stackAxes}>
          {S_TICKS.map((v) => (
            <g key={`s${v}`}>
              <line
                x1={S_LEFT}
                y1={sY(v)}
                x2={S_RIGHT}
                y2={sY(v)}
                stroke={GRID}
                strokeWidth={1.5}
              />
              <text
                x={S_LEFT - 26}
                y={sY(v) + 10}
                fill={MUTED}
                fontSize={27}
                fontFamily={MONO}
                textAnchor="end"
              >
                ${v.toFixed(1)}M
              </text>
            </g>
          ))}
        </g>
        {/* x month ticks */}
        <g opacity={stackAxes}>
          {MONTHS.map((m, i) => (
            <g key={`sm${i}`}>
              <line
                x1={sX(i)}
                y1={S_BOTTOM}
                x2={sX(i)}
                y2={S_BOTTOM + 14}
                stroke={AXIS}
                strokeWidth={1.5}
              />
              <text
                x={sX(i)}
                y={S_BOTTOM + 56}
                fill={MUTED}
                fontSize={26}
                fontFamily={MONO}
                textAnchor="middle"
              >
                {m}
              </text>
            </g>
          ))}
        </g>
        <line
          x1={S_LEFT}
          y1={S_BOTTOM}
          x2={S_RIGHT}
          y2={S_BOTTOM}
          stroke={AXIS}
          strokeWidth={2}
          opacity={stackAxes}
        />
        <line
          x1={S_LEFT}
          y1={S_TOP}
          x2={S_LEFT}
          y2={S_BOTTOM}
          stroke={AXIS}
          strokeWidth={2}
          opacity={stackAxes}
        />

        {/* stacked areas, revealed left-to-right */}
        <g clipPath="url(#stackClip)">
          <path d={stackPaths.computePath} fill="url(#computeGrad)" />
          <path d={stackPaths.aiPath} fill="url(#aiGrad)" />
          <path d={stackPaths.saasPath} fill="url(#saasGrad)" />
          <path
            d={stackPaths.totalLine}
            fill="none"
            stroke={INK}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={0.85}
            style={{filter: 'drop-shadow(0 0 12px rgba(233,238,246,0.45))'}}
          />
        </g>
        <clipPath id="stackClip">
          <rect
            x={S_LEFT - 4}
            y={S_TOP - 70}
            width={stackDraw * S_W + 8}
            height={S_H + 78}
          />
        </clipPath>

        {/* end stack labels */}
        {stackDraw > 0.96 &&
          (() => {
            const cA = BREAKOUT[11].compute;
            const cB = cA + BREAKOUT[11].ai;
            const cC = cB + BREAKOUT[11].saas;
            return [
              {
                y: (sY(cA) + S_BOTTOM) / 2,
                label: `$${BREAKOUT[11].compute.toFixed(2)}M`,
                color: CYAN,
              },
              {
                y: (sY(cB) + sY(cA)) / 2,
                label: `$${BREAKOUT[11].ai.toFixed(2)}M`,
                color: VIOLET,
              },
              {
                y: (sY(cC) + sY(cB)) / 2,
                label: `$${BREAKOUT[11].saas.toFixed(2)}M`,
                color: SLATE,
              },
            ];
          })().map((l, i) => (
            <text
              key={`sl${i}`}
              x={S_RIGHT - 12}
              y={l.y + 10}
              fill={l.color}
              fontSize={30}
              fontWeight={700}
              fontFamily={MONO}
              textAnchor="end"
              opacity={interpolate(frame, [600, 680], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })}
            >
              {l.label}
            </text>
          ))}
      </svg>

      {/* ================= ANOMALY CARD ================= */}
      {anomalyS > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: 160,
            top: 1560,
            width: 1740,
            height: 340,
            opacity: Math.min(1, anomalyS),
            transform: `translateY(${(1 - Math.min(1, anomalyS)) * 44}px)`,
            background: CARD,
            border: `2px solid ${AMBER}`,
            borderRadius: 26,
            boxShadow: `0 18px 60px rgba(0,0,0,0.45), 0 0 ${
              28 + pulse * 60
            }px rgba(251,191,36,${0.25 + pulse * 0.45})`,
            padding: '36px 48px',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: '50%',
                background: 'rgba(251,191,36,0.14)',
                border: `3px solid ${AMBER}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 44,
                color: AMBER,
                fontWeight: 800,
                fontFamily: FONT,
                boxShadow: '0 0 22px rgba(251,191,36,0.55)',
              }}
            >
              !
            </div>
            <div>
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 46,
                  letterSpacing: 2,
                  color: AMBER,
                  textShadow: '0 0 24px rgba(251,191,36,0.5)',
                }}
              >
                ⚠ ANOMALY DETECTED
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: MONO,
                  fontSize: 30,
                  color: INK,
                }}
              >
                gpu-training spend <span style={{color: RED, fontWeight: 700}}>+212%</span>{' '}
                vs baseline
              </div>
            </div>
            <div style={{marginLeft: 'auto', display: 'flex', gap: 20, alignItems: 'center'}}>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 28,
                  color: MUTED,
                  border: `1.5px solid ${HAIRLINE}`,
                  borderRadius: 12,
                  padding: '10px 22px',
                }}
              >
                ticket FIN-1042 · owner: ml-platform
              </div>
              {ackS > 0.001 && (
                <div
                  style={{
                    opacity: Math.min(1, ackS),
                    transform: `scale(${0.7 + 0.3 * Math.min(1, ackS)})`,
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: 30,
                    letterSpacing: 2,
                    color: BG,
                    background: EMERALD,
                    borderRadius: 14,
                    padding: '14px 30px',
                    boxShadow: '0 0 26px rgba(52,211,153,0.65)',
                  }}
                >
                  ● ACKNOWLEDGED
                </div>
              )}
            </div>
          </div>
          {/* sparkline */}
          <svg
            width={1644}
            height={150}
            style={{position: 'absolute', left: 48, bottom: 26}}
          >
            <defs>
              <clipPath id="sparkClip">
                <rect x={0} y={0} width={1644 * sparkDraw} height={150} />
              </clipPath>
              <filter id="redGlowLocal" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="14" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g clipPath="url(#sparkClip)">
              <path
                d={sparkLocalPath}
                fill="none"
                stroke={SLATE}
                strokeWidth={4}
                opacity={0.85}
              />
              <path
                d={spikeLocalSeg}
                fill="none"
                stroke={RED}
                strokeWidth={7}
                strokeLinecap="round"
                filter="url(#redGlowLocal)"
              />
              <circle
                cx={peakLX}
                cy={peakLY}
                r={10}
                fill={RED}
                filter="url(#redGlowLocal)"
              />
            </g>
            <line
              x1={40}
              y1={baseLY}
              x2={1620}
              y2={baseLY}
              stroke={FAINT}
              strokeWidth={2}
              strokeDasharray="10 10"
              opacity={sparkDraw}
            />
            <text
              x={peakLX + 190}
              y={peakLY + 10}
              fill={RED}
              fontSize={30}
              fontWeight={700}
              fontFamily={MONO}
              opacity={sparkDraw}
            >
              +212%
            </text>
            <text
              x={1560}
              y={baseLY + 40}
              fill={FAINT}
              fontSize={24}
              fontFamily={MONO}
              textAnchor="end"
              opacity={sparkDraw}
            >
              baseline
            </text>
          </svg>
        </div>
      )}

      {/* ================= FORECAST VS BUDGET ================= */}
      <div
        style={{
          position: 'absolute',
          left: 2070,
          top: 1606,
          opacity: interpolate(frame, [460, 520], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          display: 'flex',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 5, color: INK}}>
          FORECAST VS BUDGET
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <div style={{width: 26, height: 16, borderRadius: 5, background: EMERALD}} />
          <div style={{fontFamily: MONO, fontSize: 24, color: MUTED}}>FORECAST</div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <div
            style={{
              width: 26,
              height: 16,
              borderRadius: 5,
              border: `2.5px solid ${SLATE}`,
            }}
          />
          <div style={{fontFamily: MONO, fontSize: 24, color: MUTED}}>BUDGET</div>
        </div>
      </div>
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0}}
      >
        {QUARTERS.map((q, i) => {
          const s = spring({
            frame: frame - (500 + i * 60),
            fps,
            config: {damping: 200, stiffness: 90, mass: 1},
          });
          if (s <= 0.001) return null;
          const cx = groupCX(i);
          const fh = bH(FORECAST[i]) * Math.min(1, s);
          const bh = bH(BUDGET[i]) * Math.min(1, s);
          const variance = ((FORECAST[i] - BUDGET[i]) / BUDGET[i]) * 100;
          const valFade = interpolate(
            frame,
            [560 + i * 60, 620 + i * 60],
            [0, 1],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
          );
          return (
            <g key={`b${q}`} opacity={Math.min(1, s)}>
              {/* forecast: solid emerald */}
              <rect
                x={cx - 112}
                y={B_BASE - fh}
                width={100}
                height={fh}
                rx={10}
                fill={EMERALD}
                style={{filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.55))'}}
              />
              {/* budget: outline */}
              <rect
                x={cx + 12}
                y={B_BASE - bh}
                width={100}
                height={bh}
                rx={10}
                fill="none"
                stroke={SLATE}
                strokeWidth={3}
              />
              {/* value labels */}
              <text
                x={cx - 62}
                y={B_BASE - fh - 18}
                fill={INK}
                fontSize={30}
                fontWeight={700}
                fontFamily={MONO}
                textAnchor="middle"
                opacity={valFade}
              >
                ${FORECAST[i].toFixed(2)}M
              </text>
              <text
                x={cx + 62}
                y={B_BASE - bh - 18}
                fill={MUTED}
                fontSize={30}
                fontFamily={MONO}
                textAnchor="middle"
                opacity={valFade}
              >
                ${BUDGET[i].toFixed(2)}M
              </text>
              {/* quarter + variance */}
              <text
                x={cx}
                y={B_BASE + 44}
                fill={MUTED}
                fontSize={28}
                fontFamily={MONO}
                textAnchor="middle"
                letterSpacing={3}
              >
                {q}
              </text>
              <text
                x={cx}
                y={B_BASE + 84}
                fill={EMERALD}
                fontSize={27}
                fontWeight={700}
                fontFamily={MONO}
                textAnchor="middle"
                opacity={valFade}
                style={{filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.5))'}}
              >
                {variance.toFixed(0)}% under
              </text>
            </g>
          );
        })}
        <line
          x1={2140}
          y1={B_BASE}
          x2={3600}
          y2={B_BASE}
          stroke={AXIS}
          strokeWidth={2}
          opacity={interpolate(frame, [460, 520], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}
        />
      </svg>

      {/* ================= FOOTER ================= */}
      <div
        style={{
          position: 'absolute',
          left: 160,
          right: 160,
          bottom: 92,
          opacity: footerFade,
        }}
      >
        <div
          style={{height: 1.5, background: HAIRLINE, marginBottom: 30, marginLeft: 0}}
        />
        <div
          style={{
            textAlign: 'center',
            fontFamily: MONO,
            fontSize: 27,
            letterSpacing: 1.5,
            color: MUTED,
          }}
        >
          98% of FinOps practitioners now manage AI spend · 90% manage SaaS spend
          (2026).
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default FinOpsCloudDashboard;
