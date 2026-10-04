/**
 * ESIMSetupJourney.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * A traveler lands abroad and connects in minutes: destination map, plan cards
 * fan out, a QR code scans into the phone, the eSIM installs with a progress
 * ring, activation flips on arrival, data streams, and a top-up refills the
 * plan when it runs low.
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
const BG = '#071019';
const GRID = 'rgba(140,190,225,0.10)';
const INK = '#EDF4FA';
const MUTED = 'rgba(194,210,228,0.62)';
const TEAL = '#2DD4BF';
const SKY = '#5AC8FA';
const GOLD = '#FBBF24';
const CORAL = '#FB7185';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}teal`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#7DF0DE" />
      <stop offset="50%" stopColor={TEAL} />
      <stop offset="100%" stopColor="#0E7C70" />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(7,16,25,0)" />
      <stop offset="100%" stopColor="rgba(2,5,9,0.78)" />
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
            'radial-gradient(circle at 50% 30%, rgba(45,212,191,0.10), rgba(45,212,191,0.03) 45%, rgba(7,16,25,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="esim" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#esimvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(45,212,191,0.028)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`esim-p-x-${i}`) * 3840;
    const by = random(`esim-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`esim-p-s-${i}`) * 1.0;
    const ang = random(`esim-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.9));
    const sz = 2.5 + random(`esim-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? TEAL : 'rgba(237,244,250,0.85)'} opacity={tw} />);
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
    const bx = random(`esim-d-x-${i}`) * 3840;
    const by = random(`esim-d-y-${i}`) * 2160;
    const jx = (random(`esim-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`esim-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`esim-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`esim-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#BDEFE6" opacity={o} />);
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
    const x = random(`esim-g-x-${frame}-${i}`) * 3840;
    const y = random(`esim-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`esim-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`esim-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'NO ROAMING FEES', 'CONNECT IN MINUTES', '200+ COUNTRIES', 'LOCAL · REGIONAL · GLOBAL PLANS',
  'TOP UP ANYTIME', 'KEEP YOUR NUMBER', 'NO PHYSICAL SIM', 'LAND CONNECTED',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 1000;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 620} y={46} fill="rgba(45,212,191,0.7)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(45,212,191,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(45,212,191,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3300, y: 2090, t: 'TRAVEL · CONNECTIVITY'},
    {x: 60, y: 130, t: 'LIVE ROAMING-FREE ZONE'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={TEAL} opacity={0.35 + blink * 0.55} />
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
        TRAVEL eSIM <span style={{color: TEAL}}>SETUP</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        Land connected — <span style={{color: TEAL, fontWeight: 700}}>no roaming fees</span>, no SIM store, minutes not days
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Phone component (drawn once, reused by stages)
// ---------------------------------------------------------------------------
const Phone: React.FC<{x: number; y: number; children?: React.ReactNode}> = ({x, y, children}) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x={-190} y={-400} width={380} height={800} rx={64} fill="#0D1622" stroke="rgba(194,210,228,0.5)" strokeWidth={5} />
    <rect x={-166} y={-376} width={332} height={752} rx={48} fill="#081019" />
    <rect x={-60} y={-400} width={120} height={34} rx={17} fill="#0D1622" />
    {children}
  </g>
);

// ---------------------------------------------------------------------------
// Stage 1: destination map, plane lands, plan cards fan out (frames 60–300)
// ---------------------------------------------------------------------------
const MAP_CITIES = [
  {x: 900, y: 1050, n: 'PARIS'}, {x: 1750, y: 900, n: 'DUBAI'}, {x: 2500, y: 1150, n: 'BANGKOK'},
  {x: 3150, y: 950, n: 'TOKYO'},
];
const StageMap: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const t = frame - 60;
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 100}});
  if (s <= 0.001 || frame > 330) return null;
  const fade = interpolate(frame, [300, 330], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const planeT = interpolate(t, [10, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const px = interpolate(planeT, [0, 1], [700, 2500], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const py = 1050 - Math.sin(planeT * Math.PI) * 420;
  const land = spring({frame: t - 130, fps, config: {damping: 200, stiffness: 120}});
  const cards: React.ReactElement[] = [];
  const plans = [
    {n: 'LOCAL', d: '1 COUNTRY · 5 GB', p: '$4.50'},
    {n: 'REGIONAL', d: '39 COUNTRIES · 10 GB', p: '$13.00'},
    {n: 'GLOBAL', d: '136 COUNTRIES · 20 GB', p: '$29.00'},
  ];
  plans.forEach((pl, i) => {
    const cs = spring({frame: t - (150 + i * 22), fps, config: {damping: 200, stiffness: 100}});
    if (cs <= 0.001) return;
    const pick = i === 2;
    cards.push(
      <g key={i} opacity={Math.min(1, cs)} transform={`translate(0, ${(1 - Math.min(1, cs)) * 60})`}>
        <rect x={2500 + i * 330} y={1350} width={300} height={230} rx={22}
          fill={pick ? 'rgba(45,212,191,0.14)' : 'rgba(13,22,34,0.9)'}
          stroke={pick ? TEAL : 'rgba(194,210,228,0.3)'} strokeWidth={pick ? 4 : 2}
          filter={pick ? 'url(#esimglow)' : undefined} />
        <text x={2650 + i * 330} y={1420} fill={pick ? TEAL : MUTED} fontSize={34} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          {pl.n}
        </text>
        <text x={2650 + i * 330} y={1472} fill={MUTED} fontSize={26} fontFamily={FONT} textAnchor="middle">
          {pl.d}
        </text>
        <text x={2650 + i * 330} y={1536} fill={INK} fontSize={44} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {pl.p}
        </text>
        {pick && <text x={2650 + i * 330} y={1300} fill={TEAL} fontSize={30} fontFamily={MONO} textAnchor="middle">▼ PICKED</text>}
      </g>
    );
  });
  return (
    <g opacity={Math.min(1, s) * fade}>
      {/* stylized map grid */}
      {Array.from({length: 14}, (_, i) => (
        <line key={`v${i}`} x1={500 + i * 240} y1={680} x2={500 + i * 240} y2={1280} stroke={GRID} strokeWidth={2} />
      ))}
      {Array.from({length: 7}, (_, i) => (
        <line key={`h${i}`} x1={500} y1={680 + i * 100} x2={3860} y2={680 + i * 100} stroke={GRID} strokeWidth={2} />
      ))}
      {MAP_CITIES.map((c) => (
        <g key={c.n}>
          <circle cx={c.x} cy={c.y} r={12} fill={TEAL} opacity={0.9} />
          <circle cx={c.x} cy={c.y} r={26} fill="none" stroke={TEAL} strokeWidth={2} opacity={0.4} />
          <text x={c.x} y={c.y - 40} fill={INK} fontSize={30} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
            {c.n}
          </text>
        </g>
      ))}
      {/* dashed flight path + plane */}
      <path d="M 700 1050 Q 1600 480 2500 1150" fill="none" stroke={TEAL} strokeWidth={4} strokeDasharray="20 16" opacity={0.6}
        pathLength={1} strokeDashoffset={1 - planeT} />
      <g transform={`translate(${px}, ${py}) rotate(18)`}>
        <path d="M 0 -34 L 14 10 L 44 26 L 14 18 L 8 40 L 0 24 L -8 40 L -14 18 L -44 26 L -14 10 Z" fill={INK} />
      </g>
      {land > 0.01 && (
        <g opacity={Math.min(1, land)}>
          <circle cx={2500} cy={1150} r={60 + 20 * Math.sin(frame * 0.2)} fill="none" stroke={TEAL} strokeWidth={4} opacity={0.8} />
          <rect x={2330} y={1230} width={340} height={80} rx={40} fill={TEAL} />
          <text x={2500} y={1284} fill="#04201B" fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            LANDED
          </text>
        </g>
      )}
      <text x={1920} y={760} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
        Pick a plan <tspan fill={TEAL}>before you fly</tspan> — or after you land
      </text>
      {cards}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Stage 2: QR install into phone + progress ring (frames 300–520)
