/**
 * NIS2IncidentReporting.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * "NIS2 Incident Reporting Deadline Dashboard" - visualizes the mandatory
 * NIS2 notification cascade (24h early warning -> 72h notification ->
 * 1-month final report) with countdown rings, typed form fields,
 * a checklist that flips to submitted states, and a banner that resolves
 * from red alert to green "REPORTING COMPLETE".
 *
 * Register in Root.tsx:
 *   <Composition id="NIS2IncidentReporting" component={NIS2IncidentReporting}
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
// Palette / typography
// ---------------------------------------------------------------------------
const BG = '#070B14';
const RED = '#F87171';
const AMBER = '#FBBF24';
const CYAN = '#22D3EE';
const GREEN = '#34D399';
const INK = '#EAF0FA';
const MUTED = 'rgba(160,180,210,0.62)';
const FAINT = 'rgba(160,180,210,0.38)';
const HAIR = 'rgba(148,163,184,0.16)';
const CARD_BG = 'rgba(13,20,36,0.72)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) - 900 frames total
// ---------------------------------------------------------------------------
const TIMER_START = 20; // banner elapsed timer starts counting
const TIMER_FREEZE = 700; // story time freezes at payoff
const FLIP_FRAME = 770; // banner flips to green "REPORTING COMPLETE"
const RESOLVE_START = 780;

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------
interface StageField {
  label: string;
  value: string;
}
interface Stage {
  id: string;
  deadlineLabel: string;
  accent: string;
  activate: number;
  submit: number;
  totalHours: number;
  fields: StageField[];
}

const STAGES: Stage[] = [
  {
    id: '24h',
    deadlineLabel: '24H — EARLY WARNING',
    accent: RED,
    activate: 150,
    submit: 380,
    totalHours: 24,
    fields: [
      {label: 'AFFECTED SYSTEMS', value: 'payments / scada gateway / vpn edge'},
      {label: 'INITIAL ASSESSMENT', value: 'ransomware suspected — contained'},
    ],
  },
  {
    id: '72h',
    deadlineLabel: '72H — INCIDENT NOTIFICATION',
    accent: AMBER,
    activate: 400,
    submit: 590,
    totalHours: 72,
    fields: [
      {label: 'INDICATORS OF COMPROMISE', value: '41 hashes + 3 hosts shared with csirt'},
      {label: 'MITIGATION STEPS', value: 'creds rotated / edr deployed / restored'},
    ],
  },
  {
    id: '1mo',
    deadlineLabel: '1-MONTH — FINAL REPORT',
    accent: CYAN,
    activate: 600,
    submit: 770,
    totalHours: 720,
    fields: [
      {label: 'ROOT CAUSE', value: 'unpatched edge device — patch applied'},
      {label: 'CROSS-BORDER IMPACT', value: '2 member states notified — no outage'},
      {label: 'LESSONS LEARNED', value: 'playbooks updated — retraining booked'},
    ],
  },
];

interface CheckItem {
  label: string;
  tag: string;
  completeAt: number;
}
const CHECKS: CheckItem[] = [
  {label: 'early warning', tag: '24H', completeAt: 380},
  {label: 'incident notification', tag: '72H', completeAt: 590},
  {label: 'final report', tag: '1 MONTH', completeAt: 770},
  {label: 'CSIRT notified', tag: 'ART. 23', completeAt: 390},
  {label: 'supply-chain partners informed', tag: 'ART. 21', completeAt: 800},
];

// ---------------------------------------------------------------------------
// Deterministic pseudo-random (never Math.random)
// ---------------------------------------------------------------------------
function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

// ---------------------------------------------------------------------------
// Static SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stopColor="rgba(248,113,113,0.12)" />
      <stop offset="55%" stopColor="rgba(248,113,113,0.035)" />
      <stop offset="100%" stopColor="rgba(7,11,20,0)" />
    </radialGradient>
    <radialGradient id="greenGlow" cx="50%" cy="34%" r="75%">
      <stop offset="0%" stopColor="rgba(52,211,153,0.14)" />
      <stop offset="55%" stopColor="rgba(52,211,153,0.04)" />
      <stop offset="100%" stopColor="rgba(7,11,20,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="58%" stopColor="rgba(7,11,20,0)" />
      <stop offset="100%" stopColor="rgba(1,2,5,0.78)" />
    </radialGradient>
    <linearGradient id="redSweep" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(248,113,113,0)" />
      <stop offset="50%" stopColor="rgba(248,113,113,0.05)" />
      <stop offset="100%" stopColor="rgba(248,113,113,0)" />
    </linearGradient>
    <linearGradient id="cardEdge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="rgba(148,163,184,0.35)" />
      <stop offset="100%" stopColor="rgba(148,163,184,0.08)" />
    </linearGradient>
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
// Background: dark base + glow (red -> green on resolve) + vignette + scan
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 320)) % (2160 + 320) - 160;
  const greenMix = interpolate(frame, [RESOLVE_START, 880], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const breathe = 0.85 + 0.15 * Math.sin(frame * 0.02);
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0}}
      >
        <Defs />
        <g opacity={(1 - greenMix) * breathe}>
          <rect x={0} y={0} width={3840} height={2160} fill="url(#bgGlow)" />
        </g>
        <g opacity={greenMix}>
          <rect x={0} y={0} width={3840} height={2160} fill="url(#greenGlow)" />
        </g>
        {/* slow scan sweep */}
        <rect
          x={0}
          y={scanY - 110}
          width={3840}
          height={220}
          fill="url(#redSweep)"
        />
        {/* faint column separators */}
        <line x1={1240} y1={540} x2={1240} y2={1660} stroke={HAIR} strokeWidth={1.5} />
        <line x1={2620} y1={540} x2={2620} y2={1660} stroke={HAIR} strokeWidth={1.5} />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Top alert banner: red pulse + elapsed timer, flips green at FLIP_FRAME
