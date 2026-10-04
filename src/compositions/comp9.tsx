/**
 * RestaurantReservationFlow.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * The diner-side reservation journey: search the perfect table, pick a date
 * and time, get the confirmation card, receive the reminder ping, arrive at
 * the host stand — and get seated with the menu in hand.
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
// Palette
// ---------------------------------------------------------------------------
const BG = '#120E0A';
const GRID = 'rgba(210,180,150,0.10)';
const INK = '#F7F1E8';
const MUTED = 'rgba(220,202,180,0.62)';
const AMBER = '#F5A83D';
const TERRA = '#E2725B';
const CREAM = '#F4E8D0';
const GREEN = '#7BC96F';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const STEPS = [
  {t: 'SEARCH', s: 'cuisine · neighborhood · rating'},
  {t: 'PICK A TIME', s: 'Fri 7:30 PM · party of 2'},
  {t: 'CONFIRM', s: 'booking locked in'},
  {t: 'REMINDER', s: 'ping 2 hours before'},
  {t: 'ARRIVE', s: 'host stand greets you'},
  {t: 'SEATED', s: 'menu in hand'},
];
const S_START = [80, 200, 330, 450, 580, 700];

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(18,14,10,0)" />
      <stop offset="100%" stopColor="rgba(6,4,3,0.78)" />
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
            'radial-gradient(circle at 50% 30%, rgba(245,168,61,0.10), rgba(245,168,61,0.03) 45%, rgba(18,14,10,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="rsv" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#rsvvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(245,168,61,0.028)" />
      </svg>
    </>
  );
};

// Floating candle-glow embers
const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`rsv-p-x-${i}`) * 3840;
    const by = random(`rsv-p-y-${i}`) * 2160;
    const spd = 0.25 + random(`rsv-p-s-${i}`) * 0.9;
    const ang = random(`rsv-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.9));
    const sz = 2.5 + random(`rsv-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? AMBER : 'rgba(247,241,232,0.85)'} opacity={tw} />);
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
    const bx = random(`rsv-d-x-${i}`) * 3840;
    const by = random(`rsv-d-y-${i}`) * 2160;
    const jx = (random(`rsv-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`rsv-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`rsv-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`rsv-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#EAD3A8" opacity={o} />);
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
    const x = random(`rsv-g-x-${frame}-${i}`) * 3840;
    const y = random(`rsv-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`rsv-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`rsv-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'BOOK THE TABLE', 'NO WAITING IN LINE', 'FRI 7:30 PM · PARTY OF 2', 'WINDOW SEAT REQUESTED',
  'REMINDER 2H BEFORE', 'HOST STAND CHECK-IN', 'SEATED IN MINUTES',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 1000;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 640} y={46} fill="rgba(245,168,61,0.7)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(245,168,61,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(245,168,61,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3320, y: 2090, t: 'DINING · RESERVATIONS'},
    {x: 60, y: 130, t: 'FRIDAY NIGHT · PARTY OF 2'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={AMBER} opacity={0.35 + blink * 0.55} />
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
        BOOKING THE <span style={{color: AMBER}}>PERFECT TABLE</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        From craving to candlelight — <span style={{color: AMBER, fontWeight: 700}}>six taps</span> to Friday night dinner
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Progress rail
// ---------------------------------------------------------------------------
const Rail: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [40, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const prog = interpolate(frame, [S_START[0], S_START[5] + 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const active = STEPS.findIndex((_, i) => frame >= S_START[i] && (i === 5 || frame < S_START[i + 1]));
  return (
    <svg width={3840} height={220} style={{position: 'absolute', top: 400, left: 0, opacity: fade}}>
      <line x1={420} y1={50} x2={3420} y2={50} stroke="rgba(245,168,61,0.25)" strokeWidth={6} />
      <line x1={420} y1={50} x2={420 + 3000 * prog} y2={50} stroke={AMBER} strokeWidth={6} />
      {STEPS.map((s, i) => {
        const x = 420 + i * 600;
        const done = frame >= S_START[i] + 70;
        const isActive = i === active;
        const col = done ? GREEN : isActive ? AMBER : 'rgba(220,202,180,0.45)';
        return (
          <g key={i}>
            <circle cx={x} cy={50} r={30} fill={done ? GREEN : isActive ? AMBER : '#120E0A'} stroke={col} strokeWidth={4} filter="url(#rsvglow)" />
            {done && <path d={`M ${x - 13} 50 l 9 10 l 18 -20`} stroke="#0E2410" strokeWidth={7} fill="none" strokeLinecap="round" />}
            {isActive && <circle cx={x} cy={50} r={44} fill="none" stroke={AMBER} strokeWidth={3} opacity={0.5 + 0.4 * Math.sin(frame * 0.15)} />}
            <text x={x} y={130} fill={col} fontSize={32} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={2}>
              {i + 1}. {s.t}
            </text>
            {isActive && (
              <text x={x} y={172} fill={MUTED} fontSize={28} fontFamily={FONT} textAnchor="middle">
                {s.s}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Stage scenes per step
// ---------------------------------------------------------------------------
const RESTAURANTS = [
  {n: 'EMBER & OAK', c: 'Italian · $$', r: 4.8},
  {n: 'THE COPPER POT', c: 'French · $$$', r: 4.9},
  {n: 'SAFFRON LANE', c: 'Indian · $$', r: 4.7},
];
const StageSearch: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - S_START[0];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 110}});
  if (s <= 0.001 || frame > S_START[1] + 30) return null;
  return (
    <g opacity={Math.min(1, s)}>
      <text x={1920} y={720} fill={MUTED} fontSize={40} fontFamily={FONT} textAnchor="middle">
        <tspan fill={AMBER}>3</tspan> great matches near you
      </text>
      {RESTAURANTS.map((r, i) => {
        const cs = spring({frame: t - (20 + i * 22), fps, config: {damping: 200, stiffness: 110}});
        if (cs <= 0.001) return null;
        const pick = i === 1;
        return (
          <g key={i} opacity={Math.min(1, cs)} transform={`translate(0, ${(1 - Math.min(1, cs)) * 60})`}>
            <rect x={990} y={800 + i * 220} width={1860} height={180} rx={26}
              fill={pick ? 'rgba(245,168,61,0.10)' : 'rgba(22,17,12,0.9)'}
              stroke={pick ? AMBER : 'rgba(220,202,180,0.3)'} strokeWidth={pick ? 4 : 2}
              filter={pick ? 'url(#rsvglow)' : undefined} />
            <circle cx={1120} cy={890 + i * 220} r={56} fill={TERRA} opacity={0.85} />
            <text x={1120} y={910 + i * 220} fill="#2B0F08" fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {r.n[0]}
            </text>
            <text x={1230} y={890 + i * 220} fill={INK} fontSize={48} fontFamily={FONT} fontWeight={800}>
              {r.n}
            </text>
            <text x={1230} y={944 + i * 220} fill={MUTED} fontSize={34} fontFamily={FONT}>
              {r.c} · ★ {r.r}
            </text>
            {pick && (
              <text x={2700} y={905 + i * 220} fill={AMBER} fontSize={38} fontFamily={FONT} fontWeight={800} textAnchor="end">
                ✓ PICKED
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

const StageTime: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - S_START[1];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 110}});
  if (s <= 0.001 || frame > S_START[2] + 30) return null;
  const slots = ['5:30', '6:00', '6:30', '7:00', '7:30', '8:00', '8:30', '9:00'];
  return (
    <g opacity={Math.min(1, s)}>
      <text x={1920} y={720} fill={MUTED} fontSize={40} fontFamily={FONT} textAnchor="middle">
        Friday · party of 2 — <tspan fill={AMBER}>pick your slot</tspan>
      </text>
      {slots.map((sl, i) => {
        const cs = spring({frame: t - (15 + i * 12), fps, config: {damping: 200, stiffness: 120}});
        if (cs <= 0.001) return null;
        const pick = sl === '7:30';
        const x = 640 + (i % 4) * 700;
        const y = 840 + Math.floor(i / 4) * 260;
        return (
          <g key={i} opacity={Math.min(1, cs)}>
            <rect x={x} y={y} width={600} height={180} rx={28}
              fill={pick ? AMBER : 'rgba(22,17,12,0.9)'}
              stroke={pick ? AMBER : 'rgba(220,202,180,0.3)'} strokeWidth={3}
              filter={pick ? 'url(#rsvglow)' : undefined} />
            <text x={x + 300} y={y + 112} fill={pick ? '#2B1A04' : INK} fontSize={64} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              {sl} PM
            </text>
          </g>
        );
      })}
    </g>
  );
};

const StageConfirm: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - S_START[2];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 110}});
  if (s <= 0.001 || frame > S_START[3] + 30) return null;
  const stamp = spring({frame: t - 60, fps, config: {damping: 14, stiffness: 260}});
  return (
    <g opacity={Math.min(1, s)}>
      <g transform={`translate(1920, 1150) scale(${0.85 + Math.min(1, s) * 0.15})`}>
        <rect x={-520} y={-330} width={1040} height={660} rx={36} fill={CREAM} filter="url(#rsvglow)" />
        <text x={0} y={-230} fill="#3A2A18" fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          THE COPPER POT
        </text>
        <line x1={-440} y1={-170} x2={440} y2={-170} stroke="rgba(58,42,24,0.3)" strokeWidth={3} />
        {['Friday, this week', '7:30 PM · Party of 2', 'Window seat requested', 'Confirmation #CP-4821'].map((row, i) => (
          <text key={i} x={0} y={-70 + i * 90} fill="#3A2A18" fontSize={44} fontFamily={FONT} textAnchor="middle">
            {row}
          </text>
        ))}
        {stamp > 0.01 && (
          <g transform={`rotate(-10) scale(${Math.min(1.2, stamp)})`} opacity={Math.min(1, stamp)}>
            <rect x={-330} y={210} width={660} height={150} rx={24} fill="none" stroke={GREEN} strokeWidth={10} />
            <text y={312} fill={GREEN} fontSize={80} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={6}>
              CONFIRMED
            </text>
          </g>
        )}
      </g>
    </g>
  );
};

const StageReminder: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - S_START[3];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 110}});
  if (s <= 0.001 || frame > S_START[4] + 30) return null;
  const ring = ((frame * 0.06) % 1);
  return (
    <g opacity={Math.min(1, s)} transform="translate(1920, 1150)">
      <circle r={200} fill="rgba(22,17,12,0.9)" stroke={AMBER} strokeWidth={5} />
      <circle r={200 + ring * 130} fill="none" stroke={AMBER} strokeWidth={5} opacity={1 - ring} />
      <rect x={-52} y={-130} width={104} height={180} rx={30} fill="#2A2118" stroke={AMBER} strokeWidth={5} />
      <rect x={-40} y={-118} width={80} height={130} rx={20} fill="#120E0A" />
      <circle cx={0} cy={80} r={14} fill={AMBER} />
      <line x1={0} y1={-90} x2={0} y2={-40} stroke={AMBER} strokeWidth={8} strokeLinecap="round" />
      <line x1={0} y1={-40} x2={34} y2={-24} stroke={AMBER} strokeWidth={8} strokeLinecap="round" />
      <text y={300} fill={INK} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">
        Tonight, 7:30 PM
      </text>
      <text y={368} fill={AMBER} fontSize={40} fontFamily={FONT} textAnchor="middle">
        "Your table is ready to be yours" 🔔
      </text>
    </g>
  );
};

const StageArrive: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - S_START[4];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 110}});
  if (s <= 0.001 || frame > S_START[5] + 30) return null;
  const walk = interpolate(t, [20, 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const greet = spring({frame: t - 110, fps, config: {damping: 200, stiffness: 110}});
  return (
    <g opacity={Math.min(1, s)}>
      {/* host stand */}
      <g transform="translate(2500, 1150)">
        <rect x={-220} y={-160} width={440} height={560} rx={30} fill="#1E160F" stroke={AMBER} strokeWidth={4} />
        <text y={-80} fill={AMBER} fontSize={48} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          HOST STAND
        </text>
        <rect x={-160} y={-10} width={320} height={220} rx={18} fill="rgba(245,168,61,0.08)" stroke="rgba(245,168,61,0.5)" strokeWidth={3} />
        <text y={80} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="middle">
          "Name for the
        </text>
        <text y={126} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="middle">
          reservation?"
        </text>
        {greet > 0.01 && (
          <g opacity={Math.min(1, greet)}>
            <rect x={-260} y={260} width={520} height={110} rx={55} fill={GREEN} />
            <text y={332} fill="#0E2410" fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              "Right this way ✓"
            </text>
          </g>
        )}
      </g>
      {/* diners walking in */}
      <g transform={`translate(${interpolate(walk, [0, 1], [700, 1900], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}, 1300)`}>
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(${i * 130}, 0)`}>
            <circle cy={-180} r={52} fill="none" stroke={AMBER} strokeWidth={7} />
            <circle cy={-196} r={22} fill={AMBER} />
            <path d="M -36 -110 a 36 30 0 0 1 72 0" fill={AMBER} />
            <line x1={-30} y1={-60} x2={-30 + Math.sin(frame * 0.2 + i * 2) * 18} y2={60} stroke={AMBER} strokeWidth={16} strokeLinecap="round" />
            <line x1={30} y1={-60} x2={30 - Math.sin(frame * 0.2 + i * 2) * 18} y2={60} stroke={AMBER} strokeWidth={16} strokeLinecap="round" />
          </g>
        ))}
        <text y={180} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
          Maya + guest
        </text>
      </g>
      <path d={`M 830 1300 Q 1400 1100 2050 1220`} fill="none" stroke={AMBER} strokeWidth={5} strokeDasharray="20 16" opacity={0.6}
        pathLength={1} strokeDashoffset={1 - walk} />
    </g>
  );
};

const StageSeated: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - S_START[5];
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001) return null;
  const flick = 0.75 + 0.25 * Math.sin(frame * 0.4) * Math.sin(frame * 0.13);
  return (
    <g opacity={Math.min(1, s)} transform={`translate(1920, 1150) scale(${0.85 + Math.min(1, s) * 0.15})`}>
      {/* table */}
      <ellipse cx={0} cy={180} rx={520} ry={130} fill="#2A1F14" stroke={AMBER} strokeWidth={5} />
      <ellipse cx={0} cy={150} rx={520} ry={130} fill="#3A2A1A" stroke={AMBER} strokeWidth={3} />
      {/* candle */}
      <rect x={-24} y={-80} width={48} height={160} rx={14} fill={CREAM} />
      <ellipse cx={0} cy={-120} rx={30} ry={52} fill={AMBER} opacity={flick} filter="url(#rsvglow)" />
      <ellipse cx={0} cy={-112} rx={14} ry={26} fill="#FFF3D6" opacity={flick} />
      {/* plates + menu */}
      <ellipse cx={-280} cy={130} rx={90} ry={40} fill={CREAM} opacity={0.9} />
      <ellipse cx={280} cy={130} rx={90} ry={40} fill={CREAM} opacity={0.9} />
      <g transform="translate(0, -260) rotate(8)">
        <rect x={-150} y={-190} width={300} height={380} rx={18} fill={CREAM} stroke="#3A2A18" strokeWidth={4} />
        <text y={-110} fill="#3A2A18" fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          MENU
        </text>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={-110} y={-50 + i * 62} width={220 - (i % 2) * 50} height={18} rx={9} fill="rgba(58,42,24,0.4)" />
        ))}
      </g>
      <text y={440} fill={GREEN} fontSize={64} fontFamily={FONT} fontWeight={800} textAnchor="middle">
        SEATED — ENJOY YOUR EVENING
      </text>
    </g>
  );
};

const Stage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const cur = STEPS.findIndex((_, i) => frame >= S_START[i] && (i === 5 || frame < S_START[i + 1]));
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs p="rsvs" />
      {cur === 0 && <StageSearch frame={frame} fps={fps} />}
      {cur === 1 && <StageTime frame={frame} fps={fps} />}
      {cur === 2 && <StageConfirm frame={frame} fps={fps} />}
      {cur === 3 && <StageReminder frame={frame} fps={fps} />}
      {cur === 4 && <StageArrive frame={frame} fps={fps} />}
      {cur === 5 && <StageSeated frame={frame} fps={fps} />}
    </svg>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(210,180,150,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Illustrative concept. Running late? Update or cancel your reservation so the table can be rebooked.
    </div>
  );
};

export const RestaurantReservationFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <Rail frame={frame} />
      <Stage frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
