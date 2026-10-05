/**
 * VetCheckupVisit.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * A puppy's first wellness exam: pup and owner arrive at the clinic door,
 * check in at the counter, then the nose-to-tail exam lights up checkpoint
 * by checkpoint — eyes, ears, teeth, heart, coat — followed by vaccinations
 * and a microchip, a well-earned treat, and the HEALTHY PUP report card.
 * (Routine wellness-exam process ONLY — never adoption paperwork,
 * never insurance or reimbursement math.)
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
// Palette — warm clinic cream + coral
// ---------------------------------------------------------------------------
const BG = '#141009';
const GRID = 'rgba(235,215,190,0.10)';
const AXIS = 'rgba(235,215,190,0.55)';
const INK = '#F6EBDA';
const MUTED = 'rgba(235,215,190,0.62)';
const CORAL = '#FF7E6B';
const TEAL = '#4FD1C5';
const GOLD = '#FBBF24';
const BROWN = '#8A6A45';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}card`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#221A10" />
      <stop offset="100%" stopColor="#181209" />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(20,16,9,0)" />
      <stop offset="100%" stopColor="rgba(8,6,3,0.82)" />
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
            'radial-gradient(circle at 50% 28%, rgba(255,126,107,0.11), rgba(255,126,107,0.03) 45%, rgba(20,16,9,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="vcv" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#vcvvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(255,126,107,0.028)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`vcv-p-x-${i}`) * 3840;
    const by = random(`vcv-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`vcv-p-s-${i}`) * 1.0;
    const ang = random(`vcv-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.5));
    const sz = 2.5 + random(`vcv-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? CORAL : 'rgba(246,235,218,0.85)'} opacity={tw} />);
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
    const bx = random(`vcv-d-x-${i}`) * 3840;
    const by = random(`vcv-d-y-${i}`) * 2160;
    const jx = (random(`vcv-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`vcv-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`vcv-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`vcv-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#F0CFA8" opacity={o} />);
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
    const x = random(`vcv-g-x-${frame}-${i}`) * 3840;
    const y = random(`vcv-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`vcv-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`vcv-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'WELCOME TO THE CLINIC', 'NOSE-TO-TAIL EXAM', 'VACCINES UP TO DATE',
  'MICROCHIPPED', 'TREAT TIME', 'HEALTHY PUP',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 3840;
  const off = -((frame * 4.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 640} y={46} fill="rgba(255,126,107,0.7)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(255,126,107,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(255,126,107,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 2990, y: 2090, t: 'VET CHECKUP · WELLNESS EXAM'},
    {x: 3260, y: 130, t: 'CLINIC SIM'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={CORAL} opacity={0.35 + blink * 0.55} />
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
        VET <span style={{color: CORAL}}>CHECKUP</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        A puppy&apos;s first wellness exam, nose to tail
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stylized puppy + owner figures
// ---------------------------------------------------------------------------
const Puppy: React.FC<{x: number; y: number; s: number; wag: number; flip?: boolean}> = ({x, y, s, wag, flip}) => (
  <g transform={`translate(${x}, ${y}) scale(${flip ? -s : s}, ${s})`}>
    {/* tail */}
    <rect x={-430} y={-190} width={150} height={52} rx={26} fill={BROWN}
      transform={`rotate(${wag * 18} -355 -164)`} />
    {/* legs */}
    {[-260, -120, 120, 260].map((lx) => (
      <rect key={lx} x={lx - 34} y={60} width={68} height={190} rx={30} fill={BROWN} />
    ))}
    {/* body */}
    <ellipse cx={0} cy={0} rx={360} ry={170} fill={BROWN} />
    <ellipse cx={-120} cy={-60} rx={180} ry={90} fill="#9C7A50" opacity={0.6} />
    {/* head */}
    <circle cx={330} cy={-140} r={150} fill={BROWN} />
    <ellipse cx={240} cy={-230} rx={52} ry={80} fill="#9C7A50" transform="rotate(-24 240 -230)" />
    <ellipse cx={420} cy={-230} rx={52} ry={80} fill="#9C7A50" transform="rotate(24 420 -230)" />
    <ellipse cx={440} cy={-100} rx={80} ry={60} fill="#9C7A50" />
    <circle cx={470} cy={-115} r={26} fill="#141009" />
    <circle cx={350} cy={-160} r={20} fill="#141009" />
    <circle cx={356} cy={-166} r={7} fill="#F6EBDA" />
  </g>
);

