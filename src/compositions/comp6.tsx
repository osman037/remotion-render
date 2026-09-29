/**
 * ProductReturnFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A reverse-logistics story on deep slate teal: the delivered box starts its
 * journey home — QR return label generates, drop-off scans ping, the route
 * rewinds to the warehouse, inspection branches to refund or restock, and the
 * refund counter pays off. Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="ProductReturnFlow" component={ProductReturnFlow}
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
// Palette (deep slate teal + return amber)
// ---------------------------------------------------------------------------
const BG = '#0B1E22';
const INK = '#EBF5F5';
const MUTED = 'rgba(235,245,245,0.60)';
const TEAL = '#2DD4BF';
const TEAL_DEEP = '#0E7C6F';
const AMBER = '#FBBF24';
const GREEN = '#34D399';
const RED = '#FF6B6B';
const PANEL = 'rgba(15,40,46,0.82)';
const HAIRLINE = 'rgba(235,245,245,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const LABEL_START = 60;
const ROUTE_START = 180;
const SCAN_START = 330;
const INSPECT_START = 500;
const REFUND_START = 640;
const RESOLVE_START = 810;

const STAGES = ['RETURN REQUEST', 'QR LABEL', 'DROP-OFF', 'IN TRANSIT', 'INSPECT', 'REFUND'];
const STAGE_TIMES = [LABEL_START - 20, LABEL_START, SCAN_START, ROUTE_START + 40, INSPECT_START, REFUND_START];

// ---------------------------------------------------------------------------
// Route geometry (doorstep -> warehouse, reverse of the sale)
// ---------------------------------------------------------------------------
const P_DOOR = {x: 3100, y: 1080};
const P_HUB = {x: 2050, y: 700};
const P_WARE = {x: 900, y: 1080};

const routePoint = (t: number) => {
  // quadratic-ish path through hub
  const x = (1 - t) * (1 - t) * P_DOOR.x + 2 * (1 - t) * t * P_HUB.x + t * t * P_WARE.x;
  const y = (1 - t) * (1 - t) * P_DOOR.y + 2 * (1 - t) * t * P_HUB.y + t * t * P_WARE.y;
  return {x, y};
};

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="prGlow" cx="50%" cy="30%" r="72%">
      <stop offset="0%" stopColor="rgba(45,212,191,0.12)" />
      <stop offset="55%" stopColor="rgba(45,212,191,0.035)" />
      <stop offset="100%" stopColor="rgba(11,30,34,0)" />
    </radialGradient>
    <radialGradient id="prVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(4,13,15,0)" />
      <stop offset="100%" stopColor="rgba(4,13,15,0.72)" />
    </radialGradient>
    <linearGradient id="prRoute" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={TEAL_DEEP} />
      <stop offset="100%" stopColor={TEAL} />
    </linearGradient>
    <filter id="prGlow14" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="prShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.55" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const driftX = (frame * 0.3) % 120;
  const driftY = (frame * 0.2) % 120;
  const scanY = ((frame / 900) * (2160 + 300)) % (2160 + 300) - 150;
  const dots: React.ReactElement[] = [];
  for (let gx = 0; gx <= 33; gx++) {
    for (let gy = 0; gy <= 19; gy++) {
      const shimmer = 0.05 + 0.05 * Math.sin(frame * 0.075 + gx * 1.2 + gy * 0.8);
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx * 120 - driftX} cy={gy * 120 - driftY} r={2.2} fill="#2DD4BF" opacity={shimmer} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#prGlow)" />
        {dots}
        <rect x={0} y={scanY - 80} width={3840} height={160} fill="rgba(45,212,191,0.03)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#prVignette)" />
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [0, 40], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 80 + rise, left: 200, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
        The <span style={{color: TEAL}}>return journey</span>, in reverse
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        REVERSE LOGISTICS &middot; ORDER #8841-2290
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage rail
// ---------------------------------------------------------------------------
const StageRail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 25, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const railX = 200; const railW = 3440; const railY = 340;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <line x1={railX} y1={railY} x2={railX + railW} y2={railY} stroke={HAIRLINE} strokeWidth={8} strokeLinecap="round" />
        {STAGES.map((st, i) => {
          const active = frame >= STAGE_TIMES[i];
          const done = i < STAGES.length - 1 ? frame >= STAGE_TIMES[i + 1] : frame >= RESOLVE_START;
          const x = railX + (i / (STAGES.length - 1)) * railW;
          return (
            <g key={st}>
              {i < STAGES.length - 1 && (() => {
                const nx = railX + ((i + 1) / (STAGES.length - 1)) * railW;
                const cf = interpolate(frame, [STAGE_TIMES[i], STAGE_TIMES[i + 1]], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
                return (
                  <line x1={x} y1={railY} x2={x + (nx - x) * cf} y2={railY}
                    stroke={done ? GREEN : TEAL} strokeWidth={8} strokeLinecap="round" filter="url(#prGlow14)" />
                );
              })()}
              <circle cx={x} cy={railY} r={active ? 34 : 24}
                fill={done ? GREEN : active ? TEAL : BG}
                stroke={done ? GREEN : active ? TEAL : HAIRLINE} strokeWidth={6} />
              {done && (
                <text x={x} y={railY + 12} textAnchor="middle" fill="#0B1E22" fontSize={34} fontWeight={800}>&#10003;</text>
              )}
              <text x={x} y={railY + 84} textAnchor="middle"
                fill={active ? INK : MUTED} fontSize={28} fontFamily={MONO}
                fontWeight={active ? 800 : 500} letterSpacing={2}>{st}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// QR label card (left) + map with traveling box (center) + inspection (right)
// ---------------------------------------------------------------------------
const QRCode: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - LABEL_START, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  // deterministic faux-QR blocks
  const cells: React.ReactElement[] = [];
  for (let cx = 0; cx < 12; cx++) {
    for (let cy = 0; cy < 12; cy++) {
      if (random(`qr-${cx}-${cy}`) > 0.52) {
        cells.push(<rect key={`${cx}-${cy}`} x={cx * 22} y={cy * 22} width={19} height={19} fill={INK} />);
      }
    }
  }
  return (
    <div style={{
      position: 'absolute', left: 200, top: 600, width: 560,
      opacity: Math.min(1, s), transform: `scale(${0.8 + 0.2 * Math.min(1, s)})`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 28, padding: '44px',
        border: `3px solid ${TEAL}`, filter: 'url(#prShadow)',
        boxShadow: '0 0 50px rgba(45,212,191,0.3)', textAlign: 'center',
      }}>
        <div style={{color: TEAL, fontFamily: MONO, fontWeight: 800, fontSize: 32, letterSpacing: 3}}>
          RETURN LABEL
        </div>
        <svg width={264} height={264} viewBox="0 0 264 264" style={{margin: '24px auto 0', display: 'block'}}>
          <rect x={0} y={0} width={264} height={264} fill="#0B1E22" rx={12} />
          <g transform="translate(6,6)">{cells}</g>
          <rect x={6} y={6} width={62} height={62} fill="none" stroke={TEAL} strokeWidth={8} />
          <rect x={196} y={6} width={62} height={62} fill="none" stroke={TEAL} strokeWidth={8} />
          <rect x={6} y={196} width={62} height={62} fill="none" stroke={TEAL} strokeWidth={8} />
        </svg>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, marginTop: 20}}>
          RMA-8841-2290 &middot; prepaid postage
        </div>
      </div>
    </div>
  );
};

const RouteMap: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (ROUTE_START - 40), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const t = interpolate(frame, [ROUTE_START, ROUTE_START + 300], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pos = routePoint(t);
  const pathD = `M ${P_DOOR.x} ${P_DOOR.y} Q ${P_HUB.x + 320} ${P_HUB.y - 120} ${P_WARE.x} ${P_WARE.y}`;

  const scanned = Math.floor(interpolate(frame, [SCAN_START, SCAN_START + 200], [0, 3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const scanPts = [
    {x: 2680, y: 940, label: 'PICKUP'},
    {x: 2050, y: 700, label: 'HUB SORT'},
    {x: 1340, y: 920, label: 'REGIONAL'},
  ];

  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <path d={pathD} fill="none" stroke="rgba(235,245,245,0.14)" strokeWidth={6} strokeDasharray="18 20" />
        <path d={pathD} fill="none" stroke="url(#prRoute)" strokeWidth={6} strokeLinecap="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} filter="url(#prGlow14)" />
        {/* warehouse pin */}
        <g transform={`translate(${P_WARE.x}, ${P_WARE.y})`}>
          <circle r={46} fill={TEAL} opacity={0.25} />
          <rect x={-40} y={-40} width={80} height={80} rx={14} fill={TEAL} />
          <text x={0} y={16} textAnchor="middle" fontSize={44} fill="#0B1E22" fontWeight={800}>&#8962;</text>
          <text x={0} y={110} textAnchor="middle" fill={MUTED} fontSize={30} fontFamily={MONO}>WAREHOUSE</text>
        </g>
        {/* doorstep pin */}
        <g transform={`translate(${P_DOOR.x}, ${P_DOOR.y})`}>
          <circle r={36} fill={AMBER} opacity={0.25} />
          <circle r={26} fill={AMBER} />
          <text x={0} y={92} textAnchor="middle" fill={MUTED} fontSize={30} fontFamily={MONO}>CUSTOMER</text>
        </g>
        {/* scan pings */}
        {scanPts.map((p, i) => {
          if (i >= scanned) return null;
          const pulse = 0.5 + 0.5 * Math.sin(frame * 0.2 + i);
          return (
            <g key={p.label} transform={`translate(${p.x}, ${p.y})`}>
              <circle r={20 + pulse * 16} fill="none" stroke={TEAL} strokeWidth={4} opacity={0.8 - pulse * 0.3} />
              <circle r={10} fill={TEAL} />
              <text x={0} y={-46} textAnchor="middle" fill={TEAL} fontSize={28} fontFamily={MONO} fontWeight={800}>
                {p.label} &#10003;
              </text>
            </g>
          );
        })}
        {/* the box traveling home */}
        <g transform={`translate(${pos.x - 60}, ${pos.y - 46})`} opacity={t >= 1 ? 0 : 1}>
          <rect x={0} y={0} width={120} height={92} rx={10} fill="#C98A3B" stroke="#8A5A22" strokeWidth={5} />
          <line x1={60} y1={0} x2={60} y2={92} stroke="#8A5A22" strokeWidth={5} />
          <rect x={38} y={30} width={44} height={32} fill="#0B1E22" opacity={0.85} rx={4} />
        </g>
      </svg>
      <div style={{position: 'absolute', left: 1380, top: 1320, width: 1080, textAlign: 'center'}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>MILES TO WAREHOUSE</div>
        <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 92, marginTop: 8}}>
          {Math.round(842 * (1 - t))}
        </div>
        <div style={{color: TEAL, fontFamily: MONO, fontSize: 32, marginTop: 4}}>
          ETA {Math.max(0, Math.round(4 * (1 - t)))} DAYS
        </div>
      </div>
    </div>
  );
};

