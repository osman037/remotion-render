import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const EightNightsOneByOne: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const twoPi = Math.PI * 2;
  const centerX = width * 0.68;
  const baseY = height * 0.76;
  const gradientAngle = progress * 360;
  const globalPulse = Math.sin(progress * twoPi);

  const candles = [
    { frac: -0.2, h: 0.2, shamash: false },
    { frac: -0.15, h: 0.23, shamash: false },
    { frac: -0.1, h: 0.26, shamash: false },
    { frac: -0.05, h: 0.28, shamash: false },
    { frac: 0, h: 0.34, shamash: true },
    { frac: 0.05, h: 0.28, shamash: false },
    { frac: 0.1, h: 0.26, shamash: false },
    { frac: 0.15, h: 0.23, shamash: false },
    { frac: 0.2, h: 0.2, shamash: false },
  ];

  const lightFrameFor = (i: number): number => {
    if (candles[i].shamash) {
      return 0;
    }
    const order = i < 4 ? i : i - 1;
    return 60 + order * 96;
  };

  const litFor = (i: number): number => {
    const lightFrame = lightFrameFor(i);
    return interpolate(frame, [lightFrame, lightFrame + 18], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  let litCount = 0;
  for (let i = 0; i < candles.length; i++) {
    litCount += litFor(i);
  }

  const embers = Array.from({ length: 24 }, (_, i) => {
    const candleIndex = Math.floor(seededRandom(i * 5 + 2) * 9);
    const lightFrame = lightFrameFor(candleIndex);
    const offset = seededRandom(i * 11 + 3);
    const cycle = ((frame - lightFrame) * 0.004 + offset) % 1;
    const cx = centerX + candles[candleIndex].frac * width;
    const candleTop = baseY - candles[candleIndex].h * height;
    const ex = cx + (seededRandom(i * 13 + 4) - 0.5) * 70 + Math.sin(frame * 0.05 + i) * 18;
    const ey = candleTop - 130 - cycle * height * 0.22;
    const size = 3 + seededRandom(i * 17 + 6) * 6;
    const o = litFor(candleIndex) * Math.max(0, 1 - cycle) * 0.6;
    return { x: ex, y: ey, size, o };
  });

  const grain = Array.from({ length: 60 }, (_, i) => {
    const gx = (0.38 + seededRandom(i * 37 + 11) * 0.6) * width;
    const gy = seededRandom(i * 41 + 13) * height;
    const size = 2 + seededRandom(i * 43 + 17) * 5;
    const o = 0.04 + Math.abs(Math.sin(frame * 0.08 + i * 2.3)) * 0.08;
    const gold = seededRandom(i * 47 + 19) > 0.5;
    return { x: gx, y: gy, size, o, gold };
  });

  const fadeIn = 1 - interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOpacity = Math.max(fadeIn, fadeOut);

  const tableShimmer = 0.1 + Math.abs(Math.sin(progress * twoPi * 2)) * 0.08;

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", background: `linear-gradient(${gradientAngle}deg, #04061f, #0a1a4e, #123a8f, #0a1a4e, #04061f)` }}>
      <div style={{ position: "absolute", left: centerX - width * 0.32 + Math.sin(progress * twoPi) * 60, top: height * 0.3 + Math.cos(progress * twoPi) * 40, width: width * 0.55, height: height * 0.55, borderRadius: "50%", background: `radial-gradient(circle, rgba(255, 190, 60, ${0.1 + litCount * 0.035}), transparent 65%)` }} />
      <div style={{ position: "absolute", left: 0, top: baseY + height * 0.12, width, height: height * 0.14, background: "linear-gradient(180deg, #2a1a08, #17100a)" }} />
      <div style={{ position: "absolute", left: centerX - width * 0.28, top: baseY + height * 0.12, width: width * 0.56, height: height * 0.02, background: `linear-gradient(90deg, transparent, rgba(255, 190, 60, ${tableShimmer + litCount * 0.03}), transparent)` }} />
      <div style={{ position: "absolute", left: centerX - width * 0.16, top: baseY + height * 0.02, width: width * 0.32, height: height * 0.12, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(255, 170, 40, ${0.1 + litCount * 0.03}), transparent 70%)` }} />
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {grain.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={dot.size} fill={dot.gold ? "#ffd166" : "#aaccff"} fillOpacity={dot.o} />
        ))}
      </svg>
      <svg style={{ position: "absolute", left: 0, top: 0, width, height }} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={`M ${centerX - width * 0.2} ${baseY} Q ${centerX} ${baseY + height * 0.16} ${centerX + width * 0.2} ${baseY}`} stroke="#e8b64c" strokeWidth={30} fill="none" strokeLinecap="round" />
        <path d={`M ${centerX} ${baseY + height * 0.02} L ${centerX} ${baseY + height * 0.1}`} stroke="#e8b64c" strokeWidth={30} strokeLinecap="round" />
        <rect x={centerX - width * 0.11} y={baseY + height * 0.1} width={width * 0.22} height={height * 0.025} rx={height * 0.012} fill="#d4a017" />
      </svg>
      {candles.map((candle, i) => {
        const cx = centerX + candle.frac * width;
        const candleHeight = candle.h * height;
        const candleTop = baseY - candleHeight;
        const lit = litFor(i);
        const flicker = Math.sin(frame * 0.35 + i * 1.7);
        const flameScale = lit * (1 + flicker * 0.08);
        const flameOpacity = lit * (0.82 + flicker * 0.12);
        const glow = 30 + flicker * 12;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: cx - width * 0.012, top: candleTop, width: width * 0.024, height: candleHeight, background: candle.shamash ? "linear-gradient(180deg, #fff7d6, #f5d76e)" : "linear-gradient(180deg, #ffffff, #dbeafe)", borderRadius: width * 0.012 }} />
            <div style={{ position: "absolute", left: cx - 2, top: candleTop - 26, width: 4, height: 26, backgroundColor: "#3a2a12" }} />
            <div style={{ position: "absolute", left: cx - 38 * flameScale, top: candleTop - 158 * flameScale, width: 76 * flameScale, height: 138 * flameScale, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", background: "radial-gradient(circle at 50% 72%, #fffbe6 0%, #ffd166 38%, #ff9d00 68%, #ff5e00 100%)", opacity: flameOpacity, filter: `drop-shadow(0 0 ${glow}px #ffb703)`, transform: `rotate(${flicker * 4}deg)` }} />
            <div style={{ position: "absolute", left: cx - 15, top: candleTop - 100, width: 30, height: 62, borderRadius: "50%", backgroundColor: "#fffbe6", opacity: flameOpacity * 0.85 }} />
          </div>
        );
      })}
      {embers.map((ember, i) => (
        <div key={i} style={{ position: "absolute", left: ember.x, top: ember.y, width: ember.size, height: ember.size, borderRadius: "50%", backgroundColor: "#ffca3a", opacity: ember.o, filter: "drop-shadow(0 0 10px #ffb703)" }} />
      ))}
      <div style={{ position: "absolute", left: 0, top: 0, width, height, backgroundColor: "#000000", opacity: fadeOpacity }} />
      <div style={{ position: "absolute", left: 0, top: 0, width, height, background: `radial-gradient(circle at 68% 62%, rgba(255, 190, 60, ${0.08 + litCount * 0.02 + globalPulse * 0.02}), transparent 60%)` }} />
    </div>
  );
};
