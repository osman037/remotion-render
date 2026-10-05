/**
 * CataractSurgeryJourney.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * A brand-neutral educational infographic of the cataract treatment journey:
 * an eye cross-section shows the crystalline lens clouding over as vision
 * blurs (0-150), an eye chart dims row by row at diagnosis (150-280), a
 * microscopic incision line appears (280-380), an ultrasound probe dissolves
 * the cloudy lens (380-540), a foldable artificial lens unfolds into place
 * (540-680), and vision snaps clear with a 20/20 payoff (680-900).
 * (Educational diagram only — never surgical gore, never a real device brand.)
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
const BG = '#04181B';
const GRID = 'rgba(45,212,191,0.10)';
const AXIS = 'rgba(45,212,191,0.5)';
const INK = '#F2FDFC';
const MUTED = 'rgba(190,232,226,0.62)';
const TEAL = '#2DD4BF';
const TEAL_DEEP = '#0E7C70';
const WHITE = '#FFFFFF';
const WARM_SKIN = '#F6F1E3';
const IRIS = '#D9A441';
const LENS_CLR = '#E8C872';
const LENS_CLOUD = '#DDE3E4';
const RETINA = '#C96F4A';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}line`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={TEAL} />
      <stop offset="60%" stopColor="#7DEBD9" />
      <stop offset="100%" stopColor={WHITE} />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(4,24,27,0)" />
      <stop offset="100%" stopColor="rgba(1,9,10,0.8)" />
    </radialGradient>
    <radialGradient id={`${p}eyeg`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(45,212,191,0.35)" />
      <stop offset="100%" stopColor="rgba(45,212,191,0)" />
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
            'radial-gradient(circle at 50% 28%, rgba(45,212,191,0.10), rgba(45,212,191,0.04) 45%, rgba(4,24,27,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="ccs" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#ccsvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(45,212,191,0.028)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`ccs-p-x-${i}`) * 3840;
    const by = random(`ccs-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`ccs-p-s-${i}`) * 1.0;
    const ang = random(`ccs-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.5));
    const sz = 2.5 + random(`ccs-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? TEAL : 'rgba(242,253,252,0.85)'} opacity={tw} />);
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
    const bx = random(`ccs-d-x-${i}`) * 3840;
    const by = random(`ccs-d-y-${i}`) * 2160;
    const jx = (random(`ccs-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`ccs-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`ccs-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`ccs-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#BFE9E2" opacity={o} />);
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
    const x = random(`ccs-g-x-${frame}-${i}`) * 3840;
    const y = random(`ccs-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`ccs-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`ccs-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'CATARACT · CLOUDED LENS', 'DIAGNOSIS → TREATMENT', 'ULTRASOUND LENS REMOVAL',
  'FOLDABLE LENS IMPLANT', '20/20 VISION RESTORED', 'EDUCATIONAL INFOGRAPHIC',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER.length * 680;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 680} y={46} fill="rgba(45,212,191,0.72)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(45,212,191,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(45,212,191,0.22)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3270, y: 2090, t: 'OCULAR HEALTH · 101'},
    {x: 60, y: 130, t: 'EDUCATIONAL DIAGRAM'},
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
        CATARACT <span style={{color: TEAL}}>SURGERY</span> JOURNEY
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        From a clouded lens to <span style={{color: TEAL, fontWeight: 700}}>clear vision</span> — an educational step-by-step
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Vision simulator panel (used in scene A and the payoff)
// ---------------------------------------------------------------------------
const VisionScene: React.FC<{blur: number; uid: string}> = ({blur, uid}) => (
  <g>
    <defs>
      <filter id={uid} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={blur} />
      </filter>
      <linearGradient id={`${uid}sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9FD8E8" />
        <stop offset="100%" stopColor="#E8F6F1" />
      </linearGradient>
    </defs>
    <g filter={`url(#${uid})`}>
      <rect x={0} y={0} width={1100} height={760} fill={`url(#${uid}sky)`} />
      <circle cx={830} cy={200} r={110} fill="#F5C542" />
      <path d="M0 560 Q 260 420 520 540 T 1100 520 L1100 760 L0 760 Z" fill="#7FB069" />
      <path d="M0 640 Q 320 540 660 620 T 1100 610 L1100 760 L0 760 Z" fill="#5C8A52" />
      <rect x={180} y={420} width={26} height={200} fill="#6B4F2E" />
      <circle cx={193} cy={380} r={95} fill="#4E7A45" />
      <circle cx={130} cy={420} r={60} fill="#5C8A52" />
      <circle cx={256} cy={420} r={60} fill="#5C8A52" />
      <path d="M560 180 q 18 -18 36 0 M600 180 q 18 -18 36 0" stroke="#33566B" strokeWidth={7} fill="none" strokeLinecap="round" />
    </g>
  </g>
);

// ---------------------------------------------------------------------------
// Scene A (0-180): eye cross-section, lens clouds over, vision blurs
// ---------------------------------------------------------------------------
const LABELS = [
  {t: 'CORNEA', x: 2050, y: 560, lx: 2450, ly: 470},
  {t: 'IRIS', x: 1980, y: 900, lx: 2450, ly: 830},
  {t: 'CRYSTALLINE LENS', x: 1500, y: 1050, lx: 2450, ly: 1190},
  {t: 'RETINA', x: 980, y: 1150, lx: 480, ly: 1290},
  {t: 'OPTIC NERVE', x: 880, y: 1000, lx: 480, ly: 830},
  {t: 'SCLERA', x: 1500, y: 520, lx: 480, ly: 470},
];
const EyeDiagram: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame > 185) return null;
  const fadeOut = interpolate(frame, [155, 185], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cloud = interpolate(frame, [15, 150], [0, 0.94], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const blur = interpolate(frame, [15, 150], [0, 13], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = spring({frame: frame - 5, fps, config: {damping: 200, stiffness: 90}});
  const puffs: React.ReactElement[] = [];
  for (let i = 0; i < 42; i++) {
    const px = 1500 + (random(`ccs-cf-x-${i}`) - 0.5) * 300;
    const py = 1050 + (random(`ccs-cf-y-${i}`) - 0.5) * 400;
    const r = 22 + random(`ccs-cf-r-${i}`) * 46;
    puffs.push(<circle key={i} cx={px} cy={py} r={r} fill={LENS_CLOUD} opacity={cloud * (0.35 + random(`ccs-cf-o-${i}`) * 0.5)} />);
  }
  const shimmer = 0.5 + 0.5 * Math.sin(frame * 0.2);
  return (
    <g opacity={fadeOut}>
      <text x={480} y={620} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4}>
        STEP 01 — THE HEALTHY EYE
      </text>
      <g opacity={Math.min(1, s)}>
        <circle cx={1500} cy={1050} r={760} fill="url(#ccseyeg)" opacity={0.6} />
        {/* globe */}
        <circle cx={1500} cy={1050} r={560} fill={WARM_SKIN} stroke="#8A6F4D" strokeWidth={7} />
        {/* optic nerve */}
        <rect x={700} y={1010} width={260} height={90} rx={45} fill="#E4D6B8" stroke="#8A6F4D" strokeWidth={5} />
        {/* retina arc */}
        <path d="M 1080 700 A 470 470 0 0 0 1080 1400" fill="none" stroke={RETINA} strokeWidth={16} />
        {/* vitreous hint */}
        <circle cx={1500} cy={1050} r={470} fill="none" stroke="rgba(138,111,77,0.35)" strokeWidth={3} />
        {/* iris */}
        <circle cx={1960} cy={1050} r={205} fill={IRIS} stroke="#8A6F4D" strokeWidth={6} />
        <circle cx={1960} cy={1050} r={205} fill="none" stroke="#B9832F" strokeWidth={3} strokeDasharray="10 14" />
        <circle cx={1960} cy={1050} r={95} fill="#1B1410" />
        <circle cx={1990} cy={1015} r={26} fill="rgba(255,255,255,0.75)" />
        {/* cornea bulge */}
        <path d="M 2060 880 A 320 320 0 0 1 2060 1220" fill="none" stroke="#CFE3E0" strokeWidth={10} opacity={0.9} />
        {/* crystalline lens (behind iris in cross-section) */}
        <ellipse cx={1640} cy={1050} rx={150} ry={215} fill={LENS_CLR} stroke="#8A6F4D" strokeWidth={6} />
        <ellipse cx={1640} cy={1050} rx={150} ry={215} fill={LENS_CLOUD} opacity={cloud} />
        {puffs}
        <ellipse cx={1640} cy={1050} rx={150} ry={215} fill="none" stroke={TEAL} strokeWidth={5} opacity={0.25 + shimmer * 0.45} />
        {/* labels */}
        {LABELS.map((l, i) => {
          const on = interpolate(frame - 25 - i * 16, [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <g key={i} opacity={on}>
              <line x1={l.x} y1={l.y} x2={l.lx} y2={l.ly} stroke={TEAL} strokeWidth={3} opacity={0.7} />
              <circle cx={l.x} cy={l.y} r={9} fill={TEAL} />
              <text x={l.lx + (l.lx > 1500 ? 18 : -18)} y={l.ly + 12} fill={INK} fontSize={36} fontFamily={FONT} fontWeight={700}
                textAnchor={l.lx > 1500 ? 'start' : 'end'}>
                {l.t}
              </text>
            </g>
          );
        })}
        {/* cataract banner */}
        {(() => {
          const on = interpolate(frame, [120, 150], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <g opacity={on}>
              <rect x={1060} y={1600} width={880} height={110} rx={30} fill="rgba(45,212,191,0.14)" stroke={TEAL} strokeWidth={4} />
              <text x={1500} y={1672} fill={TEAL} fontSize={44} fontFamily={FONT} fontWeight={800} textAnchor="middle">
                CATARACT — LENS CLOUDED
              </text>
            </g>
          );
        })()}
      </g>
      {/* vision simulator */}
      <g transform="translate(2450, 640)">
        <rect x={-40} y={-120} width={1180} height={1000} rx={36} fill="#062226" stroke={TEAL} strokeWidth={4} />
        <text x={30} y={-56} fill={MUTED} fontSize={36} fontFamily={MONO} letterSpacing={4}>
          VISION SIMULATION
        </text>
        <g transform="translate(30, 0)">
          <VisionScene blur={blur} uid="ccsvpA" />
          <rect x={0} y={0} width={1100} height={760} fill="none" stroke={GRID.replace('0.10', '0.5')} strokeWidth={3} />
        </g>
        <text x={580} y={890} fill={TEAL} fontSize={40} fontFamily={FONT} fontWeight={700} textAnchor="middle">
          {blur < 2 ? 'clear' : blur < 7 ? 'hazy' : 'severely blurred'}
        </text>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene B (140-300): eye chart dims row by row — diagnosis
// ---------------------------------------------------------------------------
const ROWS = [
  {t: 'E', size: 150},
  {t: 'F P', size: 118},
  {t: 'T O Z', size: 92},
  {t: 'L P E D', size: 72},
  {t: 'P E C F O', size: 56},
  {t: 'E D F C Z P', size: 44},
];
const Chart: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 140 || frame > 305) return null;
  const fadeIn = interpolate(frame, [140, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [275, 305], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dx = interpolate(frame, [140, 180], [-160, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <g opacity={fadeIn * fadeOut}>
      <text x={1920} y={620} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        STEP 02 — DIAGNOSIS: VISUAL ACUITY TEST
      </text>
      <g transform={`translate(${dx}, 0)`}>
        <rect x={1140} y={700} width={1560} height={1060} rx={36} fill="#F4FAF9" />
        {ROWS.map((r, i) => {
          const dim = interpolate(frame, [165 + i * 19, 200 + i * 19], [0, 0.88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const y = 880 + i * 150;
          return (
            <g key={i}>
              <text x={1920} y={y} fill="#123B38" fontSize={r.size} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={10}>
                {r.t}
              </text>
              {dim > 0.01 && <rect x={1180} y={y - r.size} width={1480} height={r.size + 26} fill="#0B2B28" opacity={dim} />}
            </g>
          );
        })}
      </g>
      {(() => {
        const on = interpolate(frame, [250, 280], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (on <= 0) return null;
        return (
          <g opacity={on}>
            <rect x={2820} y={940} width={860} height={420} rx={32} fill="rgba(45,212,191,0.12)" stroke={TEAL} strokeWidth={5} filter="url(#ccsglow)" />
            <text x={3250} y={1080} fill={TEAL} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              DIAGNOSIS
            </text>
            <text x={3250} y={1180} fill={INK} fontSize={64} fontFamily={MONO} fontWeight={800} textAnchor="middle">
              CATARACT
            </text>
            <text x={3250} y={1260} fill={MUTED} fontSize={34} fontFamily={FONT} textAnchor="middle">
              lens replacement advised
            </text>
          </g>
        );
      })()}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene C/D/E (280-700): microscope field — incision, phaco dissolve, IOL
// ---------------------------------------------------------------------------
const Field: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 280 || frame > 705) return null;
  const fadeIn = interpolate(frame, [280, 310], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [675, 705], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // dissolve progress + IOL unfold
  const dissolve = interpolate(frame, [400, 535], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const iolS = spring({frame: frame - 550, fps, config: {damping: 200, stiffness: 80}});
  const inc = interpolate(frame, [295, 370], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const stepLabel =
    frame < 380 ? 'STEP 03 — MICRO-INCISION' :
    frame < 545 ? 'STEP 04 — ULTRASOUND DISSOLVES THE CLOUDED LENS' :
    'STEP 05 — FOLDABLE LENS UNFOLDS INTO PLACE';
  // probe vibration
  const vib = frame >= 385 && frame <= 540 ? Math.sin(frame * 0.9) * 9 : 0;
  // particles dissolving off the lens
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 130; i++) {
    const a = random(`ccs-pd-a-${i}`) * Math.PI * 2;
    const rr = random(`ccs-pd-r-${i}`) * 0.9;
    const sx = 1920 + Math.cos(a) * rr * 340;
    const sy = 1080 + Math.sin(a) * rr * 250;
    const stag = random(`ccs-pd-st-${i}`) * 90;
    const p = interpolate(frame, [400 + stag, 490 + stag], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const x = sx + Math.cos(a) * p * (260 + random(`ccs-pd-d-${i}`) * 420);
    const y = sy + Math.sin(a) * p * (200 + random(`ccs-pd-d-${i}`) * 340) - p * p * 120;
    parts.push(
      <circle key={i} cx={x} cy={y} r={7 + random(`ccs-pd-z-${i}`) * 12} fill={LENS_CLOUD} opacity={(1 - p) * 0.9} />
    );
  }
  // ultrasound rings
  const rings: React.ReactElement[] = [];
  for (let k = 0; k < 3; k++) {
    const cyc = ((frame - 385 + k * 14) % 42) / 42;
    if (frame >= 385 && frame <= 540) {
      rings.push(
        <circle key={k} cx={2260 + vib} cy={760} r={30 + cyc * 190} fill="none" stroke={TEAL} strokeWidth={6} opacity={(1 - cyc) * 0.8} />
      );
    }
  }
  const iolGlow = iolS > 0.9 ? 0.5 + 0.5 * Math.sin(frame * 0.2) : 0;
  return (
    <g opacity={fadeIn * fadeOut}>
      <text x={1920} y={300} fill={MUTED} fontSize={40} fontFamily={MONO} letterSpacing={4} textAnchor="middle">
        {stepLabel}
      </text>
      {/* microscope field */}
      <circle cx={1920} cy={1080} r={640} fill="#0A2B2B" stroke={TEAL} strokeWidth={8} filter="url(#ccsglow)" />
      <circle cx={1920} cy={1080} r={640} fill="none" stroke={GRID.replace('0.10', '0.35')} strokeWidth={2} strokeDasharray="4 26" />
      {/* crosshair ticks */}
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1={1920 + Math.cos((a * Math.PI) / 180) * 600} y1={1080 + Math.sin((a * Math.PI) / 180) * 600}
          x2={1920 + Math.cos((a * Math.PI) / 180) * 640} y2={1080 + Math.sin((a * Math.PI) / 180) * 640}
          stroke={TEAL} strokeWidth={6} />
      ))}
      <clipPath id="ccsfield">
        <circle cx={1920} cy={1080} r={632} />
      </clipPath>
      <g clipPath="url(#ccsfield)">
        {/* capsule outline (the empty bag that will hold the new lens) */}
        <ellipse cx={1920} cy={1080} rx={360} ry={265} fill="none" stroke={RETINA} strokeWidth={4} strokeDasharray="14 12" opacity={0.8} />
        {/* cloudy lens */}
        <ellipse cx={1920} cy={1080} rx={340} ry={250} fill={LENS_CLOUD} opacity={(1 - dissolve) * 0.96} />
        <ellipse cx={1920} cy={1080} rx={340} ry={250} fill={LENS_CLR} opacity={(1 - dissolve) * 0.35} />
        {dissolve < 0.999 && parts}
        {/* incision line */}
        {inc > 0.01 && (
          <g opacity={inc}>
            <path d="M 2190 830 A 120 120 0 0 1 2310 830" fill="none" stroke={WHITE} strokeWidth={10} strokeLinecap="round"
              style={{filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.9))'}} />
            <text x={2500} y={800} fill={WHITE} fontSize={34} fontFamily={MONO}>
              2.2 mm incision
            </text>
          </g>
        )}
        {/* ultrasound probe */}
        {frame >= 375 && (
          <g opacity={interpolate(frame, [375, 395], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {rings}
            <g transform={`translate(${2260 + vib}, 760) rotate(35)`}>
              <rect x={-26} y={-420} width={52} height={430} rx={26} fill="#9FB8B4" stroke={TEAL_DEEP} strokeWidth={4} />
              <rect x={-60} y={-520} width={120} height={110} rx={24} fill={TEAL_DEEP} />
              <circle cx={0} cy={10} r={26} fill={TEAL} style={{filter: 'drop-shadow(0 0 12px rgba(45,212,191,0.9))'}} />
            </g>
            <text x={2620} y={420} fill={TEAL} fontSize={34} fontFamily={MONO}>
              ultrasound probe
            </text>
          </g>
        )}
        {/* IOL unfolding */}
        {iolS > 0.01 && (
          <g opacity={Math.min(1, iolS)}>
            <ellipse cx={1920} cy={1080} rx={120 + Math.min(1, iolS) * 220} ry={85 + Math.min(1, iolS) * 165}
              fill="rgba(45,212,191,0.22)" stroke={TEAL} strokeWidth={8} filter="url(#ccsglow)" />
            <ellipse cx={1920} cy={1080} rx={120 + Math.min(1, iolS) * 220} ry={85 + Math.min(1, iolS) * 165}
              fill="none" stroke={WHITE} strokeWidth={3} opacity={0.5 + iolGlow * 0.5} />
            {[-1, 1].map((sgn) => (
              <path key={sgn} d={`M ${1920 + sgn * (130 + Math.min(1, iolS) * 220)} 1080 q ${sgn * 90} -60 ${sgn * 150} 10`}
                fill="none" stroke={TEAL} strokeWidth={7} opacity={Math.min(1, iolS)} />
            ))}
          </g>
        )}
      </g>
      {/* side legend */}
      <g opacity={fadeIn}>
        {[
          {c: LENS_CLOUD, t: 'clouded natural lens'},
          {c: TEAL, t: 'ultrasound probe'},
          {c: '#7DEBD9', t: 'foldable artificial lens (IOL)'},
        ].map((l, i) => (
          <g key={i} transform={`translate(3100, ${900 + i * 90})`}>
            <circle r={18} fill={l.c} />
            <text x={36} y={13} fill={MUTED} fontSize={34} fontFamily={FONT}>
              {l.t}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene F (680-900): vision snaps clear — 20/20 payoff
// ---------------------------------------------------------------------------
const Payoff: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 680) return null;
  const fadeIn = interpolate(frame, [680, 710], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const snap = spring({frame: frame - 690, fps, config: {damping: 200, stiffness: 120}});
  const rays: React.ReactElement[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + frame * 0.002;
    const ro = 0.15 + 0.4 * (0.5 + 0.5 * Math.sin(frame * 0.12 + i));
    rays.push(
      <line key={i} x1={1920 + Math.cos(a) * 480} y1={1050 + Math.sin(a) * 480}
        x2={1920 + Math.cos(a) * 640} y2={1050 + Math.sin(a) * 640}
        stroke={TEAL} strokeWidth={9} strokeLinecap="round" opacity={ro * Math.min(1, snap)} />
    );
  }
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.16);
  return (
    <g opacity={fadeIn}>
      {rays}
      <g opacity={Math.min(1, snap)} transform={`translate(1920, 1050) scale(${0.85 + Math.min(1, snap) * 0.15})`}>
        <rect x={-640} y={-460} width={1280} height={920} rx={48} fill="#062226" stroke={TEAL} strokeWidth={6} filter="url(#ccsglow)" />
        <g transform="translate(-550, -380)">
          <VisionScene blur={0} uid="ccsvpB" />
          <rect x={0} y={0} width={1100} height={760} fill="none" stroke={TEAL} strokeWidth={3} />
        </g>
        <rect x={-330} y={-140} width={660} height={280} rx={60} fill="rgba(4,24,27,0.88)" stroke={WHITE} strokeWidth={5} />
        <text y={-20} fill={WHITE} fontSize={130} fontFamily={MONO} fontWeight={800} textAnchor="middle"
          style={{filter: `drop-shadow(0 0 ${18 + pulse * 22}px rgba(45,212,191,0.9))`}}>
          20/20
        </text>
        <text y={80} fill={TEAL} fontSize={48} fontFamily={FONT} fontWeight={800} letterSpacing={6} textAnchor="middle">
          VISION RESTORED
        </text>
      </g>
      <text x={1920} y={1620} fill={MUTED} fontSize={36} fontFamily={FONT} textAnchor="middle">
        the artificial lens focuses light clearly onto the retina
      </text>
    </g>
  );
};

const Stage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => (
  <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
    <Defs p="ccs" />
    <EyeDiagram frame={frame} fps={fps} />
    <Chart frame={frame} fps={fps} />
    <Field frame={frame} fps={fps} />
    <Payoff frame={frame} fps={fps} />
  </svg>
);

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(190,232,226,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Simplified educational illustration — not a surgical guide. Consult an eye-care professional.
    </div>
  );
};

export const CataractSurgeryJourney: React.FC = () => {
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
