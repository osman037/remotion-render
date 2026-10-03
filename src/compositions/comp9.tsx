/**
 * ClinicalTrialEnrollmentFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A clinical-trial enrollment journey: patient card + molecule icon,
 * eligibility checklist ticks, glowing informed-consent document, study-visit
 * calendar dots filling, lab vials filling, data streams flowing into a
 * shield emblem — then the WITHDRAW ANYTIME door closes the loop on trust.
 * Clinical cyan/white on deep blue-black. Deterministic.
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
// Palette (clinical cyan / white on deep blue-black)
// ---------------------------------------------------------------------------
const BG = '#070D16';
const INK = '#F0F9FF';
const MUTED = 'rgba(240,249,255,0.64)';
const FAINT = 'rgba(240,249,255,0.34)';
const CYAN = '#22D3EE';
const WHITE = '#F0F9FF';
const GREEN = '#34D399';
const AMBER = '#FBBF24';
const PANEL = 'rgba(9,16,28,0.94)';
const HAIRLINE = 'rgba(240,249,255,0.15)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: ctrial
// ---------------------------------------------------------------------------
const Background_ctrial: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#A5F3FC" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(34,211,238,0.13), rgba(34,211,238,0.03) 46%, rgba(7,13,22,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#ctrialVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(34,211,238,0.045)" />
        <defs>
          <radialGradient id="ctrialVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(7,13,22,0)" />
            <stop offset="100%" stopColor="rgba(3,5,10,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_ctrial: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`ctrial-amb-x-${i}`) * 3840;
    const by = random(`ctrial-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`ctrial-amb-s-${i}`) * 1.4;
    const ang = random(`ctrial-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`ctrial-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? CYAN : i % 4 === 1 ? WHITE : 'rgba(240,249,255,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_ctrial: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`ctrial-dth-x-${i}`) * 3840;
    const by = random(`ctrial-dth-y-${i}`) * 2160;
    const jx = (random(`ctrial-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`ctrial-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`ctrial-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`ctrial-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#CFFAFE" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_ctrial = [
  'PHASE II · DOUBLE-BLIND',
  'IRB APPROVED #2026-084',
  'INFORMED CONSENT SIGNED',
  'VISIT 7 OF 12',
  'DATA ENCRYPTED AES-256',
  'SAFETY FIRST',
  'WITHDRAW ANYTIME',
  'PATIENT RIGHTS PROTECTED',
];
const TickerTape_ctrial: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_ctrial.join('   ◆   ') + '   ◆   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(34,211,238,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(4,8,14,0.66)', borderBottom: '1px solid rgba(240,249,255,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_ctrial: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(34,211,238,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={CYAN} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? CYAN : 'rgba(240,249,255,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? CYAN : 'rgba(240,249,255,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_ctrial: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`ctrial-grain-x-${frame}-${i}`) * 3840;
    const y = random(`ctrial-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`ctrial-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`ctrial-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_ctrial: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        CLINICAL TRIAL ENROLLMENT FLOW
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        Every patient protected — screened, informed, monitored, <span style={{color: CYAN}}>free to leave anytime</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Station 1: patient card + molecule icon (left, top row)
// ---------------------------------------------------------------------------
const PatientCard_ctrial: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  // ECG trace scrolls with the frame
  const pts: string[] = [];
  for (let px = 0; px <= 560; px += 8) {
    const t = (px + frame * 6) * 0.045;
    const beat = Math.pow(Math.max(0, Math.sin(t)), 14) * 64 - Math.pow(Math.max(0, Math.sin(t + 0.5)), 30) * 26;
    pts.push(`${px},${(96 - beat).toFixed(1)}`);
  }
  return (
    <g opacity={Math.min(1, s)} transform={`translate(${(1 - s) * -60},0)`}>
      <rect x={180} y={380} width={680} height={700} rx={30} fill={PANEL} stroke={CYAN} strokeWidth={4} />
      <text x={240} y={452} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        PATIENT CARD
      </text>
      <text x={240} y={498} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        ID PT-2026-0117 · ANONYMIZED
      </text>
      {/* person glyph */}
      <g transform="translate(330,640)">
        <circle r={52} fill="none" stroke={CYAN} strokeWidth={10} />
        <path d="M -72 108 A 78 78 0 0 1 72 108" fill="none" stroke={CYAN} strokeWidth={10} strokeLinecap="round" />
      </g>
      {/* molecule icon */}
      <g transform="translate(660,640)">
        <circle cx={-70} cy={-50} r={30} fill={CYAN} opacity={0.9} />
        <circle cx={70} cy={-40} r={22} fill={WHITE} opacity={0.9} />
        <circle cx={0} cy={60} r={36} fill="none" stroke={CYAN} strokeWidth={10} />
        <circle cx={0} cy={60} r={12} fill={CYAN} />
        <line x1={-44} y1={-32} x2={-22} y2={22} stroke={CYAN} strokeWidth={8} />
        <line x1={44} y1={-26} x2={24} y2={28} stroke={WHITE} strokeWidth={8} />
      </g>
      <text x={240} y={800} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={2}>
        CANDIDATE · PHASE II COHORT B
      </text>
      {/* live vitals strip */}
      <rect x={240} y={830} width={560} height={160} rx={18} fill="rgba(34,211,238,0.06)" stroke={HAIRLINE} strokeWidth={2} />
      <text x={264} y={872} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={3}>
        LIVE VITALS
      </text>
      <g transform="translate(240,872)">
        <polyline points={pts.join(' ')} fill="none" stroke={GREEN} strokeWidth={5}
          style={{filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.6))'}} />
      </g>
      <text x={240} y={1040} fill={FAINT} fontSize={26} fontFamily={MONO} letterSpacing={2}>
        HR 72 BPM · BP 118/76 · SPO2 98%
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Station 2: eligibility checklist (center-left, top row)
// ---------------------------------------------------------------------------
const ELIG_ITEMS_ctrial = [
  {t: 'AGE 18 – 65', f: 150},
  {t: 'DIAGNOSIS CONFIRMED', f: 180},
  {t: 'NO EXCLUSION MEDICATIONS', f: 210},
  {t: 'ABLE TO GIVE CONSENT', f: 240},
];
const Eligibility_ctrial: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 120, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const screened = Math.floor(interpolate(frame, [150, 270], [0, 248], clamp01));
  return (
    <g opacity={Math.min(1, s)} transform={`translate(${(1 - s) * 60},0)`}>
      <rect x={940} y={380} width={680} height={700} rx={30} fill={PANEL} stroke={HAIRLINE} strokeWidth={3} />
      <text x={1000} y={452} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        ELIGIBILITY SCREEN
      </text>
      <text x={1000} y={500} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        CANDIDATES SCREENED: <tspan fill={CYAN} fontWeight={800}>{screened}</tspan>
      </text>
      {ELIG_ITEMS_ctrial.map((it, i) => {
        const on = frame >= it.f;
        const yy = 580 + i * 104;
        return (
          <g key={it.t} opacity={on ? 1 : 0.35}>
            <rect x={1000} y={yy - 36} width={68} height={68} rx={14} fill="none"
              stroke={on ? GREEN : FAINT} strokeWidth={5} />
            {on && (
              <path d={`M 1016 ${yy - 2} l 18 18 l 34 -40`} fill="none" stroke={GREEN} strokeWidth={10}
                strokeLinecap="round" strokeLinejoin="round" />
            )}
            <text x={1090} y={yy + 10} fill={on ? INK : MUTED} fontSize={29} fontFamily={MONO} letterSpacing={2}>
              {it.t}
            </text>
          </g>
        );
      })}
      {frame >= 280 && (
        <g>
          <rect x={1000} y={950} width={560} height={72} rx={36} fill="rgba(52,211,153,0.10)" stroke={GREEN} strokeWidth={3} />
          <text x={1280} y={998} fill={GREEN} fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={2}>
            ✓ ELIGIBLE — ENROLL
          </text>
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Station 3: informed-consent document glows; signature draws
// ---------------------------------------------------------------------------
const ConsentDoc_ctrial: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 260, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const signDraw = interpolate(frame, [340, 430], [0, 1], clamp01);
  const glow = 0.35 + 0.3 * Math.sin(frame * 0.08);
  const readPct = Math.floor(interpolate(frame, [300, 400], [0, 100], clamp01));
  return (
    <g opacity={Math.min(1, s)}>
      <defs>
        <filter id="ctrialDocGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={36} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x={1700} y={380} width={680} height={700} rx={30} fill={PANEL}
        stroke={CYAN} strokeWidth={4} opacity={0.5 + glow} filter="url(#ctrialDocGlow)" />
      <rect x={1700} y={380} width={680} height={700} rx={30} fill={PANEL} stroke={CYAN} strokeWidth={3} />
      <text x={1760} y={452} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        INFORMED CONSENT
      </text>
      <text x={1760} y={500} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        12 PAGES · READ-ALOUD OPTION
      </text>
      {/* document text lines */}
      {Array.from({length: 8}, (_, i) => (
        <rect key={i} x={1760} y={548 + i * 44} width={560 - (i % 3) * 90} height={14} rx={7}
          fill={i * 12 < readPct ? 'rgba(240,249,255,0.55)' : 'rgba(240,249,255,0.16)'} />
      ))}
      {/* reading progress */}
      <rect x={1760} y={928} width={560} height={12} rx={6} fill="rgba(240,249,255,0.10)" />
      <rect x={1760} y={928} width={560 * (readPct / 100)} height={12} rx={6} fill={CYAN} />
      <text x={2320} y={918} fill={CYAN} fontSize={28} fontFamily={MONO} textAnchor="end">{readPct}% READ</text>
      {/* signature line draws */}
      <line x1={1760} y1={1000} x2={2320} y2={1000} stroke={FAINT} strokeWidth={3} />
      <path d="M 1780 986 C 1840 940, 1880 1020, 1940 972 S 2040 940, 2100 986 S 2200 950, 2280 982"
        fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - signDraw} />
      <text x={1760} y={1040} fill={MUTED} fontSize={28} fontFamily={MONO} letterSpacing={3}>
        {signDraw >= 1 ? 'SIGNED · UNDERSTOOD ✓' : 'SIGNATURE'}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Data pipeline connector: marching dashes link the stations
// ---------------------------------------------------------------------------
const Pipeline_ctrial: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [280, 360], [0, 1], clamp01);
  if (fade <= 0) return null;
  const off = -((frame * 3) % 40);
  return (
    <g opacity={fade}>
      <line x1={180} y1={1120} x2={2380} y2={1120} stroke={CYAN} strokeWidth={6}
        strokeDasharray="24 16" strokeDashoffset={off} opacity={0.55} />
      {[760, 1460, 2140].map((xx) => (
        <line key={xx} x1={xx} y1={1120} x2={xx} y2={1180} stroke={CYAN} strokeWidth={6}
          strokeDasharray="16 12" strokeDashoffset={off} opacity={0.55} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Station 4: study-visit calendar dots fill (bottom-left)
// ---------------------------------------------------------------------------
const VisitCalendar_ctrial: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 380, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={180} y={1180} width={1120} height={520} rx={30} fill={PANEL} stroke={HAIRLINE} strokeWidth={3} />
      <text x={240} y={1262} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        STUDY VISITS
      </text>
      <text x={240} y={1310} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        12 SCHEDULED · <tspan fill={CYAN}>{Math.min(12, Math.max(0, Math.floor((frame - 420) / 10)))}</tspan> COMPLETED
      </text>
      {Array.from({length: 12}, (_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const dx = 360 + col * 220;
        const dy = 1420 + row * 92;
        const done = frame >= 420 + i * 10;
        const pulse = done ? 0.85 + 0.15 * Math.sin(frame * 0.1 + i) : 1;
        return (
          <g key={i}>
            <circle cx={dx} cy={dy} r={30} fill={done ? CYAN : 'rgba(240,249,255,0.08)'}
              stroke={done ? CYAN : FAINT} strokeWidth={4} opacity={done ? pulse : 1} />
            {done && (
              <path d={`M ${dx - 13} ${dy} l 10 10 l 20 -24`} fill="none" stroke={BG} strokeWidth={8}
                strokeLinecap="round" strokeLinejoin="round" />
            )}
            <text x={dx + 48} y={dy + 10} fill={done ? INK : MUTED} fontSize={28} fontFamily={MONO}>
              V{i + 1}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Station 5: lab vials fill (bottom-center)
// ---------------------------------------------------------------------------
const LabVials_ctrial: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 500, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const labels = ['A', 'B', 'C', 'D'];
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={1380} y={1180} width={820} height={520} rx={30} fill={PANEL} stroke={HAIRLINE} strokeWidth={3} />
      <text x={1440} y={1262} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        LAB SAMPLES
      </text>
      <text x={1440} y={1310} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        BIOMARKERS · DRAWN PER VISIT
      </text>
      {labels.map((lb, i) => {
        const vx = 1540 + i * 175;
        const fill = interpolate(frame, [540 + i * 30, 640 + i * 30], [0, 1], clamp01);
        const h = 200 * fill;
        return (
          <g key={lb}>
            <rect x={vx} y={1360} width={110} height={220} rx={18} fill="rgba(240,249,255,0.05)" stroke={CYAN} strokeWidth={4} />
            <rect x={vx + 8} y={1360 + 220 - h} width={94} height={h} rx={12} fill={CYAN} opacity={0.75} />
            <rect x={vx + 30} y={1330} width={50} height={36} rx={10} fill={FAINT} />
            <text x={vx + 55} y={1640} fill={INK} fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              {lb}
            </text>
            <text x={vx + 55} y={1380 - 50} fill={CYAN} fontSize={26} fontFamily={MONO} textAnchor="middle">
              {Math.floor(fill * 100)}%
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Station 6: data streams flow into the shield emblem (bottom-right)
// ---------------------------------------------------------------------------
const DataShield_ctrial: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 620, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const off = -((frame * 4) % 46);
  const sx = 2790;
  const sealed = frame >= 760;
  const sealS = spring({frame: frame - 760, fps, config: {damping: 170, stiffness: 120}});
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={2280} y={1180} width={1020} height={520} rx={30} fill={PANEL} stroke={HAIRLINE} strokeWidth={3} />
      <text x={2340} y={1262} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        DATA VAULT
      </text>
      <text x={2340} y={1310} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        ENCRYPTED · AES-256 · AUDITED
      </text>
      {/* streams flowing in */}
      {[
        'M 2340 1420 C 2480 1420, 2520 1400, 2640 1400',
        'M 2340 1480 C 2500 1480, 2540 1480, 2640 1480',
        'M 2340 1540 C 2480 1540, 2520 1560, 2640 1560',
      ].map((d, i) => (
        <path key={i} d={d} fill="none" stroke={CYAN} strokeWidth={7}
          strokeDasharray="30 16" strokeDashoffset={off - i * 15} opacity={0.8}
          style={{filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.6))'}} />
      ))}
      {/* shield */}
      <g>
        <path d={`M ${sx} 1300 L ${sx + 170} 1350 L ${sx + 170} 1480 C ${sx + 170} 1560, ${sx + 90} 1610, ${sx} 1640 C ${sx - 90} 1610, ${sx - 170} 1560, ${sx - 170} 1480 L ${sx - 170} 1350 Z`}
          fill="rgba(34,211,238,0.08)" stroke={CYAN} strokeWidth={10} />
        {sealed && sealS > 0.001 && (
          <g opacity={Math.min(1, sealS)} transform={`translate(${sx},1470) scale(${Math.min(1, sealS)})`}>
            <path d="M -52 0 l 36 36 l 72 -84" fill="none" stroke={GREEN} strokeWidth={22}
              strokeLinecap="round" strokeLinejoin="round"
              style={{filter: 'drop-shadow(0 0 14px rgba(52,211,153,0.7))'}} />
          </g>
        )}
      </g>
      <text x={sx} y={1680} fill={MUTED} fontSize={26} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
        {sealed ? '✓ SECURE · DE-IDENTIFIED' : 'INGESTING…'}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Station 7: the WITHDRAW ANYTIME door swings open — trust payoff
// ---------------------------------------------------------------------------
const WithdrawDoor_ctrial: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 740, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const open = interpolate(frame, [790, 870], [1, 0.12], clamp01);
  const dx = 2800; // door center x
  const glow = 0.5 + 0.3 * Math.sin(frame * 0.09);
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={2460} y={380} width={680} height={700} rx={30} fill={PANEL} stroke={GREEN} strokeWidth={4} />
      <text x={2520} y={452} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        YOUR RIGHTS
      </text>
      {/* revealed message behind the door */}
      <g opacity={1 - open}>
        <rect x={2540} y={520} width={520} height={440} rx={20} fill="rgba(52,211,153,0.10)" />
        <text x={2800} y={640} fill={GREEN} fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          YOU CAN LEAVE
        </text>
        <text x={2800} y={700} fill={GREEN} fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          ANYTIME
        </text>
        <text x={2800} y={770} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
          NO QUESTIONS ASKED
        </text>
        <text x={2800} y={820} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
          CARE CONTINUES REGARDLESS
        </text>
        <rect x={2540} y={520} width={520} height={440} rx={20} fill="none" stroke={GREEN} strokeWidth={4} opacity={0.4 + glow * 0.6} />
      </g>
      {/* the door itself */}
      <g transform={`translate(${dx},0) scale(${open},1) translate(${-dx},0)`}>
        <rect x={2540} y={520} width={520} height={440} rx={20} fill="#0B1626" stroke={FAINT} strokeWidth={5} />
        <text x={2800} y={700} fill={MUTED} fontSize={64} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={8}>
          EXIT
        </text>
        <text x={2800} y={770} fill={FAINT} fontSize={30} fontFamily={MONO} textAnchor="middle" letterSpacing={3}>
          PUSH TO OPEN →
        </text>
        <circle cx={3010} cy={740} r={16} fill={GREEN} />
      </g>
      <text x={2800} y={1040} fill={FAINT} fontSize={26} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
        CONSENT IS ONGOING — NEVER A TRAP
      </text>
    </g>
  );
};

const Payoff_ctrial: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 850, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin((frame - 850) * 0.1);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 120, display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        borderRadius: 30, padding: '34px 110px', background: 'rgba(6,14,24,0.95)',
        border: `3px solid ${CYAN}`, textAlign: 'center',
        boxShadow: `0 0 ${50 + pulse * 50}px rgba(34,211,238,0.35)`,
      }}>
        <div style={{color: CYAN, fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 1}}>
          TRUST IS THE PROTOCOL
        </div>
        <div style={{color: INK, fontFamily: MONO, fontSize: 36, marginTop: 10}}>
          Screened · Informed · Monitored — <span style={{color: GREEN}}>withdraw anytime</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const ClinicalTrialEnrollmentFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_ctrial frame={frame} />
      <AmbientParticles_ctrial frame={frame} />
      <Title_ctrial frame={frame} fps={fps} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Pipeline_ctrial frame={frame} />
        <PatientCard_ctrial frame={frame} fps={fps} />
        <Eligibility_ctrial frame={frame} fps={fps} />
        <ConsentDoc_ctrial frame={frame} fps={fps} />
        <VisitCalendar_ctrial frame={frame} fps={fps} />
        <LabVials_ctrial frame={frame} fps={fps} />
        <DataShield_ctrial frame={frame} fps={fps} />
        <WithdrawDoor_ctrial frame={frame} fps={fps} />
      </svg>
      <Payoff_ctrial frame={frame} fps={fps} />
      <TickerTape_ctrial frame={frame} />
      <CornerHud_ctrial frame={frame} />
      <FineDither_ctrial frame={frame} />
      <FilmGrain_ctrial frame={frame} />
    </AbsoluteFill>
  );
};
