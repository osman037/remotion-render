/**
 * SmartHomeEnergyFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A smart home energy scene: sun arc drives solar output; animated energy
 * particles flow solar -> home -> battery -> grid, with live kW counters.
 *
 * Register in Root.tsx:
 *   <Composition id="SmartHomeEnergyFlow" component={SmartHomeEnergyFlow}
 *     width={3840} height={2160} fps={60} durationInFrames={900} />
 */

import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const BG = '#05080F';
const PANEL = 'rgba(10, 17, 30, 0.92)';
const HAIRLINE = 'rgba(148, 163, 184, 0.22)';
const INK = '#EAF0FA';
const MUTED = 'rgba(190, 203, 224, 0.68)';
const FAINT = 'rgba(148, 163, 184, 0.40)';
const SUN = '#FBBF24';
const SUN_DIM = 'rgba(251, 191, 36, 0.16)';
const SOLAR_BLUE = '#38BDF8';
const EMERALD = '#34D399';
const EMERALD_DIM = 'rgba(52, 211, 153, 0.15)';
const VIOLET = '#A78BFA';
const ROSE = '#FB7185';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const prog = (frame: number, start: number, end: number) =>
  clamp01((frame - start) / (end - start));
const entr = (frame: number, delay: number, fps: number) =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping: 19, stiffness: 130},
  });
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Pt = {x: number; y: number};
const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
};

// Flow paths (quadratic beziers)
const P_SOLAR_HOME = {a: {x: 1330, y: 1080}, c: {x: 1440, y: 1240}, b: {x: 1560, y: 1260}};
const P_SOLAR_BATT = {a: {x: 1330, y: 1120}, c: {x: 1950, y: 980}, b: {x: 2480, y: 1180}};
const P_BATT_HOME = {a: {x: 2480, y: 1330}, c: {x: 2410, y: 1450}, b: {x: 2330, y: 1330}};
const P_HOME_GRID = {a: {x: 2330, y: 1240}, c: {x: 2720, y: 1060}, b: {x: 3120, y: 1120}};

// Sun position across the sky
const sunPos = (frame: number): Pt => {
  const t = clamp01(frame / 900);
  return {x: 320 + t * 3200, y: 560 - Math.sin(Math.PI * t) * 380};
};

// ---------------------------------------------------------------------------
// Background — sky glow follows the sun, grid, vignette
// ---------------------------------------------------------------------------
const Background: React.FC<{frame: number}> = ({frame}) => {
  const sun = sunPos(frame);
  const sweepX = interpolate(frame, [0, 900], [-1400, 5200], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill>
      <svg width={3840} height={2160}>
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="emeraldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <stop offset="55%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
          </radialGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="160" />
          </filter>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx={sun.x} cy={sun.y} rx={700} ry={460} fill="url(#sunGlow)" filter="url(#softBlur)" />
        <ellipse cx={1920} cy={1900} rx={1300} ry={420} fill="url(#emeraldGlow)" filter="url(#softBlur)" />
        {Array.from({length: 13}, (_, i) => (
          <line key={'v' + i} x1={i * 320} y1={0} x2={i * 320} y2={2160} stroke={HAIRLINE} strokeWidth={1} />
        ))}
        {Array.from({length: 8}, (_, i) => (
          <line key={'h' + i} x1={0} y1={i * 320} x2={3840} y2={i * 320} stroke={HAIRLINE} strokeWidth={1} />
        ))}
        {/* ground line */}
        <rect x={0} y={1620} width={3840} height={540} fill="rgba(8,14,26,0.55)" />
        <line x1={0} y1={1620} x2={3840} y2={1620} stroke={HAIRLINE} strokeWidth={2} />
        <rect x={sweepX - 420} y={0} width={840} height={2160} fill="url(#sweepGrad)" />
        <rect width={3840} height={2160} fill="url(#vignette)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Sun + arc
// ---------------------------------------------------------------------------
const Sun: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 30, fps);
  const sun = sunPos(frame);
  const arc = useMemo(() => {
    let d = '';
    for (let i = 0; i <= 60; i++) {
      const p = sunPos((i / 60) * 900);
      d += (i === 0 ? 'M' : 'L') + p.x.toFixed(0) + ' ' + p.y.toFixed(0) + ' ';
    }
    return d;
  }, []);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: e}}>
      <svg width={3840} height={2160}>
        <defs>
          <filter id="sunBlur" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="34" />
          </filter>
        </defs>
        <path d={arc} fill="none" stroke={HAIRLINE} strokeWidth={3} strokeDasharray="14 18" />
        <circle cx={sun.x} cy={sun.y} r={110} fill={SUN} opacity={0.35} filter="url(#sunBlur)" />
        <circle cx={sun.x} cy={sun.y} r={64} fill={SUN} opacity={0.95} />
        <circle cx={sun.x} cy={sun.y} r={64} fill="none" stroke="#FFF7E0" strokeWidth={5} />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Flow path with particles
