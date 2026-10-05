/**
 * ShipAPackageFlow.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * A sender-side shipping journey: an item drops into an open box, cushioning
 * fills and tape seals it, a scale weighs it while service options fan out,
 * the shipping label prints with its barcode, the parcel is dropped at the
 * post office counter — and a tracking number issues as the first tracking
 * ticks light up.
 * (Sender-side prep arc ONLY — never a carrier-side delivery tracking map.)
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
// Palette — steel blue + orange
// ---------------------------------------------------------------------------
const BG = '#0B1118';
const GRID = 'rgba(140,170,220,0.10)';
const AXIS = 'rgba(140,170,220,0.55)';
const INK = '#EDF1F7';
const MUTED = 'rgba(180,200,220,0.62)';
const ORANGE = '#FF7A1A';
const STEEL = '#6EA8FF';
const GREEN = '#4ADE80';
const CARDBOARD = '#B5763C';
const CARDBOARD_D = '#8A5A28';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}card`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#14202F" />
      <stop offset="100%" stopColor="#0D1622" />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(11,17,24,0)" />
      <stop offset="100%" stopColor="rgba(4,7,11,0.80)" />
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
            'radial-gradient(circle at 50% 28%, rgba(255,122,26,0.10), rgba(255,122,26,0.03) 45%, rgba(11,17,24,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="spf" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#spfvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(255,122,26,0.028)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`spf-p-x-${i}`) * 3840;
    const by = random(`spf-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`spf-p-s-${i}`) * 1.0;
    const ang = random(`spf-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.5));
    const sz = 2.5 + random(`spf-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? ORANGE : 'rgba(237,241,247,0.85)'} opacity={tw} />);
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
    const bx = random(`spf-d-x-${i}`) * 3840;
    const by = random(`spf-d-y-${i}`) * 2160;
    const jx = (random(`spf-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`spf-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`spf-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`spf-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#E8C79A" opacity={o} />);
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
    const x = random(`spf-g-x-${frame}-${i}`) * 3840;
    const y = random(`spf-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`spf-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`spf-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'PACK IT RIGHT', 'CUSHION EVERY CORNER', 'PICK YOUR SPEED',
  'PRINT THE LABEL', 'DROP IT OFF', 'TRACK IT',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 3840;
  const off = -((frame * 4.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 640} y={46} fill="rgba(255,122,26,0.7)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(255,122,26,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(255,122,26,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3060, y: 2090, t: 'SHIP A PACKAGE · SENDER SIDE'},
    {x: 3180, y: 130, t: 'SHIPPING SIM'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={ORANGE} opacity={0.35 + blink * 0.55} />
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
        SHIP A <span style={{color: ORANGE}}>PACKAGE</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        From open box to tracking number — the sender-side journey
      </div>
    </div>
  );
};

// A cardboard box drawn at (x,y) top-left, open flaps closing as closeK goes 0→1
const Box: React.FC<{x: number; y: number; w: number; h: number; closeK: number}> = ({x, y, w, h, closeK}) => {
  const tipY = y - 190 + closeK * 175;
  return (
    <g>
      {/* back flaps */}
      <polygon points={`${x},${y} ${x + w * 0.28},${tipY} ${x + w * 0.5},${tipY} ${x + w * 0.5},${y}`} fill={CARDBOARD_D} stroke={AXIS} strokeWidth={2} />
      <polygon points={`${x + w},${y} ${x + w * 0.72},${tipY} ${x + w * 0.5},${tipY} ${x + w * 0.5},${y}`} fill={CARDBOARD_D} stroke={AXIS} strokeWidth={2} />
      {/* interior */}
      <rect x={x + 14} y={y + 14} width={w - 28} height={70} fill="#241505" opacity={0.9 - closeK * 0.7} />
      {/* body */}
      <rect x={x} y={y} width={w} height={h} fill={CARDBOARD} stroke={CARDBOARD_D} strokeWidth={6} />
      <line x1={x} y1={y + h * 0.35} x2={x + w} y2={y + h * 0.35} stroke={CARDBOARD_D} strokeWidth={2.5} opacity={0.6} />
      <text x={x + w / 2} y={y + h * 0.78} fill={CARDBOARD_D} fontSize={44} fontFamily={MONO} fontWeight={700} letterSpacing={4} textAnchor="middle">
        THIS SIDE UP
      </text>
      <polygon points={`${x + w / 2 - 40},${y + h * 0.5} ${x + w / 2 + 40},${y + h * 0.5} ${x + w / 2},${y + h * 0.38}`} fill={CARDBOARD_D} opacity={0.7} />
      <polygon points={`${x + w / 2 - 40},${y + h * 0.58} ${x + w / 2 + 40},${y + h * 0.58} ${x + w / 2},${y + h * 0.7}`} fill={CARDBOARD_D} opacity={0.7} />
      {/* front flaps */}
      <polygon points={`${x},${y} ${x + w * 0.22},${tipY + 26} ${x + w * 0.5},${tipY + 26} ${x + w * 0.5},${y}`} fill={CARDBOARD} stroke={CARDBOARD_D} strokeWidth={4} />
      <polygon points={`${x + w},${y} ${x + w * 0.78},${tipY + 26} ${x + w * 0.5},${tipY + 26} ${x + w * 0.5},${y}`} fill={CARDBOARD} stroke={CARDBOARD_D} strokeWidth={4} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 1 — Item drops into the open box (frames 0–130)
