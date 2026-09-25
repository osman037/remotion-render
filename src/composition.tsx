/**
 * CybersecurityNetworkMap.tsx
 * Remotion composition — 4K (3840×2160), 60 fps, 15 s (900 frames), perfect loop.
 * Adobe-Stock-ready motion-graphics background.
 *
 * Usage:
 *   1. npm install remotion react react-dom
 *   2. Register this composition in your remotion.config.ts / Root.tsx:
 *        <Composition id="CybersecurityNetworkMap" component={CybersecurityNetworkMap}
 *                     width={3840} height={2160} fps={60} durationInFrames={900} />
 *   3. npx remotion render CybersecurityNetworkMap out/cybersecurity.mp4
 */

import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

// ---------------------------------------------------------------------------
// Constants & palette
// ---------------------------------------------------------------------------
const BG_COLOR = "#030712";
const GRID_COLOR = "rgba(0,242,254,0.045)";
const COLORS = {
  cyan: "#00f2fe",
  blue: "#4facfe",
  purple: "#a855f7",
  green: "#00ff88",
};
const NODE_COLORS = [
  COLORS.cyan,
  COLORS.blue,
  COLORS.purple,
  COLORS.green,
  COLORS.cyan,
  COLORS.blue,
  COLORS.cyan,
];
const TOTAL_FRAMES = 900; // 15 s × 60 fps
const NODE_COUNT = 26;
const CONNECTION_DISTANCE_RATIO = 0.22; // fraction of width
const GRID_COLS = 24;
const GRID_ROWS = 14;

// ---------------------------------------------------------------------------
// Seeded pseudo-random number generator (mulberry32) — deterministic positions
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Node descriptor generated once at module scope
// ---------------------------------------------------------------------------
interface NodeDef {
  /** base x in [0,1] */
  bx: number;
  /** base y in [0,1] */
  by: number;
  /** orbit radius as fraction of width */
  rx: number;
  ry: number;
  /** full-cycle speed (radians per frame at 60 fps) */
  speed: number;
  /** phase offset so nodes start at different points of their orbit */
  phase: number;
  color: string;
  radius: number;
  /** secondary drift — slow sinusoidal wander */
  driftAmp: number;
  driftFreq: number;
  driftPhase: number;
}

function buildNodes(): NodeDef[] {
  const rand = mulberry32(0xdeadbeef);
  return Array.from({ length: NODE_COUNT }, (_, i) => {
    const color = NODE_COLORS[i % NODE_COLORS.length];
    return {
      bx: 0.05 + rand() * 0.9,
      by: 0.05 + rand() * 0.9,
      rx: 0.03 + rand() * 0.07,
      ry: 0.02 + rand() * 0.05,
      speed: (Math.PI * 2) / (TOTAL_FRAMES * (0.6 + rand() * 0.8)),
      phase: rand() * Math.PI * 2,
      color,
      radius: 8 + rand() * 14,
      driftAmp: 0.01 + rand() * 0.025,
      driftFreq: (Math.PI * 2) / (TOTAL_FRAMES * (1.2 + rand() * 1.6)),
      driftPhase: rand() * Math.PI * 2,
    };
  });
}

const NODE_DEFS: NodeDef[] = buildNodes();

// ---------------------------------------------------------------------------
// Compute node screen positions for a given frame
// ---------------------------------------------------------------------------
function getNodePositions(
  frame: number,
  W: number,
  H: number
): { x: number; y: number }[] {
  return NODE_DEFS.map((n) => {
    const t = frame;
    const orbX = Math.cos(n.phase + n.speed * t) * n.rx;
    const orbY = Math.sin(n.phase + n.speed * t * 0.7) * n.ry;
    const driftX = Math.sin(n.driftPhase + n.driftFreq * t) * n.driftAmp;
    const driftY =
      Math.cos(n.driftPhase * 1.3 + n.driftFreq * t * 0.9) * n.driftAmp;

    return {
      x: (n.bx + orbX + driftX) * W,
      y: (n.by + orbY + driftY) * H,
    };
  });
}

