/**
 * LoanAmortizationChart.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A 30-year mortgage story on deep midnight blue: stacked payment bars show
 * each dollar splitting between interest and principal, the balance curve
 * descends, a year cursor sweeps the timeline, and the equity gauge rises to a
 * "what-if extra payment" payoff. Intro -> build -> payoff -> resolve.
 *
 * Register in Root.tsx:
 *   <Composition id="LoanAmortizationChart" component={LoanAmortizationChart}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette (midnight blue + gold finance)
// ---------------------------------------------------------------------------
const BG = '#0A1526';
const INK = '#EAF0FB';
const MUTED = 'rgba(234,240,251,0.60)';
const GOLD = '#F0B429';
const GOLD_DEEP = '#9A6E0E';
const INTEREST = '#FF6B6B';
const INTEREST_DEEP = '#B02E2E';
const PRINCIPAL = '#F0B429';
const GREEN = '#34D399';
const PANEL = 'rgba(16,30,54,0.82)';
const HAIRLINE = 'rgba(234,240,251,0.16)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Loan math: $420,000 at 6.25% for 30 years — precomputed schedule
// ---------------------------------------------------------------------------
const PRINCIPAL0 = 420000;
const ANNUAL_RATE = 0.0625;
const MONTHLY_RATE = ANNUAL_RATE / 12;
const N = 360;
const MONTHLY_PAYMENT =
  (PRINCIPAL0 * MONTHLY_RATE) / (1 - Math.pow(1 + MONTHLY_RATE, -N)); // ~$2586

interface SchedRow {interest: number; principal: number; balance: number}

const SCHEDULE: SchedRow[] = (() => {
  const rows: SchedRow[] = [];
  let bal = PRINCIPAL0;
  for (let m = 1; m <= N; m++) {
    const interest = bal * MONTHLY_RATE;
    const principal = Math.min(MONTHLY_PAYMENT - interest, bal);
    bal = Math.max(0, bal - principal);
    rows.push({interest, principal, balance: bal});
  }
  return rows;
})();

const BARS = 60; // sample 60 of 360 months
const BAR_IDX = Array.from({length: BARS}, (_, i) => Math.floor(((i + 0.5) / BARS) * N));

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
const CHART_START = 70;
const CURSOR_START = 150;
const CURSOR_END = 700;
const GAUGE_START = 250;
const WHATIF_START = 620;
const RESOLVE_START = 800;

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
const PLOT_LEFT = 220;
const PLOT_RIGHT = 2500;
const PLOT_TOP = 560;
const PLOT_BOTTOM = 1640;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;
const MAX_INT_PRIN = Math.max(...BAR_IDX.map((i) => SCHEDULE[i].interest + SCHEDULE[i].principal));

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="laGlow" cx="50%" cy="32%" r="72%">
      <stop offset="0%" stopColor="rgba(240,180,41,0.11)" />
      <stop offset="55%" stopColor="rgba(240,180,41,0.03)" />
      <stop offset="100%" stopColor="rgba(10,21,38,0)" />
    </radialGradient>
    <radialGradient id="laVignette" cx="50%" cy="50%" r="76%">
      <stop offset="60%" stopColor="rgba(4,8,16,0)" />
      <stop offset="100%" stopColor="rgba(4,8,16,0.72)" />
    </radialGradient>
    <linearGradient id="laInterest" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stopColor={INTEREST_DEEP} />
      <stop offset="100%" stopColor={INTEREST} />
    </linearGradient>
    <linearGradient id="laPrincipal" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stopColor={GOLD_DEEP} />
      <stop offset="100%" stopColor={PRINCIPAL} />
    </linearGradient>
    <linearGradient id="laBalance" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={GREEN} stopOpacity={0.35} />
      <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
    </linearGradient>
    <filter id="laGlow14" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="laShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#000000" floodOpacity="0.55" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const scanX = ((frame / 900) * (3840 + 300)) % (3840 + 300) - 150;
  const dots: React.ReactElement[] = [];
  for (let gx = 0; gx <= 33; gx++) {
    for (let gy = 0; gy <= 19; gy++) {
      const shimmer = 0.05 + 0.05 * Math.sin(frame * 0.09 + gx * 1.1 + gy * 0.6);
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx * 120} cy={gy * 120} r={2.2} fill="#F0B429" opacity={shimmer} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#laGlow)" />
        {dots}
        <rect x={scanX - 90} y={0} width={180} height={2160} fill="rgba(240,180,41,0.028)" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#laVignette)" />
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
    <div style={{position: 'absolute', top: 80 + rise, left: 220, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: -1.5}}>
        Where your <span style={{color: GOLD}}>mortgage payment</span> really goes
      </div>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 3, marginTop: 12}}>
        $420,000 &middot; 30-YEAR FIXED &middot; 6.25% &middot; $2,586/MO
      </div>
    </div>
  );
};

const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

// ---------------------------------------------------------------------------
// Chart: stacked bars + balance curve + year cursor
// ---------------------------------------------------------------------------
const AmortChart: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (CHART_START - 40), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const cursorT = interpolate(frame, [CURSOR_START, CURSOR_END], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cursorMonth = 1 + cursorT * (N - 1);
  const cursorBarF = cursorT * (BARS - 1);
  const cx = PLOT_LEFT + (cursorBarF / (BARS - 1)) * PLOT_WIDTH;

  const rowAtCursor = SCHEDULE[Math.min(N - 1, Math.floor(cursorMonth))];
  const intFrac = rowAtCursor.interest / MONTHLY_PAYMENT;
  const prinFrac = rowAtCursor.principal / MONTHLY_PAYMENT;

  const balancePath = useMemo(() => {
    const pts = BAR_IDX.map((i, b) => {
      const x = PLOT_LEFT + (b / (BARS - 1)) * PLOT_WIDTH;
      const y = PLOT_BOTTOM - (SCHEDULE[i].balance / PRINCIPAL0) * PLOT_HEIGHT;
      return `${b === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    return pts.join(' ');
  }, []);

  const balanceArea = `${balancePath} L ${PLOT_RIGHT} ${PLOT_BOTTOM} L ${PLOT_LEFT} ${PLOT_BOTTOM} Z`;
  const balAtCursor = PLOT_BOTTOM - (rowAtCursor.balance / PRINCIPAL0) * PLOT_HEIGHT;

  const barW = PLOT_WIDTH / BARS;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {/* year gridlines */}
        {[0, 5, 10, 15, 20, 25, 30].map((y) => {
          const gx = PLOT_LEFT + (y / 30) * PLOT_WIDTH;
          return (
            <g key={y}>
              <line x1={gx} y1={PLOT_TOP} x2={gx} y2={PLOT_BOTTOM} stroke="rgba(234,240,251,0.08)" strokeWidth={2} />
              <text x={gx} y={PLOT_BOTTOM + 62} textAnchor="middle" fill={MUTED} fontSize={30} fontFamily={MONO}>
                YEAR {y}
              </text>
            </g>
          );
        })}
        {/* baseline */}
        <line x1={PLOT_LEFT} y1={PLOT_BOTTOM} x2={PLOT_RIGHT} y2={PLOT_BOTTOM} stroke="rgba(234,240,251,0.4)" strokeWidth={2.5} />

        {/* stacked bars */}
        {BAR_IDX.map((mi, b) => {
          const r = SCHEDULE[mi];
          const totalH = ((r.interest + r.principal) / MAX_INT_PRIN) * PLOT_HEIGHT;
          const intH = (r.interest / MAX_INT_PRIN) * PLOT_HEIGHT;
          const prinH = (r.principal / MAX_INT_PRIN) * PLOT_HEIGHT;
          const x = PLOT_LEFT + (b / (BARS - 1)) * PLOT_WIDTH - barW / 2 + 2;
          const grow = interpolate(frame, [CHART_START + b * 2.4, CHART_START + b * 2.4 + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          if (grow <= 0) return null;
          const y = PLOT_BOTTOM - totalH * grow;
          return (
            <g key={b}>
              <rect x={x} y={y} width={barW - 4} height={Math.max(1, totalH * grow)} fill="none" />
              <rect x={x} y={PLOT_BOTTOM - totalH * grow} width={barW - 4} height={Math.max(1, intH * grow)} fill="url(#laInterest)" opacity={0.92} />
              <rect x={x} y={PLOT_BOTTOM - totalH * grow + intH * grow} width={barW - 4} height={Math.max(1, prinH * grow)} fill="url(#laPrincipal)" opacity={0.92} />
            </g>
          );
        })}

        {/* balance curve */}
        <path d={balanceArea} fill="url(#laBalance)" opacity={0.7} />
        <path d={balancePath} fill="none" stroke={GREEN} strokeWidth={8} strokeLinecap="round" filter="url(#laGlow14)" />

        {/* cursor */}
        <g opacity={cursorT > 0 && cursorT < 1 ? 1 : 0}>
          <line x1={cx} y1={PLOT_TOP - 30} x2={cx} y2={PLOT_BOTTOM} stroke={INK} strokeWidth={3} strokeDasharray="12 12" opacity={0.6} />
          <circle cx={cx} cy={balAtCursor} r={16} fill="#fff" filter="url(#laGlow14)" />
          <g transform={`translate(${Math.min(cx + 30, PLOT_RIGHT - 520)}, ${Math.max(balAtCursor - 210, PLOT_TOP - 20)})`}>
            <rect x={0} y={0} width={490} height={190} rx={18} fill="rgba(10,21,38,0.92)" stroke={GOLD} strokeWidth={2} />
            <text x={30} y={62} fill={MUTED} fontSize={30} fontFamily={MONO}>MONTH {Math.round(cursorMonth)}</text>
            <text x={30} y={118} fill={INTEREST} fontSize={34} fontFamily={MONO} fontWeight={700}>
              INTEREST {(intFrac * 100).toFixed(0)}%
            </text>
            <text x={30} y={162} fill={GOLD} fontSize={34} fontFamily={MONO} fontWeight={700}>
              PRINCIPAL {(prinFrac * 100).toFixed(0)}%
            </text>
          </g>
        </g>
      </svg>

      {/* legend */}
      <div style={{position: 'absolute', left: 220, top: 470, display: 'flex', gap: 60, opacity: Math.min(1, s)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <span style={{width: 44, height: 22, borderRadius: 6, background: INTEREST}} />
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 30}}>INTEREST</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <span style={{width: 44, height: 22, borderRadius: 6, background: PRINCIPAL}} />
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 30}}>PRINCIPAL</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <span style={{width: 44, height: 10, borderRadius: 5, background: GREEN}} />
          <span style={{color: MUTED, fontFamily: MONO, fontSize: 30}}>REMAINING BALANCE</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Right panel: balance counter, equity gauge, what-if payoff
