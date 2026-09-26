/**
 * CBAMCertificateFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * EU Carbon Border Adjustment Mechanism (CBAM) certificate surrender flow:
 * a five-stage pipeline explainer - importer declaration, embedded emissions
 * calculation, certificate purchase on the EU ETS price index, the annual
 * 31 May surrender, and verified completion - with travelling data packets,
 * a live price ticker, count-up counters and a stamped surrender payoff.
 *
 * Register in Root.tsx:
 *   <Composition id="CBAMCertificateFlow" component={CBAMCertificateFlow}
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
const BG = '#080C14';
const INK = '#EDF2F7';
const MUTED = 'rgba(203,213,225,0.62)';
const FAINT = 'rgba(148,163,184,0.42)';
const AMBER = '#FBBF24';
const TEAL = '#2DD4BF';
const GRID_COLOR = 'rgba(148,163,184,0.07)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
//   0-120   intro      | 120-600 build | 600-780 payoff | 780-900 resolve
// ---------------------------------------------------------------------------
const CARD_START = [80, 135, 190, 245, 300];
const RING_START = 180;
const RING_END = 600;
const CERT_START = 260;
const CERT_END = 520;
const COST_START = 300;
const COST_END = 560;
const EMISS_START = 180;
const EMISS_END = 440;
const STAMP_START = 660;
const CHECK_START = 660;
const CHECK_END = 790;
const RESOLVE_START = 780;

// ---------------------------------------------------------------------------
// Data model (concrete, deterministic)
// ---------------------------------------------------------------------------
const GOODS = ['CEMENT', 'STEEL', 'ALUMINIUM', 'FERTILISER', 'ELECTRICITY', 'HYDROGEN'];
const IMPORT_T = 12400;
const EMISSION_FACTOR = 1.85; // tCO2/t
const TOTAL_EMISSIONS = 22940; // tCO2e  (12400 x 1.85)
const CERT_PRICE = 75.4; // EUR / tCO2
const TOTAL_COST = 1729676; // EUR (22940 x 75.40)
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

// Deterministic seeded random (mulberry32) - never Math.random()
function seededRand(seed: number): number {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// EU ETS index price ticker: base EUR 75.40 with tiny deterministic wobble (+-0.8)
const tickerPrice = (frame: number) =>
  CERT_PRICE +
  0.8 *
    Math.sin(frame * 0.061 + 1.3) *
    Math.sin(frame * 0.017 + 0.5) *
    Math.cos(frame * 0.011 + 2.1);

// ---------------------------------------------------------------------------
// Pipeline geometry (device px, 4K)
// ---------------------------------------------------------------------------
const CARD_W = 620;
const CARD_H = 460;
const CARD_Y = 820;
const CARD_X = [90, 850, 1610, 2370, 3130];
const PIPE_Y = CARD_Y + CARD_H / 2; // 1050
const PIPES: [number, number][] = [
  [CARD_X[0] + CARD_W, CARD_X[1]],
  [CARD_X[1] + CARD_W, CARD_X[2]],
  [CARD_X[2] + CARD_W, CARD_X[3]],
  [CARD_X[3] + CARD_W, CARD_X[4]],
];

// ---------------------------------------------------------------------------
// Static SVG defs (gradients / filters / clip paths)
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlowAmber" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={'rgba(251,191,36,0.14)'} />
      <stop offset="55%" stopColor={'rgba(251,191,36,0.04)'} />
      <stop offset="100%" stopColor={'rgba(8,12,20,0)'} />
    </radialGradient>
    <radialGradient id="bgGlowTeal" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={'rgba(45,212,191,0.12)'} />
      <stop offset="55%" stopColor={'rgba(45,212,191,0.035)'} />
      <stop offset="100%" stopColor={'rgba(8,12,20,0)'} />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="58%" stopColor={'rgba(8,12,20,0)'} />
      <stop offset="100%" stopColor={'rgba(2,4,8,0.74)'} />
    </radialGradient>
    <linearGradient id="cardSheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={'rgba(255,255,255,0.055)'} />
      <stop offset="45%" stopColor={'rgba(255,255,255,0.012)'} />
      <stop offset="100%" stopColor={'rgba(255,255,255,0)'} />
    </linearGradient>
    <linearGradient id="barFill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={TEAL} />
      <stop offset="60%" stopColor={AMBER} />
      <stop offset="100%" stopColor={AMBER} />
    </linearGradient>
    <radialGradient id="packetGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={'rgba(251,191,36,0.95)'} />
      <stop offset="35%" stopColor={'rgba(251,191,36,0.35)'} />
      <stop offset="100%" stopColor={'rgba(251,191,36,0)'} />
    </radialGradient>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="tightGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: dark base + radial glows + vignette + scan sweep + hairlines
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 320)) % (2160 + 320) - 160;
  const drift = (frame * 0.28) % 220;
  const hairlines = useMemo(
    () =>
      Array.from({length: 10}, (_, i) => ({
        baseY: 180 + i * 205,
        x1: 120 + seededRand(i * 7 + 1) * 500,
        x2: 3840 - 120 - seededRand(i * 13 + 4) * 600,
      })),
    []
  );
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#bgGlowAmber)" opacity={0.9}
          transform="translate(-900,-500) scale(1.4)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#bgGlowTeal)" opacity={0.85}
          transform="translate(900,500) scale(1.5)" />
        {/* drifting hairline texture */}
        <g stroke={GRID_COLOR} strokeWidth={1.5}>
          {hairlines.map((h, i) => {
            const y = (h.baseY + drift) % 2160;
            return (
              <line key={i} x1={h.x1} y1={y} x2={h.x2} y2={y} />
            );
          })}
        </g>
        {/* faint vertical rule markers */}
        <g stroke={'rgba(148,163,184,0.10)'} strokeWidth={1.5}>
          {[640, 1280, 1920, 2560, 3200].map((x) => (
            <g key={x}>
              <line x1={x} y1={0} x2={x} y2={2160} />
              {[0, 1, 2, 3, 4].map((t) => (
                <line key={t} x1={x - 12} y1={t * 540} x2={x + 12} y2={t * 540} />
              ))}
            </g>
          ))}
        </g>
        {/* slow scan sweep */}
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(45,212,191,0.028)" />
        <rect x={0} y={scanY - 4} width={3840} height={8} fill="rgba(45,212,191,0.10)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar (top-left, 0-60)
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, 45], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 108 + rise,
        left: 90,
        opacity: fade,
      }}
    >
      <div
        style={{
          color: INK,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 84,
          letterSpacing: -1.5,
          textShadow: '0 2px 30px rgba(0,0,0,0.6)',
        }}
      >
        CBAM CERTIFICATE SURRENDER
      </div>
      <div
        style={{
          color: MUTED,
          fontFamily: FONT,
          fontSize: 34,
          marginTop: 16,
          letterSpacing: 0.4,
        }}
      >
        EU carbon border adjustment mechanism &mdash; definitive phase from 1 Jan 2026
      </div>
      <div
        style={{
          marginTop: 26,
          width: 320,
          height: 5,
          background: `linear-gradient(90deg, ${AMBER}, ${TEAL})`,
          borderRadius: 3,
          boxShadow: `0 0 18px rgba(251,191,36,0.55)`,
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Top-right annotation card: 2026 phase-in factor
// ---------------------------------------------------------------------------
const PhaseInCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - 140,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 96 + (1 - s) * 44,
        left: 2680,
        width: 1070,
        borderRadius: 24,
        background: 'linear-gradient(160deg, rgba(45,212,191,0.10), rgba(45,212,191,0.015) 65%, rgba(255,255,255,0.01))',
        border: '1.5px solid rgba(45,212,191,0.45)',
        boxShadow: '0 0 44px rgba(45,212,191,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
        padding: '36px 46px',
        opacity: Math.min(1, s),
      }}
    >
      <div
        style={{
          color: TEAL,
          fontFamily: MONO,
          fontSize: 30,
          letterSpacing: 4,
        }}
      >
        2026 PHASE-IN FACTOR
      </div>
      <div
        style={{
          color: INK,
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: 96,
          lineHeight: 1.05,
          marginTop: 8,
          textShadow: '0 0 30px rgba(45,212,191,0.45)',
        }}
      >
        2.5%
      </div>
      <div
        style={{
          color: MUTED,
          fontFamily: FONT,
          fontSize: 28,
          marginTop: 10,
          lineHeight: 1.4,
        }}
      >
        share of embedded emissions covered in the first definitive year
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Connecting pipes: animated dashes + travelling glow packets
// ---------------------------------------------------------------------------
const PipesLayer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [200, 280], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (fade <= 0) return null;

  // build-phase packets: staggered journeys during 250-650
  const buildPackets: {x: number; y: number; a: number}[] = [];
  PIPES.forEach(([x0, x1], s) => {
    for (let k = 0; k < 3; k++) {
      const start = 250 + s * 38 + k * 82;
      const t = (frame - start) / 175;
      if (t > 0 && t < 1) {
        const e = t * t * (3 - 2 * t); // smoothstep
        buildPackets.push({x: x0 + (x1 - x0) * e, y: PIPE_Y, a: 1});
      }
    }
  });

  // resolve-phase packets: slow continuous flow
  const resolvePackets: {x: number; y: number; a: number}[] = [];
  if (frame >= RESOLVE_START) {
    PIPES.forEach(([x0, x1], s) => {
      for (let k = 0; k < 2; k++) {
        const t = (((frame - RESOLVE_START) / 340 + k / 2 + s * 0.17) % 1 + 1) % 1;
        resolvePackets.push({x: x0 + (x1 - x0) * t, y: PIPE_Y, a: 0.55});
      }
    });
  }

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      <g opacity={fade}>
        {PIPES.map(([x0, x1], i) => (
          <g key={i}>
            {/* track */}
            <line
              x1={x0}
              y1={PIPE_Y}
              x2={x1}
              y2={PIPE_Y}
              stroke={'rgba(148,163,184,0.25)'}
              strokeWidth={3}
            />
            {/* moving dashes */}
            <line
              x1={x0}
              y1={PIPE_Y}
              x2={x1}
              y2={PIPE_Y}
              stroke={i % 2 === 0 ? AMBER : TEAL}
              strokeWidth={4}
              strokeDasharray="26 34"
              strokeDashoffset={-frame * 2.2}
              strokeLinecap="round"
              opacity={0.85}
              style={{filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))'}}
            />
            {/* node dots at both ends */}
            <circle cx={x0} cy={PIPE_Y} r={10} fill={BG} stroke={AMBER} strokeWidth={3} />
            <circle cx={x1} cy={PIPE_Y} r={10} fill={BG} stroke={TEAL} strokeWidth={3} />
          </g>
        ))}
        {/* packets */}
        {buildPackets.map((p, i) => (
          <g key={`b${i}`} opacity={p.a}>
            <circle cx={p.x} cy={p.y} r={30} fill="url(#packetGlow)" />
            <circle cx={p.x} cy={p.y} r={10} fill={'#FFF7E0'}
              style={{filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.9))'}} />
          </g>
        ))}
        {resolvePackets.map((p, i) => (
          <g key={`r${i}`} opacity={p.a}>
            <circle cx={p.x} cy={p.y} r={26} fill="url(#packetGlow)" />
            <circle cx={p.x} cy={p.y} r={8} fill={'#FFF7E0'}
              style={{filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.8))'}} />
          </g>
        ))}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Stage card shell with spring entrance
