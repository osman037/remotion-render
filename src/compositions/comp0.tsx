/**
 * DollarCostAveragingFlow.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * A fixed $200 monthly investment rides a volatile price curve: chips drop at
 * each buy, shares pile up faster in dips, the average-cost line lands below
 * the starting price, and the DCA portfolio beats lump-sum at the payoff.
 */
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const BG = '#060B12';
const GRID = 'rgba(148,180,220,0.10)';
const AXIS = 'rgba(148,180,220,0.55)';
const INK = '#EDF3FA';
const MUTED = 'rgba(196,212,232,0.62)';
const GREEN = '#34D399';
const GOLD = '#FBBF24';
const BLUE = '#5AC8FA';
const RED = '#F87171';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Deterministic market model: 13 monthly points, 12 buys of $200.
// ---------------------------------------------------------------------------
const PRICES = [100, 108, 92, 97, 85, 94, 88, 102, 110, 96, 104, 112, 118];
const BUY = 200;
const N_BUYS = 12;
const MONTHS = ['SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP'];

function buysUpTo(k: number) {
  let invested = 0;
  let shares = 0;
  for (let i = 1; i <= k; i++) {
    invested += BUY;
    shares += BUY / PRICES[i];
  }
  return {invested, shares, avg: invested / Math.max(shares, 1e-6)};
}
const FINAL = buysUpTo(N_BUYS);
const FINAL_VALUE = FINAL.shares * PRICES[12];
const GAIN = FINAL_VALUE - FINAL.invested;
const LUMP_SHARES = BUY * N_BUYS / PRICES[0];
const LUMP_VALUE = LUMP_SHARES * PRICES[12];

// Smooth curve through monthly points (cosine interpolation, 10 sub-steps).
function curvePoints(): {x: number; y: number}[] {
  return [];
}
const PL = 300;
const PR = 3540;
const PT = 600;
const PB = 1540;
const PW = PR - PL;
const PH = PB - PT;
const PMIN = 70;
const PMAX = 130;
const xFor = (t: number) => PL + (t / 12) * PW; // t in months 0..12
const yFor = (p: number) => PB - ((p - PMIN) / (PMAX - PMIN)) * PH;

function curvePath(): string {
  let d = '';
  const SUB = 12;
  for (let i = 0; i <= 12 * SUB; i++) {
    const t = i / SUB;
    const i0 = Math.min(11, Math.floor(t));
    const f = t - i0;
    const e = 0.5 - 0.5 * Math.cos(f * Math.PI);
    const p = PRICES[i0] + (PRICES[i0 + 1] - PRICES[i0]) * e;
    d += `${i === 0 ? 'M' : 'L'} ${xFor(t).toFixed(1)} ${yFor(p).toFixed(1)} `;
  }
  return d;
}
const LINE = curvePath();
const AREA = `${LINE} L ${xFor(12).toFixed(1)} ${PB} L ${xFor(0).toFixed(1)} ${PB} Z`;

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}line`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={BLUE} />
      <stop offset="55%" stopColor={GREEN} />
      <stop offset="100%" stopColor={GOLD} />
    </linearGradient>
    <linearGradient id={`${p}area`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={GREEN} stopOpacity={0.30} />
      <stop offset="60%" stopColor={GREEN} stopOpacity={0.07} />
      <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(6,11,18,0)" />
      <stop offset="100%" stopColor="rgba(2,4,9,0.78)" />
    </radialGradient>
    <filter id={`${p}glow`} x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="10" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

const Background: React.FC<{frame: number}> = ({frame}) => {
  const scan = ((frame / 900) * (2160 + 300)) % (2160 + 300) - 150;
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(52,211,153,0.10), rgba(52,211,153,0.03) 45%, rgba(6,11,18,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="dca" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#dcavig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(52,211,153,0.030)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 200; i++) {
    const bx = random(`dca-p-x-${i}`) * 3840;
    const by = random(`dca-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`dca-p-s-${i}`) * 1.1;
    const ang = random(`dca-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.08 + 0.2 * (0.5 + 0.5 * Math.sin(frame * 0.12 + i * 1.7));
    const sz = 2.5 + random(`dca-p-z-${i}`) * 5;
    const col = i % 3 === 0 ? GREEN : i % 3 === 1 ? 'rgba(237,243,250,0.9)' : BLUE;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {els}
    </svg>
  );
};

const Dither: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 2400; i++) {
    const bx = random(`dca-d-x-${i}`) * 3840;
    const by = random(`dca-d-y-${i}`) * 2160;
    const jx = (random(`dca-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`dca-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`dca-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`dca-d-s-${i}`) * 2;
    els.push(
      <rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#BFE9D2" opacity={o} />
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {els}
    </svg>
  );
};

