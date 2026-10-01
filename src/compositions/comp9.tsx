/**
 * CropGrowthCycle.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A seed-to-harvest plant growth visual for agronomy content, farm
 * marketing and agtech decks: a sun-season arc (spring -> harvest) drives
 * five growth stages - seed, germination, tillering, flowering, harvest.
 * A wheat plant grows from a soil cross-section through spring leaves to a
 * golden grain head, with irrigation / pest-scout milestone flags, live
 * field metrics, a season dial, and a golden harvest payoff.
 * Deterministic seeded randomness only.
 *
 * Register in Root.tsx:
 *   <Composition id="CropGrowthCycle" component={CropGrowthCycle}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
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
// Palette (earthy green -> gold on a dark cinematic field)
// ---------------------------------------------------------------------------
const BG = '#0A120D';
const INK = '#F2F5EC';
const MUTED = 'rgba(242,245,236,0.60)';
const FAINT = 'rgba(242,245,236,0.34)';
const GREEN = '#4ADE80';
const DEEP_GREEN = '#2E9E5B';
const LEAF_DARK = '#1E5C38';
const GOLD = '#FBBF24';
const GOLD_DEEP = '#E8930C';
const GOLD_LIGHT = '#FDE68A';
const SKY_BLUE = '#7DD3FC';
const WATER_BLUE = '#67E8F9';
const SOIL_TOP = '#2C2317';
const SOIL_MID = '#20180F';
const SOIL_DEEP = '#150E08';
const ROOT = '#8A6F4D';
const PANEL = 'rgba(10,18,13,0.86)';
const HAIRLINE = 'rgba(242,245,236,0.13)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Timeline (frames at 60 fps) -> 900 frames = 15 s
// ---------------------------------------------------------------------------
interface Stage {
  key: string;
  name: string;
  bbch: string;
  dayRange: string;
  start: number;
  end: number;
  note: string;
}
const STAGES: Stage[] = [
  {key: 'SEED', name: 'Seed', bbch: 'BBCH 00', dayRange: 'DAY 0-7', start: 60, end: 180, note: 'Sowing depth 3 cm'},
  {key: 'GERM', name: 'Germination', bbch: 'BBCH 09', dayRange: 'DAY 7-21', start: 180, end: 320, note: 'Coleoptile emerges'},
  {key: 'TILL', name: 'Tillering', bbch: 'BBCH 21-29', dayRange: 'DAY 21-48', start: 320, end: 500, note: '7 productive tillers'},
  {key: 'FLOW', name: 'Flowering', bbch: 'BBCH 61', dayRange: 'DAY 48-72', start: 500, end: 640, note: 'Anthesis complete'},
  {key: 'HARV', name: 'Ripening - Harvest', bbch: 'BBCH 92', dayRange: 'DAY 72-112', start: 640, end: 900, note: 'Grain moisture 13.5%'},
];
const PAYOFF = 780;        // golden payoff begins
const IRRIG_FLAG_AT = 400; // irrigation milestone flag
const PEST_FLAG_AT = 600;  // pest-scout milestone flag

// ---------------------------------------------------------------------------
// Scene geometry
// ---------------------------------------------------------------------------
const GROUND_Y = 1560;
const BASE_X = 1150;
const STEM_MAX = 1010; // max stem height in px

// ---------------------------------------------------------------------------
// Growth helpers (all pure functions of frame)
// ---------------------------------------------------------------------------
const clampN = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

// Curved grass blade path: attach (x,y), angle from vertical in degrees,
// length, width. Returns a closed drooping blade shape.
function bladePath(x: number, y: number, angDeg: number, len: number, wid: number): string {
  const a = (angDeg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const px = Math.cos(a);
  const py = Math.sin(a);
  const mx = x + dx * len * 0.5;
  const my = y + dy * len * 0.5;
  const tx = x + dx * len + px * wid * 0.4;
  const ty = y + dy * len + len * 0.16;
  return (
    `M ${x.toFixed(1)} ${y.toFixed(1)} ` +
    `Q ${(mx + px * wid).toFixed(1)} ${(my + py * wid * 0.4).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} ` +
    `Q ${(mx - px * wid).toFixed(1)} ${(my - py * wid * 0.4).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)} Z`
  );
}

// ---------------------------------------------------------------------------
// SVG defs (gradients + glow filters)
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <radialGradient id="cgGlow" cx="50%" cy="36%" r="78%">
      <stop offset="0%" stopColor="rgba(74,222,128,0.13)" />
      <stop offset="52%" stopColor="rgba(74,222,128,0.045)" />
      <stop offset="100%" stopColor="rgba(10,18,13,0)" />
    </radialGradient>
    <radialGradient id="cgVignette" cx="50%" cy="50%" r="76%">
      <stop offset="58%" stopColor="rgba(4,7,5,0)" />
      <stop offset="100%" stopColor="rgba(2,4,3,0.78)" />
    </radialGradient>
    <linearGradient id="cgScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(253,230,138,0)" />
      <stop offset="50%" stopColor="rgba(253,230,138,0.14)" />
      <stop offset="100%" stopColor="rgba(253,230,138,0)" />
    </linearGradient>
    <linearGradient id="cgSoil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={SOIL_TOP} />
      <stop offset="55%" stopColor={SOIL_MID} />
      <stop offset="100%" stopColor={SOIL_DEEP} />
    </linearGradient>
    <linearGradient id="cgGoldCard" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="rgba(251,191,36,0.20)" />
      <stop offset="55%" stopColor="rgba(232,147,12,0.10)" />
      <stop offset="100%" stopColor="rgba(253,230,138,0.06)" />
    </linearGradient>
    <radialGradient id="cgSunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(255,224,150,0.9)" />
      <stop offset="45%" stopColor="rgba(255,214,120,0.28)" />
      <stop offset="100%" stopColor="rgba(255,214,120,0)" />
    </radialGradient>
    <filter id="cgBlur90" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="90" />
    </filter>
    <filter id="cgBlur24" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="24" />
    </filter>
    <filter id="cgSoftGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------
// Background: animated sky (spring -> harvest), travelling sun, drifting
// clouds, perspective field rows, glow orbs, dot texture, scan sweep
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const skyTop = interpolateColors(frame, [0, 450, 900], ['#0C1F31', '#0E2D40', '#2E2110']);
  const skyLow = interpolateColors(frame, [0, 450, 900], ['#123B34', '#164A3C', '#4A2E0E']);
  const horizonGlow = interpolateColors(frame, [0, 450, 900], ['rgba(62,156,110,0.20)', 'rgba(120,190,120,0.22)', 'rgba(245,158,11,0.30)']);

  // Sun travels an arc across the season: dawn left -> high noon -> low golden right
  const sunT = interpolate(frame, [60, 840], [0, 1], clamp01);
  const sunX = interpolate(sunT, [0, 1], [520, 3320]);
  const sunY = 720 - Math.sin(sunT * Math.PI) * 500;
  const sunColor = interpolateColors(frame, [0, 450, 900], ['#DFF3FF', '#FFF4C8', '#FFD97A']);

  // Drifting clouds (seeded, wrap around)
  const clouds: React.ReactElement[] = [];
  for (let i = 0; i < 6; i++) {
    const seedX = random(`cg-cloud-x-${i}`) * 4200;
    const seedY = 200 + random(`cg-cloud-y-${i}`) * 620;
    const speed = 0.25 + random(`cg-cloud-s-${i}`) * 0.5;
    const cx = ((seedX + frame * speed * 3) % 4400) - 300;
    const cw = 320 + random(`cg-cloud-w-${i}`) * 320;
    const co = 0.10 + random(`cg-cloud-o-${i}`) * 0.10;
    clouds.push(
      <g key={i} opacity={co}>
        <ellipse cx={cx} cy={seedY} rx={cw} ry={44} fill="#EAF2F8" filter="url(#cgBlur24)" />
        <ellipse cx={cx + cw * 0.3} cy={seedY - 30} rx={cw * 0.55} ry={32} fill="#EAF2F8" filter="url(#cgBlur24)" />
      </g>
    );
  }

  // Perspective field rows converging at the horizon
  const rows: React.ReactElement[] = [];
  for (let i = 0; i < 17; i++) {
    const t = i / 16;
    const bx = 200 + t * 3440;
    const hx = 1920 + (t - 0.5) * 900;
    rows.push(
      <line key={i} x1={bx} y1={2160} x2={hx} y2={GROUND_Y} stroke="rgba(242,245,236,0.055)" strokeWidth={2.5} />
    );
  }

  // Slow-drifting glow orbs tinted by the season
  const orbs: React.ReactElement[] = [];
  for (let i = 0; i < 4; i++) {
    const ox = random(`cg-orb-x-${i}`) * 3840;
    const oy = 300 + random(`cg-orb-y-${i}`) * 1200;
    const r = 300 + random(`cg-orb-r-${i}`) * 260;
    const tint = interpolateColors(frame, [0, 450, 900], ['rgba(74,222,128,0.08)', 'rgba(74,222,128,0.09)', 'rgba(251,191,36,0.10)']);
    const mx = Math.sin((frame / 900) * Math.PI * 2 + i * 1.9) * 130;
    const my = Math.cos((frame / 900) * Math.PI * 2 + i * 2.4) * 90;
    orbs.push(<circle key={i} cx={ox + mx} cy={oy + my} r={r} fill={tint} filter="url(#cgBlur90)" />);
  }

  // Fine dot texture (high-frequency detail, sparse)
  const dots: React.ReactElement[] = [];
  for (let gx = 80; gx < 3840; gx += 170) {
    for (let gy = 80; gy < 2160; gy += 170) {
      dots.push(
        <circle key={`${gx}-${gy}`} cx={gx} cy={gy} r={2.2} fill="rgba(242,245,236,0.055)" />
      );
    }
  }

  // Drifting pollen / chaff motes (per-frame motion)
  const motes: React.ReactElement[] = [];
  for (let i = 0; i < 60; i++) {
    const seedX = random(`cg-mote-x-${i}`) * 3840;
    const seedY = random(`cg-mote-y-${i}`) * 1500;
    const spd = 0.6 + random(`cg-mote-s-${i}`) * 1.4;
    const x = (seedX + frame * spd * 2.2) % 3840;
    const y = seedY + Math.sin(frame * 0.03 + i * 1.3) * 46;
    const o = 0.10 + random(`cg-mote-o-${i}`) * 0.22;
    const s = 3 + random(`cg-mote-z-${i}`) * 4;
    const c = random(`cg-mote-c-${i}`) > 0.6 ? GOLD_LIGHT : '#FFFFFF';
    motes.push(<rect key={i} x={x} y={y} width={s} height={s * 0.6} fill={c} opacity={o} transform={`rotate(${frame * 0.6 + i * 40} ${x} ${y})`} />);
  }

  const scanY = (frame / 900) * 2400 - 240;

  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: BG}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        {/* sky gradient */}
        <rect x={0} y={0} width={3840} height={GROUND_Y} fill={skyTop} />
        <rect x={0} y={GROUND_Y - 700} width={3840} height={700} fill={skyLow} opacity={0.55} />
        {/* horizon band */}
        <rect x={0} y={GROUND_Y - 260} width={3840} height={260} fill={horizonGlow} filter="url(#cgBlur90)" />
        {clouds}
        {/* sun */}
        <circle cx={sunX} cy={sunY} r={150} fill="url(#cgSunGlow)" />
        <circle cx={sunX} cy={sunY} r={64} fill={sunColor} style={{filter: 'drop-shadow(0 0 42px rgba(255,217,122,0.75))'}} />
        {/* ground */}
        <rect x={0} y={GROUND_Y} width={3840} height={2160 - GROUND_Y} fill="#0D140E" />
        <rect x={0} y={GROUND_Y} width={3840} height={14} fill="rgba(74,222,128,0.28)" />
        {rows}
        {orbs}
        {dots}
        {motes}
        <rect x={0} y={scanY} width={3840} height={320} fill="url(#cgScan)" />
        <rect width={3840} height={2160} fill="url(#cgGlow)" />
        <rect width={3840} height={2160} fill="url(#cgVignette)" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Title bar (top-left) + field-cam pill (top-right)
