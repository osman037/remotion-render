/**
 * CheckoutPaymentFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A premium secure-checkout sequence: order summary -> card payment ->
 * authorization processing -> approved confirmation with receipt.
 *
 * Register in Root.tsx:
 *   <Composition id="CheckoutPaymentFlow" component={CheckoutPaymentFlow}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const BG = '#060A13';
const PANEL = 'rgba(13, 20, 36, 0.88)';
const HAIRLINE = 'rgba(148, 163, 184, 0.22)';
const INK = '#EAF0FA';
const MUTED = 'rgba(190, 203, 224, 0.66)';
const FAINT = 'rgba(148, 163, 184, 0.38)';
const EMERALD = '#34D399';
const EMERALD_DIM = 'rgba(52, 211, 153, 0.14)';
const SKY = '#38BDF8';
const AMBER = '#FBBF24';
const ROSE = '#FB7185';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const ITEMS = [
  {name: 'Aurora Wireless Headphones', detail: 'Matte black · Qty 1', price: 249.0},
  {name: 'Express Shipping', detail: '2–3 business days', price: 12.0},
  {name: 'Estimated Tax', detail: 'Calculated at checkout', price: 20.88},
];
const TOTAL = 281.88;
const CARD_NUMBER = '4532 1488 9031 7764';
const ORDER_ID = 'ORD-784512';
const EMAIL = 'you@email.com';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const prog = (frame: number, start: number, end: number) =>
  clamp01((frame - start) / (end - start));
const entr = (frame: number, delay: number, fps: number) =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping: 19, stiffness: 130},
  });
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const money = (v: number) =>
  '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Opacity envelope: fade in [inA,inB], hold, fade out [outA,outB]. */
const stageOpacity = (
  frame: number,
  inA: number,
  inB: number,
  outA: number,
  outB: number,
) => prog(frame, inA, inB) * (1 - prog(frame, outA, outB));

// ---------------------------------------------------------------------------
// Background — layered glow, grid, vignette, drifting particles, sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const particles = useMemo(
    () =>
      Array.from({length: 70}, (_, i) => ({
        x: rand(i * 3.1) * 3840,
        y: rand(i * 7.7) * 2160,
        r: 1.5 + rand(i * 13.3) * 3.5,
        speed: 0.25 + rand(i * 5.9) * 0.7,
        tw: rand(i * 9.4) * Math.PI * 2,
      })),
    [],
  );
  const sweepX = interpolate(frame, [0, 900], [-1400, 5200], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill>
      <svg width={3840} height={2160}>
        <defs>
          <radialGradient id="bgGlowA" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bgGlowB" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
          </radialGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="130" />
          </filter>
        </defs>

        <rect width={3840} height={2160} fill={BG} />
        {/* grid */}
        {Array.from({length: 23}, (_, i) => (
          <line
            key={'v' + i}
            x1={160 * (i + 1)}
            y1={0}
            x2={160 * (i + 1)}
            y2={2160}
            stroke="rgba(148,163,184,0.055)"
            strokeWidth={2}
          />
        ))}
        {Array.from({length: 12}, (_, i) => (
          <line
            key={'h' + i}
            x1={0}
            y1={180 * (i + 1)}
            x2={3840}
            y2={180 * (i + 1)}
            stroke="rgba(148,163,184,0.055)"
            strokeWidth={2}
          />
        ))}

        {/* ambient glows */}
        <ellipse cx={3150} cy={480} rx={950} ry={620} fill="url(#bgGlowA)" filter="url(#softBlur)" />
        <ellipse cx={620} cy={1650} rx={900} ry={640} fill="url(#bgGlowB)" filter="url(#softBlur)" />

        {/* drifting particles */}
        {particles.map((p, i) => {
          const y = (p.y - frame * p.speed * 1.6 + 2160 * 3) % 2160;
          const tw = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(frame / 60 + p.tw));
          return (
            <circle key={i} cx={p.x} cy={y} r={p.r} fill="#9FD8FF" opacity={tw * 0.5} />
          );
        })}

        {/* slow diagonal sweep */}
        <g transform={`translate(${sweepX} 0) rotate(18 0 1080)`} opacity={0.05}>
          <rect x={-260} y={-600} width={520} height={3400} fill="#BFE9FF" />
        </g>

        <rect width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Header — title, security badge, step indicator
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 10, fps);
  const y = interpolate(e, [0, 1], [60, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        top: 150,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        opacity: e,
        transform: `translateY(${y}px)`,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 30,
            letterSpacing: 8,
            color: EMERALD,
            marginBottom: 18,
          }}
        >
          ● SECURE CHECKOUT
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: 2,
            color: INK,
            textShadow: '0 4px 40px rgba(56,189,248,0.25)',
          }}
        >
          Payment
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 27,
            letterSpacing: 3,
            color: MUTED,
            marginTop: 14,
          }}
        >
          256-BIT ENCRYPTED&nbsp;&nbsp;·&nbsp;&nbsp;PCI DSS COMPLIANT
        </div>
      </div>
      <div style={{textAlign: 'right', paddingTop: 26}}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 30,
            letterSpacing: 4,
            color: FAINT,
          }}
        >
          STEP 3 OF 3
        </div>
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 20,
            justifyContent: 'flex-end',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 64,
                height: 10,
                borderRadius: 5,
                backgroundColor: i < 2 ? EMERALD : 'rgba(148,163,184,0.25)',
                boxShadow: i < 2 ? `0 0 18px ${EMERALD}` : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage A — order summary
