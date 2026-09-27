/**
 * BenefitsOpenEnrollment.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Benefits open enrollment in deep indigo with mint/green accents: a November
 * calendar highlights the enrollment window day by day, three plan cards
 * (HMO / PPO / HDHP) fan out with comparison bars, an "ENROLL BY NOV 15"
 * countdown ring ticks down, and a checkmark lands on the chosen PPO plan
 * with an ENROLLED payoff.
 *
 * Register in Root.tsx:
 *   <Composition id="BenefitsOpenEnrollment" component={BenefitsOpenEnrollment}
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
// Palette - deep indigo with mint/green accents
// ---------------------------------------------------------------------------
const BG = '#14102B';
const PANEL = 'rgba(24,19,54,0.78)';
const INK = '#F1EDFF';
const MUTED = 'rgba(178,170,214,0.62)';
const MINT = '#6EE7B7';
const MINT_DEEP = '#34D399';
const AMBER = '#FBBF24';
const HAIRLINE = 'rgba(110,231,183,0.22)';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps, 900 = 15 s)
// ---------------------------------------------------------------------------
const CAL_HL_START = 110; // calendar day highlighting
const CAL_HL_END = 250;
const CAL_OUT = 300; // calendar fades as cards arrive
const CARDS_START = 300;
const CARD_STAGGER = 55;
const RING_START = 500;
const RING_END = 700;
const CHOOSE_AT = 720;

// ---------------------------------------------------------------------------
// Static defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="beBgGlow" cx="50%" cy="30%" r="72%">
      <stop offset="0%" stopColor="rgba(110,231,183,0.09)" />
      <stop offset="55%" stopColor="rgba(110,231,183,0.03)" />
      <stop offset="100%" stopColor="rgba(20,16,43,0)" />
    </radialGradient>
    <radialGradient id="beVignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stopColor="rgba(20,16,43,0)" />
      <stop offset="100%" stopColor="rgba(7,5,18,0.74)" />
    </radialGradient>
    <linearGradient id="beMintGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={MINT_DEEP} />
      <stop offset="100%" stopColor={MINT} />
    </linearGradient>
    <linearGradient id="beCardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(110,231,183,0.07)" />
      <stop offset="100%" stopColor="rgba(24,19,54,0.10)" />
    </linearGradient>
    <filter id="beGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: mint glow, vignette, faint grid, diagonal sweep
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
            'radial-gradient(circle at 50% 28%, rgba(110,231,183,0.09), rgba(110,231,183,0.03) 45%, rgba(20,16,43,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <g opacity={fade * 0.5}>
          {Array.from({length: 33}, (_, i) => (
            <line key={`v${i}`} x1={i * 120} y1={0} x2={i * 120} y2={2160} stroke="rgba(148,163,184,0.05)" strokeWidth={1.5} />
          ))}
          {Array.from({length: 19}, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 120} x2={3840} y2={i * 120} stroke="rgba(148,163,184,0.05)" strokeWidth={1.5} />
          ))}
        </g>
        <g transform={`translate(${sweepX}, 0) rotate(12)`} opacity={0.5}>
          <rect x={0} y={-600} width={260} height={3600} fill="rgba(110,231,183,0.026)" />
          <rect x={300} y={-600} width={60} height={3600} fill="rgba(110,231,183,0.05)" />
        </g>
        <rect x={0} y={0} width={3840} height={2160} fill="url(#beVignette)" />
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
          OPEN ENROLLMENT
        </span>
        <span
          style={{
            color: MINT,
            fontFamily: MONO,
            fontSize: 36,
            fontWeight: 700,
            border: `2px solid ${MINT}`,
            borderRadius: 10,
            padding: '6px 18px',
          }}
        >
          2027 PLAN YEAR
        </span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 34, marginTop: 14}}>
        Compare your health plans &middot; choose once &middot; covered all year
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Calendar: November 2026, days 1-15 highlight through the window
// ---------------------------------------------------------------------------
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const Calendar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inS = spring({frame: frame - 40, fps, config: {damping: 200, stiffness: 90}});
  const outT = interpolate(frame, [CAL_OUT, CAL_OUT + 60], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (inS <= 0.001 || outT <= 0) return null;

  const px = 1220;
  const py = 470;
  const pw = 1400;
  const ph = 980;
  const cellW = 168;
  const cellH = 118;
  const gx = 1920 - (7 * cellW) / 2; // 1332
  const gy = py + 250;

  const hlCount = interpolate(frame, [CAL_HL_START, CAL_HL_END], [0, 15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={Math.min(1, inS) * outT} transform={`translate(0, ${(1 - Math.min(1, inS)) * 60})`}>
        <rect x={px} y={py} width={pw} height={ph} rx={30} fill={PANEL} stroke={HAIRLINE} strokeWidth={2.5} />
        <text x={1920} y={py + 110} fill={INK} fontSize={64} fontFamily={FONT} fontWeight={800} letterSpacing={8} textAnchor="middle">
          NOVEMBER 2026
        </text>
        <text x={1920} y={py + 168} fill={MINT} fontSize={34} fontFamily={MONO} letterSpacing={5} textAnchor="middle">
          ENROLLMENT WINDOW
        </text>
        {/* weekday header */}
        {DOW.map((d, i) => (
          <text key={`dow${i}`} x={gx + i * cellW + cellW / 2} y={gy - 24} fill={MUTED} fontSize={30} fontFamily={MONO} fontWeight={700} textAnchor="middle">
            {d}
          </text>
        ))}
        {/* day cells: Nov 1 2026 is a Sunday -> column 0 */}
        {Array.from({length: 30}, (_, i) => {
          const day = i + 1;
          const col = i % 7;
          const row = Math.floor(i / 7);
          const cx = gx + col * cellW;
          const cy = gy + row * cellH;
          const hl = day <= hlCount;
          const is15 = day === 15;
          return (
            <g key={`day${day}`}>
              <rect
                x={cx + 6}
                y={cy + 6}
                width={cellW - 12}
                height={cellH - 12}
                rx={14}
                fill={hl ? 'rgba(110,231,183,0.20)' : 'rgba(20,16,43,0.5)'}
                stroke={is15 && hl ? MINT : 'rgba(148,163,184,0.20)'}
                strokeWidth={is15 && hl ? 4 : 2}
                style={is15 && hl ? {filter: 'drop-shadow(0 0 16px rgba(110,231,183,0.7))'} : undefined}
              />
              <text
                x={cx + cellW / 2}
                y={cy + cellH / 2 + 16}
                fill={hl ? MINT : 'rgba(178,170,214,0.75)'}
                fontSize={44}
                fontFamily={MONO}
                fontWeight={hl ? 800 : 400}
                textAnchor="middle"
              >
                {day}
              </text>
            </g>
          );
        })}
        {/* caption under grid */}
        <text x={1920} y={py + ph - 52} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="middle">
          Your current plan auto-renews if you take no action
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Plan cards that fan out with comparison bars
// ---------------------------------------------------------------------------
interface Plan {
  name: string;
  tag: string;
  premium: number;
  deductible: number;
  network: string;
  bars: {label: string; frac: number; text: string}[];
}
const PLANS: Plan[] = [
  {
    name: 'HMO',
    tag: 'LOWEST COST · PCP GATEKEEPER',
    premium: 320,
    deductible: 1000,
    network: 'LOCAL NETWORK',
    bars: [
      {label: 'MONTHLY PREMIUM', frac: 0.64, text: '$320'},
      {label: 'DEDUCTIBLE', frac: 0.29, text: '$1,000'},
      {label: 'NETWORK SIZE', frac: 0.42, text: 'LOCAL'},
    ],
  },
  {
    name: 'PPO',
    tag: 'MAX FLEXIBILITY · NO REFERRALS',
    premium: 465,
    deductible: 750,
    network: 'NATIONAL NETWORK',
    bars: [
      {label: 'MONTHLY PREMIUM', frac: 0.93, text: '$465'},
      {label: 'DEDUCTIBLE', frac: 0.21, text: '$750'},
      {label: 'NETWORK SIZE', frac: 1.0, text: 'NATIONAL'},
    ],
  },
  {
    name: 'HDHP',
    tag: 'LOW PREMIUM + HSA ELIGIBLE',
    premium: 210,
    deductible: 3500,
    network: 'NATIONAL + HSA',
    bars: [
      {label: 'MONTHLY PREMIUM', frac: 0.42, text: '$210'},
      {label: 'DEDUCTIBLE', frac: 1.0, text: '$3,500'},
      {label: 'NETWORK SIZE', frac: 0.9, text: 'NATIONAL'},
    ],
  },
];

