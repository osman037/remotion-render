/**
 * CSRDMaterialityMatrix.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * CSRD Double Materiality Matrix: an ESG sustainability-reporting dashboard
 * animating 14 ESG topics onto an impact x financial materiality scatter
 * matrix, with 60% threshold lines, quadrant labels, an ESRS assessment
 * progress panel, and a 2025-2028 reporting timeline.
 *
 * Register in Root.tsx:
 *   <Composition id="CSRDMaterialityMatrix" component={CSRDMaterialityMatrix}
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
const BG = '#060D0A';
const INK = '#EAF4EF';
const MUTED = 'rgba(204,225,214,0.62)';
const FAINT = 'rgba(204,225,214,0.34)';
const EMERALD = '#34D399';
const PILLAR_E = '#34D399';
const PILLAR_S = '#60A5FA';
const PILLAR_G = '#FBBF24';
const AMBER = '#FBBF24';
const GRID_COLOR = 'rgba(148,180,164,0.10)';
const AXIS_COLOR = 'rgba(148,180,164,0.55)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
//   0-120    intro   (title, axes)
//   120-600  build   (thresholds, topics, panel, counter)
//   600-780  payoff  (reportable highlight, material pulse)
//   780-900  resolve (gentle hold, glow breathing)
// ---------------------------------------------------------------------------
const TITLE_FADE_START = 0;
const TITLE_FADE_END = 60;
const AXES_FADE_START = 60;
const AXES_FADE_END = 120;
const THRESHOLD_START = 200;
const THRESHOLD_END = 280;
const TOPIC_START = 150;
const TOPIC_GAP = 35;
const COUNTER_START = 220;
const COUNTER_END = 560;
const PANEL_START = 280;
const CHECK_START = 330;
const CHECK_GAP = 45;
const PAYOFF_START = 650;
const PAYOFF_END = 780;
const RESOLVE_START = 780;

// ---------------------------------------------------------------------------
// Matrix geometry (device px, 4K)
// ---------------------------------------------------------------------------
const PLOT_LEFT = 300;
const PLOT_RIGHT = 2380;
const PLOT_TOP = 500;
const PLOT_BOTTOM = 1660;
const PLOT_W = PLOT_RIGHT - PLOT_LEFT;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;
const THRESHOLD_PCT = 60;
const T_MAJOR = [0, 25, 50, 75, 100];

const xForPct = (p: number): number => PLOT_LEFT + (p / 100) * PLOT_W;
const yForPct = (p: number): number => PLOT_BOTTOM - (p / 100) * PLOT_H;

// ---------------------------------------------------------------------------
// Deterministic pseudo-random (seeded) - never Math.random()
// ---------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Data: 14 ESG topics (x = financial materiality %, y = impact materiality %)
// material flag = top 9 by combined materiality score; reportable = above
// both 60% thresholds (top-right quadrant).
// ---------------------------------------------------------------------------
type Pillar = 'E' | 'S' | 'G';
type LabelSide = 'left' | 'right';

interface Topic {
  x: number;
  y: number;
  pillar: Pillar;
  label: string;
  side: LabelSide;
  material: boolean;
  reportable: boolean;
}

const PILLAR_COLOR: Record<Pillar, string> = {
  E: PILLAR_E,
  S: PILLAR_S,
  G: PILLAR_G,
};

const TOPICS: Topic[] = [
  {x: 88, y: 92, pillar: 'E', label: 'Climate change', side: 'right', material: true, reportable: true},
  {x: 74, y: 81, pillar: 'E', label: 'Biodiversity', side: 'left', material: true, reportable: true},
  {x: 52, y: 68, pillar: 'E', label: 'Water resources', side: 'left', material: true, reportable: false},
  {x: 63, y: 58, pillar: 'E', label: 'Circular economy', side: 'right', material: true, reportable: false},
  {x: 48, y: 55, pillar: 'E', label: 'Pollution', side: 'left', material: false, reportable: false},
  {x: 70, y: 74, pillar: 'S', label: 'Own workforce', side: 'right', material: true, reportable: true},
  {x: 66, y: 62, pillar: 'S', label: 'Value-chain workers', side: 'left', material: true, reportable: false},
  {x: 55, y: 71, pillar: 'S', label: 'Affected communities', side: 'right', material: true, reportable: false},
  {x: 61, y: 49, pillar: 'S', label: 'Consumers', side: 'right', material: false, reportable: false},
  {x: 82, y: 57, pillar: 'G', label: 'Business conduct', side: 'right', material: true, reportable: false},
  {x: 77, y: 44, pillar: 'G', label: 'Anti-corruption', side: 'right', material: false, reportable: false},
  {x: 69, y: 38, pillar: 'G', label: 'Data privacy', side: 'left', material: false, reportable: false},
  {x: 58, y: 66, pillar: 'S', label: 'Supply-chain labor', side: 'right', material: true, reportable: false},
  {x: 45, y: 52, pillar: 'E', label: 'Resource use', side: 'left', material: false, reportable: false},
];

const MATERIAL_COUNT = TOPICS.filter((t) => t.material).length; // 9

// ---------------------------------------------------------------------------
// Data: ESRS assessment checklist
// ---------------------------------------------------------------------------
interface EsrsRow {
  code: string;
  name: string;
  status: 'verified' | 'review';
}

const CHECKLIST: EsrsRow[] = [
  {code: 'ESRS E1', name: 'Climate change', status: 'verified'},
  {code: 'ESRS E4', name: 'Biodiversity', status: 'verified'},
  {code: 'ESRS S1', name: 'Own workforce', status: 'verified'},
  {code: 'ESRS G1', name: 'Business conduct', status: 'verified'},
  {code: 'ESRS E5', name: 'Circular economy', status: 'review'},
];

// ---------------------------------------------------------------------------
// Data: reporting timeline years
// ---------------------------------------------------------------------------
const TIMELINE_YEARS = [2025, 2026, 2027, 2028];
const TIMELINE_LEFT = 300;
const TIMELINE_RIGHT = 3600;
const TIMELINE_Y = 1930;
const MILESTONE_YEAR = 2027;

// ---------------------------------------------------------------------------
// Static SVG defs (gradients / filters)
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stopColor="rgba(52,211,153,0.10)" />
      <stop offset="45%" stopColor="rgba(52,211,153,0.04)" />
      <stop offset="100%" stopColor="rgba(6,13,10,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="78%">
      <stop offset="58%" stopColor="rgba(6,13,10,0)" />
      <stop offset="100%" stopColor="rgba(1,4,3,0.78)" />
    </radialGradient>
    <linearGradient id="panelSheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="rgba(52,211,153,0.08)" />
      <stop offset="55%" stopColor="rgba(52,211,153,0.015)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0.012)" />
    </linearGradient>
    <linearGradient id="quadGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="rgba(52,211,153,0.16)" />
      <stop offset="100%" stopColor="rgba(52,211,153,0.03)" />
    </linearGradient>
    <radialGradient id="dotCore" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
      <stop offset="40%" stopColor="rgba(255,255,255,0.25)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
    </radialGradient>
    <filter id="glowBlur" x="-90%" y="-90%" width="280%" height="280%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: deep pine-charcoal base, emerald radial glow, vignette,
// drifting hairline texture, slow scan sweep.
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 320)) % (2160 + 320) - 160;
  const breathe = frame >= RESOLVE_START ? 0.9 + 0.1 * Math.sin((frame - RESOLVE_START) * 0.035) : 1;
  const hairlines = useMemo(() => {
    const rand = mulberry32(20260926);
    return Array.from({length: 26}, (_, i) => ({
      y: rand() * 2160,
      x: rand() * 3840,
      w: 180 + rand() * 520,
      o: 0.05 + rand() * 0.08,
    }));
  }, []);
  const drift = (frame * 6) % 3840;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(52,211,153,0.10), rgba(52,211,153,0.035) 45%, rgba(6,13,10,0) 72%)',
          opacity: breathe,
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        {/* drifting hairline texture */}
        <g opacity={0.5}>
          {hairlines.map((h, i) => (
            <line
              key={`h${i}`}
              x1={((h.x - drift) % 3840 + 3840) % 3840}
              y1={h.y}
              x2={(((h.x - drift) % 3840 + 3840) % 3840) + h.w}
              y2={h.y}
              stroke={EMERALD}
              strokeWidth={1}
              opacity={h.o}
            />
          ))}
        </g>
        {/* scan sweep */}
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(52,211,153,0.030)" />
        <line x1={0} y1={scanY + 110} x2={3840} y2={scanY + 110} stroke="rgba(52,211,153,0.12)" strokeWidth={1.5} />
        {/* vignette */}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title block (top-left, fade + rise 0-60)
