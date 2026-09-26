/**
 * WellnessTrackingDashboard.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A wellness dashboard: sleep/steps/recovery rings, a readiness gauge,
 * 7-day trend bars, recovery metrics, and heart-rate/sleep sparklines.
 *
 * Register in Root.tsx:
 *   <Composition id="WellnessTrackingDashboard" component={WellnessTrackingDashboard}
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
const BG = '#050B12';
const PANEL = 'rgba(10, 18, 30, 0.92)';
const HAIRLINE = 'rgba(148, 163, 184, 0.22)';
const INK = '#EAF0FA';
const MUTED = 'rgba(190, 203, 224, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const TEAL = '#2DD4BF';
const TEAL_DIM = 'rgba(45, 212, 191, 0.14)';
const EMERALD = '#34D399';
const VIOLET = '#A78BFA';
const SKY = '#38BDF8';
const AMBER = '#FBBF24';
const ROSE = '#FB7185';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const RINGS = [
  {label: 'SLEEP', value: '7H 24M', pct: 0.92, color: VIOLET},
  {label: 'STEPS', value: '9,842', pct: 0.98, color: TEAL},
  {label: 'RECOVERY', value: '78%', pct: 0.78, color: EMERALD},
];
const STEPS_WEEK = [8230, 10412, 6780, 11540, 9842, 4520, 7310];
const RECOVERY_ROWS = [
  {label: 'HRV', value: '62 MS', delta: '+8%', up: true},
  {label: 'RESTING HR', value: '54 BPM', delta: '-3%', up: true},
  {label: 'SLEEP DEBT', value: '1.2 H', delta: '-0.4H', up: true},
  {label: 'DAY STRAIN', value: '14.2', delta: '+1.1', up: false},
];
const HR_DATA = [62, 60, 64, 70, 82, 96, 112, 128, 136, 124, 108, 92, 84, 78, 88, 104, 118, 126, 118, 98, 82, 72, 66, 62];
const SLEEP_DATA = [7.2, 6.8, 8.1, 7.5, 6.2, 7.9, 7.4];
const READINESS = 86;

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
  const particles = useMemo(
    () =>
      Array.from({length: 60}, (_, i) => ({
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
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
          </radialGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="150" />
          </filter>
        </defs>
        <ellipse cx={1200} cy={1000} rx={1000} ry={750} fill="url(#bgGlowA)" filter="url(#softBlur)" />
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
            <circle key={i} cx={p.x} cy={y} r={p.r} fill={i % 3 === 0 ? EMERALD : TEAL} opacity={tw * 0.4} />
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
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: TEAL, marginBottom: 14}}>
          HEALTH
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: INK,
            letterSpacing: -1,
            textShadow: '0 4px 40px rgba(45,212,191,0.30)',
          }}
        >
          Wellness Dashboard
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
        <span style={{fontFamily: MONO, fontSize: 34, letterSpacing: 4, color: EMERALD}}>SYNCED</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Rings panel (left)
// ---------------------------------------------------------------------------
const RingsPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 80, fps);
  const fill = prog(frame, 140, 620);
  const R = 150;
  const C = 2 * Math.PI * R;
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        top: 430,
        width: 1560,
        height: 1070,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        padding: '48px 60px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED}}>
        TODAY'S RINGS
      </div>
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <svg width={1440} height={560}>
        <defs>
          <filter id="ringGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>
        {RINGS.map((r, i) => {
          const cx = 240 + i * 480;
          const cy = 250;
          return (
            <g key={r.label}>
              <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={40} />
              <circle
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={r.color}
                strokeWidth={40}
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - r.pct * fill)}
                transform={`rotate(-90 ${cx} ${cy})`}
                filter="url(#ringGlow)"
              />
              <text x={cx} y={cy - 12} textAnchor="middle" fontFamily={MONO} fontSize={64} fontWeight={700} fill={INK}>
                {r.value}
              </text>
              <text x={cx} y={cy + 52} textAnchor="middle" fontFamily={MONO} fontSize={30} letterSpacing={5} fill={r.color}>
                {r.label}
              </text>
              <text x={cx} y={cy + 220} textAnchor="middle" fontFamily={MONO} fontSize={34} fill={MUTED}>
                {Math.round(r.pct * fill * 100)}%
              </text>
            </g>
          );
        })}
      </svg>
      </div>
      <div style={{fontFamily: MONO, fontSize: 28, color: FAINT, letterSpacing: 2, textAlign: 'center', paddingBottom: 10}}>
        RINGS CLOSE AT MIDNIGHT · STREAK 12 DAYS
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Readiness gauge (center)
// ---------------------------------------------------------------------------
const ReadinessGauge: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 160, fps);
  const t = prog(frame, 320, 700);
  const score = Math.round(READINESS * Easing.out(Easing.cubic)(t));
  const ang = Math.PI + (score / 100) * Math.PI; // 180° -> 360°
  const cx = 440;
  const cy = 460;
  const R = 290;
  const nx = cx + Math.cos(ang) * (R - 60);
  const ny = cy + Math.sin(ang) * (R - 60);
  return (
    <div
      style={{
        position: 'absolute',
        left: 1920,
        top: 430,
        width: 880,
        height: 1070,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        padding: '48px 60px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED}}>
        READINESS SCORE
      </div>
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <svg width={760} height={640}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <filter id="needleGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={54}
          strokeLinecap="round"
          opacity={0.9}
        />
        {Array.from({length: 11}, (_, i) => {
          const a = Math.PI + (i / 10) * Math.PI;
          const x1 = cx + Math.cos(a) * (R - 50);
          const y1 = cy + Math.sin(a) * (R - 50);
          const x2 = cx + Math.cos(a) * (R - 90);
          const y2 = cy + Math.sin(a) * (R - 90);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={FAINT} strokeWidth={4} />;
        })}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={INK} strokeWidth={14} strokeLinecap="round" filter="url(#needleGlow)" />
        <circle cx={cx} cy={cy} r={34} fill="#0B1220" stroke={INK} strokeWidth={6} />
        <text x={cx} y={cy - 170} textAnchor="middle" fontFamily={MONO} fontSize={150} fontWeight={700} fill={INK}>
          {score}
        </text>
        <text x={cx} y={cy - 100} textAnchor="middle" fontFamily={MONO} fontSize={32} letterSpacing={5} fill={EMERALD}>
          {score >= 80 ? 'OPTIMAL' : score >= 60 ? 'GOOD' : 'LOW'}
        </text>
      </svg>
      </div>
      <div style={{fontFamily: MONO, fontSize: 28, color: FAINT, letterSpacing: 2, textAlign: 'center', paddingBottom: 10}}>
        TRAIN HARD · RECOVER WELL
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Recovery metrics (right)
// ---------------------------------------------------------------------------
const RecoveryPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 220, fps);
  return (
    <div
      style={{
        position: 'absolute',
        left: 2920,
        top: 430,
        width: 680,
        height: 1070,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 28,
        padding: '48px 52px',
        opacity: e,
        transform: `translateY(${(1 - e) * 60}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED, marginBottom: 20}}>
        RECOVERY
      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly'}}>
      {RECOVERY_ROWS.map((r, i) => {
        const re = entr(frame, 280 + i * 80, fps);
        return (
          <div
            key={r.label}
            style={{
              padding: '24px 0',
              borderBottom: i < RECOVERY_ROWS.length - 1 ? `1px solid ${HAIRLINE}` : 'none',
              opacity: re,
              transform: `translateX(${(1 - re) * 50}px)`,
            }}
          >
            <div style={{fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: FAINT, marginBottom: 12}}>
              {r.label}
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
              <div style={{fontFamily: MONO, fontSize: 58, fontWeight: 700, color: INK}}>{r.value}</div>
              <div style={{fontFamily: MONO, fontSize: 30, color: r.up ? EMERALD : AMBER}}>
                {r.up ? '▲' : '▼'} {r.delta}
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sparkline card
// ---------------------------------------------------------------------------
const SparkCard: React.FC<{
  frame: number;
  fps: number;
  title: string;
  data: number[];
  unit: string;
  color: string;
  delay: number;
  min: number;
  max: number;
  w: number;
}> = ({frame, fps, title, data, unit, color, delay, min, max, w}) => {
  const e = entr(frame, delay, fps);
  const draw = prog(frame, delay + 60, delay + 420);
  const H = 200;
  const PAD = 30;
  const X = (i: number) => PAD + (i / (data.length - 1)) * (w - PAD * 2);
  const Y = (v: number) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  return (
    <div
      style={{
        width: w + 120,
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 24,
        padding: '36px 60px',
        opacity: e,
        transform: `translateY(${(1 - e) * 50}px)`,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16}}>
        <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 5, color: MUTED}}>{title}</div>
        <div style={{fontFamily: MONO, fontSize: 40, fontWeight: 700, color: INK}}>
          {data[data.length - 1]}
          <span style={{fontSize: 26, color: FAINT}}> {unit}</span>
        </div>
      </div>
      <svg width={w} height={H}>
        <path d={line} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeDasharray={3000} strokeDashoffset={3000 * (1 - draw)} />
        {data.map((v, i) =>
          i % 4 === 0 ? <circle key={i} cx={X(i)} cy={Y(v)} r={8} fill={color} opacity={draw} /> : null,
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Steps week bars
// ---------------------------------------------------------------------------
const StepsBars: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 340, fps);
  const maxV = 12000;
  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 24,
        padding: '36px 60px',
        opacity: e,
        transform: `translateY(${(1 - e) * 50}px)`,
        flex: 1,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16}}>
        <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 5, color: MUTED}}>STEPS · 7 DAYS</div>
        <div style={{fontFamily: MONO, fontSize: 40, fontWeight: 700, color: INK}}>
          57,634 <span style={{fontSize: 26, color: FAINT}}>TOTAL</span>
        </div>
      </div>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 30, height: 210}}>
        {STEPS_WEEK.map((v, i) => {
          const be = entr(frame, 380 + i * 50, fps);
          const h = (v / maxV) * 170 * be;
          const today = i === 4;
          return (
            <div key={i} style={{flex: 1, textAlign: 'center'}}>
              <div
                style={{
                  height: Math.max(8, h),
                  borderRadius: 8,
                  background: today ? 'linear-gradient(180deg,#2DD4BF,#0D9488)' : 'rgba(45,212,191,0.30)',
                  boxShadow: today ? '0 0 20px rgba(45,212,191,0.5)' : 'none',
                }}
              />
              <div style={{fontFamily: MONO, fontSize: 22, color: today ? TEAL : FAINT, marginTop: 8}}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bottom strip
// ---------------------------------------------------------------------------
const BottomStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        top: 1560,
        display: 'flex',
        gap: 28,
      }}
    >
      <SparkCard frame={frame} fps={fps} title="HEART RATE · 24H" data={HR_DATA} unit="BPM" color={ROSE} delay={360} min={50} max={150} w={760} />
      <SparkCard frame={frame} fps={fps} title="SLEEP · 7 NIGHTS" data={SLEEP_DATA} unit="HRS" color={VIOLET} delay={420} min={5} max={9} w={760} />
      <StepsBars frame={frame} fps={fps} />
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
      <span>WEARABLE SYNCED 08:42</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;7-DAY TRENDS</span>
      <span>WELLNESS · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const WellnessTrackingDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <RingsPanel frame={frame} fps={fps} />
      <ReadinessGauge frame={frame} fps={fps} />
      <RecoveryPanel frame={frame} fps={fps} />
      <BottomStrip frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default WellnessTrackingDashboard;
