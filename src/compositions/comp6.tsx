/**
 * MortgageApplicationJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A mortgage journey in deep navy + gold: house-search pins drop onto a
 * stylized map strip, application fields type in step by step with a progress
 * rail, a "PRE-APPROVED" stamp slams down, a document checklist verifies one
 * by one, and a key handover lands on the funding stage as a "FUNDED" payoff
 * glows across the map.
 *
 * Register in Root.tsx:
 *   <Composition id="MortgageApplicationJourney" component={MortgageApplicationJourney}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette - deep navy + gold
// ---------------------------------------------------------------------------
const BG = '#0A0F1E';
const PANEL = 'rgba(15,23,42,0.72)';
const INK = '#F2EFE6';
const MUTED = 'rgba(196,203,220,0.62)';
const GOLD = '#E8B84B';
const GOLD_BRIGHT = '#F6D47C';
const SLATE_PIN = '#8FA3BF';
const HAIRLINE = 'rgba(232,184,75,0.22)';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps, 900 = 15 s)
// ---------------------------------------------------------------------------
const PIN_START = 70;
const PIN_STAGGER = 26;
const FORM_START = 240;
const FIELD_STAGGER = 48;
const STAMP_AT = 520;
const DOCS_START = 600;
const DOC_STAGGER = 28;
const KEY_AT = 790;
const FUNDED_AT = 830;

// ---------------------------------------------------------------------------
// Deterministic pseudo-random helper
// ---------------------------------------------------------------------------
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const MAP = {left: 220, right: 3620, top: 400, bottom: 1000};

interface House {
  name: string;
  price: string;
  fx: number; // 0..1 across the map strip
}
const HOUSES: House[] = [
  {name: 'MAPLE GROVE', price: '$485K', fx: 0.1},
  {name: 'CEDAR RIDGE', price: '$512K', fx: 0.3},
  {name: 'OAK HOLLOW', price: '$468K', fx: 0.5},
  {name: 'WILLOW BEND', price: '$530K', fx: 0.7},
  {name: 'STONEBRIDGE', price: '$499K', fx: 0.9},
];

interface Field {
  label: string;
  value: string;
}
const FIELDS: Field[] = [
  {label: 'FULL NAME', value: 'DANIEL CARTER'},
  {label: 'GROSS ANNUAL INCOME', value: '$128,500'},
  {label: 'DOWN PAYMENT', value: '$97,000 · 20%'},
  {label: 'LOAN AMOUNT', value: '$388,000'},
  {label: 'RATE LOCKED', value: '6.125% · 30-YR FIXED'},
];

const DOCS: string[] = [
  'ID & ADDRESS PROOF',
  'PAY STUBS — 3 MONTHS',
  'TAX RETURNS — 2 YEARS',
  'BANK STATEMENTS',
  'APPRAISAL REPORT',
  'INSURANCE BINDER',
];

const STAGES = ['PROPERTY SEARCH', 'APPLICATION', 'APPROVAL', 'FUNDING'];
const STAGE_AT = [PIN_START, FORM_START, STAMP_AT, KEY_AT];

// ---------------------------------------------------------------------------
// Static defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="mjBgGlow" cx="50%" cy="30%" r="72%">
      <stop offset="0%" stopColor="rgba(232,184,75,0.10)" />
      <stop offset="55%" stopColor="rgba(232,184,75,0.03)" />
      <stop offset="100%" stopColor="rgba(10,15,30,0)" />
    </radialGradient>
    <radialGradient id="mjVignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stopColor="rgba(10,15,30,0)" />
      <stop offset="100%" stopColor="rgba(3,5,11,0.74)" />
    </radialGradient>
    <linearGradient id="mjGoldGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={GOLD} />
      <stop offset="100%" stopColor={GOLD_BRIGHT} />
    </linearGradient>
    <linearGradient id="mjPanelGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(232,184,75,0.07)" />
      <stop offset="100%" stopColor="rgba(15,23,42,0.10)" />
    </linearGradient>
    <filter id="mjGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="mjSoft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="8" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: layered gold glow, vignette, faint grid, diagonal sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sweepX = -900 + ((frame / 900) * (3840 + 1800));
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 28%, rgba(232,184,75,0.10), rgba(232,184,75,0.03) 45%, rgba(10,15,30,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <g opacity={fade * 0.5}>
          {Array.from({length: 33}, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * 120}
              y1={0}
              x2={i * 120}
              y2={2160}
              stroke="rgba(148,163,184,0.05)"
              strokeWidth={1.5}
            />
          ))}
          {Array.from({length: 19}, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * 120}
              x2={3840}
              y2={i * 120}
              stroke="rgba(148,163,184,0.05)"
              strokeWidth={1.5}
            />
          ))}
        </g>
        {/* diagonal light sweep */}
        <g transform={`translate(${sweepX}, 0) rotate(12)`} opacity={0.5}>
          <rect x={0} y={-600} width={260} height={3600} fill="rgba(232,184,75,0.028)" />
          <rect x={300} y={-600} width={60} height={3600} fill="rgba(232,184,75,0.05)" />
        </g>
        <rect x={0} y={0} width={3840} height={2160} fill="url(#mjVignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, 50], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'absolute', top: 84 + rise, left: 220, right: 220, opacity: fade}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 30}}>
        <span style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 82, letterSpacing: -1}}>
          MORTGAGE JOURNEY
        </span>
        <span
          style={{
            color: GOLD,
            fontFamily: MONO,
            fontSize: 36,
            fontWeight: 700,
            border: `2px solid ${GOLD}`,
            borderRadius: 10,
            padding: '6px 18px',
          }}
        >
          30-YR FIXED
        </span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 34, marginTop: 14}}>
        From first viewing to funded loan &middot; five homes shortlisted
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Map strip with dropping house pins
// ---------------------------------------------------------------------------
const MapStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const streets = useMemo(() => {
    const out: {x1: number; y1: number; x2: number; y2: number; w: number}[] = [];
    for (let i = 0; i < 6; i++) {
      const y = 480 + i * 78 + (rand(i + 7) - 0.5) * 26;
      out.push({x1: MAP.left + 40, y1: y, x2: MAP.right - 40, y2: y + (rand(i + 31) - 0.5) * 44, w: i % 2 === 0 ? 4 : 2});
    }
    for (let i = 0; i < 9; i++) {
      const x = MAP.left + 200 + i * 360 + (rand(i + 53) - 0.5) * 60;
      out.push({x1: x, y1: MAP.top + 60, x2: x + (rand(i + 71) - 0.5) * 90, y2: MAP.bottom - 90, w: 2});
    }
    return out;
  }, []);

  const stripIn = interpolate(frame, [30, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scanX = MAP.left + ((frame - 60) / 220) * (MAP.right - MAP.left);

  const pinX = (h: House) => MAP.left + h.fx * (MAP.right - MAP.left);
  const restY = 812; // pin tip lands just above the baseline at y=890

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={stripIn}>
        <rect
          x={MAP.left}
          y={MAP.top}
          width={MAP.right - MAP.left}
          height={MAP.bottom - MAP.top}
          rx={28}
          fill={PANEL}
          stroke={HAIRLINE}
          strokeWidth={2.5}
        />
        {/* streets */}
        <g opacity={0.8}>
          {streets.map((s, i) => (
            <line
              key={`st${i}`}
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke="rgba(148,163,184,0.13)"
              strokeWidth={s.w}
            />
          ))}
        </g>
        {/* baseline the pins rest on */}
        <line
          x1={MAP.left + 60}
          y1={890}
          x2={MAP.right - 60}
          y2={890}
          stroke="rgba(232,184,75,0.20)"
          strokeWidth={3}
        />
        {/* scanning sweep while pins drop */}
        {frame > 55 && frame < 300 && (
          <g>
            <rect
              x={scanX - 90}
              y={MAP.top}
              width={180}
              height={MAP.bottom - MAP.top}
              fill="rgba(232,184,75,0.045)"
            />
            <line
              x1={scanX}
              y1={MAP.top}
              x2={scanX}
              y2={MAP.bottom}
              stroke={GOLD}
              strokeWidth={3}
              opacity={0.55}
              style={{filter: 'drop-shadow(0 0 12px rgba(232,184,75,0.8))'}}
            />
          </g>
        )}
        <text
          x={MAP.left + 44}
          y={MAP.top + 66}
          fill={MUTED}
          fontSize={30}
          fontFamily={MONO}
          letterSpacing={6}
        >
          HOUSE SEARCH · 5 SHORTLISTED
        </text>
      </g>

      {/* pins */}
      {HOUSES.map((h, i) => {
        const s = spring({
          frame: frame - (PIN_START + i * PIN_STAGGER),
          fps,
          config: {damping: 11, stiffness: 120, mass: 1},
        });
        if (s <= 0.001) return null;
        const x = pinX(h);
        const y = 260 + (restY - 260) * s; // drops from above, bounces past rest
        const isSel = i === 0;
        const c = isSel ? GOLD : SLATE_PIN;
        const landed = interpolate(frame, [PIN_START + i * PIN_STAGGER + 55, PIN_START + i * PIN_STAGGER + 75], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <g key={`pin${i}`} opacity={Math.min(1, s)}>
            {/* ground shadow */}
            <ellipse cx={x} cy={894} rx={52} ry={13} fill="rgba(0,0,0,0.5)" opacity={landed * 0.8} />
            {/* selected rotating reticle */}
            {isSel && (
              <g transform={`translate(${x}, ${restY - 20})`}>
                <circle
                  r={118}
                  fill="none"
                  stroke={GOLD}
                  strokeWidth={3.5}
                  strokeDasharray="30 22"
                  opacity={0.85 * landed}
                  transform={`rotate(${(frame * 1.4) % 360})`}
                  style={{filter: 'drop-shadow(0 0 12px rgba(232,184,75,0.8))'}}
                />
                <g transform="translate(-118, -176)">
                  <rect x={0} y={0} width={236} height={56} rx={12} fill="rgba(10,15,30,0.94)" stroke={GOLD} strokeWidth={2.5} />
                  <text x={118} y={38} fill={GOLD} fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={3}>
                    SELECTED
                  </text>
                </g>
              </g>
            )}
            <g transform={`translate(${x}, ${y})`}>
              {/* teardrop */}
              <path
                d="M 0 -96 C -46 -96 -72 -62 -72 -26 C -72 14 0 62 0 62 C 0 62 72 14 72 -26 C 72 -62 46 -96 0 -96 Z"
                fill={isSel ? '#141B31' : '#101828'}
                stroke={c}
                strokeWidth={4.5}
                style={{filter: `drop-shadow(0 0 16px ${c}88)`}}
              />
              {/* house glyph */}
              <g transform="translate(0, -34)">
                <path
                  d="M -22 2 L 0 -18 L 22 2 M -15 -3 V 14 H 15 V -3"
                  fill="none"
                  stroke={c}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>
            {/* label under pin */}
            <g opacity={landed}>
              <text x={x} y={952} fill={INK} fontSize={32} fontFamily={FONT} fontWeight={700} textAnchor="middle">
                {h.name}
              </text>
              <text x={x} y={992} fill={isSel ? GOLD : MUTED} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                {h.price}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Application form panel - fields type in step by step
// ---------------------------------------------------------------------------
const FormPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const panelIn = interpolate(frame, [FORM_START - 40, FORM_START], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [FORM_START - 40, FORM_START], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const px = 220;
  const py = 1080;
  const pw = 1680;
  const rowY = (i: number) => py + 210 + i * 102;

  return (
    <div
      style={{
        position: 'absolute',
        left: px,
        top: py + rise,
        width: pw,
        height: 820,
        borderRadius: 28,
        background: 'linear-gradient(165deg, rgba(232,184,75,0.06), rgba(15,23,42,0.10) 55%)',
        border: '2px solid rgba(232,184,75,0.28)',
        opacity: panelIn,
        padding: '44px 60px',
      }}
    >
      <div style={{color: GOLD, fontFamily: MONO, fontSize: 30, letterSpacing: 6}}>
        APPLICATION PROGRESS
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 10}}>
        Mortgage application &middot; ref M-2026-04817
      </div>
      {FIELDS.map((f, i) => {
        const at = FORM_START + i * FIELD_STAGGER;
        const s = spring({frame: frame - at, fps, config: {damping: 200, stiffness: 110}});
        if (s <= 0.001) return null;
        const typeT = interpolate(frame, [at + 8, at + 48], [0, f.value.length], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const shown = f.value.slice(0, Math.floor(typeT));
        const caret = typeT < f.value.length && frame % 40 < 20;
        const y = rowY(i) - py;
        return (
          <div
            key={f.label}
            style={{
              position: 'absolute',
              left: 60,
              right: 60,
              top: y - 38,
              height: 76,
              display: 'flex',
              alignItems: 'center',
              opacity: Math.min(1, s),
              transform: `translateX(${(1 - s) * -60}px)`,
            }}
          >
            <div style={{width: 560, color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>
              {f.label}
            </div>
            <div
              style={{
                flex: 1,
                height: 76,
                borderRadius: 14,
                background: 'rgba(10,15,30,0.85)',
                border: '2px solid rgba(232,184,75,0.35)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 30,
              }}
            >
              <span style={{color: INK, fontFamily: MONO, fontSize: 38, fontWeight: 700}}>
                {shown}
                {caret && <span style={{color: GOLD}}>&#9612;</span>}
              </span>
            </div>
          </div>
        );
      })}
      {/* progress rail across the panel bottom */}
      <div style={{position: 'absolute', left: 60, right: 60, bottom: 40, display: 'flex', gap: 18}}>
        {FIELDS.map((f, i) => {
          const done = interpolate(frame, [FORM_START + i * FIELD_STAGGER + 48, FORM_START + i * FIELD_STAGGER + 68], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div key={`rail${i}`} style={{flex: 1, height: 16, borderRadius: 8, background: 'rgba(148,163,184,0.18)', overflow: 'hidden'}}>
              <div
                style={{
                  width: `${done * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #E8B84B, #F6D47C)',
                  boxShadow: done > 0 ? '0 0 14px rgba(232,184,75,0.7)' : 'none',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Document checklist panel
// ---------------------------------------------------------------------------
const ChecklistPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const panelIn = interpolate(frame, [DOCS_START - 50, DOCS_START - 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [DOCS_START - 50, DOCS_START - 10], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const px = 1980;
  const py = 1080;
  const pw = 1640;
  const rowY = (i: number) => py + 210 + i * 100;

  return (
    <div
      style={{
        position: 'absolute',
        left: px,
        top: py + rise,
        width: pw,
        height: 820,
        borderRadius: 28,
        background: 'linear-gradient(165deg, rgba(232,184,75,0.06), rgba(15,23,42,0.10) 55%)',
        border: '2px solid rgba(232,184,75,0.28)',
        opacity: panelIn,
        padding: '44px 60px',
      }}
    >
      <div style={{color: GOLD, fontFamily: MONO, fontSize: 30, letterSpacing: 6}}>
        DOCUMENT CHECKLIST
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 10}}>
        Underwriting verification &middot; all items required
      </div>
      <svg width={pw} height={820} style={{position: 'absolute', top: 0, left: 0}}>
        {DOCS.map((d, i) => {
          const at = DOCS_START + i * DOC_STAGGER;
          const s = spring({frame: frame - at, fps, config: {damping: 200, stiffness: 110}});
          if (s <= 0.001) return null;
          const y = rowY(i) - py;
          const check = interpolate(frame, [at + 18, at + 44], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <g key={`doc${i}`} opacity={Math.min(1, s)} transform={`translate(${(1 - s) * 70}, 0)`}>
              {/* checkbox */}
              <rect
                x={60}
                y={y - 66}
                width={56}
                height={56}
                rx={12}
                fill={check > 0 ? 'rgba(232,184,75,0.16)' : 'rgba(10,15,30,0.85)'}
                stroke={check > 0 ? GOLD : 'rgba(148,163,184,0.4)'}
                strokeWidth={3}
              />
              {/* checkmark draws on */}
              <path
                d={`M 74 ${y - 34} L 86 ${y - 22} L 104 ${y - 50}`}
                fill="none"
                stroke={GOLD}
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - check}
                style={{filter: 'drop-shadow(0 0 10px rgba(232,184,75,0.9))'}}
              />
              <text x={140} y={y - 22} fill={check > 0 ? INK : MUTED} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={1}>
                {d}
              </text>
              {check >= 1 && (
                <text x={pw - 70} y={y - 22} fill={GOLD} fontSize={30} fontFamily={MONO} fontWeight={800} textAnchor="end" letterSpacing={2}>
                  VERIFIED
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PRE-APPROVED stamp slams onto the form panel
// ---------------------------------------------------------------------------
const ApprovalStamp: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - STAMP_AT, fps, config: {damping: 9, stiffness: 170, mass: 1}});
  if (s <= 0.001) return null;
  const scale = 2.3 - 1.3 * Math.min(1.4, s);
  const shock = interpolate(frame, [STAMP_AT, STAMP_AT + 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {/* shockwave */}
      {shock > 0 && shock < 1 && (
        <circle
          cx={1060}
          cy={1500}
          r={120 + shock * 620}
          fill="none"
          stroke={GOLD}
          strokeWidth={10 * (1 - shock) + 1}
          opacity={(1 - shock) * 0.75}
        />
      )}
      <g
        transform={`translate(1060, 1500) rotate(-8) scale(${Math.max(0.2, scale)})`}
        opacity={Math.min(1, s * 1.6)}
      >
        <rect
          x={-390}
          y={-88}
          width={780}
          height={176}
          rx={20}
          fill="rgba(12,10,4,0.88)"
          stroke={GOLD}
          strokeWidth={7}
          style={{filter: 'drop-shadow(0 0 34px rgba(232,184,75,0.75))'}}
        />
        <rect x={-368} y={-66} width={736} height={132} rx={12} fill="none" stroke={GOLD} strokeWidth={2.5} opacity={0.8} />
        <text
          x={0}
          y={30}
          fill={GOLD_BRIGHT}
          fontSize={82}
          fontFamily={FONT}
          fontWeight={800}
          letterSpacing={10}
          textAnchor="middle"
          style={{textShadow: '0 0 24px rgba(232,184,75,0.8)'}}
        >
          PRE-APPROVED
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Journey stage rail across the bottom + key handover + FUNDED payoff
// ---------------------------------------------------------------------------
const StageRail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const railY = 2010;
  const segW = 810;
  const gap = 40;
  const totalW = STAGES.length * segW + (STAGES.length - 1) * gap;
  const x0 = (3840 - totalW) / 2;

  // key slides into the funding segment
  const keyS = spring({frame: frame - KEY_AT, fps, config: {damping: 200, stiffness: 90}});
  const keyX = x0 + 3 * (segW + gap) + segW / 2 - 150 + 150 * Math.min(1, keyS);
  const keyRot = interpolate(Math.min(1, keyS), [0, 1], [-24, 0]);

  // FUNDED payoff banner over the map strip
  const f = spring({frame: frame - FUNDED_AT, fps, config: {damping: 10, stiffness: 150, mass: 1}});
  const fScale = 2.1 - 1.1 * Math.min(1.35, f);
  const glowPulse = 0.5 + 0.5 * Math.sin((frame - FUNDED_AT) * 0.1);

  return (
    <>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {STAGES.map((stg, i) => {
          const on = interpolate(frame, [STAGE_AT[i], STAGE_AT[i] + 40], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const x = x0 + i * (segW + gap);
          return (
            <g key={`stage${i}`}>
              <text
                x={x + segW / 2}
                y={railY - 26}
                fill={on > 0.5 ? GOLD : MUTED}
                fontSize={27}
                fontFamily={MONO}
                fontWeight={700}
                letterSpacing={3}
                textAnchor="middle"
              >
                {stg}
              </text>
              <rect x={x} y={railY} width={segW} height={22} rx={11} fill="rgba(148,163,184,0.16)" />
              <rect
                x={x}
                y={railY}
                width={segW * on}
                height={22}
                rx={11}
                fill="url(#mjGoldGrad)"
                opacity={0.95}
                style={{filter: on > 0 ? 'drop-shadow(0 0 12px rgba(232,184,75,0.7))' : undefined}}
              />
              <circle
                cx={x + segW / 2}
                cy={railY + 11}
                r={13}
                fill={on > 0.5 ? GOLD : '#1A2338'}
                stroke={on > 0.5 ? GOLD_BRIGHT : 'rgba(148,163,184,0.4)'}
                strokeWidth={3}
              />
            </g>
          );
        })}
        {/* key handover into the funding stage */}
        {keyS > 0.001 && (
          <g transform={`translate(${keyX}, ${railY + 11}) rotate(${keyRot})`} opacity={Math.min(1, keyS)}>
            <g style={{filter: 'drop-shadow(0 0 18px rgba(232,184,75,0.85))'}}>
              <circle cx={-52} cy={0} r={30} fill="none" stroke={GOLD_BRIGHT} strokeWidth={13} />
              <rect x={-26} y={-8} width={120} height={16} rx={8} fill={GOLD_BRIGHT} />
              <rect x={62} y={-8} width={16} height={34} rx={6} fill={GOLD_BRIGHT} />
              <rect x={86} y={-8} width={16} height={26} rx={6} fill={GOLD_BRIGHT} />
            </g>
          </g>
        )}
        {/* FUNDED payoff */}
        {f > 0.001 && (
          <g>
            <circle
              cx={1920}
              cy={700}
              r={200 + (1 - Math.min(1, f)) * 500}
              fill="none"
              stroke={GOLD}
              strokeWidth={8}
              opacity={(1 - Math.min(1, f)) * 0.6}
            />
            <g
              transform={`translate(1920, 700) scale(${Math.max(0.25, fScale)})`}
              opacity={Math.min(1, f * 1.5)}
            >
              <rect
                x={-560}
                y={-110}
                width={1120}
                height={220}
                rx={30}
                fill="rgba(12,10,4,0.9)"
                stroke={GOLD}
                strokeWidth={8}
                style={{
                  filter: `drop-shadow(0 0 ${44 + glowPulse * 30}px rgba(232,184,75,${0.55 + glowPulse * 0.3}))`,
                }}
              />
              <text
                x={0}
                y={44}
                fill={GOLD_BRIGHT}
                fontSize={132}
                fontFamily={FONT}
                fontWeight={800}
                letterSpacing={26}
                textAnchor="middle"
                style={{textShadow: `0 0 40px rgba(232,184,75,${0.6 + glowPulse * 0.4})`}}
              >
                FUNDED
              </text>
              <text x={0} y={-140} fill={INK} fontSize={34} fontFamily={MONO} letterSpacing={6} textAnchor="middle">
                KEYS HANDED OVER · LOAN $388,000
              </text>
            </g>
          </g>
        )}
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [FUNDED_AT + 40, FUNDED_AT + 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 36,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: 'rgba(148,163,184,0.55)',
        fontFamily: FONT,
        fontSize: 26,
        opacity: fade,
      }}
    >
      Illustrative mortgage journey &middot; figures are examples, not a lending offer or commitment
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const MortgageApplicationJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <MapStrip frame={frame} fps={fps} />
      <FormPanel frame={frame} fps={fps} />
      <ChecklistPanel frame={frame} fps={fps} />
      <ApprovalStamp frame={frame} fps={fps} />
      <StageRail frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default MortgageApplicationJourney;
