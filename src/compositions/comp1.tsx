/**
 * AIDashboardOverlay.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 21 s (1260 frames).
 * Floating AI analytics dashboard: an accuracy donut gauge sweeps to 87%,
 * throughput bars grow, an inference-latency line draws itself, event
 * counters tick up, pipeline progress bars fill, an activity feed streams,
 * and a keyword marquee scrolls along the bottom.
 *
 * Register in Root.tsx:
 *   <Composition id="AIDashboardOverlay" component={AIDashboardOverlay}
 *     width={3840} height={2160} fps={60} durationInFrames={1260} />
 *
 * Render:
 *   npx remotion render AIDashboardOverlay out/ai-dashboard.mp4
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
const BG = '#05080F';
const INK = '#EAF1FB';
const MUTED = 'rgba(203,213,225,0.62)';
const CYAN = '#38BDF8';
const VIOLET = '#A78BFA';
const GREEN = '#34D399';
const AMBER = '#FBBF24';
const RED = '#F87171';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const W = 3840;
const H = 2160;

// ---------------------------------------------------------------------------
// Deterministic pseudo-random (module level so every frame matches)
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

const rand = mulberry32(20260926);

// Line chart data (plot coords: 1300 x 460)
const LINE_N = 44;
const LINE_PTS: Array<{x: number; y: number}> = [];
for (let i = 0; i < LINE_N; i++) {
  const v = Math.min(0.95, Math.max(0.06, 0.68 - i * 0.009 + (rand() - 0.5) * 0.34));
  LINE_PTS.push({x: 20 + (i / (LINE_N - 1)) * 1260, y: 460 - v * 420});
}
let LINE_LEN = 0;
for (let i = 1; i < LINE_PTS.length; i++) {
  const dx = LINE_PTS[i].x - LINE_PTS[i - 1].x;
  const dy = LINE_PTS[i].y - LINE_PTS[i - 1].y;
  LINE_LEN += Math.sqrt(dx * dx + dy * dy);
}
const LINE_D = LINE_PTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
const AREA_D = `${LINE_D} L ${LINE_PTS[LINE_N - 1].x.toFixed(1)} 460 L ${LINE_PTS[0].x.toFixed(1)} 460 Z`;

// Bar chart data
const BAR_VALUES: number[] = [];
for (let i = 0; i < 12; i++) {
  BAR_VALUES.push(0.32 + rand() * 0.68);
}

const PIPELINE = [
  {label: 'TRAINING', v: 0.92, color: CYAN},
  {label: 'INFERENCE', v: 0.78, color: VIOLET},
  {label: 'INDEXING', v: 0.64, color: GREEN},
  {label: 'SYNC', v: 0.85, color: AMBER},
];

const FEED = [
  '> model v4.2 deployed to cluster',
  '> inference scaled +12 nodes',
  '> anomaly score nominal',
  '> retraining pipeline queued',
  '> embeddings refreshed',
  '> latency p99 within SLO',
];

const MARQUEE =
  'NEURAL NETWORKS ◆ PREDICTIVE ANALYTICS ◆ REAL-TIME INFERENCE ◆ DEEP LEARNING ◆ DATA PIPELINES ◆ ';

interface PanelDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  phase: number;
  delay: number;
  title: string;
}

const PANELS: PanelDef[] = [
  {id: 'donut', x: 170, y: 400, w: 780, h: 800, phase: 0.0, delay: 20, title: 'MODEL ACCURACY'},
  {id: 'bars', x: 170, y: 1280, w: 1040, h: 660, phase: 1.3, delay: 60, title: 'THROUGHPUT / HOUR'},
  {id: 'line', x: 1030, y: 400, w: 1420, h: 800, phase: 2.1, delay: 100, title: 'INFERENCE LATENCY'},
  {id: 'tickers', x: 2530, y: 400, w: 1140, h: 470, phase: 0.7, delay: 140, title: 'EVENTS PROCESSED'},
  {id: 'progress', x: 2530, y: 950, w: 1140, h: 580, phase: 1.8, delay: 180, title: 'PIPELINE STATUS'},
  {id: 'logs', x: 2530, y: 1610, w: 1140, h: 330, phase: 2.6, delay: 220, title: 'ACTIVITY FEED'},
];

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const AIDashboardOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

  const titleX = interpolate(frame, [0, 70], [-140, 0], clamp);
  const titleO = interpolate(frame, [0, 50], [0, 1], clamp);
  const liveO = frame % 70 < 38 ? 1 : 0.25;

  const renderContent = (id: string, p: PanelDef): React.ReactNode => {
    if (id === 'donut') {
      const prog = interpolate(frame, [140, 780], [0, 0.87], clamp);
      const R = 215;
      const C = 2 * Math.PI * R;
      return (
        <svg width={p.w} height={p.h - 120}>
          <defs>
            <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={CYAN} />
              <stop offset="100%" stopColor={VIOLET} />
            </linearGradient>
          </defs>
          <g transform={`translate(${p.w / 2} ${(p.h - 120) / 2})`}>
            <circle r={R} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth={64} />
            <circle
              r={R} fill="none" stroke="url(#donutGrad)" strokeWidth={64}
              strokeLinecap="round" strokeDasharray={`${(prog * C).toFixed(1)} ${C.toFixed(1)}`}
              transform="rotate(-90)"
            />
            <text textAnchor="middle" dy={-16} fontSize={44} fill={MUTED} fontFamily={MONO} letterSpacing={6}>
              ACCURACY
            </text>
            <text textAnchor="middle" dy={86} fontSize={132} fontWeight={800} fill={INK} fontFamily={FONT}>
              {Math.round(prog * 100)}%
            </text>
          </g>
        </svg>
      );
    }
    if (id === 'bars') {
      const plotW = p.w - 160;
      const maxH = 400;
      const gap = 26;
      const bw = (plotW - gap * 11) / 12;
      return (
        <svg width={p.w} height={p.h - 130}>
          {[0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={g} x1={80} x2={p.w - 80}
              y1={500 - g * maxH} y2={500 - g * maxH}
              stroke="rgba(148,163,184,0.14)" strokeWidth={2}
            />
          ))}
          {BAR_VALUES.map((v, i) => {
            const grow = interpolate(frame, [210 + i * 20, 270 + i * 20], [0, 1], clamp);
            const bh = v * maxH * grow;
            const bx = 80 + i * (bw + gap);
            return (
              <g key={i}>
                <rect x={bx} y={500 - bh} width={bw} height={Math.max(1, bh)} rx={12}
                  fill={i % 3 === 2 ? VIOLET : CYAN} opacity={0.9} />
                <text x={bx + bw / 2} y={540} textAnchor="middle" fontSize={26} fill={MUTED} fontFamily={MONO}>
                  {String(i + 1).padStart(2, '0')}
                </text>
              </g>
            );
          })}
        </svg>
      );
    }
    if (id === 'line') {
      const draw = interpolate(frame, [230, 940], [0, 1], clamp);
      const last = LINE_PTS[LINE_N - 1];
      const dotO = interpolate(frame, [900, 960], [0, 1], clamp);
      return (
        <svg width={p.w} height={p.h - 120}>
          <g transform="translate(60 90)">
            {[0.25, 0.5, 0.75, 1].map((g) => (
              <line key={g} x1={0} x2={1300} y1={460 - g * 420} y2={460 - g * 420}
                stroke="rgba(148,163,184,0.14)" strokeWidth={2} />
            ))}
            <path d={AREA_D} fill="url(#areaGrad)" opacity={draw * 0.45} />
            <path
              d={LINE_D} fill="none" stroke={CYAN} strokeWidth={10} strokeLinecap="round"
              strokeDasharray={LINE_LEN.toFixed(1)}
              strokeDashoffset={(LINE_LEN * (1 - draw)).toFixed(1)}
            />
            {dotO > 0 && (
              <g opacity={dotO}>
                <circle cx={last.x} cy={last.y} r={22 + 6 * Math.sin(frame * 0.2)} fill={CYAN} opacity={0.3} />
                <circle cx={last.x} cy={last.y} r={16} fill={CYAN} />
                <circle cx={last.x} cy={last.y} r={7} fill="#FFFFFF" />
              </g>
            )}
          </g>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CYAN} stopOpacity={0.55} />
              <stop offset="100%" stopColor={CYAN} stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
      );
    }
    if (id === 'tickers') {
      const events = interpolate(frame, [170, 1020], [0, 4281906], clamp);
      const models = Math.round(interpolate(frame, [200, 720], [0, 128], clamp));
      return (
        <div style={{padding: '10px 56px'}}>
          <div style={{fontSize: 128, fontWeight: 800, color: INK, fontFamily: FONT, lineHeight: 1.1}}>
            {fmt(events)}
          </div>
          <div style={{display: 'flex', gap: 90, marginTop: 34}}>
            <div>
              <div style={{fontSize: 30, color: MUTED, fontFamily: MONO, letterSpacing: 6}}>ACTIVE MODELS</div>
              <div style={{fontSize: 72, fontWeight: 700, color: CYAN, fontFamily: FONT}}>{models}</div>
            </div>
            <div>
              <div style={{fontSize: 30, color: MUTED, fontFamily: MONO, letterSpacing: 6}}>AVG UPTIME</div>
              <div style={{fontSize: 72, fontWeight: 700, color: GREEN, fontFamily: FONT}}>99.98%</div>
            </div>
          </div>
        </div>
      );
    }
    if (id === 'progress') {
      return (
        <div style={{padding: '6px 56px'}}>
          {PIPELINE.map((row, i) => {
            const grow = interpolate(frame, [280 + i * 46, 380 + i * 46], [0, 1], clamp);
            return (
              <div key={row.label} style={{marginBottom: 34}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12}}>
                  <span style={{fontSize: 32, color: MUTED, fontFamily: MONO, letterSpacing: 6}}>{row.label}</span>
                  <span style={{fontSize: 34, fontWeight: 700, color: INK, fontFamily: MONO}}>
                    {Math.round(row.v * grow * 100)}%
                  </span>
                </div>
                <div style={{height: 26, borderRadius: 13, background: 'rgba(148,163,184,0.14)'}}>
                  <div style={{
                    width: `${row.v * grow * 100}%`, height: '100%',
                    borderRadius: 13, background: row.color,
                    boxShadow: `0 0 24px ${row.color}66`,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    // logs
    return (
      <div style={{padding: '4px 56px'}}>
        {FEED.map((line, i) => {
          const lo = interpolate(frame, [320 + i * 85, 360 + i * 85], [0, 1], clamp);
          if (lo <= 0.001) return null;
          return (
            <div key={i} style={{
              fontSize: 31, fontFamily: MONO, color: i === 2 ? AMBER : MUTED,
              opacity: lo, marginBottom: 16,
            }}>
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  // Marquee
  const MARQ_W = 5760;
  const marqX = -((frame * 3.2) % MARQ_W);
  const strip = MARQUEE + MARQUEE + MARQUEE;

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT, overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute'}}>
        <defs>
          <pattern id="aigrid" width={170} height={170} patternUnits="userSpaceOnUse">
            <path d="M 170 0 L 0 0 0 170" fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="1" />
          </pattern>
          <radialGradient id="aiglow1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(56,189,248,0.10)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0)" />
          </radialGradient>
          <radialGradient id="aiglow2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(167,139,250,0.10)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0)" />
          </radialGradient>
          <radialGradient id="aivig" cx="50%" cy="50%" r="78%">
            <stop offset="55%" stopColor="rgba(5,8,15,0)" />
            <stop offset="100%" stopColor="rgba(2,4,9,0.9)" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={BG} />
        <rect width={W} height={H} fill="url(#aigrid)" />
        <circle cx={900} cy={700} r={900} fill="url(#aiglow1)" />
        <circle cx={3000} cy={1500} r={1000} fill="url(#aiglow2)" />
      </svg>

      {/* Header */}
      <div style={{
        position: 'absolute', left: 170 + titleX, top: 110, opacity: titleO,
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <div style={{width: 10, height: 150, background: CYAN}} />
          <div>
            <div style={{fontSize: 104, fontWeight: 800, color: INK, letterSpacing: 12, lineHeight: 1}}>
              AI ANALYTICS
            </div>
            <div style={{fontSize: 40, color: CYAN, fontFamily: MONO, letterSpacing: 15, marginTop: 14}}>
              REAL-TIME INTELLIGENCE DASHBOARD
            </div>
          </div>
        </div>
      </div>
      <div style={{
        position: 'absolute', right: 170, top: 150, textAlign: 'right',
        opacity: interpolate(frame, [40, 90], [0, 1], clamp),
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, justifyContent: 'flex-end'}}>
          <div style={{width: 22, height: 22, borderRadius: 11, background: RED, opacity: liveO}} />
          <span style={{fontSize: 52, fontWeight: 700, color: INK, fontFamily: MONO, letterSpacing: 10}}>LIVE</span>
        </div>
        <div style={{fontSize: 32, color: MUTED, fontFamily: MONO, letterSpacing: 6, marginTop: 10}}>
          SESSION 042 // CLUSTER EU-WEST
        </div>
      </div>

      {/* Panels */}
      {PANELS.map((p) => {
        const s = spring({
          frame: frame - p.delay,
          fps,
          config: {damping: 200, stiffness: 80, mass: 1},
        });
        if (s <= 0.01) return null;
        const bob = Math.sin(frame * 0.018 + p.phase) * 10;
        const rise = (1 - Math.min(1, s)) * 70;
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y + bob + rise,
              width: p.w,
              height: p.h,
              opacity: Math.min(1, s),
              background: 'rgba(9,15,28,0.82)',
              border: '2px solid rgba(56,189,248,0.25)',
              borderRadius: 28,
              overflow: 'hidden',
            }}
          >
            <div style={{
              height: 3,
              background: `linear-gradient(90deg, ${CYAN}, ${VIOLET}, transparent)`,
              opacity: 0.8,
            }} />
            <div style={{
              fontSize: 31, color: MUTED, fontFamily: MONO, letterSpacing: 9,
              padding: '26px 48px 6px',
            }}>
              {p.title}
            </div>
            {renderContent(p.id, p)}
          </div>
        );
      })}

      {/* Bottom marquee */}
      <div style={{
        position: 'absolute', left: 0, top: 2030, width: W, height: 90,
        borderTop: '2px solid rgba(56,189,248,0.2)',
        background: 'rgba(6,10,20,0.85)', overflow: 'hidden',
        opacity: interpolate(frame, [200, 280], [0, 1], clamp),
      }}>
        {[0, 1].map((k) => (
          <div key={k} style={{
            position: 'absolute', top: 0, left: 0,
            transform: `translateX(${marqX + k * MARQ_W}px)`,
            width: MARQ_W, whiteSpace: 'nowrap',
            fontSize: 40, fontFamily: MONO, letterSpacing: 8, color: 'rgba(148,197,255,0.75)',
            lineHeight: '90px',
          }}>
            {strip}
          </div>
        ))}
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', pointerEvents: 'none'}}>
        <rect width={W} height={H} fill="url(#aivig)" />
      </svg>
    </AbsoluteFill>
  );
};

export default AIDashboardOverlay;
