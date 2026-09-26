/**
 * EIAIActCompliance.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * EU AI Act compliance dashboard: risk-tier classification bands, a
 * recruitment-AI system assessment chip that drops onto the HIGH-RISK band,
 * documentation-status checklist, a compliance-score gauge, and an
 * applicability-calendar timeline (2024 -> 2029).
 *
 * Register in Root.tsx:
 *   <Composition id="EIAIActCompliance" component={EIAIActCompliance}
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
// Palette
// ---------------------------------------------------------------------------
const BG = '#060A18';
const INK = '#E8EDF6';
const MUTED = 'rgba(203,213,225,0.62)';
const FAINT = 'rgba(148,163,184,0.45)';
const EU_BLUE = '#3B82F6';
const GOLD = '#FBBF24';
const RED = '#F87171';
const GREEN = '#34D399';
const SLATE = '#94A3B8';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Deterministic pseudo-random (never Math.random)
// ---------------------------------------------------------------------------
function seededRand(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------------------
// Data: risk tiers
// ---------------------------------------------------------------------------
interface Tier {
  name: string;
  desc: string;
  color: string;
}
const TIERS: Tier[] = [
  {name: 'MINIMAL RISK', desc: 'spam filters, games', color: SLATE},
  {name: 'LIMITED RISK', desc: 'chatbots — transparency', color: '#60A5FA'},
  {name: 'HIGH-RISK', desc: 'Annex III — employment, biometrics', color: GOLD},
  {name: 'UNACCEPTABLE', desc: 'social scoring — prohibited', color: RED},
];
const BAND_X = 200;
const BAND_W = 1300;
const BAND_Y0 = 560;
const BAND_H = 150;
const BAND_GAP = 24;

// ---------------------------------------------------------------------------
// Data: documentation checklist
// ---------------------------------------------------------------------------
interface DocRow {
  label: string;
  target: number;
}
const DOC_ROWS: DocRow[] = [
  {label: 'Technical documentation', target: 92},
  {label: 'Data governance', target: 78},
  {label: 'Logging & record-keeping', target: 64},
  {label: 'Human oversight', target: 81},
];
const DOC_CARD = {x: 1650, y: 420, w: 1050, h: 730};
const ROW_TOP0 = 590;
const ROW_STEP = 135;
const BAR_W = 620;

// ---------------------------------------------------------------------------
// Data: applicability calendar (axis: Jan 2024 -> Jan 2029)
// ---------------------------------------------------------------------------
const xForYear = (t: number): number => 200 + (t - 2024) * 688;
interface Marker {
  t: number;
  date: string;
  desc: string;
  kind: 'dim' | 'gold' | 'std';
  start: number;
}
const MARKERS: Marker[] = [
  {t: 2024 + 213 / 366, date: '2 AUG 2024', desc: 'in force', kind: 'dim', start: 480},
  {
    t: 2026 + 213 / 365,
    date: '2 AUG 2026',
    desc: 'Art. 50 transparency + GPAI enforcement · IN FORCE',
    kind: 'gold',
    start: 540,
  },
  {t: 2027 + 334 / 365, date: '2 DEC 2027', desc: 'high-risk Annex III obligations', kind: 'std', start: 600},
  {t: 2028 + 213 / 366, date: '2 AUG 2028', desc: 'Annex I', kind: 'std', start: 660},
];
const CAL_Y = 1730;
const TODAY_X = xForYear(2026 + 268 / 365);

// ---------------------------------------------------------------------------
// Shared SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="36%" r="72%">
      <stop offset="0%" stopColor="rgba(59,130,246,0.14)" />
      <stop offset="45%" stopColor="rgba(59,130,246,0.04)" />
      <stop offset="100%" stopColor="rgba(6,10,24,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stopColor="rgba(6,10,24,0)" />
      <stop offset="100%" stopColor="rgba(2,4,10,0.72)" />
    </radialGradient>
    <linearGradient id="docBarGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={EU_BLUE} />
      <stop offset="100%" stopColor={GREEN} />
    </linearGradient>
    <linearGradient id="gaugeArcGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={EU_BLUE} />
      <stop offset="70%" stopColor={GOLD} />
      <stop offset="100%" stopColor="#FDE68A" />
    </linearGradient>
    <pattern id="bgGrid" width="160" height="160" patternUnits="userSpaceOnUse">
      <path
        d="M 160 0 L 0 0 0 160"
        fill="none"
        stroke="rgba(148,163,184,0.055)"
        strokeWidth={1}
      />
    </pattern>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="goldGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: navy base + EU-blue radial glow + grid + dust + scan sweep + vignette
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dust = useMemo(
    () =>
      Array.from({length: 70}, (_, i) => ({
        x: seededRand(i * 7 + 1) * 3840,
        y: seededRand(i * 13 + 101) * 2160,
        r: 1 + seededRand(i * 29 + 201) * 2.6,
        ph: seededRand(i * 3 + 301) * Math.PI * 2,
      })),
    []
  );
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg
        width={3840}
        height={2160}
        style={{position: 'absolute', top: 0, left: 0}}
      >
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#bgGlow)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#bgGrid)" opacity={0.55} />
        {dust.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r}
            fill="#93C5FD"
            opacity={0.1 * (0.5 + 0.5 * Math.sin(frame * 0.03 + d.ph))}
          />
        ))}
        {/* slow scan sweep */}
        <rect
          x={0}
          y={scanY - 110}
          width={3840}
          height={220}
          fill="rgba(59,130,246,0.035)"
        />
        <rect x={0} y={scanY - 110} width={3840} height={2} fill="rgba(59,130,246,0.10)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title block (0-60)
