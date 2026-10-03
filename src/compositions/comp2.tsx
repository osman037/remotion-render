/**
 * ForkliftCertificationJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The forklift certification journey: a forklift silhouette stands with
 * safety cones, a pre-shift inspection checklist ticks off, the forklift
 * weaves a slalom cone course for the skill test, a written-exam card
 * stamps PASS, a certification seal badge appears, and the annual
 * recertification ring closes. Deterministic.
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
// Palette (safety orange / yellow on dark)
// ---------------------------------------------------------------------------
const BG = '#14100A';
const INK = '#FFF7E8';
const MUTED = 'rgba(255,247,232,0.62)';
const FAINT = 'rgba(255,247,232,0.32)';
const ORANGE = '#F97316';
const YELLOW = '#FACC15';
const GREEN = '#34D399';
const BLUE = '#38BDF8';
const PANEL = 'rgba(24,18,10,0.94)';
const HAIRLINE = 'rgba(255,247,232,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: fork
// ---------------------------------------------------------------------------
const Background_fork: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#FBD9A8" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 28%, rgba(249,115,22,0.14), rgba(250,204,21,0.04) 46%, rgba(20,16,10,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#forkVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(249,115,22,0.045)" />
        <defs>
          <radialGradient id="forkVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(20,16,10,0)" />
            <stop offset="100%" stopColor="rgba(8,6,3,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_fork: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`fork-amb-x-${i}`) * 3840;
    const by = random(`fork-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`fork-amb-s-${i}`) * 1.4;
    const ang = random(`fork-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`fork-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? ORANGE : i % 4 === 1 ? YELLOW : 'rgba(255,247,232,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_fork: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`fork-dth-x-${i}`) * 3840;
    const by = random(`fork-dth-y-${i}`) * 2160;
    const jx = (random(`fork-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`fork-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`fork-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`fork-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#FBD9A8" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_fork = [
  'PRE-SHIFT INSPECTION',
  'CONE COURSE SLALOM',
  'WRITTEN EXAM 96/100',
  'CERTIFIED OPERATOR',
  '12-MONTH RECERTIFICATION',
  'SAFETY FIRST ALWAYS',
  'LOAD LIMIT 5,000 LB',
  'HORN BEFORE TURNS',
];
const TickerTape_fork: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_fork.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(249,115,22,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(10,7,3,0.66)', borderBottom: '1px solid rgba(255,247,232,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_fork: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.55 + 0.45 * Math.sin((frame / 60) * Math.PI * 2);
  const corners = [
    {x: 60, y: 92, sx: 1, sy: 1},
    {x: 3780, y: 92, sx: -1, sy: 1},
    {x: 60, y: 2068, sx: 1, sy: -1},
    {x: 3780, y: 2068, sx: -1, sy: -1},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {corners.map((c, i) => (
          <g key={i} transform={`translate(${c.x},${c.y}) scale(${c.sx},${c.sy})`}>
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(249,115,22,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={ORANGE} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? ORANGE : 'rgba(255,247,232,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? ORANGE : 'rgba(255,247,232,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_fork: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`fork-grain-x-${frame}-${i}`) * 3840;
    const y = random(`fork-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`fork-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`fork-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Shared primitives: traffic cone + forklift silhouette (pure SVG)
// ---------------------------------------------------------------------------
const Cone_fork: React.FC<{x: number; y: number; s?: number; lit?: boolean}> = ({x, y, s = 1, lit = false}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-64} y={132} width={128} height={24} rx={8} fill={lit ? YELLOW : ORANGE}
      style={lit ? {filter: 'drop-shadow(0 0 22px rgba(250,204,21,0.8))'} : undefined} />
    <path d="M 0 -150 L -58 132 L 58 132 Z" fill={ORANGE} opacity={0.96} />
    <path d="M -27 -64 L 27 -64 L 38 6 L -38 6 Z" fill={INK} opacity={0.92} />
    <path d="M -42 66 L 42 66 L 50 112 L -50 112 Z" fill={INK} opacity={0.92} />
  </g>
);

const Forklift_fork: React.FC<{x: number; y: number; s?: number; frame: number; moving?: boolean}> = ({x, y, s = 1, frame, moving = false}) => {
  const wheelA = moving ? frame * 4.2 : 0;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {/* rear + front wheels */}
      <g transform={`rotate(${wheelA} 70 0)`}>
        <circle cx={70} cy={0} r={76} fill="#1E1A12" stroke={FAINT} strokeWidth={8} />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line key={a} x1={70} y1={0} x2={70 + 58 * Math.cos((a * Math.PI) / 180)} y2={58 * Math.sin((a * Math.PI) / 180)} stroke={FAINT} strokeWidth={10} />
        ))}
        <circle cx={70} cy={0} r={20} fill={FAINT} />
      </g>
      <g transform={`rotate(${wheelA} 250 0)`}>
        <circle cx={250} cy={0} r={76} fill="#1E1A12" stroke={FAINT} strokeWidth={8} />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line key={a} x1={250} y1={0} x2={250 + 58 * Math.cos((a * Math.PI) / 180)} y2={58 * Math.sin((a * Math.PI) / 180)} stroke={FAINT} strokeWidth={10} />
        ))}
        <circle cx={250} cy={0} r={20} fill={FAINT} />
      </g>
      {/* chassis */}
      <rect x={-20} y={-170} width={330} height={120} rx={26} fill={ORANGE} />
      <rect x={-20} y={-170} width={330} height={120} rx={26} fill="none" stroke={YELLOW} strokeWidth={5} opacity={0.7} />
      {/* counterweight curve */}
      <path d="M -20 -170 Q -96 -130 -96 -40 L -20 -40 Z" fill={ORANGE} />
      {/* overhead guard */}
      <rect x={10} y={-330} width={18} height={170} fill="#2A2318" />
      <rect x={200} y={-330} width={18} height={170} fill="#2A2318" />
      <rect x={-30} y={-352} width={290} height={30} rx={12} fill="#2A2318" />
      {/* operator silhouette */}
      <circle cx={130} cy={-252} r={34} fill="#3A2F1C" />
      <path d="M 96 -218 L 96 -170 L 168 -170 L 168 -218 Q 132 -238 96 -218 Z" fill="#3A2F1C" />
      {/* mast */}
      <rect x={326} y={-420} width={26} height={380} fill="#2A2318" />
      <rect x={362} y={-420} width={26} height={380} fill="#2A2318" />
      {/* carriage + forks */}
      <rect x={326} y={-96} width={80} height={30} fill={YELLOW} />
      <rect x={326} y={-66} width={250} height={26} rx={8} fill={YELLOW} />
      <rect x={326} y={-120} width={250} height={24} rx={8} fill={YELLOW} opacity={0.55} />
      {/* headlight */}
      <circle cx={310} cy={-140} r={16} fill={YELLOW} style={{filter: 'drop-shadow(0 0 18px rgba(250,204,21,0.9))'}} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_fork: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        FORKLIFT CERTIFICATION JOURNEY
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        operator training &middot; from first cone to certified
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Intro scene: parked forklift + cones
// ---------------------------------------------------------------------------
const Intro_fork: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [40, 120], [0, 1], clamp01);
  if (fade <= 0) return null;
  // scene slides away when the course starts (f400+)
  const out = interpolate(frame, [560, 640], [1, 0], clamp01);
  if (out <= 0) return null;
  const s = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 90}});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade * out}>
      <g transform={`translate(${(1 - s) * -400},0)`}>
        <Forklift_fork x={1250} y={1420} s={1.35} frame={frame} />
        <Cone_fork x={560} y={1300} s={1.6} lit={frame > 200} />
        <Cone_fork x={2360} y={1330} s={1.35} lit={frame > 260} />
        <Cone_fork x={2660} y={1290} s={1.7} lit={frame > 320} />
        <text x={1250} y={1740} fill={FAINT} fontSize={34} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
          TRAINING UNIT 07 &middot; READY FOR INSPECTION
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Pre-shift inspection checklist
// ---------------------------------------------------------------------------
const CHECKS_fork = [
  {label: 'TIRES & WHEELS', at: 200},
  {label: 'FORKS & MAST', at: 240},
  {label: 'BRAKES', at: 280},
  {label: 'HYDRAULICS', at: 320},
  {label: 'HORN & LIGHTS', at: 360},
];
const Inspection_fork: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 170, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const out = interpolate(frame, [560, 640], [1, 0], clamp01);
  if (out <= 0) return null;
  const doneCount = CHECKS_fork.filter((c) => frame >= c.at + 24).length;
  return (
    <div style={{
      position: 'absolute', left: 2400, top: 480, width: 1120, opacity: Math.min(1, s) * out,
      transform: `translateX(${(1 - s) * 120}px)`,
    }}>
      <div style={{
        borderRadius: 28, background: PANEL, border: `2px solid ${ORANGE}`, padding: '36px 48px',
        boxShadow: '0 0 54px rgba(249,115,22,0.30)',
      }}>
        <div style={{color: ORANGE, fontFamily: MONO, fontWeight: 800, fontSize: 38, letterSpacing: 4}}>PRE-SHIFT INSPECTION</div>
        <div style={{marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16}}>
          {CHECKS_fork.map((c) => {
            const on = interpolate(frame, [c.at, c.at + 24], [0, 1], clamp01);
            return (
              <div key={c.label} style={{display: 'flex', alignItems: 'center', gap: 22, opacity: 0.35 + 0.65 * on}}>
                <div style={{
                  width: 54, height: 54, borderRadius: 14, background: on > 0.5 ? GREEN : 'transparent',
                  border: `3px solid ${on > 0.5 ? GREEN : FAINT}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#04120B', fontSize: 34, fontWeight: 800,
                }}>
                  {on > 0.5 ? '\u2713' : ''}
                </div>
                <div style={{color: on > 0.5 ? INK : MUTED, fontFamily: MONO, fontSize: 38, letterSpacing: 2}}>{c.label}</div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 24, color: doneCount === 5 ? GREEN : MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 2}}>
          {doneCount === 5 ? 'ALL CLEAR \u2014 PROCEED TO COURSE' : `${doneCount}/5 CHECKS COMPLETE`}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Skill-test cone course: forklift weaves the slalom
// ---------------------------------------------------------------------------
const COURSE_CONES_fork = [640, 1120, 1600, 2080, 2560, 3040];
const Course_fork: React.FC<{frame: number; fps: number}> = ({frame}) => {
  const fade = interpolate(frame, [600, 660], [0, 1], clamp01);
  if (fade <= 0) return null;
  const travel = interpolate(frame, [660, 830], [0, 1], clamp01);
  const fx = interpolate(travel, [0, 1], [280, 3300], clamp01);
  const fy = 1420 + Math.sin(travel * Math.PI * 5) * 200 - 160;
  const doneCount = COURSE_CONES_fork.filter((cx) => fx > cx - 60).length;
  const trail: React.ReactElement[] = [];
  for (let k = 0; k < 26; k++) {
    const tt = interpolate(frame, [660 + k * 7, 830], [0, 1], clamp01);
    if (tt <= 0 || tt >= travel) continue;
    const tx = interpolate(tt, [0, 1], [280, 3300], clamp01);
    const ty = 1420 + Math.sin(tt * Math.PI * 5) * 200 - 160;
    trail.push(<circle key={k} cx={tx + 260} cy={ty} r={10} fill={YELLOW} opacity={0.16 + 0.1 * Math.sin(k)} />);
  }
  return (
    <>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}} opacity={fade}>
        {/* course floor markings */}
        <line x1={420} y1={1720} x2={3420} y2={1720} stroke={HAIRLINE} strokeWidth={6} strokeDasharray="40 30" />
        <text x={420} y={1800} fill={FAINT} fontSize={30} fontFamily={MONO} letterSpacing={4}>SKILL TEST &middot; CONE SLALOM</text>
        <text x={3420} y={1800} fill={doneCount === 6 ? GREEN : MUTED} fontSize={30} fontFamily={MONO} letterSpacing={4} textAnchor="end">
          GATES {doneCount}/6
        </text>
        {/* dashed slalom guide */}
        <path d={`M 280 1260 ${COURSE_CONES_fork.map((cx, i) => `L ${cx} ${1420 + (i % 2 === 0 ? -360 : 40)}`).join(' ')} L 3300 1260`}
          fill="none" stroke="rgba(250,204,21,0.28)" strokeWidth={5} strokeDasharray="24 28" />
        {COURSE_CONES_fork.map((cx, i) => {
          const lit = fx > cx - 60;
          const cy = 1420 + (i % 2 === 0 ? -360 : 40) - 60;
          return <Cone_fork key={i} x={cx} y={cy} s={1.5} lit={lit} />;
        })}
        {trail}
        <Forklift_fork x={fx} y={fy} s={1.0} frame={frame} moving={travel > 0 && travel < 1} />
      </svg>
      {doneCount === 6 && (
        <div style={{
          position: 'absolute', left: 1920 - 420, top: 560, width: 840, opacity: interpolate(frame, [845, 875], [0, 1], clamp01),
          textAlign: 'center', borderRadius: 26, background: 'rgba(52,211,153,0.12)',
          border: '5px solid rgba(52,211,153,0.9)', padding: '24px 40px',
          boxShadow: '0 0 60px rgba(52,211,153,0.45)',
        }}>
          <div style={{color: GREEN, fontFamily: FONT, fontWeight: 800, fontSize: 84, letterSpacing: 4}}>COURSE CLEAR</div>
          <div style={{color: INK, fontFamily: MONO, fontSize: 32, marginTop: 6}}>6/6 GATES &middot; ZERO CONES TOUCHED</div>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Written exam card with PASS stamp
// ---------------------------------------------------------------------------
const Exam_fork: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 600, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const out = interpolate(frame, [800, 860], [1, 0], clamp01);
  if (out <= 0) return null;
  const score = Math.round(interpolate(frame, [620, 700], [0, 96], clamp01));
  const stamp = spring({frame: frame - 700, fps, config: {damping: 200, stiffness: 90}});
  return (
    <div style={{
      position: 'absolute', left: 260, top: 480, width: 940, opacity: Math.min(1, s) * out,
      transform: `translateX(${(1 - s) * -120}px)`,
    }}>
      <div style={{
        borderRadius: 28, background: PANEL, border: `2px solid ${BLUE}`, padding: '36px 48px',
        boxShadow: '0 0 54px rgba(56,189,248,0.30)',
      }}>
        <div style={{color: BLUE, fontFamily: MONO, fontWeight: 800, fontSize: 38, letterSpacing: 4}}>WRITTEN EXAM</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 14}}>
          <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 120}}>{score}</div>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 48}}>/ 100</div>
        </div>
        <div style={{marginTop: 10, height: 22, borderRadius: 11, background: 'rgba(255,247,232,0.10)', overflow: 'hidden'}}>
          <div style={{width: `${(score / 100) * 100}%`, height: '100%', background: BLUE}} />
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, marginTop: 12}}>SAFETY RULES &middot; LOAD CHARTS &middot; STABILITY</div>
      </div>
      {stamp > 0.001 && (
        <div style={{
          position: 'absolute', right: -70, top: 120, opacity: Math.min(1, stamp),
          transform: `rotate(-10deg) scale(${0.55 + 0.45 * stamp})`,
        }}>
          <div style={{
            borderRadius: 18, padding: '18px 46px', background: 'rgba(52,211,153,0.12)',
            border: '5px solid rgba(52,211,153,0.95)', boxShadow: '0 0 50px rgba(52,211,153,0.45)',
          }}>
            <div style={{color: GREEN, fontFamily: FONT, fontWeight: 800, fontSize: 84, letterSpacing: 5}}>PASS</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Certification badge + annual recertification ring (payoff)
// ---------------------------------------------------------------------------
const Badge_fork: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 800, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const sealPulse = 0.5 + 0.5 * Math.sin((frame - 800) * 0.1);
  const R = 190;
  const C = 2 * Math.PI * R;
  const months = Math.min(12, Math.round(interpolate(frame, [820, 890], [0, 12], clamp01)));
  const sparks: React.ReactElement[] = [];
  for (let i = 0; i < 40; i++) {
    const ang = random(`fork-sp-a-${i}`) * Math.PI * 2;
    const dist = 260 + random(`fork-sp-d-${i}`) * 260;
    const t = interpolate(frame, [810, 900], [0, 1], clamp01);
    const cx = 1920 + Math.cos(ang) * dist * t;
    const cy = 1050 + Math.sin(ang) * dist * t * 0.7;
    const col = i % 2 === 0 ? YELLOW : ORANGE;
    sparks.push(<rect key={i} x={cx} y={cy} width={12} height={12} fill={col} opacity={(1 - t) * 0.9}
      transform={`rotate(${ang * 57.3 + t * 300} ${cx} ${cy})`} />);
  }
  return (
    <>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
        {sparks}
      </svg>
      <div style={{
        position: 'absolute', left: 1920 - 640, top: 420, width: 1280, opacity: Math.min(1, s),
        transform: `scale(${0.85 + 0.15 * Math.min(1, s)})`, textAlign: 'center',
      }}>
        <svg width={1280} height={760} style={{overflow: 'visible'}}>
          {/* recertification ring: 12 month segments */}
          {Array.from({length: 12}, (_, m) => {
            const a0 = (m / 12) * Math.PI * 2 - Math.PI / 2;
            const a1 = ((m + 1) / 12) * Math.PI * 2 - Math.PI / 2;
            const on = m < months;
            const x0 = 640 + R * 1.28 * Math.cos(a0);
            const y0 = 330 + R * 1.28 * Math.sin(a0);
            const x1 = 640 + R * 1.28 * Math.cos(a1);
            const y1 = 330 + R * 1.28 * Math.sin(a1);
            return (
              <path key={m} d={`M ${x0} ${y0} A ${R * 1.28} ${R * 1.28} 0 0 1 ${x1} ${y1}`}
                fill="none" stroke={on ? YELLOW : 'rgba(255,247,232,0.14)'} strokeWidth={26} strokeLinecap="round"
                style={on ? {filter: 'drop-shadow(0 0 14px rgba(250,204,21,0.8))'} : undefined} />
            );
          })}
          {/* seal */}
          <g style={{filter: `drop-shadow(0 0 ${30 + sealPulse * 30}px rgba(250,204,21,0.55))`}}>
            <circle cx={640} cy={330} r={R} fill="rgba(250,204,21,0.10)" stroke={YELLOW} strokeWidth={10} />
            <circle cx={640} cy={330} r={R - 34} fill="none" stroke={ORANGE} strokeWidth={5} strokeDasharray="18 14" />
            <path d="M 640 210 L 676 292 L 764 296 L 696 352 L 716 440 L 640 392 L 564 440 L 584 352 L 516 296 L 604 292 Z"
              fill={YELLOW} />
            <text x={640} y={540} fill={INK} fontSize={54} fontFamily={FONT} fontWeight={800} letterSpacing={4} textAnchor="middle">
              CERTIFIED OPERATOR
            </text>
            <text x={640} y={592} fill={MUTED} fontSize={32} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
              FORKLIFT &middot; CLASS IV/V
            </text>
          </g>
        </svg>
        <div style={{color: months === 12 ? YELLOW : MUTED, fontFamily: MONO, fontSize: 36, letterSpacing: 3, marginTop: 10}}>
          VALID {months}/12 MONTHS &middot; ANNUAL RECERTIFICATION
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const ForkliftCertificationJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_fork frame={frame} />
      <AmbientParticles_fork frame={frame} />
      <Title_fork frame={frame} fps={fps} />
      <Intro_fork frame={frame} fps={fps} />
      <Inspection_fork frame={frame} fps={fps} />
      <Course_fork frame={frame} fps={fps} />
      <Exam_fork frame={frame} fps={fps} />
      <Badge_fork frame={frame} fps={fps} />
      <TickerTape_fork frame={frame} />
      <CornerHud_fork frame={frame} />
      <FineDither_fork frame={frame} />
      <FilmGrain_fork frame={frame} />
    </AbsoluteFill>
  );
};