// ---------------------------------------------------------------------------
const StageInstall: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 300 || frame > 560) return null;
  const t = frame - 300;
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 100}});
  const fade = interpolate(frame, [530, 560], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scanY = interpolate(t, [30, 120], [-120, 120], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ring = interpolate(t, [110, 220], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const done = spring({frame: t - 225, fps, config: {damping: 200, stiffness: 110}});
  const qr: React.ReactElement[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const on = random(`esim-qr-${r}-${c}`) > 0.45 || (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
      qr.push(<rect key={`${r}-${c}`} x={c * 26} y={r * 26} width={22} height={22} fill={on ? '#0A1220' : 'rgba(10,18,32,0.08)'} />);
    }
  }
  return (
    <g opacity={Math.min(1, s) * fade}>
      <text x={1920} y={760} fill={MUTED} fontSize={38} fontFamily={FONT} textAnchor="middle">
        Scan the QR — the eSIM <tspan fill={TEAL}>installs itself</tspan>
      </text>
      <g transform="translate(1450, 1150)">
        <rect x={-140} y={-140} width={280} height={280} rx={24} fill="#FFFFFF" />
        <g transform="translate(-117, -117)">{qr}</g>
        <rect x={-140} y={scanY - 140} width={280} height={10} fill={TEAL} opacity={0.9} />
      </g>
      <Phone x={2400} y={1150}>
        <text y={-300} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
          INSTALLING eSIM
        </text>
        <circle r={130} fill="none" stroke="rgba(194,210,228,0.2)" strokeWidth={22} />
        <circle r={130} fill="none" stroke={TEAL} strokeWidth={22} strokeLinecap="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform="rotate(-90)" filter="url(#esimglow)" />
        <text y={16} fill={INK} fontSize={64} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {Math.round(ring * 100)}%
        </text>
        {done > 0.01 && (
          <g opacity={Math.min(1, done)}>
            <circle r={64} fill={TEAL} />
            <path d="M -28 0 l 20 22 l 40 -46" stroke="#04201B" strokeWidth={12} fill="none" strokeLinecap="round" />
          </g>
        )}
      </Phone>
      <line x1={1590} y1={1150} x2={2210} y2={1150} stroke={TEAL} strokeWidth={5} strokeDasharray="18 14"
        pathLength={1} strokeDashoffset={1 - interpolate(t, [20, 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Stage 3: activation + data flow + top-up (frames 520–900)
// ---------------------------------------------------------------------------
const StageActive: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 520) return null;
  const t = frame - 520;
  const s = spring({frame: t, fps, config: {damping: 200, stiffness: 100}});
  const cx = 1920;
  // data usage: drains 20 GB then top-up refills
  const drain = interpolate(t, [60, 300], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const topup = interpolate(t, [300, 360], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const gb = 20 * (1 - drain) + 20 * topup * drain;
  const lowWarn = drain > 0.8 && topup < 0.5;
  const toggle = spring({frame: t - 10, fps, config: {damping: 200, stiffness: 120}});
  const streams: React.ReactElement[] = [];
  for (let i = 0; i < 40; i++) {
    const yy = 880 + i * 34;
    const xx = 700 + ((frame * (6 + (i % 5))) % 2440);
    streams.push(
      <rect key={i} x={xx} y={yy} width={90} height={10} rx={5} fill={TEAL} opacity={0.12 + 0.25 * (0.5 + 0.5 * Math.sin(frame * 0.2 + i))} />
    );
  }
  return (
    <g opacity={Math.min(1, s)}>
      {streams}
      <Phone x={cx} y={1180}>
        <text y={-300} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
          BANGKOK · LOCAL NETWORK
        </text>
        {/* signal bars */}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={-120 + i * 62} y={-220 + (3 - i) * 34} width={44} height={60 + i * 34} rx={8}
            fill={i < 3 + (toggle > 0.9 ? 1 : 0) ? TEAL : 'rgba(194,210,228,0.2)'} opacity={0.5 + 0.5 * (0.5 + 0.5 * Math.sin(frame * 0.15 + i))} />
        ))}
        <text y={-60} fill={INK} fontSize={120} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {gb.toFixed(1)}
        </text>
        <text y={10} fill={MUTED} fontSize={36} fontFamily={MONO} textAnchor="middle" letterSpacing={4}>
          GB REMAINING
        </text>
        {/* data gauge */}
        <rect x={-150} y={60} width={300} height={26} rx={13} fill="rgba(194,210,228,0.15)" />
        <rect x={-150} y={60} width={300 * (gb / 20)} height={26} rx={13} fill={lowWarn ? CORAL : TEAL} filter="url(#esimglow)" />
        {/* activation toggle */}
        <g transform="translate(0, 220)" opacity={Math.min(1, toggle)}>
          <rect x={-110} y={-44} width={220} height={88} rx={44} fill={toggle > 0.5 ? TEAL : 'rgba(194,210,228,0.2)'} />
          <circle cx={toggle > 0.5 ? 66 : -66} cy={0} r={34} fill="#FFFFFF" />
          <text y={110} fill={toggle > 0.5 ? TEAL : MUTED} fontSize={36} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            {toggle > 0.5 ? 'eSIM ACTIVE' : 'ACTIVATING…'}
          </text>
        </g>
        {lowWarn && (
          <g>
            <rect x={-150} y={330} width={300} height={64} rx={32} fill={CORAL} opacity={0.9 + 0.1 * Math.sin(frame * 0.3)} />
            <text y={373} fill="#2B060C" fontSize={34} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              LOW DATA
            </text>
          </g>
        )}
        {topup > 0 && (
          <g opacity={topup}>
            <rect x={-150} y={330} width={300} height={64} rx={32} fill={GOLD} />
            <text y={373} fill="#2B1E06" fontSize={34} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              +20 GB TOPPED UP
            </text>
          </g>
        )}
      </Phone>
      {/* orbiting coins into phone */}
      {topup > 0 &&
        [0, 1, 2, 3, 4].map((i) => {
          const a = frame * 0.06 + (i / 5) * Math.PI * 2;
          return (
            <circle key={i} cx={cx + Math.cos(a) * (420 - topup * 200)} cy={1180 + Math.sin(a) * 300}
              r={22} fill={GOLD} opacity={1 - topup * 0.6} filter="url(#esimglow)" />
          );
        })}
      <text x={cx} y={1830} fill={INK} fontSize={44} fontFamily={FONT} fontWeight={700} textAnchor="middle">
        Buy <tspan fill={TEAL}>·</tspan> install <tspan fill={TEAL}>·</tspan> activate <tspan fill={TEAL}>·</tspan> top up — all inside one app
      </text>
    </g>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(140,190,225,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Illustrative concept. Check device eSIM compatibility and plan coverage before travel.
    </div>
  );
};

export const ESIMSetupJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <StageMap frame={frame} fps={fps} />
      <StageInstall frame={frame} fps={fps} />
      <StageActive frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
