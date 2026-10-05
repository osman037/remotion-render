/**
 * LifeInsuranceApplicationFlow.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * A life-insurance application journey: an applicant profile card, an animated
 * quote slider (term length and coverage amount drive the premium), the
 * application submits, a paramedical-exam checklist ticks with a NO-EXAM PATH
 * alternative, underwriting gears turn through the data, an APPROVED stamp
 * lands, and the policy issues with its premium schedule.
 * (Application and underwriting only — never claim filing, never
 * term-vs-whole-life product comparison.)
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
// Palette — deep green + white on near-black green
// ---------------------------------------------------------------------------
const BG = '#04120A';
const INK = '#F4FAF6';
const MUTED = 'rgba(205,228,215,0.62)';
const GREEN = '#4ADE80';
const GREEN_DK = '#14532D';
const MINT = '#A7F3D0';
const GOLD = '#FBBF24';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// Deterministic quote model: sliders animate term 10→20 yr, coverage 250k→500k
const quoteAt = (f: number): {term: number; cov: number; prem: number} => {
  const term = interpolate(f, [140, 260], [10, 20], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cov = interpolate(f, [140, 260], [250000, 500000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const prem = Math.max(8, (cov / 1000000) * (term / 20) * 64);
  return {term, cov, prem};
};

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}card`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#0B2B1A" />
      <stop offset="100%" stopColor="#061A10" />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(4,18,10,0)" />
      <stop offset="100%" stopColor="rgba(2,9,5,0.8)" />
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
            'radial-gradient(circle at 50% 30%, rgba(74,222,128,0.12), rgba(74,222,128,0.04) 45%, rgba(4,18,10,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="li" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#livig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(74,222,128,0.030)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`li-p-x-${i}`) * 3840;
    const by = random(`li-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`li-p-s-${i}`) * 1.0;
    const ang = random(`li-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.5));
    const sz = 2.5 + random(`li-p-z-${i}`) * 5;
    els.push(
      <circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? GOLD : 'rgba(74,222,128,0.8)'} opacity={tw} />
    );
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
    const bx = random(`li-d-x-${i}`) * 3840;
    const by = random(`li-d-y-${i}`) * 2160;
    const jx = (random(`li-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`li-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`li-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`li-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#CDEFD8" opacity={o} />);
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
    const x = random(`li-g-x-${frame}-${i}`) * 3840;
    const y = random(`li-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`li-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`li-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'APPLY ONLINE', 'INSTANT QUOTE', 'PARAMEDICAL EXAM', 'NO-EXAM PATH',
  'UNDERWRITING', 'APPROVED', 'POLICY ISSUED',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 4900;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 700} y={46} fill="rgba(74,222,128,0.75)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(74,222,128,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(74,222,128,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 2960, y: 2090, t: 'LIFE INSURANCE APPLICATION'},
    {x: 2890, y: 130, t: 'BUSINESS · INSURANCE'},
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

const Title: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [20, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [20, 60], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 130 + rise, left: 180, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        LIFE INSURANCE <span style={{color: GREEN}}>APPLICATION</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        Quote · apply · <span style={{color: GREEN, fontWeight: 700}}>underwrite</span> · approved — the path to a policy
      </div>
    </div>
  );
};

const PremiumHud: React.FC<{frame: number}> = ({frame}) => {
  const inAt = spring({frame: frame - 120, fps: 60, config: {damping: 200, stiffness: 90}});
  if (inAt <= 0.01) return null;
  const q = quoteAt(frame);
  const fillC = interpolateColors(q.prem / 64, [0.25, 0.5, 1], [GREEN, MINT, GOLD]);
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={Math.min(1, inAt)} transform={`translate(2810, 150) scale(${0.9 + Math.min(1, inAt) * 0.1})`}>
        <rect x={0} y={0} width={880} height={230} rx={28} fill="rgba(3,12,7,0.92)" stroke={GREEN} strokeWidth={3} filter="url(#liglow)" />
        <text x={44} y={62} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={4}>EST. PREMIUM</text>
        <text x={44} y={158} fill={fillC} fontSize={92} fontFamily={MONO} fontWeight={800}>
          ${q.prem.toFixed(0)}<tspan fontSize={44} fill={MUTED}>/mo</tspan>
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 1 — applicant profile card (frames 30–150)
// ---------------------------------------------------------------------------
const Profile: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 20 || frame > 170) return null;
  const fade = interpolate(frame, [130, 170], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = spring({frame: frame - 20, fps, config: {damping: 200, stiffness: 100}});
  const rows = [
    {t: 'AGE', v: '34'},
    {t: 'TOBACCO', v: 'NON-SMOKER'},
    {t: 'HEALTH CLASS', v: 'PREFERRED'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade * Math.min(1, s)} transform={`translate(350, ${640 + (1 - Math.min(1, s)) * 120})`}>
        <rect x={0} y={0} width={820} height={640} rx={30} fill="url(#licard)" stroke={GREEN} strokeWidth={4} filter="url(#liglow)" />
        <text x={48} y={98} fill={GREEN} fontSize={30} fontFamily={MONO} letterSpacing={5}>APPLICANT</text>
        <circle cx={130} cy={200} r={64} fill={GREEN_DK} stroke={MINT} strokeWidth={4} />
        <text x={130} y={222} fill={MINT} fontSize={56} fontFamily={FONT} fontWeight={800} textAnchor="middle">A</text>
        <text x={230} y={200} fill={INK} fontSize={52} fontFamily={FONT} fontWeight={800}>A. APPLICANT</text>
        <text x={230} y={252} fill={MUTED} fontSize={32} fontFamily={FONT}>applying for coverage</text>
        <line x1={48} y1={300} x2={772} y2={300} stroke="rgba(74,222,128,0.25)" strokeWidth={2} />
        {rows.map((r, i) => {
          const ron = interpolate(frame - (70 + i * 25), [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <g key={i} opacity={ron}>
              <text x={48} y={380 + i * 80} fill={MUTED} fontSize={34} fontFamily={MONO} letterSpacing={2}>{r.t}</text>
              <text x={772} y={380 + i * 80} fill={GREEN} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="end">{r.v}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 2 — quote sliders animate: term length + coverage amount (frames 120–300)
// ---------------------------------------------------------------------------
const Quote: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 120 || frame > 330) return null;
  const fade = interpolate(frame, [290, 330], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = spring({frame: frame - 120, fps, config: {damping: 200, stiffness: 100}});
  const q = quoteAt(frame);
  const T0 = 400; const T1 = 2100;
  const termX = T0 + ((q.term - 10) / 10) * (T1 - T0);
  const covX = T0 + ((q.cov - 250000) / 250000) * (T1 - T0);
  const slider = (label: string, y: number, kx: number, val: string, marks: string[]) => (
    <g>
      <text x={T0 - 330} y={y + 14} fill={MUTED} fontSize={36} fontFamily={MONO} letterSpacing={2} textAnchor="end">{label}</text>
      <line x1={T0} y1={y} x2={T1} y2={y} stroke="rgba(74,222,128,0.3)" strokeWidth={10} strokeLinecap="round" />
      <line x1={T0} y1={y} x2={kx} y2={y} stroke={GREEN} strokeWidth={10} strokeLinecap="round" />
      {marks.map((m, i) => (
        <text key={i} x={T0 + (i / (marks.length - 1)) * (T1 - T0)} y={y + 62} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle">
          {m}
        </text>
      ))}
      <circle cx={kx} cy={y} r={44} fill={GREEN} filter="url(#liglow)" />
      <circle cx={kx} cy={y} r={18} fill="#04120A" />
      <text x={kx} y={y - 74} fill={INK} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">{val}</text>
    </g>
  );
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade * Math.min(1, s)} transform={`translate(0, ${(1 - Math.min(1, s)) * 100})`}>
        <rect x={350} y={1180} width={2350} height={560} rx={30} fill="rgba(3,12,7,0.94)" stroke={GREEN} strokeWidth={4} filter="url(#liglow)" />
        <text x={410} y={1276} fill={GREEN} fontSize={30} fontFamily={MONO} letterSpacing={5}>INSTANT QUOTE</text>
        <g transform="translate(350, 1450)">
          {slider('TERM', 0, termX - 350, `${Math.round(q.term)} YRS`, ['10 YR', '15 YR', '20 YR'])}
        </g>
        <g transform="translate(350, 1620)">
          {slider('COVERAGE', 0, covX - 350, `$${Math.round(q.cov / 1000)}K`, ['$250K', '$375K', '$500K'])}
        </g>
        <text x={2390} y={1276} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="end">
          drag → premium updates live
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 3 — application submits (frames 280–390)
// ---------------------------------------------------------------------------
const Submit: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 280 || frame > 410) return null;
  const fade = interpolate(frame, [370, 410], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fly = interpolate(frame, [300, 360], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sx = 900; const sy = 1500; const ex = 2950; const ey = 1000;
  const px = sx + fly * (ex - sx);
  const py = sy - Math.sin(fly * Math.PI) * 320;
  const carrier = spring({frame: frame - 340, fps, config: {damping: 200, stiffness: 110}});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        {carrier > 0.01 && (
          <g opacity={Math.min(1, carrier)} transform={`translate(2950, ${900 + (1 - Math.min(1, carrier)) * 100})`}>
            <rect x={-260} y={-140} width={520} height={280} rx={24} fill="url(#licard)" stroke={MINT} strokeWidth={4} filter="url(#liglow)" />
            <text y={-20} fill={MINT} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">CARRIER</text>
            <text y={44} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="middle">receives application</text>
            {fly >= 1 && (
              <g>
                <circle cx={180} cy={-180} r={46} fill="rgba(74,222,128,0.15)" stroke={GREEN} strokeWidth={5} />
                <path d="M 162 -180 L 174 -168 L 200 -196" fill="none" stroke={GREEN} strokeWidth={8} strokeLinecap="round" />
              </g>
            )}
          </g>
        )}
        {fly > 0 && fly < 1 && (
          <g transform={`translate(${px}, ${py}) rotate(${fly * 12})`}>
            <rect x={-130} y={-90} width={260} height={180} rx={14} fill="#F4FAF6" stroke={GREEN} strokeWidth={5} />
            <polygon points="-130,-90 0,10 130,-90" fill="none" stroke={GREEN} strokeWidth={5} />
            <text y={70} fill={GREEN_DK} fontSize={30} fontFamily={MONO} fontWeight={800} textAnchor="middle">APPLICATION</text>
          </g>
        )}
        <g opacity={fly}>
          <path d={`M ${sx} ${sy} Q 1900 ${sy - 480} ${ex} ${ey}`} fill="none" stroke={GREEN} strokeWidth={5} strokeDasharray="20 16" />
        </g>
        <text x={900} y={1620} fill={MUTED} fontSize={36} fontFamily={FONT} opacity={fade}>
          the signed application <tspan fill={GREEN} fontWeight={700}>submits</tspan> — underwriting begins
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 4 — paramedical exam checklist + NO-EXAM PATH (frames 360–560)
// ---------------------------------------------------------------------------
const Exam: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 360 || frame > 590) return null;
  const fade = interpolate(frame, [550, 590], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = spring({frame: frame - 360, fps, config: {damping: 200, stiffness: 100}});
  const noExam = spring({frame: frame - 470, fps, config: {damping: 200, stiffness: 120}});
  const checks = [
    {t: 'BLOOD PRESSURE + PULSE', d: 390},
    {t: 'HEIGHT + WEIGHT', d: 420},
    {t: 'BLOOD DRAW', d: 450},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        <g opacity={Math.min(1, s)} transform={`translate(350, ${1050 + (1 - Math.min(1, s)) * 100})`}>
          <rect x={0} y={0} width={1000} height={560} rx={30} fill="rgba(3,12,7,0.94)" stroke={GREEN} strokeWidth={4} filter="url(#liglow)" />
          <text x={48} y={92} fill={GREEN} fontSize={30} fontFamily={MONO} letterSpacing={5}>PARAMEDICAL EXAM</text>
          {checks.map((c, i) => {
            const ck = spring({frame: frame - c.d, fps, config: {damping: 200, stiffness: 140}});
            if (ck <= 0.01) return null;
            const cy = 190 + i * 110;
            return (
              <g key={i} opacity={Math.min(1, ck)}>
                <g transform={`translate(100, ${cy - 14}) scale(${Math.min(1, ck)})`}>
                  <circle cx={0} cy={0} r={34} fill="rgba(74,222,128,0.15)" stroke={GREEN} strokeWidth={5} />
                  <path d="M -16 0 L -4 14 L 18 -12" fill="none" stroke={GREEN} strokeWidth={7} strokeLinecap="round" />
                </g>
                <text x={170} y={cy} fill={INK} fontSize={38} fontFamily={MONO}>{c.t}</text>
              </g>
            );
          })}
          <text x={48} y={520} fill={MUTED} fontSize={30} fontFamily={FONT}>takes ~20 minutes, at home or work</text>
        </g>
        {noExam > 0.01 && (
          <g opacity={Math.min(1, noExam)} transform={`translate(1560, 1180) scale(${Math.min(1, noExam)})`}>
            <rect x={-300} y={-120} width={600} height={240} rx={120} fill="rgba(251,191,36,0.12)" stroke={GOLD} strokeWidth={5} strokeDasharray="24 16" filter="url(#liglow)" />
            <text y={-16} fill={GOLD} fontSize={54} fontFamily={FONT} fontWeight={800} textAnchor="middle">NO-EXAM PATH</text>
            <text y={52} fill={INK} fontSize={34} fontFamily={FONT} textAnchor="middle">data-only underwriting</text>
          </g>
        )}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Gear drawing helper + Beat 5 — underwriting gears turn (frames 540–700)
// ---------------------------------------------------------------------------
const Gear: React.FC<{x: number; y: number; r: number; speed: number; frame: number; dir?: number}> = ({x, y, r, speed, frame, dir}) => {
  const a = ((frame * speed * (dir === -1 ? -1 : 1)) % 360) * (Math.PI / 180);
  const teeth = 12;
  const els: React.ReactElement[] = [];
  for (let i = 0; i < teeth; i++) {
    const ta = (i / teeth) * Math.PI * 2 + a;
    els.push(
      <rect key={i} x={-r * 0.12} y={-r * 1.28} width={r * 0.24} height={r * 0.36} rx={6} fill={GREEN_DK} stroke={GREEN} strokeWidth={3}
        transform={`translate(${x + Math.cos(ta) * r * 1.02}, ${y + Math.sin(ta) * r * 1.02}) rotate(${(ta * 180) / Math.PI + 90})`} />
    );
  }
  return (
    <g>
      {els}
      <circle cx={x} cy={y} r={r} fill="rgba(20,83,45,0.5)" stroke={GREEN} strokeWidth={6} />
      <circle cx={x} cy={y} r={r * 0.35} fill="none" stroke={GREEN} strokeWidth={5} />
      <line x1={x} y1={y} x2={x + Math.cos(a) * r * 0.85} y2={y + Math.sin(a) * r * 0.85} stroke={MINT} strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};

const Underwrite: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 540 || frame > 720) return null;
  const fade = interpolate(frame, [680, 720], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = spring({frame: frame - 540, fps, config: {damping: 200, stiffness: 100}});
  const feeds = [
    {t: 'MEDICAL RECORDS', d: 560},
    {t: 'PRESCRIPTION HISTORY', d: 590},
    {t: 'DRIVING RECORD', d: 620},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade}>
        <text x={1920} y={560} fill={INK} fontSize={56} fontFamily={FONT} fontWeight={800} textAnchor="middle" opacity={Math.min(1, s)}>
          UNDERWRITING
        </text>
        <text x={1920} y={620} fill={MUTED} fontSize={34} fontFamily={FONT} textAnchor="middle" opacity={Math.min(1, s)}>
          the carrier verifies the risk picture
        </text>
        <g opacity={Math.min(1, s)}>
          <Gear x={1920} y={1050} r={230} speed={1.6} frame={frame} />
          <Gear x={1560} y={1330} r={150} speed={2.4} frame={frame} dir={-1} />
          <Gear x={2280} y={1330} r={150} speed={2.4} frame={frame} dir={-1} />
        </g>
        {feeds.map((f, i) => {
          const on = interpolate(frame - f.d, [0, 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          if (on <= 0) return null;
          const fx = 350 + i * 40;
          return (
            <g key={i} opacity={on} transform={`translate(${fx}, ${900 + i * 130})`}>
              <rect x={0} y={0} width={620} height={88} rx={20} fill="rgba(3,12,7,0.9)" stroke={MINT} strokeWidth={3} />
              <text x={28} y={56} fill={MINT} fontSize={30} fontFamily={MONO} letterSpacing={2}>{f.t}</text>
              <line x1={660} y1={44} x2={1300} y2={44} stroke={MINT} strokeWidth={4} strokeDasharray="16 12" opacity={0.7} />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 6 — APPROVED stamp (frames 680–780)
// ---------------------------------------------------------------------------
const Approved: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 670 || frame > 800) return null;
  const fade = interpolate(frame, [760, 800], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const st = spring({frame: frame - 680, fps, config: {damping: 200, stiffness: 130}});
  if (st <= 0.01) return null;
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={fade * Math.min(1, st)} transform={`translate(1920, 1050) rotate(${-12 + (1 - Math.min(1, st)) * -18}) scale(${Math.min(1, st)})`}>
        <rect x={-460} y={-150} width={920} height={300} rx={28} fill="none" stroke={GREEN} strokeWidth={14} filter="url(#liglow)" />
        <text y={52} fill={GREEN} fontSize={150} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={10}>
          APPROVED
        </text>
        <text y={240} fill={MUTED} fontSize={32} fontFamily={MONO} textAnchor="middle" letterSpacing={3}>
          PREFERRED RATE CLASS
        </text>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Beat 7 — policy issues with premium schedule (frames 760–900)
// ---------------------------------------------------------------------------
const Policy: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 750) return null;
  const s = spring({frame: frame - 750, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.01) return null;
  const q = quoteAt(frame);
  const rows = [1, 5, 10, 15, 20].filter((y) => y <= Math.round(q.term));
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <g opacity={Math.min(1, s)} transform={`translate(350, ${860 + (1 - Math.min(1, s)) * 120})`}>
        <rect x={0} y={0} width={1500} height={940} rx={24} fill="#F4FAF6" stroke={GREEN_DK} strokeWidth={5} filter="url(#liglow)" />
        <text x={64} y={110} fill={GREEN_DK} fontSize={58} fontFamily={FONT} fontWeight={800} letterSpacing={4}>
          POLICY ISSUED
        </text>
        <text x={64} y={166} fill="#5B6B60" fontSize={32} fontFamily={MONO}>#LI-2026-88412 · {Math.round(q.term)}-YEAR TERM</text>
        <line x1={64} y1={210} x2={1436} y2={210} stroke="#C9D8CE" strokeWidth={3} />
        <text x={64} y={290} fill={GREEN_DK} fontSize={40} fontFamily={FONT} fontWeight={800}>
          COVERAGE <tspan fill="#14532D">${Math.round(q.cov).toLocaleString('en-US')}</tspan>
        </text>
        <text x={1436} y={290} fill={GREEN_DK} fontSize={40} fontFamily={MONO} fontWeight={800} textAnchor="end">
          ${q.prem.toFixed(0)}/mo
        </text>
        <text x={64} y={370} fill="#5B6B60" fontSize={32} fontFamily={MONO} letterSpacing={3}>PREMIUM SCHEDULE</text>
        {rows.map((y, i) => {
          const ry = 440 + i * 92;
          const ron = interpolate(frame - (800 + i * 18), [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <g key={y} opacity={ron}>
              <rect x={64} y={ry - 52} width={1372} height={76} rx={14} fill={i % 2 === 0 ? '#EAF5EE' : '#F4FAF6'} />
              <text x={110} y={ry} fill="#2E3B33" fontSize={34} fontFamily={MONO}>YEAR {y}</text>
              <text x={1390} y={ry} fill="#14532D" fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="end">
                ${q.prem.toFixed(0)}/mo — level
              </text>
            </g>
          );
        })}
        <text x={64} y={900} fill="#5B6B60" fontSize={28} fontFamily={FONT}>
          premium stays level for the full term
        </text>
      </g>
      {(() => {
        const b = spring({frame: frame - 850, fps, config: {damping: 200, stiffness: 120}});
        if (b <= 0.01) return null;
        return (
          <g opacity={Math.min(1, b)} transform={`translate(2500, 1250) scale(${Math.min(1, b)})`}>
            <rect x={-420} y={-100} width={840} height={200} rx={100} fill="rgba(74,222,128,0.14)" stroke={GREEN} strokeWidth={5} filter="url(#liglow)" />
            <text y={14} fill={GREEN} fontSize={58} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              COVERAGE ACTIVE
            </text>
            <text y={70} fill={INK} fontSize={34} fontFamily={FONT} textAnchor="middle">first premium due</text>
          </g>
        );
      })()}
    </svg>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(205,228,215,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Educational illustration of the application process — quotes and outcomes vary. Not insurance advice.
    </div>
  );
};

export const LifeInsuranceApplicationFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <PremiumHud frame={frame} />
      <Profile frame={frame} fps={fps} />
      <Quote frame={frame} fps={fps} />
      <Submit frame={frame} fps={fps} />
      <Exam frame={frame} fps={fps} />
      <Underwrite frame={frame} fps={fps} />
      <Approved frame={frame} fps={fps} />
      <Policy frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
