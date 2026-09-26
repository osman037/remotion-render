/**
 * StablecoinPaymentRail.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Animates a regulated payment-stablecoin transfer across four stages:
 * sender wallet -> on-chain transfer -> reserve backing -> merchant settlement,
 * with block-confirmation pips, a finality timer, reserve vault bars, a
 * drawn settlement check, a "SETTLED" stamp, traveling pipe packets, and
 * rail metrics. Palette: deep green-black, gold, emerald glow.
 *
 * Register in Root.tsx:
 *   <Composition id="StablecoinPaymentRail" component={StablecoinPaymentRail}
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
const BG = '#04100B';
const INK = '#EAF7EF';
const MUTED = 'rgba(186,214,198,0.62)';
const FAINT = 'rgba(186,214,198,0.34)';
const GOLD = '#FBBF24';
const GOLD_DIM = 'rgba(251,191,36,0.55)';
const EMERALD = '#34D399';
const EMERALD_DIM = 'rgba(52,211,153,0.55)';
const CARD_BG = 'rgba(6,22,15,0.72)';
const CARD_EDGE = 'rgba(52,211,153,0.22)';
const GRID_COLOR = 'rgba(52,211,153,0.07)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const INTRO_END = 120;      // intro
const BUILD_END = 600;      // build
const PAYOFF_END = 780;     // payoff
// 780 - 900: resolve / hold

const CARD_Y = 760;
const CARD_W = 660;
const CARD_H = 520;
const CARD_XS = [120, 1020, 1920, 2820];
const CARD_STARTS = [80, 140, 200, 260]; // staggered entrances

// ---------------------------------------------------------------------------
// Deterministic seeded random (never Math.random)
// ---------------------------------------------------------------------------
function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Static SVG defs (gradients / filters)
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#FDE68A" />
      <stop offset="55%" stopColor={GOLD} />
      <stop offset="100%" stopColor="#D97706" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#A7F3D0" />
      <stop offset="55%" stopColor={EMERALD} />
      <stop offset="100%" stopColor="#059669" />
    </linearGradient>
    <linearGradient id="cardSheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(52,211,153,0.12)" />
      <stop offset="35%" stopColor="rgba(52,211,153,0.03)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0.015)" />
    </linearGradient>
    <linearGradient id="barTrack" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="rgba(52,211,153,0.10)" />
      <stop offset="100%" stopColor="rgba(52,211,153,0.16)" />
    </linearGradient>
    <radialGradient id="bgGlow" cx="50%" cy="34%" r="75%">
      <stop offset="0%" stopColor="rgba(52,211,153,0.12)" />
      <stop offset="45%" stopColor="rgba(52,211,153,0.045)" />
      <stop offset="100%" stopColor="rgba(4,16,11,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="58%" stopColor="rgba(4,16,11,0)" />
      <stop offset="100%" stopColor="rgba(1,7,4,0.78)" />
    </radialGradient>
    <radialGradient id="payoffGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(251,191,36,0.28)" />
      <stop offset="60%" stopColor="rgba(251,191,36,0.08)" />
      <stop offset="100%" stopColor="rgba(251,191,36,0)" />
    </radialGradient>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="hardGlow" x="-120%" y="-120%" width="340%" height="340%">
      <feGaussianBlur stdDeviation="22" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: deep green-black + emerald glow + vignette + scan + particles
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 320)) % (2160 + 320) - 160;

  const particles = useMemo(() => {
    const rand = seededRand(20260926);
    return Array.from({length: 70}, (_, i) => ({
      x: rand() * 3840,
      y0: rand() * 2160,
      r: 1.2 + rand() * 3.2,
      speed: 0.25 + rand() * 0.65,
      gold: rand() > 0.72,
      tw: 0.5 + rand() * 2,
    }));
  }, []);

  // Gentle breathing in the resolve phase
  const breathe = interpolate(frame, [780, 900], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const breathGlow = 0.10 + breathe * 0.04 * (0.5 + 0.5 * Math.sin(frame * 0.08));

  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 30%, rgba(52,211,153,${breathGlow}), rgba(52,211,153,0.045) 45%, rgba(4,16,11,0) 75%)`,
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        {/* faint grid */}
        {Array.from({length: 25}, (_, i) => (
          <line
            key={`v${i}`}
            x1={160 * i}
            y1={0}
            x2={160 * i}
            y2={2160}
            stroke={GRID_COLOR}
            strokeWidth={1}
          />
        ))}
        {Array.from({length: 15}, (_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={150 * i}
            x2={3840}
            y2={150 * i}
            stroke={GRID_COLOR}
            strokeWidth={1}
          />
        ))}
        {/* drifting particles */}
        {particles.map((p, i) => {
          const y = (p.y0 + frame * p.speed) % 2160;
          const twinkle = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(frame * 0.05 + p.tw * 3));
          return (
            <circle
              key={`pt${i}`}
              cx={p.x}
              cy={y}
              r={p.r}
              fill={p.gold ? GOLD : EMERALD}
              opacity={twinkle * 0.7}
            />
          );
        })}
        {/* slow scan sweep */}
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(52,211,153,0.030)" />
        <line
          x1={0}
          y1={scanY}
          x2={3840}
          y2={scanY}
          stroke="rgba(52,211,153,0.10)"
          strokeWidth={1.5}
        />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title block (top-left)
