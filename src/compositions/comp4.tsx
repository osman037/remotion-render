/**
 * LoyaltyPointsEarnRedeem.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * Loyalty earn-and-redeem story: a cafe purchase is scanned (scan beam),
 * points tally chips stream into a rewards wallet ring, the ring completes
 * and a "REWARD UNLOCKED" badge blooms with a shockwave, while earn
 * counters climb throughout.
 *
 * Register in Root.tsx:
 *   <Composition id="LoyaltyPointsEarnRedeem" component={LoyaltyPointsEarnRedeem}
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
// Palette (warm gold / violet on deep navy)
// ---------------------------------------------------------------------------
const BG = '#080B1A';
const INK = '#EEF1FA';
const MUTED = 'rgba(190,200,225,0.62)';
const GOLD = '#F5C044';
const GOLD_LIGHT = '#FFD98A';
const VIOLET = '#8B7CF6';
const VIOLET_LIGHT = '#B7A9FF';
const DARK_TEXT = '#1A1206';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps, 900 = 15 s)
// ---------------------------------------------------------------------------
const TITLE_END = 50;
const PANEL_START = 40;
const SCAN_START = 60;
const SCAN_END = 220;
const RING_START = 240;
const RING_END = 640;
const BADGE_AT = 660;
const STATS_START = 720;

// ---------------------------------------------------------------------------
// Data: receipt lines + points (10 pts per $1)
// ---------------------------------------------------------------------------
interface ReceiptItem {
  name: string;
  detail: string;
  price: string;
  pts: number;
}
const ITEMS: ReceiptItem[] = [
  {name: 'SIGNATURE LATTE', detail: '12 OZ · OAT MILK', price: '$5.40', pts: 540},
  {name: 'BUTTER CROISSANT', detail: 'BAKED FRESH', price: '$3.20', pts: 320},
  {name: 'COLD BREW', detail: '16 OZ · SINGLE ORIGIN', price: '$4.80', pts: 480},
  {name: 'BLUEBERRY MUFFIN', detail: 'WARMED', price: '$3.60', pts: 360},
];
const TOTAL_PTS = ITEMS.reduce((a, b) => a + b.pts, 0); // 1700
const BALANCE_START = 7700;
const GOAL = 9400; // reward threshold: 7700 + 1700 = 9400

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
const PANEL_X = 220;
const PANEL_W = 1240;
const PANEL_Y = 400;
const PANEL_H = 1300;
const RING_CX = 2640;
const RING_CY = 1050;
const RING_R = 330;

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

// ---------------------------------------------------------------------------
// Static defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="40%" r="72%">
      <stop offset="0%" stopColor="rgba(245,192,68,0.10)" />
      <stop offset="45%" stopColor="rgba(139,124,246,0.06)" />
      <stop offset="100%" stopColor="rgba(8,11,26,0)" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stopColor="rgba(8,11,26,0)" />
      <stop offset="100%" stopColor="rgba(2,3,8,0.74)" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={GOLD_LIGHT} />
      <stop offset="55%" stopColor={GOLD} />
      <stop offset="100%" stopColor="#D9931F" />
    </linearGradient>
    <linearGradient id="violetGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={VIOLET_LIGHT} />
      <stop offset="100%" stopColor={VIOLET} />
    </linearGradient>
    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={GOLD} />
      <stop offset="100%" stopColor={VIOLET} />
    </linearGradient>
    <linearGradient id="panelSheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(245,192,68,0.07)" />
      <stop offset="100%" stopColor="rgba(139,124,246,0.03)" />
    </linearGradient>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="bigBlur" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="26" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: layered glow, vignette, faint dot grid, slow sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sweepX = ((frame / 900) * (3840 + 600)) % (3840 + 600) - 300;

  const dots: {x: number; y: number}[] = [];
  for (let gx = 0; gx <= 24; gx++) {
    for (let gy = 0; gy <= 14; gy++) {
      dots.push({x: 120 + gx * 150, y: 240 + gy * 130});
    }
  }

  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(245,192,68,0.10), rgba(139,124,246,0.05) 48%, rgba(8,11,26,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <g opacity={fade * 0.5}>
          {dots.map((d, i) => (
            <circle key={`dot${i}`} cx={d.x} cy={d.y} r={2.5} fill="rgba(190,200,225,0.14)" />
          ))}
        </g>
        {/* soft gold halo behind the wallet ring */}
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={520}
          fill="rgba(245,192,68,0.055)"
          filter="url(#bigBlur)"
          opacity={fade}
        />
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={760}
          fill="rgba(139,124,246,0.05)"
          filter="url(#bigBlur)"
          opacity={fade}
        />
        {/* slow vertical sweep */}
        <rect x={sweepX - 110} y={0} width={220} height={2160} fill="rgba(245,192,68,0.022)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, TITLE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, TITLE_END], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'absolute', top: 84 + rise, left: 220, right: 220, opacity: fade}}>
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
        <div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 30}}>
            <span style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 82, letterSpacing: -1}}>
              LOYALTY POINTS
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
              EARN &amp; REDEEM
            </span>
          </div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 34, marginTop: 14}}>
            Scan every purchase &middot; points stream into your wallet &middot; unlock rewards
          </div>
        </div>
        <div
          style={{
            color: VIOLET_LIGHT,
            fontFamily: MONO,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 3,
            border: `2px solid rgba(139,124,246,0.6)`,
            borderRadius: 14,
            padding: '12px 26px',
            background: 'rgba(139,124,246,0.10)',
          }}
        >
          GOLD MEMBER
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Purchase panel: coffee cup + receipt + scan beam
// ---------------------------------------------------------------------------
const ITEM_Y = (i: number) => 620 + i * 140;

const PurchasePanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - PANEL_START,
    fps,
    config: {damping: 200, stiffness: 95},
  });
  if (s <= 0.001) return null;

  const beamX = interpolate(frame, [SCAN_START, SCAN_END], [0, PANEL_W], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const beamOn = frame >= SCAN_START && frame <= SCAN_END + 10;

  // white flash when the scan completes
  const flash = interpolate(frame, [SCAN_END, SCAN_END + 26], [0.35, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: PANEL_X,
        top: PANEL_Y,
        width: PANEL_W,
        height: PANEL_H,
        opacity: Math.min(1, s),
        transform: `translateY(${(1 - s) * 60}px)`,
      }}
    >
      <svg width={PANEL_W} height={PANEL_H} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={4} y={4} width={PANEL_W - 8} height={PANEL_H - 8} rx={34} fill="rgba(12,16,36,0.88)" stroke="rgba(245,192,68,0.30)" strokeWidth={3} />
        <rect x={4} y={4} width={PANEL_W - 8} height={PANEL_H - 8} rx={34} fill="url(#panelSheen)" />

        {/* header */}
        <text x={64} y={104} fill={GOLD} fontSize={32} fontFamily={MONO} letterSpacing={5} fontWeight={700}>
          TODAY&apos;S PURCHASE
        </text>
        <text x={64} y={152} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={2}>
          CORNER CAF&Eacute; &middot; REGISTER 3 &middot; 09:42
        </text>
        <line x1={64} y1={196} x2={PANEL_W - 64} y2={196} stroke="rgba(190,200,225,0.18)" strokeWidth={1.5} />

        {/* coffee cup illustration */}
        <g transform="translate(300, 560)">
          {/* saucer */}
          <ellipse cx={0} cy={210} rx={150} ry={30} fill="rgba(245,192,68,0.16)" />
          {/* cup body */}
          <path
            d="M -110 -160 L 110 -160 L 84 160 Q 80 196 44 196 L -44 196 Q -80 196 -84 160 Z"
            fill="rgba(245,192,68,0.14)"
            stroke={GOLD}
            strokeWidth={7}
          />
          {/* coffee surface */}
          <ellipse cx={0} cy={-160} rx={110} ry={26} fill="url(#goldGrad)" opacity={0.9} />
          {/* handle */}
          <path
            d="M 110 -120 C 190 -120 190 -20 100 10"
            fill="none"
            stroke={GOLD}
            strokeWidth={14}
            strokeLinecap="round"
          />
          {/* steam */}
          <path d="M -40 -220 C -60 -260 -20 -290 -40 -330" fill="none" stroke={VIOLET_LIGHT} strokeWidth={9} strokeLinecap="round" opacity={0.75} />
          <path d="M 30 -220 C 10 -260 50 -290 30 -330" fill="none" stroke={VIOLET_LIGHT} strokeWidth={9} strokeLinecap="round" opacity={0.55} />
          {/* loyalty stamp dots on cup */}
          {[-70, -23, 24, 71].map((dx, i) => (
            <circle key={`st${i}`} cx={dx} cy={40} r={22} fill={i < 3 ? GOLD : 'rgba(190,200,225,0.25)'} stroke={INK} strokeWidth={3} opacity={0.95} />
          ))}
          <text x={0} y={130} fill={INK} fontSize={30} fontFamily={MONO} fontWeight={700} textAnchor="middle" letterSpacing={2}>
            8 / 10 STAMPS
          </text>
        </g>

        {/* receipt lines */}
        {ITEMS.map((it, i) => {
          const y = ITEM_Y(i);
          const checkAt = 100 + i * 35;
          const ck = spring({frame: frame - checkAt, fps, config: {damping: 200, stiffness: 160}});
          return (
            <g key={`it${i}`}>
              {i > 0 && (
                <line x1={520} y1={y - 96} x2={PANEL_W - 80} y2={y - 96} stroke="rgba(190,200,225,0.14)" strokeWidth={1.5} />
              )}
              <text x={520} y={y - 34} fill={INK} fontSize={42} fontFamily={FONT} fontWeight={700}>
                {it.name}
              </text>
              <text x={520} y={y + 12} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={1}>
                {it.detail}
              </text>
              <text x={1080} y={y - 10} fill={INK} fontSize={46} fontFamily={MONO} fontWeight={800} textAnchor="end">
                {it.price}
              </text>
              {ck > 0.001 && (
                <g opacity={Math.min(1, ck)} transform={`translate(1150, ${y - 24}) scale(${0.5 + 0.5 * ck})`}>
                  <circle r={32} fill={GOLD} style={{filter: 'drop-shadow(0 0 12px rgba(245,192,68,0.8))'}} />
                  <path d="M -13 1 L -4 11 L 14 -11" fill="none" stroke={DARK_TEXT} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
            </g>
          );
        })}

        {/* subtotal row */}
        <line x1={64} y1={1130} x2={PANEL_W - 64} y2={1130} stroke="rgba(190,200,225,0.18)" strokeWidth={1.5} />
        <text x={64} y={1186} fill={MUTED} fontSize={32} fontFamily={MONO} letterSpacing={3}>
          SUBTOTAL
        </text>
        <text x={PANEL_W - 380} y={1186} fill={INK} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="end">
          $17.00
        </text>
        <text x={PANEL_W - 80} y={1240} fill={GOLD} fontSize={40} fontFamily={MONO} fontWeight={800} textAnchor="end" style={{filter: 'drop-shadow(0 0 14px rgba(245,192,68,0.6))'}}>
          +{fmt(TOTAL_PTS)} PTS EARNED
        </text>

        {/* scan beam */}
        {beamOn && (
          <g>
            <rect x={beamX - 90} y={220} width={180} height={PANEL_H - 260} fill="rgba(245,192,68,0.055)" />
            <rect x={beamX - 7} y={220} width={14} height={PANEL_H - 260} fill={GOLD} filter="url(#softGlow)" opacity={0.95} />
          </g>
        )}
        {/* completion flash */}
        {flash > 0.001 && (
          <rect x={4} y={4} width={PANEL_W - 8} height={PANEL_H - 8} rx={34} fill="#FFFFFF" opacity={flash} />
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Points stream: "+pts" chips fly from receipt to the wallet ring
// ---------------------------------------------------------------------------
const PointsStream: React.FC<{frame: number}> = ({frame}) => {
  const chips = ITEMS.map((it, i) => ({
    pts: it.pts,
    launch: 130 + i * 40,
    dur: 70,
    sx: PANEL_X + 880,
    sy: PANEL_Y + ITEM_Y(i) - 24,
  }));

  const quad = (t: number, sx: number, sy: number, cx: number, cy: number, ex: number, ey: number) => {
    const u = 1 - t;
    return {x: u * u * sx + 2 * u * t * cx + t * t * ex, y: u * u * sy + 2 * u * t * cy + t * t * ey};
  };

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {chips.map((c, i) => {
        const t = (frame - c.launch) / c.dur;
        if (t <= 0 || t >= 1.15) return null;
        const tt = Math.min(1, t);
        const cxp = (c.sx + RING_CX) / 2;
        const cyp = Math.min(c.sy, RING_CY) - 320;
        const p = quad(tt, c.sx, c.sy, cxp, cyp, RING_CX, RING_CY);
        const fadeOut = t > 1 ? interpolate(t, [1, 1.15], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
        const scale = 0.8 + 0.4 * Math.sin(tt * Math.PI);
        return (
          <g key={`chip${i}`} opacity={fadeOut} transform={`translate(${p.x}, ${p.y}) scale(${scale})`}>
            {/* motion trail */}
            <circle r={14} fill={GOLD} opacity={0.25} cx={-46} cy={26} />
            <circle r={10} fill={GOLD} opacity={0.35} cx={-24} cy={14} />
            <rect x={-130} y={-44} width={260} height={88} rx={44} fill="rgba(20,14,4,0.95)" stroke={GOLD} strokeWidth={4} style={{filter: 'drop-shadow(0 0 18px rgba(245,192,68,0.75))'}} />
            <text x={0} y={14} fill={GOLD_LIGHT} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              +{fmt(c.pts)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Wallet ring: balance counter + progress ring
// ---------------------------------------------------------------------------
const WalletRing: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({
    frame: frame - 200,
    fps,
    config: {damping: 200, stiffness: 90},
  });
  if (s <= 0.001) return null;

  const t = interpolate(frame, [RING_START, RING_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const balance = BALANCE_START + t * (GOAL - BALANCE_START);
  const frac = balance / GOAL;
  const circ = 2 * Math.PI * RING_R;

  // week's earnings counter climbs in parallel
  const weekPts = Math.round(interpolate(frame, [RING_START, RING_END + 60], [0, 3420], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));

  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.06);

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      <g opacity={Math.min(1, s)} transform={`translate(${RING_CX}, ${RING_CY}) scale(${0.7 + 0.3 * s})`}>
        {/* pulsing halo */}
        <circle r={RING_R + 46 + pulse * 16} fill="none" stroke={GOLD} strokeWidth={5} opacity={0.25 + pulse * 0.2} />
        {/* track */}
        <circle r={RING_R} fill="rgba(12,16,36,0.9)" stroke="rgba(190,200,225,0.22)" strokeWidth={34} />
        {/* progress */}
        <circle
          r={RING_R}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={34}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          transform="rotate(-90)"
          style={{filter: 'drop-shadow(0 0 24px rgba(245,192,68,0.65))'}}
        />
        {/* tick marks around the ring */}
        {Array.from({length: 48}).map((_, i) => {
          const a = (i / 48) * Math.PI * 2 - Math.PI / 2;
          const r1 = RING_R + 62;
          const r2 = RING_R + (i % 4 === 0 ? 88 : 76);
          return (
            <line
              key={`tk${i}`}
              x1={Math.cos(a) * r1}
              y1={Math.sin(a) * r1}
              x2={Math.cos(a) * r2}
              y2={Math.sin(a) * r2}
              stroke={i / 48 <= frac ? GOLD : 'rgba(190,200,225,0.28)'}
              strokeWidth={i % 4 === 0 ? 5 : 3}
            />
          );
        })}
        {/* labels */}
        <text x={0} y={-298} fill={MUTED} fontSize={32} fontFamily={MONO} letterSpacing={6} textAnchor="middle">
          POINTS BALANCE
        </text>
        <text
          x={0}
          y={-186}
          fill={INK}
          fontSize={104}
          fontFamily={MONO}
          fontWeight={800}
          textAnchor="middle"
          style={{textShadow: '0 0 30px rgba(245,192,68,0.45)'}}
        >
          {fmt(balance)}
        </text>
      </g>
      {/* goal caption under ring */}
      <g opacity={Math.min(1, s)}>
        <text x={RING_CX} y={RING_CY + RING_R + 130} fill={GOLD} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={2} textAnchor="middle">
          GOAL {fmt(GOAL)} PTS &middot; FREE CRAFTED COFFEE
        </text>
        <text x={RING_CX} y={RING_CY + RING_R + 196} fill={VIOLET_LIGHT} fontSize={36} fontFamily={MONO} fontWeight={700} textAnchor="middle">
          THIS WEEK +{fmt(weekPts)} PTS
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Reward badge payoff
// ---------------------------------------------------------------------------
const RewardBadge: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const bloom = spring({
    frame: frame - BADGE_AT,
    fps,
    config: {damping: 200, stiffness: 80},
  });
  if (bloom <= 0.001) return null;

  const stamp = spring({
    frame: frame - (BADGE_AT + 30),
    fps,
    config: {damping: 200, stiffness: 130},
  });

  // expanding shockwave
  const wave = interpolate(frame, [BADGE_AT, BADGE_AT + 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const twinkle = (ph: number) => 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.12 + ph));

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      {/* shockwave */}
      {wave < 1 && (
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={220 + wave * 560}
          fill="none"
          stroke={GOLD}
          strokeWidth={10 * (1 - wave) + 2}
          opacity={(1 - wave) * 0.85}
          style={{filter: 'drop-shadow(0 0 26px rgba(245,192,68,0.8))'}}
        />
      )}
      {/* badge */}
      <g
        opacity={Math.min(1, bloom)}
        transform={`translate(${RING_CX}, ${RING_CY}) scale(${0.4 + 0.6 * bloom})`}
      >
        <rect
          x={-470}
          y={-150}
          width={940}
          height={300}
          rx={70}
          fill="url(#goldGrad)"
          style={{filter: 'drop-shadow(0 0 60px rgba(245,192,68,0.85))'}}
        />
        <rect x={-470} y={-150} width={940} height={300} rx={70} fill="none" stroke="#FFF6DD" strokeWidth={4} opacity={0.7} />
        {/* ribbon notches */}
        <path d="M -470 -90 L -520 -90 L -520 90 L -470 90 Z" fill="#D9931F" />
        <path d="M 470 -90 L 520 -90 L 520 90 L 470 90 Z" fill="#D9931F" />
        <text x={0} y={-18} fill={DARK_TEXT} fontSize={72} fontFamily={FONT} fontWeight={800} letterSpacing={3} textAnchor="middle">
          REWARD UNLOCKED
        </text>
        <text x={0} y={62} fill={DARK_TEXT} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={2} textAnchor="middle" opacity={0.85}>
          FREE CRAFTED COFFEE &middot; REDEEM IN APP
        </text>
        {/* sparkles */}
        {[
          {x: -560, y: -190, ph: 0},
          {x: 560, y: -200, ph: 1.4},
          {x: 590, y: 170, ph: 2.6},
          {x: -590, y: 180, ph: 3.8},
        ].map((sp, i) => (
          <g key={`sp${i}`} opacity={twinkle(sp.ph)}>
            <path
              d={`M ${sp.x} ${sp.y - 26} L ${sp.x + 7} ${sp.y - 7} L ${sp.x + 26} ${sp.y} L ${sp.x + 7} ${sp.y + 7} L ${sp.x} ${sp.y + 26} L ${sp.x - 7} ${sp.y + 7} L ${sp.x - 26} ${sp.y} L ${sp.x - 7} ${sp.y - 7} Z`}
              fill={GOLD_LIGHT}
              style={{filter: 'drop-shadow(0 0 12px rgba(255,217,138,0.9))'}}
            />
          </g>
        ))}
      </g>
      {/* stamped seal */}
      {stamp > 0.001 && (
        <g opacity={Math.min(1, stamp)} transform={`translate(${RING_CX + 560}, ${RING_CY - 430}) rotate(14) scale(${0.6 + 0.4 * stamp})`}>
          <circle r={120} fill="none" stroke={VIOLET} strokeWidth={8} />
          <circle r={98} fill="none" stroke={VIOLET} strokeWidth={3} opacity={0.7} />
          <text x={0} y={-8} fill={VIOLET_LIGHT} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">
            +1,700
          </text>
          <text x={0} y={40} fill={VIOLET_LIGHT} fontSize={30} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
            EARNED
          </text>
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Bottom stat cards
// ---------------------------------------------------------------------------
const StatsRow: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const earned = Math.round(
    interpolate(frame, [RING_START, RING_END], [0, TOTAL_PTS], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const rewards = Math.round(
    interpolate(frame, [BADGE_AT, BADGE_AT + 40], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const cards = [
    {label: 'POINTS EARNED TODAY', value: `+${fmt(earned)}`, color: GOLD},
    {label: 'VISITS THIS MONTH', value: '18', color: VIOLET_LIGHT},
    {label: 'REWARDS READY', value: `${rewards}`, color: INK},
  ];

  const cardW = 860;
  const gap = 60;
  const totalW = cards.length * cardW + (cards.length - 1) * gap;
  const startX = (3840 - totalW) / 2;
  const y = 1760;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 3840, height: 2160, pointerEvents: 'none'}}>
      {cards.map((c, k) => {
        const s = spring({
          frame: frame - (STATS_START + k * 24),
          fps,
          config: {damping: 200, stiffness: 95},
        });
        if (s <= 0.001) return null;
        return (
          <div
            key={c.label}
            style={{
              position: 'absolute',
              left: startX + k * (cardW + gap),
              top: y + (1 - s) * 50,
              width: cardW,
              height: 230,
              borderRadius: 26,
              background:
                'linear-gradient(160deg, rgba(245,192,68,0.10), rgba(139,124,246,0.05) 60%, rgba(255,255,255,0.02))',
              border: '1.5px solid rgba(245,192,68,0.30)',
              padding: '36px 48px',
              opacity: Math.min(1, s),
            }}
          >
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>{c.label}</div>
            <div
              style={{
                color: c.color,
                fontFamily: MONO,
                fontWeight: 800,
                fontSize: 88,
                lineHeight: 1.15,
                marginTop: 10,
                textShadow: `0 0 26px ${c.color}55`,
              }}
            >
              {c.value}
            </div>
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
  const fade = interpolate(frame, [760, 810], [0, 1], {
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
        color: 'rgba(190,200,225,0.5)',
        fontFamily: FONT,
        fontSize: 26,
        opacity: fade,
      }}
    >
      Illustrative loyalty program visualization &middot; sample points values shown
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const LoyaltyPointsEarnRedeem: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <PurchasePanel frame={frame} fps={fps} />
      <PointsStream frame={frame} />
      <WalletRing frame={frame} fps={fps} />
      <RewardBadge frame={frame} fps={fps} />
      <StatsRow frame={frame} fps={fps} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};

export default LoyaltyPointsEarnRedeem;
