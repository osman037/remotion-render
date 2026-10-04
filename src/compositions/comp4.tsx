/**
 * DNATestingJourney.tsx
 * Remotion composition — 4K (3840x2160), 60 fps, 15 s (900 frames), no audio.
 * From spit kit to ancestry map: order the kit, fill the tube, register the
 * barcode, mail it home, watch the lab genotype the sample on glowing chips,
 * and see the ancestry map bloom with region percentages and trait cards.
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
const BG = '#0B0D1A';
const GRID = 'rgba(165,160,220,0.10)';
const INK = '#EEF0FA';
const MUTED = 'rgba(200,198,228,0.62)';
const VIOLET = '#A78BFA';
const TEAL = '#2DD4BF';
const PINK = '#F472B6';
const GOLD = '#FBBF24';
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// Ancestry regions (deterministic)
const REGIONS = [
  {n: 'SOUTHERN EUROPE', p: 34, c: VIOLET},
  {n: 'MIDDLE EAST', p: 27, c: TEAL},
  {n: 'SOUTH ASIA', p: 21, c: PINK},
  {n: 'EAST AFRICA', p: 11, c: GOLD},
  {n: 'NORTHERN EUROPE', p: 7, c: '#5AC8FA'},
];
const TRAITS = ['CURLY HAIR', 'FAST METABOLISM', 'DEEP SLEEPER', 'EARLY RISER'];

// ---------------------------------------------------------------------------
// Shared scenery
// ---------------------------------------------------------------------------
const Defs: React.FC<{p: string}> = ({p}) => (
  <defs>
    <radialGradient id={`${p}vig`} cx="50%" cy="46%" r="78%">
      <stop offset="58%" stopColor="rgba(11,13,26,0)" />
      <stop offset="100%" stopColor="rgba(3,4,10,0.78)" />
    </radialGradient>
    <filter id={`${p}glow`} x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="10" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <linearGradient id={`${p}helix`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={VIOLET} />
      <stop offset="100%" stopColor={TEAL} />
    </linearGradient>
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
            'radial-gradient(circle at 50% 30%, rgba(167,139,250,0.10), rgba(167,139,250,0.03) 45%, rgba(11,13,26,0) 72%)',
        }}
      />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        <Defs p="dna" />
        <rect x={0} y={0} width={3840} height={2160} fill="url(#dnavig)" />
        <rect x={0} y={scan - 90} width={3840} height={180} fill="rgba(167,139,250,0.028)" />
      </svg>
    </>
  );
};

// Ambient DNA helix strands drifting in the background
const Helices: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let h = 0; h < 3; h++) {
    const hx = 500 + h * 1350;
    const hy = 1080;
    const segs: React.ReactElement[] = [];
    const N = 40;
    for (let i = 0; i < N; i++) {
      const yy = -420 + i * 22;
      const ph = frame * 0.02 + i * 0.42 + h * 2;
      const x1 = Math.sin(ph) * 90;
      const x2 = Math.sin(ph + Math.PI) * 90;
      const o = 0.10 + 0.08 * Math.sin(frame * 0.05 + i * 0.3 + h);
      segs.push(
        <g key={i} opacity={o}>
          <line x1={x1} y1={yy} x2={x2} y2={yy} stroke="rgba(167,139,250,0.5)" strokeWidth={3} />
          <circle cx={x1} cy={yy} r={7} fill={VIOLET} />
          <circle cx={x2} cy={yy} r={7} fill={TEAL} />
        </g>
      );
    }
    els.push(<g key={h} transform={`translate(${hx}, ${hy})`} opacity={0.5}>{segs}</g>);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {els}
    </svg>
  );
};

const Particles: React.FC<{frame: number}> = ({frame}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < 180; i++) {
    const bx = random(`dna-p-x-${i}`) * 3840;
    const by = random(`dna-p-y-${i}`) * 2160;
    const spd = 0.3 + random(`dna-p-s-${i}`) * 1.0;
    const ang = random(`dna-p-a-${i}`) * Math.PI * 2;
    const dr = ((frame * spd) % 2200) - 180;
    const px = (((bx + Math.cos(ang) * dr) % 3840) + 3840) % 3840;
    const py = (((by + Math.sin(ang) * dr * 0.6) % 2160) + 2160) % 2160;
    const tw = 0.07 + 0.18 * (0.5 + 0.5 * Math.sin(frame * 0.11 + i * 2.0));
    const sz = 2.5 + random(`dna-p-z-${i}`) * 5;
    els.push(<circle key={i} cx={px} cy={py} r={sz} fill={i % 3 === 0 ? VIOLET : 'rgba(238,240,250,0.85)'} opacity={tw} />);
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
    const bx = random(`dna-d-x-${i}`) * 3840;
    const by = random(`dna-d-y-${i}`) * 2160;
    const jx = (random(`dna-d-jx-${frame}-${i}`) - 0.5) * 8;
    const jy = (random(`dna-d-jy-${frame}-${i}`) - 0.5) * 8;
    const o = 0.012 + random(`dna-d-o-${frame}-${i}`) * 0.03;
    const s = 1.5 + random(`dna-d-s-${i}`) * 2;
    els.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#D5CCFF" opacity={o} />);
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
    const x = random(`dna-g-x-${frame}-${i}`) * 3840;
    const y = random(`dna-g-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`dna-g-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`dna-g-s-${frame}-${i}`) * 3;
    els.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {els}
    </svg>
  );
};

const TICKER = [
  'SPIT · SEAL · SEND', 'GENOTYPED IN THE LAB', 'ANCESTRY MAP', 'TRAIT REPORTS',
  'DNA RELATIVES', 'HEALTH INSIGHTS', 'RAW DATA DOWNLOAD',
];
const Ticker: React.FC<{frame: number}> = ({frame}) => {
  const unit = 1000;
  const off = -((frame * 3.0) % unit);
  const row: React.ReactElement[] = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < TICKER.length; i++) {
      row.push(
        <text key={`${r}-${i}`} x={off + r * unit + i * 640} y={46} fill="rgba(167,139,250,0.7)" fontSize={30} fontFamily={MONO} letterSpacing={2}>
          {TICKER[i]} <tspan fill="rgba(167,139,250,0.35)"> /// </tspan>
        </text>
      );
    }
  }
  return (
    <svg width={3840} height={80} style={{position: 'absolute', top: 0, left: 0}}>
      {row}
      <line x1={0} y1={76} x2={3840} y2={76} stroke="rgba(167,139,250,0.2)" strokeWidth={2} />
    </svg>
  );
};

const Corners: React.FC<{frame: number}> = ({frame}) => {
  const blink = 0.5 + 0.5 * Math.sin(frame * 0.1);
  const items = [
    {x: 60, y: 2090, t: `FRAME ${String(frame).padStart(4, '0')} / 0900`},
    {x: 3290, y: 2090, t: 'GENOMICS · SAMPLE LAB'},
    {x: 60, y: 130, t: 'KIT → LAB → RESULTS'},
  ];
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {items.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y - 8} r={7} fill={VIOLET} opacity={0.35 + blink * 0.55} />
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
        YOUR DNA, <span style={{color: VIOLET}}>DECODED</span>
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 10}}>
        From a spit tube to an <span style={{color: VIOLET, fontWeight: 700}}>ancestry map</span> — how home DNA testing works
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step rail (top): 5 phases
// ---------------------------------------------------------------------------
const PHASES = ['ORDER KIT', 'COLLECT SAMPLE', 'MAIL IT BACK', 'LAB GENOTYPING', 'YOUR RESULTS'];
const P_START = [70, 200, 330, 460, 640];
const PhaseRail: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [40, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const prog = interpolate(frame, [P_START[0], P_START[4] + 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <svg width={3840} height={240} style={{position: 'absolute', top: 380, left: 0, opacity: fade}}>
      <line x1={400} y1={60} x2={3440} y2={60} stroke="rgba(167,139,250,0.25)" strokeWidth={6} />
      <line x1={400} y1={60} x2={400 + 3040 * prog} y2={60} stroke={VIOLET} strokeWidth={6} />
      {PHASES.map((p, i) => {
        const x = 400 + i * 760;
        const done = frame >= P_START[i] + 100;
        const active = frame >= P_START[i] && frame < P_START[i] + 120;
        const col = done ? TEAL : active ? VIOLET : 'rgba(200,198,228,0.45)';
        return (
          <g key={i}>
            <circle cx={x} cy={60} r={30} fill={done ? TEAL : active ? VIOLET : '#0B0D1A'} stroke={col} strokeWidth={4} filter="url(#dnaglow)" />
            {done && <path d={`M ${x - 13} 60 l 9 10 l 18 -20`} stroke="#06251F" strokeWidth={7} fill="none" strokeLinecap="round" />}
            {active && <circle cx={x} cy={60} r={44} fill="none" stroke={VIOLET} strokeWidth={3} opacity={0.5 + 0.4 * Math.sin(frame * 0.15)} />}
            <text x={x} y={140} fill={col} fontSize={32} fontFamily={FONT} fontWeight={800} textAnchor="middle" letterSpacing={2}>
              {i + 1}. {p}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Stage: kit + sample + mail (frames 70–460)
// ---------------------------------------------------------------------------
const StageKit: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 70 || frame > 490) return null;
  const t = frame - 70;
  const fade = interpolate(frame, [460, 490], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fill = interpolate(t, [40, 160], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const reg = spring({frame: t - 175, fps, config: {damping: 200, stiffness: 120}});
  const fly = interpolate(t, [250, 390], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bx = interpolate(fly, [0, 1], [1920, 3200], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const by = 1150 - Math.sin(fly * Math.PI) * 420;
  return (
    <g opacity={fade}>
      {/* the kit box */}
      <g transform={`translate(1150, 1150) scale(${Math.min(1, spring({frame: t, fps, config: {damping: 200, stiffness: 110}}))})`}>
        <rect x={-330} y={-230} width={660} height={460} rx={30} fill="#151A30" stroke={VIOLET} strokeWidth={4} />
        <text y={-150} fill={INK} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">
          DNA KIT
        </text>
        <text y={-90} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="middle">
          arrives in 3–5 days
        </text>
        {/* tube */}
        <rect x={-70} y={-20} width={140} height={190} rx={40} fill="rgba(200,198,228,0.12)" stroke="rgba(200,198,228,0.5)" strokeWidth={4} />
        <rect x={-58} y={158 - 166 * fill} width={116} height={166 * fill} rx={30} fill={VIOLET} opacity={0.75} />
        <text y={-50} fill={MUTED} fontSize={28} fontFamily={MONO} textAnchor="middle">
          {fill < 1 ? 'SPIT TO THE LINE' : 'SAMPLE COLLECTED'}
        </text>
      </g>
      {/* barcode registration */}
      {reg > 0.01 && (
        <g opacity={Math.min(1, reg)} transform="translate(1920, 1150)">
          <rect x={-260} y={-110} width={520} height={220} rx={24} fill="rgba(45,212,191,0.10)" stroke={TEAL} strokeWidth={4} filter="url(#dnaglow)" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
            <rect key={i} x={-200 + i * 34} y={-60} width={i % 3 === 0 ? 16 : 8} height={90} fill={TEAL} />
          ))}
          <text y={90} fill={TEAL} fontSize={32} fontFamily={MONO} textAnchor="middle" letterSpacing={2}>
            REGISTERED ✓
          </text>
        </g>
      )}
      {/* mailer flies to lab */}
      {fly > 0 && (
        <g transform={`translate(${bx}, ${by}) rotate(${fly * 12})`}>
          <rect x={-150} y={-100} width={300} height={200} rx={20} fill="#1B2140" stroke={TEAL} strokeWidth={4} />
          <path d="M -150 -100 L 0 10 L 150 -100" fill="none" stroke={TEAL} strokeWidth={4} />
          <text y={70} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="middle">
            PREPAID MAILER
          </text>
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={-190 - ((frame * 8 + i * 60) % 180)} cy={(i - 1) * 60} r={10} fill={TEAL} opacity={0.5} />
          ))}
        </g>
      )}
      <text x={1920} y={1760} fill={MUTED} fontSize={38} fontFamily={FONT} textAnchor="middle">
        Register the barcode — <tspan fill={TEAL}>no registration, no results</tspan>
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Stage: lab genotyping chips (frames 460–660)
// ---------------------------------------------------------------------------
const StageLab: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 460 || frame > 690) return null;
  const t = frame - 460;
  const fade = interpolate(frame, [660, 690], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const chips: React.ReactElement[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      const on = interpolate(t - (r * 8 + c) * 6, [0, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      const hue = (r * 8 + c) % 3 === 0 ? VIOLET : (r * 8 + c) % 3 === 1 ? TEAL : PINK;
      chips.push(
        <g key={`${r}-${c}`} opacity={on}>
          <rect x={c * 150} y={r * 130} width={120} height={100} rx={14} fill={hue} opacity={0.85} filter="url(#dnaglow)" />
          <text x={c * 150 + 60} y={r * 130 + 62} fill="#0B0D1A" fontSize={30} fontFamily={MONO} fontWeight={800} textAnchor="middle">
            {['A', 'T', 'C', 'G'][(r * 8 + c) % 4]}
          </text>
        </g>
      );
    }
  }
  const scan = ((t * 6) % 640) - 60;
  return (
    <g opacity={fade} transform="translate(1330, 830)">
      <text x={590} y={-60} fill={INK} fontSize={48} fontFamily={FONT} fontWeight={800} textAnchor="middle">
        THE LAB GENOTYPES YOUR SAMPLE
      </text>
      <text x={590} y={-8} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="middle">
        650,000 genetic markers · microarray chips
      </text>
      {chips}
      <rect x={-30} y={scan} width={1240} height={14} fill={VIOLET} opacity={0.8} />
      <text x={590} y={600} fill={VIOLET} fontSize={36} fontFamily={MONO} textAnchor="middle">
        ANALYZING… {Math.min(100, Math.round((t / 200) * 100))}%
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Stage: results — ancestry map bloom + trait cards (frames 640–900)
// ---------------------------------------------------------------------------
const StageResults: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  if (frame < 640) return null;
  const t = frame - 640;
  const cx = 1500;
  const cy = 1180;
  let acc = 0;
  return (
    <g>
      <text x={cx} y={660} fill={INK} fontSize={52} fontFamily={FONT} fontWeight={800} textAnchor="middle">
        YOUR ANCESTRY COMPOSITION
      </text>
      {/* donut */}
      {REGIONS.map((r, i) => {
        const rs = spring({frame: t - (20 + i * 26), fps, config: {damping: 200, stiffness: 100}});
        if (rs <= 0.001) return null;
        const start = acc;
        acc += r.p / 100;
        return (
          <g key={i} opacity={Math.min(1, rs)}>
            <circle cx={cx} cy={cy} r={300} fill="none" stroke={r.c} strokeWidth={90}
              pathLength={1} strokeDasharray={`${(r.p / 100) * Math.min(1, rs)} 1`}
              strokeDashoffset={-start} transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="butt"
              style={{filter: `drop-shadow(0 0 18px ${r.c}88)`}} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={230} fill="rgba(11,13,26,0.9)" />
      <text x={cx} y={cy - 10} fill={INK} fontSize={72} fontFamily={MONO} fontWeight={800} textAnchor="middle">
        5
      </text>
      <text x={cx} y={cy + 50} fill={MUTED} fontSize={32} fontFamily={FONT} textAnchor="middle">
        regions found
      </text>
      {/* region labels */}
      {REGIONS.map((r, i) => {
        const rs = spring({frame: t - (40 + i * 26), fps, config: {damping: 200, stiffness: 110}});
        if (rs <= 0.001) return null;
        const yy = 830 + i * 92;
        return (
          <g key={i} opacity={Math.min(1, rs)} transform={`translate(0, ${(1 - Math.min(1, rs)) * 40})`}>
            <rect x={2050} y={yy - 56} width={640} height={76} rx={38} fill="rgba(21,26,48,0.9)" stroke={r.c} strokeWidth={2.5} />
            <circle cx={2100} cy={yy - 18} r={16} fill={r.c} />
            <text x={2136} y={yy - 6} fill={INK} fontSize={30} fontFamily={FONT} fontWeight={700}>
              {r.n}
            </text>
            <text x={2640} y={yy - 6} fill={r.c} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="end">
              {r.p}%
            </text>
          </g>
        );
      })}
      {/* trait cards */}
      {TRAITS.map((tr, i) => {
        const ts = spring({frame: t - (160 + i * 24), fps, config: {damping: 200, stiffness: 110}});
        if (ts <= 0.001) return null;
        return (
          <g key={i} opacity={Math.min(1, ts)} transform={`translate(${860 + i * 330}, 1720) scale(${0.7 + Math.min(1, ts) * 0.3})`}>
            <rect x={-140} y={-60} width={280} height={120} rx={60} fill="rgba(244,114,182,0.12)" stroke={PINK} strokeWidth={3} />
            <text y={8} fill={PINK} fontSize={30} fontFamily={FONT} fontWeight={800} textAnchor="middle">
              {tr}
            </text>
          </g>
        );
      })}
    </g>
  );
};

const Stage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => (
  <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
    <Defs p="dnas" />
    <StageKit frame={frame} fps={fps} />
    <StageLab frame={frame} fps={fps} />
    <StageResults frame={frame} fps={fps} />
  </svg>
);

const Footer: React.FC<{frame: number}> = ({frame}) => {
  const fade = interpolate(frame, [120, 170], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', bottom: 44, left: 0, width: 3840, textAlign: 'center', color: 'rgba(165,160,220,0.5)', fontFamily: FONT, fontSize: 26, opacity: fade}}>
      Illustrative concept. Genetic data is sensitive — review privacy policies before testing.
    </div>
  );
};

export const DNATestingJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Helices frame={frame} />
      <Particles frame={frame} />
      <Title frame={frame} />
      <PhaseRail frame={frame} />
      <Stage frame={frame} fps={fps} />
      <Ticker frame={frame} />
      <Dither frame={frame} />
      <Grain frame={frame} />
      <Corners frame={frame} />
      <Footer frame={frame} />
    </AbsoluteFill>
  );
};
