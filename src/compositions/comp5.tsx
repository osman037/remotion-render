/**
 * InventoryReplenishmentCycle.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A cinematic small-business-ops visual for POS/inventory SaaS brands,
 * retail consultants and small-biz educators: a stock-level gauge drains
 * with live sales ticks, hits the reorder line, fires a purchase order,
 * rides a shipping-transit arc, and restocks the shelf — landing on a
 * never-out-of-stock guard payoff. Deterministic seeded randomness only.
 *
 * Register in Root.tsx:
 *   <Composition id="InventoryReplenishmentCycle" component={InventoryReplenishmentCycle}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
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
// Palette (warehouse cinematic: deep slate, stock amber, restock green)
// ---------------------------------------------------------------------------
const BG = '#080B13';
const INK = '#F2F5FA';
const MUTED = 'rgba(242,245,250,0.60)';
const FAINT = 'rgba(242,245,250,0.32)';
const AMBER = '#FBBF24';
const ORANGE = '#FB923C';
const GREEN = '#34D399';
const GREEN_DEEP = '#065F46';
const TEAL = '#2DD4BF';
const CYAN = '#67E8F9';
const RED = '#F87171';
const PANEL = 'rgba(9,13,23,0.90)';
const HAIRLINE = 'rgba(242,245,250,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const DRAIN_START = 60;
const REORDER_AT = 470;   // stock hits the reorder line
const PO_AT = 490;        // purchase order fires
const TRANSIT_START = 530;
const DELIVERY_AT = 700;  // truck arrives, restock begins
const RESTOCK_END = 780;
const PAYOFF_START = 812;

const MAX_UNITS = 1200;
const REORDER_LINE = 300;

const unitsAt = (f: number): number => {
  if (f < DRAIN_START) return MAX_UNITS;
  if (f < REORDER_AT) return MAX_UNITS - 2.2 * (f - DRAIN_START);
  if (f < DELIVERY_AT) return REORDER_LINE - 2 - 0.5 * (f - REORDER_AT);
  if (f < RESTOCK_END) {
    const low = REORDER_LINE - 2 - 0.5 * (DELIVERY_AT - REORDER_AT);
    return low + (MAX_UNITS - low) * ((f - DELIVERY_AT) / (RESTOCK_END - DELIVERY_AT));
  }
  return MAX_UNITS - 1.2 * (f - RESTOCK_END);
};
const dailyRateAt = (f: number) => 132 + 9 * Math.sin(f * 0.06) + 4 * Math.sin(f * 0.23);
const fmtN = (v: number) =>
  Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const GX = 220;        // gauge x
const GW = 400;        // gauge width
const GY = 480;        // gauge top
const GH = 1180;       // gauge height
const gaugeY = (units: number) => GY + GH - (units / MAX_UNITS) * GH;
const reorderY = GY + GH - (REORDER_LINE / MAX_UNITS) * GH;

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="irGlow" cx="38%" cy="28%" r="80%">
      <stop offset="0%" stopColor="rgba(251,191,36,0.10)" />
      <stop offset="45%" stopColor="rgba(45,212,191,0.05)" />
      <stop offset="100%" stopColor="rgba(8,11,19,0)" />
    </radialGradient>
    <radialGradient id="irVignette" cx="50%" cy="50%" r="76%">
      <stop offset="58%" stopColor="rgba(3,5,10,0)" />
      <stop offset="100%" stopColor="rgba(1,2,6,0.80)" />
    </radialGradient>
    <linearGradient id="irScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(251,191,36,0)" />
      <stop offset="50%" stopColor="rgba(251,191,36,0.12)" />
      <stop offset="100%" stopColor="rgba(251,191,36,0)" />
    </linearGradient>
    <linearGradient id="irStock" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={AMBER} />
      <stop offset="100%" stopColor={ORANGE} />
    </linearGradient>
    <linearGradient id="irPayoff" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={GREEN} />
      <stop offset="55%" stopColor={TEAL} />
      <stop offset="100%" stopColor={CYAN} />
    </linearGradient>
    <filter id="irBlur70" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
    <filter id="irBlur16" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="16" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const drift = Math.sin((frame / 900) * Math.PI * 2) * 90;
  const scanY = (frame / 900) * 2500 - 300;
  const orbs: React.ReactElement[] = [];
  for (let i = 0; i < 6; i++) {
    const ox = random(`ir-orb-x-${i}`) * 3840;
    const oy = random(`ir-orb-y-${i}`) * 2160;
    const r = 260 + random(`ir-orb-r-${i}`) * 320;
    const hue =
      i % 3 === 0
        ? 'rgba(251,191,36,0.07)'
        : i % 3 === 1
        ? 'rgba(45,212,191,0.06)'
        : 'rgba(52,211,153,0.05)';
    const mx = Math.sin((frame / 900) * Math.PI * 2 + i * 1.9) * 120;
    const my = Math.cos((frame / 900) * Math.PI * 2 + i * 2.1) * 90;
    orbs.push(<circle key={i} cx={ox + mx} cy={oy + my} r={r} fill={hue} filter="url(#irBlur70)" />);
  }
  const dots: React.ReactElement[] = [];
  for (let gx = 70; gx < 3840; gx += 175) {
    for (let gy = 70; gy < 2160; gy += 175) {
      const jx = (random(`ir-dot-x-${gx}-${gy}`) - 0.5) * 26;
      const jy = (random(`ir-dot-y-${gx}-${gy}`) - 0.5) * 26;
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx + jx} cy={gy + jy} r={2.2} fill="rgba(242,245,250,0.05)" />
      );
    }
  }
  // conveyor slats streaming (per-frame motion)
  const slats: React.ReactElement[] = [];
  for (let i = 0; i < 12; i++) {
    const sx = ((random(`ir-slat-x-${i}`) * 4200 + frame * 9) % 4400 + 4400) % 4400 - 300;
    slats.push(<rect key={i} x={sx} y={1990} width={180} height={12} rx={6} fill="rgba(242,245,250,0.06)" />);
  }
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect width={3840} height={2160} fill="url(#irGlow)" transform={`translate(${drift},${-drift * 0.6})`} />
        {orbs}
        <g transform={`translate(${drift * 0.4},0)`}>{dots}</g>
        {slats}
        <rect x={0} y={scanY} width={3840} height={340} fill="url(#irScan)" />
        <rect width={3840} height={2160} fill="url(#irVignette)" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const rise = spring({frame, fps, config: {damping: 200, stiffness: 90, mass: 1}});
  const y = interpolate(rise, [0, 1], [70, 0]);
  const opacity = interpolate(rise, [0, 1], [0, 1]);
  const blink = 0.6 + 0.4 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div style={{position: 'absolute', top: 118, left: 220, right: 220, opacity, transform: `translateY(${y}px)`}}>
      <div style={{display: 'flex', alignItems: 'flex-start'}}>
        <div>
          <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 14, color: AMBER}}>
            RETAIL OPS &nbsp;·&nbsp; INVENTORY CONTROL
          </div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 148, color: INK, marginTop: 16, letterSpacing: -2}}>
            Inventory Replenishment
          </div>
          <div style={{fontFamily: FONT, fontSize: 40, color: MUTED, marginTop: 14}}>
            Drain, reorder, restock — the cycle that never lets a shelf go empty
          </div>
        </div>
        <div style={{marginLeft: 'auto', textAlign: 'right'}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 22, border: `2px solid ${TEAL}`, borderRadius: 16, padding: '14px 32px', backgroundColor: 'rgba(5,12,11,0.6)'}}>
            <div style={{width: 24, height: 24, borderRadius: 12, backgroundColor: TEAL, opacity: blink, boxShadow: `0 0 26px ${TEAL}`}} />
            <div style={{fontFamily: MONO, fontSize: 40, fontWeight: 700, color: INK, letterSpacing: 4}}>
              REORDER-POINT SYSTEM
            </div>
          </div>
          <div style={{fontFamily: MONO, fontSize: 32, color: FAINT, marginTop: 14}}>
            SKU-4471 · WIDGET PRO · LEAD TIME 6 DAYS
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stock gauge (left): draining tank, reorder line, safety zone, sale chips
// ---------------------------------------------------------------------------
const StockGauge: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 40, fps, config: {damping: 200, stiffness: 80}});
  const units = unitsAt(frame);
  const fy = gaugeY(units);
  const low = units < REORDER_LINE;
  const reorderS = spring({frame: frame - REORDER_AT, fps, config: {damping: 200, stiffness: 120}});

  // sale chips popping off the gauge surface
  const chips: React.ReactElement[] = [];
  for (let k = 0; k < 30; k++) {
    const ek = 80 + k * 26;
    const age = frame - ek;
    if (age < 0 || age > 70 || frame > DELIVERY_AT) continue;
    const t = age / 70;
    const n = 2 + Math.floor(random(`ir-sale-n-${k}`) * 5);
    const cx = GX + GW + 30 + t * 260;
    const cy = fy - 40 - t * 190;
    chips.push(
      <g key={k} opacity={1 - t}>
        <rect x={cx} y={cy} width={190} height={58} rx={12} fill="rgba(251,146,60,0.14)" stroke={ORANGE} strokeWidth={2} />
        <text x={cx + 95} y={cy + 40} fill={ORANGE} fontSize={32} fontFamily={MONO} fontWeight={700} textAnchor="middle">
          SALE −{n}
        </text>
      </g>
    );
  }

  // measurement ticks
  const ticks: React.ReactElement[] = [];
  for (let u = 0; u <= MAX_UNITS; u += 150) {
    const ty = gaugeY(u);
    ticks.push(
      <g key={u}>
        <line x1={GX - 34} y1={ty} x2={GX - 12} y2={ty} stroke="rgba(242,245,250,0.30)" strokeWidth={3} />
        <text x={GX - 52} y={ty + 11} fill={FAINT} fontSize={26} fontFamily={MONO} textAnchor="end">
          {u}
        </text>
      </g>
    );
  }

  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <div style={{position: 'absolute', left: GX, top: GY - 150}}>
        <div style={{fontFamily: MONO, fontSize: 36, letterSpacing: 8, color: MUTED}}>UNITS ON HAND</div>
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 120,
            color: low ? ORANGE : INK,
            textShadow: low ? '0 0 40px rgba(251,146,60,0.6)' : 'none',
          }}
        >
          {fmtN(units)}
        </div>
      </div>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        {/* tank */}
        <rect x={GX} y={GY} width={GW} height={GH} rx={24} fill="rgba(242,245,250,0.05)" stroke={HAIRLINE} strokeWidth={2.5} />
        {/* safety-stock zone (bottom 10%) */}
        <rect x={GX} y={GY + GH * 0.9} width={GW} height={GH * 0.1} fill="rgba(248,113,113,0.10)" />
        {/* fill */}
        <rect x={GX + 14} y={fy} width={GW - 28} height={GY + GH - 14 - fy} fill="url(#irStock)" opacity={0.92} />
        <rect x={GX + 14} y={fy} width={GW - 28} height={10} fill="#FFE9B8" opacity={0.9} filter="url(#irBlur16)" />
        {ticks}
        {/* reorder line */}
        <line x1={GX - 60} y1={reorderY} x2={GX + GW + 60} y2={reorderY} stroke={RED} strokeWidth={5} strokeDasharray="18 12" />
        <text x={GX + GW + 80} y={reorderY + 13} fill={RED} fontSize={34} fontFamily={MONO} fontWeight={800} letterSpacing={2}>
          REORDER {REORDER_LINE}
        </text>
        {chips}
        {/* reorder alarm */}
        {low && reorderS > 0.02 && (
          <g opacity={Math.min(1, reorderS)} transform={`scale(${Math.min(1, reorderS)})`}>
            <rect x={GX - 10} y={GY - 120} width={GW + 20} height={80} rx={14} fill="rgba(60,10,10,0.92)" stroke={RED} strokeWidth={3.5} />
            <text x={GX + GW / 2} y={GY - 66} fill={RED} fontSize={36} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={3}>
              ⚠ REORDER TRIGGERED
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Live sales ticker (center-top strip, per-frame updates)
// ---------------------------------------------------------------------------
const SALE_LINES = Array.from({length: 14}).map((_, i) => {
  const n = 1 + Math.floor(random(`ir-tick-n-${i}`) * 6);
  const amt = n * (24 + Math.floor(random(`ir-tick-p-${i}`) * 40));
  const ch = ['WEB', 'POS-2', 'POS-1', 'APP'][Math.floor(random(`ir-tick-c-${i}`) * 4)];
  return `SALE #${88410 + i * 7} · WIDGET PRO ×${n} · $${amt} · ${ch}`;
});
const SalesTicker: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 90, fps, config: {damping: 200, stiffness: 90}});
  const head = Math.floor(frame / 26) % SALE_LINES.length;
  const live = 0.6 + 0.4 * Math.sin((frame / 60) * Math.PI * 2);
  const rate = dailyRateAt(frame);
  return (
    <div
      style={{
        position: 'absolute',
        left: 800,
        top: 480,
        width: 1640,
        opacity: Math.min(1, enter),
        backgroundColor: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 20,
        padding: '30px 44px',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{width: 20, height: 20, borderRadius: 10, backgroundColor: ORANGE, opacity: live, boxShadow: `0 0 24px ${ORANGE}`}} />
        <div style={{fontFamily: MONO, fontSize: 32, letterSpacing: 8, color: ORANGE}}>LIVE SALES</div>
        <div style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 32, color: MUTED}}>
          RATE <span style={{color: INK, fontWeight: 700}}>{rate.toFixed(0)}/DAY</span>
        </div>
      </div>
      <div style={{marginTop: 18}}>
        {[0, 1].map((k) => {
          const line = SALE_LINES[(head + k) % SALE_LINES.length];
          return (
            <div
              key={`${head}-${k}`}
              style={{
                fontFamily: MONO,
                fontSize: 33,
                color: k === 0 ? INK : MUTED,
                opacity: k === 0 ? 1 : 0.5,
                marginTop: k === 0 ? 0 : 12,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Transit map: PO card fires, truck rides the supplier -> warehouse arc
// ---------------------------------------------------------------------------
const P0 = {x: 1010, y: 1090};
const PC = {x: 1620, y: 770};
const P1 = {x: 2230, y: 1090};
const bez = (t: number) => ({
  x: (1 - t) * (1 - t) * P0.x + 2 * (1 - t) * t * PC.x + t * t * P1.x,
  y: (1 - t) * (1 - t) * P0.y + 2 * (1 - t) * t * PC.y + t * t * P1.y,
});

const TransitMap: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 150, fps, config: {damping: 200, stiffness: 80}});
  const poS = spring({frame: frame - PO_AT, fps, config: {damping: 200, stiffness: 100}});
  const poFade = 1 - interpolate(frame, [TRANSIT_START, TRANSIT_START + 50], [0, 1], clamp01);
  const t = interpolate(frame, [TRANSIT_START, DELIVERY_AT], [0, 1], clamp01);
  const arcDraw = interpolate(frame, [PO_AT, TRANSIT_START + 30], [0, 1], clamp01);
  const truck = bez(t);
  const day = Math.min(6, 1 + Math.floor(t * 6));
  const delivered = frame >= DELIVERY_AT;
  const delS = spring({frame: frame - DELIVERY_AT, fps, config: {damping: 200, stiffness: 120}});
  const arcD = `M ${P0.x} ${P0.y} Q ${PC.x} ${PC.y} ${P1.x} ${P1.y}`;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={800} y={700} width={1640} height={560} rx={22} fill={PANEL} stroke={HAIRLINE} strokeWidth={2} />
        <text x={844} y={772} fill={TEAL} fontSize={32} fontFamily={MONO} letterSpacing={8}>
          REPLENISHMENT IN MOTION
        </text>
        {/* arc */}
        <path d={arcD} fill="none" stroke="rgba(242,245,250,0.14)" strokeWidth={6} strokeDasharray="16 14" />
        <path
          d={arcD}
          fill="none"
          stroke={TEAL}
          strokeWidth={7}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - arcDraw}
          style={{filter: 'drop-shadow(0 0 12px rgba(45,212,191,0.6))'}}
        />
        {/* supplier + warehouse nodes */}
        <circle cx={P0.x} cy={P0.y} r={44} fill="#131A28" stroke={AMBER} strokeWidth={5} />
        <text x={P0.x} y={P0.y + 13} fill={AMBER} fontSize={36} fontFamily={MONO} fontWeight={800} textAnchor="middle">S</text>
        <text x={P0.x} y={P0.y + 96} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle">SUPPLIER</text>
        <circle cx={P1.x} cy={P1.y} r={44} fill="#131A28" stroke={delivered ? GREEN : FAINT} strokeWidth={5} />
        <text x={P1.x} y={P1.y + 13} fill={delivered ? GREEN : FAINT} fontSize={36} fontFamily={MONO} fontWeight={800} textAnchor="middle">W</text>
        <text x={P1.x} y={P1.y + 96} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle">WAREHOUSE</text>
        {/* truck */}
        {t > 0.001 && t < 0.999 && (
          <g>
            <circle cx={truck.x} cy={truck.y} r={40} fill="rgba(45,212,191,0.18)" />
            <rect x={truck.x - 46} y={truck.y - 26} width={92} height={52} rx={12} fill={TEAL} style={{filter: 'drop-shadow(0 0 18px rgba(45,212,191,0.8))'}} />
            <rect x={truck.x - 46} y={truck.y - 26} width={30} height={52} rx={12} fill="#0B3B36" />
            <text x={truck.x} y={truck.y - 52} fill={TEAL} fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              DAY {day}/6
            </text>
          </g>
        )}
        {/* PO card */}
        {poS > 0.02 && poFade > 0.01 && (
          <g opacity={Math.min(1, poS) * poFade} transform={`translate(1180,820) scale(${Math.min(1, poS)})`}>
            <rect x={-260} y={-90} width={520} height={180} rx={18} fill="rgba(8,20,18,0.95)" stroke={TEAL} strokeWidth={4} style={{filter: 'drop-shadow(0 0 30px rgba(45,212,191,0.5))'}} />
            <text x={0} y={-34} fill={TEAL} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={3}>
              PURCHASE ORDER
            </text>
            <text x={0} y={22} fill={INK} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              PO-8841 · 1,200 UNITS
            </text>
            <text x={0} y={64} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle">
              SENT TO SUPPLIER ✓
            </text>
          </g>
        )}
        {/* delivered stamp */}
        {delivered && delS > 0.02 && (
          <g opacity={Math.min(1, delS)} transform={`translate(${P1.x - 130},${P1.y - 190}) scale(${Math.min(1, delS)}) rotate(-8)`}>
            <rect x={0} y={0} width={260} height={76} rx={14} fill="rgba(6,40,28,0.94)" stroke={GREEN} strokeWidth={4} />
            <text x={130} y={52} fill={GREEN} fontSize={38} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              DELIVERED ✓
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Shelf grid: 12 facings empty and refill with the stock level
// ---------------------------------------------------------------------------
const ShelfGrid: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 200, fps, config: {damping: 200, stiffness: 80}});
  const units = unitsAt(frame);
  const filled = Math.round(12 * (units / MAX_UNITS));
  const slots: React.ReactElement[] = [];
  for (let i = 0; i < 12; i++) {
    const col = i % 6;
    const row = Math.floor(i / 6);
    const sx = 800 + col * 268;
    const sy = 1360 + row * 180;
    const isFilled = i < filled;
    slots.push(
      <g key={i}>
        {isFilled ? (
          <g>
            <rect x={sx} y={sy} width={240} height={150} rx={16} fill="url(#irStock)" opacity={0.9} />
            <rect x={sx} y={sy} width={240} height={44} rx={16} fill="#FFE9B8" opacity={0.55} />
            <text x={sx + 120} y={sy + 100} fill="#3A2404" fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              PRO
            </text>
          </g>
        ) : (
          <rect x={sx} y={sy} width={240} height={150} rx={16} fill="none" stroke="rgba(242,245,250,0.22)" strokeWidth={3} strokeDasharray="12 10" />
        )}
      </g>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <text x={800} y={1320} fill={AMBER} fontSize={32} fontFamily={MONO} letterSpacing={8}>
          SHELF AVAILABILITY · {filled}/12 FACINGS
        </text>
        {slots}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Metrics panel (right column)
// ---------------------------------------------------------------------------
const MetricsPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 120, fps, config: {damping: 200, stiffness: 80}});
  const units = unitsAt(frame);
  const rate = dailyRateAt(frame);
  const cover = units / rate;
  const PX = 2620;
  const rows = [
    {label: 'UNITS ON HAND', value: fmtN(units), color: units < REORDER_LINE ? ORANGE : INK},
    {label: 'DAILY SALES RATE', value: `${rate.toFixed(0)}/DAY`, color: INK},
    {label: 'DAYS OF COVER', value: cover.toFixed(1), color: cover < 3 ? RED : cover < 6 ? AMBER : GREEN},
    {label: 'REORDER POINT', value: fmtN(REORDER_LINE), color: MUTED},
    {label: 'STOCKOUTS', value: '0', color: GREEN},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={PX} y={480} width={980} height={920} rx={22} fill={PANEL} stroke={HAIRLINE} strokeWidth={2} />
        <text x={PX + 44} y={552} fill={TEAL} fontSize={32} fontFamily={MONO} letterSpacing={8}>
          INVENTORY METRICS
        </text>
        {rows.map((r, i) => {
          const s = spring({frame: frame - (120 + i * 26), fps, config: {damping: 200, stiffness: 120}});
          if (s <= 0.001) return null;
          const ry = 640 + i * 150;
          return (
            <g key={r.label} opacity={Math.min(1, s)}>
              <text x={PX + 44} y={ry} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={4}>
                {r.label}
              </text>
              <text x={PX + 936} y={ry + 66} fill={r.color} fontSize={72} fontFamily={MONO} fontWeight={800} textAnchor="end">
                {r.value}
              </text>
              <line x1={PX + 44} y1={ry + 100} x2={PX + 936} y2={ry + 100} stroke="rgba(242,245,250,0.08)" strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', left: PX, top: 1440, width: 980, backgroundColor: PANEL, border: `1px solid ${HAIRLINE}`, borderRadius: 20, padding: '34px 44px'}}>
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: TEAL}}>REORDER POLICY</div>
        <div style={{fontFamily: MONO, fontSize: 34, color: MUTED, marginTop: 18, lineHeight: 1.7}}>
          REORDER POINT <span style={{color: INK, fontWeight: 700}}>300 UNITS</span>
          <br />
          SAFETY STOCK <span style={{color: INK, fontWeight: 700}}>120 UNITS</span> · LEAD TIME <span style={{color: INK, fontWeight: 700}}>6 DAYS</span>
          <br />
          ORDER QUANTITY <span style={{color: GREEN, fontWeight: 700}}>1,200 UNITS</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payoff banner: NEVER OUT OF STOCK guard
// ---------------------------------------------------------------------------
const PayoffBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - PAYOFF_START, fps, config: {damping: 200, stiffness: 70}});
  if (enter <= 0.001) return null;
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const flash = interpolate(frame, [PAYOFF_START + 20, PAYOFF_START + 80], [0, 1], clamp01);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `scale(${0.94 + enter * 0.06})`,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(4,11,9,0.95)',
          border: `3px solid ${GREEN}`,
          borderRadius: 26,
          padding: '44px 90px',
          textAlign: 'center',
          boxShadow: `0 0 140px rgba(52,211,153,${0.25 + flash * 0.35})`,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 42, letterSpacing: 14, color: GREEN}}>0 STOCKOUTS · 98.7% FILL RATE</div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 100,
            marginTop: 8,
            background: 'linear-gradient(90deg,#34D399,#2DD4BF,#67E8F9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 4,
          }}
        >
          NEVER OUT OF STOCK
        </div>
        <div style={{fontFamily: MONO, fontSize: 36, color: MUTED, marginTop: 12}}>
          REORDER AT 300 → PO-8841 → 6-DAY TRANSIT → SHELF RESTOCKED
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain (full-frame, re-seeded every frame)
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 900;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`ir-grain-x-${frame}-${i}`) * 3840;
    const y = random(`ir-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`ir-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`ir-grain-s-${frame}-${i}`) * 2.5;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const InventoryReplenishmentCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <StockGauge frame={frame} fps={fps} />
      <SalesTicker frame={frame} fps={fps} />
      <TransitMap frame={frame} fps={fps} />
      <ShelfGrid frame={frame} fps={fps} />
      <MetricsPanel frame={frame} fps={fps} />
      <PayoffBanner frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