// ---------------------------------------------------------------------------
const SummaryStage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <div
      style={{
        fontFamily: MONO,
        fontSize: 30,
        letterSpacing: 7,
        color: FAINT,
        marginBottom: 44,
        opacity: entr(frame, 70, fps),
      }}
    >
      ORDER SUMMARY
    </div>
    {ITEMS.map((item, i) => {
      const e = entr(frame, 100 + i * 45, fps);
      return (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '30px 10px',
            borderBottom: `2px solid ${HAIRLINE}`,
            opacity: e,
            transform: `translateY(${interpolate(e, [0, 1], [50, 0])}px)`,
          }}
        >
          <div>
            <div style={{fontFamily: FONT, fontSize: 46, fontWeight: 600, color: INK}}>
              {item.name}
            </div>
            <div style={{fontFamily: MONO, fontSize: 28, color: FAINT, marginTop: 10, letterSpacing: 1}}>
              {item.detail}
            </div>
          </div>
          <div style={{fontFamily: MONO, fontSize: 44, color: INK}}>{money(item.price)}</div>
        </div>
      );
    })}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '44px 10px 0',
        opacity: entr(frame, 250, fps),
        transform: `translateY(${interpolate(entr(frame, 250, fps), [0, 1], [50, 0])}px)`,
      }}
    >
      <div style={{fontFamily: FONT, fontSize: 52, fontWeight: 700, color: INK}}>
        Total due
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 84,
          fontWeight: 700,
          color: EMERALD,
          textShadow: `0 0 44px ${EMERALD_DIM}`,
        }}
      >
        {money(TOTAL)}
      </div>
    </div>
    <div
      style={{
        marginTop: 56,
        display: 'inline-block',
        padding: '30px 90px',
        borderRadius: 60,
        background: `linear-gradient(135deg, ${EMERALD}, #10B981)`,
        boxShadow: `0 12px 60px ${EMERALD_DIM}`,
        fontFamily: FONT,
        fontSize: 44,
        fontWeight: 700,
        letterSpacing: 3,
        color: '#04120C',
        opacity: entr(frame, 300, fps),
        transform: `translateY(${interpolate(entr(frame, 300, fps), [0, 1], [40, 0])}px)`,
      }}
    >
      CONTINUE TO PAYMENT →
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Stage B — card payment
// ---------------------------------------------------------------------------
const PaymentStage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  // card flips/scales in
  const cardE = entr(frame, 350, fps);
  const cardScale = interpolate(cardE, [0, 1], [0.82, 1]);
  // digits type across frames 390–500
  const typed = Math.floor(prog(frame, 390, 500) * CARD_NUMBER.length);
  const shown = CARD_NUMBER.slice(0, typed);
  const btnE = entr(frame, 505, fps);
  // pay button "click" dip
  const click = prog(frame, 540, 552) * (1 - prog(frame, 552, 566));
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 30,
          letterSpacing: 7,
          color: FAINT,
          marginBottom: 40,
          opacity: entr(frame, 340, fps),
        }}
      >
        PAYMENT METHOD — CARD
      </div>
      <div style={{display: 'flex', gap: 90, alignItems: 'flex-start'}}>
        {/* credit card visual */}
        <div
          style={{
            opacity: cardE,
            transform: `scale(${cardScale}) translateY(${interpolate(cardE, [0, 1], [60, 0])}px)`,
          }}
        >
          <svg width={980} height={600}>
            <defs>
              <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#123B6D" />
                <stop offset="55%" stopColor="#0B2547" />
                <stop offset="100%" stopColor="#071A33" />
              </linearGradient>
              <linearGradient id="chipGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <filter id="cardGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="26" />
              </filter>
            </defs>
            <rect x={30} y={40} width={920} height={520} rx={44} fill="#38BDF8" opacity={0.28} filter="url(#cardGlow)" />
            <rect x={0} y={0} width={920} height={520} rx={44} fill="url(#cardGrad)" stroke="rgba(148,163,184,0.35)" strokeWidth={3} />
            <rect x={70} y={90} width={130} height={100} rx={16} fill="url(#chipGrad)" />
            <line x1={70} y1={140} x2={200} y2={140} stroke="#92400E" strokeWidth={4} opacity={0.6} />
            <line x1={135} y1={90} x2={135} y2={190} stroke="#92400E" strokeWidth={4} opacity={0.6} />
            <text x={70} y={300} fontFamily={MONO} fontSize={56} letterSpacing={6} fill={INK}>
              {shown}
              {typed < CARD_NUMBER.length && (
                <tspan fill={SKY} opacity={0.6 + 0.4 * Math.sin(frame / 8)}>▍</tspan>
              )}
            </text>
            <text x={70} y={400} fontFamily={MONO} fontSize={26} letterSpacing={4} fill={FAINT}>
              CARD HOLDER
            </text>
            <text x={70} y={448} fontFamily={FONT} fontSize={38} fontWeight={600} letterSpacing={3} fill={INK}>
              M USMAN
            </text>
            <text x={560} y={400} fontFamily={MONO} fontSize={26} letterSpacing={4} fill={FAINT}>
              EXPIRES
            </text>
            <text x={560} y={448} fontFamily={MONO} fontSize={38} fill={INK}>
              08/29
            </text>
            <text x={740} y={400} fontFamily={MONO} fontSize={26} letterSpacing={4} fill={FAINT}>
              CVC
            </text>
            <text x={740} y={448} fontFamily={MONO} fontSize={38} fill={INK}>
              •••
            </text>
            {/* contactless arcs */}
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M ${800 + i * 26} 120 A ${44 + i * 26} ${44 + i * 26} 0 0 1 ${800 + i * 26} 190`}
                fill="none"
                stroke={SKY}
                strokeWidth={7}
                strokeLinecap="round"
                opacity={0.35 + 0.65 * prog(frame, 430 + i * 30, 470 + i * 30)}
              />
            ))}
          </svg>
        </div>
        {/* pay column */}
        <div style={{flex: 1, paddingTop: 40}}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 28,
              letterSpacing: 3,
              color: MUTED,
              opacity: entr(frame, 420, fps),
            }}
          >
            AMOUNT TO CHARGE
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 120,
              fontWeight: 700,
              color: INK,
              marginTop: 16,
              opacity: entr(frame, 440, fps),
            }}
          >
            {money(TOTAL)}
          </div>
          <div
            style={{
              marginTop: 70,
              display: 'inline-block',
              padding: '34px 110px',
              borderRadius: 64,
              background: `linear-gradient(135deg, ${SKY}, #0EA5E9)`,
              boxShadow: `0 12px 60px rgba(56,189,248,0.35)`,
              fontFamily: FONT,
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: 3,
              color: '#03131D',
              opacity: btnE,
              transform: `scale(${(1 - click * 0.06) * interpolate(btnE, [0, 1], [0.9, 1])})`,
            }}
          >
            PAY NOW
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 26,
              letterSpacing: 2,
              color: FAINT,
              marginTop: 34,
              opacity: entr(frame, 480, fps),
            }}
          >
            ▣&nbsp; Card details never touch our servers
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage C — processing
// ---------------------------------------------------------------------------
const STEPS = ['Encrypting details', 'Authorizing with bank', 'Confirming order'];
const ProcessingStage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const barP = prog(frame, 575, 700);
  return (
    <div style={{position: 'absolute', inset: 0, paddingTop: 60}}>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 30,
          letterSpacing: 7,
          color: FAINT,
          marginBottom: 50,
          opacity: entr(frame, 565, fps),
        }}
      >
        PROCESSING PAYMENT
      </div>
      {STEPS.map((label, i) => {
        const start = 585 + i * 42;
        const done = prog(frame, start, start + 30);
        const active = prog(frame, start - 8, start) * (1 - done);
        const e = entr(frame, start - 10, fps);
        const angle = (frame * 9) % 360;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 44,
              padding: '34px 10px',
              borderBottom: `2px solid ${HAIRLINE}`,
              opacity: e,
              transform: `translateX(${interpolate(e, [0, 1], [70, 0])}px)`,
            }}
          >
            <svg width={86} height={86}>
              {done >= 1 ? (
                <g>
                  <circle cx={43} cy={43} r={34} fill={EMERALD_DIM} stroke={EMERALD} strokeWidth={5} />
                  <path d="M 29 43 L 39 53 L 58 32" fill="none" stroke={EMERALD} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              ) : (
                <g transform={`rotate(${angle} 43 43)`}>
                  <circle cx={43} cy={43} r={32} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth={7} />
                  <path d="M 43 11 A 32 32 0 0 1 71 27" fill="none" stroke={AMBER} strokeWidth={7} strokeLinecap="round" />
                </g>
              )}
            </svg>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 50,
                fontWeight: 600,
                color: done >= 1 ? INK : active > 0 ? INK : MUTED,
              }}
            >
              {label}
            </div>
            <div
              style={{
                marginLeft: 'auto',
                fontFamily: MONO,
                fontSize: 30,
                letterSpacing: 3,
                color: done >= 1 ? EMERALD : AMBER,
              }}
            >
              {done >= 1 ? 'DONE' : active > 0 ? 'WORKING' : 'QUEUED'}
            </div>
          </div>
        );
      })}
      <div style={{marginTop: 70, opacity: entr(frame, 580, fps)}}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: MONO,
            fontSize: 28,
            letterSpacing: 3,
            color: MUTED,
            marginBottom: 20,
          }}
        >
          <span>AUTHORIZATION PROGRESS</span>
          <span>{Math.round(barP * 100)}%</span>
        </div>
        <div
          style={{
            height: 26,
            borderRadius: 13,
            backgroundColor: 'rgba(148,163,184,0.16)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${barP * 100}%`,
              height: '100%',
              borderRadius: 13,
              background: `linear-gradient(90deg, ${SKY}, ${EMERALD})`,
              boxShadow: `0 0 30px rgba(52,211,153,0.5)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage D — success
// ---------------------------------------------------------------------------
const SuccessStage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const drawP = prog(frame, 730, 800);
  const CIRC = 2 * Math.PI * 118;
  const CHECK_LEN = 150;
  const amount = interpolate(prog(frame, 780, 850), [0, 1], [0, TOTAL]);
  const confetti = useMemo(
    () =>
      Array.from({length: 52}, (_, i) => {
        const angle = rand(i * 1.7) * Math.PI * 2;
        const dist = 260 + rand(i * 3.3) * 620;
        return {
          angle,
          dist,
          size: 10 + rand(i * 5.1) * 22,
          color: [EMERALD, SKY, AMBER, '#EAF0FA'][i % 4],
          rot: rand(i * 7.9) * 360,
          wob: rand(i * 11.2) * Math.PI * 2,
        };
      }),
    [],
  );
  const confP = prog(frame, 745, 880);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{display: 'flex', gap: 100, alignItems: 'center', paddingTop: 40}}>
        {/* drawn check */}
        <div style={{opacity: prog(frame, 720, 745)}}>
          <svg width={340} height={340}>
            <defs>
              <filter id="checkGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="18" />
              </filter>
            </defs>
            <circle cx={170} cy={170} r={150} fill={EMERALD} opacity={0.22 * drawP} filter="url(#checkGlow)" />
            <circle
              cx={170}
              cy={170}
              r={118}
              fill="none"
              stroke={EMERALD}
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - drawP)}
              transform="rotate(-90 170 170)"
            />
            <path
              d="M 118 172 L 158 212 L 228 128"
              fill="none"
              stroke={EMERALD}
              strokeWidth={20}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={CHECK_LEN}
              strokeDashoffset={CHECK_LEN * (1 - prog(frame, 770, 820))}
            />
          </svg>
        </div>
        <div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 92,
              fontWeight: 800,
              letterSpacing: 4,
              color: INK,
              textShadow: `0 0 60px ${EMERALD_DIM}`,
              opacity: entr(frame, 790, fps),
              transform: `translateY(${interpolate(entr(frame, 790, fps), [0, 1], [50, 0])}px)`,
            }}
          >
            PAYMENT APPROVED
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 110,
              fontWeight: 700,
              color: EMERALD,
              marginTop: 18,
              opacity: entr(frame, 810, fps),
            }}
          >
            {money(amount)}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 34,
              letterSpacing: 4,
              color: MUTED,
              marginTop: 26,
              opacity: entr(frame, 830, fps),
            }}
          >
            ORDER&nbsp;&nbsp;#{ORDER_ID}
          </div>
        </div>
      </div>
      {/* confetti */}
      <svg
        width={2600}
        height={1380}
        style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}
      >
        {confetti.map((c, i) => {
          const x = 1300 + Math.cos(c.angle) * c.dist * confP;
          const y = 560 + Math.sin(c.angle) * c.dist * confP * 0.7 + confP * confP * 260;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={c.size}
              height={c.size * 0.62}
              fill={c.color}
              opacity={(1 - confP) * 0.9}
              transform={`rotate(${c.rot + frame * 6 + Math.sin(frame / 14 + c.wob) * 30} ${x} ${y})`}
            />
          );
        })}
      </svg>
      {/* receipt lines */}
      <div style={{marginTop: 60, borderTop: `2px solid ${HAIRLINE}`, paddingTop: 44}}>
        {[
          `Receipt sent to ${EMAIL}`,
          'Card charged: •••• •••• •••• 7764',
          'Delivery estimate: 2–3 business days',
        ].map((line, i) => {
          const e = entr(frame, 840 + i * 22, fps);
          return (
            <div
              key={i}
              style={{
                fontFamily: MONO,
                fontSize: 32,
                letterSpacing: 2,
                color: MUTED,
                marginBottom: 22,
                opacity: e,
                transform: `translateY(${interpolate(e, [0, 1], [30, 0])}px)`,
              }}
            >
              <span style={{color: EMERALD}}>✓&nbsp;&nbsp;</span>
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main panel + footer
// ---------------------------------------------------------------------------
const MainPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 30, fps);
  return (
    <div
      style={{
        position: 'absolute',
        left: 620,
        top: 400,
        width: 2600,
        height: 1330,
        borderRadius: 48,
        backgroundColor: PANEL,
        border: `3px solid ${HAIRLINE}`,
        boxShadow: '0 40px 140px rgba(0,0,0,0.55), inset 0 2px 0 rgba(234,240,250,0.08)',
        opacity: e,
        transform: `translateY(${interpolate(e, [0, 1], [90, 0])}px)`,
        overflow: 'hidden',
      }}
    >
      {/* top sheen */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 220,
          background: 'linear-gradient(180deg, rgba(234,240,250,0.06), rgba(234,240,250,0))',
          pointerEvents: 'none',
        }}
      />
      <div style={{position: 'absolute', inset: '70px 110px'}}>
        <div style={{opacity: stageOpacity(frame, 40, 80, 300, 340)}}>
          <SummaryStage frame={frame} fps={fps} />
        </div>
        <div style={{opacity: stageOpacity(frame, 320, 360, 540, 580)}}>
          <PaymentStage frame={frame} fps={fps} />
        </div>
        <div style={{opacity: stageOpacity(frame, 560, 600, 700, 740)}}>
          <ProcessingStage frame={frame} fps={fps} />
        </div>
        <div style={{opacity: prog(frame, 720, 760)}}>
          <SuccessStage frame={frame} fps={fps} />
        </div>
      </div>
    </div>
  );
};

const Footer: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 60, fps);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 120,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: MONO,
        fontSize: 27,
        letterSpacing: 4,
        color: FAINT,
        opacity: e,
      }}
    >
      <span>CARD&nbsp;&nbsp;·&nbsp;&nbsp;BANK TRANSFER&nbsp;&nbsp;·&nbsp;&nbsp;WALLET</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;FRAUD MONITORING ACTIVE</span>
      <span>DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const CheckoutPaymentFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <MainPanel frame={frame} fps={fps} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default CheckoutPaymentFlow;
