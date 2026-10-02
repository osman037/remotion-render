/**
 * SmartHomeSetupFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * The universal smart-home onboarding process: hub powers on, the app
 * connects, four devices pair one by one, automation scenes are created,
 * and the first voice command lands. Brand-neutral, deterministic.
 * (Device onboarding only — no energy dashboards.)
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
// Palette (deep indigo, violet, blue)
// ---------------------------------------------------------------------------
const BG = '#0A0A1E';
const INK = '#F1F3FB';
const MUTED = 'rgba(241,243,251,0.62)';
const FAINT = 'rgba(241,243,251,0.32)';
const VIOLET = '#A78BFA';
const BLUE = '#60A5FA';
const CYAN = '#67E8F9';
const GREEN = '#34D399';
const PANEL = 'rgba(12,13,32,0.92)';
const HAIRLINE = 'rgba(241,243,251,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: sh
// ---------------------------------------------------------------------------
const Background_sh: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#B7C4FF" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 32%, rgba(167,139,250,0.13), rgba(167,139,250,0.03) 46%, rgba(10,10,30,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#shVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(167,139,250,0.045)" />
        <defs>
          <radialGradient id="shVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(10,10,30,0)" />
            <stop offset="100%" stopColor="rgba(3,3,12,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_sh: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`sh-amb-x-${i}`) * 3840;
    const by = random(`sh-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`sh-amb-s-${i}`) * 1.4;
    const ang = random(`sh-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`sh-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? CYAN : i % 4 === 1 ? VIOLET : 'rgba(241,243,251,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_sh: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`sh-dth-x-${i}`) * 3840;
    const by = random(`sh-dth-y-${i}`) * 2160;
    const jx = (random(`sh-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`sh-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`sh-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`sh-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#D6DBFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_sh = [
  'HUB ONLINE',
  'APP CONNECTED',
  '4 DEVICES PAIRED',
  '2 SCENES CREATED',
  'VOICE READY',
  'SECURE PAIRING',
  'FIRMWARE CURRENT',
  'FIRST COMMAND SENT',
];
const TickerTape_sh: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_sh.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(167,139,250,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(5,5,18,0.66)', borderBottom: '1px solid rgba(241,243,251,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_sh: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(167,139,250,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={VIOLET} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? VIOLET : 'rgba(241,243,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? VIOLET : 'rgba(241,243,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_sh: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`sh-grain-x-${frame}-${i}`) * 3840;
    const y = random(`sh-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`sh-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`sh-grain-s-${frame}-${i}`) * 3;
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
const Title_sh: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        SMART HOME SETUP FLOW
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        Unbox the hub &middot; pair every device &middot; say the first command
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Central hub with radiating pairing rings
// ---------------------------------------------------------------------------
const Hub_sh: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 90, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const cx = 1920;
  const cy = 1030;
  const powered = interpolate(frame, [130, 200], [0, 1], clamp01);
  const rings = [0, 1, 2].map((r) => {
    const t = ((frame - 130) / 90 + r / 3) % 1;
    return {r: 90 + t * 620, o: (1 - t) * 0.5 * powered};
  });
  const pulse = 0.5 + 0.5 * Math.sin((frame - 130) * 0.12);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, s), transform: `scale(${0.85 + s * 0.15})`, transformOrigin: `${cx}px ${cy}px`}}>
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {rings.map((rg, i) => (
          <circle key={i} cx={cx} cy={cy} r={rg.r} fill="none" stroke={VIOLET} strokeWidth={4} opacity={rg.o} />
        ))}
        <rect x={cx - 110} y={cy - 110} width={220} height={220} rx={56} fill="#141432" stroke={powered > 0.5 ? VIOLET : HAIRLINE} strokeWidth={5}
          style={{filter: powered > 0.5 ? `drop-shadow(0 0 ${30 + pulse * 40}px rgba(167,139,250,0.6))` : 'none'}} />
        <circle cx={cx} cy={cy - 28} r={34} fill="none" stroke={powered > 0.5 ? CYAN : FAINT} strokeWidth={9} />
        <circle cx={cx} cy={cy - 28} r={10} fill={powered > 0.5 ? CYAN : FAINT} opacity={0.4 + pulse * 0.6} />
        <text x={cx} y={cy + 66} fill={powered > 0.5 ? INK : FAINT} fontSize={34} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {powered > 0.5 ? 'HUB ONLINE' : 'HUB'}
        </text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Devices pairing around the hub
// ---------------------------------------------------------------------------
interface Device_sh {name: string; glyph: string; at: number; x: number; y: number;}
const DEVICES_sh: Device_sh[] = [
  {name: 'SMART BULB', glyph: '\u25CB', at: 300, x: 640, y: 560},
  {name: 'THERMOSTAT', glyph: '\u25CE', at: 400, x: 3200, y: 560},
  {name: 'CAMERA', glyph: '\u25C9', at: 500, x: 640, y: 1500},
  {name: 'SPEAKER', glyph: '\u25C8', at: 600, x: 3200, y: 1500},
];
const Devices_sh: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {DEVICES_sh.map((d) => {
        const s = spring({frame: frame - d.at, fps, config: {damping: 200, stiffness: 100}});
        if (s <= 0.001) return null;
        const paired = interpolate(frame, [d.at + 60, d.at + 110], [0, 1], clamp01);
        return (
          <g key={d.name} opacity={Math.min(1, s)}>
            <line x1={1920} y1={1030} x2={d.x} y2={d.y} stroke={VIOLET} strokeWidth={4}
              strokeDasharray="18 22" opacity={0.15 + paired * 0.55} />
            <g transform={`translate(${d.x},${d.y}) scale(${0.8 + s * 0.2})`}>
              <rect x={-150} y={-110} width={300} height={220} rx={30} fill={PANEL}
                stroke={paired > 0.5 ? GREEN : HAIRLINE} strokeWidth={paired > 0.5 ? 4 : 2.5} />
              <text x={0} y={-8} fill={paired > 0.5 ? GREEN : FAINT} fontSize={72} textAnchor="middle">{d.glyph}</text>
              <text x={0} y={58} fill={INK} fontSize={32} fontFamily={MONO} fontWeight={800} textAnchor="middle">{d.name}</text>
              {paired > 0.02 && (
                <g opacity={paired}>
                  <circle cx={118} cy={-78} r={30} fill={GREEN} />
                  <text x={118} y={-64} fill="#05281D" fontSize={34} fontWeight={800} textAnchor="middle">\u2713</text>
                </g>
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// App connect panel (left) + scenes + voice command (right)
// ---------------------------------------------------------------------------
const AppPanel_sh: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 190, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const prog = interpolate(frame, [230, 330], [0, 1], clamp01);
  return (
    <div style={{
      position: 'absolute', left: 220, top: 1290, width: 560, height: 470, borderRadius: 28,
      background: PANEL, border: `2px solid ${HAIRLINE}`, padding: '40px 48px',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 3}}>STEP 2 &middot; APP CONNECT</div>
      <div style={{display: 'flex', justifyContent: 'center', margin: '26px 0'}}>
        <div style={{width: 150, height: 150, borderRadius: 24, background: 'rgba(241,243,251,0.06)', border: `2px dashed ${BLUE}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{color: BLUE, fontFamily: MONO, fontSize: 26, textAlign: 'center'}}>QR<br />PAIR</div>
        </div>
      </div>
      <div style={{height: 30, borderRadius: 15, background: 'rgba(241,243,251,0.08)', overflow: 'hidden'}}>
        <div style={{width: `${prog * 100}%`, height: '100%', background: `linear-gradient(90deg, ${VIOLET}, ${BLUE})`}} />
      </div>
      <div style={{color: prog > 0.98 ? GREEN : MUTED, fontFamily: MONO, fontSize: 30, marginTop: 18, textAlign: 'center'}}>
        {prog > 0.98 ? '\u2713 CONNECTED' : `PAIRING ${Math.round(prog * 100)}%`}
      </div>
    </div>
  );
};

const Scenes_sh: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const scenes = [
    {name: 'MOVIE NIGHT', desc: 'lights dim \u00B7 TV on', at: 690},
    {name: 'GOOD MORNING', desc: 'blinds up \u00B7 72\u00B0F', at: 750},
  ];
  return (
    <div style={{position: 'absolute', right: 220, top: 1290, width: 560, display: 'flex', flexDirection: 'column', gap: 28}}>
      {scenes.map((sc) => {
        const s = spring({frame: frame - sc.at, fps, config: {damping: 200, stiffness: 100}});
        if (s <= 0.001) return null;
        return (
          <div key={sc.name} style={{
            borderRadius: 26, background: PANEL, border: `2px solid rgba(167,139,250,0.35)`,
            padding: '30px 44px', opacity: Math.min(1, s), transform: `translateX(${(1 - s) * 80}px)`,
          }}>
            <div style={{color: MUTED, fontFamily: MONO, fontSize: 24, letterSpacing: 3}}>SCENE CREATED</div>
            <div style={{color: VIOLET, fontFamily: FONT, fontWeight: 800, fontSize: 46, marginTop: 8}}>{sc.name}</div>
            <div style={{color: MUTED, fontFamily: FONT, fontSize: 30, marginTop: 6}}>{sc.desc}</div>
          </div>
        );
      })}
    </div>
  );
};

const Voice_sh: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 800, fps, config: {damping: 200, stiffness: 80}});
  if (s <= 0.001) return null;
  const bars = Array.from({length: 24}, (_, i) => {
    const h = 24 + 60 * (0.5 + 0.5 * Math.sin((frame - 800) * 0.35 + i * 0.9));
    return h;
  });
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 120, display: 'flex', justifyContent: 'center',
      opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{
        borderRadius: 30, padding: '30px 80px', background: 'rgba(10,10,34,0.94)',
        border: `2px solid ${VIOLET}`, display: 'flex', alignItems: 'center', gap: 50,
        boxShadow: '0 0 70px rgba(167,139,250,0.35)',
      }}>
        <svg width={300} height={90}>
          {bars.map((h, i) => (
            <rect key={i} x={i * 12.5} y={45 - h / 2} width={8} height={h} rx={4} fill={VIOLET} opacity={0.85} />
          ))}
        </svg>
        <div>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 26, letterSpacing: 2}}>FIRST VOICE COMMAND</div>
          <div style={{color: INK, fontFamily: FONT, fontWeight: 700, fontSize: 52}}>&ldquo;Good morning&rdquo; &rarr; <span style={{color: GREEN}}>lights on \u2713</span></div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Progress rail (bottom of main area)
// ---------------------------------------------------------------------------
const Rail_sh: React.FC<{frame: number}> = ({frame}) => {
  const steps = ['UNBOX', 'POWER', 'APP', 'PAIR', 'SCENES', 'VOICE'];
  const marks = [90, 150, 230, 300, 690, 800];
  return (
    <div style={{position: 'absolute', left: 700, right: 700, bottom: 330, display: 'flex', justifyContent: 'space-between'}}>
      {steps.map((st, i) => {
        const on = frame >= marks[i];
        return (
          <div key={st} style={{textAlign: 'center'}}>
            <div style={{
              width: 26, height: 26, borderRadius: 13, margin: '0 auto',
              backgroundColor: on ? VIOLET : 'rgba(241,243,251,0.12)',
              boxShadow: on ? '0 0 18px rgba(167,139,250,0.8)' : 'none',
            }} />
            <div style={{color: on ? INK : FAINT, fontFamily: MONO, fontSize: 26, marginTop: 12}}>{st}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const SmartHomeSetupFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_sh frame={frame} />
      <AmbientParticles_sh frame={frame} />
      <Title_sh frame={frame} fps={fps} />
      <Hub_sh frame={frame} fps={fps} />
      <Devices_sh frame={frame} fps={fps} />
      <AppPanel_sh frame={frame} fps={fps} />
      <Scenes_sh frame={frame} fps={fps} />
      <Voice_sh frame={frame} fps={fps} />
      <Rail_sh frame={frame} />
      <TickerTape_sh frame={frame} />
      <CornerHud_sh frame={frame} />
      <FineDither_sh frame={frame} />
      <FilmGrain_sh frame={frame} />
    </AbsoluteFill>
  );
};