// ---------------------------------------------------------------------------
const TitleBar: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const rise = spring({frame, fps, config: {damping: 200, stiffness: 90, mass: 1}});
  const y = interpolate(rise, [0, 1], [70, 0]);
  const opacity = interpolate(rise, [0, 1], [0, 1]);
  const day = interpolate(frame, [60, 780], [0, 112], clamp01);
  const blink = 0.55 + 0.45 * Math.sin((frame / 60) * Math.PI * 2);
  return (
    <div style={{position: 'absolute', top: 110, left: 220, right: 220, opacity, transform: `translateY(${y}px)`}}>
      <div style={{display: 'flex', alignItems: 'flex-start'}}>
        <div>
          <div style={{fontFamily: MONO, fontSize: 44, letterSpacing: 14, color: GREEN}}>
            FIELD SERIES &nbsp;·&nbsp; WHEAT
          </div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 148, color: INK, marginTop: 16, letterSpacing: -2, textShadow: '0 6px 40px rgba(0,0,0,0.55)'}}>
            Crop Growth Cycle
          </div>
          <div style={{fontFamily: FONT, fontSize: 40, color: MUTED, marginTop: 14}}>
            Seed &rarr; germination &rarr; tillering &rarr; flowering &rarr; harvest &middot; one season in 15 seconds
          </div>
        </div>
        <div style={{marginLeft: 'auto', textAlign: 'right'}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 22, border: `2px solid ${GREEN}`, borderRadius: 16, padding: '14px 32px', backgroundColor: 'rgba(7,12,9,0.6)'}}>
            <div style={{width: 24, height: 24, borderRadius: 12, backgroundColor: GOLD, opacity: blink, boxShadow: `0 0 26px ${GOLD}`}} />
            <div style={{fontFamily: MONO, fontSize: 40, fontWeight: 700, color: INK}}>
              DAY {String(Math.floor(day)).padStart(3, '0')} / 112
            </div>
          </div>
          <div style={{fontFamily: MONO, fontSize: 32, color: FAINT, marginTop: 14}}>
            FIELD CAM 04 &middot; LIVE SEASON REPLAY
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Soil cross-section: layered soil, seed, growing root system, moisture shimmer
// ---------------------------------------------------------------------------
const SoilRoots: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  // Seed visible until germination; shrinks as the shoot takes over
  const seedF = interpolate(frame, [150, 300], [1, 0], clamp01);
  // Root growth follows the plant growth
  const rootG = interpolate(frame, [90, 560], [0, 1], clamp01);
  const moisture = 58 + 16 * interpolate(frame, [IRRIG_FLAG_AT, IRRIG_FLAG_AT + 90], [0, 1], clamp01) + 2 * Math.sin(frame * 0.06);
  const shimmer = 0.10 + 0.08 * Math.sin(frame * 0.09);

  const pebbles: React.ReactElement[] = [];
  for (let i = 0; i < 130; i++) {
    const px = 300 + random(`cg-peb-x-${i}`) * 1700;
    const py = GROUND_Y + 26 + random(`cg-peb-y-${i}`) * 190;
    const pr = 2.5 + random(`cg-peb-r-${i}`) * 6;
    const po = 0.16 + random(`cg-peb-o-${i}`) * 0.22;
    pebbles.push(<circle key={i} cx={px} cy={py} r={pr} fill="#0E0A06" opacity={po} />);
  }

  // Root system: 7 primary roots fanning from the seed point
  const roots: React.ReactElement[] = [];
  const seedX = BASE_X;
  const seedY = GROUND_Y + 130;
  for (let i = 0; i < 7; i++) {
    const ang = -62 + i * 20; // degrees from straight-down, spread fan
    const a = (ang * Math.PI) / 180;
    const len = (150 + random(`cg-root-l-${i}`) * 120) * rootG;
    if (len < 4) continue;
    const ex = seedX + Math.sin(a) * len;
    const ey = seedY + Math.cos(a) * len * 0.9;
    const cx1 = seedX + Math.sin(a) * len * 0.4;
    const cy1 = seedY + Math.cos(a) * len * 0.55 + 18;
    roots.push(
      <g key={i}>
        <path
          d={`M ${seedX} ${seedY} Q ${cx1.toFixed(1)} ${cy1.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`}
          fill="none"
          stroke={ROOT}
          strokeWidth={7 - i * 0.4}
          strokeLinecap="round"
          opacity={0.9}
        />
        {/* root hairs */}
        {i % 2 === 0 && (
          <g>
            {[0.35, 0.55, 0.75].map((t, k) => {
              const hx = seedX + (ex - seedX) * t;
              const hy = seedY + (ey - seedY) * t;
              const hd = k % 2 === 0 ? 1 : -1;
              return (
                <line key={k} x1={hx} y1={hy} x2={hx + hd * 26} y2={hy + 10} stroke={ROOT} strokeWidth={2.5} opacity={0.55} />
              );
            })}
          </g>
        )}
      </g>
    );
  }

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      {/* soil block */}
      <rect x={300} y={GROUND_Y} width={1700} height={240} fill="url(#cgSoil)" rx={18} />
      <rect x={300} y={GROUND_Y} width={1700} height={240} fill="none" stroke={HAIRLINE} strokeWidth={2} rx={18} />
      {pebbles}
      {/* moisture shimmer band */}
      <rect x={300} y={GROUND_Y + 96} width={1700} height={60} fill={WATER_BLUE} opacity={shimmer} filter="url(#cgBlur24)" />
      <text x={340} y={GROUND_Y + 214} fill={MUTED} fontSize={28} fontFamily={MONO} letterSpacing={3}>
        SOIL PROFILE · MOISTURE {moisture.toFixed(1)}%
      </text>
      {roots}
      {/* the seed, shrinking as it germinates */}
      {seedF > 0.01 && (
        <g opacity={seedF}>
          <ellipse
            cx={seedX}
            cy={seedY}
            rx={34 * seedF + 6}
            ry={24 * seedF + 4}
            fill="#C9A25E"
            stroke="#8A6A35"
            strokeWidth={4}
            transform={`rotate(-24 ${seedX} ${seedY})`}
          />
          <ellipse cx={seedX - 8} cy={seedY - 6} rx={10 * seedF + 2} ry={6 * seedF + 2} fill="#E8C98A" opacity={0.8} />
        </g>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// The growing wheat plant: main stem, tillers, leaves, wheat heads
// ---------------------------------------------------------------------------
const Plant: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  // Overall growth (springy, slightly overshooting like real growth)
  const gRaw = spring({frame: frame - 90, fps, config: {damping: 200, stiffness: 92, mass: 1}});
  const g = clampN(gRaw, 0, 1.02);

  // Color shift: lush green -> golden as the season turns to harvest
  const leafGreen = interpolateColors(frame, [520, 780], ['#4ADE80', '#E3B23C']);
  const leafGreen2 = interpolateColors(frame, [520, 780], ['#2E9E5B', '#C9922A']);
  const headColor = interpolateColors(frame, [520, 640, 800], ['#4ADE80', '#D9A527', '#FBBF24']);
  const headStroke = interpolateColors(frame, [520, 640, 800], ['#2E9E5B', '#A8761B', '#B97809']);

  const elements: React.ReactElement[] = [];

  // --- main stem ---
  const topY = GROUND_Y - g * STEM_MAX;
  const stemD =
    `M ${BASE_X} ${GROUND_Y} ` +
    `C ${(BASE_X - 34 * g).toFixed(1)} ${(GROUND_Y - 0.36 * STEM_MAX * g).toFixed(1)} ` +
    `${(BASE_X + 30 * g).toFixed(1)} ${(GROUND_Y - 0.68 * STEM_MAX * g).toFixed(1)} ` +
    `${(BASE_X + 12 * g).toFixed(1)} ${topY.toFixed(1)}`;
  if (g > 0.01) {
    elements.push(
      <path key="stem" d={stemD} fill="none" stroke={leafGreen2} strokeWidth={16} strokeLinecap="round" />
    );
  }

  // --- main-stem leaves (5, alternating) ---
  for (let i = 0; i < 5; i++) {
    const t = 0.22 + i * 0.16; // attach point along stem
    const lg = spring({frame: frame - 150 - i * 45, fps, config: {damping: 200, stiffness: 100}});
    const ls = clampN(lg, 0, 1.05);
    if (ls <= 0.01 || g <= 0.05) continue;
    const ax = BASE_X + 12 * g * t;
    const ay = GROUND_Y - STEM_MAX * g * t;
    const ang = (i % 2 === 0 ? -1 : 1) * (46 + i * 7);
    const len = (250 - i * 22) * ls;
    elements.push(
      <path
        key={`ml${i}`}
        d={bladePath(ax, ay, ang, len, 44)}
        fill={i % 2 === 0 ? leafGreen : leafGreen2}
        opacity={0.96}
        style={{filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.35))'}}
      />
    );
  }

  // --- tillers: 3 side shoots with their own delayed springs ---
  const tillers = [
    {ang: -34, delay: 210, len: 0.78, off: -26},
    {ang: 30, delay: 250, len: 0.72, off: 26},
    {ang: -16, delay: 290, len: 0.64, off: -12},
  ];
  tillers.forEach((tl, ti) => {
    const tg = spring({frame: frame - tl.delay, fps, config: {damping: 200, stiffness: 96}});
    const ts = clampN(tg, 0, 1.04);
    if (ts <= 0.01) return;
    const a = (tl.ang * Math.PI) / 180;
    const bx = BASE_X + tl.off;
    const llen = STEM_MAX * tl.len * ts;
    const ex = bx + Math.sin(a) * llen;
    const ey = GROUND_Y - Math.cos(a) * llen;
    const cx = bx + Math.sin(a) * llen * 0.5 + (tl.ang > 0 ? 30 : -30) * ts;
    const cy = GROUND_Y - Math.cos(a) * llen * 0.55;
    elements.push(
      <path
        key={`ts${ti}`}
        d={`M ${bx} ${GROUND_Y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`}
        fill="none"
        stroke={leafGreen2}
        strokeWidth={12}
        strokeLinecap="round"
      />
    );
    // two leaves per tiller
    [0.45, 0.7].forEach((t, li) => {
      const lag = spring({frame: frame - tl.delay - 60 - li * 40, fps, config: {damping: 200, stiffness: 105}});
      const lls = clampN(lag, 0, 1.04);
      if (lls <= 0.01) return;
      const ax = bx + (ex - bx) * t;
      const ay = GROUND_Y + (ey - GROUND_Y) * t;
      const lang = tl.ang + (li % 2 === 0 ? -44 : 44);
      elements.push(
        <path
          key={`tl${ti}l${li}`}
          d={bladePath(ax, ay, lang, 170 * lls, 34)}
          fill={li % 2 === 0 ? leafGreen : leafGreen2}
          opacity={0.95}
        />
      );
    });
    // small head on each tiller once flowering starts
    const tf = interpolate(frame, [540 + ti * 30, 640 + ti * 30], [0, 1], clamp01);
    if (tf > 0.01) {
      elements.push(
        <g key={`th${ti}`} opacity={tf}>
          <line x1={ex} y1={ey} x2={ex} y2={ey - 90 * tf} stroke={headStroke} strokeWidth={9} strokeLinecap="round" />
          {[0.3, 0.55, 0.8].map((gt, gi) => (
            <g key={gi}>
              <ellipse cx={ex - 16 * tf} cy={ey - 90 * tf * gt} rx={13 * tf} ry={22 * tf} fill={headColor} transform={`rotate(-28 ${ex - 16 * tf} ${ey - 90 * tf * gt})`} />
              <ellipse cx={ex + 16 * tf} cy={ey - 90 * tf * gt} rx={13 * tf} ry={22 * tf} fill={headColor} transform={`rotate(28 ${ex + 16 * tf} ${ey - 90 * tf * gt})`} />
            </g>
          ))}
        </g>
      );
    }
  });

  // --- main wheat head: emerges at flowering, fills through ripening ---
  const flowerF = interpolate(frame, [500, 620], [0, 1], clamp01);
  if (flowerF > 0.01 && g > 0.5) {
    const hx = BASE_X + 12 * g;
    const hy = topY;
    const headLen = 210 * flowerF;
    const grains: React.ReactElement[] = [];
    const nG = 9;
    for (let gi = 0; gi < nG; gi++) {
      const t = 0.18 + (gi / (nG - 1)) * 0.78;
      const gy = hy - headLen * t;
      const gw = 30 * flowerF * (1 - t * 0.45);
      const gh = 44 * flowerF * (1 - t * 0.35);
      const sway = Math.sin(frame * 0.04 + gi * 0.8) * 6 * t;
      grains.push(
        <g key={gi}>
          <ellipse cx={hx - gw * 0.8 + sway} cy={gy} rx={gw} ry={gh} fill={headColor} stroke={headStroke} strokeWidth={3} transform={`rotate(-24 ${hx - gw * 0.8 + sway} ${gy})`} />
          <ellipse cx={hx + gw * 0.8 + sway} cy={gy} rx={gw} ry={gh} fill={headColor} stroke={headStroke} strokeWidth={3} transform={`rotate(24 ${hx + gw * 0.8 + sway} ${gy})`} />
        </g>
      );
    }
    // awns: fine bristles fanning from the top grains
    const awns: React.ReactElement[] = [];
    for (let ai = 0; ai < 11; ai++) {
      const aa = -72 + ai * 13.5;
      const ar = (aa * Math.PI) / 180;
      const ax0 = hx;
      const ay0 = hy - headLen * 0.9;
      awns.push(
        <line
          key={ai}
          x1={ax0}
          y1={ay0}
          x2={ax0 + Math.sin(ar) * 120 * flowerF}
          y2={ay0 - Math.cos(ar) * 120 * flowerF}
          stroke={headStroke}
          strokeWidth={2.5}
          opacity={0.85}
        />
      );
    }
    elements.push(
      <g key="head" opacity={flowerF}>
        <line x1={hx} y1={hy} x2={hx} y2={hy - headLen} stroke={headStroke} strokeWidth={12} strokeLinecap="round" />
        {awns}
        {grains}
        <circle cx={hx} cy={hy - headLen} r={34 * flowerF} fill={headColor} opacity={0.9} filter="url(#cgSoftGlow)" />
      </g>
    );
  }

  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      {elements}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Milestone flags staked beside the plant: irrigation + pest scout
// ---------------------------------------------------------------------------
const MilestoneFlags: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const flags = [
    {x: 1780, at: IRRIG_FLAG_AT, color: WATER_BLUE, title: 'IRRIGATION', sub: 'BBCH 25 · +18% MOISTURE', dark: '#0A2E3A'},
    {x: 2120, at: PEST_FLAG_AT, color: GOLD, title: 'PEST SCOUT', sub: 'BBCH 61 · BENEFICIALS OK', dark: '#3A2A08'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      <Defs />
      {flags.map((f, i) => {
        const s = spring({frame: frame - f.at, fps, config: {damping: 200, stiffness: 90}});
        if (s <= 0.001) return null;
        const poleH = 430 * s;
        const wave = Math.sin(frame * 0.12 + i * 2) * 14;
        const flagD =
          `M ${f.x} ${GROUND_Y - poleH} ` +
          `Q ${f.x + 110} ${GROUND_Y - poleH + 12 + wave} ${f.x + 230} ${GROUND_Y - poleH + wave} ` +
          `L ${f.x + 230} ${GROUND_Y - poleH + 120 + wave} ` +
          `Q ${f.x + 110} ${GROUND_Y - poleH + 118 + wave} ${f.x} ${GROUND_Y - poleH + 108} Z`;
        return (
          <g key={i} opacity={Math.min(1, s)}>
            <rect x={f.x - 7} y={GROUND_Y - poleH} width={14} height={poleH} fill="#C8BFAE" rx={7} />
            <circle cx={f.x} cy={GROUND_Y - poleH} r={16} fill={f.color} filter="url(#cgSoftGlow)" />
            <path d={flagD} fill={f.color} opacity={0.92} stroke={f.dark} strokeWidth={3} />
            <text x={f.x + 18} y={GROUND_Y - poleH + 62 + wave * 0.4} fill={f.dark} fontSize={40} fontFamily={MONO} fontWeight={800} letterSpacing={4}>
              {f.title}
            </text>
            <text x={f.x} y={GROUND_Y + 52} fill={f.color} fontSize={30} fontFamily={MONO} letterSpacing={2}>
              {f.sub}
            </text>
            <line x1={f.x} y1={GROUND_Y + 66} x2={f.x + 300} y2={GROUND_Y + 66} stroke={f.color} strokeWidth={2} opacity={0.4} />
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Stage rail: five growth stages on the left (vertical stepper)
// ---------------------------------------------------------------------------
const StageRail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 30, fps, config: {damping: 200, stiffness: 80}});
  const RX = 140;
  const RY = 560;
  const ROW_H = 168;
  const DOT_X = RX + 80;
  const rowY = (i: number) => RY + 60 + i * ROW_H;
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < STAGES.length; i++) {
    const st = STAGES[i];
    const s = spring({frame: frame - st.start, fps, config: {damping: 200, stiffness: 110}});
    if (s <= 0.001) continue;
    const done = frame >= st.end;
    const current = frame >= st.start && frame < st.end;
    const pulse = current ? 0.6 + 0.4 * Math.sin((frame / 60) * Math.PI * 2) : 1;
    const dy = rowY(i);
    dots.push(
      <g key={i} opacity={Math.min(1, s)}>
        {i < STAGES.length - 1 && (
          <line
            x1={DOT_X}
            y1={dy + 36}
            x2={DOT_X}
            y2={dy + ROW_H - 36}
            stroke={done ? GREEN : 'rgba(242,245,236,0.16)'}
            strokeWidth={done ? 7 : 4}
            strokeLinecap="round"
          />
        )}
        <circle
          cx={DOT_X}
          cy={dy}
          r={30}
          fill={done ? GREEN : current ? 'rgba(74,222,128,0.22)' : 'rgba(242,245,236,0.10)'}
          stroke={done || current ? GREEN : 'rgba(242,245,236,0.35)'}
          strokeWidth={4}
          opacity={pulse}
        />
        {done && (
          <text x={DOT_X} y={dy + 13} fill="#06281C" fontSize={32} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            ✓
          </text>
        )}
        <text
          x={DOT_X + 58}
          y={dy - 2}
          fill={done ? GREEN : current ? INK : MUTED}
          fontSize={40}
          fontFamily={FONT}
          fontWeight={800}
          letterSpacing={2}
        >
          {st.name.toUpperCase()}
        </text>
        <text x={DOT_X + 58} y={dy + 44} fill={done || current ? GREEN : FAINT} fontSize={29} fontFamily={MONO} letterSpacing={3}>
          {st.bbch} · {st.dayRange}
        </text>
        <text x={DOT_X + 58} y={dy + 82} fill={FAINT} fontSize={26} fontFamily={MONO} letterSpacing={1}>
          {st.note.toUpperCase()}
        </text>
      </g>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={RX} y={RY - 40} width={520} height={STAGES.length * ROW_H + 130} rx={22} fill={PANEL} stroke={HAIRLINE} strokeWidth={2} />
        <text x={RX + 40} y={RY + 4} fill={GREEN} fontSize={30} fontFamily={MONO} letterSpacing={8}>
          GROWTH STAGES
        </text>
        {dots}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Live field metrics (right panel): temp, rainfall, GDD, moisture, NDVI +
// per-frame drifting sparklines
// ---------------------------------------------------------------------------
interface Metric {
  label: string;
  unit: string;
  get: (f: number) => number;
  fmt: (v: number) => string;
}
const METRICS: Metric[] = [
  {
    label: 'AIR TEMP',
    unit: '°C',
    get: (f) =>
      14.2 +
      11.8 * interpolate(f, [60, 840], [0, 1], clamp01) +
      0.6 * Math.sin(f * 0.05) +
      0.25 * Math.sin(f * 0.31),
    fmt: (v) => v.toFixed(1),
  },
  {
    label: 'RAINFALL',
    unit: 'MM',
    get: (f) => 4.2 + f * 0.011 + 0.35 * Math.sin(f * 0.07),
    fmt: (v) => v.toFixed(1),
  },
  {
    label: 'GDD (GROWING DEGREE DAYS)',
    unit: 'UNITS',
    get: (f) => 1280 * interpolate(f, [60, 840], [0, 1], clamp01) + 2 * Math.sin(f * 0.09),
    fmt: (v) => Math.round(v).toString(),
  },
  {
    label: 'SOIL MOISTURE',
    unit: '%',
    get: (f) =>
      58 +
      16 * interpolate(f, [IRRIG_FLAG_AT, IRRIG_FLAG_AT + 90], [0, 1], clamp01) +
      1.6 * Math.sin(f * 0.08),
    fmt: (v) => v.toFixed(1),
  },
  {
    label: 'NDVI (CANOPY INDEX)',
    unit: '',
    get: (f) =>
      0.18 +
      0.73 * interpolate(f, [150, 700], [0, 1], clamp01) +
      0.008 * Math.sin(f * 0.11),
    fmt: (v) => v.toFixed(2),
  },
];

const FieldMetrics: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 200, fps, config: {damping: 200, stiffness: 80}});
  const live = 0.55 + 0.45 * Math.sin((frame / 60) * Math.PI * 2);
  const PX = 2440;
  const PW = 1180;
  const PY = 380;
  const ROWH = 150;
  const rows: React.ReactElement[] = [];
  METRICS.forEach((m, mi) => {
    const s = spring({frame: frame - (200 + mi * 28), fps, config: {damping: 200, stiffness: 120}});
    if (s <= 0.001) return;
    const val = m.get(frame);
    const ry = PY + 96 + mi * ROWH;
    // seeded sparkline: deterministic random walk, progressively revealed
    const n = 24;
    const show = Math.max(2, Math.floor(interpolate(frame, [200, 560], [2, n], clamp01)));
    const raw: number[] = [];
    let v = random(`cg-sp-base-${mi}`) * 8 + 3;
    for (let k = 0; k < n; k++) {
      v += (random(`cg-sp-${mi}-${k}`) - 0.44) * 2.4;
      raw.push(v);
    }
    const lo = Math.min(...raw);
    const hi = Math.max(...raw);
    const sx0 = PX + 40;
    const sw = PW - 520;
    const sy0 = ry + 96;
    const sh = 62;
    const pts = raw
      .slice(0, show)
      .map(
        (p, k) =>
          `${(sx0 + (k / (n - 1)) * sw).toFixed(1)},${(sy0 - ((p - lo) / (hi - lo || 1)) * sh).toFixed(1)}`
      )
      .join(' ');
    const lastX = sx0 + ((show - 1) / (n - 1)) * sw;
    const lastY = sy0 - ((raw[show - 1] - lo) / (hi - lo || 1)) * sh;
    rows.push(
      <g key={mi} opacity={Math.min(1, s)}>
        <line x1={PX + 40} y1={ry + 122} x2={PX + PW - 40} y2={ry + 122} stroke="rgba(242,245,236,0.07)" strokeWidth={1.5} />
        <text x={PX + 40} y={ry + 8} fill={MUTED} fontSize={29} fontFamily={MONO} letterSpacing={4}>
          {m.label}
        </text>
        <polyline points={pts} fill="none" stroke={GREEN} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r={9} fill={GREEN} style={{filter: 'drop-shadow(0 0 10px rgba(74,222,128,0.9))'}} />
        <text x={PX + PW - 40} y={ry + 42} fill={INK} fontSize={58} fontFamily={MONO} fontWeight={800} textAnchor="end">
          {m.fmt(val)}
          <tspan fill={FAINT} fontSize={30} fontWeight={400}> {m.unit}</tspan>
        </text>
      </g>
    );
  });
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <rect x={PX} y={PY} width={PW} height={METRICS.length * ROWH + 120} rx={22} fill={PANEL} stroke={HAIRLINE} strokeWidth={2} />
        <circle cx={PX + 44} cy={PY + 46} r={13} fill={GOLD} opacity={live} style={{filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.9))'}} />
        <text x={PX + 76} y={PY + 58} fill={GOLD} fontSize={32} fontFamily={MONO} letterSpacing={8}>
          FIELD METRICS · LIVE
        </text>
        {rows}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Season dial: a sun-pointer travelling a spring -> harvest arc
// ---------------------------------------------------------------------------
const SeasonDial: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - 260, fps, config: {damping: 200, stiffness: 80}});
  const CXD = 3030;
  const CYD = 1190;
  const RD = 262;
  const t = interpolate(frame, [60, 840], [0, 1], clamp01);
  const arcPath = `M ${CXD - RD} ${CYD} A ${RD} ${RD} 0 0 1 ${CXD + RD} ${CYD}`;
  const SEASONS = ['SOW', 'EMERGE', 'TILLER', 'ANTHESIS', 'HARVEST'];
  const ticks: React.ReactElement[] = [];
  for (let i = 0; i < SEASONS.length; i++) {
    const a = Math.PI + (i / (SEASONS.length - 1)) * Math.PI;
    const reached = t * (SEASONS.length - 1) >= i;
    const x1 = CXD + (RD - 24) * Math.cos(a);
    const y1 = CYD + (RD - 24) * Math.sin(a);
    const x2 = CXD + (RD + 24) * Math.cos(a);
    const y2 = CYD + (RD + 24) * Math.sin(a);
    const lx = CXD + (RD + 74) * Math.cos(a);
    const ly = CYD + (RD + 74) * Math.sin(a);
    ticks.push(
      <g key={i}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={reached ? GOLD : 'rgba(242,245,236,0.25)'} strokeWidth={reached ? 7 : 4} strokeLinecap="round" />
        <text
          x={lx}
          y={ly + 11}
          fill={reached ? GOLD : FAINT}
          fontSize={30}
          fontFamily={MONO}
          fontWeight={700}
          letterSpacing={3}
          textAnchor="middle"
        >
          {SEASONS[i]}
        </text>
      </g>
    );
  }
  const pa = Math.PI + t * Math.PI;
  const px = CXD + RD * Math.cos(pa);
  const py = CYD + RD * Math.sin(pa);
  const day = Math.floor(interpolate(frame, [60, 780], [0, 112], clamp01));
  const temp = 14.2 + 11.8 * t + 0.6 * Math.sin(frame * 0.05);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, enter)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs />
        <circle cx={CXD} cy={CYD} r={RD + 96} fill="rgba(10,18,13,0.55)" stroke={HAIRLINE} strokeWidth={2} />
        <text x={CXD} y={CYD - RD - 118} fill={GREEN} fontSize={30} fontFamily={MONO} letterSpacing={8} textAnchor="middle">
          SEASON DIAL
        </text>
        <circle cx={CXD} cy={CYD} r={RD} fill="none" stroke="rgba(242,245,236,0.12)" strokeWidth={10} />
        <path
          d={arcPath}
          fill="none"
          stroke={GOLD}
          strokeWidth={12}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - t}
          style={{filter: 'drop-shadow(0 0 14px rgba(251,191,36,0.6))'}}
        />
        {ticks}
        <circle cx={px} cy={py} r={44} fill="rgba(253,230,138,0.20)" />
        <circle cx={px} cy={py} r={22} fill="#FDE68A" style={{filter: 'drop-shadow(0 0 22px rgba(253,230,138,0.95))'}} />
        <text x={CXD} y={CYD - 30} fill={GOLD} fontSize={34} fontFamily={MONO} letterSpacing={6} textAnchor="middle">
          DAY
        </text>
        <text x={CXD} y={CYD + 110} fill={INK} fontSize={150} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {String(day).padStart(3, '0')}
        </text>
        <text x={CXD} y={CYD + 172} fill={MUTED} fontSize={34} fontFamily={MONO} textAnchor="middle">
          / 112 · {temp.toFixed(1)}°C
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Golden harvest payoff banner
// ---------------------------------------------------------------------------
const PayoffBanner: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame: frame - PAYOFF, fps, config: {damping: 200, stiffness: 70}});
  if (enter <= 0.001) return null;
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const yieldT = interpolate(frame, [PAYOFF, PAYOFF + 60], [0, 8.2], clamp01);
  const w = interpolate(frame, [PAYOFF, PAYOFF + 70], [0, 2000], clamp01);
  const flash = interpolate(frame, [PAYOFF + 60, PAYOFF + 110], [0, 1], clamp01);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `translateY(${(1 - enter) * 70}px)`,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(8,12,8,0.94)',
          border: `3px solid ${GOLD}`,
          borderRadius: 26,
          padding: '44px 120px',
          textAlign: 'center',
          boxShadow: `0 0 130px rgba(251,191,36,${0.25 + flash * 0.3})`,
        }}
      >
        <div style={{fontFamily: MONO, fontSize: 42, letterSpacing: 16, color: GOLD}}>HARVEST COMPLETE</div>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 104, color: INK, marginTop: 10, textShadow: '0 0 60px rgba(251,191,36,0.45)'}}>
          {yieldT.toFixed(1)} T / HA
        </div>
        <div style={{fontFamily: MONO, fontSize: 36, color: MUTED, marginTop: 12, letterSpacing: 2}}>
          GRAIN MOISTURE 13.5% · BBCH 92 · YIELD MAP VERIFIED
        </div>
        <div style={{width: 2000, maxWidth: '100%', height: 12, backgroundColor: 'rgba(242,245,236,0.10)', borderRadius: 6, margin: '28px auto 0', overflow: 'hidden'}}>
          <div style={{width: w, maxWidth: '100%', height: '100%', background: 'linear-gradient(90deg,#E8930C,#FBBF24,#FDE68A)', borderRadius: 6}} />
        </div>
      </div>
    </div>
  );
};