// ---------------------------------------------------------------------------
const TitleBlock: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, 45], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 118 + rise,
          left: 200,
          opacity: fade,
        }}
      >
        <div
          style={{
            color: INK,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 84,
            letterSpacing: -1,
          }}
        >
          EU AI ACT COMPLIANCE
        </div>
        <div
          style={{
            color: MUTED,
            fontFamily: FONT,
            fontSize: 34,
            marginTop: 16,
          }}
        >
          risk-tier classification · conformity assessment
        </div>
        <div
          style={{
            marginTop: 26,
            width: 460,
            height: 3,
            background:
              'linear-gradient(90deg, rgba(59,130,246,0.85), rgba(251,191,36,0.55), rgba(59,130,246,0))',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 128 + rise,
          right: 200,
          opacity: fade,
        }}
      >
        <div
          style={{
            color: '#BFDBFE',
            fontFamily: MONO,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 2,
            border: '2px solid rgba(59,130,246,0.65)',
            borderRadius: 12,
            padding: '14px 30px',
            background: 'rgba(59,130,246,0.08)',
            boxShadow: '0 0 26px rgba(59,130,246,0.22)',
          }}
        >
          REGULATION (EU) 2024/1689
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Risk-tier bands + assessment chip drop + reasoning chips + stamp badge
// ---------------------------------------------------------------------------
const HIGH_RISK_IDX = 2;
const CHIP_Y = 983;
const CHIP_X = 590;
const CHIP_W = 440;
const CHIP_H = 76;