const PlanCards: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const cardW = 880;
  const cardH = 1010;
  const gap = 130;
  const totalW = PLANS.length * cardW + (PLANS.length - 1) * gap;
  const x0 = (3840 - totalW) / 2;
  const y0 = 560;
  const chosenDim = interpolate(frame, [CHOOSE_AT, CHOOSE_AT + 50], [1, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const checkS = spring({frame: frame - CHOOSE_AT, fps, config: {damping: 12, stiffness: 150, mass: 1}});
  const enrollS = spring({frame: frame - (CHOOSE_AT + 25), fps, config: {damping: 200, stiffness: 110}});

  return (
    <div style={{position: 'absolute', top: 0, left: 0, width: 3840, height: 2160}}>
      {PLANS.map((p, i) => {
        const at = CARDS_START + i * CARD_STAGGER;
        const s = spring({frame: frame - at, fps, config: {damping: 200, stiffness: 85, mass: 1}});
        if (s <= 0.001) return null;
        const x = x0 + i * (cardW + gap);
        const isChosen = i === 1;
        const fanRot = (1 - Math.min(1, s)) * (i === 0 ? -14 : i === 2 ? 14 : 0);
        const dim = isChosen ? 1 : chosenDim;
        const barT = interpolate(frame, [at + 40, at + 110], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div
            key={p.name}
            style={{
              position: 'absolute',
              left: x,
              top: y0 + (1 - Math.min(1, s)) * 140,
              width: cardW,
              height: cardH,
              borderRadius: 30,
              background: 'linear-gradient(165deg, rgba(110,231,183,0.07), rgba(24,19,54,0.12) 55%)',
              border: `3px solid ${isChosen && frame >= CHOOSE_AT ? MINT : 'rgba(110,231,183,0.30)'}`,
              boxShadow: isChosen && frame >= CHOOSE_AT ? '0 0 60px rgba(110,231,183,0.35)' : 'none',
              opacity: Math.min(1, s) * dim,
              transform: `rotate(${fanRot}deg)`,
              transformOrigin: 'center 120%',
              padding: '52px 60px',
            }}
          >
            <div style={{color: MINT, fontFamily: MONO, fontSize: 30, letterSpacing: 8}}>{p.name}</div>
            <div style={{marginTop: 18}}>
              <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 118, textShadow: '0 0 28px rgba(110,231,183,0.35)'}}>
                ${p.premium}
              </span>
              <span style={{color: MUTED, fontFamily: MONO, fontSize: 36, marginLeft: 12}}>/ MO</span>
            </div>
            <div style={{color: MUTED, fontFamily: FONT, fontSize: 29, marginTop: 10, letterSpacing: 1}}>{p.tag}</div>
            <div style={{height: 2, background: 'rgba(110,231,183,0.25)', margin: '34px 0'}} />
            {p.bars.map((b) => (
              <div key={b.label} style={{marginBottom: 30}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                  <span style={{color: MUTED, fontFamily: MONO, fontSize: 27, letterSpacing: 2}}>{b.label}</span>
                  <span style={{color: INK, fontFamily: MONO, fontSize: 34, fontWeight: 700}}>{b.text}</span>
                </div>
                <div style={{height: 18, borderRadius: 9, background: 'rgba(148,163,184,0.16)', marginTop: 12, overflow: 'hidden'}}>
                  <div
                    style={{
                      width: `${b.frac * barT * 100}%`,
                      height: '100%',
                      borderRadius: 9,
                      background: 'linear-gradient(90deg, #34D399, #6EE7B7)',
                      boxShadow: barT > 0 ? '0 0 12px rgba(110,231,183,0.6)' : 'none',
                    }}
                  />
                </div>
              </div>
            ))}
            {/* ENROLLED ribbon on the chosen card */}
            {isChosen && enrollS > 0.001 && (
              <div
                style={{
                  position: 'absolute',
                  left: 60,
                  right: 60,
                  bottom: 56,
                  height: 96,
                  borderRadius: 18,
                  background: 'rgba(6,40,28,0.92)',
                  border: `3px solid ${MINT}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: Math.min(1, enrollS),
                  transform: `scale(${0.8 + 0.2 * Math.min(1, enrollS)})`,
                  boxShadow: '0 0 34px rgba(110,231,183,0.55)',
                }}
              >
                <span style={{color: MINT, fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: 10}}>
                  ENROLLED
                </span>
              </div>
            )}
            {/* check badge drops onto the chosen card */}
            {isChosen && checkS > 0.001 && (
              <div
                style={{
                  position: 'absolute',
                  left: cardW / 2 - 75,
                  top: -85 + (1 - Math.min(1.2, checkS)) * -160,
                  width: 150,
                  height: 150,
                  borderRadius: 75,
                  background: MINT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 44px rgba(110,231,183,0.8)',
                  opacity: Math.min(1, checkS),
                }}
              >
                <svg width={90} height={90} viewBox="0 0 90 90">
                  <path
                    d="M 18 47 L 38 67 L 72 24"
                    fill="none"
                    stroke="#0B2E22"
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - Math.min(1, (frame - CHOOSE_AT - 12) / 26)}
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Countdown ring: ENROLL BY NOV 15
// ---------------------------------------------------------------------------
const Countdown: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inS = spring({frame: frame - (RING_START - 30), fps, config: {damping: 200, stiffness: 100}});
  if (inS <= 0.001) return null;
  const cx = 1920;
  const cy = 1840;
  const r = 118;
  const circ = 2 * Math.PI * r;
  const daysLeft = Math.max(0, 15 - Math.floor(interpolate(frame, [RING_START, RING_END], [0, 15.999], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })));
  const urgent = daysLeft <= 5;
  const ringColor = urgent ? AMBER : MINT;
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.12);

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={Math.min(1, inS)}>
        <text x={cx} y={1652} fill={INK} fontSize={42} fontFamily={FONT} fontWeight={800} letterSpacing={8} textAnchor="middle">
          ENROLL BY <tspan fill={ringColor}>NOV 15</tspan>
        </text>
        <circle cx={cx} cy={cy} r={r} fill="rgba(24,19,54,0.85)" stroke="rgba(148,163,184,0.25)" strokeWidth={22} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={22}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - daysLeft / 15)}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{filter: `drop-shadow(0 0 ${14 + pulse * 10}px ${ringColor}99)`}}
        />
        <text x={cx} y={cy + 2} fill={INK} fontSize={88} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {daysLeft}
        </text>
        <text x={cx} y={cy + 52} fill={MUTED} fontSize={28} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
          DAYS LEFT
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [CHOOSE_AT + 50, CHOOSE_AT + 110], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: 'rgba(178,170,214,0.75)',
        fontFamily: FONT,
        fontSize: 30,
        opacity: fade,
      }}
    >
      Your 2027 coverage starts <span style={{color: MINT, fontWeight: 700}}>January 1</span> &middot; changes lock after the deadline
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const BenefitsOpenEnrollment: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <Calendar frame={frame} fps={fps} />
      <PlanCards frame={frame} fps={fps} />
      <Countdown frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default BenefitsOpenEnrollment;