// ---------------------------------------------------------------------------
// Texture overlays: ambient particles, fine dither, top ticker, corner HUD.
// Full-frame per-frame motion + cinematic grain support. Self-contained.
// ---------------------------------------------------------------------------
const MONO_cg = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const TEAL_cg = '#2DD4BF';
const CYAN_cg = '#67E8F9';

const AmbientParticles_cg: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`cg-amb-x-${i}`) * 3840;
    const by = random(`cg-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`cg-amb-s-${i}`) * 1.4;
    const ang = random(`cg-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`cg-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? CYAN_cg : i % 4 === 1 ? TEAL_cg : 'rgba(234,242,251,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_cg: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`cg-dth-x-${i}`) * 3840;
    const by = random(`cg-dth-y-${i}`) * 2160;
    const jx = (random(`cg-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`cg-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`cg-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`cg-dth-s-${i}`) * 2;
    specks.push(
      <rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#CFE9FF" opacity={o} />
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_cg = [
  'BBCH 00 SOWN',
  'DAY 7-21 EMERGE',
  'BBCH 21-29 TILLER',
  'DAY 48-72 ANTHESIS',
  'BBCH 61 BENEFICIALS OK',
  'DAY 72-112 GRAIN FILL',
  'BBCH 92 HARVEST',
  'YIELD 8.2 T/HA'
];
const TickerTape_cg: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_cg.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(103,232,249,0.60)" fontSize={27} fontFamily={MONO_cg} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(3,7,14,0.66)', borderBottom: '1px solid rgba(234,242,251,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_cg: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(45,212,191,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={TEAL_cg} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? TEAL_cg : 'rgba(234,242,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? TEAL_cg : 'rgba(234,242,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain (full-frame, re-seeded every frame)
// ---------------------------------------------------------------------------
const GRAIN_COUNT = 7000;
const FilmGrain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < GRAIN_COUNT; i++) {
    const x = random(`cg-grain-x-${frame}-${i}`) * 3840;
    const y = random(`cg-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`cg-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`cg-grain-s-${frame}-${i}`) * 3;
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
export const CropGrowthCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <SoilRoots frame={frame} fps={fps} />
      <Plant frame={frame} fps={fps} />
      <MilestoneFlags frame={frame} fps={fps} />
      <TitleBar frame={frame} fps={fps} />
      <StageRail frame={frame} fps={fps} />
      <FieldMetrics frame={frame} fps={fps} />
      <SeasonDial frame={frame} fps={fps} />
      <PayoffBanner frame={frame} fps={fps} />
      <AmbientParticles_cg frame={frame} />
      <FineDither_cg frame={frame} />
      <TickerTape_cg frame={frame} />
      <CornerHud_cg frame={frame} />
      <FilmGrain frame={frame} />
    </AbsoluteFill>
  );
};
