/**
 * AgileSprintCycle.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral AGILE SPRINT visual for trainers, coaches and product-leadership
 * decks: backlog cards flow into a 2-week sprint ring, daily-standup tick marks
 * light the 14-day arc, a burndown line slopes to zero, review/retro checkpoints
 * land, and the ring closes with a velocity payoff that loops to the next sprint.
 * Deterministic seeded randomness only. Teal/blue palette, no tool UI, no brands.
 *
 * Register in Root.tsx:
 *   <Composition id="AgileSprintCycle" component={AgileSprintCycle}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
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
// Palette (deep navy console, teal/blue accents)
// ---------------------------------------------------------------------------
const BG = '#050B16';
const INK = '#EAF2FB';
const MUTED = 'rgba(234,242,251,0.60)';
const TEAL = '#2DD4BF';
const CYAN = '#67E8F9';
const BLUE = '#60A5FA';
const INDIGO = '#818CF8';
const GREEN = '#34D399';
const AMBER = '#FBBF24';
const PANEL = 'rgba(9,15,29,0.88)';
const HAIRLINE = 'rgba(234,242,251,0.14)';
const SLATE = 'rgba(148,178,205,0.42)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const BACKLOG_ENTER = 40;   // backlog cards slide in
const ENTER_STEP = 20;
const FLOW_START = 210;     // cards fly from backlog into the ring
const FLOW_STEP = 30;
const FLOW_DUR = 80;
const RING_START = 240;     // sprint ring arc begins
const TICK_START = 250;     // day ticks begin
const TICK_STEP = 24;
const BURN_START = 260;     // burndown draws
const BURN_END = 700;
const RING_CLOSE = 800;     // ring arc completes -> loop
const REVIEW_AT = 700;
const RETRO_AT = 745;
const PAYOFF_START = 800;

const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Data: 8 backlog stories -> 36 story points total
// ---------------------------------------------------------------------------
interface Story {
  id: string;
  title: string;
  pts: number;
}
const STORIES: Story[] = [
  {id: 'STY-118', title: 'Rate-limit hardening for public API', pts: 8},
  {id: 'STY-121', title: 'Checkout retry flow on 3-D Secure', pts: 5},
  {id: 'STY-124', title: 'CSV export for dashboard reports', pts: 3},
  {id: 'STY-127', title: 'Auth session silent refresh', pts: 5},
  {id: 'STY-129', title: 'Search index nightly backfill', pts: 8},
  {id: 'STY-133', title: 'Billing proration edge cases', pts: 3},
  {id: 'STY-136', title: 'Audit log 90-day retention', pts: 2},
  {id: 'STY-139', title: 'Weekly digest notification batch', pts: 2},
];
const TOTAL_PTS = STORIES.reduce((a, s) => a + s.pts, 0); // 36
const N_DAYS = 14;

// ---------------------------------------------------------------------------
// Ring geometry
// ---------------------------------------------------------------------------
const CX = 1920;
const CY = 1180;
const R = 680;
const slotAngle = (k: number) => ((-67.5 + k * 45) * Math.PI) / 180;
const slotX = (k: number) => CX + R * Math.cos(slotAngle(k));
const slotY = (k: number) => CY + R * Math.sin(slotAngle(k));

// Backlog slot origins (left panel)
const CARD_W = 640;
const CARD_H = 136;
const CARD_X = 220;
const cardY = (i: number) => 730 + i * 162;

// Burndown geometry (right panel)
const BURNDOWN = {x0: 2800, x1: 3560, yTop: 480, yBot: 900};
const DAY_POINTS = [36, 33.5, 31, 28, 25.5, 23, 19, 16, 14, 11.5, 9, 6.5, 4, 1.5, 0];
const dayX = (d: number) => BURNDOWN.x0 + (d / N_DAYS) * (BURNDOWN.x1 - BURNDOWN.x0);
const ptsY = (p: number) => BURNDOWN.yBot - (p / TOTAL_PTS) * (BURNDOWN.yBot - BURNDOWN.yTop);

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="agGlow" cx="42%" cy="30%" r="80%">
      <stop offset="0%" stopColor="rgba(45,212,191,0.13)" />
      <stop offset="45%" stopColor="rgba(96,165,250,0.05)" />
      <stop offset="100%" stopColor="rgba(5,11,22,0)" />
    </radialGradient>
    <radialGradient id="agVignette" cx="50%" cy="50%" r="76%">
      <stop offset="58%" stopColor="rgba(3,6,13,0)" />
      <stop offset="100%" stopColor="rgba(1,3,8,0.78)" />
    </radialGradient>
    <linearGradient id="agScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(45,212,191,0)" />
      <stop offset="50%" stopColor="rgba(45,212,191,0.14)" />
      <stop offset="100%" stopColor="rgba(45,212,191,0)" />
    </linearGradient>
    <linearGradient id="agRing" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={TEAL} />
      <stop offset="55%" stopColor={CYAN} />
      <stop offset="100%" stopColor={BLUE} />
    </linearGradient>
    <linearGradient id="agBar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={CYAN} />
      <stop offset="100%" stopColor={TEAL} />
    </linearGradient>
    <linearGradient id="agArea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={TEAL} stopOpacity={0.30} />
      <stop offset="100%" stopColor={TEAL} stopOpacity={0.02} />
    </linearGradient>
    <linearGradient id="agPayoff" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={TEAL} />
      <stop offset="50%" stopColor={CYAN} />
      <stop offset="100%" stopColor={BLUE} />
    </linearGradient>
    <filter id="agBlur60" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="60" />
    </filter>
    <filter id="agBlur14" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="14" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: layered, drifting, never flat
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const drift1 = Math.sin((frame / 900) * Math.PI * 2) * 80;
  const drift2 = Math.cos((frame / 900) * Math.PI * 2) * 64;
  const scanY = (frame / 900) * 2460 - 300;
  const orbs: React.ReactElement[] = [];
  for (let i = 0; i < 6; i++) {
    const ox = random(`ag-orb-x-${i}`) * 3840;
    const oy = random(`ag-orb-y-${i}`) * 2160;
    const r = 240 + random(`ag-orb-r-${i}`) * 300;
    const hue =
      i % 3 === 0
        ? 'rgba(45,212,191,0.09)'
        : i % 3 === 1
        ? 'rgba(96,165,250,0.08)'
        : 'rgba(103,232,249,0.06)';
    const mx = Math.sin((frame / 900) * Math.PI * 2 + i * 1.9) * 110;
    const my = Math.cos((frame / 900) * Math.PI * 2 + i * 2.1) * 84;
    orbs.push(<circle key={i} cx={ox + mx} cy={oy + my} r={r} fill={hue} filter="url(#agBlur60)" />);
  }
  const dots: React.ReactElement[] = [];
  for (let gx = 60; gx < 3840; gx += 160) {
    for (let gy = 60; gy < 2160; gy += 160) {
      const jx = (random(`ag-dot-x-${gx}-${gy}`) - 0.5) * 24;
      const jy = (random(`ag-dot-y-${gx}-${gy}`) - 0.5) * 24;
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx + jx} cy={gy + jy} r={2.2} fill="rgba(234,242,251,0.05)" />
      );
    }
  }
  const hairlines: React.ReactElement[] = [];
  for (let gx = 0; gx <= 3840; gx += 480) {
    hairlines.push(<line key={`v${gx}`} x1={gx} y1={0} x2={gx} y2={2160} stroke="rgba(234,242,251,0.035)" strokeWidth={1} />);
  }
  for (let gy = 0; gy <= 2160; gy += 480) {
    hairlines.push(<line key={`h${gy}`} x1={0} y1={gy} x2={3840} y2={gy} stroke="rgba(234,242,251,0.035)" strokeWidth={1} />);
  }
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect width={3840} height={2160} fill="url(#agGlow)" transform={`translate(${drift1},${drift2})`} />
        {orbs}
        <g transform={`translate(${drift1 * 0.4},${drift2 * 0.4})`}>{dots}</g>
        {hairlines}
        <rect x={0} y={scanY} width={3840} height={360} fill="url(#agScan)" />
        <rect width={3840} height={2160} fill="url(#agVignette)" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const rise = spring({frame, fps, config: {damping: 200, stiffness: 90, mass: 1}});
  const y = interpolate(rise, [0, 1], [60, 0]);
  const opacity = interpolate(rise, [0, 1], [0, 1]);
  const pulse = 0.72 + 0.28 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div style={{position: 'absolute', top: 118, left: 220, right: 220, opacity, transform: `translateY(${y}px)`}}>
      <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 14, color: TEAL}}>
        AGILE OPS &nbsp;·&nbsp; SPRINT ENGINE
      </div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 150, color: INK, marginTop: 16, letterSpacing: -2}}>
        Sprint Cycle
      </div>
      <div style={{display: 'flex', alignItems: 'center', marginTop: 24, gap: 28}}>
        <div style={{width: 22, height: 22, borderRadius: 11, backgroundColor: TEAL, opacity: pulse, boxShadow: `0 0 30px ${TEAL}`}} />
        <div style={{fontFamily: MONO, fontSize: 40, color: MUTED}}>
          BACKLOG &nbsp;→&nbsp; 2-WEEK SPRINT &nbsp;·&nbsp; 14 DAYS &nbsp;·&nbsp; {TOTAL_PTS} PTS
        </div>
        <div style={{marginLeft: 'auto', display: 'flex', gap: 22}}>
          {['SPRINT 14', '14 DAYS', `${TOTAL_PTS} PTS`].map((c) => (
            <div
              key={c}
              style={{
                fontFamily: MONO,
                fontSize: 38,
                fontWeight: 700,
                color: CYAN,
                border: `2px solid ${CYAN}`,
                borderRadius: 12,
                padding: '10px 28px',
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Backlog cards that fly into the ring
// ---------------------------------------------------------------------------
const BacklogCards: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const flowed = STORIES.filter((_, i) => frame >= FLOW_START + i * FLOW_STEP).length;
  const remain = STORIES.length - flowed;
  const headerS = spring({frame: frame - 10, fps, config: {damping: 200, stiffness: 90}});
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div
        style={{
          position: 'absolute',
          left: 220,
          top: 610,
          display: 'flex',
          alignItems: 'center',
          gap: 26,
          opacity: Math.min(1, headerS),
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: TEAL}}>PRODUCT BACKLOG</div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 36,
            color: INK,
            backgroundColor: 'rgba(45,212,191,0.12)',
            border: `1px solid ${TEAL}`,
            borderRadius: 10,
            padding: '8px 22px',
          }}
        >
          {remain} OPEN
        </div>
      </div>
      {STORIES.map((s, i) => {
        const enter = spring({frame: frame - (BACKLOG_ENTER + i * ENTER_STEP), fps, config: {damping: 200, stiffness: 110}});
        if (enter <= 0.001) return null;
        const flyStart = FLOW_START + i * FLOW_STEP;
        const flyP = interpolate(frame, [flyStart, flyStart + FLOW_DUR], [0, 1], clamp01);
        const ease = flyP * flyP * (3 - 2 * flyP);
        const tx = slotX(i) - (CARD_W * 0.7) / 2;
        const ty = slotY(i) - (CARD_H * 0.7) / 2;
        const x = CARD_X + (tx - CARD_X) * ease;
        const y = cardY(i) + (ty - cardY(i)) * ease - Math.sin(ease * Math.PI) * 170;
        const scale = 1 - ease * 0.3;
        const ex = interpolate(enter, [0, 1], [-80, 0]);
        const eo = interpolate(enter, [0, 1], [0, 1]);
        const doneDay = 2 + i * 1.6;
        const ringProgress = interpolate(frame, [RING_START, RING_CLOSE], [0, 1], clamp01);
        const done = ringProgress * N_DAYS >= doneDay && flyP >= 1;
        const doneSpring = spring({
          frame: frame - (flyStart + FLOW_DUR + (doneDay / N_DAYS) * (RING_CLOSE - RING_START - FLOW_DUR)),
          fps,
          config: {damping: 200, stiffness: 120},
        });
        return (
          <React.Fragment key={s.id}>
            {flyP >= 1 && (
              <div
                style={{
                  position: 'absolute',
                  left: CARD_X,
                  top: cardY(i),
                  width: CARD_W,
                  height: CARD_H,
                  border: `2px dashed ${SLATE}`,
                  borderRadius: 18,
                  opacity: 0.35,
                }}
              />
            )}
            <div
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: CARD_W,
                height: CARD_H,
                opacity: eo,
                transform: `translateX(${ex}px) scale(${scale})`,
                transformOrigin: 'left center',
                backgroundColor: PANEL,
                border: `1px solid ${HAIRLINE}`,
                borderLeft: `10px solid ${done ? GREEN : flyP >= 1 ? TEAL : 'rgba(234,242,251,0.25)'}`,
                borderRadius: 18,
                display: 'flex',
                alignItems: 'center',
                padding: '0 36px',
                gap: 30,
                boxShadow: flyP >= 1 ? `0 0 34px rgba(45,212,191,0.22)` : 'none',
              }}
            >
              <div style={{fontFamily: MONO, fontSize: 34, color: MUTED, width: 170}}>{s.id}</div>
              <div style={{flex: 1, fontFamily: FONT, fontWeight: 650, fontSize: 40, color: INK}}>{s.title}</div>
              <div
                style={{
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: 38,
                  color: '#04121A',
                  backgroundColor: done ? GREEN : TEAL,
                  borderRadius: 10,
                  padding: '10px 24px',
                  boxShadow: done ? `0 0 26px ${GREEN}` : `0 0 20px rgba(45,212,191,0.5)`,
                }}
              >
                {s.pts} PTS
              </div>
              {done && doneSpring > 0.02 && (
                <div
                  style={{
                    position: 'absolute',
                    right: -24,
                    top: -24,
                    width: 84,
                    height: 84,
                    borderRadius: 42,
                    backgroundColor: GREEN,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FONT,
                    fontWeight: 800,
                    fontSize: 46,
                    color: '#06281C',
                    boxShadow: `0 0 40px ${GREEN}`,
                    transform: `scale(${Math.min(1, doneSpring)})`,
                  }}
                >
                  ✓
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sprint ring: day ticks, progress arc, orbiting particles, center HUD
// ---------------------------------------------------------------------------
const SprintRing: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const progress = interpolate(frame, [RING_START, RING_CLOSE], [0, 1], clamp01);
  const dayFloat = progress * N_DAYS;
  const dayNum = Math.min(N_DAYS, Math.max(1, Math.floor(dayFloat) + 1));
  const ptsLeft = Math.round(TOTAL_PTS * (1 - progress));
  const enterS = spring({frame: frame - 190, fps, config: {damping: 200, stiffness: 80}});
  const finalGlow = interpolate(frame, [RING_CLOSE - 40, RING_CLOSE + 60], [0, 0.55], clamp01);
  const ticks: React.ReactElement[] = [];
  for (let d = 0; d < N_DAYS; d++) {
    const a = ((-90 + d * (360 / N_DAYS)) * Math.PI) / 180;
    const lit = d < dayFloat;
    const s = spring({frame: frame - (TICK_START + d * TICK_STEP), fps, config: {damping: 200, stiffness: 120}});
    if (s <= 0.001) continue;
    const x1 = CX + (R - 16) * Math.cos(a);
    const y1 = CY + (R - 16) * Math.sin(a);
    const x2 = CX + (R + 16) * Math.cos(a);
    const y2 = CY + (R + 16) * Math.sin(a);
    const lx = CX + (R + 58) * Math.cos(a);
    const ly = CY + (R + 58) * Math.sin(a);
    ticks.push(
      <g key={d} opacity={Math.min(1, s)}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={lit ? TEAL : SLATE} strokeWidth={lit ? 7 : 4} strokeLinecap="round" />
        <circle cx={x2} cy={y2} r={lit ? 8 : 5} fill={lit ? TEAL : SLATE} />
        <text
          x={lx}
          y={ly + 9}
          fill={lit ? TEAL : MUTED}
          fontSize={30}
          fontFamily={MONO}
          fontWeight={700}
          textAnchor="middle"
        >
          D{d + 1}
        </text>
      </g>
    );
  }
  const particles: React.ReactElement[] = [];
  for (let i = 0; i < 20; i++) {
    const base = random(`ag-part-a-${i}`) * Math.PI * 2;
    const rr = R + (random(`ag-part-r-${i}`) - 0.5) * 56;
    const speed = (0.0022 + random(`ag-part-s-${i}`) * 0.004) * (i % 2 === 0 ? 1 : -1);
    const a = base + frame * speed;
    const px = CX + rr * Math.cos(a);
    const py = CY + rr * Math.sin(a);
    const op = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(frame * 0.12 + i * 2.2));
    const sz = 5 + random(`ag-part-z-${i}`) * 7;
    particles.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? CYAN : TEAL} opacity={op} />);
  }
  const rot = frame * 0.18;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enterS)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <circle cx={CX} cy={CY} r={R + 36} fill="none" stroke="rgba(45,212,191,0.16)" strokeWidth={2} />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={TEAL} strokeWidth={26} opacity={finalGlow} filter="url(#agBlur14)" />
        <g transform={`rotate(${rot} ${CX} ${CY})`}>
          <circle
            cx={CX}
            cy={CY}
            r={R - 190}
            fill="none"
            stroke="rgba(103,232,249,0.28)"
            strokeWidth={3}
            strokeDasharray="10 26"
          />
        </g>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(234,242,251,0.14)" strokeWidth={10} />
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="url(#agRing)"
          strokeWidth={12}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - progress}
          transform={`rotate(-90 ${CX} ${CY})`}
          style={{filter: 'drop-shadow(0 0 18px rgba(45,212,191,0.65))'}}
        />
        {ticks}
        {particles}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: CX - 330,
          top: CY - 200,
          width: 660,
          textAlign: 'center',
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 40, letterSpacing: 12, color: TEAL}}>DAY</div>
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 170,
            color: INK,
            lineHeight: 1,
            textShadow: '0 0 40px rgba(45,212,191,0.45)',
          }}
        >
          {String(dayNum).padStart(2, '0')}
          <span style={{fontSize: 70, color: MUTED}}> / {N_DAYS}</span>
        </div>
        <div style={{fontFamily: MONO, fontSize: 40, color: MUTED, marginTop: 18}}>
          {ptsLeft} PTS LEFT
        </div>
        <div
          style={{
            width: 420,
            height: 16,
            backgroundColor: 'rgba(234,242,251,0.10)',
            borderRadius: 8,
            margin: '26px auto 0',
            overflow: 'hidden',
          }}
        >
          <div style={{width: `${progress * 100}%`, height: '100%', background: 'linear-gradient(90deg,#2DD4BF,#67E8F9)', borderRadius: 8}} />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: CX - 300,
          top: CY + 240,
          width: 600,
          textAlign: 'center',
          fontFamily: MONO,
          fontSize: 34,
          letterSpacing: 6,
          color: MUTED,
        }}
      >
        {progress >= 1 ? 'RING CLOSED · LOOPING TO SPRINT 15 →' : 'DAILY STANDUP · 09:15'}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Burndown panel (right column): ideal vs actual, cursor, counters, throughput
// ---------------------------------------------------------------------------
const BurndownPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 230, fps, config: {damping: 200, stiffness: 80}});
  const draw = interpolate(frame, [BURN_START, BURN_END], [0, 1], clamp01);
  const curDay = draw * N_DAYS;
  const ptsLeft = Math.round(interpolate(frame, [BURN_START, BURN_END], [TOTAL_PTS, 0], clamp01));
  const commits = Math.floor(interpolate(frame, [200, 860], [0, 214], clamp01));
  const prs = Math.floor(interpolate(frame, [240, 860], [0, 46], clamp01));
  const deploys = Math.floor(interpolate(frame, [320, 860], [0, 12], clamp01));

  const idealPath = `M ${dayX(0).toFixed(1)} ${ptsY(TOTAL_PTS).toFixed(1)} L ${dayX(N_DAYS).toFixed(1)} ${ptsY(0).toFixed(1)}`;
  const actualD = DAY_POINTS.map(
    (p, d) => `${d === 0 ? 'M' : 'L'} ${dayX(d).toFixed(1)} ${ptsY(p).toFixed(1)}`
  ).join(' ');
  const actualArea = `${actualD} L ${dayX(N_DAYS).toFixed(1)} ${BURNDOWN.yBot} L ${dayX(0).toFixed(1)} ${BURNDOWN.yBot} Z`;

  const curIdx = Math.min(N_DAYS - 1, Math.floor(curDay));
  const frac = curDay - curIdx;
  const curP = DAY_POINTS[curIdx] + (DAY_POINTS[curIdx + 1] - DAY_POINTS[curIdx]) * frac;
  const cxp = dayX(curDay);
  const cyp = ptsY(curP);

  const bars: React.ReactElement[] = [];
  const barX0 = 2800;
  const barW = 46;
  const barGap = 12;
  for (let d = 0; d < N_DAYS; d++) {
    const s = spring({frame: frame - (420 + d * 18), fps, config: {damping: 200, stiffness: 120}});
    if (s <= 0.001) continue;
    const hSeed = 40 + random(`ag-bar-h-${d}`) * 110;
    const pulse = 1 + 0.06 * Math.sin(frame * 0.15 + d * 1.3);
    const h = hSeed * Math.min(1, s) * pulse;
    const bx = barX0 + d * (barW + barGap);
    bars.push(
      <g key={d} opacity={Math.min(1, s)}>
        <rect x={bx} y={1370 - h} width={barW} height={h} rx={6} fill="url(#agBar)" opacity={0.85} />
        <text x={bx + barW / 2} y={1406} fill={MUTED} fontSize={24} fontFamily={MONO} textAnchor="middle">
          {d + 1}
        </text>
      </g>
    );
  }

  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <div style={{position: 'absolute', left: 2740, top: 380}}>
        <div style={{fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: TEAL}}>BURNDOWN</div>
        <div style={{fontFamily: MONO, fontSize: 34, color: MUTED, marginTop: 10}}>
          REMAINING WORK · PTS
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 3470,
          top: 380,
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: 96,
          color: INK,
          textShadow: '0 0 30px rgba(45,212,191,0.4)',
        }}
      >
        {ptsLeft}
      </div>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect
          x={2740}
          y={440}
          width={880}
          height={520}
          rx={20}
          fill={PANEL}
          stroke={HAIRLINE}
          strokeWidth={1.5}
        />
        {[0, 12, 24, 36].map((p) => (
          <g key={p}>
            <line x1={BURNDOWN.x0} y1={ptsY(p)} x2={BURNDOWN.x1} y2={ptsY(p)} stroke="rgba(234,242,251,0.07)" strokeWidth={1.5} />
            <text x={BURNDOWN.x0 - 18} y={ptsY(p) + 11} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="end">
              {p}
            </text>
          </g>
        ))}
        {[0, 7, 14].map((d) => (
          <text key={d} x={dayX(d)} y={BURNDOWN.yBot + 48} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle">
            D{d + 1}
          </text>
        ))}
        <path d={idealPath} fill="none" stroke={SLATE} strokeWidth={3} strokeDasharray="12 12" opacity={0.8} />
        <path d={actualArea} fill="url(#agArea)" opacity={draw} />
        <path
          d={actualD}
          fill="none"
          stroke={TEAL}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
          style={{filter: 'drop-shadow(0 0 16px rgba(45,212,191,0.7))'}}
        />
        {draw > 0.004 && draw < 0.999 && (
          <g>
            <circle cx={cxp} cy={cyp} r={30} fill={TEAL} opacity={0.18} />
            <circle cx={cxp} cy={cyp} r={13} fill="#FFFFFF" style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))'}} />
          </g>
        )}
        <text x={BURNDOWN.x1 - 220} y={ptsY(0) - 26} fill={TEAL} fontSize={30} fontFamily={MONO} fontWeight={700}>
          {draw >= 0.999 ? 'ZERO · D14 ✓' : `${Math.round(curP)} PTS`}
        </text>
        <text x={2740} y={1050} fill={MUTED} fontSize={30} fontFamily={MONO}>
          COMMITS {commits} · PRs {prs} · DEPLOYS {deploys}
        </text>
        <rect x={2740} y={1090} width={880} height={380} rx={20} fill={PANEL} stroke={HAIRLINE} strokeWidth={1.5} />
        <text x={2780} y={1150} fill={TEAL} fontSize={32} fontFamily={MONO} letterSpacing={8}>
          THROUGHPUT / DAY
        </text>
        {bars}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Live standup feed (cycling lines, per-frame ticker)
// ---------------------------------------------------------------------------
const STANDUP_LINES = [
  'D04 · STANDUP 09:15 — 2 BLOCKERS, 0 STALE',
  'STY-124 → IN REVIEW · NEEDS 1 APPROVAL',
  'BLOCKER CLEARED · SEARCH INDEX LOCK RELEASED',
  'D07 · STANDUP 09:15 — VELOCITY ON TRACK 22/36',
  'STY-133 → DONE · PR #482 MERGED',
  'RETRO ACTION ADDED · FLAKY TEST QUARANTINED',
  'D11 · STANDUP 09:15 — 1 BLOCKER, CARRYOVER RISK 0',
  'STY-139 → IN REVIEW · DOCS ATTACHED',
  'D14 · STANDUP 09:15 — SPRINT REVIEW AT 14:00',
  'VELOCITY 36/36 · ZERO CARRYOVER',
];
const StandupFeed: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 300, fps, config: {damping: 200, stiffness: 90}});
  const head = Math.floor(frame / 40) % STANDUP_LINES.length;
  const live = 0.6 + 0.4 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div
      style={{
        position: 'absolute',
        left: 2740,
        top: 1500,
        width: 880,
        height: 250,
        opacity: Math.min(1, enter),
        backgroundColor: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 20,
        padding: '34px 44px',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{width: 20, height: 20, borderRadius: 10, backgroundColor: GREEN, opacity: live, boxShadow: `0 0 26px ${GREEN}`}} />
        <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 8, color: GREEN}}>LIVE STANDUP FEED</div>
      </div>
      <div style={{marginTop: 26}}>
        {[0, 1, 2].map((k) => {
          const line = STANDUP_LINES[(head + k) % STANDUP_LINES.length];
          const fade = interpolate(k, [0, 2], [1, 0.45]);
          return (
            <div
              key={`${head}-${k}`}
              style={{
                fontFamily: MONO,
                fontSize: 34,
                color: k === 0 ? INK : MUTED,
                opacity: fade,
                marginTop: k === 0 ? 0 : 14,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Review + Retro checkpoints
// ---------------------------------------------------------------------------
const Checkpoints: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const items = [
    {at: REVIEW_AT, label: 'SPRINT REVIEW', sub: 'DEMO · STAKEHOLDERS', x: 930, color: BLUE},
    {at: RETRO_AT, label: 'RETRO', sub: 'WHAT WORKED · FIX ONE THING', x: 2470, color: CYAN},
  ];
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <line
          x1={1370}
          y1={1705}
          x2={2470}
          y2={1705}
          stroke={SLATE}
          strokeWidth={3}
          strokeDasharray="14 14"
          opacity={interpolate(frame, [REVIEW_AT, REVIEW_AT + 40], [0, 0.7], clamp01)}
        />
      </svg>
      {items.map((it) => {
        const s = spring({frame: frame - it.at, fps, config: {damping: 200, stiffness: 100}});
        if (s <= 0.001) return null;
        return (
          <div
            key={it.label}
            style={{
              position: 'absolute',
              left: it.x,
              top: 1630,
              width: 440,
              height: 150,
              opacity: Math.min(1, s),
              transform: `translateY(${(1 - s) * 40}px) scale(${0.9 + s * 0.1})`,
              backgroundColor: PANEL,
              border: `2px solid ${it.color}`,
              borderRadius: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 50px ${it.color}55`,
            }}
          >
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, color: INK, letterSpacing: 2}}>
              {it.label}
            </div>
            <div style={{fontFamily: MONO, fontSize: 28, color: it.color, marginTop: 10, letterSpacing: 3}}>
              {it.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payoff banner: velocity payoff + loop stamp
// ---------------------------------------------------------------------------
const PayoffBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - PAYOFF_START, fps, config: {damping: 200, stiffness: 70}});
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.94, 1]);
  const w = interpolate(frame, [PAYOFF_START, PAYOFF_START + 50], [0, 2100], clamp01);
  const stampS = spring({frame: frame - (PAYOFF_START + 14), fps, config: {damping: 200, stiffness: 140}});
  const pts = Math.round(interpolate(frame, [PAYOFF_START, PAYOFF_START + 45], [0, TOTAL_PTS], clamp01));
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 96,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          position: 'relative',
          backgroundColor: 'rgba(5,11,22,0.94)',
          border: `2px solid ${TEAL}`,
          borderRadius: 26,
          padding: '40px 110px',
          textAlign: 'center',
          boxShadow: '0 0 110px rgba(45,212,191,0.35)',
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 40, letterSpacing: 14, color: TEAL}}>SPRINT 14 COMPLETE</div>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 92, color: INK, marginTop: 10}}>
          VELOCITY {pts} / {TOTAL_PTS} PTS
        </div>
        <div style={{fontFamily: MONO, fontSize: 36, color: MUTED, marginTop: 12}}>
          8/8 STORIES DONE &nbsp;·&nbsp; 0 CARRYOVER &nbsp;·&nbsp; LOOPING TO SPRINT 15 →
        </div>
        <div style={{width: w, maxWidth: '100%', height: 10, background: 'linear-gradient(90deg,#2DD4BF,#67E8F9,#60A5FA)', borderRadius: 5, margin: '26px auto 0'}} />
        {stampS > 0.02 && (
          <div
            style={{
              position: 'absolute',
              right: 60,
              top: -56,
              transform: `rotate(10deg) scale(${Math.min(1, stampS)})`,
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 54,
              color: TEAL,
              border: `5px solid ${TEAL}`,
              borderRadius: 18,
              padding: '14px 40px',
              backgroundColor: 'rgba(5,11,22,0.9)',
              boxShadow: '0 0 60px rgba(45,212,191,0.55)',
              letterSpacing: 4,
            }}
          >
            DONE ✓
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain (full-frame, re-seeded every frame)
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 900;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`ag-grain-x-${frame}-${i}`) * 3840;
    const y = random(`ag-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`ag-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`ag-grain-s-${frame}-${i}`) * 2.5;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const AgileSprintCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <BacklogCards frame={frame} fps={fps} />
      <SprintRing frame={frame} fps={fps} />
      <BurndownPanel frame={frame} fps={fps} />
      <StandupFeed frame={frame} fps={fps} />
      <Checkpoints frame={frame} fps={fps} />
      <PayoffBanner frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