// ---------------------------------------------------------------------------
const TitleBlock: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, 60], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ruleW = interpolate(frame, [20, 110], [0, 640], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 120 + rise,
        left: 120,
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
          textShadow: '0 0 40px rgba(52,211,153,0.25)',
        }}
      >
        STABLECOIN <span style={{color: GOLD}}>PAYMENT RAIL</span>
      </div>
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 34,
          marginTop: 18,
          letterSpacing: 1,
        }}
      >
        wallet &rarr; on-chain transfer &rarr; reserve backing &rarr; merchant
        settlement
      </div>
      <div
        style={{
          marginTop: 22,
          height: 3,
          width: ruleW,
          background: 'linear-gradient(90deg, #FBBF24, rgba(251,191,36,0))',
          borderRadius: 2,
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Top-right market stat card
// ---------------------------------------------------------------------------
const MarketCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - 40,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;
  const mkt = interpolate(frame, [60, 300], [280, 316], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 110,
        right: 120,
        width: 1180,
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 36}px)`,
      }}
    >
      <div
        style={{
          borderRadius: 26,
          background: CARD_BG,
          border: `1.5px solid ${CARD_EDGE}`,
          padding: '36px 48px',
        }}
      >
        <div
          style={{
            color: MUTED,
            fontFamily: MONO,
            fontSize: 28,
            letterSpacing: 4,
          }}
        >
          STABLECOIN MARKET CAPITALIZATION
        </div>
        <div
          style={{
            color: INK,
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 92,
            marginTop: 10,
            lineHeight: 1,
            textShadow: '0 0 30px rgba(52,211,153,0.35)',
          }}
        >
          &asymp; ${mkt.toFixed(0)}B
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 22}}>
          <span
            style={{
              color: GOLD,
              fontFamily: MONO,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 2,
              border: `2px solid ${GOLD_DIM}`,
              borderRadius: 999,
              padding: '10px 26px',
              background: 'rgba(251,191,36,0.06)',
            }}
          >
            GENIUS ACT &middot; JUL 2025
          </span>
          <span style={{color: FAINT, fontFamily: FONT, fontSize: 30}}>
            federal payment-stablecoin framework
          </span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Card shell (staggered spring entrance)
// ---------------------------------------------------------------------------
interface CardShellProps {
  frame: number;
  fps: number;
  x: number;
  start: number;
  kicker: string;
  children: React.ReactNode;
}
const CardShell: React.FC<CardShellProps> = ({
  frame,
  fps,
  x,
  start,
  kicker,
  children,
}) => {
  const s = spring({
    frame: frame - start,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: CARD_Y,
        width: CARD_W,
        height: CARD_H,
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 60}px) scale(${0.96 + s * 0.04})`,
        transformOrigin: 'center top',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 28,
          background: `linear-gradient(165deg, rgba(52,211,153,0.10), rgba(6,22,15,0.72) 55%), ${CARD_BG}`,
          border: `1.5px solid ${CARD_EDGE}`,
          padding: '44px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'url(#cardSheen)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            color: EMERALD,
            fontFamily: MONO,
            fontSize: 30,
            letterSpacing: 5,
            fontWeight: 700,
          }}
        >
          {kicker}
        </div>
        {children}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Card 1: sender wallet
