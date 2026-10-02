/**
 * FluVaccinationJourney.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The flu-vaccination story as a process: FLU SEASON arrives (cases rise) ->
 * the VACCINE trains your immune system -> YOUR SHIELD of antibodies builds
 * -> COMMUNITY PROTECTION as transmission chains break. Educational, never
 * a pharmacy ad. Brand-neutral, deterministic.
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
// Palette (cool steel, amber alert, protection green)
// ---------------------------------------------------------------------------
const BG = '#0C1420';
const INK = '#F2F6FB';
const MUTED = 'rgba(242,246,251,0.62)';
const FAINT = 'rgba(242,246,251,0.32)';
const AMBER = '#FBBF24';
const SKY = '#38BDF8';
const GREEN = '#34D399';
const RED = '#F87171';
const PANEL = 'rgba(13,20,33,0.92)';
const HAIRLINE = 'rgba(242,246,251,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: fv
// ---------------------------------------------------------------------------
const Background_fv: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#A9C8E8" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(56,189,248,0.12), rgba(56,189,248,0.03) 46%, rgba(12,20,32,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#fvVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(56,189,248,0.045)" />
        <defs>
          <radialGradient id="fvVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(12,20,32,0)" />
            <stop offset="100%" stopColor="rgba(4,8,14,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_fv: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`fv-amb-x-${i}`) * 3840;
    const by = random(`fv-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`fv-amb-s-${i}`) * 1.4;
    const ang = random(`fv-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`fv-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? SKY : i % 4 === 1 ? AMBER : 'rgba(242,246,251,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_fv: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`fv-dth-x-${i}`) * 3840;
    const by = random(`fv-dth-y-${i}`) * 2160;
    const jx = (random(`fv-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`fv-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`fv-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`fv-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#D8E9F7" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_fv = [
  'FLU SEASON: OCT\u2013MAR',
  'VACCINE TRAINS IMMUNITY',
  'ANTIBODIES IN ~2 WEEKS',
  'REDUCES SEVERE ILLNESS',
  'PROTECTS THE VULNERABLE',
  'HERD EFFECT',
  'ANNUAL SHOT',
  'ONE SHOT \u00B7 WHOLE COMMUNITY',
];
const TickerTape_fv: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_fv.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(56,189,248,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(5,9,16,0.66)', borderBottom: '1px solid rgba(242,246,251,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_fv: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(56,189,248,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={SKY} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? SKY : 'rgba(242,246,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? SKY : 'rgba(242,246,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_fv: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`fv-grain-x-${frame}-${i}`) * 3840;
    const y = random(`fv-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`fv-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`fv-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_fv: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        FLU VACCINATION JOURNEY
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        How one shot trains your immune system &middot; and shields a community
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 1: flu season curve (left)
// ---------------------------------------------------------------------------
const SeasonCurve_fv: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 110, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const L = 260;
  const Rr = 1180;
  const T = 700;
  const Bb = 1300;
  const N = 40;
  const vals: number[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    vals.push(8 + 78 * Math.exp(-Math.pow((t - 0.62) * 3.4, 2)));
  }
  const xFor = (i: number) => L + (i / (N - 1)) * (Rr - L);
  const yFor = (v: number) => Bb - (v / 100) * (Bb - T);
  const draw = interpolate(frame, [140, 330], [0, 1], clamp01);
  const path = vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`).join(' ');
  const area = `${path} L ${xFor(N - 1).toFixed(1)} ${Bb} L ${xFor(0).toFixed(1)} ${Bb} Z`;
  const virus: React.ReactElement[] = [];
  for (let i = 0; i < 26; i++) {
    const bx = random(`fv-vir-x-${i}`) * 800 + 200;
    const by = random(`fv-vir-y-${i}`) * 500 + 620;
    const fl = Math.sin(frame * 0.06 + i * 2.2) * 26;
    const rr = 14 + random(`fv-vir-r-${i}`) * 16;
    virus.push(
      <g key={i} transform={`translate(${bx + fl * 0.7},${by + fl * 0.4})`}>
        <circle r={rr} fill="none" stroke={AMBER} strokeWidth={4} opacity={0.75} />
        {Array.from({length: 8}, (_, k) => {
          const a = (k / 8) * Math.PI * 2;
          return <line key={k} x1={Math.cos(a) * rr} y1={Math.sin(a) * rr} x2={Math.cos(a) * (rr + 12)} y2={Math.sin(a) * (rr + 12)} stroke={AMBER} strokeWidth={4} opacity={0.75} />;
        })}
      </g>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {virus}
        <path d={area} fill="rgba(251,191,36,0.14)" />
        <path d={path} fill="none" stroke={AMBER} strokeWidth={7} strokeLinecap="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw}
          style={{filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.55))'}} />
        <text x={L} y={T - 40} fill={AMBER} fontSize={36} fontFamily={MONO} fontWeight={800}>
          STAGE 1 &middot; FLU SEASON ARRIVES
        </text>
        <text x={L} y={Bb + 64} fill={MUTED} fontSize={30} fontFamily={MONO}>OCT</text>
        <text x={Rr - 40} y={Bb + 64} fill={MUTED} fontSize={30} fontFamily={MONO} textAnchor="end">MAR</text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 2+3: vaccine -> antibody shield (center)
// ---------------------------------------------------------------------------
const Shield_fv: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 330, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const cx = 1920;
  const cy = 1050;
  const jab = interpolate(frame, [360, 420], [0, 1], clamp01);
  const abCount = 28;
  const abOn = Math.floor(interpolate(frame, [430, 640], [0, abCount], clamp01));
  const pulse = 0.5 + 0.5 * Math.sin((frame - 430) * 0.1);
  const shieldR = 300;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {/* vaccine vial */}
        <g opacity={1 - jab * 0.9} transform={`translate(${cx - 420},${cy - 120 + jab * 120})`}>
          <rect x={-46} y={-110} width={92} height={190} rx={20} fill="rgba(56,189,248,0.14)" stroke={SKY} strokeWidth={5} />
          <rect x={-20} y={-160} width={40} height={52} fill={SKY} opacity={0.7} />
          <rect x={-30} y={-30} width={60} height={100} rx={10} fill={SKY} opacity={0.55} />
          <text x={0} y={130} fill={SKY} fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle">VACCINE</text>
        </g>
        {/* person */}
        <circle cx={cx} cy={cy - 60} r={72} fill="#16324F" stroke={SKY} strokeWidth={5} />
        <path d={`M ${cx - 110} ${cy + 170} Q ${cx} ${cy + 40} ${cx + 110} ${cy + 170}`} fill="none" stroke="#16324F" strokeWidth={96} strokeLinecap="round" />
        {/* antibody ring */}
        {Array.from({length: abCount}, (_, i) => {
          if (i >= abOn) return null;
          const a = (i / abCount) * Math.PI * 2 + frame * 0.004;
          const ax = cx + shieldR * Math.cos(a);
          const ay = cy + shieldR * Math.sin(a);
          return (
            <g key={i} transform={`translate(${ax},${ay}) rotate(${(a * 180) / Math.PI + 90})`}>
              <line x1={0} y1={-26} x2={0} y2={26} stroke={GREEN} strokeWidth={10} strokeLinecap="round" />
              <line x1={-16} y1={-26} x2={-16} y2={-8} stroke={GREEN} strokeWidth={8} strokeLinecap="round" />
              <line x1={16} y1={-26} x2={16} y2={-8} stroke={GREEN} strokeWidth={8} strokeLinecap="round" />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={shieldR} fill="none" stroke={GREEN} strokeWidth={4} opacity={0.25 + pulse * 0.3}
          strokeDasharray="24 30" />
        <text x={cx} y={cy + 420} fill={GREEN} fontSize={40} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          STAGE 2\u20133 &middot; ANTIBODY SHIELD ({abOn}/{abCount})
        </text>
        <text x={cx} y={cy + 470} fill={MUTED} fontSize={30} fontFamily={FONT} textAnchor="middle">
          the vaccine trains your immune system \u00B7 protection builds in ~2 weeks
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 4: community herd effect (right)
// ---------------------------------------------------------------------------
const Community_fv: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 620, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const nodes: {x: number; y: number}[] = [];
  for (let i = 0; i < 24; i++) {
    nodes.push({
      x: 2560 + (i % 6) * 210 + random(`fv-nx-${i}`) * 60,
      y: 700 + Math.floor(i / 6) * 210 + random(`fv-ny-${i}`) * 60,
    });
  }
  const links: [number, number][] = [];
  for (let i = 0; i < 24; i++) {
    for (let j = i + 1; j < 24; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      if (Math.hypot(dx, dy) < 320) links.push([i, j]);
    }
  }
  const prot = interpolate(frame, [660, 840], [0, 1], clamp01);
  const protCount = Math.floor(prot * 24);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s)}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {links.map(([a, b], k) => {
          const broken = a < protCount && b < protCount;
          return (
            <line key={k} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
              stroke={broken ? 'rgba(52,211,153,0.35)' : RED} strokeWidth={broken ? 3 : 5}
              opacity={broken ? 0.5 : 0.75} strokeDasharray={broken ? '10 14' : 'none'} />
          );
        })}
        {nodes.map((n, i) => {
          const on = i < protCount;
          const ns = spring({frame: frame - (660 + i * 7), fps, config: {damping: 200, stiffness: 140}});
          const col = on ? GREEN : RED;
          return (
            <g key={i} opacity={0.35 + ns * 0.65}>
              <circle cx={n.x} cy={n.y} r={on ? 44 : 36} fill={on ? 'rgba(52,211,153,0.16)' : 'rgba(248,113,113,0.14)'}
                stroke={col} strokeWidth={5} />
              <text x={n.x} y={n.y + 12} fill={col} fontSize={30} fontWeight={800} textAnchor="middle">
                {on ? '\u2713' : '!'}
              </text>
            </g>
          );
        })}
        <text x={3120} y={1620} fill={GREEN} fontSize={40} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          STAGE 4 &middot; COMMUNITY SHIELD
        </text>
        <text x={3120} y={1670} fill={MUTED} fontSize={30} fontFamily={FONT} textAnchor="middle">
          {protCount}/24 protected \u00B7 chains of spread break
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Payoff
// ---------------------------------------------------------------------------
const Payoff_fv: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 830, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 130, display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        borderRadius: 30, padding: '30px 90px', background: 'rgba(5,18,14,0.94)',
        border: `3px solid ${GREEN}`, textAlign: 'center', boxShadow: '0 0 70px rgba(52,211,153,0.35)',
      }}>
        <div style={{color: GREEN, fontFamily: FONT, fontWeight: 800, fontSize: 60, letterSpacing: 1}}>
          ONE SHOT \u00B7 WHOLE COMMUNITY PROTECTED
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const FluVaccinationJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_fv frame={frame} />
      <AmbientParticles_fv frame={frame} />
      <Title_fv frame={frame} fps={fps} />
      <SeasonCurve_fv frame={frame} fps={fps} />
      <Shield_fv frame={frame} fps={fps} />
      <Community_fv frame={frame} fps={fps} />
      <Payoff_fv frame={frame} fps={fps} />
      <TickerTape_fv frame={frame} />
      <CornerHud_fv frame={frame} />
      <FineDither_fv frame={frame} />
      <FilmGrain_fv frame={frame} />
    </AbsoluteFill>
  );
};