// ---------------------------------------------------------------------------
const Banner: React.FC<{frame: number}> = ({frame}) => {
  const drop = spring({
    frame,
    fps: 60,
    config: {damping: 200, stiffness: 90},
  });
  const elapsedSecs = interpolate(
    frame,
    [TIMER_START, TIMER_FREEZE],
    [0, 48 * 3600 - 60],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const eh = Math.floor(elapsedSecs / 3600);
  const em = Math.floor((elapsedSecs % 3600) / 60);
  const timerStr = `T+${pad2(eh)}:${pad2(em)}`;

  const flipped = frame >= FLIP_FRAME;
  const flipMix = interpolate(frame, [FLIP_FRAME - 12, FLIP_FRAME + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulse = 0.45 + 0.55 * Math.abs(Math.sin(frame * 0.12));

  const bannerColor = flipped ? GREEN : RED;
  const text = flipped ? 'REPORTING COMPLETE' : 'SECURITY INCIDENT DETECTED';

  return (
    <div
      style={{
        position: 'absolute',
        top: -80 + drop * 80,
        left: 0,
        width: 3840,
        height: 80,
        background: flipped
          ? 'rgba(52,211,153,0.10)'
          : 'rgba(248,113,113,0.10)',
        borderBottom: `2px solid ${bannerColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 80px',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: bannerColor,
            opacity: flipped ? 1 : pulse,
            boxShadow: `0 0 26px ${bannerColor}`,
          }}
        />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: 4,
            color: bannerColor,
            textShadow: `0 0 24px ${bannerColor}${flipMix > 0.5 ? '66' : '88'}`,
          }}
        >
          {text}
        </span>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 28,
            letterSpacing: 3,
            color: FAINT,
          }}
        >
          {flipped ? 'INCIDENT CLOSED' : 'INCIDENT OPEN'}
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: 2,
            color: INK,
            textShadow: '0 0 22px rgba(234,240,250,0.35)',
          }}
        >
          {timerStr}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Title block under the banner
// ---------------------------------------------------------------------------
const TitleBlock: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [60, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [60, 120], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 170 + rise,
        left: 160,
        right: 160,
        opacity: fade,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 76,
            letterSpacing: -1,
            color: INK,
            textShadow: '0 0 30px rgba(34,211,238,0.18)',
          }}
        >
          NIS2 INCIDENT REPORTING
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 32,
            color: MUTED,
            marginTop: 10,
          }}
        >
          essential &amp; important entities — mandatory notification cascade
        </div>
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 30,
          color: FAINT,
          letterSpacing: 2,
          paddingBottom: 8,
        }}
      >
        INCIDENT ID: <span style={{color: INK}}>INC-2026-0917</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section label above each column
// ---------------------------------------------------------------------------
const SectionLabel: React.FC<{frame: number; x: number; text: string}> = ({
  frame,
  x,
  text,
}) => {
  const fade = interpolate(frame, [100, 160], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 496,
        left: x,
        fontFamily: MONO,
        fontSize: 28,
        letterSpacing: 6,
        color: MUTED,
        opacity: fade,
      }}
    >
      {text}
    </div>
  );
};

// ---------------------------------------------------------------------------
// LEFT: entity classification card + audit status card
// ---------------------------------------------------------------------------
const EntityCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - 100,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;

  // seeded "activity ticks" along the bottom of the card
  const rand = seededRand(20260917);
  const ticks = Array.from({length: 44}, (_, i) => ({
    h: 14 + rand() * 44,
    on: rand() > 0.45,
  }));

  const rows: [string, string][] = [
    ['sector', 'energy'],
    ['employees', '1,240'],
    ['cross-border', 'yes'],
    ['jurisdiction', 'DE'],
  ];

  return (
    <div
      style={{
        position: 'absolute',
        left: 160,
        top: 560,
        width: 990,
        height: 600,
        borderRadius: 26,
        background: CARD_BG,
        border: '1.5px solid',
        borderColor: 'rgba(34,211,238,0.28)',
        padding: '44px 52px',
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 50}px)`,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 28,
          letterSpacing: 5,
          color: MUTED,
        }}
      >
        ENTITY CLASSIFICATION
      </div>
      {/* toggle */}
      <div style={{display: 'flex', gap: 24, marginTop: 34}}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 3,
            color: CYAN,
            border: `2px solid ${CYAN}`,
            borderRadius: 12,
            padding: '14px 34px',
            boxShadow: `0 0 30px ${CYAN}55`,
          }}
        >
          ESSENTIAL
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 34,
            fontWeight: 400,
            letterSpacing: 3,
            color: 'rgba(160,180,210,0.28)',
            border: '2px solid rgba(160,180,210,0.18)',
            borderRadius: 12,
            padding: '14px 34px',
          }}
        >
          IMPORTANT
        </div>
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 38,
          fontWeight: 700,
          color: INK,
          marginTop: 30,
        }}
      >
        ENERGY OPERATOR{' '}
        <span style={{color: MUTED, fontWeight: 400}}>— classified: ESSENTIAL</span>
      </div>
      {/* detail rows */}
      <div style={{marginTop: 26}}>
        {rows.map(([k, v], i) => (
          <div
            key={k}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '13px 4px',
              borderBottom: i < rows.length - 1 ? `1px solid ${HAIR}` : 'none',
            }}
          >
            <span style={{fontFamily: MONO, fontSize: 30, color: FAINT}}>{k}</span>
            <span style={{fontFamily: MONO, fontSize: 32, color: INK, fontWeight: 700}}>
              {v}
            </span>
          </div>
        ))}
      </div>
      {/* seeded activity ticks */}
      <div style={{display: 'flex', gap: 12, marginTop: 26, alignItems: 'flex-end'}}>
        {ticks.map((t, i) => {
          const live = 0.5 + 0.5 * Math.sin(frame * 0.08 + i * 0.7);
          return (
            <div
              key={i}
              style={{
                width: 8,
                height: t.h * (t.on ? 0.6 + 0.4 * live : 0.35),
                backgroundColor: t.on ? CYAN : 'rgba(148,163,184,0.2)',
                opacity: t.on ? 0.75 : 0.5,
                borderRadius: 4,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const AuditCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - 140,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;
  const prog = interpolate(frame, [160, 460], [0, 0.68], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pct = Math.round(prog * 100);

  return (
    <div
      style={{
        position: 'absolute',
        left: 160,
        top: 1200,
        width: 990,
        height: 420,
        borderRadius: 26,
        background: CARD_BG,
        border: '1.5px solid rgba(148,163,184,0.22)',
        padding: '44px 52px',
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 50}px)`,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 28,
          letterSpacing: 5,
          color: MUTED,
        }}
      >
        AUDIT STATUS
      </div>
      <div style={{fontFamily: FONT, fontSize: 36, color: INK, marginTop: 28}}>
        national NIS2 audits binding —{' '}
        <span style={{color: AMBER, fontWeight: 700}}>OCT 2026</span>
      </div>
      <div style={{marginTop: 44}}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <span style={{fontFamily: MONO, fontSize: 28, color: FAINT, letterSpacing: 2}}>
            COMPLIANCE READINESS
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 54,
              fontWeight: 800,
              color: AMBER,
              textShadow: '0 0 24px rgba(251,191,36,0.4)',
            }}
          >
            {pct}%
          </span>
        </div>
        <div
          style={{
            marginTop: 20,
            height: 18,
            borderRadius: 9,
            background: 'rgba(148,163,184,0.12)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${prog * 100}%`,
              height: '100%',
              borderRadius: 9,
              background: 'linear-gradient(90deg, #B45309, #FBBF24)',
              boxShadow: '0 0 18px rgba(251,191,36,0.55)',
            }}
          />
        </div>
      </div>
      <div style={{fontFamily: MONO, fontSize: 26, color: FAINT, marginTop: 26}}>
        next supervisory review: 42 days
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// CENTER: a single stage card with countdown ring, typed fields, status chip
// ---------------------------------------------------------------------------
interface StageCardProps {
  frame: number;
  fps: number;
  stage: Stage;
  index: number;
  y: number;
}

const StageCard: React.FC<StageCardProps> = ({frame, fps, stage, index, y}) => {
  const enter = spring({
    frame: frame - (110 + index * 30),
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (enter <= 0.001) return null;

  const isActive = frame >= stage.activate;
  const activeMix = interpolate(
    frame,
    [stage.activate - 10, stage.activate + 40],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const submitted = frame >= stage.submit;
  const opacity = 0.35 + 0.65 * activeMix;

  // countdown ring
  const ringProg = interpolate(
    frame,
    [stage.activate, stage.submit],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const remSecs = stage.totalHours * 3600 * (1 - ringProg);
  const rh = Math.floor(remSecs / 3600);
  const rm = Math.floor((remSecs % 3600) / 60);
  const rs = Math.floor(remSecs % 60);
  const countdownStr = submitted
    ? 'T-00:00:00'
    : `T-${pad2(rh)}:${pad2(rm)}:${pad2(rs)}`;

  const R = 86;
  const CIRC = 2 * Math.PI * R;
  const ringColor = submitted ? GREEN : stage.accent;

  // status chip pop
  const chipS = spring({
    frame: frame - stage.submit,
    fps,
    config: {damping: 200, stiffness: 90},
  });

  const fieldYs =
    stage.fields.length === 2 ? [128, 228] : [104, 192, 280];

  return (
    <div
      style={{
        position: 'absolute',
        left: 1280,
        top: y,
        width: 1280,
        height: 330,
        borderRadius: 26,
        background: CARD_BG,
        border: '1.5px solid',
        borderColor: submitted
          ? 'rgba(52,211,153,0.45)'
          : `rgba(148,163,184,0.22)`,
        opacity: Math.min(1, opacity * Math.min(1, enter)),
        transform: `translateY(${(1 - enter) * 50}px)`,
        boxShadow: submitted
          ? '0 0 44px rgba(52,211,153,0.14)'
          : 'none',
      }}
    >
      {/* header */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          left: 52,
          right: 52,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 5,
            color: submitted ? GREEN : isActive ? ringColor : MUTED,
            textShadow: isActive
              ? `0 0 18px ${ringColor}66`
              : 'none',
          }}
        >
          {stage.deadlineLabel}
        </span>
        <span style={{fontFamily: MONO, fontSize: 26, color: FAINT}}>
          STAGE {index + 1}/3
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 84,
          left: 52,
          right: 52,
          height: 1.5,
          background: HAIR,
        }}
      />

      {/* countdown ring */}
      <svg
        width={300}
        height={246}
        style={{position: 'absolute', top: 84, left: 30}}
      >
        <circle cx={150} cy={128} r={R} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth={14} />
        {/* 24 tick marks */}
        {Array.from({length: 24}, (_, i) => {
          const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
          const x1 = 150 + (R - 20) * Math.cos(a);
          const y1 = 128 + (R - 20) * Math.sin(a);
          const x2 = 150 + (R - 12) * Math.cos(a);
          const y2 = 128 + (R - 12) * Math.sin(a);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(148,163,184,0.4)"
              strokeWidth={3}
            />
          );
        })}
        <circle
          cx={150}
          cy={128}
          r={R}
          fill="none"
          stroke={ringColor}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * ringProg}
          transform="rotate(-90 150 128)"
          style={{filter: `drop-shadow(0 0 12px ${ringColor}99)`}}
        />
        <text
          x={150}
          y={136}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize={34}
          fontWeight={800}
          fill={ringColor}
        >
          {submitted ? '✓' : `${Math.round((1 - ringProg) * 100)}%`}
        </text>
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 292,
          left: 52,
          width: 256,
          textAlign: 'center',
          fontFamily: MONO,
          fontSize: 26,
          color: isActive ? ringColor : FAINT,
          fontWeight: 700,
        }}
      >
        {submitted ? 'DEADLINE MET' : 'TIME TO DEADLINE'}
      </div>

      {/* countdown readout */}
      <div
        style={{
          position: 'absolute',
          top: 108,
          left: 340,
          fontFamily: MONO,
          fontSize: 52,
          fontWeight: 800,
          color: submitted ? GREEN : ringColor,
          textShadow: `0 0 26px ${ringColor}66`,
        }}
      >
        {countdownStr}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 172,
          left: 342,
          fontFamily: MONO,
          fontSize: 24,
          letterSpacing: 3,
          color: FAINT,
        }}
      >
        remaining
      </div>

      {/* typed fields */}
      {stage.fields.map((f, k) => {
        const typeStart = stage.activate + 40 + k * 100;
        const charCount = Math.floor(
          interpolate(frame, [typeStart, typeStart + 110], [0, f.value.length], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        );
        const typing = frame >= typeStart && frame < typeStart + 110 && !submitted;
        const blink = Math.floor(frame / 20) % 2 === 0;
        return (
          <div key={f.label} style={{position: 'absolute', top: fieldYs[k] + 108, left: 340}}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 24,
                letterSpacing: 3,
                color: FAINT,
              }}
            >
              {f.label}
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 31,
                color: INK,
                marginTop: 8,
                minHeight: 42,
              }}
            >
              {f.value.slice(0, charCount)}
              {typing && blink && (
                <span style={{color: stage.accent}}>▌</span>
              )}
            </div>
          </div>
        );
      })}

      {/* status chip */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          right: 52,
        }}
      >
        {submitted ? (
          <div
            style={{
              fontFamily: MONO,
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: 2,
              color: '#04120B',
              background: GREEN,
              borderRadius: 14,
              padding: '16px 34px',
              boxShadow: `0 0 34px ${GREEN}88`,
              opacity: Math.min(1, chipS),
              transform: `scale(${0.7 + Math.min(1, chipS) * 0.3})`,
            }}
          >
            SUBMITTED ✓
          </div>
        ) : (
          <div
            style={{
              fontFamily: MONO,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 3,
              color: isActive ? AMBER : 'rgba(160,180,210,0.3)',
              border: `2px solid ${isActive ? AMBER : 'rgba(160,180,210,0.25)'}`,
              borderRadius: 14,
              padding: '14px 30px',
              opacity: 0.9,
            }}
          >
            {isActive ? 'DRAFTING' : 'PENDING'}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// RIGHT: reporting obligations checklist + penalties card
// ---------------------------------------------------------------------------
const Checklist: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - 130,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 2690,
        top: 560,
        width: 990,
        height: 690,
        borderRadius: 26,
        background: CARD_BG,
        border: '1.5px solid rgba(148,163,184,0.22)',
        padding: '44px 52px',
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 50}px)`,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 28,
          letterSpacing: 5,
          color: MUTED,
        }}
      >
        REPORTING OBLIGATIONS
      </div>
      <div style={{marginTop: 34}}>
        {CHECKS.map((c, i) => {
          const done = frame >= c.completeAt;
          const pop = spring({
            frame: frame - c.completeAt,
            fps,
            config: {damping: 200, stiffness: 90},
          });
          return (
            <div
              key={c.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                padding: '21px 4px',
                borderBottom: i < CHECKS.length - 1 ? `1px solid ${HAIR}` : 'none',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  border: `2px solid ${done ? GREEN : 'rgba(160,180,210,0.3)'}`,
                  background: done ? GREEN : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: MONO,
                  fontSize: 30,
                  fontWeight: 800,
                  color: '#04120B',
                  boxShadow: done ? `0 0 20px ${GREEN}88` : 'none',
                  transform: done ? `scale(${0.6 + Math.min(1, pop) * 0.4})` : 'none',
                }}
              >
                {done ? '✓' : ''}
              </div>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 32,
                  color: done ? GREEN : INK,
                  flex: 1,
                }}
              >
                {c.label}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 24,
                  letterSpacing: 2,
                  color: done ? GREEN : FAINT,
                  border: `1.5px solid ${done ? GREEN : 'rgba(160,180,210,0.25)'}`,
                  borderRadius: 8,
                  padding: '6px 14px',
                }}
              >
                {c.tag}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{fontFamily: MONO, fontSize: 26, color: FAINT, marginTop: 30}}>
        via national CSIRT — coordinated through ENISA
      </div>
    </div>
  );
};

const PenaltiesCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - 170,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 2690,
        top: 1290,
        width: 990,
        height: 330,
        borderRadius: 26,
        background: 'linear-gradient(160deg, rgba(248,113,113,0.12), rgba(248,113,113,0.02) 60%, rgba(255,255,255,0.015))',
        border: '1.5px solid rgba(248,113,113,0.4)',
        padding: '44px 52px',
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 50}px)`,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 28,
          letterSpacing: 5,
          color: 'rgba(248,113,113,0.85)',
        }}
      >
        PENALTIES
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 74,
          fontWeight: 800,
          color: RED,
          marginTop: 24,
          textShadow: '0 0 32px rgba(248,113,113,0.55)',
        }}
      >
        up to €10M
      </div>
      <div style={{fontFamily: FONT, fontSize: 32, color: INK, marginTop: 14}}>
        or <span style={{fontWeight: 700}}>2% of global turnover</span> — essential entities
      </div>
      <div style={{fontFamily: MONO, fontSize: 25, color: FAINT, marginTop: 18}}>
        Art. 34 NIS2 · enforced by national regulators
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Footer note
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [200, 300], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 52,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: 'rgba(148,163,184,0.55)',
        fontFamily: FONT,
        fontSize: 26,
        opacity: fade,
      }}
    >
      NIS2 Directive (EU) 2022/2555 &middot; significant incidents must be
      reported via national CSIRT.
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const NIS2IncidentReporting: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const cardYs = [560, 930, 1300];

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Banner frame={frame} />
      <TitleBlock frame={frame} />
      <SectionLabel frame={frame} x={160} text="ENTITY" />
      <SectionLabel frame={frame} x={1280} text="REPORTING CASCADE — 3 STAGES" />
      <SectionLabel frame={frame} x={2690} text="OBLIGATIONS" />
      <EntityCard frame={frame} fps={fps} />
      <AuditCard frame={frame} fps={fps} />
      {STAGES.map((stage, i) => (
        <StageCard
          key={stage.id}
          frame={frame}
          fps={fps}
          stage={stage}
          index={i}
          y={cardYs[i]}
        />
      ))}
      <Checklist frame={frame} fps={fps} />
      <PenaltiesCard frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default NIS2IncidentReporting;
