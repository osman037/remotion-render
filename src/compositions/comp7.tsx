/**
 * DataPipelineFlow.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * How a data pipeline works, vendor-neutral: scattered sources stream raw
 * rows into the pipeline, a transform chamber cleans, dedupes and standardizes
 * them, the curated dataset loads into the warehouse, and dashboards light up
 * with trusted numbers.
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
const BG = '#0A0E1C';
const GRID = 'rgba(155,165,230,0.10)';
const INK = '#EDF0FA';
const MUTED = 'rgba(198,206,232,0.62)';
const BLUE = '#5AC8FA';
const VIOLET = '#A78BFA';
const GREEN = '#34D399';
const AMBER = '#FBBF24';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

const SOURCES = [
  {n: 'DATABASE', c: BLUE},
  {n: 'CRM', c: VIOLET},
  {n: 'PAYMENTS API', c: GREEN},
  {n: 'SPREADSHEET', c: AMBER},
];
const TRANSFORMS = [
  {t: 'CLEAN', s: 'strip nulls & junk rows'},
  {t: 'DEDUPE', s: 'merge duplicate records'},
  {t: 'STANDARDIZE', s: 'one date format, one currency'},
  {t: 'VALIDATE', s: 'business rules pass'},
];

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <linearGradient id={`${p}flow`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={BLUE} />
      <stop offset="50%" stopColor={VIOLET} />
      <stop offset="100%" stopColor={GREEN} />
    </linearGradient>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(10,14,28,0)" />
      <stop offset="100%" stopColor="rgba(3,4,11,0.78)" />
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
            'radial-gradient(circle at 50% 30%, rgba(90,200,250,0.10), rgba(90,200,250,0.03) 45%, rgba(10,14,28,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="etl" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#etlvig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(90,200,250,0.028)" />
      </svg>
    </>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 190; i++) {
    const bx = random(`etl-p-x-${i}`) * 3840;
    const by = random(`etl-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`etl-p-s-${i}`) * 1.0;
    const ang = random(`etl-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 1.7));
    const sz = 2.5 + random(`etl-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? BLUE : 'rgba(237,240,250,0.85)'} opacity={tw} />);
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
    const bx = random(`etl-d-x-${i}`) * 3840;
    const by = random(`etl-d-y-${i}`) * 2160;
    const jx = (random(`etl-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`etl-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`etl-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`etl-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#C6D9FF" opacity={o} />);
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
    const x = random(`etl-g-x-${frame}-${i}`) * 3840;
    const y = random(`etl-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`etl-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`etl-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'EXTRACT → TRANSFORM → LOAD', 'RAW DATA IN', 'TRUSTED DATA OUT', 'SCHEDULED SYNC',
  'SCHEMA DRIFT HANDLED', 'ONE SOURCE OF TRUTH', 'DASHBOARDS YOU CAN TRUST',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 1000;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 640} y={46} fill="rgba(90,200,250,0.7)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(90,200,250,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(90,200,250,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3290, y: 2090, t: 'DATA INFRA · PIPELINE'},
    {x: 60, y: 130, t: 'RAW → CURATED → TRUSTED'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={BLUE} opacity={0.35 + blink * 0.55} />
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
        HOW A DATA <span style={{color: BLUE}}>PIPELINE</span> WORKS
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        Raw rows from everywhere become <span style={{color: BLUE, fontWeight: 700}}>one trusted dataset</span> — extract, transform, load
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main flow: sources → transform chamber → warehouse → dashboards
// ---------------------------------------------------------------------------
const SX = 300;
const CHX = 1560; // chamber center x
const CHY = 1150;
const WHX = 2700; // warehouse x

const Flow: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const fade = interpolate(frame, [50, 90], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // raw streams: packets flowing from sources to chamber
  const packets: React.ReactElement[] = [];
  for (let s = 0; s < 4; s++) {
    const sy = 780 + s * 250;
    const on = interpolate(frame - (70 + s * 20), [0, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    if (on <= 0) continue;
    for (let i = 0; i < 10; i++) {
      const ph = ((frame * 7 + i * 130 + s * 300) % 1100) / 1100;
      const xx = SX + 200 + ph * (CHX - 420 - SX - 200);
      const yy = sy + Math.sin(ph * Math.PI) * -60;
      packets.push(
        <g key={`${s}-${i}`} opacity={on}>
          <rect x={xx} y={yy - 16} width={64} height={32} rx={8} fill={SOURCES[s].c} opacity={0.9} filter="url(#etlglow)" />
          {[0, 1].map((k) => (
            <line key={k} x1={xx + 12} y1={yy - 6 + k * 12} x2={xx + 52} y2={yy - 6 + k * 12} stroke="#0A0E1C" strokeWidth={4} />
          ))}
        </g>
      );
    }
  }
  // transform chamber stages
  const tProg = interpolate(frame, [220, 620], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const chamberOn = interpolate(frame, [180, 220], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // warehouse fill
  const load = interpolate(frame, [560, 780], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dash = interpolate(frame, [720, 840], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, opacity: fade}}>
      <Defs p="etlf" />
      {/* sources */}
      {SOURCES.map((s, i) => {
        const on = spring({frame: frame - (70 + i * 20), fps, config: {damping: 200, stiffness: 110}});
        if (on <= 0.001) return null;
        const y = 780 + i * 250;
        return (
          <g key={i} opacity={Math.min(1, on)}>
            <rect x={SX} y={y - 110} width={300} height={220} rx={24} fill="rgba(14,19,36,0.9)" stroke={s.c} strokeWidth={3.5} filter="url(#etlglow)" />
            <circle cx={SX + 150} cy={y - 30} r={40} fill="none" stroke={s.c} strokeWidth={6} />
            <ellipse cx={SX + 150} cy={y - 30} rx={40} ry={16} fill="none" stroke={s.c} strokeWidth={4} />
            <text x={SX + 150} y={y + 70} fill={INK} fontSize={32} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {s.n}
            </text>
            <text x={SX + 150} y={y - 150} fill={MUTED} fontSize={26} fontFamily={MONO} textAnchor="middle">
              RAW ROWS
            </text>
          </g>
        );
      })}
      {/* raw vs curated labels */}
      <text x={830} y={640} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={3} textAnchor="middle" opacity={chamberOn}>
        ① EXTRACT
      </text>
      <text x={CHX} y={640} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={3} textAnchor="middle" opacity={chamberOn}>
        ② TRANSFORM
      </text>
      <text x={WHX + 120} y={640} fill={MUTED} fontSize={30} fontFamily={MONO} letterSpacing={3} textAnchor="middle" opacity={load}>
        ③ LOAD
      </text>
      {packets}
      {/* transform chamber */}
      {chamberOn > 0 && (
        <g opacity={chamberOn}>
          <rect x={CHX - 420} y={CHY - 480} width={840} height={960} rx={48} fill="rgba(17,23,40,0.9)" stroke={VIOLET} strokeWidth={4} filter="url(#etlglow)" />
          <text x={CHX} y={CHY - 380} fill={VIOLET} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={2}>
            TRANSFORM
          </text>
          {TRANSFORMS.map((tr, i) => {
            const on = interpolate(tProg * 4 - i, [0, 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <g key={i} opacity={on}>
                <rect x={CHX - 340} y={CHY - 280 + i * 180} width={680} height={140} rx={22}
                  fill={on > 0.9 ? 'rgba(52,211,153,0.12)' : 'rgba(167,139,250,0.08)'}
                  stroke={on > 0.9 ? GREEN : VIOLET} strokeWidth={3} />
                <circle cx={CHX - 270} cy={CHY - 210 + i * 180} r={30} fill="none" stroke={on > 0.9 ? GREEN : VIOLET} strokeWidth={5} />
                {on > 0.9 && <path d={`M ${CHX - 282} ${CHY - 210 + i * 180} l 9 10 l 18 -20`} stroke={GREEN} strokeWidth={7} fill="none" strokeLinecap="round" />}
                <text x={CHX - 210} y={CHY - 226 + i * 180} fill={on > 0.9 ? GREEN : INK} fontSize={44} fontFamily={FONT} fontWeight={800}>
                  {tr.t}
                </text>
                <text x={CHX - 210} y={CHY - 178 + i * 180} fill={MUTED} fontSize={30} fontFamily={FONT}>
                  {tr.s}
                </text>
              </g>
            );
          })}
        </g>
      )}
      {/* curated stream chamber → warehouse */}
      {tProg > 0.7 && (
        <g opacity={interpolate(tProg, [0.7, 0.9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <line x1={CHX + 420} y1={CHY} x2={WHX - 60} y2={CHY} stroke="url(#etlflow)" strokeWidth={10} strokeLinecap="round" filter="url(#etlglow)" />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const ph = ((frame * 9 + i * 200) % 900) / 900;
            return <circle key={i} cx={CHX + 420 + ph * (WHX - 60 - CHX - 420)} cy={CHY} r={16} fill={GREEN} opacity={0.9} filter="url(#etlglow)" />;
          })}
        </g>
      )}
      {/* warehouse cylinder */}
      {load > 0 && (
        <g opacity={Math.min(1, load * 2)}>
          <g transform={`translate(${WHX + 120}, ${CHY})`}>
            <ellipse cx={0} cy={-260} rx={220} ry={70} fill="rgba(52,211,153,0.25)" stroke={GREEN} strokeWidth={5} />
            <rect x={-220} y={-260} width={440} height={520 - 260 * (1 - load)} fill="rgba(52,211,153,0.18)" />
            <rect x={-220} y={-260} width={440} height={520} fill="none" stroke={GREEN} strokeWidth={5} />
            <ellipse cx={0} cy={-260} rx={220} ry={70} fill="none" stroke={GREEN} strokeWidth={5} />
            <ellipse cx={0} cy={260 - 260 * (1 - load)} rx={220} ry={70} fill="rgba(52,211,153,0.35)" stroke={GREEN} strokeWidth={5} />
            <text y={420} fill={GREEN} fontSize={40} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              DATA WAREHOUSE
            </text>
            <text y={470} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="middle">
              one curated dataset
            </text>
          </g>
        </g>
      )}
      {/* dashboards light up */}
      {dash > 0 && (
        <g opacity={dash}>
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${WHX - 420 + i * 1080}, 1650)`}>
              <rect x={-240} y={-140} width={480} height={280} rx={20} fill="rgba(14,19,36,0.95)" stroke={GREEN} strokeWidth={3} filter="url(#etlglow)" />
              {[0, 1, 2, 3, 4].map((b) => {
                const h = 40 + random(`etl-db-${i}-${b}`) * 120 * dash;
                return <rect key={b} x={-200 + b * 88} y={100 - h} width={60} height={h} rx={10} fill={GREEN} opacity={0.85} />;
              })}
              <text y={-70} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle">
                {i === 0 ? 'REVENUE DASHBOARD' : 'MARKETING FUNNEL'}
              </text>
              <line x1={WHX + 120 - (WHX - 420 + i * 1080)} y1={-400} x2={0} y2={-140} stroke={GREEN} strokeWidth={3} strokeDasharray="12 10" opacity={0.6} />
            </g>
          ))}
          <text x={1920} y={1990} fill={GREEN} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">
            ✓ DASHBOARDS YOU CAN TRUST
          </text>
        </g>
      )}
    </svg>
  );
};

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(155,165,230,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Illustrative concept. Real pipelines add scheduling, monitoring, and governance on top of ETL.
    </div>
  );
};

export const DataPipelineFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <Flow frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
