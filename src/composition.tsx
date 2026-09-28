/**
 * TheRelapsePrevention.tsx
 * "The Relapse Prevention" — dark-discipline direct-response video.
 * 4K landscape (3840x2160), 60fps, 15s (900 frames).
 *
 * Hook: "Do not lust tonight. Do not lust ever."
 * Mechanic: the world is black-and-white until the exact frame of the
 * decision ("CHOOSE"), when it floods into ember color.
 *
 * All visuals are procedural (rain, skyline, fog, grain) — deterministic,
 * seeded random only. No external assets.
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

const DISPLAY = "'Arial Black','Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "'SF Mono','JetBrains Mono',Menlo,Consolas,monospace";

// The frame the decision is made — B&W -> color pivots here.
const DECISION = 540;

// ---------------------------------------------------------------------------
// Sky
// ---------------------------------------------------------------------------
const Sky: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg,#0B1220 0%,#0A0E16 45%,#05070B 100%)',
    }}
  />
);

// ---------------------------------------------------------------------------
// City skyline (silhouette + amber windows; color hidden under grayscale
// until the decision)
// ---------------------------------------------------------------------------
const CitySkyline: React.FC<{frame: number}> = ({frame}) => {
  const buildings: React.ReactElement[] = [];
  const windows: React.ReactElement[] = [];
  let x = -40;
  let bi = 0;
  while (x < 3880) {
    const w = 110 + random(`bw-${bi}`) * 130;
    const h = 320 + random(`bh-${bi}`) * 620;
    buildings.push(
      <rect key={`b${bi}`} x={x} y={2160 - h} width={w} height={h} fill="#0D1420" />
    );
    if (random(`ba-${bi}`) > 0.6) {
      buildings.push(
        <rect key={`a${bi}`} x={x + w / 2 - 4} y={2160 - h - 90} width={8} height={90} fill="#0D1420" />
      );
      const blink = random(`bl-${frame}-${bi}`) > 0.5;
      buildings.push(
        <circle key={`l${bi}`} cx={x + w / 2} cy={2160 - h - 96} r={7} fill={blink ? '#FF3B30' : '#5A1110'} />
      );
    }
    const cols = Math.floor(w / 46);
    const rows = Math.floor(h / 64);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (random(`wl-${bi}-${r}-${c}`) <= 0.62) continue;
        const flick = random(`wf-${frame}-${bi}-${r}-${c}`) > 0.94;
        windows.push(
          <rect
            key={`w${bi}-${r}-${c}`}
            x={x + 14 + c * 46}
            y={2160 - h + 24 + r * 64}
            width={20}
            height={30}
            fill={flick ? '#FFE9B8' : '#C77B2A'}
            opacity={flick ? 0.95 : 0.75}
          />
        );
      }
    }
    x += w + 8 + random(`bg-${bi}`) * 30;
    bi++;
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {buildings}
      {windows}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Rain (slanted, looping)
// ---------------------------------------------------------------------------
const RAIN_COUNT = 230;
const Rain: React.FC<{frame: number}> = ({frame}) => {
  const drops: React.ReactElement[] = [];
  for (let i = 0; i < RAIN_COUNT; i++) {
    const x = random(`rx-${i}`) * 3960 - 60;
    const speed = 30 + random(`rs-${i}`) * 34;
    const len = 46 + random(`rl-${i}`) * 100;
    const y = ((random(`ry-${i}`) * 2400 + frame * speed) % 2400) - 140;
    const o = 0.1 + random(`ro-${i}`) * 0.18;
    drops.push(
      <line
        key={i}
        x1={x}
        y1={y}
        x2={x - 16}
        y2={y + len}
        stroke="#8E9AA8"
        strokeWidth={3.5}
        strokeLinecap="round"
        opacity={o}
      />
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0}}>
      {drops}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Drifting fog banks
// ---------------------------------------------------------------------------
const Fog: React.FC<{frame: number}> = ({frame}) => {
  const dx1 = interpolate(frame, [0, 899], [-200, 300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dx2 = interpolate(frame, [0, 899], [300, -260], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 300,
          left: dx1,
          width: 2200,
          height: 1200,
          background: 'radial-gradient(closest-side,rgba(120,140,170,0.10),rgba(120,140,170,0))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 1100,
          left: 1600 + dx2,
          width: 2400,
          height: 1100,
          background: 'radial-gradient(closest-side,rgba(120,140,170,0.08),rgba(120,140,170,0))',
        }}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// Film grain (deterministic SVG)
// ---------------------------------------------------------------------------
const Grain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 400; i++) {
    const s = 2 + random(`gs-${frame}-${i}`) * 2.5;
    dots.push(
      <rect
        key={i}
        x={random(`gx-${frame}-${i}`) * 3840}
        y={random(`gy-${frame}-${i}`) * 2160}
        width={s}
        height={s}
        fill="#FFFFFF"
        opacity={0.02 + random(`go-${frame}-${i}`) * 0.04}
      />
    );
  }
  return (
    <svg width={3840} height={2160} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}}>
      {dots}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Slamming word (spring overshoot entrance)
// ---------------------------------------------------------------------------
const SlamWord: React.FC<{
  word: string;
  frame: number;
  fps: number;
  delay: number;
  size: number;
  color: string;
  glow: string;
}> = ({word, frame, fps, delay, size, color, glow}) => {
  const s = spring({frame: frame - delay, fps, config: {damping: 14, stiffness: 180}});
  if (s <= 0.001) return null;
  const k = Math.min(1, s);
  return (
    <span
      style={{
        display: 'inline-block',
        opacity: Math.min(1, s * 1.4),
        transform: `translateY(${(1 - k) * 130}px) scale(${1.7 - 0.7 * k})`,
        fontFamily: DISPLAY,
        fontWeight: 900,
        fontSize: size,
        color,
        letterSpacing: '-0.015em',
        textShadow: glow,
        margin: '0 30px',
      }}
    >
      {word}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------
export const TheRelapsePrevention: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // B&W -> color: full grayscale until just before the decision, then floods to color.
  const bw = interpolate(frame, [DECISION - 6, DECISION + 30], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Ember color wash blooming in at the decision.
  const emberOp = interpolate(frame, [DECISION, DECISION + 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Impact punch on the scene at the decision.
  const punch = frame >= DECISION ? Math.max(0, 1 - (frame - DECISION) / 70) : 0;

  // Lightning tension beats before the decision.
  const flash =
    (frame >= 498 && frame <= 502) || (frame >= 508 && frame <= 510) ? 0.4 : 0;

  // Beat visibility windows.
  const beat1Op =
    interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
    interpolate(frame, [280, 310], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const beat2Op =
    interpolate(frame, [320, 350], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
    interpolate(frame, [500, 528], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const decideOp = interpolate(frame, [DECISION, DECISION + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const disciplineOp =
    interpolate(frame, [556, 576], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
    interpolate(frame, [748, 776], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const subOp =
    interpolate(frame, [640, 665], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
    interpolate(frame, [748, 776], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const resolveOp = interpolate(frame, [792, 822], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const kickerOp =
    interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
    interpolate(frame, [770, 800], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const whiteGlow = '0 0 120px rgba(255,255,255,0.28), 0 6px 40px rgba(0,0,0,0.8)';
  const emberGlow = '0 0 170px rgba(255,90,31,0.55), 0 6px 40px rgba(0,0,0,0.8)';

  return (
    <AbsoluteFill style={{backgroundColor: '#000', fontFamily: DISPLAY}}>
      {/* ---- world (B&W until the decision) ---- */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          filter: `grayscale(${bw})`,
          transform: `scale(${1 + 0.03 * punch})`,
        }}
      >
        <Sky />
        <CitySkyline frame={frame} />
        <Rain frame={frame} />
        <Fog frame={frame} />
      </div>

      {/* ---- ember color wash ---- */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: emberOp,
          background:
            'radial-gradient(ellipse 90% 70% at 50% 62%, rgba(255,90,31,0.30), rgba(255,90,31,0) 70%), linear-gradient(180deg, rgba(255,60,20,0.07), rgba(0,0,0,0) 55%)',
        }}
      />

      {/* ---- lightning ---- */}
      {flash > 0 && <div style={{position: 'absolute', inset: 0, backgroundColor: '#FFF', opacity: flash}} />}

      {/* ---- vignette ---- */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 75% 65% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* ---- beat 1: the hook ---- */}
      <div
        style={{
          position: 'absolute',
          top: 830,
          left: 0,
          width: 3840,
          textAlign: 'center',
          opacity: beat1Op,
        }}
      >
        <div>
          <SlamWord word="DO" frame={frame} fps={fps} delay={40} size={360} color="#FFF" glow={whiteGlow} />
          <SlamWord word="NOT" frame={frame} fps={fps} delay={52} size={360} color="#FFF" glow={whiteGlow} />
          <SlamWord word="LUST" frame={frame} fps={fps} delay={64} size={360} color="#FFF" glow={whiteGlow} />
        </div>
        <div style={{marginTop: 10}}>
          <SlamWord word="TONIGHT." frame={frame} fps={fps} delay={112} size={360} color="#FFF" glow={whiteGlow} />
        </div>
      </div>

      {/* ---- beat 2: the vow ---- */}
      <div
        style={{
          position: 'absolute',
          top: 830,
          left: 0,
          width: 3840,
          textAlign: 'center',
          opacity: beat2Op,
        }}
      >
        <div>
          <SlamWord word="DO" frame={frame} fps={fps} delay={330} size={360} color="#FFF" glow={whiteGlow} />
          <SlamWord word="NOT" frame={frame} fps={fps} delay={342} size={360} color="#FFF" glow={whiteGlow} />
          <SlamWord word="LUST" frame={frame} fps={fps} delay={354} size={360} color="#FFF" glow={whiteGlow} />
        </div>
        <div style={{marginTop: 10}}>
          <SlamWord word="EVER." frame={frame} fps={fps} delay={402} size={360} color="#FFF" glow={whiteGlow} />
        </div>
      </div>

      {/* ---- the decision ---- */}
      <div
        style={{
          position: 'absolute',
          top: 760,
          left: 0,
          width: 3840,
          textAlign: 'center',
          opacity: decideOp,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 44,
            letterSpacing: 22,
            color: 'rgba(255,255,255,0.85)',
            marginBottom: 30,
          }}
        >
          CHOOSE
        </div>
        <div style={{opacity: disciplineOp}}>
          <SlamWord word="DISCIPLINE." frame={frame} fps={fps} delay={566} size={400} color="#FFF" glow={emberGlow} />
        </div>
        <div
          style={{
            marginTop: 44,
            fontFamily: MONO,
            fontSize: 46,
            letterSpacing: 14,
            color: '#FFB37A',
            opacity: subOp,
          }}
        >
          HOLD THE LINE.
        </div>
      </div>

      {/* ---- resolve ---- */}
      <div
        style={{
          position: 'absolute',
          top: 950,
          left: 0,
          width: 3840,
          textAlign: 'center',
          opacity: resolveOp,
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 900,
            fontSize: 210,
            color: '#FFF',
            letterSpacing: '-0.01em',
            textShadow: emberGlow,
          }}
        >
          DISCIPLINE IS FREEDOM.
        </div>
        <div
          style={{
            marginTop: 36,
            fontFamily: MONO,
            fontSize: 36,
            letterSpacing: 12,
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          THE RELAPSE PREVENTION
        </div>
      </div>

      {/* ---- letterbox ---- */}
      <div style={{position: 'absolute', top: 0, left: 0, width: 3840, height: 110, backgroundColor: '#000'}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, width: 3840, height: 110, backgroundColor: '#000'}} />
      <div
        style={{
          position: 'absolute',
          top: 42,
          left: 0,
          width: 3840,
          textAlign: 'center',
          fontFamily: MONO,
          fontSize: 30,
          letterSpacing: 10,
          color: 'rgba(255,255,255,0.55)',
          opacity: kickerOp,
        }}
      >
        THE RELAPSE PREVENTION
      </div>

      <Grain frame={frame} />
    </AbsoluteFill>
  );
};

export default TheRelapsePrevention;
