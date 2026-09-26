/**
 * AIAnalyticsOverlay.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A screen-blend AI analytics overlay: TRUE BLACK (#000000) background,
 * bright metric chips, a neural core with traveling pulses, scrolling
 * data streams, and neural pulse lines. No opaque background decoration —
 * designed to composite with `screen` blending over footage.
 *
 * Register in Root.tsx:
 *   <Composition id="AIAnalyticsOverlay" component={AIAnalyticsOverlay}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette — bright foreground only, on true black
// ---------------------------------------------------------------------------
const CYAN = '#22D3EE';
const GREEN = '#4ADE80';
const VIOLET = '#C4B5FD';
const AMBER = '#FCD34D';
const WHITE = '#FFFFFF';
const DIM = 'rgba(255,255,255,0.55)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

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
// Header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 10, fps);
  const pulse = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.12));
  return (
    <div
      style={{
        position: 'absolute',
        top: 90,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: e,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            background: GREEN,
            opacity: pulse,
            boxShadow: '0 0 30px rgba(74,222,128,1)',
          }}
        />
        <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 10, color: WHITE, fontWeight: 700}}>
          AI ANALYTICS
        </div>
      </div>
      <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 6, color: DIM}}>
        SCREEN-BLEND OVERLAY
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Metric chips
// ---------------------------------------------------------------------------
const CHIPS = [
  {label: 'TOKENS / SEC', value: '4,208', color: CYAN},
  {label: 'ACTIVE MODELS', value: '12', color: GREEN},
  {label: 'UPTIME', value: '99.99%', color: VIOLET},
  {label: 'P95 LATENCY', value: '38 MS', color: AMBER},
];
const Chips: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 40, fps);
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        top: 300,
        display: 'flex',
        gap: 28,
        opacity: e,
        transform: `translateY(${(1 - e) * 40}px)`,
      }}
    >
      {CHIPS.map((c, i) => {
        const ce = entr(frame, 60 + i * 70, fps);
        return (
          <div
            key={c.label}
            style={{
              flex: 1,
              border: `2px solid ${c.color}`,
              borderRadius: 20,
              padding: '32px 44px',
              opacity: ce,
              boxShadow: `0 0 44px ${c.color}55, inset 0 0 30px ${c.color}22`,
              background: 'rgba(0,0,0,0)',
            }}
          >
            <div style={{fontFamily: MONO, fontSize: 26, letterSpacing: 5, color: DIM, marginBottom: 12}}>
              {c.label}
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 68,
                fontWeight: 700,
                color: WHITE,
                textShadow: `0 0 30px ${c.color}`,
              }}
            >
              {c.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Neural core network
// ---------------------------------------------------------------------------
const NeuralCore: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 120, fps);
  const cx = 1080;
  const cy = 560;
  const nodes = useMemo(
    () =>
      Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r = 380;
        return {x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.82, color: [CYAN, GREEN, VIOLET, AMBER][i % 4]};
      }),
    [],
  );
  const corePulse = 1 + 0.06 * Math.sin(frame * 0.08);
  return (
    <div style={{position: 'absolute', left: 240, top: 560, width: 1920, height: 940, opacity: e}}>
      <svg width={1920} height={940}>
        <defs>
          <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        {nodes.map((n, i) => {
          const t = (frame * 0.004 + i * 0.13) % 1;
          const px = cx + (n.x - cx) * t;
          const py = cy + (n.y - cy) * t;
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={n.color} strokeWidth={3} opacity={0.55} />
              <circle cx={px} cy={py} r={11} fill={WHITE} filter="url(#nodeGlow)" />
              <circle cx={n.x} cy={n.y} r={26} fill="#000000" stroke={n.color} strokeWidth={5} filter="url(#nodeGlow)" />
              <circle cx={n.x} cy={n.y} r={10} fill={n.color} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={120 * corePulse} fill="#000000" stroke={CYAN} strokeWidth={6} filter="url(#nodeGlow)" />
        <circle cx={cx} cy={cy} r={78 * corePulse} fill="none" stroke={GREEN} strokeWidth={4} opacity={0.8} />
        <circle cx={cx} cy={cy} r={30} fill={WHITE} filter="url(#nodeGlow)" />
        <text x={cx} y={cy + 210} textAnchor="middle" fontFamily={MONO} fontSize={36} letterSpacing={8} fill={WHITE}>
          AI CORE
        </text>
        <text x={cx} y={cy + 262} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={DIM}>
          8 NODES · MESH ACTIVE
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Data streams (right)
// ---------------------------------------------------------------------------
const HEX = '0123456789ABCDEF';
const DataStreams: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 160, fps);
  const cols = useMemo(
    () =>
      Array.from({length: 3}, (_, c) =>
        Array.from({length: 26}, (_, r) => {
          let s = '';
          for (let k = 0; k < 10; k++) s += HEX[Math.floor(rand(c * 100 + r * 17 + k * 7) * 16)];
          return s;
        }),
      ),
    [],
  );
  const colors = [GREEN, CYAN, VIOLET];
  return (
    <div
      style={{
        position: 'absolute',
        left: 2400,
        top: 560,
        width: 1200,
        height: 940,
        opacity: e,
        overflow: 'hidden',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: DIM, marginBottom: 24}}>
        DATA STREAMS
      </div>
      <div style={{display: 'flex', gap: 60}}>
        {cols.map((col, c) => {
          const off = Math.floor(frame * (0.35 + c * 0.12)) % col.length;
          const ordered = [...col.slice(off), ...col.slice(0, off)];
          return (
            <div key={c} style={{fontFamily: MONO, fontSize: 27, lineHeight: 1.9, color: colors[c], opacity: 0.85, textShadow: `0 0 18px ${colors[c]}`}}>
              {ordered.map((s, r) => (
                <div key={r} style={{opacity: r < 4 ? 0.35 + r * 0.16 : 1}}>
                  {s}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 120,
          background: 'linear-gradient(180deg, rgba(0,0,0,0), #000000)',
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Neural pulse lines (bottom)
// ---------------------------------------------------------------------------
const PulseLines: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 220, fps);
  const rows = [
    {label: 'INFERENCE', color: CYAN, speed: 0.010, y: 90},
    {label: 'TRAINING', color: GREEN, speed: 0.007, y: 230},
    {label: 'EMBEDDING', color: VIOLET, speed: 0.013, y: 370},
  ];
  const W = 3360;
  return (
    <div style={{position: 'absolute', left: 240, right: 240, top: 1560, height: 460, opacity: e}}>
      {rows.map((r) => (
        <div key={r.label} style={{position: 'absolute', top: r.y, left: 0, right: 0}}>
          <svg width={W} height={70}>
            <line x1={0} y1={35} x2={W} y2={35} stroke={r.color} strokeWidth={3} opacity={0.4} />
            {[0, 0.33, 0.66].map((o, k) => {
              const t = (frame * r.speed + o) % 1;
              const x = t * W;
              const s = Math.sin(t * Math.PI);
              return (
                <g key={k}>
                  <circle cx={x} cy={35} r={10 + 26 * s} fill={r.color} opacity={0.25} />
                  <circle cx={x} cy={35} r={12} fill={WHITE} style={{filter: `drop-shadow(0 0 14px ${r.color})`}} />
                </g>
              );
            })}
          </svg>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: -52,
              fontFamily: MONO,
              fontSize: 26,
              letterSpacing: 5,
              color: r.color,
            }}
          >
            {r.label}
          </div>
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: -52,
              fontFamily: MONO,
              fontSize: 26,
              color: DIM,
            }}
          >
            {Math.round(1200 + 800 * Math.abs(Math.sin(frame * 0.02 + r.y)))} EV/S
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
        bottom: 56,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: MONO,
        fontSize: 27,
        letterSpacing: 4,
        color: DIM,
        opacity: e,
      }}
    >
      <span>OVERLAY · 4K</span>
      <span>BLEND MODE: SCREEN</span>
      <span>AI · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition — true black, no background decoration
// ---------------------------------------------------------------------------
export const AIAnalyticsOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#000000', fontFamily: FONT}}>
      <Header frame={frame} fps={fps} />
      <Chips frame={frame} fps={fps} />
      <NeuralCore frame={frame} fps={fps} />
      <DataStreams frame={frame} fps={fps} />
      <PulseLines frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default AIAnalyticsOverlay;