const Grain: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`dca-g-x-${frame}-${i}`) * 3840;
    const y = random(`dca-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`dca-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`dca-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'INVEST $200 EVERY MONTH', 'BUY MORE SHARES WHEN PRICES FALL', 'IGNORE MARKET TIMING',
  'AVERAGE COST PER SHARE', 'STAY CONSISTENT', 'VOLATILITY BECOMES OPPORTUNITY',
  'TIME IN THE MARKET', 'AUTOMATIC INVESTING', 'DISCIPLINE BEATS PREDICTION',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 900;
  const off = -((frame * 3.2) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text
          key={`${r}-${i}`}
          x={off + r * unit + i * 620}
          y={46}
          fill="rgba(52,211,153,0.75)"
          fontSize={30}
          fontFamily={MONO}
          letterSpacing={2}
        >
          {TICKER[i]} <tspan fill="rgba(52,211,153,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(52,211,153,0.22)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3300, y: 2090, t: 'DCA · STRATEGY LAB'},
    {x: 60, y: 130, t: 'LIVE MARKET SIM'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={GREEN} opacity={0.35 + blink * 0.55} />
          <text x={c.x + 24} y={c.y} fill={MUTED} fontSize={26} fontFamily={MONO} letterSpacing={3}>
            {c.t}
          </text>
        </g>
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [20, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [20, 60], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 130 + rise, left: 180, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        DOLLAR-COST AVERAGING
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        The same <span style={{color: GREEN, fontWeight: 700}}>$200 every month</span> — buy more shares when prices fall
      </div>
    </div>
  );
};

const LiveHud: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [40, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const buyIdx = Math.min(N_BUYS, Math.max(0, Math.floor((frame - 90) / 52)));
  const {shares, avg} = buysUpTo(buyIdx);
  return (
    <div style={{position: 'absolute', top: 150, right: 180, textAlign: 'right', opacity: fade}}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>AVG COST / SHARE</div>
      <div style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 88, textShadow: '0 0 30px rgba(52,211,153,0.45)'}}>
        ${buyIdx === 0 ? '—' : avg.toFixed(2)}
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, marginTop: 6}}>
        SHARES OWNED <span style={{color: INK}}>{shares.toFixed(2)}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Price chart with monthly buy chips
// ---------------------------------------------------------------------------
const Chart: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const draw = interpolate(frame, [60, 700], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const gridFade = interpolate(frame, [40, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const TICKS = [80, 90, 100, 110, 120];
  const front = draw * 12;

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs p="dcac" />
      <g opacity={gridFade}>
        {TICKS.map((p) => (
          <g key={p}>
            <line x1={PL} y1={yFor(p)} x2={PR} y2={yFor(p)} stroke={GRID} strokeWidth={1.5} />
            <text x={PL - 26} y={yFor(p) + 12} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="end">
              ${p}
            </text>
          </g>
        ))}
        {MONTHS.map((m, i) => (
          <g key={i}>
            <line x1={xFor(i)} y1={PB} x2={xFor(i)} y2={PB + 14} stroke={AXIS} strokeWidth={1.5} />
            <text x={xFor(i)} y={PB + 58} fill={MUTED} fontSize={26} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
              {m}
            </text>
          </g>
        ))}
        <line x1={PL} y1={PB} x2={PR} y2={PB} stroke={AXIS} strokeWidth={2} />
        <line x1={PL} y1={PT} x2={PL} y2={PB} stroke={AXIS} strokeWidth={2} />
      </g>

      {/* area + line, clipped to drawn portion */}
      <clipPath id="dcaclip">
        <rect x={PL - 6} y={PT - 80} width={draw * PW + 12} height={PH + 90} />
      </clipPath>
      <g clipPath="url(#dcaclip)">
        <path d={AREA} fill="url(#dcacarea)" opacity={0.9} />
      </g>
      <path
        d={LINE}
        fill="none"
        stroke="url(#dcacline)"
        strokeWidth={7}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
        style={{filter: 'drop-shadow(0 0 14px rgba(52,211,153,0.5))'}}
      />

      {/* buy chips */}
      {Array.from({length: N_BUYS}, (_, k) => {
        const i = k + 1;
        const start = 90 + k * 52;
        const s = spring({frame: frame - start, fps, config: {damping: 200, stiffness: 110}});
        if (s <= 0.001) return null;
        const px = xFor(i);
        const py = yFor(PRICES[i]);
        const sh = BUY / PRICES[i];
        const drop = (1 - s) * 260;
        return (
          <g key={i} opacity={Math.min(1, s)}>
            <g transform={`translate(${px}, ${py + drop})`}>
              <line x1={0} y1={-drop} x2={0} y2={0} stroke={GREEN} strokeWidth={2.5} opacity={0.5} strokeDasharray="8 8" />
              <circle r={46} fill="rgba(8,14,20,0.94)" stroke={GREEN} strokeWidth={3} filter="url(#dcacglow)" />
              <text y={-2} fill={GREEN} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                $200
              </text>
              <text y={26} fill={MUTED} fontSize={24} fontFamily={MONO} textAnchor="middle">
                {sh.toFixed(1)} SH
              </text>
              <circle r={9} fill={GREEN} cy={0} opacity={0.9} />
            </g>
          </g>
        );
      })}

      {/* live cursor at the drawing front */}
      {draw > 0.01 && draw < 0.995 && (
        <g>
          {(() => {
            const i0 = Math.min(11, Math.floor(front));
            const f = front - i0;
            const e = 0.5 - 0.5 * Math.cos(f * Math.PI);
            const p = PRICES[i0] + (PRICES[i0 + 1] - PRICES[i0]) * e;
            const cx = xFor(front);
            const cy = yFor(p);
            return (
              <g>
                <circle cx={cx} cy={cy} r={30} fill={GOLD} opacity={0.18} />
                <circle cx={cx} cy={cy} r={12} fill="#FFFFFF" style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))'}} />
                <text x={cx + 30} y={cy - 26} fill={INK} fontSize={32} fontFamily={MONO} fontWeight={700}>
                  ${p.toFixed(0)}
                </text>
              </g>
            );
          })()}
        </g>
      )}

      {/* avg-cost dashed line after all buys */}
      {(() => {
        const a = interpolate(frame, [720, 760], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (a <= 0) return null;
        const y = yFor(FINAL.avg);
        return (
          <g opacity={a}>
            <line x1={PL} y1={y} x2={PR} y2={y} stroke={GREEN} strokeWidth={3} strokeDasharray="18 14" opacity={0.9} />
            <rect x={PL + 20} y={y - 78} width={430} height={64} rx={12} fill="rgba(8,14,20,0.92)" stroke={GREEN} strokeWidth={2} />
            <text x={PL + 44} y={y - 34} fill={GREEN} fontSize={34} fontFamily={MONO} fontWeight={700}>
              AVG ${FINAL.avg.toFixed(2)}
            </text>
          </g>
        );
      })()}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Bottom stat strip: invested / shares / value counters
// ---------------------------------------------------------------------------
const BottomStrip: React.FC<{frame: number}> = ({frame}) => {
  const buyIdx = Math.min(N_BUYS, Math.max(0, Math.floor((frame - 90) / 52)));
  const {invested, shares} = buysUpTo(buyIdx);
  const priceNow = PRICES[Math.min(12, Math.max(0, Math.round(((frame - 60) / 640) * 12)))] ?? PRICES[0];
  const value = frame > 700 ? FINAL_VALUE : shares * priceNow;
  const cells = [
    {label: 'TOTAL INVESTED', v: `$${invested.toLocaleString('en-US')}`, c: BLUE},
    {label: 'SHARES OWNED', v: shares.toFixed(2), c: GREEN},
    {label: 'PORTFOLIO VALUE', v: `$${value.toLocaleString('en-US', {maximumFractionDigits: 0})}`, c: GOLD},
  ];
  const fade = interpolate(frame, [60, 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 120, left: 0, width: 3840, display: 'flex', justifyContent: 'center', gap: 60, opacity: fade}}>
      {cells.map((c) => (
        <div
          key={c.label}
          style={{
            width: 700,
            borderRadius: 22,
            border: '1.5px solid rgba(148,180,220,0.25)',
            background: 'linear-gradient(160deg, rgba(90,200,250,0.08), rgba(255,255,255,0.015))',
            padding: '30px 44px',
          }}
        >
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 3}}>{c.label}</div>
          <div style={{color: c.c, fontFamily: MONO, fontWeight: 800, fontSize: 78, marginTop: 8, textShadow: `0 0 24px ${c.c}55`}}>
            {c.v}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Comparison bars + payoff badge
// ---------------------------------------------------------------------------
const Finale: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = interpolate(frame, [740, 830], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (t <= 0) return null;
  const maxV = Math.max(FINAL_VALUE, LUMP_VALUE);
  const dcaH = 420 * (FINAL_VALUE / maxV) * t;
  const lumpH = 420 * (LUMP_VALUE / maxV) * t;
  const badge = spring({frame: frame - 800, fps, config: {damping: 200, stiffness: 90}});
  return (
    <div style={{position: 'absolute', top: 0, left: 0, width: 3840, height: 2160}}>
      <svg width={3840} height={2160}>
        <rect x={0} y={0} width={3840} height={2160} fill="rgba(6,11,18,0.55)" opacity={t * 0.85} />
        <g transform="translate(1920,1080)">
          <rect x={-560} y={-140} width={1120} height={880} rx={36} fill="rgba(8,14,22,0.96)" stroke="rgba(52,211,153,0.4)" strokeWidth={3} />
          <text y={-60} fill={MUTED} fontSize={34} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
            $2,400 INVESTED — SAME MARKET
          </text>
          {/* lump sum bar */}
          <g>
            <rect x={-440} y={-lumpH + 160} width={340} height={lumpH} rx={18} fill="rgba(248,113,113,0.55)" />
            <text x={-270} y={200} fill={RED} fontSize={32} fontFamily={MONO} textAnchor="middle">LUMP SUM</text>
            <text x={-270} y={248} fill={INK} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              ${Math.round(LUMP_VALUE * t).toLocaleString('en-US')}
            </text>
          </g>
          {/* dca bar */}
          <g>
            <rect x={100} y={-dcaH + 160} width={340} height={dcaH} rx={18} fill={GREEN} filter="url(#dcacglow)" />
            <text x={270} y={200} fill={GREEN} fontSize={32} fontFamily={MONO} textAnchor="middle">DCA</text>
            <text x={270} y={248} fill={INK} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              ${Math.round(FINAL_VALUE * t).toLocaleString('en-US')}
            </text>
          </g>
          {badge > 0.01 && (
            <g opacity={Math.min(1, badge)} transform={`translate(0, ${(1 - Math.min(1, badge)) * 40}) scale(${0.9 + Math.min(1, badge) * 0.1})`}>
              <rect x={-520} y={300} width={1040} height={120} rx={60} fill={GREEN} />
              <text y={378} fill="#04120B" fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={1}>
                TIME IN THE MARKET BEATS TIMING
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(148,180,220,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Illustrative simulation. Not investment advice — markets can fall as well as rise.
    </div>
  );
};

export const DollarCostAveragingFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <LiveHud frame={frame} />
      <Chart frame={frame} fps={fps} />
      <BottomStrip frame={frame} />
      <Finale frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