const Owner: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <circle cx={0} cy={-330} r={78} fill={INK} />
    <rect x={-90} y={-240} width={180} height={330} rx={80} fill={CORAL} />
    <rect x={-70} y={80} width={56} height={190} rx={26} fill="#3A2E1E" />
    <rect x={14} y={80} width={56} height={190} rx={26} fill="#3A2E1E" />
  </g>
);

// ---------------------------------------------------------------------------
// Beat 1 — Puppy + owner arrive at the clinic door (frames 0–140)
// ---------------------------------------------------------------------------
const Arrival: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 0 || frame > 140) return null;
  const fade = interpolate(frame, [120, 140], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const walk = interpolate(frame, [10, 115], [-500, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bounce = Math.abs(Math.sin(frame * 0.35)) * 14;
  const wag = Math.sin(frame * 0.4);
  return (
    <g opacity={fade}>
      {/* clinic facade */}
      <rect x={1560} y={520} width={1500} height={1180} rx={24} fill="url(#vcvcard)" stroke={AXIS} strokeWidth={3} />
      {/* awning */}
      {Array.from({length: 10}).map((_, i) => (
        <rect key={i} x={1560 + i * 150} y={520} width={150} height={120} fill={i % 2 === 0 ? CORAL : INK} opacity={0.92} />
      ))}
      <rect x={1560} y={640} width={1500} height={26} fill="#141009" opacity={0.35} />
      {/* sign */}
      <circle cx={2310} cy={880} r={110} fill="#141009" stroke={CORAL} strokeWidth={6} filter="url(#vcvglow)" />
      <rect x={2260} y={830} width={100} height={100} rx={14} fill={CORAL} />
      <rect x={2292} y={846} width={36} height={68} fill="#141009" />
      <rect x={2276} y={862} width={68} height={36} fill="#141009" />
      <text x={2310} y={1080} fill={INK} fontSize={52} fontFamily={FONT} fontWeight={800} letterSpacing={8} textAnchor="middle">
        VET CLINIC
      </text>
      {/* double door */}
      <rect x={1910} y={1160} width={800} height={540} rx={12} fill="#241B0E" stroke={AXIS} strokeWidth={3} />
      <line x1={2310} y1={1160} x2={2310} y2={1700} stroke={AXIS} strokeWidth={3} />
      <rect x={1960} y={1220} width={300} height={220} rx={8} fill="rgba(235,215,190,0.12)" stroke={AXIS} strokeWidth={2} />
      <rect x={2360} y={1220} width={300} height={220} rx={8} fill="rgba(235,215,190,0.12)" stroke={AXIS} strokeWidth={2} />
      {/* walkers */}
      <g transform={`translate(${walk}, 0)`}>
        <Owner x={900} y={1560} s={1.6} />
        <g transform={`translate(0, ${-bounce * 0.4})`}>
          <Puppy x={1250} y={1700} s={0.55} wag={wag} />
        </g>
        {/* leash */}
        <line x1={940} y1={1450} x2={1210} y2={1620} stroke={CORAL} strokeWidth={8} />
      </g>
      <text x={1920} y={1900} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
        Max the puppy arrives for his first checkup.
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 2 — Check-in counter (frames 140–240)
// ---------------------------------------------------------------------------
const Checkin: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 140 || frame > 240) return null;
  const t = frame - 140;
  const fade = interpolate(frame, [220, 240], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const stamp = spring({frame: t - 55, fps, config: {damping: 200, stiffness: 160}});
  return (
    <g opacity={fade}>
      <text x={1920} y={560} fill={CORAL} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4} textAnchor="middle">
        CHECK-IN
      </text>
      {/* counter */}
      <rect x={820} y={1150} width={2200} height={560} rx={20} fill="url(#vcvcard)" stroke={AXIS} strokeWidth={3} />
      <rect x={820} y={1150} width={2200} height={44} fill="rgba(235,215,190,0.14)" />
      {/* clipboard */}
      <g transform={`translate(1230, 800) rotate(-6)`}>
        <rect x={-190} y={-220} width={380} height={480} rx={18} fill={INK} />
        <rect x={-70} y={-260} width={140} height={70} rx={16} fill={CORAL} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={-150} y={-130 + i * 90} width={300 - i * 40} height={30} rx={15} fill="rgba(20,16,9,0.5)" />
        ))}
      </g>
      {/* patient card */}
      <rect x={1750} y={700} width={1050} height={360} rx={24} fill="#141009" stroke={CORAL} strokeWidth={3} />
      <text x={1830} y={790} fill={CORAL} fontSize={32} fontFamily={MONO} fontWeight={700} letterSpacing={3}>
        PATIENT
      </text>
      <text x={1830} y={890} fill={INK} fontSize={64} fontFamily={FONT} fontWeight={800}>
        MAX
      </text>
      <text x={1830} y={970} fill={MUTED} fontSize={36} fontFamily={FONT}>
        Golden retriever · 4 months · first visit
      </text>
      {/* bell */}
      <g>
        <ellipse cx={2590} cy={1100} rx={90} ry={60} fill={GOLD} filter="url(#vcvglow)" />
        <rect x={2580} y={1020} width={20} height={40} fill={GOLD} />
      </g>
      {stamp > 0.01 && (
        <g opacity={Math.min(1, stamp)} transform={`translate(2270, 1290) rotate(-10) scale(${Math.min(1, stamp)})`}>
          <rect x={-230} y={-70} width={460} height={140} rx={14} fill="none" stroke={TEAL} strokeWidth={8} />
          <text y={28} fill={TEAL} fontSize={64} fontFamily={FONT} fontWeight={800} letterSpacing={4} textAnchor="middle">
            CHECKED IN
          </text>
        </g>
      )}
      <Puppy x={760} y={1620} s={0.5} wag={Math.sin(frame * 0.4)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 3 — Nose-to-tail exam checkpoints (frames 240–460)
// ---------------------------------------------------------------------------
const CHECKS = [
  {label: 'EYES', note: 'clear + bright', x: 2260, y: 760, at: 0},
  {label: 'EARS', note: 'clean, no redness', x: 2210, y: 640, at: 45},
  {label: 'TEETH', note: 'puppy teeth all in', x: 2400, y: 900, at: 90},
  {label: 'HEART', note: 'steady rhythm', x: 1830, y: 1050, at: 135},
  {label: 'COAT', note: 'soft, no flakes', x: 1560, y: 880, at: 180},
];
const Exam: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 240 || frame > 460) return null;
  const t = frame - 240;
  const fade = interpolate(frame, [440, 460], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wag = Math.sin(frame * 0.35);
  return (
    <g opacity={fade}>
      <text x={1920} y={560} fill={CORAL} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4} textAnchor="middle">
        NOSE-TO-TAIL EXAM
      </text>
      {/* exam table */}
      <rect x={1150} y={1420} width={1540} height={120} rx={24} fill="url(#vcvcard)" stroke={AXIS} strokeWidth={3} />
      <g transform="translate(1920, 1150)">
        <Puppy x={0} y={0} s={1.15} wag={wag} />
        {/* checkpoint nodes */}
        {CHECKS.map((c) => {
          const on = interpolate(t, [c.at, c.at + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <g key={c.label} transform={`translate(${c.x - 1920}, ${c.y - 1150})`}>
              <circle cx={0} cy={0} r={52} fill="none" stroke={CORAL} strokeWidth={5} opacity={0.25 + on * 0.75} />
              {on > 0 && (
                <circle cx={0} cy={0} r={52 * on} fill="none" stroke={CORAL} strokeWidth={5} opacity={on} filter="url(#vcvglow)" />
              )}
              <circle cx={0} cy={0} r={14} fill={on > 0.5 ? CORAL : MUTED} />
            </g>
          );
        })}
      </g>
      {/* checklist */}
      {CHECKS.map((c, i) => {
        const on = interpolate(t, [c.at + 20, c.at + 45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const chk = spring({frame: t - c.at - 40, fps, config: {damping: 200, stiffness: 180}});
        const y = 780 + i * 150;
        return (
          <g key={c.label} opacity={0.25 + on * 0.75}>
            <text x={2880} y={y} fill={on > 0.5 ? INK : MUTED} fontSize={44} fontFamily={FONT} fontWeight={800}>
              {c.label}
            </text>
            <text x={2880} y={y + 52} fill={MUTED} fontSize={30} fontFamily={FONT}>
              {c.note}
            </text>
            {chk > 0.01 && (
              <g transform={`translate(2800, ${y - 18}) scale(${Math.min(1, chk)})`}>
                <circle cx={0} cy={0} r={30} fill={TEAL} />
                <text y={14} fill="#141009" fontSize={36} fontFamily={FONT} fontWeight={800} textAnchor="middle">
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
// Beat 4 — Vaccinations + microchip (frames 460–620)
// ---------------------------------------------------------------------------
const Shots: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 460 || frame > 620) return null;
  const t = frame - 460;
  const fade = interpolate(frame, [600, 620], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dose = interpolate(t, [30, 100], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const chipOn = interpolate(t, [95, 130], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <g opacity={fade}>
      <text x={1920} y={560} fill={CORAL} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4} textAnchor="middle">
        VACCINES + MICROCHIP
      </text>
      {/* syringe card */}
      <rect x={700} y={660} width={1150} height={860} rx={28} fill="url(#vcvcard)" stroke={AXIS} strokeWidth={2.5} />
      <text x={1275} y={760} fill={INK} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">
        PUPPY VACCINES
      </text>
      {/* syringe */}
      <g transform="translate(1275, 1080)">
        <rect x={-260} y={-70} width={420} height={140} rx={20} fill="rgba(235,215,190,0.10)" stroke={INK} strokeWidth={5} />
        <rect x={-260} y={-70} width={420 * dose} height={140} rx={20} fill={CORAL} opacity={0.85} filter="url(#vcvglow)" />
        <rect x={-330} y={-40} width={70} height={80} fill={INK} opacity={0.85} />
        <rect x={160} y={-52} width={120} height={104} rx={10} fill={INK} opacity={0.85} />
        <line x1={280} y1={0} x2={380} y2={0} stroke={INK} strokeWidth={8} />
        <text x={0} y={180} fill={MUTED} fontSize={32} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
          DOSE {Math.round(dose * 100)}%
        </text>
      </g>
      <text x={1275} y={1400} fill={TEAL} fontSize={36} fontFamily={FONT} fontWeight={700} textAnchor="middle">
        DHPP + rabies — quick and gentle
      </text>
      {/* microchip card */}
      <rect x={1990} y={660} width={1150} height={860} rx={28} fill="url(#vcvcard)" stroke={AXIS} strokeWidth={2.5} />
      <text x={2565} y={760} fill={INK} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">
        MICROCHIP
      </text>
      <g opacity={chipOn}>
        <rect x={2285} y={860} width={560} height={360} rx={24} fill="#141009" stroke={TEAL} strokeWidth={4} filter="url(#vcvglow)" />
        <rect x={2345} y={920} width={180} height={180} fill="none" stroke={TEAL} strokeWidth={5} />
        {[0, 1, 2].map((i) => (
          <line key={i} x1={2435} y1={950 + i * 50} x2={2800} y2={950 + i * 50} stroke={TEAL} strokeWidth={4} opacity={0.7} />
        ))}
        <text x={2565} y={1300} fill={TEAL} fontSize={36} fontFamily={FONT} fontWeight={700} textAnchor="middle">
          chip implanted — ID registered
        </text>
      </g>
      <Puppy x={1920} y={1720} s={0.5} wag={Math.sin(frame * 0.4)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 5 — Treat reward (frames 620–720)
// ---------------------------------------------------------------------------
const Heart: React.FC<{x: number; y: number; s: number; o: number}> = ({x, y, s, o}) => (
  <path
    d="M0,18 C-26,-6 -52,6 0,34 C52,6 26,-6 0,18 Z"
    fill={CORAL}
    opacity={o}
    transform={`translate(${x}, ${y}) scale(${s})`}
  />
);

const Treat: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 620 || frame > 720) return null;
  const t = frame - 620;
  const fade = interpolate(frame, [700, 720], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const drop = interpolate(t, [10, 45], [620, 1180], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wag = Math.sin(frame * 0.6) * 1.4;
  const hearts: React.ReactElement[] = [];
  for (let i = 0; i < 10; i++) {
    const hx = 1560 + random(`vcv-h-x-${i}`) * 720;
    const rise = ((t - 40) * (3 + random(`vcv-h-s-${i}`) * 4) + random(`vcv-h-o-${i}`) * 400) % 700;
    const hy = 1300 - rise;
    const ho = interpolate(t, [40 + i * 3, 55 + i * 3], [0, 0.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    if (ho > 0) hearts.push(<Heart key={i} x={hx} y={hy} s={1.6 + random(`vcv-h-z-${i}`) * 1.4} o={ho} />);
  }
  return (
    <g opacity={fade}>
      <text x={1920} y={560} fill={CORAL} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4} textAnchor="middle">
        WELL EARNED
      </text>
      {/* treat bag */}
      <g transform="translate(1920, 780)">
        <polygon points="-190,180 190,180 130,-180 -130,-180" fill={CORAL} opacity={0.92} />
        <rect x={-150} y={-230} width={300} height={70} rx={20} fill={INK} />
        <text y={60} fill="#141009" fontSize={56} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          TREATS
        </text>
      </g>
      {/* falling bone treat */}
      {t < 60 && (
        <g transform={`translate(1920, ${drop})`}>
          <rect x={-90} y={-26} width={180} height={52} rx={26} fill={GOLD} />
          <circle cx={-90} cy={-26} r={34} fill={GOLD} />
          <circle cx={-90} cy={26} r={34} fill={GOLD} />
          <circle cx={90} cy={-26} r={34} fill={GOLD} />
          <circle cx={90} cy={26} r={34} fill={GOLD} />
        </g>
      )}
      <Puppy x={1920} y={1560} s={0.9} wag={wag} />
      {hearts}
      <text x={1920} y={1900} fill={INK} fontSize={44} fontFamily={FONT} fontWeight={700} textAnchor="middle">
        Brave pups get treats.
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 6 — HEALTHY PUP report card payoff (frames 720–900)
// ---------------------------------------------------------------------------
const REPORT = [
  'EYES — CLEAR',
  'EARS — CLEAN',
  'TEETH — HEALTHY',
  'HEART — STRONG',
  'COAT — SHINY',
  'VACCINES — UP TO DATE',
];
const ReportCard: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 720) return null;
  const t = frame - 720;
  const cardIn = interpolate(t, [0, 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const stamp = spring({frame: t - 120, fps, config: {damping: 200, stiffness: 140}});
  const sparks: React.ReactElement[] = [];
  for (let i = 0; i < 60; i++) {
    const sx = 1100 + random(`vcv-sp-x-${i}`) * 1640;
    const sy = 620 + random(`vcv-sp-y-${i}`) * 1000;
    const tw = 0.2 + 0.7 * Math.abs(Math.sin(frame * 0.08 + i * 1.3));
    const sz = 3 + random(`vcv-sp-z-${i}`) * 7;
    sparks.push(<circle key={i} cx={sx} cy={sy} r={sz} fill={GOLD} opacity={tw} />);
  }
  return (
    <g opacity={cardIn}>
      {sparks}
      <rect x={1020} y={540} width={1800} height={1130} rx={32} fill={INK} />
      <rect x={1020} y={540} width={1800} height={190} rx={32} fill={CORAL} />
      <rect x={1020} y={700} width={1800} height={30} fill={CORAL} />
      <text x={1920} y={672} fill="#141009" fontSize={84} fontFamily={FONT} fontWeight={800} letterSpacing={6} textAnchor="middle">
        HEALTHY PUP
      </text>
      <text x={1920} y={800} fill="rgba(20,16,9,0.6)" fontSize={34} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
        WELLNESS REPORT · MAX · FIRST VISIT
      </text>
      {REPORT.map((r, i) => {
        const on = interpolate(t, [30 + i * 14, 50 + i * 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const y = 920 + i * 105;
        return (
          <g key={r} opacity={on}>
            <circle cx={1200} cy={y - 14} r={28} fill={TEAL} />
            <text x={1200} y={y} fill="#141009" fontSize={34} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              ✓
            </text>
            <text x={1270} y={y + 2} fill="#141009" fontSize={42} fontFamily={FONT} fontWeight={700}>
              {r}
            </text>
          </g>
        );
      })}
      {stamp > 0.01 && (
        <g opacity={Math.min(1, stamp)} transform={`translate(2450, 1420) rotate(-12) scale(${Math.min(1, stamp)})`}>
          <rect x={-280} y={-80} width={560} height={160} rx={16} fill="none" stroke={CORAL} strokeWidth={10} />
          <text y={34} fill={CORAL} fontSize={84} fontFamily={FONT} fontWeight={800} letterSpacing={6} textAnchor="middle">
            HEALTHY
          </text>
        </g>
      )}
      <Puppy x={2450} y={1760} s={0.42} wag={Math.sin(frame * 0.5)} />
      <text x={1500} y={1760} fill="rgba(20,16,9,0.75)" fontSize={40} fontFamily={FONT} fontWeight={700}>
        See you in 3 weeks, Max.
      </text>
    </g>
  );
};

const Stage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => (
  <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
    <Arrival frame={frame} />
    <Checkin frame={frame} fps={fps} />
    <Exam frame={frame} fps={fps} />
    <Shots frame={frame} />
    <Treat frame={frame} />
    <ReportCard frame={frame} fps={fps} />
  </svg>
);

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(235,215,190,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      A routine wellness visit, shown for illustration. Always follow your own vet&apos;s guidance.
    </div>
  );
};

export const VetCheckupVisit: React.FC = () => {
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
