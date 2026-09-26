/**
 * ProjectTimelineGantt.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A project timeline Gantt: task bars extend across 12 weeks, milestones
 * land with spring physics, dependency links draw between tasks, and a
 * "today" line sweeps the schedule.
 *
 * Register in Root.tsx:
 *   <Composition id="ProjectTimelineGantt" component={ProjectTimelineGantt}
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
const BG = '#060A13';
const PANEL = 'rgba(11, 17, 32, 0.92)';
const HAIRLINE = 'rgba(148, 163, 184, 0.22)';
const INK = '#EAF0FA';
const MUTED = 'rgba(190, 203, 224, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const SKY = '#38BDF8';
const VIOLET = '#A78BFA';
const EMERALD = '#34D399';
const AMBER = '#FBBF24';
const ROSE = '#FB7185';
const TEAL = '#2DD4BF';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const TASKS = [
  {name: 'DISCOVERY', owner: 'RESEARCH', start: 1, dur: 2, color: SKY},
  {name: 'UX DESIGN', owner: 'DESIGN', start: 2, dur: 4, color: VIOLET},
  {name: 'BACKEND API', owner: 'ENGINEERING', start: 3, dur: 5, color: TEAL},
  {name: 'FRONTEND BUILD', owner: 'ENGINEERING', start: 5, dur: 5, color: EMERALD},
  {name: 'QA & TESTING', owner: 'QUALITY', start: 8, dur: 3, color: AMBER},
  {name: 'LAUNCH PREP', owner: 'OPS', start: 10, dur: 3, color: ROSE},
];
const MILESTONES = [
  {name: 'KICKOFF', week: 1, color: SKY},
  {name: 'DESIGN SIGN-OFF', week: 5, color: VIOLET},
  {name: 'BETA', week: 8, color: EMERALD},
  {name: 'LAUNCH', week: 12, color: ROSE},
];
// dependencies: [fromTask, toTask]
const DEPS: Array<[number, number]> = [[1, 3], [2, 3], [3, 4], [4, 5]];

// Gantt geometry
const GX = 640;
const GW = 2760;
const WEEK_W = GW / 12;
const GY = 430;
const HEADER_H = 130;
const ROW_H = 190;
const BAR_H = 76;
const rowY = (i: number) => GY + HEADER_H + i * ROW_H + (ROW_H - BAR_H) / 2;
const weekX = (w: number) => GX + (w - 1) * WEEK_W;

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
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const sweepX = interpolate(frame, [0, 900], [-1400, 5200], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill>
      <svg width={3840} height={2160}>
        <defs>
          <radialGradient id="bgGlowA" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
          </radialGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="150" />
          </filter>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx={1900} cy={1050} rx={1200} ry={750} fill="url(#bgGlowA)" filter="url(#softBlur)" />
        {Array.from({length: 13}, (_, i) => (
          <line key={'v' + i} x1={i * 320} y1={0} x2={i * 320} y2={2160} stroke={HAIRLINE} strokeWidth={1} />
        ))}
        {Array.from({length: 8}, (_, i) => (
          <line key={'h' + i} x1={0} y1={i * 320} x2={3840} y2={i * 320} stroke={HAIRLINE} strokeWidth={1} />
        ))}
        <rect x={sweepX - 420} y={0} width={840} height={2160} fill="url(#sweepGrad)" />
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
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: SKY, marginBottom: 14}}>
          PROJECT MANAGEMENT
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: INK,
            letterSpacing: -1,
            textShadow: '0 4px 40px rgba(56,189,248,0.30)',
          }}
        >
          Project Timeline
        </div>
      </div>
      <div style={{display: 'flex', gap: 20}}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 32,
            letterSpacing: 3,
            color: INK,
            background: 'rgba(56,189,248,0.12)',
            border: '1px solid rgba(56,189,248,0.45)',
            borderRadius: 18,
            padding: '22px 36px',
          }}
        >
          12 WEEKS
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 32,
            letterSpacing: 3,
            color: EMERALD,
            background: 'rgba(52,211,153,0.12)',
            border: '1px solid rgba(52,211,153,0.45)',
            borderRadius: 18,
            padding: '22px 36px',
          }}
        >
          68% COMPLETE
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Gantt panel
// ---------------------------------------------------------------------------
const Gantt: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 60, fps);
  const todayX = GX + prog(frame, 120, 860) * GW;
  const panelH = HEADER_H + 6 * ROW_H + 180;

  const deps = useMemo(
    () =>
      DEPS.map(([a, b]) => {
        const x1 = weekX(TASKS[a].start + TASKS[a].dur) - 20;
        const y1 = rowY(a) + BAR_H / 2;
        const x2 = weekX(TASKS[b].start) + 20;
        const y2 = rowY(b) + BAR_H / 2;
        const mx = (x1 + x2) / 2;
        return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
      }),
    [],
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        top: GY,
        width: 3360,
        height: panelH,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
      }}
    >
      <svg width={3360} height={panelH}>
        <defs>
          <filter id="barGlow" x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* week grid */}
        {Array.from({length: 13}, (_, i) => (
          <line
            key={i}
            x1={GX + i * WEEK_W}
            y1={HEADER_H - 20}
            x2={GX + i * WEEK_W}
            y2={HEADER_H + 6 * ROW_H}
            stroke={HAIRLINE}
            strokeWidth={1}
          />
        ))}
        {Array.from({length: 12}, (_, i) => (
          <text
            key={'w' + i}
            x={GX + i * WEEK_W + WEEK_W / 2}
            y={HEADER_H - 60}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={30}
            fill={FAINT}
          >
            W{i + 1}
          </text>
        ))}
        {/* dependency links */}
        {deps.map((d, i) => {
          const dp = prog(frame, 480 + i * 80, 480 + i * 80 + 120);
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={FAINT}
              strokeWidth={5}
              strokeDasharray="14 12"
              opacity={0.8 * dp}
              strokeDashoffset={200 * (1 - dp)}
            />
          );
        })}
        {/* task bars */}
        {TASKS.map((t, i) => {
          const be = entr(frame, 140 + i * 70, fps);
          const fullW = t.dur * WEEK_W - 24;
          const w = Math.max(10, fullW * be);
          const y = rowY(i);
          const done = clamp01((frame - (200 + i * 70)) / 300);
          return (
            <g key={t.name} opacity={0.25 + 0.75 * be}>
              <rect x={weekX(t.start) + 12} y={y} width={w} height={BAR_H} rx={38} fill={t.color} opacity={0.28} filter="url(#barGlow)" />
              <rect x={weekX(t.start) + 12} y={y} width={w} height={BAR_H} rx={38} fill={t.color} opacity={0.85} />
              <rect x={weekX(t.start) + 12} y={y} width={w * done} height={BAR_H} rx={38} fill="#FFFFFF" opacity={0.22} />
            </g>
          );
        })}
        {/* today line */}
        <g opacity={prog(frame, 100, 160)}>
          <line
            x1={todayX}
            y1={HEADER_H - 20}
            x2={todayX}
            y2={HEADER_H + 6 * ROW_H}
            stroke="url(#todayGrad)"
            strokeWidth={6}
          />
          <rect x={todayX - 90} y={HEADER_H - 96} width={180} height={64} rx={14} fill={AMBER} />
          <text x={todayX} y={HEADER_H - 52} textAnchor="middle" fontFamily={MONO} fontSize={30} fontWeight={700} fill="#0B1220">
            TODAY
          </text>
        </g>
        {/* milestones */}
        {MILESTONES.map((m, i) => {
          const me = entr(frame, 560 + i * 90, fps);
          const mx = weekX(m.week) + WEEK_W / 2;
          const my = HEADER_H + 6 * ROW_H + 78;
          const s = 30 * me;
          return (
            <g key={m.name} opacity={me}>
              <circle cx={mx} cy={my} r={52 * me} fill={m.color} opacity={0.25} />
              <polygon
                points={`${mx},${my - s} ${mx + s},${my} ${mx},${my + s} ${mx - s},${my}`}
                fill={m.color}
                stroke="#0B1220"
                strokeWidth={4}
              />
            </g>
          );
        })}
      </svg>
      {/* task labels (HTML) */}
      {TASKS.map((t, i) => {
        const le = entr(frame, 140 + i * 70, fps);
        return (
          <div
            key={t.name}
            style={{
              position: 'absolute',
              left: 60,
              top: rowY(i),
              height: BAR_H,
              opacity: le,
              transform: `translateX(${(1 - le) * -40}px)`,
            }}
          >
            <div style={{fontFamily: FONT, fontSize: 36, fontWeight: 700, color: INK, lineHeight: 1.1}}>{t.name}</div>
            <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: FAINT, marginTop: 6}}>{t.owner}</div>
          </div>
        );
      })}
      {/* milestone labels */}
      {MILESTONES.map((m, i) => {
        const me = entr(frame, 560 + i * 90, fps);
        const mx = weekX(m.week) + WEEK_W / 2;
        return (
          <div
            key={m.name}
            style={{
              position: 'absolute',
              left: mx - 200,
              top: HEADER_H + 6 * ROW_H + 120,
              width: 400,
              textAlign: 'center',
              opacity: me,
              fontFamily: MONO,
              fontSize: 24,
              letterSpacing: 2,
              color: m.color,
            }}
          >
            {m.name}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stats strip
// ---------------------------------------------------------------------------
const Stats: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 420, fps);
  const items = [
    {v: '6', l: 'TASKS'},
    {v: '4', l: 'MILESTONES'},
    {v: '4', l: 'DEPENDENCIES'},
    {v: 'W7', l: 'CURRENT WEEK'},
  ];
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        top: GY + HEADER_H + 6 * ROW_H + 180 + 40,
        display: 'flex',
        gap: 28,
        opacity: e,
      }}
    >
      {items.map((s, i) => (
        <div
          key={s.l}
          style={{
            flex: 1,
            background: PANEL,
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 20,
            padding: '22px 40px',
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            opacity: entr(frame, 440 + i * 60, fps),
          }}
        >
          <div style={{fontFamily: MONO, fontSize: 64, fontWeight: 700, color: SKY}}>{s.v}</div>
          <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 4, color: MUTED}}>{s.l}</div>
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
        color: FAINT,
        opacity: e,
      }}
    >
      <span>SCHEDULE BASELINE V3</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;CRITICAL PATH TRACKED</span>
      <span>PROJECT MGMT · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const ProjectTimelineGantt: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <Gantt frame={frame} fps={fps} />
      <Stats frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default ProjectTimelineGantt;
