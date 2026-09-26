/**
 * AIAgentOrchestration.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A multi-agent AI orchestration dashboard: a planner decomposes a goal,
 * a router assigns batches to a swarm of workers, tools get called, and an
 * amber human-approval gate holds a deploy packet before a green approval.
 * Right panel tracks token spend per agent and a live event log; the bottom
 * row resolves into summary chips.
 *
 * Register in Root.tsx:
 *   <Composition id="AIAgentOrchestration" component={AIAgentOrchestration}
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
const BG = '#05070F';
const INK = '#E8EDF6';
const MUTED = 'rgba(160,175,200,0.62)';
const FAINT = 'rgba(160,175,200,0.38)';
const CYAN = '#22D3EE';
const VIOLET = '#A78BFA';
const AMBER = '#FBBF24';
const GREEN = '#34D399';
const GRID_DOT = 'rgba(148,163,184,0.28)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// 0-120 intro | 120-600 build | 600-780 payoff | 780-900 resolve/hold
// ---------------------------------------------------------------------------
const TOKEN_START = 200;
const TOKEN_END = 700;
const TOTAL_TOKENS = 184203;
const BUDGET = 250000;
const BUDGET_FRAC = TOTAL_TOKENS / BUDGET; // 0.7368

// ---------------------------------------------------------------------------
// Canvas geometry (device px, 4K)
// ---------------------------------------------------------------------------
const CV = {x: 120, y: 380, w: 2320, h: 1320}; // x 120-2440, y 380-1700
const PLANNER = {x: 760, y: 720, r: 90};
const ROUTER = {x: 1420, y: 720, r: 70};
const WORKER_Y = 1300;
const WORKER_R = 54;
const WORKER_XS = [480, 800, 1120, 1440, 1760, 2080];
const TOOL_W = 280;
const TOOL_H = 84;
const TOOLS = [
  {x: 2140, y: 1138, label: 'VECTOR SEARCH', sub: '142ms avg', color: CYAN},
  {x: 2140, y: 1378, label: 'CODE EXEC', sub: 'sandboxed', color: GREEN},
];
const GATE = {x: 2150, y: 720, r: 80}; // diamond half-diagonal

// ---------------------------------------------------------------------------
// Deterministic seeded random (never Math.random)
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
const mod = (a: number, n: number) => ((a % n) + n) % n;
const fmtNum = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// Quadratic bezier point
// ---------------------------------------------------------------------------
interface Pt {
  x: number;
  y: number;
}
const qPoint = (t: number, p0: Pt, c: Pt, p1: Pt): Pt => {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
};
const bezPath = (p0: Pt, c: Pt, p1: Pt) =>
  `M ${p0.x} ${p0.y} Q ${c.x} ${c.y} ${p1.x} ${p1.y}`;

// ---------------------------------------------------------------------------
// Edges (trimmed to node radii)
// ---------------------------------------------------------------------------
interface Edge {
  id: string;
  p0: Pt;
  c: Pt;
  p1: Pt;
  at: number;
}
const EDGES: Edge[] = [
  {id: 'e-pr', p0: {x: 862, y: 712}, c: {x: 1110, y: 650}, p1: {x: 1338, y: 712}, at: 200},
  ...WORKER_XS.map((wx, i) => ({
    id: `e-rw${i + 1}`,
    p0: {x: 1420, y: 792},
    c: {x: (1420 + wx) / 2, y: 1060},
    p1: {x: wx, y: WORKER_Y - WORKER_R - 6},
    at: 230 + i * 22,
  })),
  {id: 'e-w5-vec', p0: {x: 1810, y: 1272}, c: {x: 1990, y: 1190}, p1: {x: 2134, y: 1180}, at: 330},
  {id: 'e-w6-code', p0: {x: 2128, y: 1336}, c: {x: 2152, y: 1380}, p1: {x: 2134, y: 1416}, at: 352},
  {id: 'e-r-apr', p0: {x: 1498, y: 712}, c: {x: 1780, y: 668}, p1: {x: 2062, y: 712}, at: 380},
];

// ---------------------------------------------------------------------------
// Looping task packets travelling the edges
// ---------------------------------------------------------------------------
interface Packet {
  p0: Pt;
  c: Pt;
  p1: Pt;
  color: string;
  size: number;
  start: number;
  travel: number;
  cycle: number;
  phase: number;
}
const PACKETS: Packet[] = [
  {p0: {x: 862, y: 712}, c: {x: 1110, y: 650}, p1: {x: 1338, y: 712}, color: CYAN, size: 9, start: 280, travel: 64, cycle: 104, phase: 0},
  {p0: {x: 1420, y: 792}, c: {x: 1270, y: 1060}, p1: {x: 1120, y: WORKER_Y - WORKER_R - 6}, color: VIOLET, size: 10, start: 300, travel: 76, cycle: 128, phase: 26},
  {p0: {x: 1420, y: 792}, c: {x: 1620, y: 1060}, p1: {x: 1760, y: WORKER_Y - WORKER_R - 6}, color: CYAN, size: 9, start: 320, travel: 76, cycle: 140, phase: 58},
  {p0: {x: 1810, y: 1272}, c: {x: 1990, y: 1190}, p1: {x: 2134, y: 1180}, color: GREEN, size: 8, start: 360, travel: 56, cycle: 118, phase: 14},
  {p0: {x: 2128, y: 1336}, c: {x: 2152, y: 1380}, p1: {x: 2134, y: 1416}, color: GREEN, size: 8, start: 380, travel: 44, cycle: 100, phase: 40},
];
const PACKET_FADE = 880;

// ---------------------------------------------------------------------------
// Approval story: amber packet router -> gate, hold, approved, -> worker-04
// ---------------------------------------------------------------------------
const APR_SEG_A = {p0: {x: 1498, y: 712}, c: {x: 1780, y: 668}, p1: {x: 2062, y: 712}, a: 440, b: 505};
const APR_HOLD_END = 560;
const APR_SEG_B = {p0: {x: 2150, y: 800}, c: {x: 1800, y: 1050}, p1: {x: 1440, y: WORKER_Y - WORKER_R - 6}, a: 560, b: 625};
const APR_FADE_END = 660;

// ---------------------------------------------------------------------------
// Right panel data
// ---------------------------------------------------------------------------
interface AgentRow {
  name: string;
  tokens: number;
  color: string;
}
const AGENT_ROWS: AgentRow[] = [
  {name: 'planner', tokens: 41208, color: CYAN},
  {name: 'router', tokens: 18940, color: VIOLET},
  {name: 'worker swarm ×6', tokens: 96410, color: GREEN},
  {name: 'tool calls', tokens: 27645, color: '#94A3B8'},
];
const MAX_ROW = Math.max(...AGENT_ROWS.map((r) => r.tokens));

interface LogLine {
  t: string;
  text: string;
  color: string;
}
const LOG_LINES: LogLine[] = [
  {t: '00:01.2', text: 'planner: decomposed goal into 24 tasks', color: CYAN},
  {t: '00:02.6', text: 'router: assigned batch → worker-03', color: VIOLET},
  {t: '00:04.1', text: 'tool call: vector.search · 142ms', color: '#94A3B8'},
  {t: '00:05.8', text: 'worker-05: completed subtask 18/24', color: GREEN},
  {t: '00:07.4', text: 'approval gate: human approved deploy', color: AMBER},
  {t: '00:08.9', text: 'planner: replanned after tool error', color: CYAN},
];

interface Chip {
  label: string;
  value: string;
  color: string;
}
const CHIPS: Chip[] = [
  {label: 'TASKS', value: '24', color: CYAN},
  {label: 'COMPLETED', value: '24', color: GREEN},
  {label: 'APPROVALS', value: '3', color: AMBER},
  {label: 'TOKENS', value: '184,203', color: VIOLET},
];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={CYAN} />
      <stop offset="55%" stopColor={VIOLET} />
      <stop offset="100%" stopColor={AMBER} />
    </linearGradient>
    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={CYAN} />
      <stop offset="100%" stopColor={VIOLET} />
    </linearGradient>
    <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={CYAN} stopOpacity={0} />
      <stop offset="50%" stopColor={CYAN} stopOpacity={0.05} />
      <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
    </linearGradient>
    <radialGradient id="bgGlow" cx="38%" cy="30%" r="75%">
      <stop offset="0%" stopColor={'rgba(34,211,238,0.08)'} />
      <stop offset="45%" stopColor={'rgba(167,139,250,0.04)'} />
      <stop offset="100%" stopColor={'rgba(5,7,15,0)'} />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="58%" stopColor={'rgba(5,7,15,0)'} />
      <stop offset="100%" stopColor={'rgba(1,2,5,0.74)'} />
    </radialGradient>
    <radialGradient id="nodeGlowCyan" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={CYAN} stopOpacity={0.35} />
      <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
    </radialGradient>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: dark base + radial glow + vignette + drifting dot grid + scan
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const dots = useMemo(() => {
    const rand = mulberry32(20260926);
    const cols = 51;
    const rows = 30;
    const spanX = CV.w + 96;
    const out: {x: number; y: number; r: number}[] = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = CV.x - 48 + mod(i * 48 - frame * 0.35, spanX);
        const y = CV.y + j * 48;
        out.push({x, y, r: 1.7 + rand() * 1.3});
      }
    }
    return out;
  }, [frame]);

  const scanX = CV.x + ((frame / 900) * (CV.w + 480)) - 240;

  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 38% 30%, rgba(34,211,238,0.08), rgba(167,139,250,0.04) 45%, rgba(5,7,15,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        {/* drifting dot grid inside the control plane */}
        <g clipPath="url(#cvClip)">
          {dots.map((d, i) => (
            <circle key={`dot${i}`} cx={d.x} cy={d.y} r={d.r} fill={GRID_DOT} />
          ))}
          <rect x={scanX - 110} y={CV.y} width={220} height={CV.h} fill="url(#scanGrad)" />
        </g>
        <clipPath id="cvClip">
          <rect x={CV.x} y={CV.y} width={CV.w} height={CV.h} />
        </clipPath>
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 10, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const op = Math.min(1, s);
  return (
    <div
      style={{
        position: 'absolute',
        top: 96 + (1 - s) * 34,
        left: 120,
        opacity: op,
      }}
    >
      <div
        style={{
          color: INK,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 84,
          letterSpacing: -1,
          textShadow: '0 0 44px rgba(34,211,238,0.25)',
        }}
      >
        AI AGENT ORCHESTRATION
      </div>
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 34,
          marginTop: 16,
          letterSpacing: 1,
        }}
      >
        planner · router · workers · human-in-the-loop
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Node entrance wrapper (spring scale + fade + rise)
// ---------------------------------------------------------------------------
const enterAnim = (frame: number, fps: number, at: number) => {
  const s = spring({frame: frame - at, fps, config: {damping: 200, stiffness: 90}});
  return s;
};

