/**
 * SigmaRules.tsx
 * "Sigma Rules" — lone wolf / villain era dark motivation.
 * 4K landscape (3840x2160), 60fps, 15s (900 frames).
 *
 * Stark high-contrast minimalism: pure black, bone white, blood red.
 * "Perfectly imperfect" kinetic type: spring entrances with a slight
 * per-character rotation + opacity jitter, seeded and deterministic.
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

const SERIF = "Georgia,'Times New Roman',serif";
const MONO = "'SF Mono','JetBrains Mono',Menlo,Consolas,monospace";
const BONE = '#E7E5E4';
const RED = '#B22222';

// ---------------------------------------------------------------------------
// Per-character "perfectly imperfect" text: spring entrance, each character
// keeps a slight rotation and opacity variance so it never looks sterile.
// ---------------------------------------------------------------------------
const JitterText: React.FC<{
  text: string;
  frame: number;
  fps: number;
  delay: number;
  size: number;
  color: string;
  seed: string;
}> = ({text, frame, fps, delay, size, color, seed}) => {
  return (
    <span style={{display: 'inline-block', whiteSpace: 'nowrap'}}>
      {text.split('').map((ch, i) => {
        if (ch === ' ') {
          return <span key={i} style={{display: 'inline-block', width: size * 0.3}} />;
        }
        const s = spring({
          frame: frame - (delay + i * 2.2),
          fps,
          config: {damping: 13, stiffness: 170},
        });
        if (s <= 0.001) {
          return (
            <span key={i} style={{display: 'inline-block', opacity: 0}}>
              {ch}
            </span>
          );
        }
        const k = Math.min(1, s);
        const rot = (random(`${seed}-r-${i}`) - 0.5) * 9; // ±4.5°
        const restOp = 0.94 + random(`${seed}-o-${i}`) * 0.06;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: size,
              color,
              letterSpacing: '0.01em',
              opacity: Math.min(1, s * 1.5) * restOp,
              transform: `translateY(${(1 - k) * 90}px) rotate(${(1 - k) * rot * 2 + rot * 0.35}deg)`,
              textShadow: '0 4px 60px rgba(0,0,0,0.9)',
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

// ---------------------------------------------------------------------------
// One rule block: red kicker + giant jittered serif phrase.
// ---------------------------------------------------------------------------
const RuleBlock: React.FC<{
  n: string;
  text: string;
  frame: number;
  fps: number;
  start: number;
  end: number;
  color: string;
  seed: string;
}> = ({n, text, frame, fps, start, end, color, seed}) => {
  const op =
    interpolate(frame, [start, start + 30], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) *
    interpolate(frame, [end - 30, end], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  if (op <= 0.001) return null;
  const bar = spring({frame: frame - start, fps, config: {damping: 16, stiffness: 140}});
  return (
    <div
      style={{
        position: 'absolute',
        top: 860,
        left: 0,
        width: 3840,
        textAlign: 'center',
        opacity: op,
      }}
    >
      <div
        style={{
          width: 150,
          height: 12,
          backgroundColor: RED,
          margin: '0 auto 46px auto',
          transform: `scaleX(${Math.max(0.001, Math.min(1, bar))})`,
        }}
      />
      <div
        style={{
          fontFamily: MONO,
          fontSize: 46,
          letterSpacing: 18,
          color: RED,
          marginBottom: 34,
        }}
      >
        RULE {n}
      </div>
      <JitterText text={text} frame={frame} fps={fps} delay={start + 40} size={196} color={color} seed={seed} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Film grain (deterministic SVG)
// ---------------------------------------------------------------------------
const Grain: React.FC<{frame: number}> = ({frame}) => {
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < 400; i++) {
    const s = 2 + random(`gx-${frame}-${i}`) * 2.5;
    dots.push(
      <rect
        key={i}
        x={random(`gx-${frame}-${i}`) * 3840}
        y={random(`gy-${frame}-${i}`) * 2160}
        width={s}
        height={s}
        fill="#FFFFFF"
        opacity={0.015 + random(`go-${frame}-${i}`) * 0.035}
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
export const SigmaRules: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const kickerOp =
    interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
    interpolate(frame, [850, 880], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: '#000000'}}>
      {/* kicker */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 0,
          width: 3840,
          textAlign: 'center',
          fontFamily: MONO,
          fontSize: 40,
          letterSpacing: 16,
          color: 'rgba(231,229,228,0.55)',
          opacity: kickerOp,
        }}
      >
        THE LONE WOLF CODE
      </div>

      <RuleBlock n="01" text="MOVE IN SILENCE." frame={frame} fps={fps} start={60} end={350} color={BONE} seed="r1" />
      <RuleBlock n="02" text="LET RESULTS MAKE THE NOISE." frame={frame} fps={fps} start={360} end={650} color={BONE} seed="r2" />
      <RuleBlock n="03" text="NEVER EXPLAIN YOURSELF." frame={frame} fps={fps} start={660} end={899} color={RED} seed="r3" />

      {/* vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.7) 100%)',
        }}
      />
      <Grain frame={frame} />
    </AbsoluteFill>
  );
};

export default SigmaRules;
