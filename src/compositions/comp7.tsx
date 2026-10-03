/**
 * HomeWarrantyClaimFlow.tsx
 * Remotion composition - 4K (3840x2160), 60 fps, 15 s (900 frames).
 * A home warranty claim, step by step: the HVAC breakdown alert pings ->
 * the owner requests service -> the fixed $75 service-fee coin drops ->
 * the contractor badge routes to the house pin on the map -> the repair
 * progress ring fills -> the warranty shield covers the cost bar ->
 * SERVICE COMPLETE checkmark. Deterministic.
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
// Palette (cool blue/steel)
// ---------------------------------------------------------------------------
const BG = '#0A0E14';
const INK = '#F0F5FB';
const MUTED = 'rgba(240,245,251,0.62)';
const FAINT = 'rgba(240,245,251,0.32)';
const BLUE = '#60A5FA';
const GREEN = '#34D399';
const RED = '#F87171';
const GOLD = '#FBBF24';
const PANEL = 'rgba(14,20,30,0.94)';
const HAIRLINE = 'rgba(240,245,251,0.14)';

const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";
const clamp01 = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// ---------------------------------------------------------------------------
// Bitrate-proof scaffolding. Seed prefix: hwarr
// ---------------------------------------------------------------------------
const Background_hwarr: React.FC<{frame: number}> = ({frame}) => {
  const scanY = ((frame / 900) * (2160 + 480)) % (2160 + 480) - 240;
  const dots: React.ReactElement[] = [];
  for (let gy = 0; gy < 27; gy++) {
    for (let gx = 0; gx < 48; gx++) {
      const tw = 0.05 + 0.075 * (0.5 + 0.5 * Math.sin(frame * 0.11 + gx * 1.3 + gy * 2.1));
      dots.push(
        <circle key={`${gx}-${gy}`} cx={40 + gx * 80} cy={40 + gy * 80} r={2.2} fill="#9CC2F5" opacity={tw} />
      );
    }
  }
  return (
    <>
      <AbsoluteFill style={{backgroundColor: BG}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, rgba(96,165,250,0.12), rgba(96,165,250,0.03) 46%, rgba(10,14,20,0) 72%)'}} />
      <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
        {dots}
        <rect x={0} y={0} width={3840} height={2160} fill="url(#hwarrVig)" />
        <rect x={0} y={scanY - 110} width={3840} height={220} fill="rgba(96,165,250,0.045)" />
        <defs>
          <radialGradient id="hwarrVig" cx="50%" cy="50%" r="75%">
            <stop offset="58%" stopColor="rgba(10,14,20,0)" />
            <stop offset="100%" stopColor="rgba(3,5,8,0.74)" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

const AmbientParticles_hwarr: React.FC<{frame: number}> = ({frame}) => {
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < 220; i++) {
    const bx = random(`hwarr-amb-x-${i}`) * 3840;
    const by = random(`hwarr-amb-y-${i}`) * 2160;
    const spd = 0.4 + random(`hwarr-amb-s-${i}`) * 1.4;
    const ang = random(`hwarr-amb-a-${i}`) * Math.PI * 2;
    const drift = ((frame * spd) % 2400) - 200;
    const px = (bx + Math.cos(ang) * drift + 3840) % 3840;
    const py = (by + Math.sin(ang) * drift * 0.6 + 2160) % 2160;
    const tw = 0.10 + 0.22 * (0.5 + 0.5 * Math.sin(frame * 0.14 + i * 1.7));
    const sz = 3 + random(`hwarr-amb-z-${i}`) * 6;
    const col = i % 4 === 0 ? BLUE : i % 4 === 1 ? GREEN : 'rgba(240,245,251,0.9)';
    parts.push(<circle key={i} cx={px} cy={py} r={sz} fill={col} opacity={tw} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {parts}
    </svg>
  );
};

const FineDither_hwarr: React.FC<{frame: number}> = ({frame}) => {
  const specks: React.ReactElement[] = [];
  for (let i = 0; i < 2600; i++) {
    const bx = random(`hwarr-dth-x-${i}`) * 3840;
    const by = random(`hwarr-dth-y-${i}`) * 2160;
    const jx = (random(`hwarr-dth-jx-${frame}-${i}`) - 0.5) * 9;
    const jy = (random(`hwarr-dth-jy-${frame}-${i}`) - 0.5) * 9;
    const o = 0.015 + random(`hwarr-dth-o-${frame}-${i}`) * 0.035;
    const s = 1.5 + random(`hwarr-dth-s-${i}`) * 2;
    specks.push(<rect key={i} x={bx + jx} y={by + jy} width={s} height={s} fill="#C4D9F7" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {specks}
    </svg>
  );
};

const TICKER_ITEMS_hwarr = [
  'HVAC SYSTEM DOWN',
  'SERVICE REQUEST HW-2210',
  'FIXED FEE $75',
  'CONTRACTOR DISPATCHED',
  'ETA 45 MIN',
  'REPAIR 100%',
  'WARRANTY COVERS $2,325',
  'SERVICE COMPLETE',
];
const TickerTape_hwarr: React.FC<{frame: number}> = ({frame}) => {
  const unit = TICKER_ITEMS_hwarr.join('   \u25C6   ') + '   \u25C6   ';
  const unitW = unit.length * 20;
  const x = -((frame * 7) % unitW);
  const reps: React.ReactElement[] = [];
  for (let r = 0; r < Math.ceil(3840 / unitW) + 1; r++) {
    reps.push(
      <text key={r} x={x + r * unitW} y={38} fill="rgba(96,165,250,0.62)" fontSize={27} fontFamily={MONO} letterSpacing={4}>
        {unit}
      </text>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 56, overflow: 'hidden', backgroundColor: 'rgba(4,6,9,0.66)', borderBottom: '1px solid rgba(240,245,251,0.14)'}}>
      <svg width={3840} height={56} style={{position: 'absolute', top: 0, left: 0}}>
        {reps}
      </svg>
    </div>
  );
};

const CornerHud_hwarr: React.FC<{frame: number}> = ({frame}) => {
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
            <path d="M 0 56 L 0 0 L 56 0" fill="none" stroke="rgba(96,165,250,0.55)" strokeWidth={5} />
            <circle cx={0} cy={0} r={6} fill={BLUE} opacity={blink} />
          </g>
        ))}
        {Array.from({length: 24}, (_, k) => {
          const yy = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 0;
          return <rect key={`rl${k}`} x={28} y={yy} width={on ? 32 : 17} height={3} fill={on ? BLUE : 'rgba(240,245,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
        {Array.from({length: 46}, (_, k) => {
          const xx = 280 + k * 68;
          const on = ((frame >> 2) + k) % 8 === 4;
          return <rect key={`rt${k}`} x={xx} y={2036} width={3} height={on ? 28 : 15} fill={on ? BLUE : 'rgba(240,245,251,0.18)'} opacity={on ? 0.9 : 0.5} />;
        })}
      </svg>
    </div>
  );
};

const FilmGrain_hwarr: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 7000; i++) {
    const x = random(`hwarr-grain-x-${frame}-${i}`) * 3840;
    const y = random(`hwarr-grain-y-${frame}-${i}`) * 2160;
    const o = 0.02 + random(`hwarr-grain-o-${frame}-${i}`) * 0.06;
    const s = 2 + random(`hwarr-grain-s-${frame}-${i}`) * 3;
    dots.push(<rect key={i} x={x} y={y} width={s} height={s} fill="#FFFFFF" opacity={o} />);
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Claim model: deterministic
// ---------------------------------------------------------------------------
const FEE_hwarr = 75;
const REPAIR_COST_hwarr = 2400;
const COVERED_hwarr = REPAIR_COST_hwarr - FEE_hwarr;
const fmt$ = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
const Title_hwarr: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame, fps, config: {damping: 200, stiffness: 90}});
  const fade = interpolate(frame, [0, 40], [0, 1], clamp01);
  return (
    <div style={{position: 'absolute', top: 104, left: 220, opacity: fade, transform: `translateY(${(1 - s) * 34}px)`}}>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: -1}}>
        HOME WARRANTY CLAIM FLOW
      </div>
      <div style={{color: MUTED, fontFamily: FONT, fontSize: 38, marginTop: 12}}>
        One breakdown &middot; one fixed fee &middot; the plan handles the rest
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 1: HVAC breakdown alert (left)
// ---------------------------------------------------------------------------
const AlertCard_hwarr: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 60, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const temp = 72 + 17 * interpolate(frame, [90, 260], [0, 1], clamp01);
  const pingP = (frame % 90) / 90;
  return (
    <div style={{
      position: 'absolute', left: 240, top: 520, width: 1000, height: 820,
      borderRadius: 36, background: PANEL, border: `3px solid ${RED}`,
      padding: '52px 64px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
      boxShadow: '0 0 60px rgba(248,113,113,0.25)',
    }}>
      <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
        <div style={{position: 'relative', width: 130, height: 130}}>
          {[0, 1].map((k) => {
            const pp = ((frame + k * 45) % 90) / 90;
            return (
              <div key={k} style={{
                position: 'absolute', left: 65 - pp * 90, top: 65 - pp * 90,
                width: pp * 180, height: pp * 180, borderRadius: '50%',
                border: `4px solid ${RED}`, opacity: 1 - pp,
              }} />
            );
          })}
          <div style={{
            position: 'absolute', left: 15, top: 15, width: 100, height: 100, borderRadius: '50%',
            background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: BG, fontSize: 56, fontWeight: 800, boxShadow: '0 0 30px rgba(248,113,113,0.7)',
          }}>
            !
          </div>
        </div>
        <div>
          <div style={{color: RED, fontFamily: MONO, fontSize: 32, letterSpacing: 4}}>⚠ BREAKDOWN ALERT</div>
          <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 58, marginTop: 8}}>HVAC SYSTEM DOWN</div>
        </div>
      </div>
      <div style={{marginTop: 44, borderTop: `2px solid ${HAIRLINE}`, paddingTop: 36}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{color: MUTED, fontFamily: MONO, fontSize: 32, letterSpacing: 2}}>INDOOR TEMP</div>
          <div style={{
            color: temp > 84 ? RED : GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 88,
            textShadow: `0 0 30px ${temp > 84 ? 'rgba(248,113,113,0.6)' : 'rgba(251,191,36,0.5)'}`,
          }}>
            {Math.round(temp)}°F
          </div>
        </div>
        {/* temp bar */}
        <div style={{marginTop: 24, height: 26, borderRadius: 13, background: 'rgba(240,245,251,0.10)'}}>
          <div style={{
            width: `${interpolate(temp, [72, 89], [8, 100], clamp01)}%`, height: 26, borderRadius: 13,
            background: `linear-gradient(90deg, ${GOLD}, ${RED})`,
          }} />
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 30}}>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 28}}>UNIT: TRANE XR14 · 2019</div>
          <div style={{color: FAINT, fontFamily: MONO, fontSize: 28}}>ERROR CODE: E-42</div>
        </div>
        <div style={{marginTop: 30, color: MUTED, fontFamily: FONT, fontSize: 34}}>
          Compressor failure suspected — no cooling since 2:14 PM
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 2: service request ticket (center)
// ---------------------------------------------------------------------------
const Ticket_hwarr: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 200, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const steps = [
    {k: 'REQUEST FILED', at: 220},
    {k: 'PLAN VERIFIED', at: 280},
    {k: 'CONTRACTOR ASSIGNED', at: 340},
  ];
  return (
    <div style={{
      position: 'absolute', left: 1340, top: 520, width: 1180, height: 820,
      borderRadius: 36, background: PANEL, border: `2px solid ${HAIRLINE}`,
      padding: '52px 64px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>HOME WARRANTY PORTAL</div>
      <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 54, marginTop: 8}}>SERVICE REQUEST #HW-2210</div>
      <div style={{marginTop: 44}}>
        {steps.map((st, i) => {
          const done = frame >= st.at;
          const on = interpolate(frame, [st.at - 20, st.at], [0, 1], clamp01);
          return (
            <div key={st.k} style={{display: 'flex', alignItems: 'center', gap: 32, marginTop: 40, opacity: on}}>
              <div style={{
                width: 72, height: 72, borderRadius: 36,
                border: `4px solid ${done ? GREEN : FAINT}`,
                background: done ? 'rgba(52,211,153,0.14)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: GREEN, fontSize: 40, fontWeight: 800,
                boxShadow: done ? '0 0 24px rgba(52,211,153,0.45)' : 'none',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <div>
                <div style={{color: done ? INK : MUTED, fontFamily: MONO, fontSize: 38, fontWeight: 800}}>{st.k}</div>
                <div style={{color: FAINT, fontFamily: MONO, fontSize: 26, marginTop: 4}}>
                  {i === 0 && 'Owner submits online — 3 min'}
                  {i === 1 && 'Coverage confirmed — HVAC included'}
                  {i === 2 && 'CoolAir Pros LLC · 4.8 ★ · 12 yrs'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 52, borderRadius: 24, padding: '28px 40px', background: 'rgba(96,165,250,0.08)',
        border: `2px solid ${BLUE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{color: BLUE, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>STATUS</div>
        <div style={{color: BLUE, fontFamily: MONO, fontWeight: 800, fontSize: 44}}>DISPATCHED</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 2b: map with contractor route (right)
// ---------------------------------------------------------------------------
const Map_hwarr: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 440, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const p = interpolate(frame, [460, 600], [0, 1], clamp01);
  const bx = interpolate(p, [0, 1], [780, 210], clamp01);
  const by = interpolate(p, [0, 1], [240, 420], clamp01) - Math.sin(p * Math.PI) * 110;
  const eta = Math.round(45 * (1 - p));
  const arrived = frame >= 600;
  const dash = (frame * 16) % 90;
  return (
    <div style={{
      position: 'absolute', right: 240, top: 520, width: 980, height: 820,
      borderRadius: 36, background: PANEL, border: `2px solid ${HAIRLINE}`,
      padding: '52px 56px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px)`,
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>CONTRACTOR EN ROUTE</div>
        <div style={{color: arrived ? GREEN : BLUE, fontFamily: MONO, fontWeight: 800, fontSize: 44}}>
          {arrived ? '✓ ARRIVED' : `ETA ${eta} MIN`}
        </div>
      </div>
      <svg width={868} height={560} viewBox="0 0 868 560" style={{marginTop: 24, borderRadius: 24}}>
        <rect x={0} y={0} width={868} height={560} rx={24} fill="rgba(96,165,250,0.05)" />
        {/* street grid */}
        {Array.from({length: 8}, (_, i) => (
          <line key={`h${i}`} x1={0} y1={70 * (i + 1)} x2={868} y2={70 * (i + 1)} stroke="rgba(240,245,251,0.08)" strokeWidth={3} />
        ))}
        {Array.from({length: 12}, (_, i) => (
          <line key={`v${i}`} x1={72 * (i + 1)} y1={0} x2={72 * (i + 1)} y2={560} stroke="rgba(240,245,251,0.08)" strokeWidth={3} />
        ))}
        {/* route */}
        <path d="M 780 240 Q 560 130 210 420" fill="none" stroke={BLUE} strokeWidth={8}
          strokeDasharray="24 20" strokeDashoffset={-dash} opacity={0.85}
          style={{filter: 'drop-shadow(0 0 12px rgba(96,165,250,0.6))'}} />
        {/* house pin */}
        <g transform="translate(210,420)">
          <path d="M 0 -52 C -34 -52 -48 -30 -48 -12 C -48 12 0 44 0 44 C 0 44 48 12 48 -12 C 48 -30 34 -52 0 -52 Z"
            fill={GREEN} style={{filter: 'drop-shadow(0 0 16px rgba(52,211,153,0.7))'}} />
          <rect x={-26} y={-38} width={52} height={40} rx={6} fill={BG} />
          <path d="M -26 -18 L 0 -38 L 26 -18" fill="none" stroke={GREEN} strokeWidth={7} />
        </g>
        <text x={210} y={510} fill={MUTED} fontSize={26} fontFamily={MONO} textAnchor="middle">YOUR HOME</text>
        {/* contractor badge */}
        <g transform={`translate(${bx},${by})`}>
          <circle r={46} fill={BLUE} style={{filter: 'drop-shadow(0 0 18px rgba(96,165,250,0.8))'}} />
          <path d="M -22 6 L -22 -10 L -30 -10 L -14 -26 L 2 -26 L 2 -10 L 10 -10 L 10 6 Z M -18 6 L 18 6 L 10 22 L -10 22 Z"
            fill={BG} transform="scale(1.1)" />
        </g>
        <text x={bx} y={by + 76} fill={BLUE} fontSize={26} fontFamily={MONO} fontWeight={800} textAnchor="middle">TECH</text>
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 3: $75 service fee coin drop (bottom left)
// ---------------------------------------------------------------------------
const FeeDrop_hwarr: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 320, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const dropP = interpolate(frame, [340, 400], [0, 1], clamp01);
  const coinY = interpolate(dropP, [0, 1], [60, 330], clamp01);
  const landed = frame >= 410;
  const paid = FEE_hwarr * interpolate(frame, [410, 450], [0, 1], clamp01);
  const glow = landed ? 0.5 + 0.5 * Math.sin(frame * 0.12) : 0;
  return (
    <div style={{
      position: 'absolute', left: 240, top: 1420, width: 1000, height: 590,
      borderRadius: 36, background: PANEL, border: `2px solid ${HAIRLINE}`,
      padding: '44px 60px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>FIXED SERVICE FEE</div>
      <div style={{position: 'relative', height: 300, marginTop: 20}}>
        <svg width={880} height={300} viewBox="0 0 880 300">
          <rect x={330} y={250} width={220} height={34} rx={17} fill={BG} stroke={BLUE} strokeWidth={6} />
          <rect x={330} y={250} width={220} height={34} rx={17} fill="rgba(96,165,250,0.25)" />
          {!landed && (
            <g opacity={1 - dropP * 0.2}>
              <circle cx={440} cy={coinY} r={52} fill={GOLD}
                style={{filter: 'drop-shadow(0 0 22px rgba(251,191,36,0.8))'}} />
              <text x={440} y={coinY + 20} fill={BG} fontSize={52} fontFamily={MONO} fontWeight={800} textAnchor="middle">$</text>
            </g>
          )}
          {landed && (
            <g>
              <circle cx={440} cy={252} r={52} fill={GOLD}
                style={{filter: `drop-shadow(0 0 ${24 + glow * 30}px rgba(251,191,36,0.9))`}} />
              <text x={440} y={272} fill={BG} fontSize={52} fontFamily={MONO} fontWeight={800} textAnchor="middle">$</text>
            </g>
          )}
        </svg>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 30, letterSpacing: 2}}>YOU PAY</div>
        <div style={{color: GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 92, textShadow: '0 0 30px rgba(251,191,36,0.55)'}}>
          {fmt$(paid)}
        </div>
      </div>
      <div style={{color: FAINT, fontFamily: MONO, fontSize: 26, marginTop: 6}}>Flat per-visit fee — quoted before the tech arrives</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 4: repair progress ring (bottom center)
// ---------------------------------------------------------------------------
const RepairRing_hwarr: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 600, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const fill = interpolate(frame, [620, 740], [0, 1], clamp01);
  const C = 2 * Math.PI * 130;
  const tasks = [
    {k: 'DIAGNOSE', at: 630},
    {k: 'PARTS ORDERED', at: 660},
    {k: 'COMPRESSOR REPLACED', at: 695},
    {k: 'SYSTEM TESTED', at: 725},
  ];
  return (
    <div style={{
      position: 'absolute', left: 1340, top: 1420, width: 1180, height: 590,
      borderRadius: 36, background: PANEL, border: `2px solid ${HAIRLINE}`,
      padding: '40px 56px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
      display: 'flex', alignItems: 'center', gap: 56,
    }}>
      <svg width={380} height={380} viewBox="0 0 380 380">
        <circle cx={190} cy={190} r={130} fill="none" stroke="rgba(240,245,251,0.10)" strokeWidth={40} />
        <circle cx={190} cy={190} r={130} fill="none" stroke={BLUE} strokeWidth={40}
          strokeDasharray={C} strokeDashoffset={C * (1 - fill)} transform="rotate(-90 190 190)"
          strokeLinecap="round" style={{filter: 'drop-shadow(0 0 20px rgba(96,165,250,0.6))'}} />
        <text x={190} y={184} fill={INK} fontSize={64} fontFamily={MONO} fontWeight={800} textAnchor="middle">
          {Math.round(fill * 100)}%
        </text>
        <text x={190} y={230} fill={MUTED} fontSize={26} fontFamily={MONO} textAnchor="middle">REPAIR</text>
      </svg>
      <div style={{flex: 1}}>
        <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>REPAIR IN PROGRESS</div>
        {tasks.map((t) => {
          const done = frame >= t.at;
          return (
            <div key={t.k} style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 30, opacity: done ? 1 : 0.35}}>
              <div style={{
                width: 52, height: 52, borderRadius: 26, border: `3px solid ${done ? GREEN : FAINT}`,
                background: done ? 'rgba(52,211,153,0.14)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: GREEN, fontSize: 30, fontWeight: 800,
              }}>
                {done ? '✓' : ''}
              </div>
              <div style={{color: done ? INK : MUTED, fontFamily: MONO, fontSize: 34, fontWeight: 700}}>{t.k}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 5: warranty shield covers the cost bar (bottom right)
// ---------------------------------------------------------------------------
const CostCover_hwarr: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 740, fps, config: {damping: 200, stiffness: 90}});
  if (s <= 0.001) return null;
  const coverP = interpolate(frame, [760, 830], [0, 1], clamp01);
  const covered = COVERED_hwarr * coverP;
  const shieldX = interpolate(coverP, [0, 1], [980, 40], clamp01);
  return (
    <div style={{
      position: 'absolute', right: 240, top: 1420, width: 980, height: 590,
      borderRadius: 36, background: PANEL, border: `2px solid ${HAIRLINE}`,
      padding: '44px 60px', opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 50}px)`,
    }}>
      <div style={{color: MUTED, fontFamily: MONO, fontSize: 28, letterSpacing: 4}}>REPAIR COST BREAKDOWN</div>
      <div style={{color: INK, fontFamily: MONO, fontWeight: 800, fontSize: 56, marginTop: 12}}>
        TOTAL {fmt$(REPAIR_COST_hwarr)}
      </div>
      <div style={{position: 'relative', marginTop: 30, height: 90}}>
        <div style={{height: 56, borderRadius: 28, background: 'rgba(240,245,251,0.10)', overflow: 'hidden', position: 'relative'}}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(COVERED_hwarr / REPAIR_COST_hwarr) * 100}%`,
            background: `linear-gradient(90deg, ${GREEN}, ${BLUE})`, opacity: coverP,
            boxShadow: '0 0 24px rgba(52,211,153,0.5)',
          }} />
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: `${(FEE_hwarr / REPAIR_COST_hwarr) * 100}%`,
            background: GOLD,
          }} />
        </div>
        {/* shield sweeping over the covered portion */}
        {coverP < 1 && (
          <svg width={140} height={180} viewBox="0 0 200 256" style={{position: 'absolute', left: shieldX - 70, top: -50, opacity: coverP > 0 ? 1 : 0}}>
            <path d="M100 8 L178 44 V132 C178 196 142 226 100 248 C58 226 22 196 22 132 V44 Z"
              fill="rgba(52,211,153,0.25)" stroke={GREEN} strokeWidth={14}
              style={{filter: 'drop-shadow(0 0 20px rgba(52,211,153,0.7))'}} />
          </svg>
        )}
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 20}}>
        <div>
          <div style={{color: GREEN, fontFamily: MONO, fontSize: 26, letterSpacing: 2}}>WARRANTY COVERS</div>
          <div style={{color: GREEN, fontFamily: MONO, fontWeight: 800, fontSize: 52}}>{fmt$(covered)}</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{color: GOLD, fontFamily: MONO, fontSize: 26, letterSpacing: 2}}>YOU PAY</div>
          <div style={{color: GOLD, fontFamily: MONO, fontWeight: 800, fontSize: 52}}>{fmt$(FEE_hwarr)}</div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Stage 6: SERVICE COMPLETE payoff
// ---------------------------------------------------------------------------
const Complete_hwarr: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const s = spring({frame: frame - 840, fps, config: {damping: 200, stiffness: 85}});
  if (s <= 0.001) return null;
  const pulse = 0.5 + 0.5 * Math.sin((frame - 840) * 0.14);
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: `rgba(4,8,6,${0.55 * Math.min(1, s)})`, opacity: Math.min(1, s),
    }}>
      <div style={{transform: `scale(${0.8 + 0.2 * s})`, textAlign: 'center'}}>
        <svg width={340} height={340} viewBox="0 0 340 340">
          <circle cx={170} cy={170} r={140} fill="rgba(52,211,153,0.12)" stroke={GREEN} strokeWidth={18}
            style={{filter: `drop-shadow(0 0 ${30 + pulse * 40}px rgba(52,211,153,0.6))`}} />
          <path d="M 110 172 L 155 218 L 235 128" fill="none" stroke={GREEN} strokeWidth={30}
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{color: INK, fontFamily: FONT, fontWeight: 800, fontSize: 88, marginTop: 24, letterSpacing: 2}}>
          SERVICE COMPLETE
        </div>
        <div style={{color: GREEN, fontFamily: MONO, fontSize: 40, marginTop: 14}}>
          HVAC running &middot; {fmt$(COVERED_hwarr)} covered &middot; you paid {fmt$(FEE_hwarr)}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const HomeWarrantyClaimFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: FONT}}>
      <Background_hwarr frame={frame} />
      <AmbientParticles_hwarr frame={frame} />
      <Title_hwarr frame={frame} fps={fps} />
      <AlertCard_hwarr frame={frame} fps={fps} />
      <Ticket_hwarr frame={frame} fps={fps} />
      <Map_hwarr frame={frame} fps={fps} />
      <FeeDrop_hwarr frame={frame} fps={fps} />
      <RepairRing_hwarr frame={frame} fps={fps} />
      <CostCover_hwarr frame={frame} fps={fps} />
      <Complete_hwarr frame={frame} fps={fps} />
      <TickerTape_hwarr frame={frame} />
      <CornerHud_hwarr frame={frame} />
      <FineDither_hwarr frame={frame} />
      <FilmGrain_hwarr frame={frame} />
    </AbsoluteFill>
  );
};
