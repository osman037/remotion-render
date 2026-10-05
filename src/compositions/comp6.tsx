/**
 * HomeCompostingProcess.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * A backyard home-composting journey: kitchen scraps and yard waste sort
 * into green/brown streams (0-160), compost bin layers build up (160-320),
 * a thermometer rises as microbes work (320-480), the pile gets turned with
 * heat waves rising (480-620), dark finished compost pours out (620-760),
 * and a garden bed blooms with sprouts (760-900).
 * (Consumer backyard-bin process only — never industrial machinery.)
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
const BG = '#08120B';
const GRID = 'rgba(163,230,53,0.10)';
const AXIS = 'rgba(163,230,53,0.5)';
const INK = '#F5F7E8';
const MUTED = 'rgba(200,220,180,0.62)';
const GREEN = '#4ADE80';
const LIME = '#A3E635';
const LEAF = '#16A34A';
const BROWN = '#B07D4F';
const BARK = '#7C4A21';
const SOIL = '#3E2A16';
const COMPOST = '#241A0E';
const AMBER = '#FBBF24';
const CREAM = '#F5F0E1';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}line`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={LEAF} />
      <stop offset="55%" stopColor={LIME} />
      <stop offset="100%" stopColor={AMBER} />
    </linearGradient>
    <linearGradient id={`${p}soil`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={BROWN} />
      <stop offset="55%" stopColor={BARK} />
      <stop offset="100%" stopColor={COMPOST} />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(8,18,11,0)" />
      <stop offset="100%" stopColor="rgba(3,8,4,0.8)" />
    </radialGradient>
    <radialGradient id={`${p}sung`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(251,191,36,0.5)" />
      <stop offset="100%" stopColor="rgba(251,191,36,0)" />
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
            'radial-gradient(circle at 50% 28%, rgba(163,230,53,0.09), rgba(74,222,128,0.04) 45%, rgba(8,18,11,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="hcp" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#hcpvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(163,230,53,0.028)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`hcp-p-x-${i}`) * 3840;
    const by = random(`hcp-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`hcp-p-s-${i}`) * 1.0;
    const ang = random(`hcp-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.5));
    const sz = 2.5 + random(`hcp-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? LIME : 'rgba(245,247,232,0.85)'} opacity={tw} />);
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
    const bx = random(`hcp-d-x-${i}`) * 3840;
    const by = random(`hcp-d-y-${i}`) * 2160;
    const jx = (random(`hcp-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`hcp-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`hcp-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`hcp-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#D9E8B8" opacity={o} />);
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
    const x = random(`hcp-g-x-${frame}-${i}`) * 3840;
    const y = random(`hcp-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`hcp-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`hcp-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'GREENS · NITROGEN', 'BROWNS · CARBON', 'LAYER · MOISTEN · TURN',
  'BACKYARD COMPOSTING', 'SCRAPS → BLACK GOLD', 'FEED YOUR GARDEN',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER.length * 680;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 680} y={46} fill="rgba(163,230,53,0.72)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(163,230,53,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(163,230,53,0.22)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3230, y: 2090, t: 'BACKYARD GUIDE'},
    {x: 60, y: 130, t: 'SCRAPS → SOIL'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={LIME} opacity={0.35 + blink * 0.55} />
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
        HOME <span style={{color: LIME}}>COMPOSTING</span> PROCESS
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        Kitchen scraps + yard waste → <span style={{color: BROWN, fontWeight: 700}}>black gold</span> for your garden
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scrap icons (simple SVG glyphs)
// ---------------------------------------------------------------------------
const ScrapIcon: React.FC<{kind: string; c: string}> = ({kind, c}) => {
  if (kind === 'apple') {
    return (
      <g>
        <circle cx={0} cy={8} r={52} fill={c} />
        <path d="M0 -44 q 6 -26 30 -34" stroke={LEAF} strokeWidth={10} fill="none" strokeLinecap="round" />
        <ellipse cx={34} cy={-52} rx={26} ry={14} fill={LEAF} transform="rotate(-24 34 -52)" />
      </g>
    );
  }
  if (kind === 'leaf') {
    return (
      <g>
        <path d="M-50 40 Q -50 -50 50 -50 Q 50 40 -50 40 Z" fill={c} transform="rotate(24)" />
        <line x1={-36} y1={30} x2={36} y2={-36} stroke={BARK} strokeWidth={7} transform="rotate(24)" />
      </g>
    );
  }
  if (kind === 'cup') {
    return (
      <g>
        <rect x={-44} y={-30} width={88} height={84} rx={14} fill={c} />
        <path d="M44 -10 q 34 0 30 34 q -4 30 -34 28" stroke={c} strokeWidth={14} fill="none" />
        <path d="M-30 -50 q 10 -14 0 -28 M0 -50 q 10 -14 0 -28 M30 -50 q 10 -14 0 -28" stroke="rgba(245,247,232,0.5)" strokeWidth={8} fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === 'twig') {
    return (
      <g>
        <line x1={-46} y1={44} x2={46} y2={-44} stroke={c} strokeWidth={13} strokeLinecap="round" />
        <line x1={-8} y1={6} x2={-34} y2={-26} stroke={c} strokeWidth={10} strokeLinecap="round" />
        <line x1={14} y1={-16} x2={38} y2={-44} stroke={c} strokeWidth={10} strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <rect x={-56} y={-40} width={112} height={88} rx={8} fill={c} />
      <line x1={0} y1={-40} x2={0} y2={48} stroke={BARK} strokeWidth={8} />
      <rect x={-56} y={-40} width={112} height={22} rx={8} fill="rgba(0,0,0,0.18)" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene A (0-175): sort scraps into green / brown streams
// ---------------------------------------------------------------------------
const GREENS = [
  {kind: 'apple', label: 'veggie scraps'},
  {kind: 'leaf', label: 'grass clippings'},
  {kind: 'cup', label: 'coffee grounds'},
];
const BROWNSC = [
  {kind: 'leaf', label: 'dry leaves'},
  {kind: 'twig', label: 'twigs'},
  {kind: 'box', label: 'cardboard'},
];
const Sort: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame > 180) return null;
  const fadeOut = interpolate(frame, [150, 180], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bins: React.ReactElement[] = [];
  const streams = [
    {x: 1180, c: GREEN, tag: 'GREENS · NITROGEN', items: GREENS},
    {x: 2660, c: BROWN, tag: 'BROWNS · CARBON', items: BROWNSC},
  ];
  streams.forEach((st, si) => {
    const bs = spring({frame: frame - 8 - si * 14, fps, config: {damping: 200, stiffness: 90}});
    if (bs > 0.001) {
      bins.push(
        <g key={`bin${si}`} opacity={Math.min(1, bs)} transform={`translate(${st.x}, 1250) scale(${Math.max(0.001, Math.min(1, bs))})`}>
          <path d="M -330 0 L -280 480 L 280 480 L 330 0 Z" fill="#101E13" stroke={st.c} strokeWidth={8} />
          <rect x={-360} y={-60} width={720} height={90} rx={24} fill={st.c} opacity={0.85} />
          <text y={240} fill={CREAM} fontSize={56} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            {st.tag}
          </text>
        </g>
      );
    }
    st.items.forEach((it, ii) => {
      const s = spring({frame: frame - 30 - (si * 3 + ii) * 18, fps, config: {damping: 200, stiffness: 110}});
      if (s <= 0.001) return;
      const y = interpolate(s, [0, 1], [560, 1080], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      const x = st.x + Math.sin(frame * 0.06 + ii * 2 + si * 4) * 60 * (1 - Math.min(1, s));
      bins.push(
        <g key={`it${si}-${ii}`} opacity={Math.min(1, s)} transform={`translate(${x}, ${y}) scale(${0.9 + Math.min(1, s) * 0.35})`}>
          <ScrapIcon kind={it.kind} c={si === 0 ? (ii === 1 ? LIME : ii === 2 ? '#6F4E2E' : '#E4572E') : (ii === 0 ? '#C98F3D' : ii === 1 ? BARK : '#C9A86A')} />
          <text y={110} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="middle">
            {it.label}
          </text>
        </g>
      );
    });
  });
  return (
    <g opacity={fadeOut}>
      <text x={1920} y={480} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        STEP 01 — SORT YOUR SCRAPS
      </text>
      {bins}
      <text x={1920} y={1620} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
        the golden rule: roughly <tspan fill={LIME} fontWeight={800}>1 part greens</tspan> to <tspan fill={BROWN} fontWeight={800}>3 parts browns</tspan>
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene B (150-335): bin layers build up
// ---------------------------------------------------------------------------
const LAYERS = [
  {c: BROWN, t: 'BROWNS — dry leaves'},
  {c: GREEN, t: 'GREENS — scraps'},
  {c: BROWN, t: 'BROWNS — twigs'},
  {c: GREEN, t: 'GREENS — grass'},
  {c: BROWN, t: 'BROWNS — cardboard'},
  {c: GREEN, t: 'GREENS — coffee'},
];
const BinBuild: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 150 || frame > 340) return null;
  const fadeIn = interpolate(frame, [150, 180], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [310, 340], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const microbes: React.ReactElement[] = [];
  for (let i = 0; i < 70; i++) {
    const a = random(`hcp-mb-a-${i}`) * Math.PI * 2;
    const rr = 80 + random(`hcp-mb-r-${i}`) * 380;
    const cx = 1920 + Math.cos(a + frame * 0.02 * (0.5 + random(`hcp-mb-v-${i}`))) * rr;
    const cy = 1280 + Math.sin(a + frame * 0.03) * rr * 0.32;
    const tw = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(frame * 0.25 + i * 2.1));
    microbes.push(<circle key={i} cx={cx} cy={cy} r={5 + random(`hcp-mb-z-${i}`) * 9} fill={LIME} opacity={tw * 0.7} />);
  }
  return (
    <g opacity={fadeIn * fadeOut}>
      <text x={1920} y={480} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        STEP 02 — LAYER THE BIN
      </text>
      {/* slatted bin */}
      <g>
        {[-2, -1, 0, 1, 2].map((k) => (
          <rect key={k} x={1290} y={700 + (k + 2) * 150} width={1260} height={56} rx={14} fill={BARK} stroke={SOIL} strokeWidth={4} />
        ))}
        <rect x={1240} y={660} width={70} height={900} rx={16} fill={SOIL} />
        <rect x={2530} y={660} width={70} height={900} rx={16} fill={SOIL} />
      </g>
      <g clipPath="url(#hcpbinclip)">
        <clipPath id="hcpbinclip">
          <rect x={1310} y={700} width={1220} height={860} />
        </clipPath>
        {LAYERS.map((l, i) => {
          const s = spring({frame: frame - 165 - i * 24, fps, config: {damping: 200, stiffness: 100}});
          if (s <= 0.001) return null;
          const h = 132 * Math.min(1, s);
          const y = 1560 - (i + 1) * 132;
          return (
            <g key={i} opacity={Math.min(1, s)}>
              <rect x={1310} y={y + (132 - h)} width={1220} height={h} fill={l.c} opacity={0.9} />
              <rect x={1310} y={y + (132 - h)} width={1220} height={10} fill="rgba(255,255,255,0.25)" />
              {s > 0.85 && (
                <text x={1920} y={y + 80} fill={INK} fontSize={36} fontFamily={FONT} fontWeight={700} textAnchor="middle">
                  {l.t}
                </text>
              )}
            </g>
          );
        })}
        {frame > 300 && microbes}
      </g>
      <text x={1920} y={1700} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
        alternate layers — then water until damp as a wrung-out sponge
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene C (310-495): thermometer rises as microbes work
// ---------------------------------------------------------------------------
const Thermo: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 310 || frame > 500) return null;
  const fadeIn = interpolate(frame, [310, 340], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [470, 500], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const temp = interpolate(frame, [330, 480], [18, 66], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ty1 = 1560;
  const ty0 = 700;
  const fillY = ty1 - ((temp - 0) / 80) * (ty1 - ty0);
  const zone = temp < 35 ? 'warming up' : temp < 55 ? 'active zone' : 'hot center!';
  const bubbles: React.ReactElement[] = [];
  for (let i = 0; i < 50; i++) {
    const bx = 700 + random(`hcp-bb-x-${i}`) * 1300;
    const rise = ((frame * (1.5 + random(`hcp-bb-v-${i}`) * 2.5) + random(`hcp-bb-p-${i}`) * 900) % 900);
    const by = 1650 - rise;
    bubbles.push(
      <circle key={i} cx={bx + Math.sin(frame * 0.05 + i) * 30} cy={by} r={6 + random(`hcp-bb-z-${i}`) * 12}
        fill={AMBER} opacity={0.15 + 0.3 * (0.5 + 0.5 * Math.sin(frame * 0.2 + i * 1.7))} />
    );
  }
  return (
    <g opacity={fadeIn * fadeOut}>
      <text x={1920} y={480} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        STEP 03 — MICROBES GET TO WORK
      </text>
      {/* pile */}
      <ellipse cx={1350} cy={1500} rx={640} ry={330} fill="url(#hcpsoil)" stroke={BARK} strokeWidth={8} />
      {bubbles}
      {[0, 1, 2].map((k) => {
        const on = interpolate(frame, [350 + k * 25, 380 + k * 25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <text key={k} x={1350} y={1420 + k * 90} fill={LIME} fontSize={40} fontFamily={FONT} fontWeight={700} textAnchor="middle" opacity={on}>
            {['billions of microbes', 'breaking down carbon', 'releasing heat'][k]}
          </text>
        );
      })}
      {/* thermometer */}
      <g transform="translate(3050, 0)">
        <rect x={-60} y={700} width={120} height={860} rx={60} fill="#101E13" stroke={CREAM} strokeWidth={6} />
        <rect x={-34} y={fillY} width={68} height={1560 - fillY} rx={34} fill={temp < 45 ? AMBER : '#E4572E'} filter="url(#hcpgrow)" />
        <circle cx={0} cy={1560} r={110} fill={temp < 45 ? AMBER : '#E4572E'} filter="url(#hcpgrow)" />
        {[0, 20, 40, 60, 80].map((v) => {
          const vy = ty1 - (v / 80) * (ty1 - ty0);
          return (
            <g key={v}>
              <line x1={70} y1={vy} x2={110} y2={vy} stroke={CREAM} strokeWidth={4} />
              <text x={130} y={vy + 13} fill={MUTED} fontSize={34} fontFamily={MONO}>
                {v}°
              </text>
            </g>
          );
        })}
        <text y={1760} fill={CREAM} fontSize={96} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {Math.round(temp)}°C
        </text>
        <text y={1840} fill={temp < 45 ? AMBER : '#E4572E'} fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          {zone}
        </text>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene D (470-635): turn the pile — heat waves rise
// ---------------------------------------------------------------------------
const Turn: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 470 || frame > 640) return null;
  const fadeIn = interpolate(frame, [470, 500], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [610, 640], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const stab = Math.sin((frame - 480) * 0.22) * 0.5 + 0.5; // 0..1 fork dip cycle
  const forkY = 500 + stab * 260;
  const forkRot = -18 + stab * 14;
  const waves: React.ReactElement[] = [];
  for (let w = 0; w < 6; w++) {
    const wx = 1300 + w * 260;
    let d = `M ${wx} 1150 `;
    for (let k = 1; k <= 10; k++) {
      const yy = 1150 - k * 70;
      const xx = wx + Math.sin(frame * 0.12 + k * 0.9 + w * 1.7) * 34;
      d += `L ${xx.toFixed(1)} ${yy.toFixed(1)} `;
    }
    const o = 0.2 + 0.35 * (0.5 + 0.5 * Math.sin(frame * 0.15 + w * 2.2));
    waves.push(<path key={w} d={d} fill="none" stroke={AMBER} strokeWidth={9} strokeLinecap="round" opacity={o} />);
  }
  const chunks: React.ReactElement[] = [];
  for (let i = 0; i < 40; i++) {
    const cyc = ((frame - 485 + i * 7) % 70) / 70;
    const x = 1500 + (random(`hcp-tc-x-${i}`) - 0.5) * 700;
    const y = 1300 - Math.sin(cyc * Math.PI) * (160 + random(`hcp-tc-h-${i}`) * 260);
    chunks.push(
      <circle key={i} cx={x} cy={y} r={10 + random(`hcp-tc-z-${i}`) * 18} fill={i % 2 === 0 ? BROWN : SOIL} opacity={0.85} />
    );
  }
  return (
    <g opacity={fadeIn * fadeOut}>
      <text x={1920} y={480} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        STEP 04 — TURN IT WEEKLY
      </text>
      {waves}
      <ellipse cx={1920} cy={1500} rx={760} ry={360} fill="url(#hcpsoil)" stroke={BARK} strokeWidth={8} />
      {chunks}
      {/* garden fork */}
      <g transform={`translate(1920, ${forkY}) rotate(${forkRot})`}>
        <rect x={-22} y={-560} width={44} height={560} rx={22} fill={BARK} />
        <rect x={-160} y={-40} width={320} height={46} rx={20} fill={BARK} />
        {[-120, -40, 40, 120].map((tx) => (
          <rect key={tx} x={tx - 16} y={0} width={32} height={200} rx={14} fill="#8A8F98" />
        ))}
        <rect x={-160} y={0} width={320} height={40} rx={18} fill={SOIL} />
      </g>
      <text x={1920} y={1750} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
        turning adds oxygen — oxygen keeps the <tspan fill={AMBER} fontWeight={800}>heat</tspan> on
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene E (610-775): finished compost pours out
// ---------------------------------------------------------------------------
const Pour: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 610 || frame > 780) return null;
  const fadeIn = interpolate(frame, [610, 640], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [750, 780], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const mound = interpolate(frame, [630, 750], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pour: React.ReactElement[] = [];
  for (let i = 0; i < 120; i++) {
    const p = ((frame - 625 + random(`hcp-po-p-${i}`) * 60) % 90) / 90;
    const sx = 1420 + (random(`hcp-po-x-${i}`) - 0.5) * 120;
    const x = sx + p * p * 900;
    const y = 1420 + p * 420 - p * p * 160 + (random(`hcp-po-j-${i}`) - 0.5) * 40;
    pour.push(
      <circle key={i} cx={x} cy={y} r={7 + random(`hcp-po-z-${i}`) * 13} fill={i % 3 === 0 ? BARK : COMPOST} opacity={0.9} />
    );
  }
  const sparkle = 0.5 + 0.5 * Math.sin(frame * 0.25);
  return (
    <g opacity={fadeIn * fadeOut}>
      <text x={1920} y={480} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        STEP 05 — HARVEST THE BLACK GOLD
      </text>
      {/* bin with open hatch */}
      <g>
        <rect x={760} y={760} width={640} height={760} rx={24} fill={BARK} stroke={SOIL} strokeWidth={6} />
        {[0, 1, 2, 3].map((k) => (
          <line key={k} x1={760} y1={950 + k * 170} x2={1400} y2={950 + k * 170} stroke={SOIL} strokeWidth={8} />
        ))}
        <rect x={920} y={1290} width={320} height={230} rx={18} fill={COMPOST} stroke={AMBER} strokeWidth={6} filter="url(#hcpgrow)" />
        <text x={1080} y={1250} fill={CREAM} fontSize={34} fontFamily={MONO} textAnchor="middle">
          HARVEST HATCH
        </text>
      </g>
      {frame >= 625 && pour}
      {/* growing mound */}
      <ellipse cx={2650} cy={1700} rx={180 + mound * 520} ry={60 + mound * 200} fill={COMPOST} stroke={BARK} strokeWidth={6} />
      {mound > 0.5 && (
        <g opacity={interpolate(mound, [0.5, 0.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <rect x={2250} y={1420} width={800} height={110} rx={30} fill="rgba(163,230,53,0.14)" stroke={LIME} strokeWidth={4} />
          <text x={2650} y={1494} fill={LIME} fontSize={46} fontFamily={FONT} fontWeight={800} textAnchor="middle" opacity={0.6 + sparkle * 0.4}>
            FINISHED COMPOST
          </text>
        </g>
      )}
      <text x={1920} y={1960} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
        dark, crumbly, smells like forest floor — ready in 2–6 months
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene F (750-900): garden bed blooms
// ---------------------------------------------------------------------------
const Sprout: React.FC<{x: number; delay: number; frame: number; fps: number; flower: boolean}> = ({x, delay, frame, fps, flower}) => {
  const g = interpolate(frame - delay, [0, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (g <= 0) return null;
  const h = 320 * g;
  const ls = spring({frame: frame - delay - 40, fps, config: {damping: 200, stiffness: 110}});
  return (
    <g transform={`translate(${x}, 1500)`}>
      <path d={`M 0 0 Q ${20 * g} ${-h * 0.5} 0 ${-h}`} fill="none" stroke={LEAF} strokeWidth={16} strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g} />
      {ls > 0.01 && (
        <g opacity={Math.min(1, ls)}>
          <ellipse cx={-70 * Math.min(1, ls)} cy={-h * 0.72} rx={80 * Math.min(1, ls)} ry={34} fill={GREEN} transform={`rotate(-28 ${-70 * Math.min(1, ls)} ${-h * 0.72})`} />
          <ellipse cx={70 * Math.min(1, ls)} cy={-h * 0.72} rx={80 * Math.min(1, ls)} ry={34} fill={LIME} transform={`rotate(28 ${70 * Math.min(1, ls)} ${-h * 0.72})`} />
        </g>
      )}
      {flower && ls > 0.9 && (
        <g transform={`translate(0, ${-h - 40})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 52} cy={Math.sin((a * Math.PI) / 180) * 52} r={40} fill="#F9A8D4" />
          ))}
          <circle r={34} fill={AMBER} />
        </g>
      )}
    </g>
  );
};
const Bloom: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 750) return null;
  const fadeIn = interpolate(frame, [750, 780], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sunR = 150 + 18 * Math.sin(frame * 0.08);
  const sx = [900, 1250, 1600, 1950, 2300, 2650, 3000];
  const pollen: React.ReactElement[] = [];
  for (let i = 0; i < 60; i++) {
    const px = random(`hcp-pl-x-${i}`) * 3840;
    const py = ((random(`hcp-pl-y-${i}`) * 1400 + frame * (0.8 + random(`hcp-pl-v-${i}`))) % 1400) + 200;
    pollen.push(
      <circle key={i} cx={px} cy={py} r={4 + random(`hcp-pl-z-${i}`) * 7} fill={LIME} opacity={0.15 + 0.25 * (0.5 + 0.5 * Math.sin(frame * 0.2 + i))} />
    );
  }
  return (
    <g opacity={fadeIn}>
      {pollen}
      <circle cx={3150} cy={420} r={sunR * 2.4} fill="url(#hcpsung)" />
      <circle cx={3150} cy={420} r={sunR} fill={AMBER} filter="url(#hcpgrow)" />
      {/* raised bed */}
      <rect x={620} y={1460} width={2600} height={420} rx={30} fill={BARK} stroke={SOIL} strokeWidth={8} />
      <rect x={700} y={1400} width={2440} height={140} rx={30} fill={COMPOST} stroke={BROWN} strokeWidth={5} />
      {sx.map((x, i) => (
        <Sprout key={i} x={x} delay={765 + i * 14} frame={frame} fps={fps} flower={i === 3 || i === 5} />
      ))}
      <text x={1920} y={560} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        STEP 06 — FEED YOUR GARDEN
      </text>
      {(() => {
        const b = spring({frame: frame - 830, fps, config: {damping: 200, stiffness: 95}});
        if (b <= 0.01) return null;
        return (
          <g opacity={Math.min(1, b)} transform={`translate(1920, 1080) scale(${0.85 + Math.min(1, b) * 0.15})`}>
            <rect x={-560} y={-120} width={1120} height={240} rx={60} fill="rgba(8,18,11,0.92)" stroke={LIME} strokeWidth={5} filter="url(#hcpgrow)" />
            <text y={30} fill={LIME} fontSize={110} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              SCRAPS → SOIL → SUPPER
            </text>
          </g>
        );
      })()}
    </g>
  );
};

const Stage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => (
  <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
    <Defs p="hcp" />
    <Sort frame={frame} fps={fps} />
    <BinBuild frame={frame} fps={fps} />
    <Thermo frame={frame} fps={fps} />
    <Turn frame={frame} fps={fps} />
    <Pour frame={frame} fps={fps} />
    <Bloom frame={frame} fps={fps} />
  </svg>
);

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(200,220,180,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Backyard composting guide — keep meat, dairy and oils out of a home bin.
    </div>
  );
};

export const HomeCompostingProcess: React.FC = () => {
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