// ---------------------------------------------------------------------------
const WalletCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const amount = interpolate(frame, [100, 560], [0, 1250], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rows = [
    {k: 'AVAILABLE', v: '$2,480.00'},
    {k: 'PENDING', v: '$0.00'},
    {k: 'NETWORK', v: 'EVM-COMPATIBLE L2'},
  ];
  return (
    <CardShell frame={frame} fps={fps} x={CARD_XS[0]} start={CARD_STARTS[0]} kicker="01 &middot; WALLET">
      <div
        style={{
          color: INK,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 46,
          marginTop: 18,
        }}
      >
        SENDER WALLET
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          marginTop: 20,
        }}
      >
        {/* wallet glyph */}
        <svg width={64} height={64} viewBox="0 0 64 64">
          <rect x={6} y={14} width={52} height={38} rx={9} fill="none" stroke={EMERALD} strokeWidth={3.5} />
          <rect x={36} y={28} width={20} height={14} rx={4} fill="rgba(52,211,153,0.25)" stroke={EMERALD} strokeWidth={2.5} />
          <circle cx={46} cy={35} r={3} fill={EMERALD} />
        </svg>
        <span style={{color: MUTED, fontFamily: MONO, fontSize: 38}}>
          0x7f3a&hellip;9c2e
        </span>
      </div>
      <div
        style={{
          color: GOLD,
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: 102,
          marginTop: 26,
          lineHeight: 1,
          textShadow: '0 0 36px rgba(251,191,36,0.40)',
        }}
      >
        ${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
      </div>
      <div style={{marginTop: 26}}>
        <span
          style={{
            color: GOLD,
            fontFamily: MONO,
            fontSize: 27,
            letterSpacing: 2,
            border: `1.5px solid ${GOLD_DIM}`,
            borderRadius: 999,
            padding: '10px 24px',
            background: 'rgba(251,191,36,0.07)',
          }}
        >
          PAYMENT STABLECOIN &middot; USD-PEGGED
        </span>
      </div>
      <div style={{marginTop: 30, display: 'flex', flexDirection: 'column', gap: 12}}>
        {rows.map((r) => (
          <div key={r.k} style={{display: 'flex', justifyContent: 'space-between'}}>
            <span style={{color: FAINT, fontFamily: MONO, fontSize: 29, letterSpacing: 2}}>
              {r.k}
            </span>
            <span style={{color: MUTED, fontFamily: MONO, fontSize: 29}}>{r.v}</span>
          </div>
        ))}
      </div>
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Card 2: on-chain transfer (confirmation pips + finality timer)
// ---------------------------------------------------------------------------
const PIPS = ['1/4', '2/4', '3/4', '4/4'];
const TransferCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const finality = interpolate(frame, [220, 440], [0, 4.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const confirmed = PIPS.filter(
    (_, i) =>
      interpolate(frame, [200 + i * 60, 240 + i * 60], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }) > 0.5
  ).length;
  return (
    <CardShell frame={frame} fps={fps} x={CARD_XS[1]} start={CARD_STARTS[1]} kicker="02 &middot; ON-CHAIN TRANSFER">
      <div
        style={{
          color: INK,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 46,
          marginTop: 18,
        }}
      >
        BLOCK CONFIRMATIONS
      </div>
      <svg width={564} height={150} style={{marginTop: 26}}>
        <Defs />
        {PIPS.map((label, i) => {
          const fill = interpolate(frame, [200 + i * 60, 250 + i * 60], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const cx = 60 + i * 148;
          return (
            <g key={label}>
              {i > 0 && (
                <line
                  x1={cx - 88}
                  y1={52}
                  x2={cx - 28}
                  y2={52}
                  stroke={EMERALD_DIM}
                  strokeWidth={3}
                  strokeDasharray="10 10"
                  opacity={0.5 + fill * 0.5}
                />
              )}
              <circle
                cx={cx}
                cy={52}
                r={34}
                fill={fill > 0.5 ? 'url(#goldGrad)' : 'rgba(251,191,36,0.05)'}
                stroke={GOLD}
                strokeWidth={3}
                style={fill > 0.5 ? {filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.7))'} : undefined}
                opacity={0.35 + fill * 0.65}
              />
              {fill > 0.5 && (
                <path
                  d={`M ${cx - 14} 52 l 10 10 l 20 -22`}
                  fill="none"
                  stroke="#04100B"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              <text
                x={cx}
                y={122}
                fill={fill > 0.5 ? GOLD : FAINT}
                fontSize={28}
                fontFamily={MONO}
                fontWeight={700}
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: 18,
        }}
      >
        <span style={{color: FAINT, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>
          FINALITY TIMER
        </span>
        <span
          style={{
            color: confirmed >= 4 ? EMERALD : GOLD,
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 88,
            textShadow: `0 0 30px ${confirmed >= 4 ? 'rgba(52,211,153,0.45)' : 'rgba(251,191,36,0.45)'}`,
          }}
        >
          {finality.toFixed(1)}s
        </span>
      </div>
      <div style={{marginTop: 20}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 33}}>
          tx <span style={{color: INK}}>0x9d21&hellip;44af</span>
        </div>
        <div
          style={{
            color: FAINT,
            fontFamily: MONO,
            fontSize: 28,
            marginTop: 12,
            letterSpacing: 1,
          }}
        >
          THROUGHPUT&nbsp;&nbsp;3,400 TPS &middot; GAS&nbsp;&nbsp;$0.0021
        </div>
      </div>
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Card 3: reserve backing (vault bars + attestation checklist)
// ---------------------------------------------------------------------------
const RESERVE_ROWS = [
  {label: 'T-BILLS', pct: 78, color: EMERALD},
  {label: 'CASH', pct: 22, color: GOLD},
];
const ReserveCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const barW = interpolate(frame, [280, 520], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const checks = [
    {text: 'MONTHLY ATTESTATION', at: 420},
    {text: 'REDEEMABLE AT PAR', at: 480},
  ];
  return (
    <CardShell frame={frame} fps={fps} x={CARD_XS[2]} start={CARD_STARTS[2]} kicker="03 &middot; RESERVE BACKING">
      <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 18}}>
        {/* vault glyph */}
        <svg width={70} height={70} viewBox="0 0 70 70">
          <rect x={10} y={8} width={50} height={54} rx={8} fill="none" stroke={EMERALD} strokeWidth={3.5} />
          <circle cx={35} cy={35} r={14} fill="none" stroke={EMERALD} strokeWidth={3.5} />
          <circle cx={35} cy={35} r={4} fill={EMERALD} />
          <line x1={35} y1={21} x2={35} y2={28} stroke={EMERALD} strokeWidth={3} />
          <line x1={35} y1={42} x2={35} y2={49} stroke={EMERALD} strokeWidth={3} />
          <line x1={21} y1={35} x2={28} y2={35} stroke={EMERALD} strokeWidth={3} />
          <line x1={42} y1={35} x2={49} y2={35} stroke={EMERALD} strokeWidth={3} />
        </svg>
        <span style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 46}}>
          RESERVE VAULT
        </span>
      </div>
      <div style={{marginTop: 28, display: 'flex', flexDirection: 'column', gap: 24}}>
        {RESERVE_ROWS.map((r) => (
          <div key={r.label}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>
                {r.label}
              </span>
              <span
                style={{
                  color: r.color,
                  fontFamily: MONO,
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                {Math.round(r.pct * barW)}%
              </span>
            </div>
            <div
              style={{
                height: 22,
                borderRadius: 11,
                background: 'rgba(52,211,153,0.10)',
                border: '1px solid rgba(52,211,153,0.18)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${r.pct * barW}%`,
                  borderRadius: 11,
                  background:
                    r.color === EMERALD
                      ? 'linear-gradient(90deg, #059669, #34D399)'
                      : 'linear-gradient(90deg, #D97706, #FBBF24)',
                  boxShadow: `0 0 18px ${r.color}66`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          color: EMERALD,
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: 72,
          marginTop: 28,
          textShadow: '0 0 30px rgba(52,211,153,0.45)',
        }}
      >
        1:1 RESERVES
      </div>
      <div style={{marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12}}>
        {checks.map((c) => {
          const s = spring({
            frame: frame - c.at,
            fps,
            config: {damping: 200, stiffness: 90},
          });
          if (s <= 0.001) return null;
          return (
            <div
              key={c.text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: Math.min(1, s),
                transform: `translateX(${(1 - s) * 26}px)`,
              }}
            >
              <span
                style={{
                  color: EMERALD,
                  fontFamily: MONO,
                  fontSize: 34,
                  fontWeight: 800,
                }}
              >
                &#10003;
              </span>
              <span style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>
                {c.text}
              </span>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Card 4: merchant settlement (drawn check + SETTLED stamp)
// ---------------------------------------------------------------------------
const MerchantCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const draw = interpolate(frame, [650, 760], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stamp = spring({
    frame: frame - 700,
    fps,
    config: {damping: 150, stiffness: 110},
  });
  const received = interpolate(frame, [640, 770], [0, 1250], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headerFade = interpolate(frame, [300, 360], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <CardShell frame={frame} fps={fps} x={CARD_XS[3]} start={CARD_STARTS[3]} kicker="04 &middot; MERCHANT SETTLEMENT">
      <div
        style={{
          color: INK,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 46,
          marginTop: 18,
          opacity: headerFade,
        }}
      >
        MERCHANT &mdash; SETTLED
      </div>
      <div style={{position: 'relative', height: 210, marginTop: 10}}>
        <svg width={564} height={210} style={{position: 'absolute', left: 0, top: 0}}>
          <Defs />
          {draw > 0 && (
            <g>
              <circle
                cx={282}
                cy={105}
                r={82}
                fill="none"
                stroke="url(#goldGrad)"
                strokeWidth={10}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - draw}
                strokeLinecap="round"
                style={{filter: 'drop-shadow(0 0 18px rgba(251,191,36,0.65))'}}
              />
              <path
                d="M 232 108 l 36 38 l 72 -84"
                fill="none"
                stroke="url(#goldGrad)"
                strokeWidth={14}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - Math.max(0, (draw - 0.35) / 0.65)}
                style={{filter: 'drop-shadow(0 0 14px rgba(251,191,36,0.7))'}}
              />
            </g>
          )}
        </svg>
        {stamp > 0.001 && (
          <div
            style={{
              position: 'absolute',
              left: 352,
              top: 38,
              transform: `rotate(-8deg) scale(${stamp})`,
              opacity: Math.min(1, stamp),
            }}
          >
            <span
              style={{
                color: GOLD,
                fontFamily: MONO,
                fontWeight: 800,
                fontSize: 52,
                letterSpacing: 10,
                border: `5px solid ${GOLD}`,
                borderRadius: 16,
                padding: '12px 34px 12px 44px',
                background: 'rgba(251,191,36,0.08)',
                textShadow: '0 0 24px rgba(251,191,36,0.6)',
                boxShadow: '0 0 34px rgba(251,191,36,0.25)',
              }}
            >
              SETTLED
            </span>
          </div>
        )}
      </div>
      <div
        style={{
          color: GOLD,
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: 76,
          marginTop: 8,
          textShadow: '0 0 30px rgba(251,191,36,0.40)',
        }}
      >
        ${received.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 32, marginTop: 8}}>
        received by merchant
      </div>
      <div style={{marginTop: 22}}>
        <span
          style={{
            color: EMERALD,
            fontFamily: MONO,
            fontSize: 28,
            letterSpacing: 2,
            border: `1.5px solid ${EMERALD_DIM}`,
            borderRadius: 999,
            padding: '10px 26px',
            background: 'rgba(52,211,153,0.07)',
          }}
        >
          SETTLED IN 4.2s &middot; FINAL
        </span>
      </div>
    </CardShell>
  );
};

// ---------------------------------------------------------------------------
// Connecting pipes with traveling glow packets (between the four cards)
// ---------------------------------------------------------------------------
const Pipes: React.FC<{frame: number}> = ({frame}) => {
  const railY = CARD_Y + CARD_H / 2; // 1020
  const gaps = [
    {x0: CARD_XS[0] + CARD_W, x1: CARD_XS[1]}, // 780 - 1020
    {x0: CARD_XS[1] + CARD_W, x1: CARD_XS[2]}, // 1680 - 1920
    {x0: CARD_XS[2] + CARD_W, x1: CARD_XS[3]}, // 2580 - 2820
  ];
  const drawRail = interpolate(frame, [140, 320], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const packets = [0, 1, 2];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      {gaps.map((g, gi) => {
        const w = g.x1 - g.x0;
        return (
          <g key={`pipe${gi}`} opacity={drawRail}>
            {/* rail track */}
            <line
              x1={g.x0}
              y1={railY - 26}
              x2={g.x1}
              y2={railY - 26}
              stroke="rgba(52,211,153,0.28)"
              strokeWidth={3}
            />
            <line
              x1={g.x0}
              y1={railY + 26}
              x2={g.x1}
              y2={railY + 26}
              stroke="rgba(52,211,153,0.28)"
              strokeWidth={3}
            />
            <line
              x1={g.x0}
              y1={railY}
              x2={g.x1}
              y2={railY}
              stroke="rgba(251,191,36,0.35)"
              strokeWidth={2}
              strokeDasharray="18 22"
              strokeDashoffset={-frame * 2.2}
            />
            {/* traveling packets */}
            {packets.map((pj) => {
              const local = (frame - 250 - pj * 140 - gi * 40) / 400;
              if (local < 0 || local > 1) return null;
              const px = g.x0 + local * w;
              return (
                <g key={`pkt${gi}${pj}`}>
                  <circle
                    cx={px}
                    cy={railY}
                    r={26}
                    fill="rgba(251,191,36,0.28)"
                    filter="url(#hardGlow)"
                  />
                  <circle cx={px} cy={railY} r={11} fill="url(#goldGrad)" />
                  <text
                    x={px}
                    y={railY - 52}
                    fill={GOLD}
                    fontSize={26}
                    fontFamily={MONO}
                    fontWeight={700}
                    textAnchor="middle"
                  >
                    $1,250
                  </text>
                </g>
              );
            })}
            {/* stage direction arrows */}
            <path
              d={`M ${g.x1 - 34} ${railY - 12} l 22 12 l -22 12`}
              fill="none"
              stroke={EMERALD_DIM}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Bottom rail-metrics strip
// ---------------------------------------------------------------------------
const METRICS = [
  {label: 'MEDIAN FEE', prefix: '$', to: 0.01, decimals: 2, sub: 'per transfer'},
  {label: 'FINALITY', prefix: '~', to: 4.2, decimals: 1, suffix: 's', sub: 'block confirmation'},
  {label: 'UPTIME', prefix: '', to: 99.99, decimals: 2, suffix: '%', sub: 'rolling 12 months'},
];
const MetricsStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const y = 1470;
  const stripFade = interpolate(frame, [420, 500], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (stripFade <= 0) return null;
  const labelFade = interpolate(frame, [420, 470], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: 120,
        width: 3600,
        opacity: stripFade,
      }}
    >
      <div
        style={{
          color: EMERALD,
          fontFamily: MONO,
          fontSize: 34,
          letterSpacing: 8,
          fontWeight: 700,
          opacity: labelFade,
        }}
      >
        RAIL METRICS
      </div>
      <div style={{display: 'flex', gap: 90, marginTop: 30}}>
        {METRICS.map((m, k) => {
          const s = spring({
            frame: frame - (470 + k * 40),
            fps,
            config: {damping: 200, stiffness: 90},
          });
          const val = interpolate(frame, [470 + k * 40, 700 + k * 40], [0, m.to], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const formatted = val.toLocaleString('en-US', {
            minimumFractionDigits: m.decimals,
            maximumFractionDigits: m.decimals,
          });
          return (
            <div
              key={m.label}
              style={{
                flex: 1,
                borderRadius: 22,
                background: CARD_BG,
                border: `1.5px solid ${CARD_EDGE}`,
                padding: '34px 48px 30px',
                opacity: Math.min(1, s),
                transform: `translateY(${(1 - s) * 40}px)`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{color: FAINT, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>
                  {m.label}
                </span>
                {/* tick marks */}
                <span style={{color: 'rgba(52,211,153,0.35)', fontFamily: MONO, fontSize: 24}}>
                  |||||||
                </span>
              </div>
              <div
                style={{
                  color: INK,
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: 92,
                  marginTop: 8,
                  lineHeight: 1.05,
                  textShadow: '0 0 30px rgba(52,211,153,0.35)',
                }}
              >
                {m.prefix}
                {formatted}
                {m.suffix ?? ''}
              </div>
              <div style={{color: MUTED, fontFamily: FONT, fontSize: 29, marginTop: 10}}>
                {m.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payoff glow behind card 4 (settlement flash)
// ---------------------------------------------------------------------------
const PayoffGlow: React.FC<{frame: number}> = ({frame}) => {
  const flash = interpolate(frame, [650, 720, 820], [0, 1, 0.35], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (flash <= 0) return null;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      <rect
        x={CARD_XS[3] - 180}
        y={CARD_Y - 180}
        width={CARD_W + 360}
        height={CARD_H + 360}
        fill="url(#payoffGlow)"
        opacity={flash}
      />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Footer note
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [560, 640], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 64,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: FAINT,
        fontFamily: FONT,
        fontSize: 28,
        opacity: fade,
        padding: '0 420px',
        lineHeight: 1.5,
      }}
    >
      Payment stablecoins: 1:1 reserve backing with monthly attestations under
      the GENIUS Act framework.
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const StablecoinPaymentRail: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBlock frame={frame} />
      <MarketCard frame={frame} fps={fps} />
      <Pipes frame={frame} />
      <WalletCard frame={frame} fps={fps} />
      <TransferCard frame={frame} fps={fps} />
      <ReserveCard frame={frame} fps={fps} />
      <PayoffGlow frame={frame} />
      <MerchantCard frame={frame} fps={fps} />
      <MetricsStrip frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default StablecoinPaymentRail;
