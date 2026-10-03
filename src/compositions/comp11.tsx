/**
 * MedicationAdherenceCycle.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A medication adherence week: pill bottle + weekly organizer, a reminder
 * bell pulsing at each dose time, dose checks ticking day by day, a progress
 * ring filling through the week — one missed dose gets a gentle nudge, the
 * cycle recovers, the refill loop closes, and STAY ON TRACK lands the payoff.
 * Calm lavender/sage. Deterministic.
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
// Palette (calm lavender / sage)
// ---------------------------------------------------------------------------
const BG = '#101418';
const INK = '#F2F0FA';
const MUTED = 'rgba(242,240,250,0.64)';
const FAINT = 'rgba(242,240,250,0.34)';
const LAV = '#A78BFA';
const SAGE = '#86EFAC';
const AMBER = '#FBBF24';
const PANEL = 'rgba(16,20,26,0.94)';
const HAIRLINE = 'rgba(242,240,250,0.15)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: med
// ---------------------------------------------------------------------------
const Background_med: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#DDD6FE" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(167,139,250,0.13), rgba(167,139,250,0.03) 46%, rgba(16,20,24,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#medVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(167,139,250,0.05)" />
        <defs>
          <radialGradient id="medVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(16,20,24,0)" />
            <stop offset="100%" stopColor="rgba(6,8,10,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_med: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`med-amb-x-${i}`) * 3840;
    const by = random(`med-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`med-amb-s-${i}`) * 1.4;
    const ang = random(`med-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`med-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? LAV : i % 4 === 1 ? SAGE : 'rgba(242,240,250,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_med: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`med-dth-x-${i}`) * 3840;
    const by = random(`med-dth-y-${i}`) * 2160;
    const jx = (random(`med-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`med-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`med-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`med-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#E9E4FF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_med = [
  'DOSE DUE 8:00 AM',
  'WEEK 34 · ADHERENCE 92%',
  'MISSED A DOSE? TAKE WHEN REMEMBERED',
  'NEVER DOUBLE UP',
  'REFILL IN 3 DAYS',
  'STREAK 21 DAYS',
  'AM + PM DOSES',
  'STAY ON TRACK',
];
const TickerTape_med: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_med.join('   ◆   ') + '   ◆   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(167,139,250,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(8,10,13,0.66)', borderBottom: '1px solid rgba(242,240,250,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_med: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.55 + 0.45 * Math.sin((frame / 60) * Math.PI * 2);
  const corners = [
    {x: 60, y: 92, sx: 1, sy: 1},
    {x: 3780, y: 92, sx: -1, sy: 1},
    {x: 60, y: 2068, sx: 1, sy: -1},
    {x: 3780, y: 2068, sx: -1, sy: -1},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {corners.map((c, i) => (
          <g key={i} transform={`translate(${c.x},${c.y}) scale(${c.sx},${c.sy})`}>
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(167,139,250,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={LAV} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? LAV : 'rgba(242,240,250,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? LAV : 'rgba(242,240,250,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_med: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`med-grain-x-${frame}-${i}`) * 3840;
    const y = random(`med-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`med-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`med-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Week model: day i ticks at 130 + i*42; Thursday (i=3) is missed, then made up
// ---------------------------------------------------------------------------
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MISSED = 3;
const tickFrame = (i: number): number => 130 + i * 42;
const isMissedWindow = (frame: number): boolean => frame >= tickFrame(MISSED) && frame < 560;
const isMadeUp = (frame: number): boolean => frame >= 560;
const dayDone = (frame: number, i: number): boolean =>
  i === MISSED ? isMadeUp(frame) : frame >= tickFrame(i);
const dosesTaken = (frame: number): number => DAYS.filter((_, i) => dayDone(frame, i)).length;

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_med: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        MEDICATION ADHERENCE CYCLE
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        One week, one dose at a time — <span style={{color: SAGE}}>missed is human, back on track is the win</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Station 1: pill bottle + reminder bell (left)
// ---------------------------------------------------------------------------
const BottlePanel_med: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  // bell pulses at each dose time
  const doseTs = DAYS.map((_, i) => tickFrame(i));
  const nearDose = doseTs.some((t) => Math.abs(frame - t) < 26);
  const pulse = nearDose ? 0.5 + 0.5 * Math.sin(frame * 0.5) : 0;
  const nudge = isMissedWindow(frame) ? 0.5 + 0.5 * Math.sin(frame * 0.18) : 0;
  return (
    <g opacity={Math.min(1, s)} transform={`translate(${(1 - s) * -60},0)`}>
      <rect x={180} y={380} width={680} height={700} rx={30} fill={PANEL} stroke={LAV} strokeWidth={4} />
      <text x={240} y={462} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        DOSE KIT
      </text>
      <text x={240} y={510} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        LISINOPRIL 10MG · 1× DAILY · 8:00 AM
      </text>
      {/* reminder bell */}
      <g transform="translate(520,660)">
        {nearDose &&
          [0, 1].map((k) => {
            const ph = ((frame + k * 18) % 36) / 36;
            return (
              <circle key={k} r={60 + ph * 90} fill="none" stroke={LAV}
                strokeWidth={8 * (1 - ph)} opacity={0.7 * (1 - ph) * (0.4 + pulse * 0.6)} />
            );
          })}
        {nudge > 0 &&
          [0, 1, 2].map((k) => {
            const ph = ((frame * 0.7 + k * 30) % 90) / 90;
            return (
              <circle key={`n${k}`} r={60 + ph * 130} fill="none" stroke={AMBER}
                strokeWidth={7 * (1 - ph)} opacity={0.65 * (1 - ph) * nudge} />
            );
          })}
        <path d="M -52 30 A 60 60 0 0 1 52 30 L 52 44 L -52 44 Z" fill={LAV} opacity={0.92} />
        <rect x={-14} y={-96} width={28} height={40} rx={12} fill={LAV} opacity={0.92} />
        <circle cy={62} r={16} fill={SAGE} />
        <text y={118} fill={nearDose ? LAV : MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle" letterSpacing={3}>
          {nearDose ? '◉ DOSE DUE' : 'REMINDER'}
        </text>
      </g>
      {/* pill bottle */}
      <g transform="translate(520,900)">
        <rect x={-70} y={-120} width={140} height={52} rx={14} fill={FAINT} />
        <rect x={-84} y={-68} width={168} height={190} rx={26} fill="#1C2230" stroke={LAV} strokeWidth={6} />
        <rect x={-84} y={10} width={168} height={64} fill={LAV} opacity={0.85} />
        <text y={58} fill={BG} fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          10MG
        </text>
        {/* pills */}
        {Array.from({length: 6}, (_, i) => (
          <ellipse key={i} cx={-50 + (i % 3) * 50} cy={-40 + Math.floor(i / 3) * 36}
            rx={20} ry={13} fill={SAGE} opacity={0.9}
            transform={`rotate(${-20 + i * 14} ${-50 + (i % 3) * 50} ${-40 + Math.floor(i / 3) * 36})`} />
        ))}
      </g>
      <text x={520} y={1050} fill={FAINT} fontSize={26} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
        {isMissedWindow(frame) ? '— gentle nudge sent —' : 'bottle · organizer · bell'}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Station 2: weekly organizer grid — dose checks tick day by day
// ---------------------------------------------------------------------------
const Organizer_med: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 110, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={940} y={380} width={1460} height={700} rx={30} fill={PANEL} stroke={HAIRLINE} strokeWidth={3} />
      <text x={1000} y={462} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        WEEKLY ORGANIZER
      </text>
      <text x={1000} y={510} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        DOSES TAKEN: <tspan fill={SAGE} fontWeight={800}>{dosesTaken(frame)}</tspan> / 7
      </text>
      {DAYS.map((d, i) => {
        const cx = 1040 + i * 195;
        const done = dayDone(frame, i);
        const missed = i === MISSED && isMissedWindow(frame);
        const upcoming = frame >= tickFrame(i) - 20 && !done && !missed;
        const border = done ? SAGE : missed ? AMBER : upcoming ? LAV : FAINT;
        const tickS = spring({frame: frame - tickFrame(i) - (i === MISSED ? 430 : 0), fps, config: {damping: 170, stiffness: 130}});
        return (
          <g key={d}>
            <rect x={cx - 82} y={580} width={164} height={400} rx={24}
              fill={done ? 'rgba(134,239,172,0.08)' : missed ? 'rgba(251,191,36,0.08)' : 'rgba(242,240,250,0.03)'}
              stroke={border} strokeWidth={done || missed ? 6 : 3} />
            <text x={cx} y={648} fill={done ? INK : MUTED} fontSize={32} fontFamily={MONO}
              fontWeight={800} textAnchor="middle" letterSpacing={2}>
              {d}
            </text>
            {/* pill slot */}
            <circle cx={cx} cy={760} r={44} fill="none" stroke={border} strokeWidth={5} opacity={0.9} />
            {done && tickS > 0.001 && (
              <g opacity={Math.min(1, tickS)} transform={`translate(${cx},760) scale(${Math.min(1, tickS)})`}>
                <path d="M -22 0 l 16 16 l 32 -38" fill="none" stroke={SAGE} strokeWidth={12}
                  strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
            {missed && (
              <g>
                <text x={cx} y={776} fill={AMBER} fontSize={52} fontFamily={MONO} fontWeight={900} textAnchor="middle">
                  !
                </text>
                <text x={cx} y={880} fill={AMBER} fontSize={26} fontFamily={MONO} textAnchor="middle" letterSpacing={1}>
                  MISSED
                </text>
                <text x={cx} y={916} fill={MUTED} fontSize={22} fontFamily={MONO} textAnchor="middle">
                  nudge sent
                </text>
              </g>
            )}
            {done && (
              <text x={cx} y={896} fill={SAGE} fontSize={26} fontFamily={MONO} textAnchor="middle" letterSpacing={1}>
                {i === MISSED ? 'MADE UP ✓' : 'TAKEN ✓'}
              </text>
            )}
            {!done && !missed && (
              <text x={cx} y={896} fill={FAINT} fontSize={26} fontFamily={MONO} textAnchor="middle">
                8:00 AM
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Station 3: progress ring fills through the week (right)
// ---------------------------------------------------------------------------
const ProgressRing_med: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 160, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const taken = dosesTaken(frame);
  const frac = taken / 7;
  const R = 170;
  const C = 2 * Math.PI * R;
  const cx = 2820;
  const cy = 700;
  const pct = Math.floor(frac * 100);
  const rot = frame * 0.004;
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={2480} y={380} width={680} height={700} rx={30} fill={PANEL} stroke={HAIRLINE} strokeWidth={3} />
      <text x={2540} y={462} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        WEEK PROGRESS
      </text>
      {/* tick ring */}
      {Array.from({length: 60}, (_, i) => {
        const a = (i / 60) * Math.PI * 2 + rot;
        const on = i / 60 < frac;
        return (
          <rect key={i} x={cx + Math.cos(a) * (R + 34) - 3} y={cy + Math.sin(a) * (R + 34) - 12}
            width={6} height={24} rx={3} fill={on ? SAGE : FAINT} opacity={on ? 0.95 : 0.4}
            transform={`rotate(${(a * 180) / Math.PI + 90} ${cx + Math.cos(a) * (R + 34)} ${cy + Math.sin(a) * (R + 34)})`} />
        );
      })}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(242,240,250,0.10)" strokeWidth={36} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={SAGE} strokeWidth={36}
        strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="round" style={{filter: 'drop-shadow(0 0 18px rgba(134,239,172,0.55))'}} />
      <text x={cx} y={cy + 8} fill={INK} fontSize={96} fontFamily={MONO} fontWeight={900} textAnchor="middle">
        {pct}%
      </text>
      <text x={cx} y={cy + 56} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle" letterSpacing={3}>
        OF WEEK COMPLETE
      </text>
      <text x={cx} y={1000} fill={FAINT} fontSize={28} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
        BEST STREAK <tspan fill={SAGE} fontWeight={800}>21 DAYS</tspan>
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Station 4: refill loop closes (bottom-left)
// ---------------------------------------------------------------------------
const RefillLoop_med: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 620, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const pillsLeft = Math.max(3, 21 - dosesTaken(frame) - Math.floor(interpolate(frame, [620, 800], [0, 11], clamp01)));
  const rot = (frame - 620) * 0.01;
  const closed = frame >= 780;
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={180} y={1180} width={1320} height={520} rx={30} fill={PANEL} stroke={HAIRLINE} strokeWidth={3} />
      <text x={240} y={1262} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        REFILL LOOP
      </text>
      <text x={240} y={1310} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        NEVER RUN DRY
      </text>
      {/* rotating dashed loop */}
      <g transform={`translate(520,1470) rotate(${(rot * 180) / Math.PI})`}>
        <circle r={110} fill="none" stroke={closed ? SAGE : LAV} strokeWidth={10}
          strokeDasharray="34 22" opacity={0.9} />
        <polygon points="0,-132 26,-96 -26,-96" fill={closed ? SAGE : LAV} />
      </g>
      {/* mini bottle */}
      <g transform="translate(520,1470)">
        <rect x={-34} y={-58} width={68} height={26} rx={8} fill={FAINT} />
        <rect x={-42} y={-32} width={84} height={96} rx={14} fill="#1C2230" stroke={LAV} strokeWidth={5} />
        <ellipse cx={0} cy={16} rx={18} ry={12} fill={SAGE} />
      </g>
      <text x={760} y={1440} fill={INK} fontSize={44} fontFamily={MONO} fontWeight={800}>
        PILLS LEFT: <tspan fill={pillsLeft <= 5 ? AMBER : INK}>{pillsLeft}</tspan>
      </text>
      <text x={760} y={1500} fill={MUTED} fontSize={32} fontFamily={MONO}>
        REFILL IN <tspan fill={LAV} fontWeight={800}>3 DAYS</tspan>
      </text>
      {closed && (
        <g>
          <rect x={760} y={1530} width={560} height={72} rx={36} fill="rgba(134,239,172,0.10)" stroke={SAGE} strokeWidth={3} />
          <text x={1040} y={1578} fill={SAGE} fontSize={30} fontFamily={MONO} fontWeight={800} textAnchor="middle" letterSpacing={2}>
            ✓ AUTO-REFILL SCHEDULED
          </text>
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Station 5: daily adherence bars (bottom-right)
// ---------------------------------------------------------------------------
const AdherenceBars_med: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 660, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const L = 1640;
  const Bb = 1620;
  const maxH = 300;
  return (
    <g opacity={Math.min(1, s)}>
      <rect x={1580} y={1180} width={1580} height={520} rx={30} fill={PANEL} stroke={HAIRLINE} strokeWidth={3} />
      <text x={1640} y={1262} fill={INK} fontSize={36} fontFamily={MONO} fontWeight={800} letterSpacing={3}>
        DAILY ADHERENCE
      </text>
      <text x={1640} y={1310} fill={FAINT} fontSize={28} fontFamily={MONO} letterSpacing={2}>
        WEEK AVG <tspan fill={SAGE} fontWeight={800}>{Math.floor((dosesTaken(frame) / 7) * 100)}%</tspan>
      </text>
      {DAYS.map((d, i) => {
        const done = dayDone(frame, i);
        const missed = i === MISSED && isMissedWindow(frame);
        const h = done ? maxH : missed ? maxH * 0.35 : 0;
        const bx = L + i * 200;
        const col = done ? SAGE : missed ? AMBER : 'rgba(242,240,250,0.12)';
        return (
          <g key={d}>
            <rect x={bx} y={Bb - h} width={110} height={Math.max(2, h)} rx={12} fill={col} opacity={0.9} />
            <text x={bx + 55} y={Bb + 48} fill={done ? INK : MUTED} fontSize={28} fontFamily={MONO}
              fontWeight={800} textAnchor="middle">
              {d}
            </text>
            {done && (
              <text x={bx + 55} y={Bb - h - 22} fill={SAGE} fontSize={26} fontFamily={MONO} textAnchor="middle">
                100%
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

const Payoff_med: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 840, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin((frame - 840) * 0.1);
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 120, display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        borderRadius: 30, padding: '34px 110px', background: 'rgba(18,16,28,0.95)',
        border: `3px solid ${LAV}`, textAlign: 'center',
        boxShadow: `0 0 ${50 + pulse * 50}px rgba(167,139,250,0.35)`,
      }}>
        <div style={{color: LAV, fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 1}}>
          STAY ON TRACK
        </div>
        <div style={{color: INK, fontFamily: MONO, fontSize: 36, marginTop: 10}}>
          7 of 7 doses · one nudge, zero guilt — <span style={{color: SAGE}}>the cycle continues</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const MedicationAdherenceCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_med frame={frame} />
      <AmbientParticles_med frame={frame} />
      <Title_med frame={frame} fps={fps} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <BottlePanel_med frame={frame} fps={fps} />
        <Organizer_med frame={frame} fps={fps} />
        <ProgressRing_med frame={frame} fps={fps} />
        <RefillLoop_med frame={frame} fps={fps} />
        <AdherenceBars_med frame={frame} fps={fps} />
      </svg>
      <Payoff_med frame={frame} fps={fps} />
      <TickerTape_med frame={frame} />
      <CornerHud_med frame={frame} />
      <FineDither_med frame={frame} />
      <FilmGrain_med frame={frame} />
    </AbsoluteFill>
  );
};
