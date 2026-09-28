/**
 * NeonHustle.tsx
 * "Neon Hustle" — hustle culture / entrepreneur kinetic typography.
 * 4K landscape (3840x2160), 60fps, 15s (900 frames).
 *
 * Neon Noir: deep charcoal with a lime accent, clean modern sans.
 * Word carousel: key words slam through the center on a 60-frame beat,
 * with a beat pulse, progress dots, and a lime payoff line.
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

const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "'SF Mono','JetBrains Mono',Menlo,Consolas,monospace";
const BG = '#0C0A09';
const LIME = '#D4F268';
const BONE = '#EDEDE8';

const WORDS = [
  'FOCUS.',
  'EXECUTE.',
  'SACRIFICE.',
  'COMPOUND.',
  'OBSESS.',
  'OUTWORK.',
  'DELIVER.',
  'REPEAT.',
  'SCALE.',
  'ENDURE.',
  'ADAPT.',
  'WIN.',
];
const SLOT = 60; // one word per second — the beat
const START = 30;
const CAROUSEL_END = START + WORDS.length * SLOT; // 750

// ---------------------------------------------------------------------------
// Drifting diagonal texture (two layers, different angles/speeds)
// ---------------------------------------------------------------------------
const DriftLines: React.FC<{frame: number}> = ({frame}) => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: -400,
        background:
          'repeating-linear-gradient(115deg, rgba(212,242,104,0.085) 0 2px, rgba(212,242,104,0) 2px 110px)',
        backgroundPosition: `${frame * 2.2}px 0px`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: -400,
        background:
          'repeating-linear-gradient(65deg, rgba(237,237,232,0.04) 0 2px, rgba(237,237,232,0) 2px 150px)',
        backgroundPosition: `${-frame * 1.4}px 0px`,
      }}
    />
  </>
);

// ---------------------------------------------------------------------------
// Film grain (deterministic SVG) — densified for the bitrate gate.
// ---------------------------------------------------------------------------
const Grain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 900; i++) {
    const s = 2 + random(`gx-${frame}-${i}`) * 2.5;
    dots.push(
      <rect
        key={i}
        x={random(`gx-${frame}-${i}`) * 3840}
        y={random(`gy-${frame}-${i}`) * 2160}
        width={s}
        height={s}
        fill="#FFFFFF"
        opacity={0.02 + random(`go-${frame}-${i}`) * 0.05}
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
export const NeonHustle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const inCarousel = frame >= START && frame < CAROUSEL_END;
  const idx = Math.max(0, Math.min(WORDS.length - 1, Math.floor((frame - START) / SLOT)));
  const local = frame - (START + idx * SLOT); // 0..59 within the slot

  // Word entrance: spring slam from below.
  const s = spring({frame: local, fps, config: {damping: 14, stiffness: 200}});
  const k = Math.min(1, Math.max(0, s));
  const wordOp =
    Math.min(1, s * 1.5) *
    interpolate(local, [50, 59], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const accent = idx % 4 === 3; // every 4th word goes lime
  const wordColor = accent ? LIME : BONE;
  const wordGlow = accent
    ? '0 0 150px rgba(212,242,104,0.5), 0 8px 50px rgba(0,0,0,0.8)'
    : '0 8px 50px rgba(0,0,0,0.8)';

  // Beat pulse: background breathes on every word change.
  const beat = 1 + 0.01 * Math.max(0, 1 - local / 16);
  const glowOp = 0.5 + 0.5 * Math.max(0, 1 - local / 20);

  const kickerOp =
    interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
    interpolate(frame, [CAROUSEL_END, CAROUSEL_END + 30], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  // Resolve: payoff lines.
  const resOp = interpolate(frame, [782, 812], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rs1 = spring({frame: frame - 786, fps, config: {damping: 14, stiffness: 170}});
  const rs2 = spring({frame: frame - 806, fps, config: {damping: 14, stiffness: 170}});

  return (
    <AbsoluteFill style={{backgroundColor: BG}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${beat})`}}>
        <DriftLines frame={frame} />
      </div>

      {/* lime aura pulsing with the beat (breathes on its own during resolve) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: inCarousel ? 0.35 * glowOp : 0.4 + 0.15 * Math.sin(frame * 0.06),
          background:
            'radial-gradient(ellipse 55% 45% at 50% 52%, rgba(212,242,104,0.14), rgba(212,242,104,0) 70%)',
        }}
      />

      {/* kicker */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 0,
          width: 3840,
          textAlign: 'center',
          fontFamily: MONO,
          fontSize: 42,
          letterSpacing: 18,
          color: 'rgba(237,237,232,0.55)',
          opacity: kickerOp,
        }}
      >
        THE HUSTLE CODE
      </div>

      {/* word carousel */}
      {inCarousel && wordOp > 0.001 && (
        <div
          style={{
            position: 'absolute',
            top: 830,
            left: 0,
            width: 3840,
            textAlign: 'center',
            opacity: wordOp,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 380,
              color: wordColor,
              letterSpacing: '-0.02em',
              textShadow: wordGlow,
              transform: `translateY(${(1 - k) * 160}px) scale(${1.5 - 0.5 * k})`,
            }}
          >
            {WORDS[idx]}
          </div>
        </div>
      )}

      {/* progress dots */}
      {inCarousel && (
        <div
          style={{
            position: 'absolute',
            bottom: 210,
            left: 0,
            width: 3840,
            display: 'flex',
            justifyContent: 'center',
            gap: 34,
          }}
        >
          {WORDS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                backgroundColor: i === idx ? LIME : i < idx ? 'rgba(237,237,232,0.7)' : 'rgba(237,237,232,0.18)',
                boxShadow: i === idx ? '0 0 30px rgba(212,242,104,0.8)' : 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* resolve */}
      {resOp > 0.001 && (
        <div
          style={{
            position: 'absolute',
            top: 800,
            left: 0,
            width: 3840,
            textAlign: 'center',
            opacity: resOp,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 300,
              color: BONE,
              letterSpacing: '-0.02em',
              textShadow: '0 8px 50px rgba(0,0,0,0.8)',
              opacity: Math.min(1, rs1 * 1.4),
              transform: `translateY(${(1 - Math.min(1, Math.max(0, rs1))) * 120}px)`,
            }}
          >
            DISCIPLINE
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 300,
              color: LIME,
              letterSpacing: '-0.02em',
              textShadow: '0 0 160px rgba(212,242,104,0.55)',
              opacity: Math.min(1, rs2 * 1.4),
              transform: `translateY(${(1 - Math.min(1, Math.max(0, rs2))) * 120}px)`,
            }}
          >
            COMPOUNDS.
          </div>
          <div
            style={{
              marginTop: 50,
              fontFamily: MONO,
              fontSize: 38,
              letterSpacing: 14,
              color: 'rgba(237,237,232,0.6)',
            }}
          >
            THE HUSTLE CODE
          </div>
        </div>
      )}

      {/* vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 78% 68% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.72) 100%)',
        }}
      />
      <Grain frame={frame} />
    </AbsoluteFill>
  );
};

export default NeonHustle;
