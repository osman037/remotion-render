/**
 * CybersecurityNetworkMap.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 21 s (1260 frames).
 * Animated cybersecurity network topology: nodes come online one by one,
 * data packets stream along connections, a radar sweep scans from the core,
 * three threat nodes flare red under attack and are neutralized, while a
 * live HUD tracks events analyzed, threats neutralized and an event log.
 *
 * Register in Root.tsx:
 *   <Composition id="CybersecurityNetworkMap" component={CybersecurityNetworkMap}
 *     width={3840} height={2160} fps={60} durationInFrames={1260} />
 *
 * Render:
 *   npx remotion render CybersecurityNetworkMap out/cybersecurity-network.mp4
 */

import React from 'react';
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
const BG = '#04060C';
const INK = '#E8EDF6';
const MUTED = 'rgba(203,213,225,0.6)';
const CYAN = '#22D3EE';
const BLUE = '#60A5FA';
const RED = '#F87171';
const GREEN = '#34D399';
const AMBER = '#FBBF24';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const W = 3840;
const H = 2160;

// Threat timeline (frames @60fps)
const T_START = 300; // attacks begin
const T_END = 780; // threats neutralized

// ---------------------------------------------------------------------------
// Network model (positions as fractions of the 4K canvas)
// ---------------------------------------------------------------------------
interface NodeDef {
  x: number;
  y: number;
  label: string;
  core?: boolean;
}

const NODES: NodeDef[] = [
  {x: 0.5, y: 0.52, label: 'CORE', core: true},
  {x: 0.3, y: 0.3, label: 'FW-01'},
  {x: 0.62, y: 0.24, label: 'VPN'},
  {x: 0.78, y: 0.38, label: 'DB-02'},
  {x: 0.72, y: 0.66, label: 'SRV-07'},
  {x: 0.55, y: 0.78, label: 'IOT'},
  {x: 0.36, y: 0.72, label: 'WKS-14'},
  {x: 0.2, y: 0.55, label: 'FW-02'},
  {x: 0.16, y: 0.28, label: 'EXT'},
  {x: 0.44, y: 0.16, label: 'CLOUD'},
  {x: 0.68, y: 0.14, label: 'API'},
  {x: 0.86, y: 0.58, label: 'DB-01'},
  {x: 0.84, y: 0.82, label: 'BKUP'},
  {x: 0.42, y: 0.88, label: 'WKS-22'},
  {x: 0.12, y: 0.74, label: 'VPN-2'},
  {x: 0.28, y: 0.44, label: 'IDS'},
];

const EDGES: Array<[number, number]> = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 15],
  [1, 8], [1, 15], [2, 9], [2, 10], [3, 10], [3, 11], [4, 11],
  [4, 12], [5, 12], [5, 13], [6, 13], [6, 14], [7, 14], [7, 8],
  [9, 10], [11, 12],
];

const THREAT_NODES = [3, 11, 8];

const LOGS: Array<{f: number; text: string}> = [
  {f: 150, text: '> deep scan initiated — 16 nodes online'},
  {f: 300, text: '> anomaly detected: DB-02'},
  {f: 390, text: '> anomaly detected: DB-01'},
  {f: 470, text: '> anomaly detected: EXT gateway'},
  {f: 580, text: '> isolating compromised nodes…'},
  {f: 700, text: '> countermeasures deployed'},
  {f: 800, text: '> threats neutralized — 3/3'},
  {f: 930, text: '> network integrity: 100%'},
  {f: 1060, text: '> resuming full monitoring'},
];

