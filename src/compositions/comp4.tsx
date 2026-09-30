/**
 * MarketplaceSellerFees.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A brand-neutral marketplace seller fee waterfall for seller-education
 * courses, ecommerce agencies, and seller SaaS: a $120 sale breaks into a
 * fee-slice waterfall (referral, fulfillment, storage, returns reserve),
 * and the payoff is the net-profit bar with a margin ring. Demand-validated
 * 2026-09-30 (PROVEN).
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette (commerce teal + amber on ink)
// ---------------------------------------------------------------------------
const BG = '#071009';
const INK = '#F1F7F2';
const MUTED = 'rgba(241,247,242,0.58)';
const TEAL = '#2DD4BF';
const AMBER = '#FBBF24';
const RED = '#F87171';
const PURPLE = '#A78BFA';
const BLUE = '#60A5FA';
const GREEN = '#34D399';
const PANEL = 'rgba(8,20,14,0.92)';
const HAIRLINE = 'rgba(241,247,242,0.15)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Data: $120 sale waterfall
// ---------------------------------------------------------------------------
const SALE = 120;
interface Fee {name: string; pct: number; amount?: number; color: string; note: string}
const FEES: Fee[] = [
  {name: 'REFERRAL FEE', pct: 15, color: RED, note: '15% of sale price'},
  {name: 'FULFILLMENT', pct: 0, amount: 6.38, color: AMBER, note: 'pick · pack · ship'},
  {name: 'STORAGE', pct: 0, amount: 2.10, color: PURPLE, note: 'monthly / unit'},
  {name: 'RETURNS RESERVE', pct: 0, amount: 3.60, color: BLUE, note: '3% buffer'},
];
const feeAmount = (f: Fee): number =>
  f.pct > 0 ? (SALE * f.pct) / 100 : (f.amount ?? 0);
const TOTAL_FEES = FEES.reduce((a, f) => a + feeAmount(f), 0);
const NET = SALE - TOTAL_FEES;
const MARGIN = (NET / SALE) * 100;

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const SALE_START = 40;
const FEE_START = 220;
const FEE_GAP = 95;
const NET_START = 660;
const MARGIN_START = 720;

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="msGlow" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stopColor="#0B3B32" stopOpacity={0.8} />
      <stop offset="55%" stopColor="#0A241E" stopOpacity={0.3} />
      <stop offset="100%" stopColor="#071009" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="msVig" cx="50%" cy="50%" r="72%">
      <stop offset="0%" stopColor="#000000" stopOpacity={0} />
      <stop offset="78%" stopColor="#000000" stopOpacity={0} />
      <stop offset="100%" stopColor="#010604" stopOpacity={0.85} />
    </radialGradient>
    <linearGradient id="msSweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0} />
      <stop offset="50%" stopColor="#2DD4BF" stopOpacity={0.10} />
      <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
    </linearGradient>
    <filter id="msGlow10" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation={10} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: teal glow + vignette + drifting coin field + vertical sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const coins: React.ReactElement[] = [];
  for (let i = 0; i < 90; i++) {
    const bx = random(`ms-coin-x-${i}`) * 3840;
    const by = random(`ms-coin-y-${i}`) * 2160;
    const y = ((by + frame * (0.6 + random(`ms-coin-v-${i}`) * 1.2)) % 2300) - 70;
    const o = 0.04 + random(`ms-coin-o-${i}`) * 0.06;
    const r = 3 + random(`ms-coin-r-${i}`) * 7;
    coins.push(<circle key={i} cx={bx} cy={y} r={r} fill="#2DD4BF" opacity={o} />);
  }
  const sweepX = interpolate(frame, [0, 900], [-500, 4340], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      <rect width={3840} height={2160} fill={BG} />
      <rect width={3840} height={2160} fill="url(#msGlow)" />
      <g>{coins}</g>
      <rect x={sweepX - 300} y={0} width={600} height={2160} fill="url(#msSweep)" />
      <rect width={3840} height={2160} fill="url(#msVig)" />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Film grain
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 1100;

const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const rects: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`ms-grain-x-${frame}-${i}`) * 3840;
    const y = random(`ms-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`ms-grain-o-${frame}-${i}`) * 0.045;
    const s = 2 + random(`ms-grain-s-${frame}-${i}`) * 2.5;
    const white = random(`ms-grain-w-${frame}-${i}`) > 0.5;
    rects.push(
      <rect key={i} x={x} y={y} width={s} height={s} fill={white ? '#FFFFFF' : '#000000'} opacity={o} />,
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      {rects}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const p = spring({frame: Math.max(0, frame - 8), fps, config: {damping: 120, stiffness: 160}});
  const y = interpolate(p, [0, 1], [60, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = interpolate(p, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 110, left: 0, right: 0, opacity: op, transform: `translateY(${y}px)`, textAlign: 'center'}}>
      <div style={{fontFamily: MONO, fontSize: 34, letterSpacing: 10, color: MUTED}}>
        MARKETPLACE SELLER ECONOMICS
      </div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 112, letterSpacing: 8, color: INK, marginTop: 24}}>
        WHERE YOUR <span style={{color: TEAL}}>$120</span> SALE GOES
      </div>
      <div style={{fontFamily: MONO, fontSize: 36, letterSpacing: 16, color: AMBER, marginTop: 16}}>
        THE FEE WATERFALL
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Waterfall: sale bar -> fee slices -> net bar
// ---------------------------------------------------------------------------
const BAR_LEFT = 480;
const BAR_WIDTH = 2880;
const ROW_H = 108;
const ROW_GAP = 46;
const TOP = 640;

const Waterfall: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const rows: React.ReactElement[] = [];
  let running = SALE;

  // Sale bar (full width)
  const saleP = interpolate(frame, [SALE_START, SALE_START + 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  rows.push(
    <WaterfallRow
      key="sale"
      y={TOP}
      label="SALE PRICE"
      note="1 unit · $120.00"
      value={SALE}
      widthFrac={saleP}
      color={TEAL}
      big
    />,
  );

  // Fee slices
  FEES.forEach((f, i) => {
    const start = FEE_START + i * FEE_GAP;
    const p = interpolate(frame, [start, start + 80], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const amt = feeAmount(f);
    running -= amt;
    const y = TOP + (i + 1) * (ROW_H + ROW_GAP);
    rows.push(
      <WaterfallRow
        key={f.name}
        y={y}
        label={f.name}
        note={`${f.pct > 0 ? f.pct + '%' : '$' + (f.amount ?? 0).toFixed(2)} · ${f.note}`}
        value={amt}
        widthFrac={p * (amt / SALE)}
        color={f.color}
        offset={p * (running / SALE)}
      />,
    );
    // Remaining indicator
    const remP = interpolate(frame, [start + 60, start + 110], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    if (remP > 0) {
      rows.push(
        <text
          key={`rem-${i}`}
          x={BAR_LEFT + BAR_WIDTH + 40}
          y={y + 68}
          fontFamily={MONO}
          fontSize={34}
          fill={MUTED}
          opacity={remP}
        >
          ${running.toFixed(2)} LEFT
        </text>,
      );
    }
  });

  // Net profit bar
  const netP = spring({frame: Math.max(0, frame - NET_START), fps, config: {damping: 100, stiffness: 170}});
  const netW = interpolate(netP, [0, 1], [0, NET / SALE], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const netY = TOP + FEES.length * (ROW_H + ROW_GAP) + 60;
  const netOn = frame >= NET_START;
  rows.push(
    <g key="net">
      <text x={BAR_LEFT} y={netY - 24} fontFamily={FONT} fontWeight={800} fontSize={52} letterSpacing={4} fill={GREEN} opacity={netOn ? 1 : 0}>
        NET PROFIT — ${NET.toFixed(2)}
      </text>
      <rect x={BAR_LEFT} y={netY} width={BAR_WIDTH} height={ROW_H + 30} rx={18} fill="rgba(241,247,242,0.07)" stroke={HAIRLINE} strokeWidth={2} />
      <rect
        x={BAR_LEFT}
        y={netY}
        width={BAR_WIDTH * netW}
        height={ROW_H + 30}
        rx={18}
        fill={GREEN}
        filter="url(#msGlow10)"
        opacity={netOn ? 1 : 0}
      />
      {netOn && (
        <text
          x={BAR_LEFT + BAR_WIDTH * netW - 40}
          y={netY + 92}
          textAnchor="end"
          fontFamily={MONO}
          fontWeight={700}
          fontSize={44}
          fill="#06231C"
          opacity={netW > 0.15 ? 1 : 0}
        >
          ${NET.toFixed(2)}
        </text>
      )}
    </g>,
  );

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
      {rows}
    </svg>
  );
};

const WaterfallRow: React.FC<{
  y: number;
  label: string;
  note: string;
  value: number;
  widthFrac: number;
  color: string;
  big?: boolean;
  offset?: number;
}> = ({y, label, note, value, widthFrac, color, big, offset = 0}) => {
  const w = Math.max(0, BAR_WIDTH * widthFrac);
  const x = BAR_LEFT + BAR_WIDTH * offset;
  return (
    <g opacity={widthFrac > 0 ? 1 : 0}>
      <text x={BAR_LEFT} y={y - 24} fontFamily={MONO} fontSize={big ? 38 : 32} letterSpacing={big ? 8 : 5} fill={big ? INK : MUTED} fontWeight={big ? 700 : 400}>
        {label}
      </text>
      <text x={BAR_LEFT + BAR_WIDTH} y={y - 24} textAnchor="end" fontFamily={MONO} fontSize={34} fill={color} fontWeight={700}>
        −${value.toFixed(2)}
      </text>
      <rect x={BAR_LEFT} y={y} width={BAR_WIDTH} height={ROW_H} rx={16} fill="rgba(241,247,242,0.05)" />
      {w > 2 && (
        <rect x={x} y={y} width={w} height={ROW_H} rx={16} fill={color} filter="url(#msGlow10)" />
      )}
      <text x={BAR_LEFT} y={y + ROW_H + 36} fontFamily={MONO} fontSize={28} fill={MUTED} letterSpacing={2}>
        {note}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Margin ring payoff
// ---------------------------------------------------------------------------
const MarginRing: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const on = frame >= MARGIN_START;
  const p = on
    ? spring({frame: frame - MARGIN_START, fps, config: {damping: 90, stiffness: 130}})
    : 0;
  const R = 200;
  const C = 2 * Math.PI * R;
  const shown = MARGIN * interpolate(p, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cx = 1920;
  const cy = 1770;
  if (!on) return null;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={3840} height={2160} style={{position: 'absolute', inset: 0}}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(241,247,242,0.10)" strokeWidth={34} />
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={GREEN}
          strokeWidth={34}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - shown / 100)}
          transform={`rotate(-90 ${cx} ${cy})`}
          filter="url(#msGlow10)"
        />
        <text x={cx} y={cy - 10} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={110} fill={INK}>
          {shown.toFixed(1)}%
        </text>
        <text x={cx} y={cy + 66} textAnchor="middle" fontFamily={MONO} fontSize={32} letterSpacing={8} fill={MUTED}>
          NET MARGIN
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Live fee ticker (per-frame motion)
// ---------------------------------------------------------------------------
const LiveTicker: React.FC<{frame: number}> = ({frame}) => {
  const feesSoFar = Math.min(TOTAL_FEES, (frame / 700) * TOTAL_FEES * 1.35);
  const pct = Math.min(100, (frame / 700) * 100 * 1.35);
  return (
    <div style={{position: 'absolute', top: 380, right: 240, textAlign: 'right'}}>
      <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: MUTED}}>FEES PAID SO FAR</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 84, color: RED, textShadow: '0 0 30px rgba(248,113,113,0.35)'}}>
        ${feesSoFar.toFixed(2)}
      </div>
      <div style={{fontFamily: MONO, fontSize: 28, letterSpacing: 4, color: MUTED, marginTop: 6}}>
        {pct.toFixed(1)}% OF SALE EATEN BY FEES
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bottom strip: per-frame scrolling insight
// ---------------------------------------------------------------------------
const STRIP = '  •  ESTABLISHED SELLER BRANDS AVERAGE ~13% NET MARGIN AFTER FEES, SHIPPING & ADS    •  KNOW YOUR FEE STACK BEFORE YOU PRICE    •  REFERRAL + FULFILLMENT + STORAGE = THE BIG THREE    ';

const Strip: React.FC<{frame: number}> = ({frame}) => {
  const x = -((frame * 7) % 2400);
  return (
    <div style={{position: 'absolute', bottom: 56, left: 0, right: 0, overflow: 'hidden', borderTop: `2px solid ${HAIRLINE}`, borderBottom: `2px solid ${HAIRLINE}`, padding: '22px 0'}}>
      <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 5, color: MUTED, whiteSpace: 'nowrap', transform: `translateX(${x}px)`}}>
        {STRIP.repeat(3)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const MarketplaceSellerFees: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Defs />
      <Background frame={frame} />
      <Header frame={frame} fps={fps} />
      <LiveTicker frame={frame} />
      <Waterfall frame={frame} fps={fps} />
      <MarginRing frame={frame} fps={fps} />
      <Strip frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
