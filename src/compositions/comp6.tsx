/**
 * RecyclingSortingProcess.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * Inside a materials recovery facility: the bin is collected, the truck tips
 * onto a conveyor, presorters pull contaminants, screens shake out paper,
 * magnets lift steel, an eddy current flings aluminum, optical sorters zap
 * plastics — and baled streams are reborn as new products.
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
const BG = '#0A120E';
const GRID = 'rgba(160,200,170,0.10)';
const INK = '#EEF5EF';
const MUTED = 'rgba(200,218,206,0.62)';
const GREEN = '#4ADE80';
const TEAL = '#2DD4BF';
const BLUE = '#5AC8FA';
const AMBER = '#FBBF24';
const PAPER = '#E8DCC0';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const MACHINES = [
  {t: 'PRESORT', s: 'Hands pull contaminants', c: AMBER},
  {t: 'SCREENS', s: 'Paper & cardboard shake out', c: PAPER},
  {t: 'MAGNET', s: 'Steel lifts off the belt', c: BLUE},
  {t: 'EDDY CURRENT', s: 'Aluminum flung sideways', c: TEAL},
  {t: 'OPTICAL SORTER', s: 'Infrared zaps each plastic', c: GREEN},
  {t: 'BALED', s: 'Streams compressed for rebirth', c: GREEN},
];
const M_START = [120, 230, 340, 450, 560, 690];

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(10,18,14,0)" />
      <stop offset="100%" stopColor="rgba(3,7,5,0.78)" />
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
            'radial-gradient(circle at 50% 30%, rgba(74,222,128,0.10), rgba(74,222,128,0.03) 45%, rgba(10,18,14,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="rec" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#recvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(74,222,128,0.028)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`rec-p-x-${i}`) * 3840;
    const by = random(`rec-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`rec-p-s-${i}`) * 1.0;
    const ang = random(`rec-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.6));
    const sz = 2.5 + random(`rec-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? GREEN : 'rgba(238,245,239,0.85)'} opacity={tw} />);
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
    const bx = random(`rec-d-x-${i}`) * 3840;
    const by = random(`rec-d-y-${i}`) * 2160;
    const jx = (random(`rec-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`rec-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`rec-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`rec-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#CBE8CF" opacity={o} />);
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
    const x = random(`rec-g-x-${frame}-${i}`) * 3840;
    const y = random(`rec-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`rec-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`rec-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'SINGLE-STREAM RECYCLING', 'MATERIALS RECOVERY FACILITY', 'SORT BY MATERIAL, NOT BY WISH',
  'NO PLASTIC BAGS IN THE BIN', 'RINSE THE JARS', 'CLOSE THE LOOP — BUY RECYCLED',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 1000;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 680} y={46} fill="rgba(74,222,128,0.7)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
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
    {x: 3330, y: 2090, t: 'MRF · SORT LINE 3'},
    {x: 60, y: 130, t: 'BIN → BELT → NEW LIFE'},
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

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [20, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(frame, [20, 60], [30, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 130 + rise, left: 180, opacity: fade}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        HOW <span style={{color: GREEN}}>RECYCLING</span> ACTUALLY WORKS
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        Inside a materials recovery facility — <span style={{color: GREEN, fontWeight: 700}}>every machine asks one question:</span> what makes these move apart?
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The conveyor line with machine stations
// ---------------------------------------------------------------------------
const BELT_Y = 1180;
const BELT_X0 = 240;
const BELT_X1 = 3600;

const Line: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [60, 100], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // bin tips at the start
  const tip = interpolate(frame, [80, 160], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // items riding the belt (deterministic positions loop along the belt)
  const items: React.ReactElement[] = [];
  const kinds = [
    {c: PAPER, w: 46, h: 60}, {c: BLUE, w: 40, h: 56}, {c: TEAL, w: 44, h: 44},
    {c: GREEN, w: 38, h: 62}, {c: AMBER, w: 48, h: 40}, {c: '#C9CFD8', w: 42, h: 52},
  ];
  const stopX = [700, 1250, 1800, 2350, 2900]; // machine stations
  for (let i = 0; i < 42; i++) {
    const spd = 4.2;
    const base = (i / 42) * (BELT_X1 - BELT_X0);
    let xx = BELT_X0 + ((base + frame * spd) % (BELT_X1 - BELT_X0));
    const kind = kinds[i % 6];
    // remove items that reached their machine station
    const mi = i % 6;
    const goneAt = mi < 5 ? stopX[mi] : BELT_X1;
    if (xx > goneAt) continue;
    const yy = BELT_Y - 40 + Math.sin(frame * 0.2 + i * 1.3) * 6;
    items.push(
      <rect key={i} x={xx} y={yy} width={kind.w} height={kind.h} rx={10} fill={kind.c} opacity={0.9} />
    );
  }
  // machine stations
  const stations: React.ReactElement[] = [];
  MACHINES.forEach((m, i) => {
    const on = interpolate(frame - M_START[i], [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    if (on <= 0 || i === 5) return;
    const x = stopX[i];
    stations.push(
      <g key={i} opacity={on}>
        <rect x={x - 150} y={BELT_Y - 330} width={300} height={230} rx={24} fill="rgba(16,24,19,0.92)" stroke={m.c} strokeWidth={4} filter="url(#recglow)" />
        <text x={x} y={BELT_Y - 240} fill={m.c} fontSize={36} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          {m.t}
        </text>
        <text x={x} y={BELT_Y - 190} fill={MUTED} fontSize={28} fontFamily={FONT} textAnchor="middle">
          {m.s}
        </text>
        {/* ejecting stream */}
        <line x1={x} y1={BELT_Y - 100} x2={x} y2={BELT_Y + 240} stroke={m.c} strokeWidth={10} opacity={0.5 + 0.3 * Math.sin(frame * 0.2 + i)} />
        <rect x={x - 110} y={BELT_Y + 240} width={220} height={140} rx={20} fill="rgba(16,24,19,0.95)" stroke={m.c} strokeWidth={3} />
        <text x={x} y={BELT_Y + 322} fill={m.c} fontSize={30} fontFamily={MONO} textAnchor="middle">
          {['PAPER', 'STEEL', 'ALUMINUM', 'PLASTICS'][i]}
        </text>
      </g>
    );
  });
  // final bales
  const baleOn = interpolate(frame - M_START[5], [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, opacity: fade}}>
      <Defs p="recl" />
      {/* collection truck */}
      <g transform={`translate(${interpolate(frame, [40, 120], [-500, 260], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}, 0)`}>
        <rect x={0} y={BELT_Y - 420} width={420} height={300} rx={24} fill="#1B2B21" stroke={GREEN} strokeWidth={4} />
        <rect x={330} y={BELT_Y - 300} width={160} height={180} rx={20} fill="#24382C" stroke={GREEN} strokeWidth={3} />
        <circle cx={110} cy={BELT_Y - 60} r={60} fill="#0A120E" stroke="rgba(200,218,206,0.5)" strokeWidth={8} />
        <circle cx={380} cy={BELT_Y - 60} r={60} fill="#0A120E" stroke="rgba(200,218,206,0.5)" strokeWidth={8} />
        <text x={210} y={BELT_Y - 240} fill={GREEN} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          ♻ COLLECTION
        </text>
        {/* tipping bin */}
        <g transform={`translate(520, ${BELT_Y - 160}) rotate(${-tip * 70})`}>
          <rect x={-70} y={-160} width={140} height={170} rx={16} fill={BLUE} opacity={0.9} />
          {tip > 0.3 && [0, 1, 2].map((i) => (
            <rect key={i} x={30 + i * 50} y={-80 + i * 40} width={40} height={50} rx={8}
              fill={[PAPER, BLUE, GREEN][i]} opacity={tip} transform={`translate(${tip * 160}, ${tip * 120}) rotate(${tip * 40})`} />
          ))}
        </g>
      </g>
      {/* the belt */}
      <rect x={BELT_X0} y={BELT_Y} width={BELT_X1 - BELT_X0} height={70} rx={35} fill="#141F18" stroke="rgba(74,222,128,0.35)" strokeWidth={3} />
      {Array.from({length: 40}, (_, i) => {
        const xx = BELT_X0 + 40 + ((i * 84 + frame * 4.2) % (BELT_X1 - BELT_X0 - 80));
        return <rect key={i} x={xx} y={BELT_Y + 28} width={34} height={14} rx={7} fill="rgba(74,222,128,0.35)" />;
      })}
      {items}
      {stations}
      {/* baled streams */}
      {baleOn > 0 && (
        <g opacity={baleOn} transform={`translate(3300, ${BELT_Y + 240})`}>
          {[PAPER, BLUE, TEAL, GREEN].map((c, i) => (
            <g key={i} transform={`translate(${(i % 2) * 150}, ${Math.floor(i / 2) * 170})`}>
              <rect x={0} y={0} width={130} height={150} rx={14} fill={c} opacity={0.85} stroke="rgba(10,18,14,0.6)" strokeWidth={4} />
              {[0, 1, 2].map((k) => (
                <line key={k} x1={0} y1={40 + k * 36} x2={130} y2={40 + k * 36} stroke="rgba(10,18,14,0.5)" strokeWidth={5} />
              ))}
            </g>
          ))}
          <text x={140} y={420} fill={GREEN} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            BALED &amp; SOLD
          </text>
        </g>
      )}
      {/* rebirth arrow */}
      {baleOn > 0.9 && (
        <g opacity={interpolate(frame, [820, 860], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <path d={`M 3300 ${BELT_Y + 480} C 3600 ${BELT_Y + 700}, 600 ${BELT_Y + 700}, 480 ${BELT_Y + 200}`}
            fill="none" stroke={GREEN} strokeWidth={8} strokeDasharray="26 20" opacity={0.7} />
          <text x={1920} y={BELT_Y + 660} fill={GREEN} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            REBORN AS NEW PRODUCTS ⟳
          </text>
        </g>
      )}
    </svg>
  );
};

// machine caption ticker (bottom of belt)
const Caption: React.FC<{frame: number}> = ({frame}) => {
  const idx = MACHINES.findIndex((_, i) => frame >= M_START[i] && (i === 5 || frame < M_START[i + 1]));
  if (idx < 0) return null;
  const m = MACHINES[idx];
  return (
    <div style={{position: 'absolute', top: 560, left: 0, width: 3840, textAlign: 'center'}}>
      <span style={{
        color: '#0A120E', background: m.c, fontFamily: FONT, fontWeight: 800, fontSize: 40,
        padding: '14px 44px', borderRadius: 999, letterSpacing: 2,
      }}>
        {idx + 1}/6 · {m.t} — {m.s}
      </span>
    </div>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(160,200,170,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Sorting rules vary by city — when in doubt, check your local program. Never bag recyclables in plastic.
    </div>
  );
};

export const RecyclingSortingProcess: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <Line frame={frame} fps={fps} />
      <Caption frame={frame} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