const RiskBands: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  // Section label
  const labelFade = interpolate(frame, [60, 105], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Chip drop with spring bounce (260-340)
  const chipS = spring({
    frame: frame - 260,
    fps,
    config: {damping: 14, stiffness: 110},
  });
  const chipY = 380 + (CHIP_Y - 380) * chipS;
  const chipVisible = frame >= 258;

  // Gold highlight border on the HIGH-RISK band once the chip lands
  const goldOp = interpolate(frame, [330, 390], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Landing impact ring
  const ringT = interpolate(frame, [300, 385], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Reasoning chips pop (340 / 400)
  const sA = spring({
    frame: frame - 340,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  const sB = spring({
    frame: frame - 400,
    fps,
    config: {damping: 200, stiffness: 90},
  });

  // HIGH-RISK stamp badge (payoff, 660)
  const sBadge = spring({
    frame: frame - 660,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  const badgeScale = 1 + (1 - Math.min(1, Math.max(0, sBadge))) * 1.25;

  // Gentle breathing on the gold border during resolve
  const breathe =
    frame >= 780 ? 0.72 + 0.28 * Math.sin(frame * 0.05) : 1;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 3840, height: 2160}}>
      <div
        style={{
          position: 'absolute',
          left: BAND_X,
          top: 470,
          opacity: labelFade,
          color: MUTED,
          fontFamily: MONO,
          fontSize: 30,
          letterSpacing: 6,
        }}
      >
        RISK TIERS
      </div>

      {TIERS.map((tier, i) => {
        const s = spring({
          frame: frame - (80 + i * 30),
          fps,
          config: {damping: 200, stiffness: 90},
        });
        if (s <= 0.001) return null;
        const y = BAND_Y0 + i * (BAND_H + BAND_GAP);
        const isHigh = i === HIGH_RISK_IDX;
        const descOp = isHigh
          ? interpolate(frame, [300, 350], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          : 1;
        return (
          <div
            key={tier.name}
            style={{
              position: 'absolute',
              left: BAND_X + (1 - s) * -70,
              top: y,
              width: BAND_W,
              height: BAND_H,
              opacity: Math.min(1, s),
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: BAND_W,
                height: BAND_H,
                borderRadius: 18,
                background: `linear-gradient(120deg, ${tier.color}22, ${tier.color}08 55%, rgba(255,255,255,0.015))`,
                border: `1.5px solid ${tier.color}55`,
              }}
            />
            {/* gold highlight border on landing */}
            {isHigh && goldOp > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: -3,
                  top: -3,
                  width: BAND_W + 6,
                  height: BAND_H + 6,
                  borderRadius: 22,
                  border: `4px solid ${GOLD}`,
                  opacity: goldOp * breathe,
                  filter: 'drop-shadow(0 0 18px rgba(251,191,36,0.55))',
                  pointerEvents: 'none',
                }}
              />
            )}
            {/* left accent bar */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 18,
                width: 8,
                height: BAND_H - 36,
                borderRadius: 4,
                background: tier.color,
                boxShadow: `0 0 16px ${tier.color}88`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 62,
                top: 44,
                color: tier.color,
                fontFamily: MONO,
                fontWeight: 800,
                fontSize: 40,
                letterSpacing: 1,
                textShadow: `0 0 18px ${tier.color}55`,
              }}
            >
              {tier.name}
            </div>
            <div
              style={{
                position: 'absolute',
                right: 48,
                top: 50,
                color: MUTED,
                fontFamily: FONT,
                fontSize: 30,
                opacity: descOp,
              }}
            >
              {tier.desc}
            </div>
            {/* tier-level dots */}
            <div
              style={{
                position: 'absolute',
                right: 48,
                top: 104,
                display: 'flex',
                gap: 18,
              }}
            >
              {[0, 1, 2, 3].map((j) => (
                <div
                  key={j}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    background: j <= i ? tier.color : 'rgba(148,163,184,0.18)',
                    boxShadow: j <= i ? `0 0 12px ${tier.color}99` : 'none',
                  }}
                />
              ))}
            </div>
            <div
              style={{
                position: 'absolute',
                left: 62,
                top: 100,
                color: FAINT,
                fontFamily: MONO,
                fontSize: 24,
                letterSpacing: 3,
              }}
            >
              TIER {i + 1} / 4
            </div>
          </div>
        );
      })}

      {/* landing impact ring */}
      {ringT > 0 && ringT < 1 && (
        <div
          style={{
            position: 'absolute',
            left: 810 - (40 + ringT * 170),
            top: CHIP_Y - (40 + ringT * 170),
            width: (40 + ringT * 170) * 2,
            height: (40 + ringT * 170) * 2,
            borderRadius: '50%',
            border: `3px solid ${GOLD}`,
            opacity: (1 - ringT) * 0.55,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* assessment chip dropping onto the HIGH-RISK band */}
      {chipVisible && (
        <div
          style={{
            position: 'absolute',
            left: CHIP_X,
            top: chipY - CHIP_H / 2,
            width: CHIP_W,
            height: CHIP_H,
            borderRadius: CHIP_H / 2,
            background: 'rgba(8,13,28,0.94)',
            border: `2.5px solid ${GOLD}`,
            boxShadow: '0 0 34px rgba(251,191,36,0.4), 0 14px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: Math.min(1, chipS * 1.4),
          }}
        >
          <div
            style={{
              color: '#FDE68A',
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: 1,
            }}
          >
            SYSTEM: RECRUITMENT AI
          </div>
        </div>
      )}

      {/* reasoning chips pop beside the landed chip */}
      {sA > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: 1054,
            top: 915,
            width: 386,
            height: 48,
            borderRadius: 24,
            background: 'rgba(251,191,36,0.10)',
            border: `1.5px solid ${GOLD}88`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: Math.min(1, sA),
            transform: `scale(${0.6 + 0.4 * Math.min(1, sA)})`,
          }}
        >
          <div style={{color: GOLD, fontFamily: MONO, fontSize: 24, fontWeight: 700}}>
            Annex III · employment
          </div>
        </div>
      )}
      {sB > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: 1054,
            top: 975,
            width: 386,
            height: 48,
            borderRadius: 24,
            background: 'rgba(251,191,36,0.07)',
            border: '1.5px solid rgba(251,191,36,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: Math.min(1, sB),
            transform: `scale(${0.6 + 0.4 * Math.min(1, sB)})`,
          }}
        >
          <div style={{color: '#FDE68A', fontFamily: MONO, fontSize: 24}}>
            affects hiring decisions
          </div>
        </div>
      )}

      {/* HIGH-RISK stamp badge (payoff 660) */}
      {sBadge > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: 950 - 100,
            top: 918 - 28,
            width: 200,
            height: 56,
            opacity: Math.min(1, sBadge * 1.6),
            transform: `rotate(-8deg) scale(${badgeScale})`,
            transformOrigin: 'center center',
          }}
        >
          <div
            style={{
              width: 200,
              height: 56,
              borderRadius: 12,
              background: `linear-gradient(160deg, #FDE68A, ${GOLD})`,
              border: '2px solid #B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(251,191,36,0.65), 0 8px 24px rgba(0,0,0,0.45)',
            }}
          >
            <div
              style={{
                color: '#451A03',
                fontFamily: MONO,
                fontWeight: 800,
                fontSize: 28,
                letterSpacing: 1,
              }}
            >
              HIGH-RISK
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Documentation status panel (center-right)
// ---------------------------------------------------------------------------
const DocPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const cardS = spring({
    frame: frame - 160,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (cardS <= 0.001) return null;
  const C = 2 * Math.PI * 26;
  return (
    <div
      style={{
        position: 'absolute',
        left: DOC_CARD.x,
        top: DOC_CARD.y + (1 - cardS) * 60,
        width: DOC_CARD.w,
        height: DOC_CARD.h,
        opacity: Math.min(1, cardS),
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: DOC_CARD.w,
          height: DOC_CARD.h,
          borderRadius: 24,
          background:
            'linear-gradient(165deg, rgba(20,30,58,0.85), rgba(10,16,32,0.9))',
          border: '1.5px solid rgba(59,130,246,0.28)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 52,
          color: MUTED,
          fontFamily: MONO,
          fontSize: 30,
          letterSpacing: 6,
        }}
      >
        DOCUMENTATION STATUS
      </div>
      <div
        style={{
          position: 'absolute',
          right: 60,
          top: 52,
          color: FAINT,
          fontFamily: MONO,
          fontSize: 24,
          letterSpacing: 2,
        }}
      >
        ART. 11 · ANNEX IV
      </div>

      {DOC_ROWS.map((row, k) => {
        const rowStart = 200 + k * 55;
        const s = spring({
          frame: frame - rowStart,
          fps,
          config: {damping: 200, stiffness: 90},
        });
        if (s <= 0.001) return null;
        const rowTop = ROW_TOP0 + k * ROW_STEP;
        const fill = interpolate(frame, [rowStart, rowStart + 170], [0, row.target], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const checkDraw = interpolate(
          frame,
          [rowStart + 150, rowStart + 215],
          [0, 1],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
        );
        return (
          <div
            key={row.label}
            style={{
              position: 'absolute',
              left: 60,
              top: rowTop + (1 - s) * 40,
              width: DOC_CARD.w - 120,
              height: ROW_STEP,
              opacity: Math.min(1, s),
            }}
          >
            <div
              style={{
                color: INK,
                fontFamily: MONO,
                fontSize: 30,
                letterSpacing: 1,
              }}
            >
              {row.label}
            </div>
            {/* progress bar */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 58,
                width: BAR_W,
                height: 16,
                borderRadius: 8,
                background: 'rgba(148,163,184,0.14)',
              }}
            >
              <div
                style={{
                  width: (BAR_W * fill) / 100,
                  height: 16,
                  borderRadius: 8,
                  background: 'linear-gradient(90deg, #3B82F6, #34D399)',
                  boxShadow: '0 0 16px rgba(59,130,246,0.45)',
                }}
              />
            </div>
            {/* animated percent */}
            <div
              style={{
                position: 'absolute',
                left: BAR_W + 30,
                top: 44,
                color: INK,
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: 34,
                textShadow: '0 0 16px rgba(59,130,246,0.5)',
              }}
            >
              {Math.round(fill)}%
            </div>
            {/* drawn check icon */}
            <svg
              width={70}
              height={70}
              style={{position: 'absolute', left: 855, top: 20}}
            >
              <circle
                cx={35}
                cy={35}
                r={26}
                fill="none"
                stroke={GREEN}
                strokeWidth={4}
                strokeDasharray={C}
                strokeDashoffset={C * (1 - checkDraw)}
                strokeLinecap="round"
                transform="rotate(-90 35 35)"
                opacity={checkDraw > 0 ? 1 : 0}
                style={{filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.7))'}}
              />
              <path
                d="M 24 36 L 32 44 L 47 27"
                fill="none"
                stroke={GREEN}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={40}
                strokeDashoffset={40 * (1 - Math.max(0, (checkDraw - 0.45) * 1.8))}
                opacity={checkDraw > 0.45 ? 1 : 0}
              />
            </svg>
            {/* hairline divider */}
            {k < DOC_ROWS.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: ROW_STEP - 8,
                  width: DOC_CARD.w - 120,
                  height: 1,
                  background: 'rgba(148,163,184,0.12)',
                }}
              />
            )}
          </div>
        );
      })}

      <div
        style={{
          position: 'absolute',
          left: 60,
          bottom: 40,
          color: FAINT,
          fontFamily: MONO,
          fontSize: 22,
          letterSpacing: 2,
        }}
      >
        4 OF 4 CONTROLS MAPPED · ART. 9–15 → POST-MARKET MONITORING
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Compliance score gauge (top-right, semicircular, needle 0 -> 78%)
// ---------------------------------------------------------------------------
const GAUGE = {cx: 3230, cy: 860, r: 280};
const GAUGE_CARD = {x: 2820, y: 420, w: 820, h: 670};