// ---------------------------------------------------------------------------
interface CardShellProps {
  frame: number;
  fps: number;
  index: number;
  accent: string;
  children: React.ReactNode;
}
const CardShell: React.FC<CardShellProps> = ({frame, fps, index, accent, children}) => {
  const s = spring({
    frame: frame - CARD_START[index],
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: CARD_X[index],
        top: CARD_Y + (1 - s) * 64,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 24,
        background:
          'linear-gradient(165deg, rgba(20,28,44,0.96), rgba(10,15,26,0.96))',
        border: `1.5px solid ${accent}88`,
        boxShadow: `0 0 52px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.09)`,
        opacity: Math.min(1, s),
        overflow: 'hidden',
      }}
    >
      <svg width={CARD_W} height={150} style={{position: 'absolute', top: 0, left: 0}}>
        <rect x={0} y={0} width={CARD_W} height={150} fill="url(#cardSheen)" />
      </svg>
      {children}
    </div>
  );
};

const CardLabel: React.FC<{text: string; accent: string}> = ({text, accent}) => (
  <div
    style={{
      color: accent,
      fontFamily: MONO,
      fontSize: 30,
      letterSpacing: 5,
      fontWeight: 700,
      textShadow: `0 0 14px ${accent}55`,
    }}
  >
    {text}
  </div>
);

