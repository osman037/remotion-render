/**
 * RemotePatientMonitoring.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * "Remote Patient Monitoring Dashboard" - a clinician vitals grid with a
 * threshold-breach + escalation story arc: SpO2 drifts below its 92%
 * threshold mid-scene, triggers a breach banner and clinician escalation,
 * then stabilizes back toward baseline.
 *
 * Register in Root.tsx:
 *   <Composition id="RemotePatientMonitoring" component={RemotePatientMonitoring}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
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
const BG = '#060B12';
const INK = '#EAF2F4';
const MUTED = 'rgba(176,198,208,0.62)';
const FAINT = 'rgba(176,198,208,0.34)';
const HAIRLINE = 'rgba(45,212,191,0.16)';
const TEAL = '#2DD4BF';
const CYAN = '#22D3EE';
const AMBER = '#FBBF24';
const RED = '#F87171';
const GREEN = '#34D399';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const INTRO_END = 120; // header + patient card settled
const BUILD_END = 600; // vitals build through breach
const ALERT_AT = 550; // SpO2 crosses threshold 92
const ESCALATE_AT = 600; // escalation badge
const RECOVER_AT = 650; // SpO2 starts recovering
const RESOLVE_AT = 780; // calm hold

// ---------------------------------------------------------------------------
// Deterministic seeded random (never Math.random)
// ---------------------------------------------------------------------------
function seededRand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------
// SpO2 narrative: 98 baseline -> drifts 98->91 (350-550) -> holds 91
// -> recovers 91->94 (650-780) -> gentle oscillation.
const spo2Raw = (frame: number): number => {
  const osc = (f: number) =>
    Math.sin(f * 0.11) * 0.4 + Math.sin(f * 0.031 + 1.7) * 0.3;
  if (frame < 350) return 98 + osc(frame) * 0.3;
  if (frame < 550) return 98 + (91 - 98) * ((frame - 350) / 200) + osc(frame) * 0.15;
  if (frame < 650) return 91 + osc(frame) * 0.1;
  if (frame < 780) return 91 + (94 - 91) * ((frame - 650) / 130) + osc(frame) * 0.15;
  return 94 + osc(frame) * 0.25;
};

// Heart rate compensates upward during the desaturation event.
const hrRaw = (frame: number): number => {
  const base = interpolate(
    frame,
    [0, 550, 650, 780, 900],
    [72, 72, 94, 78, 76],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  return base + Math.sin(frame * 0.045) * 1.4;
};

const sysRaw = (frame: number): number => 118 + Math.sin(frame * 0.02) * 2.2;
const diaRaw = (frame: number): number => 76 + Math.cos(frame * 0.023) * 1.6;
const rrRaw = (frame: number): number => 14 + Math.sin(frame * 0.03) * 1.1;

type AlertMode = 'normal' | 'breach' | 'watch' | 'calm';
const modeFor = (frame: number): AlertMode =>
  frame < ALERT_AT ? 'normal' : frame < RECOVER_AT ? 'breach' : frame < RESOLVE_AT ? 'watch' : 'calm';

// 24h blood-pressure trend: 12 seeded 2-hour buckets (module level, deterministic)
const bpRand = seededRand(20260926);
interface BpBucket {
  sys: number;
  dia: number;
}
const BP_BARS: BpBucket[] = Array.from({length: 12}, () => ({
  sys: 108 + bpRand() * 22,
  dia: 68 + bpRand() * 14,
}));

// ---------------------------------------------------------------------------
// ECG / pleth waveform shapes
// ---------------------------------------------------------------------------
const gauss = (x: number, c: number, w: number) =>
  Math.exp(-((x - c) * (x - c)) / (2 * w * w));

// One cardiac cycle over phase p in [0,1): P-QRS-T morphology.
const ecgPhase = (p: number): number =>
  gauss(p, 0.12, 0.02) * 0.18 -
  gauss(p, 0.2, 0.012) * 0.25 +
  gauss(p, 0.28, 0.014) * 1.0 -
  gauss(p, 0.36, 0.015) * 0.35 +
  gauss(p, 0.58, 0.035) * 0.3;

// Photoplethysmograph (SpO2) pulse shape.
const plethPhase = (p: number): number =>
  Math.pow(Math.max(0, Math.sin(p * Math.PI * 2)), 1.5) * 0.85 +
  Math.sin(p * Math.PI * 4 + 0.6) * 0.12;

// ---------------------------------------------------------------------------
// Static SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stopColor="rgba(45,212,191,0.10)" />
      <stop offset="50%" stopColor="rgba(34,211,238,0.035)" />
      <stop offset="100%" stopColor="rgba(6,11,18,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="58%" stopColor="rgba(6,11,18,0)" />
      <stop offset="100%" stopColor="rgba(1,3,6,0.72)" />
    </radialGradient>
    <linearGradient id="spo2Grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={TEAL} />
      <stop offset="100%" stopColor={CYAN} />
    </linearGradient>
    <linearGradient id="hrGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={TEAL} />
      <stop offset="100%" stopColor={CYAN} />
    </linearGradient>
    <linearGradient id="bpGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(45,212,191,0.9)" />
      <stop offset="100%" stopColor="rgba(45,212,191,0.15)" />
    </linearGradient>
    <linearGradient id="rrGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(45,212,191,0.35)" />
      <stop offset="100%" stopColor="rgba(45,212,191,0.02)" />
    </linearGradient>
    <linearGradient id="plethGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(34,211,238,0.5)" />
      <stop offset="100%" stopColor="rgba(34,211,238,0.02)" />
    </linearGradient>
    <pattern id="dotGrid" width="96" height="96" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="2" fill="rgba(45,212,191,0.05)" />
    </pattern>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: dark base + teal glow + vignette + dot grid + slow scan sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const scanY = (frame / 900) * 2600 - 220;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 28%, rgba(45,212,191,0.10), rgba(34,211,238,0.035) 48%, rgba(6,11,18,0) 75%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#dotGrid)" />
        <rect
          x={0}
          y={scanY - 110}
          width={3840}
          height={220}
          fill="rgba(45,212,191,0.035)"
        />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Small status chip
// ---------------------------------------------------------------------------
const Chip: React.FC<{text: string; color: string; glow: string}> = ({text, color, glow}) => (
  <div
    style={{
      border: `1.5px solid ${color}`,
      borderRadius: 999,
      padding: '10px 26px',
      color,
      fontFamily: MONO,
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: 3,
      background: 'rgba(6,11,18,0.55)',
      boxShadow: `0 0 18px ${glow}`,
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </div>
);

// ---------------------------------------------------------------------------
// Card shell (shared)
// ---------------------------------------------------------------------------
interface CardShellProps {
  x: number;
  y: number;
  w: number;
  h: number;
  frame: number;
  fps: number;
  start: number;
  borderColor: string;
  glowColor: string;
  children: React.ReactNode;
}
const CardShell: React.FC<CardShellProps> = ({
  x, y, w, h, frame, fps, start, borderColor, glowColor, children,
}) => {
  const s = spring({frame: frame - start, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + (1 - s) * 60,
        width: w,
        height: h,
        borderRadius: 28,
        background:
          'linear-gradient(165deg, rgba(45,212,191,0.07), rgba(45,212,191,0.015) 55%, rgba(255,255,255,0.015))',
        border: `1.5px solid ${borderColor}`,
        boxShadow: `0 0 34px ${glowColor}, 0 24px 60px rgba(0,0,0,0.45)`,
        opacity: Math.min(1, s),
        overflow: 'hidden',
      }}
    >
      {/* top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: w,
          height: 3,
          background: 'linear-gradient(90deg, rgba(45,212,191,0.7), rgba(34,211,238,0.25), rgba(45,212,191,0))',
        }}
      />
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Header: title + subtitle + divider
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 60], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lineFade = interpolate(frame, [60, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (fade <= 0) return null;
  return (
    <>
      <div style={{position: 'absolute', left: 160, top: 96 + rise, opacity: fade}}>
        <div
          style={{
            color: INK,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 84,
            letterSpacing: 1,
            textShadow: '0 0 40px rgba(45,212,191,0.25)',
          }}
        >
          REMOTE PATIENT MONITORING
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 34, marginTop: 16, letterSpacing: 1}}>
          continuous vitals &middot; threshold alerting &middot; post-discharge care
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 160,
          top: 400,
          width: 3520,
          height: 2,
          background: 'linear-gradient(90deg, rgba(45,212,191,0.4), rgba(45,212,191,0.08), rgba(45,212,191,0))',
          opacity: lineFade,
        }}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// Top-right patient card
// ---------------------------------------------------------------------------
const PatientCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 40, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const blink = frame % 60 < 36 ? 1 : 0.25;
  return (
    <div
      style={{
        position: 'absolute',
        right: 160,
        top: 96 + (1 - s) * 40,
        width: 900,
        borderRadius: 24,
        background: 'rgba(45,212,191,0.045)',
        border: '1.5px solid rgba(45,212,191,0.28)',
        boxShadow: '0 0 26px rgba(45,212,191,0.12)',
        padding: '34px 44px',
        opacity: Math.min(1, s),
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 48, letterSpacing: 2}}>
          PATIENT #4821
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              backgroundColor: GREEN,
              opacity: blink,
              boxShadow: '0 0 16px rgba(52,211,153,0.9)',
            }}
          />
          <div style={{color: GREEN, fontFamily: MONO, fontSize: 28, fontWeight: 700, letterSpacing: 2}}>
            LIVE
          </div>
        </div>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 12}}>
        post-discharge day 6 &middot; cardiac recovery pathway
      </div>
      <div style={{height: 1.5, background: HAIRLINE, margin: '22px 0'}} />
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            backgroundColor: GREEN,
            boxShadow: '0 0 14px rgba(52,211,153,0.9)',
          }}
        />
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 28}}>
          device: pulse oximeter + BP cuff &middot; <span style={{color: GREEN}}>connected</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Card 1: HEART RATE — big value + scrolling ECG sparkline + 60-100 band
// ---------------------------------------------------------------------------
const HRCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const hr = Math.round(hrRaw(frame));
  const mode = modeFor(frame);
  const chipColor = mode === 'breach' ? AMBER : GREEN;

  // ECG sparkline geometry (local SVG coords)
  const PW = 764;
  const PH = 170;
  const VMIN = 50;
  const VMAX = 110;
  const yFor = (v: number) => PH - ((v - VMIN) / (VMAX - VMIN)) * PH;
  const beatPx = 210;
  const scroll = frame * (beatPx / 50);
  const amp = mode === 'breach' ? 1.12 : 1.0;
  const midY = PH / 2 + 8;
  let d = '';
  for (let x = 0; x <= PW; x += 6) {
    const p = ((((x + scroll) % beatPx) + beatPx) % beatPx) / beatPx;
    const yy = midY - ecgPhase(p) * 118 * amp;
    d += `${x === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yy.toFixed(1)} `;
  }

  return (
    <CardShell
      x={160}
      y={480}
      w={860}
      h={560}
      frame={frame}
      fps={fps}
      start={80}
      borderColor="rgba(45,212,191,0.22)"
      glowColor="rgba(45,212,191,0.08)"
    >
      <div style={{position: 'absolute', left: 48, top: 40, right: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 5, fontWeight: 700}}>
          HEART RATE
        </div>
        <Chip text={mode === 'breach' ? 'ELEVATED' : 'WITHIN RANGE'} color={chipColor} glow={`${chipColor}33`} />
      </div>
      <div style={{position: 'absolute', left: 48, top: 118, display: 'flex', alignItems: 'baseline', gap: 18}}>
        <div
          style={{
            color: mode === 'breach' ? AMBER : INK,
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 150,
            lineHeight: 1,
            textShadow: `0 0 30px ${mode === 'breach' ? 'rgba(251,191,36,0.5)' : 'rgba(45,212,191,0.35)'}`,
          }}
        >
          {hr}
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 40}}>bpm</div>
      </div>
      <div style={{position: 'absolute', left: 48, top: 300, color: FAINT, fontFamily: FONT, fontSize: 27}}>
        range 60&ndash;100 bpm &middot; resting baseline 68
      </div>
      <svg
        width={PW}
        height={PH}
        style={{position: 'absolute', left: 48, top: 352}}
      >
        <Defs />
        <clipPath id="hrClip">
          <rect x={0} y={0} width={PW} height={PH} />
        </clipPath>
        {/* normal-range band 60-100 */}
        <rect x={0} y={yFor(100)} width={PW} height={yFor(60) - yFor(100)} fill="rgba(45,212,191,0.06)" />
        <line x1={0} y1={yFor(100)} x2={PW} y2={yFor(100)} stroke="rgba(45,212,191,0.35)" strokeWidth={1.5} strokeDasharray="8 8" />
        <line x1={0} y1={yFor(60)} x2={PW} y2={yFor(60)} stroke="rgba(45,212,191,0.35)" strokeWidth={1.5} strokeDasharray="8 8" />
        <text x={6} y={yFor(100) - 10} fill={FAINT} fontSize={22} fontFamily={MONO}>100</text>
        <text x={6} y={yFor(60) + 28} fill={FAINT} fontSize={22} fontFamily={MONO}>60</text>
        {/* sweep + glow trace */}
        <g clipPath="url(#hrClip)">
          <path d={d} fill="none" stroke="rgba(34,211,238,0.28)" strokeWidth={10} strokeLinecap="round" filter="url(#softGlow)" />
          <path d={d} fill="none" stroke="url(#hrGrad)" strokeWidth={5} strokeLinecap="round" />
        </g>
        <text x={PW - 8} y={PH - 8} fill={FAINT} fontSize={22} fontFamily={MONO} textAnchor="end">lead II &middot; live</text>
      </svg>
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Card 2: SpO2 — ring gauge + counter + pleth strip (the breach card)
// ---------------------------------------------------------------------------
const SpO2Card: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const spo2 = Math.round(spo2Raw(frame));
  const mode = modeFor(frame);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.3);

  const chipText = mode === 'breach' ? 'ALERT' : mode === 'watch' ? 'WATCH' : 'WITHIN RANGE';
  const chipColor = mode === 'breach' ? RED : mode === 'watch' ? AMBER : GREEN;
  const borderColor =
    mode === 'breach'
      ? `rgba(248,113,113,${0.55 + pulse * 0.4})`
      : mode === 'watch'
        ? 'rgba(251,191,36,0.55)'
        : 'rgba(45,212,191,0.22)';
  const glowColor =
    mode === 'breach'
      ? `rgba(248,113,113,${0.25 + pulse * 0.25})`
      : mode === 'watch'
        ? 'rgba(251,191,36,0.15)'
        : 'rgba(45,212,191,0.08)';
  const valueColor = mode === 'breach' ? RED : mode === 'watch' ? AMBER : CYAN;

  // Ring gauge
  const R = 140;
  const C = 2 * Math.PI * R;
  const rcx = 48 + 210;
  const rcy = 300;
  const frac = spo2 / 100;
  const ringStroke = mode === 'breach' ? RED : mode === 'watch' ? AMBER : 'url(#spo2Grad)';

  // Threshold marker at 92% of arc
  const mAng = ((-90 + 0.92 * 360) * Math.PI) / 180;
  const mCos = Math.cos(mAng);
  const mSin = Math.sin(mAng);

  // Pleth strip (flattens during breach)
  const PW = 764;
  const PH = 112;
  const pMid = PH / 2;
  const pAmp = (mode === 'breach' ? 34 : mode === 'watch' ? 52 : 68);
  const pScroll = frame * 0.055;
  let pd = '';
  for (let x = 0; x <= PW; x += 6) {
    const p = ((x / 170 + pScroll) % 1 + 1) % 1;
    const yy = pMid - plethPhase(p) * pAmp;
    pd += `${x === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yy.toFixed(1)} `;
  }
  const pArea = `${pd} L ${PW} ${PH} L 0 ${PH} Z`;

  return (
    <CardShell
      x={1140}
      y={480}
      w={860}
      h={560}
      frame={frame}
      fps={fps}
      start={130}
      borderColor={borderColor}
      glowColor={glowColor}
    >
      <div style={{position: 'absolute', left: 48, top: 40, right: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 5, fontWeight: 700}}>
          SpO2
        </div>
        <Chip text={chipText} color={chipColor} glow={`${chipColor}44`} />
      </div>

      {/* ring gauge */}
      <svg width={460} height={380} style={{position: 'absolute', left: 0, top: 110}}>
        <Defs />
        <circle cx={rcx} cy={rcy} r={R} fill="none" stroke="rgba(176,198,208,0.14)" strokeWidth={26} />
        <circle
          cx={rcx}
          cy={rcy}
          r={R}
          fill="none"
          stroke={ringStroke}
          strokeWidth={26}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - frac)}
          transform={`rotate(-90 ${rcx} ${rcy})`}
          filter="url(#softGlow)"
        />
        {/* threshold tick at 92% */}
        <line
          x1={rcx + (R - 20) * mCos}
          y1={rcy + (R - 20) * mSin}
          x2={rcx + (R + 20) * mCos}
          y2={rcy + (R + 20) * mSin}
          stroke={AMBER}
          strokeWidth={5}
        />
        <text
          x={rcx + (R + 58) * mCos}
          y={rcy + (R + 58) * mSin + 9}
          fill={AMBER}
          fontSize={26}
          fontFamily={MONO}
          fontWeight={700}
          textAnchor="middle"
        >
          92%
        </text>
      </svg>

      {/* big counter */}
      <div style={{position: 'absolute', left: 480, top: 150, display: 'flex', alignItems: 'baseline', gap: 14}}>
        <div
          style={{
            color: valueColor,
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 170,
            lineHeight: 1,
            textShadow: `0 0 34px ${valueColor}66`,
          }}
        >
          {spo2}
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 44}}>%</div>
      </div>
      <div style={{position: 'absolute', left: 480, top: 330, color: FAINT, fontFamily: FONT, fontSize: 27}}>
        threshold &ge; 92% &middot; probe: finger
      </div>

      {/* pleth waveform strip */}
      <svg width={PW} height={PH} style={{position: 'absolute', left: 48, top: 400}}>
        <Defs />
        <line x1={0} y1={pMid} x2={PW} y2={pMid} stroke="rgba(176,198,208,0.2)" strokeWidth={1.5} strokeDasharray="6 8" />
        <path d={pArea} fill="url(#plethGrad)" opacity={0.7} />
        <path d={pd} fill="none" stroke={mode === 'breach' ? RED : CYAN} strokeWidth={4} strokeLinecap="round" filter="url(#softGlow)" />
        <text x={PW - 8} y={20} fill={FAINT} fontSize={22} fontFamily={MONO} textAnchor="end">pleth &middot; live</text>
      </svg>
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Card 3: BLOOD PRESSURE — 118/76 + 24h trend bars + MAP
// ---------------------------------------------------------------------------
const BPCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const sys = Math.round(sysRaw(frame));
  const dia = Math.round(diaRaw(frame));
  const map = Math.round(dia + (sys - dia) / 3);

  const PW = 764;
  const PH = 150;
  const bw = PW / 12;
  const barW = 40;
  const hFor = (v: number) => 26 + ((v - 95) / (140 - 95)) * (PH - 40);

  return (
    <CardShell
      x={160}
      y={1100}
      w={860}
      h={560}
      frame={frame}
      fps={fps}
      start={180}
      borderColor="rgba(45,212,191,0.22)"
      glowColor="rgba(45,212,191,0.08)"
    >
      <div style={{position: 'absolute', left: 48, top: 40, right: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 5, fontWeight: 700}}>
          BLOOD PRESSURE
        </div>
        <Chip text="WITHIN RANGE" color={GREEN} glow="rgba(52,211,153,0.2)" />
      </div>
      <div style={{position: 'absolute', left: 48, top: 118, display: 'flex', alignItems: 'baseline', gap: 18}}>
        <div
          style={{
            color: INK,
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 140,
            lineHeight: 1,
            textShadow: '0 0 30px rgba(45,212,191,0.35)',
          }}
        >
          {sys}/{dia}
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 40}}>mmHg</div>
      </div>
      <div style={{position: 'absolute', left: 48, top: 300, color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 2}}>
        MAP <span style={{color: INK, fontWeight: 800}}>{map}</span>
        <span style={{color: FAINT, fontFamily: FONT, fontSize: 26, letterSpacing: 0}}> &nbsp;&middot;&nbsp; last reading 09:46</span>
      </div>

      <svg width={PW} height={PH + 60} style={{position: 'absolute', left: 48, top: 372}}>
        <Defs />
        <line x1={0} y1={PH} x2={PW} y2={PH} stroke="rgba(176,198,208,0.25)" strokeWidth={1.5} />
        {BP_BARS.map((b, i) => {
          const bx = i * bw + (bw - barW) / 2;
          const bh = hFor(b.sys);
          const isNow = i === BP_BARS.length - 1;
          return (
            <g key={i}>
              <rect
                x={bx}
                y={PH - bh}
                width={barW}
                height={bh}
                rx={8}
                fill={isNow ? 'url(#bpGrad)' : 'rgba(120,150,165,0.28)'}
                stroke={isNow ? TEAL : 'none'}
                strokeWidth={isNow ? 2 : 0}
                style={isNow ? {filter: 'drop-shadow(0 0 12px rgba(45,212,191,0.6))'} : undefined}
              />
              <text
                x={bx + barW / 2}
                y={PH - bh - 12}
                fill={isNow ? TEAL : FAINT}
                fontSize={22}
                fontFamily={MONO}
                textAnchor="middle"
                fontWeight={isNow ? 700 : 400}
              >
                {Math.round(b.sys)}
              </text>
            </g>
          );
        })}
        <text x={0} y={PH + 34} fill={FAINT} fontSize={22} fontFamily={MONO}>&minus;24h</text>
        <text x={PW} y={PH + 34} fill={TEAL} fontSize={22} fontFamily={MONO} textAnchor="end" fontWeight={700}>NOW</text>
        <text x={PW - 8} y={24} fill={FAINT} fontSize={22} fontFamily={MONO} textAnchor="end">systolic &middot; 2h buckets</text>
      </svg>
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Card 4: RESPIRATORY RATE — value + smooth waveform band
// ---------------------------------------------------------------------------
const RRCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const rr = Math.round(rrRaw(frame));

  const PW = 764;
  const PH = 150;
  const rMid = PH / 2;
  const scroll = frame * 0.05;
  const upper: string[] = [];
  const lower: string[] = [];
  for (let x = 0; x <= PW; x += 6) {
    const p = ((x / 260 + scroll) % 1 + 1) % 1;
    const env = 0.62 + 0.38 * Math.sin(p * Math.PI * 2);
    const wave = Math.sin(p * Math.PI * 2);
    const a = (26 + env * 22) * (0.85 + 0.15 * wave);
    upper.push(`${x === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${(rMid - a).toFixed(1)}`);
    lower.push(`L ${x.toFixed(1)} ${(rMid + a).toFixed(1)}`);
  }
  const bandPath = `${upper.join(' ')} ${lower.reverse().join(' ')} Z`;
  let centerD = '';
  for (let x = 0; x <= PW; x += 6) {
    const p = ((x / 260 + scroll) % 1 + 1) % 1;
    const yy = rMid - Math.sin(p * Math.PI * 2) * 30;
    centerD += `${x === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yy.toFixed(1)} `;
  }

  return (
    <CardShell
      x={1140}
      y={1100}
      w={860}
      h={560}
      frame={frame}
      fps={fps}
      start={230}
      borderColor="rgba(45,212,191,0.22)"
      glowColor="rgba(45,212,191,0.08)"
    >
      <div style={{position: 'absolute', left: 48, top: 40, right: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 5, fontWeight: 700}}>
          RESPIRATORY RATE
        </div>
        <Chip text="WITHIN RANGE" color={GREEN} glow="rgba(52,211,153,0.2)" />
      </div>
      <div style={{position: 'absolute', left: 48, top: 118, display: 'flex', alignItems: 'baseline', gap: 18}}>
        <div
          style={{
            color: INK,
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 150,
            lineHeight: 1,
            textShadow: '0 0 30px rgba(45,212,191,0.35)',
          }}
        >
          {rr}
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 40}}>/min</div>
      </div>
      <div style={{position: 'absolute', left: 48, top: 300, color: FAINT, fontFamily: FONT, fontSize: 27}}>
        range 10&ndash;24 /min &middot; nasal cannula flow 2 L/min
      </div>
      <svg width={PW} height={PH} style={{position: 'absolute', left: 48, top: 372}}>
        <Defs />
        <line x1={0} y1={rMid} x2={PW} y2={rMid} stroke="rgba(176,198,208,0.2)" strokeWidth={1.5} strokeDasharray="6 8" />
        <path d={bandPath} fill="url(#rrGrad)" />
        <path d={centerD} fill="none" stroke={TEAL} strokeWidth={4} strokeLinecap="round" filter="url(#softGlow)" />
        <text x={PW - 8} y={20} fill={FAINT} fontSize={22} fontFamily={MONO} textAnchor="end">capnography &middot; live</text>
        <text x={8} y={rMid - 46} fill={FAINT} fontSize={22} fontFamily={MONO}>24</text>
        <text x={8} y={rMid + 62} fill={FAINT} fontSize={22} fontFamily={MONO}>10</text>
      </svg>
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Alert banner: THRESHOLD BREACH -> STABILIZING
// ---------------------------------------------------------------------------
const AlertBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inS = spring({frame: frame - (ALERT_AT - 2), fps, config: {damping: 200, stiffness: 90}});
  const outF = interpolate(frame, [800, 865], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = Math.min(1, inS) * (1 - outF);
  if (op <= 0.001) return null;

  const mode = modeFor(frame);
  const breach = mode === 'breach';
  const mainColor = breach ? RED : AMBER;
  const title = breach ? 'THRESHOLD BREACH \u2014 SpO2 < 92%' : 'STABILIZING \u2014 monitoring';
  const sub = breach
    ? 'auto-escalation armed \u00B7 notifying on-call clinician'
    : 'SpO2 recovering \u00B7 escalation acknowledged';
  const slide = interpolate(inS, [0, 1], [46, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div
      style={{
        position: 'absolute',
        left: 160,
        top: 1720 + slide,
        width: 1840,
        height: 120,
        borderRadius: 20,
        background: breach
          ? 'linear-gradient(90deg, rgba(248,113,113,0.16), rgba(248,113,113,0.05))'
          : 'linear-gradient(90deg, rgba(251,191,36,0.14), rgba(251,191,36,0.04))',
        border: `2px solid ${mainColor}`,
        boxShadow: `0 0 40px ${mainColor}55`,
        opacity: op,
        display: 'flex',
        alignItems: 'center',
        padding: '0 44px',
        gap: 34,
      }}
    >
      {/* warning triangle */}
      <svg width={72} height={66}>
        <path d="M 36 4 L 68 60 L 4 60 Z" fill="none" stroke={mainColor} strokeWidth={5} strokeLinejoin="round" filter="url(#softGlow)" />
        <text x={36} y={52} fill={mainColor} fontSize={34} fontFamily={FONT} fontWeight={800} textAnchor="middle">!</text>
      </svg>
      <div>
        <div
          style={{
            color: mainColor,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 54,
            letterSpacing: 2,
            textShadow: `0 0 26px ${mainColor}66`,
          }}
        >
          {title}
        </div>
        <div style={{color: MUTED, fontFamily: FONT, fontSize: 29, marginTop: 6}}>{sub}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Escalation badge: ESCALATED -> ON-CALL CLINICIAN (pulsing outline)
// ---------------------------------------------------------------------------
const EscalationBadge: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - ESCALATE_AT, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const pulse = 0.45 + 0.35 * Math.sin(frame * 0.12);
  return (
    <div
      style={{
        position: 'absolute',
        left: 160,
        top: 1872 + (1 - s) * 40,
        width: 1840,
        height: 106,
        borderRadius: 20,
        background: 'rgba(248,113,113,0.07)',
        border: `2.5px solid rgba(248,113,113,${pulse + 0.25})`,
        boxShadow: `0 0 ${30 + pulse * 30}px rgba(248,113,113,${pulse})`,
        opacity: Math.min(1, s),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
      }}
    >
      <div style={{color: FAINT, fontFamily: MONO, fontSize: 34, fontWeight: 700}}>09:43</div>
      <div
        style={{
          color: RED,
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: 48,
          letterSpacing: 4,
          textShadow: '0 0 24px rgba(248,113,113,0.6)',
        }}
      >
        ESCALATED &rarr; ON-CALL CLINICIAN
      </div>
      <div style={{color: FAINT, fontFamily: MONO, fontSize: 30}}>ack pending</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Right panel: EVENT LOG + THRESHOLDS
// ---------------------------------------------------------------------------
interface LogRow {
  time: string;
  msg: string;
  color: string;
  at: number;
  bold?: boolean;
}
const LOG_ROWS: LogRow[] = [
  {time: '09:31', msg: 'all vitals within range \u2014 baseline confirmed', color: TEAL, at: 140},
  {time: '09:38', msg: 'SpO2 96% \u2014 dipping below baseline', color: AMBER, at: 430},
  {time: '09:41', msg: 'SpO2 94% \u2014 below baseline', color: AMBER, at: 500},
  {time: '09:43', msg: 'SpO2 91% \u2014 THRESHOLD BREACH', color: RED, at: 560, bold: true},
  {time: '09:43', msg: 'escalation \u2192 on-call clinician', color: RED, at: 612, bold: true},
  {time: '09:47', msg: 'SpO2 94% \u2014 stabilizing', color: TEAL, at: 705},
];

const THRESHOLDS: {name: string; val: string}[] = [
  {name: 'HEART RATE', val: '50\u2013120 bpm'},
  {name: 'SpO2', val: '\u2265 92%'},
  {name: 'BLOOD PRESSURE', val: '90\u2013140 / 60\u201390'},
  {name: 'RESP. RATE', val: '10\u201324 /min'},
  {name: 'MAP', val: '65\u2013110 mmHg'},
];

const EventLog: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const panelS = spring({frame: frame - 260, fps, config: {damping: 200, stiffness: 90}});
  if (panelS <= 0.001) return null;
  const blink = frame % 60 < 36 ? 1 : 0.3;
  const PX = 2120;
  const PW = 1560;

  return (
    <div
      style={{
        position: 'absolute',
        left: PX,
        top: 480 + (1 - panelS) * 60,
        width: PW,
        height: 1180,
        borderRadius: 28,
        background: 'linear-gradient(170deg, rgba(45,212,191,0.05), rgba(45,212,191,0.01) 60%, rgba(255,255,255,0.01))',
        border: `1.5px solid ${HAIRLINE}`,
        boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        opacity: Math.min(1, panelS),
        overflow: 'hidden',
      }}
    >
      {/* header */}
      <div style={{position: 'absolute', left: 48, top: 36, display: 'flex', alignItems: 'center', gap: 22}}>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            backgroundColor: TEAL,
            opacity: blink,
            boxShadow: '0 0 14px rgba(45,212,191,0.9)',
          }}
        />
        <div style={{color: INK, fontFamily: MONO, fontSize: 38, letterSpacing: 6, fontWeight: 700}}>
          EVENT LOG
        </div>
      </div>

      {/* rows */}
      {LOG_ROWS.map((row, i) => {
        const s = spring({frame: frame - row.at, fps, config: {damping: 200, stiffness: 90}});
        if (s <= 0.001) return null;
        const ry = 128 + i * 104;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 48,
              top: ry + (1 - s) * 30,
              width: PW - 96,
              opacity: Math.min(1, s),
              display: 'flex',
              alignItems: 'center',
              gap: 26,
            }}
          >
            <div style={{width: 6, height: 62, borderRadius: 3, backgroundColor: row.color, boxShadow: `0 0 12px ${row.color}88`, flexShrink: 0}} />
            <div style={{color: row.color, fontFamily: MONO, fontSize: 30, fontWeight: 700, width: 120, flexShrink: 0}}>
              {row.time}
            </div>
            <div
              style={{
                color: row.bold ? INK : MUTED,
                fontFamily: FONT,
                fontSize: 33,
                fontWeight: row.bold ? 700 : 400,
                textShadow: row.bold ? `0 0 16px ${row.color}55` : 'none',
              }}
            >
              {row.msg}
            </div>
          </div>
        );
      })}

      {/* divider */}
      <div style={{position: 'absolute', left: 48, top: 1258, width: PW - 96, height: 1.5, background: HAIRLINE}} />

      {/* thresholds */}
      <div style={{position: 'absolute', left: 48, top: 1296, color: INK, fontFamily: MONO, fontSize: 36, letterSpacing: 6, fontWeight: 700}}>
        THRESHOLDS
      </div>
      {THRESHOLDS.map((t, i) => {
        const s = spring({frame: frame - (300 + i * 26), fps, config: {damping: 200, stiffness: 90}});
        if (s <= 0.001) return null;
        return (
          <div
            key={t.name}
            style={{
              position: 'absolute',
              left: 48,
              top: 1368 + i * 58 + (1 - s) * 20,
              width: PW - 96,
              opacity: Math.min(1, s),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(45,212,191,0.10)',
              paddingBottom: 12,
            }}
          >
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 29, letterSpacing: 3}}>{t.name}</div>
            <div style={{color: INK, fontFamily: MONO, fontSize: 30, fontWeight: 700}}>{t.val}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Footer note
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [RESOLVE_AT, RESOLVE_AT + 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (fade <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 52,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: 'rgba(176,198,208,0.5)',
        fontFamily: FONT,
        fontSize: 26,
        opacity: fade,
        letterSpacing: 1,
      }}
    >
      Illustrative monitoring visualization &middot; not a medical device &middot; RPM market &asymp; $6.27B (2026).
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const RemotePatientMonitoring: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Header frame={frame} />
      <PatientCard frame={frame} fps={fps} />
      <HRCard frame={frame} fps={fps} />
      <SpO2Card frame={frame} fps={fps} />
      <BPCard frame={frame} fps={fps} />
      <RRCard frame={frame} fps={fps} />
      <AlertBanner frame={frame} fps={fps} />
      <EscalationBadge frame={frame} fps={fps} />
      <EventLog frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default RemotePatientMonitoring;