// ---------------------------------------------------------------------------
const FlowPath: React.FC<{
  frame: number;
  path: {a: Pt; c: Pt; b: Pt};
  color: string;
  intensity: number;
  delay: number;
  seed: number;
}> = ({frame, path, color, intensity, delay, seed}) => {
  const show = prog(frame, delay, delay + 60);
  const N = 16;
  return (
    <g opacity={show * (0.25 + 0.75 * intensity)}>
      <path
        d={`M ${path.a.x} ${path.a.y} Q ${path.c.x} ${path.c.y} ${path.b.x} ${path.b.y}`}
        fill="none"
        stroke={color}
        strokeWidth={5}
        opacity={0.30}
        strokeDasharray="10 14"
      />
      {Array.from({length: N}, (_, i) => {
        const t = ((frame * 0.004 * (0.5 + intensity) + i / N + rand(seed + i) * 0.05) % 1 + 1) % 1;
        const p = quad(path.a, path.c, path.b, t);
        const r = 7 + 5 * intensity;
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={r * 2.2} fill={color} opacity={0.25 * intensity} />
            <circle cx={p.x} cy={p.y} r={r} fill={color} opacity={0.9} />
            <circle cx={p.x} cy={p.y} r={r * 0.45} fill="#FFFFFF" opacity={0.9} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Solar panel array
// ---------------------------------------------------------------------------
const SolarPanels: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 90, fps);
  const tilt = -0.32;
  const panel = (x: number, y: number, i: number) => (
    <g key={i} transform={`translate(${x} ${y}) rotate(${(tilt * 180) / Math.PI})`}>
      <rect x={-150} y={-95} width={300} height={190} rx={10} fill="#0A1830" stroke={SOLAR_BLUE} strokeWidth={5} />
      {[-50, 50].map((lx) => (
        <line key={lx} x1={lx} y1={-95} x2={lx} y2={95} stroke="rgba(56,189,248,0.5)" strokeWidth={3} />
      ))}
      <line x1={-150} y1={0} x2={150} y2={0} stroke="rgba(56,189,248,0.5)" strokeWidth={3} />
      <line x1={-140} y1={-80} x2={140} y2={-80} stroke="rgba(255,255,255,0.25)" strokeWidth={6} />
    </g>
  );
  return (
    <div style={{position: 'absolute', inset: 0, opacity: e, transform: `translateY(${(1 - e) * 50}px)`}}>
      <svg width={3840} height={2160}>
        <rect x={880} y={1180} width={760} height={26} rx={13} fill="#13233D" stroke={HAIRLINE} strokeWidth={2} />
        <rect x={900} y={1206} width={34} height={300} fill="#13233D" />
        <rect x={1586} y={1206} width={34} height={300} fill="#13233D" />
        {panel(1080, 1030, 0)}
        {panel(1420, 1030, 1)}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// House
// ---------------------------------------------------------------------------
const House: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 130, fps);
  const flick = 0.85 + 0.15 * Math.sin(frame * 0.06);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: e, transform: `translateY(${(1 - e) * 60}px)`}}>
      <svg width={3840} height={2160}>
        <defs>
          <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B2C4E" />
            <stop offset="100%" stopColor="#0D1729" />
          </linearGradient>
          <filter id="winGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        {/* body */}
        <rect x={1560} y={1230} width={770} height={390} rx={12} fill="#0E1A2F" stroke={HAIRLINE} strokeWidth={3} />
        {/* roof */}
        <polygon points="1500,1230 1945,1010 2390,1230" fill="url(#roofGrad)" stroke="rgba(148,163,184,0.4)" strokeWidth={4} />
        {/* chimney */}
        <rect x={2180} y={1040} width={70} height={130} fill="#0E1A2F" stroke={HAIRLINE} strokeWidth={3} />
        {/* windows */}
        {[1680, 2080].map((wx) => (
          <g key={wx}>
            <rect x={wx} y={1330} width={150} height={130} rx={10} fill={SUN} opacity={0.30 * flick} filter="url(#winGlow)" />
            <rect x={wx} y={1330} width={150} height={130} rx={10} fill="rgba(251,191,36,0.85)" opacity={flick} />
            <line x1={wx + 75} y1={1330} x2={wx + 75} y2={1460} stroke="#0E1A2F" strokeWidth={6} />
            <line x1={wx} y1={1395} x2={wx + 150} y2={1395} stroke="#0E1A2F" strokeWidth={6} />
          </g>
        ))}
        {/* door */}
        <rect x={1885} y={1400} width={120} height={220} rx={10} fill="#13233D" stroke={HAIRLINE} strokeWidth={3} />
        <circle cx={1985} cy={1515} r={8} fill={SUN} />
        {/* label */}
        <text x={1945} y={1300} textAnchor="middle" fontFamily={MONO} fontSize={30} letterSpacing={5} fill={MUTED}>
          HOME
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Battery unit
// ---------------------------------------------------------------------------
const Battery: React.FC<{frame: number; fps: number; charge: number}> = ({frame, fps, charge}) => {
  const e = entr(frame, 170, fps);
  const h = 300;
  const fillH = (charge / 100) * (h - 40);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: e, transform: `translateY(${(1 - e) * 60}px)`}}>
      <svg width={3840} height={2160}>
        <defs>
          <linearGradient id="battFill" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#A7F3D0" />
          </linearGradient>
          <filter id="battGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="20" />
          </filter>
        </defs>
        <rect x={2500} y={1150} width={260} height={h + 60} rx={24} fill="#0E1A2F" stroke={HAIRLINE} strokeWidth={3} />
        <rect x={2590} y={1122} width={80} height={28} rx={8} fill="#0E1A2F" stroke={HAIRLINE} strokeWidth={3} />
        <rect x={2520} y={1170} width={220} height={h} rx={14} fill="rgba(148,163,184,0.10)" />
        <rect
          x={2520}
          y={1170 + h - fillH}
          width={220}
          height={fillH}
          rx={14}
          fill="url(#battFill)"
          opacity={0.92}
          filter="url(#battGlow)"
        />
        <text x={2630} y={1300} textAnchor="middle" fontFamily={MONO} fontSize={64} fontWeight={700} fill={INK}>
          {Math.round(charge)}
          <tspan fontSize={34}>%</tspan>
        </text>
        <text x={2630} y={1560} textAnchor="middle" fontFamily={MONO} fontSize={30} letterSpacing={5} fill={MUTED}>
          BATTERY
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Grid tower
// ---------------------------------------------------------------------------
const Grid: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 210, fps);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: e, transform: `translateY(${(1 - e) * 60}px)`}}>
      <svg width={3840} height={2160}>
        <polygon points="3180,1620 3260,1620 3235,1120 3205,1120" fill="#0E1A2F" stroke={HAIRLINE} strokeWidth={3} />
        <line x1={3140} y1={1180} x2={3300} y2={1180} stroke={HAIRLINE} strokeWidth={6} />
        <line x1={3160} y1={1300} x2={3280} y2={1300} stroke={HAIRLINE} strokeWidth={6} />
        {[1180, 1300].map((y) => (
          <g key={y}>
            <circle cx={3150} cy={y + 34} r={12} fill={VIOLET} opacity={0.9} />
            <circle cx={3290} cy={y + 34} r={12} fill={VIOLET} opacity={0.9} />
          </g>
        ))}
        <line x1={3150} y1={1214} x2={3840} y2={1140} stroke="rgba(167,139,250,0.35)" strokeWidth={3} />
        <line x1={3290} y1={1214} x2={3840} y2={1260} stroke="rgba(167,139,250,0.35)" strokeWidth={3} />
        <text x={3220} y={1560} textAnchor="middle" fontFamily={MONO} fontSize={30} letterSpacing={5} fill={MUTED}>
          GRID
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const Header: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 20, fps);
  const pulse = 0.55 + 0.45 * Math.sin(frame * 0.12);
  return (
    <div
      style={{
        position: 'absolute',
        top: 110,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: e,
        transform: `translateY(${(1 - e) * 40}px)`,
      }}
    >
      <div>
        <div style={{fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: SUN, marginBottom: 14}}>
          RESIDENTIAL
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 700,
            color: INK,
            letterSpacing: -1,
            textShadow: '0 4px 40px rgba(251,191,36,0.30)',
          }}
        >
          Smart Home Energy
        </div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            background: EMERALD,
            opacity: pulse,
            boxShadow: '0 0 26px rgba(52,211,153,0.9)',
          }}
        />
        <span style={{fontFamily: MONO, fontSize: 34, letterSpacing: 4, color: EMERALD}}>LIVE</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Live stat chips (bottom)
