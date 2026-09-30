/**
 * PodcastDistributionFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral podcast distribution flow for podcast launch courses,
 * hosting affiliates, and consultants: record the episode, edit the
 * timeline, upload to the host, radiate the RSS feed, light up directory
 * tiles, and count the first downloads. Demand-validated 2026-09-30
 * (PLAUSIBLE-moderate — produce late in the batch).
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette (podcast violet on deep plum)
// ---------------------------------------------------------------------------
const BG = '#0C0812';
const INK = '#F5F0FA';
const MUTED = 'rgba(245,240,250,0.58)';
const VIOLET = '#A78BFA';
const PINK = '#F472B6';
const CYAN = '#22D3EE';
const GREEN = '#34D399';
const GOLD = '#FFC94D';
const PANEL = 'rgba(14,10,22,0.94)';
const HAIRLINE = 'rgba(245,240,250,0.15)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const REC_START = 80;
const EDIT_START = 260;
const UP_START = 430;
const RSS_START = 560;
const DIR_START = 640;
const DL_START = 770;

const DIRS = ['APPLE', 'SPOTIFY', 'YOUTUBE', 'AMAZON', 'POCKET', 'OVERCAST', 'CASTRO', 'TUNEIN'];

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="pdGlow" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stopColor="#2B1A4E" stopOpacity={0.85} />
      <stop offset="55%" stopColor="#1A1230" stopOpacity={0.32} />
      <stop offset="100%" stopColor="#0C0812" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="pdVig" cx="50%" cy="50%" r="72%">
      <stop offset="0%" stopColor="#000000" stopOpacity={0} />
      <stop offset="78%" stopColor="#000000" stopOpacity={0} />
      <stop offset="100%" stopColor="#040206" stopOpacity={0.85} />
    </radialGradient>
    <linearGradient id="pdSweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#A78BFA" stopOpacity={0} />
      <stop offset="50%" stopColor="#A78BFA" stopOpacity={0.10} />
      <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
    </linearGradient>
    <filter id="pdGlow10" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation={10} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: glow + vignette + floating soundwave dots + sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 120; i++) {
    const bx = random(`pd-dot-x-${i}`) * 3840;
    const by = random(`pd-dot-y-${i}`) * 2160;
    const y = ((by + frame * (0.5 + random(`pd-dot-v-${i}`) * 1.2)) % 2300) - 70;
    const o = 0.03 + random(`pd-dot-o-${i}`) * 0.06;
    const r = 2.5 + random(`pd-dot-r-${i}`) * 6;
    dots.push(<circle key={i} cx={bx} cy={y} r={r} fill="#A78BFA" opacity={o} />);
  }
  const sweepX = interpolate(frame, [0, 900], [-500, 4340], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      <rect width={3840} height={2160} fill={BG} />
      <rect width={3840} height={2160} fill="url(#pdGlow)" />
      <g>{dots}</g>
      <rect x={sweepX - 300} y={0} width={600} height={2160} fill="url(#pdSweep)" />
      <rect width={3840} height={2160} fill="url(#pdVig)" />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Film grain
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 1100;

const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const rects: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`pd-grain-x-${frame}-${i}`) * 3840;
    const y = random(`pd-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`pd-grain-o-${frame}-${i}`) * 0.045;
    const s = 2 + random(`pd-grain-s-${frame}-${i}`) * 2.5;
    const white = random(`pd-grain-w-${frame}-${i}`) > 0.5;
    rects.push(
      <rect key={i} x={x} y={y} width={s} height={s} fill={white ? '#FFFFFF' : '#000000'} opacity={o} />,
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      {rects}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const p = spring({frame: Math.max(0, frame - 8), fps, config: {damping: 120, stiffness: 160}});
  const y = interpolate(p, [0, 1], [60, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = interpolate(p, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 100, left: 0, right: 0, opacity: op, transform: `translateY(${y}px)`, textAlign: 'center'}}>
      <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 10, color: MUTED}}>PODCAST LAUNCH</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 104, letterSpacing: 8, color: INK, marginTop: 22}}>
        RECORD → <span style={{color: VIOLET}}>EVERYWHERE</span>
      </div>
      <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 10, color: MUTED, marginTop: 14}}>
        ONE UPLOAD · EVERY DIRECTORY
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage A: recording waveform (animated bars)
// ---------------------------------------------------------------------------
const BARS = 72;

const RecordStage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inn = spring({frame: Math.max(0, frame - REC_START), fps, config: {damping: 110, stiffness: 150}});
  const op = interpolate(inn, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fade =
    frame > 250 ? interpolate(frame, [250, 290], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  if (op * fade <= 0) return null;
  const rec = frame >= REC_START + 20;
  const secs = Math.floor(interpolate(frame, [REC_START + 20, 250], [0, 162], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const bars: React.ReactElement[] = [];
  const bw = 2900 / BARS;
  for (let i = 0; i < BARS; i++) {
    const live = rec && i / BARS < (frame - REC_START - 20) / 220;
    const h = live
      ? 40 + Math.abs(Math.sin(i * 0.7 + frame * 0.25)) * 200 + random(`pd-bar-${i}`) * 60
      : 24;
    bars.push(
      <rect
        key={i}
        x={470 + i * bw}
        y={1180 - h / 2}
        width={bw - 10}
        height={h}
        rx={8}
        fill={live ? VIOLET : 'rgba(245,240,250,0.12)'}
        filter={live ? 'url(#pdGlow10)' : undefined}
      />,
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op * fade}}>
      <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
        {bars}
        <text x={1920} y={880} textAnchor="middle" fontFamily={MONO} fontSize={36} letterSpacing={10} fill={MUTED}>
          ● REC — EPISODE 042 · {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
        </text>
        <text x={1920} y={1420} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={64} letterSpacing={6} fill={INK}>
          RECORD YOUR EPISODE
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage B: edit timeline with cuts
// ---------------------------------------------------------------------------
const EditStage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inn = spring({frame: Math.max(0, frame - EDIT_START), fps, config: {damping: 110, stiffness: 150}});
  const op = interpolate(inn, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fade =
    frame > 420 ? interpolate(frame, [420, 460], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  if (op * fade <= 0) return null;
  const playhead = interpolate(frame, [EDIT_START + 20, 420], [470, 3370], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cuts = [0.22, 0.47, 0.71];
  const mini: React.ReactElement[] = [];
  for (let i = 0; i < 120; i++) {
    const h = 30 + Math.abs(Math.sin(i * 0.55)) * 90 + random(`pd-mini-${i}`) * 30;
    mini.push(
      <rect key={i} x={470 + i * 24.2} y={1130 - h / 2} width={14} height={h} rx={6} fill="#7C6BD6" opacity={0.85} />,
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op * fade}}>
      <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
        {mini}
        {cuts.map((c, i) => {
          const cutX = 470 + c * 2900;
          const on = playhead > cutX;
          return (
            <g key={i} opacity={on ? 1 : 0.3}>
              <line x1={cutX} y1={990} x2={cutX} y2={1270} stroke={PINK} strokeWidth={6} strokeDasharray="18 14" />
              <text x={cutX} y={960} textAnchor="middle" fontFamily={MONO} fontSize={30} fill={PINK} fontWeight={700}>
                ✂ CUT {i + 1}
              </text>
            </g>
          );
        })}
        <line x1={playhead} y1={950} x2={playhead} y2={1310} stroke="#fff" strokeWidth={5} />
        <polygon points={`${playhead - 18},950 ${playhead + 18},950 ${playhead},986`} fill="#fff" />
        <text x={1920} y={880} textAnchor="middle" fontFamily={MONO} fontSize={36} letterSpacing={10} fill={MUTED}>
          EDIT — TRIM SILENCE · LEVEL AUDIO · ADD INTRO
        </text>
        <text x={1920} y={1420} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={64} letterSpacing={6} fill={INK}>
          POLISH THE MIX
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage C: upload progress -> RSS radiate
// ---------------------------------------------------------------------------
const UploadStage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inn = spring({frame: Math.max(0, frame - UP_START), fps, config: {damping: 110, stiffness: 150}});
  const op = interpolate(inn, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fade =
    frame > 600 ? interpolate(frame, [600, 630], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  if (op * fade <= 0) return null;
  const upP = interpolate(frame, [UP_START + 20, 550], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const done = frame >= 550;
  const mb = (upP * 84.6).toFixed(1);
  const rings = [0, 1, 2, 3].map((r) => {
    const rp = (frame - RSS_START - r * 22) / 60;
    const rr = rp > 0 ? rp * 420 : 0;
    const ro = rp > 0 && rp < 1 ? 0.8 * (1 - rp) : 0;
    return {rr, ro};
  });
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op * fade}}>
      <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
        <text x={1920} y={880} textAnchor="middle" fontFamily={MONO} fontSize={36} letterSpacing={10} fill={MUTED}>
          {done ? '✓ UPLOADED TO HOST' : `UPLOADING — ${mb} / 84.6 MB`}
        </text>
        <rect x={870} y={950} width={2100} height={54} rx={27} fill="rgba(245,240,250,0.08)" />
        <rect x={870} y={950} width={2100 * upP} height={54} rx={27} fill={done ? GREEN : VIOLET} filter="url(#pdGlow10)" />
        <text x={1920} y={1100} textAnchor="middle" fontFamily={MONO} fontSize={44} fontWeight={700} fill={done ? GREEN : INK}>
          {Math.floor(upP * 100)}%
        </text>
        {frame >= RSS_START && (
          <g>
            {rings.map((r, i) => (
              <circle key={i} cx={1920} cy={1380} r={r.rr} fill="none" stroke={CYAN} strokeWidth={10} opacity={r.ro} />
            ))}
            <circle cx={1920} cy={1380} r={90} fill={CYAN} filter="url(#pdGlow10)" />
            <text x={1920} y={1410} textAnchor="middle" fontFamily={MONO} fontSize={56} fontWeight={800} fill="#062A33">
              RSS
            </text>
            <text x={1920} y={1620} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={58} letterSpacing={6} fill={INK}>
              ONE FEED, RADIATED EVERYWHERE
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage D: directory tiles light up + download counter
// ---------------------------------------------------------------------------
const DirStage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inn = spring({frame: Math.max(0, frame - DIR_START), fps, config: {damping: 110, stiffness: 150}});
  const op = interpolate(inn, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op <= 0) return null;
  const lit = DIRS.filter((_, i) => frame >= DIR_START + 20 + i * 26).length;
  const dls = Math.floor(interpolate(frame, [DL_START, 895], [0, 1284], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op}}>
      <div style={{position: 'absolute', top: 800, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 46}}>
        {DIRS.map((d, i) => {
          const on = frame >= DIR_START + 20 + i * 26;
          const pop = on ? spring({frame: frame - (DIR_START + 20 + i * 26), fps, config: {damping: 90, stiffness: 240}}) : 0;
          return (
            <div
              key={d}
              style={{
                width: 380,
                height: 380,
                borderRadius: 30,
                background: on ? 'rgba(167,139,250,0.14)' : PANEL,
                border: `3px solid ${on ? VIOLET : HAIRLINE}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                transform: `scale(${0.9 + pop * 0.1})`,
                boxShadow: on ? '0 0 40px rgba(167,139,250,0.35)' : 'none',
                opacity: on ? 1 : 0.4,
              }}
            >
              <div style={{width: 120, height: 120, borderRadius: '50%', background: on ? VIOLET : 'rgba(245,240,250,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, color: on ? '#170E33' : MUTED, fontWeight: 800}}>
                {on ? '✓' : '♪'}
              </div>
              <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 3, color: on ? INK : MUTED, fontWeight: 700}}>{d}</div>
              <div style={{fontFamily: MONO, fontSize: 24, color: on ? VIOLET : MUTED}}>{on ? 'LIVE' : 'PENDING'}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 1330, left: 0, right: 0, textAlign: 'center'}}>
        <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 10, color: MUTED}}>{lit}/{DIRS.length} DIRECTORIES LIVE</div>
        {frame >= DL_START && (
          <div style={{marginTop: 26}}>
            <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 10, color: MUTED}}>FIRST-WEEK DOWNLOADS</div>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 130, color: GREEN, textShadow: '0 0 50px rgba(52,211,153,0.4)'}}>
              {dls.toLocaleString('en-US')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Live episode timer (per-frame motion)
// ---------------------------------------------------------------------------
const LiveTimer: React.FC<{frame: number}> = ({frame}) => {
  const t = Math.floor(frame / 60);
  const ms = Math.floor((frame % 60) * 1.666);
  return (
    <div style={{position: 'absolute', top: 380, right: 240, textAlign: 'right'}}>
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED}}>SESSION CLOCK</div>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 72, color: INK}}>
        {String(Math.floor(t / 60)).padStart(2, '0')}:{String(t % 60).padStart(2, '0')}.{String(ms).padStart(2, '0')}
      </div>
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 4, color: MUTED, marginTop: 6}}>FRAME {frame} / 900</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Ticker strip
// ---------------------------------------------------------------------------
const STRIP = '  •  ONE RSS FEED POWERS EVERY DIRECTORY    •  SUBMIT ONCE — APPLE, SPOTIFY, YOUTUBE & MORE PICK IT UP    •  CONSISTENT RELEASES BEAT PERFECT AUDIO    ';

const Strip: React.FC<{frame: number}> = ({frame}) => {
  const x = -((frame * 7) % 2400);
  return (
    <div style={{position: 'absolute', bottom: 56, left: 0, right: 0, overflow: 'hidden', borderTop: `2px solid ${HAIRLINE}`, borderBottom: `2px solid ${HAIRLINE}`, padding: '22px 0'}}>
      <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 5, color: MUTED, whiteSpace: 'nowrap', transform: `translateX(${x}px)`}}>
        {STRIP.repeat(3)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const PodcastDistributionFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Defs />
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <RecordStage frame={frame} fps={fps} />
      <EditStage frame={frame} fps={fps} />
      <UploadStage frame={frame} fps={fps} />
      <DirStage frame={frame} fps={fps} />
      <LiveTimer frame={frame} />
      <Strip frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