// ---------------------------------------------------------------------------
const SidePanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - (GAUGE_START - 60), fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;

  const cursorT = interpolate(frame, [CURSOR_START, CURSOR_END], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const row = SCHEDULE[Math.min(N - 1, Math.floor(1 + cursorT * (N - 1)))];
  const balance = row.balance;
  const equity = Math.min(1, (PRINCIPAL0 - balance) / PRINCIPAL0 + 0.2); // +20% down payment proxy
  const whatIf = interpolate(frame, [WHATIF_START, WHATIF_START + 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const R = 190;
  const CIRC = 2 * Math.PI * R;

  return (
    <div style={{
      position: 'absolute', left: 2640, top: 560, width: 980,
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{
        background: PANEL, borderRadius: 32, padding: '44px 50px',
        border: `2px solid ${HAIRLINE}`, filter: 'url(#laShadow)', backdropFilter: 'blur(6px)',
      }}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 3}}>REMAINING BALANCE</div>
        <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 92, marginTop: 8, textShadow: '0 0 28px rgba(240,180,41,0.35)'}}>
          {fmt(balance)}
        </div>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, marginTop: 6}}>
          MONTH {Math.min(N, Math.max(1, Math.round(1 + cursorT * (N - 1))))} OF 360
        </div>

        <div style={{marginTop: 36}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12}}>
            <span style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 2}}>HOME EQUITY</span>
            <span style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 36}}>{Math.round(Math.min(1, equity) * 100)}%</span>
          </div>
          <div style={{height: 36, borderRadius: 18, background: 'rgba(234,240,251,0.08)', overflow: 'hidden', border: `2px solid ${HAIRLINE}`}}>
            <div style={{height: '100%', width: `${Math.min(1, equity) * 100}%`, borderRadius: 18, background: 'linear-gradient(90deg,#1F8F66,#34D399)', boxShadow: '0 0 24px rgba(52,211,153,0.5)'}} />
          </div>
        </div>

        <div style={{
          marginTop: 36, borderRadius: 22, padding: '28px 32px',
          border: `2px solid ${whatIf > 0.5 ? GREEN : HAIRLINE}`,
          background: whatIf > 0.5 ? 'rgba(52,211,153,0.08)' : 'rgba(234,240,251,0.03)',
          opacity: interpolate(frame, [WHATIF_START - 20, WHATIF_START + 30], [0.45, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 2}}>WHAT IF: EXTRA $200/MO?</div>
          <div style={{color: whatIf > 0.5 ? GREEN : MUTED, fontFamily: MONO, fontWeight: 800, fontSize: 40, marginTop: 10}}>
            {whatIf > 0.5 ? 'SAVES $71,400 · 7 YEARS EARLIER' : 'calculating\u2026'}
          </div>
          <div style={{color: MUTED, fontFamily: FONT, fontSize: 26, marginTop: 8}}>
            interest-first payments are why extra principal pays
          </div>
        </div>
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
        background: 'rgba(240,180,41,0.08)', border: `2px solid ${GOLD}`,
        borderRadius: 999, padding: '28px 90px',
        display: 'flex', alignItems: 'center', gap: 44,
      }}>
        <span style={{
          width: 58, height: 58, borderRadius: '50%', background: GOLD,
          color: '#0A1526', fontSize: 36, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#10003;</span>
        <span style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 48, letterSpacing: 2}}>
          EARLY PAYMENTS FEED THE BANK &middot; LATER PAYMENTS BUILD YOUR EQUITY
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
    const x = random(`la-grain-x-${frame}-${i}`) * 3840;
    const y = random(`la-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`la-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`la-grain-s-${frame}-${i}`) * 2.5;
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
export const LoanAmortizationChart: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} />
      <AmortChart frame={frame} fps={fps} />
      <SidePanel frame={frame} fps={fps} />
      <ResolveStrip frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default LoanAmortizationChart;
