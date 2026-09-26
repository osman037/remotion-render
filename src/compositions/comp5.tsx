/**
 * StudyTimerOverlay.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A Pomodoro focus scene: a giant 25:00 countdown ring depletes over the
 * clip, with session dots, today's session list, and weekly focus stats.
 *
 * Register in Root.tsx:
 *   <Composition id="StudyTimerOverlay" component={StudyTimerOverlay}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const BG = '#070912';
const PANEL = 'rgba(13, 17, 34, 0.92)';
const HAIRLINE = 'rgba(148, 163, 184, 0.22)';
const INK = '#EDEFFC';
const MUTED = 'rgba(196, 203, 230, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const INDIGO = '#818CF8';
const VIOLET = '#A78BFA';
const VIOLET_DIM = 'rgba(167, 139, 250, 0.14)';
const EMERALD = '#34D399';
const EMERALD_DIM = 'rgba(52, 211, 153, 0.14)';
const AMBER = '#FBBF24';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const TOTAL_SECONDS = 25 * 60;
const SESSIONS = [
  {time: '09:00', task: 'Design review', state: 'done'},
  {time: '10:00', task: 'API integration', state: 'done'},
  {time: '11:30', task: 'Focus sprint', state: 'active'},
  {time: '14:00', task: 'Code review', state: 'queued'},
];
const WEEK = [
  {d: 'M', h: 4.5},
  {d: 'T', h: 6.0},
  {d: 'W', h: 3.5},
  {d: 'T', h: 7.0},
  {d: 'F', h: 5.5},
  {d: 'S', h: 2.0},
  {d: 'S', h: 0.0},
];
const RING_CX = 1920;
const RING_CY = 1120;
const RING_R = 520;

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
const mmss = (total: number) => {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Background — indigo glow, soft grid, vignette, particles
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const particles = useMemo(
    () =>
      Array.from({length: 70}, (_, i) => ({
        x: rand(i * 3.1) * 3840,
        y: rand(i * 7.7) * 2160,
        r: 1.5 + rand(i * 13.3) * 3.5,
        speed: 0.2 + rand(i * 5.9) * 0.5,
        tw: rand(i * 9.4) * Math.PI * 2,
      })),
    [],
  );
  return (
    <AbsoluteFill>
      <svg width={3840} height={2160}>
        <defs>
          <radialGradient id="bgGlowA" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bgGlowB" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
          </radialGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="150" />
          </filter>
        </defs>
        <ellipse cx={1920} cy={1120} rx={1050} ry={800} fill="url(#bgGlowA)" filter="url(#softBlur)" />
        <ellipse cx={600} cy={1950} rx={800} ry={440} fill="url(#bgGlowB)" filter="url(#softBlur)" />
        {Array.from({length: 13}, (_, i) => (
          <line key={'v' + i} x1={i * 320} y1={0} x2={i * 320} y2={2160} stroke={HAIRLINE} strokeWidth={1} />
        ))}
        {Array.from({length: 8}, (_, i) => (
          <line key={'h' + i} x1={0} y1={i * 320} x2={3840} y2={i * 320} stroke={HAIRLINE} strokeWidth={1} />
        ))}
        {particles.map((p, i) => {
          const y = (p.y + frame * p.speed) % 2160;
          const tw = 0.25 + 0.55 * Math.abs(Math.sin(frame * 0.02 + p.tw));
          return (
            <circle
              key={i}
              cx={p.x}
              cy={y}
              r={p.r}
              fill={i % 3 === 0 ? EMERALD : INDIGO}
              opacity={tw * 0.45}
            />
          );
        })}
        <rect width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 20, fps);
  const pulse = 0.55 + 0.45 * Math.sin(frame * 0.12);
  return (
    <div
      style={{
        position: 'absolute',
        top: 100,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: e,
        transform: `translateY(${(1 - e) * 40}px)`,
      }}
    >
      <div>
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: INDIGO, marginBottom: 14}}>
          POMODORO
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: INK,
            letterSpacing: -1,
            textShadow: '0 4px 40px rgba(129,140,248,0.35)',
          }}
        >
          Deep Focus
        </div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            background: EMERALD,
            opacity: pulse,
            boxShadow: '0 0 26px rgba(52,211,153,0.9)',
          }}
        />
        <span style={{fontFamily: MONO, fontSize: 34, letterSpacing: 4, color: EMERALD}}>
          FOCUSING
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Countdown ring
// ---------------------------------------------------------------------------
const CountdownRing: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 60, fps);
  const t = clamp01(frame / 900);
  const remaining = TOTAL_SECONDS * (1 - t);
  const C = 2 * Math.PI * RING_R;
  const ticks = useMemo(() => Array.from({length: 60}, (_, i) => i), []);
  const urgent = t > 0.9;
  const ringColor = urgent ? AMBER : INDIGO;

  return (
    <div style={{position: 'absolute', inset: 0, opacity: e}}>
      <svg width={3840} height={2160}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
          <filter id="ringGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="20" />
          </filter>
        </defs>
        {ticks.map((i) => {
          const ang = (i / 60) * Math.PI * 2 - Math.PI / 2;
          const major = i % 5 === 0;
          const r1 = RING_R + (major ? 44 : 30);
          const r2 = RING_R + (major ? 66 : 48);
          return (
            <line
              key={i}
              x1={RING_CX + Math.cos(ang) * r1}
              y1={RING_CY + Math.sin(ang) * r1}
              x2={RING_CX + Math.cos(ang) * r2}
              y2={RING_CY + Math.sin(ang) * r2}
              stroke={FAINT}
              strokeWidth={major ? 6 : 3}
            />
          );
        })}
        <circle cx={RING_CX} cy={RING_CY} r={RING_R} fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth={34} />
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={34}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * t}
          transform={`rotate(-90 ${RING_CX} ${RING_CY})`}
          filter="url(#ringGlow)"
        />
        {/* head dot */}
        {(() => {
          const ang = -Math.PI / 2 + t * Math.PI * 2;
          return (
            <g>
              <circle
                cx={RING_CX + Math.cos(ang) * RING_R}
                cy={RING_CY + Math.sin(ang) * RING_R}
                r={34}
                fill={ringColor}
                opacity={0.35}
                filter="url(#ringGlow)"
              />
              <circle
                cx={RING_CX + Math.cos(ang) * RING_R}
                cy={RING_CY + Math.sin(ang) * RING_R}
                r={20}
                fill={ringColor}
              />
            </g>
          );
        })()}
        <text x={RING_CX} y={RING_CY - 150} textAnchor="middle" fontFamily={MONO} fontSize={40} letterSpacing={10} fill={INDIGO}>
          FOCUS
        </text>
        <text
          x={RING_CX}
          y={RING_CY + 70}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize={220}
          fontWeight={700}
          fill={INK}
          letterSpacing={-4}
          style={{textShadow: '0 4px 80px rgba(129,140,248,0.5)'}}
        >
          {mmss(remaining)}
        </text>
        <text x={RING_CX} y={RING_CY + 170} textAnchor="middle" fontFamily={MONO} fontSize={36} letterSpacing={4} fill={MUTED}>
          SESSION 3 OF 4 · 25 MIN
        </text>
      </svg>
      {/* session dots */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: RING_CY + RING_R + 130,
          display: 'flex',
          justifyContent: 'center',
          gap: 34,
        }}
      >
        {[0, 1, 2, 3].map((i) => {
          const done = i < 2;
          const active = i === 2;
          return (
            <div key={i} style={{textAlign: 'center'}}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  background: done ? EMERALD : active ? VIOLET_DIM : 'rgba(148,163,184,0.10)',
                  border: `3px solid ${done ? EMERALD : active ? VIOLET : FAINT}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: MONO,
                  fontSize: 32,
                  fontWeight: 700,
                  color: done ? '#06281C' : active ? VIOLET : FAINT,
                  boxShadow: done ? '0 0 30px rgba(52,211,153,0.5)' : active ? '0 0 30px rgba(167,139,250,0.5)' : 'none',
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 2, color: FAINT, marginTop: 12}}>
                {done ? 'DONE' : active ? 'NOW' : 'QUEUED'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Left panel — today's sessions
// ---------------------------------------------------------------------------
const SessionsPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 140, fps);
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        top: 520,
        width: 1000,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        padding: '48px 56px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: INDIGO, marginBottom: 36}}>
        TODAY'S SESSIONS
      </div>
      {SESSIONS.map((s, i) => {
        const re = entr(frame, 180 + i * 70, fps);
        const col = s.state === 'done' ? EMERALD : s.state === 'active' ? VIOLET : FAINT;
        return (
          <div
            key={s.task}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '26px 0',
              borderBottom: i < SESSIONS.length - 1 ? `1px solid ${HAIRLINE}` : 'none',
              opacity: re,
              transform: `translateX(${(1 - re) * -40}px)`,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  border: `3px solid ${col}`,
                  background: s.state === 'done' ? EMERALD_DIM : s.state === 'active' ? VIOLET_DIM : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: MONO,
                  fontSize: 28,
                  color: col,
                }}
              >
                {s.state === 'done' ? '✓' : s.state === 'active' ? '●' : '○'}
              </div>
              <div>
                <div style={{fontFamily: FONT, fontSize: 36, fontWeight: 600, color: s.state === 'queued' ? FAINT : INK}}>
                  {s.task}
                </div>
                <div style={{fontFamily: MONO, fontSize: 26, color: FAINT, marginTop: 6}}>{s.time} · 25 MIN</div>
              </div>
            </div>
            <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 2, color: col}}>
              {s.state === 'done' ? 'DONE' : s.state === 'active' ? 'ACTIVE' : 'QUEUED'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Right panel — weekly focus bars + stats
// ---------------------------------------------------------------------------
const StatsPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 200, fps);
  const maxH = 7;
  const barW = 84;
  const chartH = 320;
  return (
    <div
      style={{
        position: 'absolute',
        right: 240,
        top: 520,
        width: 1000,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        padding: '48px 56px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: INDIGO, marginBottom: 36}}>
        FOCUS THIS WEEK
      </div>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 26, height: chartH + 60, marginBottom: 40}}>
        {WEEK.map((w, i) => {
          const be = entr(frame, 240 + i * 60, fps);
          const h = (w.h / maxH) * chartH * be;
          return (
            <div key={i} style={{textAlign: 'center'}}>
              <div style={{fontFamily: MONO, fontSize: 24, color: MUTED, marginBottom: 10, opacity: be}}>
                {w.h > 0 ? w.h.toFixed(1) : '–'}
              </div>
              <div
                style={{
                  width: barW,
                  height: Math.max(8, h),
                  borderRadius: 12,
                  background: w.h >= 5 ? 'linear-gradient(180deg,#818CF8,#4F46E5)' : 'rgba(129,140,248,0.35)',
                  boxShadow: w.h >= 5 ? '0 0 24px rgba(129,140,248,0.5)' : 'none',
                }}
              />
              <div style={{fontFamily: MONO, fontSize: 28, color: FAINT, marginTop: 12}}>{w.d}</div>
            </div>
          );
        })}
      </div>
      <div style={{display: 'flex', gap: 24}}>
        {[
          {label: 'TOTAL', value: '28.5H'},
          {label: 'STREAK', value: '12 DAYS'},
          {label: 'TASKS', value: '34'},
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: 'rgba(129,140,248,0.08)',
              border: `1px solid ${HAIRLINE}`,
              borderRadius: 18,
              padding: '24px 20px',
              textAlign: 'center',
            }}
          >
            <div style={{fontFamily: MONO, fontSize: 44, fontWeight: 700, color: INK}}>{s.value}</div>
            <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: FAINT, marginTop: 8}}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
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
        color: FAINT,
        opacity: e,
      }}
    >
      <span>BREAK IN 05:00 AFTER SESSION</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;DISTRACTIONS BLOCKED</span>
      <span>FOCUS TIMER · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const StudyTimerOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <SessionsPanel frame={frame} fps={fps} />
      <StatsPanel frame={frame} fps={fps} />
      <CountdownRing frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default StudyTimerOverlay;