// ---------------------------------------------------------------------------
const TitleBlock: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [TITLE_FADE_START, TITLE_FADE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [TITLE_FADE_START, TITLE_FADE_END], [34, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 96 + rise,
        left: 120,
        opacity: fade,
      }}
    >
      <div
        style={{
          color: EMERALD,
          fontFamily: MONO,
          fontSize: 30,
          letterSpacing: 6,
          marginBottom: 18,
        }}
      >
        EU SUSTAINABILITY REPORTING
      </div>
      <div
        style={{
          color: INK,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 84,
          letterSpacing: -1,
        }}
      >
        DOUBLE MATERIALITY ASSESSMENT
      </div>
      <div
        style={{
          color: MUTED,
          fontFamily: FONT,
          fontSize: 36,
          marginTop: 16,
        }}
      >
        CSRD &middot; ESRS 1 &mdash; impact &times; financial materiality
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Matrix plot: grid, ticks, axes, thresholds, quadrants, topics, payoff
// ---------------------------------------------------------------------------
const MatrixPlot: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const axesFade = interpolate(frame, [AXES_FADE_START, AXES_FADE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const captionFade = interpolate(frame, [120, 170], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Threshold lines: fade in, then gentle marching-ants dash motion.
  const threshFade = interpolate(frame, [THRESHOLD_START, THRESHOLD_START + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dashOffset = frame > THRESHOLD_END ? -(frame - THRESHOLD_END) * 0.18 : 0;

  const tx = xForPct(THRESHOLD_PCT);
  const ty = yForPct(THRESHOLD_PCT);

  // Payoff: quadrant highlight, badge, one-time material pulse.
  const highlightFade = interpolate(frame, [PAYOFF_START, PAYOFF_START + 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const badgeSpring = spring({
    frame: frame - (PAYOFF_START + 30),
    fps,
    config: {damping: 200, stiffness: 90},
  });
  const payoffP = interpolate(frame, [PAYOFF_START + 10, PAYOFF_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulseOnce = Math.sin(payoffP * Math.PI);
  const breathe =
    frame >= RESOLVE_START ? 0.88 + 0.12 * Math.sin((frame - RESOLVE_START) * 0.04) : 1;
  // Top-right quadrant label softens once the REPORTABLE badge takes over.
  const quadLabelDim = interpolate(frame, [PAYOFF_START + 30, PAYOFF_START + 80], [1, 0.35], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const badgeW = 460;
  const badgeH = 96;
  const badgeX = (tx + PLOT_RIGHT) / 2 - badgeW / 2;
  const badgeY = ty - 210;

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />

      {/* minor hairline grid (every 5%) */}
      <g opacity={axesFade * 0.55}>
        {Array.from({length: 19}, (_, i) => (i + 1) * 5).map((p) => {
          if (p % 25 === 0) return null;
          return (
            <g key={`minor${p}`}>
              <line x1={xForPct(p)} y1={PLOT_TOP} x2={xForPct(p)} y2={PLOT_BOTTOM} stroke={GRID_COLOR} strokeWidth={1} />
              <line x1={PLOT_LEFT} y1={yForPct(p)} x2={PLOT_RIGHT} y2={yForPct(p)} stroke={GRID_COLOR} strokeWidth={1} />
            </g>
          );
        })}
      </g>

      {/* major gridlines + % tick labels */}
      <g opacity={axesFade}>
        {T_MAJOR.map((p) => (
          <g key={`major${p}`}>
            <line
              x1={xForPct(p)}
              y1={PLOT_TOP}
              x2={xForPct(p)}
              y2={PLOT_BOTTOM}
              stroke={p === 0 ? AXIS_COLOR : GRID_COLOR}
              strokeWidth={p === 0 ? 2.5 : 1.5}
            />
            <line
              x1={PLOT_LEFT}
              y1={yForPct(p)}
              x2={PLOT_RIGHT}
              y2={yForPct(p)}
              stroke={p === 0 ? AXIS_COLOR : GRID_COLOR}
              strokeWidth={p === 0 ? 2.5 : 1.5}
            />
            <text
              x={xForPct(p)}
              y={PLOT_BOTTOM + 58}
              fill={MUTED}
              fontSize={30}
              fontFamily={MONO}
              textAnchor="middle"
            >
              {p}%
            </text>
            <text
              x={PLOT_LEFT - 30}
              y={yForPct(p) + 11}
              fill={MUTED}
              fontSize={30}
              fontFamily={MONO}
              textAnchor="end"
            >
              {p}%
            </text>
          </g>
        ))}
      </g>

      {/* axis baselines */}
      <g opacity={axesFade}>
        <line x1={PLOT_LEFT} y1={PLOT_BOTTOM} x2={PLOT_RIGHT} y2={PLOT_BOTTOM} stroke={AXIS_COLOR} strokeWidth={2.5} />
        <line x1={PLOT_LEFT} y1={PLOT_TOP} x2={PLOT_LEFT} y2={PLOT_BOTTOM} stroke={AXIS_COLOR} strokeWidth={2.5} />
      </g>

      {/* axis titles */}
      <g opacity={axesFade}>
        <text
          x={(PLOT_LEFT + PLOT_RIGHT) / 2}
          y={PLOT_BOTTOM + 128}
          fill={INK}
          fontSize={34}
          fontFamily={MONO}
          fontWeight={700}
          letterSpacing={4}
          textAnchor="middle"
        >
          FINANCIAL MATERIALITY &#8594;
        </text>
        <text
          x={150}
          y={(PLOT_TOP + PLOT_BOTTOM) / 2}
          fill={INK}
          fontSize={34}
          fontFamily={MONO}
          fontWeight={700}
          letterSpacing={4}
          textAnchor="middle"
          transform={`rotate(-90 150 ${(PLOT_TOP + PLOT_BOTTOM) / 2})`}
        >
          &#8593; IMPACT MATERIALITY
        </text>
      </g>

      {/* plot caption */}
      <text
        x={PLOT_LEFT}
        y={PLOT_TOP - 34}
        fill={FAINT}
        fontSize={26}
        fontFamily={MONO}
        letterSpacing={2}
        opacity={captionFade}
      >
        14 topics plotted &middot; score = stakeholder + evidence weighting
      </text>

      {/* payoff quadrant highlight (top-right) */}
      {highlightFade > 0 && (
        <g opacity={highlightFade * breathe}>
          <rect
            x={tx}
            y={PLOT_TOP}
            width={PLOT_RIGHT - tx}
            height={ty - PLOT_TOP}
            fill="url(#quadGlow)"
            stroke={EMERALD}
            strokeWidth={2.5}
            strokeDasharray="22 16"
            filter="url(#softBlur)"
          />
        </g>
      )}

      {/* 60% threshold lines (marching ants) */}
      <g opacity={threshFade}>
        <line
          x1={tx}
          y1={PLOT_TOP}
          x2={tx}
          y2={PLOT_BOTTOM}
          stroke={AMBER}
          strokeWidth={3}
          strokeDasharray="20 16"
          strokeDashoffset={dashOffset}
          style={{filter: `drop-shadow(0 0 10px ${AMBER}88)`}}
        />
        <line
          x1={PLOT_LEFT}
          y1={ty}
          x2={PLOT_RIGHT}
          y2={ty}
          stroke={AMBER}
          strokeWidth={3}
          strokeDasharray="20 16"
          strokeDashoffset={dashOffset}
          style={{filter: `drop-shadow(0 0 10px ${AMBER}88)`}}
        />
        <text x={tx + 18} y={PLOT_TOP + 48} fill={AMBER} fontSize={28} fontFamily={MONO} fontWeight={700} opacity={0.9}>
          60% threshold
        </text>
        <text x={PLOT_RIGHT - 18} y={ty - 18} fill={AMBER} fontSize={28} fontFamily={MONO} fontWeight={700} textAnchor="end" opacity={0.9}>
          60% threshold
        </text>
      </g>

      {/* quadrant labels */}
      <g opacity={axesFade}>
        <text
          x={(tx + PLOT_RIGHT) / 2}
          y={PLOT_TOP + 110}
          fill={FAINT}
          fontSize={28}
          fontFamily={MONO}
          letterSpacing={3}
          textAnchor="middle"
          opacity={quadLabelDim}
        >
          REPORTABLE &mdash; disclose
        </text>
        <text
          x={(PLOT_LEFT + tx) / 2}
          y={PLOT_TOP + 110}
          fill={FAINT}
          fontSize={28}
          fontFamily={MONO}
          letterSpacing={3}
          textAnchor="middle"
        >
          IMPACT-FOCUSED
        </text>
        <text
          x={(tx + PLOT_RIGHT) / 2}
          y={PLOT_BOTTOM - 60}
          fill={FAINT}
          fontSize={28}
          fontFamily={MONO}
          letterSpacing={3}
          textAnchor="middle"
        >
          FINANCIALLY MATERIAL
        </text>
        <text
          x={(PLOT_LEFT + tx) / 2}
          y={PLOT_BOTTOM - 60}
          fill={FAINT}
          fontSize={28}
          fontFamily={MONO}
          letterSpacing={3}
          textAnchor="middle"
        >
          MONITORED
        </text>
      </g>

      {/* payoff badge */}
      {badgeSpring > 0.001 && (
        <g
          opacity={Math.min(1, badgeSpring)}
          transform={`translate(${badgeX + badgeW / 2}, ${badgeY + badgeH / 2}) scale(${(0.85 + 0.15 * badgeSpring) * breathe}) translate(${-(
            badgeX + badgeW / 2
          )}, ${-(badgeY + badgeH / 2)})`}
        >
          <rect
            x={badgeX}
            y={badgeY}
            width={badgeW}
            height={badgeH}
            rx={20}
            fill="rgba(6,20,14,0.92)"
            stroke={EMERALD}
            strokeWidth={3}
            filter="url(#glowBlur)"
          />
          <text
            x={badgeX + badgeW / 2}
            y={badgeY + 62}
            fill={EMERALD}
            fontSize={42}
            fontFamily={MONO}
            fontWeight={800}
            letterSpacing={6}
            textAnchor="middle"
            style={{filter: `drop-shadow(0 0 14px ${EMERALD})`}}
          >
            REPORTABLE
          </text>
        </g>
      )}

      {/* topics */}
      {TOPICS.map((t, k) => {
        const s = spring({
          frame: frame - (TOPIC_START + k * TOPIC_GAP),
          fps,
          config: {damping: 200, stiffness: 90, mass: 1},
        });
        if (s <= 0.001) return null;
        const color = PILLAR_COLOR[t.pillar];
        const cx = xForPct(t.x);
        const cy = yForPct(t.y);
        const rise = (1 - s) * 26;
        const scalePulse = t.material ? 1 + 0.22 * pulseOnce : 1;
        const labelGap = 56;
        const labelX = t.side === 'right' ? cx + labelGap : cx - labelGap;
        const anchor = t.side === 'right' ? 'start' : 'end';
        const lineX1 = t.side === 'right' ? cx + 34 : cx - 34;
        const lineX2 = t.side === 'right' ? cx + labelGap - 12 : cx - labelGap + 12;
        // reportable topics get an expanding ring during payoff
        const ringR = 30 + 46 * payoffP;
        const ringO = t.reportable ? (1 - payoffP) * 0.85 : 0;
        return (
          <g key={`topic${k}`} opacity={Math.min(1, s)}>
            <g transform={`translate(0, ${rise}) scale(${scalePulse})`} style={{transformOrigin: `${cx}px ${cy}px`}}>
              {ringO > 0.01 && (
                <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={color} strokeWidth={3.5} opacity={ringO} />
              )}
              <circle cx={cx} cy={cy} r={52} fill={color} opacity={0.16} filter="url(#glowBlur)" />
              <circle
                cx={cx}
                cy={cy}
                r={26}
                fill={color}
                opacity={0.95}
                style={{filter: `drop-shadow(0 0 18px ${color})`}}
              />
              <circle cx={cx} cy={cy} r={26} fill="url(#dotCore)" opacity={0.5} />
              <circle cx={cx} cy={cy} r={26} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} />
              {t.material && (
                <circle cx={cx} cy={cy} r={38} fill="none" stroke={color} strokeWidth={2} opacity={0.45} strokeDasharray="8 10" />
              )}
              {/* leader line */}
              <line x1={lineX1} y1={cy} x2={lineX2} y2={cy} stroke={color} strokeWidth={1.5} opacity={0.55} />
              <circle cx={lineX1} cy={cy} r={4} fill={color} opacity={0.8} />
              {/* label */}
              <text
                x={labelX}
                y={cy + 9}
                fill={t.material ? INK : MUTED}
                fontSize={26}
                fontFamily={MONO}
                fontWeight={t.material ? 700 : 500}
                textAnchor={anchor}
                style={t.material ? {textShadow: `0 0 12px ${color}66`} : undefined}
              >
                {t.label}
              </text>
              <text
                x={labelX}
                y={cy + 44}
                fill={FAINT}
                fontSize={22}
                fontFamily={MONO}
                textAnchor={anchor}
              >
                {t.pillar} &middot; {t.x}/{t.y}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Right panel: assessment progress, ESRS checklist, material counter, legend
// ---------------------------------------------------------------------------
const PANEL_X = 2520;
const PANEL_Y = 420;
const PANEL_W = 1080;
const PANEL_H = 1280;

const RightPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const panelSpring = spring({
    frame: frame - PANEL_START,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (panelSpring <= 0.001) return null;

  const count = Math.round(
    interpolate(frame, [COUNTER_START, COUNTER_END], [0, MATERIAL_COUNT], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const barW = ((PANEL_X + 60 + 960) - (PANEL_X + 60)) * (count / TOPICS.length);

  const rows = useMemo(() => CHECKLIST, []);
  const legendItems: {pillar: Pillar; label: string}[] = [
    {pillar: 'E', label: 'Environmental'},
    {pillar: 'S', label: 'Social'},
    {pillar: 'G', label: 'Governance'},
  ];

  return (
    <svg
      width={3840}
      height={2160}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: Math.min(1, panelSpring),
        transform: `translateX(${(1 - panelSpring) * 90}px)`,
      }}
    >
      <Defs />
      {/* panel frame */}
      <rect
        x={PANEL_X}
        y={PANEL_Y}
        width={PANEL_W}
        height={PANEL_H}
        rx={28}
        fill="url(#panelSheen)"
        stroke="rgba(52,211,153,0.30)"
        strokeWidth={2.5}
      />
      <line x1={PANEL_X + 60} y1={PANEL_Y + 128} x2={PANEL_X + PANEL_W - 60} y2={PANEL_Y + 128} stroke={GRID_COLOR} strokeWidth={1.5} />

      <text
        x={PANEL_X + 60}
        y={PANEL_Y + 92}
        fill={INK}
        fontSize={34}
        fontFamily={MONO}
        fontWeight={800}
        letterSpacing={5}
      >
        ASSESSMENT PROGRESS
      </text>
      <text x={PANEL_X + PANEL_W - 60} y={PANEL_Y + 92} fill={FAINT} fontSize={26} fontFamily={MONO} textAnchor="end">
        CSRD &middot; ESRS 1
      </text>

      {/* ESRS checklist rows */}
      {rows.map((row, i) => {
        const s = spring({
          frame: frame - (CHECK_START + i * CHECK_GAP),
          fps,
          config: {damping: 200, stiffness: 95},
        });
        if (s <= 0.001) return null;
        const y = PANEL_Y + 220 + i * 118;
        const done = row.status === 'verified';
        const accent = done ? EMERALD : AMBER;
        const checkP = interpolate(frame, [CHECK_START + i * CHECK_GAP, CHECK_START + i * CHECK_GAP + 40], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <g key={`row${i}`} opacity={Math.min(1, s)} transform={`translate(${(1 - s) * 34}, 0)`}>
            <rect
              x={PANEL_X + 60}
              y={y - 30}
              width={46}
              height={46}
              rx={10}
              fill="rgba(6,13,10,0.6)"
              stroke={accent}
              strokeWidth={2.5}
            />
            {done ? (
              <path
                d={`M ${PANEL_X + 70} ${y - 6} L ${PANEL_X + 80} ${y + 5} L ${PANEL_X + 98} ${y - 16}`}
                fill="none"
                stroke={EMERALD}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - checkP}
                style={{filter: `drop-shadow(0 0 8px ${EMERALD})`}}
              />
            ) : (
              <circle cx={PANEL_X + 83} cy={y - 7} r={13} fill="none" stroke={AMBER} strokeWidth={4}>
                <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
            <text x={PANEL_X + 130} y={y + 6} fill={INK} fontSize={31} fontFamily={MONO} fontWeight={600}>
              {row.code} &mdash; {row.name}
            </text>
            <text
              x={PANEL_X + PANEL_W - 60}
              y={y + 6}
              fill={accent}
              fontSize={26}
              fontFamily={MONO}
              fontWeight={700}
              letterSpacing={2}
              textAnchor="end"
            >
              {done ? '\u2713 VERIFIED' : '\u25D0 IN REVIEW'}
            </text>
          </g>
        );
      })}

      {/* divider before counter */}
      <line
        x1={PANEL_X + 60}
        y1={PANEL_Y + 810}
        x2={PANEL_X + PANEL_W - 60}
        y2={PANEL_Y + 810}
        stroke={GRID_COLOR}
        strokeWidth={1.5}
      />

      {/* material counter */}
      <g>
        <text
          x={PANEL_X + 60}
          y={PANEL_Y + 990}
          fill={EMERALD}
          fontSize={168}
          fontFamily={MONO}
          fontWeight={800}
          style={{textShadow: `0 0 40px ${EMERALD}99`}}
        >
          {count}
        </text>
        <text x={PANEL_X + 230} y={PANEL_Y + 940} fill={MUTED} fontSize={36} fontFamily={FONT}>
          of {TOPICS.length} topics
        </text>
        <text x={PANEL_X + 230} y={PANEL_Y + 990} fill={INK} fontSize={44} fontFamily={FONT} fontWeight={700}>
          material
        </text>
        {/* progress bar */}
        <rect
          x={PANEL_X + 60}
          y={PANEL_Y + 1040}
          width={960}
          height={12}
          rx={6}
          fill="rgba(255,255,255,0.07)"
        />
        <rect
          x={PANEL_X + 60}
          y={PANEL_Y + 1040}
          width={barW}
          height={12}
          rx={6}
          fill={EMERALD}
          style={{filter: `drop-shadow(0 0 12px ${EMERALD}aa)`}}
        />
        <text x={PANEL_X + 60} y={PANEL_Y + 1100} fill={FAINT} fontSize={24} fontFamily={MONO} letterSpacing={1}>
          {Math.round((count / TOPICS.length) * 100)}% of assessed topics meet a threshold
        </text>
      </g>

      {/* pillar legend */}
      <g>
        <text x={PANEL_X + 60} y={PANEL_Y + 1190} fill={FAINT} fontSize={26} fontFamily={MONO} letterSpacing={4}>
          PILLARS
        </text>
        {legendItems.map((li, i) => (
          <g key={`legend${li.pillar}`} transform={`translate(${PANEL_X + 60 + i * 330}, ${PANEL_Y + 1216})`}>
            <circle cx={16} cy={0} r={16} fill={PILLAR_COLOR[li.pillar]} style={{filter: `drop-shadow(0 0 10px ${PILLAR_COLOR[li.pillar]})`}} />
            <text x={46} y={10} fill={MUTED} fontSize={28} fontFamily={MONO}>
              {li.pillar} &middot; {li.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Bottom strip: 2025-2028 reporting timeline + footer note
// ---------------------------------------------------------------------------
const BottomStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - 380,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;

  const yearX = (yr: number): number =>
    TIMELINE_LEFT + ((yr - TIMELINE_YEARS[0]) / (TIMELINE_YEARS[TIMELINE_YEARS.length - 1] - TIMELINE_YEARS[0])) * (TIMELINE_RIGHT - TIMELINE_LEFT);
  const mx = yearX(MILESTONE_YEAR);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.09);
  const markerOn = frame > 520;

  return (
    <svg
      width={3840}
      height={2160}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 40}px)`,
      }}
    >
      <Defs />
      {/* baseline */}
      <line x1={TIMELINE_LEFT} y1={TIMELINE_Y} x2={TIMELINE_RIGHT} y2={TIMELINE_Y} stroke={AXIS_COLOR} strokeWidth={2.5} />
      {TIMELINE_YEARS.map((yr) => (
        <g key={`yr${yr}`}>
          <line x1={yearX(yr)} y1={TIMELINE_Y - 18} x2={yearX(yr)} y2={TIMELINE_Y + 18} stroke={AXIS_COLOR} strokeWidth={2.5} />
          <text
            x={yearX(yr)}
            y={TIMELINE_Y + 72}
            fill={yr === MILESTONE_YEAR ? AMBER : MUTED}
            fontSize={32}
            fontFamily={MONO}
            fontWeight={yr === MILESTONE_YEAR ? 800 : 500}
            textAnchor="middle"
            style={yr === MILESTONE_YEAR ? {textShadow: `0 0 16px ${AMBER}` } : undefined}
          >
            {yr}
          </text>
        </g>
      ))}
      {/* FY2027 milestone marker */}
      {markerOn && (
        <g>
          <circle cx={mx} cy={TIMELINE_Y} r={26 + pulse * 14} fill={AMBER} opacity={0.18} />
          <g transform={`rotate(45 ${mx} ${TIMELINE_Y})`}>
            <rect x={mx - 16} y={TIMELINE_Y - 16} width={32} height={32} fill={AMBER} style={{filter: `drop-shadow(0 0 16px ${AMBER})`}} />
          </g>
          <text
            x={mx}
            y={TIMELINE_Y - 56}
            fill={AMBER}
            fontSize={32}
            fontFamily={MONO}
            fontWeight={800}
            letterSpacing={3}
            textAnchor="middle"
          >
            FY2027 &mdash; ESRS mandatory
          </text>
        </g>
      )}
      {/* footer note */}
      <text x={1920} y={2100} fill={FAINT} fontSize={26} fontFamily={FONT} textAnchor="middle">
        Double materiality: report topics material from either impact or financial perspective. Revised ESRS ~61% fewer datapoints.
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const CSRDMaterialityMatrix: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBlock frame={frame} />
      <MatrixPlot frame={frame} fps={fps} />
      <RightPanel frame={frame} fps={fps} />
      <BottomStrip frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default CSRDMaterialityMatrix;