// ---------------------------------------------------------------------------
const StatChips: React.FC<{
  frame: number;
  fps: number;
  solarKw: number;
  loadKw: number;
  charge: number;
  gridKw: number;
}> = ({frame, fps, solarKw, loadKw, charge, gridKw}) => {
  const e = entr(frame, 260, fps);
  const chips = [
    {label: 'SOLAR OUTPUT', value: solarKw.toFixed(1) + ' kW', color: SUN},
    {label: 'HOME LOAD', value: loadKw.toFixed(1) + ' kW', color: SOLAR_BLUE},
    {label: 'BATTERY', value: Math.round(charge) + '%', color: EMERALD},
    {label: 'GRID EXPORT', value: gridKw.toFixed(1) + ' kW', color: VIOLET},
  ];
  return (
    <div
      style={{
        position: 'absolute',
        left: 240,
        right: 240,
        bottom: 150,
        display: 'flex',
        gap: 28,
        opacity: e,
        transform: `translateY(${(1 - e) * 50}px)`,
      }}
    >
      {chips.map((c) => (
        <div
          key={c.label}
          style={{
            flex: 1,
            background: PANEL,
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 22,
            padding: '30px 40px',
            borderTop: `4px solid ${c.color}`,
          }}
        >
          <div style={{fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: FAINT, marginBottom: 10}}>
            {c.label}
          </div>
          <div style={{fontFamily: MONO, fontSize: 62, fontWeight: 700, color: INK}}>{c.value}</div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const Footer: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const e = entr(frame, 60, fps);
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 56,
        left: 240,
        right: 240,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: MONO,
        fontSize: 27,
        letterSpacing: 4,
        color: FAINT,
        opacity: e,
      }}
    >
      <span>SELF-POWERED 78%</span>
      <span style={{color: MUTED}}>◈&nbsp;&nbsp;SOLAR · BATTERY · GRID</span>
      <span>ENERGY MONITOR · DEMO PREVIEW</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const SmartHomeEnergyFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const sunT = clamp01(frame / 900);
  const solarKw = 8.6 * Math.sin(Math.PI * clamp01((frame - 40) / 820));
  const loadKw = 2.9 + 0.7 * Math.sin(frame * 0.045) + 0.3 * Math.sin(frame * 0.013 + 2);
  const charge = 62 + 32 * prog(frame, 120, 800);
  const gridKw = Math.max(0.4, 1.1 + 3.6 * Math.sin(Math.PI * clamp01((frame - 100) / 760)));

  const iSolarHome = 0.9;
  const iSolarBatt = 0.35 + 0.65 * Math.sin(Math.PI * sunT);
  const iBattHome = 0.25 + 0.75 * prog(frame, 420, 800);
  const iHomeGrid = 0.3 + 0.7 * prog(frame, 300, 700);

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background frame={frame} />
      <Sun frame={frame} fps={fps} />
      <SolarPanels frame={frame} fps={fps} />
      <House frame={frame} fps={fps} />
      <Battery frame={frame} fps={fps} charge={charge} />
      <Grid frame={frame} fps={fps} />
      <div style={{position: 'absolute', inset: 0}}>
        <svg width={3840} height={2160}>
          <FlowPath frame={frame} path={P_SOLAR_HOME} color={SUN} intensity={iSolarHome} delay={200} seed={11} />
          <FlowPath frame={frame} path={P_SOLAR_BATT} color={EMERALD} intensity={iSolarBatt} delay={260} seed={23} />
          <FlowPath frame={frame} path={P_BATT_HOME} color={SOLAR_BLUE} intensity={iBattHome} delay={420} seed={37} />
          <FlowPath frame={frame} path={P_HOME_GRID} color={VIOLET} intensity={iHomeGrid} delay={340} seed={51} />
        </svg>
      </div>
      <Header frame={frame} fps={fps} />
      <StatChips frame={frame} fps={fps} solarKw={solarKw} loadKw={loadKw} charge={charge} gridKw={gridKw} />
      <Footer frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

export default SmartHomeEnergyFlow;
