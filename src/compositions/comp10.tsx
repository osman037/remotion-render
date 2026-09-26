/**
 * DistributedTracingWaterfall.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Animates an OpenTelemetry-style distributed trace waterfall: one request
 * fanning out across six services, with a latency-outlier span (amber) and
 * an errored span (red) that resolves via retry, plus a trace summary panel.
 *
 * Register in Root.tsx:
 *   <Composition id="DistributedTracingWaterfall" component={DistributedTracingWaterfall}
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
const BG = '#060810';
const INK = '#E8EDF6';
const MUTED = 'rgba(203,213,225,0.62)';
const FAINT = 'rgba(148,163,184,0.28)';
const GRID_COLOR = 'rgba(148,163,184,0.08)';
const INDIGO = '#818CF8';
const INDIGO_LIGHT = '#A5B4FC';
const CYAN = '#22D3EE';
const AMBER = '#FBBF24';
const RED = '#F87171';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Geometry (device px, 4K)
// ---------------------------------------------------------------------------
const T_MAX = 1500; // timeline range in ms
const PX0 = 560; // waterfall plot left (after service gutter)
const PX1 = 2500; // waterfall plot right
const PXW = PX1 - PX0;
const RULER_Y = 512;
const GUTTER_X = 170;
const PANEL_X0 = 2640;
const PANEL_X1 = 3680;
const CANVAS_TOP = 480;
const CANVAS_BOTTOM = 1700;

const xForMs = (ms: number) => PX0 + (ms / T_MAX) * PXW;

// ---------------------------------------------------------------------------
// Timeline choreography (frames at 60 fps)
// ---------------------------------------------------------------------------
const TITLE_END = 60;
const RULER_START = 60;
const PANEL_START = 380;
const BREACH_FRAME = 500;
const CALLOUT_FRAME = 520;
const TOOLTIP_FRAME = 560;
const PAYOFF_START = 650;
const PAYOFF_END = 780;
const RESOLVE_START = 780;

// ---------------------------------------------------------------------------
// Deterministic seeded random (never Math.random)
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Span dataset: one request traced across six services
// ---------------------------------------------------------------------------
type SpanKind = 'parent' | 'child' | 'outlier' | 'error';

interface Span {
  id: string;
  name: string;
  service: string;
  startMs: number;
  endMs: number;
  rowY: number;
  barH: number;
  kind: SpanKind;
  color: string;
  enter: number; // frame the bar starts drawing
  child: boolean; // indented sub-row
  parentId?: string;
}

const SPANS: Span[] = [
  {id: 'gateway', name: 'api-gateway', service: 'api-gateway', startMs: 0, endMs: 1420, rowY: 640, barH: 64, kind: 'parent', color: INDIGO, enter: 150, child: false},
  {id: 'auth', name: 'auth.verify', service: 'auth', startMs: 60, endMs: 320, rowY: 790, barH: 60, kind: 'child', color: INDIGO_LIGHT, enter: 200, child: false, parentId: 'gateway'},
  {id: 'orders', name: 'orders.create', service: 'orders', startMs: 340, endMs: 1180, rowY: 940, barH: 64, kind: 'outlier', color: AMBER, enter: 250, child: false, parentId: 'gateway'},
  {id: 'payments', name: 'payments.authorize', service: 'payments', startMs: 400, endMs: 980, rowY: 1090, barH: 60, kind: 'child', color: INDIGO_LIGHT, enter: 300, child: false, parentId: 'gateway'},
  {id: 'charge', name: 'charge.succeeded', service: 'payments', startMs: 420, endMs: 700, rowY: 1215, barH: 48, kind: 'child', color: CYAN, enter: 360, child: true, parentId: 'payments'},
  {id: 'refund', name: 'refund.quote', service: 'payments', startMs: 720, endMs: 800, rowY: 1330, barH: 48, kind: 'error', color: RED, enter: 450, child: true, parentId: 'payments'},
  {id: 'inventory', name: 'inventory.reserve', service: 'inventory', startMs: 1000, endMs: 1290, rowY: 1490, barH: 60, kind: 'child', color: INDIGO_LIGHT, enter: 480, child: false, parentId: 'gateway'},
  {id: 'postgres', name: 'postgres.txn', service: 'postgres', startMs: 1030, endMs: 1240, rowY: 1640, barH: 52, kind: 'child', color: CYAN, enter: 520, child: true, parentId: 'inventory'},
];

const TRACE_ID = '4bf92f7ac9d84bf92fc81a3e5d6';
const LATENCY_STATS = [
  {label: 'p50', value: 412, display: '412ms', color: INDIGO_LIGHT},
  {label: 'p95', value: 980, display: '980ms', color: CYAN},
  {label: 'p99', value: 1240, display: '1,240ms', color: AMBER},
];

// ---------------------------------------------------------------------------
// Static SVG defs (gradients / patterns / filters)
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="36%" r="72%">
      <stop offset="0%" stopColor={'rgba(129,140,248,0.12)'} />
      <stop offset="55%" stopColor={'rgba(34,211,238,0.04)'} />
      <stop offset="100%" stopColor={'rgba(6,8,16,0)'} />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="58%" stopColor={'rgba(6,8,16,0)'} />
      <stop offset="100%" stopColor={'rgba(1,2,5,0.78)'} />
    </radialGradient>

    <linearGradient id="barIndigo" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={'#6366F1'} />
      <stop offset="100%" stopColor={INDIGO} />
    </linearGradient>
    <linearGradient id="barIndigoLight" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={'#818CF8'} />
      <stop offset="100%" stopColor={INDIGO_LIGHT} />
    </linearGradient>
    <linearGradient id="barCyan" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={'#0E7490'} />
      <stop offset="100%" stopColor={CYAN} />
    </linearGradient>
    <linearGradient id="barAmber" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={'#B45309'} />
      <stop offset="60%" stopColor={AMBER} />
      <stop offset="100%" stopColor={'#FDE68A'} />
    </linearGradient>
    <linearGradient id="barRed" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={'#991B1B'} />
      <stop offset="100%" stopColor={RED} />
    </linearGradient>
    <linearGradient id="panelSheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={'rgba(129,140,248,0.10)'} />
      <stop offset="55%" stopColor={'rgba(129,140,248,0.02)'} />
      <stop offset="100%" stopColor={'rgba(255,255,255,0.015)'} />
    </linearGradient>
    <linearGradient id="barTopLight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={'rgba(255,255,255,0.28)'} />
      <stop offset="100%" stopColor={'rgba(255,255,255,0)'} />
    </linearGradient>
    <linearGradient id="shimmerBand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={'rgba(255,255,255,0)'} />
      <stop offset="50%" stopColor={'rgba(255,255,255,0.14)'} />
      <stop offset="100%" stopColor={'rgba(255,255,255,0)'} />
    </linearGradient>

    <pattern id="hatch" width={14} height={14} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <rect width={14} height={14} fill={'rgba(248,113,113,0.10)'} />
      <line x1={0} y1={0} x2={0} y2={14} stroke={'rgba(248,113,113,0.55)'} strokeWidth={5} />
    </pattern>

    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="tightGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

const barGradFor = (s: Span): string => {
  switch (s.color) {
    case INDIGO: return 'url(#barIndigo)';
    case INDIGO_LIGHT: return 'url(#barIndigoLight)';
    case CYAN: return 'url(#barCyan)';
    case AMBER: return 'url(#barAmber)';
    default: return 'url(#barRed)';
  }
};

// ---------------------------------------------------------------------------
// Background (glow + vignette + seeded dot texture + slow scan sweep)
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const dots = useMemo(() => {
    const rand = mulberry32(20260926);
    const arr: {x: number; y: number; r: number; o: number}[] = [];
    for (let i = 0; i < 150; i++) {
      arr.push({
        x: rand() * 3840,
        y: rand() * 2160,
        r: 1 + rand() * 2.2,
        o: 0.04 + rand() * 0.10,
      });
    }
    return arr;
  }, []);

  const scanY = ((frame / 900) * (2160 + 300)) % (2160 + 300) - 150;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 42% 34%, rgba(129,140,248,0.12), rgba(34,211,238,0.04) 45%, rgba(6,8,16,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={INDIGO} opacity={d.o} />
        ))}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
        <rect
          x={0}
          y={scanY - 100}
          width={3840}
          height={200}
          fill={'rgba(129,140,248,0.028)'}
        />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title block (top-left, frames 0-60)
// ---------------------------------------------------------------------------
const Title: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, 50], [34, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 88 + rise,
        left: 160,
        opacity: fade,
      }}
    >
      <div
        style={{
          color: INK,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 84,
          letterSpacing: 2,
        }}
      >
        DISTRIBUTED TRACING
      </div>
      <div
        style={{
          color: MUTED,
          fontFamily: FONT,
          fontSize: 34,
          marginTop: 16,
        }}
      >
        OpenTelemetry-style span waterfall &middot; one request, six services
      </div>
      <div
        style={{
          marginTop: 26,
          height: 4,
          width: 620 * fade,
          background: 'linear-gradient(90deg, #818CF8, #22D3EE, rgba(34,211,238,0))',
          borderRadius: 2,
          filter: 'drop-shadow(0 0 8px rgba(129,140,248,0.6))',
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Timeline ruler (0-1500ms) + faint vertical gridlines
// ---------------------------------------------------------------------------
const Ruler: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [RULER_START, RULER_START + 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (fade <= 0) return null;
  const ticks: number[] = [];
  for (let ms = 0; ms <= T_MAX; ms += 100) ticks.push(ms);
  const minors: number[] = [];
  for (let ms = 0; ms <= T_MAX; ms += 50) minors.push(ms);
  return (
    <g opacity={fade}>
      {/* gridlines spanning the waterfall canvas */}
      {ticks.map((ms) => (
        <line
          key={`g${ms}`}
          x1={xForMs(ms)}
          y1={RULER_Y + 34}
          x2={xForMs(ms)}
          y2={CANVAS_BOTTOM}
          stroke={GRID_COLOR}
          strokeWidth={1.5}
        />
      ))}
      {/* ruler baseline */}
      <line
        x1={PX0}
        y1={RULER_Y + 34}
        x2={PX1}
        y2={RULER_Y + 34}
        stroke={'rgba(148,163,184,0.45)'}
        strokeWidth={2.5}
      />
      {minors.map((ms) => (
        <line
          key={`m${ms}`}
          x1={xForMs(ms)}
          y1={RULER_Y + 34}
          x2={xForMs(ms)}
          y2={RULER_Y + 34 + (ms % 100 === 0 ? 18 : 10)}
          stroke={FAINT}
          strokeWidth={ms % 100 === 0 ? 2 : 1.5}
        />
      ))}
      {ticks.map((ms) => (
        <text
          key={`t${ms}`}
          x={xForMs(ms)}
          y={RULER_Y}
          fill={MUTED}
          fontSize={24}
          fontFamily={MONO}
          textAnchor="middle"
        >
          {ms === 0 ? '0' : `${ms}ms`}
        </text>
      ))}
      <text
        x={PX1}
        y={RULER_Y - 46}
        fill={FAINT}
        fontSize={22}
        fontFamily={MONO}
        textAnchor="end"
        letterSpacing={3}
      >
        ELAPSED TIME
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Service gutter labels (left column, staggered springs)
// ---------------------------------------------------------------------------
const Gutter: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  return (
    <g>
      {SPANS.map((s, i) => {
        const sp = spring({
          frame: frame - (RULER_START + 10 + i * 14),
          fps,
          config: {damping: 200, stiffness: 90},
        });
        if (sp <= 0.001) return null;
        const dy = (1 - sp) * 26;
        return (
          <g key={`g${s.id}`} opacity={Math.min(1, sp)} transform={`translate(0, ${dy})`}>
            <text
              x={s.child ? GUTTER_X + 42 : GUTTER_X}
              y={s.rowY + s.barH / 2 + 11}
              fill={s.kind === 'error' ? RED : s.kind === 'outlier' ? AMBER : s.color}
              fontSize={30}
              fontFamily={MONO}
              fontWeight={s.child ? 400 : 700}
              opacity={s.child ? 0.85 : 1}
            >
              {s.child ? `└─ ${s.name}` : s.service}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Parent-child elbow connectors
// ---------------------------------------------------------------------------
const Connectors: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const byId = new Map(SPANS.map((s) => [s.id, s]));
  const links: {parent: Span; child: Span}[] = [];
  SPANS.forEach((s) => {
    if (s.parentId) {
      const p = byId.get(s.parentId);
      if (p) links.push({parent: p, child: s});
    }
  });
  return (
    <g>
      {links.map(({parent, child}) => {
        const sp = spring({
          frame: frame - (child.enter + 14),
          fps,
          config: {damping: 200, stiffness: 90},
        });
        if (sp <= 0.001) return null;
        const x = xForMs(child.startMs);
        const yTop = parent.rowY + parent.barH;
        const yBot = child.rowY;
        return (
          <g key={`c${child.id}`} opacity={0.55 * Math.min(1, sp)}>
            <line x1={x} y1={yTop} x2={x} y2={yBot} stroke={child.color} strokeWidth={2} strokeDasharray={'6 7'} />
            <circle cx={x} cy={yTop} r={5} fill={child.color} opacity={0.9} />
            <circle cx={x} cy={yBot} r={5} fill={child.color} opacity={0.9} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Span bars: rounded, gradient + glow, drawn via width interpolation
// ---------------------------------------------------------------------------
const SpanBars: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  return (
    <g>
      {SPANS.map((s) => {
        const sp = spring({
          frame: frame - s.enter,
          fps,
          config: {damping: 200, stiffness: 90},
        });
        if (sp <= 0.001) return null;
        const x0 = xForMs(s.startMs);
        const fullW = xForMs(s.endMs) - x0;
        const w = Math.max(0, fullW * sp);
        const ms = s.endMs - s.startMs;
        const label = `${s.name} · ${ms}ms`;
        const labelFits = w > 330;
        const labelFade = interpolate(sp, [0.55, 0.85], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const glow =
          s.kind === 'outlier'
            ? `drop-shadow(0 0 22px rgba(251,191,36,0.65))`
            : s.kind === 'error'
            ? `drop-shadow(0 0 20px rgba(248,113,113,0.6))`
            : `drop-shadow(0 0 12px ${s.color}55)`;
        return (
          <g key={`b${s.id}`}>
            {/* bar body */}
            <rect
              x={x0}
              y={s.rowY}
              width={w}
              height={s.barH}
              rx={12}
              fill={barGradFor(s)}
              style={{filter: glow}}
              opacity={Math.min(1, sp + 0.25)}
            />
            {/* top specular highlight */}
            {w > 30 && (
              <rect
                x={x0 + 10}
                y={s.rowY + 5}
                width={Math.max(0, w - 20)}
                height={10}
                rx={5}
                fill="url(#barTopLight)"
                opacity={0.5 * Math.min(1, sp)}
              />
            )}
            {/* hatch overlay for the error span */}
            {s.kind === 'error' && w > 20 && (
              <rect
                x={x0}
                y={s.rowY}
                width={w}
                height={s.barH}
                rx={12}
                fill="url(#hatch)"
                opacity={Math.min(1, sp)}
              />
            )}
            {/* inside / outside label */}
            {labelFade > 0 && (
              <text
                x={labelFits ? x0 + 22 : x0 + w + 18}
                y={s.rowY + s.barH / 2 + (s.barH >= 60 ? 11 : 9)}
                fill={labelFits ? 'rgba(6,8,16,0.92)' : s.color}
                fontSize={s.barH >= 60 ? 30 : 26}
                fontFamily={MONO}
                fontWeight={700}
                opacity={labelFade}
                style={
                  labelFits
                    ? undefined
                    : {filter: `drop-shadow(0 0 6px ${s.color}88)`}
                }
              >
                {label}
              </text>
            )}
            {/* duration cap tick at the right edge */}
            {w > 24 && (
              <line
                x1={x0 + w - 2}
                y1={s.rowY - 6}
                x2={x0 + w - 2}
                y2={s.rowY + s.barH + 6}
                stroke={s.color}
                strokeWidth={3}
                opacity={0.85 * Math.min(1, sp)}
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// "p99 BREACH" tag on the outlier bar
// ---------------------------------------------------------------------------
const BreachTag: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - BREACH_FRAME,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;
  const span = SPANS[2]; // orders
  const x = xForMs(span.endMs) + 26;
  const y = span.rowY + span.barH / 2;
  return (
    <g opacity={Math.min(1, s)} transform={`translate(0, ${(1 - s) * 30})`}>
      <rect
        x={x}
        y={y - 34}
        width={252}
        height={68}
        rx={14}
        fill={'rgba(251,191,36,0.14)'}
        stroke={AMBER}
        strokeWidth={2.5}
        style={{filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.55))'}}
      />
      <polygon points={`${x - 14},${y} ${x + 2},${y - 12} ${x + 2},${y + 12}`} fill={AMBER} />
      <text
        x={x + 126}
        y={y + 12}
        fill={AMBER}
        fontSize={34}
        fontFamily={MONO}
        fontWeight={800}
        textAnchor="middle"
        letterSpacing={2}
      >
        p99 BREACH
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// "LATENCY OUTLIER" annotation with leader line to the orders bar
// ---------------------------------------------------------------------------
const OutlierCallout: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - CALLOUT_FRAME,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;
  const span = SPANS[2];
  const ax = xForMs(980);
  const barTop = span.rowY;
  const cardY = 300;
  const op = Math.min(1, s);
  return (
    <g opacity={op} transform={`translate(0, ${(1 - s) * 36})`}>
      <line
        x1={ax}
        y1={cardY + 118}
        x2={ax}
        y2={barTop - 14}
        stroke={AMBER}
        strokeWidth={2.5}
        opacity={0.75}
        strokeDasharray={'10 8'}
      />
      <circle cx={ax} cy={barTop - 14} r={9} fill={AMBER} opacity={0.95} />
      <circle cx={ax} cy={barTop - 14} r={18} fill="none" stroke={AMBER} strokeWidth={2} opacity={0.45} />
      <rect
        x={ax - 430}
        y={cardY}
        width={860}
        height={118}
        rx={18}
        fill={'rgba(10,13,24,0.92)'}
        stroke={'rgba(251,191,36,0.55)'}
        strokeWidth={2}
        style={{filter: 'drop-shadow(0 0 22px rgba(251,191,36,0.28))'}}
      />
      <text
        x={ax - 430 + 36}
        y={cardY + 50}
        fill={AMBER}
        fontSize={34}
        fontFamily={MONO}
        fontWeight={800}
        letterSpacing={4}
      >
        LATENCY OUTLIER
      </text>
      <text
        x={ax - 430 + 36}
        y={cardY + 94}
        fill={INK}
        fontSize={32}
        fontFamily={MONO}
      >
        orders.create 840ms — 3.1× p99 baseline
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Small tooltip bubble on the error span
// ---------------------------------------------------------------------------
const ErrorTooltip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - TOOLTIP_FRAME,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;
  const span = SPANS[5]; // refund.quote
  const cx = xForMs((span.startMs + span.endMs) / 2);
  const by = span.rowY;
  return (
    <g opacity={Math.min(1, s)} transform={`translate(0, ${(1 - s) * 28})`}>
      <rect
        x={cx - 380}
        y={by - 128}
        width={760}
        height={76}
        rx={14}
        fill={'rgba(20,8,10,0.94)'}
        stroke={'rgba(248,113,113,0.6)'}
        strokeWidth={2}
        style={{filter: 'drop-shadow(0 0 18px rgba(248,113,113,0.35))'}}
      />
      <polygon points={`${cx},${by - 52} ${cx - 16},${by - 78} ${cx + 16},${by - 78}`} fill={'rgba(20,8,10,0.94)'} />
      <text
        x={cx}
        y={by - 78}
        fill={RED}
        fontSize={30}
        fontFamily={MONO}
        fontWeight={700}
        textAnchor="middle"
      >
        timeout after 800ms — retry queued
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Playhead: subtle time cursor sweeping the timeline during the build
// ---------------------------------------------------------------------------
const Playhead: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(
    frame,
    [160, 200, 600, 660],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  if (fade <= 0) return null;
  const t = interpolate(frame, [160, 600], [0, T_MAX], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const x = xForMs(t);
  return (
    <g opacity={0.5 * fade}>
      <line
        x1={x}
        y1={RULER_Y + 34}
        x2={x}
        y2={CANVAS_BOTTOM}
        stroke={CYAN}
        strokeWidth={2.5}
        strokeDasharray={'4 10'}
      />
      <rect
        x={x - 92}
        y={RULER_Y - 76}
        width={184}
        height={52}
        rx={10}
        fill={'rgba(8,14,20,0.9)'}
        stroke={'rgba(34,211,238,0.5)'}
        strokeWidth={1.5}
      />
      <text
        x={x}
        y={RULER_Y - 40}
        fill={CYAN}
        fontSize={28}
        fontFamily={MONO}
        fontWeight={700}
        textAnchor="middle"
      >
        {Math.round(t)}ms
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Shimmer band sweeping the canvas during the resolve (780-900)
// ---------------------------------------------------------------------------
const Shimmer: React.FC<{frame: number}> = ({frame}) => {
  const prog = interpolate(frame, [RESOLVE_START, 900], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (prog <= 0) return null;
  const x = PX0 + prog * (PXW + 600) - 300;
  const pulse = 0.5 + 0.5 * Math.sin((frame - RESOLVE_START) * 0.08);
  return (
    <g opacity={0.5 + 0.3 * pulse}>
      <rect
        x={x - 260}
        y={CANVAS_TOP}
        width={520}
        height={CANVAS_BOTTOM - CANVAS_TOP}
        fill="url(#shimmerBand)"
        transform="skewX(-12)"
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Right panel: TRACE SUMMARY
// ---------------------------------------------------------------------------
const SummaryPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const panelIn = spring({
    frame: frame - PANEL_START,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (panelIn <= 0.001) return null;
  const p = Math.min(1, panelIn);

  const countUp = (target: number, a: number, b: number) =>
    Math.round(interpolate(frame, [a, b], [0, target], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }));

  const duration = countUp(1842, PANEL_START + 20, PAYOFF_START);
  const spans = countUp(14, PANEL_START + 30, PAYOFF_START);
  const errors = countUp(1, TOOLTIP_FRAME, PAYOFF_START);
  const services = countUp(6, PANEL_START + 40, PAYOFF_START);

  const resolved = interpolate(frame, [PAYOFF_START, PAYOFF_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const statRows: {label: string; value: string; color: string}[] = [
    {label: 'DURATION', value: `${duration.toLocaleString('en-US')}ms`, color: INK},
    {label: 'SPANS', value: `${spans}`, color: INK},
    {label: 'ERRORS', value: `${errors}`, color: errors > 0 ? RED : INK},
    {label: 'SERVICES', value: `${services}`, color: INK},
  ];

  const py = 480;
  const panelW = PANEL_X1 - PANEL_X0;
  const STAT_Y0 = py + 330; // first stat row
  const STAT_STEP = 108;
  const LAT_Y = STAT_Y0 + 4 * STAT_STEP + 6; // latency section top
  const LAT_STEP = 66;
  const CARD_Y = LAT_Y + 3 * LAT_STEP + 30; // error detail card top
  const CARD_H = 168;

  return (
    <g opacity={p} transform={`translate(${(1 - p) * 60}, 0)`}>
      {/* panel backdrop */}
      <rect
        x={PANEL_X0}
        y={py}
        width={panelW}
        height={1220}
        rx={26}
        fill={'rgba(10,13,24,0.72)'}
        stroke={'rgba(129,140,248,0.28)'}
        strokeWidth={2}
      />
      <rect x={PANEL_X0} y={py} width={panelW} height={1220} rx={26} fill="url(#panelSheen)" />

      <text
        x={PANEL_X0 + 52}
        y={py + 88}
        fill={INK}
        fontSize={40}
        fontFamily={MONO}
        fontWeight={800}
        letterSpacing={6}
      >
        TRACE SUMMARY
      </text>
      <line
        x1={PANEL_X0 + 52}
        y1={py + 122}
        x2={PANEL_X1 - 52}
        y2={py + 122}
        stroke={'rgba(129,140,248,0.3)'}
        strokeWidth={1.5}
      />

      {/* trace id */}
      <text x={PANEL_X0 + 52} y={py + 176} fill={FAINT} fontSize={26} fontFamily={MONO} letterSpacing={3}>
        TRACE ID
      </text>
      <text
        x={PANEL_X0 + 52}
        y={py + 226}
        fill={CYAN}
        fontSize={42}
        fontFamily={MONO}
        fontWeight={700}
        style={{filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.5))'}}
      >
        4bf92f…c81a
      </text>
      <text x={PANEL_X0 + 52} y={py + 272} fill={FAINT} fontSize={24} fontFamily={MONO}>
        {TRACE_ID.slice(0, 16)}…{TRACE_ID.slice(-4)}
      </text>

      {/* stat rows */}
      {statRows.map((st, i) => {
        const rowIn = spring({
          frame: frame - (PANEL_START + 30 + i * 26),
          fps,
          config: {damping: 200, stiffness: 90},
        });
        const y = STAT_Y0 + i * STAT_STEP;
        return (
          <g key={st.label} opacity={Math.min(1, rowIn)} transform={`translate(0, ${(1 - Math.min(1, rowIn)) * 24})`}>
            <text
              x={PANEL_X0 + 52}
              y={y}
              fill={FAINT}
              fontSize={27}
              fontFamily={MONO}
              letterSpacing={3}
            >
              {st.label}
            </text>
            <text
              x={PANEL_X1 - 52}
              y={y}
              fill={st.color}
              fontSize={52}
              fontFamily={MONO}
              fontWeight={800}
              textAnchor="end"
              style={st.color === RED ? {filter: 'drop-shadow(0 0 14px rgba(248,113,113,0.6))'} : {textShadow: '0 0 18px rgba(232,237,246,0.25)'}}
            >
              {st.value}
            </text>
            {i < statRows.length - 1 && (
              <line
                x1={PANEL_X0 + 52}
                y1={y + 40}
                x2={PANEL_X1 - 52}
                y2={y + 40}
                stroke={'rgba(148,163,184,0.12)'}
                strokeWidth={1.5}
              />
            )}
          </g>
        );
      })}

      {/* latency section */}
      <text
        x={PANEL_X0 + 52}
        y={STAT_Y0 + 4 * STAT_STEP - 34}
        fill={FAINT}
        fontSize={26}
        fontFamily={MONO}
        letterSpacing={3}
      >
        LATENCY
      </text>
      {LATENCY_STATS.map((l, i) => {
        const y = LAT_Y + i * LAT_STEP;
        const barW = interpolate(frame, [PANEL_START + 90 + i * 40, PAYOFF_START], [0, ((l.value / T_MAX) * (panelW - 260))], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <g key={l.label}>
            <text x={PANEL_X0 + 52} y={y + 26} fill={MUTED} fontSize={28} fontFamily={MONO}>
              {l.label}
            </text>
            <rect
              x={PANEL_X0 + 200}
              y={y}
              width={panelW - 260}
              height={30}
              rx={15}
              fill={'rgba(148,163,184,0.10)'}
            />
            <rect
              x={PANEL_X0 + 200}
              y={y}
              width={Math.max(0, barW)}
              height={30}
              rx={15}
              fill={l.color}
              opacity={0.85}
              style={{filter: `drop-shadow(0 0 8px ${l.color}66)`}}
            />
            <text
              x={PANEL_X1 - 52}
              y={y + 26}
              fill={l.color}
              fontSize={28}
              fontFamily={MONO}
              fontWeight={700}
              textAnchor="end"
            >
              {l.display}
            </text>
          </g>
        );
      })}

      {/* error detail card */}
      <g>
        <rect
          x={PANEL_X0 + 40}
          y={CARD_Y}
          width={panelW - 80}
          height={CARD_H}
          rx={20}
          fill={resolved > 0.5 ? 'rgba(8,18,20,0.9)' : 'rgba(24,10,12,0.9)'}
          stroke={resolved > 0.5 ? 'rgba(34,211,238,0.55)' : 'rgba(248,113,113,0.55)'}
          strokeWidth={2.5}
          style={{
            filter:
              resolved > 0.5
                ? 'drop-shadow(0 0 20px rgba(34,211,238,0.3))'
                : 'drop-shadow(0 0 20px rgba(248,113,113,0.32))',
          }}
        />
        <text
          x={PANEL_X0 + 84}
          y={CARD_Y + 50}
          fill={resolved > 0.5 ? CYAN : RED}
          fontSize={30}
          fontFamily={MONO}
          fontWeight={800}
          letterSpacing={3}
        >
          {resolved > 0.5 ? 'ERROR RESOLVED' : 'ERROR DETAIL'}
        </text>
        <text
          x={PANEL_X0 + 84}
          y={CARD_Y + 90}
          fill={INK}
          fontSize={30}
          fontFamily={MONO}
        >
          payments.refund.quote
        </text>
        <text
          x={PANEL_X0 + 84}
          y={CARD_Y + 126}
          fill={resolved > 0.5 ? CYAN : MUTED}
          fontSize={28}
          fontFamily={MONO}
        >
          {resolved > 0.5
            ? 'RETRY SUCCEEDED · 200 OK in 184ms'
            : 'DEADLINE_EXCEEDED · retry 1/3 queued'}
        </text>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Legend + footer
// ---------------------------------------------------------------------------
const Legend: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [560, 640], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (fade <= 0) return null;
  const items: {label: string; fill: string; hatch: boolean}[] = [
    {label: 'parent span', fill: 'url(#barIndigo)', hatch: false},
    {label: 'child span', fill: 'url(#barIndigoLight)', hatch: false},
    {label: 'latency outlier', fill: 'url(#barAmber)', hatch: false},
    {label: 'error span', fill: 'url(#barRed)', hatch: true},
  ];
  const y = 1800;
  let x = 170;
  return (
    <g opacity={fade}>
      {items.map((it) => {
        const gx = x;
        x += 560;
        return (
          <g key={it.label}>
            <rect x={gx} y={y} width={88} height={44} rx={10} fill={it.fill} />
            {it.hatch && <rect x={gx} y={y} width={88} height={44} rx={10} fill="url(#hatch)" />}
            <text x={gx + 112} y={y + 34} fill={MUTED} fontSize={30} fontFamily={FONT}>
              {it.label}
            </text>
          </g>
        );
      })}
      <text
        x={3680}
        y={y + 34}
        fill={FAINT}
        fontSize={28}
        fontFamily={MONO}
        textAnchor="end"
      >
        showing 8 of 14 spans · root: POST /v2/orders
      </text>
    </g>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [620, 700], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <text
      x={1920}
      y={2060}
      fill={'rgba(148,163,184,0.5)'}
      fontSize={26}
      fontFamily={FONT}
      textAnchor="middle"
      opacity={fade}
    >
      Trace context propagates via W3C traceparent headers · sample rate 100%.
    </text>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const DistributedTracingWaterfall: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Title frame={frame} />
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0}}
      >
        <Defs />
        <Ruler frame={frame} />
        <Gutter frame={frame} fps={fps} />
        <Connectors frame={frame} fps={fps} />
        <SpanBars frame={frame} fps={fps} />
        <BreachTag frame={frame} fps={fps} />
        <OutlierCallout frame={frame} fps={fps} />
        <ErrorTooltip frame={frame} fps={fps} />
        <Playhead frame={frame} />
        <SummaryPanel frame={frame} fps={fps} />
        <Legend frame={frame} />
        <Footer frame={frame} />
      </svg>
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}
      >
        <Defs />
        <Shimmer frame={frame} />
      </svg>
    </AbsoluteFill>
  );
};

export default DistributedTracingWaterfall;
