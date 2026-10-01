/**
 * DebtPayoffJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A cinematic personal-finance visual for finance creators, debt-counseling
 * brands and fintech educators: the debt-snowball method as a 15-second arc.
 * Five balances ranked smallest to largest drain month by month, the freed
 * payment cascades into the next target, and the total-debt counter falls to
 * a "DEBT FREE / $0 BALANCE" payoff. Deterministic seeded randomness only.
 *
 * Register in Root.tsx:
 *   <Composition id="DebtPayoffJourney" component={DebtPayoffJourney}
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
// Palette (dark cinematic finance: near-black navy, debt rose/red, payoff green)
// ---------------------------------------------------------------------------
const BG = '#070B14';
const INK = '#F3F6FC';
const MUTED = 'rgba(243,246,252,0.60)';
const FAINT = 'rgba(243,246,252,0.32)';
const ROSE = '#FB7185';
const RED = '#EF4444';
const RED_DEEP = '#991B1B';
const GREEN = '#34D399';
const GREEN_DEEP = '#065F46';
const GOLD = '#FBBF24';
const CYAN = '#67E8F9';
const PANEL = 'rgba(8,12,24,0.90)';
const HAIRLINE = 'rgba(243,246,252,0.14)';
const SLATE = 'rgba(148,178,205,0.40)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
const MONTH_START = 90;   // the 14-month payoff run begins
const MONTH_END = 780;    // last debt hits zero
const MONTHS = 14;
const PAYOFF_START = 800;

interface Debt {
  name: string;
  tag: string;
  balance: number;
  pay: number;     // monthly minimum payment
  payoff: number;  // month this debt reaches zero
}
const DEBTS: Debt[] = [
  {name: 'Store Card',   tag: 'RETAIL',   balance: 840,   pay: 95,  payoff: 2},
  {name: 'Medical Bill', tag: 'HEALTH',   balance: 2300,  pay: 120, payoff: 5},
  {name: 'Credit Card',  tag: 'REVOLVING',balance: 6200,  pay: 220, payoff: 8},
  {name: 'Auto Loan',    tag: 'SECURED',  balance: 7900,  pay: 310, payoff: 11},
  {name: 'Student Loan', tag: 'TERM',     balance: 14500, pay: 285, payoff: 14},
];
const TOTAL_START = DEBTS.reduce((a, d) => a + d.balance, 0); // 31740
const EXTRA = 240; // monthly snowball attack amount on top of minimums
const MONTHLY_BUDGET = DEBTS.reduce((a, d) => a + d.pay, 0) + EXTRA; // 1270

const monthFloat = (frame: number) =>
  interpolate(frame, [MONTH_START, MONTH_END], [0, MONTHS], clamp01);
const payoffFrame = (p: number) => MONTH_START + (p / MONTHS) * (MONTH_END - MONTH_START);

// Remaining balance of debt i at a given month (eased drain, exact 0 at payoff)
const balanceAt = (i: number, m: number) => {
  const d = DEBTS[i];
  if (m >= d.payoff) return 0;
  return d.balance * Math.pow(Math.max(0, 1 - m / d.payoff), 1.12);
};
// Freed monthly cash flow at month m (minimums of fully-paid debts)
const freedAt = (m: number) =>
  DEBTS.filter((d) => m >= d.payoff).reduce((a, d) => a + d.pay, 0);
const targetIndexAt = (m: number) => {
  const idx = DEBTS.findIndex((d) => m < d.payoff);
  return idx === -1 ? DEBTS.length - 1 : idx;
};
const fmt$ = (v: number) =>
  '$' + Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const BAR_X = 220;
const BAR_W = 2160;
const barY = (i: number) => 700 + i * 190;

// ---------------------------------------------------------------------------
// SVG defs
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="dpGlow" cx="38%" cy="30%" r="80%">
      <stop offset="0%" stopColor="rgba(251,113,133,0.11)" />
      <stop offset="45%" stopColor="rgba(239,68,68,0.05)" />
      <stop offset="100%" stopColor="rgba(7,11,20,0)" />
    </radialGradient>
    <radialGradient id="dpVignette" cx="50%" cy="50%" r="76%">
      <stop offset="58%" stopColor="rgba(3,5,10,0)" />
      <stop offset="100%" stopColor="rgba(1,2,6,0.80)" />
    </radialGradient>
    <linearGradient id="dpScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(251,113,133,0)" />
      <stop offset="50%" stopColor="rgba(251,113,133,0.12)" />
      <stop offset="100%" stopColor="rgba(251,113,133,0)" />
    </linearGradient>
    <linearGradient id="dpDebt" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={RED_DEEP} />
      <stop offset="60%" stopColor={RED} />
      <stop offset="100%" stopColor={ROSE} />
    </linearGradient>
    <linearGradient id="dpPaid" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={GREEN_DEEP} />
      <stop offset="100%" stopColor={GREEN} />
    </linearGradient>
    <linearGradient id="dpPayoff" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={GREEN} />
      <stop offset="55%" stopColor={CYAN} />
      <stop offset="100%" stopColor={GOLD} />
    </linearGradient>
    <filter id="dpBlur70" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="70" />
    </filter>
    <filter id="dpBlur16" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="16" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: dark finance console, drifting orbs, dot field, scan sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const drift = Math.sin((frame / 900) * Math.PI * 2) * 90;
  const scanY = (frame / 900) * 2500 - 300;
  const orbs: React.ReactElement[] = [];
  for (let i = 0; i < 6; i++) {
    const ox = random(`dp-orb-x-${i}`) * 3840;
    const oy = random(`dp-orb-y-${i}`) * 2160;
    const r = 260 + random(`dp-orb-r-${i}`) * 320;
    const hue =
      i % 3 === 0
        ? 'rgba(251,113,133,0.08)'
        : i % 3 === 1
        ? 'rgba(239,68,68,0.07)'
        : 'rgba(52,211,153,0.05)';
    const mx = Math.sin((frame / 900) * Math.PI * 2 + i * 2.1) * 120;
    const my = Math.cos((frame / 900) * Math.PI * 2 + i * 1.7) * 90;
    orbs.push(<circle key={i} cx={ox + mx} cy={oy + my} r={r} fill={hue} filter="url(#dpBlur70)" />);
  }
  const dots: React.ReactElement[] = [];
  for (let gx = 70; gx < 3840; gx += 175) {
    for (let gy = 70; gy < 2160; gy += 175) {
      const jx = (random(`dp-dot-x-${gx}-${gy}`) - 0.5) * 26;
      const jy = (random(`dp-dot-y-${gx}-${gy}`) - 0.5) * 26;
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx + jx} cy={gy + jy} r={2.2} fill="rgba(243,246,252,0.05)" />
      );
    }
  }
  const tickers: React.ReactElement[] = [];
  for (let i = 0; i < 26; i++) {
    const ty = 150 + i * 72;
    const x = ((random(`dp-tick-x-${i}`) * 3840 + frame * (1.2 + random(`dp-tick-s-${i}`) * 2)) % 4200) - 200;
    tickers.push(
      <text key={i} x={x} y={ty} fill="rgba(243,246,252,0.05)" fontSize={30} fontFamily={MONO}>
        {random(`dp-tick-n-${i}`) > 0.5 ? '+' : '-'}{(random(`dp-tick-v-${i}`) * 9).toFixed(2)}%
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect width={3840} height={2160} fill="url(#dpGlow)" transform={`translate(${drift},${-drift * 0.6})`} />
        {orbs}
        <g transform={`translate(${drift * 0.4},0)`}>{dots}</g>
        {tickers}
        <rect x={0} y={scanY} width={3840} height={340} fill="url(#dpScan)" />
        <rect width={3840} height={2160} fill="url(#dpVignette)" />
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
          <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 14, color: ROSE}}>
            PERSONAL FINANCE &nbsp;·&nbsp; DEBT STRATEGY
          </div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 148, color: INK, marginTop: 16, letterSpacing: -2}}>
            Debt Payoff Journey
          </div>
          <div style={{fontFamily: FONT, fontSize: 40, color: MUTED, marginTop: 14}}>
            Smallest balance first — every payoff frees cash to attack the next
          </div>
        </div>
        <div style={{marginLeft: 'auto', textAlign: 'right'}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 22, border: `2px solid ${ROSE}`, borderRadius: 16, padding: '14px 32px', backgroundColor: 'rgba(10,6,10,0.6)'}}>
            <div style={{width: 24, height: 24, borderRadius: 12, backgroundColor: ROSE, opacity: blink, boxShadow: `0 0 26px ${ROSE}`}} />
            <div style={{fontFamily: MONO, fontSize: 40, fontWeight: 700, color: INK, letterSpacing: 4}}>
              SNOWBALL METHOD
            </div>
          </div>
          <div style={{fontFamily: MONO, fontSize: 32, color: FAINT, marginTop: 14}}>
            5 DEBTS · {fmt$(MONTHLY_BUDGET)}/MO BUDGET
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Total-debt counter (top-right hero number)
// ---------------------------------------------------------------------------
const TotalDebt: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 40, fps, config: {damping: 200, stiffness: 80}});
  const m = monthFloat(frame);
  const total = DEBTS.reduce((a, _, i) => a + balanceAt(i, m), 0);
  const done = total <= 0.5;
  return (
    <div style={{position: 'absolute', right: 220, top: 400, textAlign: 'right', opacity: Math.min(1, enter)}}>
      <div style={{fontFamily: MONO, fontSize: 38, letterSpacing: 10, color: MUTED}}>
        TOTAL DEBT REMAINING
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: 150,
          color: done ? GREEN : ROSE,
          marginTop: 6,
          textShadow: done ? `0 0 60px ${GREEN}` : `0 0 60px rgba(251,113,133,0.5)`,
        }}
      >
        {fmt$(total)}
      </div>
      <div style={{fontFamily: MONO, fontSize: 34, color: FAINT, marginTop: 8}}>
        STARTED {fmt$(TOTAL_START)} · MONTH {Math.min(MONTHS, Math.floor(m) + 1)} / {MONTHS}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The five debt bars: ranked smallest -> largest, shrinking month by month
// ---------------------------------------------------------------------------
const DebtBars: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const m = monthFloat(frame);
  const target = targetIndexAt(m);
  const freed = freedAt(m);
  const attack = EXTRA + freed;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        {DEBTS.map((d, i) => {
          const enter = spring({frame: frame - (30 + i * 24), fps, config: {damping: 200, stiffness: 100}});
          if (enter <= 0.001) return null;
          const bal = balanceAt(i, m);
          const paid = m >= d.payoff;
          const isTarget = i === target && !paid;
          const stampS = spring({frame: frame - payoffFrame(d.payoff), fps, config: {damping: 200, stiffness: 130}});
          const y = barY(i);
          const w = interpolate(bal, [0, d.balance], [0, BAR_W], clamp01);
          const pct = (bal / d.balance) * 100;
          // "freed" chip rides above the next bar right after a payoff
          const chipT = interpolate(frame, [payoffFrame(d.payoff), payoffFrame(d.payoff) + 70], [0, 1], clamp01);
          const nextIsTarget = i === target - 1 && target > 0;
          return (
            <g key={d.name} opacity={Math.min(1, enter)}>
              {/* label row */}
              <text x={BAR_X} y={y - 34} fill={INK} fontSize={46} fontFamily={FONT} fontWeight={750}>
                {i + 1}. {d.name}
              </text>
              <text x={BAR_X + 470} y={y - 34} fill={FAINT} fontSize={30} fontFamily={MONO} letterSpacing={5}>
                {d.tag}
              </text>
              <text x={BAR_X + BAR_W} y={y - 30} fill={paid ? GREEN : INK} fontSize={58} fontFamily={MONO} fontWeight={800} textAnchor="end">
                {fmt$(bal)}
              </text>
              {/* track */}
              <rect x={BAR_X} y={y} width={BAR_W} height={66} rx={33} fill="rgba(243,246,252,0.07)" />
              {/* fill */}
              {w > 2 && (
                <rect
                  x={BAR_X}
                  y={y}
                  width={w}
                  height={66}
                  rx={33}
                  fill={paid ? 'url(#dpPaid)' : 'url(#dpDebt)'}
                  style={{filter: paid ? 'drop-shadow(0 0 18px rgba(52,211,153,0.6))' : 'drop-shadow(0 0 14px rgba(239,68,68,0.45))'}}
                />
              )}
              {paid && (
                <rect x={BAR_X} y={y} width={BAR_W} height={66} rx={33} fill="none" stroke={GREEN} strokeWidth={3} opacity={0.7} />
              )}
              {/* month-by-month tick marks on the bar */}
              {Array.from({length: 10}).map((_, k) => {
                const tx = BAR_X + ((k + 1) / 11) * BAR_W;
                return <line key={k} x1={tx} y1={y + 10} x2={tx} y2={y + 56} stroke="rgba(7,11,20,0.35)" strokeWidth={3} />;
              })}
              {/* percent label inside the bar */}
              {w > 260 && !paid && (
                <text x={BAR_X + w - 30} y={y + 45} fill="#FFF" fontSize={34} fontFamily={MONO} fontWeight={700} textAnchor="end">
                  {pct.toFixed(0)}%
                </text>
              )}
              {/* attack-payment chip on the live target */}
              {isTarget && (
                <g>
                  <rect x={BAR_X + BAR_W - 620} y={y + 84} width={620} height={78} rx={16} fill="rgba(251,191,36,0.10)" stroke={GOLD} strokeWidth={2.5} />
                  <text x={BAR_X + BAR_W - 590} y={y + 136} fill={GOLD} fontSize={38} fontFamily={MONO} fontWeight={800}>
                    ATTACK PAYMENT {fmt$(attack)}/MO
                  </text>
                </g>
              )}
              {/* paid stamp */}
              {paid && stampS > 0.02 && (
                <g transform={`rotate(-8 ${BAR_X + BAR_W - 180} ${y + 33}) scale(${Math.min(1, stampS)})`} opacity={Math.min(1, stampS)}>
                  <rect x={BAR_X + BAR_W - 330} y={y - 24} width={300} height={114} rx={16} fill="rgba(6,40,28,0.92)" stroke={GREEN} strokeWidth={5} />
                  <text x={BAR_X + BAR_W - 180} y={y + 52} fill={GREEN} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={3}>
                    PAID ✓
                  </text>
                </g>
              )}
              {/* freed-cash chip cascading to the next target */}
              {chipT > 0 && chipT < 1 && nextIsTarget && (
                <g opacity={1 - chipT}>
                  <rect x={BAR_X + BAR_W - 560} y={y - 130 - chipT * 60} width={620} height={72} rx={14} fill="rgba(52,211,153,0.16)" stroke={GREEN} strokeWidth={2.5} />
                  <text x={BAR_X + BAR_W - 530} y={y - 82 - chipT * 60} fill={GREEN} fontSize={38} fontFamily={MONO} fontWeight={800}>
                    +{fmt$(DEBTS[i].pay)}/MO FREED ↓
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {/* month ruler under the bars */}
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        {Array.from({length: MONTHS}).map((_, k) => {
          const mx = BAR_X + ((k + 0.5) / MONTHS) * BAR_W;
          const lit = m >= k + 1;
          return (
            <g key={k}>
              <line x1={mx} y1={1700} x2={mx} y2={lit ? 1728 : 1716} stroke={lit ? GOLD : SLATE} strokeWidth={lit ? 7 : 4} strokeLinecap="round" />
              <text x={mx} y={1772} fill={lit ? GOLD : FAINT} fontSize={26} fontFamily={MONO} textAnchor="middle">
                M{k + 1}
              </text>
            </g>
          );
        })}
        <text x={BAR_X} y={1690} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={6}>
          MONTH-BY-MONTH PAYDOWN
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Monthly budget panel: minimums vs snowball attack allocation, live
// ---------------------------------------------------------------------------
const BudgetPanel: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 120, fps, config: {damping: 200, stiffness: 80}});
  const m = monthFloat(frame);
  const mins = DEBTS.filter((d) => m < d.payoff).reduce((a, d) => a + d.pay, 0);
  const attack = EXTRA + freedAt(m);
  const PX = 2620;
  const PW = 980;
  const minsW = (mins / MONTHLY_BUDGET) * PW;
  const pulse = 0.75 + 0.25 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={PX} y={700} width={PW} height={420} rx={22} fill={PANEL} stroke={HAIRLINE} strokeWidth={2} />
        <text x={PX + 44} y={772} fill={ROSE} fontSize={32} fontFamily={MONO} letterSpacing={8}>
          MONTHLY BUDGET · {fmt$(MONTHLY_BUDGET)}
        </text>
        <text x={PX + 44} y={830} fill={FAINT} fontSize={28} fontFamily={MONO}>
          MINIMUMS {fmt$(mins)} · ATTACK {fmt$(attack)}
        </text>
        <rect x={PX + 44} y={880} width={PW - 88} height={54} rx={27} fill="rgba(243,246,252,0.07)" />
        <rect x={PX + 44} y={880} width={(minsW * (PW - 88)) / PW} height={54} rx={27} fill={RED} opacity={0.85} />
        <rect
          x={PX + 44 + (minsW * (PW - 88)) / PW}
          y={880}
          width={Math.max(8, PW - 88 - (minsW * (PW - 88)) / PW)}
          height={54}
          rx={27}
          fill={GREEN}
          opacity={pulse}
        />
        <text x={PX + 44} y={1010} fill={MUTED} fontSize={29} fontFamily={MONO}>
          THE ATTACK PAYMENT GROWS AS DEBTS FALL
        </text>
        <text x={PX + 44} y={1062} fill={GREEN} fontSize={29} fontFamily={MONO} fontWeight={700}>
          +{fmt$(freedAt(m))}/MO FREED SO FAR
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Interest-avoided strip (snowball vs paying minimums)
// ---------------------------------------------------------------------------
const InterestStrip: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 200, fps, config: {damping: 200, stiffness: 80}});
  const avoided = 4820 * interpolate(frame, [MONTH_START, MONTH_END], [0, 1], clamp01);
  const monthsSaved = 34 * interpolate(frame, [MONTH_START, MONTH_END], [0, 1], clamp01);
  const PX = 2620;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={PX} y={1170} width={980} height={300} rx={22} fill={PANEL} stroke={HAIRLINE} strokeWidth={2} />
        <text x={PX + 44} y={1242} fill={GOLD} fontSize={32} fontFamily={MONO} letterSpacing={8}>
          VS MINIMUMS ONLY
        </text>
        <text x={PX + 44} y={1340} fill={INK} fontSize={72} fontFamily={MONO} fontWeight={800}>
          {fmt$(avoided)}
        </text>
        <text x={PX + 44} y={1400} fill={MUTED} fontSize={30} fontFamily={MONO}>
          INTEREST AVOIDED · {Math.round(monthsSaved)} MONTHS SAVED
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payoff banner: DEBT FREE / $0 BALANCE
// ---------------------------------------------------------------------------
const PayoffBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - PAYOFF_START, fps, config: {damping: 200, stiffness: 70}});
  if (enter <= 0.001) return null;
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const flash = interpolate(frame, [PAYOFF_START + 20, PAYOFF_START + 80], [0, 1], clamp01);
  const stampS = spring({frame: frame - (PAYOFF_START + 18), fps, config: {damping: 200, stiffness: 140}});
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 100,
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
          position: 'relative',
          backgroundColor: 'rgba(4,10,8,0.95)',
          border: `3px solid ${GREEN}`,
          borderRadius: 26,
          padding: '44px 140px',
          textAlign: 'center',
          boxShadow: `0 0 140px rgba(52,211,153,${0.25 + flash * 0.35})`,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 42, letterSpacing: 16, color: GREEN}}>$0 BALANCE</div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 108,
            color: INK,
            marginTop: 8,
            background: 'linear-gradient(90deg,#34D399,#67E8F9,#FBBF24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          DEBT FREE
        </div>
        <div style={{fontFamily: MONO, fontSize: 36, color: MUTED, marginTop: 12}}>
          {fmt$(TOTAL_START)} CLEARED IN {MONTHS} MONTHS · {fmt$(4820)} INTEREST AVOIDED
        </div>
        {stampS > 0.02 && (
          <div
            style={{
              position: 'absolute',
              right: 70,
              top: -60,
              transform: `rotate(10deg) scale(${Math.min(1, stampS)})`,
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 54,
              color: GREEN,
              border: `5px solid ${GREEN}`,
              borderRadius: 18,
              padding: '14px 44px',
              backgroundColor: 'rgba(4,10,8,0.92)',
              boxShadow: '0 0 70px rgba(52,211,153,0.6)',
              letterSpacing: 4,
            }}
          >
            $0 ✓
          </div>
        )}
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
    const x = random(`dp-grain-x-${frame}-${i}`) * 3840;
    const y = random(`dp-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`dp-grain-o-${frame}-${i}`) * 0.04;
    const s = 2 + random(`dp-grain-s-${frame}-${i}`) * 2.5;
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
export const DebtPayoffJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <TitleBar frame={frame} fps={fps} />
      <TotalDebt frame={frame} fps={fps} />
      <DebtBars frame={frame} fps={fps} />
      <BudgetPanel frame={frame} fps={fps} />
      <InterestStrip frame={frame} fps={fps} />
      <PayoffBanner frame={frame} fps={fps} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