// ---------------------------------------------------------------------------
const Pack: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 0 || frame > 130) return null;
  const fade = interpolate(frame, [110, 130], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const itemY = interpolate(frame, [20, 95], [520, 1000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const placed = interpolate(frame, [95, 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <g opacity={fade}>
      <Box x={1520} y={1000} w={800} h={560} closeK={0} />
      {/* the item: a gadget in a mailer */}
      <g opacity={interpolate(frame, [10, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
        <rect x={1660} y={itemY} width={520} height={300} rx={36} fill="#1C2A3D" stroke={STEEL} strokeWidth={5} filter="url(#spglow)" />
        <rect x={1700} y={itemY + 40} width={440} height={150} rx={18} fill="rgba(110,168,255,0.16)" stroke={STEEL} strokeWidth={3} />
        <circle cx={1920} cy={itemY + 245} r={26} fill="none" stroke={STEEL} strokeWidth={5} />
        <text x={1920} y={itemY + 70} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
          SENDER'S ITEM
        </text>
      </g>
      {placed > 0 && (
        <g opacity={placed} transform={`translate(2560, 900) scale(${0.6 + placed * 0.4})`}>
          <circle cx={0} cy={0} r={44} fill={GREEN} filter="url(#spglow)" />
          <text y={20} fill="#0B1118" fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            ✓
          </text>
          <text y={-80} fill={INK} fontSize={36} fontFamily={FONT} fontWeight={700} textAnchor="middle">
            ITEM PLACED
          </text>
        </g>
      )}
      <text x={1920} y={1780} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
        Everything starts with the item and an open box.
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 2 — Cushioning fills, tape seals (frames 120–270)
// ---------------------------------------------------------------------------
const Seal: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 120 || frame > 270) return null;
  const t = frame - 120;
  const fade = interpolate(frame, [250, 270], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const closeK = interpolate(t, [60, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tapeW = interpolate(t, [80, 115], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pellets: React.ReactElement[] = [];
  for (let i = 0; i < 120; i++) {
    const px = 1540 + random(`spf-pl-x-${i}`) * 760;
    const py = 1020 + random(`spf-pl-y-${i}`) * 120;
    const on = interpolate(t, [i * 0.4, 8 + i * 0.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    if (on <= 0) continue;
    pellets.push(
      <circle key={i} cx={px} cy={py} r={13 + random(`spf-pl-r-${i}`) * 10} fill="rgba(237,241,247,0.85)" opacity={on * 0.95} />
    );
  }
  return (
    <g opacity={fade}>
      <Box x={1520} y={1000} w={800} h={560} closeK={closeK} />
      {pellets}
      {/* tape strip */}
      {tapeW > 0 && (
        <rect x={1920 - 400 * tapeW} y={975} width={800 * tapeW} height={52} fill="#D9A45B" opacity={0.96} filter="url(#spglow)" />
      )}
      {t > 118 && (
        <g transform="translate(1920, 850) rotate(-12)">
          <rect x={-260} y={-70} width={520} height={140} rx={12} fill="none" stroke={ORANGE} strokeWidth={8} opacity={0.95} filter="url(#spglow)" />
          <text y={28} fill={ORANGE} fontSize={72} fontFamily={FONT} fontWeight={800} letterSpacing={6} textAnchor="middle">
            FRAGILE
          </text>
        </g>
      )}
      <text x={1920} y={1780} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
        Cushion every corner, seal the flaps, stamp it fragile.
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 3 — Scale weighs, service options fan out (frames 260–430)
// ---------------------------------------------------------------------------
const SERVICES = [
  {name: 'GROUND', price: '$8.90', days: '5–7 DAYS', sel: false},
  {name: 'PRIORITY', price: '$14.20', days: '2–3 DAYS', sel: true},
  {name: 'EXPRESS', price: '$24.50', days: 'NEXT DAY', sel: false},
];
const Weigh: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 260 || frame > 430) return null;
  const t = frame - 260;
  const fade = interpolate(frame, [410, 430], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const angle = interpolate(t, [20, 90], [-62, 34], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kg = interpolate(t, [20, 90], [0, 2.4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rad = (angle * Math.PI) / 180;
  const nx = 1150 + Math.cos(rad - Math.PI / 2) * 190;
  const ny = 1050 + Math.sin(rad - Math.PI / 2) * 190;
  return (
    <g opacity={fade}>
      <text x={1920} y={560} fill={ORANGE} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4} textAnchor="middle">
        WEIGH IT · PRICE IT
      </text>
      {/* scale */}
      <rect x={650} y={620} width={1000} height={900} rx={28} fill="url(#spfcard)" stroke={AXIS} strokeWidth={2.5} />
      <rect x={750} y={1380} width={800} height={60} rx={12} fill="rgba(140,170,220,0.2)" />
      <rect x={900} y={1230} width={500} height={150} rx={12} fill={CARDBOARD} stroke={CARDBOARD_D} strokeWidth={4} />
      <circle cx={1150} cy={1050} r={250} fill="#0D1622" stroke={STEEL} strokeWidth={5} />
      {[-60, -30, 0, 30, 60].map((a) => {
        const r2 = ((a * Math.PI) / 180);
        const x1 = 1150 + Math.cos(r2 - Math.PI / 2) * 200;
        const y1 = 1050 + Math.sin(r2 - Math.PI / 2) * 200;
        const x2 = 1150 + Math.cos(r2 - Math.PI / 2) * 232;
        const y2 = 1050 + Math.sin(r2 - Math.PI / 2) * 232;
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={MUTED} strokeWidth={6} />;
      })}
      <line x1={1150} y1={1050} x2={nx} y2={ny} stroke={ORANGE} strokeWidth={10} strokeLinecap="round" filter="url(#spglow)" />
      <circle cx={1150} cy={1050} r={26} fill={ORANGE} />
      <text x={1150} y={760} fill={INK} fontSize={96} fontFamily={MONO} fontWeight={800} textAnchor="middle">
        {kg.toFixed(1)}<tspan fill={MUTED} fontSize={52}> kg</tspan>
      </text>
      {/* service options */}
      {SERVICES.map((s, i) => {
        const spr = spring({frame: t - 60 - i * 22, fps, config: {damping: 200, stiffness: 110}});
        if (spr <= 0.001) return null;
        const x = 900 + i * 1050;
        const op = Math.min(1, spr);
        const yy = 1560 + (1 - Math.min(1, spr)) * 90;
        return (
          <g key={s.name} opacity={op} transform={`translate(${x}, ${yy})`}>
            <rect x={-430} y={0} width={860} height={380} rx={24} fill="url(#spfcard)"
              stroke={s.sel ? ORANGE : AXIS} strokeWidth={s.sel ? 5 : 2.5} filter={s.sel ? 'url(#spglow)' : undefined} />
            {s.sel && (
              <rect x={-130} y={-34} width={260} height={60} rx={30} fill={ORANGE} />
            )}
            {s.sel && (
              <text y={12} fill="#0B1118" fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle">
                SELECTED
              </text>
            )}
            <text y={110} fill={s.sel ? ORANGE : INK} fontSize={58} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {s.name}
            </text>
            <text y={200} fill={INK} fontSize={76} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              {s.price}
            </text>
            <text y={280} fill={MUTED} fontSize={32} fontFamily={MONO} letterSpacing={3} textAnchor="middle">
              {s.days}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 4 — Shipping label prints with barcode (frames 420–550)
// ---------------------------------------------------------------------------
const Label: React.FC<{frame: number}> = ({frame}) => {
  if (frame < 420 || frame > 550) return null;
  const t = frame - 420;
  const fade = interpolate(frame, [530, 550], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const paperH = interpolate(t, [15, 80], [0, 430], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bars: React.ReactElement[] = [];
  let bx = 0;
  for (let i = 0; i < 42; i++) {
    const w = 3 + random(`spf-bc-w-${i}`) * 9;
    const gap = 3 + random(`spf-bc-g-${i}`) * 8;
    if (i % 3 !== 2) bars.push(<rect key={i} x={bx} y={0} width={w} height={110} fill="#0B1118" />);
    bx += w + gap;
  }
  return (
    <g opacity={fade}>
      <text x={1920} y={560} fill={ORANGE} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4} textAnchor="middle">
        PRINTING SHIPPING LABEL
      </text>
      {/* printer */}
      <rect x={700} y={700} width={1100} height={420} rx={30} fill="url(#spfcard)" stroke={AXIS} strokeWidth={3} />
      <rect x={700} y={640} width={1100} height={90} rx={20} fill="#0D1622" stroke={AXIS} strokeWidth={2.5} />
      <circle cx={1660} cy={810} r={18} fill={GREEN} opacity={0.4 + 0.6 * Math.abs(Math.sin(frame * 0.15))} />
      <text x={800} y={810} fill={MUTED} fontSize={32} fontFamily={MONO} letterSpacing={2}>
        LABEL PRINTER · READY
      </text>
      {/* emerging paper */}
      {paperH > 4 && (
        <g>
          <rect x={880} y={1110} width={740} height={paperH} fill="#F2F4F6" />
          {paperH > 120 && (
            <g transform={`translate(940, ${1140}) scale(${Math.min(1, 740 / 700)})`}>
              <text x={0} y={40} fill="#0B1118" fontSize={34} fontFamily={MONO} fontWeight={800} letterSpacing={2}>
                PRIORITY · 2.4 KG
              </text>
              <g transform="translate(0, 70)">{bars}</g>
              <text x={0} y={230} fill="#0B1118" fontSize={44} fontFamily={MONO} fontWeight={800} letterSpacing={4}>
                SPF 8842 2019 07
              </text>
              {[0, 1, 2].map((i) => (
                <rect key={i} x={0} y={270 + i * 44} width={560 - i * 120} height={22} rx={11} fill="rgba(11,17,24,0.55)" />
              ))}
            </g>
          )}
        </g>
      )}
      {/* applied label note */}
      <g opacity={interpolate(t, [85, 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
        <rect x={2050} y={700} width={1090} height={700} rx={28} fill="url(#spfcard)" stroke={ORANGE} strokeWidth={3} />
        <text x={2595} y={790} fill={ORANGE} fontSize={32} fontFamily={MONO} fontWeight={700} letterSpacing={3} textAnchor="middle">
          ON THE PARCEL
        </text>
        <g transform="translate(2595, 1000) scale(0.42)">
          <Box x={-400} y={-280} w={800} h={560} closeK={1} />
        </g>
        <rect x={2350} y={1180} width={490} height={130} fill="#F2F4F6" rx={8} transform="rotate(-4 2595 1245)" />
        <text x={2595} y={1260} fill="#0B1118" fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle" transform="rotate(-4 2595 1245)">
          SPF 8842 2019 07
        </text>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 5 — Drop-off at the post office counter (frames 540–690)
// ---------------------------------------------------------------------------
const Dropoff: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 540 || frame > 690) return null;
  const t = frame - 540;
  const fade = interpolate(frame, [670, 690], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const boxX = interpolate(t, [15, 95], [700, 2500], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const accepted = spring({frame: t - 100, fps, config: {damping: 200, stiffness: 140}});
  return (
    <g opacity={fade}>
      <text x={1920} y={560} fill={ORANGE} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4} textAnchor="middle">
        DROP IT OFF
      </text>
      {/* back wall sign + service window */}
      <rect x={1200} y={640} width={1440} height={180} rx={20} fill="#0D1622" stroke={ORANGE} strokeWidth={3} />
      <text x={1920} y={762} fill={ORANGE} fontSize={72} fontFamily={FONT} fontWeight={800} letterSpacing={10} textAnchor="middle">
        PARCEL DROP-OFF
      </text>
      <rect x={1420} y={880} width={1000} height={420} rx={18} fill="rgba(140,170,220,0.07)" stroke={AXIS} strokeWidth={3} />
      <circle cx={1920} cy={1100} r={90} fill="#1C2A3D" stroke={STEEL} strokeWidth={4} />
      <rect x={1790} y={1180} width={260} height={120} rx={40} fill="#1C2A3D" stroke={STEEL} strokeWidth={4} />
      <text x={1920} y={1380} fill={MUTED} fontSize={28} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
        COUNTER CLERK
      </text>
      {/* counter */}
      <rect x={500} y={1450} width={2840} height={330} rx={16} fill="url(#spfcard)" stroke={AXIS} strokeWidth={3} />
      <rect x={500} y={1450} width={2840} height={40} fill="rgba(140,170,220,0.16)" />
      {/* sliding parcel */}
      <g transform={`translate(${boxX}, 1090) scale(0.62)`}>
        <Box x={-400} y={-280} w={800} h={560} closeK={1} />
        <rect x={-170} y={-60} width={340} height={120} fill="#F2F4F6" rx={8} />
        <text x={0} y={16} fill="#0B1118" fontSize={40} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          SPF 8842
        </text>
      </g>
      {accepted > 0.01 && (
        <g opacity={Math.min(1, accepted)} transform={`translate(3100, 1560) scale(${Math.min(1, accepted)})`}>
          <circle cx={0} cy={0} r={56} fill={GREEN} filter="url(#spglow)" />
          <text y={24} fill="#0B1118" fontSize={64} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            ✓
          </text>
          <text y={110} fill={GREEN} fontSize={32} fontFamily={MONO} fontWeight={700} textAnchor="middle">
            ACCEPTED
          </text>
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Beat 6 — Tracking number issues, ticks begin (frames 680–900)
// (Sender-side trail only: printed → accepted → carrier pickup. No delivery map.)
// ---------------------------------------------------------------------------
const TRACKS = [
  {label: 'LABEL PRINTED', at: 0},
  {label: 'COUNTER ACCEPTED', at: 60},
  {label: 'CARRIER PICKUP', at: 120},
];
const Tracking: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 680) return null;
  const t = frame - 680;
  const cardIn = interpolate(t, [0, 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const banner = spring({frame: t - 175, fps, config: {damping: 200, stiffness: 120}});
  return (
    <g opacity={cardIn}>
      <rect x={920} y={600} width={2000} height={940} rx={32} fill="url(#spfcard)" stroke={ORANGE} strokeWidth={3} />
      <text x={1920} y={710} fill={ORANGE} fontSize={34} fontFamily={MONO} fontWeight={700} letterSpacing={4} textAnchor="middle">
        TRACKING ISSUED
      </text>
      <text x={1920} y={880} fill={INK} fontSize={104} fontFamily={MONO} fontWeight={800} letterSpacing={6} textAnchor="middle">
        SPF 8842 2019 07
      </text>
      {/* trail */}
      <line x1={1220} y1={1120} x2={2620} y2={1120} stroke={AXIS} strokeWidth={6} />
      {TRACKS.map((tr, i) => {
        const x = 1220 + i * 700;
        const on = interpolate(t, [tr.at, tr.at + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const chk = spring({frame: t - tr.at - 26, fps, config: {damping: 200, stiffness: 180}});
        return (
          <g key={tr.label}>
            <line x1={1220} y1={1120} x2={x} y2={1120} stroke={ORANGE} strokeWidth={6} opacity={on} filter="url(#spglow)" />
            <circle cx={x} cy={1120} r={44} fill={on > 0.5 ? ORANGE : '#0D1622'} stroke={ORANGE} strokeWidth={4} opacity={0.3 + on * 0.7} />
            {chk > 0.01 && (
              <text x={x} y={1138} fill="#0B1118" fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle" opacity={Math.min(1, chk)}>
                ✓
              </text>
            )}
            <text x={x} y={1220} fill={on > 0.5 ? ORANGE : MUTED} fontSize={32} fontFamily={MONO} fontWeight={700} letterSpacing={2} textAnchor="middle">
              {tr.label}
            </text>
          </g>
        );
      })}
      <text x={1920} y={1360} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={2} textAnchor="middle">
        THE FIRST SCANS ARE IN — THE SENDER'S JOB IS DONE
      </text>
      {banner > 0.01 && (
        <g opacity={Math.min(1, banner)} transform={`translate(1920, 1690) scale(${0.8 + Math.min(1, banner) * 0.2})`}>
          <rect x={-560} y={-80} width={1120} height={160} rx={80} fill="rgba(13,22,34,0.96)" stroke={ORANGE} strokeWidth={5} filter="url(#spglow)" />
          <text y={28} fill={ORANGE} fontSize={64} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={2}>
            PACKAGE IS ON ITS WAY
          </text>
        </g>
      )}
    </g>
  );
};

const Stage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => (
  <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
    <Pack frame={frame} />
    <Seal frame={frame} />
    <Weigh frame={frame} fps={fps} />
    <Label frame={frame} />
    <Dropoff frame={frame} fps={fps} />
    <Tracking frame={frame} fps={fps} />
  </svg>
);

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(180,200,220,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Sender-side process shown. Rates and transit times are illustrative.
    </div>
  );
};

export const ShipAPackageFlow: React.FC = () => {
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