const Inspection: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - INSPECT_START, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const verdict = interpolate(frame, [INSPECT_START + 60, INSPECT_START + 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const refund = interpolate(frame, [REFUND_START, REFUND_START + 120], [0, 189.99], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{
      position: 'absolute', left: 200, top: 1330, width: 980,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 28, padding: '40px 48px',
        border: `2px solid ${verdict > 0.5 ? GREEN : HAIRLINE}`,
        filter: 'url(#prShadow)', backdropFilter: 'blur(6px)',
        boxShadow: verdict > 0.5 ? '0 0 50px rgba(52,211,153,0.25)' : 'none',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>WAREHOUSE INSPECTION</div>
        <div style={{display: 'flex', gap: 24, marginTop: 24}}>
          {['ITEM INTACT', 'TAGS ATTACHED', 'RESALABLE'].map((c, i) => {
            const on = frame >= INSPECT_START + 20 + i * 34;
            return (
              <div key={c} style={{
                flex: 1, borderRadius: 16, padding: '18px 10px', textAlign: 'center',
                background: on ? 'rgba(52,211,153,0.10)' : 'rgba(235,245,245,0.04)',
                border: `2px solid ${on ? GREEN : HAIRLINE}`,
              }}>
                <div style={{color: on ? GREEN : MUTED, fontFamily: MONO, fontWeight: 800, fontSize: 28}}>
                  {on ? '\u2713' : '\u00B7'}
                </div>
                <div style={{color: on ? INK : MUTED, fontFamily: MONO, fontSize: 22, marginTop: 6}}>
                  {c}
                </div>
              </div>
            );
          })}
        </div>
        {verdict > 0.5 && (
          <div style={{
            marginTop: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            opacity: interpolate(frame, [INSPECT_START + 60, INSPECT_START + 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          }}>
            <span style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 36, letterSpacing: 2}}>
              PASSED &middot; REFUND APPROVED
            </span>
            <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 72}}>
              ${refund.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Resolve strip
// ---------------------------------------------------------------------------
const ResolveStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - RESOLVE_START, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 92, left: 0, width: 3840,
      display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px)`,
    }}>
      <div style={{
        background: 'rgba(52,211,153,0.10)', border: `2px solid ${GREEN}`,
        borderRadius: 999, padding: '28px 90px',
        display: 'flex', alignItems: 'center', gap: 44,
      }}>
        <span style={{
          width: 58, height: 58, borderRadius: '50%', background: GREEN,
          color: '#0B1E22', fontSize: 36, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#10003;</span>
        <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 48, letterSpacing: 2}}>
          EASY RETURNS KEEP CUSTOMERS &middot; REFUND IN 3&ndash;5 DAYS
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 420;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`pr-grain-x-${frame}-${i}`) * 3840;
    const y = random(`pr-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`pr-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`pr-grain-s-${frame}-${i}`) * 2.5;
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
export const ProductReturnFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <StageRail frame={frame} fps={fps} />
      <RouteMap frame={frame} fps={fps} />
      <QRCode frame={frame} fps={fps} />
      <Inspection frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default ProductReturnFlow;
