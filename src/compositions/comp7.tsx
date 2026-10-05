/**
 * SATPrepJourney.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * A student's prep journey: a diagnostic test sheet scans in, the score report
 * reveals weak areas, a personal study plan assembles, practice drills fill
 * mastery bars, a full practice test runs under the clock — and on test day
 * the score climbs to the goal.
 * (Prep-journey arc only — never actual test-question UI, never a timer-only scene.)
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
// Palette — midnight blue + gold
// ---------------------------------------------------------------------------
const BG = '#070D1A';
const GRID = 'rgba(120,150,200,0.10)';
const AXIS = 'rgba(120,150,200,0.55)';
const INK = '#EDF1F7';
const MUTED = 'rgba(196,208,228,0.62)';
const GOLD = '#FBBF24';
const BLUE = '#5AC8FA';
const GREEN = '#4ADE80';
const AMBER = '#FB923C';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}card`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#101B33" />
      <stop offset="100%" stopColor="#0A1226" />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(7,13,26,0)" />
      <stop offset="100%" stopColor="rgba(2,5,12,0.80)" />
    </radialGradient>
    <filter id={`${p}glow`} x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="12" result="b" />
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
            'radial-gradient(circle at 50% 28%, rgba(251,191,36,0.11), rgba(251,191,36,0.03) 45%, rgba(7,13,26,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="sat" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#satvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(251,191,36,0.028)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`sat-p-x-${i}`) * 3840;
    const by = random(`sat-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`sat-p-s-${i}`) * 1.0;
    const ang = random(`sat-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.5));
    const sz = 2.5 + random(`sat-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? GOLD : 'rgba(237,241,247,0.85)'} opacity={tw} />);
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
    const bx = random(`sat-d-x-${i}`) * 3840;
    const by = random(`sat-d-y-${i}`) * 2160;
    const jx = (random(`sat-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`sat-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`sat-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`sat-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#E8CF8F" opacity={o} />);
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
    const x = random(`sat-g-x-${frame}-${i}`) * 3840;
    const y = random(`sat-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`sat-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`sat-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'DIAGNOSTIC DAY', 'FIND THE WEAK SPOTS', 'PERSONAL STUDY PLAN',
  'PRACTICE DRILLS', 'TEST DAY — GOAL 1450', 'STUDY SMART, SCORE HIGH',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 3840;
  const off = -((frame * 4.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 640} y={46} fill="rgba(251,191,36,0.7)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(251,191,36,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(251,191,36,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3180, y: 2090, t: 'SAT PREP JOURNEY · 1600 SCALE'},
    {x: 3180, y: 130, t: 'PREP SIMULATION'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={GOLD} opacity={0.35 + blink * 0.55} />
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
        SAT PREP <span style={{color: GOLD}}>JOURNEY</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        From diagnostic day to test-day goal — one study plan, start to finish
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Beat 1 — Diagnostic test sheet scans in (frames 0–160)
// ---------------------------------------------------------------------------
const Diagnostic: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 0 || frame > 160) return null;
  const fade = interpolate(frame, [140, 160], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scanY = interpolate(frame, [10, 130], [470, 1700], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scanned = Math.min(60, Math.floor(interpolate(frame, [10, 130], [0, 60], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));
  const rows: React.ReactElement[] = [];
  for (let r = 0; r < 12; r++) {
    const ry = 700 + r * 82;
    const filled = Math.floor(random(`sat-diag-f-${r}`) * 5);
    const anyFill = random(`sat-diag-a-${r}`) > 0.25;
    const bubbles: React.ReactElement[] = [];
    for (let b = 0; b < 5; b++) {
      const bx = 620 + b * 130;
      bubbles.push(
        <g key={b}>
          <circle cx={bx} cy={ry} r={19} fill={b === filled && anyFill ? GOLD : 'rgba(7,13,26,0.6)'} stroke={AXIS} strokeWidth={2.5} />
          <text x={bx - 165} y={ry + 8} fill={MUTED} fontSize={22} fontFamily={MONO} opacity={0}>
            {''}
          </text>
        </g>
      );
    }
    rows.push(
      <g key={r}>
        <text x={440} y={ry + 10} fill={MUTED} fontSize={30} fontFamily={MONO}>
          {String(r + 1).padStart(2, '0')}
        </text>
        {bubbles}
      </g>
    );
  }
  const letters = ['A', 'B', 'C', 'D', 'E'];
  return (
    <g opacity={fade}>
      {/* sheet card */}
      <rect x={400} y={450} width={1050} height={1290} rx={28} fill="url(#satcard)" stroke={AXIS} strokeWidth={2.5} />
      <text x={460} y={540} fill={INK} fontSize={42} fontFamily={FONT} fontWeight={800} letterSpacing={1}>
        DIAGNOSTIC TEST — FORM A
      </text>
      <text x={460} y={596} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={2}>
        ANSWER SHEET · 60 QUESTIONS
      </text>
      {letters.map((L, i) => (
        <text key={L} x={620 + i * 130} y={655} fill={GOLD} fontSize={26} fontFamily={MONO} fontWeight={700} textAnchor="middle">
          {L}
        </text>
      ))}
      {rows}
      {/* scan line */}
      <rect x={400} y={scanY - 6} width={1050} height={12} fill={GOLD} opacity={0.85} filter="url(#satglow)" />
      <text x={1470} y={scanY + 8} fill={GOLD} fontSize={26} fontFamily={MONO} letterSpacing={2}>
        SCANNING
      </text>
      {/* live counter panel */}
      <rect x={1700} y={450} width={1740} height={1290} rx={28} fill="rgba(10,18,38,0.75)" stroke={AXIS} strokeWidth={2.5} />
      <text x={1790} y={560} fill={GOLD} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={3}>
        LIVE SCAN
      </text>
      <text x={1790} y={760} fill={INK} fontSize={120} fontFamily={MONO} fontWeight={800}>
        {String(scanned).padStart(2, '0')}
        <tspan fill={MUTED} fontSize={60}>/60</tspan>
      </text>
      <text x={1790} y={860} fill={MUTED} fontSize={34} fontFamily={FONT}>
        questions digitized from the answer sheet
      </text>
      <rect x={1790} y={950} width={1560} height={34} rx={17} fill="rgba(120,150,200,0.14)" />
      <rect x={1790} y={950} width={1560 * (scanned / 60)} height={34} rx={17} fill={GOLD} filter="url(#satglow)" />
      <text x={1790} y={1100} fill={MUTED} fontSize={32} fontFamily={MONO}>
        SHEET 1 OF 2 · BUBBLE DETECTION 99.2%
      </text>
      <text x={1790} y={1300} fill={INK} fontSize={44} fontFamily={FONT} fontWeight={700}>
        Every prep journey starts with an honest baseline.
      </text>
      <text x={1790} y={1370} fill={MUTED} fontSize={36} fontFamily={FONT}>
        The diagnostic shows exactly where to aim your hours.
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 2 — Score report reveals weak areas (frames 140–300)
// ---------------------------------------------------------------------------
const SECTIONS = [
  {label: 'MATH', score: 540, weak: true},
  {label: 'READING', score: 630, weak: false},
];
const ScoreReport: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 140 || frame > 300) return null;
  const t = frame - 140;
  const fade = interpolate(frame, [280, 300], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const total = Math.round(interpolate(t, [20, 110], [0, 1170], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const pulse = 0.55 + 0.45 * Math.sin(frame * 0.18);
  return (
    <g opacity={fade}>
      <rect x={1020} y={540} width={1800} height={1150} rx={32} fill="url(#satcard)" stroke={AXIS} strokeWidth={2.5} />
      <text x={1920} y={650} fill={GOLD} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4} textAnchor="middle">
        SCORE REPORT
      </text>
      <text x={1920} y={830} fill={INK} fontSize={150} fontFamily={MONO} fontWeight={800} textAnchor="middle">
        {total.toLocaleString('en-US')}
      </text>
      <text x={1920} y={890} fill={MUTED} fontSize={32} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
        TOTAL · OUT OF 1600 · GOAL 1450
      </text>
      <rect x={1260} y={930} width={1320} height={26} rx={13} fill="rgba(120,150,200,0.14)" />
      <rect x={1260} y={930} width={1320 * Math.min(1, total / 1600)} height={26} rx={13} fill={BLUE} />
      <line x1={1260 + 1320 * (1450 / 1600)} y1={910} x2={1260 + 1320 * (1450 / 1600)} y2={976} stroke={GOLD} strokeWidth={4} />
      <text x={1260 + 1320 * (1450 / 1600)} y={1010} fill={GOLD} fontSize={26} fontFamily={MONO} textAnchor="middle">
        GOAL
      </text>
      {SECTIONS.map((s, i) => {
        const y = 1120 + i * 240;
        const fill = interpolate(t, [60 + i * 40, 130 + i * 40], [0, s.score / 800], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const shown = Math.round(fill * 800);
        return (
          <g key={s.label}>
            {s.weak && (
              <rect x={1150} y={y - 96} width={1540} height={170} rx={20} fill="none" stroke={AMBER} strokeWidth={3}
                opacity={pulse} filter="url(#satglow)" />
            )}
            <text x={1220} y={y} fill={INK} fontSize={44} fontFamily={FONT} fontWeight={800}>
              {s.label}
            </text>
            {s.weak && (
              <text x={2560} y={y} fill={AMBER} fontSize={30} fontFamily={MONO} fontWeight={700} letterSpacing={2} opacity={pulse}>
                FOCUS AREA
              </text>
            )}
            <rect x={1220} y={y + 30} width={1300} height={36} rx={18} fill="rgba(120,150,200,0.14)" />
            <rect x={1220} y={y + 30} width={1300 * fill} height={36} rx={18} fill={s.weak ? AMBER : GREEN} filter="url(#satglow)" />
            <text x={2580} y={y + 62} fill={INK} fontSize={44} fontFamily={MONO} fontWeight={700}>
              {shown}<tspan fill={MUTED} fontSize={30}>/800</tspan>
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 3 — Personal study plan assembles (frames 280–460)
// ---------------------------------------------------------------------------
const PLANS = [
  {title: 'MATH', hours: '10 HRS / WK', color: GOLD, chips: ['ALGEBRA', 'GEOMETRY', 'TRIG']},
  {title: 'READING', hours: '6 HRS / WK', color: BLUE, chips: ['PASSAGES', 'VOCAB', 'TIMING']},
  {title: 'WRITING', hours: '4 HRS / WK', color: GREEN, chips: ['GRAMMAR', 'STYLE', 'PUNCTUATION']},
];
const StudyPlan: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 280 || frame > 460) return null;
  const t = frame - 280;
  const fade = interpolate(frame, [440, 460], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <g opacity={fade}>
      <text x={1920} y={620} fill={GOLD} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4} textAnchor="middle">
        YOUR PERSONAL STUDY PLAN
      </text>
      {PLANS.map((p, i) => {
        const s = spring({frame: t - i * 30, fps, config: {damping: 200, stiffness: 110}});
        if (s <= 0.001) return null;
        const x = 870 + i * 1050;
        const op = Math.min(1, s);
        const yy = 700 + (1 - Math.min(1, s)) * 90;
        const barW = interpolate(t, [40 + i * 30, 110 + i * 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <g key={p.title} opacity={op} transform={`translate(${x}, ${yy})`}>
            <rect x={-440} y={0} width={880} height={830} rx={28} fill="url(#satcard)" stroke={p.color} strokeWidth={3} />
            <circle cx={0} cy={150} r={95} fill="rgba(251,191,36,0.08)" stroke={p.color} strokeWidth={5} filter="url(#satglow)" />
            <text y={170} fill={p.color} fontSize={64} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {i + 1}
            </text>
            <text y={330} fill={INK} fontSize={64} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {p.title}
            </text>
            <text y={392} fill={p.color} fontSize={32} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
              {p.hours}
            </text>
            <rect x={-360} y={440} width={720} height={30} rx={15} fill="rgba(120,150,200,0.14)" />
            <rect x={-360} y={440} width={720 * barW} height={30} rx={15} fill={p.color} filter="url(#satglow)" />
            {p.chips.map((c, j) => (
              <g key={c} opacity={interpolate(t, [70 + i * 30 + j * 14, 95 + i * 30 + j * 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
                <rect x={-360} y={520 + j * 80} width={720} height={60} rx={30} fill="rgba(120,150,200,0.08)" stroke={AXIS} strokeWidth={1.5} />
                <text x={0} y={562 + j * 80} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
                  {c}
                </text>
              </g>
            ))}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 4 — Practice drills fill mastery bars (frames 440–640)
// ---------------------------------------------------------------------------
const DRILLS = [
  {label: 'ALGEBRA', pct: 92, n: '36 DRILLS'},
  {label: 'GEOMETRY', pct: 84, n: '28 DRILLS'},
  {label: 'READING COMP', pct: 88, n: '24 DRILLS'},
  {label: 'GRAMMAR', pct: 95, n: '20 DRILLS'},
  {label: 'TIMING', pct: 81, n: '12 DRILLS'},
];
const PracticeDrills: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 440 || frame > 640) return null;
  const t = frame - 440;
  const fade = interpolate(frame, [620, 640], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <g opacity={fade}>
      <text x={700} y={620} fill={GOLD} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4}>
        PRACTICE DRILLS — 120 COMPLETED
      </text>
      {DRILLS.map((d, i) => {
        const y = 760 + i * 210;
        const fill = interpolate(t, [20 + i * 28, 90 + i * 28], [0, d.pct / 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const done = fill >= d.pct / 100 - 0.001;
        const chk = spring({frame: t - (90 + i * 28), fps, config: {damping: 200, stiffness: 180}});
        return (
          <g key={d.label}>
            <text x={700} y={y} fill={INK} fontSize={40} fontFamily={FONT} fontWeight={700}>
              {d.label}
            </text>
            <text x={700} y={y + 46} fill={MUTED} fontSize={28} fontFamily={MONO}>
              {d.n}
            </text>
            <rect x={1180} y={y - 34} width={1520} height={44} rx={22} fill="rgba(120,150,200,0.14)" />
            <rect x={1180} y={y - 34} width={1520 * fill} height={44} rx={22} fill={GOLD} filter="url(#satglow)" />
            <text x={2760} y={y + 12} fill={INK} fontSize={44} fontFamily={MONO} fontWeight={700}>
              {Math.round(fill * 100)}%
            </text>
            {done && chk > 0.01 && (
              <g opacity={Math.min(1, chk)} transform={`translate(3040, ${y - 10}) scale(${Math.min(1, chk)})`}>
                <circle cx={0} cy={0} r={34} fill={GREEN} filter="url(#satglow)" />
                <text y={16} fill="#07110C" fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">
                  ✓
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 5 — Full practice test under the clock (frames 620–780)
// (Guardrail: timer is one element of a larger scene, never the whole scene.)
// ---------------------------------------------------------------------------
const PracticeTest: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 620 || frame > 780) return null;
  const t = frame - 620;
  const fade = interpolate(frame, [760, 780], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const prog = interpolate(t, [0, 140], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const remain = 300 - prog * 300;
  const mm = Math.floor(remain / 60);
  const ss = Math.floor(remain % 60);
  const answered = Math.round(prog * 98);
  const proj = Math.round(interpolate(t, [0, 140], [1170, 1330], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const secs = ['READING', 'WRITING', 'MATH A', 'MATH B'];
  return (
    <g opacity={fade}>
      <rect x={880} y={540} width={2080} height={1150} rx={32} fill="url(#satcard)" stroke={AXIS} strokeWidth={2.5} />
      <text x={1920} y={650} fill={GOLD} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4} textAnchor="middle">
        FULL PRACTICE TEST — #3
      </text>
      {/* section chips */}
      {secs.map((s, i) => {
        const on = interpolate(prog, [i * 0.25, i * 0.25 + 0.12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <g key={s} opacity={0.35 + on * 0.65}>
            <rect x={1010 + i * 500} y={700} width={440} height={90} rx={45}
              fill={on > 0.5 ? 'rgba(251,191,36,0.16)' : 'rgba(120,150,200,0.07)'} stroke={on > 0.5 ? GOLD : AXIS} strokeWidth={2.5} />
            <text x={1230 + i * 500} y={758} fill={on > 0.5 ? GOLD : MUTED} fontSize={30} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
              {s}
            </text>
          </g>
        );
      })}
      {/* timer ring */}
      <circle cx={1420} cy={1200} r={180} fill="none" stroke="rgba(120,150,200,0.16)" strokeWidth={22} />
      <circle cx={1420} cy={1200} r={180} fill="none" stroke={GOLD} strokeWidth={22} strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={prog}
        transform="rotate(-90 1420 1200)" filter="url(#satglow)" />
      <text x={1420} y={1190} fill={INK} fontSize={96} fontFamily={MONO} fontWeight={800} textAnchor="middle">
        {mm}:{String(ss).padStart(2, '0')}
      </text>
      <text x={1420} y={1260} fill={MUTED} fontSize={28} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
        TIME REMAINING
      </text>
      {/* answered counter + projection */}
      <text x={2050} y={1080} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={3}>
        QUESTIONS ANSWERED
      </text>
      <text x={2050} y={1210} fill={INK} fontSize={130} fontFamily={MONO} fontWeight={800}>
        {answered}<tspan fill={MUTED} fontSize={60}>/98</tspan>
      </text>
      <text x={2050} y={1360} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={3}>
        PROJECTED SCORE
      </text>
      <text x={2050} y={1470} fill={GOLD} fontSize={84} fontFamily={MONO} fontWeight={800}>
        {proj.toLocaleString('en-US')}
      </text>
      <text x={2050} y={1560} fill={MUTED} fontSize={30} fontFamily={FONT}>
        pacing holds — the drills are paying off
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 6 — Test day payoff (frames 760–900)
// ---------------------------------------------------------------------------
const Confetti: React.FC<{frame: number}> = ({frame}) => {
  const t = frame - 760;
  if (t < 0) return null;
  const els: React.ReactElement[] = [];
  const cols = [GOLD, BLUE, INK, GREEN];
  for (let i = 0; i < 150; i++) {
    const x = random(`sat-c-x-${i}`) * 3840;
    const spd = 6 + random(`sat-c-s-${i}`) * 10;
    const y = (((random(`sat-c-o-${i}`) * 2400) + t * spd) % 2400) - 150;
    const rot = (frame * (1 + random(`sat-c-r-${i}`) * 3) + random(`sat-c-a-${i}`) * 360) % 360;
    const w = 14 + random(`sat-c-w-${i}`) * 22;
    els.push(
      <rect key={i} x={x} y={y} width={w} height={w * 0.55} fill={cols[i % 4]}
        opacity={0.9} transform={`rotate(${rot} ${x} ${y})`} />
    );
  }
  return <g>{els}</g>;
};

const Payoff: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 760) return null;
  const t = frame - 760;
  const score = Math.round(interpolate(t, [10, 95], [1170, 1450], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const banner = spring({frame: t - 100, fps, config: {damping: 200, stiffness: 120}});
  return (
    <g>
      <Confetti frame={frame} />
      <text x={1920} y={640} fill={MUTED} fontSize={34} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        TEST DAY · DIAGNOSTIC 1,170 → TODAY
      </text>
      <text x={1920} y={880} fill={GOLD} fontSize={230} fontFamily={MONO} fontWeight={800} textAnchor="middle"
        style={{filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.55))'}}>
        {score.toLocaleString('en-US')}
      </text>
      <text x={1920} y={970} fill={MUTED} fontSize={32} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
        FINAL SCORE · GOAL WAS 1,450
      </text>
      {banner > 0.01 && (
        <g opacity={Math.min(1, banner)} transform={`translate(1920, 1150) scale(${0.8 + Math.min(1, banner) * 0.2})`}>
          <rect x={-520} y={-80} width={1040} height={160} rx={80} fill="rgba(10,20,36,0.96)" stroke={GREEN} strokeWidth={5} filter="url(#satglow)" />
          <text y={28} fill={GREEN} fontSize={72} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={2}>
            ✓ GOAL REACHED
          </text>
        </g>
      )}
      <text x={1920} y={1400} fill={INK} fontSize={44} fontFamily={FONT} fontWeight={700} textAnchor="middle">
        Weak spots found. Plan built. Drills done. Score earned.
      </text>
    </g>
  );
};

const Stage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => (
  <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
    <Diagnostic frame={frame} />
    <ScoreReport frame={frame} />
    <StudyPlan frame={frame} fps={fps} />
    <PracticeDrills frame={frame} fps={fps} />
    <PracticeTest frame={frame} />
    <Payoff frame={frame} fps={fps} />
  </svg>
);

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(196,208,228,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Scores shown are illustrative. Study results vary — no guarantees.
    </div>
  );
};

export const SATPrepJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <Stage frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
