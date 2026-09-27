/**
 * InsurancePremiumDeductible.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * How a deductible works, in clinical teal/slate on deep blue: monthly $420
 * premium payments flow from a member figure into a shared risk pool, claim
 * events fill the $1,500 deductible bar one by one, the remaining $8,500 of a
 * $10,000 medical bill splits into a you-pay vs plan-pays bar, and an
 * OUT-OF-POCKET MAX shield locks over the member's share.
 *
 * Register in Root.tsx:
 *   <Composition id="InsurancePremiumDeductible" component={InsurancePremiumDeductible}
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
// Palette - clinical teal / slate on deep blue
// ---------------------------------------------------------------------------
const BG = '#07131F';
const PANEL = 'rgba(13,30,46,0.72)';
const INK = '#EAF3F8';
const MUTED = 'rgba(158,178,196,0.66)';
const TEAL = '#2DD4BF';
const TEAL_BRIGHT = '#5EEAD4';
const PLAN_BLUE = '#2E7CC4';
const PLAN_LIGHT = '#9FD0F5';
const HAIRLINE = 'rgba(45,212,191,0.22)';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps, 900 = 15 s)
// ---------------------------------------------------------------------------
const COIN_START = 60;
const COIN_STAGGER = 32;
const N_COINS = 6;
const DEDUCT_START = 300;
const CLAIMS = [
  {label: 'ER VISIT', amount: 600, at: 320},
  {label: 'LAB WORK', amount: 350, at: 400},
  {label: 'IMAGING', amount: 550, at: 480},
];
const DEDUCTIBLE = 1500;
const MET_AT = 570;
const SPLIT_START = 600;
const SHIELD_AT = 760;

// ---------------------------------------------------------------------------
// Static defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="ipBgGlow" cx="50%" cy="32%" r="72%">
      <stop offset="0%" stopColor="rgba(45,212,191,0.10)" />
      <stop offset="55%" stopColor="rgba(45,212,191,0.03)" />
      <stop offset="100%" stopColor="rgba(7,19,31,0)" />
    </radialGradient>
    <radialGradient id="ipVignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stopColor="rgba(7,19,31,0)" />
      <stop offset="100%" stopColor="rgba(2,6,11,0.74)" />
    </radialGradient>
    <radialGradient id="ipPoolGrad" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stopColor="rgba(94,234,212,0.55)" />
      <stop offset="60%" stopColor="rgba(45,212,191,0.22)" />
      <stop offset="100%" stopColor="rgba(45,212,191,0.05)" />
    </radialGradient>
    <linearGradient id="ipTealGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={TEAL} />
      <stop offset="100%" stopColor={TEAL_BRIGHT} />
    </linearGradient>
    <linearGradient id="ipPlanGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#1E5A8A" />
      <stop offset="100%" stopColor={PLAN_BLUE} />
    </linearGradient>
    <filter id="ipGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: teal glow, vignette, faint grid, horizontal sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sweepY = -500 + ((frame / 900) * (2160 + 1000));
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(45,212,191,0.10), rgba(45,212,191,0.03) 45%, rgba(7,19,31,0) 72%)',
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
        <g opacity={0.55}>
          <rect x={0} y={sweepY - 80} width={3840} height={160} fill="rgba(45,212,191,0.030)" />
          <rect x={0} y={sweepY + 70} width={3840} height={10} fill="rgba(45,212,191,0.10)" />
        </g>
        <rect x={0} y={0} width={3840} height={2160} fill="url(#ipVignette)" />
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
          HOW A DEDUCTIBLE WORKS
        </span>
        <span
          style={{
            color: TEAL,
            fontFamily: MONO,
            fontSize: 36,
            fontWeight: 700,
            border: `2px solid ${TEAL}`,
            borderRadius: 10,
            padding: '6px 18px',
          }}
        >
          $420 / MO PREMIUM
        </span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 34, marginTop: 14}}>
        Premiums feed the shared risk pool &middot; then one member faces a $10,000 medical bill
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Premium flow: member figure pays coins into the risk pool
// ---------------------------------------------------------------------------
const MEMBER = {x: 520, y: 660};
const POOL = {x: 1920, y: 660, r: 240};

const PremiumFlow: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const zoneIn = interpolate(frame, [20, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const memberS = spring({frame: frame - 30, fps, config: {damping: 200, stiffness: 100}});
  const poolS = spring({frame: frame - 45, fps, config: {damping: 200, stiffness: 90}});

  // quadratic bezier from member to pool, arcing upward
  const p0 = {x: MEMBER.x + 130, y: MEMBER.y - 40};
  const pc = {x: (MEMBER.x + POOL.x) / 2, y: 300};
  const p1 = {x: POOL.x - 180, y: POOL.y - 120};
  const quad = (t: number) => ({
    x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * pc.x + t * t * p1.x,
    y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * pc.y + t * t * p1.y,
  });

  const landed = Array.from({length: N_COINS}, (_, i) =>
    frame >= COIN_START + i * COIN_STAGGER + 70 ? 1 : 0
  ).reduce((a, b) => a + b, 0);
  const poolTotal = 420 * landed;
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.08);

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={zoneIn}>
        {/* guide arc */}
        <path
          d={`M ${p0.x} ${p0.y} Q ${pc.x} ${pc.y} ${p1.x} ${p1.y}`}
          fill="none"
          stroke="rgba(45,212,191,0.25)"
          strokeWidth={3}
          strokeDasharray="16 18"
        />
        {/* member figure */}
        <g opacity={Math.min(1, memberS)} transform={`translate(${MEMBER.x}, ${MEMBER.y}) scale(${0.7 + 0.3 * Math.min(1, memberS)})`}>
          <circle cx={0} cy={-96} r={46} fill={TEAL} opacity={0.9} style={{filter: 'drop-shadow(0 0 18px rgba(45,212,191,0.7))'}} />
          <rect x={-62} y={-36} width={124} height={150} rx={62} fill="rgba(45,212,191,0.28)" stroke={TEAL} strokeWidth={4} />
          <circle cx={0} cy={-96} r={72} fill="none" stroke={TEAL} strokeWidth={3} opacity={0.45} />
        </g>
        <text x={MEMBER.x} y={MEMBER.y + 190} fill={INK} fontSize={34} fontFamily={FONT} fontWeight={700} textAnchor="middle">
          MEMBER
        </text>
        <text x={MEMBER.x} y={MEMBER.y + 236} fill={TEAL} fontSize={36} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          $420 / MO
        </text>

        {/* risk pool */}
        <g opacity={Math.min(1, poolS)}>
          <circle cx={POOL.x} cy={POOL.y} r={POOL.r + 26 + pulse * 10} fill="none" stroke={TEAL} strokeWidth={4} opacity={0.4 + pulse * 0.25} />
          <circle cx={POOL.x} cy={POOL.y} r={POOL.r} fill="rgba(13,30,46,0.85)" stroke="rgba(45,212,191,0.5)" strokeWidth={5} />
          {/* pool fill level rises with landed coins */}
          <circle
            cx={POOL.x}
            cy={POOL.y}
            r={70 + (landed / N_COINS) * 130}
            fill="url(#ipPoolGrad)"
            opacity={0.9}
            style={{filter: 'drop-shadow(0 0 26px rgba(45,212,191,0.5))'}}
          />
          <text x={POOL.x} y={POOL.y - 34} fill={INK} fontSize={44} fontFamily={FONT} fontWeight={800} letterSpacing={4} textAnchor="middle">
            RISK POOL
          </text>
          <text x={POOL.x} y={POOL.y + 26} fill={TEAL_BRIGHT} fontSize={64} fontFamily={MONO} fontWeight={800} textAnchor="middle"
            style={{textShadow: '0 0 26px rgba(45,212,191,0.6)'}}>
            ${poolTotal.toLocaleString('en-US')}
          </text>
          <text x={POOL.x} y={POOL.y + 72} fill={MUTED} fontSize={28} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
            {landed} OF {N_COINS} PAYMENTS IN
          </text>
        </g>

        {/* pooled member chips on the far side */}
        {[0, 1, 2].map((k) => (
          <g key={`pm${k}`} transform={`translate(${POOL.x + 330 + k * 0}, ${POOL.y - 120 + k * 120})`} opacity={0.85}>
            <circle cx={0} cy={0} r={34} fill="rgba(45,212,191,0.20)" stroke="rgba(45,212,191,0.55)" strokeWidth={3} />
            <circle cx={0} cy={-8} r={12} fill={TEAL} opacity={0.8} />
            <rect x={-16} y={6} width={32} height={26} rx={13} fill={TEAL} opacity={0.5} />
          </g>
        ))}
        <text x={POOL.x + 330} y={POOL.y + 190} fill={MUTED} fontSize={28} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
          + THOUSANDS OF MEMBERS
        </text>
      </g>

      {/* flying premium coins */}
      {Array.from({length: N_COINS}, (_, i) => {
        const at = COIN_START + i * COIN_STAGGER;
        const t = interpolate(frame, [at, at + 70], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (t <= 0 || t >= 1) return null;
        const pos = quad(t);
        const fadeCoin = t < 0.12 ? t / 0.12 : t > 0.85 ? (1 - t) / 0.15 : 1;
        return (
          <g key={`coin${i}`} transform={`translate(${pos.x}, ${pos.y})`} opacity={fadeCoin}>
            <rect x={-85} y={-34} width={170} height={68} rx={34} fill="rgba(7,25,32,0.95)" stroke={TEAL} strokeWidth={3.5}
              style={{filter: 'drop-shadow(0 0 16px rgba(45,212,191,0.8))'}} />
            <text x={0} y={14} fill={TEAL_BRIGHT} fontSize={38} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              $420
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Deductible bar: claim events fill $1,500 one by one
// ---------------------------------------------------------------------------
const DeductibleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inT = interpolate(frame, [DEDUCT_START - 40, DEDUCT_START], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const x0 = 220;
  const x1 = 3620;
  const barY = 1150;
  const barH = 66;

  let running = 0;
  const fills = CLAIMS.map((c) => {
    const t = interpolate(frame, [c.at, c.at + 50], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const before = running;
    running += c.amount * t;
    return {claim: c, t, before: before / DEDUCTIBLE, after: running / DEDUCTIBLE};
  });
  const totalPaid = Math.round(running);
  const full = totalPaid >= DEDUCTIBLE;

  const metS = spring({frame: frame - MET_AT, fps, config: {damping: 200, stiffness: 120}});

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={inT}>
        <text x={x0} y={1090} fill={INK} fontSize={46} fontFamily={FONT} fontWeight={800} letterSpacing={1}>
          $1,500 DEDUCTIBLE
        </text>
        <text x={x1} y={1090} fill={full ? TEAL : MUTED} fontSize={40} fontFamily={MONO} fontWeight={800} textAnchor="end">
          ${totalPaid.toLocaleString('en-US')} OF $1,500 PAID
        </text>
        {/* track */}
        <rect x={x0} y={barY} width={x1 - x0} height={barH} rx={33} fill="rgba(13,30,46,0.9)" stroke="rgba(148,163,184,0.30)" strokeWidth={2.5} />
        {/* segment ticks */}
        {[500, 1000].map((v) => (
          <line key={`tick${v}`} x1={x0 + (v / DEDUCTIBLE) * (x1 - x0)} y1={barY + 12} x2={x0 + (v / DEDUCTIBLE) * (x1 - x0)} y2={barY + barH - 12}
            stroke="rgba(148,163,184,0.35)" strokeWidth={2} />
        ))}
        {/* filled segments per claim */}
        {fills.map((f, i) => {
          if (f.t <= 0) return null;
          const w = (f.after - f.before) * (x1 - x0);
          return (
            <rect
              key={`seg${i}`}
              x={x0 + f.before * (x1 - x0)}
              y={barY}
              width={Math.max(0, w)}
              height={barH}
              rx={w > 60 ? 33 : 8}
              fill="url(#ipTealGrad)"
              opacity={0.95}
              style={{filter: 'drop-shadow(0 0 14px rgba(45,212,191,0.55))'}}
            />
          );
        })}
        {/* claim chips under the bar */}
        {CLAIMS.map((c, i) => {
          const s = spring({frame: frame - c.at, fps, config: {damping: 200, stiffness: 110}});
          if (s <= 0.001) return null;
          const cx = x0 + 40 + i * 560;
          return (
            <g key={`chip${i}`} opacity={Math.min(1, s)} transform={`translate(${cx}, 0) scale(${0.7 + 0.3 * Math.min(1, s)})`}>
              <rect x={0} y={1252} width={500} height={72} rx={16} fill="rgba(7,25,32,0.94)" stroke={f.t > 0.6 ? TEAL : 'rgba(148,163,184,0.4)'} strokeWidth={2.5} />
              <text x={24} y={1300} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={1}>
                {c.label}
              </text>
              <text x={476} y={1300} fill={f.t > 0.6 ? TEAL_BRIGHT : INK} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="end">
                ${c.amount}
              </text>
            </g>
          );
        })}
        {/* DEDUCTIBLE MET tag */}
        {metS > 0.001 && (
          <g transform={`translate(${x1 - 240}, ${barY + barH + 95}) scale(${0.6 + 0.4 * Math.min(1, metS)})`} opacity={Math.min(1, metS)}>
            <rect x={-430} y={-42} width={400} height={84} rx={16} fill="rgba(7,25,32,0.96)" stroke={TEAL} strokeWidth={3.5} />
            <text x={-230} y={12} fill={TEAL_BRIGHT} fontSize={38} fontFamily={FONT} fontWeight={800} letterSpacing={3} textAnchor="middle">
              DEDUCTIBLE MET
            </text>
          </g>
        )}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Split bar: you-pay vs plan-pays on the $10,000 bill
// ---------------------------------------------------------------------------
const SplitBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const inT = interpolate(frame, [SPLIT_START - 40, SPLIT_START], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const x0 = 220;
  const x1 = 3620;
  const barY = 1490;
  const barH = 96;
  const YOU = 3200;
  const BILL = 10000;
  const youFrac = YOU / BILL;

  const grow = spring({frame: frame - (SPLIT_START + 10), fps, config: {damping: 200, stiffness: 70}});
  const w = Math.max(0, Math.min(1, grow));
  const youW = youFrac * (x1 - x0) * w;
  const planW = (1 - youFrac) * (x1 - x0) * w;

  const coinT = interpolate(frame, [SPLIT_START + 30, SPLIT_START + 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={inT}>
        <text x={x0} y={1424} fill={INK} fontSize={46} fontFamily={FONT} fontWeight={800} letterSpacing={1}>
          $10,000 MEDICAL BILL
        </text>
        <text x={x1} y={1424} fill={MUTED} fontSize={34} fontFamily={MONO} textAnchor="end" opacity={coinT}>
          DEDUCTIBLE $1,500 + 20% COINSURANCE ON $8,500 = $1,700
        </text>
        {/* track */}
        <rect x={x0} y={barY} width={x1 - x0} height={barH} rx={24} fill="rgba(13,30,46,0.9)" stroke="rgba(148,163,184,0.30)" strokeWidth={2.5} />
        {/* you-pay segment */}
        <rect x={x0} y={barY} width={youW} height={barH} rx={24} fill="url(#ipTealGrad)"
          style={{filter: 'drop-shadow(0 0 18px rgba(45,212,191,0.5))'}} />
        {/* plan-pays segment */}
        <rect x={x0 + youW} y={barY} width={planW} height={barH} rx={24} fill="url(#ipPlanGrad)" opacity={0.95} />
        {/* divider */}
        {w > 0.05 && (
          <line x1={x0 + youW} y1={barY - 14} x2={x0 + youW} y2={barY + barH + 14} stroke={INK} strokeWidth={4} opacity={0.85} />
        )}
        {w > 0.55 && (
          <>
            <text x={x0 + youW / 2} y={barY + 62} fill="#052E28" fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              YOU PAY $3,200
            </text>
            <text x={x0 + youW + planW / 2} y={barY + 62} fill={PLAN_LIGHT} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              PLAN PAYS $6,800
            </text>
          </>
        )}
        <text x={x0} y={barY + barH + 52} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={2}>
          32% MEMBER SHARE
        </text>
        <text x={x1} y={barY + barH + 52} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={2} textAnchor="end">
          68% COVERED BY THE POOL
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Out-of-pocket max shield locks in
// ---------------------------------------------------------------------------
const Shield: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - SHIELD_AT, fps, config: {damping: 10, stiffness: 150, mass: 1}});
  if (s <= 0.001) return null;
  const scale = 2.0 - 1.0 * Math.min(1.35, s);
  const shock = interpolate(frame, [SHIELD_AT, SHIELD_AT + 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulse = 0.5 + 0.5 * Math.sin((frame - SHIELD_AT) * 0.1);
  const cx = 1920;
  const cy = 1890;

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <text x={cx} y={1680} fill={INK} fontSize={42} fontFamily={FONT} fontWeight={800} letterSpacing={6} textAnchor="middle"
        opacity={Math.min(1, s)}>
        OUT-OF-POCKET MAX · $5,000 CAP
      </text>
      {shock > 0 && shock < 1 && (
        <circle cx={cx} cy={cy} r={90 + shock * 420} fill="none" stroke={TEAL} strokeWidth={9 * (1 - shock) + 1} opacity={(1 - shock) * 0.7} />
      )}
      <g transform={`translate(${cx}, ${cy}) scale(${Math.max(0.25, scale)})`} opacity={Math.min(1, s * 1.5)}>
        {/* shield */}
        <path
          d="M 0 -130 C 40 -110 80 -104 118 -104 C 118 -20 96 62 0 118 C -96 62 -118 -20 -118 -104 C -80 -104 -40 -110 0 -130 Z"
          fill="rgba(7,25,32,0.94)"
          stroke={TEAL}
          strokeWidth={7}
          style={{filter: `drop-shadow(0 0 ${30 + pulse * 22}px rgba(45,212,191,${0.5 + pulse * 0.3}))`}}
        />
        {/* lock */}
        <rect x={-34} y={-34} width={68} height={56} rx={12} fill={TEAL} />
        <path d="M -22 -34 V -58 C -22 -80 22 -80 22 -58 V -34" fill="none" stroke={TEAL_BRIGHT} strokeWidth={11} />
        <circle cx={0} cy={-10} r={8} fill="#052E28" />
        <rect x={-4} y={-10} width={8} height={20} rx={4} fill="#052E28" />
      </g>
      <text x={cx} y={2078} fill={TEAL_BRIGHT} fontSize={36} fontFamily={MONO} fontWeight={700} letterSpacing={2} textAnchor="middle"
        opacity={Math.min(1, s)} style={{textShadow: '0 0 18px rgba(45,212,191,0.5)'}}>
        YOUR $3,200 SHARE IS PROTECTED
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [SHIELD_AT + 40, SHIELD_AT + 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 30,
        left: 0,
        width: 3840,
        textAlign: 'center',
        color: 'rgba(148,163,184,0.55)',
        fontFamily: FONT,
        fontSize: 26,
        opacity: fade,
      }}
    >
      Illustrative example &middot; plan terms, deductibles and coinsurance vary by policy
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const InsurancePremiumDeductible: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <PremiumFlow frame={frame} fps={fps} />
      <DeductibleBar frame={frame} fps={fps} />
      <SplitBar frame={frame} fps={fps} />
      <Shield frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default InsurancePremiumDeductible;