// ---------------------------------------------------------------------------
// Card 1 - IMPORTER
// ---------------------------------------------------------------------------
const CardImporter: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  return (
    <CardShell frame={frame} fps={fps} index={0} accent={AMBER}>
      <div style={{padding: '40px 44px'}}>
        <CardLabel text="01 · IMPORTER" accent={AMBER} />
        <div style={{marginTop: 26, display: 'flex'}}>
          <span
            style={{
              color: TEAL,
              fontFamily: MONO,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 2,
              border: `1.5px solid ${TEAL}66`,
              borderRadius: 12,
              padding: '10px 20px',
              background: 'rgba(45,212,191,0.08)',
            }}
          >
            EU AUTHORISED DECLARANT
          </span>
        </div>
        <div
          style={{
            marginTop: 30,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          {GOODS.map((g, i) => {
            const cs = spring({
              frame: frame - (150 + i * 38),
              fps,
              config: {damping: 200, stiffness: 110},
            });
            return (
              <div
                key={g}
                style={{
                  opacity: Math.min(1, cs),
                  transform: `translateY(${(1 - cs) * 18}px)`,
                  color: INK,
                  fontFamily: MONO,
                  fontSize: 26,
                  letterSpacing: 1.5,
                  border: '1px solid rgba(148,163,184,0.35)',
                  borderRadius: 10,
                  padding: '14px 18px',
                  background: 'rgba(148,163,184,0.05)',
                  textAlign: 'center',
                }}
              >
                {g}
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 32,
            color: MUTED,
            fontFamily: MONO,
            fontSize: 28,
          }}
        >
          import:{' '}
          <span style={{color: INK, fontWeight: 700}}>{fmt(IMPORT_T)} t steel</span>
        </div>
      </div>
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Card 2 - EMBEDDED EMISSIONS (formula -> count-up result)
// ---------------------------------------------------------------------------
const CardEmissions: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const formulaFade = interpolate(frame, [EMISS_START - 40, EMISS_START], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const counted = interpolate(frame, [EMISS_START, EMISS_END], [0, TOTAL_EMISSIONS], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <CardShell frame={frame} fps={fps} index={1} accent={TEAL}>
      <div style={{padding: '40px 44px'}}>
        <CardLabel text="02 · EMBEDDED EMISSIONS" accent={TEAL} />
        <div style={{marginTop: 34, opacity: formulaFade}}>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>
            ACTUAL EMBEDDED INTENSITY
          </div>
          <div
            style={{
              color: INK,
              fontFamily: MONO,
              fontSize: 40,
              fontWeight: 700,
              marginTop: 14,
            }}
          >
            {fmt(IMPORT_T)} t &times; {EMISSION_FACTOR} tCO&#8322;/t
          </div>
          <div
            style={{
              marginTop: 22,
              height: 2,
              background: 'rgba(148,163,184,0.25)',
            }}
          />
        </div>
        <div style={{marginTop: 30, opacity: formulaFade}}>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>
            TOTAL EMBEDDED EMISSIONS
          </div>
          <div
            style={{
              color: AMBER,
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 72,
              marginTop: 10,
              textShadow: '0 0 34px rgba(251,191,36,0.55)',
              lineHeight: 1.1,
            }}
          >
            {fmt(counted)} <span style={{fontSize: 44}}>tCO&#8322;e</span>
          </div>
        </div>
        <div
          style={{
            marginTop: 30,
            color: MUTED,
            fontFamily: FONT,
            fontSize: 26,
            opacity: formulaFade,
          }}
        >
          <span style={{color: TEAL, marginRight: 12}}>&#10003;</span>
          verified installation data
        </div>
      </div>
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Card 3 - CERTIFICATE PURCHASE (ticker + counters)
// ---------------------------------------------------------------------------
const CardPurchase: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const price = tickerPrice(frame);
  const certs = interpolate(frame, [CERT_START, CERT_END], [0, TOTAL_EMISSIONS], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cost = interpolate(frame, [COST_START, COST_END], [0, TOTAL_COST], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const driftDir = Math.sin(frame * 0.061 + 1.3) * Math.cos(frame * 0.011 + 2.1) >= 0;
  return (
    <CardShell frame={frame} fps={fps} index={2} accent={AMBER}>
      <div style={{padding: '40px 44px'}}>
        <CardLabel text="03 · CERTIFICATE PURCHASE" accent={AMBER} />
        <div style={{marginTop: 28}}>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>
            EU ETS INDEX PRICE
          </div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 8}}>
            <span
              style={{
                color: TEAL,
                fontFamily: MONO,
                fontWeight: 800,
                fontSize: 54,
                textShadow: '0 0 26px rgba(45,212,191,0.5)',
              }}
            >
              &euro;{price.toFixed(2)}
            </span>
            <span style={{color: MUTED, fontFamily: MONO, fontSize: 28}}>/ tCO&#8322;</span>
            <span
              style={{
                color: driftDir ? '#34D399' : '#F87171',
                fontFamily: MONO,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {driftDir ? '\u25B2' : '\u25BC'} &plusmn;0.80
            </span>
          </div>
        </div>
        <div style={{marginTop: 26}}>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>
            CERTIFICATES
          </div>
          <div
            style={{
              color: INK,
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 58,
              marginTop: 6,
            }}
          >
            {fmt(certs)}
          </div>
        </div>
        <div style={{marginTop: 22}}>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>
            TOTAL COST
          </div>
          <div
            style={{
              color: AMBER,
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 66,
              marginTop: 6,
              textShadow: '0 0 32px rgba(251,191,36,0.55)',
            }}
          >
            &euro;{fmt(cost)}
          </div>
        </div>
      </div>
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Card 4 - ANNUAL SURRENDER (ring + deadline chip + stamped at payoff)
// ---------------------------------------------------------------------------
const CardSurrender: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const R = 74;
  const CIRC = 2 * Math.PI * R;
  const prog = interpolate(frame, [RING_START, RING_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <CardShell frame={frame} fps={fps} index={3} accent={TEAL}>
      <div style={{padding: '40px 44px'}}>
        <CardLabel text="04 · ANNUAL SURRENDER" accent={TEAL} />
        <div style={{marginTop: 26, display: 'flex'}}>
          <span
            style={{
              color: AMBER,
              fontFamily: MONO,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
              border: `1.5px solid ${AMBER}77`,
              borderRadius: 12,
              padding: '12px 22px',
              background: 'rgba(251,191,36,0.08)',
            }}
          >
            31 MAY &mdash; SURRENDER DEADLINE
          </span>
        </div>
        <div style={{marginTop: 26, display: 'flex', alignItems: 'center', gap: 30}}>
          <svg width={190} height={190}>
            <circle cx={95} cy={95} r={R} fill="none" stroke={'rgba(148,163,184,0.2)'} strokeWidth={14} />
            <circle
              cx={95}
              cy={95}
              r={R}
              fill="none"
              stroke={TEAL}
              strokeWidth={14}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - prog}
              transform="rotate(-90 95 95)"
              style={{filter: 'drop-shadow(0 0 10px rgba(45,212,191,0.6))'}}
            />
            <text
              x={95}
              y={95}
              fill={INK}
              fontSize={40}
              fontFamily={MONO}
              fontWeight={800}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {Math.round(prog * 100)}%
            </text>
          </svg>
          <div>
            <div style={{color: FAINT, fontFamily: MONO, fontSize: 24, letterSpacing: 3}}>
              REGISTRY ACCOUNT
            </div>
            <div style={{color: INK, fontFamily: MONO, fontSize: 32, fontWeight: 700, marginTop: 8}}>
              EU-CBAM-88412
            </div>
            <div style={{color: FAINT, fontFamily: MONO, fontSize: 24, letterSpacing: 3, marginTop: 22}}>
              REPORTING YEAR
            </div>
            <div style={{color: INK, fontFamily: MONO, fontSize: 32, fontWeight: 700, marginTop: 8}}>
              2026
            </div>
          </div>
        </div>
      </div>
      <SurrenderStamp frame={frame} fps={fps} />
    </CardShell>
  );
};

// "SURRENDERED" stamp slamming onto card 4 at payoff
const SurrenderStamp: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - STAMP_START,
    fps,
    config: {damping: 105, stiffness: 170, mass: 1.2},
  });
  if (s <= 0.001) return null;
  const scale = interpolate(s, [0, 1], [2.6, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        top: 150,
        width: 440,
        height: 168,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: Math.min(1, s),
        transform: `rotate(-12deg) scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      <div
        style={{
          border: `7px solid rgba(251,191,36,0.92)`,
          outline: '3px solid rgba(251,191,36,0.92)',
          outlineOffset: '-22px',
          borderRadius: 14,
          padding: '30px 44px',
          background: 'rgba(8,12,20,0.35)',
          boxShadow: '0 0 60px rgba(251,191,36,0.35)',
        }}
      >
        <span
          style={{
            color: AMBER,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 58,
            letterSpacing: 10,
            textShadow: '0 0 24px rgba(251,191,36,0.6)',
          }}
        >
          SURRENDERED
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Card 5 - VERIFIED (drawn check badge)
// ---------------------------------------------------------------------------
const CardVerified: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const circleDraw = interpolate(frame, [CHECK_START, CHECK_START + 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const checkDraw = interpolate(frame, [CHECK_START + 40, CHECK_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const breath =
    frame >= RESOLVE_START ? 0.55 + 0.45 * Math.sin((frame - RESOLVE_START) * 0.05) : 1;
  return (
    <CardShell frame={frame} fps={fps} index={4} accent={AMBER}>
      <div style={{padding: '40px 44px', textAlign: 'center'}}>
        <div style={{textAlign: 'left'}}>
          <CardLabel text="05 · VERIFIED" accent={AMBER} />
        </div>
        <svg width={300} height={260} style={{marginTop: 14}}>
          <circle
            cx={150}
            cy={118}
            r={96}
            fill="none"
            stroke={TEAL}
            strokeWidth={11}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - circleDraw}
            strokeLinecap="round"
            opacity={0.4 + 0.6 * circleDraw * breath}
            style={{filter: 'drop-shadow(0 0 16px rgba(45,212,191,0.7))'}}
          />
          <path
            d="M 102 118 L 140 158 L 202 84"
            fill="none"
            stroke={TEAL}
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - checkDraw}
            opacity={checkDraw}
            style={{filter: 'drop-shadow(0 0 18px rgba(45,212,191,0.85))'}}
          />
          {checkDraw > 0.9 && (
            <circle cx={150} cy={118} r={112} fill="none" stroke={TEAL} strokeWidth={2}
              opacity={0.35 * breath} />
          )}
        </svg>
        <div
          style={{
            color: INK,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 42,
            letterSpacing: 1,
            marginTop: 6,
            opacity: checkDraw,
            textShadow: '0 0 22px rgba(45,212,191,0.4)',
          }}
        >
          SURRENDER COMPLETE
        </div>
        <div
          style={{
            color: MUTED,
            fontFamily: MONO,
            fontSize: 26,
            marginTop: 12,
            opacity: checkDraw,
          }}
        >
          {fmt(TOTAL_EMISSIONS)} certificates &middot; &euro;{fmt(TOTAL_COST)}
        </div>
      </div>
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Bottom cost accumulator bar (syncs with card 3 counters)
// ---------------------------------------------------------------------------
const CostAccumulator: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - 220,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;
  const cost = interpolate(frame, [COST_START, COST_END], [0, TOTAL_COST], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fillW = (3660 - 0) * (cost / TOTAL_COST);
  const ticks = useMemo(() => Array.from({length: 11}, (_, i) => i), []);
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        top: 1450,
        width: 3660,
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 30}px)`,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <div style={{color: FAINT, fontFamily: MONO, fontSize: 28, letterSpacing: 5}}>
          COST ACCRUES &middot; LIVE
        </div>
        <div
          style={{
            color: AMBER,
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 60,
            textShadow: '0 0 28px rgba(251,191,36,0.5)',
          }}
        >
          &euro;{fmt(cost)}
        </div>
      </div>
      <div style={{position: 'relative', marginTop: 18, height: 40}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 3660,
            height: 26,
            borderRadius: 13,
            background: 'rgba(148,163,184,0.12)',
            border: '1px solid rgba(148,163,184,0.25)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: Math.max(0, fillW),
            height: 26,
            borderRadius: 13,
            boxShadow: '0 0 26px rgba(251,191,36,0.45)',
          }}
        />
        <svg width={3660} height={40} style={{position: 'absolute', top: 0, left: 0}}>
          <Defs />
          <rect x={0} y={0} width={Math.max(0, fillW)} height={26} rx={13} fill="url(#barFill)"
            style={{filter: 'drop-shadow(0 0 22px rgba(251,191,36,0.45))'}} />
          {ticks.map((t) => (
            <line
              key={t}
              x1={(t / 10) * 3660}
              y1={26}
              x2={(t / 10) * 3660}
              y2={40}
              stroke={'rgba(148,163,184,0.4)'}
              strokeWidth={1.5}
            />
          ))}
        </svg>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 10,
          color: FAINT,
          fontFamily: MONO,
          fontSize: 24,
        }}
      >
        <span>&euro;0</span>
        <span>&euro;{fmt(TOTAL_COST / 2)} &middot; 50%</span>
        <span>&euro;{fmt(TOTAL_COST)}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Footer note
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [700, 780], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 54,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: 'rgba(148,163,184,0.55)',
        fontFamily: FONT,
        fontSize: 26,
        letterSpacing: 0.5,
        opacity: fade,
      }}
    >
      Certificates priced off EU ETS allowance averages &middot; annual surrender by 31 May &middot; penalties for shortfall.
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const CBAMCertificateFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <PhaseInCard frame={frame} fps={fps} />
      <PipesLayer frame={frame} />
      <CardImporter frame={frame} fps={fps} />
      <CardEmissions frame={frame} fps={fps} />
      <CardPurchase frame={frame} fps={fps} />
      <CardSurrender frame={frame} fps={fps} />
      <CardVerified frame={frame} fps={fps} />
      <CostAccumulator frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default CBAMCertificateFlow;