interface NodeWrapProps {
  frame: number;
  fps: number;
  at: number;
  cx: number;
  cy: number;
  breath: number;
  children: React.ReactNode;
}
const NodeWrap: React.FC<NodeWrapProps> = ({frame, fps, at, cx, cy, breath, children}) => {
  const s = enterAnim(frame, fps, at);
  if (s <= 0.001) return null;
  const op = Math.min(1, s);
  const payEnv = interpolate(frame, [700, 730, 780], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulse = 1 + payEnv * 0.05 * Math.sin((frame - 700) * 0.25) + breath * 0.006;
  const k = (0.55 + 0.45 * s) * pulse;
  const rise = (1 - s) * 44;
  return (
    <g
      opacity={op}
      transform={`translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy}) translate(0 ${rise})`}
    >
      {children}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Planner node (hexagon, cyan, with pulse ring)
// ---------------------------------------------------------------------------
const PlannerNode: React.FC<{frame: number; fps: number; breath: number}> = ({frame, fps, breath}) => {
  const hexPts = useMemo(() => {
    const pts: string[] = [];
    for (let k = 0; k < 6; k++) {
      const a = (-90 + k * 60) * (Math.PI / 180);
      pts.push(`${(PLANNER.x + PLANNER.r * Math.cos(a)).toFixed(1)},${(PLANNER.y + PLANNER.r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  }, []);

  const ringT = mod(frame * 1.1, 110);
  const ringR = PLANNER.r + ringT;
  const ringOp = (1 - ringT / 110) * 0.5;

  return (
    <NodeWrap frame={frame} fps={fps} at={60} cx={PLANNER.x} cy={PLANNER.y} breath={breath}>
      <circle cx={PLANNER.x} cy={PLANNER.y} r={PLANNER.r + 60} fill="url(#nodeGlowCyan)" opacity={0.55 + breath * 0.2} />
      <circle cx={PLANNER.x} cy={PLANNER.y} r={ringR} fill="none" stroke={CYAN} strokeWidth={3} opacity={ringOp} />
      <polygon
        points={hexPts}
        fill="rgba(34,211,238,0.10)"
        stroke={CYAN}
        strokeWidth={4}
        style={{filter: 'drop-shadow(0 0 22px rgba(34,211,238,0.65))'}}
      />
      <circle cx={PLANNER.x} cy={PLANNER.y} r={26} fill={CYAN} opacity={0.9} />
      <circle cx={PLANNER.x} cy={PLANNER.y} r={26} fill="#05070F" opacity={0.55} />
      <circle cx={PLANNER.x} cy={PLANNER.y} r={11} fill={CYAN} />
      <text x={PLANNER.x} y={PLANNER.y + PLANNER.r + 56} fill={INK} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={3} textAnchor="middle">
        PLANNER
      </text>
      <text x={PLANNER.x} y={PLANNER.y + PLANNER.r + 98} fill={MUTED} fontSize={25} fontFamily={FONT} textAnchor="middle">
        decomposes goals
      </text>
    </NodeWrap>
  );
};

// ---------------------------------------------------------------------------
// Router node (violet circle)
// ---------------------------------------------------------------------------
const RouterNode: React.FC<{frame: number; fps: number; breath: number}> = ({frame, fps, breath}) => (
  <NodeWrap frame={frame} fps={fps} at={120} cx={ROUTER.x} cy={ROUTER.y} breath={breath}>
    <circle cx={ROUTER.x} cy={ROUTER.y} r={ROUTER.r + 44} fill={VIOLET} opacity={0.10 + breath * 0.03} />
    <circle
      cx={ROUTER.x}
      cy={ROUTER.y}
      r={ROUTER.r}
      fill="rgba(167,139,250,0.12)"
      stroke={VIOLET}
      strokeWidth={4}
      style={{filter: 'drop-shadow(0 0 20px rgba(167,139,250,0.6))'}}
    />
    <circle cx={ROUTER.x} cy={ROUTER.y} r={ROUTER.r - 22} fill="none" stroke={VIOLET} strokeWidth={2} opacity={0.5} strokeDasharray="10 12" />
    <circle cx={ROUTER.x} cy={ROUTER.y} r={12} fill={VIOLET} />
    <text x={ROUTER.x} y={ROUTER.y + ROUTER.r + 52} fill={INK} fontSize={32} fontFamily={MONO} fontWeight={700} letterSpacing={3} textAnchor="middle">
      ROUTER
    </text>
    <text x={ROUTER.x} y={ROUTER.y + ROUTER.r + 92} fill={MUTED} fontSize={24} fontFamily={FONT} textAnchor="middle">
      assigns batches
    </text>
  </NodeWrap>
);

// ---------------------------------------------------------------------------
// Worker nodes (teal circles, staggered)
// ---------------------------------------------------------------------------
const WorkerNode: React.FC<{frame: number; fps: number; breath: number; idx: number; x: number}> = ({
  frame,
  fps,
  breath,
  idx,
  x,
}) => (
  <NodeWrap frame={frame} fps={fps} at={150 + idx * 36} cx={x} cy={WORKER_Y} breath={breath}>
    <circle cx={x} cy={WORKER_Y} r={WORKER_R + 26} fill={GREEN} opacity={0.08 + breath * 0.02} />
    <circle
      cx={x}
      cy={WORKER_Y}
      r={WORKER_R}
      fill="rgba(52,211,153,0.10)"
      stroke={idx % 2 === 0 ? GREEN : CYAN}
      strokeWidth={3.5}
      style={{filter: `drop-shadow(0 0 16px ${idx % 2 === 0 ? 'rgba(52,211,153,0.55)' : 'rgba(34,211,238,0.55)'})`}}
    />
    <circle cx={x} cy={WORKER_Y} r={9} fill={idx % 2 === 0 ? GREEN : CYAN} opacity={0.95} />
    <circle cx={x} cy={WORKER_Y - WORKER_R - 14} r={7} fill={AMBER} opacity={0.9} />
    <text x={x} y={WORKER_Y + WORKER_R + 46} fill={INK} fontSize={28} fontFamily={MONO} fontWeight={700} letterSpacing={2} textAnchor="middle">
      {`WORKER-0${idx + 1}`}
    </text>
    <text x={x} y={WORKER_Y + WORKER_R + 82} fill={MUTED} fontSize={22} fontFamily={FONT} textAnchor="middle">
      executes subtasks
    </text>
  </NodeWrap>
);

// ---------------------------------------------------------------------------
// Tool nodes (small rounded rects)
// ---------------------------------------------------------------------------
const ToolNode: React.FC<{frame: number; fps: number; breath: number; idx: number}> = ({frame, fps, breath, idx}) => {
  const t = TOOLS[idx];
  return (
    <NodeWrap frame={frame} fps={fps} at={360} cx={t.x + TOOL_W / 2} cy={t.y + TOOL_H / 2} breath={breath}>
      <rect
        x={t.x}
        y={t.y}
        width={TOOL_W}
        height={TOOL_H}
        rx={20}
        fill="rgba(148,163,184,0.07)"
        stroke={t.color}
        strokeWidth={2.5}
        style={{filter: `drop-shadow(0 0 12px ${t.color}55)`}}
      />
      <text x={t.x + TOOL_W / 2} y={t.y + 38} fill={INK} fontSize={27} fontFamily={MONO} fontWeight={700} letterSpacing={2} textAnchor="middle">
        {t.label}
      </text>
      <text x={t.x + TOOL_W / 2} y={t.y + 66} fill={MUTED} fontSize={21} fontFamily={FONT} textAnchor="middle">
        {t.sub}
      </text>
    </NodeWrap>
  );
};

// ---------------------------------------------------------------------------
// Human approval gate (amber diamond, blinking while awaiting)
// ---------------------------------------------------------------------------
const ApprovalGate: React.FC<{frame: number; fps: number; breath: number}> = ({frame, fps, breath}) => {
  const s = enterAnim(frame, fps, 420);
  if (s <= 0.001) return null;
  const op = Math.min(1, s);
  const awaiting = frame >= APR_SEG_A.b && frame < APR_HOLD_END;
  const blink = awaiting ? 0.55 + 0.45 * Math.sin(frame * 0.45) : 1;
  const approved = frame >= 575;
  const payEnv = interpolate(frame, [700, 730, 780], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const k = (0.55 + 0.45 * s) * (1 + payEnv * 0.05 * Math.sin((frame - 700) * 0.25) + breath * 0.006);

  // checkmark draw 555 -> 600
  const checkDraw = interpolate(frame, [555, 600], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // chip spring in
  const chipS = spring({frame: frame - 575, fps, config: {damping: 200, stiffness: 90}});

  return (
    <g
      opacity={op}
      transform={`translate(${GATE.x} ${GATE.y}) scale(${k}) translate(${-GATE.x} ${-GATE.y}) translate(0 ${(1 - s) * 44})`}
    >
      <text x={GATE.x} y={GATE.y - 130} fill={AMBER} fontSize={32} fontFamily={MONO} fontWeight={700} letterSpacing={3} textAnchor="middle" opacity={blink}>
        HUMAN APPROVAL
      </text>
      <polygon
        points={`${GATE.x},${GATE.y - GATE.r} ${GATE.x + GATE.r},${GATE.y} ${GATE.x},${GATE.y + GATE.r} ${GATE.x - GATE.r},${GATE.y}`}
        fill="rgba(251,191,36,0.10)"
        stroke={AMBER}
        strokeWidth={4}
        opacity={blink}
        style={{filter: 'drop-shadow(0 0 22px rgba(251,191,36,0.65))'}}
      />
      <text x={GATE.x} y={GATE.y + 8} fill={AMBER} fontSize={40} fontFamily={MONO} fontWeight={800} textAnchor="middle" opacity={blink}>
        ?
      </text>
      <text x={GATE.x} y={GATE.y + GATE.r + 46} fill={MUTED} fontSize={24} fontFamily={FONT} textAnchor="middle">
        deploy gate
      </text>

      {/* blinking "AWAITING APPROVAL" while the packet waits */}
      {awaiting && (
        <text
          x={GATE.x}
          y={GATE.y + GATE.r + 130}
          fill={AMBER}
          fontSize={27}
          fontFamily={MONO}
          fontWeight={700}
          letterSpacing={4}
          textAnchor="middle"
          opacity={blink}
        >
          AWAITING APPROVAL
        </text>
      )}

      {/* drawn checkmark once approved */}
      {checkDraw > 0.001 && (
        <path
          d={`M ${GATE.x - 34} ${GATE.y + 2} L ${GATE.x - 10} ${GATE.y + 26} L ${GATE.x + 38} ${GATE.y - 30}`}
          fill="none"
          stroke={approved ? GREEN : AMBER}
          strokeWidth={11}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - checkDraw}
          style={{filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.8))'}}
        />
      )}

      {/* APPROVED chip */}
      {chipS > 0.001 && (
        <g opacity={Math.min(1, chipS)} transform={`translate(0 ${(1 - chipS) * 26})`}>
          <rect
            x={GATE.x - 180}
            y={GATE.y + GATE.r + 100}
            width={360}
            height={84}
            rx={42}
            fill="rgba(52,211,153,0.12)"
            stroke={GREEN}
            strokeWidth={3}
            style={{filter: 'drop-shadow(0 0 14px rgba(52,211,153,0.55))'}}
          />
          <text
            x={GATE.x}
            y={GATE.y + GATE.r + 155}
            fill={GREEN}
            fontSize={34}
            fontFamily={MONO}
            fontWeight={800}
            letterSpacing={5}
            textAnchor="middle"
          >
            ✓ APPROVED
          </text>
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Control plane: frame, edges, nodes, packets, approval packet
// ---------------------------------------------------------------------------
const ControlPlane: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const breath = 0.5 + 0.5 * Math.sin(frame * 0.04);
  const frameIn = interpolate(frame, [40, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      {/* frame */}
      <g opacity={frameIn}>
        <rect
          x={CV.x}
          y={CV.y}
          width={CV.w}
          height={CV.h}
          fill="none"
          stroke="rgba(148,163,184,0.28)"
          strokeWidth={2}
        />
        {/* corner ticks */}
        {[
          {x: CV.x, y: CV.y, dx: 1, dy: 1},
          {x: CV.x + CV.w, y: CV.y, dx: -1, dy: 1},
          {x: CV.x, y: CV.y + CV.h, dx: 1, dy: -1},
          {x: CV.x + CV.w, y: CV.y + CV.h, dx: -1, dy: -1},
        ].map((c, i) => (
          <g key={`ct${i}`}>
            <line x1={c.x} y1={c.y} x2={c.x + c.dx * 44} y2={c.y} stroke={CYAN} strokeWidth={5} />
            <line x1={c.x} y1={c.y} x2={c.x} y2={c.y + c.dy * 44} stroke={CYAN} strokeWidth={5} />
          </g>
        ))}
        <text x={CV.x + 34} y={CV.y + 74} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={5}>
          CONTROL PLANE · LIVE SWARM
        </text>
        <text x={CV.x + CV.w - 34} y={CV.y + 74} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={3} textAnchor="end">
          11 NODES · 10 EDGES
        </text>
      </g>

      {/* edges drawn via strokeDashoffset */}
      {EDGES.map((e) => {
        const dp = interpolate(frame, [e.at, e.at + 120], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (dp <= 0.001) return null;
        return (
          <path
            key={e.id}
            d={bezPath(e.p0, e.c, e.p1)}
            fill="none"
            stroke={e.id === 'e-r-apr' ? AMBER : 'url(#edgeGrad)'}
            strokeWidth={e.id === 'e-r-apr' ? 5 : 4}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - dp}
            opacity={0.75}
            style={{filter: `drop-shadow(0 0 10px ${e.id === 'e-r-apr' ? 'rgba(251,191,36,0.6)' : 'rgba(34,211,238,0.45)'})`}}
          />
        );
      })}

      {/* looping task packets */}
      {PACKETS.map((p, i) => {
        const rel = frame - p.start + p.phase;
        if (rel < 0 || frame > PACKET_FADE) return null;
        const cyc = mod(rel, p.cycle);
        if (cyc > p.travel) return null;
        const t = cyc / p.travel;
        const pos = qPoint(t, p.p0, p.c, p.p1);
        const trail = qPoint(Math.max(0, t - 0.07), p.p0, p.c, p.p1);
        const dim = frame > 760 ? 0.45 : 0.95;
        return (
          <g key={`pkt${i}`} opacity={dim}>
            <circle cx={trail.x} cy={trail.y} r={p.size * 0.7} fill={p.color} opacity={0.35} />
            <circle cx={pos.x} cy={pos.y} r={p.size * 1.9} fill={p.color} opacity={0.25} filter="url(#softGlow)" />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={p.size}
              fill={p.color}
              style={{filter: `drop-shadow(0 0 12px ${p.color})`}}
            />
          </g>
        );
      })}

      {/* approval packet: router -> gate, hold, gate -> worker-04 */}
      <ApprovalPacket frame={frame} />

      <PlannerNode frame={frame} fps={fps} breath={breath} />
      <RouterNode frame={frame} fps={fps} breath={breath} />
      {WORKER_XS.map((wx, i) => (
        <WorkerNode key={`w${i}`} frame={frame} fps={fps} breath={breath} idx={i} x={wx} />
      ))}
      {TOOLS.map((_, i) => (
        <ToolNode key={`t${i}`} frame={frame} fps={fps} breath={breath} idx={i} />
      ))}
      <ApprovalGate frame={frame} fps={fps} breath={breath} />

      {/* legend */}
      {frame > 420 && (
        <g opacity={interpolate(frame, [420, 460], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          {[
            {c: CYAN, l: 'task packet'},
            {c: VIOLET, l: 'routing'},
            {c: GREEN, l: 'tool result'},
            {c: AMBER, l: 'approval'},
          ].map((it, i) => (
            <g key={`lg${i}`} transform={`translate(${CV.x + 40 + i * 340}, ${CV.y + CV.h - 52})`}>
              <circle cx={0} cy={0} r={10} fill={it.c} />
              <text x={26} y={9} fill={MUTED} fontSize={24} fontFamily={MONO}>
                {it.l}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// The amber approval packet with its hold-and-release story
// ---------------------------------------------------------------------------
const ApprovalPacket: React.FC<{frame: number}> = ({frame}) => {
  let pos: Pt | null = null;
  let trail: Pt | null = null;
  let op = 0;

  if (frame >= APR_SEG_A.a && frame < APR_SEG_A.b) {
    const t = (frame - APR_SEG_A.a) / (APR_SEG_A.b - APR_SEG_A.a);
    pos = qPoint(t, APR_SEG_A.p0, APR_SEG_A.c, APR_SEG_A.p1);
    trail = qPoint(Math.max(0, t - 0.08), APR_SEG_A.p0, APR_SEG_A.c, APR_SEG_A.p1);
    op = interpolate(frame, [APR_SEG_A.a, APR_SEG_A.a + 18], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame >= APR_SEG_A.b && frame < APR_HOLD_END) {
    pos = APR_SEG_A.p1;
    trail = APR_SEG_A.p1;
    op = 1;
  } else if (frame >= APR_SEG_B.a && frame < APR_SEG_B.b) {
    const t = (frame - APR_SEG_B.a) / (APR_SEG_B.b - APR_SEG_B.a);
    pos = qPoint(t, APR_SEG_B.p0, APR_SEG_B.c, APR_SEG_B.p1);
    trail = qPoint(Math.max(0, t - 0.08), APR_SEG_B.p0, APR_SEG_B.c, APR_SEG_B.p1);
    op = 1;
  } else if (frame >= APR_SEG_B.b && frame < APR_FADE_END) {
    pos = APR_SEG_B.p1;
    trail = APR_SEG_B.p1;
    op = interpolate(frame, [APR_SEG_B.b, APR_FADE_END], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  if (!pos || !trail || op <= 0) return null;

  const holding = frame >= APR_SEG_A.b && frame < APR_HOLD_END;
  const pulse = holding ? 1 + 0.35 * Math.sin(frame * 0.45) : 1;

  return (
    <g opacity={op}>
      <circle cx={trail.x} cy={trail.y} r={11} fill={AMBER} opacity={0.35} />
      <circle cx={pos.x} cy={pos.y} r={26 * pulse} fill={AMBER} opacity={0.25} filter="url(#softGlow)" />
      <circle
        cx={pos.x}
        cy={pos.y}
        r={13 * pulse}
        fill={AMBER}
        style={{filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.9))'}}
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Right panel: token spend, budget bar, per-agent rows, event log
// ---------------------------------------------------------------------------
const PX = 2560; // panel left
const PW = 1160; // panel width (2560-3720)
const PIN = 60; // inner padding

const RightPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const panelIn = interpolate(frame, [60, 110], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const tokT = ease(
    interpolate(frame, [TOKEN_START, TOKEN_END], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const tokens = TOTAL_TOKENS * tokT;
  const budgetFill = interpolate(frame, [260, 680], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }) * BUDGET_FRAC;

  const breathe = 0.5 + 0.5 * Math.sin(frame * 0.06);

  return (
    <div
      style={{
        position: 'absolute',
        left: PX,
        top: 96,
        width: PW,
        height: 1604,
        opacity: panelIn,
      }}
    >
      <svg width={PW} height={1604} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={2} y={2} width={PW - 4} height={1600} rx={26} fill="rgba(148,163,184,0.045)" stroke="rgba(148,163,184,0.22)" strokeWidth={2} />

        {/* TOKEN SPEND header */}
        <text x={PIN} y={110} fill={FAINT} fontSize={34} fontFamily={MONO} letterSpacing={8}>
          TOKEN SPEND
        </text>
        <text x={PIN} y={290} fill={INK} fontSize={104} fontFamily={MONO} fontWeight={800}
          style={{textShadow: `0 0 30px rgba(34,211,238,${0.3 + breathe * 0.25})`}}>
          {fmtNum(tokens)}
        </text>
        <text x={PIN} y={344} fill={MUTED} fontSize={26} fontFamily={FONT}>
          cumulative tokens this run
        </text>

        {/* budget bar */}
        <text x={PIN} y={446} fill={FAINT} fontSize={27} fontFamily={MONO} letterSpacing={3}>
          BUDGET {fmtNum(BUDGET)}
        </text>
        <text x={PW - PIN} y={446} fill={AMBER} fontSize={27} fontFamily={MONO} textAnchor="end" fontWeight={700}>
          {(budgetFill * 100).toFixed(1)}% USED
        </text>
        <rect x={PIN} y={470} width={PW - PIN * 2} height={26} rx={13} fill="rgba(148,163,184,0.14)" />
        <rect x={PIN} y={470} width={(PW - PIN * 2) * budgetFill} height={26} rx={13} fill="url(#barGrad)"
          style={{filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.5))'}} />
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={`tk${f}`}
            x1={PIN + (PW - PIN * 2) * f}
            y1={464}
            x2={PIN + (PW - PIN * 2) * f}
            y2={502}
            stroke="rgba(5,7,15,0.8)"
            strokeWidth={2}
          />
        ))}

        <line x1={PIN} y1={586} x2={PW - PIN} y2={586} stroke="rgba(148,163,184,0.2)" strokeWidth={1.5} />

        {/* per-agent rows */}
        <text x={PIN} y={656} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={5}>
          PER-AGENT SPEND
        </text>
        {AGENT_ROWS.map((r, i) => {
          const rowY = 716 + i * 112;
          const fillT = interpolate(frame, [300 + i * 60, 560 + i * 60], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const val = Math.round(r.tokens * ease(Math.min(1, fillT)));
          return (
            <g key={`ar${i}`} opacity={interpolate(frame, [280 + i * 60, 330 + i * 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
              <text x={PIN} y={rowY} fill={MUTED} fontSize={29} fontFamily={MONO}>
                {r.name}
              </text>
              <text x={PW - PIN} y={rowY} fill={INK} fontSize={29} fontFamily={MONO} fontWeight={700} textAnchor="end">
                {fmtNum(val)}
              </text>
              <rect x={PIN} y={rowY + 18} width={PW - PIN * 2} height={16} rx={8} fill="rgba(148,163,184,0.12)" />
              <rect
                x={PIN}
                y={rowY + 18}
                width={(PW - PIN * 2) * (r.tokens / MAX_ROW) * fillT}
                height={16}
                rx={8}
                fill={r.color}
                opacity={0.85}
              />
            </g>
          );
        })}

        <line x1={PIN} y1={1190} x2={PW - PIN} y2={1190} stroke="rgba(148,163,184,0.2)" strokeWidth={1.5} />

        {/* event log */}
        <text x={PIN} y={1260} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={5}>
          EVENT LOG
        </text>
        {LOG_LINES.map((ln, i) => {
          const s = spring({frame: frame - (180 + i * 70), fps, config: {damping: 200, stiffness: 90}});
          if (s <= 0.001) return null;
          const ly = 1322 + i * 62;
          return (
            <g key={`ll${i}`} opacity={Math.min(1, s)} transform={`translate(${(1 - s) * 30}, 0)`}>
              <circle cx={PIN + 8} cy={ly - 8} r={7} fill={ln.color} />
              <text x={PIN + 34} y={ly} fill={FAINT} fontSize={24} fontFamily={MONO}>
                {ln.t}
              </text>
              <text x={PIN + 168} y={ly} fill={INK} fontSize={25} fontFamily={MONO}>
                {ln.text}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bottom stat chips (payoff row)
// ---------------------------------------------------------------------------
const StatChips: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const chipW = 780;
  const gap = 60;
  const totalW = CHIPS.length * chipW + (CHIPS.length - 1) * gap;
  const startX = (3840 - totalW) / 2;
  const y = 1810;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 3840, height: 2160, pointerEvents: 'none'}}>
      {CHIPS.map((ch, i) => {
        const s = spring({frame: frame - (640 + i * 40), fps, config: {damping: 200, stiffness: 95}});
        if (s <= 0.001) return null;
        const x = startX + i * (chipW + gap);
        return (
          <div
            key={ch.label}
            style={{
              position: 'absolute',
              left: x,
              top: y + (1 - s) * 56,
              width: chipW,
              height: 190,
              borderRadius: 24,
              background: `linear-gradient(160deg, ${ch.color}1f, ${ch.color}05 60%, rgba(255,255,255,0.02))`,
              border: `1.5px solid ${ch.color}66`,
              padding: '30px 46px',
              opacity: Math.min(1, s),
            }}
          >
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>{ch.label}</div>
            <div
              style={{
                color: ch.color,
                fontFamily: MONO,
                fontWeight: 800,
                fontSize: 82,
                lineHeight: 1.15,
                marginTop: 8,
                textShadow: `0 0 24px ${ch.color}55`,
              }}
            >
              {ch.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Footer note
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [700, 760], [0, 1], {
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
      Agentic orchestration: 80% of enterprise apps embed an AI agent (2026) · token budgets enforced per run.
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const AIAgentOrchestration: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <ControlPlane frame={frame} fps={fps} />
      <RightPanel frame={frame} fps={fps} />
      <StatChips frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default AIAgentOrchestration;