const Gauge: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const cardS = spring({
    frame: frame - 180,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (cardS <= 0.001) return null;

  const pct = interpolate(frame, [250, 650], [0, 0.78], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ang = 180 - 180 * pct;
  const rad = (ang * Math.PI) / 180;
  const ex = GAUGE.cx + GAUGE.r * Math.cos(rad);
  const ey = GAUGE.cy - GAUGE.r * Math.sin(rad);
  const nx = GAUGE.cx + (GAUGE.r - 70) * Math.cos(rad);
  const ny = GAUGE.cy - (GAUGE.r - 70) * Math.sin(rad);

  // glow: builds with the sweep, pulses at payoff, breathes on resolve
  const glow =
    frame < 650
      ? 0.3 + 0.25 * pct
      : frame < 780
        ? 0.55 + 0.35 * Math.sin((frame - 650) * 0.14)
        : 0.45 + 0.2 * Math.sin(frame * 0.05);

  const score = Math.round(pct * 100);

  return (
    <div
      style={{
        position: 'absolute',
        left: GAUGE_CARD.x,
        top: GAUGE_CARD.y + (1 - cardS) * 60,
        width: GAUGE_CARD.w,
        height: GAUGE_CARD.h,
        opacity: Math.min(1, cardS),
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: GAUGE_CARD.w,
          height: GAUGE_CARD.h,
          borderRadius: 24,
          background:
            'linear-gradient(165deg, rgba(24,32,60,0.85), rgba(10,16,32,0.9))',
          border: '1.5px solid rgba(251,191,36,0.30)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        }}
      />
      <svg
        width={GAUGE_CARD.w}
        height={GAUGE_CARD.h}
        style={{position: 'absolute', left: 0, top: 0}}
      >
        <Defs />
        <g transform={`translate(${-GAUGE_CARD.x}, ${-GAUGE_CARD.y})`}>
          {/* zone ticks */}
          {Array.from({length: 11}, (_, t) => {
            const a = ((180 - t * 18) * Math.PI) / 180;
            const major = t % 5 === 0;
            const r1 = GAUGE.r + 14;
            const r0 = major ? GAUGE.r - 34 : GAUGE.r - 18;
            return (
              <line
                key={t}
                x1={GAUGE.cx + r0 * Math.cos(a)}
                y1={GAUGE.cy - r0 * Math.sin(a)}
                x2={GAUGE.cx + r1 * Math.cos(a)}
                y2={GAUGE.cy - r1 * Math.sin(a)}
                stroke={major ? 'rgba(203,213,225,0.55)' : 'rgba(148,163,184,0.3)'}
                strokeWidth={major ? 3 : 2}
              />
            );
          })}
          {/* track arc */}
          <path
            d={`M ${GAUGE.cx - GAUGE.r} ${GAUGE.cy} A ${GAUGE.r} ${GAUGE.r} 0 0 1 ${GAUGE.cx + GAUGE.r} ${GAUGE.cy}`}
            fill="none"
            stroke="rgba(148,163,184,0.16)"
            strokeWidth={26}
            strokeLinecap="round"
          />
          {/* filled arc */}
          {pct > 0.002 && (
            <path
              d={`M ${GAUGE.cx - GAUGE.r} ${GAUGE.cy} A ${GAUGE.r} ${GAUGE.r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`}
              fill="none"
              stroke="url(#gaugeArcGrad)"
              strokeWidth={26}
              strokeLinecap="round"
              style={{filter: `drop-shadow(0 0 22px rgba(251,191,36,${glow.toFixed(2)}))`}}
            />
          )}
          {/* needle */}
          <line
            x1={GAUGE.cx}
            y1={GAUGE.cy}
            x2={nx}
            y2={ny}
            stroke="#FDE68A"
            strokeWidth={9}
            strokeLinecap="round"
            style={{filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.8))'}}
          />
          <circle cx={GAUGE.cx} cy={GAUGE.cy} r={24} fill={GOLD} filter="url(#softGlow)" />
          <circle cx={GAUGE.cx} cy={GAUGE.cy} r={9} fill={BG} />
          {/* scale labels */}
          <text x={GAUGE.cx - GAUGE.r - 44} y={GAUGE.cy + 10} fill={FAINT} fontSize={26} fontFamily={MONO} textAnchor="middle">0</text>
          <text x={GAUGE.cx + GAUGE.r + 52} y={GAUGE.cy + 10} fill={FAINT} fontSize={26} fontFamily={MONO} textAnchor="middle">100</text>
        </g>
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 80,
          width: GAUGE_CARD.w,
          textAlign: 'center',
          color: MUTED,
          fontFamily: MONO,
          fontSize: 30,
          letterSpacing: 6,
        }}
      >
        COMPLIANCE SCORE
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 545,
          width: GAUGE_CARD.w,
          textAlign: 'center',
          color: '#FDE68A',
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: 96,
          textShadow: `0 0 44px rgba(251,191,36,${glow.toFixed(2)})`,
        }}
      >
        {score}%
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 660,
          width: GAUGE_CARD.w,
          textAlign: 'center',
          color: MUTED,
          fontFamily: FONT,
          fontSize: 28,
        }}
      >
        conformity assessment in progress
      </div>
      {/* side readouts */}
      <div
        style={{
          position: 'absolute',
          left: 56,
          top: 480,
          color: FAINT,
          fontFamily: MONO,
          fontSize: 22,
          letterSpacing: 1,
        }}
      >
        THRESHOLD 65%
      </div>
      <div
        style={{
          position: 'absolute',
          right: 56,
          top: 480,
          color: FAINT,
          fontFamily: MONO,
          fontSize: 22,
          letterSpacing: 1,
        }}
      >
        TARGET 85%
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Applicability calendar (bottom timeline)
// ---------------------------------------------------------------------------
const Calendar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const lineDraw = interpolate(frame, [420, 560], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleFade = interpolate(frame, [400, 445], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const todayFade = interpolate(frame, [700, 745], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const years = [2024, 2025, 2026, 2027, 2028];
  const quarters: number[] = [];
  years.forEach((y) => {
    for (let q = 0; q < 4; q++) quarters.push(y + q / 4);
  });

  return (
    <svg
      width={3840}
      height={2160}
      style={{position: 'absolute', top: 0, left: 0}}
    >
      <Defs />
      <text
        x={200}
        y={1595}
        fill={MUTED}
        fontSize={30}
        fontFamily={MONO}
        letterSpacing={6}
        opacity={titleFade}
      >
        APPLICABILITY CALENDAR
      </text>

      {/* baseline */}
      <line
        x1={200}
        y1={CAL_Y}
        x2={200 + 3440 * lineDraw}
        y2={CAL_Y}
        stroke="rgba(148,163,184,0.4)"
        strokeWidth={3}
      />

      {/* quarter + year ticks */}
      <g opacity={lineDraw}>
        {quarters.map((t) => {
          const x = xForYear(t);
          const isYear = Number.isInteger(t);
          return (
            <g key={t}>
              <line
                x1={x}
                y1={CAL_Y}
                x2={x}
                y2={CAL_Y + (isYear ? 22 : 12)}
                stroke={isYear ? 'rgba(203,213,225,0.6)' : 'rgba(148,163,184,0.3)'}
                strokeWidth={isYear ? 2.5 : 1.5}
              />
              {isYear && (
                <line
                  x1={x}
                  y1={1610}
                  x2={x}
                  y2={CAL_Y}
                  stroke="rgba(148,163,184,0.10)"
                  strokeWidth={1.5}
                />
              )}
            </g>
          );
        })}
        {years.map((y) => (
          <text
            key={`yl${y}`}
            x={xForYear(y)}
            y={1795}
            fill={FAINT}
            fontSize={26}
            fontFamily={MONO}
            textAnchor="middle"
          >
            {y}
          </text>
        ))}
      </g>

      {/* milestone markers */}
      {MARKERS.map((m) => {
        const s = spring({
          frame: frame - m.start,
          fps,
          config: {damping: 200, stiffness: 90},
        });
        if (s <= 0.001) return null;
        const x = xForYear(m.t);
        const isGold = m.kind === 'gold';
        const color = isGold ? GOLD : m.kind === 'dim' ? FAINT : '#93C5FD';
        const pulse =
          isGold && frame >= 650 ? 1 + 0.22 * Math.sin(frame * 0.1) : 1;
        return (
          <g
            key={m.date}
            opacity={Math.min(1, s)}
            transform={`translate(${x} ${CAL_Y}) scale(${Math.min(1, s) * (isGold ? 1.12 : 1) * pulse}) translate(${-x} ${-CAL_Y})`}
          >
            {/* halo for the gold milestone */}
            {isGold && (
              <circle
                cx={x}
                cy={CAL_Y}
                r={26 * pulse}
                fill="none"
                stroke={GOLD}
                strokeWidth={3}
                opacity={0.55}
                filter="url(#goldGlow)"
              />
            )}
            <line
              x1={x}
              y1={CAL_Y - 4}
              x2={x}
              y2={CAL_Y - 32}
              stroke={color}
              strokeWidth={isGold ? 3.5 : 2.5}
              opacity={0.85}
            />
            <circle
              cx={x}
              cy={CAL_Y}
              r={isGold ? 11 : 8}
              fill={color}
              style={
                isGold
                  ? {filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.9))'}
                  : undefined
              }
            />
            <text
              x={x}
              y={1652}
              fill={isGold ? GOLD : '#C7D2E8'}
              fontSize={isGold ? 30 : 27}
              fontFamily={MONO}
              fontWeight={isGold ? 800 : 700}
              textAnchor="middle"
              style={
                isGold
                  ? {filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.6))'}
                  : undefined
              }
            >
              {m.date}
            </text>
            <text
              x={x}
              y={1688}
              fill={isGold ? '#FDE68A' : MUTED}
              fontSize={isGold ? 27 : 25}
              fontFamily={FONT}
              textAnchor="middle"
            >
              {m.desc}
            </text>
          </g>
        );
      })}

      {/* today cursor */}
      <g opacity={todayFade}>
        <line
          x1={TODAY_X}
          y1={CAL_Y + 8}
          x2={TODAY_X}
          y2={CAL_Y + 42}
          stroke={INK}
          strokeWidth={2.5}
          style={{filter: 'drop-shadow(0 0 8px rgba(232,237,246,0.7))'}}
        />
        <text
          x={TODAY_X}
          y={1812}
          fill={FAINT}
          fontSize={24}
          fontFamily={MONO}
          letterSpacing={2}
          textAnchor="middle"
        >
          TODAY · 26 SEP 2026
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [760, 810], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 56,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: 'rgba(148,163,184,0.55)',
        fontFamily: FONT,
        fontSize: 26,
        opacity: fade,
      }}
    >
      AI Act — Regulation (EU) 2024/1689 · dates shown are applicability milestones.
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const EIAIActCompliance: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBlock frame={frame} />
      <RiskBands frame={frame} fps={fps} />
      <DocPanel frame={frame} fps={fps} />
      <Gauge frame={frame} fps={fps} />
      <Calendar frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default EIAIActCompliance;