// ---------------------------------------------------------------------------
// Background grid
// ---------------------------------------------------------------------------
interface GridProps {
  width: number;
  height: number;
}
const BackgroundGrid: React.FC<GridProps> = ({ width, height }) => {
  const colW = width / GRID_COLS;
  const rowH = height / GRID_ROWS;

  const verticals = useMemo(
    () =>
      Array.from({ length: GRID_COLS + 1 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={i * colW}
          y1={0}
          x2={i * colW}
          y2={height}
          stroke={GRID_COLOR}
          strokeWidth={1}
        />
      )),
    [colW, height]
  );

  const horizontals = useMemo(
    () =>
      Array.from({ length: GRID_ROWS + 1 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={i * rowH}
          x2={width}
          y2={i * rowH}
          stroke={GRID_COLOR}
          strokeWidth={1}
        />
      )),
    [rowH, width]
  );

  // Subtle cross-hair intersection dots
  const dots = useMemo(
    () =>
      Array.from({ length: GRID_COLS + 1 }, (_, ci) =>
        Array.from({ length: GRID_ROWS + 1 }, (_, ri) => (
          <circle
            key={`d${ci}-${ri}`}
            cx={ci * colW}
            cy={ri * rowH}
            r={2}
            fill="rgba(0,242,254,0.12)"
          />
        ))
      ),
    [colW, rowH]
  );

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <defs>
        <radialGradient id="bgvignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(3,7,18,0.85)" />
        </radialGradient>
      </defs>
      {verticals}
      {horizontals}
      {dots}
      {/* Vignette layer */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="url(#bgvignette)"
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Scan-line pulse — horizontal band sweeping downward on loop
// ---------------------------------------------------------------------------
interface ScanLineProps {
  frame: number;
  width: number;
  height: number;
}
const ScanLine: React.FC<ScanLineProps> = ({ frame, width, height }) => {
  const y = ((frame / TOTAL_FRAMES) * (height + 200)) % (height + 200) - 100;
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      <defs>
        <linearGradient id="scangrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="40%" stopColor="rgba(0,242,254,0.04)" />
          <stop offset="50%" stopColor="rgba(0,242,254,0.12)" />
          <stop offset="60%" stopColor="rgba(0,242,254,0.04)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <rect
        x={0}
        y={y - 60}
        width={width}
        height={120}
        fill="url(#scangrad)"
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Connection lines between nearby nodes
// ---------------------------------------------------------------------------
interface ConnectionsProps {
  positions: { x: number; y: number }[];
  width: number;
  height: number;
}
const Connections: React.FC<ConnectionsProps> = ({
  positions,
  width,
  height,
}) => {
  const maxDist = CONNECTION_DISTANCE_RATIO * width;

  const lines: React.ReactNode[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[i].x - positions[j].x;
      const dy = positions[i].y - positions[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDist) {
        const strength = 1 - dist / maxDist;
        const opacity = strength * strength * 0.75; // quadratic fade
        const colorA = NODE_DEFS[i].color;
        const colorB = NODE_DEFS[j].color;
        const gradId = `lg${i}-${j}`;
        lines.push(
          <defs key={`def-${i}-${j}`}>
            <linearGradient
              id={gradId}
              x1={positions[i].x}
              y1={positions[i].y}
              x2={positions[j].x}
              y2={positions[j].y}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={colorA} stopOpacity={opacity} />
              <stop offset="100%" stopColor={colorB} stopOpacity={opacity} />
            </linearGradient>
          </defs>
        );
        lines.push(
          <line
            key={`ln-${i}-${j}`}
            x1={positions[i].x}
            y1={positions[i].y}
            x2={positions[j].x}
            y2={positions[j].y}
            stroke={`url(#${gradId})`}
            strokeWidth={strength * 3 + 0.5}
            style={{
              filter: `drop-shadow(0 0 ${Math.round(strength * 12)}px ${colorA})`,
            }}
          />
        );
      }
    }
  }

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
    >
      {lines}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Data-packet dashes traveling along active edges
// ---------------------------------------------------------------------------
interface PacketsProps {
  positions: { x: number; y: number }[];
  frame: number;
  width: number;
}
const DataPackets: React.FC<PacketsProps> = ({ positions, frame, width }) => {
  const maxDist = CONNECTION_DISTANCE_RATIO * width;
  const packets: React.ReactNode[] = [];

  // Only render a subset of edges that have an active packet to keep it sparse
  let edgeIdx = 0;
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[i].x - positions[j].x;
      const dy = positions[i].y - positions[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDist) {
        // Each edge gets its own phase offset based on index so they travel at different times
        const edgePhase = edgeIdx * 137.508; // golden angle distribution
        const t = ((frame + edgePhase) % TOTAL_FRAMES) / TOTAL_FRAMES;
        // Only show packet 30% of the time per edge
        const showWindow = (t * 3.3) % 1;
        if (showWindow < 0.3) {
          const progress = showWindow / 0.3;
          const px = positions[i].x + (positions[j].x - positions[i].x) * progress;
          const py = positions[i].y + (positions[j].y - positions[i].y) * progress;
          const color = NODE_DEFS[i].color;
          packets.push(
            <circle
              key={`pkt-${i}-${j}`}
              cx={px}
              cy={py}
              r={5}
              fill={color}
              opacity={0.9}
              style={{ filter: `drop-shadow(0 0 10px ${color})` }}
            />
          );
        }
        edgeIdx++;
      }
    }
  }

  return (
    <svg
      width={width}
      height={2160}
      style={{ position: "absolute", top: 0, left: 0, overflow: "visible", height: "100%" }}
    >
      {packets}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Individual glowing node
// ---------------------------------------------------------------------------
interface NodeProps {
  x: number;
  y: number;
  def: NodeDef;
  frame: number;
}
const Node: React.FC<NodeProps> = ({ x, y, def, frame }) => {
  // Pulse the outer ring brightness on a per-node cycle
  const pulse =
    0.5 + 0.5 * Math.sin(def.phase + (frame * Math.PI * 2) / (TOTAL_FRAMES * 0.4));
  const outerOpacity = 0.15 + pulse * 0.35;
  const innerOpacity = 0.7 + pulse * 0.3;
  const glowRadius = def.radius * (1.8 + pulse * 0.8);

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Outer glow ring */}
      <circle
        r={glowRadius}
        fill={def.color}
        opacity={outerOpacity * 0.25}
      />
      {/* Mid glow */}
      <circle
        r={def.radius * 1.4}
        fill={def.color}
        opacity={outerOpacity * 0.5}
        style={{ filter: `blur(${def.radius * 0.6}px)` }}
      />
      {/* Core dot */}
      <circle
        r={def.radius}
        fill={def.color}
        opacity={innerOpacity}
        style={{
          filter: `drop-shadow(0 0 ${Math.round(def.radius * 1.2)}px ${def.color})`,
        }}
      />
      {/* Bright specular highlight */}
      <circle
        r={def.radius * 0.4}
        fill="white"
        opacity={0.55 + pulse * 0.2}
        cx={-def.radius * 0.2}
        cy={-def.radius * 0.2}
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Floating hex labels (decorative data readouts near some nodes)
// ---------------------------------------------------------------------------
interface HexLabelProps {
  x: number;
  y: number;
  frame: number;
  idx: number;
  color: string;
}
const HEX_STRINGS = [
  "0xA3F2", "192.168.1.1", "::1/128", "TLS1.3", "SHA-256",
  "RSA-4096", "0xDEAD", "AES-GCM", "JWT", "0xFF00",
  "HMAC", "ECDSA", "VPN", "0x7F01", "BGP/AS",
];
const HexLabel: React.FC<HexLabelProps> = ({ x, y, frame, idx, color }) => {
  const fade =
    0.3 +
    0.4 *
      Math.abs(
        Math.sin(idx * 1.3 + (frame * Math.PI * 2) / (TOTAL_FRAMES * 0.9))
      );
  const label = HEX_STRINGS[idx % HEX_STRINGS.length];
  return (
    <text
      x={x + 18}
      y={y - 8}
      fill={color}
      opacity={fade}
      fontSize={22}
      fontFamily="'Courier New', monospace"
      fontWeight="600"
      style={{ filter: `drop-shadow(0 0 6px ${color})` }}
    >
      {label}
    </text>
  );
};

// ---------------------------------------------------------------------------
// Corner UI chrome elements
// ---------------------------------------------------------------------------
const CornerChrome: React.FC<{ width: number; height: number; frame: number }> = ({
  width,
  height,
  frame,
}) => {
  const blink = frame % 90 < 45 ? 1 : 0.3;
  const scan = ((frame / TOTAL_FRAMES) * 100).toFixed(1);

  const cornerSize = 80;
  const strokeW = 3;
  const C = COLORS.cyan;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      {/* Top-left corner bracket */}
      <path
        d={`M ${cornerSize} 40 L 40 40 L 40 ${cornerSize}`}
        stroke={C}
        strokeWidth={strokeW}
        fill="none"
        opacity={0.7}
      />
      {/* Top-right corner bracket */}
      <path
        d={`M ${width - cornerSize} 40 L ${width - 40} 40 L ${width - 40} ${cornerSize}`}
        stroke={C}
        strokeWidth={strokeW}
        fill="none"
        opacity={0.7}
      />
      {/* Bottom-left corner bracket */}
      <path
        d={`M ${cornerSize} ${height - 40} L 40 ${height - 40} L 40 ${height - cornerSize}`}
        stroke={C}
        strokeWidth={strokeW}
        fill="none"
        opacity={0.7}
      />
      {/* Bottom-right corner bracket */}
      <path
        d={`M ${width - cornerSize} ${height - 40} L ${width - 40} ${height - 40} L ${width - 40} ${height - cornerSize}`}
        stroke={C}
        strokeWidth={strokeW}
        fill="none"
        opacity={0.7}
      />

      {/* Status text top-left */}
      <text
        x={60}
        y={110}
        fill={C}
        opacity={0.6}
        fontSize={28}
        fontFamily="'Courier New', monospace"
      >
        NETWORK MONITOR v2.1
      </text>
      <text
        x={60}
        y={155}
        fill={C}
        opacity={0.4}
        fontSize={22}
        fontFamily="'Courier New', monospace"
      >
        NODES: {NODE_COUNT} | SCAN: {scan}%
      </text>

      {/* Blinking REC dot top-right */}
      <circle
        cx={width - 100}
        cy={90}
        r={16}
        fill="#ef4444"
        opacity={blink * 0.85}
      />
      <text
        x={width - 74}
        y={98}
        fill="#ef4444"
        opacity={blink * 0.85}
        fontSize={26}
        fontFamily="'Courier New', monospace"
        fontWeight="700"
      >
        ● LIVE
      </text>

      {/* Bottom status bar */}
      <rect
        x={40}
        y={height - 90}
        width={width - 80}
        height={2}
        fill={C}
        opacity={0.2}
      />
      <text
        x={60}
        y={height - 55}
        fill={C}
        opacity={0.35}
        fontSize={22}
        fontFamily="'Courier New', monospace"
      >
        SECURE CHANNEL ACTIVE | ENCRYPTION: AES-256-GCM | LATENCY: {(12 + Math.sin(frame * 0.05) * 3).toFixed(1)}ms
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Radial burst emitting from center occasionally
// ---------------------------------------------------------------------------
const RadialBurst: React.FC<{ width: number; height: number; frame: number }> = ({
  width,
  height,
  frame,
}) => {
  // A burst fires every ~300 frames, lasts ~80 frames
  const CYCLE = 300;
  const DURATION = 80;
  const phase = frame % CYCLE;
  if (phase > DURATION) return null;

  const progress = phase / DURATION;
  const maxRadius = Math.sqrt(width * width + height * height) * 0.55;
  const radius = progress * maxRadius;
  const opacity = (1 - progress) * 0.12;

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      <circle
        cx={width / 2}
        cy={height / 2}
        r={radius}
        stroke={COLORS.cyan}
        strokeWidth={4}
        fill="none"
        opacity={opacity}
      />
      <circle
        cx={width / 2}
        cy={height / 2}
        r={radius * 0.85}
        stroke={COLORS.blue}
        strokeWidth={2}
        fill="none"
        opacity={opacity * 0.5}
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const CybersecurityNetworkMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Node positions computed every frame (cheap math, no state)
  const positions = getNodePositions(frame, width, height);

  // Which nodes get hex labels (every 3rd node to avoid clutter)
  const labelIndices = useMemo(
    () => NODE_DEFS.map((_, i) => i).filter((i) => i % 3 === 0),
    []
  );

  return (
    <div
      style={{
        width,
        height,
        background: BG_COLOR,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* 1 — Background grid */}
      <BackgroundGrid width={width} height={height} />

      {/* 2 — Connection lines */}
      <Connections positions={positions} width={width} height={height} />

      {/* 3 — Data packets traveling along edges */}
      <DataPackets positions={positions} frame={frame} width={width} />

      {/* 4 — Nodes SVG layer */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
      >
        {positions.map((pos, i) => (
          <Node
            key={i}
            x={pos.x}
            y={pos.y}
            def={NODE_DEFS[i]}
            frame={frame}
          />
        ))}

        {/* Hex labels on selected nodes */}
        {labelIndices.map((i) => (
          <HexLabel
            key={`lbl-${i}`}
            x={positions[i].x}
            y={positions[i].y}
            frame={frame}
            idx={i}
            color={NODE_DEFS[i].color}
          />
        ))}
      </svg>

      {/* 5 — Scan line sweep */}
      <ScanLine frame={frame} width={width} height={height} />

      {/* 6 — Radial burst pulse */}
      <RadialBurst width={width} height={height} frame={frame} />

      {/* 7 — Corner chrome / HUD */}
      <CornerChrome width={width} height={height} frame={frame} />
    </div>
  );
};

export default CybersecurityNetworkMap;