const px = (n: NodeDef): [number, number] => [n.x * W, n.y * H];

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const CybersecurityNetworkMap: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

  // Radar sweep
  const coreX = NODES[0].x * W;
  const coreY = NODES[0].y * H;
  const radarAngle = (frame * 1.1) % 360;
  const RADAR_R = 560;
  const wedge =
    `M ${coreX} ${coreY} ` +
    `L ${coreX + RADAR_R * Math.cos(-0.32)} ${coreY + RADAR_R * Math.sin(-0.32)} ` +
    `A ${RADAR_R} ${RADAR_R} 0 0 1 ${coreX + RADAR_R * Math.cos(0.32)} ${coreY + RADAR_R * Math.sin(0.32)} Z`;

  // HUD title entrance
  const titleX = interpolate(frame, [0, 70], [-140, 0], clamp);
  const titleO = interpolate(frame, [0, 50], [0, 1], clamp);

  // Counters
  const eventsAnalyzed = interpolate(frame, [60, 1120], [0, 2847392], clamp);
  const threatsNeutralized = interpolate(frame, [T_END, T_END + 130], [0, 3], clamp);
  const integrity = interpolate(frame, [T_END, T_END + 160], [97.4, 100], clamp);

  // LIVE blink
  const liveO = frame % 70 < 38 ? 1 : 0.25;

  // Visible log lines (last 5)
  const visibleLogs = LOGS.filter((l) => l.f <= frame).slice(-5);

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <pattern id="cygrid" width="170" height="170" patternUnits="userSpaceOnUse">
            <path d="M 170 0 L 0 0 0 170" fill="none" stroke="rgba(148,163,184,0.07)" strokeWidth="1" />
          </pattern>
          <radialGradient id="cyvig" cx="50%" cy="50%" r="78%">
            <stop offset="52%" stopColor="rgba(4,6,12,0)" />
            <stop offset="100%" stopColor="rgba(1,2,6,0.92)" />
          </radialGradient>
          <radialGradient id="coreglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.28)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill={BG} />
        <rect width={W} height={H} fill="url(#cygrid)" />

        {/* Radar sweep from the core */}
        <g transform={`rotate(${radarAngle} ${coreX} ${coreY})`} opacity={0.55}>
          <path d={wedge} fill="rgba(34,211,238,0.05)" />
          <line
            x1={coreX} y1={coreY}
            x2={coreX + RADAR_R} y2={coreY}
            stroke="rgba(34,211,238,0.55)" strokeWidth={4}
          />
        </g>
        <circle cx={coreX} cy={coreY} r={RADAR_R} fill="none" stroke="rgba(34,211,238,0.10)" strokeWidth={2} strokeDasharray="4 18" />
        <circle cx={coreX} cy={coreY} r={RADAR_R * 0.62} fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth={2} strokeDasharray="4 18" />

        {/* Connections */}
        {EDGES.map(([a, b], e) => {
          const [x0, y0] = px(NODES[a]);
          const [x1, y1] = px(NODES[b]);
          const o = interpolate(frame, [40 + e * 9, 100 + e * 9], [0, 0.5], clamp);
          if (o <= 0.001) return null;
          return (
            <g key={`e${e}`} opacity={o}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={CYAN} strokeWidth={3} />
              <line
                x1={x0} y1={y0} x2={x1} y2={y1}
                stroke="#FFFFFF" strokeWidth={3}
                strokeDasharray="8 26" strokeDashoffset={-frame * 2.4} opacity={0.7}
              />
            </g>
          );
        })}

        {/* Data packets streaming along edges */}
        {EDGES.map(([a, b], e) => {
          if (frame < 130) return null;
          const [x0, y0] = px(NODES[a]);
          const [x1, y1] = px(NODES[b]);
          const speed = 0.0032 + (e % 3) * 0.0013;
          const t = (((frame * speed + e * 0.37) % 1) + 1) % 1;
          const ex = x0 + (x1 - x0) * t;
          const ey = y0 + (y1 - y0) * t;
          return (
            <g key={`p${e}`}>
              <circle cx={ex} cy={ey} r={15} fill={CYAN} opacity={0.28} />
              <circle cx={ex} cy={ey} r={6.5} fill="#DFFBFF" opacity={0.95} />
            </g>
          );
        })}

        {/* Nodes */}
        {NODES.map((n, i) => {
          const [x, y] = px(n);
          const s = spring({
            frame: frame - (60 + i * 22),
            fps,
            config: {damping: 200, stiffness: 90, mass: 1},
          });
          if (s <= 0.001) return null;
          const isThreat = THREAT_NODES.indexOf(i) >= 0;
          const threatActive = isThreat && frame >= T_START && frame < T_END;
          const secured = isThreat && frame >= T_END;
          const color = secured ? GREEN : threatActive ? RED : n.core ? CYAN : BLUE;
          const r = (n.core ? 46 : 27) * (1 + 0.1 * Math.sin(frame * 0.12 + i * 1.7));
          const flash = secured
            ? interpolate(frame, [T_END, T_END + 70], [0, 1], clamp)
            : 1;

          return (
            <g key={`n${i}`} opacity={Math.min(1, s)}>
              {n.core && <circle cx={x} cy={y} r={150} fill="url(#coreglow)" />}
              {threatActive &&
                [0, 1, 2].map((k) => {
                  const rt = (((frame / 60) * 0.9 + k / 3) % 1 + 1) % 1;
                  return (
                    <circle
                      key={`tr${k}`}
                      cx={x} cy={y} r={34 + rt * 170}
                      fill="none" stroke={RED} strokeWidth={5}
                      opacity={(1 - rt) * 0.85}
                    />
                  );
                })}
              {secured && flash < 1 && (
                <circle
                  cx={x} cy={y} r={34 + flash * 220}
                  fill="none" stroke={GREEN} strokeWidth={7}
                  opacity={1 - flash}
                />
              )}
              {n.core && (
                <circle
                  cx={x} cy={y} r={78} fill="none"
                  stroke={CYAN} strokeWidth={3} strokeDasharray="22 30"
                  strokeDashoffset={-frame * 1.6} opacity={0.8}
                />
              )}
              <circle cx={x} cy={y} r={r + 14} fill={color} opacity={0.22} />
              <circle cx={x} cy={y} r={r} fill="#0A1220" stroke={color} strokeWidth={5} />
              <circle cx={x} cy={y} r={r * 0.34} fill={color} />
              {secured && (
                <text x={x} y={y + 16} textAnchor="middle" fontSize={44} fontWeight={900} fill="#04120B" fontFamily={FONT}>
                  ✓
                </text>
              )}
              <text
                x={x} y={y + (n.core ? 118 : 78)}
                textAnchor="middle" fontSize={34} fill={threatActive ? RED : MUTED}
                fontFamily={MONO} letterSpacing={5}
              >
                {n.label}
              </text>
            </g>
          );
        })}

        <rect width={W} height={H} fill="url(#cyvig)" />

        {/* HUD: title */}
        <g transform={`translate(${titleX} 0)`} opacity={titleO}>
          <rect x={140} y={118} width={10} height={168} fill={CYAN} />
          <text x={178} y={208} fontSize={102} fontWeight={800} fill={INK} fontFamily={FONT} letterSpacing={12}>
            CYBERSECURITY NETWORK
          </text>
          <text x={182} y={272} fontSize={42} fill={CYAN} fontFamily={MONO} letterSpacing={16}>
            REAL-TIME THREAT MONITORING
          </text>
        </g>

        {/* HUD: LIVE */}
        <g opacity={interpolate(frame, [30, 70], [0, 1], clamp)}>
          <circle cx={3480} cy={172} r={20} fill={RED} opacity={liveO} />
          <text x={3520} y={190} fontSize={52} fontWeight={700} fill={INK} fontFamily={MONO} letterSpacing={10}>
            LIVE
          </text>
          <text x={3220} y={252} fontSize={34} fill={MUTED} fontFamily={MONO} letterSpacing={6} textAnchor="end">
            SECTOR 7G // GLOBAL
          </text>
        </g>

        {/* HUD: stats panel */}
        <g opacity={interpolate(frame, [80, 140], [0, 1], clamp)}>
          <rect x={140} y={1690} width={1180} height={330} rx={26} fill="rgba(8,14,26,0.78)" stroke="rgba(34,211,238,0.28)" strokeWidth={2} />
          <text x={200} y={1780} fontSize={34} fill={MUTED} fontFamily={MONO} letterSpacing={8}>EVENTS ANALYZED</text>
          <text x={200} y={1872} fontSize={88} fontWeight={800} fill={INK} fontFamily={FONT}>{fmt(eventsAnalyzed)}</text>
          <text x={700} y={1780} fontSize={34} fill={MUTED} fontFamily={MONO} letterSpacing={8}>THREATS NEUTRALIZED</text>
          <text x={700} y={1872} fontSize={88} fontWeight={800} fill={threatsNeutralized > 0 ? GREEN : INK} fontFamily={FONT}>
            {Math.round(threatsNeutralized)}/3
          </text>
          <text x={200} y={1962} fontSize={34} fill={MUTED} fontFamily={MONO} letterSpacing={8}>NODE INTEGRITY</text>
          <text x={700} y={1962} fontSize={52} fontWeight={700} fill={integrity >= 99.9 ? GREEN : AMBER} fontFamily={MONO}>
            {integrity.toFixed(1)}%
          </text>
        </g>

        {/* HUD: event log */}
        <g opacity={interpolate(frame, [110, 170], [0, 1], clamp)}>
          <rect x={2400} y={1690} width={1300} height={330} rx={26} fill="rgba(8,14,26,0.78)" stroke="rgba(34,211,238,0.28)" strokeWidth={2} />
          <text x={2460} y={1770} fontSize={32} fill={MUTED} fontFamily={MONO} letterSpacing={8}>EVENT LOG</text>
          {visibleLogs.map((l, k) => {
            const lo = interpolate(frame, [l.f, l.f + 30], [0, 1], clamp);
            const alert = l.text.indexOf('anomaly') >= 0;
            const ok = l.text.indexOf('neutralized') >= 0 || l.text.indexOf('100%') >= 0;
            return (
              <text
                key={`log${k}`}
                x={2460} y={1832 + k * 38}
                fontSize={31} fill={alert ? RED : ok ? GREEN : MUTED}
                fontFamily={MONO} opacity={lo}
              >
                {l.text}
              </text>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default CybersecurityNetworkMap;
